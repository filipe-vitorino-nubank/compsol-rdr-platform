import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  base: "./",
  plugins: [react(), viteSingleFile()],
  build: {
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      "/slack-proxy": {
        target: "https://script.google.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/slack-proxy/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq) => {
            proxyReq.setHeader("Origin", "https://script.google.com");
          });
        },
      },
      "/anthropic-proxy": {
        target: "https://api.anthropic.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/anthropic-proxy/, ""),
      },
    },
  },
});
