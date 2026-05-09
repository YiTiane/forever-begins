/**
 * GlobeDistanceScene.tsx · §2.B 唯一 3D 地球场景（v1.0 · v1.87 multi-route travel network）
 *
 * v1.0 新增（v1.87 进入 §2.C 前审计修）：
 *   - routes[] 支持全部共同去过地点的球面连线：重庆↔乌鲁木齐、重庆↔合肥、
 *     杭州↔合肥、乌鲁木齐↔合肥、乌鲁木齐↔新加坡，以及 primary 主线
 *     乌鲁木齐↔墨尔本
 *   - primary 主线用更粗 TubeGeometry + 高亮 honey 呼吸 opacity，强调"最远距离"；
 *     secondary 路线用暖白细线常显；不复用地图 sage 绿，避免线和大陆轮廓混在一起
 *   - endpoint 去重：所有城市标点；primary 两端保留柔和金色脉冲，其余城市用
 *     小号纸白点，避免视觉过载
 *
 * v0.9 新增（v1.81 修宽屏 Globe 审计）：
 *   - **<Globe> 贴图改用 Natural Earth 1:110m land polygons**：browser-side
 *     canvas 直接绘制标准经纬数据集，不标国家、不画国界，只保留大陆 / 海岸
 *     轮廓。乌鲁木齐与墨尔本端点现在与中国 / 澳大利亚大陆轮廓共享同一
 *     lon/lat 坐标系，避免 v1.80 手绘近似多边形的落点可信度不足。
 *
 * v0.7 新增（v1.79 修 v1.78 audit P2-3 globe card overlay）：
 *   - GlobeBeat 把 stage 从 grid 1×1 overlay 改成 `grid-template-rows: 1fr auto`。
 *     canvas 独占第一行，文字卡独占第二行，卡片不再压在球面上。
 *   - 因为 safe zone 由 Astro 外壳布局解决，v1.77 的 camera/OrbitControls target
 *     Y 偏移已撤销：ResponsiveCamera 只求 z，camera.y=0，OrbitControls target
 *     回到世界原点。拖拽 orbit 围绕地球中心，手感更自然。
 *
 * v0.4 新增（v1.74 修 v1.73 audit P3，v1.75 收口契约）：
 *   - Endpoint useFrame 改用本地 elapsedRef 累加 dt，不再读 state.clock —— Three.js
 *     0.184 把 THREE.Clock 进 deprecated（推荐 THREE.Timer），原 .getElapsedTime()
 *     调用每帧都把 dep warning 写到 console；改本地 ref 累加 → 本组件不再产生 warn
 *   - **v1.75 claim 收紧**：本修复仅消除"业务代码调用 state.clock 触发的 dep warn"。
 *     three / @react-three/fiber / drei 自身仍可能在 Canvas 内部 new THREE.Clock()，
 *     hydrate 时浏览器 console 仍可能看到一次同款 dep warn —— 这不是本组件可
 *     直接修的范围，而是 upstream 升级到使用 THREE.Timer 的事。等 R3F / drei
 *     升新版后该 warn 自然消除；当前不做 console.warn 拦截 monkey-patch（会
 *     连带屏蔽其它有用 warn）
 *
 * 视觉契约（DESIGN §2.B · v2.21）：
 *   - 球体：深墨绿/纸白低饱和；v1.81 暂用 Natural Earth canvas landmask 贴图（2K 水彩贴图
 *     `globe-watercolor-2k.jpg` 在 misc CDN 仓 Phase 3 上线后切到 useTexture）
 *   - 端点：乌鲁木齐 / 墨尔本，柔和金色脉冲（不用红色 pin）
 *   - 弧线：primary 乌 → 墨随 progress 0→1 绘制并呼吸；secondary 路线常显为细线
 *   - 数字：与弧线同步 CountUp（在 GlobeBeat.astro 外壳渲染）
 *   - 交互：桌面鼠标轻微拖拽（OrbitControls 阻尼 + 限位）；移动端自动慢速旋转
 *   - reduced motion：跳过自旋 / 弧线动画，渲染完整终态 + frameloop=demand
 *
 * v0.3 新增（v1.73 修 v1.72 audit P2 reduced-motion 仍跑 WebGL 帧循环）：
 *   - **Canvas frameloop 跟 reducedMotion 走**："always"（普通）vs "demand"
 *     （reduced-motion）。demand 模式 rAF 不再常驻 → 静态终态期间 GPU/CPU
 *     工作量降到接近 0；只在 invalidate() 显式触发时重绘（OrbitControls
 *     change / ResponsiveCamera resize / mq.change 都会触发）
 *   - **Endpoint reduced-motion 不再每帧写同样静态值**：原 useFrame 每帧
 *     写 halo scale=1.4 / opacity=0.55；改 useEffect 只跑一次设定终态，
 *     useFrame body 第一行 if (reducedMotion) return —— 即便 frameloop 出 bug
 *     回到 always，也不会重复 work
 *   - **reducedMotion 用 lazy initializer 同步读 matchMedia**：useState 初值
 *     就是 mq.matches，确保首次 Canvas 渲染就用正确的 frameloop 值（旧实现
 *     useEffect 异步赋值导致挂载瞬间仍跑了一次 60fps rAF）
 *
 * v0.2（v1.72 audit 视觉诉求修）：ResponsiveCamera 按 canvas aspect 求 z，
 *   保证 globe 在 1920/1366/768/360 各 viewport 都填到约束维度的 82%
 *
 * v0.1（v1.71 batch 7）落地：geometry / endpoints / arc / progress-driven
 *   draw / OrbitControls / reduced-motion fallback（首版）；**deferred to v0.4+**：
 *   - `globe-watercolor-2k.jpg` 真贴图（misc CDN 仓需 Phase 3 资产 push）
 *   - Bloom + Vignette + ToneMapping postprocessing（DESIGN 提的 halo 视感）
 *   - 高密度 GPU 粒子星尘
 *
 * 客户端边界：本组件仅在 client:visible 加载（GlobeBeat.astro 包），不在 SSR
 * 跑；R3F / drei 使用 useThree / useFrame 等 hook 不能在 server 边界出现。
 */

import * as React from "react";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

import {
  type LatLng,
  type Vec3,
  greatCircleArc,
  latLngToVec3,
} from "@/lib/story/globe";
import { NATURAL_EARTH_LAND_110M } from "@/lib/story/naturalEarthLand110m";

/** 单位球半径（场景内部刻度） */
const GLOBE_RADIUS = 1;
/** 端点 marker 球半径（相对地球） */
const ENDPOINT_RADIUS = GLOBE_RADIUS * 0.018;
/** 弧线抬高（相对地球半径） */
const ARC_LIFT = GLOBE_RADIUS * 0.16;
/** 弧线分段数（决定圆滑度） */
const ARC_SEGMENTS = 96;

interface GlobeProps {
  /** 起点（如 乌鲁木齐） */
  from: LatLng;
  /** 终点（如 墨尔本） */
  to: LatLng;
  /** 全部旅行连线；未传时 fallback 为 from→to 主线 */
  routes?: readonly GlobeRoute[] | undefined;
  /** 0..1：滚动 / 入场进度，驱动弧线绘制与 endpoint 脉冲强度。
   *  reduced-motion 模式下父组件应钉到 1。 */
  progress: number;
  /** prefers-reduced-motion 是否生效（父组件实测后传） */
  reducedMotion: boolean;
}

export interface NamedLatLng extends LatLng {
  name: string;
}

export interface GlobeRoute {
  from: NamedLatLng;
  to: NamedLatLng;
  kind?: "primary" | "secondary";
}

/* ─────────────────────── 辅助：颜色常量 ─────────────────────── */
/** sage 绿（DESIGN 主色） · oklch ~ 0.55 0.05 145 */
const COLOR_SAGE = new THREE.Color("#3f5e3f");
/** 暗 sage（球体本色，比 sage 更深更哑） */
const COLOR_GLOBE = new THREE.Color("#27392c");
/** 纸白 highlight */
const COLOR_PAPER = new THREE.Color("#f5f0e6");
/** honey 蜜色（端点光晕 / 文案同源） */
const COLOR_HONEY = new THREE.Color("#c69d4e");
/** primary route：在深绿地图上保持最高对比的明亮蜜金 */
const COLOR_ROUTE_PRIMARY = new THREE.Color("#ffd45a");
/** secondary route：暖白线，比地图 land/coast 更亮，避免与 sage 绿混色 */
const COLOR_ROUTE_SECONDARY = new THREE.Color("#fff1b8");
const GLOBE_HASH_LANDING_PROGRESS = 0.22;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function readInitialGlobeProgress(): number {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return 0;
  }
  const beat = document.querySelector<HTMLElement>(".globe-beat");
  const raw = beat?.dataset.initialProgress ?? beat?.dataset.progress;
  if (raw) {
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed)) return clamp01(parsed);
  }
  if (window.location.hash === "#beat-11-heading") {
    return GLOBE_HASH_LANDING_PROGRESS;
  }
  return 0;
}

/* ─────────────────────── Globe sphere ─────────────────────── */
type GeoPoint = readonly [lng: number, lat: number];

/**
 * Three.js SphereGeometry 的 UV 与常规 equirectangular x=(lng+180)/360 相反：
 * 当前 latLngToVec3 约定下，球面点 lng=90°E 位于 camera 正面 +Z，而
 * SphereGeometry 对应的 u≈0.25。因此贴图必须用 x=(180-lng)/360，才能让
 * 乌鲁木齐 / 墨尔本 marker 与中国 / 澳大利亚大陆轮廓准确重合。
 */
function projectLngToX(lng: number, width: number): number {
  const normalized = (((180 - lng) % 360) + 360) % 360;
  return (normalized / 360) * width;
}

function drawLandPath(
  ctx: CanvasRenderingContext2D,
  points: readonly GeoPoint[],
  width: number,
  height: number,
): void {
  if (points.length === 0) return;
  const project = ([lng, lat]: GeoPoint): [number, number] => [
    projectLngToX(lng, width),
    ((90 - lat) / 180) * height,
  ];
  const first = points[0];
  if (!first) return;
  const [startX, startY] = project(first);
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  for (let i = 1; i < points.length; i += 1) {
    const point = points[i];
    const next = points[(i + 1) % points.length];
    if (!point || !next) continue;
    const [x, y] = project(point);
    const [nextX, nextY] = project(next);
    ctx.quadraticCurveTo(x, y, (x + nextX) / 2, (y + nextY) / 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawMapTexture(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
): void {
  ctx.fillStyle = "#172b23";
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.strokeStyle = "rgba(245, 240, 230, 0.05)";
  ctx.lineWidth = 1;
  for (let lng = -150; lng <= 180; lng += 30) {
    const x = projectLngToX(lng, width);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let lat = -60; lat <= 60; lat += 30) {
    const y = ((90 - lat) / 180) * height;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.shadowColor = "rgba(198, 157, 78, 0.22)";
  ctx.shadowBlur = 9;
  ctx.fillStyle = "#6f9360";
  ctx.strokeStyle = "rgba(224, 194, 114, 0.4)";
  ctx.lineWidth = 1.15;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  for (const ring of NATURAL_EARTH_LAND_110M) {
    drawLandPath(ctx, ring, width, height);
  }
  ctx.restore();

  ctx.save();
  ctx.globalCompositeOperation = "soft-light";
  for (let i = 0; i < 1800; i += 1) {
    const x = (i * 37) % width;
    const y = (i * 71) % height;
    const alpha = 0.015 + ((i * 17) % 23) / 1400;
    ctx.fillStyle = `rgba(245, 240, 230, ${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

function createGlobeTexture(): THREE.CanvasTexture | undefined {
  if (typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  drawMapTexture(ctx, canvas.width, canvas.height);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * v0.9（v1.81 修宽屏 Globe 审计）：用 Natural Earth 1:110m land polygons
 * 生成 equirectangular landmask 贴图。不标国家、不画国界；只把标准大陆 /
 * 海岸线轮廓作为球体纹理，让乌鲁木齐 / 墨尔本端点能落在可信的中国 /
 * 澳大利亚大陆形状附近。Phase 3 push `globe-watercolor-2k.jpg` 后，这套
 * createGlobeTexture 一行换成 `useTexture(...)` 即可下线。
 */
function Globe(): React.ReactElement {
  const texture = useMemo(() => createGlobeTexture(), []);
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.85,
      metalness: 0.05,
      emissive: COLOR_SAGE,
      emissiveIntensity: 0.05,
    });
    if (texture) {
      mat.map = texture;
      mat.needsUpdate = true;
    }

    return mat;
  }, [texture]);

  // mat dispose on unmount 防内存泄漏
  useEffect(() => {
    return () => {
      material.dispose();
      texture?.dispose();
    };
  }, [material, texture]);

  return (
    <mesh material={material}>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
    </mesh>
  );
}

/* ─────────────────────── Endpoint marker ─────────────────────── */
interface EndpointProps {
  position: Vec3;
  /** 0..1：弧 progress；用来同步 endpoint 脉冲强度（progress=0 时无脉冲） */
  progress: number;
  reducedMotion: boolean;
  featured?: boolean;
}

function Endpoint({
  position,
  progress,
  reducedMotion,
  featured = false,
}: EndpointProps): React.ReactElement {
  const haloRef = useRef<THREE.Mesh>(null);
  const dotRef = useRef<THREE.Mesh>(null);
  /**
   * v0.4（v1.73 audit P3 修，v1.75 audit P3 收紧 / v1.76 局部注释同步）：
   * 本地累计 elapsed time，不读 state.clock。Three.js 0.184 起 THREE.Clock
   * 进入 deprecated（推荐 THREE.Timer），R3F 内部仍把 state.clock 暴露在
   * useFrame 回调里。改本地 ref 累加 useFrame 回调第二参数 dt（秒）→ **本
   * 组件业务代码不再调用 state.clock.getElapsedTime()**，因此本组件不再产
   * 生 dep warn。
   *
   * **v1.75 起 claim 收紧（v1.76 同步本注释）**：three / @react-three/fiber /
   * drei 自身在 Canvas 内部仍可能 new THREE.Clock()，hydrate 时浏览器 console
   * 仍可能看到一次同款 dep warn —— 这不是本组件可直接修的范围。等 R3F /
   * drei 升新版后该 warn 自然消除；当前不做 console.warn 拦截 monkey-patch
   * （会连带屏蔽其它有用 warn）。pulse 节奏 0 改变。
   */
  const elapsedRef = useRef(0);

  /**
   * v0.3（v1.72 audit P2 修）：reduced-motion 不再每帧写同样的静态值。
   * 旧实现：useFrame 每帧检查 reducedMotion，若是则把 halo scale/opacity 写
   * 到同样的常量；R3F 默认 frameloop=always 仍然在 60fps 调用，搭配 Canvas
   * 的 GPU 重绘 → reduced-motion 用户每秒仍跑 ~60 次 rAF + WebGL 提交，
   * 违反"不要做不必要的工作"。
   * 新实现：reduced-motion → useEffect 只跑一次写静态终态；useFrame 在
   * reducedMotion 分支提前 return，**完全不进每帧 work**。SceneInner 还会
   * 把 Canvas frameloop 切到 "demand"，多重保险。
   */
  useEffect(() => {
    if (!reducedMotion || !featured) return;
    // 静态终态：halo 钉在最大 1.4 倍 + 0.55 不透明；dot 钉 0.85
    if (haloRef.current) {
      haloRef.current.scale.setScalar(1.4);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = 0.55;
    }
    if (dotRef.current) {
      const dotMat = dotRef.current.material as THREE.MeshBasicMaterial;
      dotMat.opacity = 0.85;
    }
  }, [reducedMotion]);

  useFrame((_state, dt) => {
    if (!featured) return;
    // reduced-motion：完全跳过每帧 work（静态终态由 useEffect 一次性写入）
    if (reducedMotion) return;
    // v0.4：dt 以秒计；累加到本地 ref 不读 state.clock（避 THREE.Clock dep warn）
    elapsedRef.current += dt;
    // 1.4 Hz 心跳脉冲；progress 从 0→1 决定亮度峰值
    const pulse = 0.5 + 0.5 * Math.sin(elapsedRef.current * 2 * Math.PI * 1.4);
    const peak = 0.3 + 0.55 * progress;
    if (haloRef.current) {
      haloRef.current.scale.setScalar(1 + pulse * 0.6);
      const mat = haloRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = pulse * peak;
    }
    if (dotRef.current) {
      const dotMat = dotRef.current.material as THREE.MeshBasicMaterial;
      dotMat.opacity = 0.85 + 0.15 * pulse;
    }
  });

  // 把 marker 沿球面法线方向稍微外推，脱离地表 z-fighting
  const normal = useMemo<Vec3>(() => {
    const r = Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2);
    return [position[0] / r, position[1] / r, position[2] / r];
  }, [position]);
  const offset = ENDPOINT_RADIUS * 0.6;
  const placed: Vec3 = [
    position[0] + normal[0] * offset,
    position[1] + normal[1] * offset,
    position[2] + normal[2] * offset,
  ];

  const markerRadius = featured ? ENDPOINT_RADIUS : ENDPOINT_RADIUS * 0.76;

  return (
    <group position={placed}>
      {/* 实心点 */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[markerRadius, 16, 16]} />
        <meshBasicMaterial
          color={featured ? COLOR_ROUTE_PRIMARY : COLOR_ROUTE_SECONDARY}
          transparent
          opacity={featured ? 0.92 : 0.82}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      {/* halo 环 —— 用一个稍大透明球模拟 bloom（postprocessing 接入前的 fallback） */}
      {featured && (
        <mesh ref={haloRef}>
          <sphereGeometry args={[ENDPOINT_RADIUS * 2.4, 16, 16]} />
          <meshBasicMaterial
            color={COLOR_HONEY}
            transparent
            opacity={0.45}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

/* ─────────────────────── Arc line ─────────────────────── */
interface ArcProps {
  from: Vec3;
  to: Vec3;
  /** 0..1：截断点（progress<1 时只画 from→from+progress·arcLength） */
  progress: number;
  kind: "primary" | "secondary";
  reducedMotion: boolean;
}

function Arc({
  from,
  to,
  progress,
  kind,
  reducedMotion,
}: ArcProps): React.ReactElement {
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const elapsedRef = useRef(0);
  const points = useMemo<Vec3[]>(
    () => greatCircleArc(from, to, ARC_SEGMENTS, ARC_LIFT, GLOBE_RADIUS),
    [from, to],
  );

  // 主线按 progress 绘制；其它路线作为已走过的路径常显，避免多条线同时扫动造成噪声。
  const drawProgress =
    kind === "primary" && !reducedMotion ? Math.max(0.04, progress) : 1;
  const drawn = Math.max(2, Math.ceil(points.length * drawProgress));
  const sliced = points.slice(0, drawn);

  const geometry = useMemo<THREE.TubeGeometry>(() => {
    const curve = new THREE.CatmullRomCurve3(
      sliced.map((point) => new THREE.Vector3(point[0], point[1], point[2])),
    );
    const radius = kind === "primary" ? 0.01 : 0.0042;
    const radialSegments = kind === "primary" ? 12 : 8;
    return new THREE.TubeGeometry(
      curve,
      Math.max(8, sliced.length - 1),
      radius,
      radialSegments,
      false,
    );
  }, [kind, sliced]);

  // 释放旧 geometry 防内存泄漏
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  useFrame((_state, dt) => {
    if (kind !== "primary" || reducedMotion) return;
    const mat = materialRef.current;
    if (!mat) return;
    elapsedRef.current += dt;
    // 主线呼吸更明确，突出"最长距离"；频率低，避免变成刺眼闪烁。
    const next = 0.74 + 0.26 * Math.sin(elapsedRef.current * 2 * Math.PI * 0.9);
    mat.opacity = next;
  });

  return (
    <mesh>
      <primitive attach="geometry" object={geometry} />
      <meshBasicMaterial
        ref={materialRef}
        color={kind === "primary" ? COLOR_ROUTE_PRIMARY : COLOR_ROUTE_SECONDARY}
        transparent
        opacity={kind === "primary" ? 0.98 : 0.78}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ─────────────────────── Auto-rotate group ─────────────────────── */
interface AutoRotateProps {
  enabled: boolean;
  /** rad/sec */
  speed: number;
  children: React.ReactNode;
}

function AutoRotate({
  enabled,
  speed,
  children,
}: AutoRotateProps): React.ReactElement {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_state, dt) => {
    if (!enabled) return;
    if (groupRef.current) {
      groupRef.current.rotation.y += speed * dt;
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

/* ─────────────────────── Responsive camera ─────────────────────── */
/** 相机垂直 fov（与 <Canvas camera={{ fov: ... }}> 一致；改这里要同步两处） */
const CAMERA_FOV = 38;
/** globe 在 canvas 上"目标占满"的比例（沿约束维度量，约束维度 = min(canvas w, h)） */
const GLOBE_FILL_FRACTION = 0.82;

/**
 * v0.2（v1.71 audit 视觉诉求修）：让 camera.position.z 跟着 canvas aspect 自适应。
 *
 * 原 Canvas camera={{ position: [0,0,3.2], fov:38 }} 是固定 z；垂直 fov 不变 →
 * 球的"垂直像素占比"恒定 = canvasH × const，不随 canvas 宽变化。窄 canvas
 * （aspect<1，竖屏 / 小窗）下球会被横向裁，宽 canvas (aspect>>1) 下球只填中央
 * 一小块，左右大段空白。
 *
 * 这里按 aspect 显式求解 z：
 *   - 约束维度 = min(canvas w, h)；目标 globe 直径 = GLOBE_FILL_FRACTION × 约束维度
 *   - 垂直 frustum 半高 = z · tan(fov/2)；水平 frustum 半宽 = z · tan(fov/2) · aspect
 *   - aspect ≥ 1（宽 canvas）：约束 = height → z = R / (fillFraction · tan(fov/2))
 *   - aspect <  1（窄 canvas）：约束 = width  → z = R / (aspect · fillFraction · tan(fov/2))
 *
 * 实测影响：
 *   - 1920×1080 (aspect=1.78)：z ≈ 3.55，globe 占垂直 82%（与 1.7 同款占比，
 *     但水平不再"被左右大段空白稀释"——同样的视觉权重）
 *   - 1366×768  (aspect=1.78)：同上 z ≈ 3.55
 *   - 768×1024  (aspect=0.75)：z ≈ 4.73，globe 占水平 82%、垂直 ~62%（窄屏
 *     不再贴边裁）
 *   - 360×800   (aspect=0.45)：z ≈ 7.89，globe 占水平 82%、垂直 ~37%
 */
function ResponsiveCamera(): null {
  const { camera, size, invalidate } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const tanHalfFov = Math.tan((CAMERA_FOV * Math.PI) / 360);
    const z =
      aspect >= 1
        ? GLOBE_RADIUS / (GLOBE_FILL_FRACTION * tanHalfFov)
        : GLOBE_RADIUS / (aspect * GLOBE_FILL_FRACTION * tanHalfFov);
    camera.position.z = z;
    // v0.7（v1.79 修 v1.78 audit P2-3 后续清理）：camera Y 偏移（v0.5 的
    // -0.14R）已不再需要 —— GlobeBeat 改 grid auto-rows 后 globe canvas 与
    // 文字卡分两行，不再 overlay；canvas 区内 globe 居中即可，无需保留底部
    // 安全区。OrbitControls target 一同回到 (0,0,0)（在 SceneInner 处理）。
    camera.position.y = 0;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
    // v0.3（v1.72 audit P2 修）：frameloop="demand" 模式下 camera 改动需要主动
    // 通知 R3F 渲染一次；frameloop="always" 时 invalidate() 是 no-op
    invalidate();
  }, [camera, size.width, size.height, invalidate]);
  return null;
}

/* ─────────────────────── Scene root ─────────────────────── */
function SceneInner({
  from,
  to,
  routes,
  progress,
  reducedMotion,
}: GlobeProps): React.ReactElement {
  const allRoutes = useMemo<GlobeRoute[]>(() => {
    if (routes && routes.length > 0) return [...routes];
    return [
      {
        from: { name: "from", ...from },
        to: { name: "to", ...to },
        kind: "primary",
      },
    ];
  }, [from, routes, to]);

  const routeVectors = useMemo(
    () =>
      allRoutes.map((route) => ({
        ...route,
        kind: route.kind ?? "secondary",
        fromV: latLngToVec3(route.from, GLOBE_RADIUS),
        toV: latLngToVec3(route.to, GLOBE_RADIUS),
      })),
    [allRoutes],
  );

  const endpointVectors = useMemo(() => {
    const map = new Map<
      string,
      { position: Vec3; featured: boolean; name: string }
    >();
    for (const route of routeVectors) {
      const kind = route.kind ?? "secondary";
      for (const [place, position] of [
        [route.from, route.fromV],
        [route.to, route.toV],
      ] as const) {
        const key = `${place.name}:${place.lat.toFixed(4)},${place.lng.toFixed(4)}`;
        const previous = map.get(key);
        map.set(key, {
          name: place.name,
          position,
          featured: previous?.featured === true || kind === "primary",
        });
      }
    }
    return Array.from(map.values());
  }, [routeVectors]);

  /**
   * v0.7（v1.79 修 v1.78 audit P2-3 后续清理）：相机 / target Y 偏移已撤销。
   *
   * 历史背景（保留这段供后人理解决策链）：
   * - v0.5 (v1.77) 把相机 + OrbitControls target Y 一起下移 0.14R 给文字浮卡
   *   留底部安全区。问题：globe 与 card 仍同处 grid 1×1 overlay，卡片背板
   *   仍切球面下缘
   * - v0.7 (v1.79)：GlobeBeat 改 grid auto-rows（canvas 1fr / card auto）后，
   *   globe canvas 与文字卡分两行不 overlay → 不需要在 3D 场景里预留底部空
   *   间。相机回到 (0, 0, z)，OrbitControls target 回到 (0, 0, 0)，globe
   *   居中渲染于 canvas 区
   * - 优势：拖拽 orbit 围绕世界原点，globe 在中心居中，是最自然的体验
   */

  // 自动慢转：reduced-motion 关掉；桌面也关掉（OrbitControls 接管）；
  // 移动端 / 触摸设备自动转（这里简单按"无 hover 能力"判断，运行时实测）
  const [autoRotate, setAutoRotate] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reducedMotion) {
      setAutoRotate(false);
      return;
    }
    const mq = window.matchMedia("(hover: none)");
    setAutoRotate(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setAutoRotate(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [reducedMotion]);

  return (
    <>
      <ResponsiveCamera />
      <ambientLight intensity={0.55} color={COLOR_PAPER} />
      <directionalLight
        position={[3, 2, 4]}
        intensity={0.9}
        color={COLOR_PAPER}
      />
      <directionalLight
        position={[-3, -1, -2]}
        intensity={0.25}
        color={COLOR_SAGE}
      />

      {/* globe 留在世界原点；GlobeBeat 外壳用 canvas/text 双行 safe zone
          避免文字卡压球，3D 场景自身保持居中便于拖拽 */}
      <AutoRotate enabled={autoRotate} speed={0.06}>
        <Globe />
        {routeVectors.map((route) => (
          <Arc
            key={`${route.from.name}-${route.to.name}-${route.kind}`}
            from={route.fromV}
            to={route.toV}
            kind={route.kind}
            progress={progress}
            reducedMotion={reducedMotion}
          />
        ))}
        {endpointVectors.map((endpoint) => (
          <Endpoint
            key={`${endpoint.name}-${endpoint.position.join(",")}`}
            position={endpoint.position}
            progress={progress}
            reducedMotion={reducedMotion}
            featured={endpoint.featured}
          />
        ))}
      </AutoRotate>

      {/* 桌面拖拽：限制 polar angle 让用户不能把球倒过来；阻尼让回弹自然。
          reduced-motion 时仍允许"无动量"的拖拽（不依赖 spring 动画）。
          v0.7（v1.79）：target 回到世界原点，配合 GlobeBeat grid auto-rows
          文字卡不再 overlay 的新布局 */}
      <OrbitControls
        target={[0, 0, 0]}
        enableZoom={false}
        enablePan={false}
        enableDamping={!reducedMotion}
        dampingFactor={0.08}
        rotateSpeed={0.4}
        minPolarAngle={Math.PI * 0.28}
        maxPolarAngle={Math.PI * 0.72}
      />
    </>
  );
}

/* ─────────────────────── Public canvas wrapper ─────────────────────── */
export interface GlobeDistanceSceneProps {
  from: LatLng;
  to: LatLng;
  routes?: readonly GlobeRoute[] | undefined;
  /** 滚动进度 0..1（StoryPoemScroller 写到 .globe-beat[data-progress]，
   *  本组件读 dataset 同步到 React state；为简化先内置 IO + scroll listener。 */
  progress?: number;
}

export function GlobeDistanceScene({
  from,
  to,
  routes,
  progress,
}: GlobeDistanceSceneProps): React.ReactElement {
  /**
   * v0.3（v1.72 audit P2 修）：reduced-motion 状态用 lazy initializer 同步读
   * matchMedia，确保第一次 Canvas 渲染就拿到正确的 frameloop 值。
   *
   * 旧实现 useState(false) + 在 useEffect 里 setReducedMotion(mq.matches)：
   *   - 第一帧 frameloop="always" → 即使用户 prefers-reduced-motion，挂载瞬间
   *     仍跑了一次 60fps rAF；
   *   - 后续 setReducedMotion(true) re-render → frameloop 变 "demand"。
   * 新实现：初值就是 mq.matches，整个组件生命周期内只在 mq.change 时切换。
   * 本组件仅在 client:visible 加载，渲染必在浏览器，window 一定可用。
   */
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

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // 内置 progress：父没传时按 .globe-beat scroll spacer 的进度自驱动。
  const [internalProgress, setInternalProgress] = useState(
    readInitialGlobeProgress,
  );
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onForcedProgress = (event: Event) => {
      const detail = (event as CustomEvent<{ progress?: number }>).detail;
      if (typeof detail?.progress !== "number") return;
      setInternalProgress(clamp01(detail.progress));
    };
    window.addEventListener("globe:set-progress", onForcedProgress);
    return () =>
      window.removeEventListener("globe:set-progress", onForcedProgress);
  }, []);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reducedMotion) {
      setInternalProgress(1);
      return;
    }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const root =
        canvasContainerRef.current?.closest<HTMLElement>(".globe-beat") ??
        canvasContainerRef.current;
      if (!root) return;
      const forced =
        root.dataset["initialProgress"] ??
        (window.location.hash === "#beat-11-heading"
          ? root.dataset["progress"]
          : undefined);
      if (forced) {
        const parsed = parseFloat(forced);
        if (!Number.isNaN(parsed)) {
          const targetProgress = clamp01(parsed);
          const rect = root.getBoundingClientRect();
          const vh = window.innerHeight || 1;
          const scrollable = Math.max(0, root.offsetHeight - vh);
          let aligned = true;
          if (scrollable > 0) {
            const desiredTop =
              window.scrollY + rect.top + scrollable * targetProgress;
            if (Math.abs(window.scrollY - desiredTop) > 2) {
              aligned = false;
              window.scrollTo({
                top: Math.max(0, desiredTop),
                behavior: "auto",
              });
            }
          }
          setInternalProgress(targetProgress);
          if (aligned) {
            delete root.dataset["initialProgress"];
            delete root.dataset["progress"];
          }
          return;
        }
      }
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      if (
        window.location.hash === "#beat-11-heading" &&
        Math.abs(rect.top) <= 4
      ) {
        setInternalProgress(GLOBE_HASH_LANDING_PROGRESS);
        return;
      }
      const scrollable = root.offsetHeight - vh;
      if (scrollable > 0) {
        setInternalProgress(clamp01(-rect.top / scrollable));
        return;
      }
      // fallback：非 sticky / 自然高度 viewport 下按元素入场位置估算。
      const start = vh;
      const end = vh * 0.4;
      const raw = (start - rect.top) / Math.max(1, start - end);
      setInternalProgress(clamp01(raw));
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

  const effectiveProgress = reducedMotion ? 1 : (progress ?? internalProgress);

  return (
    <div
      ref={canvasContainerRef}
      className="globe-canvas-root"
      data-progress={effectiveProgress.toFixed(3)}
    >
      <Canvas
        // 初始相机 z 是个 sensible default；ResponsiveCamera 在 useEffect 里
        // 按真实 canvas aspect 重算（v0.2 / v1.72 audit 视觉诉求修）
        camera={{ position: [0, 0, 3.55], fov: CAMERA_FOV }}
        style={{ width: "100%", height: "100%", display: "block" }}
        // v0.3（v1.72 audit P2 修）：reduced-motion → "demand" 帧循环
        // - 普通模式 "always"：60fps rAF 渲染，Endpoint 心跳脉冲 / AutoRotate 慢转都靠它
        // - reduced-motion "demand"：rAF 不再常驻；首帧渲染后只在显式 invalidate()
        //   时才重绘（drei OrbitControls change 事件、ResponsiveCamera resize 都会
        //   主动 invalidate），WebGL/GPU 工作量降到接近 0
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneInner
            from={from}
            to={to}
            routes={routes}
            progress={effectiveProgress}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default GlobeDistanceScene;
