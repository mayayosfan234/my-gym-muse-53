import { useSyncExternalStore } from "react";
import type {
  Exercise,
  GymData,
  HistorySession,
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

  const workouts: Workout[] = [
    {
      id: "w-push",
      name: "Push Day",
      notes: "Chest focused",
      items: [
        {
          id: uid(),
          exerciseId: "ex-bench",
          sets: 4,
          reps: 8,
          weight: 60,
          rest: 120,
          notes: "",
        },
        {
          id: uid(),
          exerciseId: "ex-curl",
          sets: 3,
          reps: 12,
          weight: 12,
          rest: 60,
          notes: "",
        },
      ],
    },
    {
      id: "w-legs",
      name: "Leg Day",
      notes: "",
      items: [
        {
          id: uid(),
          exerciseId: "ex-squat",
          sets: 5,
          reps: 5,
          weight: 90,
          rest: 180,
          notes: "Warm up properly",
        },
        {
          id: uid(),
          exerciseId: "ex-plank",
          sets: 3,
          reps: 1,
          weight: 0,
          rest: 60,
          notes: "60s hold",
        },
      ],
    },
  ];

  return { exercises: ex, workouts, history: [] };
};

let data: GymData = seed();
let hydrated = false;
const listeners = new Set<() => void>();

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) data = { ...seed(), ...(JSON.parse(raw) as GymData) };
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

/* ---------- workouts ---------- */
export function saveWorkout(w: Workout) {
  const exists = data.workouts.some((x) => x.id === w.id);
  set({
    ...data,
    workouts: exists
      ? data.workouts.map((x) => (x.id === w.id ? w : x))
      : [...data.workouts, w],
  });
}

export function deleteWorkout(id: string) {
  set({ ...data, workouts: data.workouts.filter((w) => w.id !== id) });
}

export function emptyWorkout(): Workout {
  return { id: uid(), name: "", notes: "", items: [] };
}

export function emptyItem(exerciseId: string): WorkoutItem {
  return { id: uid(), exerciseId, sets: 3, reps: 10, weight: 20, rest: 90, notes: "" };
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
