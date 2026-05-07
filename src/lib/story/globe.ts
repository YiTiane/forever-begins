/**
 * globe.ts · §2.B GlobeDistanceScene 几何库（v0.1 · v1.71 batch 7）
 *
 * 纯函数库：经纬度 → 单位球面 Vector3 / 大圆弧采样 / 球面距离。
 * 不依赖 React 或 Three.js Vector3 类（虽然下游会把 [x,y,z] 喂给 Three），
 * 让 vitest 能在 Node 环境直接跑断言（未来加测试时无需 mock GL）。
 *
 * 坐标契约（matches Three.js right-handed default + drei 习惯）：
 *   - +Y = 北极
 *   - +X = lng 0°（本初子午线）
 *   - +Z 朝向相机（屏幕外）
 *   - φ = lat (rad)，λ = lng (rad)
 *   - x = R · cos(φ) · cos(λ)
 *   - y = R · sin(φ)
 *   - z = R · cos(φ) · sin(λ)
 *     —— 注意：标准 equirectangular 贴图把 lng=0 → 贴图中心 → 球面 +X 方向。
 *     因此 z = +cos(φ)·sin(λ)（不是 -sin(λ)）。本文件不绑贴图；如果将来接
 *     `globe-watercolor-2k.jpg` equirectangular 贴图发现陆地左右反，就把
 *     z 取反 + 同步换贴图（贴图常见两种 wrap 习惯）。
 *
 * 单位：所有 latLng 入参以 **度** (degrees) 计；半径 / 距离均无单位（你给什么
 * 出什么，1 = 单位球，6371 = 地球公里）。
 */

const DEG_TO_RAD = Math.PI / 180;

/** 球面 3D 点（[x, y, z]）。下游可 `new THREE.Vector3(...point)`。 */
export type Vec3 = readonly [number, number, number];

/** 经纬度对（角度制）。 */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * 把（lat°, lng°）映射到半径 R 的球面 Vector3。
 *
 * @example
 *   latLngToVec3({ lat: 0, lng: 0 }, 1)  // [1, 0, 0]
 *   latLngToVec3({ lat: 90, lng: 0 }, 1) // [0, 1, 0]（北极）
 */
export function latLngToVec3(p: LatLng, radius: number): Vec3 {
  const phi = p.lat * DEG_TO_RAD;
  const lambda = p.lng * DEG_TO_RAD;
  const cosPhi = Math.cos(phi);
  return [
    radius * cosPhi * Math.cos(lambda),
    radius * Math.sin(phi),
    radius * cosPhi * Math.sin(lambda),
  ];
}

/** 两个 Vec3 的点积。 */
function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** Vec3 等比缩放（返回新 Vec3，不 mutate）。 */
function scale(a: Vec3, k: number): Vec3 {
  return [a[0] * k, a[1] * k, a[2] * k];
}

/** Vec3 加。 */
function add(a: Vec3, b: Vec3): Vec3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** Vec3 长度。 */
function length(a: Vec3): number {
  return Math.sqrt(a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
}

/** Vec3 归一化为单位向量；零向量保持 [0,0,0]。 */
function normalize(a: Vec3): Vec3 {
  const len = length(a);
  if (len < 1e-9) return [0, 0, 0];
  return scale(a, 1 / len);
}

/**
 * 球面 SLERP（spherical linear interpolation）：在两单位向量 a、b 之间按 t∈[0,1]
 * 沿大圆弧插值，返回单位向量。
 *
 * 简并：a≈b（夹角 ~0）时退化为线性插值后归一化，避免 sin(ω)→0 NaN。
 */
function slerp(a: Vec3, b: Vec3, t: number): Vec3 {
  // 两点夹角 ω
  const cosOmega = Math.max(-1, Math.min(1, dot(a, b)));
  const omega = Math.acos(cosOmega);
  if (omega < 1e-6) {
    // 几乎重合：线性插值 + 归一化
    return normalize(add(scale(a, 1 - t), scale(b, t)));
  }
  const sinOmega = Math.sin(omega);
  const wA = Math.sin((1 - t) * omega) / sinOmega;
  const wB = Math.sin(t * omega) / sinOmega;
  return add(scale(a, wA), scale(b, wB));
}

/**
 * 大圆弧 N+1 个采样点（包括端点）。`lift > 0` 时把弧从球面抬起 lift 高度，
 * 弧顶最高、端点回到球面（用 sin(π·t) 包络），制造"飞行轨迹悬浮于地表"的感觉。
 *
 * @param p1 起点（同 latLngToVec3 的 radius，比如 R=1.0）
 * @param p2 终点（同 R）
 * @param segments 段数 N（≥1，常用 64）
 * @param lift 弧顶相对球面的最大抬高（推荐 0.05–0.18 ⋅ R），0 = 紧贴球面
 * @param radius 球面半径（与 p1/p2 必须一致）
 *
 * @example
 *   greatCircleArc(p1, p2, 64, 0.12, 1.0)
 *     → 65 个 Vec3，弧顶距球心 1.12，端点距球心 1.0
 */
export function greatCircleArc(
  p1: Vec3,
  p2: Vec3,
  segments: number,
  lift: number,
  radius: number,
): Vec3[] {
  const n = Math.max(1, Math.floor(segments));
  // 把端点归一化到单位球做 slerp（防 R 漂移），结果再乘 R 出去
  const a = scale(p1, 1 / radius);
  const b = scale(p2, 1 / radius);
  const out: Vec3[] = [];
  for (let i = 0; i <= n; i += 1) {
    const t = i / n;
    const onSphere = slerp(a, b, t);
    // sin(π·t)：t=0/1 时 0，t=0.5 时 1（最高点）
    const liftFactor = lift > 0 ? lift * Math.sin(Math.PI * t) : 0;
    out.push(scale(onSphere, radius + liftFactor));
  }
  return out;
}

/**
 * 大圆距离（haversine 等价的更稳形式：用 atan2 + cross magnitude，
 * 对小角度也无 acos 精度损失）。返回**球面角度** (rad)；乘 R 即距离。
 */
export function greatCircleAngularDistance(p1: LatLng, p2: LatLng): number {
  const phi1 = p1.lat * DEG_TO_RAD;
  const phi2 = p2.lat * DEG_TO_RAD;
  const dPhi = phi2 - phi1;
  const dLam = (p2.lng - p1.lng) * DEG_TO_RAD;
  // haversine
  const a =
    Math.sin(dPhi / 2) ** 2 +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(dLam / 2) ** 2;
  return 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** 球面距离 (km)，假设地球半径 EARTH_RADIUS_KM。 */
export const EARTH_RADIUS_KM = 6371;
export function greatCircleDistanceKm(p1: LatLng, p2: LatLng): number {
  return greatCircleAngularDistance(p1, p2) * EARTH_RADIUS_KM;
}
