import { useState, useEffect } from "react";
import { User, LogIn, LogOut, UserPlus, Cloud, Check, AlertCircle, X, ShieldCheck } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { migrateLocalToSupabase, isMigrationNeeded } from "@/lib/supabase-sync";
import { useGym } from "@/lib/gym-store";
import { PrimaryButton } from "@/components/ui-app/primitives";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const gymData = useGym();
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  useEffect(() => {
    if (!supabase || !isSupabaseConfigured) return;

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ? { id: data.user.id, email: data.user.email } : null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const authUser = session?.user ? { id: session.user.id, email: session.user.email } : null;
      setUser(authUser);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (!open) return null;

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !isSupabaseConfigured) {
      setError("מערכת Supabase אינה מוגדרת. יש להגדיר מפתחות סביבה.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === "signup") {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        setMessage("הרשמה בוצעה בהצלחה! אם נדרש אימות מייל, בדקי את תיבת הדואר הנכנס.");
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
          // Trigger migration
          setMigrating(true);
          await migrateLocalToSupabase(data.user.id, gymData);
          setMigrating(false);
        }
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        setMessage("התחברת בהצלחה!");
        if (data.user) {
          setUser({ id: data.user.id, email: data.user.email });
          // Check & trigger migration if needed
          const needed = await isMigrationNeeded(data.user.id);
          if (needed) {
            setMigrating(true);
            await migrateLocalToSupabase(data.user.id, gymData);
            setMigrating(false);
          }
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "שגיאה בתהליך ההתחברות";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    setLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setMessage("התנתקת בהצלחה.");
    setLoading(false);
  };

  const handleManualMigrate = async () => {
    if (!user) return;
    setMigrating(true);
    setError(null);
    const res = await migrateLocalToSupabase(user.id, gymData);
    setMigrating(false);
    if (res.success) {
      setMessage("הנתונים השרותיים והמקומיים סונכרנו בהצלחה לענן!");
    } else {
      setError(`שגיאה בסנכרון: ${res.error}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-0 pb-20 sm:p-4">
      <div
        ref={(el) => { if (el) el.scrollTop = 0; }}
        className="surface-card w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 text-start shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200"
      >
        <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4">
          <div className="flex items-center gap-2">
            <Cloud className="h-5 w-5 text-primary" />
            <h2 className="font-display text-[17px] font-bold text-ink">
              {user ? "חשבון משתמש וסנכרון ענן" : mode === "signin" ? "התחברות לחשבון" : "הרשמה לחשבון חדש"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="press grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {!isSupabaseConfigured ? (
          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-[13px] text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
              מפתחות Supabase חסרים
            </div>
            <p className="text-[12px] leading-relaxed">
              האפליקציה פועלת כעת במצב מקומי (localStorage). כדי לחבר את האפליקציה לענן Supabase, יש להגדיר את משתני הסביבה <code>VITE_SUPABASE_URL</code> ו-<code>VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </div>
        ) : user ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-primary-foreground">
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold text-primary tracking-wider uppercase">מחוברת כעת</p>
                  <p className="truncate font-semibold text-ink text-[14px]">{user.email}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-secondary p-4 space-y-2">
              <div className="flex items-center gap-2 text-[13px] font-bold text-ink">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                סטטוס אבטחה וסנכרון
              </div>
              <p className="text-[12px] text-muted-foreground leading-relaxed">
                הנתונים שלך מוגנים באמצעות Row Level Security (RLS). רק את יכולה לצפות ולעדכן את התכניות והאימונים שלך.
              </p>
            </div>

            {migrating ? (
              <p className="text-[13px] font-semibold text-primary animate-pulse text-center">
                מסנכרן נתונים לענן... אנא המתיני
              </p>
            ) : null}

            {message ? (
              <p className="rounded-xl bg-emerald-500/10 p-3 text-[12.5px] font-semibold text-emerald-700">
                {message}
              </p>
            ) : null}

            {error ? (
              <p className="rounded-xl bg-destructive/10 p-3 text-[12.5px] font-semibold text-destructive">
                {error}
              </p>
            ) : null}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={handleManualMigrate}
                disabled={migrating}
                className="press flex-1 flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground font-semibold text-[13.5px]"
              >
                <Cloud className="h-4 w-4" />
                סנכרן נתונים כעת
              </button>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={loading}
                className="press flex h-11 items-center justify-center gap-2 rounded-2xl bg-secondary px-4 font-semibold text-destructive text-[13.5px]"
              >
                <LogOut className="h-4 w-4" />
                התנתק
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="space-y-3.5">
            <div className="flex rounded-2xl bg-secondary p-1 text-[13px] font-semibold">
              <button
                type="button"
                onClick={() => setMode("signin")}
                className={`press flex-1 py-2 rounded-xl transition-all ${
                  mode === "signin" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                התחברות
              </button>
              <button
                type="button"
                onClick={() => setMode("signup")}
                className={`press flex-1 py-2 rounded-xl transition-all ${
                  mode === "signup" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                הרשמה
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                אימייל
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full rounded-2xl border border-border/60 bg-secondary px-4 py-3 text-[14px] outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold tracking-wider text-muted-foreground uppercase mb-1">
                סיסמה
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-2xl border border-border/60 bg-secondary px-4 py-3 text-[14px] outline-none focus:border-primary"
              />
            </div>

            {error ? (
              <p className="rounded-xl bg-destructive/10 p-3 text-[12.5px] font-semibold text-destructive">
                {error}
              </p>
            ) : null}

            {message ? (
              <p className="rounded-xl bg-emerald-500/10 p-3 text-[12.5px] font-semibold text-emerald-700">
                {message}
              </p>
            ) : null}

            <PrimaryButton type="submit" disabled={loading}>
              {loading ? "מעבד..." : mode === "signin" ? "התחברי לחשבון" : "צרי חשבון חדש"}
            </PrimaryButton>
          </form>
        )}
      </div>
    </div>
  );
}
