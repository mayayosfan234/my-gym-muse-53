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
  const { workouts, exercises, history, programs, nutritionDays, userProfile, cardioLogs } =
    useGym();

  const now = new Date();

  // Water & Habits state
  const [waterMl, setWaterMl] = useState(1500);
  const waterTargetMl = 2500;
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [waistCm, setWaistCm] = useState("72");
  const [hipsCm, setHipsCm] = useState("95");

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

  // Nutrition Today
  const todayDateStr = todayKey();
  const nutritionToday = nutritionDays.find((d) => d.date === todayDateStr);
  const totalsToday = nutritionToday ? dayTotals(nutritionToday) : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 };
  const targetCals = 2000;
  const remainingCals = Math.max(0, targetCals - totalsToday.calories);

  // RMR & Body Profile
  const rmrData = calculateRmr(userProfile);
  const [weightInput, setWeightInput] = useState(String(userProfile?.weight ?? 65));
  const [workoutsWeekInput, setWorkoutsWeekInput] = useState(String(userProfile?.workoutsPerWeek ?? 4));
  const [showBodyModal, setShowBodyModal] = useState(false);
  const [showCardioModal, setShowCardioModal] = useState(false);

  // Cardio Form State
  const [cardioType, setCardioType] = useState(CARDIO_TYPES[0]!);
  const [cardioDuration, setCardioDuration] = useState("20");
  const [cardioSpeed, setCardioSpeed] = useState("8.0");
  const [cardioIncline, setCardioIncline] = useState("2.0");

  const nextWorkout = workouts[0];
  const nextProgram = nextWorkout
    ? programs.find((p) => p.dayIds.includes(nextWorkout.id))
    : undefined;

  const handleProfileSave = () => {
    const valW = parseFloat(weightInput);
    const valFreq = parseInt(workoutsWeekInput, 10) || 4;
    const w = !isNaN(valW) && valW > 0 ? valW : userProfile?.weight ?? 65;

    saveBodyWeight(w);
    saveUserProfile({
      ...(userProfile ?? { weight: 65, height: 165, age: 26, gender: "female" }),
      weight: w,
      workoutsPerWeek: valFreq,
    });
    setShowBodyModal(false);
  };

  const handleLogCardio = () => {
    const dur = parseInt(cardioDuration, 10) || 0;
    const spd = parseFloat(cardioSpeed) || 0;
    const inc = parseFloat(cardioIncline) || 0;
    const cals = calculateCardioCalories(cardioType, dur, rmrData.weight, spd, inc);

    saveCardioLog({
      date: todayDateStr,
      type: cardioType,
      durationMin: dur,
      speed: spd,
      incline: inc,
      calories: cals,
    });
    setShowCardioModal(false);
  };

  return (
    <AppShell title={formatHebrewDate(now)} subtitle="אימונים ותזונה">
      {/* 1. Next / Today's Workout Focus Card */}
      {nextWorkout ? (
        <div className="ink-card p-5 text-start">
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
        <Card className="text-start">
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

      {/* 2. Habits & Routine Tracker (Water & Measurements) */}
      <section className="mt-5 text-start">
        <SectionHeader title="הרגלים והיקפי גוף" subtitle="מעקב מים והיקפים" />
        <div className="grid grid-cols-2 gap-2.5">
          <div className="surface-card p-3.5 rounded-2xl border border-blue-100 bg-blue-50/40 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900">
                <Droplets className="h-4 w-4 text-blue-600" />
                <span>שתיית מים</span>
              </div>
              <span className="text-[11px] font-bold text-blue-800">{waterMl}/{waterTargetMl} מ״ל</span>
            </div>
            <div className="flex gap-1 pt-1">
              <button
                onClick={() => setWaterMl((w) => Math.min(waterTargetMl, w + 250))}
                className="flex-1 rounded-xl bg-blue-600 py-1 text-[11px] font-bold text-white shadow-xs cursor-pointer"
              >
                +250 מ״ל
              </button>
            </div>
          </div>

          <div
            onClick={() => setShowMeasurementModal(true)}
            className="surface-card p-3.5 rounded-2xl border border-rose-100 bg-rose-50/40 space-y-1.5 cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-rose-900">
                <Ruler className="h-4 w-4 text-rose-600" />
                <span>היקפים (ס״מ)</span>
              </div>
              <span className="text-[11px] font-bold text-rose-800">עדכון</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1">
              מותניים: {waistCm} ס״מ · ירכיים: {hipsCm} ס״מ
            </p>
          </div>
        </div>
      </section>

      {/* 3. Weekly Activity Overview */}
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

      {/* 4. Nutrition Summary Today */}
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

      {/* 5. Body Weight & RMR Calculation Card */}
      <section className="mt-5">
        <SectionHeader
          title="נתוני גוף וחילוף חומרים"
          subtitle="חישוב RMR והוצאה קלורית יומית"
          action={
            <button
              type="button"
              onClick={() => setShowBodyModal(true)}
              className="press rounded-full bg-secondary px-3 py-1.5 text-[12px] font-bold text-primary cursor-pointer"
            >
              עדכני נתונים
            </button>
          }
        />
        <div className="surface-card p-4 text-start">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="num-pill p-3">
              <p className="text-[10.5px] font-bold text-muted-foreground uppercase">משקל גוף</p>
              <p className="mt-1 font-display text-[20px] font-bold tabular-nums text-ink">
                {rmrData.weight} <span className="text-[12px] font-normal">ק״ג</span>
              </p>
            </div>
            <div className="num-pill p-3">
              <p className="text-[10.5px] font-bold text-muted-foreground uppercase">
                RMR (מנוחה)
              </p>
              <p className="mt-1 font-display text-[20px] font-bold tabular-nums text-ink">
                {rmrData.rmr} <span className="text-[12px] font-normal">קל׳</span>
              </p>
            </div>
            <div className="num-pill p-3">
              <p className="text-[10.5px] font-bold text-muted-foreground uppercase">
                יומי (TDEE)
              </p>
              <p className="mt-1 font-display text-[20px] font-bold tabular-nums text-primary">
                {rmrData.tdee} <span className="text-[12px] font-normal">קל׳</span>
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

      {/* Modal: Update Body Weight */}
      {showBodyModal ? (
        <div
          className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={() => setShowBodyModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/80 bg-white p-5 shadow-2xl space-y-3 text-start"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-[18px] font-bold text-ink">
              עדכני משקל ומספר אימונים
            </h3>
            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground">משקל (בק״ג)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-border bg-secondary px-4 py-2.5 text-[15px] font-bold text-ink outline-none"
                />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground">אימונים בשבוע</label>
                <input
                  type="number"
                  min="0"
                  max="14"
                  value={workoutsWeekInput}
                  onChange={(e) => setWorkoutsWeekInput(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-border bg-secondary px-4 py-2.5 text-[15px] font-bold text-ink outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <PrimaryButton onClick={handleProfileSave}>שמרי נתונים</PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
