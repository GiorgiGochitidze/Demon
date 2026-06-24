interface SpiritBombProps {
  /** 0–100 */
  chargePct: number;
  firing: boolean;
}

export function SpiritBomb({ chargePct, firing }: SpiritBombProps) {
  // Grows from a spark to a sun as the crowd charges it.
  const scale = 0.35 + (chargePct / 100) * 0.9;

  return (
    <div className={`bomb ${firing ? "bomb--fire" : ""}`}>
      <div
        className="bomb__core"
        style={{ transform: `scale(${firing ? 1.5 : scale})` }}
      >
        <div className="bomb__ring bomb__ring--1" />
        <div className="bomb__ring bomb__ring--2" />
        <div className="bomb__inner" />
      </div>
    </div>
  );
}
