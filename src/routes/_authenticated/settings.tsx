import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Moon, Sun, Info, Shield, Trash2, MapPin, Heart } from "lucide-react";
import { toast } from "sonner";
import { PageShell } from "@/components/PageShell";
import { CREDIT, customerStore, getStoredTheme, setStoredTheme } from "@/lib/store";
import { useCustomers } from "@/lib/use-customers";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — Parcel Tracker" },
      { name: "description", content: "App settings, appearance and about." },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [dark, setDark] = useState(false);
  const customers = useCustomers();

  useEffect(() => {
    setDark(getStoredTheme() === "dark");
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    setStoredTheme(next ? "dark" : "light");
  };

  const clearAll = () => {
    if (!confirm("Delete all saved customers? This cannot be undone.")) return;
    customers.forEach((c) => customerStore.remove(c.id));
    toast.success("All customers cleared");
  };

  return (
    <PageShell title="Settings" subtitle="Preferences & about">
      <section className="rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">Appearance</h2>
        <button
          onClick={toggleDark}
          className="flex w-full items-center justify-between rounded-xl bg-muted px-4 py-3"
        >
          <span className="flex items-center gap-3 font-medium">
            {dark ? <Moon className="size-5" /> : <Sun className="size-5" />}
            Dark mode
          </span>
          <span
            className={`relative h-6 w-11 rounded-full transition-colors ${dark ? "bg-primary" : "bg-border"}`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
                dark ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </span>
        </button>
      </section>

      <section className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">Data</h2>
        <Row icon={<MapPin className="size-5 text-primary" />} label={`${customers.length} customers saved`} />
        <button
          onClick={clearAll}
          className="mt-2 flex w-full items-center gap-3 rounded-xl bg-destructive/10 px-4 py-3 font-medium text-destructive"
        >
          <Trash2 className="size-5" /> Clear all customer data
        </button>
      </section>

      <section className="mt-4 rounded-2xl bg-card p-4 shadow-soft">
        <h2 className="mb-2 text-sm font-bold text-muted-foreground">About</h2>
        <Row icon={<Info className="size-5 text-primary" />} label="Parcel Customer Location Tracker" sub="Version 1.0.0" />
        <Row icon={<Shield className="size-5 text-secondary" />} label="Offline-first" sub="Your data stays on this device" />
      </section>

      <div className="mt-6 flex flex-col items-center gap-2 rounded-2xl gradient-brand p-5 text-center text-primary-foreground shadow-float">
        <Heart className="size-5 fill-current" />
        <p className="text-sm font-semibold">{CREDIT}</p>
      </div>
    </PageShell>
  );
}

function Row({ icon, label, sub }: { icon: React.ReactNode; label: string; sub?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-1 py-2">
      {icon}
      <div>
        <p className="font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
    </div>
  );
}
