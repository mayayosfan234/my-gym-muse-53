export type UserRole = "coach" | "client";

export type ClientLink = {
  id: string;
  clientId: string;
  clientEmail?: string;
  clientName?: string;
  createdAt: string;
};

export type DropSetConfig = {
  enabled: boolean;
  drops: number;
  percentReduction?: number; // e.g. 20%
};

export type Exercise = {
  id: string;
  name: string;
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
  /** Prescribed Coach Target Weight */
  targetWeight?: number;
  /** Legacy single weight field. */
  weight: number;
  rest: number; // seconds
  notes: string;
  /** Coach Technique Instructions */
  techniqueNotes?: string;
  /** Coach Approved Alternative Exercise IDs */
  approvedAlternatives?: string[];
  /** Drop set configuration */
  dropSetConfig?: DropSetConfig;
  /** Optional tempo string, e.g. "3-1-1-0". */
  tempo?: string;
  /** Optional Reps In Reserve target. */
  rir?: number | null;
  /** Optional Rate of Perceived Exertion target. */
  rpe?: number | null;
  /** Optional warm-up sets. */
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

export type LoggedSet = {
  reps: number;
  weight: number;
  done: boolean;
  targetReps?: number;
  targetRepMax?: number;
  warmup?: boolean;
  dropSet?: boolean;
};

export type HistoryEntry = {
  exerciseId: string;
  exerciseName: string;
  equipment?: string;
  sets: LoggedSet[];
  notes: string;
  targetSets?: number;
  targetReps?: number;
  targetRepMax?: number;
  repType?: RepType;
};

export type HistorySession = {
  id: string;
  workoutId: string;
  workoutName: string;
  programName?: string;
  date: string; // ISO
  durationSec: number;
  entries: HistoryEntry[];
};

/* ---------- nutrition & user profile ---------- */

export type FoodItem = {
  id: string;
  name: string;
  englishName?: string;
  category?: string;
  brand?: string;
  servingSize: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  notes?: string;
  searchTerms?: string[];
  favorite?: boolean;
  approvedSubstitutes?: string[]; // foodIds approved by coach
};

export type MealFood = {
  id: string;
  foodId?: string;
  name: string;
  servingSize: string;
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

export type NutritionDay = {
  id?: string;
  date: string; // YYYY-MM-DD
  meals: Meal[];
};

export type NutritionTargets = {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
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

export type BodyMeasurement = {
  id: string;
  date: string; // YYYY-MM-DD
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  bicepsCm?: number;
  thighsCm?: number;
  notes?: string;
};

export type ClientHabits = {
  id: string;
  date: string; // YYYY-MM-DD
  waterMl: number;
  waterTargetMl: number;
  steps: number;
  stepsTarget: number;
  weighInDone: boolean;
  workoutDone: boolean;
  busyDayMode: boolean;
};

export type CardioLog = {
  id: string;
  date: string; // YYYY-MM-DD
  type: string;
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
  role?: UserRole;
  coachId?: string;
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
  mealTemplate: string[];
  recipes?: SavedRecipe[];
  recentFoods?: string[];
  favoriteFoods?: string[];
  bodyWeightLogs?: BodyWeightLog[];
  bodyMeasurements?: BodyMeasurement[];
  habits?: ClientHabits[];
  cardioLogs?: CardioLog[];
  userProfile?: UserProfile;
  clients?: ClientLink[];
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
