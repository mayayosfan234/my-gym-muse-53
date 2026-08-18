import { createFileRoute, Link } from "@tanstack/react-router";
import { Dumbbell, Flame, Play, Plus, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — GymTrack" },
      {
        name: "description",
        content: "Your training dashboard: recent sessions, volume and quick starts.",
      },
      { property: "og:title", content: "Dashboard — GymTrack" },
      {
        property: "og:description",
        content: "Your training dashboard: recent sessions, volume and quick starts.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { workouts, exercises, history } = useGym();

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
    <AppShell title="GymTrack" subtitle="Let's move some weight">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Sessions / wk" value={String(thisWeek.length)} icon={Flame} />
        <Stat
          label="Volume kg"
          value={volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(volume)}
          icon={TrendingUp}
        />
        <Stat label="Exercises" value={String(exercises.length)} icon={Dumbbell} />
      </div>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Start a workout</h2>
          <Link to="/workouts" className="text-sm font-medium text-primary">
            All
          </Link>
        </div>

        {workouts.length === 0 ? (
          <Link
            to="/workouts/$workoutId"
            params={{ workoutId: "new" }}
            className="surface-card flex items-center gap-3 p-5 text-muted-foreground"
          >
            <Plus className="h-5 w-5" /> Create your first workout
          </Link>
        ) : (
          <div className="space-y-3">
            {workouts.slice(0, 3).map((w) => (
              <div key={w.id} className="surface-card flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{w.name || "Untitled"}</p>
                  <p className="text-sm text-muted-foreground">
                    {w.items.length} exercises
                  </p>
                </div>
                <Link
                  to="/session/$workoutId"
                  params={{ workoutId: w.id }}
                  className="flex h-12 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 font-semibold text-primary-foreground active:scale-95"
                >
                  <Play className="h-4 w-4 fill-current" /> Start
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-7">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent history</h2>
          <Link to="/history" className="text-sm font-medium text-primary">
            All
          </Link>
        </div>
        {history.length === 0 ? (
          <p className="surface-card p-5 text-sm text-muted-foreground">
            No sessions logged yet. Finish a workout to see it here.
          </p>
        ) : (
          <div className="space-y-3">
            {history.slice(0, 3).map((s) => (
              <Link
                key={s.id}
                to="/history"
                className="surface-card block p-4"
              >
                <p className="font-semibold">{s.workoutName}</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(s.date).toLocaleDateString()} · {s.entries.length} exercises
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
    <div className="surface-card p-3">
      <Icon className="mb-2 h-4 w-4 text-primary" />
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-[11px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
