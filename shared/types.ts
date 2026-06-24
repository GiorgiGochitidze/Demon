/**
 * Hunter x Coder — shared type contracts.
 *
 * The whole point of the demo: no `any` survives. Every value crossing the
 * wire is typed.
 */

/** The boss takes either a magic blast or a well-aimed bug report. */
export interface BossAttack {
  type: "magic" | "bug";
  damage: number;
}

/** One contribution of energy from a single hunter (a phone in the crowd). */
export interface EnergyProps {
  /** How much raw energy this contribution carries. */
  power: number;
  /** Display name / id of the hunter who sent it. */
  from: string;
}

/**
 * What a hunter tapped in their falling-items arena:
 * - `prop`  — a good token. Damages the demon a little.
 * - `gold`  — a rare golden prop. Big damage.
 * - `error` — a bug. Backfires: hurts the hunter and HEALS the demon.
 */
export type HitTarget = "prop" | "gold" | "error";

export type GamePhase = "fighting" | "victory";

/** Authoritative game state, owned by the server, broadcast to everyone. */
export interface GameState {
  phase: GamePhase;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  /** Energy currently stored in the Spirit Bomb. */
  charge: number;
  /** Energy needed before the Spirit Bomb fires. */
  chargeMax: number;
  /** Number of phones currently connected. */
  hunters: number;
  /** Total props (good tokens) landed this run. */
  totalProps: number;
  /** Total errors mistakenly tapped this run (each one healed the demon). */
  totalErrors: number;
}

/** Messages a phone/screen sends *to* the server. */
export type ClientMessage =
  | { kind: "join"; role: "screen" | "phone"; name: string }
  | { kind: "hit"; target: HitTarget; from: string }
  | { kind: "reset" };

/** Messages the server broadcasts *to* clients. */
export type ServerMessage =
  | { kind: "state"; state: GameState; lanIp: string }
  | { kind: "burst"; energy: EnergyProps }
  | { kind: "heal"; amount: number; from: string }
  | { kind: "bomb"; attack: BossAttack }
  | { kind: "victory" }
  | { kind: "reset" };
