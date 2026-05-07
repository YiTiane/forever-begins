/**
 * src/lib/story/beatLayoutSolver.ts · §2 Story constraint-based layout solver
 *   v0.1（Phase 2 §2 batch 3 收口 v1.59 · 修 v1.58 P2 #1 + #2）
 *
 * 动机：
 *   v1.58 之前 PoemBeat 的 4 套 layout 用 magic % / clamp 直接把 photo 宽度 / 文字最大宽 /
 *   stage gap 写在 CSS 里。这套"硬编码 + 媒体查询断点"在窄屏 / 小平板纵向几乎必然崩 ——
 *   ① 窄屏 .poem-stage 留太多空白；② 双图层 absolute 定位脱顶；③ exit-fade 与下一 beat
 *   未沟通，停在过渡点会出现整屏空白。这是一个产品级的响应式失败，而不是一两个 viewport
 *   的样本问题。
 *
 *   v1.59 用 **constraint-based solver** 把 layout 的"size / position / gap"从样式表里抽
 *   出来：每次 viewport 改变，solver 用「视口宽 × 视口高 × layout × photo aspect ratio」
 *   求解出一组 CSS 自定义属性写到 `.poem-beat` 上；CSS 只负责 `width: var(--photo-w)`
 *   / `gap: var(--stage-gap)` 这种"消费变量"的工作。两个好处：
 *     ① 每个 viewport 的尺寸都是计算出来的，而不是某个 breakpoint 凑出来的
 *     ② 滚动只更新 --p 等 phase 变量；solver 输出在 resize 时才重算，scroll 时不算
 *
 * 设计决策：
 *   - **纯函数**：solver 不读 DOM，输入 `{ vw, vh, layout, photos: [{aspectRatio, role}] }`，
 *     输出一个 `Record<string, string>` 给调用方写到元素上。便于在 worker / SSR / test 里复用。
 *   - **photo 尺寸单位 px**：避免 vw/vh 在被 sticky 父容器嵌套时的怪行为；solver 自己负
 *     责把 px 数算到「不会爆破 vw / vh」的范围。
 *   - **每 layout 一支函数**：parallax-pair / diagonal-gaze / radial-mask / anchor-single
 *     的几何约束差很多，避免一个共用函数被参数堆撑爆。
 *   - **role 显式查找**：不依赖数组顺序；schema 已 enum 化 role，solver 拿到的就是合法值。
 *
 * 不归 solver 负责：
 *   - choreography（--p / --p-photo-1 等 phase 变量由 StoryPoemScroller 的 rAF flush 写）
 *   - exit fade / opacity 等"时间维度"属性
 *   - 颜色 / 字体 / 阴影等纯美术属性
 *
 * 与 main.json schema 的接缝：
 *   - 每张 photo 在 main.json 有 `width` / `height`（像素），调用方算 aspectRatio = w/h 传入
 *   - photo 缺 width/height 时，调用方用合理 fallback（横图 1.5、竖图 0.667）
 */

export type BeatLayout =
  | "parallax-pair"
  | "diagonal-gaze"
  | "radial-mask"
  | "anchor-single";

export type StoryLayoutMode = "compact" | "portrait" | "wide";

export interface PhotoSpec {
  /** width / height 比；e.g. 1.5 = 3:2 横图，0.667 = 2:3 竖图 */
  aspectRatio: number;
  /** photo 的 role（与 schema 的 photoRoleSchema enum 对齐） */
  role: string;
}

export interface SolverInput {
  /** window.innerWidth（像素） */
  vw: number;
  /** window.innerHeight（像素） */
  vh: number;
  layout: BeatLayout;
  photos: readonly PhotoSpec[];
  /**
   * v0.2（v1.60 P2 #2 修）：调用方实测 .poem-text 的 box height。
   * 作用：radial-mask / anchor-single 这类 photo + text 紧凑居中堆叠的 layout
   * 需要给 photo 留出 stage 高度减 text 实际高度后的剩余空间，
   * 避免 photo 撑大 / 撑小（产生窄屏松散感 vs 拥挤感）。
   * 没传 → solver 退回到 vh×0.18 的保守估算（v0.1 行为）。
   */
  textHeight?: number;
  /** 同上，可选；当前 solver 暂未消费（保留为未来约束）。 */
  textWidth?: number;
}

/** key 形如 "--photo-w"；value 形如 "320px" / "1.5rem" / "1fr 1fr" */
export type SolverOutput = Record<string, string>;

// ─── 几何常量 ───────────────────────────────────────────────────────
/** stage 外侧 safe padding（避免内容贴到 sticky 视口边缘） */
const SAFE_PAD = 24;
/** stage 内侧上下 padding（给入场 transform translate 留余地） */
const STAGE_PAD_Y = 32;
/** 双图布局之间的最小 gap */
const MIN_GAP = 24;

/**
 * Product viewport modes:
 *   compact  = phone portrait, static / simple flow
 *   portrait = large phone / small-tablet portrait / narrow split window
 *   wide     = landscape tablet / desktop, cinematic wide composition
 */
export function getStoryLayoutMode(vw: number, vh: number): StoryLayoutMode {
  if (vw <= 540) return "compact";
  if (vw >= 900 && vw / Math.max(vh, 1) >= 0.85) return "wide";
  return "portrait";
}

function clampPx(n: number, min: number, max: number): number {
  const lower = Math.min(min, max);
  const upper = Math.max(min, max);
  return Math.max(lower, Math.min(upper, n));
}

/**
 * 在视口可用宽 × 可用高 × 目标 aspect ratio 三者下，求出能塞进的最大尺寸。
 * 返回 [width, height]，保证 aspectRatio 严格成立。
 */
function fitAspect(
  maxW: number,
  maxH: number,
  aspect: number,
): [number, number] {
  // 先按 maxW 算出对应高度；若超过 maxH，反过来按 maxH 算宽度
  const wByMaxW = maxW;
  const hByMaxW = wByMaxW / aspect;
  if (hByMaxW <= maxH) return [wByMaxW, hByMaxW];
  const hByMaxH = maxH;
  const wByMaxH = hByMaxH * aspect;
  return [wByMaxH, hByMaxH];
}

// ─── parallax-pair（beat 01 · snow_03 远 + snow_07 近）────────────
// 视觉契约：text 在一侧（宽屏左 / 窄屏上），photos 在另一侧；photos 区内
// far 上右、near 下左 错位重叠 → 单视口看完"远近构图"
function solveParallaxPair(input: SolverInput): SolverOutput {
  const { vw, vh, photos } = input;
  const farPhoto = photos.find((p) => p.role === "far") ?? photos[0];
  const nearPhoto =
    photos.find((p) => p.role === "near") ?? photos[1] ?? photos[0];
  if (!farPhoto || !nearPhoto) return {};

  const mode = getStoryLayoutMode(vw, vh);
  const isWide = mode === "wide";
  const stageW = Math.min(vw, 1280) - SAFE_PAD * 2;
  const stageH = vh - STAGE_PAD_Y * 2;

  if (isWide) {
    // 双列：text 列 + photos 列
    const textColW = clampPx(stageW * 0.4, 320, 540);
    const gap = Math.max(MIN_GAP, stageW * 0.04);
    const photosColW = stageW - textColW - gap;
    // photos 区高度：vh 的 70%，但不超过自然 stage 内高
    const photosColH = Math.min(stageH * 0.95, vh * 0.7);

    // 在 photosColW × photosColH 内，far/near 错位重叠
    // far：右上 56% × aspect → 自动算高
    const farMaxW = photosColW * 0.55;
    const farMaxH = photosColH * 0.62;
    const [farW, farH] = fitAspect(farMaxW, farMaxH, farPhoto.aspectRatio);

    const nearMaxW = photosColW * 0.66;
    const nearMaxH = photosColH * 0.7;
    const [nearW, nearH] = fitAspect(nearMaxW, nearMaxH, nearPhoto.aspectRatio);

    return {
      "--stage-cols": `${textColW}px ${photosColW}px`,
      "--stage-gap": `${gap}px`,
      "--text-col-w": `${textColW}px`,
      "--photos-col-w": `${photosColW}px`,
      "--photos-col-h": `${photosColH}px`,
      "--photo-far-w": `${farW}px`,
      "--photo-far-h": `${farH}px`,
      "--photo-near-w": `${nearW}px`,
      "--photo-near-h": `${nearH}px`,
    };
  }

  // portrait / compact：text + photos box 共同构成一帧；photos box 内仍保留远近错位。
  const textReserveH = input.textHeight ?? clampPx(stageH * 0.18, 96, 220);
  const photosColW = stageW;
  const gap = mode === "compact" ? 18 : 22;
  const photosMaxH =
    mode === "portrait"
      ? Math.min(stageH * 0.5, stageW * 0.88, 640)
      : Math.min(stageH * 0.58, stageW * 1.15);
  const photosMinH = Math.min(360, photosMaxH);
  const photosTotalH = clampPx(
    stageH - textReserveH - gap,
    photosMinH,
    photosMaxH,
  );
  const farMaxH = photosTotalH * 0.58;
  const nearMaxH = photosTotalH * 0.64;
  const farMaxW = photosColW * (mode === "portrait" ? 0.72 : 0.92);
  const nearMaxW = photosColW * (mode === "portrait" ? 0.8 : 0.96);
  const [farW, farH] = fitAspect(farMaxW, farMaxH, farPhoto.aspectRatio);
  const [nearW, nearH] = fitAspect(nearMaxW, nearMaxH, nearPhoto.aspectRatio);

  return {
    "--stage-cols": `1fr`,
    "--stage-gap": `${gap}px`,
    "--text-col-w": `${stageW}px`,
    "--text-max-w": `${Math.min(stageW, mode === "portrait" ? 560 : stageW)}px`,
    "--photos-col-w": `${photosColW}px`,
    "--photos-col-h": `${photosTotalH}px`,
    "--photo-far-w": `${farW}px`,
    "--photo-far-h": `${farH}px`,
    "--photo-near-w": `${nearW}px`,
    "--photo-near-h": `${nearH}px`,
  };
}

// ─── diagonal-gaze（beat 02 · snow_14 左上 + snow_15 右下 + 文字居中）──
// 视觉契约：左上 / 右下两人像 + 中间文字 backdrop-blur 浮起；单视口对视轴
function solveDiagonalGaze(input: SolverInput): SolverOutput {
  const { vw, vh, photos } = input;
  const tlPhoto = photos.find((p) => p.role === "top-left") ?? photos[0];
  const brPhoto =
    photos.find((p) => p.role === "bottom-right") ?? photos[1] ?? photos[0];
  if (!tlPhoto || !brPhoto) return {};

  const mode = getStoryLayoutMode(vw, vh);
  const isWide = mode === "wide";
  const stageW = Math.min(vw, 1280) - SAFE_PAD * 2;
  const stageH = vh - STAGE_PAD_Y * 2;

  if (isWide) {
    // 双图都是 portrait（aspect ≈ 0.667）；让两张占据 stage 30% 宽
    // 但若 stage 矮（vh 较小）则按高度反推，避免 photo 撑高出 stage
    const photoMaxW = stageW * 0.3;
    const photoMaxH = stageH * 0.5;
    const [tlW, tlH] = fitAspect(photoMaxW, photoMaxH, tlPhoto.aspectRatio);
    const [brW, brH] = fitAspect(photoMaxW, photoMaxH, brPhoto.aspectRatio);

    // 文字浮卡：居中，宽不超过 stage 50%；最小 360 保可读
    const textW = clampPx(stageW * 0.5, 360, 540);

    return {
      "--text-max-w": `${textW}px`,
      "--photo-tl-w": `${tlW}px`,
      "--photo-tl-h": `${tlH}px`,
      "--photo-br-w": `${brW}px`,
      "--photo-br-h": `${brH}px`,
    };
  }

  // portrait / compact：保留 diagonal gaze，但压缩成一个竖屏可读的 stack frame。
  const textReserveH = input.textHeight ?? clampPx(stageH * 0.18, 96, 220);
  const gap = mode === "compact" ? 18 : 22;
  const photosMaxH =
    mode === "portrait"
      ? Math.min(stageH * 0.58, stageW * 1.15, 860)
      : Math.min(stageH * 0.62, stageW * 1.35);
  const photosMinH = Math.min(420, photosMaxH);
  const photosTotalH = clampPx(
    stageH - textReserveH - gap,
    photosMinH,
    photosMaxH,
  );
  const photoMaxH = photosTotalH * 0.62;
  const photoMaxW = stageW * (mode === "portrait" ? 0.43 : 0.76);
  const [tlW, tlH] = fitAspect(photoMaxW, photoMaxH, tlPhoto.aspectRatio);
  const [brW, brH] = fitAspect(photoMaxW, photoMaxH, brPhoto.aspectRatio);

  return {
    "--text-max-w": `${Math.min(stageW, mode === "portrait" ? 520 : stageW)}px`,
    "--stage-gap": `${gap}px`,
    "--photos-col-h": `${photosTotalH}px`,
    "--photo-tl-w": `${tlW}px`,
    "--photo-tl-h": `${tlH}px`,
    "--photo-br-w": `${brW}px`,
    "--photo-br-h": `${brH}px`,
  };
}

// ─── radial-mask（beat 03 · snow_05 居中柔焦）─────────────────────
// 视觉契约：单图居中 + 文字下方；photo 在 stage 内紧凑居中
function solveRadialMask(input: SolverInput): SolverOutput {
  const { vw, vh, photos, textHeight } = input;
  const photo = photos[0];
  if (!photo) return {};

  const stageW = Math.min(vw, 1280) - SAFE_PAD * 2;
  const stageH = vh - STAGE_PAD_Y * 2;

  // v0.2: 优先用调用方实测的 .poem-text 高度；缺省时按 vh×0.18 保守估算
  const textReserveH = textHeight ?? clampPx(vh * 0.18, 110, 200);
  const gap = 24;
  const photoMaxW = Math.min(stageW * 0.85, 720);
  const photoMaxH = stageH - textReserveH - gap;
  const [photoW, photoH] = fitAspect(photoMaxW, photoMaxH, photo.aspectRatio);

  return {
    "--photo-w": `${photoW}px`,
    "--photo-h": `${photoH}px`,
    "--text-max-w": `${Math.min(photoW + 60, stageW)}px`,
    "--stage-gap": `${gap}px`,
  };
}

// ─── anchor-single（beat 04 / 05 · 单图作锚点）─────────────────────
// 视觉契约：单图小框 + 文字下方；photo 比 radial-mask 更小、更克制
function solveAnchorSingle(input: SolverInput): SolverOutput {
  const { vw, vh, photos, textHeight } = input;
  const photo = photos[0];
  if (!photo) return {};

  const stageW = Math.min(vw, 1280) - SAFE_PAD * 2;
  const stageH = vh - STAGE_PAD_Y * 2;

  const textReserveH = textHeight ?? clampPx(vh * 0.16, 96, 180);
  const gap = 20;
  const photoMaxW = Math.min(stageW * 0.7, 460);
  const photoMaxH = stageH - textReserveH - gap;
  const [photoW, photoH] = fitAspect(photoMaxW, photoMaxH, photo.aspectRatio);

  return {
    "--photo-w": `${photoW}px`,
    "--photo-h": `${photoH}px`,
    "--text-max-w": `${Math.min(photoW + 40, stageW)}px`,
    "--stage-gap": `${gap}px`,
  };
}

/**
 * Solve a single beat's layout for the current viewport + photo specs.
 * 调用方：StoryPoemScroller 在 init / window.resize 时跑一次，把结果写到 `.poem-beat` 上。
 */
export function solveBeatLayout(input: SolverInput): SolverOutput {
  switch (input.layout) {
    case "parallax-pair":
      return solveParallaxPair(input);
    case "diagonal-gaze":
      return solveDiagonalGaze(input);
    case "radial-mask":
      return solveRadialMask(input);
    case "anchor-single":
      return solveAnchorSingle(input);
  }
}
