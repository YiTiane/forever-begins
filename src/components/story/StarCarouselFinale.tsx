/**
 * StarCarouselFinale.tsx · §2.C 星空照片走马灯（v0.8 · v1.98 finale hardening）
 *
 * v0.8 修 v1.97 hardening：
 *   - progress 0→1 映射到 scrollable 前 86%，后段作为 final poster hold；
 *     避免滚到 progress=1 时 sticky stage 已释放、露出浅色页面背景。
 *   - twinkle invalidate 加 visibility gate：只有 finale stage 仍在视口附近且
 *     document 可见时才低频 10fps 重绘；离屏/后台停止。
 *
 * v0.7 修 v1.96 视觉复审：
 *   - timeline 改成"上一张先完整破碎 → 星点散开 → 下一张再可见入场"；
 *     避免下一张从边缘进场时盖住破碎瞬间。
 *   - 入场增加 ENTER_START + late fade：照片在屏外/边缘时保持不可见，进入
 *     安全区后再淡入，仍保留八方向来源但不出现半张照片裁切。
 *   - 照片点阵加入像素级 jitter，避免规整网格感；散开更早开始。
 *
 * v0.6 修 v1.95 视觉复审：
 *   - 退场改为断点式：照片保持完整到 break point，然后快速切到照片颜色
 *     点阵；点阵再散开并有一部分定居为珍珠白星点。
 *   - LIFE_DURATION 从 2.2 收回 1.7：下一张不再过早盖住上一张的破碎瞬间。
 *   - PhotoDustBurst 提升到约 5.7K 点/照片，点径适度增大，避免肉眼看不见。
 *   - PhotoResidueStars 提升到 520 点/照片，并加入低频 twinkle invalidator；
 *     星点留在照片 footprint 附近，能看出"这张照片留下了星星"。
 *
 * v0.5 修 v1.94 视觉复审：
 *   - 入场区从约 1.8% 全局 scroll 拉长到约 5.9%，滚轮不会一跳就错过；
 *     scale 0.42→1.08、ENTRY_DISTANCE 4.15，让"从不同方位由小变大进入"
 *     成为肉眼可见的主动画，而不是参数上的短瞬间。
 *   - 删除黄色 edge glow / burning-like dissolve；照片平面只干净淡出，
 *     由 PhotoDustBurst 按照片纹理采样真实像素点，形成清晰"照片点阵
 *     → 向外喷散 → 珍珠白星尘"三段式退场。
 *   - ACTIVE_RANGE 从 ±1 扩到 ±2，覆盖长入场、上一张退场粒子、下一张接力。
 *
 * v0.4 修 v1.93 视觉复审：
 *   - finale 夜空不再借用 §2.B globe 的深色场，也不再只是单色 clearColor：
 *     NightSkyBackground + StarField 共同构成独立的满天星辰背景。
 *   - 照片持有期直接输出原纹理采样，不做 gamma/brightness/filter 调整。
 *   - ENTRY_DIRECTIONS + 更强 entry distance/scale，让 15 张照片从不同方位进入、
 *     由小变大后停在中央。
 *   - PhotoResidueStars 用每张照片的 plane footprint 采样出持久星点；照片进入
 *     dissolve 后逐批释放这些点，形成"散开成为星空的一部分"，而不是单纯消失。
 *
 * v0.3 修 v1.91 audit：
 *   - **lazy useState initializer**：mount 时同步读 .finale-beat 滚动位置，让
 *     hash deep-link / 进入视口后 island 第一帧就拿正确 progress（v1.91 useState(0)
 *     初值 + scroll listener 异步更新，audit 截图捕到 data-progress=0 的非 composed
 *     帧）
 *   - **LIFE_DURATION 给相邻照片时间线 overlap**：v1.91 `life = global × N - i`
 *     让 photo i 完整 dissolve 后 photo i+1 才入场，中间黑暗过渡帧；改 life =
 *     (global × N - i) / LIFE_DURATION → photo i 在 EXIT 时 photo i+1 已在 ENTER，
 *     两张同屏交接，"碎片化为下一张"的 DESIGN 契约真正成立
 *   - **frameloop="demand" 全模式 + ProgressInvalidator**：v1.91 普通模式
 *     "always" 让 GPU 在 idle 时每帧空跑（progress 不变也写一遍 uniform）。
 *     改全 demand，用 ProgressInvalidator 在 progress prop 变化时 invalidate()
 *     → useFrame 触发一次 → 写新 uniform → 再 idle，不回 60fps 常驻。同时
 *     OrbitControls drag / Suspense texture mount 也会 invalidate（drei / R3F 默认行为）
 *
 * v0.2 修 v1.90 audit：
 *   - **progress 源换 closest('.finale-beat')**：v0.1 用 containerRef.parentElement
 *     拿到的是 hydrated island 自身，不是外层 700vh scroll spacer，结果 progress
 *     一次 wheel 就 0 → 1 跳过走马灯
 *   - **Canvas 不透明 + clearColor 深色**：v0.1 alpha=true 让 SSR Pearl_04 fallback
 *     穿透到走马灯之下混色；alpha=false + clearColor 给 finale 夜空 opaque 底
 *   - **PhotoPlane 限定到 currentI ± active range**：v0.1 一次性挂载 15 张 useTexture，岛
 *     hydrate 后立刻请求 15 张 1600px JPG（~3MB）；v0.2 SceneInner 按 globalProgress
 *     算 currentI，只渲染 active 范围内的 PhotoPlane，其它不挂载（也不 fetch
 *     纹理）。每张 PhotoPlane 有自己的 <Suspense fallback={null}>，相邻照片
 *     纹理加载不阻塞当前帧
 *
 * 视觉契约（DESIGN §2.C · v2.21）：
 *   - 15 张照片按钦定顺序串接：grassland × 5 → wooden-door × 3 → pearl × 2 →
 *     retro × 4 → final Pearl_04（定格）
 *   - 每张 lifecycle：ENTER_START 后 opacity 0→1、scale 0.30→1.06→1.0、
 *     方位 offset → center；hold 后断点式切到照片点阵并散成星
 *   - 同屏最多 1 张主照片 + 上一张残留 dissolve；dissolve 同步释放持久星点
 *   - final Pearl_04：lifecycle 停在 hold 阶段，**永不 dissolve**，定格成主海报
 *   - reduced motion：跳过 dissolve / rotate / scale，只 opacity 交叉淡入
 *
 * 星尘 dissolve 实现：
 *   - PhotoPlane：只做整体 alpha 淡出；不再做噪声破洞，避免"烧穿"语义。
 *   - PhotoDustBurst：从照片 footprint 采样约 5.7K 点云，退场初段先显出
 *     照片颜色点阵，中段向外喷散，末端渐变成珍珠白星尘；点径有小/中/大层级。
 *   - PhotoResidueStars：每张照片退场后在原 footprint 周围留下更亮的持久
 *     星群，视觉上可追溯为"刚才那张照片留下的星星"。
 *
 * 滚动进度：
 *   - StarCarouselFinale 自驱：内置 scroll listener，把 root.getBoundingClientRect
 *     的 top 映射到全局 progress 0..1；v1.98 起前 86% scrollable 完成 timeline，
 *     后段留给 final Pearl_04 hold
 *   - per-photo lifecycle = (global × N - i) / LIFE_DURATION
 *   - 边界 clamp 到 [0, 1]：lifecycle <= 0 表示该照片还没入场；lifecycle >= 1 表示
 *     已完全 dissolve（或 final 定格）
 *
 * 客户端边界：仅 client:visible 加载，不在 SSR 跑；FinaleBeat.astro 包装。
 */

import * as React from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import * as THREE from "three";

import {
  FINALE_PHOTO_SEQUENCE,
  finalePhotoUrl,
  type FinalePhoto,
} from "@/lib/story/finalePhotos";

/**
 * v0.3（v1.91 audit P2-4 修）：自定义 Loader 给 finale 照片 dual-host fallback。
 *
 * v1.91 PhotoPlane 用 drei `useTexture(primaryUrl)` 单 URL，jsDelivr 区域性
 * 抖动时整张 photo 加载失败 → Suspense 永挂 → 该 photo 永远空白。runtime 不
 * 该只信 primary（build-time gate 已经走 dual-CDN，runtime 也得对齐）。
 *
 * Loader 协议：
 *   - 把 primary 与 backup 编码成 "primary||backup"，作为 useLoader 的 URL key
 *   - .load 拆开：先 fetch primary；onError 自动 fall back fetch backup
 *   - 两个都失败才向上 throw（被外层 <Suspense fallback={null}> 吃掉，单张隐藏）
 *   - colorSpace 自动设 SRGB（与 drei useTexture 对齐）
 */
const DUAL_URL_SEP = "||";
type FinaleWindow = Window & { __finaleInitialProgress?: number };

class DualHostTextureLoader extends THREE.Loader {
  override load(
    encoded: string,
    onLoad: (texture: THREE.Texture) => void,
    _onProgress?: (event: ProgressEvent) => void,
    onError?: (err: unknown) => void,
  ): void {
    const sep = encoded.indexOf(DUAL_URL_SEP);
    const primary = sep >= 0 ? encoded.slice(0, sep) : encoded;
    const backup = sep >= 0 ? encoded.slice(sep + DUAL_URL_SEP.length) : "";
    const sub = new THREE.TextureLoader(this.manager);
    if (this.crossOrigin) sub.setCrossOrigin(this.crossOrigin);

    const finishOk = (tex: THREE.Texture) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      onLoad(tex);
    };

    sub.load(primary, finishOk, undefined, () => {
      if (!backup) {
        onError?.(new Error("dual-host: primary failed, no backup"));
        return;
      }
      sub.load(backup, finishOk, undefined, (err) => {
        onError?.(err as ErrorEvent);
      });
    });
  }
}

const CAMERA_FOV = 38;
const HASH_LANDING_PROGRESS = 0.04;
const TIMELINE_SCROLL_FRACTION = 0.86;
const FINAL_POSTER_VISIBLE_PROGRESS = 0.985;
// Hydration note: SSR renders data-progress="0.000". If client initial state is
// also exactly 0.04 and the first effect writes 0.04 again, React may not patch
// the mismatched SSR attribute. Add an invisible epsilon so the first client
// effect always commits while data-progress.toFixed(3) still reports 0.040.
const HASH_LANDING_COMMIT_PROGRESS = HASH_LANDING_PROGRESS + 0.0001;
/** 照片在 canvas 上沿约束维度填充的比例（与 GlobeDistanceScene 同款理念） */
const PHOTO_FILL_FRACTION = 0.84;
/** 每张照片 lifecycle 阶段切分（fraction of own lifecycle） */
const ENTER_START = 0.16;
const ENTER_END = 0.52;
const HOLD_END = 0.64;
// EXIT: HOLD_END..1.0
const SHATTER_APPEAR_START = 0.0;
const SHATTER_APPEAR_END = 0.035;
const PHOTO_BREAK_START = 0.02;
const PHOTO_BREAK_END = 0.08;
const DUST_SCATTER_START = 0.06;
const DUST_SCATTER_END = 0.72;

/**
 * v0.3（v1.91 audit P2-2 修）：每张照片 lifecycle 占用的全局 progress 倍数。
 *
 * v1.91 之前 life = globalProgress × N - i，即每张照片占 1/N 全局，**互不重叠**：
 * 第 i 张完整走完 dissolve 后，第 i+1 张才开始入场，造成黑暗过渡帧。
 *
 * v0.5（v1.95）把 LIFE_DURATION 与 ENTER_END 拉长：真实滚轮一次 delta
 * 往往跨过 1-2% scroll progress，v1.93 的 ENTER 只占约 1.8% 全局 progress，
 * 用户肉眼只能看到照片已经在中央。现在 ENTER 占约 5.9% 全局 progress，
 * 方向入场和由小变大都能在正常滚动中被看见。
 *
 * v0.7（v1.97）把 LIFE_DURATION 收回 1.35，并配合 ENTER_START：下一张
 * 在自己 slot 开始后不会立刻可见；上一张 life 已接近 0.9、星尘事件基本完成
 * 后，下一张才从安全区淡入。
 *
 * 注意：globalProgress = 1 时最后一张 photo (i = N-1 = 14) lifecycle =
 * (1 × 15 - 14) / 1.35 ≈ 0.74，已经完成入场；isFinal 分支让它永远不 dissolve，
 * 自然定格为主海报。
 */
const LIFE_DURATION = 1.35;

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** 入场期 scale 曲线：0.30 → 1.06 → 1.0 */
function scaleCurve(life: number, reduced: boolean): number {
  if (reduced) return 1;
  if (life < ENTER_START) return 0.3;
  if (life < ENTER_END) {
    const raw = (life - ENTER_START) / (ENTER_END - ENTER_START);
    const t = 1 - Math.pow(1 - Math.max(0, raw), 2.1);
    return 0.3 + (1.06 - 0.3) * t;
  }
  if (life < HOLD_END) {
    const t = (life - ENTER_END) / (HOLD_END - ENTER_END);
    return 1.06 + (1.0 - 1.06) * t;
  }
  return 1.0;
}

/** 入场期 opacity 0 → 1；hold 期 1；exit 期由 dissolve shader 处理 alpha 衰减 */
function opacityCurve(life: number): number {
  if (life < 0) return 0;
  if (life < ENTER_START) return 0;
  if (life < ENTER_END) {
    const raw = (life - ENTER_START) / (ENTER_END - ENTER_START);
    const t = Math.max(0, Math.min(1, raw));
    return smoothstep(0.32, 0.76, t);
  }
  return 1;
}

/** 入场期 Y 轴轻微 rotate -0.06 → 0；reduced-motion 直接 0 */
function rotateYCurve(life: number, reduced: boolean): number {
  if (reduced) return 0;
  if (life >= ENTER_START && life < ENTER_END) {
    const t = (life - ENTER_START) / (ENTER_END - ENTER_START);
    return -0.06 * (1 - t); // -0.06 rad ≈ -3.4°
  }
  return 0;
}

/**
 * v1.93（v1.92 audit P2-3 修）：8 方位入场方向（DESIGN §2.C "照片从不同方位
 * 出现"）。索引 i ∈ [0..N-1] 用 `i % 8` 决定方位，确保不同照片不会从同方位
 * 重复入场（15 张走 8 圈不到 2 周期，节奏感不疲劳）。
 *
 * 单位向量是相对中心，(x, y) 取值 ±1：
 *   0: top-left, 1: top, 2: top-right, 3: right,
 *   4: bottom-right, 5: bottom, 6: bottom-left, 7: left
 *
 * 入场时 photo position = direction × easedDistance。life < ENTER_START 时保持
 * 不可见；进入安全区后再淡入，避免只看见被裁掉的半张照片。
 *
 * final Pearl_04 (i=14, 14%8=6=bottom-left) 也走方位入场——但它的 lifecycle
 * 在 globalProgress 末尾才进入，且 isFinal 永不 dissolve，自然定格。
 */
const ENTRY_DIRECTIONS: readonly [number, number][] = [
  [-1, 1], // 0 top-left
  [0, 1], // 1 top
  [1, 1], // 2 top-right
  [1.1, 0], // 3 right（横向略强调）
  [1, -1], // 4 bottom-right
  [0, -1], // 5 bottom
  [-1, -1], // 6 bottom-left
  [-1.1, 0], // 7 left
];
const ENTRY_DISTANCE = 1.75; // 世界单位：在安全区内保留方位感，避免裁切半张照片

/** 入场期 (x, y) 偏移：从方位飘到中央。reduced-motion 直接 [0, 0] */
function positionOffsetCurve(
  life: number,
  index: number,
  reduced: boolean,
): [number, number] {
  if (reduced || life >= ENTER_END) return [0, 0];
  const dir = ENTRY_DIRECTIONS[index % ENTRY_DIRECTIONS.length];
  if (!dir) return [0, 0];
  if (life < ENTER_START) {
    return [dir[0] * ENTRY_DISTANCE, dir[1] * ENTRY_DISTANCE];
  }
  const raw = (life - ENTER_START) / (ENTER_END - ENTER_START);
  const t = Math.max(0, Math.min(1, raw));
  const eased = 1 - Math.pow(1 - t, 2.1);
  const k = (1 - eased) * ENTRY_DISTANCE;
  return [dir[0] * k, dir[1] * k];
}

/** Exit 期 dissolve 0 → 1；reduced-motion 不 dissolve（用 opacity 淡出代替，下方处理） */
function dissolveCurve(
  life: number,
  isFinal: boolean,
  reduced: boolean,
): number {
  if (isFinal) return 0; // final 永不 dissolve
  if (reduced) return 0; // reduced 不走 shader dissolve
  if (life < HOLD_END) return 0;
  if (life > 1) return 1;
  return (life - HOLD_END) / (1 - HOLD_END);
}

/** Reduced-motion 模式下的 alpha 退场（替代 dissolve） */
function reducedExitOpacityCurve(life: number, isFinal: boolean): number {
  if (isFinal) return 1;
  if (life < HOLD_END) return 1;
  if (life > 1) return 0;
  return 1 - (life - HOLD_END) / (1 - HOLD_END);
}

/* ─────────────────────── PhotoPlane Shader ─────────────────────── */
const VERT_SHADER = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG_SHADER = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  uniform float uOpacity;     // 0..1
  uniform float uDissolve;    // 0..1, 0=full photo, 1=fully dissolved
  varying vec2 vUv;

  void main() {
    vec4 photo = texture2D(uTex, vUv);
    // v1.96：退场断点前保持完整；断点后快速让位给照片点阵。
    // 不做噪声破洞，避免"烧穿"语义。
    if (uDissolve > 0.0) {
      photo.a *= 1.0 - smoothstep(${PHOTO_BREAK_START.toFixed(3)}, ${PHOTO_BREAK_END.toFixed(3)}, uDissolve);
    }
    photo.a *= uOpacity;
    if (photo.a <= 0.0) discard;
    gl_FragColor = photo;
    #include <colorspace_fragment>
  }
`;

const DUST_VERT = /* glsl */ `
  attribute vec2 aUv;
  attribute vec2 aDir;
  attribute float aSpeed;
  attribute float aSize;
  attribute float aDelay;
  attribute float aResidue;
  uniform float uBurst;
  varying vec2 vUv;
  varying float vT;
  varying float vAlpha;
  varying float vResidue;
  void main() {
    float delayed = clamp((uBurst - ${DUST_SCATTER_START.toFixed(3)} - aDelay * 0.14) / max(0.001, ${(
      DUST_SCATTER_END - DUST_SCATTER_START
    ).toFixed(3)}), 0.0, 1.0);
    float t = smoothstep(0.0, 1.0, delayed);
    vec3 pos = position;
    pos.xy += aDir * aSpeed * pow(t, 1.08);
    pos.z += 0.16 + 0.62 * t;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * (1.22 + t * 1.48);
    vUv = aUv;
    vT = t;
    vResidue = aResidue;
    float appear = smoothstep(${SHATTER_APPEAR_START.toFixed(3)}, ${SHATTER_APPEAR_END.toFixed(3)}, uBurst);
    float transientFade = 1.0 - smoothstep(0.84, 1.0, uBurst);
    float settled = smoothstep(0.68, 0.96, uBurst) * aResidue;
    vAlpha = appear * max(transientFade, settled * 0.72);
  }
`;

const DUST_FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uTex;
  varying vec2 vUv;
  varying float vT;
  varying float vAlpha;
  varying float vResidue;
  void main() {
    if (vAlpha < 0.001) discard;
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    if (d > 1.0) discard;
    vec4 photo = texture2D(uTex, vUv);
    vec3 starCol = vec3(0.94, 0.97, 1.0);
    vec3 pearlCol = vec3(1.0, 0.96, 0.82);
    vec3 photoSpark = max(photo.rgb * 1.18, vec3(0.58, 0.60, 0.66));
    vec3 col = mix(photoSpark, mix(starCol, pearlCol, vResidue * 0.55), smoothstep(0.38, 1.0, vT));
    float core = pow(1.0 - d, 1.15);
    float alpha = core * vAlpha * photo.a * (0.92 + vResidue * 0.24);
    alpha += (1.0 - smoothstep(0.18, 0.72, d)) * smoothstep(0.72, 1.0, vT) * vResidue * 0.18;
    gl_FragColor = vec4(col, alpha);
    #include <colorspace_fragment>
  }
`;

function PhotoDustBurst({
  texture,
  planeSize,
  burst,
}: {
  texture: THREE.Texture;
  planeSize: [number, number];
  burst: number;
}): React.ReactElement {
  const geometry = useMemo(() => {
    let seed = 911;
    function rand(): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    const [w, h] = planeSize;
    const landscape = w >= h;
    const cols = landscape ? 92 : 62;
    const rows = landscape ? 62 : 92;
    const total = cols * rows;
    const positions = new Float32Array(total * 3);
    const uvs = new Float32Array(total * 2);
    const dirs = new Float32Array(total * 2);
    const speeds = new Float32Array(total);
    const sizes = new Float32Array(total);
    const delays = new Float32Array(total);
    const residues = new Float32Array(total);

    let cursor = 0;
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const u = (x + 0.35 + rand() * 0.3) / cols;
        const v = (y + 0.35 + rand() * 0.3) / rows;
        const localX = (u - 0.5) * w;
        const localY = (v - 0.5) * h;
        positions[cursor * 3] = localX;
        positions[cursor * 3 + 1] = localY;
        positions[cursor * 3 + 2] = 0.06;
        uvs[cursor * 2] = u;
        uvs[cursor * 2 + 1] = v;

        const radial = Math.atan2(
          localY / Math.max(0.001, h),
          localX / Math.max(0.001, w),
        );
        const swirl = 0.46 + rand() * 0.44;
        const angle = radial + swirl + (rand() - 0.5) * 0.72;
        const centerBias = Math.min(
          1,
          Math.hypot(localX / Math.max(0.001, w), localY / Math.max(0.001, h)) *
            2,
        );
        const outward = 0.72 + centerBias * 0.95 + rand() * 0.52;
        dirs[cursor * 2] = Math.cos(angle) * outward;
        dirs[cursor * 2 + 1] = Math.sin(angle) * outward;
        speeds[cursor] = 0.92 + rand() * 2.65;
        const fragmentSizeRoll = rand();
        sizes[cursor] =
          fragmentSizeRoll < 0.58
            ? 1.75 + rand() * 1.35
            : fragmentSizeRoll < 0.92
              ? 3.15 + rand() * 2.05
              : 5.4 + rand() * 1.9;
        delays[cursor] = rand() * 0.22;
        residues[cursor] = rand() < 0.28 ? 1 : 0;
        cursor += 1;
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
    geom.setAttribute("aDir", new THREE.BufferAttribute(dirs, 2));
    geom.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
    geom.setAttribute("aResidue", new THREE.BufferAttribute(residues, 1));
    return geom;
  }, [planeSize]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({ uTex: { value: texture }, uBurst: { value: 0 } }),
    [texture],
  );
  const matRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    const u = matRef.current?.uniforms.uBurst;
    if (u) u.value = Math.max(0, Math.min(1, burst));
  });

  return (
    <points geometry={geometry} renderOrder={4}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={DUST_VERT}
        fragmentShader={DUST_FRAG}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

interface PhotoPlaneProps {
  photo: FinalePhoto;
  /** 在 FINALE_PHOTO_SEQUENCE 里的索引；用于决定方位入场方向 */
  index: number;
  /** 0..1 的 lifecycle；< 0 表示还没入场（mesh 隐藏） */
  lifecycle: number;
  isFinal: boolean;
  reducedMotion: boolean;
}

function PhotoPlane({
  photo,
  index,
  lifecycle,
  isFinal,
  reducedMotion,
}: PhotoPlaneProps): React.ReactElement | null {
  // v0.3（v1.91 audit P2-4 修）：用 DualHostTextureLoader 走 primary→backup
  // fallback；编码 "primary||backup" 给 useLoader 当 cache key
  const dualEncoded = useMemo(
    () =>
      `${finalePhotoUrl(photo, "primary")}${DUAL_URL_SEP}${finalePhotoUrl(
        photo,
        "backup",
      )}`,
    [photo],
  );
  const texture = useLoader(
    DualHostTextureLoader,
    dualEncoded,
  ) as THREE.Texture;
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // texture 加载后用真实 image 尺寸覆写 plane aspect（防 SSR 占位裁切人物主体）
  const [naturalAspect, setNaturalAspect] = useState<number>(photo.aspectRatio);
  useEffect(() => {
    const img = texture.image as
      | HTMLImageElement
      | HTMLCanvasElement
      | ImageBitmap
      | undefined;
    if (img && "width" in img && "height" in img && img.width && img.height) {
      setNaturalAspect(img.width / img.height);
    }
    texture.colorSpace = THREE.SRGBColorSpace;
  }, [texture]);

  const uniforms = useMemo(
    () => ({
      uTex: { value: texture },
      uOpacity: { value: 0 },
      uDissolve: { value: 0 },
    }),
    [texture],
  );

  // 根据 viewport 与 aspect 决定 plane 尺寸（fit-contain 的世界单位）
  const { viewport } = useThree();
  const planeSize = useMemo<[number, number]>(() => {
    const maxW = viewport.width * PHOTO_FILL_FRACTION;
    const maxH = viewport.height * PHOTO_FILL_FRACTION;
    if (maxW / naturalAspect <= maxH) {
      return [maxW, maxW / naturalAspect];
    }
    return [maxH * naturalAspect, maxH];
  }, [viewport.width, viewport.height, naturalAspect]);

  useFrame(() => {
    if (!meshRef.current || !matRef.current) return;
    const life = lifecycle;
    if (life < 0) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;
    const op = reducedMotion
      ? Math.min(opacityCurve(life), reducedExitOpacityCurve(life, isFinal))
      : opacityCurve(life);
    const sc = scaleCurve(life, reducedMotion);
    meshRef.current.scale.setScalar(sc);
    meshRef.current.rotation.y = rotateYCurve(life, reducedMotion);
    // v1.93 P2-3：方位入场——按索引选 8 方位之一，ENTER 期 position 从远方
    // 漂回中央
    const [offX, offY] = positionOffsetCurve(life, index, reducedMotion);
    meshRef.current.position.set(offX, offY, 0);
    const opacityUniform = matRef.current.uniforms.uOpacity;
    const dissolveUniform = matRef.current.uniforms.uDissolve;
    if (opacityUniform) opacityUniform.value = op;
    if (dissolveUniform)
      dissolveUniform.value = dissolveCurve(life, isFinal, reducedMotion);
  });

  const burst = dissolveCurve(lifecycle, isFinal, reducedMotion);

  return (
    <>
      <mesh ref={meshRef} visible={false} renderOrder={2}>
        <planeGeometry args={planeSize} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={VERT_SHADER}
          fragmentShader={FRAG_SHADER}
          transparent
          depthWrite={false}
        />
      </mesh>
      {!isFinal && !reducedMotion ? (
        <PhotoDustBurst texture={texture} planeSize={planeSize} burst={burst} />
      ) : null}
    </>
  );
}

/* ─────────────────────── Star dust background ─────────────────────── */
/* ─────────────────────── NightSkyBackground ─────────────────────── */
/**
 * v1.94：独立 finale 夜空 backdrop。目标不是延续 globe，而是给婚礼终幕一个
 * 明亮但不俗的星空舞台：
 *   - 深蓝紫径向夜空，中心微亮，四角压暗，给照片留视觉主场
 *   - 低频云气 + 斜向银河晕，让背景有"满天星辰"的深度而不是单色幕布
 * 几何：一块大 plane 放在最远处（z=-10）；camera 看向它，覆盖整个 frustum。
 */
const NIGHT_SKY_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const NIGHT_SKY_FRAG = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float noise2(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }
  void main() {
    vec2 p = vUv - 0.5;
    float r = length(p) * 1.6;
    // 径向渐变：中心蓝紫微亮，外圈压到深海军蓝
    vec3 inner  = vec3(0.035, 0.047, 0.145);
    vec3 mid    = vec3(0.018, 0.024, 0.070);
    vec3 outer  = vec3(0.006, 0.008, 0.020);
    vec3 col    = mix(inner, mid, smoothstep(0.0, 0.72, r));
    col         = mix(col, outer, smoothstep(0.62, 1.15, r));

    // 斜向银河晕：不画成一条明显丝带，只让天空上半部有一点层次
    float band  = exp(-pow((p.y + p.x * 0.42 - 0.04) * 3.1, 2.0));
    float n     = noise2(vUv * 3.5) * 0.65 + noise2(vUv * 11.0) * 0.35;
    col        += vec3(0.030, 0.026, 0.055) * band * 0.38;
    col        += (n - 0.5) * 0.018;
    gl_FragColor = vec4(col, 1.0);
  }
`;
function NightSkyBackground(): React.ReactElement {
  const { viewport } = useThree();
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: NIGHT_SKY_VERT,
        fragmentShader: NIGHT_SKY_FRAG,
        depthWrite: false,
        depthTest: false,
      }),
    [],
  );
  useEffect(() => () => material.dispose(), [material]);
  // 远 z；尺寸覆盖 frustum 4×（防 perspective 切边）
  const size: [number, number] = [viewport.width * 4, viewport.height * 4];
  return (
    <mesh position={[0, 0, -8]} material={material} renderOrder={-2}>
      <planeGeometry args={size} />
    </mesh>
  );
}

/* ─────────────────────── StarField ─────────────────────── */
/**
 * v1.98：星空底层星点池 1900 颗。它负责"满天星辰"的底色；照片碎片
 * 另由 PhotoResidueStars 负责，避免把背景星与照片残片混为一个弱效果。
 *
 * 视觉契约（v1.92 audit）："碎片化作星尘，成为星空的一部分"——每张照片
 * dissolve 时贡献 ~100 颗永久星点。具体实现：
 *   - 初始即显示大量基础星点（不是等照片 dissolve 后才有星空）
 *   - globalProgress 只略微增加亮星密度，真正"碎片成为星"交给下方残片点云
 *   - 星点大小有三档：细星 / 亮星 / 少量近景大星
 */
const STARFIELD_VERT = /* glsl */ `
  attribute float aRevealAt;
  attribute float aSize;
  attribute float aBrightness;
  varying float vBrightness;
  uniform float uReveal;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    // aRevealAt > uReveal → 星点尚未"被照片碎片化贡献"出来；置 size = 0 隐藏
    float visible = step(aRevealAt, uReveal);
    gl_PointSize = aSize * visible;
    vBrightness = aBrightness * visible;
  }
`;
const STARFIELD_FRAG = /* glsl */ `
  precision highp float;
  varying float vBrightness;
  void main() {
    if (vBrightness < 0.001) discard;
    // gl_PointCoord 0..1 in point quad; 圆形 falloff 给星点软边
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    if (d > 1.0) discard;
    float alpha = (1.0 - d) * vBrightness;
    // 星点色：暖白（R 1.0 / G 0.97 / B 0.88），不让纯白显得电子
    vec3 starCol = vec3(1.0, 0.97, 0.88);
    gl_FragColor = vec4(starCol, alpha);
  }
`;

function StarField({ progress }: { progress: number }): React.ReactElement {
  const N_STARS = 1900;
  const { positions, sizes, brightness, revealAt } = useMemo(() => {
    let seed = 17;
    function rand(): number {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }
    const positions = new Float32Array(N_STARS * 3);
    const sizes = new Float32Array(N_STARS);
    const brightness = new Float32Array(N_STARS);
    const revealAt = new Float32Array(N_STARS);
    for (let i = 0; i < N_STARS; i += 1) {
      positions[i * 3] = (rand() - 0.5) * 8.5;
      positions[i * 3 + 1] = (rand() - 0.5) * 5.6;
      positions[i * 3 + 2] = -3.5 - rand() * 2.5;
      // 背景星要有明显大小层级：多数细星、少量亮星、极少数近景星。
      const r = rand();
      if (r < 0.82) sizes[i] = 0.85 + rand() * 1.05;
      else if (r < 0.975) sizes[i] = 2.15 + rand() * 1.45;
      else sizes[i] = 4.35 + rand() * 1.95;
      brightness[i] = 0.26 + rand() * 0.68;
      // 约 42% 初始可见；给照片破碎后形成的新星群留出视觉主导权。
      revealAt[i] = rand() < 0.42 ? rand() * 0.08 : 0.08 + rand() * 0.92;
    }
    return { positions, sizes, brightness, revealAt };
  }, []);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    geom.setAttribute("aRevealAt", new THREE.BufferAttribute(revealAt, 1));
    return geom;
  }, [positions, sizes, brightness, revealAt]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const uniforms = useMemo(() => ({ uReveal: { value: 0.06 } }), []);
  // progress 直接驱动 uReveal；初始 0.12 给 hash landing 首屏足够星点，
  // 但不抢照片碎裂后的新星群。
  const matRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    if (matRef.current) {
      const u = matRef.current.uniforms["uReveal"];
      if (u) u.value = Math.max(0.12, Math.min(1, 0.12 + progress * 0.88));
    }
  });

  return (
    <points geometry={geometry} renderOrder={-1}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={STARFIELD_VERT}
        fragmentShader={STARFIELD_FRAG}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/* ─────────────────────── PhotoResidueStars ─────────────────────── */
const RESIDUE_VERT = /* glsl */ `
  attribute float aRevealStart;
  attribute float aRevealEnd;
  attribute float aSize;
  attribute float aBrightness;
  attribute float aTwinkle;
  attribute vec3 aColor;
  varying float vBrightness;
  varying vec3 vColor;
  uniform float uTime;
  uniform float uProgress;
  void main() {
    float t = smoothstep(aRevealStart, aRevealEnd, uProgress);
    float settlePulse = 1.0 + (1.0 - smoothstep(0.0, 1.0, t)) * 1.35;
    float twinkle = 0.74 + 0.26 * sin(uTime * (0.8 + aTwinkle * 1.7) + aTwinkle * 19.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * t * settlePulse;
    vBrightness = aBrightness * t * twinkle;
    vColor = aColor;
  }
`;
const RESIDUE_FRAG = /* glsl */ `
  precision highp float;
  varying float vBrightness;
  varying vec3 vColor;
  void main() {
    if (vBrightness < 0.001) discard;
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c) * 2.0;
    if (d > 1.0) discard;
    float alpha = pow(1.0 - d, 1.6) * vBrightness;
    vec3 starCol = vColor;
    gl_FragColor = vec4(starCol, alpha);
  }
`;

function fitPlaneSize(
  viewW: number,
  viewH: number,
  aspect: number,
): [number, number] {
  const maxW = viewW * PHOTO_FILL_FRACTION;
  const maxH = viewH * PHOTO_FILL_FRACTION;
  if (maxW / aspect <= maxH) return [maxW, maxW / aspect];
  return [maxH * aspect, maxH];
}

/**
 * 每张照片 dissolve 时释放一组持久星点。这些点采样自该照片在画面中的
 * plane footprint，并略向四周散开；照片完整时被 photo plane 挡住，进入
 * dissolve 后从破碎区域露出，随后留在星空里。
 */
function PhotoResidueStars({
  progress,
}: {
  progress: number;
}): React.ReactElement {
  const { viewport } = useThree();
  const {
    positions,
    sizes,
    brightness,
    revealStart,
    revealEnd,
    twinkle,
    colors,
  } = useMemo(() => {
    let seed = 113;
    function rand(): number {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    }

    const photos = FINALE_PHOTO_SEQUENCE.slice(0, -1);
    const perPhoto = 520;
    const total = photos.length * perPhoto;
    const positions = new Float32Array(total * 3);
    const sizes = new Float32Array(total);
    const brightness = new Float32Array(total);
    const revealStart = new Float32Array(total);
    const revealEnd = new Float32Array(total);
    const twinkle = new Float32Array(total);
    const colors = new Float32Array(total * 3);
    const n = FINALE_PHOTO_SEQUENCE.length;

    let cursor = 0;
    for (let photoIndex = 0; photoIndex < photos.length; photoIndex += 1) {
      const photo = photos[photoIndex];
      if (!photo) continue;
      const [w, h] = fitPlaneSize(
        viewport.width,
        viewport.height,
        photo.aspectRatio,
      );
      const start = (photoIndex + HOLD_END * LIFE_DURATION) / n;
      const end = Math.min(1, (photoIndex + LIFE_DURATION) / n);

      for (let j = 0; j < perPhoto; j += 1) {
        const angle = rand() * Math.PI * 2;
        const radius = Math.pow(rand(), 0.65);
        const localX = (rand() - 0.5) * w;
        const localY = (rand() - 0.5) * h;
        const scatter = 0.22 + rand() * 0.58;
        positions[cursor * 3] = localX + Math.cos(angle) * radius * w * scatter;
        positions[cursor * 3 + 1] =
          localY + Math.sin(angle) * radius * h * scatter;
        positions[cursor * 3 + 2] = -0.03 - rand() * 0.34;
        const bright = rand() > 0.72;
        sizes[cursor] = bright ? 4.2 + rand() * 2.8 : 2.2 + rand() * 2.4;
        brightness[cursor] = bright
          ? 0.74 + rand() * 0.5
          : 0.46 + rand() * 0.42;
        revealStart[cursor] =
          start + rand() * Math.max(0.001, (end - start) * 0.16);
        revealEnd[cursor] = start + (end - start) * (0.32 + rand() * 0.38);
        twinkle[cursor] = rand();
        const pearl = rand();
        colors[cursor * 3] = 0.88 + pearl * 0.12;
        colors[cursor * 3 + 1] = 0.92 + pearl * 0.06;
        colors[cursor * 3 + 2] = 1.0;
        cursor += 1;
      }
    }

    return {
      positions,
      sizes,
      brightness,
      revealStart,
      revealEnd,
      twinkle,
      colors,
    };
  }, [viewport.width, viewport.height]);

  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geom.setAttribute("aBrightness", new THREE.BufferAttribute(brightness, 1));
    geom.setAttribute(
      "aRevealStart",
      new THREE.BufferAttribute(revealStart, 1),
    );
    geom.setAttribute("aRevealEnd", new THREE.BufferAttribute(revealEnd, 1));
    geom.setAttribute("aTwinkle", new THREE.BufferAttribute(twinkle, 1));
    geom.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [positions, sizes, brightness, revealStart, revealEnd, twinkle, colors]);

  useEffect(() => () => geometry.dispose(), [geometry]);

  const uniforms = useMemo(
    () => ({ uProgress: { value: 0 }, uTime: { value: 0 } }),
    [],
  );
  const matRef = useRef<THREE.ShaderMaterial>(null);
  useFrame((_state, delta) => {
    const u = matRef.current?.uniforms["uProgress"];
    if (u) u.value = progress;
    const time = matRef.current?.uniforms["uTime"];
    if (time) time.value += delta;
  });

  return (
    <points geometry={geometry} renderOrder={0}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={RESIDUE_VERT}
        fragmentShader={RESIDUE_FRAG}
        transparent
        depthWrite={false}
      />
    </points>
  );
}

/* ─────────────────────── ProgressInvalidator ─────────────────────── */
/**
 * v0.3（v1.91 audit P2-3 修）：在 frameloop="demand" 模式下让 progress 变化触发
 * 一次重绘。
 *
 * 在 demand 模式：useFrame 不再每帧自动跑，必须显式 invalidate() 才会渲染。
 * 因此每次 progress prop 变化（scroll listener 或 hash align 触发的 setProgress），
 * 由本组件 useEffect 调 invalidate() → R3F 跑一帧 → useFrame 派发新 lifecycle →
 * 写新 uniform → 渲染 → 重新 idle。Idle 期间 GPU/CPU 工作量降到接近 0。
 */
function ProgressInvalidator({
  progress,
}: {
  progress: number;
}): React.ReactElement | null {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    invalidate();
  }, [progress, invalidate]);
  return null;
}

/**
 * Finale 星空需要"定居后仍在闪烁"。frameloop 仍保持 demand，不回到 60fps；
 * 这里只在 finale spacer 仍接近视口且页面可见时用低频 10fps invalidate，
 * 让 uTime 推动持久星点 twinkle。离屏 / 后台 / reduced-motion 下都不启用。
 */
function TwinkleInvalidator({
  enabled,
}: {
  enabled: boolean;
}): React.ReactElement | null {
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    if (!enabled) return;
    const beat = document.querySelector<HTMLElement>(".finale-beat");
    let active = false;
    let raf = 0;
    let last = 0;
    const stop = () => {
      if (raf !== 0) {
        window.cancelAnimationFrame(raf);
        raf = 0;
      }
    };
    const tick = (time: number) => {
      if (!active) {
        raf = 0;
        return;
      }
      if (time - last >= 100) {
        last = time;
        invalidate();
      }
      raf = window.requestAnimationFrame(tick);
    };
    const start = () => {
      if (raf === 0) {
        raf = window.requestAnimationFrame(tick);
      }
    };
    const updateActive = () => {
      if (!beat) {
        const wasActive = active;
        active = false;
        if (wasActive) stop();
        return;
      }
      const rect = beat.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      const nextActive =
        document.visibilityState === "visible" &&
        rect.bottom > -vh * 0.15 &&
        rect.top < vh * 1.15;
      if (nextActive === active) return;
      active = nextActive;
      if (active) {
        last = 0;
        start();
      } else {
        stop();
      }
    };
    updateActive();
    window.addEventListener("scroll", updateActive, { passive: true });
    window.addEventListener("resize", updateActive, { passive: true });
    document.addEventListener("visibilitychange", updateActive);
    return () => {
      window.removeEventListener("scroll", updateActive);
      window.removeEventListener("resize", updateActive);
      document.removeEventListener("visibilitychange", updateActive);
      stop();
    };
  }, [enabled, invalidate]);
  return null;
}

/* ─────────────────────── Scene root ─────────────────────── */
interface SceneInnerProps {
  globalProgress: number;
  reducedMotion: boolean;
}

function SceneInner({
  globalProgress,
  reducedMotion,
}: SceneInnerProps): React.ReactElement {
  const N = FINALE_PHOTO_SEQUENCE.length;
  // 全局 progress 0..1 → 每张照片 lifecycle = globalProgress × N - i
  // 让相邻两张有一段 overlap：i 张 lifecycle 进入 EXIT 阶段时，i+1 张同时进入 ENTER

  // v0.2（v1.90 audit P2-5 修）：只挂载 currentI ± ACTIVE_RANGE 的 PhotoPlane。
  // 每张 PhotoPlane 内部 useTexture 会触发对应 1600px JPG 的 fetch + Suspense；
  // 限制活跃集合到最多 5 张避免初次 hydrate 就请求 15 × ~200KB = ~3MB 图片。
  // currentI 跟 globalProgress 走，自动 swap：滚到第 5 张时活跃约为
  // [3, 4, 5, 6, 7]，既覆盖长入场，也覆盖上一张的散开退场。
  const ACTIVE_RANGE = 2;
  const currentI = Math.min(N - 1, Math.max(0, Math.floor(globalProgress * N)));
  const activeIndices: number[] = [];
  for (let i = currentI - ACTIVE_RANGE; i <= currentI + ACTIVE_RANGE; i += 1) {
    if (i >= 0 && i < N) activeIndices.push(i);
  }

  return (
    <>
      <ProgressInvalidator progress={globalProgress} />
      <TwinkleInvalidator enabled={!reducedMotion} />
      <NightSkyBackground />
      <StarField progress={globalProgress} />
      <PhotoResidueStars progress={globalProgress} />
      {activeIndices.map((i) => {
        const photo = FINALE_PHOTO_SEQUENCE[i];
        if (!photo) return null;
        // v0.7（v1.97）：LIFE_DURATION = 1.35 + ENTER_START late fade。
        // 上一张先完成破碎散星，下一张再进入安全区淡入。
        const life = (globalProgress * N - i) / LIFE_DURATION;
        const isFinal = i === N - 1;
        // 每张 PhotoPlane 自带 <Suspense fallback={null}>：纹理加载期间该
        // 单张隐形，不阻塞相邻照片或 StarField / 背景渲染
        return (
          <Suspense key={`${photo.cdnTarget}-${photo.stem}`} fallback={null}>
            <PhotoPlane
              photo={photo}
              index={i}
              lifecycle={life}
              isFinal={isFinal}
              reducedMotion={reducedMotion}
            />
          </Suspense>
        );
      })}
    </>
  );
}

/* ─────────────────────── Public Canvas wrapper ─────────────────────── */
export function StarCarouselFinale(): React.ReactElement {
  // reduced motion lazy initializer（与 GlobeDistanceScene 同款，避首帧 always-loop）
  const [reducedMotion, setReducedMotion] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // 内置 progress：root 元素的 boundingClientRect.top 映射到 finale 全局进度
  const containerRef = useRef<HTMLDivElement>(null);
  /**
   * v0.4（v1.92 audit P2-1 修）：lazy useState initializer **优先读
   * `data-initial-progress`** dataset attribute（StoryPoemScroller alignHash
   * 写入），fall through 到 scroll-derived 才作为 fallback。
   *
   * 改动动机：v1.92 单纯靠 lazy init 读 scroll position 在部署上仍出现
   * progress=0 现象（hash align 与 island hydrate 时序竞争）。v1.93 用
   * "意图直接传递" 替代 "推断"——alignHash 已经决定了目标 progress（0.04），
   * 直接把这个意图写到 dataset 上让 island 读，不再让 island 自己从 scroll
   * 反推。
   *
   * 注意：这里不能用 containerRef.current（mount 阶段还是 null），改用
   * `document.querySelector('.finale-beat')` 直接定位 spacer。reduced-motion
   * 用户先暂用 0，useEffect 再钉到 1（不影响最终视觉）。
   */
  const [progress, setProgress] = useState<number>(() => {
    if (typeof window === "undefined") return 0;
    const initialFromInline = (window as FinaleWindow).__finaleInitialProgress;
    if (typeof initialFromInline === "number") {
      return Math.min(1, Math.max(0, initialFromInline));
    }
    if (window.location.hash === "#beat-12-heading") {
      return HASH_LANDING_PROGRESS;
    }
    const beat = document.querySelector<HTMLElement>(".finale-beat");
    if (!beat) return 0;
    // v0.4 先读 alignHash 意图传递的 data-initial-progress
    const initial = beat.dataset["initialProgress"];
    if (initial) {
      const parsed = parseFloat(initial);
      if (!Number.isNaN(parsed)) return Math.min(1, Math.max(0, parsed));
    }
    // fallback：从 scroll 位置反推（hash 不命中或异常时）
    const rect = beat.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const scrollable = rect.height - vh;
    const timelineScrollable = scrollable * TIMELINE_SCROLL_FRACTION;
    if (timelineScrollable <= 0) return 1;
    const scrolled = Math.max(0, -rect.top);
    return Math.min(1, scrolled / timelineScrollable);
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onForcedProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ progress?: number }>).detail;
      if (typeof detail?.progress !== "number") return;
      setProgress(Math.min(1, Math.max(0, detail.progress)));
    };
    window.addEventListener("finale:set-progress", onForcedProgress);
    return () =>
      window.removeEventListener("finale:set-progress", onForcedProgress);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reducedMotion) {
      setProgress(1); // 终态定格
      return;
    }
    let raf = 0;
    let pendingHashLanding = window.location.hash === "#beat-12-heading";
    const compute = () => {
      raf = 0;
      // v0.2（v1.90 audit P2-1 修）：progress 源是 .finale-beat 700vh scroll
      // spacer，不是 React 岛自身（旧 parentElement = hydrated 岛 = 100vh 内层
      // sticky stage，结果 progress 一次 wheel 就 0→1 跳过走马灯）
      const root =
        containerRef.current?.closest<HTMLElement>(".finale-beat") ?? null;
      if (!root) return;
      const initialFromInline = (window as FinaleWindow)
        .__finaleInitialProgress;
      if (typeof initialFromInline === "number") {
        const normalized = Math.min(1, Math.max(0, initialFromInline));
        setProgress(
          normalized === HASH_LANDING_PROGRESS
            ? HASH_LANDING_COMMIT_PROGRESS
            : normalized,
        );
        delete (window as FinaleWindow).__finaleInitialProgress;
        return;
      }
      if (pendingHashLanding) {
        pendingHashLanding = false;
        const rect = root.getBoundingClientRect();
        const absoluteTop = window.scrollY + rect.top;
        const vh = window.innerHeight || 1;
        const scrollable = Math.max(0, root.offsetHeight - vh);
        const timelineScrollable = scrollable * TIMELINE_SCROLL_FRACTION;
        const top =
          timelineScrollable > 0
            ? absoluteTop + timelineScrollable * HASH_LANDING_PROGRESS
            : absoluteTop;
        window.scrollTo({ top: Math.max(0, top), behavior: "auto" });
        setProgress(HASH_LANDING_COMMIT_PROGRESS);
        return;
      }
      const initial = root.dataset["initialProgress"];
      if (initial) {
        const parsed = parseFloat(initial);
        if (!Number.isNaN(parsed)) {
          setProgress(Math.min(1, Math.max(0, parsed)));
          delete root.dataset["initialProgress"];
          return;
        }
      }
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // root.top 在视口底（rect.top = vh）→ progress 0
      // v1.98: progress=1 提前到 scrollable 前 86%，后段留给 final poster hold。
      const scrollable = rect.height - vh;
      const timelineScrollable = scrollable * TIMELINE_SCROLL_FRACTION;
      if (timelineScrollable <= 0) {
        setProgress(1);
        return;
      }
      const scrolled = Math.max(0, -rect.top);
      let nextProgress = Math.min(1, scrolled / timelineScrollable);
      if (
        window.location.hash === "#beat-12-heading" &&
        nextProgress < HASH_LANDING_PROGRESS
      ) {
        nextProgress = HASH_LANDING_PROGRESS;
      }
      setProgress(nextProgress);
    };
    const schedule = () => {
      if (raf !== 0) return;
      raf = window.requestAnimationFrame(compute);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (raf !== 0) window.cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="finale-canvas-root"
      data-progress={progress.toFixed(3)}
      data-final-hold={
        progress >= FINAL_POSTER_VISIBLE_PROGRESS ? "true" : "false"
      }
    >
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: CAMERA_FOV }}
        // v0.3（v1.91 audit P2-3 修）：frameloop 全模式 demand —— 普通模式 v1.91
        // 是 "always" 让 GPU 每帧空跑（progress 不变也写一遍 uniform）；现在 demand
        // + ProgressInvalidator 在 progress 变时显式 invalidate()，idle 不回 60fps
        frameloop="demand"
        // alpha=false 不透明；clearColor 是 finale 独立夜空的保底色。
        // 真正的满天星辰由 NightSkyBackground / StarField / PhotoResidueStars 绘制。
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          // Keep photo color faithful: no cinematic tone mapping on wedding
          // photos; custom shaders include Three's color-space output chunk so
          // SRGB textures render at their native brightness.
          gl.toneMapping = THREE.NoToneMapping;
          gl.setClearColor("#06091a", 1);
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneInner globalProgress={progress} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
      <div className="finale-final-poster" aria-hidden="true">
        <img
          src={finalePhotoUrl(
            FINALE_PHOTO_SEQUENCE[FINALE_PHOTO_SEQUENCE.length - 1]!,
            "primary",
          )}
          alt=""
          loading="lazy"
          decoding="async"
        />
      </div>
    </div>
  );
}

export default StarCarouselFinale;
