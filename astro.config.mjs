// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://yitiane.github.io',
  base: '/forever-begins',
  output: 'static',
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
  },
});
