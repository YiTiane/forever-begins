/**
 * daysTogether.ts · §2.D 实时计算 [N] 天（v0.1 · v1.74 batch 7）
 *
 * DESIGN §2.D（v2.21）契约：
 *   "我们的故事始于 2019 年 1 月 27 日，[N] 天" 中的 [N] 是从锚定日期到当前
 *    时刻的"已携手天数"。anchor_date 在 main.json 顶层；本库提供 ISO 字符串 →
 *    Date 解析 + 天数差求解的两个纯函数，不绑 React / DOM，便于 PoemBeat 服务端
 *    渲染初值 + 客户端 IO 入场重算 / 动画。
 *
 * 时区：DESIGN §2.D 锚定日期带 +08:00（中国时区，新郎新娘的"我们"开始的时区）。
 * 本函数也按 +08:00 解析；这样无论访客在哪个时区，看到的"已携手 N 天"都是
 * 相对中国时区的稳定值（不会出现"亚洲访客 2658 天 / 欧洲访客 2659 天"的漂移）。
 *
 * 使用：
 *   const anchor = parseAnchorDate('2019-01-27');
 *   const n = daysTogether(anchor);  // → e.g. 2658（取决于"今天"）
 */

const MS_PER_DAY = 86_400_000;

/**
 * 把 main.json `anchor_date` 字符串（"YYYY-MM-DD"）解析成中国时区 +08:00 的
 * Date。任何其它时区的访客都能算出同一个"携手天数"。
 */
export function parseAnchorDate(iso: string): Date {
  return new Date(`${iso}T00:00:00+08:00`);
}

/**
 * 返回 anchor → now 之间整 24 小时的天数（向下取整，下限 0）。
 *
 * @param anchor 锚定日期（带时区的 Date）
 * @param now 当前时刻（默认 new Date()，可注入用于测试 / 服务端构建时）
 */
export function daysTogether(anchor: Date, now: Date = new Date()): number {
  const diff = now.getTime() - anchor.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / MS_PER_DAY);
}
