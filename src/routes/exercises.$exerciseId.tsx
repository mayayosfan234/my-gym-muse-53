import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowRight, Check, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  deleteExercise,
  emptyExercise,
  lastPerformance,
  personalRecords,
  saveExercise,
  useGym,
} from "@/lib/gym-store";
import { EQUIPMENT, EXERCISE_CATEGORIES, MUSCLE_GROUPS, type Exercise } from "@/lib/gym-types";

export const Route = createFileRoute("/exercises/$exerciseId")({
  head: () => ({
    meta: [
      { title: "פרטי תרגיל — הרוטינה שלי" },
      {
        name: "description",
        content: "פרטי תרגיל: קבוצת שרירים, ציוד, הוראות ביצוע והערות אישיות.",
      },
      { property: "og:title", content: "פרטי תרגיל — הרוטינה שלי" },
    ],
  }),
  component: ExerciseDetail,
});

const field =
  "w-full rounded-xl border border-border bg-secondary px-4 py-3 text-base outline-none focus:border-primary";
const labelCls =
  "mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground";

function ExerciseDetail() {
  const { exerciseId } = Route.useParams();
  const navigate = useNavigate();
  const { exercises, history } = useGym();
  const isNew = exerciseId === "new";
  const existing = exercises.find((e) => e.id === exerciseId);

  const [editing, setEditing] = useState(isNew);
  const [draft, setDraft] = useState<Exercise>(existing ?? emptyExercise());
  const [customMuscle, setCustomMuscle] = useState(() =>
    existing?.customMuscleGroup || (existing && !MUSCLE_GROUPS.includes(existing.muscleGroup) ? existing.muscleGroup : ""),
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [exerciseId]);

  if (!isNew && !existing) {
    return (
      <AppShell title="תרגיל לא נמצא">
        <p className="surface-card p-5 text-muted-foreground text-start">
          תרגיל זה אינו קיים עוד בספרייה.
        </p>
      </AppShell>
    );
  }

  const ex = existing ?? draft;
  const last = lastPerformance(history, ex.id);
  const pr = personalRecords(history, ex.id);

  const toggleMuscleGroup = (m: string) => {
    setDraft((d) => {
      const current = d.muscleGroups ?? [d.muscleGroup];
      const exists = current.includes(m);
      const updated = exists ? current.filter((x) => x !== m) : [...current, m];
      return {
        ...d,
        muscleGroup: updated[0] ?? m,
        muscleGroups: updated,
      };
    });
  };

  const toggleSecondary = (m: string) =>
    setDraft((d) => {
      const current = d.secondaryMuscles ?? [];
      return {
        ...d,
        secondaryMuscles: current.includes(m)
          ? current.filter((x) => x !== m)
          : [...current, m],
      };
    });

  const set = (patch: Partial<Exercise>) => setDraft({ ...draft, ...patch });

  const onSave = () => {
    const isOther = draft.muscleGroup === "אחר" || (draft.muscleGroups ?? []).includes("אחר");
    const customValue = isOther ? customMuscle.trim() : undefined;
    const finalMuscleGroup = isOther && customValue ? customValue : draft.muscleGroup;

    if (!draft.name.trim() || !finalMuscleGroup) return;
    saveExercise({
      ...draft,
      muscleGroup: finalMuscleGroup,
      customMuscleGroup: customValue,
    });
    if (isNew) navigate({ to: "/exercises/$exerciseId", params: { exerciseId: draft.id } });
    else setEditing(false);
  };

  return (
    <AppShell
      title={isNew ? "תרגיל חדש" : editing ? "עריכת תרגיל" : ex.name}
      subtitle={!editing && !isNew ? `${ex.customMuscleGroup || ex.muscleGroup} · ${ex.equipment}` : undefined}
      action={
        <div className="flex gap-2">
          <Link
            to="/exercises"
            aria-label="חזרה"
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          {editing ? (
            <button
              type="button"
              onClick={onSave}
              aria-label="שמור"
              className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95 shadow-sm"
            >
              <Check className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setDraft(ex);
                setEditing(true);
              }}
              aria-label="ערוך"
              className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
            >
              <Pencil className="h-5 w-5" />
            </button>
          )}
        </div>
      }
    >
      {editing ? (
        <div className="space-y-4 text-start">
          <div>
            <label className={labelCls}>שם התרגיל</label>
            <input
              className={field}
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="למשל: לחיצת חזה בשיפוע חיובי"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>קבוצת שרירים ראשת</label>
              <select
                className={field}
                value={MUSCLE_GROUPS.includes(draft.muscleGroup) ? draft.muscleGroup : "אחר"}
                onChange={(e) => set({ muscleGroup: e.target.value })}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
              {draft.muscleGroup === "אחר" ? (
                <input
                  className={`${field} mt-2`}
                  value={customMuscle}
                  onChange={(e) => setCustomMuscle(e.target.value)}
                  placeholder="הקלד קבוצת שרירים מותאמת אישית"
                />
              ) : null}
            </div>
            <div>
              <label className={labelCls}>ציוד</label>
              <select
                className={field}
                value={draft.equipment}
                onChange={(e) => set({ equipment: e.target.value })}
              >
                {EQUIPMENT.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelCls}>קטגוריה</label>
            <select
              className={field}
              value={draft.category ?? ""}
              onChange={(e) => set({ category: e.target.value })}
            >
              <option value="">— ללא —</option>
              {EXERCISE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>בחירת מרובת של קבוצות שרירים עובדות</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {MUSCLE_GROUPS.map((m) => {
                const active = (draft.muscleGroups ?? [draft.muscleGroup]).includes(m);
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => toggleMuscleGroup(m)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>שרירים משניים (עוזרים)</label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {MUSCLE_GROUPS.map((m) => {
                const active = (draft.secondaryMuscles ?? []).includes(m);
                return (
                  <button
                    type="button"
                    key={m}
                    onClick={() => toggleSecondary(m)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={labelCls}>תיאור התרגיל</label>
            <textarea
              rows={3}
              className={field}
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="תיאור קצר על התרגיל..."
            />
          </div>

          <div>
            <label className={labelCls}>הוראות ביצוע שלב אחר שלב</label>
            <textarea
              rows={3}
              className={field}
              value={draft.instructions ?? ""}
              onChange={(e) => set({ instructions: e.target.value })}
              placeholder="1. אחוז במוט ברוחב כתפיים..."
            />
          </div>

          <div>
            <label className={labelCls}>דגשי טכניקה וטיפים</label>
            <textarea
              rows={2}
              className={field}
              value={draft.tips ?? ""}
              onChange={(e) => set({ tips: e.target.value })}
              placeholder="למשל: לשמור על מרפקים בזווית 45 מעלות"
            />
          </div>

          <div>
            <label className={labelCls}>קישור לסרטון הדגמה (URL)</label>
            <input
              className={field}
              value={draft.videoUrl}
              onChange={(e) => set({ videoUrl: e.target.value })}
              placeholder="https://youtube.com/..."
            />
          </div>

          <ImagesEditor images={draft.images} onChange={(images) => set({ images })} />

          <div>
            <label className={labelCls}>הערות אישיות</label>
            <textarea
              rows={3}
              className={field}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
              placeholder="הערות אישיות לגבי התרגיל..."
            />
          </div>

          <button
            type="button"
            onClick={onSave}
            className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground active:scale-[0.98] shadow-md"
          >
            שמור תרגיל
          </button>

          {!isNew && (
            <button
              type="button"
              onClick={() => {
                deleteExercise(ex.id);
                navigate({ to: "/exercises" });
              }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-base font-semibold text-destructive active:scale-[0.98]"
            >
              <Trash2 className="h-5 w-5" /> מחק תרגיל
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4 text-start">
          {ex.images.length > 0 && (
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 no-scrollbar">
              {ex.images.map((src, i) => (
                <img
                  key={i}
                  src={src}
                  alt={`${ex.name} ${i + 1}`}
                  loading="lazy"
                  className="h-44 w-64 shrink-0 rounded-xl border border-border object-cover"
                />
              ))}
            </div>
          )}

          {ex.videoUrl && (
            <a
              href={ex.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="surface-card block p-4 text-sm font-semibold text-primary"
            >
              צפה בסרטון הדגמה לתרגיל
            </a>
          )}

          <div className="surface-card p-4">
            <p className={labelCls}>מאפיינים</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              <span className="num-pill px-3 py-1 text-xs font-semibold">{ex.equipment}</span>
              <span className="num-pill px-3 py-1 text-xs font-semibold">{ex.customMuscleGroup || ex.muscleGroup}</span>
              {ex.category ? <span className="num-pill px-3 py-1 text-xs font-semibold">{ex.category}</span> : null}
            </div>
            {(ex.secondaryMuscles ?? []).length > 0 ? (
              <div className="mt-3">
                <p className={labelCls}>שרירים משניים עובדים</p>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {ex.secondaryMuscles!.map((m) => (
                    <span key={m} className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">{m}</span>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <Panel title="תיאור התרגיל">
            {ex.description || "אין תיאור לתרגיל זה."}
          </Panel>
          {ex.instructions ? <Panel title="הוראות ביצוע">{ex.instructions}</Panel> : null}
          {ex.tips ? <Panel title="דגשים וטיפים">{ex.tips}</Panel> : null}
          <Panel title="הערות אישיות">{ex.notes || "אין הערות אישיות."}</Panel>

          <div className="surface-card p-4">
            <p className={labelCls}>שיאים אישיים</p>
            {pr ? (
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="num-pill p-3 text-center">
                  <p className="text-lg font-bold tabular-nums text-foreground">{pr.heaviest}</p>
                  <p className="text-[11px] text-muted-foreground">משקל שיא (ק"ג)</p>
                </div>
                <div className="num-pill p-3 text-center">
                  <p className="text-lg font-bold tabular-nums text-foreground">{pr.bestRepsAtHeaviest}</p>
                  <p className="text-[11px] text-muted-foreground">חזרות בשיא</p>
                </div>
                <div className="num-pill p-3 text-center">
                  <p className="text-lg font-bold tabular-nums text-foreground">{pr.estimatedMax}</p>
                  <p className="text-[11px] text-muted-foreground">משקל משוער ל-1RM</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">עדיין לא נרשמו שיאים לתרגיל זה.</p>
            )}
          </div>

          <div className="surface-card p-4">
            <p className={labelCls}>ביצוע אחרון</p>
            {last ? (
              <>
                <p className="mb-2 text-xs text-muted-foreground">
                  {new Date(last.date).toLocaleDateString("he-IL")}
                </p>
                <div className="flex flex-wrap gap-1.5" dir="ltr">
                  {last.sets.map((s, i) => (
                    <span key={i} className="num-pill px-3 py-1 text-xs font-semibold">
                      {s.weight}kg × {s.reps}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">תרגיל זה טרם בוצע באימון פעיל.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-4 text-start">
      <p className={labelCls}>{title}</p>
      <p className="whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-foreground mt-1">{children}</p>
    </div>
  );
}

function ImagesEditor({
  images,
  onChange,
}: {
  images: string[];
  onChange: (v: string[]) => void;
}) {
  const [url, setUrl] = useState("");
  return (
    <div className="text-start">
      <label className={labelCls}>תמונות תרגיל</label>
      <div className="flex gap-2">
        <input
          className={field}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="קישור לתמונה (URL)"
        />
        <button
          type="button"
          aria-label="הוסף תמונה"
          onClick={() => {
            if (!url.trim()) return;
            onChange([...images, url.trim()]);
            setUrl("");
          }}
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-secondary active:scale-95"
        >
          <ImagePlus className="h-5 w-5" />
        </button>
      </div>
      {images.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((src, i) => (
            <div key={i} className="relative">
              <img
                src={src}
                alt={`תמונת תרגיל ${i + 1}`}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                aria-label="הסר תמונה"
                onClick={() => onChange(images.filter((_, j) => j !== i))}
                className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full bg-destructive text-destructive-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
