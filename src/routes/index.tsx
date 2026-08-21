import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  Apple,
  ArrowLeft,
  ChevronLeft,
  Dumbbell,
  Flame,
  Flame as FireIcon,
  Footprints,
  Play,
  Plus,
  Scale,
  TrendingUp,
  Utensils,
  Droplets,
  Ruler,
  Award,
  MessageSquare,
  CheckCircle2,
  Circle,
  Sparkles,
  Heart,
} from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  Card,
  IconButton,
  PrimaryButton,
  SectionHeader,
  StatTile,
} from "@/components/ui-app/primitives";
import {
  calculateCardioCalories,
  calculateRmr,
  dayTotals,
  saveBodyWeight,
  saveCardioLog,
  saveUserProfile,
  todayKey,
  useGym,
} from "@/lib/gym-store";
import { CARDIO_TYPES } from "@/lib/gym-types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "לוח בקרה — הרוטינה שלי" },
      { name: "description", content: "מעקב אימונים, משקל גוף ותזונה יומית." },
      { property: "og:title", content: "לוח בקרה — הרוטינה שלי" },
    ],
  }),
  component: Dashboard,
});

function formatHebrewDate(date: Date) {
  return date.toLocaleDateString("he-IL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function Dashboard() {
  const navigate = useNavigate();
  const { workouts, exercises, history, programs, nutritionDays, userProfile, cardioLogs, coachMessages } =
    useGym();

  const now = new Date();

  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [waistCm, setWaistCm] = useState("72");
  const [hipsCm, setHipsCm] = useState("95");

  // Today's Checklist State
  const [routineChecklist, setRoutineChecklist] = useState<Record<string, boolean>>({
    workout: false,
    steps: false,
    nutrition: false,
  });


  // Weekly Activity calculation
  const startOfWeek = new Date(now);
  const dow = (now.getDay() + 6) % 7;
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
  const totalDurationMin = Math.round(
    thisWeek.reduce((sum, s) => sum + (s.durationSec || 0), 0) / 60,
  );

  // Consistency Score calculation (0-100%)
  const consistencyScore = Math.min(100, Math.round((thisWeek.length / (userProfile?.workoutsPerWeek || 4)) * 100));

  // Nutrition Today
  const todayDateStr = todayKey();
  const nutritionToday = nutritionDays.find((d) => d.date === todayDateStr);
  const totalsToday = nutritionToday ? dayTotals(nutritionToday) : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const targetCals = 2000;
  const remainingCals = Math.max(0, targetCals - totalsToday.calories);

  const nextWorkout = workouts[0];
  const nextProgram = nextWorkout
    ? programs.find((p) => p.dayIds.includes(nextWorkout.id))
    : undefined;

  const toggleChecklistItem = (key: string) => {
    setRoutineChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const latestCoachMsg = coachMessages && coachMessages.length > 0 ? coachMessages[0] : null;

  return (
    <AppShell title={formatHebrewDate(now)} subtitle="אימונים ותזונה">
      {/* Coach Message Banner */}
      {latestCoachMsg && (
        <div className="surface-card p-4 rounded-3xl bg-linear-to-r from-primary/10 via-rose-50 to-primary/5 border border-primary/20 text-start space-y-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-bold text-xs text-primary">
              <MessageSquare className="h-4 w-4" /> הודעה מהמאמן שלך
            </span>
            <span className="text-[10px] text-muted-foreground">
              {new Date(latestCoachMsg.createdAt).toLocaleDateString("he-IL")}
            </span>
          </div>
          <p className="text-xs font-semibold text-ink leading-relaxed">
            "{latestCoachMsg.message}"
          </p>
        </div>
      )}

      {/* Consistency Banner */}
      <div className="surface-card p-4 rounded-3xl bg-white border border-border/60 flex items-center justify-between text-start">
        <div>
          <div className="flex items-center gap-1.5 font-bold text-sm text-ink">
            <span>רצף אימונים שבועי</span>
            <span className="text-xs text-primary">★</span>
          </div>
          <p className="text-xs text-muted-foreground">
            מדד עקביות שבועי: <strong className="text-emerald-700">{consistencyScore}%</strong>
          </p>
        </div>
      </div>

      {/* 1. Next / Today's Workout Focus Card */}
      {nextWorkout ? (
        <div className="ink-card p-5 text-start mt-4">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-white/20 px-3 py-1 text-[11px] font-bold text-primary-foreground uppercase">
              האימון הבא
            </span>
            <span className="text-[12px] text-primary-foreground/80 font-medium">
              ~{nextWorkout.items.length * 12 + 15} דקות
            </span>
          </div>
          <h2 className="mt-2 font-display text-[22px] font-bold leading-tight text-primary-foreground">
            {nextWorkout.name}
          </h2>
          <p className="mt-0.5 text-[13px] text-primary-foreground/80">
            {nextProgram?.name ?? "תכנית אימונים"} · {nextWorkout.items.length} תרגילים
          </p>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() =>
                navigate({
                  to: "/session/$workoutId",
                  params: { workoutId: nextWorkout.id },
                })
              }
              className="press inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[14px] font-bold text-ink shadow-sm cursor-pointer"
            >
              <Play className="h-4 w-4 fill-current text-primary" />
              התחל אימון עכשיו
            </button>
            <Link
              to="/programs/$programId/$dayId"
              params={{
                programId: nextProgram?.id ?? "p-default",
                dayId: nextWorkout.id,
              }}
              className="press grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-primary-foreground cursor-pointer"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </div>
        </div>
      ) : (
        <Card className="text-start mt-4">
          <p className="font-display text-[16px] font-bold text-ink">אין תכניות אימון עדיין</p>
          <p className="mt-1 text-[13px] text-muted-foreground">
            צרי תכנית אימונים ראשונה כדי להתחיל להתאמן בחדר כושר.
          </p>
          <Link
            to="/programs"
            className="press mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-[13px] font-bold text-primary-foreground"
          >
            <Plus className="h-4 w-4" /> צרי תכנית
          </Link>
        </Card>
      )}

      {/* 2. Today's Routine Checklist */}
      <section className="mt-5 text-start">
        <SectionHeader title="הרוטינה של היום" subtitle="משימות יומיות לשמירה על רצף" />
        <div className="space-y-2">
          {[
            { key: "workout", label: `אימון יומיומי: ${nextWorkout?.name || "מנוחה"}` },
            { key: "steps", label: "צעדים יומיים (יעד 8,000 צעדים)" },
            { key: "nutrition", label: `תיעוד תזונה ביומן: ${Math.round(totalsToday.calories)} קל׳` },
          ].map(({ key, label }) => {
            const isDone = routineChecklist[key] || false;

            return (
              <div
                key={key}
                onClick={() => toggleChecklistItem(key)}
                className={`surface-card p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  isDone ? "bg-emerald-50/50 border-emerald-200 line-through opacity-70" : "bg-white border-border/60 font-bold"
                }`}
              >
                <span>{label}</span>
                {isDone ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Measurements Tracker */}
      <section className="mt-5 text-start">
        <SectionHeader title="היקפי גוף" subtitle="מעקב היקפים תקופתי" />
        <div
          onClick={() => setShowMeasurementModal(true)}
          className="surface-card p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 flex items-center justify-between cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Ruler className="h-5 w-5 text-rose-600" />
            <div>
              <span className="font-bold text-xs text-rose-900 block">עדכון היקפי גוף</span>
              <span className="text-[11px] text-muted-foreground">
                מותניים: {waistCm} ס״מ · ירכיים: {hipsCm} ס״מ
              </span>
            </div>
          </div>
          <span className="text-xs font-bold text-rose-800 bg-white px-3 py-1 rounded-xl shadow-2xs">עדכן</span>
        </div>
      </section>

      {/* 4. Weekly Activity Overview */}
      <section className="mt-5">
        <SectionHeader title="פעילות השבוע" subtitle={`${thisWeek.length} אימונים בוצעו השבוע`} />
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile
            label="אימונים"
            value={String(thisWeek.length)}
            icon={Flame}
            tone="rose"
          />
          <StatTile
            label="נפח ק״ג"
            value={
              volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(Math.round(volume))
            }
            icon={TrendingUp}
            tone="sage"
          />
          <StatTile
            label="זמן אימון"
            value={`${totalDurationMin}m`}
            icon={Dumbbell}
            tone="cream"
          />
        </div>
      </section>

      {/* 5. Nutrition Summary Today */}
      <section className="mt-5">
        <SectionHeader
          title="תזונה להיום"
          subtitle={`נותרו עוד ${remainingCals} קלוריות`}
          action={
            <Link
              to="/nutrition"
              className="press rounded-full bg-secondary px-3 py-1.5 text-[12px] font-bold text-primary"
            >
              פתחי יומן
            </Link>
          }
        />
        <div className="rose-card p-4 text-start">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-primary uppercase">
                קלוריות שנצרכו
              </p>
              <p className="mt-0.5 font-display text-[28px] font-bold tabular-nums text-ink">
                {Math.round(totalsToday.calories)}{" "}
                <span className="text-[14px] font-normal text-muted-foreground">
                  / {targetCals}
                </span>
              </p>
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 text-primary">
              <Utensils className="h-5 w-5" />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-xl bg-white/80 p-2.5 text-start">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">חלבון</p>
              <p className="font-display text-[15px] font-bold tabular-nums text-ink">
                {Math.round(totalsToday.protein)}g
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-2.5 text-start">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">פחמימות</p>
              <p className="font-display text-[15px] font-bold tabular-nums text-ink">
                {Math.round(totalsToday.carbs)}g
              </p>
            </div>
            <div className="rounded-xl bg-white/80 p-2.5 text-start">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">שומן</p>
              <p className="font-display text-[15px] font-bold tabular-nums text-ink">
                {Math.round(totalsToday.fat)}g
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* Modal: Body Measurements */}
      {showMeasurementModal && (
        <div
          className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowMeasurementModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-5 shadow-2xl space-y-3 text-start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-base text-ink flex items-center gap-2">
                <Ruler className="h-5 w-5 text-rose-600" /> תיעוד היקפי גוף
              </h3>
              <button
                onClick={() => setShowMeasurementModal(false)}
                className="text-muted-foreground font-bold text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block font-bold text-muted-foreground mb-1">היקף מותניים (ס״מ)</label>
                <input
                  type="number"
                  value={waistCm}
                  onChange={(e) => setWaistCm(e.target.value)}
                  className="w-full rounded-xl border border-border p-2"
                />
              </div>
              <div>
                <label className="block font-bold text-muted-foreground mb-1">היקף ירכיים (ס״מ)</label>
                <input
                  type="number"
                  value={hipsCm}
                  onChange={(e) => setHipsCm(e.target.value)}
                  className="w-full rounded-xl border border-border p-2"
                />
              </div>
            </div>

            <button
              onClick={() => setShowMeasurementModal(false)}
              className="w-full rounded-2xl bg-primary py-2.5 text-xs font-bold text-white shadow-md cursor-pointer"
            >
              שמור היקפים
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
