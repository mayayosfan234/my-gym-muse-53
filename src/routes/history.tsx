import { createFileRoute } from "@tanstack/react-router";
import { Clock, Dumbbell, History as HistoryIcon, Layers, Trash2 } from "lucide-react";
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
        content: "כל האימונים שנשמרו כולל סטים, חזרות ומשקלים שבוצעו בפועל.",
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
  const { history } = useGym();
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
  const totalDuration = history.reduce((v, s) => v + s.durationSec, 0);

  return (
    <AppShell kicker="היסטוריה" title="אימונים שמורים" subtitle={`${history.length} אימונים תועדו`}>
      {/* Summary */}
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
          label="זמן כולל"
          value={`${Math.round(totalDuration / 60)}m`}
          icon={Clock}
          tone="cream"
        />
      </div>

      <section className="mt-6 space-y-3">
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
            <article key={s.id} className="surface-card p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-sage-soft text-primary">
                  <Dumbbell className="h-5 w-5" strokeWidth={1.8} />
                </div>
                <div className="min-w-0 flex-1 text-start">
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

              <div className="mt-3 space-y-3.5 border-t border-border/40 pt-3">
                {s.entries.map((e, i) => (
                  <div key={i} className="text-start">
                    <p className="text-[13.5px] font-semibold text-ink">{e.exerciseName}</p>
                    <div className="mt-2 flex flex-wrap gap-2" dir="ltr">
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
                          {set.dropSet ? " (Drop)" : ""}
                        </span>
                      ))}
                      {e.sets.length === 0 ? (
                        <span className="text-[12px] text-muted-foreground">לא בוצעו סטים</span>
                      ) : null}
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
