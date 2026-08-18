import { Link } from "@tanstack/react-router";
import { Apple, Dumbbell, History, Home, LayoutGrid, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

const NAV: { to: string; label: string; icon: LucideIcon }[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/programs", label: "Programs", icon: LayoutGrid },
  { to: "/nutrition", label: "Food", icon: Apple },
  { to: "/exercises", label: "Lifts", icon: Dumbbell },
  { to: "/history", label: "Log", icon: History },
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
        className="sticky top-0 z-20 border-b border-border/50 bg-background/90 backdrop-blur-xl"
        style={{
          paddingTop: "max(0.75rem, env(safe-area-inset-top))",
        }}
      >
        <div className="mx-auto flex max-w-lg items-center gap-3 px-4 pb-3">
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
              MY ROUTINE
            </p>
            <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-1.5">{action}</div> : null}
        </div>
      </header>

      <main
        className="page-enter mx-auto max-w-lg px-4 pt-4"
        style={{
          paddingBottom: "calc(var(--nav-height) + 1.25rem + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-card/95 backdrop-blur-xl"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="mx-auto flex max-w-lg">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              data-testid={`link-nav-${label.toLowerCase()}`}
              className="flex min-h-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 py-2 text-muted-foreground transition-colors active:bg-secondary/60 data-[status=active]:text-primary"
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={2.1} />
              <span className="text-[10px] font-semibold leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
