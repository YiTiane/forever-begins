/**
 * src/content.config.ts · Astro Content Collections schema（v0.4 · v1.54 + storyPoem 头注释收口）
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
 * **v0.4 新增**（v1.53 PLAN · v1.54 头注释回填）：`storyPoem` collection。
 * §2 第一章爱情独白长卷的 12 个 beat 数据 + photo 绑定（DESIGN §4 §2.A）。
 * 与 `story` 分两个 collection 而非合并：anchor.json 是三段式锚点（date / place /
 * caption），main.json 是 12 beats × {photos, lines}，shape 完全不同；
 * z.union 合并会让两边类型都被 narrow 检测拖下水。
 *
 * **六个 collection**（DESIGN §12 / PLAN §1.1.17–§1.1.21 + v1.53）：
 *   - `meta`      : 婚礼基本信息（wedding.json：日期 / 地点 / 三坐标系 / 诗句）
 *   - `story`     : 故事锚点（anchor.json：2019-01-27 重庆西南大学）
 *   - `storyPoem` : §2 爱情独白长卷（main.json：12 beats × poem lines + photos）⭐ v1.53 新增
 *   - `journey`   : 地理叙事（long-distance.json：乌鲁木齐 ↔ 墨尔本；可选 cities.json 5 城归档）
 *   - `cats`      : 三只猫家庭（family.json：Berry / 荔枝 / 小宝）
 *   - `series`    : 5 photo series（snow / garden / wooden-door / pearl / retro）
 *
 * 设计要点：
 *   - 用 `glob({ pattern, base })` loader（Astro v5+ 现代 API · Astro 6.2.2 兼容）
 *   - 严 schema：必填字段直接 z.string() / z.number()；可选字段 z.optional()
 *   - **`series.cdnTarget` / `storyPoem.beats[].photos[].cdnTarget` 是 enum**
 *     （DESIGN §3.2 命名收敛唯一接缝），与 src/lib/images/asset-versions.ts 的 7 个 target 一一对应
 *   - **`meta` 只 glob `wedding.json`**（couple.json 是私有联系方式，不入构建产物，DESIGN §12）
 *   - **三坐标系 coords**（DESIGN v2.16 / PLAN §1.1.17）：wgs84 必填实数，gcj02/bd09 可空
 *     null —— Phase 6 由 `scripts/expand-coords.ts` 一次性算出
 *   - **共享 `stemSchema`**（v0.2 收紧）：cats / series / storyPoem 三处都引用同一个 schema，
 *     强制禁止扩展名（.jpg/.png/.avif/...）与尾随 `-<digits>` 尺寸后缀，
 *     避免错误 stem 进入 content 后被 CdnImage 拼出 `avif/Snow_01.jpg-640.avif` 静默 404
 *   - **storyPoem 12-beat 严约束**（v1.54 P3 #1）：beats.length(12) +
 *     refine id 依次 '01'..'12' + refine kind 严格匹配 photo-poem×10 / globe / finale。
 *     任何编辑 main.json 时丢失 / 重排 / 错 kind 都被 zod 拦在 build 前。
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
/**
 * v1.56 收紧 · `role` 从自由 string 升级为 enum（v1.55 P2 #3 修）：
 *   v1.55 起 `role` 已是决定 photo 视觉位置的关键字段（[data-role="far"] / "top-left" 等
 *   在 PoemBeat CSS 里直接驱动绝对定位），但 schema 仍是 `z.string().optional()` —— 如果
 *   有人把 main.json 写成 "topLeft" / "bottomright" / "nearer" 等 typo，schema 会通过、
 *   组件会丢掉那张照片的定位规则、Story 视觉静默碎掉。v1.56 用 enum 锁住合法值；
 *   再用 beats array 上的 refine 强约束"role 必须属于 layout 的 VALID_ROLES_BY_LAYOUT"。
 *
 * v1.58（P2 #1 修）：原 v1.56 用 `z.infer<typeof photoRoleSchema>` 取 TS 类型，
 *   但 astro:content 重导出的 `z` 在某些 TS 解析路径下不暴露 `infer` 命名空间，
 *   `pnpm exec tsc --noEmit` 报 TS2503 "Cannot find namespace 'z'"。改为先声明
 *   `as const` tuple，从 tuple 推导 TS 字面量联合类型，再把同一个 tuple 喂给
 *   `z.enum(...)`。两侧由同一份单一源生成，schema 与 type 不会漂移。
 */
const PHOTO_ROLES = [
  "far", // parallax-pair (beat 01)
  "near", // parallax-pair (beat 01)
  "top-left", // diagonal-gaze (beat 02)
  "bottom-right", // diagonal-gaze (beat 02)
  "center", // radial-mask (beat 03)
  "anchor", // anchor-single (beat 04 / 05)
  "vignette", // vignette (beat 06)
  "overlap", // overlap (beat 07)
  "reveal", // reveal (beat 08)
  "wooden", // wooden (beat 09)
  "pearl", // pearl (beat 10)
] as const;
type PhotoRole = (typeof PHOTO_ROLES)[number];
const photoRoleSchema = z.enum(PHOTO_ROLES);

const storyPoemPhoto = z.object({
  /** 派生品 stem，例：'Snow_03' / 'Wooden_door_01'。共用 stemSchema 防错。 */
  stem: stemSchema,
  /** 资产仓 target；DESIGN §3.2 命名收敛唯一接缝。 */
  cdnTarget: z.enum(CDN_TARGETS),
  alt: z.string().min(1),
  /**
   * 渲染角色（v1.56 P2 #3 修：升级为 enum）。
   * 决定 photo 在 layout 中的绝对定位 —— typo 会被 zod 拦截，不再静默碎屏。
   * 上层 beats refine 进一步强约束"role ∈ VALID_ROLES_BY_LAYOUT[layout]"。
   */
  role: photoRoleSchema,
  /**
   * 源图原始像素（CLS 几何预留 · CdnImage v0.3 width/height props 直传）。
   * 都填或都不填；其中一个填一个空 → CdnImage 构建期 throw（一致性 by 调用方）。
   * batch 1 用合理默认（3:2 横 / 2:3 竖）；后续 batch 可按真源图调整。
   */
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  /**
   * v1.64（v1.63 audit P2 修）：渲染策略**强制必填**。
   *   - "contain"：人像 / 主体不可裁切的照片（婚礼站对竖幅人像默认）
   *   - "cover"：横向氛围图 / 背景图，可允许 box 边缘裁剪（必须配 focalPoint
   *     若主体不在几何中心）
   *
   * 为什么从 optional 升级为 required：v1.63 之前 fit 可缺省 + 自动推导；但
   * v1.63 audit 实测发现 main.json 把 5 张实际 1600×2400 竖幅人像写成 3000×2000
   * 横幅，自动推导只能基于这份错误 metadata 把它们推成 cover，导致人物被裁。
   * 强制必填让"明确选择"变成 schema 层面的契约：每张 photo 必须显式表态它要不要
   * 保主体完整。schema 不能保证 metadata 与 CDN 真实尺寸一致（那需要构建期 probe），
   * 但至少能保证 fit 决策是显式的。
   */
  fit: z.enum(["contain", "cover"]),
  /**
   * v1.63 新增：focal point (0..1, 0..1) 用于 cover 模式下的 object-position。
   * contain 模式下被忽略。婚礼人像若必须 cover，应给 focal point 锁主体头部。
   * 缺省 (0.5, 0.5) 即图像几何中心。
   */
  focalPoint: z
    .object({
      x: z.number().min(0).max(1),
      y: z.number().min(0).max(1),
    })
    .optional(),
});

/**
 * v1.55 新增 · `layout` enum：
 *   每个 photo-poem beat 的"空间叙事"布局类（DESIGN §2.A 行 770-783 表对应）。
 *   v1.54 之前组件只有"通用单/双列 grid + 通用 fade-in"，beat 02 的"对视斜线" /
 *   beat 03 的"radial mask 晕散" / beat 01 的"远近 parallax 推近"等设计契约都没生效。
 *   v1.55 让 PoemBeat 根据本字段切换 4 套真正不同的 CSS 布局 + per-photo stagger 动画。
 *   globe / finale beat 不需要 layout（由专属组件渲染）。
 */
/**
 * v1.58（P2 #1 修）：同 photoRoleSchema，原 `z.infer<typeof photoPoemLayout>` 触发
 * tsc TS2503，改为 const tuple → typeof[number] 推导 type，同一份 tuple 喂 z.enum。
 */
const PHOTO_POEM_LAYOUTS = [
  "parallax-pair", // beat 01：远 + 近，上下错位形成纵深推近感
  "diagonal-gaze", // beat 02：左上 + 右下，对视斜线，中间留白给文字
  "radial-mask", // beat 03：单图居中，radial gradient mask 让边缘柔焦"晕散"
  "anchor-single", // beat 04：单图小框作锚点，scale 0.95→1 settle
  "vignette", // beat 06：夜色 vignette（v1.55 留 enum 但 batch 2 渲染时再实施 CSS）
  "overlap", // beat 07：两个半透明图层短暂重合（同上）
  "reveal", // beat 08：图像从裁切中展开（同上）
  "wooden", // beat 09：木门质感 + 缝线 SVG（同上）
  "pearl", // beat 10：珍珠高光闪动（同上）
] as const;
type PhotoPoemLayout = (typeof PHOTO_POEM_LAYOUTS)[number];
const photoPoemLayout = z.enum(PHOTO_POEM_LAYOUTS);

const storyPoemBeat = z.object({
  /** 序号字符串，例 '01'..'12'；必须按 DESIGN §2.A 表格顺序。 */
  id: z.string().regex(/^\d{2}$/, "id 形如 '01'..'12'"),
  /**
   * `photo-poem` (绝大多数 beats) | `globe` (beat 11 唯一) | `finale` (beat 12)。
   * 当前 batch 1 只渲染 photo-poem；globe / finale 由后续 batch 接入对应组件。
   */
  kind: z.enum(["photo-poem", "globe", "finale"]),
  /**
   * v1.55：photo-poem 必填空间布局类（DESIGN §2.A 行 770-783 → 9 种 layout）；
   * globe / finale 不需要（由专属组件渲染）。schema refine 在 beats array 上
   * 强制 photo-poem 必有 layout、其它 beat 必无 layout。
   */
  layout: photoPoemLayout.optional(),
  /** 诗行（中文）。每行一个 string；组件会按行分 `<p>` 渲染并保留断行。 */
  lines: z.array(z.string().min(1)).min(1),
  /** 照片数组；photo-poem beat 通常 1–2 张；globe / finale 可空。 */
  photos: z.array(storyPoemPhoto).default([]),
  /** 设计师布局/动效注解（不渲染，留给未来 motion polish 刀参考）。 */
  note: z.string().optional(),
});

/**
 * 12-beat 严约束（v1.54 P3 #1 修）：
 *   v0.1 schema 只写 `.min(1)`，丢失 / 重复 / 错序 / 错 kind 都会通过 content load。
 *   v0.2 加 `.length(12)` + 三层 `.refine()` 把 DESIGN §2.A 行 770–783 表的：
 *     - 数量恰好 12
 *     - id 严格依次 '01'..'12'
 *     - 01–10 必须是 photo-poem · 11 必须是 globe · 12 必须是 finale
 *   写进 schema —— 任何后续 batch 编辑 main.json 时都被 zod 拦在 build 前。
 *   未来 batch 3/4 接入 GlobeDistanceScene / StarCarouselFinale 时也能从 schema
 *   读到清晰的 kind 契约，不必另查 DESIGN。
 */
const EXPECTED_BEAT_KINDS = [
  "photo-poem", // 01
  "photo-poem", // 02
  "photo-poem", // 03
  "photo-poem", // 04
  "photo-poem", // 05
  "photo-poem", // 06
  "photo-poem", // 07
  "photo-poem", // 08
  "photo-poem", // 09
  "photo-poem", // 10
  "globe", // 11 · DESIGN §2.B GlobeDistanceScene
  "finale", // 12 · DESIGN §2.C StarCarouselFinale
] as const;

/**
 * v1.55：每个 photo-poem beat 的预期 layout（DESIGN §2.A 行 770-783）。
 * globe / finale 是 null（layout 字段必须缺）。schema refine 强约束这条契约：
 * 改 main.json 时 layout 必须严格匹配下列分配，未来 batch 2 加新 layout
 * 时只需改这张表 + photoPoemLayout enum，组件 CSS 自动获益。
 */
const EXPECTED_BEAT_LAYOUTS: readonly (PhotoPoemLayout | null)[] = [
  "parallax-pair", // 01 · snow_03 + snow_07 远近推近
  "diagonal-gaze", // 02 · snow_14 + snow_15 对视斜线
  "radial-mask", // 03 · snow_05 居中柔焦晕散
  "anchor-single", // 04 · snow_11 日期锚点
  "anchor-single", // 05 · snow_13 携手 [N] 天 (CountUp 留独立小刀)
  "vignette", // 06 · snow_08 夜色
  "overlap", // 07 · snow_09 契合
  "reveal", // 08 · snow_12 卸下防备
  "wooden", // 09 · wooden_door_01 缝补
  "pearl", // 10 · pearl_03 珍珠高光
  null, // 11 · globe (无 layout)
  null, // 12 · finale (无 layout)
];

/**
 * v1.56：每套 layout 允许哪些 photo role（v1.55 P2 #3 修）。
 * Story §2 的"远近 / 对视斜线 / 柔焦晕散 / 锚点定格"等空间叙事完全由 role 决定 photo 的
 * absolute 位置；role 写错的话 CSS 不匹配、photo 会回到默认流式位置 —— 视觉静默碎掉。
 * v1.56 用此表 + beats 上的第 4 条 refine 拦住 role × layout 不匹配的输入。
 */
const VALID_ROLES_BY_LAYOUT: Record<PhotoPoemLayout, readonly PhotoRole[]> = {
  "parallax-pair": ["far", "near"],
  "diagonal-gaze": ["top-left", "bottom-right"],
  "radial-mask": ["center"],
  "anchor-single": ["anchor"],
  vignette: ["vignette"],
  overlap: ["overlap"],
  reveal: ["reveal"],
  wooden: ["wooden"],
  pearl: ["pearl"],
};

const storyPoem = defineCollection({
  loader: glob({ pattern: "*.json", base: "./src/content/story-poem" }),
  schema: z.object({
    /** 故事锚点日期（与 src/content/story/anchor.json `date` 同源 · DESIGN §15.1）。 */
    anchor_date: z.string().min(1),
    /**
     * 必须恰好 12 个 beat（DESIGN §2.A 行 770–783 表）：
     * id 依次 '01'..'12'，kind 依次 photo-poem×10 → globe → finale。
     */
    beats: z
      .array(storyPoemBeat)
      .length(12, "beats 必须恰好 12 个（DESIGN §2.A 表 770-783）")
      .refine(
        (beats) =>
          beats.every((b, i) => b.id === String(i + 1).padStart(2, "0")),
        {
          message:
            "beats[i].id 必须依次为 '01'..'12'（按 DESIGN §2.A 表顺序，不允许跳号）",
        },
      )
      .refine(
        (beats) => beats.every((b, i) => b.kind === EXPECTED_BEAT_KINDS[i]),
        {
          message:
            "beat kind 必须严格匹配：01-10 photo-poem · 11 globe (§2.B) · 12 finale (§2.C)",
        },
      )
      .refine(
        (beats) =>
          beats.every((b, i) => {
            const expected = EXPECTED_BEAT_LAYOUTS[i];
            if (expected === null) return b.layout === undefined;
            return b.layout === expected;
          }),
        {
          message:
            "beat layout 必须严格匹配 EXPECTED_BEAT_LAYOUTS：01 parallax-pair · 02 diagonal-gaze · 03 radial-mask · 04 anchor-single · 05 anchor-single · 06 vignette · 07 overlap · 08 reveal · 09 wooden · 10 pearl · 11/12 不写 layout",
        },
      )
      .refine(
        (beats) =>
          beats.every((b) => {
            // globe / finale beat：允许 photos 为空，此处不强约束 role × layout
            if (!b.layout) return true;
            // v1.58 P2 #2 修：tsconfig `noUncheckedIndexedAccess` 让 Record 索引返回
            // `T | undefined`。VALID_ROLES_BY_LAYOUT 在 TS 层面对全部 PhotoPoemLayout
            // 都已总，但 TS 不能从 Record<K, V> 构造同时推出"全键覆盖"。显式 guard：
            // 若上层 enum / refine #3 都通过、b.layout 又非空，理论上一定能查到；
            // 这里的 false fallback 是给未来误编辑（漏写一项）时拦下的最后一层。
            const validRoles = VALID_ROLES_BY_LAYOUT[b.layout];
            if (!validRoles) return false;
            return b.photos.every((p) => validRoles.includes(p.role));
          }),
        {
          message:
            "photo role 必须属于 layout 的 VALID_ROLES_BY_LAYOUT：parallax-pair → far|near · diagonal-gaze → top-left|bottom-right · radial-mask → center · anchor-single → anchor · vignette/overlap/reveal/wooden/pearl 各自同名",
        },
      ),
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
