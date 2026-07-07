import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";

export function BottomSheet({
  open,
  onClose,
  children,
  title,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
}) {
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [open]);

  return (
    <div
      className={`fixed inset-0 z-[1000] ${open ? "pointer-events-auto" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-3xl bg-card shadow-float transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-3xl bg-card/95 px-5 pb-2 pt-3 backdrop-blur">
          <div className="mx-auto mb-1 h-1.5 w-12 rounded-full bg-muted-foreground/25" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pb-1">
            <h2 className="text-lg font-bold">{title}</h2>
            <button
              onClick={onClose}
              className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition-transform active:scale-90"
            >
              <X className="size-5" />
            </button>
          </div>
        )}
        <div className="px-5 pb-8">{children}</div>
      </div>
    </div>
  );
}
