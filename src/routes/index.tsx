import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Dumbbell, Flame, Play, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "לוח בקרה — הרוטינה שלי" },
      {
        name: "description",
        content: "לוח בקרה אישי: אימונים אחרונים, נפח אימונים ומעקב תזונה.",
      },
      { property: "og:title", content: "לוח בקרה — הרוטינה שלי" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { workouts, exercises, history, programs } = useGym();

  const thisWeek = history.filter(
    (s) => Date.now() - new Date(s.date).getTime() < 7 * 864e5,
  );
  const volume = thisWeek.reduce(
    (sum, s) =>
      sum +
      s.entries.reduce(
        (v, e) =>
          v + e.sets.filter((x) => x.done).reduce((a, b) => a + b.reps * b.weight, 0),
        0,
      ),
    0,
  );

  return (
    <AppShell title="כיף לראות אותך" subtitle="התמדה קטנה מייצרת תוצאות גדולות">
      {/* Hero Card */}
      <div className="ink-card relative overflow-hidden p-5">
        <div className="relative z-10 text-start">
          <p className="section-kicker text-primary-foreground/80">פוקוס להיום</p>
          <h2 className="mt-1.5 max-w-[17rem] font-display text-[1.55rem] font-semibold leading-tight">
            תגיע, תתחיל, ותן לתכנית לעשות את העבודה.
          </h2>
          <Link
            to="/programs"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/15 px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            בחר תכנית אימונים <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
        <div className="pointer-events-none absolute -left-12 -top-12 h-48 w-48 rounded-full border-[18px] border-primary-foreground/10" />
      </div>

      {/* Stats row */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <Stat label="אימונים השבוע" value={String(thisWeek.length)} icon={Flame} />
        <Stat
          label="נפח ק״ג"
          value={volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(Math.round(volume))}
          icon={TrendingUp}
        />
        <Stat label="תרגילים בספרייה" value={String(exercises.length)} icon={Dumbbell} />
      </div>

      {/* Quick Start Workout */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">התחל אימון</h2>
          <Link to="/programs" className="text-sm font-semibold text-primary">
            לכל התוכניות
          </Link>
        </div>

        {workouts.length === 0 ? (
          <Link
            to="/programs"
            className="surface-card flex items-center gap-3 p-5 text-muted-foreground"
          >
            <Dumbbell className="h-5 w-5 text-primary" /> צור את תכנית האימונים הראשונה שלך
          </Link>
        ) : (
          <div className="space-y-2.5">
            {workouts.slice(0, 4).map((w) => (
              <div key={w.id} className="surface-card flex items-center justify-between gap-3 p-4">
                <div className="min-w-0 flex-1 text-start">
                  <p className="truncate font-semibold text-foreground">{w.name || "אימון ללא שם"}</p>
                  <p className="text-xs text-muted-foreground">{w.items.length} תרגילים</p>
                </div>
                <Link
                  to="/session/$workoutId"
                  params={{ workoutId: w.id }}
                  className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground transition-transform active:scale-95"
                >
                  <Play className="h-4 w-4 fill-current" /> התחל
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Nutrition Summary */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">תזונה להיום</h2>
          <Link to="/nutrition" className="text-sm font-semibold text-primary">
            ליומן התזונה
          </Link>
        </div>
        <Link to="/nutrition" className="surface-card block p-4 transition-transform active:scale-[0.99] text-start">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-foreground">מעקב ארוחות וערכים</p>
              <p className="mt-0.5 text-xs text-muted-foreground">עקוב אחר קלוריות, חלבון והחלפות מאכלים</p>
            </div>
            <ArrowLeft className="h-5 w-5 text-primary" />
          </div>
        </Link>
      </section>

      {/* Active Programs */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="section-kicker">הקצב שלך</p>
            <h2 className="text-lg font-semibold">תוכניות אימון</h2>
          </div>
          <span className="text-sm font-medium text-muted-foreground">{programs.length}</span>
        </div>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
          {programs.slice(0, 4).map((program) => (
            <Link
              key={program.id}
              to="/programs/$programId"
              params={{ programId: program.id }}
              className="surface-card min-w-[11.5rem] flex-1 p-4 transition-transform active:scale-[0.98] text-start"
            >
              <p className="font-display font-semibold truncate">{program.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{program.dayIds.length} ימי אימון</p>
              <ArrowLeft className="mt-4 h-4 w-4 text-primary" />
            </Link>
          ))}
          {programs.length === 0 ? (
            <Link to="/programs" className="surface-card min-w-full p-5 text-sm text-muted-foreground text-start">
              הוסף תכנית אימונים חדשה בלחיצת כפתור.
            </Link>
          ) : null}
        </div>
      </section>

      {/* History */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">אימונים אחרונים</h2>
          <Link to="/history" className="text-sm font-semibold text-primary">
            הצג הכל
          </Link>
        </div>
        {history.length === 0 ? (
          <p className="surface-card p-5 text-sm text-muted-foreground text-start">
            עדיין לא נרשמו אימונים. סיים אימון ראשון כדי לראות אותו כאן.
          </p>
        ) : (
          <div className="space-y-2.5">
            {history.slice(0, 3).map((s) => (
              <Link key={s.id} to="/history" className="surface-card block p-4 transition-transform active:scale-[0.99] text-start">
                <p className="font-semibold text-foreground">{s.workoutName}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {new Date(s.date).toLocaleDateString("he-IL")} · {s.entries.length} תרגילים
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
}) {
  return (
    <div className="surface-card p-3 text-start">
      <Icon className="mb-1.5 h-4 w-4 text-primary" />
      <p className="text-xl sm:text-2xl font-bold tabular-nums leading-none text-foreground">{value}</p>
      <p className="mt-1 text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
