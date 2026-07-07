import { Phone, Navigation, Pencil, Star } from "lucide-react";
import { customerStore, type Customer } from "@/lib/store";
import { relativeDate } from "@/lib/geo";
import { StatusBadge } from "./StatusBadge";

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function CustomerCard({
  customer,
  onNavigate,
  onEdit,
}: {
  customer: Customer;
  onNavigate?: (c: Customer) => void;
  onEdit?: (c: Customer) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-card shadow-soft transition-transform active:scale-[0.99]">
      <div className="gradient-brand flex items-center gap-3 px-4 py-3 text-primary-foreground">
        <div className="grid size-11 shrink-0 place-items-center rounded-full bg-white/20 text-base font-bold backdrop-blur">
          {initials(customer.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-bold leading-tight">{customer.name}</p>
          <p className="truncate text-xs text-primary-foreground/80">{customer.phone}</p>
        </div>
        <button
          onClick={() => customerStore.toggleFavorite(customer.id)}
          className="grid size-9 place-items-center rounded-full bg-white/15 transition-transform active:scale-90"
          aria-label="Favorite"
        >
          <Star className={`size-4 ${customer.favorite ? "fill-white" : ""}`} />
        </button>
      </div>
      <div className="space-y-2 p-4">
        <p className="line-clamp-2 text-sm text-muted-foreground">{customer.address}</p>
        <div className="flex items-center justify-between">
          <StatusBadge customer={customer} />
          <span className="text-xs text-muted-foreground">
            {customer.deliveries.length} deliveries · {relativeDate(customer.deliveries[0]?.date ?? customer.createdAt)}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={() => onNavigate?.(customer)}
            className="gradient-brand flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold text-primary-foreground shadow-soft transition-transform active:scale-95"
          >
            <Navigation className="size-4" /> Navigate
          </button>
          <a
            href={`tel:${customer.phone}`}
            className="flex items-center justify-center gap-1 rounded-xl bg-secondary/15 py-2 text-xs font-semibold text-secondary transition-transform active:scale-95"
          >
            <Phone className="size-4" /> Call
          </a>
          <button
            onClick={() => onEdit?.(customer)}
            className="flex items-center justify-center gap-1 rounded-xl bg-muted py-2 text-xs font-semibold text-foreground transition-transform active:scale-95"
          >
            <Pencil className="size-4" /> Edit
          </button>
        </div>
      </div>
    </div>
  );
}
