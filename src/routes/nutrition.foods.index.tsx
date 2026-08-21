import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Apple, ArrowRight, Heart, Plus, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { EmptyState, Pill, PrimaryButton, SectionHeader } from "@/components/ui-app/primitives";
import { saveCustomFood, searchFoods, toggleFavoriteFood, useGym } from "@/lib/gym-store";
import type { FoodItem } from "@/lib/gym-types";

export const Route = createFileRoute("/nutrition/foods/")({
  head: () => ({
    meta: [{ title: "ספריית מאכלים — הרוטינה שלי" }],
  }),
  component: FoodLibrary,
});

const FOOD_CATEGORIES = [
  "הכל",
  "מועדפים",
  "חלב ומוצרי חלב",
  "ביצים",
  "בשר",
  "עוף",
  "דגים",
  "פחמימות",
  "לחמים",
  "ירקות",
  "פירות",
  "קטניות",
  "אגוזים וזרעים",
  "חטיפים",
  "ממרחים",
  "משקאות",
  "מוצרים עשירים בחלבון",
];

const fieldCls =
  "w-full rounded-2xl border border-border/60 bg-secondary px-4 py-3 text-[14px] outline-none focus:border-primary";
const labelCls =
  "mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

function FoodLibrary() {
  const { foods, favoriteFoods } = useGym();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("הכל");
  const [createOpen, setCreateOpen] = useState(false);

  // New Custom Food Form State
  const [name, setName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [category, setCategory] = useState("פחמימות");
  const [servingSize, setServingSize] = useState("100 גרם");
  const [calories, setCalories] = useState(100);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [fiber, setFiber] = useState(0);

  const favSet = useMemo(() => new Set(favoriteFoods ?? []), [favoriteFoods]);

  const searched = searchFoods(foods, query);

  const filtered = useMemo(() => {
    return searched
      .filter((f) => {
        if (selectedCategory === "הכל") return true;
        if (selectedCategory === "מועדפים") return favSet.has(f.id) || Boolean(f.favorite);
        return (f.category ?? "").includes(selectedCategory);
      })
      .sort((a, b) => a.name.localeCompare(b.name, "he"));
  }, [searched, selectedCategory, favSet]);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newFood = saveCustomFood({
      name: name.trim(),
      englishName: englishName.trim() || undefined,
      category,
      servingSize: servingSize.trim() || "100 גרם",
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
      fiber: Number(fiber) || 0,
      searchTerms: [name.trim(), englishName.trim()].filter(Boolean),
    });

    setCreateOpen(false);
    // Reset
    setName("");
    setEnglishName("");
    setCalories(100);
    setProtein(0);
    setCarbs(0);
    setFat(0);
    setFiber(0);

    navigate({ to: "/nutrition/foods/$foodId", params: { foodId: newFood.id } });
  };

  return (
    <AppShell
      kicker="תזונה"
      title="ספריית מאכלים"
      subtitle={`${foods.length} מוצרים זמינים בספרייה`}
      action={
        <div className="flex gap-2">
          <Link
            to="/nutrition"
            aria-label="חזרה ליומן"
            className="press grid h-11 w-11 place-items-center rounded-2xl bg-secondary"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            aria-label="הוסיפי מזון אישי"
            className="press flex h-11 items-center gap-1.5 rounded-2xl bg-primary px-3.5 text-primary-foreground font-semibold text-[13px]"
          >
            <Plus className="h-4 w-4" strokeWidth={2.4} />
            <span>הוסיפי מזון</span>
          </button>
        </div>
      }
    >
      {/* Search */}
      <div className="num-pill flex h-12 items-center gap-2 px-3.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חפשי קוטג', טונה, ביצה L, גבינה 9%..."
          className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* Category Pills */}
      <div className="mt-3 -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 no-scrollbar" dir="rtl">
        {FOOD_CATEGORIES.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`press shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              }`}
            >
              {cat === "מועדפים" ? "❤️ מועדפים" : cat}
            </button>
          );
        })}
      </div>

      <SectionHeader
        className="mt-4"
        title={`${filtered.length} תוצאות`}
        subtitle="לחצי על מאכל לצפייה ועריכת ערכים"
      />

      <div className="space-y-2">
        {filtered.slice(0, 80).map((food) => {
          const isFav = favSet.has(food.id) || Boolean(food.favorite);
          return (
            <div
              key={food.id}
              className="surface-card press flex items-center justify-between gap-3 p-3.5"
            >
              <Link
                to="/nutrition/foods/$foodId"
                params={{ foodId: food.id }}
                className="flex min-w-0 flex-1 items-center gap-3.5 text-start"
              >
                <div
                  className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                    food.isCustom ? "bg-rose-soft text-rose" : "bg-sage-soft text-primary"
                  }`}
                >
                  <Apple className="h-4 w-4" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-[14.5px] font-semibold text-ink">
                      {food.name}
                    </p>
                    {food.isCustom ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-soft px-2 py-0.5 text-[10px] font-bold text-rose">
                        <Sparkles className="h-2.5 w-2.5" />
                        אישי
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
                    {food.servingSize} · {food.calories} קלוריות · חלבון {food.protein}g · פחמימות{" "}
                    {food.carbs}g
                  </p>
                </div>
              </Link>

              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavoriteFood(food.id);
                }}
                className={`press grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors ${
                  isFav
                    ? "bg-rose-soft text-rose"
                    : "text-muted-foreground/60 hover:bg-secondary hover:text-muted-foreground"
                }`}
                aria-label={isFav ? "הסרי ממועדפים" : "הוסיפי למועדפים"}
              >
                <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
              </button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Apple}
          title="לא נמצאו מאכלים"
          description="נסי לחפש שם אחר או ליצור מאכל מותאם אישית."
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="press inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[13.5px] font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              הוסיפי מאכל חדש
            </button>
          }
        />
      ) : null}

      {/* Modal: Create Custom Food */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-0 pb-20 sm:p-4">
          <div
            ref={(el) => {
              if (el) el.scrollTop = 0;
            }}
            className="surface-card w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 text-start shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-rose" />
                <h2 className="font-display text-[17px] font-bold text-ink">
                  הוסיפי מאכל מותאם אישית
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="press grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-3.5">
              <div>
                <label className={labelCls}>שם המוצר (בעברית) *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: יוגורט חלבון ביתי"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>שם באנגלית (אופציונלי)</label>
                <input
                  value={englishName}
                  onChange={(e) => setEnglishName(e.target.value)}
                  placeholder="e.g. Homemade Protein Yogurt"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>קטגוריה *</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={fieldCls}
                >
                  {FOOD_CATEGORIES.filter((c) => c !== "הכל" && c !== "מועדפים").map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>גודל מנת ייחוס (למשל: 100 גרם, יחידה 1)</label>
                <input
                  value={servingSize}
                  onChange={(e) => setServingSize(e.target.value)}
                  placeholder="100 גרם"
                  className={fieldCls}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>קלוריות *</label>
                  <input
                    type="number"
                    step="0.1"
                    value={calories}
                    onChange={(e) => setCalories(Number(e.target.value))}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>חלבון (גרם)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={protein}
                    onChange={(e) => setProtein(Number(e.target.value))}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>פחמימות (גרם)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={carbs}
                    onChange={(e) => setCarbs(Number(e.target.value))}
                    className={fieldCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>שומן (גרם)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={fat}
                    onChange={(e) => setFat(Number(e.target.value))}
                    className={fieldCls}
                  />
                </div>
              </div>

              <div>
                <label className={labelCls}>סיבים תזונתיים (גרם)</label>
                <input
                  type="number"
                  step="0.1"
                  value={fiber}
                  onChange={(e) => setFiber(Number(e.target.value))}
                  className={fieldCls}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <PrimaryButton type="submit" className="flex-1">
                  שמרי מאכל חדש
                </PrimaryButton>
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="press rounded-2xl bg-secondary px-4 py-3 text-[14px] font-semibold text-muted-foreground"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <div className="mt-6 hidden">
        <Pill />
      </div>
    </AppShell>
  );
}
