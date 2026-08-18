import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { deleteSession, useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "Workout History — GymTrack" },
      {
        name: "description",
        content: "Every logged session with the sets, reps and weights you used.",
      },
      { property: "og:title", content: "Workout History — GymTrack" },
      {
        property: "og:description",
        content: "Every logged session with the sets, reps and weights you used.",
      },
    ],
  }),
  component: HistoryPage,
});

function HistoryPage() {
  const { history } = useGym();

  return (
    <AppShell title="Workout History" subtitle={`${history.length} sessions`}>
      <div className="space-y-4">
        {history.map((s) => {
          const volume = s.entries.reduce(
            (v, e) =>
              v +
              e.sets
                .filter((set) => !set.warmup)
                .reduce((a, b) => a + b.reps * b.weight, 0),
            0,
          );
          return (
            <div key={s.id} className="surface-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold">{s.workoutName}</p>
                  <p className="text-sm text-muted-foreground">
                    {s.programName ? `${s.programName} · ` : ""}
                    {new Date(s.date).toLocaleString()} ·{" "}
                    {Math.round(s.durationSec / 60)} min · {volume} kg
                  </p>
                </div>
                <button
                  aria-label="Delete session"
                  onClick={() => deleteSession(s.id)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-3">
                {s.entries.map((e, i) => (
                  <div key={i}>
                    <p className="text-sm font-semibold">{e.exerciseName}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {e.sets.map((set, j) => (
                        <span key={j} className="num-pill px-3 py-1 text-sm">
                          {set.weight}kg × {set.reps}
                        </span>
                      ))}
                      {e.sets.length === 0 && (
                        <span className="text-sm text-muted-foreground">
                          No sets completed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {history.length === 0 && (
          <p className="surface-card p-5 text-sm text-muted-foreground">
            No sessions yet. Start a workout and tap “Finish & save”.
          </p>
        )}
      </div>
    </AppShell>
  );
}
