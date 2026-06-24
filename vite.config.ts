import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The big screen and the phones are served from here.
// `host: true` exposes the dev server on the LAN so phones can reach it
// by scanning the QR code (http://<your-lan-ip>:5173/props).
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    // Proxy the game WebSocket through the SAME port the page is served on.
    // This way phones only need to reach ONE port (the Vite one): if the page
    // loads from the QR code, the live connection works too — no separate
    // 8787 port to get blocked by a firewall or missed entirely.
    proxy: {
      "/ws": {
        target: "ws://localhost:8787",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
