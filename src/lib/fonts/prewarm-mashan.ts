/**
 * prewarm-mashan.ts · 落款字体预热（Phase 6 §6 Closing 用）
 *
 * 背景：
 *   `Ma Shan Zheng` 字体的 @font-face 用 `font-display: optional`，
 *   理由是它仅在尾声落款附近出现，一次也不希望它偷走首屏带宽。
 *   但 optional 的副作用是：100ms 内字体没到达 → 浏览器永远用 fallback，
 *   即便后来下载完了也不会切换。
 *
 *   所以 §6 Closing 进入视口前**必须主动用 FontFace API 加载并 add 到
 *   document.fonts**，这样浏览器后续匹配 'Ma Shan Zheng' 时会用到这份"动态注册"
 *   的 face（不受 @font-face 的 display: optional 影响）。
 *
 * 使用约定（Phase 6 §6.1.X 落款组件挂载时调一次）：
 *
 *   import { prewarmMaShanZheng } from '@/lib/fonts/prewarm-mashan';
 *
 *   useEffect(() => {
 *     // 在 Closing 区域上方 ~80vh 处用 IntersectionObserver 触发，
 *     // 给字体 ~1s 的提前加载窗口
 *     const obs = new IntersectionObserver(([entry]) => {
 *       if (entry?.isIntersecting) { prewarmMaShanZheng(); obs.disconnect(); }
 *     }, { rootMargin: '80% 0px 0px 0px' });
 *     if (preRollRef.current) obs.observe(preRollRef.current);
 *     return () => obs.disconnect();
 *   }, []);
 *
 * 触发幂等：内部 promise cache，多次调用不会重复请求。
 *
 * 验证（DevTools Network 面板）：
 *   - 进入 Closing 之前 ma-shan-zheng.woff2 不应被请求
 *   - prewarm 触发后看到 1 次 200，其后字体应在落款处真实生效
 */

let cached: Promise<void> | null = null;

export function prewarmMaShanZheng(): Promise<void> {
  if (typeof window === 'undefined' || typeof FontFace === 'undefined') {
    return Promise.resolve();
  }
  if (cached) return cached;

  // 与 FontFaces.astro 相同的 base 归一化逻辑
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '');
  const url = `${base}/fonts/ma-shan-zheng.woff2`;

  const face = new FontFace(
    'Ma Shan Zheng',
    `url(${url}) format('woff2')`,
    { style: 'normal', weight: '400', display: 'swap' },
  );

  cached = face.load().then(loaded => {
    document.fonts.add(loaded);
  }).catch(err => {
    // 失败时清缓存，允许下次重试
    cached = null;
    console.warn('[prewarm] Ma Shan Zheng failed to load', err);
  });

  return cached;
}

/**
 * 仅供测试 / 重置：清掉 cached promise，下次调用会重新发起请求。
 * 生产代码不应调用此函数。
 */
export function __resetMaShanZhengCache(): void {
  cached = null;
}
