export interface Trail {
  id: number;
  /** horizontal launch position, 0–100 (vw) */
  x: number;
}

interface EnergyTrailsProps {
  trails: Trail[];
}

/** Streaks of light rising from the crowd into the Spirit Bomb. */
export function EnergyTrails({ trails }: EnergyTrailsProps) {
  return (
    <div className="trails" aria-hidden>
      {trails.map((t) => (
        <span
          key={t.id}
          className="trail"
          style={{ left: `${t.x}vw`, ["--dx" as string]: `${50 - t.x}vw` }}
        />
      ))}
    </div>
  );
}
