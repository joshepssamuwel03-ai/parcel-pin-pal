import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Users, Package, MapPin, Star, CalendarDays } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { useCustomers } from "@/lib/use-customers";
import { deliveredToday, type Customer } from "@/lib/store";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Parcel Tracker" },
      { name: "description", content: "Delivery statistics and insights for riders." },
    ],
  }),
  component: Dashboard,
});

function useCount(target: number) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const dur = 700;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      setN(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return n;
}

function Dashboard() {
  const customers = useCustomers();

  const stats = useMemo(() => {
    const totalDeliveries = customers.reduce((s, c) => s + c.deliveries.length, 0);
    const today = customers.reduce(
      (s, c) => s + c.deliveries.filter((d) => new Date(d.date).toDateString() === new Date().toDateString()).length,
      0,
    );
    const month = customers.reduce(
      (s, c) =>
        s +
        c.deliveries.filter((d) => {
          const dt = new Date(d.date);
          const now = new Date();
          return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
        }).length,
      0,
    );
    const frequent = customers.filter((c) => c.deliveries.length >= 3).length;
    return {
      totalCustomers: customers.length,
      totalDeliveries,
      today,
      month,
      frequent,
    };
  }, [customers]);

  return (
    <PageShell title="Dashboard" subtitle="Your delivery performance">
      <div className="grid grid-cols-2 gap-3">
        <StatCard icon={<Users />} label="Total Customers" value={stats.totalCustomers} grad="gradient-brand" />
        <StatCard icon={<Package />} label="Total Deliveries" value={stats.totalDeliveries} grad="gradient-accent" />
        <StatCard icon={<MapPin />} label="Today's Deliveries" value={stats.today} grad="gradient-blue" />
        <StatCard icon={<Star />} label="Frequent Customers" value={stats.frequent} grad="gradient-brand" />
      </div>

      <div className="mt-3 gradient-blue flex items-center gap-4 rounded-2xl p-5 text-primary-foreground shadow-soft">
        <CalendarDays className="size-8 shrink-0" />
        <div>
          <AnimatedNumber value={stats.month} className="text-3xl font-extrabold" />
          <p className="text-sm text-primary-foreground/85">Deliveries this month</p>
        </div>
      </div>

      <h2 className="mb-2 mt-6 text-sm font-bold text-muted-foreground">Top customers</h2>
      <TopCustomers customers={customers} />
    </PageShell>
  );
}

function StatCard({
  icon,
  label,
  value,
  grad,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  grad: string;
}) {
  return (
    <div className={`${grad} rounded-2xl p-4 text-primary-foreground shadow-soft`}>
      <span className="grid size-9 place-items-center rounded-full bg-white/20">{icon}</span>
      <AnimatedNumber value={value} className="mt-3 block text-3xl font-extrabold" />
      <p className="text-xs text-primary-foreground/85">{label}</p>
    </div>
  );
}

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const n = useCount(value);
  return <span className={className}>{n}</span>;
}

function TopCustomers({ customers }: { customers: Customer[] }) {
  const top = [...customers].sort((a, b) => b.deliveries.length - a.deliveries.length).slice(0, 5);
  if (top.length === 0)
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  return (
    <div className="space-y-2">
      {top.map((c, i) => (
        <div key={c.id} className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-soft">
          <span className="grid size-8 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {i + 1}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{c.name}</p>
            <p className="text-xs text-muted-foreground">
              {c.deliveries.length} deliveries {deliveredToday(c) ? "· today" : ""}
            </p>
          </div>
          {c.favorite && <Star className="size-4 fill-destructive text-destructive" />}
        </div>
      ))}
    </div>
  );
}
