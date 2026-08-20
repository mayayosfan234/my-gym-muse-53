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

  // Weekly Activity calculation
  const startOfWeek = new Date(now);
  const dow = (now.getDay() + 6) % 7; // Sunday = 0
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

  // Next Workout selection
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
              className="press inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-2xl bg-white px-4 text-[14px] font-bold text-ink shadow-sm"
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
              className="press grid h-11 w-11 place-items-center rounded-2xl bg-white/15 text-primary-foreground"
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

      {/* 2. Weekly Activity Overview */}
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

      {/* 3. Nutrition Summary Today */}
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

      {/* 4. Body Weight & RMR Calculation Card */}
      <section className="mt-5">
        <SectionHeader
          title="נתוני גוף וחילוף חומרים"
          subtitle="חישוב RMR והוצאה קלורית יומית"
          action={
            <button
              type="button"
              onClick={() => setShowBodyModal(true)}
              className="press rounded-full bg-secondary px-3 py-1.5 text-[12px] font-bold text-primary"
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
          <p className="mt-2.5 text-[11.5px] text-muted-foreground">
            * RMR מציג את השריפה הקלורית של הגוף במנוחה מוחלטת. הוצאה יומית (TDEE) מחושבת לפי {userProfile?.workoutsPerWeek ?? 4} אימונים בשבוע.
          </p>
        </div>
      </section>

      {/* 5. Cardio Quick Log */}
      <section className="mt-5">
        <SectionHeader
          title="אימון אירובי (אירובי / הליכון)"
          subtitle="תיעוד הליכה, ריצה או מכשירים"
          action={
            <button
              type="button"
              onClick={() => setShowCardioModal(true)}
              className="press inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-primary-foreground"
            >
              <Plus className="h-3.5 w-3.5" /> אירובי חדש
            </button>
          }
        />
        {cardioLogs && cardioLogs.length > 0 ? (
          <div className="space-y-2">
            {cardioLogs.slice(0, 2).map((log) => (
              <div
                key={log.id}
                className="surface-card flex items-center justify-between p-3.5 text-start"
              >
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                    <Footprints className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-display text-[14.5px] font-bold text-ink">{log.type}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {log.durationMin} דק׳ {log.speed ? `· ${log.speed} קמ״ש` : ""}
                      {log.incline ? ` · שיפוע ${log.incline}%` : ""}
                    </p>
                  </div>
                </div>
                <span className="num-pill px-2.5 py-1 text-[12px] font-bold text-primary">
                  ~{log.calories} קלוריות
                </span>
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-start">
            <p className="text-[13px] text-muted-foreground">
              עדיין לא תועד אימון אירובי היום. לחצי על &quot;אירובי חדש&quot; להוספת הליכון או
              ריצה.
            </p>
          </Card>
        )}
      </section>

      {/* Modal: Update Body Weight & Workouts Per Week */}
      {showBodyModal ? (
        <div
          className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 pb-24"
          onClick={() => setShowBodyModal(false)}
        >
          <div
            className="scale-in w-full max-w-lg rounded-3xl border border-border bg-card p-5 text-start shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-bold tracking-wider text-primary uppercase">
              עדכון נתוני גוף ופעילות
            </p>
            <h3 className="mt-1 font-display text-[20px] font-bold text-ink">
              עדכני משקל ומספר אימונים
            </h3>
            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground">משקל (בק״ג)</label>
                <input
                  type="number"
                  step="0.1"
                  value={weightInput}
                  onChange={(e) => setWeightInput(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-[17px] font-bold text-ink outline-none focus:border-primary"
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
                  className="mt-1 w-full rounded-2xl border border-border bg-secondary px-4 py-3 text-[17px] font-bold text-ink outline-none focus:border-primary"
                />
              </div>
            </div>
            <div className="mt-5 flex gap-2">
              <PrimaryButton onClick={handleProfileSave}>שמרי נתונים</PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}

      {/* Modal: Quick Cardio Log */}
      {showCardioModal ? (
        <div
          className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 pb-24"
          onClick={() => setShowCardioModal(false)}
        >
          <div
            className="scale-in max-h-[80dvh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-5 text-start shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[11px] font-bold tracking-wider text-primary uppercase">
              תיעוד אירובי
            </p>
            <h3 className="mt-1 font-display text-[20px] font-bold text-ink">הוסיפי פעילות אירובית</h3>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-muted-foreground">סוג הפעילות</label>
                <select
                  value={cardioType}
                  onChange={(e) => setCardioType(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-border bg-secondary px-3.5 py-3 text-[14.5px] font-bold text-ink outline-none"
                >
                  {CARDIO_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground">זמן (בדקות)</label>
                  <input
                    type="number"
                    value={cardioDuration}
                    onChange={(e) => setCardioDuration(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-border bg-secondary px-3.5 py-2.5 text-[15px] font-bold text-ink outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-muted-foreground">מהירות (קמ״ש)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={cardioSpeed}
                    onChange={(e) => setCardioSpeed(e.target.value)}
                    className="mt-1 w-full rounded-2xl border border-border bg-secondary px-3.5 py-2.5 text-[15px] font-bold text-ink outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-muted-foreground">שיפוע הליכון (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={cardioIncline}
                  onChange={(e) => setCardioIncline(e.target.value)}
                  className="mt-1 w-full rounded-2xl border border-border bg-secondary px-3.5 py-2.5 text-[15px] font-bold text-ink outline-none"
                />
              </div>

              <div className="rounded-2xl bg-secondary p-3 text-center">
                <p className="text-[11px] font-bold text-muted-foreground">הערכת שריפה קלורית</p>
                <p className="mt-0.5 font-display text-[22px] font-bold tabular-nums text-primary">
                  ~
                  {calculateCardioCalories(
                    cardioType,
                    parseInt(cardioDuration, 10) || 0,
                    rmrData.weight,
                    parseFloat(cardioSpeed) || 0,
                    parseFloat(cardioIncline) || 0,
                  )}{" "}
                  קלוריות
                </p>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <PrimaryButton onClick={handleLogCardio}>שמרי אימון אירובי</PrimaryButton>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
