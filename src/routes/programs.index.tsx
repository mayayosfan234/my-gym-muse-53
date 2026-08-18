import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowUpRight, Copy, Dumbbell, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { createProgram, deleteProgram, duplicateProgram, useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/programs/")({
  head: () => ({ meta: [{ title: "Programs — GymTrack" }] }),
  component: ProgramsPage,
});

function ProgramsPage() {
  const { programs, workouts } = useGym();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  const submit = () => {
    const value = name.trim();
    if (!value) return;
    const program = createProgram(value);
    setName("");
    setAdding(false);
    navigate({ to: "/programs/$programId", params: { programId: program.id } });
  };

  return (
    <AppShell
      title="Programs"
      subtitle="Your training, in a rhythm that lasts"
      action={
        <button
          type="button"
          data-testid="button-new-program"
          onClick={() => setAdding((value) => !value)}
          aria-label="New program"
          className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </button>
      }
    >
      <section className="ink-card relative overflow-hidden p-5 sm:p-7">
        <div className="relative z-10 max-w-sm">
          <p className="section-kicker text-primary-foreground/70">Your training space</p>
          <h2 className="mt-2 font-display text-3xl font-semibold leading-tight">
            Make the next session easy to start.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-primary-foreground/70">
            Keep your days clear, your exercises close, and the phone in one hand.
          </p>
        </div>
        <div className="absolute -right-10 -top-14 h-52 w-52 rounded-full border-[18px] border-primary-foreground/10" />
        <div className="absolute -bottom-24 right-20 h-40 w-40 rounded-full border-[12px] border-primary-foreground/10" />
      </section>

      {adding ? (
        <div className="surface-card mt-5 p-4">
          <label className="section-kicker" htmlFor="program-name">Name your program</label>
          <div className="mt-2 flex gap-2">
            <input
              id="program-name"
              data-testid="input-program-name"
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && submit()}
              placeholder="e.g. Stronger by summer"
              className="min-w-0 flex-1 rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:border-primary"
            />
            <button
              type="button"
              data-testid="button-save-program"
              onClick={submit}
              className="rounded-xl bg-primary px-4 font-semibold text-primary-foreground active:scale-95"
            >
              Add
            </button>
          </div>
        </div>
      ) : null}

      <div className="mt-7 flex items-end justify-between">
        <div>
          <p className="section-kicker">Saved programs</p>
          <h2 className="mt-1 font-display text-2xl font-semibold">{programs.length} programs</h2>
        </div>
        <p className="text-xs text-muted-foreground">{workouts.length} total days</p>
      </div>

      <div className="mt-4 space-y-3">
        {programs.map((program, index) => {
          const days = program.dayIds
            .map((id) => workouts.find((workout) => workout.id === id))
            .filter(Boolean);
          return (
            <article
              key={program.id}
              data-testid={`card-program-${program.id}`}
              className="surface-card group relative overflow-hidden p-4 transition-transform hover:-translate-y-0.5 sm:p-5"
            >
              <div className="absolute left-0 top-0 h-full w-1 bg-primary/70" />
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary font-display text-lg font-semibold text-primary">
                  {String(index + 1).padStart(2, "0")}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    to="/programs/$programId"
                    params={{ programId: program.id }}
                    data-testid={`link-program-${program.id}`}
                    className="block truncate font-display text-xl font-semibold"
                  >
                    {program.name || "Untitled program"}
                  </Link>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
                    {program.notes || `${days.length} ${days.length === 1 ? "training day" : "training days"}`}
                  </p>
                </div>
                <Link
                  to="/programs/$programId"
                  params={{ programId: program.id }}
                  aria-label={`Open ${program.name}`}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary active:scale-95"
                >
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Dumbbell className="h-3.5 w-3.5 text-primary" />
                  <span>{days.reduce((sum, day) => sum + (day?.items.length ?? 0), 0)} exercises</span>
                  <span className="text-border">/</span>
                  <span>{days.length} days</span>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    data-testid={`button-duplicate-program-${program.id}`}
                    onClick={() => duplicateProgram(program.id)}
                    aria-label={`Duplicate ${program.name}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    data-testid={`button-delete-program-${program.id}`}
                    onClick={() => window.confirm(`Delete ${program.name}? Its saved history will stay.`) && deleteProgram(program.id)}
                    aria-label={`Delete ${program.name}`}
                    className="grid h-9 w-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </article>
          );
        })}
        {programs.length === 0 ? (
          <div className="surface-card flex flex-col items-center px-6 py-12 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
              <Dumbbell className="h-6 w-6" />
            </div>
            <h3 className="mt-4 font-display text-lg font-semibold">Start with a simple rhythm</h3>
            <p className="mt-1 max-w-xs text-sm text-muted-foreground">Add a program, then shape its days around the way you actually train.</p>
            <button type="button" onClick={() => setAdding(true)} className="mt-5 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Create a program</button>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}