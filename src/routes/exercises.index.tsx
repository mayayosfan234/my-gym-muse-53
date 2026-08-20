import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ChevronLeft, Dumbbell, Plus, Search, SlidersHorizontal, Sparkles, Trash2, X } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ConfirmSheet } from "@/components/ui-app/ConfirmSheet";
import { EmptyState, Pill, PrimaryButton, SectionHeader } from "@/components/ui-app/primitives";
import { deleteCustomExercise, saveCustomExercise, searchExercises, useGym } from "@/lib/gym-store";
import { EQUIPMENT, EXERCISE_CATEGORIES, MUSCLE_GROUPS, type Exercise } from "@/lib/gym-types";

export const Route = createFileRoute("/exercises/")({
  head: () => ({
    meta: [
      { title: "ספריית תרגילים — הרוטינה שלי" },
      {
        name: "description",
        content: "עייני, הוסיפי, ערכי ונהלי את תרגילי הכושר שלך בספרייה.",
      },
      { property: "og:title", content: "ספריית תרגילים — הרוטינה שלי" },
    ],
  }),
  component: Library,
});

const fieldCls =
  "w-full rounded-2xl border border-border/60 bg-secondary px-4 py-3 text-[14px] outline-none focus:border-primary";
const labelCls =
  "mb-1.5 block text-[11px] font-semibold tracking-[0.14em] text-muted-foreground uppercase";

function Library() {
  const { exercises } = useGym();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("הכל");
  const [equipment, setEquipment] = useState("הכל");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // New Custom Exercise Form State
  const [name, setName] = useState("");
  const [englishName, setEnglishName] = useState("");
  const [muscleGroup, setMuscleGroup] = useState("חזה");
  const [customMuscleGroup, setCustomMuscleGroup] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState("מוט");
  const [category, setCategory] = useState("מורכב");
  const [description, setDescription] = useState("");

  const searched = searchExercises(exercises, q);
  const list = searched.filter(
    (e) =>
      (group === "הכל" || e.muscleGroup === group || (e.muscleGroups ?? []).includes(group)) &&
      (equipment === "הכל" || e.equipment === equipment),
  );

  const activeFilters = (group !== "הכל" ? 1 : 0) + (equipment !== "הכל" ? 1 : 0);

  const handleCreateCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newEx: Omit<Exercise, "id"> = {
      name: name.trim(),
      englishName: englishName.trim() || undefined,
      muscleGroup: muscleGroup === "אחר" && customMuscleGroup.trim() ? customMuscleGroup.trim() : muscleGroup,
      customMuscleGroup: muscleGroup === "אחר" ? customMuscleGroup.trim() : undefined,
      muscleGroups: [muscleGroup === "אחר" && customMuscleGroup.trim() ? customMuscleGroup.trim() : muscleGroup],
      equipment: selectedEquipment,
      category,
      description: description.trim(),
      videoUrl: "",
      images: [],
      notes: "",
      isCustom: true,
      searchTerms: [name.trim(), englishName.trim()].filter(Boolean),
    };

    const created = saveCustomExercise(newEx);
    setCreateOpen(false);
    // Reset form
    setName("");
    setEnglishName("");
    setMuscleGroup("חזה");
    setCustomMuscleGroup("");
    setSelectedEquipment("מוט");
    setCategory("מורכב");
    setDescription("");

    navigate({ to: "/exercises/$exerciseId", params: { exerciseId: created.id } });
  };

  return (
    <AppShell
      kicker="ספרייה"
      title="תרגילים"
      subtitle={`${exercises.length} תרגילים בספרייה`}
      action={
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          aria-label="הוסיפי תרגיל אישי"
          className="press flex h-11 items-center gap-1.5 rounded-2xl bg-primary px-3.5 text-primary-foreground font-semibold text-[13px]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.4} />
          <span>הוסיפי תרגיל</span>
        </button>
      }
    >
      {/* Search */}
      <div className="num-pill flex h-12 items-center gap-2 px-3.5">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חפשי לפי שם תרגיל, ציוד או שריר..."
          className="w-full min-w-0 bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
        />
        <button
          type="button"
          onClick={() => setFiltersOpen((v) => !v)}
          className="press relative grid h-9 w-9 place-items-center rounded-xl text-muted-foreground hover:bg-secondary"
          aria-label="סינון"
        >
          <SlidersHorizontal className="h-4 w-4" />
          {activeFilters > 0 ? (
            <span className="absolute -top-0.5 -end-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {activeFilters}
            </span>
          ) : null}
        </button>
      </div>

      {/* Active filter chips */}
      {(group !== "הכל" || equipment !== "הכל") && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {group !== "הכל" ? (
            <Pill active onClick={() => setGroup("הכל")} variant="sage">
              {group}
              <span className="text-[12px] leading-none">×</span>
            </Pill>
          ) : null}
          {equipment !== "הכל" ? (
            <Pill active onClick={() => setEquipment("הכל")} variant="rose">
              {equipment}
              <span className="text-[12px] leading-none">×</span>
            </Pill>
          ) : null}
        </div>
      )}

      {/* Filter rail */}
      {filtersOpen ? (
        <div className="surface-card mt-3 p-4">
          <SectionHeader title="סינון לפי שריר" className="mb-2" />
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 no-scrollbar">
            {["הכל", ...MUSCLE_GROUPS].map((g) => (
              <button
                key={g}
                onClick={() => setGroup(g)}
                className={`press shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-colors ${
                  group === g
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          <SectionHeader title="סינון לפי ציוד" className="mb-2 mt-3" />
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2 no-scrollbar">
            {["הכל", ...EQUIPMENT].map((eq) => (
              <button
                key={eq}
                onClick={() => setEquipment(eq)}
                className={`press shrink-0 rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                  equipment === eq
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {eq}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <SectionHeader
        className="mt-5"
        title={`${list.length} תרגילים`}
        subtitle="לחצי על תרגיל לצפייה ופרטים"
      />

      <div className="space-y-2.5">
        {list.map((e) => {
          const showCustom = e.muscleGroup === "אחר" && e.customMuscleGroup;
          const primary = showCustom ? e.customMuscleGroup! : e.muscleGroup;
          const secondaryCount = (e.muscleGroups?.length ?? 1) - 1;
          return (
            <div
              key={e.id}
              className="surface-card press flex items-center justify-between gap-3 p-3.5"
            >
              <Link
                to="/exercises/$exerciseId"
                params={{ exerciseId: e.id }}
                className="flex min-w-0 flex-1 items-center gap-3.5 text-start"
              >
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${
                  e.isCustom ? "bg-rose-soft text-rose" : "bg-sage-soft text-primary"
                }`}>
                  <Dumbbell className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate font-display text-[15px] font-semibold text-ink">{e.name}</p>
                    {e.isCustom ? (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-soft px-2 py-0.5 text-[10px] font-bold text-rose">
                        <Sparkles className="h-2.5 w-2.5" />
                        אישי
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-[12px] text-muted-foreground">
                    {primary}
                    {secondaryCount > 0 ? ` (+${secondaryCount})` : ""}
                    {e.category ? ` · ${e.category}` : ""}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                <span className="num-pill px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
                  {e.equipment}
                </span>
                {e.isCustom ? (
                  <button
                    type="button"
                    onClick={(ev) => {
                      ev.preventDefault();
                      ev.stopPropagation();
                      setDeleteConfirmId(e.id);
                    }}
                    aria-label="מחק תרגיל אישי"
                    className="press grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                ) : null}
                <Link
                  to="/exercises/$exerciseId"
                  params={{ exerciseId: e.id }}
                  className="grid h-8 w-8 place-items-center text-muted-foreground/60"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="לא נמצאו תרגילים"
          description={
            q || activeFilters > 0
              ? "נסי לשנות את החיפוש או הסינון."
              : "התחילי לבנות את ספריית התרגילים שלך."
          }
          action={
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="press inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-[13.5px] font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" strokeWidth={2.4} />
              הוסיפי תרגיל חדש
            </button>
          }
        />
      ) : null}

      {/* Modal: Create Custom Exercise */}
      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs p-0 pb-20 sm:p-4">
          <div
            ref={(el) => { if (el) el.scrollTop = 0; }}
            className="surface-card w-full max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl p-5 text-start shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-200"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-rose" />
                <h2 className="font-display text-[17px] font-bold text-ink">הוסיפי תרגיל מותאם אישית</h2>
              </div>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="press grid h-8 w-8 place-items-center rounded-full bg-secondary text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-4">
              <div>
                <label className={labelCls}>שם התרגיל (בעברית) *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="למשל: סקוואט כנגד גומייה"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>שם באנגלית (אופציונלי)</label>
                <input
                  value={englishName}
                  onChange={(e) => setEnglishName(e.target.value)}
                  placeholder="e.g. Banded Squat"
                  className={fieldCls}
                />
              </div>

              <div>
                <label className={labelCls}>קבוצת שרירים ראשית *</label>
                <select
                  value={muscleGroup}
                  onChange={(e) => setMuscleGroup(e.target.value)}
                  className={fieldCls}
                >
                  {MUSCLE_GROUPS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
                {muscleGroup === "אחר" ? (
                  <input
                    value={customMuscleGroup}
                    onChange={(e) => setCustomMuscleGroup(e.target.value)}
                    placeholder="הקלידי שם שריר..."
                    className={`${fieldCls} mt-2`}
                  />
                ) : null}
              </div>

              <div>
                <label className={labelCls}>ציוד עיקרי *</label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className={fieldCls}
                >
                  {EQUIPMENT.map((eq) => (
                    <option key={eq} value={eq}>
                      {eq}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>קטגוריה</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className={fieldCls}
                >
                  {EXERCISE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>תיאור קצר (אופציונלי)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="דגשים עיקריים או הוראות ביצוע..."
                  className={fieldCls}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <PrimaryButton type="submit" className="flex-1">
                  שמרי תרגיל חדש
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

      {/* Confirm Custom Exercise Deletion */}
      <ConfirmSheet
        open={Boolean(deleteConfirmId)}
        title="מחיקת תרגיל אישי"
        description="האם את בטוחה שברצונך למחוק תרגיל מותאם אישית זה? הפעולה לא תמחוק היסטוריית אימונים קודמת."
        confirmText="מחק תרגיל"
        danger
        onConfirm={() => {
          if (deleteConfirmId) {
            deleteCustomExercise(deleteConfirmId);
            setDeleteConfirmId(null);
          }
        }}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </AppShell>
  );
}
