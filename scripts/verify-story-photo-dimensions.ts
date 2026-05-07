/**
 * verify-story-photo-dimensions.ts · § 2 Story photo 尺寸合约 build-time gate
 *   v0.1（Phase 2 §2 batch 5 · v1.65 修 v1.64 audit P2-A）
 *
 * 动机：v1.63 audit 实测 main.json 把 5 张实际 1600×2400 (portrait) 竖幅人像
 * 错标成 3000×2000 (landscape)，solver 据此求横幅 box，cover 模式裁掉人物主体。
 * v1.64 已修这批已知错误尺寸，但 main.json 的 width/height 仍是手填字段，
 * schema (zod) 只校验"正整数"，无法和 CDN 真实派生品比对。同类事故仍可能再次
 * 静默进入页面（新加 photo / 误改尺寸）。
 *
 * 本脚本作为 prebuild gate：
 *   1. 读 src/content/story-poem/main.json
 *   2. 对每张 photo，构造 CDN URL `${primary}/jpg/${stem}-${PROBE_W}.jpg`
 *   3. 下载图片，从 JPEG SOF 头读真实像素 (width × height)
 *   4. 比对 main.json width/height 的 aspect 与 CDN 1600 派生品 aspect
 *      - 容差 ±2% 给 sharp resize 的 round 误差
 *      - 任何 photo aspect 不匹配 → 列错误并 exit(1)
 *   5. 全部通过 → "✓ Story photo dimensions match CDN"
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
 * v0.2（v1.65 audit P2-A 修）：单一 jsDelivr fetch 没 timeout / 没 backup CDN
 * 在区域性卡顿时整个 build 被阻断。改为复用 build-time-check 的 dual-CDN +
 * 5s timeout 模式：primary / backup 任一拿到 + 解析成功就返回；双败才 fail。
 */
const FETCH_TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string): Promise<Buffer> {
  // AbortController 显式拼，与 scripts/build-time-check.ts 同款（Node 22 AbortSignal.timeout
  // 已稳定但保留 manual ctrl 兼容性 / 一致性）
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

interface SourceAttempt {
  cdn: "primary" | "backup";
  url: string;
  error?: string;
  dim?: { width: number; height: number };
}

/**
 * 同时跑 primary + backup CDN；任一成功（fetch + JPEG parse 都过）就返回它的 dim。
 * 双败 → throw 综合错误，列出两侧具体原因。
 */
async function probeOne(
  cdnTarget: CdnTarget,
  stem: string,
): Promise<{
  dim: { width: number; height: number };
  sourceCdn: "primary" | "backup";
}> {
  const path = `jpg/${stem}-${PROBE_W}.jpg`;
  const primaryUrl = cdnUrl("primary", cdnTarget, path);
  const backupUrl = cdnUrl("backup", cdnTarget, path);

  const tryOne = async (
    cdn: "primary" | "backup",
    url: string,
  ): Promise<SourceAttempt> => {
    try {
      const buf = await fetchWithTimeout(url);
      const dim = readJpegDimensions(buf);
      if (!dim) return { cdn, url, error: "JPEG SOF parse failed" };
      return { cdn, url, dim };
    } catch (err) {
      return { cdn, url, error: (err as Error).message };
    }
  };

  // 并发探两侧 —— 任一成功即用；双败才报错
  const [pAtt, bAtt] = await Promise.all([
    tryOne("primary", primaryUrl),
    tryOne("backup", backupUrl),
  ]);

  if (pAtt.dim) return { dim: pAtt.dim, sourceCdn: "primary" };
  if (bAtt.dim) return { dim: bAtt.dim, sourceCdn: "backup" };

  throw new Error(
    `dual-CDN both failed: primary ${primaryUrl} (${pAtt.error}); backup ${backupUrl} (${bAtt.error})`,
  );
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
      // v0.2：dual-CDN + 5s timeout；任一边解出 + aspect 匹配 → 通过；双败才 fail
      try {
        const { dim: cdnDim, sourceCdn } = await probeOne(
          photo.cdnTarget,
          photo.stem,
        );
        const sourceAspect = photo.width / photo.height;
        const cdnAspect = cdnDim.width / cdnDim.height;
        const aspectDelta = Math.abs(sourceAspect - cdnAspect);
        const relErr = aspectDelta / Math.max(sourceAspect, cdnAspect);
        if (relErr > ASPECT_TOLERANCE) {
          errors.push(
            `Beat ${beat.id} / ${photo.stem}: main.json ${photo.width}×${photo.height} (aspect ${sourceAspect.toFixed(4)}) ` +
              `↔ CDN(${sourceCdn}) ${PROBE_W}px 派生品 ${cdnDim.width}×${cdnDim.height} (aspect ${cdnAspect.toFixed(4)}) — relErr ${(relErr * 100).toFixed(2)}% > ${(ASPECT_TOLERANCE * 100).toFixed(0)}%。` +
              ` 修法：把 main.json 的 width/height 改成与 CDN 派生品同 aspect（如 1600×2400 portrait 应写 2000×3000）。`,
          );
        } else {
          checked.push(
            `${beat.id}/${photo.stem}: ${photo.width}×${photo.height} ↔ CDN(${sourceCdn}) ${cdnDim.width}×${cdnDim.height} ✓`,
          );
        }
      } catch (err) {
        errors.push(
          `Beat ${beat.id} / ${photo.stem}: probe failed — ${(err as Error).message}`,
        );
      }
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
    `[verify-story-photo-dimensions] ✓ ${checked.length} 张 Story photo 与 CDN ${PROBE_W}px 派生品 aspect 一致`,
  );
  // 把通过列表也打到 stdout（CI log 可读 + 本地 quick visual confirm）
  for (const c of checked) console.log("  -", c);
}

main().catch((err) => {
  console.error("[verify-story-photo-dimensions] 未预期错误：", err);
  process.exit(1);
});
