import { supabase, isSupabaseConfigured } from "./supabase";
import type { GymData, Exercise, FoodItem, Program, Workout, HistorySession, NutritionDay } from "./gym-types";

const MIGRATION_VERSION_KEY = "gymtrack.supabase_migration_version";
const CURRENT_MIGRATION_VER = "1.0";

export type SyncStatus = "idle" | "syncing" | "success" | "error";

export async function isMigrationNeeded(userId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const migratedVer = window.localStorage.getItem(`${MIGRATION_VERSION_KEY}.${userId}`);
  return migratedVer !== CURRENT_MIGRATION_VER;
}

export async function migrateLocalToSupabase(
  userId: string,
  localData: GymData,
): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !isSupabaseConfigured) {
    return { success: false, error: "Supabase client not configured" };
  }

  try {
    // 1. Sync Profile / Targets
    const { error: profileErr } = await supabase.from("profiles").upsert(
      {
        id: userId,
        weight: localData.userProfile?.weight ?? 65,
        height: localData.userProfile?.height ?? 165,
        age: localData.userProfile?.age ?? 26,
        gender: localData.userProfile?.gender ?? "female",
        workouts_per_week: localData.userProfile?.workoutsPerWeek ?? 4,
        calories_target: localData.nutritionTargets?.calories ?? 2000,
        protein_target: localData.nutritionTargets?.protein ?? 140,
        carbs_target: localData.nutritionTargets?.carbs ?? 200,
        fat_target: localData.nutritionTargets?.fat ?? 65,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (profileErr) console.warn("Profile sync warning:", profileErr.message);

    // 2. Sync Custom Exercises
    const customExercises = (localData.customExercises ?? localData.exercises.filter((e) => e.isCustom));
    for (const ex of customExercises) {
      await supabase.from("custom_exercises").upsert({
        id: ex.id,
        user_id: userId,
        name: ex.name,
        english_name: ex.englishName,
        muscle_group: ex.muscleGroup,
        muscle_groups: ex.muscleGroups ?? [ex.muscleGroup],
        custom_muscle_group: ex.customMuscleGroup,
        secondary_muscles: ex.secondaryMuscles ?? [],
        category: ex.category,
        equipment: ex.equipment,
        description: ex.description,
        instructions: ex.instructions,
        video_url: ex.videoUrl,
        images: ex.images,
        notes: ex.notes,
        tips: ex.tips,
        search_terms: ex.searchTerms ?? [],
      });
    }

    // 3. Sync Workout Days (Program Days)
    for (const day of localData.workouts) {
      await supabase.from("program_days").upsert({
        id: day.id,
        user_id: userId,
        name: day.name,
        notes: day.notes ?? "",
        items: day.items,
        updated_at: new Date().toISOString(),
      });
    }

    // 4. Sync Programs
    for (const p of localData.programs) {
      await supabase.from("programs").upsert({
        id: p.id,
        user_id: userId,
        name: p.name,
        notes: p.notes ?? "",
        day_ids: p.dayIds,
        updated_at: new Date().toISOString(),
      });
    }

    // 5. Sync Workout Sessions (History)
    for (const s of localData.history) {
      await supabase.from("workout_sessions").upsert({
        id: s.id,
        user_id: userId,
        workout_id: s.workoutId,
        workout_name: s.workoutName,
        program_name: s.programName,
        date: s.date,
        duration_sec: s.durationSec,
        entries: s.entries,
      });
    }

    // 6. Sync Custom Foods
    const customFoods = localData.foods.filter((f) => f.isCustom);
    for (const food of customFoods) {
      await supabase.from("custom_foods").upsert({
        id: food.id,
        user_id: userId,
        name: food.name,
        english_name: food.englishName,
        category: food.category,
        brand: food.brand,
        serving_size: food.servingSize,
        unit_weight_grams: food.unitWeightGrams,
        serving_unit_label: food.servingUnitLabel,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        fiber: food.fiber ?? 0,
        notes: food.notes,
        search_terms: food.searchTerms ?? [],
      });
    }

    // 7. Sync Nutrition Days
    for (const nd of localData.nutritionDays) {
      await supabase.from("nutrition_days").upsert(
        {
          id: `nd-${userId}-${nd.date}`,
          user_id: userId,
          date: nd.date,
          meals: nd.meals,
        },
        { onConflict: "user_id,date" },
      );
    }

    // 8. Sync Food Favorites
    for (const foodId of localData.favoriteFoods ?? []) {
      await supabase.from("food_favorites").upsert(
        {
          user_id: userId,
          food_id: foodId,
        },
        { onConflict: "user_id,food_id" },
      );
    }

    // Mark migration as successful
    if (typeof window !== "undefined") {
      window.localStorage.setItem(`${MIGRATION_VERSION_KEY}.${userId}`, CURRENT_MIGRATION_VER);
    }

    return { success: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error during cloud migration";
    console.error("Migration error:", msg);
    return { success: false, error: msg };
  }
}
