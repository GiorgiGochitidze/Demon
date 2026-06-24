interface HealthBarProps {
  name: string;
  hp: number;
  maxHp: number;
  /** Crowd-scaling multiplier (1× with 0–1 hunters, 2× with 2, …). */
  multiplier: number;
}

export function HealthBar({ name, hp, maxHp, multiplier }: HealthBarProps) {
  const pct = Math.max(0, (hp / maxHp) * 100);
  const low = pct <= 25;
  return (
    <div className="health">
      <div className="health__row">
        <span className="health__name">
          {name}
          {multiplier > 1 && (
            <span className="health__rage">×{multiplier} RAGE</span>
          )}
        </span>
        <span className="health__label">
          HEALTH <span className="health__hp">{hp}/{maxHp}</span>
        </span>
      </div>
      <div className="health__track">
        <div
          className={`health__fill ${low ? "health__fill--low" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
