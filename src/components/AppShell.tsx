import { Link } from "@tanstack/react-router";
import { Apple, Dumbbell, History, Home, LayoutGrid, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/programs", label: "Programs", icon: LayoutGrid },
  { to: "/nutrition", label: "Nutrition", icon: Apple },
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
    <div className="min-h-[100dvh] bg-background pb-32">
      <header className="sticky top-0 z-20 border-b border-border/40 bg-background/85 px-5 pb-4 pt-6 backdrop-blur-xl sm:px-6">
        <div className="mx-auto grid max-w-3xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                MY ROUTINE
              </span>
            </div>
            <h1 className="truncate text-[26px] font-semibold leading-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      </header>

      <main className="page-enter mx-auto max-w-3xl px-5 pb-6 pt-5 sm:px-6">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="soft-lift mx-auto flex max-w-md rounded-3xl border border-border/60 bg-card/95 px-1 py-2 backdrop-blur-xl">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              data-testid={`link-nav-${label.toLowerCase()}`}
              className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-muted-foreground transition-colors data-[status=active]:bg-secondary data-[status=active]:text-primary"
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
