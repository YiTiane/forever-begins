/**
 * StarCarouselFinale.tsx · §2.C 星空照片走马灯（v0.3 · v1.92 修 v1.91 audit 3 P2）
 *
 * v0.3 修 v1.91 audit：
 *   - **lazy useState initializer**：mount 时同步读 .finale-beat 滚动位置，让
 *     hash deep-link / 进入视口后 island 第一帧就拿正确 progress（v1.91 useState(0)
 *     初值 + scroll listener 异步更新，audit 截图捕到 data-progress=0 的非 composed
 *     帧）
 *   - **LIFE_DURATION = 1.4 给相邻照片时间线 overlap**：v1.91 `life = global × N - i`
 *     让 photo i 完整 dissolve 后 photo i+1 才入场，中间黑暗过渡帧；改 life =
 *     (global × N - i) / 1.4 → photo i 在 EXIT (life ≈ 0.71) 时 photo i+1 在
 *     ENTER (life = 0)，两张同屏交接，"碎片化为下一张"的 DESIGN 契约真正成立
 *   - **frameloop="demand" 全模式 + ProgressInvalidator**：v1.91 普通模式
 *     "always" 让 GPU 在 idle 时每帧空跑（progress 不变也写一遍 uniform）。
 *     改全 demand，用 ProgressInvalidator 在 progress prop 变化时 invalidate()
 *     → useFrame 触发一次 → 写新 uniform → 再 idle 0 CPU/GPU。同时 OrbitControls
 *     drag / Suspense texture mount 也会 invalidate（drei / R3F 默认行为）
 *
 * v0.2 修 v1.90 audit：
 *   - **progress 源换 closest('.finale-beat')**：v0.1 用 containerRef.parentElement
 *     拿到的是 hydrated island 自身，不是外层 700vh scroll spacer，结果 progress
 *     一次 wheel 就 0 → 1 跳过走马灯
 *   - **Canvas 不透明 + clearColor 深色**：v0.1 alpha=true 让 SSR Pearl_04 fallback
 *     穿透到走马灯之下混色；alpha=false + clearColor `#1d1d18` 给"夜空 starfield"
 *     opaque 底，DESIGN "背景从地球的深色星场延续下来" 落到位
 *   - **PhotoPlane 限定到 currentI ± 1**：v0.1 一次性挂载 15 张 useTexture，岛
 *     hydrate 后立刻请求 15 张 1600px JPG（~3MB）；v0.2 SceneInner 按 globalProgress
 *     算 currentI，只渲染 ±1 active 范围的 PhotoPlane，其它不挂载（也不 fetch
 *     纹理）。每张 PhotoPlane 有自己的 <Suspense fallback={null}>，相邻照片
 *     纹理加载不阻塞当前帧
 *
 * 视觉契约（DESIGN §2.C · v2.21）：
 *   - 15 张照片按钦定顺序串接：grassland × 5 → wooden-door × 3 → pearl × 2 →
 *     retro × 4 → final Pearl_04（定格）
 *   - 每张 lifecycle：opacity 0→1、scale 0.82→1.04、轻微 3D rotate 入场，
 *     hold ~0.4-0.5 屏，然后 Shader Dissolve 为星点
 *   - 同屏最多 1 张主照片 + 上一张残留 dissolve；避免视觉拥挤
 *   - final Pearl_04：lifecycle 停在 hold 阶段，**永不 dissolve**，定格成主海报
 *   - reduced motion：跳过 dissolve / rotate / scale，只 opacity 交叉淡入
 *
 * Shader Dissolve 实现：
 *   - 自定义 ShaderMaterial：value-noise 混频 → smoothstep 阈值 → 噪声 < threshold
 *     keep / 否则 discard
 *   - threshold 由 uDissolve uniform 0→1 推进
 *   - 边缘带（noise 接近 threshold ±0.06）混入星金色（rgb 1.0, 0.85, 0.55）
 *     → "碎片成为星点" 的 fragment-shader 效果
 *
 * 滚动进度：
 *   - StarCarouselFinale 自驱：内置 IO + scroll listener，把 root.getBoundingClientRect
 *     的 top 映射到全局 progress 0..1
 *   - per-photo lifecycle = global × N - i（N 个照片均分 progress）
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
/** 照片在 canvas 上沿约束维度填充的比例（与 GlobeDistanceScene 同款理念） */
const PHOTO_FILL_FRACTION = 0.78;
/** 每张照片 lifecycle 阶段切分（fraction of own lifecycle） */
const ENTER_END = 0.18;
const HOLD_END = 0.62;
// EXIT: HOLD_END..1.0

/**
 * v0.3（v1.91 audit P2-2 修）：每张照片 lifecycle 占用的全局 progress 倍数。
 *
 * v1.91 之前 life = globalProgress × N - i，即每张照片占 1/N 全局，**互不重叠**：
 * 第 i 张完整走完 dissolve 后，第 i+1 张才开始入场，造成黑暗过渡帧。
 *
 * v0.3 改 life = (globalProgress × N - i) / LIFE_DURATION，每张照片实际占用
 * 1.4 / N 全局 → 相邻两张有 0.4 / N 全局的视觉重叠：第 i 张 lifecycle 0.71
 * (EXIT 中段，dissolve 进行中) 时第 i+1 张 lifecycle 0 (ENTER 起点)，两张同屏
 * 完成"碎片化为下一张"的 DESIGN §2.C 契约。
 *
 * 注意：globalProgress = 1 时最后一张 photo (i = N-1 = 14) lifecycle =
 * (1 × 15 - 14) / 1.4 = 0.71，正好在 HOLD-EXIT 边界；isFinal 分支让它永远
 * 不 dissolve，自然定格。globalProgress = (N - 1) / N = 14/15 ≈ 0.933 时
 * final 在 lifecycle = 1/1.4 = 0.71，仍在 HOLD 内（因为 isFinal 强制 dissolve=0）。
 */
const LIFE_DURATION = 1.4;

/** 入场期 scale 曲线：0.82 → 1.04 → 1.0 */
function scaleCurve(life: number, reduced: boolean): number {
  if (reduced) return 1;
  if (life < ENTER_END) {
    const t = life / ENTER_END;
    return 0.82 + (1.04 - 0.82) * t;
  }
  if (life < HOLD_END) {
    const t = (life - ENTER_END) / (HOLD_END - ENTER_END);
    return 1.04 + (1.0 - 1.04) * t;
  }
  return 1.0;
}

/** 入场期 opacity 0 → 1；hold 期 1；exit 期由 dissolve shader 处理 alpha 衰减 */
function opacityCurve(life: number): number {
  if (life < 0) return 0;
  if (life < ENTER_END) return life / ENTER_END;
  return 1;
}

/** 入场期 Y 轴轻微 rotate -0.06 → 0；reduced-motion 直接 0 */
function rotateYCurve(life: number, reduced: boolean): number {
  if (reduced) return 0;
  if (life < ENTER_END) {
    const t = life / ENTER_END;
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
 * 入场时 photo position = direction × (1 - life/ENTER_END) × ENTRY_DISTANCE，
 * 配合 scaleCurve 0.82 → 1.04 → 1.0 形成"由远方某方位飘入中央并放大"。
 *
 * final Pearl_04 (i=14, 14%8=6=bottom-left) 也走方位入场——但它的 lifecycle
 * 在 globalProgress 末尾才进入，且 isFinal 永不 dissolve，自然定格。
 */
const ENTRY_DIRECTIONS: readonly [number, number][] = [
  [-1, 1], // 0 top-left
  [0, 1.2], // 1 top（垂直方向给得更远，纵向强调）
  [1, 1], // 2 top-right
  [1.4, 0], // 3 right（横向给得更远，横向强调）
  [1, -1], // 4 bottom-right
  [0, -1.2], // 5 bottom
  [-1, -1], // 6 bottom-left
  [-1.4, 0], // 7 left
];
const ENTRY_DISTANCE = 1.4; // 世界单位（相对 plane 自身尺寸）

/** 入场期 (x, y) 偏移：从方位飘到中央。reduced-motion 直接 [0, 0] */
function positionOffsetCurve(
  life: number,
  index: number,
  reduced: boolean,
): [number, number] {
  if (reduced || life >= ENTER_END) return [0, 0];
  const dir = ENTRY_DIRECTIONS[index % ENTRY_DIRECTIONS.length];
  if (!dir) return [0, 0];
  const t = Math.max(0, life) / ENTER_END;
  // 缓出曲线让"靠近中央"段减速更优雅（cubic ease-out）
  const eased = 1 - (1 - t) * (1 - t) * (1 - t);
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

  // value-noise hash（与 GlobeDistanceScene 同款）
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
    vec4 photo = texture2D(uTex, vUv);
    // v1.93（v1.92 audit"照片调暗"修）：自定义 ShaderMaterial 不像 Three 内
    // 置 lit material 那样自动注入 sRGB→linear 转换，渲染管线 outputColorSpace
    // = sRGB 时未转的 sRGB 样本会被当作 linear 二次 encode → 看上去比原图暗
    // 一档（gamma 2.2 的差异）。这里手动做一次 sRGB→linear，让 renderer 的
    // 输出 encode 后回到原图色阶。
    photo.rgb = pow(photo.rgb, vec3(2.2));
    if (uDissolve > 0.0) {
      // 双频 noise：低频给"大块剥落"，高频给"细粒星尘"
      float n1 = noise2(vUv * 12.0);
      float n2 = noise2(vUv * 60.0);
      float n  = n1 * 0.6 + n2 * 0.4;
      float edge = uDissolve - n;
      if (edge > 0.0) discard;
      // 边缘带：把 photo.rgb 推向星金色（已在 linear 空间）
      if (edge > -0.08) {
        float band = (-edge) / 0.08; // 0 = 边缘最亮 / 1 = 内部本色
        vec3 starGlow = pow(vec3(1.0, 0.86, 0.55), vec3(2.2));
        photo.rgb = mix(starGlow, photo.rgb, band);
      }
    }
    photo.a *= uOpacity;
    if (photo.a <= 0.0) discard;
    gl_FragColor = photo;
  }
`;

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

  return (
    <mesh ref={meshRef} visible={false}>
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
  );
}

/* ─────────────────────── Star dust background ─────────────────────── */
/* ─────────────────────── NightSkyBackground ─────────────────────── */
/**
 * v1.93（v1.92 audit P2-2 修）：独立 finale 夜空 backdrop。脱离 §2.B 地球场景
 * 的"延续 dark olive starfield"基调，按 finale 自身的视觉意图重设：
 *   - 全屏 mesh 用径向渐变 shader：中心深邃午夜蓝（#070a1c），向外渐淡到墨黑
 *   - 加微弱 fbm 让"色相不死板"，像真实夜空有云层 / 银河晕；强度极低不抢
 *     主体
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
    // 径向渐变：中心稍亮深蓝，向外快速归零接近墨黑
    vec3 inner  = vec3(0.027, 0.039, 0.110); // #070a1c 深邃午夜蓝
    vec3 outer  = vec3(0.012, 0.016, 0.030); // 接近墨黑
    vec3 col    = mix(inner, outer, smoothstep(0.0, 1.0, r));
    // 微弱 fbm 加云层 / 银河晕（强度 0.012，不抢主体）
    float n     = noise2(vUv * 4.0) * 0.7 + noise2(vUv * 12.0) * 0.3;
    col        += (n - 0.5) * 0.012;
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
 * v1.93（v1.92 audit P2-4 修）：星点池 1500 颗，按 progress 分批 reveal。
 *
 * 视觉契约（v1.92 audit）："碎片化作星尘，成为星空的一部分"——每张照片
 * dissolve 时贡献 ~100 颗永久星点。具体实现：
 *   - 池子 1500 颗，hash-rand 分布；每颗带 (size, brightness) 随机变量
 *   - uniform `uReveal` 0..1 控制有多少比例可见；vertexShader 根据
 *     attribute aRevealAt 决定可见性（0..1 排序后均匀分布）
 *   - globalProgress 0..1 → uReveal 从 base (0.06，hash 落点首屏的初始稀疏星点)
 *     到 1.0；photo i dissolve 完成时 uReveal ≈ (i+1)/N
 *   - 视觉上：访客滚到第 5 张时星点已是 5/15 ≈ 33% 满，且永远不再消失
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
    gl_PointSize = aSize * visible * (320.0 / -mv.z);
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
  const N_STARS = 1500;
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
      // 球面外推 + 矩形分布混合：大部分星点在 viewport 范围内 ±1.2 宽 / ±0.8 高
      // z 拉远到 -3..-6 给视差感
      positions[i * 3] = (rand() - 0.5) * 7;
      positions[i * 3 + 1] = (rand() - 0.5) * 5;
      positions[i * 3 + 2] = -3 + rand() * -3;
      // 80% 小星 (1-2 px) + 20% 大星 (3-5 px) + 极少数 7-10 px 亮星
      const r = rand();
      if (r < 0.8) sizes[i] = 1.0 + rand() * 1.0;
      else if (r < 0.97) sizes[i] = 3.0 + rand() * 2.0;
      else sizes[i] = 7.0 + rand() * 3.0;
      brightness[i] = 0.45 + rand() * 0.55;
      // revealAt 按"已 dissolve 的照片数"映射到 [0..1]：
      // 第 0..0.06 是 hash landing 首屏即可见的"基础天空"
      // 第 i 张 dissolve 期 (life 0.62..1.0 → globalProgress 段) 把 ~100 颗 reveal
      revealAt[i] = i < 90 ? rand() * 0.06 : 0.06 + rand() * 0.94;
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
  // progress 直接驱动 uReveal；初始 0.06 给 hash landing 首屏一些星点
  const matRef = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    if (matRef.current) {
      const u = matRef.current.uniforms["uReveal"];
      if (u) u.value = Math.max(0.06, Math.min(1, progress + 0.06));
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
  // 限制活跃集合到 3 张避免初次 hydrate 就请求 15 × ~200KB = ~3MB 图片。
  // currentI 跟 globalProgress 走，自动 swap：滚到第 5 张时活跃 = [3, 4, 5, 6]，
  // 再滚 [4, 5, 6, 7] ……
  const ACTIVE_RANGE = 1;
  const currentI = Math.min(N - 1, Math.max(0, Math.floor(globalProgress * N)));
  const activeIndices: number[] = [];
  for (let i = currentI - ACTIVE_RANGE; i <= currentI + ACTIVE_RANGE; i += 1) {
    if (i >= 0 && i < N) activeIndices.push(i);
  }

  return (
    <>
      <ProgressInvalidator progress={globalProgress} />
      <NightSkyBackground />
      <StarField progress={globalProgress} />
      {activeIndices.map((i) => {
        const photo = FINALE_PHOTO_SEQUENCE[i];
        if (!photo) return null;
        // v0.3（v1.91 audit P2-2 修）：lifecycle 除以 LIFE_DURATION = 1.4，
        // 相邻两张 photo 在 1/N 步内有 0.4/N 视觉重叠（i EXIT + i+1 ENTER 同屏）
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
    if (scrollable <= 0) return 1;
    const scrolled = Math.max(0, -rect.top);
    return Math.min(1, scrolled / scrollable);
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reducedMotion) {
      setProgress(1); // 终态定格
      return;
    }
    let raf = 0;
    const compute = () => {
      raf = 0;
      // v0.2（v1.90 audit P2-1 修）：progress 源是 .finale-beat 700vh scroll
      // spacer，不是 React 岛自身（旧 parentElement = hydrated 岛 = 100vh 内层
      // sticky stage，结果 progress 一次 wheel 就 0→1 跳过走马灯）
      const root =
        containerRef.current?.closest<HTMLElement>(".finale-beat") ?? null;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // root.top 在视口底（rect.top = vh）→ progress 0
      // root.bottom 离开视口底 → progress 1
      const scrollable = rect.height - vh;
      if (scrollable <= 0) {
        setProgress(1);
        return;
      }
      const scrolled = Math.max(0, -rect.top);
      setProgress(Math.min(1, scrolled / scrollable));
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
    >
      <Canvas
        camera={{ position: [0, 0, 3.4], fov: CAMERA_FOV }}
        // v0.3（v1.91 audit P2-3 修）：frameloop 全模式 demand —— 普通模式 v1.91
        // 是 "always" 让 GPU 每帧空跑（progress 不变也写一遍 uniform）；现在 demand
        // + ProgressInvalidator 在 progress 变时显式 invalidate()，idle 期间 0 CPU/GPU
        frameloop="demand"
        // v0.2 alpha=false 不透明；v1.93 clearColor 改为 finale 独立设计的
        // 深邃午夜蓝 #06091a（与 NightSkyBackground 着色器内圈色一致），
        // 脱离 §2.B 地球场景沿用的 #1d1d18 dark olive 调性
        gl={{ antialias: true, alpha: false }}
        onCreated={({ gl }) => {
          gl.setClearColor("#06091a", 1);
        }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneInner globalProgress={progress} reducedMotion={reducedMotion} />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default StarCarouselFinale;
