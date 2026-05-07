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
  | "anchor-single"
  | "vignette" // beat 06：夜色 vignette
  | "overlap" // beat 07：契合双层重合
  | "reveal" // beat 08：clip-path 展开
  | "wooden" // beat 09：木门 + 缝线包边
  | "pearl"; // beat 10：珍珠高光横扫

export type StoryLayoutMode = "compact" | "portrait" | "wide";

/**
 * v1.65（v1.64 audit P2-B 修）：textPlacement 让 solver 解"文字相对照片的 stage
 * composition"，不只解 photo box 尺寸。CSS 用 [data-text-placement="..."] 决定
 * 文字位置（下方 / 上方 / 文字-照片侧排 / overlay 浮起 / between 双图之间）。
 *
 * 当前各 layout 的 placement（v1.65 上线）：
 *   - parallax-pair wide → "side-text-photo"（文字左 / 双图右）
 *   - parallax-pair portrait → "between"（display:contents + order，文字夹在两图之间）
 *   - diagonal-gaze wide → "overlay-center"（文字浮卡居中 + backdrop-blur）
 *   - diagonal-gaze portrait → "between"
 *   - radial-mask / anchor-single / overlap / reveal / wooden / pearl → "below"
 *   - vignette → "overlay-bottom"（文字浮在夜色暗角图底部，营造亲密语境）
 */
export type TextPlacement =
  | "below"
  | "above"
  | "between"
  | "overlay-bottom"
  | "overlay-top"
  | "overlay-center"
  | "side-text-photo"
  | "side-photo-text";

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

/**
 * v1.65：solver 返回值升级为 SolverResult，同时携带 CSS 变量与 data-* 属性。
 *   - vars：调用方写到 element.style.setProperty
 *   - dataAttrs：调用方写到 element.dataset（注意 dataset.X 对应 data-x）
 *
 * 旧的 SolverOutput (Record<string, string>) 只能给 CSS 变量；data-text-placement
 * 这种"既要参与 CSS 选择器又要语义清晰"的属性必须走 dataset，故引入新封装。
 */
export interface SolverResult {
  vars: SolverOutput;
  dataAttrs?: {
    textPlacement?: TextPlacement;
  };
}

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
function solveParallaxPair(input: SolverInput): SolverResult {
  const { vw, vh, photos } = input;
  const farPhoto = photos.find((p) => p.role === "far") ?? photos[0];
  const nearPhoto =
    photos.find((p) => p.role === "near") ?? photos[1] ?? photos[0];
  if (!farPhoto || !nearPhoto) return { vars: {} };

  const mode = getStoryLayoutMode(vw, vh);
  const isWide = mode === "wide";
  const stageW = Math.min(vw, 1280) - SAFE_PAD * 2;
  const stageH = vh - STAGE_PAD_Y * 2;

  if (isWide) {
    const textColW = clampPx(stageW * 0.4, 320, 540);
    const gap = Math.max(MIN_GAP, stageW * 0.04);
    const photosColW = stageW - textColW - gap;
    const photosColH = Math.min(stageH * 0.95, vh * 0.7);

    const farMaxW = photosColW * 0.55;
    const farMaxH = photosColH * 0.62;
    const [farW, farH] = fitAspect(farMaxW, farMaxH, farPhoto.aspectRatio);

    const nearMaxW = photosColW * 0.66;
    const nearMaxH = photosColH * 0.7;
    const [nearW, nearH] = fitAspect(nearMaxW, nearMaxH, nearPhoto.aspectRatio);

    return {
      vars: {
        "--stage-cols": `${textColW}px ${photosColW}px`,
        "--stage-gap": `${gap}px`,
        "--text-col-w": `${textColW}px`,
        "--photos-col-w": `${photosColW}px`,
        "--photos-col-h": `${photosColH}px`,
        "--photo-far-w": `${farW}px`,
        "--photo-far-h": `${farH}px`,
        "--photo-near-w": `${nearW}px`,
        "--photo-near-h": `${nearH}px`,
      },
      // 宽屏：双列 cinematic — 文字左 reading column，双图右 parallax stack
      dataAttrs: { textPlacement: "side-text-photo" },
    };
  }

  // portrait / compact：text 夹在 far / near 之间；display:contents + order 流式
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
    vars: {
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
    },
    dataAttrs: { textPlacement: "between" },
  };
}

// ─── diagonal-gaze（beat 02 · snow_14 左上 + snow_15 右下 + 文字居中）──
// 视觉契约：左上 / 右下两人像 + 中间文字 backdrop-blur 浮起；单视口对视轴
function solveDiagonalGaze(input: SolverInput): SolverResult {
  const { vw, vh, photos } = input;
  const tlPhoto = photos.find((p) => p.role === "top-left") ?? photos[0];
  const brPhoto =
    photos.find((p) => p.role === "bottom-right") ?? photos[1] ?? photos[0];
  if (!tlPhoto || !brPhoto) return { vars: {} };

  const mode = getStoryLayoutMode(vw, vh);
  const isWide = mode === "wide";
  const stageW = Math.min(vw, 1280) - SAFE_PAD * 2;
  const stageH = vh - STAGE_PAD_Y * 2;

  if (isWide) {
    const photoMaxW = stageW * 0.3;
    const photoMaxH = stageH * 0.5;
    const [tlW, tlH] = fitAspect(photoMaxW, photoMaxH, tlPhoto.aspectRatio);
    const [brW, brH] = fitAspect(photoMaxW, photoMaxH, brPhoto.aspectRatio);
    const textW = clampPx(stageW * 0.5, 360, 540);

    return {
      vars: {
        "--text-max-w": `${textW}px`,
        "--photo-tl-w": `${tlW}px`,
        "--photo-tl-h": `${tlH}px`,
        "--photo-br-w": `${brW}px`,
        "--photo-br-h": `${brH}px`,
      },
      // 宽屏：文字浮卡居中 + backdrop-blur，photos 角落对视
      dataAttrs: { textPlacement: "overlay-center" },
    };
  }

  // portrait / compact：tl photo / 文字 / br photo 三块流式堆叠
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
    vars: {
      "--text-max-w": `${Math.min(stageW, mode === "portrait" ? 520 : stageW)}px`,
      "--stage-gap": `${gap}px`,
      "--photos-col-h": `${photosTotalH}px`,
      "--photo-tl-w": `${tlW}px`,
      "--photo-tl-h": `${tlH}px`,
      "--photo-br-w": `${brW}px`,
      "--photo-br-h": `${brH}px`,
    },
    dataAttrs: { textPlacement: "between" },
  };
}

// ─── radial-mask（beat 03 · snow_05 居中柔焦）─────────────────────
function solveRadialMask(input: SolverInput): SolverResult {
  const { vw, vh, photos, textHeight } = input;
  const photo = photos[0];
  if (!photo) return { vars: {} };

  const stageW = Math.min(vw, 1280) - SAFE_PAD * 2;
  const stageH = vh - STAGE_PAD_Y * 2;

  const textReserveH = textHeight ?? clampPx(vh * 0.18, 110, 200);
  const gap = 24;
  const photoMaxW = Math.min(stageW * 0.85, 720);
  const photoMaxH = stageH - textReserveH - gap;
  const [photoW, photoH] = fitAspect(photoMaxW, photoMaxH, photo.aspectRatio);

  return {
    vars: {
      "--photo-w": `${photoW}px`,
      "--photo-h": `${photoH}px`,
      "--text-max-w": `${Math.min(photoW + 60, stageW)}px`,
      "--stage-gap": `${gap}px`,
    },
    dataAttrs: { textPlacement: "below" },
  };
}

// ─── anchor-single（beat 04 / 05 · 单图作锚点）─────────────────────
function solveAnchorSingle(input: SolverInput): SolverResult {
  const { vw, vh, photos, textHeight } = input;
  const photo = photos[0];
  if (!photo) return { vars: {} };

  const stageW = Math.min(vw, 1280) - SAFE_PAD * 2;
  const stageH = vh - STAGE_PAD_Y * 2;

  const textReserveH = textHeight ?? clampPx(vh * 0.16, 96, 180);
  const gap = 20;
  const photoMaxW = Math.min(stageW * 0.7, 460);
  const photoMaxH = stageH - textReserveH - gap;
  const [photoW, photoH] = fitAspect(photoMaxW, photoMaxH, photo.aspectRatio);

  return {
    vars: {
      "--photo-w": `${photoW}px`,
      "--photo-h": `${photoH}px`,
      "--text-max-w": `${Math.min(photoW + 40, stageW)}px`,
      "--stage-gap": `${gap}px`,
    },
    dataAttrs: { textPlacement: "below" },
  };
}

// ─── Shared single-photo helper（beats 06-10 共享几何骨架）─────────────
// 五个新 layout 都是"一图 + 文本下方"结构，差异在视觉层（mask / overlap / clip /
// stitched border / pearl highlight），几何尺寸用同一支 helper 求。每个 layout
// 的 photoMaxWFactor / photoMaxAbs / gap / textTopReserveFactor 略不同，对应
// 视觉上的"克制 vs 主导"差异。
interface SinglePhotoOpts {
  /** photo 最大宽相对于 stage 宽的比例（0..1）；vignette 偏大、wooden 偏小 */
  photoMaxWFactor: number;
  /** photo 最大宽绝对上限（px），保留主图不超过设计上限 */
  photoMaxAbs: number;
  /** stage gap（text 与 photo 间距） */
  gap: number;
  /** text 估算高占 vh 的比例（实测 textHeight 时优先实测；这只是缺省 fallback） */
  textTopReserveFactor: number;
  /** text-max-w 加成：photoW + extra（保持 text 不超 photo 太多） */
  textOverhang: number;
}

function solveSinglePhoto(
  input: SolverInput,
  opts: SinglePhotoOpts,
  textPlacement: TextPlacement,
): SolverResult {
  const { vw, vh, photos, textHeight } = input;
  const photo = photos[0];
  if (!photo) return { vars: {} };
  const stageW = Math.min(vw, 1280) - SAFE_PAD * 2;
  const stageH = vh - STAGE_PAD_Y * 2;
  // overlay-* / side-* 都不再纵向扣减 textReserve：overlay 的 text 浮于 photo 之上；
  // side 的 text 在隔壁列，photo 高度由 stage 全高决定（与 text 同高对齐）。
  const isOverlay =
    textPlacement === "overlay-bottom" ||
    textPlacement === "overlay-top" ||
    textPlacement === "overlay-center";
  const isSide =
    textPlacement === "side-text-photo" || textPlacement === "side-photo-text";
  const reservesNoVText = isOverlay || isSide;
  const textReserveH = reservesNoVText
    ? 0
    : (textHeight ?? clampPx(vh * opts.textTopReserveFactor, 96, 200));
  const photoMaxW = Math.min(stageW * opts.photoMaxWFactor, opts.photoMaxAbs);
  const photoMaxH = stageH - textReserveH - (reservesNoVText ? 0 : opts.gap);
  const [photoW, photoH] = fitAspect(photoMaxW, photoMaxH, photo.aspectRatio);
  return {
    vars: {
      "--photo-w": `${photoW}px`,
      "--photo-h": `${photoH}px`,
      "--text-max-w": `${Math.min(photoW + opts.textOverhang, stageW)}px`,
      "--stage-gap": `${opts.gap}px`,
    },
    dataAttrs: { textPlacement },
  };
}

// ─── vignette（beat 06 · snow_08 夜色）── 文字浮在底部夜色暗角上
function solveVignette(input: SolverInput): SolverResult {
  return solveSinglePhoto(
    input,
    {
      // overlay-bottom：photo 占整 stage，photoMaxAbs 抬到 820 给夜色更大画面
      photoMaxWFactor: 0.92,
      photoMaxAbs: 820,
      gap: 0,
      textTopReserveFactor: 0,
      textOverhang: 80,
    },
    "overlay-bottom",
  );
}

// ─── overlap（beat 07 · snow_09 契合双层 ghost）────────────────────────
// v1.66（v1.65 audit P2-B 修）：横幅 ghost 双合 + 单行短诗 → overlay-center
//   "两个契合的灵魂" 单行 → 文字浮卡居中漂在 ghost 收敛的图上，更具戏剧性
function solveOverlap(input: SolverInput): SolverResult {
  return solveSinglePhoto(
    input,
    {
      photoMaxWFactor: 0.86,
      photoMaxAbs: 760,
      gap: 0,
      textTopReserveFactor: 0,
      textOverhang: 80,
    },
    "overlay-center",
  );
}

// ─── reveal（beat 08 · snow_12 clip-path 展开）─────────────────────────
// v1.66：竖幅人物图 + clip-path 由内向外展开 → overlay-top
//   "卸下防备" 由 text-floats-on-emerging-photo 表达：文字从顶端浮起，photo 从中心展开
function solveReveal(input: SolverInput): SolverResult {
  return solveSinglePhoto(
    input,
    {
      photoMaxWFactor: 0.92,
      photoMaxAbs: 760,
      gap: 0,
      textTopReserveFactor: 0,
      textOverhang: 80,
    },
    "overlay-top",
  );
}

// ─── wooden（beat 09 · Wooden_door_01 缝线包边）────────────────────────
// v1.66：横幅木门 + 3 行长诗 → wide 模式 side-text-photo（信件式 letterbox 阅读
//   节奏：诗左 + 木门右）；portrait/compact 退回 below（窄屏单列堆叠更易读）
function solveWooden(input: SolverInput): SolverResult {
  const mode = getStoryLayoutMode(input.vw, input.vh);
  const placement: TextPlacement =
    mode === "wide" ? "side-text-photo" : "below";
  // wide 模式 photo 占 ~50% 宽（与文字共享 stage）；其它模式按原 0.7 单图比例
  const photoMaxWFactor = placement === "side-text-photo" ? 0.5 : 0.7;
  const photoMaxAbs = placement === "side-text-photo" ? 600 : 560;
  return solveSinglePhoto(
    input,
    {
      photoMaxWFactor,
      photoMaxAbs,
      gap: 26,
      textTopReserveFactor: 0.22,
      textOverhang: 40,
    },
    placement,
  );
}

// ─── pearl（beat 10 · Pearl_03 高光横扫）───────────────────────────────
// v1.66：竖幅人物图 + 珍珠高光 sweep → overlay-top
//   "抱紧你时, 世界莺莺燕燕" 浮起在珍珠光带之上，珠宝杂志封面感
function solvePearl(input: SolverInput): SolverResult {
  return solveSinglePhoto(
    input,
    {
      photoMaxWFactor: 0.86,
      photoMaxAbs: 700,
      gap: 0,
      textTopReserveFactor: 0,
      textOverhang: 60,
    },
    "overlay-top",
  );
}

/**
 * Solve a single beat's layout for the current viewport + photo specs.
 * 调用方：StoryPoemScroller 在 init / window.resize 时跑一次：
 *   - vars 写到 element.style.setProperty
 *   - dataAttrs 写到 element.dataset（dataset.textPlacement → data-text-placement）
 */
export function solveBeatLayout(input: SolverInput): SolverResult {
  switch (input.layout) {
    case "parallax-pair":
      return solveParallaxPair(input);
    case "diagonal-gaze":
      return solveDiagonalGaze(input);
    case "radial-mask":
      return solveRadialMask(input);
    case "anchor-single":
      return solveAnchorSingle(input);
    case "vignette":
      return solveVignette(input);
    case "overlap":
      return solveOverlap(input);
    case "reveal":
      return solveReveal(input);
    case "wooden":
      return solveWooden(input);
    case "pearl":
      return solvePearl(input);
  }
}
