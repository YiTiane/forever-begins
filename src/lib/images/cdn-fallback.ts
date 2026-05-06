/**
 * cdn-fallback.ts · CDN 选择竞速器（v0.1 · Phase 1 §1.1.14）
 *
 * **本模块只做诊断 / 单元测试用途**。
 *
 * 真正的运行时 CDN fallback 逻辑落在 `<head>` inline script
 * `src/components/CdnEarlyProbe.astro`（§1.1.15）——它在 HTML 解析早期就跑，
 * 包含同款探测 + 单图 capture 监听器，是线上路径。
 * 本文件保留为可在 vitest / 浏览器 console 中独立调用的 helper：
 *   - 校验主备 CDN 当下是否可达
 *   - 在故障演练（artificially block jsDelivr）时验证 backup 接管
 *   - 给未来 PWA / Service Worker 缓存策略提供"哪侧 CDN 健康"的判断
 *
 * 设计要点（DESIGN §7.5 v2.5/v2.7/v2.8 沿用）：
 *   - 用 AbortController + setTimeout，**不**用 AbortSignal.timeout
 *     （iOS 12 / Chrome 102- / 旧 Android WebView 不支持后者）
 *   - 没有 AbortController 的极端环境直接退回 'primary'，把决策权交给运行时
 *     <img onerror> 兜底（CdnEarlyProbe 的 capture 层）
 *   - 用 Promise.any（**不**用 Promise.race）：race 会让最快**失败**的 host 胜出，
 *     any 只在第一个 fulfilled 时 resolve
 *   - probe URL 经 cdnUrl(host, 'misc', 'probe.png')：misc tag 切换时同步生效，
 *     永远不允许硬编码 @vX.X.X
 *   - 每个 fetch 都包 try/catch：防止 fetch 构造阶段（如 SecurityError）
 *     同步抛错穿透 Promise.any
 *   - 全失败时 fallback 到 'primary'：浏览器仍会真正发起请求，运行时
 *     <img onerror> capture 监听器会按 picture 范围切换到 backup
 */

import { cdnUrl } from "./asset-versions";

/** Promise<'primary' | 'backup'> 都跑赢 timeout 时的胜出 host。 */
export async function pickCDN(): Promise<"primary" | "backup"> {
  // 极旧浏览器（IE / iOS 12-）没有 AbortController：
  // 不做探测，直接退回主 CDN，让运行时 <img onerror> 兜底。
  if (typeof AbortController === "undefined") return "primary";

  const HOSTS: Array<"primary" | "backup"> = ["primary", "backup"];

  // 关键：每个 probe 仅在 HTTP OK 时 resolve(host)，其余都 reject。
  // 用 Promise.any 选第一个成功；用 Promise.race 会让失败最快的胜出（错误）。
  const probes = HOSTS.map((host) => {
    return new Promise<"primary" | "backup">((resolve, reject) => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 2000);
        fetch(cdnUrl(host, "misc", "probe.png"), {
          method: "HEAD",
          cache: "no-store",
          signal: ctrl.signal,
        })
          .then((r) => {
            clearTimeout(timer);
            if (!r.ok) reject(new Error(`HTTP ${r.status}`));
            else resolve(host);
          })
          .catch((err) => {
            clearTimeout(timer);
            reject(err instanceof Error ? err : new Error(String(err)));
          });
      } catch (e) {
        // 极端：fetch / AbortController 构造阶段同步抛错（SecurityError 等）
        reject(e instanceof Error ? e : new Error(String(e)));
      }
    });
  });

  try {
    return await Promise.any(probes);
  } catch {
    // 全失败：退回主 CDN（让浏览器真发请求，由运行时 <img onerror> 兜底切换）
    return "primary";
  }
}

/**
 * 诊断辅助：返回详细的双 CDN 探测状态，**不**做选择。
 * 用例：故障演练页面 / vitest 中校验切换路径是否对。
 */
export interface CdnProbeReport {
  primary: { ok: boolean; status?: number; error?: string };
  backup: { ok: boolean; status?: number; error?: string };
}

export async function probeCdnDetailed(): Promise<CdnProbeReport> {
  async function one(
    host: "primary" | "backup",
  ): Promise<CdnProbeReport["primary"]> {
    if (typeof AbortController === "undefined") {
      return { ok: false, error: "AbortController not supported" };
    }
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 2000);
      const r = await fetch(cdnUrl(host, "misc", "probe.png"), {
        method: "HEAD",
        cache: "no-store",
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      return { ok: r.ok, status: r.status };
    } catch (e) {
      return { ok: false, error: (e as Error).message };
    }
  }
  const [primary, backup] = await Promise.all([one("primary"), one("backup")]);
  return { primary, backup };
}
