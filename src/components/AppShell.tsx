import { Link } from "@tanstack/react-router";
import { Apple, Dumbbell, History, Home, LayoutGrid, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import "../styles.css";

const NAV: { to: string; label: string; id: string; icon: LucideIcon }[] = [
  { to: "/", label: "בית", id: "home", icon: Home },
  { to: "/programs", label: "תוכניות", id: "programs", icon: LayoutGrid },
  { to: "/nutrition", label: "תזונה", id: "nutrition", icon: Apple },
  { to: "/exercises", label: "תרגילים", id: "exercises", icon: Dumbbell },
  { to: "/history", label: "היסטוריה", id: "history", icon: History },
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
    <div className="min-h-[100dvh] w-full bg-background text-foreground overflow-x-hidden" dir="rtl">
      <header
        className="sticky top-0 z-20 w-full bg-background/95 backdrop-blur-md border-b border-border/50"
        style={{ paddingTop: "max(0.75rem, env(safe-area-inset-top))" }}
      >
        <div className="w-full max-w-md md:max-w-xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-5 pb-3 pt-1">
          <div className="min-w-0 flex-1 text-start">
            <div className="mb-0.5 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="font-display text-[11px] font-bold tracking-wider text-primary uppercase">
                הרוטינה שלי
              </span>
            </div>
            <h1 className="truncate text-[22px] sm:text-[24px] font-bold leading-tight tracking-tight">{title}</h1>
            {subtitle ? (
              <p className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="flex shrink-0 items-center gap-1.5 pt-0.5">{action}</div> : null}
        </div>
      </header>

      <main
        className="page-enter w-full max-w-md md:max-w-xl mx-auto px-4 sm:px-5 pt-3"
        style={{
          paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>

      {/* Floating pill navigation — Mobile-first native iOS tab bar */}
      <nav
        className="pointer-events-none fixed inset-x-0 bottom-0 z-30 w-full px-3 sm:px-4"
        style={{ paddingBottom: "max(0.6rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto soft-lift w-full max-w-md mx-auto flex rounded-[1.8rem] border border-border/60 bg-card/95 px-1 py-1.5 backdrop-blur-xl">
          {NAV.map(({ to, label, id, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              data-testid={`link-nav-${id}`}
              className="flex min-h-[3.25rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-1 text-muted-foreground transition-all duration-200 active:scale-95 data-[status=active]:bg-secondary data-[status=active]:text-primary"
            >
              <Icon className="h-5 w-5" strokeWidth={2.2} />
              <span className="text-[11px] font-semibold leading-none">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
