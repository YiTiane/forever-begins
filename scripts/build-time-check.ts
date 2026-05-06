/**
 * build-time-check.ts · 双 CDN 资产 sanity check（v0.1 · Phase 1 §1.1.13c）
 *
 * 目的：每次主仓 `pnpm build` 前，遍历 `ASSET_VERSIONS` 校验每个 target 的
 * `probe.png` 真的 200。任何资产 tag 写错 / 仓未发 tag → build 立即失败，
 * 而不是上线后客户看到 404。
 *
 * 决策（v1.8 双 CDN 检测）：
 *   - 主 (jsDelivr) 与 备 (Statically) 同时 fail → ❌ 中止 build（运行时 fallback 也救不回来）
 *   - 单边 fail（另一边健康）            → ⚠️ warn（运行时 cdn-fallback.ts 仍能选健康那侧）
 *   - 双边都 ok                          → ✅ 通过
 *
 * 跳过开关：本地紧急可 `SKIP_BUILD_CHECK=1 pnpm build`；CI 永不传该 env。
 *
 * 验收：本地手动 `pnpm prebuild`；只要不是 ❌ 即视为通过（v1.12）。
 */

import {
  ASSET_VERSIONS,
  cdnUrl,
  type CdnTarget,
} from "../src/lib/images/asset-versions.ts";

if (process.env.SKIP_BUILD_CHECK === "1") {
  console.log("[build-time-check] SKIP_BUILD_CHECK=1, 跳过");
  process.exit(0);
}

const targets = Object.keys(ASSET_VERSIONS) as CdnTarget[];

interface ProbeResult {
  ok: boolean;
  msg: string;
}

async function probe(
  host: "primary" | "backup",
  target: CdnTarget,
): Promise<ProbeResult> {
  const url = cdnUrl(host, target, "probe.png");
  try {
    // AbortController 而非 AbortSignal.timeout —— 后者 Node 22 支持但仍是较新 API；
    // 自己拼 controller + setTimeout 兼容性更稳。
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const r = await fetch(url, { method: "HEAD", signal: ctrl.signal });
    clearTimeout(timer);
    return { ok: r.ok, msg: `${url} → HTTP ${r.status}` };
  } catch (e) {
    return { ok: false, msg: `${url} → ${(e as Error).message}` };
  }
}

const failures: string[] = [];
const warnings: string[] = [];

await Promise.all(
  targets.map(async (target) => {
    const [p, b] = await Promise.all([
      probe("primary", target),
      probe("backup", target),
    ]);
    if (!p.ok && !b.ok) {
      failures.push(
        `${target}: 双 CDN 均失败\n        primary: ${p.msg}\n        backup:  ${b.msg}`,
      );
    } else if (!p.ok) {
      warnings.push(`${target}: primary 失败但 backup 正常 (${p.msg})`);
    } else if (!b.ok) {
      warnings.push(`${target}: backup 失败但 primary 正常 (${b.msg})`);
    }
  }),
);

if (warnings.length > 0) {
  console.warn(
    "[build-time-check] ⚠️ 单边 CDN 失败（不阻塞 build，但建议 5–15 min 后复查）：",
  );
  for (const w of warnings) console.warn("  ⚠", w);
}

if (failures.length > 0) {
  console.error("\n[build-time-check] ❌ 双 CDN 均失败，build 中止：");
  for (const f of failures) console.error("  ✗", f);
  console.error("\n常见原因：");
  console.error("  1. 改了 ASSET_VERSIONS 但没在对应 fb-cdn-* 仓发 tag");
  console.error(
    "  2. 该 Tier B 仓没写 probe.png（push-to-cdn-repos.ts 应给所有 7 仓写）",
  );
  console.error(
    "  3. jsDelivr 与 Statically 同时抖动（罕见；可 SKIP_BUILD_CHECK=1 强制 build）",
  );
  process.exit(1);
}

if (warnings.length === 0) {
  console.log(
    `[build-time-check] ✅ 全部 ${targets.length} 个资产仓双 CDN 健康`,
  );
} else {
  console.log(
    `[build-time-check] ✅ 全部 ${targets.length} 个 target 至少一侧 CDN 可用` +
      `（${warnings.length} 项单边 warning，已记录上方）`,
  );
}
