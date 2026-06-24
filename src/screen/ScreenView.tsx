import { useCallback, useRef, useState } from "react";

import { useGameSocket } from "../net/useGameSocket.ts";
import { CONFIG } from "../../shared/game.ts";
import { HealthBar } from "./HealthBar.tsx";
import { Boss } from "./Boss.tsx";
import { SpiritBomb } from "./SpiritBomb.tsx";
import { QrPanel } from "./QrPanel.tsx";
import { CodePanel } from "./CodePanel.tsx";
import { EnergyTrails, type Trail } from "./EnergyTrails.tsx";
import { Victory } from "./Victory.tsx";
import "./screen.css";

let trailId = 0;

export function ScreenView() {
  const [trails, setTrails] = useState<Trail[]>([]);
  const [firing, setFiring] = useState(false);
  const [shake, setShake] = useState(false);
  const [healed, setHealed] = useState(false);
  const [floatDmg, setFloatDmg] = useState<
    { id: number; text: string; kind: "magic" | "bug" | "heal" }[]
  >([]);
  const dmgId = useRef(0);

  const onBurst = useCallback(() => {
    const id = trailId++;
    // Random launch point along the crowd at the bottom of the stage.
    const x = 8 + Math.random() * 84;
    setTrails((t) => [...t, { id, x }]);
    setTimeout(() => setTrails((t) => t.filter((p) => p.id !== id)), 1100);
  }, []);

  const onBomb = useCallback((damage: number, type: "magic" | "bug") => {
    setFiring(true);
    setShake(true);
    const id = dmgId.current++;
    setFloatDmg((d) => [
      ...d,
      { id, text: `-${damage} ${type === "magic" ? "✦" : "🐛"}`, kind: type },
    ]);
    setTimeout(() => setFiring(false), 900);
    setTimeout(() => setShake(false), 600);
    setTimeout(() => setFloatDmg((d) => d.filter((x) => x.id !== id)), 1400);
  }, []);

  // A hunter tapped an error — the demon feeds on the mistake and heals.
  const onHeal = useCallback((amount: number) => {
    setHealed(true);
    const id = dmgId.current++;
    setFloatDmg((d) => [...d, { id, text: `+${amount} ⬆`, kind: "heal" }]);
    setTimeout(() => setHealed(false), 500);
    setTimeout(() => setFloatDmg((d) => d.filter((x) => x.id !== id)), 1400);
  }, []);

  const { state, lanUrl, connected, reset } = useGameSocket(
    "screen",
    "Big Screen",
    {
      onBurst,
      onBomb,
      onHeal,
    },
  );

  const chargePct = Math.round((state.charge / state.chargeMax) * 100);
  const won = state.phase === "victory";
  const multiplier = Math.round(state.bossMaxHp / CONFIG.hpPerHunter);

  return (
    <div className={`screen ${shake ? "screen--shake" : ""}`}>
      <header className="banner">
        <span className="banner__glow">SkillWill</span>
        <span className="banner__sub">REACT &amp; TYPESCRIPT DEMO</span>
        <span className={`conn ${connected ? "conn--on" : "conn--off"}`}>
          {connected ? "● LIVE" : "○ offline"}
        </span>
      </header>

      <main className="stage">
        <section className="stage__left">
          <CodePanel charge={state.charge} chargeMax={state.chargeMax} />
        </section>

        <section className="stage__center">
          <QrPanel url={lanUrl} hunters={state.hunters} />
          <SpiritBomb chargePct={chargePct} firing={firing} />
          <div className="charge-readout">
            CHARGING… <strong>{chargePct}%</strong>
          </div>
        </section>

        <section className="stage__right">
          <HealthBar
            name={state.bossName}
            hp={state.bossHp}
            maxHp={state.bossMaxHp}
            multiplier={multiplier}
          />
          <Boss
            hp={state.bossHp}
            maxHp={state.bossMaxHp}
            multiplier={multiplier}
            hit={firing}
            healed={healed}
            dead={won}
          />
          {floatDmg.map((d) => (
            <span
              key={d.id}
              className={`float-dmg ${
                d.kind === "magic"
                  ? "float-dmg--magic"
                  : d.kind === "heal"
                    ? "float-dmg--heal"
                    : ""
              }`}
            >
              {d.text}
            </span>
          ))}
        </section>
      </main>

      <EnergyTrails trails={trails} />

      <footer className="stats">
        <Stat label="HUNTERS" value={state.hunters} />
        <Stat label="PROPS HIT" value={state.totalProps} />
        <Stat label="ERRORS FED" value={state.totalErrors} />
        <Stat label="BOSS HP" value={`${state.bossHp}/${state.bossMaxHp}`} />
        <button className="reset-btn" onClick={reset}>
          ↺ RESET
        </button>
      </footer>

      {won && <Victory onReset={reset} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat">
      <span className="stat__value">{value}</span>
      <span className="stat__label">{label}</span>
    </div>
  );
}
