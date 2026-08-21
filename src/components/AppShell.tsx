import { Link } from "@tanstack/react-router";
import { Apple, Cloud, Dumbbell, Home, LayoutGrid, LogIn, LogOut, Shield, Crown, User } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useAuthUser, useGym } from "../lib/gym-store";
import { supabase } from "../lib/supabase";

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
  const store = useGym();
  const user = useAuthUser();
  const role = store.userProfile?.role || "client";
  const isOwner = role === "owner";
  const isCoach = role === "coach" || isOwner;

  // Client gets 3 tabs: בית | תוכניות | תזונה (Exercises is coach-only!)
  // Coach gets 4 tabs: בית | תוכניות | תרגילים | תזונה
  const NAV = [
    { to: "/", label: "בית", id: "home", icon: Home },
    { to: "/programs", label: "תוכניות", id: "programs", icon: LayoutGrid },
    ...(isCoach ? [{ to: "/exercises", label: "תרגילים", id: "exercises", icon: Dumbbell }] : []),
    { to: "/nutrition", label: "תזונה", id: "nutrition", icon: Apple },
  ];

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (isSignUp) {
        const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
          },
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      setShowAuthModal(false);
      setEmail("");
      setPassword("");
    } catch (err: any) {
      setErrorMsg(err?.message || "אירעה שגיאה בחיבור ל-Supabase");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

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
            <div className="flex shrink-0 items-center gap-2 pt-0.5">
              {isOwner ? (
                <Link
                  to="/coach"
                  className="flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800 border border-purple-300 shadow-xs hover:bg-purple-200 transition-colors"
                >
                  <Crown className="h-3.5 w-3.5 text-purple-700" />
                  <span>בעלים</span>
                </Link>
              ) : isCoach ? (
                <Link
                  to="/coach"
                  className="flex items-center gap-1 rounded-full bg-amber-100/80 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-300/60 shadow-xs hover:bg-amber-200 transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-amber-700" />
                  <span>מאמן</span>
                </Link>
              ) : null}

              {user ? (
                <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200/60 shadow-xs">
                  <Cloud className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
                  <span className="max-w-[80px] truncate">{user.email?.split("@")[0]}</span>
                  <button
                    onClick={handleSignOut}
                    title="התנתק"
                    className="mr-0.5 text-emerald-600 hover:text-emerald-900 cursor-pointer"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>התחברות</span>
                </button>
              )}
              {action}
            </div>
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

      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-lg text-ink">
                  {isSignUp ? "הרשמה ל-My Routine" : "התחברות ל-My Routine"}
                </h3>
              </div>
              <button
                onClick={() => setShowAuthModal(false)}
                className="text-muted-foreground hover:text-ink font-bold text-sm px-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="rounded-xl bg-red-50 p-3 text-xs text-red-600 font-semibold border border-red-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  כתובת אימייל
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground mb-1">
                  סיסמה
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-primary"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-primary py-2.5 text-sm font-bold text-white shadow-md hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
              >
                {loading ? "מעבד..." : isSignUp ? "צור חשבון" : "התחבר"}
              </button>
            </form>

            <div className="text-center pt-2">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                {isSignUp ? "כבר יש לך חשבון? התחבר כאן" : "אין לך חשבון? הירשם כאן"}
              </button>
            </div>
          </div>
        </div>
      )}

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
