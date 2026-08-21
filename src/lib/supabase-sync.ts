import { supabase } from "./supabase";
import {
  ISRAELI_FOOD_DATABASE,
  type Exercise,
  type FoodItem,
  type GymData,
  type HistorySession,
  type NutritionDay,
  type Program,
  type UserProfile,
  type Workout,
} from "./gym-types";

export type SyncStatus = "idle" | "syncing" | "synced" | "error" | "offline";

/**
 * Upload local localStorage state (`gymtrack.v1`) to Supabase for an authenticated user.
 * Performs idempotent UPSERTs into PostgreSQL tables.
 */
export async function syncLocalToSupabase(
  userId: string,
  localData: GymData
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Profile
    if (localData.userProfile) {
      const p = localData.userProfile;
      await supabase.from("profiles").upsert(
        {
          id: userId,
          weight_kg: p.weight,
          height_cm: p.height,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }

    // 2. Custom Exercises
    const defaultExerciseIds = new Set([
      "ex-bench",
      "ex-squat",
      "ex-row",
      "ex-curl",
      "ex-hipthrust",
      "ex-plank",
      "ex-ohp",
      "ex-rdl",
    ]);

    const customExercises = localData.exercises.filter(
      (e) => !defaultExerciseIds.has(e.id)
    );

    if (customExercises.length > 0) {
      const payload = customExercises.map((e) => ({
        id: e.id,
        user_id: userId,
        name: e.name,
        muscle_group: e.muscleGroup,
        equipment: e.equipment,
        category: e.category,
        description: e.description,
        instructions: e.instructions,
        updated_at: new Date().toISOString(),
      }));
      await supabase
        .from("custom_exercises")
        .upsert(payload, { onConflict: "id" });
    }

    // 3. Programs & Program Days
    if (localData.programs.length > 0) {
      const programPayload = localData.programs.map((p) => ({
        id: p.id,
        user_id: userId,
        name: p.name,
        description: p.notes,
        updated_at: new Date().toISOString(),
      }));
      await supabase
        .from("programs")
        .upsert(programPayload, { onConflict: "id" });

      for (const p of localData.programs) {
        const days = p.dayIds
          .map((dayId) => localData.workouts.find((w) => w.id === dayId))
          .filter((w): w is Workout => Boolean(w));

        if (days.length > 0) {
          const dayPayload = days.map((d, index) => ({
            id: d.id,
            program_id: p.id,
            user_id: userId,
            name: d.name,
            items: d.items,
            sort_order: index,
            updated_at: new Date().toISOString(),
          }));
          await supabase
            .from("program_days")
            .upsert(dayPayload, { onConflict: "id" });
        }
      }
    }

    // 4. Workout Sessions / History
    if (localData.history.length > 0) {
      const historyPayload = localData.history.map((s) => ({
        id: s.id,
        user_id: userId,
        workout_id: s.workoutId,
        workout_name: s.workoutName,
        program_name: s.programName,
        date: s.date,
        duration_sec: s.durationSec,
        entries: s.entries,
        notes: s.notes,
      }));
      await supabase
        .from("workout_sessions")
        .upsert(historyPayload, { onConflict: "id" });
    }

    // 5. Custom Foods
    const seedFoodIds = new Set(ISRAELI_FOOD_DATABASE.map((f) => f.id));
    const customFoods = localData.foods.filter((f) => !seedFoodIds.has(f.id));

    if (customFoods.length > 0) {
      const customFoodPayload = customFoods.map((f) => ({
        id: f.id,
        user_id: userId,
        name: f.name,
        english_name: f.englishName,
        category: f.category ?? "כללי",
        brand: f.brand,
        serving_unit: f.servingSize ?? "100g",
        serving_grams: 100,
        calories: f.calories,
        protein: f.protein,
        carbs: f.carbs,
        fat: f.fat,
        fiber: f.fiber ?? 0,
        updated_at: new Date().toISOString(),
      }));
      await supabase
        .from("custom_foods")
        .upsert(customFoodPayload, { onConflict: "id" });
    }

    // 6. Nutrition Days
    if (localData.nutritionDays.length > 0) {
      const nutritionPayload = localData.nutritionDays.map((nd) => ({
        id: nd.id ?? `${userId}_${nd.date}`,
        user_id: userId,
        date: nd.date,
        target_calories: localData.nutritionTargets.calories,
        meals: nd.meals,
        updated_at: new Date().toISOString(),
      }));
      await supabase
        .from("nutrition_days")
        .upsert(nutritionPayload, { onConflict: "id" });
    }

    // 7. Food Favorites
    if (localData.favoriteFoods && localData.favoriteFoods.length > 0) {
      const favPayload = localData.favoriteFoods.map((foodId) => ({
        user_id: userId,
        food_id: foodId,
      }));
      await supabase
        .from("food_favorites")
        .upsert(favPayload, { onConflict: "user_id,food_id" });
    }

    return { success: true };
  } catch (err: any) {
    console.error("[Supabase Sync Error]:", err);
    return { success: false, error: err?.message || "Cloud sync failed" };
  }
}

/**
 * Download authoritative cloud state from Supabase for an authenticated user
 * and merge seamlessly with the local application state.
 */
export async function pullSupabaseData(
  userId: string,
  localState: GymData
): Promise<GymData> {
  const nextData: GymData = { ...localState };

  try {
    // 1. Profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (profile) {
      nextData.userProfile = {
        ...nextData.userProfile,
        weight: profile.weight_kg ? Number(profile.weight_kg) : nextData.userProfile.weight,
        height: profile.height_cm ? Number(profile.height_cm) : nextData.userProfile.height,
      };
    }

    // 2. Custom Exercises
    const { data: dbCustomExercises } = await supabase
      .from("custom_exercises")
      .select("*")
      .eq("user_id", userId);

    if (dbCustomExercises && dbCustomExercises.length > 0) {
      const customMap = new Map(nextData.exercises.map((e) => [e.id, e]));
      for (const row of dbCustomExercises) {
        const exItem: Exercise = {
          id: row.id,
          name: row.name,
          muscleGroup: row.muscle_group,
          muscleGroups: [row.muscle_group],
          category: row.category || "מורכב",
          equipment: row.equipment || "מוט",
          description: row.description || "",
          instructions: row.instructions || "",
        };
        customMap.set(row.id, exItem);
      }
      nextData.exercises = Array.from(customMap.values());
    }

    // 3. Programs & Days
    const { data: dbPrograms } = await supabase
      .from("programs")
      .select("*")
      .eq("user_id", userId);

    const { data: dbProgramDays } = await supabase
      .from("program_days")
      .select("*")
      .eq("user_id", userId);

    if (dbPrograms && dbPrograms.length > 0) {
      const workoutsMap = new Map(nextData.workouts.map((w) => [w.id, w]));
      const programsList: Program[] = [];

      for (const pRow of dbPrograms) {
        const matchingDays = (dbProgramDays || [])
          .filter((d) => d.program_id === pRow.id)
          .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

        const dayIds: string[] = [];
        for (const dRow of matchingDays) {
          dayIds.push(dRow.id);
          const workoutItem: Workout = {
            id: dRow.id,
            name: dRow.name,
            notes: "",
            items: dRow.items || [],
          };
          workoutsMap.set(dRow.id, workoutItem);
        }

        programsList.push({
          id: pRow.id,
          name: pRow.name,
          notes: pRow.description || "",
          dayIds,
        });
      }

      nextData.programs = programsList;
      nextData.workouts = Array.from(workoutsMap.values());
    }

    // 4. History Sessions
    const { data: dbSessions } = await supabase
      .from("workout_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });

    if (dbSessions && dbSessions.length > 0) {
      const historyList: HistorySession[] = dbSessions.map((row) => ({
        id: row.id,
        workoutId: row.workout_id || "",
        workoutName: row.workout_name,
        programName: row.program_name || "",
        date: row.date,
        durationSec: row.duration_sec,
        entries: row.entries || [],
        notes: row.notes || "",
      }));
      nextData.history = historyList;
    }

    // 5. Custom Foods
    const { data: dbCustomFoods } = await supabase
      .from("custom_foods")
      .select("*")
      .eq("user_id", userId);

    if (dbCustomFoods && dbCustomFoods.length > 0) {
      const foodMap = new Map(nextData.foods.map((f) => [f.id, f]));
      for (const row of dbCustomFoods) {
        const foodItem: FoodItem = {
          id: row.id,
          name: row.name,
          englishName: row.english_name || undefined,
          category: row.category,
          brand: row.brand || undefined,
          servingSize: row.serving_unit || "100g",
          calories: Number(row.calories),
          protein: Number(row.protein),
          carbs: Number(row.carbs),
          fat: Number(row.fat),
          fiber: Number(row.fiber || 0),
        };
        foodMap.set(row.id, foodItem);
      }
      nextData.foods = Array.from(foodMap.values());
    }

    // 6. Nutrition Days
    const { data: dbNutritionDays } = await supabase
      .from("nutrition_days")
      .select("*")
      .eq("user_id", userId);

    if (dbNutritionDays && dbNutritionDays.length > 0) {
      const daysList: NutritionDay[] = dbNutritionDays.map((row) => ({
        id: row.id,
        date: typeof row.date === "string" ? row.date.slice(0, 10) : row.date,
        meals: row.meals || [],
      }));
      nextData.nutritionDays = daysList;
    }

    // 7. Food Favorites
    const { data: dbFavs } = await supabase
      .from("food_favorites")
      .select("food_id")
      .eq("user_id", userId);

    if (dbFavs) {
      nextData.favoriteFoods = dbFavs.map((f) => f.food_id);
    }
  } catch (err) {
    console.error("[Supabase Pull Error]:", err);
  }

  return nextData;
}
