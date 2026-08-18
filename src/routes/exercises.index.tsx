import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Plus, Search } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useGym } from "@/lib/gym-store";
import { MUSCLE_GROUPS } from "@/lib/gym-types";

export const Route = createFileRoute("/exercises/")({
  head: () => ({
    meta: [
      { title: "Exercise Library — GymTrack" },
      {
        name: "description",
        content: "Browse, add, edit and delete your custom exercises.",
      },
      { property: "og:title", content: "Exercise Library — GymTrack" },
      {
        property: "og:description",
        content: "Browse, add, edit and delete your custom exercises.",
      },
    ],
  }),
  component: Library,
});

function Library() {
  const { exercises } = useGym();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("All");

  const list = exercises.filter(
    (e) =>
      (group === "All" || e.muscleGroup === group) &&
      e.name.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <AppShell
      title="Exercise Library"
      subtitle={`${exercises.length} exercises`}
      action={
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: "new" }}
          aria-label="Add exercise"
          className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </Link>
      }
    >
      <div className="num-pill flex h-12 items-center gap-2 px-3">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search exercises"
          className="w-full min-w-0 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1">
        {["All", ...MUSCLE_GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              group === g
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {list.map((e) => (
          <Link
            key={e.id}
            to="/exercises/$exerciseId"
            params={{ exerciseId: e.id }}
            className="surface-card flex items-center gap-3 p-4"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{e.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {e.muscleGroup} · {e.equipment}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
          </Link>
        ))}
        {list.length === 0 && (
          <p className="surface-card p-5 text-sm text-muted-foreground">
            No exercises match. Tap + to add one.
          </p>
        )}
      </div>
    </AppShell>
  );
}
