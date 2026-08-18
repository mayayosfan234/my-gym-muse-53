import { useSyncExternalStore } from "react";
import {
  DEFAULT_MEALS,
  SEED_FOODS,
  type Exercise,
  type FoodItem,
  type GymData,
  type HistorySession,
  type MealFood,
  type NutritionDay,
  type NutritionTargets,
  type Program,
  type WarmupSet,
  type Workout,
  type WorkoutItem,
} from "./gym-types";

const KEY = "gymtrack.v1";

export const uid = () => Math.random().toString(36).slice(2, 10);

/** Local calendar date as YYYY-MM-DD (used to key nutrition days). */
export const todayKey = (d: Date = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const seed = (): GymData => {
  const ex: Exercise[] = [
    {
      id: "ex-bench",
      name: "Barbell Bench Press",
      muscleGroup: "Chest",
      secondaryMuscles: ["Triceps", "Shoulders"],
      category: "Compound",
      equipment: "Barbell",
      description:
        "Lie flat, grip slightly wider than shoulders, lower to mid chest and press up.",
      instructions: "",
      videoUrl: "",
      images: [],
      notes: "Keep shoulder blades retracted.",
      tips: "Drive feet into the floor and keep a slight arch.",
    },
    {
      id: "ex-squat",
      name: "Back Squat",
      muscleGroup: "Legs",
      secondaryMuscles: ["Glutes", "Core"],
      category: "Compound",
      equipment: "Barbell",
      description: "Bar on upper back, sit down and back, drive through mid foot.",
      instructions: "",
      videoUrl: "",
      images: [],
      notes: "Belt above 100kg.",
      tips: "",
    },
    {
      id: "ex-row",
      name: "Seated Cable Row",
      muscleGroup: "Back",
      secondaryMuscles: ["Biceps"],
      category: "Compound",
      equipment: "Cable",
      description: "Pull the handle to the navel, squeeze the shoulder blades.",
      instructions: "",
      videoUrl: "",
      images: [],
      notes: "",
      tips: "",
    },
    {
      id: "ex-curl",
      name: "Dumbbell Curl",
      muscleGroup: "Biceps",
      category: "Isolation",
      equipment: "Dumbbell",
      description: "Curl without swinging, controlled negative.",
      instructions: "",
      videoUrl: "",
      images: [],
      notes: "",
      tips: "",
    },
    {
      id: "ex-hipthrust",
      name: "Hip Thrust",
      muscleGroup: "Glutes",
      secondaryMuscles: ["Legs"],
      category: "Compound",
      equipment: "Barbell",
      description: "Upper back on a bench, drive hips up, squeeze glutes at the top.",
      instructions: "",
      videoUrl: "",
      images: [],
      notes: "Pause at the top.",
      tips: "",
    },
    {
      id: "ex-plank",
      name: "Plank",
      muscleGroup: "Core",
      category: "Isolation",
      equipment: "Bodyweight",
      description: "Hold a straight line from head to heels.",
      instructions: "",
      videoUrl: "",
      images: [],
      notes: "",
      tips: "",
    },
  ];

  type SeedItem = {
    exerciseId: string;
    sets: number;
    reps: number;
    repMin?: number;
    repMax?: number;
    weight: number;
    rest: number;
  };
  const day = (id: string, name: string, items: SeedItem[]): Workout => ({
    id,
    name,
    notes: "",
    items: items.map((s, i) => ({
      id: `${id}-i${i}`,
      exerciseId: s.exerciseId,
      sets: s.sets,
      reps: s.reps,
      repType: s.repMin != null ? ("range" as const) : ("fixed" as const),
      repMin: s.repMin,
      repMax: s.repMax,
      weight: s.weight,
      rest: s.rest,
      notes: "",
    })),
  });

  const workouts: Workout[] = [
    day("w-lower-1", "Lower Body 1", [
      { exerciseId: "ex-squat", sets: 4, reps: 6, weight: 80, rest: 150 },
      { exerciseId: "ex-hipthrust", sets: 4, reps: 8, repMin: 8, repMax: 10, weight: 60, rest: 90 },
      { exerciseId: "ex-plank", sets: 3, reps: 1, weight: 0, rest: 60 },
    ]),
    day("w-upper-1", "Upper Body 1", [
      { exerciseId: "ex-bench", sets: 4, reps: 8, repMin: 8, repMax: 10, weight: 60, rest: 120 },
      { exerciseId: "ex-row", sets: 3, reps: 10, repMin: 10, repMax: 12, weight: 45, rest: 90 },
    ]),
    day("w-lower-2", "Lower Body 2", [
      { exerciseId: "ex-squat", sets: 3, reps: 10, weight: 60, rest: 120 },
      { exerciseId: "ex-hipthrust", sets: 3, reps: 12, weight: 55, rest: 90 },
    ]),
    day("w-upper-2", "Upper Body 2", [
      { exerciseId: "ex-row", sets: 4, reps: 10, weight: 45, rest: 90 },
      { exerciseId: "ex-curl", sets: 3, reps: 12, repMin: 10, repMax: 12, weight: 12, rest: 60 },
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

  return {
    exercises: ex,
    workouts,
    programs,
    history: [],
    foods: [...SEED_FOODS],
    nutritionDays: [],
    nutritionTargets: {},
    mealTemplate: [...DEFAULT_MEALS],
  };
};

let data: GymData = seed();
let hydrated = false;
const listeners = new Set<() => void>();

/** Merge seed foods that are missing from saved data (e.g. Edamame). */
function mergeSeedFoods(existing: FoodItem[]): FoodItem[] {
  const byId = new Map(existing.map((f) => [f.id, f]));
  const byName = new Map(existing.map((f) => [f.name.toLocaleLowerCase(), f]));
  for (const seedFood of SEED_FOODS) {
    if (byId.has(seedFood.id)) continue;
    if (byName.has(seedFood.name.toLocaleLowerCase())) continue;
    byId.set(seedFood.id, seedFood);
  }
  return Array.from(byId.values());
}

/** Ensure older saved data (without programs / nutrition) still works. */
function migrate(d: Partial<GymData>): GymData {
  const workouts = d.workouts ?? [];
  let programs = d.programs ?? [];
  if (!programs.length && workouts.length) {
    programs = [
      { id: uid(), name: "My Workouts", notes: "", dayIds: workouts.map((w) => w.id) },
    ];
  }
  return {
    exercises: d.exercises ?? [],
    workouts,
    programs,
    history: d.history ?? [],
    foods: mergeSeedFoods(d.foods ?? []),
    nutritionDays: d.nutritionDays ?? [],
    nutritionTargets: d.nutritionTargets ?? {},
    mealTemplate: d.mealTemplate?.length ? d.mealTemplate : [...DEFAULT_MEALS],
  };
}

function load() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) data = migrate({ ...seed(), ...(JSON.parse(raw) as Partial<GymData>) });
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

/* ---------- rep helpers ---------- */
/** Human-readable programmed reps for an item (fixed or range). */
export function repLabel(item: Pick<WorkoutItem, "reps" | "repType" | "repMin" | "repMax">) {
  if (item.repType === "range" && item.repMin != null && item.repMax != null) {
    return `${item.repMin}–${item.repMax}`;
  }
  return String(item.reps);
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
    secondaryMuscles: [],
    category: "Compound",
    equipment: "Barbell",
    description: "",
    instructions: "",
    videoUrl: "",
    images: [],
    notes: "",
    tips: "",
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
  return {
    id: uid(),
    exerciseId,
    sets: 3,
    reps: 10,
    repType: "fixed",
    weight: 20,
    rest: 90,
    notes: "",
    warmups: [],
  };
}

export function emptyWarmup(): WarmupSet {
  return { id: uid(), weight: 20, reps: 10 };
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
    if (e) {
      const working = e.sets.filter((x) => !x.warmup);
      if (working.length) return { date: s.date, sets: working };
    }
  }
  return null;
}

/** Simple personal records for an exercise across all history. */
export function personalRecords(history: HistorySession[], exerciseId: string) {
  let heaviest = 0;
  let bestRepsAtHeaviest = 0;
  let bestEst = 0;
  for (const s of history) {
    for (const e of s.entries) {
      if (e.exerciseId !== exerciseId) continue;
      for (const set of e.sets) {
        if (set.warmup || set.reps === 0) continue;
        if (set.weight > heaviest) {
          heaviest = set.weight;
          bestRepsAtHeaviest = set.reps;
        } else if (set.weight === heaviest && set.reps > bestRepsAtHeaviest) {
          bestRepsAtHeaviest = set.reps;
        }
        const est = set.weight * (1 + set.reps / 30);
        if (est > bestEst) bestEst = est;
      }
    }
  }
  if (heaviest === 0 && bestEst === 0) return null;
  return {
    heaviest,
    bestRepsAtHeaviest,
    estimatedMax: Math.round(bestEst),
  };
}

/* ---------- nutrition: food library ---------- */
export function saveFood(food: FoodItem) {
  const exists = data.foods.some((f) => f.id === food.id);
  set({
    ...data,
    foods: exists
      ? data.foods.map((f) => (f.id === food.id ? food : f))
      : [...data.foods, food],
  });
}

export function deleteFood(id: string) {
  set({ ...data, foods: data.foods.filter((f) => f.id !== id) });
}

export function emptyFood(): FoodItem {
  return { id: uid(), name: "", servingSize: "100g", calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function saveNutritionTargets(targets: NutritionTargets) {
  set({ ...data, nutritionTargets: targets });
}

/* ---------- nutrition: days & meals ---------- */
export function nutritionDay(d: GymData, date: string): NutritionDay {
  const found = d.nutritionDays.find((x) => x.date === date);
  if (found) return found;
  return {
    date,
    meals: d.mealTemplate.map((name, i) => ({ id: `tmpl-${date}-${i}`, name, foods: [] })),
  };
}

function withDay(date: string, updater: (day: NutritionDay) => NutritionDay) {
  const existing = data.nutritionDays.find((x) => x.date === date);
  const base: NutritionDay =
    existing ?? {
      date,
      meals: data.mealTemplate.map((name) => ({ id: uid(), name, foods: [] })),
    };
  const next = updater(base);
  const days = existing
    ? data.nutritionDays.map((x) => (x.date === date ? next : x))
    : [next, ...data.nutritionDays];
  set({ ...data, nutritionDays: days });
}

export function addMeal(date: string, name: string) {
  withDay(date, (day) => ({
    ...day,
    meals: [...day.meals, { id: uid(), name: name.trim() || "New meal", foods: [] }],
  }));
}

export function deleteMeal(date: string, mealId: string) {
  withDay(date, (day) => ({ ...day, meals: day.meals.filter((m) => m.id !== mealId) }));
}

export function renameMeal(date: string, mealId: string, name: string) {
  withDay(date, (day) => ({
    ...day,
    meals: day.meals.map((m) => (m.id === mealId ? { ...m, name } : m)),
  }));
}

export function reorderMeals(date: string, mealIds: string[]) {
  withDay(date, (day) => ({
    ...day,
    meals: mealIds
      .map((id) => day.meals.find((m) => m.id === id))
      .filter((m): m is NutritionDay["meals"][number] => Boolean(m)),
  }));
}

export function duplicateMeal(date: string, mealId: string) {
  withDay(date, (day) => {
    const meal = day.meals.find((m) => m.id === mealId);
    if (!meal) return day;
    const index = day.meals.findIndex((m) => m.id === mealId);
    const copy = {
      ...meal,
      id: uid(),
      name: `${meal.name} copy`,
      foods: meal.foods.map((f) => ({ ...f, id: uid() })),
    };
    const meals = [...day.meals];
    meals.splice(index + 1, 0, copy);
    return { ...day, meals };
  });
}

export function addFoodToMeal(date: string, mealId: string, food: MealFood) {
  withDay(date, (day) => ({
    ...day,
    meals: day.meals.map((m) =>
      m.id === mealId ? { ...m, foods: [...m.foods, food] } : m,
    ),
  }));
}

export function updateMealFood(date: string, mealId: string, food: MealFood) {
  withDay(date, (day) => ({
    ...day,
    meals: day.meals.map((m) =>
      m.id === mealId
        ? { ...m, foods: m.foods.map((f) => (f.id === food.id ? food : f)) }
        : m,
    ),
  }));
}

export function removeMealFood(date: string, mealId: string, foodId: string) {
  withDay(date, (day) => ({
    ...day,
    meals: day.meals.map((m) =>
      m.id === mealId ? { ...m, foods: m.foods.filter((f) => f.id !== foodId) } : m,
    ),
  }));
}

export function duplicateMealFood(date: string, mealId: string, foodId: string) {
  withDay(date, (day) => ({
    ...day,
    meals: day.meals.map((m) => {
      if (m.id !== mealId) return m;
      const food = m.foods.find((f) => f.id === foodId);
      if (!food) return m;
      const index = m.foods.findIndex((f) => f.id === foodId);
      const foods = [...m.foods];
      foods.splice(index + 1, 0, { ...food, id: uid() });
      return { ...m, foods };
    }),
  }));
}

export function emptyMealFood(): MealFood {
  return {
    id: uid(),
    name: "",
    servingSize: "100g",
    quantity: 1,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  };
}

/** Convert a library food into a meal food entry (quantity 1). */
export function mealFoodFromLibrary(food: FoodItem): MealFood {
  return {
    id: uid(),
    foodId: food.id,
    name: food.name,
    servingSize: food.servingSize,
    quantity: 1,
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    fiber: food.fiber,
    notes: food.notes,
  };
}

function normalizeSearch(s: string) {
  return s
    .toLocaleLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Finds sensible food substitutions. Score calories + protein so a swap
 * stays close to energy and protein. Search matches any word in the name.
 */
export function findFoodReplacements(
  foods: FoodItem[],
  current: Pick<MealFood, "foodId" | "name" | "calories" | "protein">,
  query = "",
) {
  const normalized = normalizeSearch(query);
  const tokens = normalized.split(/\s+/).filter(Boolean);

  return foods
    .filter((food) => {
      if (current.foodId && food.id === current.foodId) return false;
      if (!current.foodId && current.name && food.name === current.name) return false;
      return true;
    })
    .filter((food) => {
      if (!tokens.length) return true;
      const name = normalizeSearch(food.name);
      return tokens.every((t) => name.includes(t));
    })
    .map((food) => ({
      food,
      score:
        Math.abs(food.calories - (current.calories ?? 0)) +
        Math.abs(food.protein - (current.protein ?? 0)) * 12,
    }))
    .sort((a, b) => a.score - b.score || a.food.name.localeCompare(b.food.name))
    .map(({ food }) => food);
}

export type MacroTotals = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
};

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Totals for a list of meal foods, scaled by each food's quantity. */
export function foodTotals(foods: MealFood[]): MacroTotals {
  return foods.reduce<MacroTotals>(
    (t, f) => ({
      calories: t.calories + f.calories * f.quantity,
      protein: t.protein + f.protein * f.quantity,
      carbs: t.carbs + f.carbs * f.quantity,
      fat: t.fat + f.fat * f.quantity,
      fiber: t.fiber + (f.fiber ?? 0) * f.quantity,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
  );
}

/** Totals across every meal in a day. */
export function dayTotals(day: NutritionDay): MacroTotals {
  const all = day.meals.flatMap((m) => m.foods);
  const t = foodTotals(all);
  return {
    calories: Math.round(t.calories),
    protein: round1(t.protein),
    carbs: round1(t.carbs),
    fat: round1(t.fat),
    fiber: round1(t.fiber),
  };
}
