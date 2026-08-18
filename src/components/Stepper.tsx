import { Minus, Plus } from "lucide-react";

export function Stepper({
  label,
  value,
  step = 1,
  min = 0,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  suffix?: string;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(min, Math.round(v * 100) / 100);
  return (
    <div className="min-w-0">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(clamp(value - step))}
          className="grid h-11 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-foreground active:scale-95"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className="num-pill flex h-11 min-w-0 flex-1 items-center justify-center px-1">
          <input
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
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
          className="grid h-11 w-10 shrink-0 place-items-center rounded-lg bg-secondary text-foreground active:scale-95"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
