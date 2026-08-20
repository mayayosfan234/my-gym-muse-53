import { createFileRoute } from "@tanstack/react-router";
import { Activity, Clock, Dumbbell, History as HistoryIcon, Layers, Scale, Trash2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ConfirmSheet } from "@/components/ui-app/ConfirmSheet";
import { EmptyState, StatTile } from "@/components/ui-app/primitives";
import { deleteSession, useGym } from "@/lib/gym-store";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "היסטוריית אימונים — הרוטינה שלי" },
      {
        name: "description",
        content: "כל האימונים, אירובי ושקילות שנשמרו במערכת.",
      },
      { property: "og:title", content: "היסטוריית אימונים — הרוטינה שלי" },
    ],
  }),
  component: HistoryPage,
});

function formatRelativeDate(dateIso: string) {
  const date = new Date(dateIso);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "היום";
  if (diffDays === 1) return "אתמול";
  if (diffDays === 2) return "לפני יומיים";
  if (diffDays <= 6) return `לפני ${diffDays} ימים`;
  if (diffDays <= 30) return "החודש";
  return date.toLocaleDateString("he-IL");
}

function HistoryPage() {
  const { history, cardioLogs, bodyWeightLogs } = useGym();
  const [activeTab, setActiveTab] = useState<"workouts" | "cardio" | "weight">("workouts");
  const [pendingDelete, setPendingDelete] = useState<{ id: string; name: string } | null>(null);

  const totalSets = history.reduce(
    (v, s) => v + s.entries.reduce((acc, e) => acc + e.sets.filter((x) => !x.warmup).length, 0),
    0,
  );
  const totalVolume = history.reduce(
    (v, s) =>
      v +
      s.entries.reduce(
        (acc, e) =>
          acc + e.sets.filter((x) => !x.warmup).reduce((a, b) => a + b.reps * b.weight, 0),
        0,
      ),
    0,
  );
  const totalCardioMinutes = (cardioLogs ?? []).reduce((acc, c) => acc + c.durationMin, 0);

  return (
    <AppShell kicker="היסטוריה" title="תיעוד ופעילות" subtitle={`${history.length} אימונים תועדו`}>
      {/* Summary Stat tiles */}
      <div className="grid grid-cols-3 gap-2.5">
        <StatTile label="סטים" value={String(totalSets)} icon={Layers} tone="sage" />
        <StatTile
          label="נפח ק״ג"
          value={
            totalVolume >= 1000
              ? `${(totalVolume / 1000).toFixed(1)}k`
              : String(Math.round(totalVolume))
          }
          icon={Dumbbell}
          tone="rose"
        />
        <StatTile
          label="אירובי"
          value={`${totalCardioMinutes}m`}
          icon={Activity}
          tone="cream"
        />
      </div>

      {/* Navigation tabs */}
      <div className="mt-5 flex gap-1 rounded-2xl bg-secondary p-1">
        <button
          type="button"
          onClick={() => setActiveTab("workouts")}
          className={`press flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-colors ${
            activeTab === "workouts"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-ink"
          }`}
        >
          אימוני כוח ({history.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("cardio")}
          className={`press flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-colors ${
            activeTab === "cardio"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-ink"
          }`}
        >
          אירובי ({(cardioLogs ?? []).length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("weight")}
          className={`press flex-1 rounded-xl py-2.5 text-[13px] font-bold transition-colors ${
            activeTab === "weight"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-ink"
          }`}
        >
          משקל גוף ({(bodyWeightLogs ?? []).length})
        </button>
      </div>

      {/* Tab: Workouts */}
      {activeTab === "workouts" ? (
        <section className="mt-4 space-y-3">
          {history.map((s) => {
            const volume = s.entries.reduce(
              (v, e) =>
                v + e.sets.filter((set) => !set.warmup).reduce((a, b) => a + b.reps * b.weight, 0),
              0,
            );
            const workingSets = s.entries.reduce(
              (acc, e) => acc + e.sets.filter((x) => !x.warmup).length,
              0,
            );
            return (
              <article key={s.id} className="surface-card p-4 text-start">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-soft text-primary">
                    <Dumbbell className="h-5 w-5" strokeWidth={1.8} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-[15.5px] font-semibold text-ink">
                      {s.workoutName}
                    </p>
                    <p className="mt-0.5 text-[12px] text-muted-foreground">
                      {s.programName ? `${s.programName} · ` : ""}
                      <span className="font-semibold text-primary">
                        {formatRelativeDate(s.date)}
                      </span>{" "}
                      · {new Date(s.date).toLocaleDateString("he-IL")}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="num-pill px-2.5 py-1 text-[11px] font-medium text-ink">
                        {workingSets} סטים
                      </span>
                      <span className="num-pill px-2.5 py-1 text-[11px] font-medium text-ink">
                        {Math.round(s.durationSec / 60)} דקות
                      </span>
                      <span className="num-pill px-2.5 py-1 text-[11px] font-semibold text-primary">
                        {Math.round(volume)} ק״ג
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label="מחק אימון מההיסטוריה"
                    onClick={() => setPendingDelete({ id: s.id, name: s.workoutName })}
                    className="press grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-muted-foreground hover:bg-secondary hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 space-y-3 border-t border-border/40 pt-3">
                  {s.entries.map((e, i) => (
                    <div key={i}>
                      <p className="text-[13.5px] font-semibold text-ink">{e.exerciseName}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5" dir="ltr">
                        {e.sets.map((set, j) => (
                          <span
                            key={j}
                            className={`num-pill px-2.5 py-1 text-[11.5px] font-semibold tabular-nums ${
                              set.dropSet
                                ? "bg-primary/15 text-primary border-primary/30"
                                : "text-ink"
                            }`}
                          >
                            {set.weight}kg × {set.reps}
                            {set.drops && set.drops.length > 0
                              ? set.drops.map((d) => ` → ${d.weight}kg × ${d.reps}`).join("")
                              : set.dropSet
                                ? " (Drop)"
                                : ""}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
          {history.length === 0 ? (
            <EmptyState
              icon={HistoryIcon}
              title="עדיין לא נרשמו אימונים"
              description='התחילי אימון ראשון ולחצי על "סיים ושמור אימון" כדי לראות אותו כאן.'
            />
          ) : null}
        </section>
      ) : null}

      {/* Tab: Cardio */}
      {activeTab === "cardio" ? (
        <section className="mt-4 space-y-3">
          {(cardioLogs ?? []).map((c) => (
            <article key={c.id} className="surface-card p-4 text-start">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-soft text-primary">
                  <Activity className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[15.5px] font-semibold text-ink">{c.type}</p>
                  <p className="text-[12px] text-muted-foreground">
                    {c.date} · {c.durationMin} דקות {c.speedKmH ? `· ${c.speedKmH} קמ״ש` : ""}
                    {c.inclinePct ? ` · שיפוע ${c.inclinePct}%` : ""}
                  </p>
                </div>
                <span className="num-pill px-3 py-1.5 text-[13px] font-bold text-primary">
                  {c.caloriesBurned} קל׳
                </span>
              </div>
            </article>
          ))}
          {(cardioLogs ?? []).length === 0 ? (
            <EmptyState
              icon={Activity}
              title="אין אימוני אירובי מתועדים"
              description="תוכלי לתעד אירובי (ריצה/הליכון) בלחיצה על כפתור 'אירובי' במסך הבית."
            />
          ) : null}
        </section>
      ) : null}

      {/* Tab: Weight */}
      {activeTab === "weight" ? (
        <section className="mt-4 space-y-3">
          {(bodyWeightLogs ?? []).map((w) => (
            <article key={w.id} className="surface-card p-4 text-start flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-soft text-primary">
                  <Scale className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display text-[15px] font-semibold text-ink">{w.date}</p>
                  <p className="text-[12px] text-muted-foreground">שקילת גוף</p>
                </div>
              </div>
              <span className="font-display text-[20px] font-bold text-primary tabular-nums">
                {w.weight} <span className="text-[12px] font-normal text-muted-foreground">ק״ג</span>
              </span>
            </article>
          ))}
          {(bodyWeightLogs ?? []).length === 0 ? (
            <EmptyState
              icon={Scale}
              title="אין שקילות מתועדות"
              description="לחצי על תיעוד משקל במסך הבית כדי לעקוב אחר ההתקדמות שלך."
            />
          ) : null}
        </section>
      ) : null}

      <ConfirmSheet
        open={pendingDelete !== null}
        title="למחוק את האימון מההיסטוריה?"
        description={
          pendingDelete
            ? `הפעולה תמחק את "${pendingDelete.name}" מההיסטוריה. לא ניתן לשחזר.`
            : undefined
        }
        confirmLabel="מחק אימון"
        cancelLabel="חזרה"
        destructive
        onConfirm={() => {
          if (pendingDelete) deleteSession(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </AppShell>
  );
}
