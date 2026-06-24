import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

const base = process.env.VITE_BASE_PATH || "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
    VitePWA({
      registerType: "autoUpdate",
      // 手动注册，加错误处理，避免 Safari HTTP 下 SW 失败导致白屏
      injectRegister: null,
      includeAssets: ["favicon.svg", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "民事诉讼法及司法解释",
        short_name: "民诉法查询",
        description: "民事诉讼法全文查询及司法解释联动系统",
        theme_color: "#0f1b3d",
        background_color: "#0f1b3d",
        display: "standalone",
        orientation: "any",
        lang: "zh-CN",
        start_url: base,
        scope: base,
        icons: [
          { src: "pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png" },
          { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,json}"],
      },
    }),
  ],
  build: {
    outDir: "dist-static",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
});
