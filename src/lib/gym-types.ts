export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  description: string;
  videoUrl: string;
  images: string[];
  notes: string;
};

export type WorkoutItem = {
  id: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: number;
  rest: number; // seconds
  notes: string;
};

export type Workout = {
  id: string;
  name: string;
  notes: string;
  items: WorkoutItem[];
};

/** A training program: a named collection of workout days. */
export type Program = {
  id: string;
  name: string;
  notes: string;
  dayIds: string[];
};

export type LoggedSet = {
  reps: number;
  weight: number;
  done: boolean;
};

export type HistoryEntry = {
  exerciseId: string;
  exerciseName: string;
  sets: LoggedSet[];
  notes: string;
};

export type HistorySession = {
  id: string;
  workoutId: string;
  workoutName: string;
  date: string; // ISO
  durationSec: number;
  entries: HistoryEntry[];
};

export type GymData = {
  exercises: Exercise[];
  workouts: Workout[];
  programs: Program[];
  history: HistorySession[];
};

export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Legs",
  "Glutes",
  "Core",
  "Full body",
  "Cardio",
];

export const EQUIPMENT = [
  "Barbell",
  "Dumbbell",
  "Machine",
  "Cable",
  "Kettlebell",
  "Bodyweight",
  "Bands",
  "Other",
];
