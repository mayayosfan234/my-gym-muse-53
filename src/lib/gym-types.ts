export type Exercise = {
  id: string;
  name: string;
  englishName?: string;
  muscleGroup: string;
  /** Primary and secondary muscle groups worked (multi-select). */
  muscleGroups?: string[];
  /** Optional custom muscle group text when "אחר" is selected. */
  customMuscleGroup?: string;
  /** Optional secondary muscles worked. */
  secondaryMuscles?: string[];
  /** Optional free-form category (e.g. מורכב, בידוד, עזר). */
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
  /** Search terms/aliases in Hebrew and English. */
  searchTerms?: string[];
  /** Flag indicating user-created custom exercise. */
  isCustom?: boolean;
};

/** How the programmed reps are expressed for a workout item. */
export type RepType = "fixed" | "range";

/** An optional warm-up set programmed for an exercise. */
export type WarmupSet = {
  id: string;
  weight: number;
  reps: number;
};

/** Per-set configuration: each set can have its own weight/reps and dropSet flag */
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
  /** Fixed reps, or the low end of a range. */
  reps: number;
  /** "fixed" (default) or "range". Older data without this is treated as fixed. */
  repType?: RepType;
  /** Range minimum reps (when repType === "range"). */
  repMin?: number;
  /** Range maximum reps (when repType === "range"). */
  repMax?: number;
  /** Per-set weight configuration. Each set has independent weight/reps/dropSet. */
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
  /** Items that share a supersetId are performed together as an explicit superset. */
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

export type DropStage = {
  weight: number;
  reps: number;
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
  /** Optional multi-stage drops recorded for a drop set (e.g. Stage 1: 40kg x 8, Drop 1: 30kg x 6, Drop 2: 20kg x 8). */
  drops?: DropStage[];
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

/* ---------- nutrition & user profile ---------- */

/** A reusable food in the personal food library, with macros per reference serving. */
export type FoodItem = {
  id: string;
  name: string;
  englishName?: string;
  category?: string;
  /** Reference serving label, e.g. "100 גרם", "יחידה 1", "פרוסה 1". */
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  notes?: string;
  searchTerms?: string[];
  favorite?: boolean;
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
  timeLogged?: string; // HH:MM
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

export type SavedRecipe = {
  id: string;
  name: string;
  foods: MealFood[];
};

export type BodyWeightLog = {
  id: string;
  date: string; // YYYY-MM-DD
  weight: number; // kg
};

export type CardioLog = {
  id: string;
  date: string; // YYYY-MM-DD
  type: string; // Treadmill, Walking, Running, Stationary bike, Elliptical, StairMaster, Rowing, Swimming, Tennis, HIIT
  durationMin: number;
  speed?: number; // km/h
  incline?: number; // %
  distanceKm?: number;
  calories: number;
};

export type UserProfile = {
  weight: number; // kg
  height?: number; // cm
  age?: number;
  gender?: "female" | "male";
  workoutsPerWeek?: number;
};

export type GymData = {
  exercises: Exercise[];
  customExercises?: Exercise[];
  workouts: Workout[];
  programs: Program[];
  history: HistorySession[];
  /* nutrition */
  foods: FoodItem[];
  nutritionDays: NutritionDay[];
  nutritionTargets: NutritionTargets;
  /** Default meal names used when a new day is created. */
  mealTemplate: string[];
  recipes?: SavedRecipe[];
  recentFoods?: string[]; // foodIds
  favoriteFoods?: string[]; // foodIds
  bodyWeightLogs?: BodyWeightLog[];
  cardioLogs?: CardioLog[];
  userProfile?: UserProfile;
};

export const MUSCLE_GROUPS = [
  "חזה",
  "חזה עליון",
  "חזה תחתון",
  "גב",
  "גב רחב",
  "טרפזים",
  "גב תחתון",
  "כתפיים",
  "כתף קדמית",
  "כתף צידית",
  "כתף אחורית",
  "ביצפס (יד קדמית)",
  "טריצפס (יד אחורית)",
  "אמות",
  "בטן",
  "אלכסונים",
  "ישבן",
  "ארבע ראשי",
  "המסטרינג",
  "תאומים",
  "מקרבים",
  "מרחיקים",
  "כופפי הירך",
  "צוואר",
  "גוף מלא",
  "אירובי",
  "אחר",
];

export const EQUIPMENT = [
  "מוט",
  "סמית' משין",
  "משקוליות יד",
  "פולי / כבלים",
  "מכונה",
  "מוט W / EZ",
  "קטלבל",
  "משקל גוף",
  "גומיית התנגדות",
  "משקל גוף בתוספת משקל",
  "אחר",
];

export const EXERCISE_CATEGORIES = [
  "מורכב",
  "בידוד",
  "עזר",
  "מכונה",
  "אירובי",
  "גמישות / ניעות",
  "אחר",
];

export const DEFAULT_MEALS = [
  "ארוחת בוקר",
  "נשנוש בוקר",
  "ארוחת צהריים",
  'נשנוש אחה"צ',
  "ארוחת ערב",
  "נשנוש לילה",
];

export const CARDIO_TYPES = [
  "הליכון (Treadmill)",
  "הליכה",
  "ריצה",
  "אופני כושר",
  "אליפטיקל",
  "מדרגות (StairMaster)",
  "חתירה (Rowing)",
  "שחייה",
  "טניס",
  "אימון אינטרוולים (HIIT)",
];
