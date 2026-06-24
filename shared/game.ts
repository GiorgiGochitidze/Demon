import type { BossAttack, EnergyProps, GameState, HitTarget } from "./types.ts";

export const BOSS_NAME = "Any-Type Demon";

/** Tunables for the live demo. Tweak freely before a presentation. */
export const CONFIG = {
  /**
   * Boss HP contributed per connected hunter. The demon scales with the crowd:
   * 1 hunter → 1000 HP, 2 hunters → 2000 HP, and so on. With 0 hunters it
   * stays at the 1× baseline.
   */
  hpPerHunter: 1000,
  chargeMax: 100,

  // ----- arena balance (the falling-items mini-game on each phone) -----
  /** Demon HP removed when a hunter taps a normal prop. */
  propDamage: 12,
  /** Demon HP removed when a hunter taps a rare golden prop. */
  goldDamage: 45,
  /**
   * Demon HP RESTORED when a hunter taps an error by mistake. Deliberately
   * much larger than `propDamage` so a single slip undoes a long streak —
   * beating the demon takes precision, not spam.
   */
  errorHeal: 100,
  /** Each hunter's personal health (client-side). */
  playerMaxHp: 100,
  /** Player HP lost per error tapped. */
  errorSelfDamage: 22,
  /** How long a downed hunter spends "recompiling" before respawning (ms). */
  respawnMs: 5000,

  // ----- arena pace (lower = faster = harder) -----
  /** Fastest / slowest fall time for an item, in ms. */
  fallMinMs: 1100,
  fallMaxMs: 1700,
  /** Shortest / longest gap between spawns, in ms. */
  spawnMinMs: 340,
  spawnMaxMs: 620,
} as const;

/** Boss max HP for a given hunter count (never below the 1× baseline). */
export function bossMaxHpFor(hunters: number): number {
  return CONFIG.hpPerHunter * Math.max(1, hunters);
}

/** How much demon HP a good hit removes. Errors are handled separately. */
export function damageFor(target: HitTarget): number {
  switch (target) {
    case "gold":
      return CONFIG.goldDamage;
    case "prop":
      return CONFIG.propDamage;
    case "error":
      return 0;
  }
}

export function createInitialState(): GameState {
  return {
    phase: "fighting",
    bossName: BOSS_NAME,
    bossHp: CONFIG.hpPerHunter,
    bossMaxHp: CONFIG.hpPerHunter,
    charge: 0,
    chargeMax: CONFIG.chargeMax,
    hunters: 0,
    totalProps: 0,
    totalErrors: 0,
  };
}

/**
 * Turn accumulated crowd energy into a typed attack on the boss.
 * This is the `attackBoss(energy: EnergyProps)` from the exam screen — fully
 * typed, no `any` in sight.
 */
export function attackBoss(energy: EnergyProps): BossAttack {
  // Big collective pushes read as "magic"; small focused ones as "bug" fixes.
  const type: BossAttack["type"] = energy.power >= 80 ? "magic" : "bug";
  const damage = Math.round(energy.power * (type === "magic" ? 1.5 : 1.1));
  return { type, damage };
}

/** Clamp a number into [min, max]. */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
