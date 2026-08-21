import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  Copy,
  Info,
  Minus,
  Pause,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  SkipForward,
  Timer,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stepper } from "@/components/Stepper";
import { ConfirmSheet } from "@/components/ui-app/ConfirmSheet";
import {
  IconButton,
  Pill,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from "@/components/ui-app/primitives";
import { lastPerformance, repLabel, saveSession, uid, useGym } from "@/lib/gym-store";
import type { Exercise, HistoryEntry, LoggedSet, WorkoutItem } from "@/lib/gym-types";

export const Route = createFileRoute("/session/$workoutId")({
  head: () => ({
    meta: [
      { title: "אימון פעיל — הרוטינה שלי" },
      {
        name: "description",
        content: "רשמי סטים, משקלים וחזרות בזמן אמת במהלך האימון.",
      },
      { property: "og:title", content: "אימון פעיל — הרוטינה שלי" },
    ],
  }),
  component: Session,
});

function supersetLabels(items: WorkoutItem[]) {
  const labels: Record<number, string> = {};
  let group = -1;
  let i = 0;
  while (i < items.length) {
    const sid = items[i]?.supersetId;
    if (sid) {
      let j = i;
      const run: number[] = [];
      while (j < items.length && items[j]?.supersetId === sid) {
        run.push(j);
        j += 1;
      }
      if (run.length >= 2) {
        group += 1;
        const letter = String.fromCharCode(65 + (group % 26));
        run.forEach((idx, k) => {
          labels[idx] = `${letter}${k + 1}`;
        });
      }
      i = j;
    } else {
      i += 1;
    }
  }
  return labels;
}

const ACTIVE_SESSION_KEY = (id: string) => `gymtrack.active_session.${id}`;

function Session() {
  const { workoutId } = Route.useParams();
  const navigate = useNavigate();
  const { workouts, exercises, history, programs } = useGym();
  const workout = workouts.find((w) => w.id === workoutId);
  const currentProgram = programs.find((program) => program.dayIds.includes(workoutId));
  const [cardExercise, setCardExercise] = useState<Exercise | null>(null);

  // Exercise replacement modal state
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);
  const [replaceSearch, setReplaceSearch] = useState("");

  const initial = useMemo<HistoryEntry[]>(() => {
    if (!workout) return [];

    // Check for saved active session in localStorage to support seamless resume on refresh
    try {
      const saved = localStorage.getItem(ACTIVE_SESSION_KEY(workoutId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === workout.items.length) {
          return parsed;
        }
      }
    } catch {
      /* ignore */
    }

    return workout.items.map((item) => {
      const ex = exercises.find((e) => e.id === item.exerciseId);
      const last = lastPerformance(history, item.exerciseId);
      const isRange = item.repType === "range";
      const targetReps = isRange ? (item.repMin ?? item.reps) : item.reps;
      const targetRepMax = isRange ? item.repMax : undefined;
      const warmups: LoggedSet[] = (item.warmups ?? []).map((w) => ({
        reps: w.reps,
        weight: w.weight,
        done: false,
        warmup: true,
      }));
      const working: LoggedSet[] = Array.from({ length: item.sets }, (_, i) => ({
        reps: last?.sets[i]?.reps ?? item.workingSets?.[i]?.reps ?? targetReps,
        weight: last?.sets[i]?.weight ?? item.workingSets?.[i]?.weight ?? item.weight,
        done: false,
        targetReps,
        targetRepMax,
        warmup: false,
        dropSet: item.workingSets?.[i]?.dropSet,
      }));
      return {
        exerciseId: item.exerciseId,
        exerciseName: ex?.name ?? "תרגיל שהוסר",
        equipment: ex?.equipment,
        notes: item.notes,
        targetSets: item.sets,
        targetReps,
        targetRepMax,
        repType: item.repType,
        sets: [...warmups, ...working],
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  const [entries, setEntries] = useState<HistoryEntry[]>(initial);
  const [startedAt] = useState(() => Date.now());
  const [rest, setRest] = useState(0);
  const [customRest, setCustomRest] = useState("");
  const [pendingExit, setPendingExit] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setEntries(initial);
  }, [initial]);

  // Continuously save active session progress to survive page refresh or app reopening
  useEffect(() => {
    if (!workoutId || entries.length === 0) return;
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY(workoutId), JSON.stringify(entries));
    } catch {
      /* ignore */
    }
  }, [entries, workoutId]);

  useEffect(() => {
    if (rest <= 0) return;
    timerRef.current = setInterval(() => setRest((r) => Math.max(0, r - 1)), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [rest > 0]);

  if (!workout) {
    return (
      <AppShell title="אימון לא נמצא">
        <p className="surface-card p-5 text-muted-foreground text-start">
          אימון זה אינו קיים עוד בספרייה.
        </p>
      </AppShell>
    );
  }

  const labels = supersetLabels(workout.items);

  const patchSet = (ei: number, si: number, patch: Partial<LoggedSet>) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) } : e,
      ),
    );

  const toggleSetDone = (ei: number, si: number) => {
    const currentSet = entries[ei]?.sets[si];
    if (!currentSet) return;
    const isNowDone = !currentSet.done;
    patchSet(ei, si, { done: isNowDone });

    // Auto trigger rest timer on completing a working set
    if (isNowDone && !currentSet.warmup) {
      const restSec = workout.items[ei]?.rest ?? 60;
      setRest(restSec);
    }
  };

  const copySetValues = (ei: number, si: number) => {
    if (si <= 0) return;
    const prevSet = entries[ei]?.sets[si - 1];
    if (prevSet) {
      patchSet(ei, si, { weight: prevSet.weight, reps: prevSet.reps });
    }
  };

  const replaceExercise = (ei: number, newEx: Exercise) => {
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei
          ? {
              ...e,
              exerciseId: newEx.id,
              exerciseName: newEx.name,
              equipment: newEx.equipment,
            }
          : e,
      ),
    );
    setReplacingIndex(null);
    setReplaceSearch("");
  };

  const clearSavedSession = () => {
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY(workout.id));
    } catch {
      /* ignore */
    }
  };

  const totalSets = entries.reduce((a, e) => a + e.sets.filter((s) => !s.warmup).length, 0);
  const doneSets = entries.reduce(
    (a, e) => a + e.sets.filter((s) => s.done && !s.warmup).length,
    0,
  );

  const finish = () => {
    saveSession({
      id: uid(),
      workoutId: workout.id,
      workoutName: workout.name,
      programName: currentProgram?.name,
      date: new Date().toISOString(),
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      entries: entries.map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) })),
    });
    clearSavedSession();
    navigate({ to: "/programs" });
  };

  const progress = totalSets ? (doneSets / totalSets) * 100 : 0;

  const filteredExercisesForReplace = exercises.filter(
    (ex) =>
      ex.name.toLowerCase().includes(replaceSearch.toLowerCase()) ||
      ex.muscleGroup.toLowerCase().includes(replaceSearch.toLowerCase()) ||
      (ex.equipment && ex.equipment.toLowerCase().includes(replaceSearch.toLowerCase())),
  );

  return (
    <AppShell
      kicker={currentProgram?.name ?? "אימון"}
      title={workout.name}
      subtitle={`${doneSets} מתוך ${totalSets} סטים · בהצלחה!`}
      action={
        <IconButton aria-label="יציאה מהאימון" onClick={() => setPendingExit(true)}>
          <X className="h-5 w-5" />
        </IconButton>
      }
    >
      {/* Progress bar */}
      <div className="surface-card flex items-center gap-3 px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
          <Play className="h-3.5 w-3.5 fill-current" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
              התקדמות אימון
            </p>
            <p className="text-[11.5px] font-semibold tabular-nums text-ink">
              {Math.round(progress)}%
            </p>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {entries.map((entry, ei) => {
          const item = workout.items[ei];
          const last = lastPerformance(history, entry.exerciseId);
          const targetLabel = item ? repLabel(item) : String(entry.targetReps ?? "");
          const supersetLabel = labels[ei];
          const fullExercise = exercises.find((e) => e.id === entry.exerciseId);
          const workingCount = entry.sets.filter((s) => !s.warmup).length;
          const doneCount = entry.sets.filter((s) => s.done && !s.warmup).length;
          return (
            <article
              key={`${entry.exerciseId}-${ei}`}
              className={`surface-card p-4 ${supersetLabel ? "border-s-4 border-s-primary rounded-s-none" : ""}`}
            >
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => fullExercise && setCardExercise(fullExercise)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-soft text-primary press"
                  aria-label={`פתח פרטי ${entry.exerciseName}`}
                >
                  <Info className="h-4 w-4" strokeWidth={2} />
                </button>
                <div className="min-w-0 flex-1 text-start">
                  <div className="flex items-center gap-2">
                    {supersetLabel ? (
                      <span className="shrink-0 rounded-lg bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">
                        {supersetLabel}
                      </span>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => fullExercise && setCardExercise(fullExercise)}
                      className="min-w-0 truncate text-start font-display text-[15.5px] font-semibold text-ink hover:text-primary"
                    >
                      {entry.exerciseName}
                    </button>
                  </div>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {entry.equipment ? `${entry.equipment} · ` : ""}
                    {entry.targetSets ?? workingCount}× {targetLabel} חזרות
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setReplacingIndex(ei)}
                    className="press grid h-9 w-9 place-items-center rounded-full bg-secondary text-muted-foreground hover:text-primary"
                    title="החליפי תרגיל"
                    aria-label="החליפי תרגיל"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRest(item?.rest ?? 60)}
                    className="press flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-2 text-[12px] font-semibold text-ink"
                    aria-label="התחל מנוחה"
                  >
                    <Timer className="h-3.5 w-3.5 text-primary" />
                    {item?.rest ?? 60}ש׳
                  </button>
                </div>
              </div>

              {entry.notes ? (
                <p className="mt-3 rounded-2xl bg-secondary/70 px-3 py-2 text-[12.5px] text-muted-foreground text-start">
                  {entry.notes}
                </p>
              ) : null}

              {last ? (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 text-start">
                  <span className="text-[10.5px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                    אימון קודם
                  </span>
                  {last.sets.slice(0, 5).map((s, i) => (
                    <span
                      key={i}
                      className="num-pill px-2 py-0.5 text-[11.5px] tabular-nums text-ink-soft"
                      dir="ltr"
                    >
                      {s.weight}kg × {s.reps}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 space-y-2">
                {entry.sets.map((s, si) => {
                  const workingIndex = entry.sets.slice(0, si + 1).filter((x) => !x.warmup).length;
                  return (
                    <div
                      key={si}
                      className={`rounded-2xl border p-3 transition-all ${
                        s.done
                          ? "border-primary bg-primary/10 shadow-sm"
                          : s.warmup
                            ? "border-dashed border-border bg-secondary/40"
                            : "border-border/60 bg-secondary/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`grid h-7 w-7 place-items-center rounded-lg text-[11px] font-bold ${
                            s.warmup
                              ? "bg-secondary text-muted-foreground"
                              : s.done
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/15 text-primary"
                          }`}
                        >
                          {s.warmup ? "W" : workingIndex}
                        </span>
                        <div className="min-w-0 flex-1 text-start">
                          <p className="truncate text-[12.5px] font-semibold text-ink">
                            {s.warmup ? "סט חימום" : s.dropSet ? "Drop Set" : `סט ${workingIndex}`}
                            {s.targetRepMax ? (
                              <span className="ms-1 text-[11px] font-normal text-muted-foreground">
                                · יעד {s.targetReps}-{s.targetRepMax}
                              </span>
                            ) : s.targetReps ? (
                              <span className="ms-1 text-[11px] font-normal text-muted-foreground">
                                · יעד {s.targetReps}
                              </span>
                            ) : null}
                          </p>
                        </div>

                        {si > 0 ? (
                          <button
                            type="button"
                            onClick={() => copySetValues(ei, si)}
                            className="press flex items-center gap-1 rounded-xl bg-secondary px-2 py-1 text-[11px] font-medium text-muted-foreground hover:text-ink"
                            title="העתק משקל וחזרות מסט קודם"
                          >
                            <Copy className="h-3 w-3" />
                            <span className="hidden sm:inline">העתקי</span>
                          </button>
                        ) : null}

                        {!s.warmup ? (
                          <button
                            type="button"
                            onClick={() => toggleSetDone(ei, si)}
                            className={`press grid h-11 w-11 place-items-center rounded-2xl text-[13px] font-bold transition-colors ${
                              s.done
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                            }`}
                            aria-label={s.done ? "בטל סיום סט" : "סמן סט כבוצע"}
                          >
                            <Check className="h-5 w-5" strokeWidth={2.6} />
                          </button>
                        ) : null}
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        <Stepper
                          label="משקל"
                          value={s.weight}
                          step={2.5}
                          suffix="ק״ג"
                          onChange={(v) => patchSet(ei, si, { weight: v })}
                        />
                        <Stepper
                          label="חזרות בפועל"
                          value={s.reps}
                          min={0}
                          onChange={(v) => patchSet(ei, si, { reps: v })}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setEntries((prev) =>
                      prev.map((e, i) =>
                        i === ei
                          ? {
                              ...e,
                              sets: [
                                ...e.sets,
                                {
                                  reps: e.sets[e.sets.length - 1]?.reps ?? 10,
                                  weight: e.sets[e.sets.length - 1]?.weight ?? 20,
                                  done: false,
                                  targetReps: e.targetReps,
                                  targetRepMax: e.targetRepMax,
                                  warmup: false,
                                },
                              ],
                            }
                          : e,
                      ),
                    )
                  }
                  className="press flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-secondary text-[12.5px] font-semibold text-ink"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.2} />
                  הוסף סט
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setEntries((prev) =>
                      prev.map((e, i) =>
                        i === ei
                          ? {
                              ...e,
                              sets: [
                                ...e.sets,
                                {
                                  reps: e.sets[e.sets.length - 1]?.reps ?? 10,
                                  weight: Math.max(
                                    0,
                                    Math.round(
                                      (e.sets[e.sets.length - 1]?.weight ?? 20) * 0.8 * 2,
                                    ) / 2,
                                  ),
                                  done: false,
                                  targetReps: e.targetReps,
                                  targetRepMax: e.targetRepMax,
                                  warmup: false,
                                  dropSet: true,
                                },
                              ],
                            }
                          : e,
                      ),
                    )
                  }
                  className="press flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-primary/12 text-[12.5px] font-semibold text-primary"
                >
                  <Plus className="h-4 w-4" strokeWidth={2.2} />
                  הוסף דרופ סט
                </button>
              </div>

              {doneCount > 0 && doneCount < workingCount ? (
                <p className="mt-2 text-[11px] font-medium text-muted-foreground text-start">
                  {doneCount}/{workingCount} הושלמו
                </p>
              ) : doneCount === workingCount && workingCount > 0 ? (
                <p className="mt-2 text-[11px] font-semibold text-primary text-start">
                  ✓ כל הסטים הושלמו
                </p>
              ) : null}
            </article>
          );
        })}
      </div>

      <div className="mt-6">
        <PrimaryButton onClick={finish} leading={<Check className="h-4 w-4" strokeWidth={2.4} />}>
          סיים ושמור אימון
        </PrimaryButton>
      </div>

      {/* Floating Rest Timer Bar with +/- 15s Controls and Skip */}
      {rest > 0 ? (
        <div
          className="scale-in fixed inset-x-0 z-40 mx-auto max-w-xl px-4"
          style={{ bottom: "calc(5.5rem + env(safe-area-inset-bottom))" }}
        >
          <div className="ink-card flex items-center gap-2 p-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/15">
              <Timer className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0 text-start">
              <p className="text-[10px] font-semibold tracking-[0.14em] text-primary-foreground/80 uppercase">
                זמן מנוחה
              </p>
              <p className="font-display text-[20px] font-semibold tabular-nums text-primary-foreground">
                {Math.floor(rest / 60)}:{String(rest % 60).padStart(2, "0")}
              </p>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setRest((r) => Math.max(0, r - 15))}
                className="press rounded-xl bg-white/15 px-2.5 py-1.5 text-[12px] font-bold text-primary-foreground hover:bg-white/25"
                title="-15 שניות"
              >
                -15ש׳
              </button>
              <button
                type="button"
                onClick={() => setRest((r) => r + 15)}
                className="press rounded-xl bg-white/15 px-2.5 py-1.5 text-[12px] font-bold text-primary-foreground hover:bg-white/25"
                title="+15 שניות"
              >
                +15ש׳
              </button>
              <button
                type="button"
                onClick={() => setRest(0)}
                className="press flex items-center gap-1 rounded-xl bg-white/20 px-3 py-1.5 text-[12px] font-bold text-primary-foreground hover:bg-white/30"
                title="סלג/דלגי"
              >
                <SkipForward className="h-3.5 w-3.5 fill-current" />
                <span>דילוג</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Custom rest input */}
      <div className="mt-4 flex items-center gap-2 rounded-2xl bg-secondary px-3 py-2.5">
        <Timer className="h-4 w-4 text-primary" />
        <input
          inputMode="numeric"
          value={customRest}
          onChange={(e) => setCustomRest(e.target.value.replace(/\D/g, ""))}
          placeholder="מנוחה מותאמת (שניות)..."
          className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => {
            const seconds = Number(customRest);
            if (seconds > 0) setRest(seconds);
          }}
          className="press rounded-full bg-primary px-3 py-1.5 text-[12px] font-semibold text-primary-foreground"
        >
          התחל
        </button>
      </div>

      {/* Exercise detail sheet */}
      {cardExercise ? (
        <div
          className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm"
          onClick={() => setCardExercise(null)}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div
            className="scale-in max-h-[88dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] border-t border-border/40 bg-card p-5 text-start shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex items-start gap-3">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-sage-soft text-primary">
                <Info className="h-5 w-5" strokeWidth={1.8} />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-[20px] font-semibold leading-tight text-ink">
                  {cardExercise.name}
                </h2>
                <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                  {cardExercise.equipment}
                  {cardExercise.muscleGroup ? ` · ${cardExercise.muscleGroup}` : ""}
                </p>
              </div>
              <IconButton aria-label="סגור" onClick={() => setCardExercise(null)} variant="ghost">
                <X className="h-5 w-5" />
              </IconButton>
            </div>

            {cardExercise.description ? (
              <div className="mt-4 rounded-2xl bg-secondary p-3.5">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  תיאור
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                  {cardExercise.description}
                </p>
              </div>
            ) : null}

            {cardExercise.instructions ? (
              <div className="mt-3 rounded-2xl bg-secondary p-3.5">
                <p className="text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                  הוראות ביצוע
                </p>
                <p className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-ink">
                  {cardExercise.instructions}
                </p>
              </div>
            ) : null}

            {cardExercise.videoUrl ? (
              <a
                href={cardExercise.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="press mt-3 flex items-center justify-center gap-2 rounded-2xl bg-secondary p-3.5 text-[13px] font-semibold text-primary"
              >
                <ChevronLeft className="h-4 w-4" />
                צפי בסרטון טכניקה
              </a>
            ) : null}

            <Link
              to="/exercises/$exerciseId"
              params={{ exerciseId: cardExercise.id }}
              onClick={() => setCardExercise(null)}
              className="press mt-4 flex h-12 w-full items-center justify-center rounded-2xl bg-primary text-[14px] font-semibold text-primary-foreground"
            >
              פתח עמוד תרגיל מלא
            </Link>
          </div>
        </div>
      ) : null}

      {/* Replace Exercise Modal */}
      {replacingIndex !== null ? (
        <div
          className="fade-in fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 backdrop-blur-sm"
          onClick={() => setReplacingIndex(null)}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <div
            className="scale-in max-h-[85dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] border-t border-border/40 bg-card p-5 text-start shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex items-center justify-between">
              <h2 className="font-display text-[18px] font-bold text-ink">
                החליפי תרגיל במקום: {entries[replacingIndex]?.exerciseName}
              </h2>
              <IconButton
                aria-label="סגור"
                onClick={() => setReplacingIndex(null)}
                variant="ghost"
              >
                <X className="h-5 w-5" />
              </IconButton>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-secondary px-3.5 py-2.5">
              <Search className="h-4 w-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                value={replaceSearch}
                onChange={(e) => setReplaceSearch(e.target.value)}
                placeholder="חפשי תרגיל חלופי..."
                className="min-w-0 flex-1 bg-transparent text-[13.5px] outline-none placeholder:text-muted-foreground"
              />
            </div>

            <div className="mt-4 space-y-2 pb-6">
              {filteredExercisesForReplace.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => replaceExercise(replacingIndex, ex)}
                  className="press flex w-full items-center justify-between rounded-2xl bg-secondary p-3.5 text-start hover:bg-secondary/80"
                >
                  <div>
                    <p className="font-semibold text-ink text-[14px]">{ex.name}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {ex.muscleGroup} {ex.equipment ? `· ${ex.equipment}` : ""}
                    </p>
                  </div>
                  <span className="rounded-xl bg-primary/10 px-2.5 py-1 text-[12px] font-semibold text-primary">
                    בחר
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmSheet
        open={pendingExit}
        title="לצאת מהאימון?"
        description="הסטים שתיעדת עד כה יישמרו רק אם לא תנקי את הנתונים, אך לא יישמרו בהיסטוריית האימונים הסופית."
        confirmLabel="צאי בלי לשמור"
        cancelLabel="המשיכי באימון"
        destructive
        onConfirm={() => {
          clearSavedSession();
          setPendingExit(false);
          navigate({ to: "/programs" });
        }}
        onCancel={() => setPendingExit(false)}
      />
    </AppShell>
  );
}

void Pill;
void SecondaryButton;
void SectionHeader;
