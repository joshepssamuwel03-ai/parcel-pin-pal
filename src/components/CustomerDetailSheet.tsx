import { useState } from "react";
import {
  Navigation,
  Phone,
  Pencil,
  Star,
  Trash2,
  History,
  MapPin,
  ExternalLink,
  Clock,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { BottomSheet } from "./BottomSheet";
import { StatusBadge } from "./StatusBadge";
import { customerStore, type Customer } from "@/lib/store";
import { haversineKm, formatDistance, estTime, relativeDate } from "@/lib/geo";

export function CustomerDetailSheet({
  customer,
  open,
  onClose,
  riderPos,
}: {
  customer: Customer | null;
  open: boolean;
  onClose: () => void;
  riderPos: [number, number] | null;
}) {
  const [tab, setTab] = useState<"info" | "route" | "history" | "edit">("info");
  const [edit, setEdit] = useState<Partial<Customer>>({});

  if (!customer) return <BottomSheet open={open} onClose={onClose} />;

  const km = riderPos ? haversineKm(riderPos, [customer.lat, customer.lng]) : null;
  const gmaps = `https://www.google.com/maps/dir/?api=1&destination=${customer.lat},${customer.lng}`;

  const startEdit = () => {
    setEdit({
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      landmark: customer.landmark,
      notes: customer.notes,
    });
    setTab("edit");
  };

  const saveEdit = () => {
    customerStore.update(customer.id, edit);
    toast.success("Customer updated");
    setTab("info");
  };

  const del = () => {
    customerStore.remove(customer.id);
    toast.success("Customer deleted");
    onClose();
  };

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <BottomSheet open={open} onClose={onClose} title={customer.name}>
      <div className="mb-3 flex items-center gap-2">
        <StatusBadge customer={customer} />
        {km != null && (
          <span className="text-xs font-medium text-muted-foreground">
            {formatDistance(km)} away · {estTime(km)}
          </span>
        )}
      </div>

      {tab === "info" && (
        <div className="space-y-3">
          {customer.photo && (
            <img
              src={customer.photo}
              alt={`${customer.name} location`}
              className="h-44 w-full rounded-2xl border border-border object-cover"
            />
          )}
          <InfoRow icon={<Phone className="size-4" />} value={customer.phone} />
          <InfoRow icon={<MapPin className="size-4" />} value={customer.address} />
          {customer.landmark && (
            <InfoRow label="Landmark" icon={<MapPin className="size-4" />} value={customer.landmark} />
          )}
          {customer.notes && <InfoRow label="Notes" value={customer.notes} />}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <Stat label="Deliveries" value={String(customer.deliveries.length)} />
            <Stat
              label="Last delivery"
              value={relativeDate(customer.deliveries[0]?.date ?? customer.createdAt)}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            📍 {customer.lat.toFixed(5)}, {customer.lng.toFixed(5)}
          </p>

          <div className="grid grid-cols-4 gap-2 pt-1">
            <Action icon={<Navigation className="size-5" />} label="Navigate" primary onClick={() => setTab("route")} />
            <a
              href={`tel:${customer.phone}`}
              className="flex flex-col items-center gap-1 rounded-2xl bg-secondary/15 py-3 text-[11px] font-semibold text-secondary transition-transform active:scale-95"
            >
              <Phone className="size-5" />
              Call
            </a>
            <Action icon={<Pencil className="size-5" />} label="Edit" onClick={startEdit} />
            <Action icon={<History className="size-5" />} label="History" onClick={() => setTab("history")} />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => {
                customerStore.logDelivery(customer.id);
                toast.success("Delivery logged");
              }}
              className="gradient-accent flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-semibold text-accent-foreground active:scale-95"
            >
              <Check className="size-4" /> Log delivery
            </button>
            <button
              onClick={() => customerStore.toggleFavorite(customer.id)}
              className={`flex items-center justify-center gap-1 rounded-xl py-2.5 text-xs font-semibold active:scale-95 ${
                customer.favorite ? "bg-destructive text-destructive-foreground" : "bg-muted text-foreground"
              }`}
            >
              <Star className={`size-4 ${customer.favorite ? "fill-current" : ""}`} /> Favorite
            </button>
            <button
              onClick={del}
              className="flex items-center justify-center gap-1 rounded-xl bg-destructive/10 py-2.5 text-xs font-semibold text-destructive active:scale-95"
            >
              <Trash2 className="size-4" /> Delete
            </button>
          </div>
        </div>
      )}

      {tab === "route" && (
        <div className="space-y-4">
          <div className="gradient-blue rounded-2xl p-4 text-primary-foreground">
            <p className="text-xs opacity-80">Estimated route</p>
            <div className="mt-1 flex items-end gap-4">
              <div>
                <p className="text-2xl font-bold">{km != null ? formatDistance(km) : "—"}</p>
                <p className="text-xs opacity-80">distance</p>
              </div>
              <div>
                <p className="flex items-center gap-1 text-2xl font-bold">
                  <Clock className="size-5" />
                  {km != null ? estTime(km) : "—"}
                </p>
                <p className="text-xs opacity-80">travel time</p>
              </div>
            </div>
          </div>
          <a
            href={gmaps}
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-brand flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-primary-foreground shadow-float active:scale-[0.98]"
          >
            <ExternalLink className="size-5" /> Open in Google Maps
          </a>
          <button onClick={() => setTab("info")} className="w-full py-2 text-sm text-muted-foreground">
            Back
          </button>
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-2">
          {customer.deliveries.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
              <div className="grid size-9 place-items-center rounded-full gradient-brand text-primary-foreground">
                <History className="size-4" />
              </div>
              <div>
                <p className="text-sm font-medium">{relativeDate(d.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(d.date).toLocaleString()}
                  {d.note ? ` · ${d.note}` : ""}
                </p>
              </div>
            </div>
          ))}
          <button onClick={() => setTab("info")} className="w-full py-2 text-sm text-muted-foreground">
            Back
          </button>
        </div>
      )}

      {tab === "edit" && (
        <div className="space-y-3">
          <input className={inputCls} value={edit.name ?? ""} onChange={(e) => setEdit({ ...edit, name: e.target.value })} placeholder="Name" />
          <input className={inputCls} value={edit.phone ?? ""} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="Phone" />
          <textarea className={inputCls} rows={2} value={edit.address ?? ""} onChange={(e) => setEdit({ ...edit, address: e.target.value })} placeholder="Address" />
          <input className={inputCls} value={edit.landmark ?? ""} onChange={(e) => setEdit({ ...edit, landmark: e.target.value })} placeholder="Landmark" />
          <textarea className={inputCls} rows={2} value={edit.notes ?? ""} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} placeholder="Notes" />
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setTab("info")} className="rounded-2xl bg-muted py-3 font-semibold">
              Cancel
            </button>
            <button onClick={saveEdit} className="gradient-brand rounded-2xl py-3 font-bold text-primary-foreground">
              Save
            </button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

function InfoRow({ icon, value, label }: { icon?: React.ReactNode; value: string; label?: string }) {
  return (
    <div className="flex items-start gap-3">
      {icon && <span className="mt-0.5 text-primary">{icon}</span>}
      <div>
        {label && <p className="text-[11px] font-medium text-muted-foreground">{label}</p>}
        <p className="text-sm">{value}</p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted px-4 py-3">
      <p className="text-lg font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function Action({
  icon,
  label,
  onClick,
  primary,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-2xl py-3 text-[11px] font-semibold transition-transform active:scale-95 ${
        primary ? "gradient-brand text-primary-foreground shadow-soft" : "bg-muted text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
