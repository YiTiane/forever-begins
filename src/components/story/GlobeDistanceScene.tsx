/**
 * GlobeDistanceScene.tsx · §2.B 唯一 3D 地球场景（v0.6 · v1.78 procedural 陆地 + 设计同步）
 *
 * v0.6 新增（v1.78 修 v1.77 audit P2-3 globe 不是地图只是球）：
 *   - **<Globe> 用 onBeforeCompile 注入 procedural fbm 大陆涂层**：MeshStandardMaterial
 *     的 fragment shader 加 4-octave value-noise 和 smoothstep 阈值，object-space
 *     normal → 经纬度 → 通过 cos/sin(lng) 平面投影避 seam，得到 organic 陆地/
 *     海洋斑块。AutoRotate 旋转球时 object-space 不动，"陆地"跟着球转（视觉上
 *     "地球转动陆地不动"，符合直觉）。
 *   - 这是过渡方案：fbm 给的是抽象有机斑块，看起来像水彩大陆涂层而不是真实
 *     地图。Phase 3 push `globe-watercolor-2k.jpg` equirectangular 贴图后，
 *     onBeforeCompile 一行换成 useTexture 即可下线。
 *
 * v0.5 新增（v1.77 修 v1.76 audit P2 globe 端点仍被卡片遮，v1.78 docblock 收口）：
 *   - **wide 模式相机 + OrbitControls target 一起 Y 下移给文字浮卡留底部安全区**：
 *     v1.76 用 CSS margin-bottom 收紧只能把卡片往下推一点点，"fixed margin-bottom
 *     不能跨 viewport 保证端点可见"。
 *   - 实现（v1.78 同步 docblock）：globe 留世界原点 (0,0,0)，**ResponsiveCamera
 *     把 camera.position.y 设为 -0.14 R**（仅 wide）+ <OrbitControls
 *     target={[0, -0.14R, 0]}> 同步偏移；globe 相对 target 永远偏上 → 投影到
 *     canvas 上方。narrow (aspect < 1) y=0 不偏移
 *   - 拖拽手感：OrbitControls 围绕 target 做 orbit，globe 在世界原点不动 →
 *     相对 target 永远偏上 → 拖拽期间 globe 也保持画面上方，**不破坏拖拽**
 *   - 早期 v1.77 docblock 描述 "SceneInner 包 group position 把 globe 整体
 *     上移"是**未采用的方案**（group 上移会让 globe 中心 = OrbitControls
 *     target，反而 centered 不偏移），实际实现是相机 / target 偏移、globe 留
 *     世界原点。v1.78 修 v1.77 audit P3 把这段 docblock 同步到真实实现
 *   - 实测（1920×1080 wide）：Melbourne y_world = -0.61；相对 target (0, -0.14, 0)
 *     的 y = -0.47；NDC ≈ -0.385；canvas y ≈ 692；卡片顶 y ≈ 762，净间距
 *     70px ≫ v1.76 的 8px
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
 *   - 球体：深墨绿/纸白低饱和；v0.x 暂用纯色 + 柔和环境光（2K 水彩贴图
 *     `globe-watercolor-2k.jpg` 在 misc CDN 仓 Phase 3 上线后切到 useTexture）
 *   - 端点：乌鲁木齐 / 墨尔本，柔和金色脉冲（不用红色 pin）
 *   - 弧线：从乌 → 墨的球面大圆弧，sage → honey 渐变；按 progress 0→1 动画
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
/**
 * v0.6（v1.78 修 v1.77 audit P2-3）：globe 表面加 procedural fbm land/ocean
 * 着色，用 onBeforeCompile 把 4-octave value-noise + smoothstep 阈值塞到
 * MeshStandardMaterial 的 fragment shader，没有外部贴图依赖。
 *
 * 用 **object-space normal** 作为 3D 坐标（球的 normal 等于归一化位置），通过
 * sin/cos(longitude) 投影到 2D noise 域 → 经度方向自然 wrap，无 seam；纬度
 * 方向作为额外维度让 fbm 在南北也有变化。AutoRotate 旋转球时 object-space 不
 * 动，"陆地"跟着球转（视觉上"地球转动陆地不动"，符合直觉）。
 *
 * 这是过渡方案，**不是真实大陆地理**：fbm 给的是抽象有机斑块，看起来像水彩
 * 大陆涂层而不是真实地图。Phase 3 push `globe-watercolor-2k.jpg` equirectangular
 * 贴图后，这套 onBeforeCompile 一行换成 `map={useTexture(...)}` 即可下线。
 */
function Globe(): React.ReactElement {
  const material = useMemo(() => {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff, // base 1，乘后由 fragment 内 mix 给真实色
      roughness: 0.85,
      metalness: 0.05,
      emissive: COLOR_SAGE,
      emissiveIntensity: 0.05,
    });

    mat.onBeforeCompile = (shader) => {
      // VERTEX：把 object-space normal 当 varying 传给 fragment
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          `#include <common>
varying vec3 vObjNormal;`,
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
vObjNormal = normal;`,
        );

      // FRAGMENT：注入 hash + value-noise + fbm + 大陆 Gaussian falloff，在
      // color_fragment 后覆写 diffuseColor。
      // v1.79（修 v1.78 audit P2-2）：纯 fbm 给出的是水波/布纹纵向条带，没有
      // 可识别大陆位置。改为：先按 7 个大陆中心 (lat, lng) 做 great-circle
      // distance Gaussian falloff 求"基础 land density"，再叠加低幅度 fbm 给
      // 海岸线 organic noise。这样大陆位置定锚（北美 / 南美 / 欧 / 非 / 亚 /
      // 大洋洲 / 南极），形状是 organic 但锚点对 → 视觉上能读出"地图"。
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
varying vec3 vObjNormal;

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

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * noise2(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

// (lat°, lng°) → 单位球面 Vec3
vec3 latLngToVec3(float latDeg, float lngDeg) {
  float lat = latDeg * 0.017453293; // PI / 180
  float lng = lngDeg * 0.017453293;
  float c = cos(lat);
  return vec3(c * cos(lng), sin(lat), c * sin(lng));
}

// 大陆 blob：great-circle 距离 Gaussian falloff（angularDist^2 / radius^2）
// 用 dot(normal, center)：1 = 同点，-1 = 对偶点；acos 给弧度距离
float continentBlob(vec3 normal, float centerLat, float centerLng, float radiusRad) {
  vec3 center = latLngToVec3(centerLat, centerLng);
  float cosAngle = clamp(dot(normal, center), -1.0, 1.0);
  float angularDist = acos(cosAngle);
  float r = angularDist / radiusRad;
  return exp(-r * r);
}`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
// 7 个大陆 Gaussian 中心（lat°, lng°, 角度半径 radians）：
// 数据来自 NaturalEarth 简化质心 + 视觉验证选定的覆盖半径，
// 不画国界 / 不写国家名，仅给出"陆地位置"的几何锚点
float landDensity = 0.0;
landDensity += continentBlob(vObjNormal,  45.0, -100.0, 0.50); // 北美
landDensity += continentBlob(vObjNormal, -15.0,  -60.0, 0.40); // 南美
landDensity += continentBlob(vObjNormal,  50.0,   15.0, 0.28); // 欧洲
landDensity += continentBlob(vObjNormal,   5.0,   20.0, 0.42); // 非洲
landDensity += continentBlob(vObjNormal,  45.0,   90.0, 0.55); // 亚洲
landDensity += continentBlob(vObjNormal, -25.0,  135.0, 0.30); // 大洋洲
landDensity += continentBlob(vObjNormal, -82.0,    0.0, 0.50); // 南极
// 海岸线 organic noise（低幅度叠加，给海陆边界自然感）
float lat = asin(clamp(vObjNormal.y, -1.0, 1.0));
float lng = atan(vObjNormal.z, vObjNormal.x);
vec2 noiseUv = vec2(cos(lng) * 1.6 + lat * 0.6, sin(lng) * 1.6 + lat * 0.4);
float noiseShift = (fbm(noiseUv * 2.0) - 0.5) * 0.18;
float landScore = landDensity + noiseShift;
float landMask = smoothstep(0.32, 0.45, landScore);
vec3 oceanColor = vec3(0.10, 0.18, 0.14); // 深 sage，海洋
vec3 landColor  = vec3(0.30, 0.44, 0.32); // 中 sage，陆地
diffuseColor.rgb = mix(oceanColor, landColor, landMask);`,
        );
    };

    return mat;
  }, []);

  // mat dispose on unmount 防内存泄漏
  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

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
}

function Endpoint({
  position,
  progress,
  reducedMotion,
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
    if (!reducedMotion) return;
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
  progress,
  reducedMotion,
}: GlobeProps): React.ReactElement {
  // 端点位置（球面）
  const fromV = useMemo<Vec3>(() => latLngToVec3(from, GLOBE_RADIUS), [from]);
  const toV = useMemo<Vec3>(() => latLngToVec3(to, GLOBE_RADIUS), [to]);

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

      {/* globe 留在世界原点；上移效果靠 ResponsiveCamera 把相机 Y 设为负 +
          OrbitControls target 同步设为负，相对位置让 globe 显示在画面上方 */}
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
  /** 滚动进度 0..1（StoryPoemScroller 写到 .globe-beat[data-progress]，
   *  本组件读 dataset 同步到 React state；为简化先内置 IO + scroll listener。 */
  progress?: number;
}

export function GlobeDistanceScene({
  from,
  to,
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
            progress={effectiveProgress}
            reducedMotion={reducedMotion}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}

export default GlobeDistanceScene;
