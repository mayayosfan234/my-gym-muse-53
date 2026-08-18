import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ImagePlus, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  deleteExercise,
  emptyExercise,
  lastPerformance,
  saveExercise,
  useGym,
} from "@/lib/gym-store";
import { EQUIPMENT, MUSCLE_GROUPS, type Exercise } from "@/lib/gym-types";

export const Route = createFileRoute("/exercises/$exerciseId")({
  head: () => ({
    meta: [
      { title: "Exercise Details — GymTrack" },
      {
        name: "description",
        content: "Exercise details: muscle group, equipment, media and personal notes.",
      },
      { property: "og:title", content: "Exercise Details — GymTrack" },
      {
        property: "og:description",
        content: "Exercise details: muscle group, equipment, media and personal notes.",
      },
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

  if (!isNew && !existing) {
    return (
      <AppShell title="Not found">
        <p className="surface-card p-5 text-muted-foreground">
          This exercise no longer exists.
        </p>
      </AppShell>
    );
  }

  const ex = existing ?? draft;
  const last = lastPerformance(history, ex.id);

  const set = (patch: Partial<Exercise>) => setDraft({ ...draft, ...patch });

  const onSave = () => {
    if (!draft.name.trim()) return;
    saveExercise(draft);
    if (isNew) navigate({ to: "/exercises/$exerciseId", params: { exerciseId: draft.id } });
    else setEditing(false);
  };

  return (
    <AppShell
      title={isNew ? "New Exercise" : editing ? "Edit Exercise" : ex.name}
      subtitle={!editing && !isNew ? `${ex.muscleGroup} · ${ex.equipment}` : undefined}
      action={
        <div className="flex gap-2">
          <Link
            to="/exercises"
            aria-label="Back"
            className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {editing ? (
            <button
              onClick={onSave}
              aria-label="Save"
              className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95"
            >
              <Check className="h-5 w-5" />
            </button>
          ) : (
            <button
              onClick={() => {
                setDraft(ex);
                setEditing(true);
              }}
              aria-label="Edit"
              className="grid h-11 w-11 place-items-center rounded-xl bg-secondary active:scale-95"
            >
              <Pencil className="h-5 w-5" />
            </button>
          )}
        </div>
      }
    >
      {editing ? (
        <div className="space-y-4">
          <div>
            <label className={labelCls}>Exercise name</label>
            <input
              className={field}
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="e.g. Incline Dumbbell Press"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Muscle group</label>
              <select
                className={field}
                value={draft.muscleGroup}
                onChange={(e) => set({ muscleGroup: e.target.value })}
              >
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Equipment</label>
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
            <label className={labelCls}>Description</label>
            <textarea
              rows={3}
              className={field}
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
            />
          </div>
          <div>
            <label className={labelCls}>Video URL</label>
            <input
              className={field}
              value={draft.videoUrl}
              onChange={(e) => set({ videoUrl: e.target.value })}
              placeholder="YouTube or MP4 link"
            />
          </div>
          <ImagesEditor images={draft.images} onChange={(images) => set({ images })} />
          <div>
            <label className={labelCls}>Personal notes</label>
            <textarea
              rows={3}
              className={field}
              value={draft.notes}
              onChange={(e) => set({ notes: e.target.value })}
            />
          </div>

          <button
            onClick={onSave}
            className="h-14 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground active:scale-[0.98]"
          >
            Save exercise
          </button>

          {!isNew && (
            <button
              onClick={() => {
                deleteExercise(ex.id);
                navigate({ to: "/exercises" });
              }}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-secondary text-base font-semibold text-destructive active:scale-[0.98]"
            >
              <Trash2 className="h-5 w-5" /> Delete exercise
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {ex.images.length > 0 && (
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5">
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
              className="surface-card block p-4 text-sm font-medium text-primary"
            >
              Watch technique video
            </a>
          )}

          <Panel title="Description">
            {ex.description || "No description yet."}
          </Panel>
          <Panel title="Personal notes">{ex.notes || "No notes yet."}</Panel>

          <div className="surface-card p-4">
            <p className={labelCls}>Last performance</p>
            {last ? (
              <>
                <p className="mb-2 text-sm text-muted-foreground">
                  {new Date(last.date).toLocaleDateString()}
                </p>
                <div className="flex flex-wrap gap-2">
                  {last.sets.map((s, i) => (
                    <span key={i} className="num-pill px-3 py-1 text-sm">
                      {s.weight}kg × {s.reps}
                    </span>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not performed yet.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="surface-card p-4">
      <p className={labelCls}>{title}</p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{children}</p>
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
    <div>
      <label className={labelCls}>Images</label>
      <div className="flex gap-2">
        <input
          className={field}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Image URL"
        />
        <button
          type="button"
          aria-label="Add image"
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
                alt={`Exercise image ${i + 1}`}
                className="h-20 w-20 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                aria-label="Remove image"
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
