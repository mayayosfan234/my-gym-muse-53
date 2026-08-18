import { useSyncExternalStore } from "react";
import type {
  Exercise,
  GymData,
  HistorySession,
  Program,
  Workout,
  WorkoutItem,
} from "./gym-types";

const KEY = "gymtrack.v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

const seed = (): GymData => {
  const ex: Exercise[] = [
    {
      id: "ex-bench",
      name: "Barbell Bench Press",
      muscleGroup: "Chest",
      equipment: "Barbell",
      description:
        "Lie flat, grip slightly wider than shoulders, lower to mid chest and press up.",
      videoUrl: "",
      images: [],
      notes: "Keep shoulder blades retracted.",
    },
    {
      id: "ex-squat",
      name: "Back Squat",
      muscleGroup: "Legs",
      equipment: "Barbell",
      description: "Bar on upper back, sit down and back, drive through mid foot.",
      videoUrl: "",
      images: [],
      notes: "Belt above 100kg.",
    },
    {
      id: "ex-row",
      name: "Seated Cable Row",
      muscleGroup: "Back",
      equipment: "Cable",
      description: "Pull the handle to the navel, squeeze the shoulder blades.",
      videoUrl: "",
      images: [],
      notes: "",
    },
    {
      id: "ex-curl",
      name: "Dumbbell Curl",
      muscleGroup: "Biceps",
      equipment: "Dumbbell",
      description: "Curl without swinging, controlled negative.",
      videoUrl: "",
      images: [],
      notes: "",
    },
    {
      id: "ex-plank",
      name: "Plank",
      muscleGroup: "Core",
      equipment: "Bodyweight",
      description: "Hold a straight line from head to heels.",
      videoUrl: "",
      images: [],
      notes: "",
    },
  ];

  const day = (
    id: string,
    name: string,
    items: [string, number, number, number, number][],
  ): Workout => ({
    id,
    name,
    notes: "",
    items: items.map(([exerciseId, sets, reps, weight, rest], i) => ({
      id: `${id}-i${i}`,
      exerciseId,
      sets,
      reps,
      weight,
      rest,
      notes: "",
    })),
  });

  // Starting template only — every day, name, order and exercise is editable.
  const workouts: Workout[] = [
    day("w-lower-1", "Lower Body 1", [
      ["ex-squat", 4, 6, 80, 150],
      ["ex-plank", 3, 1, 0, 60],
    ]),
    day("w-upper-1", "Upper Body 1", [
      ["ex-bench", 4, 8, 60, 120],
      ["ex-row", 3, 10, 45, 90],
    ]),
    day("w-lower-2", "Lower Body 2", [
      ["ex-squat", 3, 10, 60, 120],
      ["ex-plank", 3, 1, 0, 60],
    ]),
    day("w-upper-2", "Upper Body 2", [
      ["ex-row", 4, 10, 45, 90],
      ["ex-curl", 3, 12, 12, 60],
    ]),
  ];

  const programs: Program[] = [
    {
      id: "p-default",
      name: "My Program",
      notes: "4-day starting template",
      dayIds: workouts.map((w) => w.id),
    },
  ];


  return { exercises: ex, workouts, programs, history: [] };
};

let data: GymData = seed();
let hydrated = false;
const listeners = new Set<() => void>();

/** Ensure older saved data (without programs) still works. */
function migrate(d: GymData): GymData {
  const workouts = d.workouts ?? [];
  let programs = d.programs ?? [];
  if (!programs.length && workouts.length) {
    programs = [
      { id: uid(), name: "My Workouts", notes: "", dayIds: workouts.map((w) => w.id) },
    ];
  }
  return { ...d, workouts, programs, history: d.history ?? [] };
}

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) data = migrate({ ...seed(), ...(JSON.parse(raw) as GymData) });
  } catch {
    /* ignore */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

function set(next: GymData) {
  data = next;
  persist();
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  load();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot: GymData = seed();

export function useGym(): GymData {
  return useSyncExternalStore(
    subscribe,
    () => {
      load();
      return data;
    },
    () => serverSnapshot,
  );
}

/* ---------- exercises ---------- */
export function saveExercise(ex: Exercise) {
  const exists = data.exercises.some((e) => e.id === ex.id);
  set({
    ...data,
    exercises: exists
      ? data.exercises.map((e) => (e.id === ex.id ? ex : e))
      : [...data.exercises, ex],
  });
}

export function deleteExercise(id: string) {
  set({
    ...data,
    exercises: data.exercises.filter((e) => e.id !== id),
    workouts: data.workouts.map((w) => ({
      ...w,
      items: w.items.filter((i) => i.exerciseId !== id),
    })),
  });
}

export function emptyExercise(): Exercise {
  return {
    id: uid(),
    name: "",
    muscleGroup: "Chest",
    equipment: "Barbell",
    description: "",
    videoUrl: "",
    images: [],
    notes: "",
  };
}

/* ---------- workout days ---------- */
export function saveWorkout(w: Workout) {
  const exists = data.workouts.some((x) => x.id === w.id);
  set({
    ...data,
    workouts: exists
      ? data.workouts.map((x) => (x.id === w.id ? w : x))
      : [...data.workouts, w],
  });
}

/** Save a workout day and make sure it belongs to the given program. */
export function saveWorkoutInProgram(programId: string, w: Workout) {
  const exists = data.workouts.some((x) => x.id === w.id);
  const workouts = exists
    ? data.workouts.map((x) => (x.id === w.id ? w : x))
    : [...data.workouts, w];
  const programs = data.programs.map((p) =>
    p.id === programId && !p.dayIds.includes(w.id)
      ? { ...p, dayIds: [...p.dayIds, w.id] }
      : p,
  );
  set({ ...data, workouts, programs });
}

export function deleteWorkout(id: string) {
  set({
    ...data,
    workouts: data.workouts.filter((w) => w.id !== id),
    programs: data.programs.map((p) => ({
      ...p,
      dayIds: p.dayIds.filter((d) => d !== id),
    })),
  });
}

export function duplicateWorkoutDay(programId: string, dayId: string) {
  const day = data.workouts.find((w) => w.id === dayId);
  const program = data.programs.find((p) => p.id === programId);
  if (!day || !program) return;
  const copy: Workout = {
    ...day,
    id: uid(),
    name: `${day.name} copy`,
    items: day.items.map((i) => ({ ...i, id: uid() })),
  };
  const index = program.dayIds.indexOf(dayId);
  const dayIds = [...program.dayIds];
  dayIds.splice(index + 1, 0, copy.id);
  set({
    ...data,
    workouts: [...data.workouts, copy],
    programs: data.programs.map((p) => (p.id === programId ? { ...p, dayIds } : p)),
  });
}

export function reorderProgramDays(programId: string, dayIds: string[]) {
  set({
    ...data,
    programs: data.programs.map((p) => (p.id === programId ? { ...p, dayIds } : p)),
  });
}

export function emptyWorkout(): Workout {
  return { id: uid(), name: "", notes: "", items: [] };
}

export function emptyItem(exerciseId: string): WorkoutItem {
  return { id: uid(), exerciseId, sets: 3, reps: 10, weight: 20, rest: 90, notes: "" };
}

/* ---------- programs ---------- */
export function saveProgram(p: Program) {
  const exists = data.programs.some((x) => x.id === p.id);
  set({
    ...data,
    programs: exists
      ? data.programs.map((x) => (x.id === p.id ? p : x))
      : [...data.programs, p],
  });
}

export function createProgram(name: string): Program {
  const p: Program = { id: uid(), name: name.trim() || "New program", notes: "", dayIds: [] };
  set({ ...data, programs: [...data.programs, p] });
  return p;
}

export function deleteProgram(id: string) {
  const program = data.programs.find((p) => p.id === id);
  const orphan = new Set(program?.dayIds ?? []);
  set({
    ...data,
    programs: data.programs.filter((p) => p.id !== id),
    workouts: data.workouts.filter((w) => !orphan.has(w.id)),
  });
}

export function duplicateProgram(id: string) {
  const program = data.programs.find((p) => p.id === id);
  if (!program) return;
  const newDays: Workout[] = [];
  const dayIds = program.dayIds.map((dayId) => {
    const day = data.workouts.find((w) => w.id === dayId);
    if (!day) return dayId;
    const copy: Workout = {
      ...day,
      id: uid(),
      items: day.items.map((i) => ({ ...i, id: uid() })),
    };
    newDays.push(copy);
    return copy.id;
  });
  set({
    ...data,
    workouts: [...data.workouts, ...newDays],
    programs: [
      ...data.programs,
      { id: uid(), name: `${program.name} copy`, notes: program.notes, dayIds },
    ],
  });
}

export function programDays(d: GymData, programId: string): Workout[] {
  const program = d.programs.find((p) => p.id === programId);
  if (!program) return [];
  return program.dayIds
    .map((id) => d.workouts.find((w) => w.id === id))
    .filter((w): w is Workout => Boolean(w));
}

/* ---------- history ---------- */
export function saveSession(session: HistorySession) {
  set({ ...data, history: [session, ...data.history] });
}

export function deleteSession(id: string) {
  set({ ...data, history: data.history.filter((s) => s.id !== id) });
}

export function lastPerformance(history: HistorySession[], exerciseId: string) {
  for (const s of history) {
    const e = s.entries.find((x) => x.exerciseId === exerciseId);
    if (e && e.sets.length) return { date: s.date, sets: e.sets };
  }
  return null;
}
