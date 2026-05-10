/**
 * asset-versions.ts · 7 个 Tier B 资产仓 tag 的中央接缝（v0.2 · Phase 1 §1.1.13b）
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
 * **当前进度（v1.42 push）**：
 *   - misc @ v1.2.0：Phase 6 venue map 按真实坐标
 *     (43.781356422003576, 87.61508943244256) 重新生成；fb-cdn-misc
 *     commit `6ca5069` 仅更新 `map/venue-{1280,2048,2560}.png`。
 *   - misc @ v1.1.0：invitation 派生品按真实输出宽度命名
 *     （part_{1,2}-{320,640,800}.{avif,webp,jpg}），取代了 v1.0.0 的
 *     -1024/-1600/-2400/-3840（被 sharp `withoutEnlargement: true` clamp 到 800w 但
 *      仍按请求宽度命名，srcset 谎报；4K Retina 选 -3840 拿到 800w 位图 → 糊）
 *     落地：archive commit `e86ee9b`（push-to-cdn-repos.ts 加 `--allow-empty`
 *           + KEY_DIR 自动读取私钥）→ archive 跑 `VERSION=1.1.0 pnpm push:cdn` 全 7 仓 v1.1.0 →
 *           主仓 commit `170f706`（misc 这一行 v1.0.0 → v1.1.0 + Cover widths [320,640,800]）→
 *           CI run 25437603893 → 线上 https://yitiane.github.io/forever-begins/ 已 serve 真 800w
 *   - 其他 6 仓 @ v1.0.0：内容自首次 push（v1.17）以来未变；v1.1.0 push 时仅得到 tag-only
 *     marker commit，但 asset-versions 这里**保持 v1.0.0** —— 让 tag 反映 content history，
 *     未来该仓真正出新内容时才升 minor，避免无意义的 tag 浪费 + 回滚定位混乱
 *
 * 下次 push:cdn 时按 PLAN §18.3 升 VERSION。
 */

export const ASSET_VERSIONS = {
  "snow-a": "v1.0.0",
  "snow-b": "v1.0.0",
  grassland: "v1.0.0",
  "wooden-door": "v1.0.0",
  pearl: "v1.0.0",
  retro: "v1.0.0",
  // v1.2.0：venue map 校准到二道桥民俗风情一条街真实坐标（详见文件头进度段）
  misc: "v1.2.0",
} as const;

export type CdnTarget = keyof typeof ASSET_VERSIONS;

/**
 * 构建 jsDelivr (primary) 或 Statically (backup) 的资产 URL。
 *
 * @example
 *   cdnUrl('primary', 'snow-a', 'avif/Snow_01-1600.avif')
 *     → https://cdn.jsdelivr.net/gh/YiTiane/fb-cdn-snow-a@v1.0.0/avif/Snow_01-1600.avif
 *   cdnUrl('backup', 'misc', 'avif/invitation/part_1-800.avif')
 *     → https://cdn.statically.io/gh/YiTiane/fb-cdn-misc@v1.1.0/avif/invitation/part_1-800.avif
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
