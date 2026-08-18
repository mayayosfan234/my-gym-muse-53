import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Library,
  Plus,
  Settings2,
  Shuffle,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stepper } from "@/components/Stepper";
import {
  addFoodToMeal,
  addMeal,
  dayTotals,
  deleteMeal,
  findFoodReplacements,
  foodTotals,
  mealFoodFromLibrary,
  nutritionDay,
  removeMealFood,
  renameMeal,
  saveNutritionTargets,
  todayKey,
  updateMealFood,
  useGym,
} from "@/lib/gym-store";
import type { MealFood } from "@/lib/gym-types";

export const Route = createFileRoute("/nutrition/")({
  head: () => ({
    meta: [{ title: "Nutrition — MY ROUTINE" }],
  }),
  component: NutritionLog,
});

function shiftDate(key: string, delta: number) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y!, m! - 1, d);
  date.setDate(date.getDate() + delta);
  return todayKey(date);
}

function formatDayLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y!, m! - 1, d);
  const today = todayKey();
  if (key === today) return "Today";
  const yesterday = shiftDate(today, -1);
  if (key === yesterday) return "Yesterday";
  return date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function MacroBar({
  label,
  value,
  target,
  unit,
}: {
  label: string;
  value: number;
  target?: number;
  unit: string;
}) {
  const pct = target && target > 0 ? Math.min(100, (value / target) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums">
          {Math.round(value)}
          {target ? <span className="font-normal text-muted-foreground"> / {target}{unit}</span> : unit}
        </span>
      </div>
      {target ? (
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

function NutritionLog() {
  const gym = useGym();
  const [date, setDate] = useState(todayKey());
  const [pickerMealId, setPickerMealId] = useState<string | null>(null);
  const [pickerQuery, setPickerQuery] = useState("");
  const [substituteFor, setSubstituteFor] = useState<{
    mealId: string;
    food: MealFood;
  } | null>(null);
  const [substituteQuery, setSubstituteQuery] = useState("");
  const [showTargets, setShowTargets] = useState(false);
  const [targetsDraft, setTargetsDraft] = useState(gym.nutritionTargets);

  const day = nutritionDay(gym, date);
  const totals = dayTotals(day);
  const { nutritionTargets: targets } = gym;

  const filteredFoods = useMemo(() => {
    const q = pickerQuery.trim().toLocaleLowerCase();
    return gym.foods.filter((f) => !q || f.name.toLocaleLowerCase().includes(q));
  }, [gym.foods, pickerQuery]);

  const replacements = useMemo(() => {
    if (!substituteFor) return [];
    return findFoodReplacements(gym.foods, substituteFor.food, substituteQuery).slice(0, 12);
  }, [gym.foods, substituteFor, substituteQuery]);

  const addFromLibrary = (mealId: string, foodId: string) => {
    const lib = gym.foods.find((f) => f.id === foodId);
    if (!lib) return;
    addFoodToMeal(date, mealId, mealFoodFromLibrary(lib));
    setPickerMealId(null);
    setPickerQuery("");
  };

  const applyReplacement = (mealId: string, current: MealFood, replacementId: string) => {
    const lib = gym.foods.find((f) => f.id === replacementId);
    if (!lib) return;
    const next = mealFoodFromLibrary(lib);
    updateMealFood(date, mealId, {
      ...next,
      id: current.id,
      quantity: current.quantity,
      notes: current.notes,
    });
    setSubstituteFor(null);
    setSubstituteQuery("");
  };

  return (
    <AppShell
      title="Nutrition"
      subtitle={formatDayLabel(date)}
      action={
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Edit targets"
            onClick={() => {
              setTargetsDraft(gym.nutritionTargets);
              setShowTargets(true);
            }}
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
          >
            <Settings2 className="h-5 w-5" />
          </button>
          <Link
            to="/nutrition/foods"
            aria-label="Food library"
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
          >
            <Library className="h-5 w-5" />
          </Link>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          aria-label="Previous day"
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-center text-sm font-semibold">{date}</p>
        <button
          type="button"
          aria-label="Next day"
          onClick={() => setDate((d) => shiftDate(d, 1))}
          className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="surface-card mt-4 space-y-3 p-4">
        <MacroBar label="Calories" value={totals.calories} target={targets.calories} unit="" />
        <MacroBar label="Protein" value={totals.protein} target={targets.protein} unit="g" />
        <MacroBar label="Carbs" value={totals.carbs} target={targets.carbs} unit="g" />
        <MacroBar label="Fat" value={totals.fat} target={targets.fat} unit="g" />
      </div>

      <div className="mt-6 space-y-4">
        {day.meals.map((meal) => {
          const mealTotals = foodTotals(meal.foods);
          return (
            <section key={meal.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <input
                    className="w-full bg-transparent text-lg font-semibold outline-none"
                    value={meal.name}
                    onChange={(e) => renameMeal(date, meal.id, e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(mealTotals.calories)} kcal · P {mealTotals.protein.toFixed(0)}g · C{" "}
                    {mealTotals.carbs.toFixed(0)}g · F {mealTotals.fat.toFixed(0)}g
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Delete meal"
                  onClick={() => deleteMeal(date, meal.id)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {meal.foods.map((food) => (
                  <div key={food.id} className="rounded-xl border border-border bg-secondary/50 p-3">
                    <div className="flex items-start justify-between gap-2">
                      {food.foodId ? (
                        <Link
                          to="/nutrition/foods/$foodId"
                          params={{ foodId: food.foodId }}
                          className="min-w-0 flex-1 font-semibold underline-offset-4 hover:underline"
                        >
                          {food.name}
                        </Link>
                      ) : (
                        <p className="min-w-0 flex-1 font-semibold">{food.name}</p>
                      )}
                      <button
                        type="button"
                        aria-label="Remove food"
                        onClick={() => removeMealFood(date, meal.id, food.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {food.servingSize} · {Math.round(food.calories * food.quantity)} kcal
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Stepper
                        label="Qty"
                        value={food.quantity}
                        step={0.5}
                        min={0.5}
                        onChange={(quantity) =>
                          updateMealFood(date, meal.id, { ...food, quantity })
                        }
                      />
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={() => {
                            setSubstituteFor({ mealId: meal.id, food });
                            setSubstituteQuery("");
                          }}
                          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-background text-xs font-semibold text-primary"
                        >
                          <Shuffle className="h-3.5 w-3.5" /> Swap
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setPickerMealId(meal.id);
                  setPickerQuery("");
                }}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 text-sm font-semibold"
              >
                <Plus className="h-4 w-4" /> Add food
              </button>
            </section>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => addMeal(date, "New meal")}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary font-semibold"
      >
        <Plus className="h-4 w-4" /> Add meal
      </button>

      {pickerMealId ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-background/70 backdrop-blur-sm">
          <div className="max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Add from library</h2>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setPickerMealId(null)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              autoFocus
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              placeholder="Search foods…"
              className="mb-3 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:border-primary"
            />
            <div className="space-y-2">
              {filteredFoods.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => addFromLibrary(pickerMealId, food.id)}
                  className="flex w-full items-center justify-between rounded-xl bg-secondary px-4 py-3 text-left active:scale-[0.99]"
                >
                  <div>
                    <p className="font-semibold">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.servingSize} · {food.calories} kcal · P {food.protein}g
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {filteredFoods.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">No foods found.</p>
              ) : null}
            </div>
            <Link
              to="/nutrition/foods/new"
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Create new food
            </Link>
          </div>
        </div>
      ) : null}

      {substituteFor ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-background/70 backdrop-blur-sm">
          <div className="max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Find a swap</h2>
                <p className="text-sm text-muted-foreground">
                  Similar calories & protein to {substituteFor.food.name}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setSubstituteFor(null)}
                className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              autoFocus
              value={substituteQuery}
              onChange={(e) => setSubstituteQuery(e.target.value)}
              placeholder="Filter by name…"
              className="mb-3 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:border-primary"
            />
            <div className="space-y-2">
              {replacements.map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() =>
                    applyReplacement(substituteFor.mealId, substituteFor.food, food.id)
                  }
                  className="flex w-full items-center justify-between rounded-xl bg-secondary px-4 py-3 text-left"
                >
                  <div>
                    <p className="font-semibold">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.calories} kcal · P {food.protein}g · Δ
                      {Math.abs(food.calories - substituteFor.food.calories)} kcal
                    </p>
                  </div>
                  <Shuffle className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {showTargets ? (
        <div className="fixed inset-0 z-40 flex items-end bg-background/70 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 sm:rounded-3xl sm:border">
            <h2 className="text-lg font-semibold">Daily targets</h2>
            <div className="mt-4 space-y-3">
              <TargetField
                label="Calories"
                value={targetsDraft.calories}
                onChange={(calories) => setTargetsDraft((t) => ({ ...t, calories }))}
              />
              <TargetField
                label="Protein (g)"
                value={targetsDraft.protein}
                onChange={(protein) => setTargetsDraft((t) => ({ ...t, protein }))}
              />
              <TargetField
                label="Carbs (g)"
                value={targetsDraft.carbs}
                onChange={(carbs) => setTargetsDraft((t) => ({ ...t, carbs }))}
              />
              <TargetField
                label="Fat (g)"
                value={targetsDraft.fat}
                onChange={(fat) => setTargetsDraft((t) => ({ ...t, fat }))}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowTargets(false)}
                className="h-12 rounded-xl bg-secondary font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  saveNutritionTargets(targetsDraft);
                  setShowTargets(false);
                }}
                className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function TargetField({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: number;
  onChange: (v: number | undefined) => void;
}) {
  return (
    <label className="block">
      <span className="section-kicker">{label}</span>
      <input
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "");
          onChange(raw === "" ? undefined : Number(raw));
        }}
        placeholder="—"
        className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:border-primary"
      />
    </label>
  );
}
