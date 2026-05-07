/**
 * finalePhotos.ts · §2.C StarCarouselFinale 照片序列定义（v0.2 · v1.91 修 v1.90 audit P2-4）
 *
 * 数据：DESIGN §2.C 明确规定的 15 张照片顺序（grassland × 5 → wooden-door × 3
 * → pearl × 2 → retro × 4 → final pearl_04）。把"哪些照片、什么顺序、用哪个 CDN
 * target / stem"集中到一处，让 StarCarouselFinale React 岛与 FinaleBeat Astro
 * 包装器都从这里拉，避免两份硬编码。
 *
 * aspectRatio：用 width / height 表示照片**真实** CDN 1600px 派生品比例。
 * v0.1 误把 grassland / wooden-door 全标 1.5 横幅，实测 14/15 张是 2:3 portrait
 * 或近 portrait 的 0.667-0.691，仅 Grassland_02/03/04 真是 1.5 横幅、Grassland_05
 * 是 4:3 (1.345)。v0.2 全部改为实测值；scripts/verify-story-photo-dimensions.ts
 * v0.5 起对这 15 张做 prebuild gate，元数据与 CDN 漂移时构建直接 fail。
 *
 * URL 接缝：`finalePhotoUrl(photo, host, width)` 走 `cdnUrl()` 中央接缝
 * （asset-versions.ts），与 §0/§1/§2 其它 CdnImage 同源；版本回滚一次性生效。
 *
 * **NOT in this lib**：照片入场 / 出场动画时间线、shader dissolve 噪声参数、
 * reduced-motion fallback 行为 —— 全部在 StarCarouselFinale.tsx 内部，按
 * scroll progress + lifecycle 派发。
 */

import { cdnUrl, type CdnTarget } from "@/lib/images/asset-versions";

export interface FinalePhoto {
  /** CDN 资产仓 */
  cdnTarget: CdnTarget;
  /** 派生品 stem（不含尺寸 / 扩展名） */
  stem: string;
  /** width / height ratio（按 1600px 派生品实测，verify-story-photo-dimensions.ts 守卫） */
  aspectRatio: number;
  /** AT 朗读 alt 文案 */
  alt: string;
}

/**
 * DESIGN §2.C 钦定顺序：草原（户外旅程） → 木门（仪式现场） → 珍珠（婚纱主线） →
 * 复古（情绪闪回） → final Pearl_04（主海报，定格）
 *
 * aspectRatio 按 1600px CDN 派生品实测（v1.91 probe 结果）：
 *   - portrait 2:3 (0.667)：Grassland_01 / Wooden_door_02 / Wooden_door_03 /
 *     Pearl_01 / Pearl_02 / Pearl_04 / Retro_01..04
 *   - 接近 portrait 0.691：Wooden_door_05 (1600×2317)
 *   - 横幅 3:2 (1.500)：Grassland_02 / Grassland_03 / Grassland_04
 *   - 横幅 4:3 (1.345)：Grassland_05 (1600×1190)
 */
export const FINALE_PHOTO_SEQUENCE: readonly FinalePhoto[] = [
  {
    cdnTarget: "grassland",
    stem: "Grassland_01",
    aspectRatio: 0.667,
    alt: "草原系列 · 婚纱外景",
  },
  {
    cdnTarget: "grassland",
    stem: "Grassland_02",
    aspectRatio: 1.5,
    alt: "草原系列 · 携手远眺",
  },
  {
    cdnTarget: "grassland",
    stem: "Grassland_03",
    aspectRatio: 1.5,
    alt: "草原系列 · 风起时",
  },
  {
    cdnTarget: "grassland",
    stem: "Grassland_04",
    aspectRatio: 1.5,
    alt: "草原系列 · 相依",
  },
  {
    cdnTarget: "grassland",
    stem: "Grassland_05",
    aspectRatio: 1.345,
    alt: "草原系列 · 长卷",
  },
  {
    cdnTarget: "wooden-door",
    stem: "Wooden_door_02",
    aspectRatio: 0.667,
    alt: "木门系列 · 仪式序章",
  },
  {
    cdnTarget: "wooden-door",
    stem: "Wooden_door_03",
    aspectRatio: 0.667,
    alt: "木门系列 · 入场前",
  },
  {
    cdnTarget: "wooden-door",
    stem: "Wooden_door_05",
    aspectRatio: 0.691,
    alt: "木门系列 · 凝望",
  },
  {
    cdnTarget: "pearl",
    stem: "Pearl_01",
    aspectRatio: 0.667,
    alt: "珍珠系列 · 一",
  },
  {
    cdnTarget: "pearl",
    stem: "Pearl_02",
    aspectRatio: 0.667,
    alt: "珍珠系列 · 二",
  },
  {
    cdnTarget: "retro",
    stem: "Retro_01",
    aspectRatio: 0.667,
    alt: "复古系列 · 一",
  },
  {
    cdnTarget: "retro",
    stem: "Retro_02",
    aspectRatio: 0.667,
    alt: "复古系列 · 二",
  },
  {
    cdnTarget: "retro",
    stem: "Retro_03",
    aspectRatio: 0.667,
    alt: "复古系列 · 三",
  },
  {
    cdnTarget: "retro",
    stem: "Retro_04",
    aspectRatio: 0.667,
    alt: "复古系列 · 四",
  },
  {
    cdnTarget: "pearl",
    stem: "Pearl_04",
    aspectRatio: 0.667,
    alt: "珍珠系列主海报 · 两个人相拥",
  },
];

/** 终幕定格的最后一张 = 序列尾元素；StarCarouselFinale 用它判断"不再 dissolve" */
export const FINALE_FINAL_PHOTO =
  FINALE_PHOTO_SEQUENCE[FINALE_PHOTO_SEQUENCE.length - 1];

/**
 * 构建照片 CDN URL（jsDelivr primary / Statically backup）。
 * 默认 1600w，足够 finale carousel 的中等清晰度（不抢 §0 hero LCP 的高清头）。
 */
export function finalePhotoUrl(
  photo: FinalePhoto,
  host: "primary" | "backup" = "primary",
  width = 1600,
): string {
  return cdnUrl(host, photo.cdnTarget, `jpg/${photo.stem}-${width}.jpg`);
}
