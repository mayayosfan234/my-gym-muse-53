import { Link } from "@tanstack/react-router";
import { Dumbbell, History, Home, LayoutGrid, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/programs", label: "Programs", icon: LayoutGrid },
  { to: "/exercises", label: "Exercises", icon: Dumbbell },
  { to: "/history", label: "History", icon: History },
];

export function AppShell({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  action?: ReactNode | undefined;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-20 bg-background/80 px-6 pb-4 pt-7 backdrop-blur-xl">
        <div className="mx-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <h1 className="truncate text-[26px] font-semibold leading-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-6 pt-1">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="soft-lift mx-auto flex max-w-md rounded-3xl border border-border/60 bg-card/95 px-2 py-2 backdrop-blur-xl">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-muted-foreground transition-colors data-[status=active]:bg-secondary data-[status=active]:text-primary"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[11px] font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
