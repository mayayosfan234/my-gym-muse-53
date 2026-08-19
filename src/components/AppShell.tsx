import { Link } from "@tanstack/react-router";
import { Apple, Dumbbell, History, Home, LayoutGrid } from "lucide-react";
import type { ReactNode } from "react";

const NAV: { to: string; label: string; id: string; icon: typeof Home }[] = [
  { to: "/", label: "בית", id: "home", icon: Home },
  { to: "/programs", label: "תוכניות", id: "programs", icon: LayoutGrid },
  { to: "/exercises", label: "תרגילים", id: "exercises", icon: Dumbbell },
  { to: "/nutrition", label: "תזונה", id: "nutrition", icon: Apple },
  { to: "/history", label: "היסטוריה", id: "history", icon: History },
];

export function AppShell({
  title,
  subtitle,
  kicker,
  action,
  children,
}: {
  title: string;
  subtitle?: string | undefined;
  kicker?: string | undefined;
  action?: ReactNode | undefined;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] w-full bg-background text-foreground" dir="rtl">
      <header
        className="sticky top-0 z-30 border-b border-border/30 bg-background/85 backdrop-blur-xl"
        style={{ paddingTop: "max(0.6rem, env(safe-area-inset-top))" }}
      >
        <div className="mx-auto w-full max-w-md px-5 pb-3.5 pt-1">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1 text-start">
              {kicker ? (
                <p className="mb-1 text-[11px] font-bold tracking-[0.14em] text-primary uppercase">
                  {kicker}
                </p>
              ) : null}
              <h1 className="truncate font-display text-[26px] font-extrabold leading-[1.1] tracking-tight text-ink">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 truncate text-[13px] leading-snug text-muted-foreground">
                  {subtitle}
                </p>
              ) : null}
            </div>
            {action ? <div className="flex shrink-0 items-center gap-2 pt-0.5">{action}</div> : null}
          </div>
        </div>
      </header>

      <main
        className="page-enter mx-auto w-full max-w-md px-4 pb-8 pt-4 sm:px-5"
        style={{
          paddingBottom: "calc(6.5rem + env(safe-area-inset-bottom))",
        }}
      >
        {children}
      </main>

      <nav
        aria-label="ניווט ראשי"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3.5 sm:px-4"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="pointer-events-auto mx-auto flex max-w-md items-center justify-between rounded-[2rem] border border-white/70 bg-white/85 p-1.5 shadow-[0_12px_36px_oklch(0.22_0.02_145/0.12),0_2px_10px_oklch(0.22_0.02_145/0.05)] backdrop-blur-2xl">
          {NAV.map(({ to, label, id, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: to === "/" }}
              data-testid={`link-nav-${id}`}
              className="group relative flex min-h-[3.6rem] min-w-[3.4rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-[1.4rem] py-1 text-muted-foreground transition-all duration-200 data-[status=active]:bg-primary/12 data-[status=active]:text-primary hover:text-foreground"
            >
              <Icon
                className="h-[21px] w-[21px] transition-transform duration-200 group-data-[status=active]:scale-110"
                strokeWidth={2.2}
              />
              <span className="text-[10.5px] font-bold leading-none">{label}</span>
              <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-primary opacity-0 transition-opacity duration-200 group-data-[status=active]:opacity-100" />
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
