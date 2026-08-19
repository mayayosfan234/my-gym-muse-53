import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Plus, Search } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useGym } from "@/lib/gym-store";
import { EQUIPMENT, MUSCLE_GROUPS } from "@/lib/gym-types";

export const Route = createFileRoute("/exercises/")({
  head: () => ({
    meta: [
      { title: "ספריית תרגילים — הרוטינה שלי" },
      {
        name: "description",
        content: "עיין, הוסף, ערוך ונהל את תרגילי הכושר שלך בספרייה.",
      },
      { property: "og:title", content: "ספריית תרגילים — הרוטינה שלי" },
    ],
  }),
  component: Library,
});

function Library() {
  const { exercises } = useGym();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState("הכל");
  const [equipment, setEquipment] = useState("הכל");

  const query = q.toLowerCase();
  const list = exercises.filter(
    (e) =>
      (group === "הכל" || e.muscleGroup === group || (e.muscleGroups ?? []).includes(group)) &&
      (equipment === "הכל" || e.equipment === equipment) &&
      (e.name.toLowerCase().includes(query) ||
        e.equipment.toLowerCase().includes(query) ||
        e.muscleGroup.toLowerCase().includes(query) ||
        (e.customMuscleGroup ?? "").toLowerCase().includes(query) ||
        (e.category ?? "").toLowerCase().includes(query)),
  );

  return (
    <AppShell
      title="ספריית תרגילים"
      subtitle={`${exercises.length} תרגילים שמורים`}
      action={
        <Link
          to="/exercises/$exerciseId"
          params={{ exerciseId: "new" }}
          aria-label="הוסף תרגיל"
          className="grid h-11 w-11 place-items-center rounded-xl bg-primary text-primary-foreground active:scale-95 shadow-sm"
        >
          <Plus className="h-5 w-5" />
        </Link>
      }
    >
      <div className="num-pill flex h-12 items-center gap-2 px-3 text-start">
        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="חפש לפי שם תרגיל, ציוד או שריר..."
          className="w-full min-w-0 bg-transparent text-sm sm:text-base outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="-mx-4 sm:-mx-5 mt-3.5 flex gap-2 overflow-x-auto px-4 sm:px-5 pb-1 no-scrollbar">
        {["הכל", ...MUSCLE_GROUPS].map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              group === g
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <div className="-mx-4 sm:-mx-5 mt-2 flex gap-2 overflow-x-auto px-4 sm:px-5 pb-1 no-scrollbar">
        {["הכל", ...EQUIPMENT].map((eq) => (
          <button
            key={eq}
            onClick={() => setEquipment(eq)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-colors ${
              equipment === eq
                ? "bg-accent text-accent-foreground"
                : "bg-secondary text-muted-foreground"
            }`}
          >
            {eq}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-2.5 text-start">
        {list.map((e) => (
          <Link
            key={e.id}
            to="/exercises/$exerciseId"
            params={{ exerciseId: e.id }}
            className="surface-card flex items-center justify-between gap-3 p-4 transition-transform active:scale-[0.99]"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-foreground">{e.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {e.customMuscleGroup && e.muscleGroup === "אחר" ? e.customMuscleGroup : e.muscleGroup}
                {(e.secondaryMuscles ?? []).length > 0 ? ` (+${e.secondaryMuscles!.length})` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="num-pill px-2.5 py-1 text-xs font-medium text-muted-foreground">
                {e.equipment}
              </span>
              <ChevronLeft className="h-5 w-5 text-muted-foreground" />
            </div>
          </Link>
        ))}
        {list.length === 0 && (
          <p className="surface-card p-5 text-sm text-muted-foreground">
            לא נמצאו תרגילים תואמים. לחץ על + כדי ליצור תרגיל חדש.
          </p>
        )}
      </div>
    </AppShell>
  );
}
