import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { Package, MapPin } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useCustomers } from "@/lib/use-customers";
import { relativeDate } from "@/lib/geo";

export const Route = createFileRoute("/_authenticated/deliveries")({
  head: () => ({
    meta: [
      { title: "Deliveries — Parcel Tracker" },
      { name: "description", content: "Your recent parcel delivery history." },
    ],
  }),
  component: Deliveries,
});

function Deliveries() {
  const customers = useCustomers();

  const feed = useMemo(() => {
    const items = customers.flatMap((c) =>
      c.deliveries.map((d) => ({ ...d, customer: c })),
    );
    return items.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 100);
  }, [customers]);

  return (
    <PageShell title="Deliveries" subtitle={`${feed.length} total deliveries`}>
      {feed.length === 0 ? (
        <div className="rounded-3xl bg-card px-6 py-14 text-center shadow-soft">
          <Package className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No deliveries logged yet.</p>
        </div>
      ) : (
        <div className="relative space-y-3 pl-5">
          <div className="absolute bottom-2 left-[9px] top-2 w-0.5 bg-border" />
          {feed.map((d) => (
            <div key={d.id} className="relative">
              <span className="absolute -left-5 top-4 size-2.5 rounded-full gradient-brand ring-4 ring-background" />
              <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <MapPin className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.customer.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{d.customer.address}</p>
                </div>
                <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-medium">
                  {relativeDate(d.date)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}
