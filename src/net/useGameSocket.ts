import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  ClientMessage,
  EnergyProps,
  GameState,
  HitTarget,
  ServerMessage,
} from "../../shared/types.ts";
import { createInitialState } from "../../shared/game.ts";

/**
 * Connect to the game socket on the SAME host:port the page was served from,
 * via the Vite `/ws` proxy. So a phone that can load the page (from the QR
 * code) can always reach the live connection too — there's no separate port to
 * be blocked. `ws://` for http pages, `wss://` for https.
 */
function socketUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}/ws`;
}

export interface GameEvents {
  onBurst?: (energy: EnergyProps) => void;
  onHeal?: (amount: number) => void;
  onBomb?: (damage: number, type: "magic" | "bug") => void;
  onVictory?: () => void;
  onReset?: () => void;
}

export interface GameSocket {
  state: GameState;
  lanUrl: string;
  connected: boolean;
  sendHit: (target: HitTarget, from: string) => void;
  reset: () => void;
}

/**
 * Connects to the game server, keeps the latest authoritative state, and
 * forwards transient events (bursts / bomb / victory) to the caller.
 * Auto-reconnects with a small backoff so a flaky demo Wi-Fi recovers.
 */
export function useGameSocket(
  role: "screen" | "phone",
  name: string,
  events: GameEvents = {},
): GameSocket {
  const [state, setState] = useState<GameState>(createInitialState);
  const [lanIp, setLanIp] = useState("");
  const [connected, setConnected] = useState(false);

  // Build the phone URL from the LAN IP (from the server) + the port this page
  // is actually served on — so it stays correct even if Vite bumped the port.
  const lanUrl = useMemo(() => {
    if (!lanIp) return "";
    const port = window.location.port || "5173";
    return `http://${lanIp}:${port}/props`;
  }, [lanIp]);

  const wsRef = useRef<WebSocket | null>(null);
  const eventsRef = useRef(events);
  eventsRef.current = events;

  useEffect(() => {
    let closed = false;
    let retry = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      const ws = new WebSocket(socketUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        retry = 0;
        setConnected(true);
        const join: ClientMessage = { kind: "join", role, name };
        ws.send(JSON.stringify(join));
      };

      ws.onmessage = (e) => {
        const msg = JSON.parse(e.data as string) as ServerMessage;
        switch (msg.kind) {
          case "state":
            setState(msg.state);
            setLanIp(msg.lanIp);
            break;
          case "burst":
            eventsRef.current.onBurst?.(msg.energy);
            break;
          case "heal":
            eventsRef.current.onHeal?.(msg.amount);
            break;
          case "bomb":
            eventsRef.current.onBomb?.(msg.attack.damage, msg.attack.type);
            break;
          case "victory":
            eventsRef.current.onVictory?.();
            break;
          case "reset":
            eventsRef.current.onReset?.();
            break;
        }
      };

      ws.onclose = () => {
        setConnected(false);
        if (closed) return;
        retry = Math.min(retry + 1, 6);
        timer = setTimeout(connect, retry * 400);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      closed = true;
      if (timer) clearTimeout(timer);
      wsRef.current?.close();
    };
  }, [role, name]);

  const sendHit = useCallback((target: HitTarget, from: string) => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { kind: "hit", target, from };
      ws.send(JSON.stringify(msg));
    }
  }, []);

  const reset = useCallback(() => {
    const ws = wsRef.current;
    if (ws?.readyState === WebSocket.OPEN) {
      const msg: ClientMessage = { kind: "reset" };
      ws.send(JSON.stringify(msg));
    }
  }, []);

  return { state, lanUrl, connected, sendHit, reset };
}
