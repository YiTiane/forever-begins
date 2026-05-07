/**
 * StarCarouselFinale.tsx · §2.C 星空照片走马灯（v0.1 · v1.90 batch 8）
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
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import {
  FINALE_PHOTO_SEQUENCE,
  finalePhotoUrl,
  type FinalePhoto,
} from "@/lib/story/finalePhotos";

const CAMERA_FOV = 38;
/** 照片在 canvas 上沿约束维度填充的比例（与 GlobeDistanceScene 同款理念） */
const PHOTO_FILL_FRACTION = 0.78;
/** 每张照片 lifecycle 阶段切分（fraction of own lifecycle） */
const ENTER_END = 0.18;
const HOLD_END = 0.62;
// EXIT: HOLD_END..1.0

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
    if (uDissolve > 0.0) {
      // 双频 noise：低频给"大块剥落"，高频给"细粒星尘"
      float n1 = noise2(vUv * 12.0);
      float n2 = noise2(vUv * 60.0);
      float n  = n1 * 0.6 + n2 * 0.4;
      float edge = uDissolve - n;
      if (edge > 0.0) discard;
      // 边缘带：把 photo.rgb 推向星金色 (1.0, 0.85, 0.55)，模拟"碎片亮成星点"
      if (edge > -0.08) {
        float band = (-edge) / 0.08; // 0 = 边缘最亮 / 1 = 内部本色
        vec3 starGlow = vec3(1.0, 0.86, 0.55);
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
  textureUrl: string;
  /** 0..1 的 lifecycle；< 0 表示还没入场（mesh 隐藏） */
  lifecycle: number;
  isFinal: boolean;
  reducedMotion: boolean;
}

function PhotoPlane({
  photo,
  textureUrl,
  lifecycle,
  isFinal,
  reducedMotion,
}: PhotoPlaneProps): React.ReactElement | null {
  const texture = useTexture(textureUrl);
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
/**
 * 简化版星尘背景：每张照片完成 dissolve 后，少量持久"星点"留在画面背景。
 * v0.1 用 Points geometry + 静态星空，避免 GPU 粒子复杂度（DESIGN 高端机
 * GPU 粒子留 v0.2+）。
 */
function StarField({ progress }: { progress: number }): React.ReactElement {
  const points = useMemo(() => {
    const count = 320;
    const arr = new Float32Array(count * 3);
    // 星点分布在 viewport 6×4 范围内 + 远 z（在照片背后，不抢前景）
    let seed = 17;
    function rand(): number {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    }
    for (let i = 0; i < count; i += 1) {
      arr[i * 3] = (rand() - 0.5) * 6;
      arr[i * 3 + 1] = (rand() - 0.5) * 4;
      arr[i * 3 + 2] = -2 - rand() * 2;
    }
    return arr;
  }, []);

  // R3F 最新版要求 bufferAttribute 用 args 形式：[array, itemSize]
  const positionAttr = useMemo(
    () => new THREE.BufferAttribute(points, 3),
    [points],
  );
  const geometry = useMemo(() => {
    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", positionAttr);
    return geom;
  }, [positionAttr]);
  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <points>
      <primitive attach="geometry" object={geometry} />
      <pointsMaterial
        size={0.012}
        color="#f5f0e6"
        sizeAttenuation
        transparent
        opacity={0.18 + 0.42 * Math.min(1, progress * 1.2)}
        depthWrite={false}
      />
    </points>
  );
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
  return (
    <>
      <ambientLight intensity={0.65} />
      <StarField progress={globalProgress} />
      {FINALE_PHOTO_SEQUENCE.map((photo, i) => {
        const life = globalProgress * N - i;
        const isFinal = i === N - 1;
        const url = finalePhotoUrl(photo);
        return (
          <PhotoPlane
            key={`${photo.cdnTarget}-${photo.stem}`}
            photo={photo}
            textureUrl={url}
            lifecycle={life}
            isFinal={isFinal}
            reducedMotion={reducedMotion}
          />
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
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reducedMotion) {
      setProgress(1); // 终态定格
      return;
    }
    let raf = 0;
    const compute = () => {
      raf = 0;
      const root = containerRef.current?.parentElement;
      if (!root) return;
      const rect = root.getBoundingClientRect();
      const vh = window.innerHeight || 1;
      // root.top 在视口底（rect.top = vh）→ progress 0
      // root.bottom 接近视口底（rect.bottom = vh + rect.height·1）→ progress 1
      // 使用 root.height 与窗口高度的差作为可滚距离
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
        frameloop={reducedMotion ? "demand" : "always"}
        gl={{ antialias: true, alpha: true }}
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
