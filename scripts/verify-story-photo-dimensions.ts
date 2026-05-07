/**
 * verify-story-photo-dimensions.ts · § 2 Story photo 尺寸合约 build-time gate
 *   v0.5（Phase 2 §2 batch 8 · v1.91 修 v1.90 audit P2-4：覆盖 §2.C finale 15 张）
 *
 * v0.5：extends gate 到 §2.C StarCarouselFinale 序列。除原 §2 photo-poem 12 张
 * 外，本批次还把 src/lib/story/finalePhotos.ts 的 15 张照片 (grassland × 5 +
 * wooden-door × 3 + pearl × 3 + retro × 4) aspectRatio 与 CDN 1600px 派生品
 * 实测做相同的 dual-CDN first-valid + abort losers 比对；finalePhoto.aspectRatio
 * 与 CDN 派生不一致 → build 直接 fail（防 v1.90 audit 那种 14/15 错标 1.5
 * 横幅、实测 0.667 portrait 的元数据漂移再次发生）。
 *
 * 动机：v1.63 audit 实测 main.json 把 5 张实际 1600×2400 (portrait) 竖幅人像
 * 错标成 3000×2000 (landscape)，solver 据此求横幅 box，cover 模式裁掉人物主体。
 * v1.64 已修这批已知错误尺寸，但 main.json 的 width/height 仍是手填字段，
 * schema (zod) 只校验"正整数"，无法和 CDN 真实派生品比对。同类事故仍可能再次
 * 静默进入页面（新加 photo / 误改尺寸）。
 *
 * 本脚本作为 prebuild gate（**dual-CDN first-valid + abort losers** 契约）：
 *   1. 读 src/content/story-poem/main.json
 *   2. 对每张 photo 同时构造 primary (jsDelivr) 与 backup (Statically) 两个
 *      CDN URL：`cdnUrl(stem, target, PROBE_W, "primary"|"backup")`
 *   3. 在 probeOne 内对 candidates 并行 race：每个 attempt 跑
 *      tryOne(cdn, url, signal) = fetchWithTimeout(url, signal)
 *        → JPEG SOF 解析 (width × height)
 *        → 比对 cdnAspect 与 main.json aspect（relErr ≤ ±2% 容差，覆盖 sharp
 *          resize round 误差）
 *      任一步失败该 attempt 即视为失败，不污染另一侧。
 *   4. **Promise.any 首胜即返回**：第一个 fetch + parse + aspect 都通过的
 *      attempt 立即 resolve；返回前调 ctrls.forEach(c => c.abort()) 取消
 *      所有未完结的输者 fetch（不再挂到自己的 5s timeout）；全失败 →
 *      AggregateError，attempts 收集的细节拼综合错误抛出。
 *   5. 全部 12 张通过 → "✓ 12 张 Story photo 与 CDN 1600px 派生品 aspect 一致"
 *
 * 设计为什么 dual-CDN：v1.66 audit 发现 jsDelivr 偶发缓存 stale 派生品，单 CDN
 * gate 会让 build 误 fail；备 CDN (Statically) 给区域性 / 缓存抖动留兜底。
 *
 * 设计为什么首胜 + abort：v1.67 audit 发现 Promise.all 等两侧拖慢 build；
 * Promise.any 让快侧先返回。v1.68 audit 进一步发现输者仍跑到 5s timeout
 * 占带宽，v0.4 fetchWithTimeout 接 externalSignal，首胜后 ctrls.abort()
 * 立即取消。
 *
 * 跳过：本地调试可 `SKIP_STORY_PHOTO_CHECK=1 pnpm build`；CI 永不传该 env。
 *
 * 不依赖第三方包：内置 JPEG SOF 解析（≈ 30 行）。
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

import {
  ASSET_VERSIONS,
  cdnUrl,
  type CdnTarget,
} from "../src/lib/images/asset-versions.ts";
import { FINALE_PHOTO_SEQUENCE } from "../src/lib/story/finalePhotos.ts";

interface Photo {
  stem: string;
  cdnTarget: CdnTarget;
  width?: number;
  height?: number;
  fit?: "contain" | "cover";
}

interface Beat {
  id: string;
  kind: string;
  photos: Photo[];
}

interface MainJson {
  beats: Beat[];
}

const PROBE_W = 1600; // probe at 1600 width derivative (覆盖了 widths={[..., 1600, ...]} 都有的尺寸)
const ASPECT_TOLERANCE = 0.02; // ±2%（sharp resize 整数化偏差）

if (process.env.SKIP_STORY_PHOTO_CHECK === "1") {
  console.log("[verify-story-photo-dimensions] SKIP_STORY_PHOTO_CHECK=1, 跳过");
  process.exit(0);
}

/**
 * 内置 JPEG SOF 解析（不需要 sharp / image-size 依赖）。
 * JPEG 帧头 SOF0/SOF2/SOF1 marker 后偏移 5 字节 = 高 (2B) + 宽 (2B)。
 */
function readJpegDimensions(
  buf: Buffer,
): { width: number; height: number } | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 8 < buf.length) {
    if (buf[i] !== 0xff) return null;
    // skip 0xFF padding
    while (i < buf.length && buf[i] === 0xff) i++;
    if (i >= buf.length) return null;
    const marker = buf[i++];
    // SOFn 帧头：marker 在 0xC0-0xCF 范围内，但排除 0xC4(DHT) / 0xC8(JPG) / 0xCC(DAC)
    if (
      marker !== undefined &&
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc
    ) {
      // i 指向 marker length 字段
      // 跳过 length(2) + precision(1)，下一个 4 字节 = 高 + 宽
      const segHi = buf[i + 3];
      const segLo = buf[i + 4];
      const widHi = buf[i + 5];
      const widLo = buf[i + 6];
      if (
        segHi === undefined ||
        segLo === undefined ||
        widHi === undefined ||
        widLo === undefined
      )
        return null;
      const height = (segHi << 8) | segLo;
      const width = (widHi << 8) | widLo;
      return { width, height };
    }
    // 其它 marker：跳过 segment（2B length 含自身）
    if (i + 1 >= buf.length) return null;
    const lenHi = buf[i];
    const lenLo = buf[i + 1];
    if (lenHi === undefined || lenLo === undefined) return null;
    const segLen = (lenHi << 8) | lenLo;
    if (segLen < 2) return null;
    i += segLen;
  }
  return null;
}

/**
 * v0.3（v1.66 audit P2-A + P3 修）：
 *   - v0.2 把 aspect 校验放到 probeOne 外：primary 解析成功就返回 dim，aspect
 *     比对发生在外层。如果 jsDelivr 缓存到旧尺寸，build 仍 fail，即使 backup 是对的。
 *     违反"任一 CDN 能解析并匹配 aspect 即通过"契约。
 *   - v0.2 用 Promise.all 等两侧都结束：primary 已成功但 backup 卡 5s timeout
 *     仍要等 → 12 张顺序跑、backup 区域性卡顿会把 build 拖到 ~60 s。
 *
 *   v0.3：
 *     1) aspect 校验下沉到每个 CDN attempt 内 —— 每个 tryOne 自己判断 aspect
 *        是否匹配，不匹配视为该 attempt 失败
 *     2) 用 Promise.any 拿首个"解析 + aspect 通过"的 attempt；其它仍 racing
 *        但不阻塞返回，build 不再被慢的一侧拖
 *     3) 全失败 → AggregateError → 综合 throw 含两侧具体 reason
 */
const FETCH_TIMEOUT_MS = 5000;

/**
 * v0.4（v1.67 audit P3 修）：fetchWithTimeout 接受外部 signal，让 probeOne
 * 在 Promise.any 首胜后能 abort 输者，不让慢 CDN 的请求在背景挂到 5s timeout。
 * 调用方传 signal === undefined → 退回内部 setTimeout(5s) 行为；传 signal →
 * 内外两路 abort 都会让 fetch 失败（任一触发先到的赢）。
 */
async function fetchWithTimeout(
  url: string,
  externalSignal?: AbortSignal,
): Promise<Buffer> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  // 把 externalSignal abort 同步到内部 ctrl（fetch 仅接 1 个 signal）
  const onExternalAbort = () => ctrl.abort();
  if (externalSignal) {
    if (externalSignal.aborted) ctrl.abort();
    else
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
    if (externalSignal) {
      externalSignal.removeEventListener("abort", onExternalAbort);
    }
  }
}

interface SourceAttempt {
  cdn: "primary" | "backup";
  url: string;
  /** 解析成功（含 aspect 通过）→ dim 有值 / error 空；否则 error 描述失败原因 */
  dim?: { width: number; height: number };
  error?: string;
}

/**
 * 探一张 photo：primary + backup 并发，**aspect 校验下沉到每个 attempt 内**，
 * 用 Promise.any 拿首个 "fetch + parse + aspect 通过" 的 attempt。
 *
 *   - 任一边的 fetch 超时 / HTTP 错 / JPEG 解析失败 / aspect 不匹配 → 该 attempt 失败
 *   - 任一边成功 → 立即返回（不等另一侧）
 *   - 双败 → throw 综合错误（含两侧具体 reason）
 */
async function probeOne(
  cdnTarget: CdnTarget,
  stem: string,
  expectedAspect: number,
  tolerance: number,
): Promise<{
  dim: { width: number; height: number };
  sourceCdn: "primary" | "backup";
}> {
  const path = `jpg/${stem}-${PROBE_W}.jpg`;
  const candidates: Array<{ cdn: "primary" | "backup"; url: string }> = [
    { cdn: "primary", url: cdnUrl("primary", cdnTarget, path) },
    { cdn: "backup", url: cdnUrl("backup", cdnTarget, path) },
  ];

  // attempts 收集双侧失败/成功细节，给 AggregateError 时拼综合错误用。
  const attempts: SourceAttempt[] = [];

  // v0.4（v1.67 audit P3 修）：每个 attempt 自带 AbortController；首胜后 abort
  // 其它输家，让背景 fetch 立即停（不再挂到自己的 5s timeout）。
  const ctrls: AbortController[] = candidates.map(() => new AbortController());

  const tryOne = async (
    cdn: "primary" | "backup",
    url: string,
    signal: AbortSignal,
  ) => {
    try {
      const buf = await fetchWithTimeout(url, signal);
      const dim = readJpegDimensions(buf);
      if (!dim) {
        const att: SourceAttempt = {
          cdn,
          url,
          error: "JPEG SOF parse failed",
        };
        attempts.push(att);
        throw new Error(`${cdn}: JPEG SOF parse failed`);
      }
      const cdnAspect = dim.width / dim.height;
      const relErr =
        Math.abs(expectedAspect - cdnAspect) /
        Math.max(expectedAspect, cdnAspect);
      if (relErr > tolerance) {
        const att: SourceAttempt = {
          cdn,
          url,
          dim,
          error: `aspect mismatch ${dim.width}×${dim.height} (${cdnAspect.toFixed(4)}) — relErr ${(relErr * 100).toFixed(2)}% > ${(tolerance * 100).toFixed(0)}%`,
        };
        attempts.push(att);
        throw new Error(`${cdn}: ${att.error}`);
      }
      // success
      attempts.push({ cdn, url, dim });
      return { dim, sourceCdn: cdn };
    } catch (err) {
      // 已记入 attempts 的不重复；网络/超时 throw 在这里第一次记
      if (!attempts.find((a) => a.cdn === cdn)) {
        attempts.push({ cdn, url, error: (err as Error).message });
      }
      throw err;
    }
  };

  try {
    // Promise.any：首个成功即返回；其它仍 racing 但不阻塞结果
    const result = await Promise.any(
      candidates.map((c, i) => {
        const ctrl = ctrls[i];
        if (!ctrl) throw new Error("controller missing");
        return tryOne(c.cdn, c.url, ctrl.signal);
      }),
    );
    // v0.4：首胜后立刻 abort 其它仍未完结的 fetch，不让它们挂到 5s timeout
    ctrls.forEach((c) => c.abort());
    return result;
  } catch {
    // 全部 reject（AggregateError）；用 attempts 收集的细节拼综合错误
    const lines = attempts.map(
      (a) => `  - ${a.cdn} ${a.url}: ${a.error ?? "unknown error"}`,
    );
    throw new Error(`dual-CDN both failed for ${stem}:\n${lines.join("\n")}`);
  }
}

async function main() {
  const here = dirname(fileURLToPath(import.meta.url));
  const mainPath = resolve(here, "..", "src/content/story-poem/main.json");
  const main: MainJson = JSON.parse(readFileSync(mainPath, "utf-8"));

  const errors: string[] = [];
  const checked: string[] = [];

  for (const beat of main.beats) {
    if (beat.kind !== "photo-poem") continue;
    for (const photo of beat.photos) {
      // schema 已强约束 width/height 都填或都不填；只在两者都有时才能比对
      if (!photo.width || !photo.height) {
        errors.push(
          `Beat ${beat.id} / ${photo.stem}: missing width/height —— story photo 必须填写真实源像素以做 CLS / aspect 校验`,
        );
        continue;
      }
      // v0.3：probeOne 已下沉 aspect 校验 + Promise.any 首个成功即返回。
      // 任一 CDN 能解析 + aspect 通过即过；双败（含两侧 aspect 都错）才 fail。
      const expectedAspect = photo.width / photo.height;
      try {
        const { dim: cdnDim, sourceCdn } = await probeOne(
          photo.cdnTarget,
          photo.stem,
          expectedAspect,
          ASPECT_TOLERANCE,
        );
        checked.push(
          `${beat.id}/${photo.stem}: ${photo.width}×${photo.height} ↔ CDN(${sourceCdn}) ${cdnDim.width}×${cdnDim.height} ✓`,
        );
      } catch (err) {
        errors.push(
          `Beat ${beat.id} / ${photo.stem} (main.json ${photo.width}×${photo.height} aspect ${expectedAspect.toFixed(4)}): ${(err as Error).message}`,
        );
      }
    }
  }

  // v0.5（v1.91 修 v1.90 audit P2-4）：finale 15 张走 finalePhotos.ts 元数据；
  // 没有 main.json 的 width/height 概念，直接用 aspectRatio 做 expectedAspect。
  // 任一 CDN 通过即过；双 CDN 都失败 / aspect 漂移 → build fail。
  for (const photo of FINALE_PHOTO_SEQUENCE) {
    const expectedAspect = photo.aspectRatio;
    try {
      const { dim: cdnDim, sourceCdn } = await probeOne(
        photo.cdnTarget,
        photo.stem,
        expectedAspect,
        ASPECT_TOLERANCE,
      );
      checked.push(
        `finale/${photo.stem}: aspect ${expectedAspect.toFixed(3)} ↔ CDN(${sourceCdn}) ${cdnDim.width}×${cdnDim.height} ✓`,
      );
    } catch (err) {
      errors.push(
        `finale ${photo.stem} (finalePhotos.ts aspect ${expectedAspect.toFixed(4)}): ${(err as Error).message}`,
      );
    }
  }

  if (errors.length > 0) {
    console.error(
      "\n[verify-story-photo-dimensions] ✗ Story photo 尺寸合约校验失败：",
    );
    for (const e of errors) console.error("  -", e);
    if (checked.length > 0) {
      console.error(`\n  通过 ${checked.length} 张：`);
      for (const c of checked) console.error("  -", c);
    }
    console.error(
      "\n  本地紧急可 SKIP_STORY_PHOTO_CHECK=1 pnpm build 跳过；CI 永不传该 env。",
    );
    process.exit(1);
  }

  console.log(
    `[verify-story-photo-dimensions] ✓ ${checked.length} 张 Story photo (含 finale ${FINALE_PHOTO_SEQUENCE.length}) 与 CDN ${PROBE_W}px 派生品 aspect 一致`,
  );
  // 把通过列表也打到 stdout（CI log 可读 + 本地 quick visual confirm）
  for (const c of checked) console.log("  -", c);
}

main().catch((err) => {
  console.error("[verify-story-photo-dimensions] 未预期错误：", err);
  process.exit(1);
});
