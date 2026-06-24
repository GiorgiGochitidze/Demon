import { useCallback, useEffect, useRef, useState } from "react";

import { useGameSocket } from "../net/useGameSocket.ts";
import { CONFIG, damageFor } from "../../shared/game.ts";
import type { HitTarget } from "../../shared/types.ts";
import { Sound, resumeAudio } from "./sound.ts";
import "./phone.css";

const NAMES = ["Hunter", "Coder", "Dev", "Ninja", "Wizard", "Debugger"];
function randomName(): string {
  const n = NAMES[Math.floor(Math.random() * NAMES.length)];
  return `${n}#${Math.floor(100 + Math.random() * 900)}`;
}

/** What can fall in the arena. */
type ItemKind = HitTarget; // "prop" | "gold" | "error"

interface Item {
  id: number;
  kind: ItemKind;
  /** horizontal position, 8–86 (%) */
  x: number;
  /** fall duration in ms */
  dur: number;
  glyph: string;
}

interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
  cls: string;
}

const PROP_GLYPHS = ["⚛️", "✅", "💡", "🧩", "👏"];
const ERROR_GLYPHS = ["🐛", "💥", "any", "null", "☠️"];

function pickKind(): ItemKind {
  const r = Math.random();
  if (r < 0.12) return "gold";
  if (r < 0.12 + 0.4) return "error"; // errors are common → real risk
  return "prop";
}

function glyphFor(kind: ItemKind): string {
  if (kind === "gold") return "⭐";
  const set = kind === "error" ? ERROR_GLYPHS : PROP_GLYPHS;
  return set[Math.floor(Math.random() * set.length)];
}

export function PhoneView() {
  const nameRef = useRef(randomName());
  const arenaRef = useRef<HTMLDivElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [playerHp, setPlayerHp] = useState<number>(CONFIG.playerMaxHp);
  const [downed, setDowned] = useState(false);
  const [respawnLeft, setRespawnLeft] = useState(0);
  const [combo, setCombo] = useState(0);
  const [hits, setHits] = useState(0);
  const [oops, setOops] = useState(0);
  const [shake, setShake] = useState(false);
  const [bombFlash, setBombFlash] = useState(false);

  const idRef = useRef(1);
  const fidRef = useRef(1);
  const comboRef = useRef(0);
  const playingRef = useRef(false);

  const { state, connected, sendHit, reset } = useGameSocket(
    "phone",
    nameRef.current,
    {
      onBomb: () => {
        setBombFlash(true);
        Sound.bomb();
        window.setTimeout(() => setBombFlash(false), 500);
      },
      onVictory: () => Sound.victory(),
      onReset: () => {
        setPlayerHp(CONFIG.playerMaxHp);
        setDowned(false);
        setItems([]);
        setHits(0);
        setOops(0);
        comboRef.current = 0;
        setCombo(0);
      },
    },
  );

  const won = state.phase === "victory";
  const multiplier = Math.round(state.bossMaxHp / CONFIG.hpPerHunter);
  const demonPct = Math.max(0, (state.bossHp / state.bossMaxHp) * 100);
  const hpPct = Math.max(0, (playerHp / CONFIG.playerMaxHp) * 100);

  const live = connected && !downed && !won;
  playingRef.current = live;

  // ----- spawn loop (only while the arena is live) -----
  useEffect(() => {
    if (!live) return;
    let cancelled = false;
    let timer = 0;
    const loop = () => {
      if (cancelled) return;
      const kind = pickKind();
      const item: Item = {
        id: idRef.current++,
        kind,
        x: 8 + Math.random() * 78,
        dur: CONFIG.fallMinMs + Math.random() * (CONFIG.fallMaxMs - CONFIG.fallMinMs),
        glyph: glyphFor(kind),
      };
      setItems((prev) => (prev.length >= 8 ? prev : [...prev, item]));
      timer = window.setTimeout(
        loop,
        CONFIG.spawnMinMs + Math.random() * (CONFIG.spawnMaxMs - CONFIG.spawnMinMs),
      );
    };
    timer = window.setTimeout(loop, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [live]);

  const removeItem = useCallback((id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const addFloater = useCallback(
    (x: number, y: number, text: string, cls: string) => {
      const id = fidRef.current++;
      setFloaters((prev) => [...prev, { id, x, y, text, cls }]);
      window.setTimeout(
        () => setFloaters((prev) => prev.filter((f) => f.id !== id)),
        800,
      );
    },
    [],
  );

  const triggerDowned = useCallback(() => {
    setDowned(true);
    setItems([]);
    setRespawnLeft(Math.ceil(CONFIG.respawnMs / 1000));
  }, []);

  const onTap = useCallback(
    (item: Item, clientX: number, clientY: number) => {
      if (!playingRef.current) return;
      resumeAudio();
      removeItem(item.id);

      const rect = arenaRef.current?.getBoundingClientRect();
      const fx = rect ? clientX - rect.left : clientX;
      const fy = rect ? clientY - rect.top : clientY;

      if (item.kind === "error") {
        comboRef.current = 0;
        setCombo(0);
        setOops((n) => n + 1);
        Sound.error();
        if (navigator.vibrate) navigator.vibrate([40, 30, 60]);
        setShake(true);
        window.setTimeout(() => setShake(false), 350);
        addFloater(fx, fy, `-${CONFIG.errorSelfDamage} ❤`, "fl-err");
        sendHit("error", nameRef.current);
        setPlayerHp((hp) => {
          const next = hp - CONFIG.errorSelfDamage;
          if (next <= 0) {
            triggerDowned();
            return 0;
          }
          return next;
        });
        return;
      }

      // prop or gold
      const next = comboRef.current + 1;
      comboRef.current = next;
      setCombo(next);
      setHits((n) => n + 1);
      if (item.kind === "gold") Sound.gold();
      else Sound.prop(next);
      if (navigator.vibrate) navigator.vibrate(12);
      const dmg = damageFor(item.kind);
      const tag = next > 1 ? ` x${next}` : "";
      addFloater(fx, fy, `-${dmg}${tag}`, item.kind === "gold" ? "fl-gold" : "fl-prop");
      sendHit(item.kind, nameRef.current);
    },
    [addFloater, removeItem, sendHit, triggerDowned],
  );

  // --- respawn countdown ---
  useEffect(() => {
    if (!downed) return;
    const iv = window.setInterval(() => {
      setRespawnLeft((s) => {
        if (s <= 1) {
          window.clearInterval(iv);
          setPlayerHp(CONFIG.playerMaxHp);
          setDowned(false);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(iv);
  }, [downed]);

  return (
    <div className={`phone ${won ? "phone--won" : ""} ${shake ? "phone--shake" : ""}`}>
      <header className="phone__head">
        <span className="phone__logo">⚔️ Hunter x Coder</span>
        <span className={`phone__conn ${connected ? "on" : "off"}`}>
          {connected ? "live" : "…"}
        </span>
      </header>

      {/* demon health (shared, from server) */}
      <div className="bar bar--demon">
        <div className="bar__top">
          <span>
            {state.bossName}
            {multiplier > 1 && <span className="bar__rage">×{multiplier}</span>}
          </span>
          <span className="bar__num">{state.bossHp}/{state.bossMaxHp}</span>
        </div>
        <div className="bar__track">
          <div className="bar__fill bar__fill--demon" style={{ width: `${demonPct}%` }} />
        </div>
      </div>

      {/* player health */}
      <div className="bar bar--player">
        <div className="bar__top">
          <span>YOUR HP</span>
          <span className="bar__num">{Math.max(0, playerHp)}/{CONFIG.playerMaxHp}</span>
        </div>
        <div className="bar__track">
          <div
            className={`bar__fill bar__fill--player ${hpPct <= 30 ? "bar__fill--low" : ""}`}
            style={{ width: `${hpPct}%` }}
          />
        </div>
      </div>

      {/* arena */}
      <div className="arena" ref={arenaRef}>
        {bombFlash && <div className="arena__bomb" />}

        {items.map((it) => (
          <button
            key={it.id}
            className={`fitem fitem--${it.kind}`}
            style={{ left: `${it.x}%`, ["--dur" as string]: `${it.dur}ms` }}
            onAnimationEnd={() => removeItem(it.id)}
            onPointerDown={(e) => {
              e.preventDefault();
              onTap(it, e.clientX, e.clientY);
            }}
          >
            {it.glyph}
          </button>
        ))}

        {floaters.map((f) => (
          <span key={f.id} className={`floater ${f.cls}`} style={{ left: f.x, top: f.y }}>
            {f.text}
          </span>
        ))}

        {!connected && <div className="arena__msg">connecting…</div>}

        {downed && (
          <div className="arena__downed">
            <div className="arena__downed-em">🔧</div>
            <div className="arena__downed-t">DEBUGGED OUT</div>
            <div className="arena__downed-s">recompiling… {respawnLeft}s</div>
          </div>
        )}

        {won && (
          <div className="arena__win">
            <div className="arena__win-em">🎉</div>
            <div className="arena__win-t">EXAM PASSED!</div>
            <div className="arena__win-s">Welcome to the Academy</div>
            <button className="arena__win-btn" onClick={reset}>
              Play again ↺
            </button>
          </div>
        )}
      </div>

      {/* legend */}
      <div className="legend">
        <span className="legend__item legend__item--prop">
          tap props → −{CONFIG.propDamage} demon
        </span>
        <span className="legend__item legend__item--error">
          tap errors → −{CONFIG.errorSelfDamage} you, +{CONFIG.errorHeal} demon
        </span>
      </div>

      <footer className="phone__foot">
        <div>
          <span className="phone__stat">{hits}</span>
          <span className="phone__stat-l">props hit</span>
        </div>
        <div>
          <span className="phone__stat phone__stat--err">{oops}</span>
          <span className="phone__stat-l">errors</span>
        </div>
        <div>
          <span className="phone__stat">{combo > 1 ? `x${combo}` : "—"}</span>
          <span className="phone__stat-l">combo</span>
        </div>
        <div>
          <span className="phone__stat">{state.hunters}</span>
          <span className="phone__stat-l">hunters</span>
        </div>
      </footer>
    </div>
  );
}
