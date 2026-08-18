import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Copy, Flame, Plus, Timer, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stepper } from "@/components/Stepper";
import { lastPerformance, repLabel, saveSession, uid, useGym } from "@/lib/gym-store";
import type { HistoryEntry, LoggedSet, WorkoutItem } from "@/lib/gym-types";

export const Route = createFileRoute("/session/$workoutId")({
  head: () => ({
    meta: [
      { title: "Active Workout — GymTrack" },
      {
        name: "description",
        content: "Log sets, adjust weight and reps live, and rest between sets.",
      },
      { property: "og:title", content: "Active Workout — GymTrack" },
      {
        property: "og:description",
        content: "Log sets, adjust weight and reps live, and rest between sets.",
      },
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
        exerciseName: ex?.name ?? "Removed exercise",
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
      <AppShell title="Not found">
        <p className="surface-card p-5 text-muted-foreground">
          This workout no longer exists.
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
      subtitle={`${doneSets}/${totalSets} working sets completed`}
      action={
        <Link
          to="/programs"
          aria-label="Quit workout"
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

      <div className="mt-5 space-y-4">
        {entries.map((entry, ei) => {
          const item = workout.items[ei];
          const last = lastPerformance(history, entry.exerciseId);
          const targetLabel = item ? repLabel(item) : String(entry.targetReps ?? "");
          const supersetLabel = labels[ei];
          return (
            <div key={`${entry.exerciseId}-${ei}`} className={`surface-card p-4 ${supersetLabel ? "border-l-4 border-l-primary/60" : ""}`}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {supersetLabel ? <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">{supersetLabel}</span> : null}
                    <Link
                      to="/exercises/$exerciseId"
                      params={{ exerciseId: entry.exerciseId }}
                      className="truncate font-semibold underline-offset-4 hover:underline"
                    >
                      {entry.exerciseName}
                    </Link>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {entry.equipment ? `${entry.equipment} · ` : ""}
                    {entry.targetSets ?? entry.sets.filter((s) => !s.warmup).length} × {targetLabel} reps
                  </p>
                </div>
                <span className="num-pill shrink-0 px-2.5 py-1 text-xs text-muted-foreground">
                  rest {item?.rest ?? 60}s
                </span>
              </div>

              {entry.notes ? (
                <p className="mt-2 rounded-lg bg-secondary/70 px-3 py-2 text-sm text-muted-foreground">{entry.notes}</p>
              ) : null}

              {last ? (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Last</span>
                  {last.sets.slice(0, 5).map((s, i) => (
                    <span key={i} className="rounded-md bg-secondary px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                      {s.weight}×{s.reps}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="mt-3 space-y-3">
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
                            <><Flame className="h-3.5 w-3.5 text-primary" /> Warm-up</>
                          ) : (
                            <>Set #{workingIndex}{s.dropSet ? " · Drop set" : ""}
                              {s.targetReps != null ? (
                                <span className="font-normal text-muted-foreground/70">
                                  · target {s.targetRepMax != null ? `${s.targetReps}–${s.targetRepMax}` : s.targetReps}
                                </span>
                              ) : null}
                            </>
                          )}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {si > 0 ? (
                            <button
                              aria-label={`Copy weight from previous set`}
                              onClick={() => patchSet(ei, si, { weight: entry.sets[si - 1]!.weight })}
                              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-background text-muted-foreground active:scale-95"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                          ) : null}
                          <button
                            aria-label={`Complete set ${si + 1}`}
                            onClick={() => {
                              patchSet(ei, si, { done: !s.done });
                              if (!s.done && !s.warmup) setRest(item?.rest ?? 60);
                            }}
                            className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                              s.done
                                ? "bg-primary text-primary-foreground"
                                : "bg-background text-muted-foreground"
                            }`}
                          >
                            <Check className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                      <div className="grid min-w-0 grid-cols-2 gap-2">
                        <Stepper
                          label="Weight"
                          value={s.weight}
                          step={2.5}
                          suffix="kg"
                          onChange={(v) => patchSet(ei, si, { weight: v })}
                        />
                        <Stepper
                          label="Reps"
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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold"
              >
                <Plus className="h-4 w-4" /> Add set
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
                                weight: Math.max(0, (e.sets[e.sets.length - 1]?.weight ?? 20) * 0.8),
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
                className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary/10 text-sm font-semibold text-primary"
              >
                <Plus className="h-4 w-4" /> Add drop set
              </button>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={finish}
        className="mt-5 h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground active:scale-[0.98]"
      >
        Finish & save workout
      </button>

      {rest > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto max-w-2xl rounded-2xl border border-border bg-card px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <Timer className="h-5 w-5 shrink-0 text-primary" />
            <p className="flex-1 text-lg font-semibold tabular-nums">{rest}s rest</p>
            <button
              onClick={() => setRest(0)}
              className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium"
            >
              Skip
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 overflow-x-auto">
            {[30, 60, 90, 120].map((seconds) => (
              <button
                key={seconds}
                type="button"
                onClick={() => setRest(seconds)}
                className="shrink-0 rounded-lg bg-secondary px-3 py-2 text-xs font-semibold"
              >
                {seconds}s
              </button>
            ))}
            <input
              inputMode="numeric"
              aria-label="Custom rest seconds"
              value={customRest}
              onChange={(event) => setCustomRest(event.target.value.replace(/\D/g, ""))}
              placeholder="Custom"
              className="h-9 w-20 shrink-0 rounded-lg border border-border bg-background px-2 text-center text-xs outline-none focus:border-primary"
            />
            <button
              type="button"
              onClick={() => {
                const seconds = Number(customRest);
                if (seconds > 0) setRest(seconds);
              }}
              className="shrink-0 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground"
            >
              Start
            </button>
          </div>
        </div>
      )}
    </AppShell>
  );
}
