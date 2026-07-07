import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { CustomerCard } from "@/components/CustomerCard";
import { CustomerDetailSheet } from "@/components/CustomerDetailSheet";
import { useCustomers } from "@/lib/use-customers";
import type { Customer } from "@/lib/store";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers — Parcel Tracker" },
      { name: "description", content: "Browse and manage all your saved delivery customers." },
    ],
  }),
  component: Customers,
});

function Customers() {
  const customers = useCustomers();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q),
    );
  }, [query, customers]);

  return (
    <PageShell title="Customers" subtitle={`${customers.length} saved locations`}>
      <div className="mb-4 flex items-center gap-2 rounded-2xl bg-card px-4 py-3 shadow-soft">
        <Search className="size-5 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search customers…"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <CustomerCard
              key={c.id}
              customer={c}
              onNavigate={(cu) => {
                setSelected(cu);
                setOpen(true);
              }}
              onEdit={(cu) => {
                setSelected(cu);
                setOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <CustomerDetailSheet
        customer={selected}
        open={open}
        onClose={() => setOpen(false)}
        riderPos={null}
      />
    </PageShell>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-3xl bg-card px-6 py-14 text-center shadow-soft">
      <div className="grid size-20 place-items-center rounded-full gradient-brand text-primary-foreground">
        <Users className="size-9" />
      </div>
      <h3 className="text-lg font-bold">No customers yet</h3>
      <p className="max-w-xs text-sm text-muted-foreground">
        Save your first customer from the map after a successful delivery.
      </p>
    </div>
  );
}
