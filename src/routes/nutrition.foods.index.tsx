import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/nutrition/foods/")({
  head: () => ({
    meta: [{ title: "Food Library — MY ROUTINE" }],
  }),
  component: FoodLibrary,
});

function FoodLibrary() {
  const { foods } = useGym();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return foods
      .filter((f) => !q || f.name.toLocaleLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [foods, query]);

  return (
    <AppShell
      title="Food library"
      subtitle={`${foods.length} foods`}
      action={
        <div className="flex gap-2">
          <Link
            to="/nutrition"
            aria-label="Back"
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Link
            to="/nutrition/foods/$foodId"
            params={{ foodId: "new" }}
            aria-label="Add food"
            className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      }
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search foods…"
          className="w-full rounded-xl border border-border bg-secondary py-3 pl-11 pr-4 outline-none focus:border-primary"
        />
      </div>

      <div className="mt-4 space-y-2">
        {filtered.map((food) => (
          <Link
            key={food.id}
            to="/nutrition/foods/$foodId"
            params={{ foodId: food.id }}
            className="surface-card flex items-center justify-between p-4 active:scale-[0.99]"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{food.name}</p>
              <p className="text-sm text-muted-foreground">
                {food.servingSize} · {food.calories} kcal · P {food.protein}g · C {food.carbs}g · F{" "}
                {food.fat}g
              </p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <p className="surface-card p-5 text-center text-sm text-muted-foreground">
            No foods yet. Tap + to add your first one.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
