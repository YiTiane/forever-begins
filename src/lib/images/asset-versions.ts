/**
 * asset-versions.ts · 7 个 Tier B 资产仓 tag 的中央接缝（v0.1 · Phase 1 §1.1.13b）
 *
 * 这是 §15.1 回滚的**唯一接缝**——紧急回滚把出问题的那一行改回旧 tag、git push 即可。
 * 所有 <CdnImage> / <CdnEarlyProbe> / build-time-check / cdn-fallback / Base.astro OG meta
 * 都必须经由 `cdnUrl()`，**禁止任何文件硬编码** `@vX.X.X`。
 *
 * VERSION 选择速查（PLAN §18.3）：
 *   - 内容变化（图 / 地图 / 文案） → minor (1.0.0 → 1.1.0)
 *   - 修元数据（README / 注释）   → patch (1.0.0 → 1.0.1)
 *   - 删图 / 改 stem（不向后兼容） → major (1.0.0 → 2.0.0)
 *
 * 7 仓为什么这样切：jsDelivr 单仓 ≤ 150MB · 单文件 ≤ 20MB 限制下，
 * 把照片资产按"5 photo series + retro + misc"切成 7 仓最贴合
 * （详见 DESIGN §7.5 / PLAN §0.1）。
 *
 * 当前进度（v1.17 push）：7 仓全部 v1.0.0 已 push 到 GitHub +
 * jsDelivr 主 CDN 已传播，probe.png 全部 200。下次 push:cdn 时按 PLAN §18.3 升 VERSION。
 */

export const ASSET_VERSIONS = {
  "snow-a": "v1.0.0",
  "snow-b": "v1.0.0",
  grassland: "v1.0.0",
  "wooden-door": "v1.0.0",
  pearl: "v1.0.0",
  retro: "v1.0.0",
  // v1.1.0：invitation 派生品按真实输出宽度命名（part_1-{320,640,800}.{avif,webp,jpg}），
  // 取代了 v1.0.0 的 -1024/-1600/-2400/-3840（实际 800w 同一文件，谎报宽度）。
  // 其他 6 仓内容与 v1.0.0 完全一致，仅 tag-only marker；故 asset-versions 保持 v1.0.0。
  // 详见 archive `e86ee9b` push:cdn 修 + main `d211593` Cover P2 修。
  misc: "v1.1.0",
} as const;

export type CdnTarget = keyof typeof ASSET_VERSIONS;

/**
 * 构建 jsDelivr (primary) 或 Statically (backup) 的资产 URL。
 *
 * @example
 *   cdnUrl('primary', 'snow-a', 'lakeside/snow-a-01.avif')
 *     → https://cdn.jsdelivr.net/gh/YiTiane/fb-cdn-snow-a@v1.0.0/lakeside/snow-a-01.avif
 *   cdnUrl('backup', 'misc', 'og/og-cover-1200x630.jpg')
 *     → https://cdn.statically.io/gh/YiTiane/fb-cdn-misc@v1.0.0/og/og-cover-1200x630.jpg
 */
export function cdnUrl(
  host: "primary" | "backup",
  target: CdnTarget,
  path: string,
): string {
  const version = ASSET_VERSIONS[target];
  const owner = "YiTiane";
  const repo = `fb-cdn-${target}`;
  const baseUrl =
    host === "primary"
      ? `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${version}`
      : `https://cdn.statically.io/gh/${owner}/${repo}@${version}`;
  return `${baseUrl}/${path}`;
}
