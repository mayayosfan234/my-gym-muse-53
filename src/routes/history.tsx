import { createFileRoute } from "@tanstack/react-router";
import { Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
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

  return (
    <AppShell title="היסטוריית אימונים" subtitle={`${history.length} אימונים תועדו`}>
      <div className="space-y-3.5 text-start">
        {history.map((s) => {
          const volume = s.entries.reduce(
            (v, e) =>
              v +
              e.sets
                .filter((set) => !set.warmup)
                .reduce((a, b) => a + b.reps * b.weight, 0),
            0,
          );
          return (
            <div key={s.id} className="surface-card p-4">
              <div className="grid grid-cols-[1fr_auto] items-start gap-3">
                <div className="min-w-0">
                  <p className="truncate text-lg font-bold text-foreground">{s.workoutName}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {s.programName ? `${s.programName} · ` : ""}
                    <span className="font-semibold text-primary">{formatRelativeDate(s.date)}</span> (
                    {new Date(s.date).toLocaleDateString("he-IL")}) ·{" "}
                    {Math.round(s.durationSec / 60)} דקות · נפח {Math.round(volume)} ק"ג
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="מחק אימון מההיסטוריה"
                  onClick={() => window.confirm(`האם למחוק את האימון מההיסטוריה?`) && deleteSession(s.id)}
                  className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-destructive active:scale-95"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3.5 space-y-3 border-t border-border/60 pt-3">
                {s.entries.map((e, i) => (
                  <div key={i}>
                    <p className="text-xs sm:text-sm font-semibold text-foreground">{e.exerciseName}</p>
                    <div className="mt-1 flex flex-wrap gap-1.5" dir="ltr">
                      {e.sets.map((set, j) => (
                        <span key={j} className={`num-pill px-2.5 py-1 text-xs font-semibold ${set.dropSet ? "bg-primary/10 text-primary border-primary/30" : ""}`}>
                          {set.weight}kg × {set.reps}{set.dropSet ? " (Drop)" : ""}
                        </span>
                      ))}
                      {e.sets.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          לא בוצעו סטים
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {history.length === 0 && (
          <div className="surface-card p-8 text-center text-sm text-muted-foreground">
            עדיין לא נרשמו אימונים. התחל אימון ראשון ולחץ על "סיים ושמור אימון".
          </div>
        )}
      </div>
    </AppShell>
  );
}
