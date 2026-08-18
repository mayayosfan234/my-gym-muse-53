import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Plus, Timer, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stepper } from "@/components/Stepper";
import { lastPerformance, saveSession, uid, useGym } from "@/lib/gym-store";
import type { HistoryEntry } from "@/lib/gym-types";

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

function Session() {
  const { workoutId } = Route.useParams();
  const navigate = useNavigate();
  const { workouts, exercises, history } = useGym();
  const workout = workouts.find((w) => w.id === workoutId);

  const initial = useMemo<HistoryEntry[]>(() => {
    if (!workout) return [];
    return workout.items.map((item) => {
      const ex = exercises.find((e) => e.id === item.exerciseId);
      const last = lastPerformance(history, item.exerciseId);
      return {
        exerciseId: item.exerciseId,
        exerciseName: ex?.name ?? "Removed exercise",
        notes: item.notes,
        sets: Array.from({ length: item.sets }, (_, i) => ({
          reps: last?.sets[i]?.reps ?? item.reps,
          weight: last?.sets[i]?.weight ?? item.weight,
          done: false,
        })),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workoutId]);

  const [entries, setEntries] = useState<HistoryEntry[]>(initial);
  const [startedAt] = useState(() => Date.now());
  const [rest, setRest] = useState(0);
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

  const patchSet = (
    ei: number,
    si: number,
    patch: Partial<{ reps: number; weight: number; done: boolean }>,
  ) =>
    setEntries((prev) =>
      prev.map((e, i) =>
        i === ei
          ? { ...e, sets: e.sets.map((s, j) => (j === si ? { ...s, ...patch } : s)) }
          : e,
      ),
    );

  const totalSets = entries.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = entries.reduce(
    (a, e) => a + e.sets.filter((s) => s.done).length,
    0,
  );

  const finish = () => {
    saveSession({
      id: uid(),
      workoutId: workout.id,
      workoutName: workout.name,
      date: new Date().toISOString(),
      durationSec: Math.round((Date.now() - startedAt) / 1000),
      entries: entries.map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) })),
    });
    navigate({ to: "/history" });
  };

  return (
    <AppShell
      title={workout.name}
      subtitle={`${doneSets}/${totalSets} sets completed`}
      action={
        <Link
          to="/workouts"
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
          return (
            <div key={`${entry.exerciseId}-${ei}`} className="surface-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <p className="truncate font-semibold">{entry.exerciseName}</p>
                <span className="shrink-0 text-xs text-muted-foreground">
                  rest {item?.rest ?? 60}s
                </span>
              </div>
              {entry.notes ? (
                <p className="mt-1 text-sm text-muted-foreground">{entry.notes}</p>
              ) : null}

              <div className="mt-3 space-y-3">
                {entry.sets.map((s, si) => (
                  <div
                    key={si}
                    className={`rounded-xl border p-3 transition-colors ${
                      s.done ? "border-primary bg-primary/10" : "border-border bg-secondary"
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Set #{si + 1}
                      </span>
                      <button
                        aria-label={`Complete set ${si + 1}`}
                        onClick={() => {
                          patchSet(ei, si, { done: !s.done });
                          if (!s.done) setRest(item?.rest ?? 60);
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
                ))}
              </div>

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
                              },
                            ],
                          }
                        : e,
                    ),
                  )
                }
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-sm font-semibold"
              >
                <Plus className="h-4 w-4" /> Add set
              </button>
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
        <div className="fixed inset-x-0 bottom-20 z-40 mx-auto flex max-w-2xl items-center gap-3 rounded-2xl border border-border bg-card px-5 py-3 shadow-lg">
          <Timer className="h-5 w-5 text-primary" />
          <p className="flex-1 text-lg font-semibold tabular-nums">{rest}s rest</p>
          <button
            onClick={() => setRest(0)}
            className="rounded-lg bg-secondary px-3 py-2 text-sm font-medium"
          >
            Skip
          </button>
        </div>
      )}
    </AppShell>
  );
}
