import { deliveredToday, type Customer } from "@/lib/store";

export function StatusBadge({ customer }: { customer: Customer }) {
  let label = "Saved";
  let cls = "bg-primary/10 text-primary";
  if (customer.favorite) {
    label = "Favorite";
    cls = "bg-destructive/10 text-destructive";
  } else if (deliveredToday(customer)) {
    label = "Delivered today";
    cls = "bg-success/15 text-success";
  } else if (customer.deliveries.length >= 3) {
    label = "Frequent";
    cls = "bg-accent/15 text-accent";
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${cls}`}>{label}</span>
  );
}
