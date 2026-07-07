import { statusOf, type Customer } from "@/lib/store";
import { deliveredToday } from "@/lib/store";

export const STATUS_COLOR: Record<string, string> = {
  today: "#10B981",
  saved: "#2563EB",
  frequent: "#F97316",
  favorite: "#EF4444",
  vip: "#F59E0B",
};

export function markerColor(c: Customer): string {
  if (c.favorite) return STATUS_COLOR.favorite;
  if (deliveredToday(c)) return STATUS_COLOR.today;
  if (c.deliveries.length >= 3) return STATUS_COLOR.frequent;
  return STATUS_COLOR.saved;
}

export function markerSvg(color: string, selected = false): string {
  const glow = selected
    ? `<circle cx="18" cy="16" r="16" fill="${color}" opacity="0.25"/>`
    : "";
  return `
  <div style="position:relative;transform:translate(-50%,-100%);${selected ? "animation:marker-bounce 0.6s ease-in-out infinite;" : ""}">
    <svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
      ${glow}
      <path d="M18 2C10 2 3.5 8.3 3.5 16.1 3.5 26 18 44 18 44s14.5-18 14.5-27.9C32.5 8.3 26 2 18 2z" fill="${color}" stroke="white" stroke-width="2.5"/>
      <circle cx="18" cy="16" r="5.5" fill="white"/>
    </svg>
  </div>`;
}

export { statusOf };
