import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Check, Shuffle, Trash2 } from "lucide-react";
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
    meta: [{ title: "פרטי מאכל — הרוטינה שלי" }],
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
      <AppShell title="מאכל לא נמצא">
        <p className="surface-card p-5 text-muted-foreground text-start">מאכל זה אינו קיים עוד בספרייה.</p>
        <Link to="/nutrition/foods" className="mt-4 inline-block text-primary font-semibold text-start">
          חזרה לספריית המאכלים
        </Link>
      </AppShell>
    );
  }

  if (foodId === "custom" && isLogEdit) {
    return (
      <AppShell title="מאכל יומן">
        <p className="surface-card p-5 text-muted-foreground text-start">
          מאכל זה מופיע ביומן ולא מקושר ישירות לספרייה.
        </p>
        <Link to="/nutrition" className="mt-4 inline-block text-primary font-semibold text-start">
          חזרה ליומן התזונה
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
      title={isNew ? "מאכל חדש" : draft.name || "מאכל"}
      subtitle={!isNew ? draft.servingSize : undefined}
      action={
        <div className="flex gap-2">
          <Link
            to="/nutrition/foods"
            aria-label="חזרה"
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <button
            type="button"
            aria-label="שמור"
            onClick={onSave}
            className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95 shadow-sm"
          >
            <Check className="h-5 w-5" />
          </button>
        </div>
      }
    >
      <div className="space-y-3.5 text-start">
        <label className="block">
          <span className={labelCls}>שם המאכל</span>
          <input className={field} value={draft.name} onChange={(e) => set({ name: e.target.value })} placeholder="שם המאכל..." />
        </label>

        <label className="block">
          <span className={labelCls}>גודל מנה ייחוס</span>
          <input
            className={field}
            value={draft.servingSize}
            onChange={(e) => set({ servingSize: e.target.value })}
            placeholder="100 גרם, יחידה 1, פרוסה 1..."
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <Stepper label="קלוריות (kcal)" value={draft.calories} min={0} onChange={(calories) => set({ calories })} />
          <Stepper
            label="חלבון (גרם)"
            value={draft.protein}
            step={0.5}
            min={0}
            suffix="g"
            onChange={(protein) => set({ protein })}
          />
          <Stepper label="פחמימות (גרם)" value={draft.carbs} step={0.5} min={0} suffix="g" onChange={(carbs) => set({ carbs })} />
          <Stepper label="שומן (גרם)" value={draft.fat} step={0.5} min={0} suffix="g" onChange={(fat) => set({ fat })} />
          <Stepper
            label="סיבים תזונתיים"
            value={draft.fiber ?? 0}
            step={0.5}
            min={0}
            suffix="g"
            onChange={(fiber) => set({ fiber })}
          />
        </div>

        <label className="block">
          <span className={labelCls}>הערות ומידע נוסף</span>
          <textarea
            rows={2}
            className={field}
            value={draft.notes ?? ""}
            onChange={(e) => set({ notes: e.target.value })}
            placeholder="מידע על המותג או הערות..."
          />
        </label>

        <button
          type="button"
          onClick={onSave}
          className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground active:scale-[0.98] shadow-md"
        >
          <Check className="h-5 w-5" /> שמור מאכל בספרייה
        </button>

        {!isNew && existing ? (
          <>
            <button
              type="button"
              onClick={() => setShowSwaps((v) => !v)}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-semibold text-foreground"
            >
              <Shuffle className="h-4 w-4" /> הצג מאכלים דומים (רעיונות להחלפה)
            </button>

            {showSwaps ? (
              <div className="space-y-2">
                <input
                  value={swapQuery}
                  onChange={(e) => setSwapQuery(e.target.value)}
                  placeholder="סינון מועמדים להחלפה..."
                  className={field}
                />
                {replacements.map((item) => (
                  <Link
                    key={item.food.id}
                    to="/nutrition/foods/$foodId"
                    params={{ foodId: item.food.id }}
                    className="surface-card block p-3.5"
                  >
                    <p className="font-semibold text-foreground">{item.food.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.food.calories} קלוריות · חלבון {item.food.protein}g · הפרש קלורי: Δ
                      {Math.abs(item.food.calories - existing.calories)} קלוריות
                    </p>
                  </Link>
                ))}
              </div>
            ) : null}

            <button
              type="button"
              onClick={onDelete}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-secondary font-semibold text-destructive active:scale-[0.98]"
            >
              <Trash2 className="h-5 w-5" /> מחק מאכל מהספרייה
            </button>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}
