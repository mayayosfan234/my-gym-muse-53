import { closestCenter, DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Flame, GripVertical, Link2, Link2Off, Plus, Save, Search, SlidersHorizontal, Trash2, X } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Stepper } from "@/components/Stepper";
import {
  deleteWorkout,
  emptyExercise,
  emptyItem,
  emptyWarmup,
  emptyWorkout,
  saveExercise,
  saveWorkoutInProgram,
  uid,
  useGym,
} from "@/lib/gym-store";
import { EQUIPMENT, MUSCLE_GROUPS, type Exercise, type Workout, type WorkoutItem } from "@/lib/gym-types";

export const Route = createFileRoute("/programs/$programId/$dayId")({
  head: () => ({ meta: [{ title: "עורך יום אימון — הרוטינה שלי" }] }),
  component: DayBuilder,
});

const field = "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-base outline-none focus:border-primary";

/** Assign A1/A2… labels to maximal runs of adjacent items that share a supersetId. */
function computeSupersetLabels(items: WorkoutItem[]) {
  const labels: Record<string, string> = {};
  let group = -1;
  let i = 0;
  while (i < items.length) {
    const sid = items[i]?.supersetId;
    if (sid) {
      let j = i;
      const run: WorkoutItem[] = [];
      while (j < items.length && items[j]?.supersetId === sid) {
        run.push(items[j]!);
        j += 1;
      }
      if (run.length >= 2) {
        group += 1;
        const letter = String.fromCharCode(65 + (group % 26));
        run.forEach((it, k) => {
          labels[it.id] = `${letter}${k + 1}`;
        });
      }
      i = j;
    } else {
      i += 1;
    }
  }
  return labels;
}

function DayBuilder() {
  const { programId, dayId } = Route.useParams();
  const navigate = useNavigate();
  const { programs, workouts, exercises } = useGym();
  const program = programs.find((item) => item.id === programId);
  const existing = workouts.find((workout) => workout.id === dayId);
  const isNew = dayId === "new" || !dayId;
  const [draft, setDraft] = useState<Workout>(() => existing ?? emptyWorkout());
  const [picker, setPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [pickerGroup, setPickerGroup] = useState("הכל");
  const [pickerEquipment, setPickerEquipment] = useState("הכל");
  const [creatingExercise, setCreatingExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const sensors = useSensors(useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }), useSensor(PointerSensor));

  if (!program || (!isNew && !existing)) {
    return (
      <AppShell title="יום אימון לא נמצא">
        <p className="surface-card p-5 text-muted-foreground text-start">יום אימון זה אינו קיים עוד.</p>
      </AppShell>
    );
  }

  const labels = computeSupersetLabels(draft.items);

  const patchItem = (id: string, patch: Partial<WorkoutItem>) =>
    setDraft((current) => ({
      ...current,
      items: current.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));

  const toggleSupersetWithPrev = (index: number) => {
    setDraft((current) => {
      if (index <= 0) return current;
      const items = [...current.items];
      const item = items[index]!;
      const prev = items[index - 1]!;
      if (item.supersetId && item.supersetId === prev.supersetId) {
        items[index] = { ...item, supersetId: undefined };
      } else {
        const groupId = prev.supersetId ?? uid();
        items[index - 1] = { ...prev, supersetId: groupId };
        items[index] = { ...item, supersetId: groupId };
      }
      return { ...current, items };
    });
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    setDraft((current) => {
      const oldIndex = current.items.findIndex((item) => item.id === active.id);
      const newIndex = current.items.findIndex((item) => item.id === over.id);
      return oldIndex === -1 || newIndex === -1 ? current : { ...current, items: arrayMove(current.items, oldIndex, newIndex) };
    });
  };

  const save = () => {
    if (!draft.name.trim()) return;
    saveWorkoutInProgram(program.id, { ...draft, name: draft.name.trim() });
    navigate({ to: "/programs/$programId", params: { programId: program.id } });
  };

  const pickerExercises = exercises.filter(
    (exercise) =>
      (pickerGroup === "הכל" || exercise.muscleGroup === pickerGroup) &&
      (pickerEquipment === "הכל" || exercise.equipment === pickerEquipment) &&
      (exercise.name.toLowerCase().includes(pickerQuery.toLowerCase()) ||
        exercise.equipment.toLowerCase().includes(pickerQuery.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(pickerQuery.toLowerCase())),
  );

  const addExercise = (exerciseId: string) => {
    setDraft((current) => ({ ...current, items: [...current.items, emptyItem(exerciseId)] }));
    setPicker(false);
    setPickerQuery("");
  };

  const createAndAddExercise = () => {
    const name = newExerciseName.trim();
    if (!name) return;
    const exercise = emptyExercise();
    exercise.name = name;
    saveExercise(exercise);
    addExercise(exercise.id);
    setNewExerciseName("");
    setCreatingExercise(false);
  };

  return (
    <AppShell
      title={isNew ? "יום אימון חדש" : draft.name || "עורך אימון"}
      subtitle={`${draft.items.length} תרגילים`}
      action={
        <Link to="/programs/$programId" params={{ programId }} aria-label="חזרה לתכנית" className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95">
          <ArrowRight className="h-5 w-5" />
        </Link>
      }
    >
      <section className="surface-card p-4 sm:p-5 text-start">
        <label className="section-kicker block" htmlFor="day-name">שם יום האימון</label>
        <input id="day-name" data-testid="input-day-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} className={`${field} mt-1.5 font-display text-lg font-semibold`} placeholder="למשל: פלג גוף עליון 1" />
        <label className="section-kicker mt-3.5 block" htmlFor="day-notes">הערות ודגשים</label>
        <textarea id="day-notes" rows={2} value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} className={`${field} mt-1.5`} placeholder="דגשים ליום האימון..." />
      </section>

      <div className="mt-6 flex items-end justify-between text-start">
        <div>
          <p className="section-kicker">תרגילים</p>
          <h2 className="mt-0.5 font-display text-2xl font-semibold">רשימת התרגילים</h2>
        </div>
        <span className="text-xs text-muted-foreground">גרור לשינוי סדר</span>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={draft.items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-3.5 space-y-3">
            {draft.items.map((item, index) => {
              const ex = exercises.find((exercise) => exercise.id === item.exerciseId);
              return (
                <SortableItem
                  key={item.id}
                  item={item}
                  exercise={ex}
                  supersetLabel={labels[item.id]}
                  canSuperset={index > 0}
                  supersetActive={Boolean(item.supersetId && item.supersetId === draft.items[index - 1]?.supersetId)}
                  onToggleSuperset={() => toggleSupersetWithPrev(index)}
                  onPatch={patchItem}
                  onRemove={() => setDraft({ ...draft, items: draft.items.filter((entry) => entry.id !== item.id) })}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        data-testid="button-add-exercise-to-day"
        onClick={() => setPicker(true)}
        className="mt-4 flex h-14 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 font-semibold text-primary active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" /> הוסף תרגיל
      </button>

      <button
        type="button"
        data-testid="button-save-day"
        onClick={save}
        className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground active:scale-[0.98]"
      >
        <Save className="h-5 w-5" /> שמור יום אימון
      </button>

      {!isNew ? (
        <button
          type="button"
          onClick={() => window.confirm(`האם למחוק את "${draft.name}"?`) && (deleteWorkout(draft.id), navigate({ to: "/programs/$programId", params: { programId } }))}
          className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-secondary font-semibold text-destructive active:scale-[0.98]"
        >
          <Trash2 className="h-5 w-5" /> מחק יום אימון
        </button>
      ) : null}

      {picker ? (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-end bg-foreground/20 backdrop-blur-sm"
          onClick={() => setPicker(false)}
        >
          <div
            className="max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-border bg-card p-5 text-start"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-3.5 flex items-center justify-between">
              <div>
                <p className="section-kicker">ספריית תרגילים</p>
                <h2 className="font-display text-xl font-semibold">בחר תרגיל להוספה</h2>
              </div>
              <button
                type="button"
                onClick={() => setPicker(false)}
                aria-label="סגור בחירת תרגיל"
                className="grid h-10 w-10 place-items-center rounded-xl bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="num-pill flex h-11 items-center gap-2 px-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={pickerQuery}
                onChange={(event) => setPickerQuery(event.target.value)}
                placeholder="חפש לפי שם, ציוד או שריר..."
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <select
                value={pickerGroup}
                onChange={(event) => setPickerGroup(event.target.value)}
                className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs sm:text-sm outline-none"
                aria-label="סינון לפי קבוצת שרירים"
              >
                <option>הכל</option>
                {MUSCLE_GROUPS.map((group) => <option key={group}>{group}</option>)}
              </select>
              <select
                value={pickerEquipment}
                onChange={(event) => setPickerEquipment(event.target.value)}
                className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs sm:text-sm outline-none"
                aria-label="סינון לפי ציוד"
              >
                <option>הכל</option>
                {EQUIPMENT.map((equipment) => <option key={equipment}>{equipment}</option>)}
              </select>
            </div>

            <div className="mt-3.5 space-y-2">
              {pickerExercises.map((exercise) => (
                <button
                  type="button"
                  key={exercise.id}
                  onClick={() => addExercise(exercise.id)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl bg-secondary p-3.5 text-start active:scale-[0.99]"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-foreground">{exercise.name}</p>
                    <p className="text-xs text-muted-foreground">{exercise.muscleGroup}</p>
                  </div>
                  <span className="num-pill shrink-0 px-2.5 py-1 text-xs font-medium">{exercise.equipment}</span>
                </button>
              ))}
              {pickerExercises.length === 0 ? (
                <p className="rounded-xl bg-secondary p-4 text-sm text-muted-foreground">
                  לא נמצאו תרגילים מתאימים לחיפוש.
                </p>
              ) : null}
            </div>

            {creatingExercise ? (
              <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <label className="section-kicker block" htmlFor="new-picker-exercise">
                  תרגיל חדש
                </label>
                <div className="mt-2 flex gap-2">
                  <input
                    id="new-picker-exercise"
                    autoFocus
                    value={newExerciseName}
                    onChange={(event) => setNewExerciseName(event.target.value)}
                    placeholder="שם התרגיל"
                    className="min-w-0 flex-1 rounded-xl border border-border bg-card px-3 py-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={createAndAddExercise}
                    className="rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shrink-0"
                  >
                    הוסף
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreatingExercise(true)}
                className="mt-4 w-full rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary"
              >
                צור תרגיל חדש בספרייה
              </button>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function SortableItem({
  item,
  exercise,
  supersetLabel,
  canSuperset,
  supersetActive,
  onToggleSuperset,
  onPatch,
  onRemove,
}: {
  item: WorkoutItem;
  exercise: Exercise | undefined;
  supersetLabel: string | undefined;
  canSuperset: boolean;
  supersetActive: boolean;
  onToggleSuperset: () => void;
  onPatch: (id: string, patch: Partial<WorkoutItem>) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const [advanced, setAdvanced] = useState(false);
  const name = exercise?.name ?? "תרגיל שהוסר";
  const isRange = item.repType === "range";
  const warmups = item.warmups ?? [];
  const workingSets = item.workingSets ?? Array.from({ length: item.sets }, (_, index) => ({
    id: `${item.id}-set-${index}`,
    setNumber: index + 1,
    weight: item.weight,
    reps: item.reps,
  }));

  const setRepType = (type: "fixed" | "range") => {
    if (type === "range") {
      onPatch(item.id, { repType: "range", repMin: item.repMin ?? item.reps, repMax: item.repMax ?? item.reps + 2 });
    } else {
      onPatch(item.id, { repType: "fixed" });
    }
  };

  const patchWarmup = (wid: string, patch: Partial<{ weight: number; reps: number }>) =>
    onPatch(item.id, { warmups: warmups.map((w) => (w.id === wid ? { ...w, ...patch } : w)) });

  return (
    <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`surface-card p-4 text-start ${isDragging ? "relative z-10 opacity-75 shadow-lg" : ""} ${supersetLabel ? "border-r-4 border-r-primary/70" : ""}`}>
      <div className="flex items-center gap-2">
        <button type="button" {...attributes} {...listeners} aria-label={`שנה סדר ${name}`} className="grid h-9 w-9 shrink-0 touch-none place-items-center rounded-lg bg-secondary text-muted-foreground"><GripVertical className="h-4 w-4" /></button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {supersetLabel ? <span className="shrink-0 rounded-md bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">{supersetLabel}</span> : null}
            <p className="min-w-0 truncate font-semibold text-foreground">{name}</p>
          </div>
          {exercise ? <p className="mt-0.5 text-xs text-muted-foreground">{exercise.equipment}{exercise.muscleGroup ? ` · ${exercise.muscleGroup}` : ""}</p> : null}
        </div>
        <button type="button" onClick={onRemove} aria-label={`הסר ${name}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-destructive"><X className="h-4 w-4" /></button>
      </div>

      {canSuperset ? (
        <button
          type="button"
          onClick={onToggleSuperset}
          className={`mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors ${supersetActive ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}
        >
          {supersetActive ? <Link2Off className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
          {supersetActive ? "בטל סופר-סט עם התרגיל הקודם" : "חבר בסופר-סט לתרגיל הקודם"}
        </button>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stepper label="סטים" value={item.sets} min={1} onChange={(value) => onPatch(item.id, { sets: value })} />
        <Stepper label="מנוחה (שניות)" value={item.rest} step={15} suffix="ש׳" onChange={(value) => onPatch(item.id, { rest: value })} />
      </div>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">סוג חזרות</p>
          <div className="flex rounded-lg bg-secondary p-0.5 text-[11px] font-semibold">
            <button type="button" onClick={() => setRepType("fixed")} className={`rounded-md px-2.5 py-1 ${!isRange ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>קבוע</button>
            <button type="button" onClick={() => setRepType("range")} className={`rounded-md px-2.5 py-1 ${isRange ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>טווח חזרות</button>
          </div>
        </div>
        {isRange ? (
          <div className="grid grid-cols-2 gap-3">
            <Stepper label="חזרות מינימום" value={item.repMin ?? item.reps} min={0} onChange={(value) => onPatch(item.id, { repMin: value })} />
            <Stepper label="חזרות מקסימום" value={item.repMax ?? item.reps} min={0} onChange={(value) => onPatch(item.id, { repMax: value })} />
          </div>
        ) : (
          <Stepper label="חזרות מטרה" value={item.reps} min={0} onChange={(value) => onPatch(item.id, { reps: value })} />
        )}
      </div>

      {/* Per-Set Weights & Reps */}
      <div className="mt-3 rounded-xl border border-border bg-secondary/40 p-3">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">משקל וחזרות נפרדים לכל סט</p>
        <div className="space-y-2">
          {workingSets.slice(0, item.sets).map((set, index) => (
            <div key={set.id} className="space-y-1.5">
              <div className="grid grid-cols-[2rem_1fr_1fr] items-end gap-2">
                <span className="pb-3 text-center text-xs font-bold text-muted-foreground">#{index + 1}</span>
                <Stepper label="משקל (ק״ג)" value={set.weight} step={2.5} suffix="ק״ג" onChange={(weight) => onPatch(item.id, { workingSets: workingSets.map((current, i) => i === index ? { ...current, weight } : current) })} />
                <Stepper label="חזרות" value={set.reps} min={0} onChange={(reps) => onPatch(item.id, { workingSets: workingSets.map((current, i) => i === index ? { ...current, reps } : current) })} />
              </div>
              <label className="flex items-center gap-2 px-1 text-xs font-medium text-muted-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(set.dropSet)}
                  onChange={(event) =>
                    onPatch(item.id, {
                      workingSets: workingSets.map((current, i) =>
                        i === index ? { ...current, dropSet: event.target.checked } : current,
                      ),
                    })
                  }
                  className="h-4 w-4 rounded border-border"
                />
                סט דרופ-סט (Drop Set)
              </label>
            </div>
          ))}
        </div>
      </div>

      <input className={`${field} mt-3`} value={item.notes} onChange={(event) => onPatch(item.id, { notes: event.target.value })} placeholder="הערה לתרגיל (למשל: דגש על ירידה איטית)" />

      {/* Warm-up sets */}
      {warmups.length > 0 ? (
        <div className="mt-3 rounded-xl border border-dashed border-border bg-secondary/50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground"><Flame className="h-3.5 w-3.5 text-primary" /> סטי חימום</div>
          <div className="space-y-2">
            {warmups.map((w, wi) => (
              <div key={w.id} className="flex items-center gap-2">
                <span className="w-5 shrink-0 text-center text-xs font-semibold text-muted-foreground">{wi + 1}</span>
                <div className="grid flex-1 grid-cols-2 gap-2">
                  <Stepper label="ק״ג" value={w.weight} step={2.5} onChange={(value) => patchWarmup(w.id, { weight: value })} />
                  <Stepper label="חזרות (ניתן להזין > 9)" value={w.reps} min={0} onChange={(value) => patchWarmup(w.id, { reps: value })} />
                </div>
                <button type="button" aria-label="הסר סט חימום" onClick={() => onPatch(item.id, { warmups: warmups.filter((x) => x.id !== w.id) })} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-background text-destructive"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <button type="button" onClick={() => onPatch(item.id, { warmups: [...warmups, emptyWarmup()] })} className="mt-2 w-full rounded-lg bg-background py-2 text-xs font-semibold text-primary">הוסף סט חימום</button>
        </div>
      ) : (
        <button type="button" onClick={() => onPatch(item.id, { warmups: [emptyWarmup()] })} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-secondary py-2 text-xs font-semibold text-muted-foreground"><Flame className="h-3.5 w-3.5" /> הוסף סטי חימום</button>
      )}

      {/* Advanced: tempo / RIR / RPE */}
      <button type="button" onClick={() => setAdvanced((v) => !v)} className="mt-3 flex w-full items-center justify-between rounded-lg px-1 py-1.5 text-xs font-semibold text-muted-foreground">
        <span className="flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" /> מתקדם (קצב · RIR · RPE)</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${advanced ? "rotate-180" : ""}`} />
      </button>
      {advanced ? (
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">טמפו</label>
            <input value={item.tempo ?? ""} onChange={(event) => onPatch(item.id, { tempo: event.target.value })} placeholder="3-1-1-0" className="w-full rounded-lg border border-border bg-secondary px-2 py-2 text-center text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">RIR</label>
            <input inputMode="numeric" value={item.rir ?? ""} onChange={(event) => onPatch(item.id, { rir: event.target.value === "" ? null : Number(event.target.value.replace(/\D/g, "")) })} placeholder="—" className="w-full rounded-lg border border-border bg-secondary px-2 py-2 text-center text-sm outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-muted-foreground">RPE</label>
            <input inputMode="decimal" value={item.rpe ?? ""} onChange={(event) => onPatch(item.id, { rpe: event.target.value === "" ? null : Number(event.target.value.replace(/[^\d.]/g, "")) })} placeholder="—" className="w-full rounded-lg border border-border bg-secondary px-2 py-2 text-center text-sm outline-none focus:border-primary" />
          </div>
        </div>
      ) : null}
    </article>
  );
}
