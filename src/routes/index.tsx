import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Dumbbell, Flame, Play, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — MY ROUTINE" },
      {
        name: "description",
        content: "Your training dashboard: recent sessions, volume and quick starts.",
      },
      { property: "og:title", content: "Home — MY ROUTINE" },
      {
        property: "og:description",
        content: "Your training dashboard: recent sessions, volume and quick starts.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { workouts, exercises, history, programs } = useGym();

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
    <AppShell title="Home" subtitle="Train · Log · Eat">
      {/* Hero CTA */}
      <div className="ink-card relative overflow-hidden p-4">
        <div className="relative z-10">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/70">
            Ready when you are
          </p>
          <h2 className="mt-1 font-display text-xl font-semibold leading-snug">
            Start today's session
          </h2>
          <Link
            to="/programs"
            className="mt-3 inline-flex h-11 items-center gap-2 rounded-xl bg-primary-foreground/15 px-4 text-sm font-semibold text-primary-foreground active:scale-[0.98]"
          >
            Open programs <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full border-[14px] border-primary-foreground/10" />
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <Stat label="Sessions" value={String(thisWeek.length)} icon={Flame} />
        <Stat
          label="Volume"
          value={volume >= 1000 ? `${(volume / 1000).toFixed(1)}k` : String(Math.round(volume))}
          icon={TrendingUp}
        />
        <Stat label="Exercises" value={String(exercises.length)} icon={Dumbbell} />
      </div>

      {/* Quick start */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Quick start</h2>
          <Link to="/programs" className="text-xs font-semibold text-primary">
            All
          </Link>
        </div>

        {workouts.length === 0 ? (
          <Link
            to="/programs"
            className="surface-card flex items-center gap-3 p-4 text-sm text-muted-foreground"
          >
            <Dumbbell className="h-5 w-5 shrink-0 text-primary" />
            Create your first program
          </Link>
        ) : (
          <div className="space-y-2">
            {workouts.slice(0, 3).map((w) => (
              <div key={w.id} className="surface-card flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{w.name || "Untitled"}</p>
                  <p className="text-xs text-muted-foreground">{w.items.length} exercises</p>
                </div>
                <Link
                  to="/session/$workoutId"
                  params={{ workoutId: w.id }}
                  className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-3.5 text-sm font-semibold text-primary-foreground active:scale-95"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Start
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Nutrition shortcut */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Nutrition</h2>
          <Link to="/nutrition" className="text-xs font-semibold text-primary">
            Log
          </Link>
        </div>
        <Link to="/nutrition" className="surface-card block p-3.5 active:scale-[0.99]">
          <p className="text-sm font-semibold">Today's food log</p>
          <p className="text-xs text-muted-foreground">Meals · macros · swaps</p>
        </Link>
      </section>

      {/* Programs */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Programs</h2>
          <span className="text-xs text-muted-foreground">{programs.length}</span>
        </div>
        {programs.length === 0 ? (
          <Link to="/programs" className="surface-card block p-4 text-sm text-muted-foreground">
            Add a program to structure your training.
          </Link>
        ) : (
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            {programs.slice(0, 4).map((program) => (
              <Link
                key={program.id}
                to="/programs/$programId"
                params={{ programId: program.id }}
                className="surface-card w-[9.5rem] shrink-0 p-3.5 active:scale-[0.98]"
              >
                <p className="truncate font-display text-sm font-semibold">{program.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{program.dayIds.length} days</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* History */}
      <section className="mt-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Recent</h2>
          <Link to="/history" className="text-xs font-semibold text-primary">
            All
          </Link>
        </div>
        {history.length === 0 ? (
          <p className="surface-card p-4 text-sm text-muted-foreground">
            No sessions yet. Finish a workout to see it here.
          </p>
        ) : (
          <div className="space-y-2">
            {history.slice(0, 3).map((s) => (
              <Link key={s.id} to="/history" className="surface-card block p-3.5 active:scale-[0.99]">
                <p className="truncate text-sm font-semibold">{s.workoutName}</p>
                <p className="text-xs text-muted-foreground">
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
    <div className="surface-card p-2.5 text-center">
      <Icon className="mx-auto mb-1 h-3.5 w-3.5 text-primary" />
      <p className="text-lg font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}
