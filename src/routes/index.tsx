import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { Search, Bell, Crosshair, Layers, Plus, X, MapPin } from "lucide-react";
import { MapView, type MapControl } from "@/components/MapView";
import { AddCustomerSheet } from "@/components/AddCustomerSheet";
import { CustomerDetailSheet } from "@/components/CustomerDetailSheet";
import { BottomNav } from "@/components/BottomNav";
import { useGps } from "@/lib/use-gps";
import { useCustomers, useHydrated } from "@/lib/use-customers";
import { markerColor } from "@/lib/markers";
import type { Customer } from "@/lib/store";

export const Route = createFileRoute("/")({
  component: Home,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}

function Home() {
  const hydrated = useHydrated();
  const gps = useGps(hydrated);
  const customers = useCustomers();
  const ctrl = useRef<MapControl | null>(null);

  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [satellite, setSatellite] = useState(false);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.address.toLowerCase().includes(q),
      )
      .slice(0, 6);
  }, [query, customers]);

  const openCustomer = (c: Customer) => {
    setSelected(c);
    setDetailOpen(true);
    setQuery("");
    ctrl.current?.flyTo([c.lat, c.lng], 17);
  };

  const status =
    gps.status === "ready"
      ? { label: "GPS Ready", dot: "bg-success" }
      : gps.status === "searching"
        ? { label: "Searching GPS…", dot: "bg-warning" }
        : { label: "GPS Disabled", dot: "bg-destructive" };

  return (
    <div className="fixed inset-0 overflow-hidden bg-muted">
      {hydrated && (
        <MapView
          position={gps.position}
          accuracy={gps.accuracy}
          customers={customers}
          selectedId={selected?.id}
          onSelectCustomer={openCustomer}
          controlRef={ctrl}
        />
      )}

      {/* Top overlay */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-[500] space-y-3 p-4 pt-[max(1rem,env(safe-area-inset-top))]">
        <div className="pointer-events-auto flex items-center justify-between">
          <div className="rounded-2xl bg-card/85 px-3 py-1.5 shadow-soft backdrop-blur">
            <p className="text-sm font-bold leading-tight">{greeting()}, Rider 👋</p>
            <p className="text-[11px] text-muted-foreground">
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="relative grid size-11 place-items-center rounded-full bg-card/85 shadow-soft backdrop-blur transition-transform active:scale-90">
              <Bell className="size-5" />
              <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-accent" />
            </button>
            <div className="grid size-11 place-items-center rounded-full gradient-brand text-sm font-bold text-primary-foreground shadow-soft">
              R
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="pointer-events-auto">
          <div className="flex items-center gap-2 rounded-2xl bg-card/95 px-4 py-3 shadow-float backdrop-blur">
            <Search className="size-5 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search customer, phone or address…"
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            {query && (
              <button onClick={() => setQuery("")} className="text-muted-foreground">
                <X className="size-4" />
              </button>
            )}
          </div>
          {results.length > 0 && (
            <div className="mt-2 space-y-1 rounded-2xl bg-card/95 p-2 shadow-float backdrop-blur">
              {results.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openCustomer(c)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-muted"
                >
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-full text-primary-foreground"
                    style={{ backgroundColor: markerColor(c) }}
                  >
                    <MapPin className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {c.phone} · {c.address}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* GPS status chip */}
      <div className="absolute left-4 top-[10.5rem] z-[500] mt-[env(safe-area-inset-top)] flex items-center gap-1.5 rounded-full bg-card/85 px-3 py-1.5 text-[11px] font-semibold shadow-soft backdrop-blur">
        <span className={`size-2 rounded-full ${status.dot}`} />
        {status.label}
        {gps.accuracy ? <span className="text-muted-foreground">±{Math.round(gps.accuracy)}m</span> : null}
      </div>

      {/* Right controls */}
      <div className="absolute bottom-40 right-4 z-[500] flex flex-col gap-2">
        <button
          onClick={() => {
            const next = !satellite;
            setSatellite(next);
            ctrl.current?.setLayer(next ? "satellite" : "street");
          }}
          className={`grid size-12 place-items-center rounded-full shadow-float backdrop-blur transition-transform active:scale-90 ${
            satellite ? "gradient-brand text-primary-foreground" : "bg-card/90"
          }`}
          aria-label="Toggle satellite"
        >
          <Layers className="size-5" />
        </button>
        <button
          onClick={() => {
            gps.refresh();
            if (gps.position) ctrl.current?.flyTo(gps.position, 16);
          }}
          className="grid size-12 place-items-center rounded-full bg-card/90 shadow-float backdrop-blur transition-transform active:scale-90"
          aria-label="Current location"
        >
          <Crosshair className="size-5 text-primary" />
        </button>
      </div>

      {/* FAB */}
      <button
        onClick={() => setAddOpen(true)}
        className="gradient-brand absolute bottom-24 right-4 z-[500] flex items-center gap-2 rounded-full px-5 py-4 font-bold text-primary-foreground shadow-float transition-transform active:scale-95"
      >
        <Plus className="size-5" strokeWidth={2.5} />
        Add Customer
      </button>

      <BottomNav />

      <AddCustomerSheet
        open={addOpen}
        onClose={() => setAddOpen(false)}
        position={gps.position}
        accuracy={gps.accuracy}
        onSaved={(lat, lng) => ctrl.current?.flyTo([lat, lng], 17)}
      />
      <CustomerDetailSheet
        customer={selected}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        riderPos={gps.position}
      />
    </div>
  );
}
