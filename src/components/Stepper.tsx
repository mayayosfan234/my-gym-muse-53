import { Minus, Plus } from "lucide-react";

export function Stepper({
  label,
  value,
  step = 1,
  min = 0,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  /** Optional upper bound. Omit to allow any large number (e.g. warm-up reps > 9). */
  max?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => {
    let n = Math.max(min, Math.round(v * 100) / 100);
    if (max != null) n = Math.min(max, n);
    return n;
  };

  return (
    <div className="min-w-0">
      <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - step))}
          className="grid h-11 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground transition-transform active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="num-pill flex h-11 min-w-0 flex-1 items-center justify-center px-1">
          <input
            inputMode="decimal"
            value={Number.isFinite(value) ? value : 0}
            onChange={(e) => {
              const raw = e.target.value.replace(",", ".");
              if (raw === "" || raw === "-") {
                onChange(min);
                return;
              }
              const n = Number(raw);
              if (!Number.isNaN(n)) onChange(clamp(n));
            }}
            className="w-full min-w-0 bg-transparent text-center text-base font-semibold outline-none"
          />
          {suffix ? (
            <span className="pr-1 text-xs text-muted-foreground">{suffix}</span>
          ) : null}
        </div>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(clamp(value + step))}
          className="grid h-11 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-secondary-foreground transition-transform active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
