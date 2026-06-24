# ⚔️ Hunter x Coder — The Final Exam

A crowd-powered live demo for an **IT Academy React & TypeScript** presentation.

The audience scans a QR code on the big screen and plays a fast falling-items
mini-game on their phones (BugHunter-style). **Props** rain down — tap them to
chip away at the **Any-Type Demon**, a glitchy boss made of `any` types. But
**errors** fall too: tap one by mistake and it backfires — you lose health and
the demon *heals*. Beating it takes precision, not spam. When it finally dies:
**EXAM PASSED! WELCOME TO THE ACADEMY!**

Everything is real and typed end-to-end (no `any` survives):

- **React + TypeScript (strict)** front end, built with Vite
- **WebSocket** server (Node + `ws`) holds the authoritative game state and
  broadcasts to every screen and phone in real time
- Shared type contracts in [`shared/types.ts`](shared/types.ts) — the exact
  `BossAttack`, `EnergyProps`, and `attackBoss()` shown on the exam screen

## Routes

| URL        | Who         | What                                                       |
| ---------- | ----------- | ---------------------------------------------------------- |
| `/`        | Big screen  | Boss, health bar, QR code, Spirit Bomb, energy trails      |
| `/props`   | Phones      | Falling-items arena: tap props (good) / dodge errors (bad) |

## How the mini-game works

Each phone runs its own falling-items arena. Tapping is sent to the server,
which owns the demon's HP:

| You tap        | Demon HP        | Your HP        |
| -------------- | --------------- | -------------- |
| 🟦 prop        | −12             | —              |
| ⭐ golden prop | −45             | —              |
| 🟥 error (bug) | **+100** (heal) | −22            |

Land enough props and the shared **Spirit Bomb** fills and fires for bonus
damage. Tap too many errors and you get **DEBUGGED OUT** — a short "recompiling"
timeout before you respawn at full HP. Because errors heal the demon for far
more than a prop removes, the crowd has to aim, not flail.

## Run it

```bash
npm install
npm run dev
```

Then:

1. Open **http://localhost:5173/** on the projector / big screen.
2. The QR code points to `http://<your-lan-ip>:<port>/props` — the server
   detects your LAN IP and the screen appends whatever port it was actually
   served on (so it stays correct even if Vite bumps off a busy `5173`). Phones
   on the **same Wi-Fi** scan it and start tapping.
3. Players tap props, dodge errors, and chip the boss down. Land enough props
   and the Spirit Bomb fires for bonus damage.

> Phones must be on the same network as the laptop. If the QR shows
> `localhost`, no LAN interface was found — connect to Wi-Fi and restart.

## Tuning for your demo

Edit [`shared/game.ts`](shared/game.ts):

- `hpPerHunter` — boss HP **per connected hunter** (default `1000`). The demon
  scales with the crowd: 1 hunter → 1000 HP, 2 → 2000, 5 → 5000. With 0 hunters
  it stays at the 1× baseline. HP rescales live (and proportionally) as people
  join or leave mid-fight, so the health-bar % never jumps.
- `propDamage` / `goldDamage` — demon HP removed per prop / golden prop (`12` / `45`).
- `errorHeal` — demon HP **restored** when a hunter taps an error (`100`).
  Raise it to make mistakes more punishing.
- `errorSelfDamage` / `playerMaxHp` / `respawnMs` — player health, error
  penalty, and respawn delay (`22` / `100` / `5000`).
- `fallMinMs` / `fallMaxMs` — how fast items fall (`1100`–`1700`). **Lower =
  faster = harder.**
- `spawnMinMs` / `spawnMaxMs` — gap between spawns (`340`–`620`).
- `chargeMax` — energy per Spirit Bomb (default `100`).

Because the boss HP grows with the crowd, the fight stays epic at any room size.
Want it harder? Lower `fallMinMs`/`fallMaxMs` or raise `errorHeal`.

## Scripts

| Command             | Description                                  |
| ------------------- | -------------------------------------------- |
| `npm run dev`       | Server + client together (hot reload)        |
| `npm run dev:server`| WebSocket server only (`tsx watch`)          |
| `npm run dev:client`| Vite client only (LAN-exposed)               |
| `npm run typecheck` | Strict type-check of client **and** server   |
| `npm run build`     | Type-check + production client build          |

## How a tap flows

```
tap PROP  ──ws { kind:"hit", target:"prop" }──▶ server:
                  bossHp -= propDamage; charge += propDamage
                  ├─ broadcast "burst" ──▶ screen draws an energy trail
                  └─ when charge ≥ chargeMax:
                        attack = attackBoss({ power: charge })   // typed!
                        bossHp -= attack.damage; broadcast "bomb"
                  if bossHp ≤ 0 → broadcast "victory" 🎉

tap ERROR ──ws { kind:"hit", target:"error" }──▶ server:
                  bossHp += errorHeal                 // the demon feeds!
                  broadcast "heal" ──▶ screen flashes the boss green
                  (the tapper's own HP loss is tracked on their phone)
```

The ports: client `5173` (Vite), server `8787` (WebSocket). Override with the
`CLIENT_PORT` / `WS_PORT` environment variables.
