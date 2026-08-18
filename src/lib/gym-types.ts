export type Exercise = {
  id: string;
  name: string;
  muscleGroup: string;
  /** Optional secondary muscles worked. */
  secondaryMuscles?: string[];
  /** Optional free-form category (e.g. Compound, Isolation, Accessory). */
  category?: string;
  equipment: string;
  description: string;
  /** Optional step-by-step execution instructions. */
  instructions?: string;
  videoUrl: string;
  images: string[];
  notes: string;
  /** Optional technique tips / cues. */
  tips?: string;
};

/** How the programmed reps are expressed for a workout item. */
export type RepType = "fixed" | "range";

/** An optional warm-up set programmed for an exercise. */
export type WarmupSet = {
  id: string;
  weight: number;
  reps: number;
};

/** Per-set configuration: each set can have its own weight/reps */
export type WorkingSet = {
  id: string;
  setNumber: number;
  weight: number;
  /** Fixed reps, or the low end of a range */
  reps: number;
  /** Range maximum reps (when repType === "range"). */
  repMax?: number;
  /** A drop set follows a working set with reduced weight. */
  dropSet?: boolean;
};

export type WorkoutItem = {
  id: string;
  exerciseId: string;
  sets: number;
  /** Fixed reps, or the low end of a range (kept for backward compatibility). */
  reps: number;
  /** "fixed" (default) or "range". Older data without this is treated as fixed. */
  repType?: RepType;
  /** Range minimum reps (when repType === "range"). */
  repMin?: number;
  /** Range maximum reps (when repType === "range"). */
  repMax?: number;
  /** Per-set weight configuration (NEW). If empty, falls back to single weight. */
  workingSets?: WorkingSet[];
  /** Legacy single weight field (backward compatibility). */
  weight: number;
  rest: number; // seconds
  notes: string;
  /** Optional tempo string, e.g. "3-1-1-0". */
  tempo?: string;
  /** Optional Reps In Reserve target. */
  rir?: number | null;
  /** Optional Rate of Perceived Exertion target. */
  rpe?: number | null;
  /** Optional warm-up sets, kept visually separate from working sets. */
  warmups?: WarmupSet[];
  /** Items that share a supersetId are performed together as a superset. */
  supersetId?: string;
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
  /** Programmed target reps (fixed, or range minimum). */
  targetReps?: number;
  /** Programmed range maximum reps, when the target was a range. */
  targetRepMax?: number;
  /** True when this is a warm-up set rather than a working set. */
  warmup?: boolean;
  /** True when this set is logged as a drop set. */
  dropSet?: boolean;
};

export type HistoryEntry = {
  exerciseId: string;
  exerciseName: string;
  /** Equipment / variation snapshot captured when the session was saved. */
  equipment?: string;
  sets: LoggedSet[];
  notes: string;
  /** Programmed target snapshot. */
  targetSets?: number;
  targetReps?: number;
  targetRepMax?: number;
  repType?: RepType;
};

export type HistorySession = {
  id: string;
  workoutId: string;
  workoutName: string;
  /** Snapshot label captured when the session is saved; older entries may omit it. */
  programName?: string;
  date: string; // ISO
  durationSec: number;
  entries: HistoryEntry[];
};

/* ---------- nutrition ---------- */

/** A reusable food in the personal food library, with macros per reference serving. */
export type FoodItem = {
  id: string;
  name: string;
  /** Reference serving label, e.g. "100g", "1 unit", "1 slice". */
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  notes?: string;
};

/** A food logged inside a meal. Macros are per single serving; totals scale by quantity. */
export type MealFood = {
  id: string;
  /** Link back to the food library entry it came from, when applicable. */
  foodId?: string;
  name: string;
  servingSize: string;
  /** Quantity multiplier applied to the per-serving macros. */
  quantity: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  notes?: string;
};

export type Meal = {
  id: string;
  name: string;
  foods: MealFood[];
};

/** A single day's nutrition log, keyed by calendar date. */
export type NutritionDay = {
  date: string; // YYYY-MM-DD
  meals: Meal[];
};

export type NutritionTargets = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
};

export type GymData = {
  exercises: Exercise[];
  workouts: Workout[];
  programs: Program[];
  history: HistorySession[];
  /* nutrition */
  foods: FoodItem[];
  nutritionDays: NutritionDay[];
  nutritionTargets: NutritionTargets;
  /** Default meal names used when a new day is created. */
  mealTemplate: string[];
};

export const MUSCLE_GROUPS = [
  "Chest",
  "Upper Chest",
  "Lower Chest",
  "Back",
  "Lats",
  "Traps",
  "Lower Back",
  "Shoulders",
  "Front Delts",
  "Side Delts",
  "Rear Delts",
  "Biceps",
  "Triceps",
  "Forearms",
  "Legs",
  "Quads",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Adductors",
  "Abductors",
  "Hip Flexors",
  "Core",
  "Obliques",
  "Neck",
  "Full Body",
  "Cardio",
  "Other",
];

export const EQUIPMENT = [
  "Barbell",
  "Smith Machine",
  "Dumbbell",
  "Cable",
  "Machine",
  "EZ Bar",
  "Kettlebell",
  "Bodyweight",
  "Resistance Band",
  "Assisted",
  "Other",
];

export const EXERCISE_CATEGORIES = [
  "Compound",
  "Isolation",
  "Accessory",
  "Machine",
  "Cardio",
  "Mobility",
  "Other",
];

export const DEFAULT_MEALS = [
  "Breakfast",
  "Morning Snack",
  "Lunch",
  "Afternoon Snack",
  "Dinner",
  "Evening Snack",
];

/** Seed foods always available in the library (merged on load if missing). */
export const SEED_FOODS: FoodItem[] = [
  { id: "f-eggs", name: "Eggs", servingSize: "1 unit", calories: 70, protein: 6, carbs: 0.5, fat: 5 },
  { id: "f-chicken", name: "Chicken breast", servingSize: "100g", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { id: "f-rice", name: "White rice (cooked)", servingSize: "100g", calories: 130, protein: 2.5, carbs: 28, fat: 0.3 },
  { id: "f-oats", name: "Oats", servingSize: "100g", calories: 389, protein: 17, carbs: 66, fat: 7, fiber: 10 },
  { id: "f-yogurt", name: "Greek yogurt", servingSize: "100g", calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { id: "f-banana", name: "Banana", servingSize: "1 unit", calories: 105, protein: 1.3, carbs: 27, fat: 0.3, fiber: 3 },
  { id: "f-cottage", name: "Cottage cheese", servingSize: "100g", calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { id: "f-bread", name: "Whole wheat bread", servingSize: "1 slice", calories: 80, protein: 4, carbs: 14, fat: 1, fiber: 2 },
  { id: "f-edamame", name: "Edamame", servingSize: "100g", calories: 121, protein: 11.9, carbs: 8.9, fat: 5.2, fiber: 5.2 },
];
