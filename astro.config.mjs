// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://yitiane.github.io",
  base: "/forever-begins",
  output: "static",
  integrations: [
    react(),
    sitemap({
      // v1.24：把 /dev-fonts/ 等开发期路由排除出 sitemap，
      // 避免搜索引擎或社交分享预览抓到字体测试页。
      // 配合 dev-fonts.astro 自身的 <meta name="robots" content="noindex,nofollow">
      // 形成"sitemap 不收录 + 单页 noindex"双重防护。
      filter: (page) => !/\/dev-fonts\/?$/.test(page),
    }),
    icon(),
  ],
  vite: {
    plugins: [tailwindcss()],
    build: {
      /**
       * v1.72（修 v1.71 audit P3 chunk 预算口径）：
       *
       * §2.B GlobeDistanceScene 是 client:visible 懒岛，整体 ~890KB 是 R3F + drei
       * + three.js 三件套绑在一起的产物。把它们拆成独立 chunk 后：
       *   - `three`     ~600KB · 站点全周期内只下载一次；将来加 §2.C / §2.D R3F
       *     场景可复用（不重复下载 three core）
       *   - `r3f-drei`  ~200KB · @react-three/{fiber,drei}；类似复用边界
       *   - 业务 chunk  ~50KB  · 仅 GlobeDistanceScene.tsx 自身（材质 + 弧线 + 端点）
       *
       * 拆完后单 chunk 不再触发 vite 的 500KB 警告；显式把 chunkSizeWarningLimit 拉
       * 到 700 给 three core 留余量；超 700 必须主动 review（postprocessing /
       * 真贴图等下批次就在边界附近）。
       *
       * Astro client:visible 走 dynamic import → 多 chunk 不影响主初屏；初屏访客
       * 完全不下载这些 chunk。
       */
      rollupOptions: {
        output: {
          manualChunks(id) {
            // three core
            if (id.includes("/node_modules/three/")) return "three";
            // R3F + drei + postprocessing 这一系都打到 r3f-drei
            if (
              id.includes("/node_modules/@react-three/") ||
              id.includes("/node_modules/postprocessing/")
            ) {
              return "r3f-drei";
            }
            return undefined;
          },
        },
      },
      // three core ~714KB 是不可拆解的边界（three.js 0.184 minified 物理下限）；
      // 750KB 给小幅版本浮动留余地，但保证业务 chunk 不会无意中漂大（实测拆完
      // GlobeDistanceScene 业务 chunk 只 ~5KB，r3f-drei ~357KB，都远在阈值下）
      chunkSizeWarningLimit: 750,
    },
  },
});
