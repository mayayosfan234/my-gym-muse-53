import { closestCenter, DndContext, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Copy, GripVertical, Play, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { deleteWorkout, duplicateWorkoutDay, reorderProgramDays, saveProgram, useGym } from "@/lib/gym-store";
import type { Program, Workout } from "@/lib/gym-types";

export const Route = createFileRoute("/programs/$programId")({
  head: () => ({ meta: [{ title: "תכנית אימונים — הרוטינה שלי" }] }),
  component: ProgramDetail,
});

function ProgramDetail() {
  const { programId } = Route.useParams();
  const navigate = useNavigate();
  const { programs, workouts } = useGym();
  const program = programs.find((item) => item.id === programId);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Program | null>(null);
  const sensors = useSensors(useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }), useSensor(PointerSensor));

  if (!program) {
    return <AppShell title="תכנית לא נמצאה"><p className="surface-card p-5 text-muted-foreground text-start">תכנית זו אינה קיימת עוד.</p></AppShell>;
  }

  const days = program.dayIds.map((id) => workouts.find((workout) => workout.id === id)).filter((day): day is Workout => Boolean(day));
  const current = draft ?? program;
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = program.dayIds.indexOf(String(active.id));
    const newIndex = program.dayIds.indexOf(String(over.id));
    if (oldIndex !== -1 && newIndex !== -1) reorderProgramDays(program.id, arrayMove(program.dayIds, oldIndex, newIndex));
  };
  const save = () => {
    if (!current.name.trim()) return;
    saveProgram({ ...current, name: current.name.trim() });
    setEditing(false);
    setDraft(null);
  };

  return (
    <AppShell
      title={program.name}
      subtitle={`${days.length} ימי אימון`}
      action={<Link to="/programs" aria-label="חזרה לתוכניות" className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"><ArrowRight className="h-5 w-5" /></Link>}
    >
      <section className="surface-card p-5 sm:p-6 text-start">
        {editing ? (
          <div className="space-y-3">
            <label className="section-kicker block" htmlFor="program-title">שם התכנית</label>
            <input id="program-title" value={current.name} onChange={(event) => setDraft({ ...current, name: event.target.value })} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 text-lg font-semibold outline-none focus:border-primary" />
            <label className="section-kicker block" htmlFor="program-notes">הערות / דגשים</label>
            <textarea id="program-notes" rows={3} value={current.notes} onChange={(event) => setDraft({ ...current, notes: event.target.value })} className="w-full rounded-xl border border-border bg-secondary px-4 py-3 outline-none focus:border-primary" />
            <div className="flex gap-2">
              <button type="button" onClick={save} className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">שמור שינויים</button>
              <button type="button" onClick={() => { setEditing(false); setDraft(null); }} className="rounded-xl bg-secondary px-4 py-3 text-sm font-semibold">ביטול</button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1">
              <p className="section-kicker">דגשים ותיאור</p>
              <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted-foreground">{program.notes || "אין הערות מיוחדות לתכנית זו."}</p>
            </div>
            <button type="button" onClick={() => { setDraft(program); setEditing(true); }} className="rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold active:scale-95">ערוך</button>
          </div>
        )}
      </section>

      <div className="mt-6 flex items-end justify-between text-start">
        <div>
          <p className="section-kicker">ימי אימון בתכנית</p>
          <h2 className="mt-0.5 font-display text-2xl font-semibold">סדר הימים</h2>
        </div>
        <Link to="/programs/$programId/$dayId" params={{ programId: program.id, dayId: "new" }} className="flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2.5 text-xs sm:text-sm font-semibold text-primary-foreground active:scale-95"><Plus className="h-4 w-4" /> הוסף יום</Link>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={days.map((day) => day.id)} strategy={verticalListSortingStrategy}>
          <div className="mt-3.5 space-y-3">
            {days.map((day, index) => (
              <SortableDay key={day.id} day={day} index={index} programId={program.id} onDelete={() => window.confirm(`האם למחוק את "${day.name}"?`) && deleteWorkout(day.id)} onDuplicate={() => duplicateWorkoutDay(program.id, day.id)} onStart={() => navigate({ to: "/session/$workoutId", params: { workoutId: day.id } })} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      {days.length === 0 ? <div className="surface-card mt-4 p-8 text-center text-sm text-muted-foreground">עדיין אין ימי אימון בתכנית זו. לחץ על "הוסף יום" כדי להתחיל.</div> : null}
    </AppShell>
  );
}

function SortableDay({ day, index, programId, onDelete, onDuplicate, onStart }: { day: Workout; index: number; programId: string; onDelete: () => void; onDuplicate: () => void; onStart: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: day.id });
  return (
    <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`surface-card p-4 text-start ${isDragging ? "relative z-10 opacity-75 shadow-lg" : ""}`}>
      <div className="flex items-center gap-3">
        <button type="button" {...attributes} {...listeners} aria-label={`שנה סדר ${day.name}`} className="grid h-10 w-9 shrink-0 touch-none place-items-center rounded-xl bg-secondary text-muted-foreground"><GripVertical className="h-4 w-4" /></button>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 font-display font-semibold text-primary">{String(index + 1).padStart(2, "0")}</div>
        <Link to="/programs/$programId/$dayId" params={{ programId, dayId: day.id }} className="min-w-0 flex-1"><p className="truncate font-display text-lg font-semibold text-foreground">{day.name || "יום ללא שם"}</p><p className="text-xs text-muted-foreground">{day.items.length} תרגילים</p></Link>
        <button type="button" onClick={onStart} aria-label={`התחל את ${day.name}`} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95"><Play className="h-4 w-4 fill-current" /></button>
      </div>
      <div className="mt-3 flex justify-end gap-1.5 border-t border-border/60 pt-2.5">
        <Link to="/programs/$programId/$dayId" params={{ programId, dayId: day.id }} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary">ערוך יום</Link>
        <button type="button" onClick={onDuplicate} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary" aria-label={`שכפל ${day.name}`}><Copy className="h-4 w-4" /></button>
        <button type="button" onClick={onDelete} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-destructive" aria-label={`מחק ${day.name}`}><Trash2 className="h-4 w-4" /></button>
      </div>
    </article>
  );
}
