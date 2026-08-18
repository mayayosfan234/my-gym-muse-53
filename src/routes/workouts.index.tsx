import { createFileRoute, Link } from "@tanstack/react-router";
import { Pencil, Play, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/workouts/")({
  head: () => ({
    meta: [
      { title: "My Workouts — GymTrack" },
      {
        name: "description",
        content: "Your saved workout routines, ready to start in one tap.",
      },
      { property: "og:title", content: "My Workouts — GymTrack" },
      {
        property: "og:description",
        content: "Your saved workout routines, ready to start in one tap.",
      },
    ],
  }),
  component: Workouts;
});

function Workouts() {
  const { workouts, exercises } = useGym();
  const nameOf = (id: string) => exercises.find((e) => e.id === id)?.name ?? "Removed";

  return (
    <AppShell
      title="My Workouts"
      subtitle={`${workouts.length} routines`}
      action={
        <Link
          to="/workouts/$workoutId"
          params={{ workoutId: "new" }}
          aria-label="New workout"
          className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </Link>
      }
    >
      <div className="space-y-3">
        {workouts.map((w) => (
          <div key={w.id} className="surface-card p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{w.name || "Untitled"}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {w.items.map((i) => nameOf(i.exerciseId)).join(" · ") || "No exercises"}
                </p>
              </div>
              <Link
                to="/workouts/$workoutId"
                params={{ workoutId: w.id }}
                aria-label={`Edit ${w.name}`}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-secondary active:scale-95"
              >
                <Pencil className="h-5 w-5" />
              </Link>
            </div>
            <Link
              to="/session/$workoutId"
              params={{ workoutId: w.id }}
              className="mt-4 flex h-13 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground active:scale-[0.98]"
            >
              <Play className="h-4 w-4 fill-current" /> Start workout
            </Link>
          </div>
        ))}
        {workouts.length === 0 && (
          <p className="surface-card p-5 text-sm text-muted-foreground">
            No workouts yet. Tap + to build one from your exercise library.
          </p>
        )}
      </div>
    </AppShell>
  );
}
