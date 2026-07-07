import { useRef, useState } from "react";
import { toast } from "sonner";
import { MapPin, Loader2, Check, Camera, X } from "lucide-react";
import { BottomSheet } from "./BottomSheet";
import { MapView, type MapControl } from "./MapView";
import { customerStore } from "@/lib/store";

export function AddCustomerSheet({
  open,
  onClose,
  position,
  accuracy,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  position: [number, number] | null;
  accuracy: number | null;
  onSaved?: (lat: number, lng: number) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [landmark, setLandmark] = useState("");
  const [notes, setNotes] = useState("");
  const [photo, setPhoto] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const ctrl = useRef<MapControl | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const lowAccuracy = accuracy != null && accuracy > 40;

  const onPickPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Photo too large (max 8MB)");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setName("");
    setPhone("");
    setAddress("");
    setLandmark("");
    setNotes("");
    setPhoto(undefined);
  };

  const save = () => {
    if (!name.trim() || !phone.trim() || !address.trim()) {
      toast.error("Name, phone and address are required");
      return;
    }
    if (!position) {
      toast.error("Waiting for GPS location…");
      return;
    }
    setSaving(true);
    const dragged = ctrl.current?.getDraggedPosition();
    const [lat, lng] = dragged ?? position;
    setTimeout(() => {
      customerStore.add({
        name: name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        landmark: landmark.trim() || undefined,
        notes: notes.trim() || undefined,
        lat,
        lng,
        accuracy: accuracy ?? undefined,
        photo,
      });
      setSaving(false);
      toast.success("Customer saved", { description: name });
      reset();
      onSaved?.(lat, lng);
      onClose();
    }, 500);
  };

  const inputCls =
    "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <BottomSheet open={open} onClose={onClose} title="Add Customer">
      <div className="space-y-3">
        <div className="relative h-40 overflow-hidden rounded-2xl border border-border">
          {open && (
            <MapView
              position={position}
              accuracy={accuracy}
              customers={[]}
              draggable
              controlRef={ctrl}
            />
          )}
          <div className="pointer-events-none absolute bottom-2 left-2 rounded-lg bg-card/90 px-2 py-1 text-[11px] font-medium shadow-soft backdrop-blur">
            <MapPin className="mr-1 inline size-3 text-primary" />
            Drag the pin to adjust
          </div>
        </div>

        {lowAccuracy && (
          <div className="rounded-xl bg-warning/15 px-3 py-2 text-xs font-medium text-warning-foreground">
            GPS accuracy is low (~{Math.round(accuracy!)}m). Move to an open area or adjust the pin
            manually.
          </div>
        )}
        {position && (
          <p className="text-[11px] text-muted-foreground">
            📍 {position[0].toFixed(5)}, {position[1].toFixed(5)}
            {accuracy ? ` · ±${Math.round(accuracy)}m` : ""}
          </p>
        )}

        <input
          className={inputCls}
          placeholder="Customer name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={80}
        />
        <input
          className={inputCls}
          placeholder="Phone number *"
          value={phone}
          inputMode="tel"
          onChange={(e) => setPhone(e.target.value)}
          maxLength={20}
        />
        <textarea
          className={inputCls}
          placeholder="Address *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={2}
          maxLength={200}
        />
        <input
          className={inputCls}
          placeholder="Landmark (optional)"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          maxLength={120}
        />
        <textarea
          className={inputCls}
          placeholder="Delivery notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={200}
        />

        <button
          onClick={save}
          disabled={saving}
          className="gradient-brand mt-1 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-primary-foreground shadow-float transition-transform active:scale-[0.98] disabled:opacity-70"
        >
          {saving ? (
            <>
              <Loader2 className="size-5 animate-spin" /> Saving…
            </>
          ) : (
            <>
              <Check className="size-5" /> Save Customer
            </>
          )}
        </button>
      </div>
    </BottomSheet>
  );
}
