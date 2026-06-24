interface BossProps {
  hp: number;
  maxHp: number;
  multiplier: number;
  hit: boolean;
  healed: boolean;
  dead: boolean;
}

const GLITCH = ["any", "unknown", "// @ts-ignore", "as any", "?:", "null", "void"];

export function Boss({ hp, maxHp, multiplier, hit, healed, dead }: BossProps) {
  const rage = 1 - hp / maxHp; // 0 → 1 as it weakens
  // The demon visibly bulks up as more hunters power it (capped so it fits).
  const scale = Math.min(1 + (multiplier - 1) * 0.12, 1.6);

  return (
    <div
      className={`boss ${hit ? "boss--hit" : ""} ${healed ? "boss--heal" : ""} ${dead ? "boss--dead" : ""}`}
      style={{
        filter: `hue-rotate(${rage * 60}deg)`,
        transform: dead ? undefined : `scale(${scale})`,
      }}
    >
      <div className="boss__aura" />
      <div className="boss__body">
        <div className="boss__eye boss__eye--l" />
        <div className="boss__eye boss__eye--r" />
        <div className="boss__mouth" />
      </div>
      <div className="boss__glitch">
        {GLITCH.map((g, i) => (
          <span key={i} style={{ animationDelay: `${i * 0.3}s` }}>
            {g}
          </span>
        ))}
      </div>
      <div className="boss__tag">Any-Type Demon</div>
    </div>
  );
}
