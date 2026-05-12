// @ts-check
import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  site: "https://forever-begins-urumqi.vercel.app",
  base: "/",
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
      // v2.12：Globe/Finale motion-tier loaders must be able to choose static
      // before any R3F / Three chunk is requested. Vite's modulepreload helper
      // can otherwise place a static import to the R3F chunk inside the tiny
      // loader. Disable dependency preloads; dynamic imports still fetch their
      // chunks on demand after the tier decision.
      modulePreload: {
        polyfill: false,
        resolveDependencies: () => [],
      },
      /**
       * v1.72 落地 / v1.73 收口注释（修 v1.71 audit P3 chunk 预算口径）：
       *
       * §2.B GlobeDistanceScene 是 client:visible 懒岛，**未拆**前整体 ~890KB
       * 是 R3F + drei + three.js 三件套绑在一起的产物。把它们拆成独立 chunk 后
       * （v1.72 实测）：
       *   - `three`               714KB · 站点全周期内只下载一次；将来加
       *     §2.C / §2.D R3F 场景可复用（不重复下载 three core）
       *   - `react`               ~180KB · React / ReactDOM。v2.12 的轻量
       *     motion-tier loaders 允许 static 分支不下载 R3F/Three；React 单独成
       *     chunk 可避免 Vite preload helper 被放进 r3f-drei 后让 static 误拉 R3F
       *   - `r3f-drei`            ~170KB · @react-three/{fiber,drei} 当前实际消费；
       *     仅 full/lite 动态 import Globe/Finale 时才下载
       *   - `preload-helper`       ~1KB · Vite dynamic import helper。v2.12 显式拆出，
       *     避免 static loader 为了拿 helper 而误拉 r3f-drei
       *   - Globe/Finale 业务 chunk 约 84KB / 23KB：包含 Natural Earth land texture
       *     绘制、route network、Finale dust/star shader 等业务逻辑；仍远低于 budget
       *
       * 拆完后单 chunk 不再触发 vite 默认 500KB 警告；显式把 chunkSizeWarningLimit
       * 拉到 750（three core ~714KB minified 是不可拆解的物理下限；750 给小幅
       * 版本浮动留余地，但保证业务 chunk 不会无意中漂大）。超 750 必须主动 review
       * （v0.4+ 加 postprocessing / 真贴图 useTexture 时仍可能挑战该边界）。
       *
       * Astro client:visible 走 dynamic import → 多 chunk 不影响主初屏；初屏访客
       * 完全不下载这些 chunk。
       */
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Vite dynamic-import preload helper is dependency-free. If it gets
            // assigned to the R3F chunk, even the static motion-tier loader has
            // to import r3f-drei before it can decide not to hydrate WebGL.
            if (id.includes("vite/preload-helper")) {
              return "preload-helper";
            }
            // React runtime: keep it out of R3F chunk so motion-tier loaders can
            // stay light and static mode does not preload @react-three/three.
            if (
              id.includes("/node_modules/react/") ||
              id.includes("/node_modules/react-dom/") ||
              id.includes("/node_modules/scheduler/")
            ) {
              return "react";
            }
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
      // three core ~715KB 是不可拆解的边界（three.js 0.184 minified 物理下限）；
      // 750KB 给小幅版本浮动留余地，但保证业务 chunk 不会无意中漂大（v2.12 实测
      // GlobeDistanceScene ~84KB，StarCarouselFinale ~23KB，r3f-drei ~170KB）
      chunkSizeWarningLimit: 750,
    },
  },
});
