import { useEffect, useRef, useState } from "react";

interface VictoryProps {
  onReset: () => void;
}

const COLORS = ["#39d0ff", "#ffd24a", "#7c5cff", "#ff5ca8", "#5cffb0"];

export function Victory({ onReset }: VictoryProps) {
  const [pieces] = useState(() =>
    Array.from({ length: 80 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.8,
      dur: 1.6 + Math.random() * 1.6,
      color: COLORS[i % COLORS.length],
      rot: Math.random() * 360,
    })),
  );
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <div className="victory">
      <div className="confetti" aria-hidden>
        {pieces.map((p) => (
          <span
            key={p.id}
            style={{
              left: `${p.left}%`,
              background: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
              transform: `rotate(${p.rot}deg)`,
            }}
          />
        ))}
      </div>
      <div className="victory__card">
        <div className="victory__title">EXAM PASSED!</div>
        <div className="victory__sub">WELCOME TO THE ACADEMY!</div>
        <div className="victory__demon">Any-Type Demon defeated · types are safe ✅</div>
        <button ref={ref} className="victory__btn" onClick={onReset}>
          Play again ↺
        </button>
      </div>
    </div>
  );
}
