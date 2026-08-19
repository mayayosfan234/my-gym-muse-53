import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Copy, Flame, Plus, Timer, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stepper } from "@/components/Stepper";
import { lastPerformance, repLabel, saveSession, uid, useGym } from "@/lib/gym-store";
import type { Exercise, HistoryEntry, LoggedSet, WorkoutItem } from "@/lib/gym-types";

export const Route = createFileRoute("/session/$workoutId")({
  head: () => ({
    meta: [
      { title: "אימון פעיל — הרוטינה שלי" },
      {
        name: "description",
        content: "רשום סטים, משקלים וחזרות בזמן אמת במהלך האימון.",
      },
      { property: "og:title", content: "אימון פעיל — הרוטינה שלי" },
    ],
  }),
  component: Session,
});

/** Assign A1/A2… labels to adjacent items sharing a supersetId. */
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

function Session() {
  const { workoutId } = Route.useParams();
  const navigate = useNavigate();
  const { workouts, exercises, history, programs } = useGym();
  const workout = workouts.find((w) => w.id === workoutId);
  const currentProgram = programs.find((program) => program.dayIds.includes(workoutId));
  const [cardExercise, setCardExercise] = useState<Exercise | null>(null);

  const initial = useMemo<HistoryEntry[]>(() => {
    if (!workout) return [];
    return workout.items.map((item) => {
      const ex = exercises.find((e) => e.id === item.exerciseId);
      const last = lastPerformance(history, item.exerciseId);
      const isRange = item.repType === "range";
      const targetReps = isRange ? item.repMin ?? item.reps : item.reps;
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => setEntries(initial), [initial]);

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
        i === ei
          ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) }
          : e,
      ),
    );

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
    navigate({ to: "/history" });
  };

  return (
    <AppShell
      title={workout.name}
      subtitle={`הושלמו ${doneSets} מתוך ${totalSets} סטים`}
      action={
        <Link
          to="/programs"
          aria-label="יציאה מהאימון"
          className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
        >
          <X className="h-5 w-5" />
        </Link>
      }
    >
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${totalSets ? (doneSets / totalSets) * 100 : 0}%` }}
        />
      </div>

      <div className="mt-4 space-y-4 text-start">
        {entries.map((entry, ei) => {
          const item = workout.items[ei];
          const last = lastPerformance(history, entry.exerciseId);
          const targetLabel = item ? repLabel(item) : String(entry.targetReps ?? "");
          const supersetLabel = labels[ei];
          const fullExercise = exercises.find((e) => e.id === entry.exerciseId);
          return (
            <div key={`${entry.exerciseId}-${ei}`} className={`surface-card p-4 ${supersetLabel ? "border-r-4 border-r-primary/70" : ""}`}>
              <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {supersetLabel ? <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">{supersetLabel}</span> : null}
                    <button
                      type="button"
                      onClick={() => fullExercise && setCardExercise(fullExercise)}
                      className="truncate text-start font-semibold text-foreground underline-offset-4 hover:underline cursor-pointer"
                    >
                      {entry.exerciseName}
                    </button>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {entry.equipment ? `${entry.equipment} · ` : ""}
                    {entry.targetSets ?? entry.sets.filter((s) => !s.warmup).length} × {targetLabel} חזרות
                  </p>
                </div>
                <span className="num-pill shrink-0 px-2.5 py-1 text-xs text-muted-foreground">
                  מנוחה {item?.rest ?? 60} ש׳
                </span>
              </div>

              {entry.notes ? (
                <p className="mt-2 rounded-lg bg-secondary/70 px-3 py-2 text-xs sm:text-sm text-muted-foreground">{entry.notes}</p>
              ) : null}

              {last ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">אימון קודם</span>
                  {last.sets.slice(0, 5).map((s, i) => (
                    <span key={i} className="rounded-md bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground" dir="ltr">
                      {s.weight}kg × {s.reps}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 space-y-2.5">
                {entry.sets.map((s, si) => {
                  const workingIndex = entry.sets.slice(0, si + 1).filter((x) => !x.warmup).length;
                  return (
                    <div
                      key={si}
                      className={`rounded-xl border p-3 transition-colors ${
                        s.done
                          ? "border-primary bg-primary/10"
                          : s.warmup
                            ? "border-dashed border-border bg-secondary/40"
                            : "border-border bg-secondary"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          {s.warmup ? (
                            <><Flame className="h-3.5 w-3.5 text-primary" /> סט חימום</>
                          ) : (
                            <>סט #{workingIndex}{s.dropSet ? " · דרופ סט" : ""}
                              {s.targetReps != null ? (
                                <span className="font-normal text-muted-foreground/70 ms-1">
                                  (מטרה: {s.targetRepMax != null ? `${s.targetReps}–${s.targetRepMax}` : s.targetReps})
                                </span>
                              ) : null}
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {si > 0 ? (
                            <button
                              type="button"
                              aria-label="העתק משקל מסט קודם"
                              onClick={() => patchSet(ei, si, { weight: entry.sets[si - 1]!.weight })}
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground active:scale-95"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            aria-label={`סמן סט ${si + 1}`}
                            onClick={() => {
                              patchSet(ei, si, { done: !s.done });
                              if (!s.done && !s.warmup) setRest(item?.rest ?? 60);
                            }}
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg transition-transform active:scale-95 ${
                              s.done
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "bg-background text-muted-foreground border border-border"
                            }`}
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid min-w-0 grid-cols-2 gap-2">
                        <Stepper
                          label="משקל בפועל"
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
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-secondary text-xs font-semibold text-foreground"
                >
                  <Plus className="h-4 w-4" /> הוסף סט
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
                                  weight: Math.max(0, Math.round(((e.sets[e.sets.length - 1]?.weight ?? 20) * 0.8) * 2) / 2),
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
                  className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-primary/10 text-xs font-semibold text-primary"
                >
                  <Plus className="h-4 w-4" /> הוסף דרופ סט
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={finish}
        className="mt-6 h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground active:scale-[0.98] shadow-md"
      >
        סיים ושמור אימון
      </button>

      {/* Timer Overlay */}
      {rest > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-lg px-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-xl">
            <div className="flex items-center gap-3">
              <Timer className="h-5 w-5 shrink-0 text-primary" />
              <p className="flex-1 text-lg font-bold tabular-nums text-foreground">{rest} שניות מנוחה</p>
              <button
                type="button"
                onClick={() => setRest(0)}
                className="rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-foreground"
              >
                דלג
              </button>
            </div>
            <div className="mt-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
              {[30, 60, 90, 120].map((seconds) => (
                <button
                  key={seconds}
                  type="button"
                  onClick={() => setRest(seconds)}
                  className="shrink-0 rounded-lg bg-secondary px-3 py-1.5 text-xs font-semibold text-muted-foreground"
                >
                  {seconds}ש׳
                </button>
              ))}
              <input
                inputMode="numeric"
                aria-label="שניות מנוחה מותאמות אישית"
                value={customRest}
                onChange={(event) => setCustomRest(event.target.value.replace(/\D/g, ""))}
                placeholder="אישי"
                className="h-8 w-16 shrink-0 rounded-lg border border-border bg-background px-2 text-center text-xs outline-none focus:border-primary"
              />
              <button
                type="button"
                onClick={() => {
                  const seconds = Number(customRest);
                  if (seconds > 0) setRest(seconds);
                }}
                className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
              >
                התחל
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exercise Details Card Modal */}
      {cardExercise ? (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-foreground/30 backdrop-blur-sm"
          onClick={() => setCardExercise(null)}
        >
          <div
            className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 text-start"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="section-kicker">כרטיס תרגיל</p>
                <h2 className="font-display text-xl font-semibold text-foreground">{cardExercise.name}</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {cardExercise.muscleGroup}
                  {cardExercise.equipment ? ` · ${cardExercise.equipment}` : ""}
                </p>
              </div>
              <button
                type="button"
                aria-label="סגור"
                onClick={() => setCardExercise(null)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {(cardExercise.secondaryMuscles ?? []).length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {cardExercise.secondaryMuscles!.map((m) => (
                  <span key={m} className="rounded-full bg-secondary px-2.5 py-1 text-xs text-muted-foreground">{m}</span>
                ))}
              </div>
            ) : null}

            {cardExercise.tips ? (
              <div className="mb-3 rounded-xl bg-primary/10 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">דגשים וביצוע</p>
                <p className="mt-1 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground">{cardExercise.tips}</p>
              </div>
            ) : null}

            {cardExercise.notes ? (
              <div className="mb-3 rounded-xl bg-secondary p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">הערות אישיות</p>
                <p className="mt-1 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground">{cardExercise.notes}</p>
              </div>
            ) : null}

            {cardExercise.description ? (
              <div className="mb-3 rounded-xl border border-border p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">תיאור התרגיל</p>
                <p className="mt-1 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground">{cardExercise.description}</p>
              </div>
            ) : null}

            {cardExercise.instructions ? (
              <div className="mb-3 rounded-xl border border-border p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">הוראות ביצוע</p>
                <p className="mt-1 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground">{cardExercise.instructions}</p>
              </div>
            ) : null}

            {cardExercise.videoUrl ? (
              <a
                href={cardExercise.videoUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-3 block rounded-xl bg-secondary p-3 text-xs sm:text-sm font-semibold text-primary"
              >
                צפה בסרטון טכניקה
              </a>
            ) : null}

            <Link
              to="/exercises/$exerciseId"
              params={{ exerciseId: cardExercise.id }}
              className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-primary font-semibold text-primary-foreground"
            >
              פתח עמוד תרגיל מלא
            </Link>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
