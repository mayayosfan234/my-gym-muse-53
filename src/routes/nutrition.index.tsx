import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
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
    meta: [{ title: "יומן תזונה — הרוטינה שלי" }],
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
  const today = todayKey();
  if (key === today) return "היום";
  const yesterday = shiftDate(today, -1);
  if (key === yesterday) return "אתמול";
  const prevYesterday = shiftDate(today, -2);
  if (key === prevYesterday) return "לפני יומיים";
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y!, m! - 1, d);
  return date.toLocaleDateString("he-IL", { weekday: "short", month: "short", day: "numeric" });
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
        <span className="text-xs sm:text-sm font-semibold tabular-nums text-foreground">
          {Math.round(value)}
          {target ? <span className="font-normal text-muted-foreground"> / {target}{unit}</span> : unit}
        </span>
      </div>
      {target ? (
        <div className="h-2 overflow-hidden rounded-full bg-secondary">
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
    return gym.foods.filter(
      (f) => !q || f.name.toLocaleLowerCase().includes(q) || (f.category ?? "").toLocaleLowerCase().includes(q),
    );
  }, [gym.foods, pickerQuery]);

  const replacements = useMemo(() => {
    if (!substituteFor) return [];
    return findFoodReplacements(gym.foods, substituteFor.food, substituteQuery).slice(0, 15);
  }, [gym.foods, substituteFor, substituteQuery]);

  const addFromLibrary = (mealId: string, foodId: string) => {
    const lib = gym.foods.find((f) => f.id === foodId);
    if (!lib) return;
    addFoodToMeal(date, mealId, mealFoodFromLibrary(lib));
    setPickerMealId(null);
    setPickerQuery("");
  };

  /** Calorie-Based Replacement Application using exact math */
  const applyCalorieReplacement = (
    mealId: string,
    current: MealFood,
    replacement: {
      food: typeof gym.foods[0];
      calculatedQuantity: number;
    },
  ) => {
    const lib = replacement.food;
    updateMealFood(date, mealId, {
      id: current.id,
      foodId: lib.id,
      name: lib.name,
      servingSize: lib.servingSize,
      quantity: replacement.calculatedQuantity,
      calories: lib.calories,
      protein: lib.protein,
      carbs: lib.carbs,
      fat: lib.fat,
      fiber: lib.fiber,
      notes: current.notes,
    });
    setSubstituteFor(null);
    setSubstituteQuery("");
  };

  return (
    <AppShell
      title="תזונה"
      subtitle={formatDayLabel(date)}
      action={
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="הגדר יעדים"
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
            aria-label="ספריית מאכלים"
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
          >
            <Library className="h-5 w-5" />
          </Link>
        </div>
      }
    >
      <div className="flex items-center justify-between gap-3 text-start">
        <button
          type="button"
          aria-label="יום קודם"
          onClick={() => setDate((d) => shiftDate(d, -1))}
          className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
        <p className="text-center text-sm font-bold text-foreground">{formatDayLabel(date)} ({date})</p>
        <button
          type="button"
          aria-label="יום הבא"
          onClick={() => setDate((d) => shiftDate(d, 1))}
          className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="surface-card mt-3.5 space-y-3 p-4 text-start">
        <MacroBar label="קלוריות" value={totals.calories} target={targets.calories} unit=" kcal" />
        <MacroBar label="חלבון" value={totals.protein} target={targets.protein} unit="g" />
        <MacroBar label="פחמימות" value={totals.carbs} target={targets.carbs} unit="g" />
        <MacroBar label="שומן" value={totals.fat} target={targets.fat} unit="g" />
      </div>

      <div className="mt-5 space-y-3.5 text-start">
        {day.meals.map((meal) => {
          const mealTotals = foodTotals(meal.foods);
          return (
            <section key={meal.id} className="surface-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <input
                    className="w-full bg-transparent text-lg font-semibold text-foreground outline-none"
                    value={meal.name}
                    onChange={(e) => renameMeal(date, meal.id, e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {Math.round(mealTotals.calories)} קלוריות · חלבון {mealTotals.protein.toFixed(0)}g · פחמימות{" "}
                    {mealTotals.carbs.toFixed(0)}g · שומן {mealTotals.fat.toFixed(0)}g
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="מחק ארוחה"
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
                          className="min-w-0 flex-1 font-semibold text-foreground underline-offset-4 hover:underline"
                        >
                          {food.name}
                        </Link>
                      ) : (
                        <p className="min-w-0 flex-1 font-semibold text-foreground">{food.name}</p>
                      )}
                      <button
                        type="button"
                        aria-label="הסר מאכל"
                        onClick={() => removeMealFood(date, meal.id, food.id)}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-background text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {food.servingSize} × {food.quantity} · {Math.round(food.calories * food.quantity)} קלוריות
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Stepper
                        label="כמות"
                        value={food.quantity}
                        step={0.5}
                        min={0.1}
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
                          className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-background border border-border text-xs font-semibold text-primary transition-transform active:scale-95"
                        >
                          <Shuffle className="h-3.5 w-3.5" /> החלף מאכל (החלפה קלורית)
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
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-secondary/40 text-sm font-semibold text-foreground"
              >
                <Plus className="h-4 w-4" /> הוסף מאכל לארוחה
              </button>
            </section>
          );
        })}
      </div>

      <button
        type="button"
        onClick={() => addMeal(date, "ארוחה חדשה")}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary font-semibold text-foreground"
      >
        <Plus className="h-4 w-4" /> הוסף ארוחה
      </button>

      {/* Add Food from Library Modal */}
      {pickerMealId ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-background/70 backdrop-blur-sm">
          <div className="max-h-[80vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 text-start">
            <div className="mb-3.5 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">הוסף מאכל מספריית המזון (400+ מוצרים)</h2>
              <button
                type="button"
                aria-label="סגור"
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
              placeholder="חפש מוצר בסופרמרקט הישראלי..."
              className="mb-3 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <div className="space-y-2">
              {filteredFoods.slice(0, 30).map((food) => (
                <button
                  key={food.id}
                  type="button"
                  onClick={() => addFromLibrary(pickerMealId, food.id)}
                  className="flex w-full items-center justify-between rounded-xl bg-secondary px-4 py-3 text-start active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{food.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {food.servingSize} · {food.calories} קלוריות · חלבון {food.protein}g · פחמימות {food.carbs}g
                    </p>
                  </div>
                  <ArrowLeft className="h-4 w-4 text-muted-foreground shrink-0 ms-2" />
                </button>
              ))}
              {filteredFoods.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">לא נמצאו מוצרים תואמים.</p>
              ) : null}
            </div>
            <Link
              to="/nutrition/foods/$foodId"
              params={{ foodId: "new" }}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> צור מאכל חדש בספרייה
            </Link>
          </div>
        </div>
      ) : null}

      {/* Calorie-Based Food Replacement Modal */}
      {substituteFor ? (
        <div className="fixed inset-0 z-40 flex flex-col justify-end bg-background/70 backdrop-blur-sm">
          <div className="max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 text-start">
            <div className="mb-3.5 flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">החלפת מאכל שומרת קלוריות</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  מחליף את "{substituteFor.food.name}" ({Math.round(substituteFor.food.calories * substituteFor.food.quantity)} קלוריות target)
                </p>
              </div>
              <button
                type="button"
                aria-label="סגור"
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
              placeholder="סינון לפי שם המאכל החלופי..."
              className="mb-3 w-full rounded-xl border border-border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <div className="space-y-2">
              {replacements.map((item) => (
                <button
                  key={item.food.id}
                  type="button"
                  onClick={() =>
                    applyCalorieReplacement(substituteFor.mealId, substituteFor.food, item)
                  }
                  className="flex w-full items-center justify-between rounded-xl bg-secondary px-4 py-3 text-start active:scale-[0.99] border border-border/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground truncate">{item.food.name}</p>
                    <p className="text-xs text-primary font-medium mt-0.5">
                      כמות נדרשת להשוואה: {item.calculatedQuantity} ({item.food.servingSize})
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      ערכים חלופיים: {item.calculatedCalories} קלוריות · חלבון {item.calculatedProtein}g · פחמימות {item.calculatedCarbs}g · שומן {item.calculatedFat}g
                    </p>
                  </div>
                  <Shuffle className="h-4 w-4 text-primary shrink-0 ms-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Daily Targets Modal */}
      {showTargets ? (
        <div className="fixed inset-0 z-40 flex items-end bg-background/70 backdrop-blur-sm sm:items-center sm:justify-center">
          <div className="w-full max-w-md rounded-t-3xl border-t border-border bg-card p-5 sm:rounded-3xl sm:border text-start">
            <h2 className="text-lg font-semibold text-foreground">יעדי תזונה יומיים</h2>
            <div className="mt-4 space-y-3">
              <TargetField
                label="קלוריות (kcal)"
                value={targetsDraft.calories}
                onChange={(calories) => setTargetsDraft((t) => ({ ...t, calories }))}
              />
              <TargetField
                label="חלבון (גרם)"
                value={targetsDraft.protein}
                onChange={(protein) => setTargetsDraft((t) => ({ ...t, protein }))}
              />
              <TargetField
                label="פחמימות (גרם)"
                value={targetsDraft.carbs}
                onChange={(carbs) => setTargetsDraft((t) => ({ ...t, carbs }))}
              />
              <TargetField
                label="שומן (גרם)"
                value={targetsDraft.fat}
                onChange={(fat) => setTargetsDraft((t) => ({ ...t, fat }))}
              />
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowTargets(false)}
                className="h-12 rounded-xl bg-secondary font-semibold text-foreground"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={() => {
                  saveNutritionTargets(targetsDraft);
                  setShowTargets(false);
                }}
                className="h-12 rounded-xl bg-primary font-semibold text-primary-foreground"
              >
                שמור יעדים
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
      <span className="section-kicker block">{label}</span>
      <input
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/\D/g, "");
          onChange(raw === "" ? undefined : Number(raw));
        }}
        placeholder="—"
        className="mt-1 w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:border-primary text-base"
      />
    </label>
  );
}
