/**
 * GlobeDistanceScene.tsx · §2.B 唯一 3D 地球场景（v0.1 · v1.71 batch 7）
 *
 * 视觉契约（DESIGN §2.B · v2.21）：
 *   - 球体：深墨绿/纸白低饱和；v0.1 暂用纯色 + 柔和环境光（2K 水彩贴图
 *     `globe-watercolor-2k.jpg` 在 misc CDN 仓 Phase 3 上线后切到 useTexture）
 *   - 端点：乌鲁木齐 / 墨尔本，柔和金色脉冲（不用红色 pin）
 *   - 弧线：从乌 → 墨的球面大圆弧，sage → honey 渐变；按 progress 0→1 动画
 *   - 数字：与弧线同步 CountUp（在 GlobeBeat.astro 外壳渲染）
 *   - 交互：桌面鼠标轻微拖拽（OrbitControls 阻尼 + 限位）；移动端自动慢速旋转
 *   - reduced motion：跳过自旋 / 弧线动画，渲染完整终态
 *
 * v0.1（v1.71 batch 7）落地：geometry / endpoints / arc / progress-driven
 * draw / OrbitControls / reduced-motion fallback；**deferred to v0.2**：
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
  /** 0..1：滚动 / 入场进度，驱动弧线绘制与 endpoint 脉冲强度。
   *  reduced-motion 模式下父组件应钉到 1。 */
  progress: number;
  /** prefers-reduced-motion 是否生效（父组件实测后传） */
  reducedMotion: boolean;
}

/* ─────────────────────── 辅助：颜色常量 ─────────────────────── */
/** sage 绿（DESIGN 主色） · oklch ~ 0.55 0.05 145 */
const COLOR_SAGE = new THREE.Color("#3f5e3f");
/** 暗 sage（球体本色，比 sage 更深更哑） */
const COLOR_GLOBE = new THREE.Color("#27392c");
/** 纸白 highlight */
const COLOR_PAPER = new THREE.Color("#f5f0e6");
/** honey 蜜色（弧线终点 + 端点光晕） */
const COLOR_HONEY = new THREE.Color("#c69d4e");

/* ─────────────────────── Globe sphere ─────────────────────── */
function Globe(): React.ReactElement {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      {/* v0.1 用 standard material；roughness 偏高让漫反射柔和，金属度 0；
          光下偏纸白，背光偏深墨绿 —— 接近水彩 wash 的视觉 fallback。
          texture 接入：将来在此换 <meshStandardMaterial map={texture} ... /> */}
      <meshStandardMaterial
        color={COLOR_GLOBE}
        roughness={0.85}
        metalness={0.05}
        emissive={COLOR_SAGE}
        emissiveIntensity={0.06}
      />
    </mesh>
  );
}

/* ─────────────────────── Endpoint marker ─────────────────────── */
interface EndpointProps {
  position: Vec3;
  /** 0..1：弧 progress；用来同步 endpoint 脉冲强度（progress=0 时无脉冲） */
  progress: number;
  reducedMotion: boolean;
}

function Endpoint({
  position,
  progress,
  reducedMotion,
}: EndpointProps): React.ReactElement {
  const haloRef = useRef<THREE.Mesh>(null);
  const dotRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (reducedMotion) {
      // 静态终态：halo 钉在最大尺寸 + 中等不透明
      if (haloRef.current) {
        haloRef.current.scale.setScalar(1.4);
        const mat = haloRef.current.material as THREE.MeshBasicMaterial;
        mat.opacity = 0.55;
      }
      return;
    }
    // 1.4 Hz 心跳脉冲；progress 从 0→1 决定亮度峰值
    const t = state.clock.getElapsedTime();
    const pulse = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI * 1.4);
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

  return (
    <group position={placed}>
      {/* 实心点 */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[ENDPOINT_RADIUS, 16, 16]} />
        <meshBasicMaterial color={COLOR_HONEY} transparent opacity={0.85} />
      </mesh>
      {/* halo 环 —— 用一个稍大透明球模拟 bloom（postprocessing 接入前的 fallback） */}
      <mesh ref={haloRef}>
        <sphereGeometry args={[ENDPOINT_RADIUS * 2.4, 16, 16]} />
        <meshBasicMaterial
          color={COLOR_HONEY}
          transparent
          opacity={0.45}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

/* ─────────────────────── Arc line ─────────────────────── */
interface ArcProps {
  from: Vec3;
  to: Vec3;
  /** 0..1：截断点（progress<1 时只画 from→from+progress·arcLength） */
  progress: number;
}

function Arc({ from, to, progress }: ArcProps): React.ReactElement {
  const points = useMemo<Vec3[]>(
    () => greatCircleArc(from, to, ARC_SEGMENTS, ARC_LIFT, GLOBE_RADIUS),
    [from, to],
  );

  // 按 progress 截断点数；至少留 2 个点保住 line 几何成立
  const drawn = Math.max(2, Math.ceil(points.length * Math.max(0, progress)));
  const sliced = points.slice(0, drawn);

  // 弧的颜色按沿弧位置 lerp sage → honey；GeometryAttribute "color"
  const geometry = useMemo<THREE.BufferGeometry>(() => {
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(sliced.length * 3);
    const colors = new Float32Array(sliced.length * 3);
    for (let i = 0; i < sliced.length; i += 1) {
      const point = sliced[i];
      if (!point) continue; // noUncheckedIndexedAccess 满足
      positions[i * 3] = point[0];
      positions[i * 3 + 1] = point[1];
      positions[i * 3 + 2] = point[2];
      const t = sliced.length > 1 ? i / (sliced.length - 1) : 0;
      const c = COLOR_SAGE.clone().lerp(COLOR_HONEY, t);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    geom.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geom.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return geom;
  }, [sliced]);

  // 释放旧 geometry 防内存泄漏
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <line>
      <primitive attach="geometry" object={geometry} />
      <lineBasicMaterial vertexColors transparent opacity={0.92} />
    </line>
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
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / Math.max(1, size.height);
    const tanHalfFov = Math.tan((CAMERA_FOV * Math.PI) / 360);
    const z =
      aspect >= 1
        ? GLOBE_RADIUS / (GLOBE_FILL_FRACTION * tanHalfFov)
        : GLOBE_RADIUS / (aspect * GLOBE_FILL_FRACTION * tanHalfFov);
    camera.position.z = z;
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);
  return null;
}

/* ─────────────────────── Scene root ─────────────────────── */
function SceneInner({
  from,
  to,
  progress,
  reducedMotion,
}: GlobeProps): React.ReactElement {
  // 端点位置（球面）
  const fromV = useMemo<Vec3>(() => latLngToVec3(from, GLOBE_RADIUS), [from]);
  const toV = useMemo<Vec3>(() => latLngToVec3(to, GLOBE_RADIUS), [to]);

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

      <AutoRotate enabled={autoRotate} speed={0.06}>
        <Globe />
        <Arc from={fromV} to={toV} progress={progress} />
        <Endpoint
          position={fromV}
          progress={progress}
          reducedMotion={reducedMotion}
        />
        <Endpoint
          position={toV}
          progress={progress}
          reducedMotion={reducedMotion}
        />
      </AutoRotate>

      {/* 桌面拖拽：限制 polar angle 让用户不能把球倒过来；阻尼让回弹自然。
          reduced-motion 时仍允许"无动量"的拖拽（不依赖 spring 动画） */}
      <OrbitControls
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
  /** 滚动进度 0..1（StoryPoemScroller 写到 .globe-beat[data-progress]，
   *  本组件读 dataset 同步到 React state；为简化先内置 IO + scroll listener。 */
  progress?: number;
}

export function GlobeDistanceScene({
  from,
  to,
  progress,
}: GlobeDistanceSceneProps): React.ReactElement {
  // reduced motion：在 client 实测一次，不做反馈循环
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // 内置 progress：父没传时按 element 在视口的进度自驱动（第一版简化）
  const [internalProgress, setInternalProgress] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reducedMotion) {
      setInternalProgress(1);
      return;
    }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const root = canvasContainerRef.current;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // 当 root 顶部从视口底部开始上移到视口中央 = 0→1
      const top = rect.top;
      const start = vh; // 顶部在视口底
      const end = vh * 0.4; // 顶部在视口 40%
      const raw = (start - top) / Math.max(1, start - end);
      const clamped = Math.max(0, Math.min(1, raw));
      setInternalProgress(clamped);
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

  const canvasContainerRef = useRef<HTMLDivElement>(null);
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
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          <SceneInner
            from={from}
            to={to}
            progress={effectiveProgress}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default GlobeDistanceScene;
