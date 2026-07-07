import { type ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { CREDIT } from "@/lib/store";

export function PageShell({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="gradient-brand sticky top-0 z-[500] rounded-b-3xl px-5 pb-6 pt-[max(1.25rem,env(safe-area-inset-top))] text-primary-foreground shadow-float">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-primary-foreground/85">{subtitle}</p>}
          </div>
          {action}
        </div>
      </header>
      <main className="mx-auto max-w-lg px-4 py-4">{children}</main>
      <footer className="px-4 pb-4 text-center text-[11px] text-muted-foreground">{CREDIT}</footer>
      <BottomNav />
    </div>
  );
}
