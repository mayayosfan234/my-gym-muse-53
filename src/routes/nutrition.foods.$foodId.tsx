import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Check, Shuffle, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stepper } from "@/components/Stepper";
import { deleteFood, emptyFood, findFoodReplacements, saveFood, useGym } from "@/lib/gym-store";
import type { FoodItem } from "@/lib/gym-types";

type FoodSearch = {
  mealDate?: string;
  mealId?: string;
  logFoodId?: string;
};

export const Route = createFileRoute("/nutrition/foods/$foodId")({
  head: () => ({
    meta: [{ title: "Food — MY ROUTINE" }],
  }),
  validateSearch: (search: Record<string, unknown>): FoodSearch => ({
    mealDate: typeof search.mealDate === "string" ? search.mealDate : undefined,
    mealId: typeof search.mealId === "string" ? search.mealId : undefined,
    logFoodId: typeof search.logFoodId === "string" ? search.logFoodId : undefined,
  }),
  component: FoodDetail,
});

const field =
  "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-base outline-none focus:border-primary";
const labelCls =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

function FoodDetail() {
  const { foodId } = Route.useParams();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { foods } = useGym();
  const isNew = foodId === "new";
  const existing = foods.find((f) => f.id === foodId);
  const isLogEdit = Boolean(search.mealDate && search.mealId && search.logFoodId && !isNew);

  const [draft, setDraft] = useState<FoodItem>(existing ?? emptyFood());
  const [swapQuery, setSwapQuery] = useState("");
  const [showSwaps, setShowSwaps] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [foodId]);

  useEffect(() => {
    if (existing) setDraft(existing);
    else if (isNew) setDraft(emptyFood());
  }, [existing, isNew]);

  const replacements = useMemo(() => {
    if (!existing) return [];
    return findFoodReplacements(foods, existing, swapQuery).slice(0, 10);
  }, [foods, existing, swapQuery]);

  if (!isNew && !existing && foodId !== "custom") {
    return (
      <AppShell title="Not found">
        <p className="surface-card p-5 text-muted-foreground">This food no longer exists.</p>
        <Link to="/nutrition/foods" className="mt-4 inline-block text-primary">
          Back to library
        </Link>
      </AppShell>
    );
  }

  if (foodId === "custom" && isLogEdit) {
    return (
      <AppShell title="Logged food">
        <p className="surface-card p-5 text-muted-foreground">
          This entry was added manually and isn&apos;t linked to the library.
        </p>
        <Link to="/nutrition" className="mt-4 inline-block text-primary">
          Back to nutrition log
        </Link>
      </AppShell>
    );
  }

  const set = (patch: Partial<FoodItem>) => setDraft({ ...draft, ...patch });

  const onSave = () => {
    if (!draft.name.trim()) return;
    saveFood({ ...draft, name: draft.name.trim() });
    if (isNew) {
      navigate({ to: "/nutrition/foods/$foodId", params: { foodId: draft.id }, replace: true });
    } else {
      navigate({ to: "/nutrition/foods" });
    }
  };

  const onDelete = () => {
    if (!existing) return;
    deleteFood(existing.id);
    navigate({ to: "/nutrition/foods" });
  };

  return (
    <AppShell
      title={isNew ? "New food" : draft.name || "Food"}
      subtitle={!isNew ? draft.servingSize : undefined}
      action={
        <div className="flex gap-2">
          <Link
            to="/nutrition/foods"
            aria-label="Back"
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <button
            type="button"
            aria-label="Save"
            onClick={onSave}
            className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      }
    >
      <label className="block">
        <span className={labelCls}>Name</span>
        <input className={field} value={draft.name} onChange={(e) => set({ name: e.target.value })} />
      </label>

      <label className="mt-3 block">
        <span className={labelCls}>Serving size</span>
        <input
          className={field}
          value={draft.servingSize}
          onChange={(e) => set({ servingSize: e.target.value })}
          placeholder="100g, 1 unit…"
        />
      </label>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stepper label="Calories" value={draft.calories} min={0} onChange={(calories) => set({ calories })} />
        <Stepper
          label="Protein"
          value={draft.protein}
          step={0.5}
          min={0}
          suffix="g"
          onChange={(protein) => set({ protein })}
        />
        <Stepper label="Carbs" value={draft.carbs} step={0.5} min={0} suffix="g" onChange={(carbs) => set({ carbs })} />
        <Stepper label="Fat" value={draft.fat} step={0.5} min={0} suffix="g" onChange={(fat) => set({ fat })} />
        <Stepper
          label="Fiber"
          value={draft.fiber ?? 0}
          step={0.5}
          min={0}
          suffix="g"
          onChange={(fiber) => set({ fiber })}
        />
      </div>

      <label className="mt-3 block">
        <span className={labelCls}>Notes</span>
        <textarea
          rows={2}
          className={field}
          value={draft.notes ?? ""}
          onChange={(e) => set({ notes: e.target.value })}
        />
      </label>

      {!isNew && existing ? (
        <>
          <button
            type="button"
            onClick={() => setShowSwaps((v) => !v)}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-semibold"
          >
            <Shuffle className="h-4 w-4" /> Similar foods (swap ideas)
          </button>

          {showSwaps ? (
            <div className="mt-3 space-y-2">
              <input
                value={swapQuery}
                onChange={(e) => setSwapQuery(e.target.value)}
                placeholder="Filter swaps…"
                className={field}
              />
              {replacements.map((food) => (
                <Link
                  key={food.id}
                  to="/nutrition/foods/$foodId"
                  params={{ foodId: food.id }}
                  className="surface-card block p-3"
                >
                  <p className="font-semibold">{food.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {food.calories} kcal · P {food.protein}g · Δ
                    {Math.abs(food.calories - existing.calories)} kcal
                  </p>
                </Link>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={onDelete}
            className="mt-5 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary font-semibold text-destructive"
          >
            <Trash2 className="h-5 w-5" /> Delete from library
          </button>
        </>
      ) : null}
    </AppShell>
  );
}
