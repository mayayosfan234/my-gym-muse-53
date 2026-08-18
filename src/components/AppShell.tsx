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
    <div className="min-h-[100dvh] bg-background">
      <header
        className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl"
        style={{ paddingTop: "max(0.85rem, env(safe-area-inset-top))" }}
      >
        <div className="mx-auto flex max-w-lg items-start gap-3 px-5 pb-3 pt-1">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              <span className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                GYMTRACK
              </span>
            </div>
            <h1 className="truncate text-[26px] font-semibold leading-[1.15] tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-1.5 pt-1">{action}</div> : null}
        </div>
      </header>

      <main
        className="page-enter mx-auto max-w-lg px-5 pt-2"
        style={{
          paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>

      {/* Floating pill nav — matches the reference screenshot */}
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-4"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto soft-lift mx-auto flex max-w-md rounded-[1.75rem] border border-border/50 bg-card/95 px-1 py-1.5 backdrop-blur-xl">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              data-testid={`link-nav-${label.toLowerCase()}`}
              className="flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1.5 text-muted-foreground transition-colors data-[status=active]:bg-secondary data-[status=active]:text-primary"
            >
              <Icon className="h-5 w-5" strokeWidth={2} />
              <span className="text-[10px] font-medium leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
