import { createServer } from "node:http";
import { networkInterfaces } from "node:os";
import { WebSocketServer, WebSocket } from "ws";

import type {
  ClientMessage,
  HitTarget,
  ServerMessage,
} from "../shared/types.ts";
import {
  CONFIG,
  attackBoss,
  bossMaxHpFor,
  clamp,
  createInitialState,
  damageFor,
} from "../shared/game.ts";

const WS_PORT = Number(process.env.WS_PORT ?? 8787);
/** Port the Vite client *usually* runs on — only used for the console hint. */
const CLIENT_PORT = Number(process.env.CLIENT_PORT ?? 5173);

/** Best-effort LAN IPv4 so phones on the same Wi-Fi can scan the QR. */
function getLanIp(): string {
  for (const addrs of Object.values(networkInterfaces())) {
    for (const addr of addrs ?? []) {
      if (addr.family === "IPv4" && !addr.internal) return addr.address;
    }
  }
  return "localhost";
}

// The screen page builds the final QR URL itself, appending whatever port it
// was actually served on — robust even when Vite auto-bumps off a busy 5173.
const lanIp = getLanIp();

let state = createInitialState();

const http = createServer((_req, res) => {
  res.writeHead(200, { "content-type": "application/json" });
  res.end(JSON.stringify({ ok: true, lanIp, hunters: state.hunters }));
});

const wss = new WebSocketServer({ server: http });

/** Phones (role === "phone") count as hunters; screens just observe. */
const roles = new Map<WebSocket, "screen" | "phone">();

function send(ws: WebSocket, msg: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(msg: ServerMessage): void {
  const data = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  }
}

function countHunters(): number {
  let n = 0;
  for (const role of roles.values()) if (role === "phone") n++;
  return n;
}

function broadcastState(): void {
  const hunters = countHunters();

  // The demon scales with the crowd. When the hunter count changes mid-fight,
  // rescale its HP proportionally so the health-bar percentage stays put while
  // the absolute pool grows (more hunters → tougher boss) or shrinks.
  if (state.phase === "fighting") {
    const newMax = bossMaxHpFor(hunters);
    if (newMax !== state.bossMaxHp) {
      const ratio = newMax / state.bossMaxHp;
      state.bossHp = clamp(Math.round(state.bossHp * ratio), 1, newMax);
      state.bossMaxHp = newMax;
    }
  }

  state.hunters = hunters;
  broadcast({ kind: "state", state, lanIp });
}

function handleHit(target: HitTarget, from: string): void {
  if (state.phase !== "fighting") return;

  // An error backfires: it heals the demon (the hunter's own HP loss is
  // tracked client-side on their phone).
  if (target === "error") {
    state.totalErrors += 1;
    state.bossHp = clamp(state.bossHp + CONFIG.errorHeal, 0, state.bossMaxHp);
    broadcast({ kind: "heal", amount: CONFIG.errorHeal, from });
    broadcastState();
    return;
  }

  // A good prop chips the demon and feeds the Spirit Bomb.
  const power = damageFor(target);
  state.totalProps += 1;
  state.bossHp = clamp(state.bossHp - power, 0, state.bossMaxHp);
  state.charge += power;

  // Show the incoming energy trail on the big screen.
  broadcast({ kind: "burst", energy: { power, from } });

  if (state.charge >= state.chargeMax) {
    // Spirit Bomb is full — convert the stored energy into a typed attack.
    const attack = attackBoss({ power: state.charge, from: "The Crowd" });
    state.charge = 0;
    state.bossHp = clamp(state.bossHp - attack.damage, 0, state.bossMaxHp);
    broadcast({ kind: "bomb", attack });
  }

  if (state.bossHp <= 0) {
    state.phase = "victory";
    broadcast({ kind: "victory" });
  }

  broadcastState();
}

function handleReset(): void {
  state = createInitialState();
  broadcast({ kind: "reset" });
  broadcastState();
}

wss.on("connection", (ws) => {
  roles.set(ws, "screen");
  send(ws, { kind: "state", state, lanIp });

  ws.on("message", (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(String(raw)) as ClientMessage;
    } catch {
      return; // ignore malformed frames
    }

    switch (msg.kind) {
      case "join":
        roles.set(ws, msg.role);
        broadcastState();
        break;
      case "hit":
        handleHit(msg.target, String(msg.from ?? "hunter"));
        break;
      case "reset":
        handleReset();
        break;
    }
  });

  ws.on("close", () => {
    roles.delete(ws);
    broadcastState();
  });
});

http.listen(WS_PORT, () => {
  console.log(`\n  ⚔️  Hunter x Coder server`);
  console.log(`  WebSocket : ws://localhost:${WS_PORT}`);
  console.log(`  Boss      : ${CONFIG.hpPerHunter} HP per hunter (scales with crowd)`);
  console.log(`  Phones    : http://${lanIp}:${CLIENT_PORT}/props (port follows Vite)\n`);
});
