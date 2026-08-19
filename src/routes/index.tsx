import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Apple,
  ArrowLeft,
  Dumbbell,
  Flame,
  Play,
  Sparkles,
  TrendingUp,
  Utensils,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  IconButton,
  LinkPill,
  Pill,
  SectionHeader,
  StatTile,
} from "@/components/ui-app/primitives";
import { dayTotals, foodTotals, todayKey, useGym } from "@/lib/gym-store";

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

function greetingFor(date: Date) {
  const h = date.getHours();
  if (h < 5) return "לילה טוב";
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  if (h < 21) return "ערב טוב";
  return "לילה טוב";
}

function formatHebrewDate(date: Date) {
  return date.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function Dashboard() {
  const { workouts, exercises, history, programs, nutritionDays } = useGym();

  const now = new Date();
  const greeting = greetingFor(now);

  const startOfWeek = new Date(now);
  const dow = (now.getDay() + 6) % 7; // 0 = Sunday in he-IL
  startOfWeek.setDate(now.getDate() - dow);
  startOfWeek.setHours(0, 0, 0, 0);

  const thisWeek = history.filter((s) => new Date(s.date) >= startOfWeek);
  const volume = thisWeek.reduce(
    (sum, s) =>
      sum +
      s.entries.reduce(
        (v, e) => v + e.sets.filter((x) => x.done).reduce((a, b) => a + b.reps * b.weight, 0),
        0,
      ),
    0,
  );

  const nutritionToday = nutritionDays.find((d) => d.date === todayKey());
  const todayTotals = nutritionToday ? dayTotals(nutritionToday) : null;
  const calTarget = nutritionDays.length > 0 ? undefined : undefined;
  void calTarget;

  const lastSession = history[0];
  const programsCount = programs.length;
  const workoutsCount = workouts.length;

  return (
    <AppShell
      kicker={`${greeting} ✨`}
      title={formatHebrewDate(now)}
      subtitle="בואי נהפוך את היום לקצת טוב יותר"
    >
      {/* Hero card */}
      <div className="ink-card relative overflow-hidden p-5 sm:p-6">
        <div className="relative z-10 text-start">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary-foreground/80" strokeWidth={2.2} />
            <p className="text-[10.5px] font-semibold tracking-[0.16em] text-primary-foreground/80 uppercase">
              Focus להיום
            </p>
          </div>
          <h2 className="mt-2 max-w-[18rem] font-display text-[1.65rem] font-semibold leading-[1.15]">
            תגיעי, תתחילי, ותני לתכנית לעשות את העבודה.
          </h2>
          <p className="mt-2 max-w-[22rem] text-[12.5px] leading-relaxed text-primary-foreground/75">
            התמדה קטנה מייצרת תוצאות גדולות. צעד צעד, אימון אחרי אימון.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/programs"
              className="press inline-flex items-center gap-2 rounded-full bg-white/95 px-4 py-2.5 text-[13px] font-semibold text-ink shadow-sm"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              התחלי אימון
            </Link>
            <Link
              to="/nutrition"
              className="press inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-2.5 text-[12.5px] font-semibold text-primary-foreground hover:bg-white/20"
            >
              תזונה
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -bottom-12 -end-12 h-44 w-44 rounded-full border-[12px] border-white/8" />
        <div className="pointer-events-none absolute -top-16 -end-24 h-32 w-32 rounded-full bg-white/5 blur-2xl" />
      </div>

      {/* Stats grid */}
      <div className="mt-4 grid grid-cols-3 gap-2.5">
        <StatTile label="אימונים השבוע" value={String(thisWeek.length)} icon={Flame} tone="sage" />
        <StatTile
          label="נפח ק״ג"
          value={volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(Math.round(volume))}
          icon={TrendingUp}
          tone="rose"
        />
        <StatTile
          label="תרגילים בספרייה"
          value={String(exercises.length)}
          icon={Dumbbell}
          tone="cream"
        />
      </div>

      {/* Quick start */}
      <section className="mt-7">
        <SectionHeader
          title="התחלת אימון"
          subtitle={
            programsCount > 0 ? "בחרי תכנית או התחילי אימון מהיר" : "צרי תחילה תכנית אימונים"
          }
          action={
            <Link
              to="/programs"
              className="press rounded-full bg-secondary px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-secondary/80"
            >
              לכל התוכניות
            </Link>
          }
        />

        <div className="space-y-3">
          {workouts.length > 0 ? (
            workouts.slice(0, 3).map((w) => {
              const program = programs.find((p) => p.dayIds.includes(w.id));
              return (
                <Link
                  key={w.id}
                  to="/programs/$programId/$dayId"
                  params={{ programId: program?.id ?? "", dayId: w.id }}
                  className="surface-card press flex items-center gap-3.5 p-4"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage-soft text-primary">
                    <Play className="h-5 w-5 fill-current" />
                  </div>
                  <div className="min-w-0 flex-1 text-start">
                    <p className="truncate font-display text-[15px] font-semibold text-ink">
                      {w.name || "אימון ללא שם"}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {program?.name ?? "אימון עצמאי"} · {w.items.length} תרגילים
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                </Link>
              );
            })
          ) : (
            <Card className="text-start">
              <p className="text-[13.5px] text-muted-foreground">
                עדיין לא נוצרו אימונים. כדי להתחיל, צרי תכנית אימונים והוסיפי לה ימי אימון.
              </p>
              <Link
                to="/programs"
                className="press mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-[13px] font-semibold text-primary-foreground"
              >
                <Sparkles className="h-4 w-4" />
                צרי תכנית ראשונה
              </Link>
            </Card>
          )}
        </div>
      </section>

      {/* Nutrition summary */}
      <section className="mt-7">
        <SectionHeader
          title="תזונה היום"
          subtitle={todayTotals ? "מעקב קלוריות ומאקרו" : "התחילי לעקוב אחר הארוחות שלך"}
          action={
            <Link
              to="/nutrition"
              className="press rounded-full bg-secondary px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-secondary/80"
            >
              פתחי יומן
            </Link>
          }
        />

        {todayTotals ? (
          <div className="rose-card relative overflow-hidden p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="text-start">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-rose uppercase">
                  קלוריות היום
                </p>
                <p className="mt-1 font-display text-[34px] font-semibold leading-none text-ink tabular-nums">
                  {Math.round(todayTotals.calories)}
                </p>
                <p className="mt-1 text-[12.5px] text-muted-foreground">
                  מתוך {nutritionDays[0]?.toString().slice(0, 0) || "—"}
                </p>
              </div>
              <div className="grid h-16 w-16 place-items-center rounded-full bg-white/70">
                <Utensils className="h-6 w-6 text-rose" strokeWidth={1.8} />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <Macro label="חלבון" value={todayTotals.protein} unit="g" />
              <Macro label="פחמימות" value={todayTotals.carbs} unit="g" />
              <Macro label="שומן" value={todayTotals.fat} unit="g" />
            </div>
          </div>
        ) : (
          <Card className="text-start">
            <p className="text-[13.5px] text-muted-foreground">
              לא תועדו ארוחות היום. הוסיפי את הארוחה הראשונה שלך.
            </p>
            <Link
              to="/nutrition"
              className="press mt-3 inline-flex items-center gap-2 rounded-full bg-rose px-4 py-2.5 text-[13px] font-semibold text-rose-foreground"
            >
              <Apple className="h-4 w-4" />
              הוסיפי ארוחה
            </Link>
          </Card>
        )}
      </section>

      {/* Recent workouts */}
      <section className="mt-7">
        <SectionHeader
          title="אימונים אחרונים"
          subtitle={lastSession ? "הצצה לפעילות האחרונה שלך" : "ההיסטוריה שלך תופיע כאן"}
          action={
            <Link
              to="/history"
              className="press rounded-full bg-secondary px-3 py-1.5 text-[12px] font-semibold text-primary hover:bg-secondary/80"
            >
              הצג הכל
            </Link>
          }
        />

        {history.length === 0 ? (
          <Card className="text-start">
            <p className="text-[13.5px] text-muted-foreground">
              עדיין לא נרשמו אימונים. סיימי אימון ראשון כדי לראות אותו כאן.
            </p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {history.slice(0, 3).map((s) => {
              const sessionVolume = s.entries.reduce(
                (v, e) =>
                  v + e.sets.filter((x) => !x.warmup).reduce((a, b) => a + b.reps * b.weight, 0),
                0,
              );
              return (
                <Link
                  key={s.id}
                  to="/history"
                  className="surface-card press flex items-center gap-3.5 p-4"
                >
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-cream text-ink-soft">
                    <Dumbbell className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1 text-start">
                    <p className="truncate font-display text-[14.5px] font-semibold text-ink">
                      {s.workoutName}
                    </p>
                    <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                      {new Date(s.date).toLocaleDateString("he-IL")} · {s.entries.length} תרגילים ·
                      נפח {Math.round(sessionVolume)} ק״ג
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Tip / inspirational card */}
      {(programsCount === 0 || workoutsCount === 0) && (
        <section className="mt-7">
          <div className="ink-card-soft flex items-start gap-3 p-4">
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-sage-soft text-primary">
              <Sparkles className="h-4 w-4" strokeWidth={2} />
            </div>
            <div className="text-start">
              <p className="font-display text-[14px] font-semibold text-ink">טיפ קטן מהיום</p>
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
                עקביות מנצחת השראה. אימון קצר וממוקד עדיף על אימון ארוך שלא קורה.
              </p>
            </div>
          </div>
        </section>
      )}
    </AppShell>
  );
}

function Macro({ label, value, unit }: { label: string; value: number; unit: string }) {
  return (
    <div className="rounded-xl bg-white/60 px-3 py-2.5 text-start">
      <p className="text-[10.5px] font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 font-display text-[15px] font-semibold tabular-nums text-ink">
        {Math.round(value)}
        <span className="ms-0.5 text-[11px] font-normal text-muted-foreground">{unit}</span>
      </p>
    </div>
  );
}

void foodTotals;
void Pill;
void IconButton;
void LinkPill;
