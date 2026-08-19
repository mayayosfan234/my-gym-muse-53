import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Plus, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/nutrition/foods/")({
  head: () => ({
    meta: [{ title: "ספריית מאכלים — הרוטינה שלי" }],
  }),
  component: FoodLibrary,
});

function FoodLibrary() {
  const { foods } = useGym();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase();
    return foods
      .filter((f) => !q || f.name.toLocaleLowerCase().includes(q) || (f.category ?? "").toLocaleLowerCase().includes(q))
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [foods, query]);

  return (
    <AppShell
      title="ספריית מאכלים"
      subtitle={`${foods.length} מוצרים זמינים`}
      action={
        <div className="flex gap-2">
          <Link
            to="/nutrition"
            aria-label="חזרה ליומן תזונה"
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            to="/nutrition/foods/$foodId"
            params={{ foodId: "new" }}
            aria-label="הוסף מאכל"
            className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95 shadow-sm"
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      }
    >
      <div className="num-pill flex h-12 items-center gap-2 px-3 text-start">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חפש מאכל בספרייה..."
          className="w-full min-w-0 bg-transparent text-sm sm:text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="mt-4 space-y-2 text-start">
        {filtered.slice(0, 80).map((food) => (
          <Link
            key={food.id}
            to="/nutrition/foods/$foodId"
            params={{ foodId: food.id }}
            className="surface-card block p-4 active:scale-[0.99] transition-transform"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{food.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {food.servingSize} · {food.calories} קלוריות · חלבון {food.protein}g · פחמימות {food.carbs}g · שומן{" "}
                {food.fat}g
              </p>
            </div>
          </Link>
        ))}
        {filtered.length === 0 ? (
          <p className="surface-card p-5 text-center text-sm text-muted-foreground">
            לא נמצאו מאכלים. לחץ על + כדי ליצור מאכל חדש.
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}
