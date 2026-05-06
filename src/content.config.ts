/**
 * src/content.config.ts · Astro Content Collections schema（v0.3 · Phase 1 §1.1.16）
 *
 * **路径**（v0.2 修订）：Astro v6 起强制位于 `src/content.config.ts`（src/ 根目录），
 * **不**在 `src/content/config.ts`（旧 v4 命名会触发 LegacyContentConfigError）。
 *
 * **v0.3 新增**：`series.photos[].cdnTarget` 可选**逐张覆写**。
 * 真正动机：snow 系列 15 张派生品总体积超 jsDelivr 单仓 150MB 红线，
 * 实际 push 时被拆到了 fb-cdn-snow-a（Snow_01..08）+ fb-cdn-snow-b（Snow_09..15）。
 * 不引入 photo 级 cdnTarget override 的话，snow.json 必须裂成两个 series 文件
 * （破坏 DESIGN §3.2 的 "snow.json 单文件" 契约）。
 * 现在的策略：series-level `cdnTarget` 仍是默认；个别 photo 用 `cdnTarget` 覆写。
 *
 * 五个 collection（DESIGN §12 / PLAN §1.1.17–§1.1.21）：
 *   - `meta`    : 婚礼基本信息（wedding.json：日期 / 地点 / 三坐标系 / 诗句）
 *   - `story`   : 故事锚点（anchor.json：2019-01-27 重庆西南大学）
 *   - `journey` : 地理叙事（long-distance.json：乌鲁木齐 ↔ 墨尔本；可选 cities.json 5 城归档）
 *   - `cats`    : 三只猫家庭（family.json：Berry / 荔枝 / 小宝）
 *   - `series`  : 5 photo series（snow / garden / wooden-door / pearl / retro，每个含 cdnTarget + photos[]）
 *
 * 设计要点：
 *   - 用 `glob({ pattern, base })` loader（Astro v5+ 现代 API · Astro 6.2.2 兼容）
 *   - 严 schema：必填字段直接 z.string() / z.number()；可选字段 z.optional()
 *   - **`series.cdnTarget` 是 enum**（DESIGN §3.2 命名收敛唯一接缝），与 src/lib/images/asset-versions.ts 的 7 个 target 一一对应
 *   - **`meta` 只 glob `wedding.json`**（couple.json 是私有联系方式，不入构建产物，DESIGN §12）
 *   - **三坐标系 coords**（DESIGN v2.16 / PLAN §1.1.17）：wgs84 必填实数，gcj02/bd09 可空
 *     null —— Phase 6 由 `scripts/expand-coords.ts` 一次性算出
 *   - **共享 `stemSchema`**（v0.2 收紧）：cats / series 两处都引用同一个 schema，
 *     强制禁止扩展名（.jpg/.png/.avif/...）与尾随 `-<digits>` 尺寸后缀，
 *     避免错误 stem 进入 content 后被 CdnImage 拼出 `avif/Snow_01.jpg-640.avif` 静默 404
 *
 * v1.21+ 收敛：`china-cities.json` 不进主仓 src/content/journey/（PLAN §1.1.21b 验收）；
 * `cities.json` 名称保留可空——若未来 §1.1.19 仅填 long-distance.json，schema 用 union refine
 * 兼容两种 shape，不强制写 cities.json。
 */

import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

import type { CdnTarget } from "@/lib/images/asset-versions";

/** 7 个 Tier B 资产仓 target（与 ASSET_VERSIONS keys 同步；通过 satisfies 锁住一致性）。
 *  zod enum 不能直接接入 TS literal type，但可以通过 satisfies 在编译期校验对齐。 */
const CDN_TARGETS = [
  "snow-a",
  "snow-b",
  "grassland",
  "wooden-door",
  "pearl",
  "retro",
  "misc",
] as const satisfies readonly CdnTarget[];

/** 经纬度（WGS84 / GCJ02 / BD09 共用结构；后两套允许 null）。 */
const wgs84Coord = z.object({ lng: z.number(), lat: z.number() });
const nullableCoord = z.object({
  lng: z.number().nullable(),
  lat: z.number().nullable(),
});

/**
 * 派生品 stem 共享 schema（v0.2 收紧 · cats / series 两处共用）。
 *
 * 命名约定（与 generate-derivatives.ts / push-to-cdn-repos.ts 协议一致）：
 *   - 仓内派生品路径 = `<format>/<stem>-<width>.<format>`（如 `avif/Snow_01-1600.avif`）
 *   - **stem 是构造 URL 的中间段**，所以禁止以下三类容易拼错的内容：
 *     ① 前后斜杠（`/cat/foo` 或 `cat/foo/`）→ 让 cdnUrl 拼出 `//` 双斜杠
 *     ② 图片扩展名（`.jpg` / `.png` / `.avif` 等）→ 拼出 `avif/Snow_01.jpg-640.avif` 双扩展
 *     ③ 尾随 `-<数字>` 尺寸后缀（`-320` / `-1600` 等）→ 拼出 `avif/Snow_01-1600-640.avif` 嵌套尺寸
 *   - **子路径允许**：`cat/berry-portrait` / `invitation/part_1` 是合法 stem（misc 仓的子目录）
 *
 * 这些违反在 content collection 加载阶段就被 zod 拦截 → 错误 stem 永远到不了 CdnImage，
 * 因此不会出现 dist 上 200 OK 但拼错 URL 的"静默 404"。
 */
const IMAGE_EXTENSIONS = /\.(jpe?g|png|avif|webp|heic|heif|tiff?|gif|bmp)$/i;
const SIZE_SUFFIX = /-\d+$/;

const stemSchema = z
  .string()
  .min(1, "stem 必填")
  .refine((s) => !s.startsWith("/") && !s.endsWith("/"), {
    message: "stem 禁止前后斜杠（中间用 / 表示子路径是允许的）",
  })
  .refine((s) => !IMAGE_EXTENSIONS.test(s), {
    message:
      "stem 禁止图片扩展名（.jpg / .png / .avif / .webp / .heic / ...）；扩展由 CdnImage 按 format 拼接",
  })
  .refine((s) => !SIZE_SUFFIX.test(s), {
    message:
      "stem 禁止尾随 -<数字> 尺寸后缀（-320 / -640 / -1024 / -1600 / -2400 / -3840）；尺寸由 CdnImage 按 widths 拼接",
  });

// ─────────────────────────────────────────────────────────────────
// meta · 婚礼基本信息
// ─────────────────────────────────────────────────────────────────
const meta = defineCollection({
  // 严格 glob：只匹配 wedding.json；couple.json 是私有联系信息，不入构建
  loader: glob({ pattern: "wedding.json", base: "./src/content/meta" }),
  schema: z.object({
    groom: z.string().min(1),
    bride: z.string().min(1),
    /** ISO 8601 含时区，例：2026-06-14T19:00:00+08:00 */
    date: z.string().min(1),
    venue: z.object({
      cn: z.string().min(1),
      cn_short: z.string().min(1),
      address_cn: z.string().min(1),
      address_en: z.string().min(1),
      coords: z.object({
        wgs84: wgs84Coord,
        /** GCJ02 / BD09 在 Phase 6 由 expand-coords.ts 写入；本 step 允许 null */
        gcj02: nullableCoord,
        bd09: nullableCoord,
      }),
    }),
    poem: z.string().min(1),
  }),
});

// ─────────────────────────────────────────────────────────────────
// story · 故事锚点（current 仅 anchor.json；未来章节可加更多）
// ─────────────────────────────────────────────────────────────────
const story = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/story" }),
  schema: z.object({
    /** ISO 8601 日期（无时间部分也可），例：2019-01-27 */
    date: z.string().min(1),
    place: z.object({
      cn: z.string().min(1),
      lat: z.number(),
      lng: z.number(),
    }),
    caption: z.string().min(1),
  }),
});

// ─────────────────────────────────────────────────────────────────
// journey · 地理叙事
// 兼容两种 entry shape：
//   ① long-distance.json — { from, to, distanceKm? }
//   ② cities.json (可选历史归档) — { cities: [...] }
// 用 .refine() 校验"二选一"约束，不引入 discriminator 字段污染数据。
// ─────────────────────────────────────────────────────────────────
const journeyPlace = z.object({
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
});

const journey = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/journey" }),
  schema: z
    .object({
      // long-distance.json 形态
      from: journeyPlace.optional(),
      to: journeyPlace.optional(),
      distanceKm: z.number().positive().optional(),
      paragraph: z.string().optional(),
      // cities.json 形态（v1.22 后默认不创建；保留 schema 以容纳未来归档）
      cities: z
        .array(
          journeyPlace.extend({
            id: z.string().min(1),
            date: z.string().optional(),
            caption: z.string().optional(),
          }),
        )
        .optional(),
    })
    .refine(
      (d) =>
        (d.from !== undefined && d.to !== undefined) ||
        (d.cities !== undefined && d.cities.length > 0),
      {
        message:
          "journey entry 必须是 { from, to } 或 { cities[] } 之一；目前只用 long-distance.json",
      },
    ),
});

// ─────────────────────────────────────────────────────────────────
// cats · 三只猫家庭档案
// ─────────────────────────────────────────────────────────────────
const photoRef = z.object({
  /** 派生品 stem，例：'cat/berry-portrait'。禁止扩展名 / 尺寸后缀（见 stemSchema 注释）。 */
  stem: stemSchema,
  alt: z.string().min(1),
  caption: z.string().optional(),
});

const cats = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/cats" }),
  schema: z.object({
    cats: z
      .array(
        z.object({
          id: z.string().min(1),
          name: z.string().min(1),
          /** 短描述：'爱翻肚皮的老大' / '小公主' / '害羞的弟弟' */
          role: z.string().optional(),
          caption: z.string().min(1),
          portrait: photoRef,
          gallery: z.array(photoRef).optional(),
        }),
      )
      .min(1)
      .max(3),
  }),
});

// ─────────────────────────────────────────────────────────────────
// story-poem · §2 第一章爱情独白长卷（DESIGN §4 §2.A · v2.16 主导）
//
// 为什么单独一个 collection：
//   - `story` collection 的 schema 是 anchor.json 的 { date, place, caption } —— 三段式锚点；
//   - story-poem.json 是 12 beats 数组，每个 beat 含若干 photo + 多行 poem，结构完全不同；
//   - 用 z.union 合并会让两边类型都被 narrow 检测拖下水。分两个 collection 更干净。
//
// 一个 entry 一份 main.json（也可未来扩多份；glob 全 *.json）。
// ─────────────────────────────────────────────────────────────────
const storyPoemPhoto = z.object({
  /** 派生品 stem，例：'Snow_03' / 'Wooden_door_01'。共用 stemSchema 防错。 */
  stem: stemSchema,
  /** 资产仓 target；DESIGN §3.2 命名收敛唯一接缝。 */
  cdnTarget: z.enum(CDN_TARGETS),
  alt: z.string().min(1),
  /**
   * 渲染角色提示（可选）。例：'far' / 'near' / 'top-left' / 'bottom-right' / 'portrait'。
   * 仅供组件做 layout 分流（不会进 alt / aria）。未来 layout decision 可严格化为 enum。
   */
  role: z.string().optional(),
  /**
   * 源图原始像素（CLS 几何预留 · CdnImage v0.3 width/height props 直传）。
   * 都填或都不填；其中一个填一个空 → CdnImage 构建期 throw（一致性 by 调用方）。
   * batch 1 用合理默认（3:2 横 / 2:3 竖）；后续 batch 可按真源图调整。
   */
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

const storyPoemBeat = z.object({
  /** 序号字符串，例 '01'..'12'；必须按 DESIGN §2.A 表格顺序。 */
  id: z.string().regex(/^\d{2}$/, "id 形如 '01'..'12'"),
  /**
   * `photo-poem` (绝大多数 beats) | `globe` (beat 11 唯一) | `finale` (beat 12)。
   * 当前 batch 1 只渲染 photo-poem；globe / finale 由后续 batch 接入对应组件。
   */
  kind: z.enum(["photo-poem", "globe", "finale"]),
  /** 诗行（中文）。每行一个 string；组件会按行分 `<p>` 渲染并保留断行。 */
  lines: z.array(z.string().min(1)).min(1),
  /** 照片数组；photo-poem beat 通常 1–2 张；globe / finale 可空。 */
  photos: z.array(storyPoemPhoto).default([]),
  /** 设计师布局/动效注解（不渲染，留给未来 motion polish 刀参考）。 */
  note: z.string().optional(),
});

const storyPoem = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/story-poem" }),
  schema: z.object({
    /** 故事锚点日期（与 src/content/story/anchor.json `date` 同源 · DESIGN §15.1）。 */
    anchor_date: z.string().min(1),
    /** 12 个 beat（含 globe / finale 占位 entry）。 */
    beats: z.array(storyPoemBeat).min(1),
  }),
});

// ─────────────────────────────────────────────────────────────────
// series · 5 photo series · DESIGN §3.2 命名收敛
// 每个 series 显式声明 cdnTarget（不允许从 series.id 推导仓名）
// ─────────────────────────────────────────────────────────────────
const series = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./src/content/series" }),
  schema: z.object({
    /** 显示用 ID，例：'snow' / 'garden' / 'wooden-door' / 'pearl' / 'retro' */
    id: z.string().min(1),
    /** 显示标题（中文 / 英文皆可） */
    title: z.string().optional(),
    subtitle: z.string().optional(),
    /** caption 在 series 入口卡片用 */
    caption: z.string().optional(),
    /** 引文 / 诗句（可选） */
    quote: z.string().optional(),
    /**
     * 资产仓名 —— 与 src/lib/images/asset-versions.ts 的 ASSET_VERSIONS keys 一一对应。
     * **garden 系列必须显式写 `'grassland'`**，禁止从 id='garden' 推导出不存在的 fb-cdn-garden。
     */
    cdnTarget: z.enum(CDN_TARGETS),
    /** 派生品 stem 列表 */
    photos: z
      .array(
        z.object({
          /** 原始文件 stem，例：'Snow_01' / 'Grassland_03' / 'Pearl_04'。
           *  共用 stemSchema：禁止前后斜杠 / 扩展名 / -<数字> 尺寸后缀。 */
          stem: stemSchema,
          alt: z.string().min(1),
          caption: z.string().optional(),
          /**
           * 可选 · 逐张 cdnTarget 覆写（v0.3 新增）。
           * 不传 → 沿用 series.cdnTarget；传 → 该 photo 走指定 target。
           * 真实用例：snow 系列 15 张派生品超 jsDelivr 单仓 150MB 红线，
           * 实际拆到 fb-cdn-snow-a (Snow_01..08) + fb-cdn-snow-b (Snow_09..15)。
           * 消费侧（CdnImage）解析 `photo.cdnTarget ?? series.cdnTarget`。
           */
          cdnTarget: z.enum(CDN_TARGETS).optional(),
        }),
      )
      .min(1),
  }),
});

export const collections = { meta, story, storyPoem, journey, cats, series };
