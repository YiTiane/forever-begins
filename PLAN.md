---
project: Forever Begins · 永恒之始
companion_to: DESIGN.md (v2.21)
document_type: Implementation Plan
version: 2.11
last_updated: 2026-05-11
status: **Phase 1 ✓ done · Phase 2 §0 Cover ✓ done · §1 Invitation ✓ done · §2 / Phase 3 Our Story ✓ hardened · Phase 4 online smoke matrix ✓ done · Phase 5 Family Astro album ✓ deployed（保护点 `f8a45a8`）· Phase 6 Details / Closing / global nav 已部署，venue map 已按二道桥民俗风情一条街真实坐标校准并发布 misc CDN `v1.2.0`；本轮按用户反馈完成邀请页诗句移除、倒计时突出、Family/The Day 标题收口、猫咪文案补齐，并将 Family 可见标题与导航从「我们的家」改为「彩蛋」，待提交与 GitHub Pages CI 验证 · dimension gate 覆盖 34 张 story+finale+cats visible photos；稳定网络可 clean pass，CDN 抖动按 warning 记录但不再误报"至少一侧可用" · Lightbox 已撤回并转入 redesign-deferred**
changelog: |
  v2.11 — Phase 5 visible label rename（Family → 彩蛋）：
        ① **修用户反馈（章节命名）**：
           - Family 可见标题从「我们的家」改为「彩蛋」
           - 全局导航中 `family` 锚点 label 同步改为「彩蛋」
           - 保留 `#family` 稳定锚点与 FamilySection 组件命名，避免破坏现有链接和实现边界
  v2.10 — Phase 6 copy and typography cleanup（邀请 / 家庭 / 这一天 文案收口）：
        ① **修用户反馈（邀请页文案）**：
           - Cover 生产页面去除旧邀请诗句
           - OG image alt 同步去除该句，避免分享预览继续携带旧文案
        ② **修用户反馈（倒计时视觉权重）**：
           - 倒计时数字与单位放大突出；实现改为 rem + breakpoint 档位，避免 `vw` 连续缩放违反项目排版约束
        ③ **修用户反馈（Family / The Day 标题）**：
           - Family 去除英文 kicker 与章节前缀，只保留「我们的家」
           - Details 去除英文 kicker 与章节前缀，只保留「这一天」
        ④ **修用户反馈（猫咪卡片文案）**：
           - Berry「玩具很多，/ 但最爱玩塑料袋。」分两行
           - 荔枝补齐「把自己照顾得超级好。/ 如果她主动蹭你，/ 就是想要被摸。」
           - 小宝补齐「我们救助的流浪猫，/ 现在是家里最粘人的小毛球。」
  v2.09 — Phase 6 venue coordinate calibration（地图位置校准）：
        ① **修用户反馈（Details map pin 位置偏移）**：
           - 以用户确认坐标 `43.781356422003576, 87.61508943244256` 为 WGS84 真值
           - `wedding.json` 写入 WGS84 / GCJ-02 / BD-09 三坐标：高德 / 百度 / Apple / Google 均可直接落点
           - 可搜索地址更新为 `中国新疆维吾尔自治区乌鲁木齐市天山区二道桥民俗风情一条街，邮政编码 830094`
        ② **修静态地图资产**：
           - 归档仓 `generate-venue-map.ts` 改用新坐标重新生成 `venue-1280/2048/2560.png`
           - 通过 GitHub Git Data API 发布 `fb-cdn-misc@v1.2.0`（commit `6ca5069`），仅更新 3 张 venue map PNG
           - 主仓 `asset-versions.ts` `misc` 从 `v1.1.0` 切到 `v1.2.0`
  v2.08 — Phase 6 audit fixes（地图深链 / 日历 / below-fold map / CDN gate 文案 / Three.Clock 待办）：
        ① **修 P2（Google Maps 链接缺 WGS84 坐标）**：
           - Google Maps 链接改为 `query=lat,lng`，不再只用英文地址文本
           - Apple 继续使用 `q=venue&ll=lat,lng`，国内地图仍以 POI 搜索 / 坐标兜底
        ② **修 P2（ICS 使用 TZID 但缺 VTIMEZONE）**：
           - `public/calendar/wedding-2026-06-14.ics` 改为 UTC `DTSTART/DTEND`
           - 本地时间仍对应 `2026-06-14 19:00–23:00 Asia/Shanghai`
        ③ **修 P2（Details map below-fold eager load）**：
           - 地图 `<img>` 改回 `loading="lazy"`
           - 仅当 `#the-day` 深链或地图接近视口时，脚本升级为 eager/high 并启动失败计时
           - 避免首屏 Cover 阶段抢 LCP 带宽，也避免未入视口前 4.5s timeout 误显 fallback
        ④ **修 P2（build-time-check 成功文案误报）**：
           - 单边失败与双边网络不可判定 warning 分开统计
           - 若双边只是 timeout/network 不确定，不再输出"至少一侧 CDN 可用"，只输出"未发现确定性 403/404 配置错误"
        ⑤ **纳入 P3 待办（THREE.Clock 上游 warning）**：
           - 本地业务代码已不读 `state.clock`；浏览器仍可能由 three / R3F / drei 内部 `new THREE.Clock()` 打出 deprecation warning
           - 明确加入 Phase 7 性能/依赖待办：评估升级 R3F/drei/three 或上游 Timer 迁移；继续禁止全局 `console.warn` monkey-patch
  v2.07 — Phase 6 Details / Closing / global nav implementation（这一天 + 收束落款）：
        ① **新增 Details 章节**：
           - 首页 Family 之后追加 `#the-day`，渲染「这一天」（v2.10 去除英文 kicker 与章节前缀）
           - 三栏信息：日期 `二〇二六年六月十四日`、时间 `晚七点 / 19:00–23:00`、地点 `二道桥大剧院`
           - 保留用户指定主句 `花径不曾缘客扫，蓬门今始为君开。`
        ② **新增 DetailsMap / 地图导航**：
           - `DetailsMap.astro` 使用 misc CDN 的 `map/venue-1280/2048/2560.png`
           - primary/backup URL 同时写入 `srcset` / `data-srcset-alt`，资源失败时显示文字 fallback + 同款地图链接
           - 国内地图以 POI 搜索优先；Apple / Google 使用 WGS84 与场地名，所有链接不含 `null`
        ③ **新增 calendar + contact**：
           - `public/calendar/wedding-2026-06-14.ics`：2026-06-14 19:00–23:00 Asia/Shanghai
           - `SoftRSVP.astro` 提供电话、复制手机号、微信二维码 dialog；不展示微信号
           - QR 资源 `public/wechat-qr/WeChat.JPG` 走 BASE_URL，GitHub Pages 子路径下可用
        ④ **新增 Closing 收束区**：
           - `#closing` 不渲染“尾声 · 此后山高路长”标题，只保留用户确认正文与落款
           - 落款进入视口前预热 Ma Shan Zheng；closing section 设 100svh，hash deep link 可 composed-frame 落位
        ⑤ **新增全局导航**：
           - Cover / Invitation / Story / Family / The Day / Closing 补稳定锚点
           - 桌面右上 nav 首屏后出现；移动端右下浮点菜单；左侧 1px reading progress rail
        ⑥ **验收摘要**：
           - `tsc --noEmit` 0 errors；prettier clean；`pnpm build` 0 errors / 0 Vite warnings
           - 本轮 `prebuild` 在稳定网络曾 34/34 photo dimension clean pass；后续 CDN 抖动构建可出现 non-blocking warning
           - 本地 Chrome smoke：wide/mobile `#the-day` + `#closing` deep link 可达；QR dialog open/ESC close；禁用文案 0 命中；地图 CDN stalled 时 fallback 可读
  v2.06 — Phase 5 Family balanced layout audit fix（720+ 统一相册 spread + 文档保护点同步）：
        ① **修 P2（720–1099px 仍保留旧的三猫错位布局）**：
           - FamilySection 的新版 spread 从 `min-width: 1100px` 下放到 `min-width: 720px`
           - 720px 以上统一为 Berry 左列跨两行，荔枝/小宝右列上下堆叠
           - Berry-荔枝水平 gap 与荔枝-小宝垂直 gap 使用同一 `clamp(1.2rem, 1.7vw, 1.5rem)`，不再保留旧 `margin-top: 5rem` 错位
        ② **修 P3（PLAN 保护点与 FamilySection 头注释漂移）**：
           - PLAN 版本推到 v2.06，记录 `01ca2b2` 之后的 balanced layout 审计修复
           - FamilySection docblock 同步到当前 moment-flow / 满宽图片 / 720+ balanced spread / reduced-motion 契约
  v2.05 — Phase 5 Family card narrative refinement（去重短描述 + 文图交替满宽）：
        ① **修用户反馈 #1（姓名下重复小字）**：
           - Family card 删除 name 下方 role / subtitle 行
           - 不再显示 "爱翻肚皮的老大 / 把自己照顾得超级好 / 家里最粘人的小毛球" 这类与正文重复的小字
        ② **修用户反馈 #2（文案与图片顺序配合）**：
           - `family.json` 从 portrait/gallery 改为 `moments[]` 叙事流
           - Berry：姓名 → berry-portrait；"爱翻肚皮的老大" → berry-belly；"玩具很多，但最爱玩塑料袋。" → berry-bag
           - 荔枝：姓名 → lizhi-portrait；"就是想要被摸。" → lizhi-petting
           - 小宝：姓名 → xiaobao-blue-eyes；"现在是家里最粘人的小毛球。" → xiaobao-portrait
        ③ **修用户反馈 #3（每行单图满宽）**：
           - FamilySection 改为每个 moment 一张照片，`picture/img` 宽度 100%
           - 删除两列 gallery / only-child 58% 宽度等旧规则
        ④ **schema / gate 同步**：
           - cats schema 改为 `cats[].moments[].photo`
           - dimension gate 遍历 visible cat moment photos；当前覆盖 12 story + 15 finale + 7 cats = **34 张**
  v2.04 — 修复 PLAN 非版本化 P3（路线图纳入主仓保护）：
        ① **修 P3（PLAN.md 仅在本地非 git 目录，无法作为正式保护点）**：
           - 自 v2.04 起，将本文档同步到主仓根目录 `PLAN.md`
           - 主仓 `PLAN.md` 作为版本化路线图副本，后续 Phase 决策应随代码一起 commit / push
           - 当前这个本地文档目录继续作为编辑工作镜像；若二者分叉，以主仓版本化 `PLAN.md` 为发布/审计准线
        ② **下一步决策明确**：
           - Phase 5 Family 第一版已经可作为主叙事尾部章节保留
           - 下一步不继续加 Lightbox；优先进入 Phase 6「第四章 + 尾声」前置设计审查与实施计划
           - 在进入 Phase 6 前，只保留一个人工项：三只猫文案最终校对（§5.1.6）
  v2.03 — Phase 5 审计修复收口（Family 文案单一源 + 真实 gate 口径 + 主仓保护点）：
        ① **主仓保护点更新**：
           - Phase 5 Family 本地实现已提交并 push：`e3f083e Add Phase 5 family section`
           - GitHub Pages run 25622375932 success；Phase 5 不再停留在 untracked / local-only 状态
        ② **修 P2（Family caption 绕过 content 单一源）**：
           - `FamilySection.astro` 删除组件内 `captionLines` 硬编码
           - 页面直接消费 `family.json` 的 `cat.caption`，并在组件内按中文标点自动分行；后续改 JSON 文案会同步到页面
        ③ **修 P2（PLAN 误写 35/35 clean verified）**：
           - 保留真实能力：dimension gate 已覆盖 12 story + 15 finale + 8 cats = 35 photos
           - 修正文档口径：当前本地网络 probe 有 CDN warning；只能说"覆盖 35 张"，不能说"本轮已 35/35 clean pass"
           - 发布前若要把尺寸验证作为 go/no-go gate，应在稳定网络下重跑并取得 35/35 clean pass，或在 CI/release 环境把 warning 升级为 fail
  v2.02 — PLAN 状态同步 + Phase 5 实施口径落地（对齐保护点 `3d16da1`，记录 Family 本地实现）：
        ① **保护点更新**：
           - v2.01 保护点：`e095491`
           - 当前 Phase 4 线上 smoke matrix 后保护点：`3d16da1`
           - `3d16da1` 是进入 Phase 5 前的 GitHub Pages 保护点；Phase 5 当前为本地工作区实现，尚未 commit/deploy
        ② **Phase 4 决策收口**：
           - Phase 4 final online smoke matrix 已完成，beat 11 / beat 12 的 canvas sizing、
             hash composed-frame、finale pure-star landing、Pearl_04 hold、resource failure
             fallback 均作为保护点验收项保留
           - optional Lightbox 不进入 Phase 5；继续保持 redesign-deferred
        ③ **Phase 5 实施口径修正**：
           - 旧计划中的 `CatCard.tsx` / hover 切主图不再作为第一版要求
           - 第一版改为 Astro-only `FamilySection.astro`：三只猫家庭相册，全部图片直接可见，
             不新增 WebGL / React island / Lightbox
           - `cats` schema 中 `photoRef.width/height` 改为必填，8 张 cat photos 加入
             build-time dimension gate；gate 覆盖范围从 27 张提升到 **35 张**
        ④ **当前本地实现验收摘要**：
           - `src/content/cats/family.json` 8 张 cat photo 均带真实 width/height
           - `src/components/family/FamilySection.astro` 已接入首页尾部，浅纸面独立 stacking context，
             不继承 finale 深色星空
           - wide 1375×997 / mobile 390×844 / primary CDN blocked smoke 均通过；Lightbox 入口 0
  v2.01 — PLAN 状态同步 checkpoint（对齐当前主仓 `e095491`，记录 Lightbox 撤回与 finale 初始帧修复）：
        ① **修本文档保护点漂移**：
           - v2.00 记录的保护点是 `0998b49 Harden R3F story rendering`
           - 当前真实主仓已经推进到 `e095491 Remove finale lightbox and start finale at starfield`
           - `main...origin/main` clean，同步到 origin/main；GitHub Pages 最新部署已通过
           - 本文档 header status / Phase 4 子任务 / 页脚同步到 v2.01 + `e095491`
        ② **v2.00 后已发生的真实变更**：
           - `9c4a257 Harden finale motion and fallbacks`：引入 finale motion tier
             (full/lite/static)、low-power/reduced-motion 降级、JS/WebGL/texture
             failure fallback，并曾加入 finale-only Lightbox
           - `e095491 Remove finale lightbox and start finale at starfield`：
             撤回右上角 Lightbox 入口，删除 `FinaleLightbox.astro`，并把
             `#beat-12-heading` / 刷新首帧改为**纯星空**，避免第一张或最终海报提前泄露
        ③ **Lightbox 决策更新**：
           - optional Lightbox 不再是 Phase 4 当前下一步
           - 原因：实测右上角入口会卡死，且其设计价值需要重新论证；主滚动叙事不依赖它
           - 后续若重启，必须先做独立 redesign：入口、焦点陷阱、资源加载、滚动锁定、
             与 finale progress 解耦全部重新审计；不得直接恢复 v1.100 前的实现
        ④ **下一步明确排序（v2.01）**：
           1. 先跑 Phase 4 最终验收矩阵：wide 1375×997 + mobile 390×844，
              beat 11 / beat 12，normal / reduced-motion / lite / 资源失败场景都覆盖
           2. 只修矩阵暴露的 P1/P2：资源访问、canvas sizing、hash composed frame、
              finale 初始纯星空、首次滚动入场、Pearl_04 final hold、mobile / low-power 行为
           3. 验收通过后再决定 Phase 5 或 Lightbox redesign；Lightbox 不作为当前默认下一步
  v2.00 — PLAN 状态同步 checkpoint（对齐当前主仓 v1.99 hardening，文档不改运行时代码）：
        ① **修本文档状态漂移**：
           - 旧 header 停在 v1.93，仍把 §2.C 描述成 "独立夜空 + 8 方位入场"
             的早期状态；当前主代码仓已推进到 `0998b49 Harden R3F story rendering`
             并 push `origin/main`
           - header version / last_updated / status 同步到 v2.00 / 2026-05-09
           - 页脚保护点从 v1.89 改到 v2.00 + `0998b49`
        ② **当前真实保护点**：
           - 主仓路径：`~/projects/forever-begins/`
           - HEAD：`0998b49 Harden R3F story rendering`
           - CI：GitHub Actions run 25598518278 success
           - working tree：clean，`main...origin/main`
           - 机器验证：`tsc --noEmit` 通过；Node 22.22.0 下 `pnpm build`
             通过；prebuild photo dimension gate 27/27 通过
           - CDN gate 观察：当前 Statically backup 有 timeout warning，但 7 个
             target 的 primary 正常；策略为"至少一侧可用即通过，单边 warning
             记录但不阻塞"
        ③ **v1.94-v1.98 已完成范围归档**：
           - `669b891 Tune finale star sizes`：星空 / 照片散开星点尺寸调优
           - `2fa8620 Harden finale poster hold`：final Pearl_04 主海报 hold
             与终态重复显示问题修复
           - `e187c53 Contain finale starfield background`：finale 星空只作用于
             finale stage，不遮挡 beat 10 与 GlobeDistanceScene
           - `1a11ce5 Make finale poster hold single-source`：Pearl_04 终态视觉
             收敛到单一来源，避免 fallback / R3F 双重海报漂移
        ④ **v1.99 hardening 已完成范围归档**：
           - R3F Canvas 显式 sizing：GlobeDistanceScene / StarCarouselFinale 的
             Canvas style 固定 `width:100%; height:100%; display:block`，Astro
             wrapper CSS 兜底 `canvas { width/height:100% !important }`
           - hash composed frame hard sync：Globe / Finale 深链写入
             `data-initial-progress` / `data-progress` 并派发自定义事件，避免
             native hash 落在非导演帧
           - StarCarouselFinale runtime texture loader 改为 dual-host first-success：
             primary+backup 并发，AbortController 5s timeout，首个成功 texture
             立即 abort losers；双败时精确 console.warn 并隐藏该 photo
           - Finale JS/WebGL/texture failure fallback：JS-on fallback poster 默认
             可见，首个真正可见 photo frame ready 后才淡出；WebGL/chunk/texture
             失败时保留 Pearl_04 + finale 文案，不给用户空星空
           - 最小资源失败验证：模拟当前主照片 primary+backup 全败，fallback
             保持可见，canvas 无 runtime exception
        ⑤ **Phase 3 / §2 结论**：
           - StoryPoemScroller / PoemBeat / GlobeDistanceScene / StarCarouselFinale
             已经从 "first implementation" 进入 "hardened baseline"
           - 之后除 P1/P2 regression，不再继续在 §2 中追加新叙事功能；下一步
             工作转入 Phase 4 验收与 Lightbox / reduced-motion polish
        ⑥ **下一步明确排序**：
           1. v2.00 后先跑 Phase 4 验收矩阵：wide 1375×997 + mobile 390×844，
              beat 11 / beat 12，含资源失败与 reduced-motion
           2. 修 Phase 4 发现的 finale reduced-motion / low-power 问题
           3. 再实现 optional Lightbox；Lightbox 只做附属查看，不改变主滚动叙事
  v1.93 — §2 batch 8 收口（修 v1.92 audit 4 P2 + 1 P3 + 用户视觉要求 3 项）：独立夜空 + 8 方位入场 + 永久星点 reveal + 亮度修 + hash 硬同步：
        ① **修 P2-1（hash 落点 data-progress=0.000，align 与 island hydrate 时序竞争）** ·
           StoryPoemScroller.astro + StarCarouselFinale.tsx：
           - v1.92 lazy useState 读 scroll position 在部署上仍出现 progress=0
           - 新增 **dataset 硬同步**：alignHash 把 0.04 写
             `finaleBeat.dataset.initialProgress`；StarCarouselFinale lazy
             useState **优先读 dataset attribute**，fall back scroll-derived
           - alignHash 后显式 `dispatchEvent(new Event("scroll"))` 保险叫醒
             listener（某些 UA "auto" behavior scroll 不 fire 事件）
        ② **修用户视觉要求 #2（照片调暗）**：
           - 自定义 ShaderMaterial fragment 加 `pow(photo.rgb, 2.2)` —— 不像
             Three 内置 lit material 自动注入 sRGB→linear，custom shader 不转
             → renderer outputColorSpace=sRGB 二次 encode 让图变暗一档
           - 手动转后 renderer 输出 encode 回到原图色阶；star glow 边缘色
             同步 pow(2.2) 在 linear 空间保 honey 色
        ③ **修用户视觉要求 #3（照片从不同方位出现）+ P2-3** ·
           StarCarouselFinale.tsx 新增 ENTRY_DIRECTIONS：
           - 8 方位循环：top-left / top / top-right / right / bottom-right /
             bottom / bottom-left / left
           - 每张按 `i % 8` 决定方位；ENTER 期 (life < 0.18) 沿方向从远方
             `direction × 1.4 单位` 飘到中央，cubic ease-out
           - position 与 scale 同时变化 → "由远方某方位飘入中央并放大"
           - reduced-motion 不偏移；PhotoPlane 加 `index` prop
        ④ **修用户视觉要求 #1（夜空背景脱离地球调性）+ P2-2** ·
           StarCarouselFinale.tsx 新增 NightSkyBackground + 升级 StarField：
           - **NightSkyBackground**：全屏 plane (z=-8, 4× viewport) +
             ShaderMaterial
             * 径向渐变：中心 #070a1c 深邃午夜蓝 → 外圈 #030308 接近墨黑
             * 微弱 fbm 给"云层 / 银河晕"非死板色相，强度 0.012 不抢主体
           - **StarField 320 → 1500 颗**，独立 ShaderMaterial：
             * 每颗带随机 (size, brightness)：80% 1-2px / 17% 3-5px / 3% 7-10px
             * 暖白色 (1.0, 0.97, 0.88) 而非纯白；圆形 falloff 软边
           - Canvas clearColor #1d1d18 (globe 沿用) → **#06091a** finale 独立
           - .finale-stage 背景 CSS 同步换 #06091a
        ⑤ **修用户视觉要求 #3（化作星尘成为星空一部分）+ P2-4** ·
           StarField + uReveal uniform：
           - 1500 颗每颗带 `aRevealAt ∈ [0, 1]` 排序；shader uniform `uReveal`
             由 globalProgress 驱动（基础 0.06 给 hash landing 首屏）
           - vertexShader: `gl_PointSize = aSize * step(aRevealAt, uReveal)`
             aRevealAt > uReveal 时 size=0 隐藏
           - 视觉：访客滚到第 5 张时星点已 5/15 ≈ 33% 满，且每张 dissolve 后
             **永不消失** —— 满足"碎片化作星尘成为星空一部分"契约
        ⑥ **修 P3 doc drift** · FinaleBeat.astro：
           - 删头注释 "入场方位变化 NOT in batch"（v1.93 已实现）
           - 重写 stage 背景注释脱离 "globe 深色 starfield 延续到 finale"，
             改为 "v1.93 起按 finale 自身视觉意图重设满天星辰夜空"
        ⑦ **build / 线上验证**：
           - tsc 0 errors / prettier --write clean / prebuild 27/27 ✓
           - pnpm build: 0 errors / 3.81s 完成 / **0 warnings**
           - dist StarCarouselFinale chunk 行为指纹：
             * `initialProgress` key (dataset 硬同步) ✓
             * `pow(2.2)` (sRGB→linear) ✓
             * `uReveal` uniform + `aRevealAt` attribute ✓
             * NightSky 着色器内圈色 `0.027` ✓
             * Canvas clearColor `06091a` ✓
             * 旧 `1d1d18` 完全移除 ✓
           - chunks: three 714KB / r3f-drei 359KB / GlobeDistanceScene 81.5KB /
             **StarCarouselFinale 7.75KB → 11.53KB**（+3.78KB = NightSky shader
             + StarField shader + ENTRY_DIRECTIONS + sRGB→linear）/
             StoryPoemScroller script 8.82KB / 都在 750 budget 内
           - dist CSS .finale-stage `background:#06091a` ✓
        ⑧ git: `20fca1d` · CI run [25529255324](https://github.com/YiTiane/forever-begins/actions/runs/25529255324)
        ⑨ **NOT in this batch**（仍留 §2.C v0.5+）：
           - DESIGN §2.C 高端机 GPU 粒子星尘（当前 1500 静态 reveal 已具骨架）
           - 文字 stagger（poems lines 是定格静态）
           - upstream THREE.Clock dep warn（同 §2.B，等 R3F / drei 升 Timer）
        ⑩ **§2 batch 9 next**：v1.93 实地验证 hash 落点稳定 / 8 方位入场 /
           星点 reveal 增长 / 照片亮度回归原色；通过后做跨 viewport 截图复审。
  v1.92 — §2 batch 8 收口（修 v1.91 audit 4 P2 + 1 P3）：finale 时间线 + 帧循环 + dual-host fallback：
        ① **修 P2-1（hash 落点 0.07 是过渡帧 + island 首帧 progress=0）** ·
           StoryPoemScroller.astro + StarCarouselFinale.tsx：
           - 旧 0.07 × 15 = 1.05 → photo 0 已完整 dissolve，photo 1 lifecycle
             0.05 刚要入场（基本不可见）；audit 截图 #beat-12-heading 是空白
             深 stage
           - **alignHashToComposedFrame 改 0.07 → 0.04**：配合 v1.92
             LIFE_DURATION=1.4 → photo 0 lifecycle ≈ 0.43（HOLD 中段）
           - **进度 useState 改 lazy initializer**：mount 时同步
             `document.querySelector('.finale-beat').getBoundingClientRect()`
             算当前 progress；hash align 完成后 island 首帧即可拿对值
        ② **修 P2-2（相邻照片时间线 0 重叠，黑暗过渡帧）** ·
           StarCarouselFinale.tsx SceneInner：
           - 旧 `life = globalProgress × N - i`：每张占 1/N 全局，photo i
             完整走完 dissolve 后 photo i+1 才入场，audit 截图 progress=0.131
             时当前 photo 已大半 dissolve 下一 photo 还未接力 → 暗淡过渡
           - 新增 `LIFE_DURATION = 1.4`；改
             `life = (globalProgress × N - i) / 1.4`：每张实际占用 1.4/N
             全局，相邻有 0.4/N 视觉重叠 → photo i lifecycle 0.71 (EXIT) 时
             photo i+1 lifecycle 0 (ENTER)，"碎片化为下一张"接力
        ③ **修 P2-3（普通模式 always frameloop 让 GPU idle 时空跑）** ·
           StarCarouselFinale.tsx Canvas + 新 ProgressInvalidator：
           - 旧 `frameloop={reducedMotion ? "demand" : "always"}` → 普通模式
             60fps rAF 空跑；与 §2 / §2.B 已经建立的 idle 0 CPU 守卫不一致
           - 改 frameloop **统一 "demand"**；新增 `<ProgressInvalidator>`：
             useThree invalidate + useEffect[progress] → progress 变时显式
             invalidate 一次 → useFrame 派发新 lifecycle → 写新 uniform → 再
             idle。drei OrbitControls / Suspense texture mount / resize 由
             默认 invalidate 兜底
        ④ **修 P2-4（runtime 只信 jsDelivr，区域抖动整张 photo 永挂）** ·
           StarCarouselFinale.tsx + 新 DualHostTextureLoader：
           - 新建 `DualHostTextureLoader extends THREE.Loader`：把
             "primary||backup" 编码成 useLoader cache key；.load 拆分 →
             先试 primary，onError 自动降到 backup；双败才 throw 被外层
             `<Suspense fallback={null}>` 吃掉单张隐藏
           - PhotoPlane 切到 `useLoader(DualHostTextureLoader, "primary||backup")`；
             drop drei `useTexture` import；colorSpace 自动设 SRGB
        ⑤ **修 P3（FinaleBeat 头注释还说"双重 fallback / Pearl_04 是 SSR 占位"）** ·
           - 重写 v0.3 head：明示数据流 / 渲染机制 v0.2 (alpha=false +
             深色 stage + fallback noscript only) + v0.3 (相邻照片时间线
             overlap)；保留历史注释链路给后续审计
        ⑥ **build / 线上验证**：
           - tsc 0 errors / prettier --write clean / **prebuild 27/27** ✓
           - pnpm build: 0 errors / 3.59s 完成 / **0 warnings**
           - dist 实测 StarCarouselFinale chunk 关键字：
             * `1.4` literal ✓ (LIFE_DURATION)
             * `||` separator ✓ (DualHostTextureLoader)
             * `frameloop:"demand"` ✓
             * `setClearColor` / `finale-beat` ✓
             * `primary` / `backup` 字面 ✓ (cdnUrl host 参数)
             * `invalidate` substring ✓ (ProgressInvalidator)
           - chunks: three 714KB / r3f-drei 359KB / GlobeDistanceScene 81.5KB /
             **StarCarouselFinale 7.75KB**（v1.91 7.03KB → +720B = DualHostTextureLoader
             class + LIFE_DURATION + ProgressInvalidator + lazy useState init）/
             StoryPoemScroller script 8.75KB / 都在 750 budget 内
           - § 0 / § 1 / § 2.A / § 2.B / [N] CountUp / 拖拽 / a11y 朗读无 regression
        ⑦ git: `018c9b9` · CI run [25528451404](https://github.com/YiTiane/forever-begins/actions/runs/25528451404)
        ⑧ **观察项 / NOT in this batch**（仍留 §2.C v0.4+）：
           - DESIGN §2.C 高端机 GPU 粒子星尘
           - 入场方位变化（每张从不同方向进，DESIGN 提"照片从不同方位出现"）
           - 文字 stagger（poems lines 是定格静态，不随 progress 渐显）
           - upstream THREE.Clock dep warn（同 §2.B，等 R3F / drei 升 Timer）
        ⑨ **§2 batch 9 next**：v1.92 实地验证 hash 落点稳定 / 相邻照片 overlap /
           idle 0 GPU / dual-host fallback 假装 jsDelivr 挂掉测试；通过后做
           跨 viewport 截图复审，§3 / motion polish。
  v1.91 — §2 batch 8 收口（修 v1.90 audit 5 P2 + 1 P3）：finale 走马灯运行链路修复 + 15 张照片 dimension gate：
        ① **修 P2-1（progress 源绑错对象，走马灯一次 wheel 0→1 跳过 15 张）** ·
           `src/components/story/StarCarouselFinale.tsx`：
           - 旧 `containerRef.current?.parentElement` 拿到的是 hydrated React
             岛 = 100vh 内层 sticky stage，scrollable = 0 → progress 一步跳到 1
           - 改 `containerRef.current?.closest('.finale-beat')` → 拿外层 700vh
             scroll spacer，progress 0..1 正确随 15 张 lifecycle 推进
        ② **修 P2-2（hash 深链不落 finale composed frame）** ·
           `src/components/story/StoryPoemScroller.astro` alignHashToComposedFrame：
           - 加 .finale-beat 分支：scrollable * 0.07 ≈ globalProgress × 15 ≈ 1，
             第 1 张 grassland 入场已基本完成、第 2 张接力 → 直达"导演帧"
        ③ **修 P2-3（透明 canvas 让 SSR Pearl_04 fallback 漏底污染走马灯）** ·
           StarCarouselFinale.tsx + FinaleBeat.astro：
           - `<Canvas gl={{ alpha: false }}>` + onCreated 设 clearColor `#1d1d18`
             给"夜空 starfield" opaque 底
           - `.finale-stage { background: #1d1d18 }` 让 hydration 前后 stage
             颜色统一，无浅→深闪动
           - Pearl_04 fallback `<figure>` 整体移进 `<noscript>` —— JS 访客
             根本不渲染 fallback，仅 noscript 用户看主海报
           - DESIGN §2.C "背景从地球的深色星场延续下来" 视觉契约真正落地
        ④ **修 P2-5（hydration 一次性请求 15 张 1600px JPG ~3MB）** ·
           StarCarouselFinale.tsx SceneInner：
           - 改：按 globalProgress 算 currentI = floor(p × 15)，活跃集合 =
             currentI ± 1，只渲染 active 的 PhotoPlane（其它根本不挂载，texture
             不 fetch）
           - 每个 active PhotoPlane 自带 `<Suspense fallback={null}>`，相邻
             照片纹理加载不阻塞当前帧
           - 滚动推进时 active swap：[0,1] → [0,1,2] → [1,2,3] → ... → [14]
        ⑤ **修 P2-4（finalePhotos.ts aspectRatio 14/15 错标横幅）** ·
           `src/lib/story/finalePhotos.ts` v0.1 → v0.2：
           - probe 15 张实测：portrait 0.667 × 11 张 + Wooden_door_05 0.691 +
             Grassland_05 1.345 + Grassland_02/03/04 1.5 横幅
           - 全部 15 张 aspect 改为实测值
           - **`scripts/verify-story-photo-dimensions.ts` v0.4 → v0.5**：在 §2
             photo-poem 12 张 dimension gate 之后追加 finale 15 张 gate；走
             同款 dual-CDN first-valid + abort losers + ±2% aspect tolerance；
             prebuild 实测全 27 张通过
        ⑥ **修 P3（StoryPoemScroller 头注释把 §2.C 列在 NOT-in-batch + finaleLines 注成"临时给 end-cap"）** ·
           - 落地范围加 "§2.C StarCarouselFinale (beat 12) v1.90 接入 + v1.91 收口"
           - "NOT in current batch" 删 §2.C 旧 line 改为 v0.3+ 留 GPU 粒子 /
             入场方位 / 文字 stagger
           - 数据流 finaleLines 注释从"临时给 end-cap"改为"喂给 FinaleBeat
             （自取 finalePhotos.ts 15 张照片序列）"
           - hash deep-link / a11y 段补 .finale-beat 接入信息
        ⑦ **build / 线上验证**：
           - tsc 0 errors / prettier --write clean
           - **prebuild 27/27 通过（含 finale 15 张实测）** ✓
           - pnpm build: 0 errors / 3.80s 完成 / **0 warnings**
           - dist 实测：closest / setClearColor / finale-beat 关键字进
             StarCarouselFinale chunk ✓ / .finale-stage{...background:#1d1d18}
             ✓ / alignHashToComposedFrame minified 含 .finale-beat 分支 ✓
           - chunks: three 714KB / r3f-drei 359KB / GlobeDistanceScene 81.5KB /
             **StarCarouselFinale 7.03KB**（v1.90 6.79KB → +240B = closest 切换 +
             active range 算 + setClearColor）/ StoryPoemScroller script 8.75KB
             （+230B = finale 对齐分支）/ 都在 750 budget 内
           - § 0 / § 1 / § 2.A / § 2.B / [N] CountUp / 拖拽 / a11y 朗读无 regression
        ⑧ git: `be175dc` · CI run [25527645524](https://github.com/YiTiane/forever-begins/actions/runs/25527645524)
        ⑨ **观察项 / NOT in this batch**（仍留 §2.C v0.3+）：
           - DESIGN §2.C 高端机 GPU 粒子星尘
           - 入场方位变化（每张从不同方向进，DESIGN 提"照片从不同方位出现"）
           - 文字 stagger（poems lines 是定格静态，不随 progress 渐显）
           - upstream THREE.Clock dep warn（同 §2.B，等 R3F / drei 升 Timer）
        ⑩ **§2 batch 9 next**：v1.91 实地拖拽 + reduced-motion 实测 +
           跨 viewport 截图复审（确认 progress 源修后 15 张 lifecycle 真能
           看到 + dark stage 衔接 globe 自然 + active range swap 平滑）；通过后
           §3 / motion polish。
  v1.90 — §2 batch 8 · §2.C StarCarouselFinale v0.1（首版上线，照片走马灯 + Shader Dissolve + final 定格）：
        ① **触发动机**：v1.89 收口后用户决策"开始实现 §2.C StarCarouselFinale"。
           本批次落地 §2.C 第一版，把 main.json beat 12 (kind="finale") 从
           schema 数据点 + v1.60 起的 .story-end-cap 静态 Pearl_04 + 文案占位
           变成可见的 15 张照片走马灯 + Shader Dissolve + final 定格。
        ② **新增 `src/lib/story/finalePhotos.ts`**（v0.1 数据）：
           - 集中 DESIGN §2.C 钦定的 15 张照片顺序：grassland × 5 → wooden-door
             × 3 → pearl × 2 → retro × 4 → final Pearl_04
           - `FinalePhoto = { cdnTarget, stem, aspectRatio, alt }`；
             `finalePhotoUrl(photo, host, width=1600)` 走 cdnUrl() 中央接缝
             与 §0/§1/§2 其它 CdnImage 同源，版本回滚一次性生效
           - `FINALE_FINAL_PHOTO` 导出尾元素，组件用它判断"不再 dissolve"
        ③ **新增 `src/components/story/StarCarouselFinale.tsx`**（v0.1 R3F 岛）：
           - <Canvas> + <SceneInner>：15 张 PhotoPlane + StarField 背景
           - **PhotoPlane**：自定义 ShaderMaterial 三个 uniform (uTex / uOpacity /
             uDissolve)
             * vertexShader 透传 vUv
             * fragmentShader：value-noise 双频混合（vUv*12 低频 + vUv*60
               高频，0.6 / 0.4 加权）+ uDissolve 阈值 → noise > threshold 像素
               discard + 边缘带（threshold-noise ∈ [-0.08, 0]）混入星金色
               (1.0, 0.86, 0.55) → "碎片成为星点" 的 fragment-shader 效果
             * uOpacity 衰减 alpha；alpha=0 时 discard
           - texture 加载后用 image.width/height 重算 plane 比例（防裁切人物）；
             sRGB color space 自动设
           - useFrame 内每帧根据 lifecycle 派发：
             * scaleCurve: 0..0.18 入场 0.82→1.04，0.18..0.62 hold 1.04→1.0
             * opacityCurve: 0..0.18 入场 0→1，之后 1
             * rotateYCurve: 0..0.18 -0.06 rad → 0
             * dissolveCurve: 0.62..1.0 dissolve 0→1（final 永远 0；
               reduced-motion 0）
             * reducedExitOpacityCurve: reduced-motion 替代 dissolve，
               0.62..1.0 alpha 1→0
           - **StarField**：320 个静态星点（hash-rand 分布）做背景，progress
             越大越亮（DESIGN 高端机 GPU 粒子留 v0.2+）
           - **滚动 progress**：自驱（IO + scroll listener，与 GlobeDistanceScene
             同款），globalProgress × 15 - i 给每张照片 lifecycle，相邻两张
             自然 overlap
           - **frameloop**："always" 普通模式 / "demand" reduced-motion，与
             §2.B 同款契约
           - **reducedMotion lazy initializer**（matchMedia）防首帧 always-loop
        ④ **新增 `src/components/story/FinaleBeat.astro`**（v0.1 包装）：
           - 渲染 .finale-beat#beat-12-heading（hash 锚契约与 PoemBeat /
             GlobeBeat 同）
           - 700vh / 500vh / 380vh 三档 spacer（wide / portrait / compact）
             让 15 张有充足节奏 + 终幕定格区
           - 内层 .finale-stage 100vh sticky + grid auto-rows（canvas 1fr /
             text auto，沿用 GlobeBeat v1.79 双行 safe-zone 模式）
           - <CdnImage Pearl_04 priority="auto"> SSR fallback（无 JS / R3F
             失败时仍有主海报）+ <noscript> 终幕文字 + role="img" aria-label
           - <StarCarouselFinale client:visible> 仅视口内 hydrate，与 §2.B
             共享 three / r3f-drei chunk
        ⑤ **修改 `StoryPoemScroller.astro`**：
           - import FinaleBeat
           - `{finaleLines.length > 0 && <FinaleBeat lines={finaleLines} />}`
             替代 v1.60 起的 .story-end-cap 静态 Pearl_04 + lines 占位
           - 删 .story-end-cap / .story-end-card / .story-end-photo /
             .story-end-copy / .story-end-line 旧 CSS（约 65 行）；视觉契约
             由 FinaleBeat 内部 scoped CSS 提供
           - 删 CdnImage import（不再被 scroller 直接使用）
        ⑥ **a11y**：
           - aria-labelledby + sr-only h3 (#beat-12-aria-heading) 同款契约
           - canvas 容器 role="img" + aria-label "走过的回忆 · 最终定格主海
             报：..."
           - shader dissolve 动画对 AT 不可见，AT 仍只读 sr-only h3 + 浮卡
             lines
        ⑦ **build / 线上验证**：
           - tsc 0 errors（noUncheckedIndexedAccess + exactOptionalPropertyTypes
             严格通过）
           - prettier --write clean
           - pnpm build: 0 errors / 3.88s 完成 / 2 page(s) built / **0 warnings**
           - dist 实测：
             * .finale-beat#beat-12-heading × 1 ✓
             * finale-line cn-kaishu 文字浮卡 ✓
             * Pearl_04-1600.jpg fallback CdnImage ✓
             * .finale-canvas-root 在 hydrated chunk ✓
           - chunks: three 714KB / r3f-drei 359KB / GlobeDistanceScene 81.5KB /
             **StarCarouselFinale 6.79KB**（独立懒加载岛，与 globe 共享
             three+r3f-drei chunk）/ StoryPoemScroller script 8.52KB / 都在
             750 budget 内
           - § 0 / § 1 / § 2.A 10 photo-poem / § 2.B globe / [N] CountUp /
             拖拽 / a11y 朗读无 regression
        ⑧ git: `deb51db` · CI run [25511673865](https://github.com/YiTiane/forever-begins/actions/runs/25511673865)
        ⑨ **NOT in this batch**（仍留 §2.C v0.2+）：
           - DESIGN §2.C "高端机 GPU 粒子星尘"（当前 StarField 是静态 320 点）
           - 入场方位变化（每张从不同方向进，DESIGN 提"照片从不同方位出
             现"）—— 当前全部从中心 scale + 极小 rotate Y
           - 文字 stagger（poems lines 是定格静态，不随 progress 渐显）
           - reduced-motion 路径下的 "crossfade + 静态星点" 完整化
           - finale photos CDN dimension gate（verify-story-photo-dimensions.ts
             目前只覆盖 §2.A 12 张 photo-poem 用照片；finale 15 张暂未在
             prebuild gate，runtime 若有 stem typo 会 texture 加载失败）
           - upstream THREE.Clock dep warn（同 §2.B，等 R3F / drei 升 Timer）
        ⑩ **§2 batch 9 next**：v1.90 走马灯跨 viewport 截图复审 + a11y 实测 +
           reduced-motion 实测 + 拖拽 / 入场动画手感复审；finale photos
           dimension gate 接入 verify-story-photo-dimensions.ts；通过后开始
           §3 / 后续 motion polish。
  v1.89 — Globe distance analogy 文案回撤（按用户新决定）：
        ① **内容源回撤** · `src/content/journey/long-distance.json`：
           - 删除 `comparisonCn` 字段；long-distance 单一源只保留 from / to / distanceKm / routes
        ② **schema / 渲染回撤** · `src/content.config.ts` + `GlobeBeat.astro`：
           - journey schema 删除 `comparisonCn?: string`
           - 视觉卡片删除 `.globe-km-comparison` 行；aria-label 删除 comparison 拼接；noscript fallback 回到“我们最远时相距 10,755 公里”
           - 保留 v1.88 的多地点路线网络与高对比路线颜色，不回退 GlobeDistanceScene
        ③ **机器验收**：
           - `rg "comparisonCn|globe-km-comparison|新加坡东西跨度"` 在 src / dist 中 0 命中；prettier clean；`pnpm exec tsc --noEmit` 0 errors；`pnpm build` 0 warnings；Story photo dimension gate 12/12 通过
  v1.88 — Globe route contrast + distance analogy（修用户 v1.87 复审两点反馈）：
        ① **路线颜色对比修复** · `src/components/story/GlobeDistanceScene.tsx`：
           - primary route 颜色从普通 honey/sage 系过渡到高亮蜜金 `#ffd45a`，TubeGeometry 半径 0.007 → 0.010，opacity 呼吸区间调到 0.74–1.00
           - secondary route 不再复用地图本身 sage 绿，改暖白 `#fff1b8`，半径 0.0024 → 0.0042，opacity 0.32 → 0.78
           - endpoint 同步改用 route 高对比色，secondary 点从纸白低透明变成暖白 0.82，避免与大陆轮廓和经纬网混在一起
           - `toneMapped={false}` 防 WebGL tone mapping 把高亮路线压回暗绿范围
        ② **距离类比文案接入** · `src/content/journey/long-distance.json` + `GlobeBeat.astro`：
           - long-distance 内容新增 `comparisonCn: "是新加坡东西跨度的 215 倍。"`
           - 视觉卡片在 “我们最远时相距 10,755 公里” 下新增一行类比句
           - aria-label / noscript fallback 同步；aria 版去掉句末标点后再拼 routeLabel，避免 “倍。，并” 这类标点漂移
           - `content.config.ts` journey schema 加 `comparisonCn?: string`
        ③ **截图验收**：
           - `/private/tmp/forever-audit-images/v188-globe-route-contrast-final.png`：宽屏本地浏览器复审通过；主线蜜金、次线暖白在深绿 Natural Earth 地图上可肉眼区分，文案类比句在卡片底部可读
        ④ **机器验收**：
           - prettier clean / `pnpm exec tsc --noEmit` 0 errors / `pnpm build` 0 warnings；build-time-check 7/7 CDN target 健康；Story photo dimension gate 12/12 通过
  v1.87 — Story hash composed-frame + Globe 多地点路线网络（修 v1.78-v1.86 遗留审计 + 用户新增路线需求）：
        ① **P2 · hash anchors 仍可能落到非组合帧** · `src/components/story/StoryPoemScroller.astro`：
           - 新增 `alignHashToComposedFrame()`，不再让原生 hash scroll 停在 scroll-spacer 边界
           - `.poem-beat` wide 模式滚到 `HOLD_PHASE` 稳定完成区；compact / portrait 滚到可读入场区；`.globe-beat` 滚到内部 22% 位置，避免直接显示上一段 Pearl / 下一段残片
           - hashchange 与首帧 rAF 都触发同一逻辑，并即时写 progress，保证审计 URL / 分享 deep-link 都落到可读导演帧
           - 截图验收：`/private/tmp/forever-audit-images/v187-beat08-hash-aligned.png` 显示 beat 08 真实组合帧；`/private/tmp/forever-audit-images/v187-beat11-hash-aligned-after-load.png` 显示 globe 组合帧
        ② **P3 · 文档 / 注释漂移收口**：
           - StoryPoemScroller 头注释 v0.9/v1.75 → v1.0/v1.87，补 hold plateau、compact/portrait progress、hash alignment、globe 多路线职责
           - content.config / main.json 的 beat 05 CountUp 注释改为已实现，不再写“留独立小刀”
           - PoemBeat sticky 注释改为 data-story-mode 的 compact / portrait / wide 语义，删除旧 541-719 / 720px 断点叙述
           - tokens.css 删除 v1.83 light-only 后未消费的 `paper-night` token / alias
        ③ **新增需求 · GlobeDistanceScene 多地点路线网络**：
           - `src/content/journey/long-distance.json` 新增 6 条 `routes[]`：乌鲁木齐 ↔ 墨尔本（primary）、重庆 ↔ 乌鲁木齐、重庆 ↔ 合肥、杭州 ↔ 合肥、乌鲁木齐 ↔ 合肥、乌鲁木齐 ↔ 新加坡
           - `content.config.ts` 的 journey schema 加 `routes?: { from, to, kind }[]`，保留旧 `from/to` primary fallback
           - `GlobeBeat.astro` 向 R3F island 传 routes，并把新增城市名纳入 aria-label
           - `GlobeDistanceScene.tsx` 改为多 route 渲染：primary 使用更粗 honey TubeGeometry + opacity 呼吸闪烁；secondary 使用细 sage 线常显；端点按城市去重，primary 端点保留 halo
        ④ **机器 + 浏览器验收**：
           - `pnpm exec tsc --noEmit` 0 errors；prettier clean；`pnpm build` 0 warnings；build-time-check 7/7 CDN target 至少一侧可用；Story photo dimension gate 12/12 通过
           - Browser Use 宽屏截图复审：beat 08 / beat 11 hash deep-link 均落到对应组合帧；globe chunk hydrate 后可见 Natural Earth 大陆、主路线粗线闪烁、次路线细线常显
  v1.86 — SnowAtmosphere 雪层真正可见（修用户“电脑和手机都看不到下雪动画”反馈）：
        ① **根因** · `src/components/story/SnowAtmosphere.astro` + `src/components/story/PoemBeat.astro`：
           - v1.65–v1.85 把 `.snow-atmosphere` overlay 样式写在父组件 `PoemBeat.astro` 的 scoped CSS 中
           - Astro 编译后选择器变成 `.snow-atmosphere[data-astro-cid-im2rhl7z]`，但 canvas 是子组件 `SnowAtmosphere.astro` 生成的 DOM，不带父组件 cid
           - 结果 position / inset / z-index / mix-blend-mode 全部不命中；canvas 不是照片上的 overlay，桌面和手机都看不到预期雪层
           - 另一个隐患：图片懒加载前 canvas 可能按 0×0 初始化，图片获得真实高度后没有 ResizeObserver 重新同步 backing store
        ② **修法**：
           - `.snow-atmosphere` 样式移回 `SnowAtmosphere.astro` 本组件 scoped CSS：`position:absolute; inset:0; width/height:100%; z-index:3; mix-blend-mode:screen`
           - `PoemBeat.astro` 删除父组件 `.snow-atmosphere` 规则，并在注释里记录不要跨组件写 scoped selector
           - mobile fallback 单独保留 `vignette` figure 的 `position: relative !important; overflow:hidden`，保证手机单列流式下 canvas 仍锚定照片框
           - `SnowAtmosphere` 加 `ResizeObserver` 监听 canvas + 父 figure；尺寸从 0 变为真实值或容器缩小时重建粒子并立即绘制静态帧
           - 粒子数量 / 半径 / opacity 小幅上调（32–72 粒，1.1–3.2px，0.55–0.92 alpha），确保暗角 / 高 DPR 设备下可见
        ③ **截图验收**：
           - `/private/tmp/forever-audit-images/v186-snow08-fixed-viewport.png`：Snow_08 照片上方可见白色雪粒，文字浮卡三行完整可读
           - `/private/tmp/forever-audit-images/v186-snow08-fixed-viewport-2.png`：0.8s 后雪粒位置变化，证明动画 rAF 路径在可见时运行
        ④ **机器验收**：
           - prettier clean / tsc 0 errors / pnpm build 0 warnings；Story photo dimension gate 12/12 通过
           - dist HTML 中 canvas 现为 `<canvas class="snow-atmosphere" data-astro-cid-lqnyvnjn>`，dist CSS 中对应 `.snow-atmosphere[data-astro-cid-lqnyvnjn]`，selector 与 DOM 真实匹配
  v1.85 — Snow_08 vignette 空白文字框修复（修用户“照片下面多了一个空白框 / 下雪动画消失”反馈）：
        ① **根因** · `src/components/story/PoemBeat.astro`：
           - v1.69 为 deep-link 只让第 1 行诗句常亮，第 2/3 行用 `--p-text` opacity gate 渐显
           - hidden lines 仍占布局高度；hash / 快速滚动落点会看到“只有首句 + 下方大面积空白”的深色面板
           - 视觉上像 Snow_08 照片下面多出一个空白框，干扰用户对雪动画舞台的理解
        ② **修法**：
           - vignette `.poem-text p` 全部 `opacity: 1`，取消第 2/3 行 opacity gate
           - Snow_08 的动态重点交还给 `SnowAtmosphere` canvas；文字层保持完整可读，不再牺牲阅读帧换 stagger
           - `SnowAtmosphere.astro` 头注释同步：reduced-motion 下是静态首帧雪粒，不是“留空白”
        ③ **截图验收**：
           - in-app browser `/private/tmp/forever-audit-images/v185-snow08-locator-click.png`：Snow_08 深色浮卡三行均可读，不再出现空白面板
        ④ **机器验收**：
           - tsc 0 errors / prettier clean / pnpm build 0 warnings；Story photo dimension gate 12/12 通过
  v1.84 — Story compact/portrait 入场动画 + wheel progress smoothing（修用户 iOS 无照片动画 / 鼠标滚轮节间卡顿反馈）：
        ① **compact / portrait 不再短段直接终态** · `src/components/story/StoryPoemScroller.astro`：
           - 旧逻辑：`offsetHeight <= viewport` 时 `computeProgress()` 直接 return 1；在 iOS / 窄屏自然流式 Story beat 中，很多小节高度不超过视口，照片一开始就是完成态，看起来“完全没有动画”
           - 新逻辑：`compact` / `portrait` 改用 viewport-entry progress：元素 top 从 `92vh → 42vh` 映射 `0 → 1`
           - wide / sticky 模式继续使用 scroll spacer + `HOLD_PHASE = 0.64`，不降低完成帧质量
           - `prefers-reduced-motion: reduce` 仍保持终态：如果 iOS 系统打开“减少动态效果”，无照片动画是正确行为；未打开时应看到轻量入场
        ② **鼠标滚轮离散 delta 改成短时平滑收敛**：
           - 新增 `targetProgress` / `renderedProgress` 双 WeakMap
           - scroll / resize / RO 事件只更新 target；渲染值用 `PROGRESS_LERP = 0.24` 追 target
           - `PROGRESS_EPSILON = 0.0015` settle 后停止 rAF，滚动停止后回到 0 idle CPU；不引入 Lenis / GSAP，避免在本批扩大运动系统风险
        ③ **hash / reload 初始帧保护**：
           - init 时对每个 beat 写入当前 viewport 下的真实 progress，避免 direct hash / reload 先露出全 0 的未组合帧
           - 离开视口时仍写一次终态 / 初态，保证后续回滚方向状态正确
        ④ **验收**：
           - tsc 0 errors / prettier clean / pnpm build 0 warnings；Story photo dimension gate 12/12 通过
           - in-app browser 截图：
             `/private/tmp/forever-audit-images/v184-story-after-large-scroll.png`：beat 01 宽屏照片 + 文字同屏，Snow_03 / Snow_07 不重叠
             `/private/tmp/forever-audit-images/v184-story-after-wheel.png`：一次 wheel 后仍保持 Story frame 可读，没有纯空白帧
           - 已知非本批：Three / R3F 上游 `THREE.Clock` deprecation warning 仍可能出现在 console；业务代码不直接调用 `getElapsedTime`
  v1.83 — iOS / Safari dark-mode 保护：保留浅黄色纸面设计（修用户 iOS 夜间访问变黑反馈）：
        ① **HTML 主题声明改为 light-only** · `src/layouts/Base.astro`：
           - `<meta name="theme-color">` 从 light/dark 双态改为固定 `#FAF6EC`
           - `<meta name="color-scheme" content="light dark">` 改为 `content="light"`
           - 头注释同步：本站不再让 iOS / Android 顶栏随系统 dark palette 切到 paper-night
        ② **全局 reset 改为 light-only color-scheme** · `src/styles/reset.css`：
           - `html { color-scheme: light dark }` 改为 `color-scheme: light`
           - `html` 与 `body` 都显式使用 `background: var(--bg)`，避免透明根背景被 UA/浏览器策略露出黑底
        ③ **token dark media 改成浅色守卫** · `src/styles/tokens.css`：
           - `@media (prefers-color-scheme: dark)` 不再把 `--bg` 切到 `--color-paper-night`
           - dark preference 下仍重申 `--bg: var(--color-paper)` / `--fg: var(--color-olive-ink)` / light shadows
           - 注释明确：系统级强制反色或第三方浏览器像素级 forced dark 不一定能被 CSS 完全阻止，但本站已给出标准 Web 层面的 light-only 契约
        ④ **验收**：
           - tsc 0 errors / prettier clean / Astro build 0 warnings；Story photo dimension gate 12/12 通过
           - build-time-check 出现 wooden-door backup 单边 CDN warning（primary 正常，脚本按设计不阻塞），与本轮 dark-mode 修复无关
           - dist HTML 含 `<meta name="theme-color" content="#FAF6EC">` + `<meta name="color-scheme" content="light">`
           - dist CSS 含 `html{color-scheme:light;background:var(--bg)}`；dark media 下 `--bg` 仍为 `var(--color-paper)`
           - in-app browser 截图 `/private/tmp/forever-audit-images/v183-light-scheme-visible.png`：页面背景保持浅黄色纸面，不再黑底
  v1.82 — Story rhythm + compact/iOS light motion 收口（修用户 v1.81 体验反馈）：
        ① **Our Story 小节间距 / storytelling 连贯性调整** ·
           `src/components/story/StoryPoemScroller.astro` + `src/components/story/PoemBeat.astro`：
           - `HOLD_PHASE` 从 0.50 调到 **0.64**：动画覆盖更多滚动距离，完成帧仍有
             hold zone，但不再在每段完成后停太久
           - wide scroll spacer 收紧：parallax-pair 170→160vh，diagonal-gaze
             175→165vh，single-photo layouts 155→142vh；减少段与段之间的滚动断裂感
        ② **compact / iOS 不再强制每段 100vh** ·
           `src/components/story/PoemBeat.astro`：
           - `@media(max-width:540px)` 从 `min-height:100vh` 改回内容驱动 `auto`
           - stage padding 从 3rem / 1.25rem 收紧到 1.25rem / 0.85rem；相邻 beat 加
             轻微 negative margin，减少“照片结束后等很久才到下一段文字”的空白带
        ③ **窄屏照片恢复轻量动画**：
           - 原实现为了防重叠，在 ≤540px 里对所有 photo 写 `transform:none!important`，
             所以 iOS 小屏看起来完全没有 Story 照片动画；这不是运行错误，而是过度保守的 fallback
           - v1.82 改为自然单列布局不变，但照片用 `opacity + translateY(12px) + scale(0.985→1)`
             轻量进入；双图按 `--p-photo-1 / --p-photo-2` 做弱 stagger，不使用 absolute / parallax，避免新重叠
           - `prefers-reduced-motion: reduce` 仍保留终态，不强行动画
        ④ **截图验收**：
           - in-app browser 当前窄屏截图 `/private/tmp/forever-audit-images/v182-compact-beat01-after.png`：beat 01 单列无重叠
           - `/private/tmp/forever-audit-images/v182-compact-transition-final.png`：beat 01 → beat 02 交接不再整屏空白，保持必要呼吸但更连贯
        ⑤ **机器验收**：tsc 0 errors / prettier clean / pnpm build 0 warnings；prebuild 12/12 Story photo dimension gate 通过。
  v1.81 — 宽屏 Story photo frame + Natural Earth Globe landmask 收口（修用户 v1.80 宽屏截图审计 5 项）：
        ① **Snow_03 / Snow_07 宽屏 parallax-pair 尺寸统一并放大** ·
           `src/lib/story/beatLayoutSolver.ts`：
           - wide solver 改为 far / near 共用同一个 `fitAspect()` 结果，保证动画初始和
             完成帧两张横幅照片尺寸一致
           - photos column 提升到 stageH 88% / viewport 78%，pairMaxW 提升到
             photosColW 78%（cap 640），pairGap 由 stageH 3.5% 控制；p=1 时
             两图不互相压叠、不压文字，同时显著减少右侧留白
        ② **Snow_14 / Snow_15 宽屏 diagonal-gaze 放大并靠近中央** ·
           `src/lib/story/beatLayoutSolver.ts` + `src/components/story/PoemBeat.astro`：
           - photoMaxW 0.28→0.32，photoMaxH 0.42→0.48，textW 收紧到
             clamp(stageW*0.32, 340, 400)
           - CSS corner inset 6%→9%，entrance transform ±8%→±5%：两张竖幅
             人像更接近中央文字，但 p=0/p=1 都不被 sticky stage 裁切
        ③ **Snow_11 宽屏 anchor-single 自适应放大 + 开场 reveal 动画** ·
           `src/lib/story/beatLayoutSolver.ts` + `src/components/story/PoemBeat.astro`：
           - wide + landscape cover 路径 photoMaxW 提升到 min(stageW*0.78, 900)，
             窄屏 / portrait contain 仍走原小图约束
           - 新增 cover-anchor 动画：clip-path 7%→0、translateY 16px→0、scale
             0.90→1、saturate/contrast 软进入，匹配“故事开场”语义
        ④ **Globe 从手绘近似 landmask 升级到 Natural Earth 标准大陆经纬数据** ·
           `src/lib/story/naturalEarthLand110m.ts` + `src/components/story/GlobeDistanceScene.tsx`：
           - 下载 Natural Earth 1:110m land GeoJSON，抽取 exterior land rings，0.01°
             精度量化后生成 TS data module（不含国家标签 / 国界）
           - canvas equirectangular texture 直接绘制标准大陆 / 海岸线；通过
             `projectLngToX(lng)=(180-lng)/360` 对齐 Three SphereGeometry UV，让
             乌鲁木齐 marker 落在中国陆地、墨尔本 marker 落在澳大利亚陆地
           - GlobeDistanceScene chunk 约 81KB（Natural Earth data + drawing code），仍远低于
             750KB chunk budget；three / r3f-drei 独立缓存边界不变
        ⑤ **窄屏保护**：
           - parallax / diagonal 的 portrait / compact 分支未改；Snow_11 放大仅在
             `mode === wide && aspectRatio > 1` 生效；竖幅 contain 照片仍保持不裁切
           - “To be continued” 已在 v1.80 删除，本轮 rg 复查无回归
        ⑥ **机器 + in-app browser 截图验收**：
           - tsc 0 errors / prettier clean / pnpm build 0 warnings；prebuild 12/12
             Story photo dimension gate 通过
           - in-app browser wide 截图：
             * `/private/tmp/forever-audit-images/v181-beat01-wide.png`：Snow_03 / Snow_07 同尺寸、更大、不压文字
             * `/private/tmp/forever-audit-images/v181-beat02-wide-composed.png`：Snow_14 / Snow_15 更大、更靠近文字，文字卡仍可读
             * `/private/tmp/forever-audit-images/v181-beat04-wide-composed.png`：Snow_11 宽屏放大 + 开场 reveal 视觉成立
             * `/private/tmp/forever-audit-images/v181-globe-natural-earth-aligned-wide.png`：Natural Earth 大陆可辨识；中国 / 澳大利亚落点与大陆轮廓对齐；文字卡在 row 2 不压球体
        ⑦ **下一步建议**：先做 v1.81 wide + portrait 矩阵复审（确认本轮 wide 修正未损害 601–820 / ≤540），再进入 §2.C StarCarouselFinale Shader Dissolve。
  v1.80 — §2 batch 7 收口（修 v1.79 后用户截图审计新增问题）：Story 完成帧 / wide photo / overlap 文案 / globe map / end cap 五项修复：
        ① **修 Story overlay 完成帧与快速滑动体验** ·
           `src/components/story/StoryPoemScroller.astro`：
           - HOLD_PHASE 从 0.6 收紧到 0.5：前 50% scroll 完成动画，后 50%
             稳定 hold p=1；配合 v1.79 已恢复的 sticky stage，让 overlap / reveal /
             pearl 等 overlay layout 也能在快速滚动后看到完整最终帧
           - 视觉目标：减少"只看到照片 / 文字离屏 / 邻接 beat 残片"的过渡感，
             给每个 completed frame 更长可观察窗口
        ② **修 overlap 文案遮挡人物** ·
           `src/lib/story/beatLayoutSolver.ts` + `src/components/story/PoemBeat.astro`：
           - 用户截图审计：beat 07 "两个契合的灵魂" overlay-center 浮卡遮挡照片人物
           - 改：overlap textPlacement 从 overlay-center 改回 below；删对应 absolute
             overlay CSS，让文字成为照片上方 / 下方的短句 caption（随 baseline
             flow），保留双层 ghost 收敛动画但不再压在人脸 / 身体上
        ③ **修 wide photo 大小 / 位置偏松散** ·
           `src/components/story/PoemBeat.astro`：
           - wide 模式 scroll spacer 加长：parallax-pair 170vh、diagonal-gaze 175vh、
             single-photo layouts 155vh，让动画完成后的 p=1 hold 区更稳定
           - 配合 solver 输出尺寸，宽屏照片不再在快速滑过时只露局部或被上下文打断
        ④ **修 globe 仍像纯噪声 / 抽象贴片** ·
           `src/components/story/GlobeDistanceScene.tsx` v0.8：
           - 下线 v1.78/v1.79 的 onBeforeCompile fbm / continent-blob shader；
             改为 browser-side canvas 生成 1024×512 equirectangular landmask texture
           - 低精度世界大陆轮廓用更密 GeoPoint 多边形 + quadraticCurveTo 曲线插值：
             北美 / 南美 / 格陵兰 / 欧亚 / 非洲 / 阿拉伯 / 印度 / 东南亚 / 澳洲 /
             日本 / 新西兰 / 南极；只画大陆与海岸，不标国家、不画国界
           - 叠轻 graticule + paper grain + 柔和 coastline stroke，解决"纯噪声阈值"
             读不成地图的问题；仍作为 Phase 3 真 2K 水彩贴图前的过渡方案
        ⑤ **去掉公开页英文 To be continued** ·
           `src/components/story/StoryPoemScroller.astro`：
           - 删 `.story-end-kicker` 和 visible "To be continued"，end cap 只保留
             Pearl_04 主海报 + schema finale.lines 中文收束句
        ⑥ **机器 / 截图验收**：
           - tsc 0 errors / prettier clean / pnpm build 0 warnings；prebuild 12/12
             Story photo dimension gate 通过
           - in-app browser wide 截图复审：
             * beat 07：文字不再遮挡人物，照片主体完整
             * beat 06：Snow_08 夜色 + 雪粒子 + bottom text card 保持
             * end cap：Pearl_04 + 中文收束句；无 "To be continued"
             * globe：画面不再是纯噪声阈值，显示低精度大陆 landmask + graticule，
               文字卡仍在独立 row 2，不压球面
        ⑦ **观察项 / NOT in this batch**：
           - Globe landmask 仍是低精度过渡贴图，不是 Natural Earth 级 coastline；
             Phase 3 misc CDN 上线 `globe-watercolor-2k.jpg` 后应切真实水彩贴图
           - §2.C StarCarouselFinale Shader Dissolve 仍为下一批
  v1.79 — §2 batch 7 收口（修 v1.78 audit 3 P2）：overlay sticky 恢复 + continent-blob globe + globe/card 双行 safe zone：
        ① **修 P2-1（overlap/reveal/pearl 把 .poem-stage 改 relative，破了 sticky → HOLD_PHASE 失效）** ·
           `src/components/story/PoemBeat.astro`：
           - 用户审计："hold plateau does not apply to overlay layouts"——三个
             overlay layout 在 .poem-stage 上写 `position: relative`，覆盖
             baseline 的 sticky；v1.78 加的 HOLD_PHASE=0.6 完成帧 plateau 在
             这些 layout 上失效，宽屏截图 beat 08 / beat 10 滚到 hold 区仍
             出现"只有照片、文字卡离屏"
           - 改：删 overlap/reveal/pearl 三处 `.poem-stage { position: relative }`
             覆盖。原意"给 absolute text 当 containing block"已由 baseline
             `position: sticky` 满足（sticky 已建立 containing block）；relative
             覆盖反而破了 sticky
           - 视觉契约不破：sticky 仍为 absolute children 提供 containing block，
             overlay-center / overlay-top 文字定位与原来一致；HOLD_PHASE 现在
             覆盖全部 9 layout，完成帧均稳定
        ② **修 P2-2（procedural globe 仍是水波 / 布纹条带，不是地图）** ·
           `src/components/story/GlobeDistanceScene.tsx` v0.6 → v0.7（P2-2 部分）：
           - 用户审计："reads as abstract stripes, not a map"——v1.78 纯 fbm
             给 organic 斑块，但没有可识别的大陆位置
           - 改：shader 大改，从纯 noise 升级为 "**continent-blob + 海岸线
             noise 调和**"：
             * 新 GLSL `latLngToVec3(latDeg, lngDeg)` 算大陆中心法向量
             * `continentBlob(normal, lat, lng, radius)` 用 `acos(dot)` 算
               great-circle 角距离，e^{-r²} Gaussian falloff 给 blob density
             * 7 个大陆中心定锚（lat°, lng°, radius rad）：
               - 北美 (45, -100, 0.50) · 南美 (-15, -60, 0.40) · 欧 (50, 15, 0.28)
               - 非 (5, 20, 0.42) · 亚 (45, 90, 0.55) · 大洋 (-25, 135, 0.30)
               - 南极 (-82, 0, 0.50)
             * landDensity = sum(blobs) + fbm noise ±0.18（海岸线 organic）
             * smoothstep(0.32, 0.45, landDensity) → landMask
           - 视觉效果：大陆位置定锚正确（北美 / 欧亚 / 非洲 / 南美 / 大洋 /
             南极），形状 organic 但可识别为"地图"。不画国界、不写国家名，
             仍符合 DESIGN §2.B "深墨绿 / 纸白低饱和地球"契约
           - 仍是过渡方案：Phase 3 push `globe-watercolor-2k.jpg` 真贴图后，
             整个 onBeforeCompile 一行换 useTexture 即可下线
        ③ **修 P2-3（globe 文字卡仍是底部 overlay，矩形背板压在球面上）** ·
           `src/components/story/GlobeBeat.astro` + `GlobeDistanceScene.tsx`：
           - 用户审计："card still overlays the globe instead of reserving
             layout space"——width 已收 380px 但仍 grid-area 1/1 overlay，
             截图里仍切下半球
           - 几何修法：`.globe-stage` `grid-template-rows: 1fr` (1×1 overlay)
             → `1fr auto`：
             * row 1 (1fr)：globe canvas，自适应高度
             * row 2 (auto)：文字卡 .globe-text，按内容高
             * canvas / card 各自本区，不再 overlay；卡片不切球面
           - .globe-canvas 删 grid-area 1/1，自然占 row 1
           - .globe-text 删 align-self: end / margin-bottom / backdrop-blur，
             简化为普通 row 2 居中（背景 alpha 从 0.78 降到 0.62 因为不再
             压在 globe 上，不需要那么强的视觉隔离）
           - .globe-fallback 同步从 grid-area overlay 改为普通 row 1 居中
           - **v1.77 camera Y -0.14R 偏移撤销**（v0.5→v0.7）：globe canvas 与
             文字卡分两行不 overlay 后，3D 场景里不需要预留底部空间。camera
             回到 (0, 0, z)，OrbitControls target 回到 (0, 0, 0)，globe 居中
             渲染于 canvas 区。拖拽 orbit 围绕世界原点 = globe 中心，是最自
             然的体验
        ④ **build / 线上验证**：
           - tsc 0 errors / prettier --write clean / pnpm build 3.71s 完成 /
             **0 warnings**
           - dist 实测：
             * `\\[data-layout=(overlap|reveal|pearl)\\]\\[...\\] \\.poem-stage{position:relative}`
               出现次数 = 0 ✓
             * continentBlob / landDensity / latLngToVec3 / noiseShift 全部出现
               在 GlobeDistanceScene chunk ✓
             * `.globe-stage{...grid-template-rows:1fr auto...}` ✓
           - chunks: three 714KB / r3f-drei 357KB / GlobeDistanceScene 7.12KB
             → **8.55KB**（+1.4KB = continent-blob shader 字符串）/
             StoryPoemScroller script 7.08KB（不变）/ 都在 750 budget 内
        ⑤ git: `07c6ee0` · CI run [25497983193](https://github.com/YiTiane/forever-begins/actions/runs/25497983193)
        ⑥ **观察项 / NOT in this batch**：
           - **upstream THREE.Clock dep warn**：three / R3F / drei 内部仍 new
             THREE.Clock()；本批次不做 monkey-patch，等依赖升级
           - §2.B v0.8+：真实水彩贴图 globe-watercolor-2k.jpg（misc CDN
             Phase 3）下线 procedural shader / Bloom + Vignette + ToneMapping
             postprocessing / 距离 CountUp 同步弧线 / 3D <Html> 城市标签
           - §2.C StarCarouselFinale Shader Dissolve（beat 12）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑦ **§2 batch 8 next**：v1.79 跨 viewport 截图复审（hold plateau 现在覆盖
           全部 9 layout 包括 overlap/reveal/pearl + continent-blob 视觉验收
           大陆位置可辨 + 文字卡 row 2 不再压球 + 拖拽手感）+ a11y 实测
           VoiceOver/NVDA；通过后实施 §2.C StarCarouselFinale Shader Dissolve
           走马灯。
  v1.78 — §2 batch 7 收口（修 v1.77 audit 4 P2 + 1 P3）：scroll hold plateau + CountUp client-time 立即写 + globe 程序化陆地 + 文字卡缩窄 + docblock 同步：
        ① **修 P2-1（scroll-progress 没有稳定完成区间，p≈1 与 sticky release 同步）** ·
           `src/components/story/StoryPoemScroller.astro` computeProgress：
           - 旧实现：把整个 scroll spacer 直接 0→1 线性映射，p≈1 发生在 sticky
             即将释放、下一 beat 进入视口的同一瞬间 → 完成帧不稳定，下一 beat
             已半进入，"完成态"无可观测 hold zone，影响照片大小 / 间距的逐张
             微调
           - 改：`HOLD_PHASE = 0.6` —— 60% scroll 走完动画（raw → raw/0.6），
             后 40% hold 在 p=1。hold zone 也覆盖 sticky release 区（release
             占 spacer 末段 ~25-35%），所以下一 beat 进入视口时本 beat 终态
             已稳定持续 5-15% spacer 距离的视觉时间 → 肉眼能清晰看到"完成构图"
           - 副作用：动画整体节奏变快（原 100% scroll 走 0→1，现在 60% 走完），
             sticky 100vh 期间物理距离不变，动画线性"压缩"到前 60% → 视觉感
             觉更紧凑、更有目的性
        ② **修 P2-2（visible CountUp 入场前显示 SSR build-time 数字，跨午夜后漂老）** ·
           StoryPoemScroller IIFE：
           - 旧实现：visible span 在 IO 入场前一直显示 SSR build-time N → 用户
             从 beat 04 滚向 beat 05 时半露看到的是 stale 2655；满帧进入视口
             IO 触发动画 0→2657（client-time）。前后两个数字让访客困惑
           - 改：脚本加载完**立即**把 client-time N 写进 visible span（除原来
             已经写过的 sr-only sibling），stale SSR 值再也不进入用户视野。
             CountUp 仍在 IO 入场时跑：动画把 textContent 从 "0" → target 走过
             → 用户看到的是"client-time N → 0 → 数到 client-time N"，过渡值
             短暂的 0 是动画的一部分，不是 stale 数字
        ③ **修 P2-3（globe 仍只是球，不是地图）** ·
           `src/components/story/GlobeDistanceScene.tsx` v0.5 → v0.6：
           - 用户审计："Globe is still only a sphere, not a map" / "至少需要
             大陆轮廓 / 水彩陆地图层"
           - 改：<Globe> 用 onBeforeCompile 在 MeshStandardMaterial fragment
             shader 注入 procedural fbm 大陆涂层
             - 顶点：通过新 varying vObjNormal 把 object-space normal 传给 fragment
             - 片元：4-octave value-noise + smoothstep 阈值；object-space normal
               → 经纬度 → cos/sin(lng) 平面投影避 seam，得到 organic 陆地 /
               海洋斑块；oceanColor (0.10, 0.18, 0.14) / landColor (0.30, 0.44, 0.32)
             - AutoRotate 旋转球时 object-space 不动 → "陆地"跟着球转
           - 这是**过渡方案**：fbm 给的是抽象有机斑块，看起来像水彩大陆涂层
             而不是真实地图。Phase 3 push `globe-watercolor-2k.jpg` equirectangular
             贴图后，onBeforeCompile 一行换成 useTexture 即可下线
           - material useMemo + dispose() on unmount 防内存泄漏
        ④ **修 P2-4（globe 文字卡仍切掉球体下缘）** · `GlobeBeat.astro`：
           - 用户审计："text card remains a wide bottom overlay carving a
             rectangular block into the lower globe silhouette"
           - 改：`width: min(540px, 90%)` → `min(380px, 84%)`；padding
             1rem 1.5rem → 0.85rem 1.25rem
           - 视觉：背板从横跨大半画面收到只占 globe 投影下方一束 → 不再"切掉
             球体下缘"，更像"挂在地球底下的小标牌"。globe 上下都留更多透明
             区，构图保留原本圆形主体感
        ⑤ **修 P3（GlobeDistanceScene v0.5 docblock 描述被弃用的 group-offset 设计）** ·
           - v1.77 docblock 写"SceneInner 计算 sceneOffsetY，把 Globe/Arc/Endpoint
             包进 group position"——这是早期设计探索，**未采用**（group 上移
             会让 globe 中心 = OrbitControls target，反而 centered 不偏移）。
             实际实现是 ResponsiveCamera 把 camera.position.y 设为 -0.14R +
             OrbitControls target 同步到 (0, -0.14R, 0)，globe 留世界原点
           - 同步：明示真实实现（camera + target Y 偏移、globe 原点不动）；
             解释为何 group 上移方案不可行
        ⑥ **build / 线上验证**：
           - tsc 0 errors / prettier --write clean / pnpm build 3.73s 完成 /
             **0 warnings**
           - dist 实测：
             * hold plateau: `A<p?A/p:1` 与 `p=.6` ✓
             * CountUp 立即写: `r.textContent=... 后跟 t.textContent=...` ✓
             * procedural shader: fbm/landMask/oceanColor/landColor/
               onBeforeCompile/0.46 全部出现 ✓
             * 文字卡: `.globe-text width:min(380px,84%)` ✓
           - chunks: three 714KB / r3f-drei 357KB / GlobeDistanceScene 5.59KB
             → **7.12KB**（+1.5KB = procedural shader 字符串）/ StoryPoemScroller
             script 7KB → 7.08KB（+80B = hold plateau + visible 立即写）/
             都在 750 budget 内
           - § 0 / § 1 / § 2.A 10 photo-poem / § 2.B globe 显隐 / [N] CountUp /
             拖拽 / AT 朗读无 regression
        ⑦ git: `d4ce9a2` · CI run [25497027935](https://github.com/YiTiane/forever-begins/actions/runs/25497027935)
        ⑧ **观察项 / NOT in this batch**：
           - **upstream THREE.Clock dep warn**：three / R3F / drei 内部仍 new
             THREE.Clock()，hydrate 后 console 仍可见同款 dep；本批次不做
             monkey-patch，等依赖升级
           - §2.B v0.7+：真实水彩贴图 globe-watercolor-2k.jpg（misc CDN Phase 3）
             下线 procedural shader / Bloom + Vignette + ToneMapping postprocessing /
             距离 CountUp 同步弧线 / 3D <Html> 城市标签
           - §2.C StarCarouselFinale Shader Dissolve（beat 12）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑨ **§2 batch 8 next**：v1.78 跨 viewport 截图复审（确认 hold plateau 让
           完成帧稳定 + procedural 陆地视觉验收 + 文字卡缩窄不切球体下缘 +
           CountUp 不再显示 stale 数字）+ a11y 实测 VoiceOver / NVDA + 拖拽
           手感复审；通过后实施 §2.C StarCarouselFinale Shader Dissolve 走
           马灯。
  v1.77 — §2 batch 7 收口（修 v1.76 audit 2 P2）：beat 05 heading 非数字防漂移 + wide globe 相机 Y 偏移留底部安全区：
        ① **修 P2-1（beat 05 sr-only h3 firstLineLabel 用 build-time N，会跨午夜漂老）** ·
           `src/components/story/PoemBeat.astro`：
           - v1.76 把 [N] 替换为 build-time initialDaysCount（如 2657）解决了 AT
             朗读 "括号 N 天" 占位符问题。但 GitHub Pages 是静态部署，下次
             +08:00 午夜过后 client-time N 已是 2658，CountUp 视觉数字 +
             .sr-only sibling 都被脚本同步到 2658，唯独 sr-only h3 还停在
             build-time 的 2657 → AT 朗读 section 标签时读到昨天的数，紧接着
             段落里读到今天的数，前后矛盾
           - 改：heading **改用静态非数字描述**，永不漂移：
             `headingLabel = firstLine.replace(/\s*\[N\]\s*天/, "的每一天")`
             beat 05 firstLine "不知不觉，已携手走过 [N] 天。" →
             headingLabel  "不知不觉，已携手走过的每一天。"
           - 选择背景：用户审计列两个修法 — (a) 客户端脚本一并回写 h3，
             (b) heading 非数字。选 (b) 因为 heading 是给 AT 导航用的 "section
             标题"，不需要精确天数；精确数字已在段落正文（.days-together-wrap
             里 sr-only sibling）传达。客户端脚本不需变（h3 文本永久稳定）
           - dist 验证：beat 05 h3 = "第 05 段 · 不知不觉，已携手走过的每一天。"，
             不含 [N] ✓ 不含数字 ✓ 含 "的每一天" ✓
        ② **修 P2-2（wide globe 文字卡仍可能遮端点，CSS margin-bottom 不能跨 viewport 保证）** ·
           `src/components/story/GlobeDistanceScene.tsx` v0.4 → v0.5：
           - v1.76 用 .globe-text margin-bottom 4.5rem→1.75rem + padding
             1.25rem→1rem 把卡片往下推 ~50px，1920×1080 下 Melbourne
             (canvas y≈750) 与卡片顶 y≈762 仅余 ~8px 间距；任何 viewport 高度 /
             camera state 变化都可能再次相撞 —— "fixed margin-bottom 不能跨
             viewport 保证端点可见"，需要更稳健的几何修法
           - 几何修法：**相机和 OrbitControls target 一起 Y 方向下移 0.14 R**，
             globe 留世界原点 → globe 相对 target 永远偏上 → 投影到 canvas 上方
             - ResponsiveCamera：
               `camera.position.y = aspect >= 1 ? -GLOBE_RADIUS * 0.14 : 0`
               （narrow 不偏移）
             - SceneInner 算 cameraTargetOffsetY 同款公式
             - <OrbitControls target={[0, cameraTargetOffsetY, 0]}>：拖拽 orbit
               围绕新 target 做 → globe 仍在世界原点不动，相对 target 永远偏
               上 → 拖拽期间 globe 也保持画面上方，**拖拽手感不破坏**
           - 数值校准（1920×1080 wide）：
             * Melbourne y_world = sin(-37.8°) × 1 = -0.61
             * 相对 target (0, -0.14, 0) 的 y = -0.61 - (-0.14) = -0.47
             * NDC y = -0.47 / 1.22 ≈ -0.385
             * canvas y ≈ 692
             * 卡片顶 y ≈ 762（v1.76 几何不变）→ **净间距 70px**
               （v1.76 仅 8px，差 8.75 倍）
           - narrow (aspect < 1) 不偏移：portrait/compact .globe-stage 已释放
             sticky，文字卡走自然流不与 globe overlay 重叠
           - 视觉契约：globe 中心从画面中央上移到约 38% 高度处；OrbitControls
             同步让拖拽手感不破坏；globe 顶部仍距 canvas 顶 ≥ 35px (NDC
             1.14/1.22 ≈ 0.93)，不贴边
        ③ **build / 线上验证**：
           - tsc 0 errors / prettier --write clean / pnpm build 3.64s 完成 /
             **0 warnings**
           - dist 实测：
             * beat 05 h3 = "第 05 段 · 不知不觉，已携手走过的每一天。" ✓
             * 11 个 aria-heading 中 [N] 出现 0 次 ✓
             * 无 "已携手走过 \d+ 天" 数字模式（防漂移已确立）✓
             * GlobeDistanceScene chunk 5.49KB → 5.59KB（+100B = camera Y +
               target Y + 注释）
           - chunks 不变（three 714KB / r3f-drei 357KB / 都在 750 budget 下）
           - § 0 / § 1 / § 2.A 10 photo-poem / § 2.B globe / [N] CountUp 视觉与
             sr-only 行为 / 拖拽手感无 regression
        ④ git: `5fbaa06` · CI run [25495085957](https://github.com/YiTiane/forever-begins/actions/runs/25495085957)
        ⑤ **观察项 / NOT in this batch**：
           - **upstream THREE.Clock dep warn**：three / R3F / drei 内部仍有
             `new THREE.Clock()`，hydrate 后 console 仍可见同款 dep；本批次
             不做 monkey-patch，等依赖升级
           - §2.B v0.6+：水彩贴图 / Bloom + Vignette + ToneMapping
             postprocessing / 距离 CountUp 同步弧线 / 3D <Html> 城市标签
           - §2.C StarCarouselFinale Shader Dissolve（beat 12）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑥ **§2 batch 8 next**：v1.77 a11y 实测（VoiceOver / NVDA 跑 beat 05
           确认 section heading 朗读 "第 5 段 · 不知不觉，已携手走过的每一天"
           不再含数字，paragraph 仍有 CountUp）+ globe wide 截图复审（确认
           Melbourne 端点完整露出，拖拽手感不变）+ 跨 viewport 矩阵；通过后
           实施 §2.C StarCarouselFinale Shader Dissolve 走马灯。
  v1.76 — §2 batch 7 收口（修 v1.75 audit 1 P2 + 2 P3 + 1 视觉诉求）：beat 05 aria heading [N] 泄漏修 + 两处文档同步 + globe 文字卡下移：
        ① **修 P2（beat 05 sr-only h3 仍含 [N] 占位 → AT 朗读 "括号 N 天" 实现细节）** ·
           `src/components/story/PoemBeat.astro`：
           - v1.75 把可视 CountUp 拆成 visible aria-hidden + sr-only sibling，
             但 section aria-labelledby 指向的 h3 仍读 lines[0] = "不知不觉，
             已携手走过 [N] 天。" 原文 → AT 在朗读 section 标签时仍会读出
             "括号 N 天" 实现占位符
           - 新增 `firstLineLabel`：
             `initialDaysCount !== null && firstLine.includes("[N]")` 时把
             [N] 原地替换为 build-time N，否则退化回 firstLine（不含 [N] 的
             beat / 未传 anchorDate 的情况都不变）
           - h3 内容从 `第 {id} 段 · {firstLine}` 改 `第 {id} 段 · {firstLineLabel}`
           - dist 验证：beat 05 h3 = "第 05 段 · 不知不觉，已携手走过 **2657**
             天。" ✓；全 11 个 aria-heading 中 `[N]` 出现次数 = **0** ✓
        ② **修 P3-1（PoemBeat lines 215-218 注释还说 "aria-live: polite 朗读 CountUp 终值"）** ·
           - 旧注释描述 v1.74 的 aria-live 设计；v1.75 已改为 visible aria-hidden +
             sr-only sibling，aria-live 完全不用。下次 a11y 审计若读到该注释会
             反向推架构选型
           - 重写注释：明示 visible / sr-only 两条职责拆分 + sr-only h3 也用
             firstLineLabel 替换 [N]（v1.76 新加）+ aria-live 已**完全不用**，
             是 v1.75 audit P2 的根因
        ③ **修 P3-2（GlobeDistanceScene Endpoint 本地注释还说 "console 干净"）** ·
           - v1.75 顶部 docblock 已收紧 claim，但 Endpoint 局部注释还是 v1.73
             时代 "console 干净" 文字
           - 同步：明示 "业务代码不再调用 state.clock.getElapsedTime() →
             本组件不再产生 dep warn"；upstream three / R3F / drei 仍可能
             new THREE.Clock()，warn 不在本组件可修范围；拒绝 console.warn
             monkey-patch
        ④ **视觉诉求（宽屏文字卡上部遮住墨尔本端点）** ·
           `src/components/story/GlobeBeat.astro`：
           - 用户审计："宽屏时，松开刹那，才见已过万重山。对应的文字块和
             地球重叠太多，上部遮住了地理点。可以稍微向下移动一点。"
           - 几何根因：1920×1080 viewport（aspect 1.78，canvas ~1280×1000）
             下，墨尔本 (lat -37.8) 投影到 canvas y ≈ 750；原 .globe-text
             margin-bottom clamp(2rem, 6vh, 4.5rem) ≈ 64-72px + padding
             1.25rem×2 + 内容 ~10rem = 卡片高 ~250px → 卡片顶 y = 1000 - 72 -
             250 = 678 → 远在墨尔本之上约 72px → backdrop-blur 把墨尔本端点
             完全模糊
           - 改：margin-bottom clamp(2rem, 6vh, 4.5rem) → clamp(0.75rem,
             2.5vh, 1.75rem)（上限缩 ~50px）；padding 1.25rem 1.5rem →
             1rem 1.5rem（顶部缩 4px）
           - 新几何：卡片顶 y ≈ 1000 - 28 - 230 ≈ 742 → 距墨尔本 8px 余量；
             poem 字号与行距未动，文案视觉权重保留
        ⑤ **build / 线上验证**：
           - tsc 0 errors / prettier --write clean / pnpm build 3.73s 完成 /
             **0 warnings**
           - dist 实测：
             * beat 05 h3 = "第 05 段 · 不知不觉，已携手走过 2657 天。" ✓
             * 全 11 个 aria-heading 中 [N] 出现 0 次 ✓
             * `.globe-text margin-bottom: clamp(.75rem, 2.5vh, 1.75rem)` ✓
             * `.globe-text padding: 1rem 1.5rem` ✓
           - chunks 不变（three 714KB / r3f-drei 357KB / GlobeDistanceScene 5.49KB
             / StoryPoemScroller script 7KB / inline CountUp script 不变）
           - § 0 / § 1 / § 2.A 10 photo-poem / § 2.B globe 显隐 / [N] CountUp
             视觉 / sr-only 行为无 regression
        ⑥ git: `8159c2f` · CI run [25494387234](https://github.com/YiTiane/forever-begins/actions/runs/25494387234)
        ⑦ **观察项 / NOT in this batch**：
           - **upstream THREE.Clock dep warn**：three / R3F / drei 内部仍有
             `new THREE.Clock()`，hydrate 后 console 仍可见同款 dep；本批次
             不做 monkey-patch，等依赖升级
           - §2.B v0.5+：水彩贴图 / Bloom + Vignette + ToneMapping
             postprocessing / 距离 CountUp 同步弧线 / 3D <Html> 城市标签
           - §2.C StarCarouselFinale Shader Dissolve（beat 12）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑧ **§2 batch 8 next**：v1.76 a11y 实测（VoiceOver / NVDA 跑 beat 05
           确认 section heading 朗读 "第 5 段 · 不知不觉，已携手走过 2657 天"
           不再含 "括号 N"）+ globe wide 截图复审（墨尔本端点 / 弧线南端不
           被文字卡遮住）+ 跨 viewport 矩阵；通过后实施 §2.C
           StarCarouselFinale Shader Dissolve 走马灯。
  v1.75 — §2 batch 7 收口（修 v1.74 audit 1 P2 + 3 P3）：CountUp a11y + 头注释 doc-drift 同步 + Three.Clock claim 降级：
        ① **修 P2（CountUp 每帧改 aria-live="polite" 给 AT 抛过渡值流）** ·
           `src/components/story/PoemBeat.astro` v1.4 → v1.5 +
           `src/components/story/StoryPoemScroller.astro`：
           - 旧实现：visible `.days-together` span 同时担两个角色——视觉数字 +
             AT aria-live 朗读源；1.4s CountUp 每帧改 textContent → AT 在动画
             期间收到 ~60 个不同的"已携手 X 天"过渡值，违反"AT 只听一次准确
             终值"约定（与 v1.51 Countdown audit 同款问题）
           - 改：拆 visible vs a11y 两条职责
             * `.days-together-wrap` 作 inline 容器（display: inline，不引入额外
               盒模型 / 行高）
             * visible `<span class="days-together" aria-hidden="true">`：CountUp
               动画目标，不进 AT 朗读流
             * sr-only `<span class="sr-only" data-days-together-sr>`：稳定终值
               （SSR 写 build-time N，客户端脚本一次性改成 client-time N），
               AT 在初次扫读这一行时读到一个准确数字"2657 天"
           - StoryPoemScroller 脚本：sr-only sibling 用
             closest('.days-together-wrap') + querySelector('[data-days-together-sr]')
             拿到，textContent 一次性写；visible 仍跑 IO + ease-out 0→target
             动画。reduced-motion 路径同样写两侧终值
           - dist 验证：visible span aria-hidden="true" × 1 / sr-only sibling
             × 1 / dist/index.html 中 days-together 上 aria-live 出现次数 = **0** ✓
        ② **修 P3-1（StoryPoemScroller 头注释还说 anchor_date 未消费 / beat 05 CountUp 留独立刀）** ·
           `StoryPoemScroller.astro` v0.8 → v0.9：
           - 加 v0.9 段记 v1.74-v1.75 [N] 天 CountUp 实接入 + a11y 收口
           - "运行机制"加 "[N] 天 CountUp" 一条
           - "NOT in current batch"删 "beat 05 [N] 天 daysTogether CountUp"
           - "数据流"段 anchor_date 从"当前未消费"改为"透传给每个 PoemBeat"
           - prefers-reduced-motion 段补 [N] CountUp 钉终值不动画
        ③ **修 P3-2（PoemBeat 头注释还把已实现的 daysTogether CountUp 列在 NOT-in-batch）** ·
           `PoemBeat.astro` v1.4 → v1.5：
           - 加 v1.5 段记 [N] 天 SSR 拆分 + a11y visible aria-hidden + sr-only
             sibling
           - "落地范围"从 v1.68 收口标准升 v1.75，加 "beat 05 [N] 天 daysTogether
             CountUp" + "[N] CountUp visible aria-hidden / sr-only sibling 拿
             稳定终值"
           - "NOT in this batch" 删 "beat 05 [N] 天 daysTogether CountUp"
           - 把 globe (beat 11) 从"等 R3F + Three.js + 水彩贴图地球"降级为
             "§2.B v0.5+ 视觉精调"（globe 已 v1.71 实接入）
        ④ **修 P3-3（Three.Clock claim 过宽：v1.74 写"console 干净"，但 hydrate 后仍有 dep warn）** ·
           `GlobeDistanceScene.tsx`：
           - v1.74 docblock 写"console 干净"，但用户实测 hydrate 后 console
             仍有 `THREE.Clock: This module has been deprecated...` warn ——
             来源是 three / @react-three/fiber / drei 自身在 Canvas 内部
             new THREE.Clock()，不是本组件能直接修的范围
           - 改：v0.4 docblock 加 "v1.75 claim 收紧"段，明示本修复仅消除
             "业务代码调用 state.clock 触发的 dep warn"；upstream warn 等
             R3F / drei 升新版使用 THREE.Timer 后自然消除
           - 拒绝方案：console.warn 拦截 monkey-patch（会连带屏蔽其它有用
             warn，引入新风险）
        ⑤ **build / 线上验证**：
           - tsc 0 errors / prettier --write clean / pnpm build 3.67s 完成 /
             **0 warnings**
           - dist 实测：
             * `class="days-together-wrap"` × 1 ✓
             * visible `class="days-together" data-days-anchor="2019-01-27"
                aria-hidden="true"` ✓
             * sr-only `class="sr-only" data-days-together-sr ...>2657` ✓
             * `days-together` 上 `aria-live` 出现次数 = 0 ✓
             * inline CountUp script 包含 `data-days-together-sr` /
               `days-together-wrap` 但不含 `aria-live`（v1.75 脚本同步收口）
           - chunks: three 714KB · r3f-drei 357KB · GlobeDistanceScene 5.49KB
             · StoryPoemScroller script 7KB（CountUp inline 字符串改名 +12B
             vs v1.74，可忽略）· client 1.8KB
           - § 0 / § 1 / § 2.A 10 photo-poem / § 2.B globe 显隐 / [N] CountUp
             视觉与 sr-only 行为无 regression
        ⑥ git: `b45da7c` · CI run [25492987749](https://github.com/YiTiane/forever-begins/actions/runs/25492987749)
        ⑦ **观察项 / NOT in this batch**：
           - **upstream THREE.Clock dep warn**：three / R3F / drei 内部仍有
             `new THREE.Clock()`，hydrate 后 console 仍可见同款 dep；本批次
             不做 monkey-patch，等依赖升级
           - §2.B v0.5+：水彩贴图 / Bloom + Vignette + ToneMapping
             postprocessing / 距离 CountUp 同步弧线 / 3D <Html> 城市标签
           - §2.C StarCarouselFinale Shader Dissolve（beat 12）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑧ **§2 batch 8 next**：v1.75 a11y 实测（macOS VoiceOver / Windows NVDA
           跑 beat 05 一次，确认朗读 "已携手走过 2657 天" 单一准确值，不再
           是过渡流）+ reduced-motion 实测 + 跨 viewport 矩阵；通过后实施
           §2.C StarCarouselFinale Shader Dissolve 走马灯。
  v1.74 — §2 batch 7 收口（修 v1.73 audit 1 P3 + 落实用户两条内容建议）：Three.Clock dep 清 + beat 05 [N] 天 CountUp + globe 距离前缀：
        ① **修 P3（Three.Clock deprecation 写满 console）** ·
           `src/components/story/GlobeDistanceScene.tsx` v0.3 → v0.4：
           - Three.js 0.184 起 THREE.Clock 进 deprecated（推荐 THREE.Timer），
             R3F 的 useFrame state.clock 仍可用但每次 .getElapsedTime() 调用都
             把 dep warning 写进 console；hydrate 后控制台被刷红，影响下次审计
             "runtime clean"判定
           - Endpoint 1.4 Hz 心跳脉冲改读 useFrame 第二参数 dt（秒），本地
             elapsedRef 累加；完全不再访问 state.clock → console 干净
           - 性能：dt 每帧由 R3F 直接传入（来源 performance.now() 差），与
             state.clock.getElapsedTime() 同精度；脉冲节奏 0 改变
           - dist 验证：getElapsedTime 在编译后 GlobeDistanceScene chunk 中
             出现次数从 1 降到 **0** ✓
        ② **用户内容建议 #1：beat 05 [N] 天实时计算 + 入场 CountUp（DESIGN §2.D 落地）** ·
           - 用户审计："不知不觉，已携手走过 [N] 天" 的 [N] 没换成从
             2019-01-27 至今的实时数字。这是 DESIGN §2.D 里历史 deferred 项，
             v1.74 batch 7 落实。
           - 新增 **`src/lib/story/daysTogether.ts`**（v0.1）：
             * `parseAnchorDate("YYYY-MM-DD")` → 中国时区 +08:00 的 Date（与
               DESIGN §2.D 锚定时区一致；任何时区访客都能算出同一天数，
               避免"亚洲访客 2658 / 欧洲访客 2659"漂移）
             * `daysTogether(anchor, now=new Date())` → 整 24h 天数（向下取
               整，下限 0 防 anchor > now 时返回负数）
           - **`src/components/story/PoemBeat.astro`** v1.4 → v1.5：
             * 加 `anchorDate?: string` prop（StoryPoemScroller 透传 main.json
               的 anchor_date）
             * SSR 阶段 `await import` 库，算 build-time N（2026-05-07 的实测
               N = 2657）
             * `lines.map` 检查 "[N]" 占位符；含的行拆成
               prefix / `<span class="days-together">` / suffix；span 写 SSR
               build-time N，让无 JS 访客也能看到合理数字
             * 加 `.days-together` CSS：honey 色 + tabular-nums + font-weight
               400 + size 1.18em，CountUp 改写时不抖动
           - **`src/components/story/StoryPoemScroller.astro`**：
             * 加 `anchorDate = main.data.anchor_date` 透传给 PoemBeat
             * 新增独立 `<script>` IIFE：
               1. 找所有 `.days-together[data-days-anchor]`
               2. client-time 重算 N（避访客在 build 之后访问 N 漂老）
               3. IO 监入场，从 0 → N over 1.4s ease-out cubic（reduced-motion
                  直接钉到 N，跳过动画）
               4. 单 IO 单次动画后 `io.unobserve(span)`（不重复触发）
           - dist 验证：`<span class="days-together" data-days-anchor="2019-01-27"
             aria-live="polite">2657</span>` ✓；CountUp script 内联到
             dist/index.html script #9（1122 bytes minified）
        ③ **用户内容建议 #2：globe 距离前缀** · `GlobeBeat.astro`：
           - 用户审计："10,755 公里前面加上'我们最远时相距'。完整呈现应
             该是'我们最远时相距 10,755 公里'"
           - 加 `.globe-km-prefix` span "我们最远时相距"
           - CSS 把 `.globe-km` 设 `inline-flex + flex-wrap + baseline + gap
             0.35em`，让 prefix / num / unit 横向连成一句；过窄屏自然 wrap
           - prefix 比数字克制：sage 色 + 1rem + letter-spacing 0.04em；让数字
             自己抓眼（仍是 honey 色 + 1.65rem）
           - `aria-label` 同步：从"球面大圆距离 ..." → "..., 我们最远时相距 ...
             公里"（叙事而非技术语，让 AT 朗读对得上视觉）
           - `<noscript>` fallback 同步
        ④ **build / 线上验证**：
           - tsc 0 errors / prettier --write clean / pnpm build 3.65s 完成 /
             **0 warnings**
           - dist 实测：
             * `<span class="days-together"...>2657</span>` × 1（beat 05）✓
             * "我们最远时相距" + `globe-km-prefix` × 1（beat 11）✓
             * `getElapsedTime` 在 GlobeDistanceScene chunk 中 0 次 ✓
             * CountUp script 内联（1122 bytes minified）
           - chunks: three 714KB · r3f-drei 357KB · **GlobeDistanceScene 5.49KB**
             （v1.73 5.48KB → v1.74 5.49KB +12B = elapsedRef + dt 两处 ref 的
             最小 bundle 影响）· StoryPoemScroller script 7KB（内联 CountUp 不进
             外部 chunk，看上去 chunk 大小不变）· client 1.8KB
           - § 0 / § 1 / § 2.A 10 photo-poem / § 2.B globe 显隐无 regression
        ⑤ git: `9f6f2e8` · CI run [25492100700](https://github.com/YiTiane/forever-begins/actions/runs/25492100700)
        ⑥ **NOT in this batch**（仍留 §2.B v0.5 / §2.C / motion polish）：
           - §2.B v0.5: 水彩贴图 globe-watercolor-2k.jpg（misc CDN Phase 3）/
             Bloom + Vignette + ToneMapping postprocessing / 距离 CountUp 同步
             弧线绘制（当前距离静态显示）/ 3D <Html> 城市标签
           - §2.C StarCarouselFinale Shader Dissolve（beat 12）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑦ **§2 batch 8 next**：v1.74 reduced-motion 实测（DevTools rendering tab
           强开 prefers-reduced-motion + 看 console 是否真无 Three.Clock dep
           warn + Performance 是否真 0 持续 rAF）+ beat 05 截图复审 CountUp
           入场动画 + 跨 viewport 矩阵复审；通过后实施 §2.C StarCarouselFinale
           Shader Dissolve 走马灯。
  v1.73 — §2 batch 7 收口（修 v1.72 audit 1 P2 + 1 P3）：GlobeDistanceScene reduced-motion 真静态化 + chunk 注释口径同步：
        ① **修 P2（reduced-motion 仍跑 continuous WebGL 帧循环 + 每帧写同样静态值）** ·
           `src/components/story/GlobeDistanceScene.tsx` v0.2 → v0.3：
           - 旧实现根因：
             * Canvas 默认 frameloop="always" → 60fps rAF 常驻
             * Endpoint useFrame 在 reducedMotion 分支每帧把 halo scale=1.4 /
               opacity=0.55 写进同样的常量（pure waste）
             * AutoRotate useFrame 也每帧 check enabled
             * reducedMotion 用 useState(false) + useEffect 异步 setReducedMotion
               → 挂载瞬间仍跑了一次 60fps rAF
             * 总和：reduced-motion 用户每秒 ~60 次 rAF + GPU 提交 + 三个
               useFrame 回调，违反"静态终态、低 CPU"约定
           - 三联收紧：
             * **`<Canvas frameloop={reducedMotion ? "demand" : "always"}>`**：
               reduced-motion 下 rAF 不再常驻，首帧后只在 invalidate() 显式触发
               时重绘
             * **Endpoint reduced-motion**：useEffect 只跑一次写终态（halo
               scale=1.4 / opacity=0.55，dot opacity=0.85）；useFrame body
               第一行 if (reducedMotion) return —— 即使 frameloop 退回 always
               也不重复 work（双重保险）
             * **`useState(() => mq.matches)` lazy initializer**：第一次 Canvas
               渲染就拿对的 frameloop 值，不再"挂载瞬间 always 一帧后切 demand"
           - **ResponsiveCamera 增 `invalidate()`**：camera resize / aspect 改时
             主动通知 R3F 重绘一次（demand 模式必需；always 模式 invalidate 是
             no-op，零 cost）
           - drei OrbitControls 自带 change → invalidate 联动；reduced-motion 下
             拖拽仍能正常重绘（dampling 关闭 → 拖停即定）
           - docblock 升 v0.1 → v0.3，加 v0.3 段记录三联收紧的设计动机
        ② **修 P3（astro.config 注释 chunk 数字漂移）** · `astro.config.mjs`：
           - 旧注释写"业务 chunk ~50KB"（拆分前的估算）和"chunkSizeWarningLimit
             拉到 700"（v1.72 第一版的临时值），与 v1.72 实际不符（业务 chunk
             实测 5.3KB；阈值 750）
           - 同步：业务 chunk ~50KB → "~5KB（实测）"，three ~600KB → 714KB，
             r3f-drei ~200KB → 357KB；阈值 700 → 750
           - 头注释加 "v1.72 落地 / v1.73 收口注释"标识，明示这次仅文字层面
             同步、运行时 0 变化
        ③ **build / 线上验证**：
           - tsc --noEmit: 0 errors
           - prettier --write: clean (两文件 unchanged)
           - pnpm build: 0 errors / 3.74s 完成 / 2 page(s) built / **0 warnings**
           - dist chunks (v1.73 实测)：
             * three.{hash}.js              714KB（不变）
             * r3f-drei.{hash}.js           357KB（不变）
             * GlobeDistanceScene.{hash}.js  5.48KB（v1.72 5.29KB → v1.73 5.48KB
               +190B = useEffect + frameloop + invalidate 三处新加的最小 bundle 影响）
             * 客户端 hydration / StoryPoemScroller script  无变化
           - dist GlobeDistanceScene.{hash}.js 含关键字 "demand" / "frameloop" /
             "invalidate"（被 minified 但运行时 API 不可压）✓
           - § 0 / § 1 / § 2.A 10 photo-poem beat / § 2.B globe 显隐无 regression
        ④ git: `f445216` · CI run [25491489397](https://github.com/YiTiane/forever-begins/actions/runs/25491489397)
        ⑤ **NOT in this batch**（仍留 §2.B v0.4+ / §2.C / motion polish）：
           - §2.B v0.4: 水彩贴图 globe-watercolor-2k.jpg / Bloom + Vignette +
             ToneMapping postprocessing / 距离 CountUp 同步弧线 / 3D <Html> 城市标签
           - §2.C StarCarouselFinale Shader Dissolve（beat 12）
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
           - 观察项（不修不阻塞）：console THREE.Clock deprecation warning，来源
             three / R3F 依赖链；将来 Three.js 升级到 ≥ 0.169 用 THREE.Timer 自然消除
        ⑥ **§2 batch 8 next**：v1.73 reduced-motion 实测（Chrome DevTools rendering
           tab 强开 prefers-reduced-motion + 看 Performance 是否真 0 持续 rAF）+
           跨 viewport 截图复审（1920/1366/768/360 验证 ResponsiveCamera 都填到
           约束维度 82%）+ 拖拽手感复审；通过后实施 §2.C StarCarouselFinale
           Shader Dissolve 走马灯。
  v1.72 — §2 batch 7 收口（修 v1.71 audit 2 P3 + 1 视觉诉求）：StoryPoemScroller 头注释 / vite chunk 拆分预算 / ResponsiveCamera：
        ① **修 P3-1（StoryPoemScroller 头注释 v1.62 时代过时，仍说 globe 留待后续 batch）** ·
           `src/components/story/StoryPoemScroller.astro` v0.7 → v0.8：
           - v1.71 batch 7 已实接入 GlobeBeat（globeBeat = beats.find(kind==="globe")
             + <GlobeBeat lines={globeLines} />），但头注释仍说"globe 留待 §2.B
             GlobeDistanceScene"——下一轮 layout / schema 审计若读注释会得错信号
           - 重写 docblock：v0.8 段记录 v1.71 globe 实接入；运行机制段拆"photo-poem
             beat 走本 wrapper applyLayout / phase 变量"vs "globe beat 内部独立
             IO + scroll listener 自驱"两条；"NOT in current batch"删 globe 留
             §2.B v0.2 (texture / postprocessing / CountUp / 3D Html)；"数据流"加
             globeBeat → globeLines → GlobeBeat 自取 journey/long-distance.json
             的 from/to/distanceKm 接缝
        ② **修 P3-2（pnpm build 报 chunk-size warning，报告口径不应说"clean"）** ·
           `astro.config.mjs`：
           - v1.71 GlobeDistanceScene chunk 889KB（三件套 R3F + drei + three 绑一起），
             vite 默认 500KB 警告就触发；本批次给一个明确的拆分契约 + 预算
           - 加 vite.build.rollupOptions.output.manualChunks(id)：
             * `/node_modules/three/` → "three" chunk
             * `/node_modules/@react-three/` 与 `/node_modules/postprocessing/`
               → "r3f-drei" chunk
             * 其它 → undefined（默认共享）
           - 加 chunkSizeWarningLimit: 750（three core ~714KB minified 是不可拆解的
             物理下限；750 给小幅版本浮动留余地，但保证业务 chunk 不会无意中漂大）
           - **实测拆完**：
             * `three.{hash}.js`     714KB（站点全周期内只下载一次；§2.C / §2.D
               未来 R3F 场景可复用 → 不重复下载 three core）
             * `r3f-drei.{hash}.js`  357KB（fiber + drei + postprocessing；
               同样的复用边界）
             * `GlobeDistanceScene.{hash}.js`  5.3KB（**仅业务代码，从 889KB 降到 5KB**）
             * client.js  1.8KB · StoryPoemScroller script  7KB
           - **build 不再报 warning**（pnpm build 输出 grep -i "warn|error" → 0 行）；
             初屏访客 client:visible 才下载这些 chunk，对 LCP 零影响
        ③ **视觉诉求修（v1.71 globe 在不同浏览器宽度下视觉权重不一致）** ·
           `src/components/story/GlobeDistanceScene.tsx`：
           - 用户审计："大小固定，无法适应不同的浏览器宽度"
           - 原 Canvas camera={{ position: [0,0,3.2], fov: 38 }} 是固定 z；垂直
             fov 不变 → 球的"垂直像素占比"恒定 = canvasH × const，不随 canvas
             宽变化。窄 canvas (aspect<1，竖屏) 下球横向被裁，宽 canvas (aspect>>1)
             下球只填中央一小块，左右大段空白
           - 新增 `<ResponsiveCamera>` 内部组件：useThree 拿 size + camera，按
             canvas aspect 求解：
             * 约束维度 = min(canvas w, h)；目标 globe 直径 = 0.82 × 约束维度
             * aspect ≥ 1（宽 canvas）：z = R / (0.82 · tan(fov/2))   ≈ 3.55
             * aspect <  1（窄 canvas）：z = R / (aspect · 0.82 · tan(fov/2))
           - useEffect 监 size.width / size.height，canvas 缩放时同步重算 z +
             调 PerspectiveCamera.aspect + updateProjectionMatrix
           - **实测覆盖**：
             * 1920×1080 (aspect=1.78)：z ≈ 3.55，globe 占垂直 82%
             * 1366×768  (aspect=1.78)：同上
             * 768×1024  (aspect=0.75)：z ≈ 4.73，globe 占水平 82% / 垂直 ~62%
             * 360×800   (aspect=0.45)：z ≈ 7.89，globe 占水平 82% / 垂直 ~37%
           - 抽常量 CAMERA_FOV=38 与 GLOBE_FILL_FRACTION=0.82 让相机参数统一管理；
             Canvas 初始 camera 默认 z 改 3.55 给首帧 sensible default
             （ResponsiveCamera useEffect 在挂载后立即按真实 aspect 覆写）
        ④ **build / 线上验证**：
           - tsc --noEmit: 0 errors
           - prettier --check (含 prettier-plugin-astro): clean
           - pnpm build: 0 errors / 3.30s 完成 / 2 page(s) built / **0 warnings**
           - dist chunks: three 714KB / r3f-drei 357KB / GlobeDistanceScene 5.3KB ✓
           - tan( / updateProjectionMatrix 出现在 Globe chunk 证 ResponsiveCamera
             已拼入（标识符被 minified 但运行时 API 不可压）
           - § 0 / § 1 / § 2.A 10 个 photo-poem beat / § 2.B globe 显隐无 regression
        ⑤ git: `c1c4a6a` · CI run [25490092749](https://github.com/YiTiane/forever-begins/actions/runs/25490092749)
        ⑥ **NOT in this batch**（仍留 §2.B v0.2 / §2.C / motion polish）：
           - §2.B v0.2: 水彩贴图 globe-watercolor-2k.jpg / Bloom + Vignette +
             ToneMapping postprocessing / 距离 CountUp 同步弧线 / 3D <Html> 城市标签
           - §2.C StarCarouselFinale Shader Dissolve（beat 12）
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑦ **§2 batch 8 next**：v1.72 跨 viewport 截图复审（验证 ResponsiveCamera 在
           1920/1366/768/360 都按预期填充）；通过后实施 §2.C StarCarouselFinale
           Shader Dissolve 走马灯。
  v1.71 — §2 batch 7 · §2.B GlobeDistanceScene v0.1（3D 地球高潮首版上线）：
        ① **触发动机**：v1.70 wide audit 用户决策"不再卡在 §2.A photo-poem 的
           P2 修复循环，进入 §2.B GlobeDistanceScene"。本批次落地 §2.B 第一版，
           把 main.json beat 11 (kind="globe") 从 schema 数据点变成可见的 3D
           大圆弧地球场景。这是项目第一个 React 岛 / 第一个 3D 场景。
        ② **新增 `src/lib/story/globe.ts`（v0.1 几何库）**：
           - `latLngToVec3({lat, lng}, R)` → Vec3 球面坐标（+Y=北极、+X=lng 0°、
             +Z 朝相机；标准 right-handed Three.js 习惯）
           - `greatCircleArc(p1, p2, segments, lift, R)` → Vec3[] 大圆弧采样
             含 sin(π·t) 抬高包络让弧顶悬于地表（端点回到球面）；slerp 简并
             a≈b 时退化为线性插值 + 归一化防 NaN
           - `greatCircleAngularDistance` + `greatCircleDistanceKm`（haversine
             形式 atan2 + cross magnitude，对小角度无 acos 精度损失）
           - 纯函数 / 不依赖 React / Three Vector3 类，未来可加 vitest 单测
        ③ **新增 `src/components/story/GlobeDistanceScene.tsx`（v0.1 R3F 场景）**：
           - <Canvas> + Globe 单球 sphereGeometry(64,64) + Endpoint × 2 +
             Arc BufferGeometry + AutoRotate group + OrbitControls
           - **球体**：v0.1 暂用纯色 meshStandardMaterial (color #27392c 暗 sage
             + emissive #3f5e3f 0.06 + roughness 0.85 漫反射柔)；texture 在 v0.2
             接入（`globe-watercolor-2k.jpg` 等 misc CDN 仓 Phase 3 资产 push）
           - **端点 marker**：实心球（honey #c69d4e）+ 透明 halo 球（2.4× 半径）
             1.4 Hz 心跳脉冲；progress 0→1 控亮度峰值；reduced-motion 钉到最大
             尺寸 + 中等不透明（静态终态）
           - **弧线**：sage→honey 沿弧位置 lerp 顶点色（vertexColors true）；
             progress 0→1 截断点切片（Math.ceil(N · progress)）实现"弧线随
             滚动绘出"动画
           - **交互**：OrbitControls 桌面拖拽（damping 0.08 / rotateSpeed 0.4 /
             polar 0.28π–0.72π 限位防球倒置 / enableZoom=false / enablePan=false）；
             移动 / 触摸（hover:none 媒体查询）开 AutoRotate 0.06 rad/sec
           - **reduced-motion**：
             * progress 钉 1（弧线满绘）
             * AutoRotate 关
             * Endpoint pulse 关、halo 钉 1.4× scale + 0.55 opacity
             * OrbitControls dampling 关（仍允许无动量拖拽）
           - **进度自驱动**：内置 IO + scroll listener，计算 root.getBoundingClientRect
             的 top 位置（top=vh → 0；top=0.4·vh → 1，clamp(0..1)）。父组件不需
             协调 progress prop（v0.1 简化）
           - **TypeScript 严格通过**：noUncheckedIndexedAccess（point[i] 必判
             undefined）+ exactOptionalPropertyTypes（progress?: number 类型
             收紧）；React 19 删 JSX global namespace → 用 React.ReactElement
             显式返回类型（不退回隐式推断，让函数签名仍可读）
        ④ **新增 `src/components/story/GlobeBeat.astro`（v0.1 Astro 包装）**：
           - 渲染 .globe-beat#beat-11-heading（与 PoemBeat 同款 hash 锚契约 +
             scroll-margin-top:0；ariaHeadingId 拆分 sr-only h3）
           - .globe-stage：wide 模式 sticky 100vh / portrait 自然流式 80vh /
             compact 紧凑 50vh canvas
           - <GlobeDistanceScene client:visible /> 仅视口内 hydrate（R3F bundle
             不进 critical path；初屏访客感知不到 3D 包存在）
           - 文字浮卡 .globe-text：诗句 (cn-kaishu) + "乌鲁木齐 ↔ 墨尔本 · 10,755 公里"
             居中偏下，sage→honey 配色，backdrop-blur(8px) 与 vignette 同语
           - <noscript> fallback + role="img" + aria-label 含完整距离描述
           - 数据流（DESIGN §15.1 单一源）：lines 来自 main.json beat 11；from/to/
             distanceKm 来自 journey/long-distance.json（GlobeBeat 内 collection
             拉，不让 React 岛再 fetch；type-safe via getCollection）
        ⑤ **修改 `StoryPoemScroller.astro`**：
           - import GlobeBeat from "@/components/story/GlobeBeat.astro"
           - 加 `globeBeat = main.data.beats.find(kind==="globe")` + `globeLines`
           - 删 v1.54 留的 "batch 3 · §2.B 占位注释"，替换为
             `{globeLines.length > 0 && <GlobeBeat lines={globeLines} />}`
             —— 真正接入 §2.B beat 11
           - 留 batch 4 · §2.C StarCarouselFinale 占位注释（下批次接入）
        ⑥ **build / 线上验证**：
           - tsc 0 errors（noUncheckedIndexedAccess + exactOptionalPropertyTypes
             严格通过）
           - prettier --write clean（4 文件 + 1 修改）
           - pnpm build: 0 errors / 3.78s 完成 / 2 page(s) built（R3F bundle
             warning "chunks > 500 kB" 是预期 —— GlobeDistanceScene island 单独
             chunk，仅 client:visible 时下载）
           - dist 验证：
             * `.globe-beat#beat-11-heading` × 1 ✓
             * `sr-only h3#beat-11-aria-heading` × 1 ✓
             * "松开刹那，" "才见已过万重山。" 诗句 × 2 行 ✓
             * "10,755 公里" + "乌鲁木齐 ↔ 墨尔本" 距离标签 ✓
             * `GlobeDistanceScene.{hash}.js` = 889KB（R3F + @react-three/drei +
               three.js，~250KB gzip）lazy-loaded via client:visible
             * <noscript> fallback 渲染纯文字描述 ✓
           - § 0 / § 1 / § 2.A 10 个 photo-poem beat 无 regression
        ⑦ git: `db436c1` · CI run [25483397697](https://github.com/YiTiane/forever-begins/actions/runs/25483397697)
        ⑧ **NOT in this batch**（v0.2 留刀）：
           - 2K 水彩贴图 `globe-watercolor-2k.jpg`（misc CDN 仓 Phase 3 资产 push
             后切到 useTexture，单行替换）
           - Bloom + Vignette + ToneMapping postprocessing（端点 halo 现用透明
             球模拟，接 postprocessing 后真 bloom 出来）
           - 距离数字 CountUp 同步弧线（当前静态渲染；motion polish 接 IO + raf
             ease-out）
           - 城市标签 3D <Html> 锚定（当前 2D 浮卡列出城市名，避免 3D 标签 reflow /
             a11y 复杂度）
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale Shader Dissolve
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑨ **§2 batch 8 next**：v1.71 GlobeDistanceScene 截图复审 + reduced-motion
           实测 + 桌面拖拽手感 / 移动自动转手感复审；通过后实施 §2.C
           StarCarouselFinale Shader Dissolve 走马灯。
  v1.70 — §2 batch 6 收口（修 v1.69 wide audit 1 P2：宽屏 diagonal-gaze 两人像被 sticky stage overflow 裁切）：
        ① **修 P2（1375×997 viewport #beat-02-heading 落点两人像顶 / 底各被切 ~33px）** ·
           `src/lib/story/beatLayoutSolver.ts` 与 `src/components/story/PoemBeat.astro`：
           - 几何根因：原 4% 角落 inset + ±15% 入场 transform + photoMaxH=stageH*0.5
             在 sticky stage overflow:hidden 下，p=0 时 photo 顶部位置 =
             stageH*0.04 - photoH*0.15。1375×997 实测：photo 311×466，
             top edge = 933*0.04 - 466*0.15 = -33px → stage 顶部上方 33px 被裁
           - **solver `solveDiagonalGaze` wide 分支收紧人像盒**：
             * photoMaxW: stageW * 0.3 → 0.28（横向收紧 ~7%）
             * photoMaxH: stageH * 0.5 → 0.42（纵向收紧 ~16%）
             * textW: clamp(stageW * 0.5, 360, 540) → clamp(stageW * 0.42, 360, 520)
               —— 文字浮卡缩窄给人像横向 ≥ 20px 呼吸
           - **CSS 角落 inset + 入场 transform 双双收紧**：
             * `.poem-photo[data-role="top-left"]`: top:4%/left:4% → 6%/6%；
               transform translate ±15% → ±8%
             * `.poem-photo[data-role="bottom-right"]`: bottom:4%/right:4% → 6%/6%；
               transform translate ±15% → ±8%
           - 手算覆盖三档常见宽屏（公式: top edge at p=0 = stageH*0.06 - photoH*0.08）：
             * 1366×768: stageH=704, photoH≈296 → 19px ✓
             * 1375×997: stageH=933, photoH≈392 → 25px ✓
             * 1920×1080: stageH=1016, photoH≈427 → 27px ✓
           - 视觉契约保留：中央文字浮卡 z-index:2 + backdrop-blur 仍在 photo 之上；
             入场 settle "对视轴" 仍可见（8% 不为 0），更克制；composed frame
             在 p=0 / p=1 都不再裁切
           - PoemBeat.astro 头注释升 v1.3 → v1.4 加 v1.70 段记录 P2 修法 + 三档手算
        ② **build / 线上验证**：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check (含 prettier-plugin-astro): clean
           - pnpm build: 0 errors / 1.78s 完成 / 2 page(s) built
           - dist CSS 验证：
             * `.poem-beat[...][data-story-mode=wide][data-layout=diagonal-gaze]
                .poem-photo[...][data-role=top-left]{position:absolute;top:6%;
                left:6%;transform:translate(calc((1 - var(--p, 0)) * -8%),
                calc((1 - var(--p, 0)) * -8%))}` ✓
             * 同 `[data-role=bottom-right]` 对称 6%/8% ✓
           - solver 写出的 `--photo-tl-w/h / --photo-br-w/h / --text-max-w` 走 runtime
             applyLayout（dist HTML 不含静态值），TypeScript 0 错误保证 schema 不变
           - § 0 / § 1 / 其它 9 个 beat 无 regression
        ③ git: `644b75d` · CI run [25482627494](https://github.com/YiTiane/forever-begins/actions/runs/25482627494)
        ④ **NOT in this batch**（v1.69 audit 中明确 non-blocking 的 P3 留 §2 后续刀）：
           - vignette line 2/3 在 hash landing 仍 reserve layout height（透明但占位）—— 用户
             明确说 "acceptable as a non-blocking motion/stagger choice"，不修
           - globe (beat 11) → §2.B GlobeDistanceScene
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D）
           - beat 09 缝线 SVG path 真实纹理 / beat 10 珍珠高光真实闪动（动效细化）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑤ **§2 batch 7 next**：v1.70 wide diagonal-gaze 截图复审（用户已确认 v1.69 其它
           7 个 wide 帧通过：parallax-pair / radial-mask / anchor-single ×2 /
           overlap / reveal / wooden / pearl）；通过后实施 §2.B GlobeDistanceScene
           3D 地球场景。
  v1.69 — §2 batch 6 收口（修 v1.68 audit 1 P2 + 1 P3：vignette 首句锚定 opacity:1 + dimension gate 头注释 dual-CDN 描述）：
        ① **修 P2（vignette hash landing 仍非 composed frame：照片 + 空白深色卡）** ·
           `src/components/story/PoemBeat.astro`：
           - v1.68 把公开 hash 锚点 `#beat-XX-heading` 上移到 .poem-beat 外层，
             解决了 sr-only h3 1×1 不可见元素的对齐问题。但 vignette 的 v1.62
             文字 stagger 把三行同时 gate 在 --p-text 区段：
             * line1: opacity = clamp(0, --p-text * 1.4, 1)
             * line2: opacity = clamp(0, (--p-text - .18) * 1.6, 1)
             * line3: opacity = clamp(0, (--p-text - .36) * 1.8, 1)
           - hash 落到 .poem-beat 顶端 → sticky stage 起点 → --p-text ≈ 0 → 三行
             全 opacity:0 → #beat-06-heading 实测看到的是"照片 + 暗角 + 空白
             深色文字浮卡"，违反"公开 deep-link 应是 composed frame"契约
           - 改：第 1 行 = 锚句 (anchor line)，opacity:1 不接 --p-text gate；
             第 2/3 行保留原 stagger 区段。hash landing 必有"照片 + 暗角 +
             首句诗"的可读导演帧；正常滚动入场时 line2/line3 仍按
             --p-text=0.18 / 0.36 阈值逐行渐显，电影感保留
           - 头部 docblock 升 v1.2 → v1.3，加 v1.69 段记录这次设计决策（"锚句
             + 2 行 stagger" 替代 "三行 stagger"）
           - dist 验证：vignette p:nth-child(1){opacity:1}（不再 gate）；
             p:nth-child(2)/(3) 保留 clamp(0, calc((--p-text - .18 / .36) *
             1.6 / 1.8), 1)
        ② **修 P3（dimension gate 顶部契约描述漂移：v0.1 时代单 CDN，实际已 v0.4 dual-CDN）** ·
           `scripts/verify-story-photo-dimensions.ts`：
           - v0.1 时代头注释写"对每张 photo，构造 CDN URL `${primary}/jpg/...`"
             —— 单 CDN 顺序探查 + 外层 aspect 比对契约
           - 实现已经过三轮升级：v0.2 dual-CDN（v1.66）/ v0.3 first-success-wins
             Promise.any（v1.67）/ v0.4 abort losers externalSignal（v1.68），
             顶部描述与代码偏离很远，未来审计若从过时描述出发会反向推 build
             gate 实际不该这样
           - 改：头部版本戳升 v0.1 → v0.4，重写"本脚本作为 prebuild gate"段
             为 dual-CDN first-valid + abort losers 契约：① 同时构造 primary
             (jsDelivr) + backup (Statically) 两个 cdnUrl；② probeOne 内 race
             每个 attempt 跑 fetch + JPEG SOF + cdnAspect 比对（任一步失败该
             attempt 即视为失败）；③ Promise.any 首胜立即 resolve，返回前
             ctrls.forEach(c=>c.abort()) 取消未完结输者；④ 全失败 →
             AggregateError，attempts 收集的细节拼综合错误抛出
           - 新增"设计为什么 dual-CDN"段（v1.66 audit 发现 jsDelivr 偶发缓存
             stale 派生品 → backup 给区域 / 缓存抖动兜底）和"设计为什么
             首胜 + abort"段（v1.67 Promise.all 等两侧拖慢 build → any
             让快侧先返回；v1.68 输者仍跑到 5s timeout 占带宽 →
             externalSignal abort 立即取消）
           - 逻辑零变化（commit diff 仅 docblock 行）；prebuild 仍 12/12
             primary 命中、aspect 通过
        ③ **build / 线上验证**：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check (含 prettier-plugin-astro): clean
           - pnpm prebuild: 12/12 photo dimension gate 通过 (dual-CDN
             first-valid + abort losers)
           - pnpm build: 0 errors / 1.67s 完成 / 2 page(s) built
           - dist CSS 验证：
             * `.poem-beat[...][data-layout=vignette] .poem-text [...]
                p[...]:nth-child(1){opacity:1}` （锚句锁定）
             * `:nth-child(2){opacity:clamp(0,calc((var(--p-text, 0) - .18)
                * 1.6),1)}` （stagger 阈值 0.18 保留）
             * `:nth-child(3){opacity:clamp(0,calc((var(--p-text, 0) - .36)
                * 1.8),1)}` （stagger 阈值 0.36 保留）
           - dist HTML / CSS 其它部分零变化（文档头注释 + 1 行 CSS opacity
             改写不影响 layout / id / scroll-margin）
           - § 0 / § 1 无 regression
        ④ git: `dcd38e3` · CI run [25481998038](https://github.com/YiTiane/forever-begins/actions/runs/25481998038)
        ⑤ **NOT in this batch**（仍留 §2 后续刀）：
           - globe (beat 11) → §2.B GlobeDistanceScene
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D）
           - beat 09 缝线 SVG path 真实纹理 / beat 10 珍珠高光真实闪动（动效细化）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑥ **§2 batch 7 next**：宽屏 wooden side-text-photo 截图复审 + 全部 5 种
           textPlacement (below / between / overlay-bottom / overlay-center /
           overlay-top / side-text-photo) 跨 viewport 矩阵；通过后实施 §2.B
           GlobeDistanceScene 3D 地球场景。
  v1.68 — §2 batch 6 收口（修 v1.67 audit 1 P2 + 2 P3：hash 锚点上移 .poem-beat + dimension gate abort 输者 + PoemBeat 头注释收口）：
        ① **修 P2（公开 deep-link `#beat-XX-heading` 落点不是 composed frame）** ·
           `src/components/story/PoemBeat.astro`：
           - v1.67 之前 headingId="beat-XX-heading" 挂在 sr-only h3 上（同时
             既做 aria-labelledby 引用也做公开哈希锚点）。但 sr-only h3 是
             absolute / clip:rect(0,0,0,0) 的 1×1 视觉不可见元素，且位于
             sticky stage（.poem-stage）内部某个位置 → 浏览器哈希滚动会把它
             对齐到视口顶部，落点不是 intentional composed frame
           - 改：拆分两个 id：
             * `headingId = beat-${id}-heading` 上移到 .poem-beat 外层（公开
               哈希、可导航；scroll-spacer 顶端对齐视口 → wide 模式 sticky
               起点正常触发，portrait/compact 直接显示完整 beat）
             * `ariaHeadingId = beat-${id}-aria-heading` 留给 sr-only h3（仅
               aria-labelledby 引用，命名 -aria 后缀清楚指明用途，不暴露为
               公开 URL）
           - .poem-beat 新增 CSS `scroll-margin-top: 0` 显式契约：未来若加
             fixed site nav，此处统一调整 scroll-padding 即可
           - dist 验证：10× id="beat-XX-heading" 在 .poem-beat × 10 + 10×
             id="beat-XX-aria-heading" 在 sr-only h3 × 10 + aria-labelledby
             全部指向新 -aria id；CSS 含 .poem-beat{scroll-margin-top:0}
        ② **修 P3-1（dimension gate Promise.any 首胜后输者继续挂到 5s timeout）** ·
           `scripts/verify-story-photo-dimensions.ts` v0.3 → v0.4：
           - v0.3 改 Promise.any 后首个成功 attempt 立即 resolve，但失败/慢的
             一侧 fetch 仍在背景挂到自己的 5s AbortController 超时 → 12 张顺序
             跑、若 backup 区域性卡顿，"省下" 的时间仍被吃掉
           - 改：fetchWithTimeout 升 v0.4，新增 externalSignal 入参；
             externalSignal abort 同步到内部 ctrl（fetch 仅接 1 个 signal），
             双路任一触发先到的赢；finally 反注册 listener 防内存泄漏
           - probeOne 内为每个 candidate 创建 AbortController，挑入 ctrls[]；
             tryOne(cdn, url, signal) 把 signal 传给 fetchWithTimeout
           - Promise.any 拿到首胜结果后 ctrls.forEach(c => c.abort()) 取消
             所有未完结的 fetch（含 primary 慢但 backup 先成功的反向情形）
           - 实测 12 张顺序跑；现在首个 CDN 成功即解锁下一张，不再等慢侧
             timeout
        ③ **修 P3-2（PoemBeat 头注释 v0.9/v1.62 过时；NOT-in-batch 列表含已实现项）** ·
           同 PoemBeat.astro：
           - 头部 docblock 从 "v0.9 · v1.62" 改 "v1.2 · v1.68 hash anchor
             上移 + textPlacement 全量收口"
           - 删 v0.9 时代的"5 套新 layout 视觉首版上线"叙述（已被 v1.66
             textPlacement 分化覆盖）；新增 v1.0 / v1.1 / v1.2 三段累积变更
             摘要：v1.0 (v1.65 SolverOutput→SolverResult) / v1.1 (v1.66 4 套
             single-photo textPlacement + screen blend / v1.67 mobile overlay
             reset) / v1.2 (v1.68 hash anchor 上移)
           - "落地范围"从 v1.59 收口标准（4 套 layout）升 v1.68 收口标准：
             ✓ 9 套 data-layout schema enum 全量上线
             ✓ 5 种 textPlacement (below / between / overlay-bottom /
               overlay-center / overlay-top / side-text-photo) 按 layout × mode
               分化
             ✓ photo fit/focalPoint contract（schema 强约束 contain × 7 / cover × 5）
             ✓ vignette beat 06 重点夜色舞台 + Canvas 雪粒子 (mix-blend-mode: screen)
             ✓ mobile fallback (≤540) 把 overlay absolute text reset 回流式堆叠
             ✓ public hash anchor `#beat-XX-heading` 落到 .poem-beat composed
               frame 起点
             ✓ build-time CDN dimension gate (verify-story-photo-dimensions.ts)
           - "NOT in this batch"删已实现项（5 套 layout solver+CSS / 文字字符级
             stagger / 真 inertia parallax 部分以 calc 表达），保留 globe (beat 11) /
             finale 完整版 (beat 12) / beat 05 [N]天 CountUp / beat 09 缝线 SVG path /
             beat 10 珍珠高光真实闪动 / Phase 5 motion polish
        ④ **build / 线上验证**：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check (含 prettier-plugin-astro): clean
           - pnpm prebuild: 12/12 photo dimension gate 通过 (first-success-wins
             + abort losers，单张 ~120ms primary 命中即解锁下一张)
           - pnpm build: 0 errors / 1.66s 完成 / 2 page(s) built
           - dist/index.html 验证：10× id="beat-XX-heading" 在 .poem-beat ×
             10 + 10× id="beat-XX-aria-heading" 在 sr-only h3 × 10 +
             aria-labelledby="beat-XX-aria-heading" 全部命中
           - dist CSS 含 `.poem-beat{...scroll-margin-top:0;...}`
           - data-text-placement 分布不变（below × 4 / between × 2 /
             overlay-bottom × 1 / overlay-center × 1 / overlay-top × 2 /
             side-text-photo × 1）
           - § 0 / § 1 无 regression
        ⑤ git: `d873605` · CI run [25481509745](https://github.com/YiTiane/forever-begins/actions/runs/25481509745)
        ⑥ **NOT in this batch**（仍留 §2 后续刀）：
           - globe (beat 11) → §2.B GlobeDistanceScene
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D）
           - beat 09 缝线 SVG path 真实纹理 / beat 10 珍珠高光真实闪动（动效细化）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑦ **§2 batch 7 next**：宽屏 wooden side-text-photo 截图复审 + 全部 5 种
           textPlacement (below / between / overlay-bottom / overlay-center /
           overlay-top / side-text-photo) 跨 viewport 矩阵；通过后实施 §2.B
           GlobeDistanceScene 3D 地球场景。
  v1.67 — §2 batch 6 收口（修 v1.66 audit 2 P2 + 1 P3：dimension gate first-success-wins + mobile overlay reset）：
        ① **修 P2-A（dual-CDN gate 先选 CDN 再比对 aspect, backup 救不回 primary stale）** ·
           `scripts/verify-story-photo-dimensions.ts` v0.2 → v0.3：
           - v0.2 probeOne 只要 primary 解析 JPEG 就直接返回 dim，aspect 比对发生在
             外层 → 若 jsDelivr 缓存到旧尺寸，build 仍 fail，违反"任一 CDN 解析 +
             aspect 通过即过"契约
           - 改：aspect 校验下沉到每个 CDN attempt 内
             tryOne(cdn, url) 内：fetch + JPEG SOF parse + 计算 cdnAspect + 比对
             relErr ≤ tolerance；任何一步失败都视为该 attempt 失败（含 dim 但
             aspect 不匹配）
           - probeOne 接 expectedAspect / tolerance 入参；main 循环不再外层重复比对
        ② **修 P3（gate 文案说任一成功即用，但 Promise.all 等两侧都结束）** · 同脚本：
           - v0.2 用 Promise.all 等两侧 → 即使 primary 已成功，backup 卡 5s timeout
             仍要等；12 张顺序跑、backup 区域性卡顿会把 build 拖到 ~60s
           - 改：probeOne 改 Promise.any，首个 fetch + parse + aspect 通过的 attempt
             立即 resolve；其它仍 racing 但不阻塞返回；全部 reject → AggregateError
             → 综合 throw 含两侧 attempts 收集的具体 reason
           - 实测 12 张 photo 全部 from primary + aspect 通过；build 不再等 backup
        ③ **修 P2-B（compact mobile fallback 没取消 overlay absolute text）** ·
           `src/components/story/PoemBeat.astro`：
           - v1.65 / v1.66 引入 overlay-bottom / overlay-center / overlay-top
             把 .poem-text 设 position:absolute + top/left/inset/width/z-index 浮卡
           - v1.66 mobile fallback 只 reset text-align / max-width / grid /
             transform / background / blur / padding；**没 reset position/inset/
             z-index/color** → 窄屏单列堆叠时 overlay 文字仍 absolute
           - 改：mobile fallback `.poem-text` 加：
             position: static / top/right/bottom/left: auto / width: 100% /
             z-index: auto / color: var(--c-olive-ink)（白文字回归暗色）
           - CSS minified 为 `position:static!important;inset:auto!important;
             width:100%!important;z-index:auto!important`
        ④ **build / 线上验证**（dist 64658 bytes 不变；CSS 微调与 v1.66 同等）：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check: clean
           - pnpm prebuild: 12/12 photo 全部 from primary + aspect 通过 (first-success-wins)
           - pnpm build: 0 errors
           - 外部 CSS：mobile fallback .poem-text 含 position:static + inset:auto +
             z-index:auto + color:var(--c-olive-ink)
           - data-text-placement 分布不变（below × 4 / between × 2 / overlay-bottom × 1
             / overlay-center × 1 / overlay-top × 2）
           - § 0 / § 1 无 regression
        ⑤ git: `e934e0a` · CI run [25480142387](https://github.com/YiTiane/forever-begins/actions/runs/25480142387) success
        ⑥ **NOT in this batch**（仍留 §2 后续刀）：
           - globe (beat 11) → §2.B GlobeDistanceScene
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D）
           - beat 09 缝线 SVG path 真实纹理 / beat 10 珍珠高光真实闪动（动效细化）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑦ **§2 batch 7 next**：宽屏 wooden side-text-photo 截图复审 + 全部 5 种
           textPlacement 跨 viewport 矩阵；通过后实施 §2.B GlobeDistanceScene
           3D 地球场景。
  v1.66 — §2 batch 6（修 v1.65 audit 2 P2 + 1 P3：dual-CDN gate + 4 single-photo textPlacement 分化 + canvas screen blend）：
        ① **修 P2-A（dimension gate 单 CDN 无 timeout）** ·
           `scripts/verify-story-photo-dimensions.ts` v0.1 → v0.2：
           - FETCH_TIMEOUT_MS = 5000，AbortController + setTimeout 手拼（与
             scripts/build-time-check.ts 同款）
           - probeOne 接 (cdnTarget, stem) 并发探 jsDelivr primary + Statically
             backup；任一边 fetch + JPEG SOF parse 都过 → 返回 + sourceCdn
           - 双败 → throw 综合错误（含两侧具体 reason）
           - 通过列表标注 CDN(primary|backup) 便于审计
           实测 12/12 photo 从 primary 解析 ✓
        ② **修 P2-B（4 single-photo layout 仍同构 below）** ·
           `src/lib/story/beatLayoutSolver.ts` v0.4 → v0.5：
           - solveOverlap → "overlay-center"（横幅 ghost + 单行短句浮卡浮于收敛 photo 之上）
           - solveReveal → "overlay-top"（竖幅 + clip-path 由内向外展开 + 文字浮于顶端）
           - solvePearl → "overlay-top"（竖幅 + 珍珠高光 sweep + 文字浮顶 = 珠宝杂志封面感）
           - solveWooden → mode-aware：wide → "side-text-photo"（信件式 letterbox：
             3 行长诗左 + 木门右 0.5 stage 宽）；portrait/compact → "below"（窄屏单列易读）
           - solveSinglePhoto 加 isSide 分支：overlay 与 side 都不再纵向扣减 textReserveH
           - PoemBeat 新增 CSS：
             * [data-layout="overlap"][data-text-placement="overlay-center"]：
               stage relative + photos absolute base + text absolute 50/50 +
               backdrop-blur(7px) + rgba(245,240,230,0.7) 浮卡
             * [data-layout="reveal"|"pearl"][data-text-placement="overlay-top"]：
               text absolute top:clamp(1.5rem,5vh,3rem) + backdrop-blur(6px)
             * [data-layout="wooden"][data-text-placement="side-text-photo"]：
               stage display:grid grid-template-columns:1fr var(--photo-w) +
               text grid-column 1 align-self center text-align left
           - SSR 默认 data-text-placement 同步：vignette / overlap / reveal / pearl /
             parallax-pair / diagonal-gaze / 其它 → 各自匹配 portrait 模式 placement
           dist 验证：data-text-placement 分布 below × 4 / between × 2 /
             overlay-bottom × 1 / overlay-center × 1 / overlay-top × 2 = 10 个 beat
        ③ **修 P3（SnowAtmosphere screen blend 只在 canvas 内）** ·
           `src/components/story/PoemBeat.astro`：
           - .poem-beat[data-layout="vignette"] .snow-atmosphere 加 mix-blend-mode: screen
           - canvas 整体与下方 photo / 暗角混合：暗部白雪发亮、亮部不爆色
           - 真兑现 v1.65 注释里"screen blend 让雪在暗角夜色上发亮"承诺
        ④ **build / 线上验证**（dist 64637 → 64658 bytes，基本不变；CSS 新增 + JSON
           metadata 平衡）：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check: clean
           - pnpm prebuild + build: 0 errors；dual-CDN gate 12/12 photo primary 通过
           - 外部 CSS：[data-text-placement="overlay-center"] 3 处 / overlay-top 6 处
             / side-text-photo 3 处 selector 命中；.snow-atmosphere mix-blend-mode:screen
             命中 1 处
           - § 0 / § 1 无 regression
        ⑤ git: `a12c10c` · CI run [25478429958](https://github.com/YiTiane/forever-begins/actions/runs/25478429958) success
        ⑥ **NOT in this batch**（仍留 §2 后续刀）：
           - globe (beat 11) → §2.B GlobeDistanceScene · 等 R3F + Three.js + 水彩贴图
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale Shader Dissolve
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D）
           - beat 09 缝线 SVG path 真实纹理 / beat 10 珍珠高光真实闪动（动效细化）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑦ **§2 batch 7 next**：截图复审 v1.66 全部 10 个 beat 的 5 种 textPlacement
           视觉效果（重点：overlap overlay-center 浮卡 / reveal+pearl overlay-top 头部
           浮卡 / wooden wide side-text-photo 信件式 / vignette overlay-bottom 雪粒
           screen blend 真发亮）；通过后实施 §2.B GlobeDistanceScene 3D 地球。
  v1.65 — §2 batch 5（修 v1.64 audit 3 处 P2：CDN dimension gate + solver textPlacement + Snow_08 雪舞台）：
        ① **修 P2-A（main.json metadata 漂移防护）** · 新增
           `scripts/verify-story-photo-dimensions.ts` v0.1 + 串入 prebuild：
           - 读 main.json 的 photo width/height
           - fetch jsDelivr primary URL `${stem}-1600.jpg`
           - 内置 30 行 JPEG SOF parser 读真实像素（无第三方依赖）
           - aspect 比对（容差 ±2% 给 sharp resize round 误差）
           - 任何 mismatch → exit(1)；本地紧急可 SKIP_STORY_PHOTO_CHECK=1
           - 实测 12/12 photo 全部通过
           package.json prebuild 现链：
             "tsx scripts/build-time-check.ts && tsx scripts/verify-story-photo-dimensions.ts"
        ② **修 P2-B（solver 只解 photo box，不解文字位置）** ·
           `src/lib/story/beatLayoutSolver.ts` v0.3 → v0.4：
           - SolverOutput Record<string, string> 升级为 SolverResult { vars, dataAttrs }
             vars → element.style；dataAttrs → element.dataset
           - 新 TextPlacement 8 种：below / above / between / overlay-bottom /
             overlay-top / overlay-center / side-text-photo / side-photo-text
           - 9 个 solver 函数返回值都加 textPlacement，每 layout × mode 给具体值：
             * parallax-pair wide → side-text-photo（cinematic 文字左 / 双图右）
             * parallax-pair portrait → between（文字夹在 far / near）
             * diagonal-gaze wide → overlay-center（文字浮卡 + backdrop-blur）
             * diagonal-gaze portrait → between
             * radial-mask / anchor-single / overlap / reveal / wooden / pearl → below
             * vignette → overlay-bottom（v1.65 关键：夜色亲密 stage）
           - solveSinglePhoto 接 textPlacement 入参；overlay 模式 textReserveH=0
             让 photo 占整 stage；vignette photoMaxWFactor 0.85→0.92, photoMaxAbs 720→820
           StoryPoemScroller applyLayout：读 result.vars 写 style.setProperty；
             读 result.dataAttrs.textPlacement 写 beat.dataset.textPlacement
           PoemBeat：SSR 默认 data-text-placement 与 SSR mode 输出匹配
             （vignette → overlay-bottom / parallax-pair / diagonal-gaze → between
              / 其它 → below）；JS applyLayout 始终覆写
        ③ **修 P2-C（Snow_08 没有重点舞台 / 雪动画）** · 新增
           `src/components/story/SnowAtmosphere.astro` v0.1：
           - Canvas 2D 24-48 个雪粒子，半径 0.8-2.4px / 下落 8-22 px/s /
             横向 sway ±0.3px·帧 / opacity 0.4-0.85；越大越前景（depth-aware
             速度 + 不透明度），blendMode "screen" 让雪在暗角夜色上发亮
           - DPR-aware（max 2 防 retina 4x 像素压力）；resize 同步 canvas 物理尺寸
           - 生命周期：IO 监 .poem-beat（vignette）进/离视口启停 rAF；
             visibilitychange tab 切后台 pause；prefers-reduced-motion 仅留首帧
             静态雪粒不跑 rAF
           - canvas aria-hidden="true" 纯装饰
           - 调试钩子 window.__snowAtmosphere?.particles()
           PoemBeat：
           - import + vignette layout + role=vignette 条件渲染 <SnowAtmosphere /> 在 figure 内
           - .snow-atmosphere absolute inset:0 + z:3（在 photo:1 与暗角 ::after:2 之上）
           Vignette CSS 重做：
           - photo 占整 stage；暗角 ::after alpha 0.4→0.6→0.78 / inner 30%→18% 更收
           - text overlay-bottom：absolute / bottom clamp(2rem, 6vh, 4rem) /
             rgba(15,18,30,0.45) 半透明深底 + backdrop-blur(6px) +
             rgba(255,255,255,0.95) 白文字 + padding 1rem 1.5rem / radius
           - 三行 stagger :nth-child(1/2/3) × clamp(--p-text) 区段保留
        ④ **build / 线上验证**（dist 61832 → 64637 bytes，+2805B：SnowAtmosphere
           inline JS module + overlay-bottom CSS）：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check (含 scripts/ + SnowAtmosphere): clean
           - pnpm prebuild + build: 0 errors；prebuild 跑 12/12 dimension probe ✓
           - dist HTML：data-text-placement 全 10 beat（below × 7 / between × 2 /
             overlay-bottom × 1）；beat 06 vignette 含 <canvas class="snow-atmosphere">
             + 内联 module
           - 外部 CSS：vignette overlay-bottom rule 命中 position:absolute /
             backdrop-filter blur(6px) / rgba 深底
           - § 0 / § 1 无 regression
        ⑤ git: `02b6908` · CI run [25477525581](https://github.com/YiTiane/forever-begins/actions/runs/25477525581) success
        ⑥ **NOT in this batch**（仍留 §2 后续刀）：
           - globe (beat 11) → §2.B GlobeDistanceScene · 等 R3F + Three.js + 水彩贴图
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale Shader Dissolve
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D）
           - beat 09 缝线 SVG path 真实纹理 / beat 10 珍珠高光真实闪动（动效细化）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑦ **§2 batch 6 next**：截图复审 v1.65 全部 10 个 beat（重点：vignette beat 06
           overlay-bottom + 雪粒子在 wide / portrait / mobile 都自然；其他 9 beat 视觉
           契约不退步）；通过后实施 §2.B GlobeDistanceScene 3D 地球。
  v1.64 — §2 batch 4 收口（修 v1.63 audit 4 处 P2：Story photo contract repair）：
        ① **修 P2-1（main.json metadata 与 CDN 真实尺寸不一致）**：CDN 实测 6 张实际
           1600×2400 (0.667 portrait) 竖幅人像被 main.json 错标 3000×2000 (1.5 landscape)
           —— Snow_05 / Snow_13 / Snow_08 / Snow_12 / Pearl_03（StoryPoem）+ Pearl_04（finale 海报）。
           solver 据此按横幅 box 求解，getFit 自动推 cover，CSS object-fit: cover 把人物头/上半身裁掉。
           - main.json 5 张 photo width/height 修正为 2000×3000（正确 portrait source 比例）
           - StoryPoemScroller Pearl_04 finale CdnImage 修正 width/height = 2000/3000；
             .story-end-card grid-template-columns 收紧到 460px；max-height min(70vh, 700px)；
             object-fit: contain；mobile width: min(72vw, 380px)
           - main.json 全部 12 张 photo 都显式写了 fit（contain × 7 / cover × 5）
        ② **修 P2-2（getFit 依赖错误尺寸推断）**：v1.63 fit 缺省时按 width/height 自动推
           portrait→contain，metadata 错的话推断也错。改为 schema 层强约束：
           - content.config.ts (v0.8 → v0.9)：storyPoemPhoto.fit 从
             z.enum(...).optional() 升级为 z.enum(...) 必填
           - PoemBeat (v1.0 → v1.1)：BeatPhoto.fit 从 optional 改 required；getFit() 直接
             return p.fit，不再"自动推导"——视觉契约从"凭 metadata 推导"改为"显式声明"，
             防 metadata 漂移时静默裁人主体
        ③ **修 P2-3（parallax-pair 窄屏仍用绝对重叠）**：v1.63 parallax-pair 的
           .poem-photos { position: relative; height: var(...) } + far/near absolute 在所有
           模式都生效；窄屏两张横幅压叠破坏阅读节奏。改：absolute overlap frame 完全收进 wide：
           - photo 尺寸 baseline (all modes) 仅 width/height
           - **portrait 模式新规则**：display: flex column；.poem-photos 改 display: contents 让
             两 figure 直接成 stage flex 项；order:1/2/3 排"far → text → near"中间；align-self:
             flex-end / flex-start 暗示远近；不 absolute overlap → 真正自然纵向流
           - **wide 模式规则保留**：grid 双列 + far/near 绝对重叠 + 入场 transform
        ④ **build / 线上验证**（dist 61821 → 61832 bytes，基本不变；JSON 加 fit 字段平衡 audit fix）：
           - pnpm exec tsc --noEmit: 0 errors（schema fit 必填，main.json 12 photos 全过）
           - prettier --check: clean
           - pnpm build: 0 errors
           - dist HTML：5 张错标 + Pearl_04 现在都 width="2000" height="3000"
           - data-fit="contain" × 7（Snow_14/15 + Snow_05/13/08/12 + Pearl_03）
           - data-fit="cover" × 5（Snow_03/07 + Snow_11 + Snow_09 + Wooden_door_01）
           - portrait parallax-pair display: contents 命中 .poem-photos
           - § 0 / § 1 无 regression
        ⑤ git: `165880b` · CI run [25476890143](https://github.com/YiTiane/forever-begins/actions/runs/25476890143) success
        ⑥ **NOT in this batch**（仍留 §2 后续刀，按 v1.63 audit 标 P2-4/P2-5 推进）：
           - solver textPlacement 输出（top/bottom/side/overlay）—— 单图布局现在仍是
             "图 + 居中文字"同构；future batch 让 solver 解文字位置而非只解 photo box
           - Snow_08 vignette 重点舞台 + 雪粒子 / 雪层动画（motion polish 刀）
           - build-time CDN 尺寸自动校验脚本（manifest probe 防 metadata 漂移）
           - globe (beat 11) → §2.B GlobeDistanceScene
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑦ **§2 batch 5 next（建议）**：solver textPlacement 升级 + Snow_08 重点舞台
           （或先 GlobeDistanceScene 视用户优先级而定）。
  v1.63 — §2 batch 4 收口（修 v1.62 audit P2-A/P2-B/P3：photo fit/focal contract + diagonal-gaze 三模式拆分）：
        ① **修 P2-A（竖幅人像默认 cover 有裁切风险）** ·
           Schema (`src/content.config.ts` v0.7→v0.8) + PoemBeat (v0.9→v1.0) + main.json：
           v1.62 之前所有 photo 都继承 .poem-photo img { object-fit: cover }，对横向氛围
           图无碍，但对 Snow_14 / Snow_15 这类 2000×3000 竖幅人像没兜底 —— 一旦 box / 原图
           比例略偏差，人物的脸 / 上半身可能被裁。婚礼叙事照片不应默认裁人像。引入 photo
           渲染契约：
           - schema 加 storyPoemPhoto.fit?: "contain" | "cover"
           - schema 加 storyPoemPhoto.focalPoint?: { x: 0..1, y: 0..1 }（cover 时生效）
           - PoemBeat 新增 getFit(p) helper：schema 显式优先；否则按 role / aspect 推导
             （diagonal-gaze 双人像 role 强制 contain；w<h portrait 强制 contain；
              w≥h landscape 默认 cover）
           - PoemBeat 新增 getObjectPositionStyle(p) helper：focalPoint 写为 inline
             style="--object-position: x% y%" 给 cover CSS 消费
           - figure 现挂 data-fit + style 双属性
           - CSS：删除默认 object-fit；新增 [data-fit="cover"] img { object-fit: cover;
             object-position: var(--object-position, center) } 与 [data-fit="contain"]
             img { object-fit: contain; background: var(--c-paper) }
           - main.json：Snow_14 / Snow_15 显式 "fit": "contain"（不依赖自动推导）
           dist 验证：data-fit="contain" × 2 / data-fit="cover" × 10
        ② **修 P2-B（diagonal-gaze 仍无条件 absolute corner frame）** ·
           PoemBeat (v1.0)：
           v1.62 base 规则把双图 absolute 到 top:0 left:6% / bottom:0 right:6%；wide 分支
           只 override 数值。意味 portrait/tablet (541-899) 跑桌面 absolute 框架 ——
           人像 box 与 photos-col-h 边缘碰撞。改：absolute corner frame 完全收进
           [data-story-mode="wide"]。
           - photo 尺寸 baseline (all modes) 仍 width: var(--photo-tl/br-w)
           - **portrait 模式新规则**：.poem-stage 改 display: flex + column；
             .poem-photos 改 display: contents（让 figures 直接成 stage flex 项）；
             用 order:1/2/3 把 text 排在两图中间；align-self: flex-start / flex-end
             暗示对角；不再 absolute → 真正的"对角自然流式"
           - **wide 模式规则保留**：grid 单 cell stack + 角落 absolute + 文字
             backdrop-blur 浮起 + 入场 translate
           dist 验证：portrait diagonal-gaze CSS 含 display: contents；
             diagonal-gaze base 0 处 unconditional position: absolute
        ③ **修 P3（CSS 注释 "narrow (541-719)" stale）**：
           parallax-pair 注释段更新为 compact (≤540) / portrait (541-899) / wide
           (≥900 + aspect ≥0.85) 三模式责任划分。
        ④ **build / 线上验证**（dist 61613 → 61821 bytes，+208B：data-fit + fit/focalPoint
           schema 字段）：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check: clean
           - pnpm build: 0 errors
           - dist HTML: data-fit="contain" × 2（Snow_14 / Snow_15 verified）+
             data-fit="cover" × 10
           - 外部 CSS: data-fit=cover / data-fit=contain selector 各 2 处（picture + img）；
             portrait diagonal-gaze display: contents 命中；diagonal-gaze base 0 处
             unconditional absolute
           - § 0 / § 1 无 regression：part_1 eager+high · 章节顺序 · JSON-LD startDate 同源
        ⑤ git: `f004150` · CI run [25476002066](https://github.com/YiTiane/forever-begins/actions/runs/25476002066) success
        ⑥ **NOT in this batch**（仍留 §2 后续刀）：
           - globe (beat 11) → §2.B GlobeDistanceScene
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D）
           - beat 09 缝线 SVG path 真实纹理 / beat 10 珍珠高光真实闪动（motion polish）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
        ⑦ **§2 batch 5 next**：按 market viewport 矩阵截图复审 v1.63（重点：portrait
           601-820 + wide 1366-1920 × beat 02 Snow_14/15 是否完整可见无裁切；fit
           contract 在 contain 模式下边距 / 背景是否合理）；通过后实施 §2.B
           GlobeDistanceScene 3D 地球。
  v1.62 — §2 batch 4（修 v1.61 audit + lift maxBeats 4→10 + 5 套新 layout 全量上线）：
        ① **修 P2-A（Pearl_04 finale priority high → auto）** · StoryPoemScroller：
           v1.61 给 .story-end-cap 的 Pearl_04 写了 priority="high"，下面 below-fold
           大图被 eager + fetchpriority high 抓包初始 HTTP/2 头几个连接，与 §0 part_1
           真正 LCP 抢带宽。改 priority="auto"（loading="lazy"）；.story-end-cap
           已有 min-height 100vh 撑住容器，滚到时再 lazy-load 不会出现"空框"。
           dist 验证：Pearl_04 现为 loading="lazy"。
        ② **修 P2-B（finale 文案硬编码）** · StoryPoemScroller：
           v1.61 把 "还好我们有牢牢抱紧" / "幸好最终是你" 直接写在组件里。这两行恰好
           是 main.json beats[11] (kind="finale") 的 lines —— schema 已严约束 12=finale，
           组件应从 schema 拉，否则编辑 main.json 不更新页面，违 DESIGN §15.1 单一源。
           改：frontmatter 加 finaleBeat / finaleLines；template 用 finaleLines.map
           渲染。后续 batch 6 接 StarCarouselFinale 时统一接缝（不会有"修组件 vs 修 JSON"两条改路）。
        ③ **修 P3-A / P3-B（头注释 stale）**：
           - StoryPoemScroller v0.5/v1.59 头注释 → v0.7/v1.62，补 v1.59-v1.62 全段
             changelog；写明 wide / portrait / compact 三模式责任 + finale 数据流
           - PoemBeat v0.8 头注释把 "sticky cinematic stage" 限定为 wide 模式专属；
             portrait 释放 sticky / compact 取消 absolute / mask 的契约写在头部
        ④ **修 P3-C（FOUC 减轻）** · PoemBeat frontmatter：
           SSR 默认 `<section ... data-story-mode="portrait">`。手机 / 小平板（市场
           绝大多数）首帧即正确；wide desktop 用户 JS 解析后一次 re-layout（acceptable）。
           runtime applyLayout 仍始终覆写 dataset.storyMode，无副作用。
        ⑤ **lift maxBeats 4 → 10** · StoryPoemScroller v0.5 → v0.7：
           Props.maxBeats 默认 4 → 10；现在渲染全部 10 个 photo-poem beat。
           dist HTML data-beat-id × 10 (01..10) verified。
        ⑥ **新增 5 套 single-photo layout** · beatLayoutSolver v0.2 → v0.3：
           - BeatLayout type 扩到 9 项（vignette / overlap / reveal / wooden / pearl）
           - 共享 helper solveSinglePhoto(input, opts: SinglePhotoOpts) 五个新 layout
             共用几何骨架，差异只在 opts (photoMaxWFactor / photoMaxAbs / gap /
             textTopReserveFactor / textOverhang)，对应"克制 vs 主导"差异
           - solveVignette : 0.85 / 720 / 28 / 0.20 / 60 (夜色，photo 偏大，3 行诗)
           - solveOverlap  : 0.78 / 660 / 24 / 0.14 / 60 (单行短诗，gap 紧)
           - solveReveal   : 0.85 / 720 / 24 / 0.14 / 60 (clip-path 展开，photo 偏大)
           - solveWooden   : 0.70 / 560 / 26 / 0.22 / 40 (3 行诗，photo 克制)
           - solvePearl    : 0.78 / 640 / 24 / 0.16 / 50 (2 行诗，珍珠尺度)
           - 主 switch 新加 5 个 case；TypeScript exhaustive
        ⑦ **5 套 layout 视觉特效** · PoemBeat v0.8 → v0.9：
           - **vignette** (beat 06)：photo ::after radial dark vignette + text
             :nth-child(1/2/3) 用不同 --p-text 区段 stagger fade-in（line 1: 0..0.7,
             line 2: 0.18..0.81, line 3: 0.36..0.92）
           - **overlap** (beat 07)：photo filter: drop-shadow 双侧白色 (rgba(255,
             255,255,0.32)) + 纸白 (245,240,230,0.32) ghost，offset = (1 - --p) *
             12px → 0；"两个灵魂收束" 由位错重合 → 单图收敛表达
           - **reveal** (beat 08)：photo clip-path: inset((1 - --p) * 9% all) round
             6px + scale 0.98→1；"卸下防备" 由"露出比例 0→100%"表达
           - **wooden** (beat 09)：photo ::after 内 6px 的 dashed border (rgba(180,
             130,80,0.78))；--p 0→1 时 opacity 0→0.92 + scale 0.96→1
           - **pearl** (beat 10)：photo ::after linear-gradient 105deg 中段 28%
             半透明白带 + soft-light blend，translateX (--p * 200% - 100%) 横扫
        ⑧ **build / 线上验证**（dist 43219 → 61613 bytes，+18394B：6 新 beat HTML/srcset）：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check: clean
           - pnpm build: 0 errors
           - dist HTML: 10 个 data-beat-id (01..10) / 9 个 data-layout 值 / 11 个
             data-role 值 / SSR data-story-mode="portrait" × 10
           - Pearl_04 loading="lazy"（验证 P2-A 修复）
           - "还好我们有牢牢抱紧" / "幸好最终是你" 在 dist HTML（验证 P2-B schema 拉）
           - solver bundle 6521 bytes (v1.61 5469 → +1052B 含 5 个新 solver 函数)
           - § 0 / § 1 无 regression：part_1 eager+high · 章节顺序 cover→invitation→story-poem
             · JSON-LD startDate 同源
        ⑨ git: `8ef07f2` · CI run [25475375171](https://github.com/YiTiane/forever-begins/actions/runs/25475375171) success
        ⑩ **NOT in this batch**（仍留 §2 后续刀）：
           - globe (beat 11) → §2.B GlobeDistanceScene · 等 R3F + Three.js + 水彩贴图地球
           - finale 完整版 (beat 12) → §2.C StarCarouselFinale Shader Dissolve
             （end cap 是临时帧，已用 schema beat 12 lines；接入正式 Finale 时直接替换）
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - beat 09 缝线 SVG path 真实纹理（当前 dashed border 是 v0 实现）
           - beat 10 珍珠高光真实闪动（当前 gradient sweep 是 v0 实现）
           - 文字字符级 stagger / 鼠标 inertia parallax（Phase 5 motion polish）
           - getStoryLayoutMode 阈值 hysteresis（边界 resize 抖动；低优）
        ⑪ **§2 batch 5 next**：按 market viewport 矩阵截图复审 v1.62 全部 10 个 beat
           的视觉契约（含 5 套新 layout）；通过后实施 §2.B GlobeDistanceScene 3D 地球。
  v1.61 — §2 batch 3 收口（修 v1.60 三处 P2：portrait layout engine + text/photo constraint solver + real finale frame）：
        ① **修 P2 #1（CSS 与 solver 仍在 541-719px 区间解不同布局）**：
           - 新增 `getStoryLayoutMode(vw, vh): compact | portrait | wide`，layout mode 成为单一来源。
           - `StoryPoemScroller.applyLayout()` 统一计算 mode 并写 `beat.dataset.storyMode`。
           - `PoemBeat.astro` CSS 只跟 `data-story-mode` 分支走：compact/portrait 自然纵向复合帧，wide 才启用 sticky + grid/absolute cinematic stage。
           - 彻底移除 541-719 “solver 窄版 + CSS 宽版”的混合根因。
        ② **修 P2 #2（solver 没有真正测量文字高度）**：
           - `beatLayoutSolver.ts` 把 viewport、实测 `.poem-text` 高度、图片 aspect ratio 一起参与求解。
           - parallax-pair / diagonal-gaze portrait 模式改 width-first photo-box cap，避免 tall/narrow 视口把照片拉得过高、文本/图片间距失衡。
           - `clampPx()` 对 min/max 反转做容错，防极端 viewport 产生无效尺寸。
        ③ **修 P2 #3（Story 尾部 end cap 仍是弱占位）**：
           - `StoryPoemScroller.astro` end cap 从单行 `未完待续` 改为 Pearl_04 主海报 + `To be continued` + `还好我们有牢牢抱紧。/ 幸好最终是你。`
           - Pearl_04 用 `<CdnImage cdnTarget="pearl" stem="Pearl_04" ... priority="high">`，避免尾部首帧只露懒加载空框。
        ④ **验证**：
           - `pnpm exec tsc --noEmit`：0 errors
           - `pnpm build`：0 errors
           - `git diff --check`：clean
           - GitHub Actions run `25474711924`：success
           - live：`https://yitiane.github.io/forever-begins/` HTTP 200 · 43219 bytes · `story-end-card` + `Pearl_04-1600.jpg` + `fetchpriority="high"` 命中
           - in-app browser 截图审计：`/private/tmp/forever-v161-story-focused-0.png` / `...-1.png` / `...-2.png` / `...-finale-text.png`
        ⑤ **版本**：
           - 主仓 commit：`c2d0e54 §2 Story v1.61 · portrait layout solver + finale frame`
           - PLAN header/status/footer：同步 v1.61

  v1.60 — §2 batch 3 收口（修 v1.59 三处 P2：solver/CSS 模式对齐 + 文本实测 + Story end cap）：
        ① **修 P2 #1（solver 与 CSS 断点不一致）** · PoemBeat v0.7 → v0.8：
           v1.59 solver 用 vw < 720 判断 narrow，但 CSS 仍以 min-width: 541px 启动桌面式 layout
           （grid + absolute corners）。604px 这种真实窄屏区间会进入"CSS 桌面布局 + solver 窄屏
           变量"的混合状态：CSS 把 photos 列定位到 grid-column: 2 但 stage 是 1fr 单列，photos
           脱顶。修：
           - .poem-stage baseline 改 flex column（垂直居中堆叠），让所有 layout 在 narrow 段
             都能用 solver 输出的 size 变量自然居中
           - parallax-pair / diagonal-gaze 的 grid + absolute corner 规则全部移到
             @media (min-width: 720px) —— solver 与 CSS 共用 720 阈值
           - photo width/height 规则提到 @media 外（all widths 都用 solver 给的尺寸）
           - 541-719 现在走 flex column stack（photos 自然纵向排列、用 solver narrow 尺寸），
             与 ≥ 720 走 grid + absolute 的两层架构清晰对齐
        ② **修 P2 #2（solver 没有测量文本高度）** · beatLayoutSolver v0.1 → v0.2：
           v1.59 applyLayout 只传 vw/vh/layout/photos 给 solver，textReserveH 用 vh×0.18 凭直觉
           常量。窄屏文本高度变化大（多语言、字体加载、断行）时 photo 高度不准 → 松散 / 溢出。修：
           - SolverInput 加 textHeight? / textWidth?
           - solveRadialMask / solveAnchorSingle / solveParallaxPair narrow / solveDiagonalGaze
             narrow 都改 `input.textHeight ?? clampPx(vh × ...)` —— 实测优先，缺失退回估算
           - StoryPoemScroller applyLayout：getBoundingClientRect 实测 .poem-text 高/宽
           - 新增 textRO ResizeObserver 单独观察每个 beat 的 .poem-text，字体加载 / 断行
             重排时主动重跑 solver（比 window.resize 更精准）
        ③ **修 P2 #3（公开页落到空白 Story 尾部）** · StoryPoemScroller：
           v1.59 之前页面只渲染 4 个 photo-poem beats，后面 globe/finale 还是源代码注释。访客
           滚过最后一个 beat 之后只能看到背景空屏。修：
           - 在 §2 末尾加 `<div class="story-end-cap">未完待续</div>`
           - cn-kaishu 霞鹜文楷 + clamp(1.25rem, 4vw, 2rem) 字号 + letter-spacing 0.4em
           - min-height 60vh 让滚动有终点感；不抢戏（opacity 0.7 sage 柔色）
           - 等 batch 4-6 接 globe/finale 时自然取代这块
        ④ **build / 线上验证**（dist 40371 → 40513 bytes，+142B end cap CSS+HTML）：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check: clean
           - pnpm build: 0 errors，solver bundle 含 textHeight × 5 处 / getBoundingClientRect × 2 处
           - dist/_astro/index.*.css: @media(min-width:720px) × 2（parallax-pair + diagonal-gaze
             layout-specific），@media(min-width:541px) layout-specific 0 处 → 解决"604px 模式
             不一致"根因
           - story-end-cap × 1 + "未完待续" 文案在 dist 与 live
           - solver bundle 含 2 个 ResizeObserver（beat 高度 + text 尺寸）
           - § 0 / § 1 无 regression：part_1 eager+high · 章节顺序 · JSON-LD startDate 同源
        ⑤ git: `11685d4` · CI run [25473530225](https://github.com/YiTiane/forever-begins/actions/runs/25473530225) success
        ⑥ **NOT in this batch**（仍留 §2 后续刀）：
           - vignette / overlap / reveal / wooden / pearl 五套 layout solver + CSS（schema 已留位）
           - 文字字符级 stagger / blur enter（Phase 5 motion polish）
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - 鼠标 / 真 inertia parallax（CSS calc scroll-progress 已能表达"远近 settle"）
        ⑦ **§2 batch 4 next**：按 market viewport 矩阵截图复审 mobile 360-414 / narrow
           tablet 601-820 / desktop 1280+ 三档前 4 beat 在 p≈0.15/0.5/0.85 + beat 交接点；
           验收标准：① 不能空屏 ② 不能只有照片无文字 ③ 不能文字/图片距离失衡 ④ 关键照片
           和诗句必须在同一导演帧。通过后 lift maxBeats 4 → 10 + 实施后 5 套 layout
           solver + CSS。
  v1.59 — §2 batch 3 收口（修 v1.58 两处 P2：constraint-based layout solver + 收紧 release zone）：
        ① **修 P2 #1（exit-fade 创造空白 frame）**：v1.58 在 .poem-stage 上加
           opacity: clamp(0, calc((1 - --p) * 10), 1) 想消除两 beat 并存的"broken transition
           frames"，但当 release zone 长达 60-140vh 时下一个 beat sticky 还未接管，整屏空白
           ~50vh+。窄屏 portrait 截图整屏空白尤其明显。v1.59 双管齐下：
           - 收紧每个 beat min-height：parallax-pair 200→150vh / diagonal-gaze 240→160vh /
             radial-mask 180→130vh / anchor-single 160→130vh；release zone 从 60-140vh
             压到 30-60vh，自然滚动跨过 < 半秒
           - 删 .poem-stage exit-fade —— release zone 已极短，让两 beat 自然重叠比强行
             fade 出空白合理
        ② **修 P2 #2（窄屏 layout 用 magic % / clamp + 媒体查询断点硬编码）**：
           market viewport 矩阵（mobile 360-414, narrow tablet 601-820, desktop 1280+）实测
           多档失败。这是产品级响应式失败，不是单 viewport 样本问题。v1.59 用 constraint-based
           solver 把"硬编码 + 媒体查询断点"全替换成"viewport × layout × photo aspectRatio"
           动态求解：

           **新增 src/lib/story/beatLayoutSolver.ts (v0.1)**：
           - 纯函数 solveBeatLayout({ vw, vh, layout, photos: [{aspectRatio, role}] })
           - 输出 Record<string, string> CSS 自定义属性（避免直接 mutate DOM，便于 worker /
             SSR / test 复用）
           - 4 套 layout 各一支函数（parallax-pair / diagonal-gaze / radial-mask / anchor-single）
           - fitAspect(maxW, maxH, ratio) 在视口约束下解 photo 最大尺寸（保 aspect 严格成立）
           - SAFE_PAD 24 / STAGE_PAD_Y 32 / MIN_GAP 24 几何常量
           - 各 layout 输出：
             * parallax-pair：--stage-cols / --text-col-w / --photos-col-w/h /
               --photo-far-w/h / --photo-near-w/h（双图绝对定位 box 大小都算出）
             * diagonal-gaze：--text-max-w / --photo-tl-w/h / --photo-br-w/h
             * radial-mask：--photo-w/h / --text-max-w / --stage-gap
             * anchor-single：--photo-w/h / --text-max-w / --stage-gap

           **PoemBeat (v0.6 → v0.7)**：
           - figure 加 data-aspect-ratio（main.json width/height 算 w/h；缺失时按 role
             fallback 0.6667 / 1.5）
           - 移除所有 magic % / clamp；改 width: var(--photo-w) / max-width: var(--text-max-w)
             / gap: var(--stage-gap) / grid-template-columns: var(--stage-cols)
           - 删 v1.58 的 .poem-stage exit-fade
           - .poem-photo picture/img 改为 width:100%/height:100%/object-fit:cover
           - .poem-beat 自带每个 var 的 CSS fallback（JS 接管前不空屏）

           **StoryPoemScroller (v0.4 → v0.5)**：
           - import { solveBeatLayout, type BeatLayout, type PhotoSpec } from
             "@/lib/story/beatLayoutSolver"
           - 新增 applyLayout(beat) 函数：读 dataset.layout + 收集 .poem-photo dataset.role/
             aspectRatio → solveBeatLayout(...) → beat.style.setProperty 写每个 var
           - init beats.forEach(applyLayout)；window.resize 重跑 solver + scheduleUpdate
           - 滚动事件不需要 solver（layout 与 progress 解耦）
        ③ **build / 线上验证**（dist 41649 → 40371 bytes，-1278B：CSS 简化 / sticky stage 收紧）：
           - pnpm exec tsc --noEmit: 0 errors
           - prettier --check: clean
           - pnpm build: 0 errors，多生成 StoryPoemScroller.astro_*_lang.*.js (4412B) 含 solver
           - 该 JS bundle 含 addEventListener("scroll") + addEventListener("resize") + 6 个
             --photo-* 变量字符串 + aspectRatio 12 处 + 4 个 solve* 分支函数
           - dist/_astro/index.*.css 含每个 layout 的 min-height (130/150/160vh)；旧
             opacity:clamp(0,calc((1 - var(--p exit-fade 0 处
           - data-aspect-ratio="0.6667" + "1.5000" 都在 dist HTML
           - § 0 / § 1 无 regression：part_1 eager+high · 章节顺序 · JSON-LD startDate 同源
        ④ git: `185bf8e` · CI run [25472930588](https://github.com/YiTiane/forever-begins/actions/runs/25472930588) success
        ⑤ **NOT in this batch**（仍留 §2 后续刀）：
           - vignette / overlap / reveal / wooden / pearl 五套 layout solver + CSS（schema 已留位）
           - 文字字符级 stagger / blur enter（Phase 5 motion polish）
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - 鼠标 / 真 inertia parallax（CSS calc scroll-progress 已能表达"远近 settle"）
        ⑥ **§2 batch 4 next**：按 market viewport 矩阵截图复审 mobile 360-414 / narrow
           tablet 601-820 / desktop 1280+ 三档前 4 beat 在 p≈0.15/0.5/0.85 + beat 交接点；
           验收标准：① 不能空屏 ② 不能只有照片无文字 ③ 不能文字/图片距离失衡 ④ 关键照片
           和诗句必须在同一导演帧。通过后 lift maxBeats 4 → 10 + 实施后 5 套 layout
           solver + CSS。
  v1.58 — §2 batch 3 收口（修 v1.57 四处 P2：tsc + tablet 断点 + transition exit-fade）：
        ① **修 P2 #1（pnpm exec tsc --noEmit fail）** · content.config.ts v0.6 → v0.7：
           v1.56 用 z.infer<typeof X> 派生 TS 类型，但 astro:content 重导出的 z 在 tsc
           解析路径下不暴露 infer namespace（TS2503 "Cannot find namespace 'z'" × 3 处）。
           改 const tuple → typeof[number] 推导：
           - PHOTO_ROLES const tuple (11 项 as const) → type PhotoRole = (typeof PHOTO_ROLES)[number]
             → photoRoleSchema = z.enum(PHOTO_ROLES)
           - 同款 PHOTO_POEM_LAYOUTS const tuple (9 项)
           - EXPECTED_BEAT_LAYOUTS / VALID_ROLES_BY_LAYOUT 引用新 type
           Schema 与 type 由同一份单一源生成，不会漂移。
        ② **修 P2 #2（VALID_ROLES_BY_LAYOUT unchecked lookup）**：
           tsconfig noUncheckedIndexedAccess 让 Record 索引返回 T | undefined（TS18048）。
           lookup 后加 if (!validRoles) return false 显式 guard（理论 unreachable，
           给未来误编辑漏写一项时拦最后一道）。
        ③ **修 P2 #3（541-719px tablet 断点缺失）** · PoemBeat v0.5 → v0.6：
           v1.57 把 parallax-pair / diagonal-gaze 的 layout CSS 用 @media (min-width: 720px)
           守门，mobile fallback 用 @media (max-width: 540px)。541-719px portrait/tablet
           视口既不进 mobile 堆叠也不进 desktop 真布局，回落通用单列 grid → photos 列
           没高度、absolute 子元素脱顶，构图碎掉。改：desktop 守门下沉到 (min-width: 541px)，
           无中间 gap：≤ 540 mobile 单列；≥ 541 layout-aware desktop。
        ④ **修 P2 #4（beat 跨转 broken transition frames）** · .poem-stage：
           sticky beat 在 --p 越过 0.9 后即将释放钉位；释放完到下一 beat sticky 接管之间，
           视口同时显示半截上下两段，破坏导演帧。加 stage exit-fade：
             opacity: clamp(0, calc((1 - var(--p, 0)) * 10), 1)
             will-change: opacity
           公式在 --p 0..0.9 一直 ≥ 1（clamp 保持 1 满帧可见），0.9..1 内线性降到 0。
           sticky 释放那一刻本帧已隐形，下一 beat 以"干净视口"接管。GPU 合成不触发 paint。
        ⑤ **build / 线上验证**（dist 41649 bytes 不变 —— CSS 增删抵消）：
           - pnpm exec tsc --noEmit: 0 errors（v1.57 之前 4 errors）
           - prettier --check: clean
           - pnpm build: 0 errors
           - 外部 CSS：opacity:clamp(0,calc((1 - var(--p, 0)) * 10), 1) 命中 .poem-stage
           - @media(min-width:541px) × 2（parallax-pair + diagonal-gaze）
           - @media(min-width:720px) 0 处（旧守门已替换）
           - data-layout 4 个值各 1 处 / data-role 6 个值
           - § 0 / § 1 无 regression：part_1 eager+high · 章节顺序 · JSON-LD startDate 同源
        ⑥ git: `f4ea9b4` · CI run [25472011320](https://github.com/YiTiane/forever-begins/actions/runs/25472011320) success
        ⑦ **NOT in this batch**（仍留 §2 后续刀）：
           - vignette / overlap / reveal / wooden / pearl 五套 layout stage CSS
             （schema 已留位，等 batch 4 lift maxBeats 时一并）
           - 文字字符级 stagger / blur enter（Phase 5 motion polish）
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - 鼠标 / 真 inertia parallax（CSS calc scroll-progress 已能表达"远近 settle"）
        ⑧ **§2 batch 4 next**：再经用户截图审计 v1.58（重点：① 三档视口宽 wide / 669px
           中宽竖版 / 手机窄版 都能合人完整帧；② beat 跨转无 broken frame；③ tsc clean）；
           通过后 lift maxBeats 4 → 10 + 实施后 5 套 layout stage CSS
  v1.57 — §2 batch 3 收口（修 v1.56 三处审计 · 复合帧重构 + 0 idle CPU + 头注释）：
        ① **修 P2 #1（sticky stage 仍产生 broken visual frames）** · PoemBeat v0.4 → v0.5：
           v0.4 用 grid-template-rows: 1fr auto + align-self start/end，把 text 跟 photo
           拆到 100vh 两端，stage 顶部 / 中间出现大片空白 — text 与 photo 不在同一画面里；
           diagonal-gaze / parallax-pair 又把 opacity 绑到 --p-text / --p-photo-1/2，
           中段进度时只看到照片在场、文字 opacity 还是 0 的"残缺帧"。
           v0.5 关键原则改为：
           - 文字 / 照片 baseline opacity:1 —— **始终可见**，不再 gate 在 progress 后段
           - 各 layout 用 flex column / grid align-content: center 把 text + photos
             紧凑居中堆叠，不让任何一方靠到 100vh 边缘
           - parallax-pair 把 photos 列卡死 min(70vh, 540px)；text 列 align-self: center
           - 入场感由 transform / scale / mask 等"位置 / 形态"层小幅 settle 表达
           4 套 layout 重写：
           - **parallax-pair**: 2-col grid [text 40vw center | photos 70vh center]；
             far translateY -14→0% scale 0.96→1；near translateY +14→0% scale 0.96→1；
             text translateX -8→0px；photos / text 始终 opacity 1
           - **diagonal-gaze**: grid 单 cell stack；text 中央 backdrop-blur(8px) 半透明
             纸白底 + translateY 6→0px；top-left / bottom-right photos 始终 opacity 1，
             translate ±15% → 0；不再 stage stagger
           - **radial-mask**: flex column center gap 2rem；photo + text 紧凑居中堆叠；
             photo opacity 1，mask + scale + saturate scroll-driven；text translateY 6→0px
           - **anchor-single**: flex column center gap 1.75rem；photo + text 紧凑居中堆叠；
             opacity 始终 1；scale 0.94→1 + 微 translateY settle
        ② **修 P2 #2（rAF 常驻空跑）** · StoryPoemScroller v0.3 → v0.4：
           v0.3 inView 时每帧 requestAnimationFrame(tick) 无条件再调度，访客在 stage 上
           停下来读时 rAF 仍 60Hz 空跑、与 §0 Parallax / §1 Countdown 的"idle 0 CPU"承诺
           不一致。改 scroll / resize 事件驱动：
           - 单帧 dirty flag rafScheduled coalesce 多次事件为一次 rAF flush
           - flushUpdate() 只对 inViewBeats 中的 beat 写 CSS 变量
           - flush 完帧 dirty=false；无新事件就不再 schedule → 滚动停 0 rAF / 0 CPU
           - 配 ResizeObserver 监 .poem-beat 自身高度变化（图片懒加载 / 字体回流兜底）
           - prefers-reduced-motion → 不绑事件、不跑 rAF，写 --p:1 终态后即返回
           - debug hook 升级 __storyPoem.active() 看当前 inView beats
        ③ **修 P3（StoryPoemScroller 头注释 stale）** · v0.2 → v0.4：
           v0.2 注释还在描述 v1.54 "一次性 IO + .visible + unobserve" 行为，与 v1.56
           起的 sticky stage + scroll-progress driven choreography 已脱节。重写头注释：
           rAF flush / phase 变量 / IO + scroll + RO 三条触发路径 / debug hook。
        ④ **build / 线上验证**（dist 41756 → 41649 bytes，-107B：CSS 简化 + stagger 删
           多余字符）：
           - dist HTML：4 个 .poem-stage / data-layout 4 个值 / data-role 6 个值
           - JS bundle：addEventListener("scroll") + addEventListener("resize")
             + new ResizeObserver + new IntersectionObserver 全在；recursive
             requestAnimationFrame(()=>tick) 0 处
           - 外部 CSS：opacity:1 baseline 命中 parallax-pair text/photo 三处；
             flex-direction:column 在 radial-mask + anchor-single 命中
           - § 0 / § 1 无 regression：part_1 eager+high · countdown · cn-hei · JSON-LD
             startDate 同源 · 6 script tags 不变
        ⑤ git: `83f393b` · CI run [25451393334](https://github.com/YiTiane/forever-begins/actions/runs/25451393334) success
        ⑥ **NOT in this batch**（仍留 §2 后续刀）：
           - vignette / overlap / reveal / wooden / pearl 五套 layout stage CSS
             （schema 已留位，等 batch 4 lift maxBeats 时一并）
           - 文字字符级 stagger / blur enter（Phase 5 motion polish）
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - 鼠标 / 真 inertia parallax（CSS calc scroll-progress 已能表达"远近 settle"）
        ⑦ **§2 batch 4 next**：先经用户截图审计 v1.57 复合帧；通过后 lift maxBeats
           4 → 10 + 实施后 5 套 layout (vignette/overlap/reveal/wooden/pearl) stage CSS
  v1.56 — §2 batch 3（cinematic stage + scroll-progress choreography · 修 v1.55 三处 P2）：
        ① **修 P2 #1（diagonal-gaze 不是稳定的 story frame · 普通滚动会切碎构图）**：
           v1.55 之前每个 beat 是 110-120vh 普通流式 section，访客很容易停在"只看到照片
           层、文字滚出视口"的不完整帧；diagonal-gaze 的"左上 + 右下 + 文字居中"合像
           无法在单视口内成立。改为 cinematic stage 架构：
           - 外层 `.poem-beat` 是 scroll spacer（200/240/180/160vh 按 layout 配）
           - 内层 `.poem-stage` 是 `position: sticky; top: 0; height: 100vh` 舞台
           - 用户滚到 beat 顶时舞台被钉住，整个 100vh 视口都给本 beat 用，
             整段 stage 滚完才解钉 → 单视口 always 能看到完整 composed 帧
           - 移动端 (<540px) 全 layout 退化为单列流式堆叠（取消 sticky / absolute）
        ② **修 P2 #2（动画仍是 one-shot reveal，不是 scroll-driven choreography）** ·
           StoryPoemScroller v0.x setup script 重写：
           - 单 IO 对所有 beat 报告进/出视口；进视口启动 rAF
           - rAF 每帧读 getBoundingClientRect 算 scroll progress p ∈ [0,1]，写 4 个
             CSS 变量到 beat 元素：`--p` / `--p-photo-1` / `--p-photo-2` / `--p-text`
             （三个分阶段变量分别映射到 0-0.35 / 0.35-0.7 / 0.55-0.9 段，phase-1
             收完才到 phase-2 这种）
           - PoemBeat 4 套 layout CSS 全用 `calc(var(--p))` 表达 transform / mask-radius /
             opacity / filter，**没有 transition**；每帧 rAF 重写 → calc 即时反映 → 真正的
             scroll-driven choreography
           - 离视口 → cancelAnimationFrame，inView=false → 0 CPU
           - prefers-reduced-motion → 不跑 rAF，写 --p:1 直接终态 composed 帧
           - debug hook 升级 `__storyPoem.progress()` 看每个 beat 当前 4 个变量值
           导演表（DESIGN §2.A 行 770-783）：
           - **parallax-pair (beat 01)**：text 左 / 双图右上下错位；far translateY -22→0%
             + scale 0.94→1；near translateY +22→0% + scale 0.94→1；text opacity --p-text
           - **diagonal-gaze (beat 02)**：grid 单 cell stack；3 阶段：top-left 滑入
             (--p-photo-1) → bottom-right 滑入 (--p-photo-2) → text 浮起 (--p-text)；
             文字 rgba(245,240,230,0.55) + backdrop-filter blur(8px)
           - **radial-mask (beat 03)**：mask radial-gradient inner 30→55% / outer 60→95%
             同步扩散；scale 1.08→1；saturate 0.85→1；text 后 fade in
           - **anchor-single (beat 04/05)**：图 scale 0.92→1 + opacity 0→1（--p×2 软上限）；
             text 后 fade in
        ③ **修 P2 #3（role 未 schema 验证）** · `src/content.config.ts` v0.5 → v0.6：
           v0.5 起 role 已是决定 photo 视觉位置的关键字段（[data-role="far"] 等驱动绝对
           定位），但 schema 仍是 `z.string().optional()` —— typo "topLeft" / "bottomright" /
           "nearer" 都会通过、CSS 不匹配、photo 落到默认流式位置 → 视觉静默碎掉。改：
           - 新增 `photoRoleSchema` z.enum 11 项（4 个 batch 3 实施 + 7 个 batch 4 留位）
           - `storyPoemPhoto.role` 必填 enum（不再 optional）
           - 新增 `VALID_ROLES_BY_LAYOUT` Record map（每 layout → 合法 role 数组）
           - beats array 第 4 条 `.refine()`：role 必须属于 layout 的 VALID_ROLES_BY_LAYOUT
             typo 在 build 时被 zod 拦下
        ④ **build / 线上验证**（dist 40461 → 41756 bytes，+1295B：4 sticky stage 包裹 +
           role enum + 第 4 条 refine 字符）：
           - dist HTML：4 处 `.poem-stage`，data-layout 4 个值各 1 处，data-role 6 个值
           - JS bundle 含 `--p` / `--p-photo-1` / `--p-photo-2` / `--p-text` 四个变量名
           - 外部 CSS dist/_astro/index.*.css 含 `position:sticky` + `mask-image` +
             `radial-gradient` + 4 个 `[data-layout=...]` selector + 6 个 `[data-role=...]` selector
           - 章节顺序 cover → invitation → story-poem 严格不变
           - § 0 / § 1 无 regression：part_1 eager+high · countdown · cn-hei 5 处 ·
             JSON-LD startDate 同源 · 6 script tags 不变
        ⑤ git: `b3f0bd4` · CI run [25450270793](https://github.com/YiTiane/forever-begins/actions/runs/25450270793) success
        ⑥ **NOT in this batch**（明确留 §2 后续刀）：
           - vignette / overlap / reveal / wooden / pearl 五套 layout 的 stage CSS
             （schema 已留位，等 batch 4 lift maxBeats 时一并；EXPECTED_BEAT_LAYOUTS +
             VALID_ROLES_BY_LAYOUT 已把契约写在 schema）
           - 文字字符级 stagger / blur enter（Phase 5 motion polish）
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - beat 09 缝线 SVG path / beat 10 珍珠高光闪动（motion polish 刀）
           - 鼠标 / 真 inertia parallax（CSS calc 的 scroll-progress 已能表达"远近 settle"语义）
        ⑦ **§2 batch 4 next**：先等用户对 v1.56 的截图审计；通过后 lift maxBeats 4 → 10
           + 实施后 5 套 layout stage CSS（vignette / overlap / reveal / wooden / pearl）
  v1.55 — §2 batch 2（role-driven layout 真正落地，4 套空间叙事 + per-photo stagger）：
        ① **修 v1.54 审计 P2 #1（动画只是 generic fade-in）+ P2 #2（role-specific layouts 没实施）**：
           v1.54 之前组件只有"通用单/双列 grid + section 级 fade-in"，把 DESIGN §2.A
           行 770-783 表的"远近 parallax / 对视斜线 / 柔焦晕散 / 锚点定格"等空间叙事契约**全部丢了**。
           双图、单图都是同一个矩形格栅，photo role 字段被忽略，beat 02 应该形成的"对视斜线"
           实际上是"右列上下两张差不多的小图"。这是数据 + 通用 fade-in scaffold，不是长卷。
        ② **Schema 扩展** · `src/content.config.ts` v0.4 → v0.5：
           - 新增 `photoPoemLayout` enum 9 项：parallax-pair / diagonal-gaze / radial-mask /
             anchor-single（这 4 套 batch 2 实施 CSS）+ vignette / overlap / reveal / wooden /
             pearl（schema 已留位，CSS 等 batch 3 lift maxBeats 时一并）
           - 新增 `EXPECTED_BEAT_LAYOUTS` const 12 项（11/12 为 null 表示 globe/finale 不写 layout）
           - `beats` array 第 3 条 `.refine()`：layout 必须严格匹配 EXPECTED_BEAT_LAYOUTS
             （photo-poem 必有 layout、globe/finale 必无 layout）；编辑 main.json 时 zod 拦在 build 前
        ③ **数据扩展** · `src/content/story-poem/main.json`：每个 photo-poem beat 加 `layout` 字段
        ④ **PoemBeat 重写** · `src/components/story/PoemBeat.astro` v0.2 → v0.3：
           - BeatLayout TS type + `Props.layout` + `data-layout` 反射到 `<section class="poem-beat">`
           - **parallax-pair**（beat 01）：两图绝对定位，far 上右 56% saturate(0.92)、near 下左 64% z:1；
             入场 far 从 -22px 收正 + near 从 +22px 收正，"记忆被慢慢推近"
           - **diagonal-gaze**（beat 02）：grid 单 cell stack 文字 + 照片层；top-left/bottom-right
             绝对定位形成对角；文字 grid-area 1/1 居中 + rgba(245,240,230,0.55) 半透明纸白底
             + backdrop-filter blur(8px) z:2 浮起；左上→右下 stagger 入场构成对视轴
           - **radial-mask**（beat 03）：figure 自身叠 `mask-image: radial-gradient(ellipse, black 55%, transparent 96%)`
             让边缘从中心向外淡出；入场 scale 1.06 → 1.0 + saturate 0.88 → 1，"心底晕散"
           - **anchor-single**（beat 04 / 也用于 beat 05）：单图 max 480px 居中；入场 scale 0.95
             + translateY 8px → settle，像"日期前的视觉锚点"
           - per-photo stagger：CSS-only via `:nth-child + transition-delay` (220ms / 440ms)；
             各 layout 在此基础上 override transform 给具体的"位移路径"
           - prefers-reduced-motion：所有 layout 退化为 opacity:1 + transform:none + filter:none + 零 transition
           - 移动端 (<540px)：所有 layout 退化为单列流式堆叠（取消绝对定位），保证窄屏可读
        ⑤ **StoryPoemScroller** · 向下传 `layout` prop（schema 已强约束 photo-poem 必有 layout）
        ⑥ **build / 线上验证**（dist 40351 → 40461 bytes，+110B 是 data-layout 属性 + JSON layout 字段）：
           - data-layout 4 个值各 1 处（anchor-single / diagonal-gaze / parallax-pair / radial-mask）
           - data-role 6 个值（anchor / bottom-right / center / far / near / top-left）
           - 外部 CSS dist/_astro/index.*.css 含 4 个 [data-layout=...] selector + 6 个
             [data-role=...] selector + radial-gradient + mask-image + backdrop-filter +
             prefers-reduced-motion
           - 章节顺序 cover → invitation → story-poem 严格不变
           - § 0 / § 1 无 regression：part_1 eager+high · countdown arrived flag · cn-hei 5 处
           - 6 script tags 不变；__storyPoem debug hook 仍 ship · JSON-LD startDate 仍同源
        ⑦ git: `35a22ce` · CI run [25448893740](https://github.com/YiTiane/forever-begins/actions/runs/25448893740) success
        ⑧ **NOT in this batch**（明确留 §2 后续刀）：
           - vignette / overlap / reveal / wooden / pearl 五套 layout CSS（schema 已留位，
             batch 3 lift maxBeats 4→10 时一并实施 + 渲染 beat 05-10）
           - 文字字符级 stagger / blur enter（Phase 5 motion polish）
           - beat 05 [N] 天 daysTogether CountUp（DESIGN §2.D · 留独立小刀）
           - beat 09 缝线 SVG path / beat 10 珍珠高光闪动（motion polish）
           - 鼠标 / 滚动 driven 真实 parallax（CSS 静态错位已能传达"远近"语义；motion polish 再加）
        ⑨ **§2 batch 3 next**：lift maxBeats 4 → 10 + 实施后 5 套 layout CSS。
           前 4 个 beat 已是上线品质后再批量铺 6 个，避免重复审计修补成本。
  v1.54 — §2 batch 1 v1.53 审计修（2 P2 + 3 P3）：
        ① **修 P2 #1（globe/finale 占位文本泄漏到公开页）**：v1.53 渲染
           `<p>§2.B · globe · beat 11 · 后续 batch 实装</p>` 留在公开页面；
           aria-hidden 只对 AT 隐藏，对所有视觉访客（包括婚礼宾客）仍显形 ——
           工程标记不该出现在婚礼站。
           - 修法（StoryPoemScroller v0.1 → v0.2）：beats 11/12 数据保留在
             main.json（schema 已严约束 11=globe / 12=finale），但**不渲染任何 DOM**。
             挂点定位从"渲染极淡灰小字"改为"读源码注释 + JSON beat ids"。
             组件内只留两条 JSX 注释标 batch 3/4 接入位置。附带删 .deferred-*
             dead CSS。
           - 验证：dist 含 0 处 'deferred-' / 0 处 'data-kind="globe"|"finale"' /
             0 处 '后续 batch 实装' 文本；只剩 4 个 data-beat-id (01..04) 的 PoemBeat
        ② **修 P2 #2（双图布局 selector 永远不匹配）**：v1.53 把
           `data-photo-count` 挂在 `<section class="poem-beat">` 上，但 CSS 选择器
           写的是 `.poem-photos[data-photo-count="2"]` —— 永远匹配不上。结果
           beat 01 (Snow_03/07 远近双图) / beat 02 (Snow_14/15 对视斜线) 的
           "双图错位双列"视觉契约从未生效，全部渲染成单列堆叠（DESIGN §2.A 行 772-773）。
           - 修法（PoemBeat v0.1 → v0.2）：data-photo-count 挂在 `.poem-photos`
             本身（语义也更对位）；同步删 .poem-beat 上多余的同名属性避免误导
           - 验证：dist 含 `class="poem-photos" data-photo-count="2"` 2 处（beat 01/02），
             data-photo-count="1" 2 处（beat 03/04）；线上 grep 确认双列 selector 匹配
        ③ **修 P3 #1（schema 不强制 12-beat 契约）**：v1.53 schema 只 `.min(1)`，
           丢失 / 重复 / 错序 / 错 kind 都过 zod。
           - 修法（content.config.ts v0.3 → v0.4）：beats 改 `.length(12)` +
             两条 `.refine()`：(a) id 必须依次 '01'..'12'；(b) kind 必须严格匹配
             EXPECTED_BEAT_KINDS 数组（01-10 photo-poem · 11 globe · 12 finale）
           - EXPECTED_BEAT_KINDS const tuple 让未来 batch 3/4 接入时也能从 schema
             读到清晰契约，不必另查 DESIGN
        ④ **修 P3 #2（content.config 头注释 stale）**：v1.53 仍写"五个 collection"，
           且只列 meta/story/journey/cats/series；v1.53 已添 storyPoem 现共六个。
           - 修法：注释加 v0.4 段说明 storyPoem 加入动机；collection 列表改"六个"且
             storyPoem 加在 story 之后（按数据关系而非字母序）；
             "共享 stemSchema (cats / series)" 扩到"cats / series / storyPoem 三处共用"
        ⑤ **修 P3 #3（Prettier 不干净）**：v1.53 提交时 StoryPoemScroller 残留
           prettier 局部排版差；本次 prettier --write 跑过 PoemBeat + StoryPoemScroller
           后 --check 全 clean
        ⑥ **build / 线上验证**（dist 40859 → 40351 bytes，删 deferred 占位 ~500B；
           schema refine 不进 dist）：
           - 章节顺序 cover → invitation → story-poem 严格不变
           - Snow_{03,05,07,11,14,15}-1600.jpg 全部仍在线
           - §0 / §1 无 regression（part_1 eager+high · countdown arrived flag · cn-sans 0 / cn-hei 5）
           - JSON-LD eventSchema startDate 仍同源
           - 6 script tags 不变；__storyPoem debug hook 仍 ship
        ⑦ git: `aad46c7` · CI run [25448076166](https://github.com/YiTiane/forever-begins/actions/runs/25448076166) success
        ⑧ **§2 batch 1 此后真正收口**（v1.53 是骨架交付，但视觉占位泄漏 + 双图布局漏触
           + schema 弱约束让 §2 还没"上线品质"。v1.54 之后 §2 batch 1 ✓ 真完成，可以
           安心进 batch 2 → lift maxBeats 4 → 10 渲染后 6 个 photo-poem beat 05-10）。
  v1.53 — Phase 2 §2 batch 1（StoryPoemScroller 长卷骨架 + 前 4 photo-poem beat）：
        ① 新增 collection · src/content.config.ts：`storyPoem`
           - loader glob `*.json` from `src/content/story-poem`
           - schema：`{ anchor_date, beats: storyPoemBeat[] }`；beat 含
             `{ id: '01..12', kind: 'photo-poem'|'globe'|'finale', lines: string[],
                photos: storyPoemPhoto[] (default []), note?: string }`
           - storyPoemPhoto：复用 `stemSchema` + `cdnTarget` enum（与 series 同款 7 仓
             命名收敛 · DESIGN §3.2）+ alt + role? + width/height? CLS 几何预留
           - 不与 `story` (anchor.json) 合并：两边数据形状完全不同，分两个 collection 干净
        ② 新增数据 · src/content/story-poem/main.json（12 beats 全量）：
           - 文案 / 图片绑定 100% 严格按 DESIGN §2.A 行 770–783 表
           - photos 用规范 stem（DESIGN §3.2）：
             · 01: snow-a/Snow_03 + Snow_07 · 02: snow-b/Snow_14 + Snow_15
             · 03: snow-a/Snow_05 · 04: snow-b/Snow_11
             · 05–10: 后 6 photo-poem 完整数据（batch 1 不渲染，等 batch 2 lift maxBeats）
             · 11: kind=globe 占位 · 12: kind=finale 占位
           - 每张 photo width/height（CLS 预留）：3:2 横用 3000×2000 / 2:3 竖用 2000×3000
             （batch 1 合理默认；后续可按真源图调整）
        ③ 新增组件 · src/components/story/PoemBeat.astro v0.1（单 beat 渲染）：
           - `<section class="poem-beat" min-height: 120vh>`（DESIGN §2.A 行 763 滚动节奏）
           - CSS Grid：桌面 [text min(620px,42vw) | photos 1fr] / 移动单列堆叠
           - 文字 `.cn-song` 思源宋体逐行 `<p>`；颜色 `--c-olive-ink`；行高 1.95
           - 照片 CdnImage v0.3 widths=[320,640,1024,1600,2400] sizes (38vw|60vw|90vw)
             width/height 直传 CLS；snow / wooden-door / pearl 实测派生品宽度齐
           - IO fade-in：opacity 0→1 + translateY 12px→0 transition 700ms
           - prefers-reduced-motion：直接 visible（无 transition / 无 translate）
           - a11y：`aria-labelledby` 指向不可见 `.sr-only h3`「第 NN 段 · {首行}」
           - data-photo-count="2" → grid-template-columns: repeat(2, 1fr)（双图错位）
        ④ 新增组件 · src/components/story/StoryPoemScroller.astro v0.1（长卷包裹器）：
           - `<section class="story-poem">` stacking 隔离（position:relative + isolation:isolate）
           - h2 "Our Story" latin-italic（与 §1 'Invitation' 同档）
           - getCollection('storyPoem') → main.json → filter `kind === 'photo-poem'`
             .slice(0, maxBeats=4)；不传 firstAboveFold（§2 都在 ≥ 2 屏之下，全 lazy）
           - 单一 IntersectionObserver 观察所有 `.poem-beat`，rootMargin "-15%"
             进 ~85vh 才触发，一次性 unobserve；reduced-motion 跳 IO 直接全 visible
           - deferred-beats 占位区：globe + finale 用极淡灰小标记标后续 batch 挂点
           - 调试钩子 `window.__storyPoem.list()` 看哪些 beat 已 visible
        ⑤ 集成 · src/pages/index.astro v0.4 → v0.5：
           - import + 渲染 `<StoryPoemScroller />` 在 `<Cover />` + `<Invitation />` 之后
           - 头注释加 v0.5 段 + §2 各刀进度（batch 1 ✓ / batch 2-4 ⏳）
        ⑥ **build / 线上验证**（dist/index.html 23277 → 40859 bytes，+17.5KB §2 资产 srcset+CSS）：
           - section 顺序：cover → invitation → story-poem 严格按 DESIGN §3.1
           - data-beat-id 6 处：01 / 02 / 03 / 04 (photo-poem) + 11 / 12 (deferred)
           - data-kind="globe" 1 / data-kind="finale" 1（占位标记给后续 batch）
           - Snow_{03,05,07,11,14,15}-1600.jpg 全部上线（5 widths × 3 formats AVIF/WebP/JPG）
           - 全部 §2 图 `loading="lazy" fetchpriority="auto"`（不抢 §0 part_1 的 eager）
           - 全部 §2 图 `width/height` 落地（CLS 几何预留 3000×2000 / 2000×3000）
           - 6 script tags：CdnEarlyProbe + JSON-LD + 4 module（MimosaPetals + InvitationParallax + Countdown + StoryPoem）
           - §0 / §1 无 regression（part_1-800.jpg eager+high · countdown arrived flag · 这一天已经到了 单句体 · cn-hei 5 处仍在）
           - `__storyPoem` 调试钩子 ship；`countdown-arrived` flag 仍在
        ⑦ git: `4f44e21` · CI run [25446934872](https://github.com/YiTiane/forever-begins/actions/runs/25446934872) success
        ⑧ **NOT in batch 1**（明确留 §2 后续刀，避免一刀混太多）：
           - globe (beat 11 · DESIGN §2.B): 等 R3F + Three.js + 水彩贴图地球（独立刀）
           - finale (beat 12 · DESIGN §2.C): 等 StarCarouselFinale Shader Dissolve（独立刀）
           - 后 6 photo-poem beat (05–10): 等 batch 2 视觉收口前 4 后再 lift maxBeats
           - beat 05 [N] 天 daysTogether CountUp (DESIGN §2.D): 留独立小刀
           - 多张照片 layer/parallax / radial mask / 缝线 SVG / 珍珠高光 / 文字 stagger / blur enter（Phase 5 motion polish）
        ⑨ 数据接缝（DESIGN §15.1 · 一份真值原则）：
           - story-poem.anchor_date "2019-01-27" 与 src/content/story/anchor.json date 同源
           - anchor_date 字段当前未消费（beat 05 daysTogether 是它的下游，留独立小刀）
  v1.52 — Countdown v0.2 → v0.3 · 修 v1.51 审计 P3（arrived 后多调一次 setInterval）：
        ① **修 P3（arrived 终态生命周期 0 CPU 承诺漏掉一秒）**：v0.2 在
           「页面进入视口时已经过期」场景：IO 进入视口 → start() → tick() →
           showArrived()。此时 intervalId 仍是 0，showArrived 内的
           clearInterval 分支跳过；start() 接着仍执行 `setInterval(tick,1000)`
           — 多调度一次，下一秒 tick() 才把它清掉。视觉看不到，但与 v0.2 注释承诺
           "arrived 后立刻清 interval / 0 CPU"不符。
        ② **修法 v0.3**（在 setInterval 调度路径加 arrived 守卫）：
           - 新增模块级 `arrived` 标志（初始 false），showArrived() 一进来就 arrived=true
           - start() 在调用 tick() **前后**都检查 arrived（前：上次 IO 抖动后早返回；
             后：tick() 内部刚把 arrived 置为 true 时不再 schedule）
           - evaluate() 也守一道：arrived 后任何 IntersectionObserver / visibilitychange
             变化都直接 stop()+return，不会再进入 start()
           - 因为局部变量 `arrived` 与 v0.2 创建的 span 同名冲突，把 span 重命名为
             `arrived_span` 让 TS 静态域分明（minified 后无影响）
        ③ **build / 线上验证**：
           - dist/index.html minified bundle 含 `i=!1` 模块级 flag、showArrived `i=!0`、
             start `function M(){i||n||(x(),!i&&(n=window.setInterval(x,1e3)))}`、
             evaluate `function S(){if(i){C();return}m&&y?M():C()}` 三层守卫齐
           - 不影响其他链路：IO / visibilitychange / __countdown debug hook /
             replaceChildren arrived 渲染 / sr-status 低频更新 全部 unchanged
           - 5 script tags 不变；§0 / §1 无 regression
        ④ git: `32ed58e` · CI run [25446107033](https://github.com/YiTiane/forever-begins/actions/runs/25446107033) success
        ⑤ **§1 a11y / 终态生命周期** 此后可视为完全收口（v1.51 修了 P2/P2/P3 文本与命名，
           v1.52 修了"0 CPU 承诺"边角）。下一步 Phase 2 §2 Story 长卷。
  v1.51 — Countdown v0.1 → v0.2 · 修 v1.50 审计 2 P2 + 1 P3：
        ① **修 P2 #1（a11y 每秒重读整段）**：v0.1 在根 .countdown 上写
           `aria-live="polite" aria-atomic="true"`，但每秒 1 次 textContent 写入会
           被 AT 当成"内容变化"广播为整段重读 → 屏幕阅读器永远在朗读"距离婚礼还有
           41 天 02 时 17 分 33 秒…"，形同打断；用户 navigate 到附近时尤其难用。
           - 修法 v0.2：可见 UI 整体包进 `<span class="visible-shell" aria-hidden="true">`
             → AT 跳过每秒滴答；同位新增 `<span class="countdown__sr-status sr-only"
             aria-live="polite" aria-atomic="true">`，在 tick() 里只在 **天 / 时**
             跨级时改写一次（≈ 每小时 ≤ 1 次）"距离婚礼还有 N 天 H 小时"
           - sr-status 同时是这个 paragraph 的可访问名：用户主动 Tab 到此段时也读到
             低频版的友好短句（视觉每秒滴答仍在但不再打断）
        ② **修 P2 #2（arrived 状态病句）**：v0.1 到点后只把 `.digits` 替换为
           "这一天已经到了"，前缀 `.prefix`「距离婚礼还有」仍在 DOM → 朗读 / 静态阅读
           都拼成"距离婚礼还有 这一天已经到了"，与 v0.1 注释承诺"组件只显示『这一天
           已经到了』"也矛盾。
           - 修法 v0.2：showArrived() 用 `visibleShell.replaceChildren()` 一次性清掉
             全部子节点；新建一个 `<span class="arrived cn-kaishu">这一天已经到了</span>`
             append 进 visible-shell；同时把 sr-status 设为"婚礼这一天已经到了"，
             触发 AT 一次完整朗读后停 interval（不再每秒空转）
        ③ **修 P3（cn-sans 未定义）**：v0.1 中文前缀 / 单位用 `class="cn-sans"`，
           但 global.css / DESIGN §2.3.8 实际只导出 `.cn-hei`（mapping →
           `--font-cn-sans` Noto Sans SC token），没有 `.cn-sans` 规则；这些 span
           会回退到 body 默认字体。
           - 修法 v0.2：把全部 `cn-sans` 改成 `cn-hei`（5 处：1 prefix + 4 unit）
           - 不新增 `.cn-sans` alias，保持 helper 命名单一源（`.cn-hei` 是 PLAN /
             DESIGN 已收口的"UI / 数字黑体"语义入口）
        ④ **build / 线上验证**：
           - dist/index.html: cn-sans 0 处 / cn-hei 5 处 / aria-live="polite" 1 处
             （仅 sr-status）/ aria-atomic 1 处 / `class="visible-shell"
             aria-hidden="true"` 1 处 / countdown__sr-status 1 处
           - JS bundle 含 `replaceChildren` 1 处 + `这一天已经到了` 1 处 +
             `(i!==y||s!==g)` 跨级条件 + `r.textContent=` 含天/时 sr-status 写入路径
           - 5 script tags 不变（CdnEarlyProbe + JSON-LD + 3 module · MimosaPetals
             / InvitationParallax / Countdown）
           - §0 Cover 无 regression：part_1 [320,640,800] · `width="800" height="1200"
             loading="eager" fetchpriority="high"` 全 unchanged
           - JSON-LD eventSchema startDate `"2026-06-14T19:00:00+08:00"` 与 Countdown
             data-target 同源
        ⑤ git: `d7b9d27` · CI run [25444483594](https://github.com/YiTiane/forever-begins/actions/runs/25444483594) success
        ⑥ **§1 第一刀此后真正收口**：v1.50 是结构 / 数据流交付，但 a11y 噪声 + 病句
           + helper 命名漂移让 §1 还没"上线品质"。v1.51 之后才是真正的"§1 骨架 ✓ done"，
           可以安心进 Phase 2 §2 Story 长卷。
        ⑦ **本批次 NOT in scope**（继续留 §1 后续刀）：
           - mask reveal · 字符级 stagger（DESIGN §4 §1 / line 1001 · Phase 5 motion polish）
           - 火漆封印 motif（DESIGN line 342 · 后续 motif 增强刀）
           - 诗句桌面竖排 writing-mode: vertical-rl（DESIGN §2.3.6 G optional）
  v1.50 — Phase 2 §1 第一刀（Invitation 章节：part_2 + 诗句 + 倒计时）：
        ① 新增 `src/components/invitation/Countdown.astro` v0.1：
           - `<p class="countdown" data-target="2026-06-14T19:00:00+08:00" aria-live="polite" aria-atomic="true">`
           - 数字 spans `.d / .h / .m / .s` 用 `.latin-mono` helper（DESIGN §2.3.8 / global.css · font-feature-settings: "tnum" + tabular-nums lining-nums）→ 更新时数字宽度不抖
           - 中文 prefix / 单位用 `.cn-sans` helper
           - **按需运行**：IntersectionObserver 监听 `.countdown` 进/出视口；setInterval 仅在视口内 + tab 可见时跑；离开任一条件 clearInterval（与 v1.47 InvitationParallax idle rAF 设计同源）
           - **婚礼当天/已过优雅降级**：替换 .digits 为「这一天已经到了」+ 切到 cn-kaishu，同时清 interval
           - 调试钩子 `window.__countdown?.value()` 看剩余 ms
        ② 新增 `src/components/Invitation.astro` v0.1：
           - `<section class="invitation" aria-labelledby="invitation-heading">` 独立 stacking context（position: relative; isolation: isolate · 与 §0 Cover 不耦合）
           - h2 章节标题 "Invitation"（latin-italic）+ part_2 悬浮纸卡（CdnImage cdnTarget="misc" stem="invitation/part_2" widths={[320,640,800]} width={800} height={1200} priority="auto" loading lazy）
           - blockquote 诗句两行（"我们无法判断一个瞬间的价值，/ 直至它变成回忆。"）用 .cn-kaishu 霞鹜文楷
           - `<Countdown targetDate={wedding.data.date} />` 数据来自 `getCollection('meta')` 的 wedding.json，与 Base.astro JSON-LD eventSchema.startDate 一份真值
        ③ `src/pages/index.astro` v0.3 → v0.4：
           - import + 渲染 `<Invitation />` 在 `<Cover />` 之后
           - 头注释扩到含 §0–§6 站点地图（DESIGN §3.1）
        ④ **本批次 NOT in scope**（明确留 §1 后续刀，避免混批失焦）：
           - Mask reveal · 字符级 stagger 入场动效（DESIGN §4 §1 / line 1001 · Phase 5 motion polish）
           - 火漆封印 motif（DESIGN line 342：§1 自绘绿色 SVG · 后续 motif 增强刀）
           - 诗句桌面竖排 writing-mode: vertical-rl（DESIGN §2.3.6 G optional · 大屏专属）
        ⑤ **build / 线上验证**：
           - dist/index.html 含 `<section class="invitation">` + countdown + part_2 srcset [320,640,800] + `<img width="800" height="1200" loading="lazy">`
           - **5 script tags**（dev build）：CdnEarlyProbe IIFE / JSON-LD / 3 module（MimosaPetals / InvitationParallax / Countdown）；prod build Astro 合并到 1 module（线上 grep type="module" = 1）
           - 线上 https://yitiane.github.io/forever-begins/ HTTP 200 · 26527 bytes（v1.49 20761 → v1.50 +5.7 KB §1 章节）
           - §0 Cover **无 regression**：part_1 [320,640,800] · `width="800" height="1200" loading="eager" fetchpriority="high"` 全 unchanged
           - JSON-LD eventSchema 单一份，与 Countdown targetDate 同源
        ⑥ git: `f3d8e9b` · CI run [25443677902](https://github.com/YiTiane/forever-begins/actions/runs/25443677902) success
        ⑦ **§1 视觉收口为时尚早**：本刀只交付结构 + 内容 + 倒计时数据流，第一刀范围严格收敛（参照 §0 第一刀模式：先骨架再装饰）；后续 §1 还会有 mask reveal / 封印 motif / 竖排诗句 等等
  v1.49 — WatercolorPaper v0.1 → v0.2 · 修 v1.48 审计 1 P2 + 2 P3：
        ① **修 P2（4% 灰度噪点其实是平面遮罩）**：v1.48 feColorMatrix 把 RGB 三行全写 0、alpha 行 0.04，结果是均匀 4% 黑色遮罩——pixel 级噪声差异被全压成 0，DESIGN §4 §0 "4% 灰度噪点" **没有真正 ship**。
           - 修法：RGB 三行用 ITU-R BT.601 luminance 系数（`0.299 0.587 0.114 0 0`）保留 feTurbulence 的像素级亮度差；alpha 行保持 `0 0 0 0.04 0` 拍到 4% 不透明度
           - 结果：每个像素灰度 = luminance · 整层 4% alpha · 与下方 paper 底色合成 → 真"4% 灰度噪点"
           - 验证：dist HTML 含 3 行 `0.299 0.587 0.114`；老错误矩阵 0 处出现
        ② **修 P3 #1（flip + mobile scale 冲突）**：v1.48 mobile rule `transform: scale(0.7)` 撞上 OliveBranch 内部 `.flipped { transform: scaleX(-1) }`；同属性 cascade 让 .flipped 高优先级胜出 → 右下橄榄枝在 mobile **既不缩也丢镜像**（实际是镜像保留、缩放丢）。
           - 修法：用 CSS Transforms Level 2 `scale: 0.7` 属性（独立于 `transform`，自动合成）；OliveBranch 内部 `transform: scaleX(-1)` 通过 transform 属性独立生效
           - 浏览器支持：Chrome 104+ / Safari 14.1+ / Firefox 72+，全 evergreen
           - 验证：dist 含 `scale:.7`；老 `transform:scale(.7)` 0 处出现
        ③ **修 P3 #2（motif 定位规则全局泄漏）**：v1.48 `:global(.motif-tl)` 全局 emit，未来 §1 / §4 复用 motif library 时会继承 Cover 装饰角落定位 + 偏移 + mobile 缩放
           - 修法：所有 4 条 :global 规则限定在 `.watercolor-paper :global(...)` 内
           - Astro 编译：外层 `.watercolor-paper[data-astro-cid-X]` 走 scoped attr selector；内层 `:not(.motif-tl/.motif-br)` 仍 unscoped 类匹配（Prop 传入的 class 还能抓到）
           - 验证：dist 含 `.watercolor-paper[data-astro-cid-syrosb7w] .motif-tl/-br {position:absolute...}` × 4 条规则全在 .watercolor-paper 内
        ④ **不影响其他 Cover 层**：mimosa-petals canvas / parallax module / .cover isolation+z-index 规则 / 邀请函 / 文本全部 untouched · 邀请函 regression 检查通过（part_1-800.jpg + width="800" + height="1200"）
        ⑤ **dist size**：v1.48 20553 → v1.49 20761（+208 bytes 注释 + 矩阵字符）；CI run [25442655989](https://github.com/YiTiane/forever-begins/actions/runs/25442655989) success
        ⑥ §0 视觉收口现在真正完成（之前 v1.48 标"✓ done"是基于"组件 ship 了"，但 P2 表明视觉效果未完全交付——v1.49 修完后才是真"4% 灰度噪点 ship"）
  v1.48 — Phase 2 §0 第四刀（WatercolorPaper + Mimosa/Olive Branch SVG motif）· §0 视觉 ✓ done：
        ① **新增 §2.4 motif library 两个可复用 SVG**：
           - `src/components/motifs/MimosaSprig.astro` v0.1：含羞草小花球（80×80 viewBox · sage 茎 + mimosa 黄花簇 ×2 + sage 叶 ×2 · `var(--c-sage) / var(--c-mimosa)` token 自动跟随夜读切换）
           - `src/components/motifs/OliveBranch.astro` v0.1：橄榄枝（弯茎 + 4 对叶 · `flip` Prop 支持镜像 · 一组件覆盖左右两侧）
           - 都 aria-hidden="true" + role="presentation"（纯装饰）；Props: size / class / opacity / flip
           - 颜色用 token（不是 hex 字面量）：SVG 在 DOM 内能解析 CSS var，夜读色板切换 motif 自然跟随
        ② **§0 第四刀** 新增 `src/components/cover/WatercolorPaper.astro` v0.1：
           - 单层 absolute inset:0 装饰，全 aria-hidden + pointer-events: none
           - **4% 灰度噪点** procedural via inline SVG `<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2">` + `<feColorMatrix>` 转灰度并 alpha = 0.04 → `<rect 100%×100%>` 全屏 fill；GPU 一次光栅，0 JS 成本
           - **左上 MimosaSprig** size 72 / opacity 0.7 · **右下 OliveBranch flipped** size 84 / opacity 0.6 形成对角呼应
           - 内部 :global(.motif-tl) / :global(.motif-br) 8pt grid 角落定位；mobile (<540px) 缩到 70%
           - 性能：feTurbulence 浏览器一次性光栅缓存；resize 时重绘（成本远低于 JS PNG 重生成）
        ③ **Cover.astro v0.5 → v0.6**：
           - import + 渲染 `<WatercolorPaper />` 作 .cover **第一**子元素（document order: watercolor 在前 → mimosa-petals canvas 后绘 → 粒子在 watercolor 之上 → 内容 z-index: 1 在最上）
           - CSS 排除规则扩展为 `.cover > *:not(.mimosa-petals):not(.watercolor-paper) { position: relative; z-index: 1 }`
           - 头注释扩到 v0.6 段：含 4 刀完成清单 + 最终 stacking 描述
        ④ **dist + 线上验证**：
           - dist 4 个 script tag 不变（CdnEarlyProbe + JSON-LD + 2 module）
           - 线上 watercolor-paper × 2（一次 CSS scoped attr 一次 div）· feTurbulence × 1 · motif-mimosa × 1 · motif-olive × 1 · `fill="var(--c-mimosa)"` × 1 · `var(--c-sage*)` × 2
           - 线上 https://yitiane.github.io/forever-begins/ HTTP 200 · 20553 bytes（v1.47 16533 + 装饰 ~4KB）
           - 邀请函无 regression：AVIF [320,640,800] · `<img src=...part_1-800.jpg width="800" height="1200">`
        ⑤ **§0 各刀完整收口**：
           - ✓ 第一刀（v1.39–v1.42）：CdnImage runtime gate / srcset 真宽度 / CLS = 0 / archive 仓保护 / misc v1.1.0 republish
           - ✓ 第二刀（v1.45）：含羞草花瓣 Canvas 粒子（reduced-motion + 性能预算 + visibilitychange）
           - ✓ 第三刀（v1.46–v1.47）：mouse parallax + Android tilt（idle rAF / deadband 0.5°）
           - ✓ 第四刀（v1.48）：水彩纸纹 + 角落 motif（feTurbulence + 2 SVG）
           - ⏳ iOS DeviceOrientationEvent permission UI flow（独立小刀；按审计建议留 §0 视觉收口后再做）
        ⑥ git: `ee3c1d8` · CI run [25441875504](https://github.com/YiTiane/forever-begins/actions/runs/25441875504) success
        ⑦ **下一步**：Phase 2 §1 Invitation 章节（邀请函 part_2 + 倒计时 + 诗句），或 iOS 权限独立刀，或 §2 Story 长卷
  v1.47 — InvitationParallax idle rAF lifecycle 修（v1.46 审计 P2 修）：
        ① **修 v1.46 审计 P2（Android orientation 路径 rAF 永不停）**：
           - 问题：v0.1 onOrientation 设 engaged=true，但**没有任何路径**清回 false（pointer 路径有 onPointerLeave，orientation 没有等价的"事件停"信号）。Android tilt 一旦触发 → frame() 永远进 atRest && !engaged 短路→ rAF 永跑 → 直接撕裂 v1.46 的"idle 时停 rAF / 零 CPU 待机"承诺
           - 根因修 · v0.1 → v0.2：**完全去掉 `engaged` 标志**；frame() 只看 atRest（target ≈ current）；事件处理器只更新 target + ensureFrame()；pointerleave 把 target 设 (0,0,0) → 自然 lerp 到 0 → atRest → 停 rAF
           - 衍生修 · 方向死区：deviceorientation 即使设备静止也以 ~60 Hz 上报、有亚度级抖动；不滤波则 target 永远在 ±0.3° 范围内微抖、frame() 永不 atRest。**新增 ORIENTATION_DEADBAND_DEG = 0.5°**：|Δgamma| AND |Δbeta| 都 < 0.5° 就 ignore，让 target 在"device 不动"时真正不变
        ② **v1.46 措辞修订**：v1.46 status / footer / changelog 的 "idle 时停 rAF" 是越界承诺（pointer 路径成立，orientation 路径未成立）。v1.47 落地后承诺真兑现；写在 v1.47 changelog 里给未来读者明确"v1.46 上线时该承诺只在 mouse path 成立，Android tilt 路径泄漏"。
        ③ **dist + 线上验证**：
           - dist parallax module: 1387 → **1443 chars**（+56 chars 死区状态 + skip path；minifier 仍尽量内联）
           - 线上 HTML 0 处 `engaged` 字符（v1.46 minified bundle 里有 `engaged` 字符串字面量）
           - `__invitationParallax` 调试钩子保留，`translate3d` 路径不变
           - 邀请函无 regression：AVIF [320,640,800] / `<img width="800" height="1200">`
           - 线上 https://yitiane.github.io/forever-begins/ HTTP 200 · 16533 bytes（v1.46 16477 + 56 chars）
        ④ **不在本批次（按审计指引"统一收口再考虑下批"）**：
           - iOS DeviceOrientationEvent 权限 UI flow（user-gesture 触发的 button "📱 启用倾斜效果"）—— 推荐放第四刀**之后**单独刀，避免 UI 设计与水彩 motif 决策耦合
           - 第四刀（水彩纸纹背景 + Mimosa / Olive Branch SVG motif）—— 等本轮 lifecycle 审计通过后再开
        ⑤ git: `df50713` · push origin/main · CI run [25441153631](https://github.com/YiTiane/forever-begins/actions/runs/25441153631) success
  v1.46 — Phase 2 §0 第三刀（mouse parallax + Android tilt）+ v1.45 审计 P2/P3 双修：
        ① **修 v1.45 审计 P2（粒子层级未显式安全）**：
           - 问题：v0.4 假设 `.cover { position: relative }` + canvas `z-index: 0` 就够；
             但 CSS 规范 stacking layer 6（positioned z-index: 0）会画在 layer 3-5（in-flow non-positioned）之上 → 邀请函 / 文本可能被粒子盖住
           - 修：`.cover { position: relative; isolation: isolate }` 创建独立 stacking context；
             加 CSS 规则 `.cover > *:not(.mimosa-petals) { position: relative; z-index: 1 }` 显式抬非粒子直接子元素到 z 层 1
           - 用 `:not(.mimosa-petals)` 通用规则而非每个子元素重复 → 未来 §0 子刀添加新内容自动覆盖
           - 线上验证：`isolation:isolate` 和 `>:not(.mimosa-petals){position:relative;z-index:1}` 都已 ship
        ② **修 v1.45 审计 P3（Cover 头注释 stale）**：旧 "不在本批次做" 列表还包括"含羞草花瓣 Canvas 粒子"，但 v1.45 已实施。
           v0.5 重写为 "§0 各刀实施进度" 清单：✓ 第一刀 / ✓ 第二刀 / ✓ 第三刀 / ⏳ iOS 权限 / ✗ 第四刀；下次审计扫一眼就知道当前刀状态
        ③ **§0 第三刀**：新增 `src/components/cover/InvitationParallax.astro` v0.1：
           - 单层视差：整张 `.invitation-card` translate3d ≤ 12 px + rotate ≤ 1.5°（DESIGN §4 §0 上限）
           - 桌面 mouse 路径：`.cover` 上 pointermove，仅 `pointerType "mouse"|"pen"` 响应（不与 deviceorientation 双触发）；pointerleave 回到 0,0,0
           - Android 倾斜路径：检测 DeviceOrientationEvent 存在且**没有 requestPermission 静态方法**（Android Chrome / 老 iOS）→ 直接 subscribe；映射 ±15° 物理倾斜到 ±MAX_TRANSLATE
           - **iOS 13+ 留 v1.47**：requestPermission() 必须 user-gesture 触发，需 UI button 设计；不做静默 auto-prompt
           - lerp 8% / 帧 + rest 检测（target/current 差 < 0.05 px / 0.005°）→ 静止时停 rAF 零 CPU
           - GPU 路径：`translate3d(x, y, 0) rotate(z)` + `will-change: transform`，不触发 layout / paint
           - reduced-motion 守卫顶部 return；卡片 transform: none 静态
           - 调试钩子 `window.__invitationParallax?.target()`
        ④ **Cover.astro v0.4 → v0.5**：import + 渲染 InvitationParallax；头注释扩到 v0.5 段；§0 各刀进度清单
        ⑤ **build / 线上验证**：
           - dist/index.html 4 script tags：CdnEarlyProbe IIFE 2567 / JSON-LD 696 / MimosaPetals module 2122 / **InvitationParallax module 1387 chars**
           - 线上 module script 含 `invitation-card` selector / `translate3d` / `DeviceOrientationEvent` / `__invitationParallax`
           - 线上 CSS 含 `.cover[...]{...isolation:isolate...}` + `.cover>:not(.mimosa-petals){position:relative;z-index:1}`
           - 线上 https://yitiane.github.io/forever-begins/ HTTP 200 · 16477 bytes（v1.45 14933 + parallax ~1.5 KB）
           - 邀请函无 regression：AVIF [320,640,800] / JPG part_1-800 / `width="800" height="1200"`
        ⑥ **Phase 2 §0 后续刀**：
           - **v1.47**：iOS DeviceOrientationEvent 权限流程（user-gesture button "📱 enable tilt" + requestPermission()）
           - **第四刀（最后一刀）**：水彩纸纹背景（4% 灰度噪点）+ Mimosa / Olive Branch SVG motif 边缘装饰
  v1.45 — Phase 2 §0 第二刀（含羞草 Canvas 粒子）+ §5.3 commit count P3 修：
        ① **修审计 P3（§5.3 line 2411 stale commit count）**：v1.39 时把 §5.3 列表从 5 commits 改成 7 commits，
           但漏掉了同段顶部的总结句"主仓 5 个 commit"。本批次补改：
           - "主仓 5 个 commit" → "主仓 **7 个 Phase 1 commit**"
           - 加版本范围说明："v1.40+ 进入 Phase 2 §0 实施期，main 已加更多 commit；§5.3 始终是 Phase 1 范围"
           - 提示用 `git log --oneline | wc -l` 查实际总数（避免再钉死）
        ② **Phase 2 §0 第二刀**：新增 `src/components/cover/MimosaPetals.astro` v0.1：
           - 极轻 Astro 组件：scoped `<canvas class="mimosa-petals" aria-hidden>` + scoped CSS（absolute inset:0、pointer-events:none、z-index:0）+ 模块 `<script>` 由 Vite 处理
           - **a11y 守卫**：`prefers-reduced-motion: reduce` → setupMimosaPetals() 函数顶部 return；不创建 canvas context、不入 rAF 循环、不安装调试钩子
           - **性能预算**：桌面 ≤ 50 粒子，移动（<540px）≤ 25 粒子；spawn 节奏 ~600ms 一片直到达 cap；DPR clamp 到 2（4K Retina 不付 3× 像素代价）；visibilitychange 让标签页隐藏时停 rAF；rAF dt clamp 50ms（防长 pause 后大跳）
           - **视觉**：4–8 px 黄圆点（#E6C76B = DESIGN §2.2 mimosa）；vy 20–40 px/s 缓慢下落 + sin() 侧向飘移 4–8 px 振幅；spawn 0→0.7 渐显 1s；底部 80px 渐隐到 0；recycle 回顶
           - **调试钩子**：`window.__mimosaPetals?.count()` 暴露当前粒子数（仅启用时存在）
        ③ **Cover.astro v0.3 → v0.4**：
           - import + 渲染 `<MimosaPetals />` 作为 `.cover` 第一个子元素
           - `.cover` 加 `position: relative` 锚定 absolute canvas（不写就会 inset:0 到 viewport，溢出 Cover 边界）
           - 邀请函卡 + 文本走 normal flow，z-index 高于 z-index:0 的 canvas 层 → 不被粒子遮挡
           - CLS 仍 = 0（canvas inset:0 跟随 .cover 几何，不挤压布局）
        ④ **build / 线上验证**：
           - `pnpm build` 0 errors / 0 warnings · CI run 25439471840 success
           - dist/index.html 含 `<canvas class="mimosa-petals" aria-hidden="true">` + scoped style + module script
           - 线上 https://yitiane.github.io/forever-begins/ HTTP 200 · 14933 bytes（v1.43 12557 + 粒子 ~2.4KB）
           - 提取线上 inline module script：**2122 chars 压缩后**，含 prefers-reduced-motion / requestAnimationFrame / visibilitychange / __mimosaPetals 全部关键守卫
           - 邀请函无 regression：AVIF [320,640,800] · `<img src=...part_1-800.jpg width="800" height="1200">` 不变
        ⑤ **Phase 2 §0 后续刀**（不在本批次）：
           第三刀 mouse parallax / device-orientation（卡片本身位移 ≤12px）· 第四刀 水彩纸纹背景 + Mimosa/Olive Branch SVG motif
  v1.44 — §1.1.13a + §5.3 deferred OG version 校正（v1.43 审计 P2 修）：
        ① **问题**：misc 在 v1.42 已升到 v1.1.0；但 PLAN 里 §1.1.13a task spec（line 1891）和
           §5.3 Phase 1 完成纪要 deferred 段（line 2416）仍写 "push misc → v1.0.1"。
           v1.0.1 < v1.1.0 → 一旦未来跑 OG 重做，发 v1.0.1 会语义降级，破坏回滚定位。
        ② **修法**（仅这两处 live 引用，**不**动历史 changelog 块的 v1.0.1 记载——那些是
           v1.32/v1.38 阶段的当时计划，是历史真值）：
           - §1.1.13a task spec：`VERSION=1.0.1 pnpm push:cdn` → `VERSION=1.1.1 pnpm push:cdn` ·
             `asset-versions.ts misc → v1.0.1` → `→ v1.1.1` · 加一行说明这是 patch on top of v1.1.0
           - §5.3 Phase 1 完成纪要 deferred 段：misc@v1.0.0 → misc@v1.1.0（反映 OG 图实际所在的 tag）·
             "v1.0.1" → "**v1.1.1**" · 加版本基线说明
        ③ 留下 v1.43 修订印记说明（"之前写 v1.0.1 是 v1.42 之前 misc 还在 v1.0.0 的旧基线"），
           方便未来读者理解这条 patch 的语境
        ④ 本批次纯 PLAN.md 文档变更，无代码改动；远端 main / archive 仍是 v1.43 终态。
  v1.43 — push:cdn temp key 清理 + asset-versions 头注释同步（v1.42 审计 P2 + P3 修复）：
        ① **修审计 P2（/tmp deploy key 残留）**：v1.42 跑完 push:cdn 后 7 个
           `/tmp/fb-cdn-*.key`（mode 0600）残留磁盘——脚本写在两处（preflight + push），
           都没清理。重构 `push-to-cdn-repos.ts`：
           - 新增 `withKeyFile(repoName, key, fn)` helper：写入 keyFile → fn(keyFile) → finally `fs.rm({ force: true })`，
             即便 fn throw（push 401 / 网络 / commit fail）也清理
           - preflight 用 withKeyFile() 包 ls-remote
           - push 也用 withKeyFile() 包 clone+rsync+commit+push
           - 新增 `repoKeys` Map 缓存 preflight 时已解析的 key 文本，push 阶段不重新读盘
           - 代价：每个 key 写入 /tmp 两次（preflight + push 各一次，~400 bytes 各），换"私钥永不长期落盘"
        ② **冒烟实证**：rm -f 现存 7 个 /tmp/fb-cdn-*.key → 跑 `VERSION=1.0.0 pnpm push:cdn`（preflight 故意 fail，
           v1.0.0 tag 已存在）→ exit 1 路径上的 try/finally 也清干净，post-test `/tmp/fb-cdn-*.key` 0 文件 ✓
        ③ archive `8871e47` push 成功
        ④ **修审计 P3（asset-versions.ts 头注释 stale）**：
           - "当前进度（v1.17 push）" → "当前进度（v1.42 push）" 含完整 archive `e86ee9b` →
             archive push:cdn → main 170f706 → CI 25437603893 → 线上 800w 这条链
           - 解释 6 仓为何留 v1.0.0（per-content history vs synchronized version 决策）
           - misc 那行内联注释精简成"v1.42 落地·详见文件头进度段"
           - cdnUrl @example URLs 改为真实路径（snow-a/avif/Snow_01-1600 + misc/avif/invitation/part_1-800@v1.1.0）
        ⑤ 主仓 `e257c56` push 成功 · CI run 25438633092 success · 线上 HTTP 200 内容不变（HTML 含 part_1-{320,640,800}.avif、fb-cdn-misc@v1.1.0、`<img width="800" height="1200">`）
        ⑥ §0 第一刀彻底收口：所有 P1/P2/P3 历史项目清账。下一步进 §0 第二刀（含羞草 Canvas 粒子）。
  v1.42 — Path A 全程跑通：push:cdn 双修 + v1.1.0 republish + 主仓接入 + 线上 800w 真宽度：
        ① **修审计 P1（push-to-cdn-repos.ts 空提交 fail）**：archive script 给 commit 加 `--allow-empty`；
           选择性 republish（只 misc 内容变）时未变内容的 6 仓也能 tag-only 推过去，不再卡链
        ② **修审计 P2（runbook 引用不存在的 load-env.sh）**：push:cdn 改为从
           `~/.ssh/forever-begins-keys/${repo.name}` 私钥文件直接读取（KEY_DIR 默认 = `~/.ssh/forever-begins-keys`，
           env override 支持）；env var 路径作为 backward-compat fallback；用户不再需要 source loader
        ③ archive `e86ee9b` push 成功（修 ① + ②）
        ④ **`VERSION=1.1.0 pnpm push:cdn` 跑成功**：preflight 7 仓 KEY_DIR 加载 ✓ → ls-remote 7 仓 v1.1.0 不存在 ✓ → 7 仓依次 clone+rsync+commit(--allow-empty)+tag+push；输出 `[push:cdn] all 7 repos pushed @ v1.1.0`
        ⑤ **CDN 验证**（jsDelivr 有几分钟传播抖动 · Statically 立即可读）：
           - misc@v1.1.0/avif/invitation/part_1-{320,640,800}.avif 真宽度 ✓
           - misc@v1.1.0/jpg/invitation/part_1-800.jpg 经 `file` 识别为 800×1200 ✓
           - 6 个未变仓的 v1.1.0 tag 都在 GitHub 端可见（probe.png 200）
           - 旧 misc@v1.0.0/-1024/-1600/-2400/-3840 的 4 个谎报派生品在新 v1.1.0 下不存在
        ⑥ **主仓 `170f706` bump**：
           - `src/lib/images/asset-versions.ts`: misc 'v1.0.0' → 'v1.1.0'（其余 6 仓内容未变保持 v1.0.0）
           - `src/components/Cover.astro` v0.2 → v0.3：widths `[320,640]` → `[320,640,800]`
           - 头注释加 v0.3 段记录 misc v1.1.0 解锁 4K Retina 真 800w
        ⑦ **CI 跑绿 + 线上验证**：
           - CI run [25437603893](https://github.com/YiTiane/forever-begins/actions/runs/25437603893) success
           - prebuild 此次有 1 项 ⚠ single-side warn（jsDelivr probe.png 暂 403，Statically 200）→ 设计上单边 warn 不阻塞 CI；几分钟内 jsDelivr 自愈
           - 线上 HTML AVIF srcset 含 part_1-320/640/800（3 真宽度）
           - 线上 `<img src="...part_1-800.jpg" width="800" height="1200">`
           - jsDelivr 拉 -800.avif：HTTP 200 · `ISO Media, AVIF Image` · 241753 bytes
        ⑧ **§5.2 #4b 收口**：⏳ followup 改为 ✓ 完成，记 misc v1.1.0 + jsDelivr/Statically 双验证证据
        ⑨ **§0 第一刀官宣完整收口**：CdnImage runtime gate ✓ / srcset 真宽度 ✓ / CLS = 0 ✓ /
           archive 仓保护 ✓ / misc 800w republish ✓。所有审计 P1/P2 历史项目清账。
        ⑩ Phase 2 §0 后续刀（不在本批次）：第二刀含羞草粒子 / 第三刀 parallax / 第四刀 水彩纸纹 + Mimosa/Olive Branch motif
  v1.41 — archive 仓首次入版本控制 + §5.2 #4b 证据更新到 v1.40：
        ① **修审计 P1（archive 仓未保护）**：archive `forever-begins-archive` 此前 `No commits yet on main`，
           包括 v1.40 改的 `scripts/generate-derivatives.ts` 在内的所有脚本与 45 张原图都是本机 only。
           本批次：origin 切到 SSH（`git@github.com:YiTiane/forever-begins-archive.git`）→ 显式 stage
           `.env.example / .gitignore / README.md / original/ / package.json / pnpm-lock.yaml /
           scripts/ / tsconfig.json` → commit `6499c34` → push origin main 成功（75 files / 508MB · 含 45 张
           原图，最大 19.96MB Pearl_02.jpg < GitHub 100MB 单文件红线）
        ② **gitignore 不变**（保留 dist/ + node_modules/ + tmp/ + .env 在外）：
           - dist/ 是 build 产物（403MB），需要时 `pnpm build:cdn` 即可重生成
           - node_modules/ 83MB 由 pnpm-lock.yaml 锁定可重装
           - tmp/ 811MB 是 push:cdn 的瞬态 git-clones
           - .env 含 7 个 deploy key（DEPLOY_KEY_FB_CDN_*），永不 commit
        ③ **修审计 P2（§5.2 #4b 证据 stale）**：原 #4b 文字停在 v1.39（6 挡 srcset / JPG 1600 / run 022eee1），
           与 v1.40 现实（2 挡 srcset / JPG 640 / `<img width="800" height="1200">` / run 25435566475）矛盾。
           更新 #4b 文本：
             - widths 从 6 挡收敛到 [320, 640]（去掉 4 个谎报挡）
             - JPG fallback 跟随收敛到 max(JPG_WIDTHS)=640
             - 新增 CLS 几何预留段
             - git ref 改为 `d211593`，CI run 25435566475
             - 加 ⏳ misc v1.1.0 republish 待用户跑 push:cdn 注脚
        ④ 主仓代码本轮无改动；远端 main 仍是 v1.40 的 d211593，HTTP 200 不变。
        ⑤ 下一步二选一（待用户决定）：
           **路径 A · 跑 misc v1.1.0 republish**（用户操作 · 需 deploy keys）：
             ```bash
             cd ~/projects/forever-begins-archive
             # archive 已包含 v2.16 generator + invitation 重生成的 stage（在 dist/ 内，不入仓但本机现成可用）
             # 注意：dist/ 仍是 .gitignored 状态；archive push 不携带 dist。
             # 但 push:cdn 只读取本机 dist/，不依赖 archive 主仓 git 历史
             source ~/.ssh/forever-begins-keys/load-env.sh   # 加载 7 个 DEPLOY_KEY_*
             VERSION=1.1.0 pnpm push:cdn                      # 全 7 仓 v1.1.0 tag
             ```
             跑完后回主仓改 widths={[320,640,800]} + asset-versions misc → v1.1.0，
             4K Retina 拿到真 800w。
           **路径 B · 跳过 republish · 进 §0 第二刀**：
             当前 widths=[320,640] 已是 misc@v1.0.0 真实未谎报的最大；4K Retina 在 600 CSS px × 3 DPR
             场景下选 640w（< 800w 源），偏小但可接受；可直接进 Phase 2 §0 第二刀（含羞草 Canvas 粒子）。
  v1.40 — Phase 2 §0 第一刀 P2 双修：srcset 真宽度 + CLS 几何预留 + archive 脚本根因修复：
        ① **P2 #1（srcset descriptors 谎报宽度）**：抽样 misc@v1.0.0 的 invitation 派生品，确认
           AVIF/WebP/JPG 的 -1024/-1600/-2400/-3840 实际全部是 800w 同一文件
           （sharp 的 `withoutEnlargement: true` 不放大，但旧 generate-derivatives.ts 仍按
           **请求宽度**命名 → 4K Retina 选 -3840 拿到 800w 位图 → 糊）。
        ② **archive 脚本根因修**：`forever-begins-archive/scripts/generate-derivatives.ts` v2.16：
           - 先读源 `metadata().width`
           - 每个 requested width clamp 到 `Math.min(requested, sourceWidth)`
           - Set 去重 → 文件名按**实际**宽度
           - invitation/part_1（800×1200 源）现在产出 [320, 640, 800] 三个真宽度文件
           - snow/grassland/wooden_door/pearl/retro/cat 源 ≥ 4032w 全部 ≥ max(IMAGE_WIDTHS)=3840w，行为不变
        ③ **archive 本地验证**：清掉 `dist/misc/{avif,webp,jpg}/invitation/`，跑一次性 invitation-only 重生成脚本，
           产出 part_1-{320,640,800}.{avif,webp,jpg} + part_2-{320,640,800}.{avif,webp,jpg}；
           `sharp(...).metadata()` 验证：part_1-320 = 320×480 · part_1-640 = 640×960 · part_1-800 = 800×1200。
        ④ **main 临时修**（无需 CDN republish 即可上线）：
           - `Cover.astro` 邀请函 widths 从 `[320,640,1024,1600,2400,3840]` 收敛到 `[320,640]`——
             仅列 misc@v1.0.0 真实存在且未谎报的两挡；4K Retina 最大选 640w（仍 < 800w 源，无放大）
           - 等用户跑 `cd ~/projects/forever-begins-archive && VERSION=1.1.0 pnpm push:cdn` 发新 misc 到 v1.1.0 后，
             再 bump asset-versions.ts misc → v1.1.0 + Cover widths → [320, 640, 800]，喂 800w 给 4K Retina
        ⑤ **P2 #2（CLS）**：CdnImage v0.2 → v0.3 加可选 `width` / `height` props（源图固有像素），
           渲染为 `<img width="800" height="1200">` 让浏览器自动推 `aspect-ratio: 2/3`；
           配合 CSS `height: auto + width: 100%` 在图片解码完成前就 reserve 完整版心；
           Cover 邀请函传入 width=800 / height=1200 → CLS = 0；
           build-time guard：仅填一个 throw（防 aspect-ratio 推不出的隐性失败）
        ⑥ **dist + 线上 HTML 验证**：
           AVIF srcset：`part_1-320 part_1-640`（仅 2 真宽度 ✓）
           WebP srcset：`part_1-320 part_1-640`（同上）
           img attrs：`width="800" height="1200" loading="eager" fetchpriority="high"`（aspect-ratio 已生效）
           JPG src：`invitation/part_1-640.jpg`（max(JPG_WIDTHS=[320,640])）
           **0 处** -1024/-1600/-2400/-3840 出现（不再谎报）
        ⑦ git: `d211593` · push origin/main · CI run [25435566475](https://github.com/YiTiane/forever-begins/actions/runs/25435566475) success
        ⑧ **⏳ misc v1.1.0 republish runbook**（用户操作 · 需要 deploy keys，agent 不自动跑）：
           ```bash
           cd ~/projects/forever-begins-archive
           # 已在本地 stage：dist/misc/{avif,webp,jpg}/invitation/part_1-{320,640,800}.{avif,webp,jpg}
           # 加载 deploy key env（DEPLOY_KEY_FB_CDN_MISC 等 7 个 envKey）
           source ~/.ssh/forever-begins-keys/load-env.sh   # 或者你自己的 env loader
           VERSION=1.1.0 pnpm push:cdn                      # 全 7 仓 v1.1.0 tag（未变 6 仓内容相同，只 tag bump）
           # 跑完后回主仓：
           cd ~/projects/forever-begins
           # 1. 把 src/lib/images/asset-versions.ts misc 那行从 'v1.0.0' 改成 'v1.1.0'
           # 2. 把 src/components/Cover.astro 的 widths 从 [320, 640] 改回 [320, 640, 800]
           # 3. git commit + push → CI 自动重 deploy
           pnpm prebuild      # 确认 misc@v1.1.0 双 CDN 健康
           ```
           完成后 §5.2 #4b 验证 800w 真实派送给 4K Retina，正式收掉这条审计 follow-up。
        ⑨ **Phase 2 §0 后续刀**（不在本批次 · v1.39 计划保留）：
           第二刀含羞草粒子 / 第三刀 parallax / 第四刀 水彩纸纹 + Mimosa/Olive Branch motif
  v1.39 — Phase 2 §0 第一刀 + 上轮 P2/P3 审计 3 项修复：
        ① **§5.2 #4 拆分**（修 v1.38 审计 P2）：原 #4 整体 [x] 是越界——当时主仓没有任何页面调用 `<CdnImage>`，runtime 加载证据缺失；拆为 #4a (compile-level, ✓) + #4b (runtime-level, 本轮被 Phase 2 §0 第一刀解锁)。
        ② **status 措辞收紧**（修 v1.38 审计 P3）：原写「§1.1.1–§1.1.26 全部子任务完成」与 §1.1.13a 仍 deferred 矛盾；改为「Phase 1 ✓ done（除 §1.1.13a 自愿 deferred）」措辞，明确把 deferred 列在状态行而非掩盖。
        ③ **§5.3 commit count 5→7**（修 v1.38 审计 P3）：列表实有 7 个 commit；`git log --oneline | wc -l` 实测 7。
        ④ **Phase 2 §0 第一刀**（最小批次：仅落地 CdnImage runtime gate，不做 parallax / particles / 水彩纸纹背景）：
           - 新建 `src/components/Cover.astro` v0.1：首次以 `<CdnImage cdnTarget="misc" stem="invitation/part_1" sizes="(min-width: 960px) 600px, (min-width: 540px) 60vw, 80vw" alt="婚礼邀请函 · 杨倚天 与 希尔娜依" priority="high" widths={[320, 640, 1024, 1600, 2400, 3840]} />` 接入主仓
           - 邀请函悬浮纸卡：max-width: min(600px, 60vw) + box-shadow var(--shadow-paper)（DESIGN §4 §0 视觉要点）
           - v0.2 内联文本（welcome / Forever Begins / 新人 / 时间地点 / 诗句）整体迁入 Cover；
             helper class（.latin-italic / .cn-song）替代 inline `font-family`；color 改用 var(--c-sage) / var(--c-sage-deep)
           - `src/pages/index.astro` v0.2 → v0.3：变成 import Base + Cover 的薄壳
        ⑤ **运行时验收 ✓**（满足 §5.2 #4b 阻塞条件）：
           - 本地 build dist/index.html：1 `<picture>` + 1 AVIF source + 1 WebP source + 1 JPG `<img>` · 12 条主备 srcset URL（6 widths × 2 CDN）
           - 6 路 URL 真实抽样：jsDelivr (avif/webp/jpg) 全 200；Statically 全 301 → 200（透明 redirect）
           - 线上 https://yitiane.github.io/forever-begins/ HTTP 200 · 13686 bytes（v0.2 占位 10650 → v0.3 13686，多出 3 KB 是 picture+srcset）
           - 抓 inv-320.avif `file` 识别为 `ISO Media, AVIF Image`（真 AVIF 而非 404 错误页）
        ⑥ git: `022eee1` · push origin/main · CI run 25434514736 success（build 22s + deploy ~10s）
        ⑦ **Phase 2 §0 后续刀**（不在本批次）：
           - 第二刀：含羞草花瓣 Canvas 粒子（轻量 / 可关）
           - 第三刀：mouse parallax / device-orientation 倾斜（卡片本身位移 ≤12px）
           - 第四刀：水彩纸纹背景 + Mimosa / Olive Branch SVG motif
  v1.38 — §5.2 Phase 1 验收清单全部 [x] + §5.3 Phase 1 完成纪要 + Phase 1 ✓ done：
changelog: |
  v1.38 — §5.2 Phase 1 验收清单全部 [x] + §5.3 Phase 1 完成纪要 + Phase 1 ✓ done：
        ① 评估方法：自动化命令一次性扫 10 项验收点的真实证据，结果都对得上前几轮的 changelog；
           没有发现需要补救的 P1/P2/P3，全部勾选。
        ② 10 项验收记录（每项都有可重复的 grep / curl / gh api 命令证据，写在 §5.2 task body 内）：
           #1 Astro v6.2.2 + React 19.2.5 + Tailwind v4.2.4 + TS 6.0.3 · build 0 errors / 0 warnings
           #2 8 woff2 共 818 KB · preload 2 个 = 186 KB < 200KB 目标
           #3 tokens.css: 12 color · 12 --c-* 别名 · 27 字号 · 4 leading · 4 radius · 5 shadow
           #4 CdnImage 编译过 · runtime "dev 服务器加载示例图片" 留 Phase 2 §0/§3/§4 首次 <CdnImage> 实际调用时验证
              （当前主仓没有页面调用，v0.2 Cover 占位用 inline scoped styles）
           #5 asset-versions.ts + cdnUrl() v0.1
           #6 prebuild 7 仓双 CDN 健康
           #7 9 个 JSON entry 落地 · 全 stem 经 GitHub API 真实清单交叉验证
           #8 主仓未回退 JourneyMap / china-cities (rg 0 hit)
           #9 GitHub Pages 部署 run 25432948466 跑绿
           #10 线上 URL HTTP 200 · "Forever Begins" / 2 字体 preload / Cormorant + Noto Serif SC font-family 全 present
        ③ 新增 §5.3 「Phase 1 完成纪要（v1.38）」段：26 子任务 → v1.6 → v1.37 共 32 轮迭代 · 5 commits ·
           build pipeline 全链路 · 字体预算 / token 系统 / CDN 架构 / SEO / a11y 关键工程产出小结 ·
           v1.34 contract gate 实战验证记录
        ④ 原 §5.3「Phase 1 风险与备案」改名为 §5.4（保留内容不动，仅编号下移）
        ⑤ status / footer 统一推到 **Phase 1 ✓ done · Phase 2 §0 Cover 实装 next**
        ⑥ 唯一项 deferred：§1.1.13a OG 图重做（邀请函 part_1 + Sharp+SVG 合成 1200×630）；
           现行 misc@v1.0.0 OG 图已 HTTP 200，社交分享 today 即工作；待素材稳定后单独一轮 misc → v1.0.1
        ⑦ 本轮纯 PLAN.md 文档变更，无项目代码改动；远端 main 仍是 v1.36 的 74202ef，HTTP 200 不变。
  v1.37 — §1.1.23 状态收口（纯文档同步，无代码变更）：
        ① 上轮审计 P3：`§1.1.23` 状态滞后——线上事实是 v0.2 Cover 占位已部署 HTTP 200，
           但 PLAN 仍把它标为待办，会让后续实施者按 spec 把已上线 Cover 退回成最小 h1 smoke page。
        ② 决策：将 §1.1.23 标 [x]，附明确文字「⭐ v1.37 现状保留 · **不回退到下方 spec 的最小 h1 示例**」；
           原 spec 的 `<Base title="Forever Begins"><h1>Forever Begins</h1></Base>` 仅作历史归档保留，
           不实施。
        ③ Phase 2 §0 Cover 实装时再整体重写为带邀请函水彩 + parallax 的真 Cover，
           在那之前 v0.2 占位是 ship-ready 状态。
        ④ 同步：header status / 文末页脚都明确指向 **§5.2 Phase 1 验收清单 next**，
           不再列 §1.1.23 为下一步。
        ⑤ 本轮纯 PLAN.md 文档变更，无项目代码改动；远端 main 仍是 v1.36 的 74202ef，HTTP 200 不变。
  v1.36 — 首次 GitHub Pages 部署成功（§1.1.24 / §1.1.25 / §1.1.26 一气呵成）：
        ① **CI 引导期 P1 修复 1**：deploy.yml 首次跑触发 `pnpm/action-setup@v3` 报
           `No pnpm version is specified`；DESIGN §11.2 spec 没有要求 packageManager 字段。
           修复：package.json 加 `"packageManager": "pnpm@9.15.9"`。
        ② **CI 引导期 P1 修复 2**：第二次跑触发 `ERR_PNPM_NO_LOCKFILE / Ignoring not compatible lockfile`。
           诊断发现：本地外层 shell 的 pnpm 是 8.11.0，而 Node 22 (nvm) 内层 pnpm 是 9.15.9，
           pnpm-lock.yaml 是 v9 格式（`lockfileVersion: '9.0'`，由 9.15.9 写）。
           最初 commit 写的 `pnpm@8.11.0` 错；改为 `pnpm@9.15.9`（与真正写 lockfile 的工具一致）。
           CI 第三次跑 `pnpm install --frozen-lockfile` 通过，build 21s 绿。
        ③ **§1.1.24** GitHub Settings → Pages → Source = "GitHub Actions" 通过 **gh API** 代手动启用：
           `gh api -X POST repos/YiTiane/forever-begins/pages -f build_type=workflow`
           原 PLAN 标记此为手动 UI 步骤；实证 gh CLI token 的 repo scope 已含 Pages admin 权限，
           可全自动启用，无需用户登 GitHub 网页 UI。
        ④ **§1.1.25** push + workflow_dispatch 触发部署成功：
           - 失败 1（25432392131 · 8fe18ba 前）：Setup pnpm 缺 version → 修 ①
           - 失败 2（25432560816 · 8fe18ba）：lockfile 不兼容 → 修 ②
           - 失败 3（25432872299 · 74202ef）：Pages site not found → 启用 §1.1.24
           - 成功 ✓（25432948466 · 74202ef）：build 25s + deploy 11s · artifact github-pages 上传
        ⑤ **§1.1.26** 线上 URL 内容验收（curl 而非浏览器，但等价）：
           - GET https://yitiane.github.io/forever-begins/ → **HTTP 200** · 10650 bytes · 0.39s
           - title: `杨倚天 &amp; 希尔娜依 · 二〇二六年六月十四日 · 永恒之始` ✓
           - "Forever Begins" 在 body ✓
           - canonical: `https://yitiane.github.io/forever-begins/` ✓
           - og:image: `https://cdn.jsdelivr.net/gh/YiTiane/fb-cdn-misc@v1.0.0/og/og-cover-1200x630.jpg` ✓
           - JSON-LD `application/ld+json` SocialEvent 已注入 ✓
           - CdnEarlyProbe 探测 URL `fb-cdn-misc@v1.0.0/probe.png` 已注入 ✓
           - sitemap-0.xml 也是 HTTP 200，仍只含根页（dev-fonts 排除生效）
        ⑥ Phase 1 deploy chain（§1.1.22 → §1.1.24 → §1.1.25 → §1.1.26）全绿；
           接下来唯一剩余的是 §1.1.13a OG 图重做（自愿 deferred）+ Phase 1 验收清单 §5.2。
        ⑦ 今后 push main 即自动部署：build → deploy 共 ~36s。
  v1.35 — 内容数据 P2/P3 cleanup + §1.1.21a-c 归档验收 + §1.1.22 Pages CI 部署管道：
        ① **P2 修复**：`src/content/meta/wedding.json` `address_cn` 去除「（待补全门牌）」内部 TODO 占位——
           原占位会被 future Details / JSON-LD / 地图深链 UI 直接渲染暴露给访客；
           改为公开可发布版本：`新疆维吾尔自治区乌鲁木齐市天山区二道桥大剧院`
        ② **P3 修复**：`src/content/cats/family.json` 荔枝 role 去除未在 seed-text 出现的「小姐」措辞——
           原 `"role": "把自己照顾得超级好的小姐"` 改为 seed-text 直接对应的 `"把自己照顾得超级好"`；
           Berry / 小宝 role 已与 seed-text CATS 段一致，无需修
        ③ **§1.1.21a 归档地图资产验收**（3 min）：
           - `~/projects/forever-begins-archive/dist/misc/map/china-journey-2560x1800.png` ✓ 存在
           - `~/projects/forever-begins-archive/dist/main-content/journey/china-cities.json` ✓ 存在
           归档资产仍在；v1.22 后只作为 Phase 0 历史产物，不进主仓
        ④ **§1.1.21b 主仓未回退验收**（3 min）：
           - `src/content/journey/china-cities.json` ✓ 不存在
           - 全 src/ 没有 JourneyMap 组件 / 5 城列表代码依赖
           - `china-cities` 字面在 src/content.config.ts 仅出现在 v1.22 收敛说明的**注释**中（line 32），无 import / load / 文件依赖
        ⑤ **§1.1.21c sync:main 历史工具验收**（0 min）：
           - 主仓 package.json **无** `sync:main` script ✓
           - 归档仓 package.json 保留 `sync:main`（正确：作为历史排查工具，不日常运行）
           - `MAIN_REPO_PATH` env 未设，触发条件不满足
        ⑥ **§1.1.22** 新增 `.github/workflows/deploy.yml`（DESIGN §11.2 实施）：
           - 触发：push main / workflow_dispatch
           - permissions：contents:read · pages:write · id-token:write
           - concurrency：group=pages · cancel-in-progress=true
           - jobs.build：actions/checkout@v4 → pnpm/action-setup@v3 → setup-node@v4 (node 22, cache pnpm) →
             `pnpm install --frozen-lockfile` → `pnpm build` → upload-pages-artifact@v3
             （**`pnpm build` 自动跑 prebuild hook**：scripts/build-time-check.ts 双 CDN 抖动单边 warn，双败 fail）
           - jobs.deploy：environment=github-pages · deploy-pages@v4 · 输出 page_url
           - **资产版本**：DESIGN §15.1 决定 —— 不通过 env 注入；asset-versions.ts 集中维护，回滚靠改文件 + git push
           - **CI 永远不传 `SKIP_BUILD_CHECK=1`**：保证生产 build 必跑双 CDN sanity check
        ⑦ 工作流 YAML 通过 `python3 yaml.safe_load` 解析校验：name / jobs.build / jobs.deploy / deploy.needs=build 均符合
        ⑧ 验证命令链：
           - `pnpm prebuild` ✅ 7 资产仓双 CDN 健康
           - `pnpm build` ✓ 0 errors · 0 warnings · 2 pages · 1.24s
           - `pnpm exec tsc --noEmit` ✓
           - `pnpm exec prettier --check src/content/ src/content.config.ts .github/workflows/deploy.yml` ✓
        ⑨ **下一步部署链**：
           - §1.1.23 最小 index.astro 修订（当前 v0.2 占位 Cover 已存在；需对照 spec 决定是否退回更小版本）
           - §1.1.24 GitHub Settings → Pages → Source = "GitHub Actions"（**手动操作 · agent 跳过**）
           - §1.1.25 push 触发首次部署（push 到 main 后 Actions 自动跑 deploy.yml）
           - §1.1.26 浏览器打开 https://YiTiane.github.io/forever-begins/ 验证 "Forever Begins" 显示
  v1.34 — §1.1.17–§1.1.21 内容数据填充 + 1 项 schema 增强：
        ① 用 GitHub API 拉取 7 个 fb-cdn-* 仓 v1.0.0 的派生品清单做"真实 CDN 清单交叉验证"——
           所有 stems 都是真实存在的派生品，不是凭空想象的命名：
           - snow-a 8 张 (Snow_01..08) · snow-b 7 张 (Snow_09..15) · 共 15 张
           - grassland 5 张 (Grassland_01..05)
           - wooden-door 6 张 (Wooden_door_01..06)
           - pearl 4 张 (Pearl_01..04)
           - retro 5 张 (Retro_01..05)
           - misc/cat/ 8 张 (berry-portrait/-belly/-bag · lizhi-portrait/-petting · xiaobao-portrait/-naptime/-blue-eyes)
           - misc/invitation/ 2 张 (part_1 / part_2)
           - 共 35 张系列 + 8 张猫 + 2 张邀请函 = 45 张
        ② **Schema 增强**：`src/content.config.ts` v0.2 → v0.3——
           为支持 snow 系列跨 fb-cdn-snow-a/-b 双仓拆分（jsDelivr 单仓 150MB 红线），
           series.photos[] 新增**可选** `cdnTarget` 逐张覆写字段；
           不传 → 沿用 series.cdnTarget；传 → 该 photo 走指定 target。
           消费侧 CdnImage 解析 `photo.cdnTarget ?? series.cdnTarget`。
           snow.json 用了这个 override 把 Snow_09..15 的 7 张点到 'snow-b'，**保持 snow.json 单文件**。
        ③ **§1.1.17** `src/content/meta/wedding.json` 新建：
           - groom/bride/date/venue（cn/cn_short/address_cn/address_en/coords[wgs84+gcj02+bd09]）/poem
           - coords.gcj02 / bd09 全 null（Phase 6 expand-coords.ts 写入）
           - poem 用 seed-text.ts 三句权威文案（"我们无法判断..." + "愿有岁月..." + "诚邀构成..."）
        ④ **§1.1.18** `src/content/story/anchor.json` 新建：
           - 2019-01-27 · 重庆·西南大学 (29.8161, 106.4253) · "我们相恋于此。"
        ⑤ **§1.1.19** `src/content/journey/long-distance.json` 新建：
           - 乌鲁木齐 (43.7689, 87.6283 · 与 wedding.json 二道桥 wgs84 同源) → 墨尔本 (-37.8136, 144.9631)
           - distanceKm: 10755（与 seed-text "10,755 km" 与用户原对话一致）
        ⑥ **§1.1.20** `src/content/cats/family.json` 新建（3 只猫）：
           - Berry · 爱翻肚皮的老大 · 3 张 (portrait/belly/bag) · seed-text 文案权威
           - 荔枝 · 把自己照顾得超级好的小姐 · 2 张 (portrait/petting)
           - 小宝 · 家里最粘人的小毛球 · 3 张 (portrait/naptime/blue-eyes)
        ⑦ **§1.1.21** 5 个 series JSON 新建（snow / garden / wooden-door / pearl / retro）：
           - garden.json **必填** `cdnTarget: "grassland"`（DESIGN §3.2 命名收敛唯一接缝）
           - snow.json 用 photo-level `cdnTarget: "snow-b"` 把后 7 张点到第二仓
           - 其余 series 都是单 cdnTarget；35 张 stems 全部经 stemSchema 严格校验通过
        ⑧ **gate 真实生效证据**：把 snow.json 第一张 stem 临时改成 "Snow_01.jpg" 触发：
           ❌ `[InvalidContentEntryDataError] series → snow data does not match collection schema.`
           `photos.0.stem: stem 禁止图片扩展名（.jpg / .png / .avif / ...）；`
           `扩展由 CdnImage 按 format 拼接`
           → v1.33 的 contract gate 在真实数据上首次验证生效；改回后 build 立即恢复。
        ⑨ **build warnings 归零**：从 v1.33 的 5 条 empty-collection warning 归到 0；
           现在可以正式声明 `pnpm build ✓ 0 errors · 0 warnings · 2 pages · 1.24s`。
        ⑩ 验证命令链：
           - `pnpm prebuild` ✅ 7 资产仓双 CDN 健康
           - `pnpm build` ✓ **0 errors · 0 warnings** · 2 pages · 1.24s
           - `pnpm exec tsc --noEmit` ✓ 类型生成 270ms
           - `pnpm exec prettier --check src/content.config.ts src/content/` ✓
  v1.33 — §1.1.16 / §1.1.15 契约收紧（审计 P2/P3 修复 · 进入内容填充前的 gate）：
        ① **§1.1.16** `src/content.config.ts` v0.1 → v0.2：抽 `stemSchema` 共享 schema：
           - 共用于 `cats.photoRef.stem` 与 `series.photos[].stem`（v0.1 两处分别用 inline regex，且只检查前后斜杠）
           - 真正落地"禁止扩展名 / 禁止 -<数字> 尺寸后缀"契约：
             ✗ `Snow_01.jpg` （.jpg 扩展） → reject
             ✗ `cat/berry-portrait-1600` （-1600 尺寸后缀） → reject
             ✓ `Snow_01` / `cat/berry-portrait` / `invitation/part_1` → accept
           - 防御理由：错 stem 入 content collection → CdnImage 拼出 `avif/Snow_01.jpg-640.avif` 静默 404
        ② **§1.1.15** `src/components/CdnImage.astro` v0.1 → v0.2：JPG fallback 宽度修正：
           - 原 v0.1 `<img src>` 与 `data-src-alt` 固定拼 `jpg/${stem}-1600.jpg`
           - 调用方若传 `widths={[320, 640, 1024]}`（轻量图 / 猫图）会请求一个**srcset 契约外**的 1600w 资产 → 派生品没生成时 404
           - v0.2 改为 `JPG_FALLBACK_WIDTH = Math.max(...JPG_WIDTHS)`，与 srcset 共用同一组实际宽度
           - **fail-fast**：若 widths 中无 ≤ 1600 的值（如全 [2000, 3000] 或 []），构建期 throw 详细错误（含 cdnTarget/stem 与建议）
        ③ **§1.1.16** 文件头路径修正：旧注释写 "src/content/config.ts"（v4 旧名）→ 改为 "src/content.config.ts" 与实际位置一致
        ④ **PLAN.md v1.32 changelog ⑥ 修言**：原写 "0 warnings"，实测 5 条 glob-loader warning（5 个 collection 暂无 JSON）；
           更新表述为"0 errors · 预期 5 条 empty-collection warning · §1.1.17–§1.1.21 数据填充后才能声明 0 warnings"
        ⑤ 验证命令链（v1.33 落地后）：
           - `pnpm prebuild` ✅ 7 资产仓双 CDN 健康
           - `pnpm build` ✓ 0 errors · 2 pages · 仍预期 5 条 empty-collection warning（meta 精确文件名 loader 也报 wedding.json 缺失；未填充数据前不动）
           - `pnpm exec tsc --noEmit` ✓
           - `pnpm exec prettier --check ...` ✓
        ⑥ 这一轮属于"内容填充前的契约 gate"——下一批正式进入 §1.1.17–§1.1.21 数据填充时，
           错误 stem / 错误 widths 都会在 build 时被拦截而不是上线后才发现。
  v1.32 — §1.1.14 / §1.1.15 / §1.1.16 metadata + image gate 批次 + 3 项 P3 housekeeping：
        ① **§1.1.14** 新增 `src/lib/images/cdn-fallback.ts`（v0.1）：
           - `pickCDN()` 用 Promise.any 在 jsDelivr / Statically 间竞速选健康主机
             （**禁止 Promise.race**——race 会让最快失败的胜出）
           - `probeCdnDetailed()` 返回双 CDN 完整状态报告，供故障演练 / vitest 用
           - 守卫齐全：AbortController 不支持时退回 'primary'；fetch 构造 try/catch；
             全失败时也退回 'primary' 让运行时 <img onerror> 兜底
           - **本模块只做诊断 / 单元测试用途**——线上路径在 §1.1.15 CdnEarlyProbe inline script
        ② **§1.1.15** 新增 3 个文件 + Base.astro head 接入：
           - `src/components/CdnImage.astro`：输出 <picture> AVIF/WebP/JPG 三层 srcset；
             primary=jsDelivr 走主 srcset，backup=Statically 通过 data-srcset-alt / data-src-alt
             携带；JPG 兜底仅到 1600w（DESIGN §7.4）；不写 onerror（CdnEarlyProbe 已 capture）
           - `src/components/CdnEarlyProbe.astro`：<head> inline script，define:vars 注入 probeUrl
             （cdnUrl('primary', 'misc', 'probe.png')）；三层防御（probe / 单图 onerror /
             picture sources 同步重写）；可重入；DOM ready 等待；AbortController 守卫
           - **Base.astro head 末尾接入 `<CdnEarlyProbe />`**：dist 中 root + dev-fonts 都已
             见 `fb-cdn-misc@v1.0.0/probe.png` URL 与 applyCdnFallback IIFE
           - API 契约：cdnTarget enum + stem 可含子路径（v1.4）；调用方约定写在文件头注释
        ③ **§1.1.16** 新增 `src/content.config.ts`（**Astro v6 标准位置**，不在 src/content/config.ts）：
           - 5 个 Content Collections：meta / story / journey / cats / series
           - 用 `glob({ pattern, base })` loader（Astro v5+ 现代 API）
           - `series.cdnTarget` 是 zod enum，与 `src/lib/images/asset-versions.ts` 的 7 个 target
             通过 `as const satisfies readonly CdnTarget[]` 锁住一致性
           - `meta` 只 glob `wedding.json`（couple.json 是私有联系信息，不入构建产物）
           - `journey` 用 `.refine()` 兼容 long-distance.json 与 cities.json 两种 entry shape
           - `coords.gcj02 / bd09` 允许 null（Phase 6 expand-coords.ts 写入）
           - `stem` 字段用 regex 校验"禁止前后斜杠"
           - 通过：astro 自动 `[types] Generated 271ms`，types/d.ts 已生成
        ④ **3 项 P3 housekeeping**（与上轮审计一致处理）：
           - PLAN.md 页脚去掉固定 commit hash（`c2b1218` → 「hash 见 changelog 而非此处，避免漂移」）
           - prettier --write `scripts/extract-text.ts` + `scripts/seed-text.ts`（首批 commit 带过来未格式化）
           - Base.astro 新增 `suppressSocialMeta?: boolean` Prop（v0.5），dev-fonts.astro 设为 true：
             og:* + twitter:* + JSON-LD 整组在 dev-only 路由抑制；root 不变
             验证：root index OG=10 / Twitter=4 / JSON-LD=1；dev-fonts 全 0；canonical 与 noindex 仍保留
        ⑤ 顺手 prettier --write `src/pages/index.astro` + `src/components/FontFaces.astro`（首批 commit 带过来未格式化）
        ⑥ 验证命令链：
           - `pnpm prebuild` ✅ 7 资产仓双 CDN 健康
           - `pnpm build` ✓ 0 errors · 2 pages · 1.20s · **预期 5 条** glob-loader warning
             （meta / story / journey / cats / series 5 个 collection 暂无 JSON 文件——
             包括 meta 的精确文件名 loader 也会就缺失 wedding.json 报 WARN。
             §1.1.17–§1.1.21 数据填充后这 5 条 warning 自动消失，届时才能声明 0 warnings）
           - `pnpm exec tsc --noEmit` ✓ Content Collections 类型生成 271ms
           - `pnpm exec prettier --check src/styles/ src/lib/ scripts/ src/content.config.ts package.json` ✓
           - `pnpm exec prettier --plugin=prettier-plugin-astro --check 'src/**/*.astro'` ✓
        ⑦ **Astro v6 路径修订**：PLAN §1.1.16 spec 写的是 `src/content/config.ts`（v4 时代命名）；
           v6 起 Astro 强制 `src/content.config.ts`（在 src/ 下而非 src/content/ 内），否则报
           `LegacyContentConfigError`。本批次纠正到位；下次实施请以本文件位置为准。
  v1.31 — §1.1.13 / §1.1.13b / §1.1.13c 三连击 + 主仓首次进入版本控制：
        ① 主仓首个 commit `c2b1218` push 到 `git@github.com:YiTiane/forever-begins.git`（main → origin/main 已 tracked）：
           29 个 blob + 7050 行；切到 SSH origin 因 HTTPS 在非 TTY 不能交互输入 credentials；
        ② **§1.1.13b** 新增 `src/lib/images/asset-versions.ts`（v1.5 集中接缝契约 v1.31 落地）：
           - `ASSET_VERSIONS` 7 个 target（snow-a / snow-b / grassland / wooden-door / pearl / retro / misc）全 v1.0.0
           - `cdnUrl(host, target, path)` helper：primary=jsDelivr · backup=Statically；
             所有 OG / CdnImage / cdn-fallback 必须经此 helper，**禁止任何文件硬编码** `@vX.X.X`
        ③ **§1.1.13c** 新增 `scripts/build-time-check.ts` + `package.json` `prebuild: tsx scripts/build-time-check.ts`（v1.7 落地契约 v1.31 实施）：
           - 双 CDN 双向 HEAD 探测 7 个资产仓的 `probe.png`（10s 内并发完成）
           - 双侧失败 → ❌ 中止 build；单边失败 → ⚠️ warn（运行时 fallback 仍能救）；双侧 ok → ✅
           - SKIP_BUILD_CHECK=1 本地紧急 escape；CI 永不传
           - **首跑结果 v1.31**：`[build-time-check] ✅ 全部 7 个资产仓双 CDN 健康` —— 7 仓 jsDelivr+Statically 全 200
        ④ **§1.1.13** Base.astro v0.3 → v0.4 升级（完整 SEO + canonical + 主题色 + OG + Twitter + JSON-LD Event）：
           - canonical：`new URL(Astro.url.pathname, Astro.site).href` → `https://yitiane.github.io/forever-begins/`
           - viewport 加 `viewport-fit=cover`（iOS 刘海屏支持）
           - 双态 theme-color：亮 `#FAF6EC` paper / 暗 `#1F2118` paper-night
           - OG 10 条 + Twitter card 4 条；OG 图源走 `cdnUrl('primary', 'misc', 'og/og-cover-1200x630.jpg')`
             （probe 显示 misc@v1.0.0 的 og-cover-1200x630.jpg 已存在 HTTP 200，社交分享 today 即可工作）
           - JSON-LD `SocialEvent`：婚礼日期 `2026-06-14T19:00:00+08:00 → T23:00:00+08:00` ·
             二道桥大剧院 · 乌鲁木齐 · 新疆维吾尔自治区 · CN · organizer 双 Person
           - 新增 Prop `ogImage?` 让单页可覆盖默认 OG 图
           - 头注释扩到 v0.4 完整职责清单（8 项）
        ⑤ **§1.1.13a OG 重做 deferred**：源素材整合（邀请函 part_1 + Sharp + SVG 合成 1200×630）
           工作量较重，本批次明确 defer 到下一轮单独跑；当前 OG URL 经 cdnUrl 指向 misc@v1.0.0 的现存图，
           §1.1.13a 落地后 push misc 到 v1.0.1，bump asset-versions.ts 一行即生效
        ⑥ dist/index.html 运行时证据齐全：
           - 31 条 head meta（charset/viewport/canonical/2 theme-color/color-scheme/10 OG/4 Twitter/preload×2/icon×2 等）
           - JSON-LD <script type="application/ld+json"> 一条完整 SocialEvent payload
           - dist/dev-fonts/index.html 仍带 `noindex,nofollow` + canonical
           - dist/sitemap-0.xml 仍只含根页（dev-fonts 排除生效）
        ⑦ 验证命令链：
           - `pnpm prebuild` ✅ 7 资产仓双 CDN 健康
           - `pnpm build` ✓ 0 warnings · 2 pages · 1.03s
           - `pnpm exec tsc --noEmit` ✓
           - `pnpm exec prettier --check src/styles/ src/lib/ scripts/build-time-check.ts package.json` ✓
           - `pnpm exec prettier --plugin=prettier-plugin-astro --check src/layouts/Base.astro` ✓
           - `curl -I cdnUrl(misc, og/og-cover-1200x630.jpg)` → HTTP 200
        ⑧ 顺手修了 prewarm-mashan.ts 残留 prettier 警告（首个 commit 带过来未格式化）。
  v1.30 — §1.1.12 global.css 落地 + 第一次接入生产 root：
        ① 新增 `src/styles/global.css`（prettier --check 过）：
           - 顶部 3 行严格 import 顺序：`@import "tailwindcss";` → `@import './reset.css';` → `@import './tokens.css';`
             （v1.28 收紧的契约现在真正落地；缺哪条会怎么坏在文件头注释列出）
           - 7 个 helper class（DESIGN §2.3.8）：.cn-kaishu / .cn-song / .cn-hei / .cn-mashan /
             .latin-italic / .latin-roman / .latin-mono；每个**显式** `letter-spacing: 0`
             作为防御性清零（DESIGN §2.3.6 v2.20）
        ② **首次把 token 系统接进生产 root**：在 `src/layouts/Base.astro` frontmatter
           `import '@/styles/global.css'`；prettier-plugin-astro 顺手把整个文件统一为双引号风格；
        ③ **dist CSS 运行时证据**（`dist/_astro/Base.*.css` 内容验证）：
           - `@layer theme { :root,:host { --color-sage:oklch(56.4% .04 117); ...12 色全到位; --text-body:.9375rem; --leading-cn:1.7; --font-cn-kaishu:"LXGW WenKai", ...; ... } }` ✓
           - `body{background:var(--bg);color:var(--fg);font-family:var(--font-cn-song);
             text-spacing-trim:trim-start trim-end;hanging-punctuation:first allow-end;
             font-feature-settings:"kern" 1,"halt" 1;...}` ✓ DESIGN §2.3.6 三件套全在
           - `:root{--c-sage:var(--color-sage);...12 个别名}` ✓ DESIGN 契约别名活跃
           - `@media(min-width:540px){:root{--text-display-2xl:5rem;...10 个全列}}` ✓ 字号 tablet 档
           - `@media(min-width:960px){:root{--text-display-2xl:6rem;...7 个 desktop 档}}` ✓
           - `@media(prefers-color-scheme:dark){:root{--bg:var(--color-paper-night);...}}` ✓ 仅切色板
           - `.cn-kaishu{...letter-spacing:0}` ×7 helper ✓ 全部 0 字距
           - `::selection{background-color:color-mix(in oklch,var(--c-mimosa) 55%,transparent)}` 用 @supports 包裹 ✓ 渐进增强
        ④ **级联正确性**（值得审计的"为什么不会坏"）：
           Tailwind 的 @theme 块进入 `@layer theme`（低优先级层），mobile 默认 token 在该层；
           tokens.css 顶级 :root 与 @media 覆写**不在任何 @layer 内**（高优先级），所以
           tablet/desktop 档总是赢过 mobile @layer 默认；这是 v1.27 三档表能正确切档的级联前提；
        ⑤ §1.1.12 标 [x]；status 推进到 §1.1.13 Base.astro meta + JSON-LD Event + OG next；
        ⑥ 验证命令链：`pnpm exec prettier --check src/styles/` ✓ /
           `pnpm exec prettier --plugin=prettier-plugin-astro --check src/layouts/Base.astro` ✓ /
           `pnpm build` ✓ 0 warnings · 2 pages / `pnpm exec tsc --noEmit` ✓
  v1.29 — §1.1.11 reset.css 落地：
        ① 新增 `src/styles/reset.css`（prettier --check 过；行数不在 changelog 钉死）：
           定位为 Tailwind v4 preflight **之上**的项目级补丁，不重复 preflight 已做的 box-sizing/表单 reset 等；
        ② **DESIGN §2.3.6 中文排版三件套全部上车**（body 选择器一次性挂齐）：
           - text-spacing-trim: trim-start trim-end                   （C 标点挤压）
           - hanging-punctuation: first allow-end                     （E 句首/末标点悬挂）
           - font-feature-settings: "kern" 1, "halt" 1                （D 中英混排基线 + 显式带 kern）
        ③ body 全局基线（A/B）：font-family: --font-cn-song · font-size: --text-body ·
           line-height: --leading-cn (1.7) · **letter-spacing: 0**（B 项目级默认）·
           text-rendering: optimizeLegibility · accent-color: --c-sage · min-height: 100dvh；
        ④ html: color-scheme: light dark · scroll-behavior: smooth · hyphens: auto ·
           -webkit-text-size-adjust: 100%；标题 h1-h6 line-height: --leading-snug (1.3)；
        ⑤ ::selection 用 mimosa 黄铺 + olive-ink 字（OKLCH color-mix），:focus-visible
           sage 描边 2px + offset 2px（鼠标无环 / 键盘有环 · WCAG 2.4.7）；
        ⑥ @media (prefers-reduced-motion: reduce) 把 `*` 动画 / 过渡压到 0.01ms，
           并将 html scroll-behavior 改回 auto（WCAG 2.3.3）；
        ⑦ ❌ 硬约束 grep 全通过：0 处非零 letter-spacing · 0 处 vw/vh 在 font-size ·
           0 处 @font-face · 0 处 helper class（cn-kaishu/cn-song/latin-* 归 §1.1.12）；
        ⑧ §1.1.11 标 [x]；status 推进到 §1.1.12 global.css next。
  v1.28 — §1.1.10 tokens.css 落地 + 三项审计修复：
        ① 新增 `src/styles/tokens.css`（prettier --check 过；行数随后续 helper 抽离会漂，不在 changelog 钉死）：
           - @theme 块：12 个 OKLCH 原始色 + 10 个纯 rem 字号 + 4 行高 + 6 字族 +
             spacing / 4 容器 / 4 圆角 / 3 阴影 / 2 缓动 / 2 自定义断点（tablet/desktop）；
           - :root 块：12 个 `--c-*` DESIGN 别名（指向 `--color-*`）+ 7 个语义角色 token + 5 个 z-index；
           - @media (min-width: 540px / 960px)：仅覆写字号 token（27 处 --text-* 共 mobile 10 + tablet 10 + desktop 7）；
           - @media (prefers-color-scheme: dark)：仅切色板与阴影，**绝不**触碰字号；
        ② **DESIGN 契约别名**（修审计 P2）：DESIGN §2.2 表与 §4 §0/§1 / §5 SVG 例都写 `var(--c-paper)`，
           保留 `--color-*` 给 Tailwind v4 utility，同时 :root 暴露 `--c-*: var(--color-*)` 双轨成立，
           不返工 DESIGN 全文；
        ③ §1.1.12 global.css 严格导入顺序补 `@import "tailwindcss"`（修审计 P2）：
           tokens.css 的 @theme 必须在 Tailwind v4 之后才能解析；
           最终顺序：`@import "tailwindcss"; @import './reset.css'; @import './tokens.css';`；
        ④ §1.1.10 标 [x]；本文档 status 推进到 §1.1.11 reset.css next；
        ⑤ tokens.css 通过 `pnpm exec prettier --check` 与 `pnpm build`（Node 22.22.0，0 warnings、2 pages）。
  v1.27 — DESIGN §2.3.5 表补完后施工依据收口：
        ① §2.3.5 字号阶梯表补完为 10 行 × 3 档纯 rem（title-md / body-lg / body / caption / meta
           原"桌面 px / 移动 px / —"列已替换为 mobile/tablet/desktop 三档），可直接抄入 tokens.css；
        ② §2.3.5 切档机制限定为 @media / @container，**不**用 prefers-color-scheme
           （颜色偏好仅控色板/夜读）；
        ③ §1.1.10 验收对照源更新为 DESIGN §2.3.5 v2.21 三档表全 10 行；
           本轮无代码变更，纯文档收口为下一步施工铺路。
  v1.26 — §1.1.10 / §1.1.12 进一步收紧 + dev-fonts 字距清零：
        ① §1.1.10 tokens.css 字号阶梯**严禁任何 vw 出现**——
           ❌ clamp(min, Xvw, max) / clamp(min, calc(1rem + Nvw), max) / Xvw 直接绑定 都禁；
           ✅ 唯一允许：纯 rem token + media query 二到三档切换（DESIGN §2.3.5 v2.20 三档表为权威）；
        ② §1.1.12 global.css import 顺序统一为 `@import './reset.css'; @import './tokens.css';`
           （之前文字与括号注释自相矛盾）；
        ③ src/pages/dev-fonts.astro 修掉残留 `letter-spacing: 0.12em` → 0；
           全仓 letter-spacing 仅一个值 0 字面量；dist HTML 也仅出现 `letter-spacing:0`；
        ④ 这一轮纯文档与 dev 工具页字距修订；生产 root 与 build 输出均无回归。
  v1.25 — §1.1.10 / §1.1.12 契约预防性修订（DESIGN v2.20 同步）：
        ① §1.1.10 tokens.css 加约束："不定义 letter-spacing token 或 utility"
           （DESIGN §2.3.6 v2.20：所有项目级字距默认 0，极少数视觉特例只在组件内单独写）；
           字号 clamp() 阶梯**不**用 vw 直接绑 viewport，改 `clamp(min, 1rem + Nvw, max)` 或 rem + media；
        ② §1.1.12 global.css 删除"引入 fonts"——字体单一源已在 FontFaces.astro（v1.24）；
           global.css 仅导入 reset/tokens + helper class，所有 helper 默认 letter-spacing: 0；
        ③ Phase 7 §11.1.0 上线前清理 dev-fonts.astro 任务保留（v1.24 引入）；
        ④ 这一轮纯文档契约修订，无代码变更；防止下一步施工把已修问题写回 token 系统。
  v1.24 — §1.1.9 字体管线落地 + 两项 P2 修复：
        ① 字体单一源迁移：删 `src/styles/fonts.css`（曾硬编码 `/forever-begins/fonts/...`，
           触发 8 条 Vite warnings；base 切换会路径分裂），改用 `src/components/FontFaces.astro`
           通过 `set:html` 注入由 `import.meta.env.BASE_URL` 模板生成的 base-aware CSS；
        ② 路由拆分修 root smoke 污染：
           `/` 改为最小 Cover（仅 2 preload 字体 Cormorant Italic + Noto Serif SC Light），
           生产 root 真正兑现 188KB 字体预算承诺；
           8 字体冒烟移至 `/dev-fonts/`（dev 工具，主页/导航不链接）；
        ③ dev-fonts 双重防护：
           astro.config.mjs sitemap.filter 排除 `/dev-fonts/`；
           Base.astro 加 `noindex` Prop，dev-fonts 注入 `<meta name="robots" content="noindex,nofollow">`；
        ④ 新增 `src/lib/fonts/prewarm-mashan.ts`：Phase 6 §6 Closing 入视口前 IntersectionObserver
           触发 FontFace API 主动加载 ma-shan-zheng，绕过 `font-display: optional` 的 100ms 时限；
        ⑤ 排版常量化：index.astro 不用 `clamp(_, _vw, _)` 与负 letter-spacing；
           响应式改用 `@media (max-width: 540px)` + 静态 rem。
        验证：pnpm build 0 Vite warnings（v1.23 是 8）；dist/index.html 实际使用 font-family 仅 2 族；
        所有路径 base-aware 一份斜杠；2 pages 编译。
  v1.23 — 3D/字体/OG 实施契约补强：
        ① `pnpm subset:fonts` 已完成：8 个 woff2 总计 828KB，首屏 preload 两字体约 186KB；
        ② 主仓新增 `@react-three/postprocessing` / `postprocessing` / `maath`，用于 Bloom/halo/阻尼动画；
        ③ GlobeDistanceScene 明确用水彩贴图地球 + `client:visible client:only="react"`，并新增最小 R3F smoke gate；
        ④ StarCarouselFinale 明确默认 Shader Dissolve，低端/低电量降级 crossfade；
        ⑤ 新增 Phase 1 OG 重做任务：邀请函 part_1 + 新人名字 + 烫金日期。
  v1.22 — v2.16 新叙事后的施工契约收口：
        ① `china-cities.json` 不再同步进主仓；旧中国 5 城地图/JSON 仅保留为归档资产；
        ② Phase 1 §1.1.21a-c 从"必须 sync 主仓 JSON"改为"归档资产只读验收"，Phase 1 验收删除主仓 `china-cities.json`；
        ③ 归档仓公开入口 `build:maps` / `build:all` 不再隐式执行 `_sync:main`，避免把废弃 JourneyMap 数据重新带入主仓；
        ④ 当前实际进度同步：Three.js / R3F / Drei 已安装，最终文案已 `extract:text`，字体 subset 尚未执行。
  v1.21 — 最终文案驱动的设计重排：
        ① seed-text.ts 已替换为用户 2026-05-06 最终文案，补齐猫咪、导航、日历、联系方式；
        ② Phase 3 删除 JourneyMap / china-cities 用户可见路径，改为 StoryPoemScroller + GlobeDistanceScene；
        ③ Phase 4 删除独立五画廊施工，改为 StarCarouselFinale + optional Lightbox；
        ④ §1.1.3 依赖清单补 Three.js / React Three Fiber / Drei，为 3D 地球做准备；subset 仍未执行。
  v1.20 — 字体源与中文文案审计：
        ① §1.1.6-§1.1.8 已完成：8 个字体源就位，extract-text.ts / seed-text.ts /
           subset-fonts.sh 写入；subset 尚未执行；
        ② 审计并润色 seed-text.ts 中当前全部用户可见中文文案，统一为更自然、克制、婚礼叙事感更强的表达；
        ③ 修复 extract-text.ts 兜底字符：补齐全角 ０-９ 与常用中文数字，去掉 tab/control 字符；
           新增 package scripts：extract:text / subset:fonts；生成中间文件 scripts/.subset-chars.* 已加入 .gitignore；
        ④ TypeScript 6 下 baseUrl 已弃用，tsconfig 改为 paths: {"@/*": ["./src/*"]}；tsc --noEmit / pnpm build 通过。
  v1.19 — Phase 1 基建启动：
        ① 主仓完成 Astro minimal 初始化；React / Sitemap / astro-icon / Tailwind v4 / 动效 / 可视化依赖安装完成；
        ② @tailwindcss/vite@next 解析为 4.0.0 且不兼容 Vite 7.3.2，已决策改为 tailwindcss@latest +
           @tailwindcss/vite@latest（实装 4.2.4）；
        ③ astro.config.mjs 已配置 GitHub Pages site/base、React、Sitemap、astro-icon、Tailwind Vite plugin；
           tsconfig 已启用 Astro strict + @/* alias；pnpm build 通过；Astro telemetry 已关闭。
  v1.18 — Phase 0 本地/CDN 验收完成：
        ① §0.1.27 本地发布体积通过：snow-a 63M / snow-b 49M / grassland 32M /
           wooden-door 57M / pearl 70M / retro 57M / misc 80M，全部 ≤90MB；
        ② §0.1.28 双 CDN probe 与真实资产抽样通过：7 仓 probe 在 jsDelivr + Statically 全 200，
           Snow_01、invitation part_1、china-journey 真实 URL 双 CDN 全 200；
        ③ §0.1.29 境外网络人工验证延后到 Phase 7 系统化测试；Phase 1 可启动。
  v1.17 — §0.1.25-§0.1.26 完成：
        ① 7 把 deploy key 私钥已在同一 shell 会话中作为 DEPLOY_KEY_FB_CDN_* 环境变量装载；
        ② VERSION=1.0.0 pnpm push:cdn 完成，7 个 Tier B 仓均已 push 并打 tag v1.0.0；
        ③ 下一步进入 §0.1.27-§0.1.29：远端 tag / 仓体积 / jsDelivr + Statically 双 CDN probe 验收。
  v1.16 — §0.1.24 完成：
        ① 为保护硬件，未重跑 build:cdn 的完整图片遍历；改用等价低负载分步
           pnpm build:maps:cdn + pnpm build:og；
        ② 验收通过：venue-1280/2048/2560、china-journey-2560x1800、china-cities.json、
           og-cover-1200x630.jpg 均存在且可读取；
        ③ Phase 0 下一步推进到 §0.1.25：装载 7 把 deploy key 环境变量，为 VERSION=1.0.0 push:cdn 做准备。
  v1.15 — 实施期热安全修订 + §0.1.23 完成：
        ① 用户机器在原派生品生成中出现 CPU 温度 >100°C 报警，后续所有图片派生默认改为热安全策略：
           DERIVATIVE_CONCURRENCY=1 / DERIVATIVE_AVIF_EFFORT=6 / DERIVATIVE_COOLDOWN_MS=5000；
        ② build:cdn 改为调用 build:derivatives:safe，避免 Phase 0 / CI 入口绕过安全参数；
        ③ §0.1.23 已用更保守参数（effort=4 / cooldown=10000）安全续跑完成：
           720 派生图 + 7 lqip.json + 既有地图/OG/主仓 JSON，总 dist 文件数 734。
  v1.14 — 实施期推进 + 实证修订（2 项 P2 + 1 项 P3）：
        ① §0.1.14 原图复制 + §0.1.15 normalize-filenames 已完成（35 婚纱照命名规则化、
           cat 拼音化、invitation part_1/2.jpg、HEIC 原件保留作 Tier C 备份）；
        ② generate-derivatives.ts 修 LQIP 输出契约：原 dist/misc/lqip.json 单文件
           改为按 cdnTarget 分桶 dist/{target}/lqip.json，每仓携带自己的 LQIP map；
        ③ DESIGN §8.3.1/§8.4 Mapbox 调用从硬编码 STYLE_OWNER='YiTiane'/STYLE_ID='wedding-watercolor'
           改为读 process.env.MAPBOX_USERNAME/MAPBOX_STYLE_ID；
           记录实际值 yitiane / cmosgqoun000h01s93ngw6ph1。
  v1.13 — 实施期实证修订（owner 校准 + 进度推进）：
        ① 全部 GitHub owner 引用 yitianyang → YiTiane（54 处，本地 /Users/yitianyang/ 保留）；
        ② §0.1.1-§0.1.13 标记完成：用户已创建 9 仓 + 7 deploy keys + Mapbox 全套 + HEIC 转换 +
           归档仓脚手架（package.json / scripts/* 全套），且通过 v1.12 全部合约验证（VERSION semver +
           Phase A/B preflight + sync 严格模式 + mercator imageScale + china-cities 双产出）；
        ③ §0.1.14（原图复制）+ §0.1.15（normalize-filenames）由 AI 接手执行——路径已确定，
           纯本地文件操作。
  v1.12 — 十三轮（最后一次）文案/验收一致性收口（3 项 P3）：
        ① §4.6 首次 push 后验收命令改为同时探 jsDelivr + Statically；
           双 200 ✅ / 单 200 ⚠️（5–15 min 复查）/ 双失败 ❌；
           与 build-time-check 双 CDN 语义对齐；
        ② scripts/build-time-check.ts 成功文案条件化：
           无 warnings → "双 CDN 健康"；
           有 warnings → "至少一侧 CDN 可用，N 项单边 warning"；
           §1.1.13c 验收说明同步软化为"以 ✅ 结束即通过"；
        ③ §0.1.20 高层步骤把"git tag v1.0.0/自增"改为"TAG = v${VERSION}"；
           增加 Phase A preflight 提示，与 §4.6 详细契约同步。
  v1.11 — 十二轮代码审阅响应（push 原子性措辞精度）：
        §4.6 Phase B 注释由"preflight 已确保不会半推半就"改为分层表述：
        ① preflight 消除可预见失败（key/src/tag）；
        ② Phase B 仍可能因网络中断留下 partial tag；
        ③ 真正的"线上无影响"靠 asset-versions.ts 不切到该 TAG；
        失败处理段同步重写，明确"partial tag 仅在远端存在，前端永不观测"。
  v1.10 — 十一轮代码审阅响应（重跑/维护边界，3 项 P2/P3）：
        ① §4.6 push-to-cdn-repos Phase B：clone 前 `fs.rm(work, recursive, force)` 清 tmp；
           整段 work = path.join('tmp', r.name) 复用，路径常量化；
        ② §18.3 "VERSION 选择速查" 改为用 `gh api repos/.../git/refs/tags` 或
           `git ls-remote --tags` 查上一次 tag（不再用 gh release list）；
        ③ §5.2 Phase 1 验收清单 prebuild 一行改为
           "每 target 至少一个 CDN 返回 200，单边失败仅 warn 不阻塞"。
  v1.9 — 十轮代码审阅响应（CI 契约与 push 原子性）：
        ① §4.6 push-to-cdn-repos 拆为两阶段：
           Phase A preflight 全 7 仓（key 存在 / src 存在 / 远端 tag 不存在）；
           Phase B clone/rsync/commit/tag/push；
           中途失败也不会留下半推半就（同 VERSION 重跑会被 preflight 拦下）；
           import { existsSync } from 'node:fs' 补全；
        ② §18.3 命令快查所有 push:cdn 都加 VERSION=X.Y.Z 示例；
           加"VERSION 选择速查"小表（minor / patch / major）；
        ③ §15.1 sanity check 改为引用 §1.1.13c（避免重复实现 + 旧版本单 CDN 错误示例）；
        ④ DESIGN §11.3 CI workflow 已拆 build / push 两 job，VERSION 通过 inputs 传。
  v1.8 — 九轮代码审阅响应（push 契约与 sanity 守门）：
        ① §4.6 push-to-cdn-repos.ts 顶部 `const VERSION = process.env.VERSION` + semver 校验；
           VERSION 缺失 / 格式错 → 立即 exit 1；
           push 前用 git ls-remote 检查 tag 是否已存在，避免半推半就；
        ② rm 改为 fs.rm 逐项删除（不再 shell brace expansion，dash 不展开）；
           PATHS_TO_CLEAN 显式列表化；
        ③ §0.1.26 改为 `VERSION=1.0.0 pnpm push:cdn`；
           后续 bump VERSION 走 minor / patch；
        ④ scripts/build-time-check.ts 改为同时探 primary + backup：
           仅当**双 CDN 均失败**才 fail build；
           单边失败仅 console.warn，不阻塞 build；
           SKIP_BUILD_CHECK=1 写进脚本头部，CI 永不传。
  v1.7 — 八轮代码审阅响应（4 项执行入口落地）：
        ① 新增 §1.1.13c：写 scripts/build-time-check.ts + package.json prebuild hook；
           Phase 1 验收清单加 "pnpm prebuild 通过"；
           SKIP_BUILD_CHECK 仅本地开发可用，CI 永不传；
        ② push-to-cdn-repos.ts 参考脚本中显式 fs.writeFile probe.png；
           rm 清理列表把 probe.png 纳入；
           push 后给出验证命令（curl HEAD 7 个 URL）；
        ③ §0.1.26 改为 pnpm push:cdn（与 §18.3 命令快查、CI workflow 三处入口一致）；
        ④ DESIGN §11.3 CI 改为 pnpm build:cdn（v1.6 契约）。
  v1.6 — 七轮代码审阅响应（5 项 phase 顺序与守卫）：
        ① Phase 0/1 重排：Phase 0 用 pnpm build:cdn（不 sync 主仓），
           sync 移到 Phase 1 §1.1.21a-c（astro init 之后）；
           §0.1.22 删除 .env 创建步骤；
           Phase 0 验收清单不再检查主仓 JSON；
        ② package.json 增 build:cdn / build:maps:cdn 公开命令，build:all 加 sync；
        ③ sync-to-main-repo.ts 严格模式：
           只有 process.env.CI === 'true' 且无 MAIN_REPO_PATH 时 exit 0；
           本地缺路径 / 路径不存在 / src/ 不存在均 exit 1；
        ④ push-to-cdn-repos.ts 给所有 7 个 Tier B 仓写 probe.png（不仅 misc）；
           §15.1 sanity check 改为 build-time-check.ts 通过 prebuild hook 自动执行；
        ⑤ §18.3 命令快查全部改为 pnpm package scripts，不再 raw tsx。
  v1.5 — 六轮代码审阅响应（4 项执行级断点）：
        ① §0.1.18b sync-to-main-repo.ts 完整可执行版：
           import 'dotenv/config' / { existsSync } / spawnSync 检查 status 与 error；
           CI 兜底（MAIN_REPO_PATH 缺失 → 优雅 exit 0）；
           rsync 后验证 china-cities.json 真的出现；
        ② §0.1.24 改用 pnpm build:maps + build:og（不再 raw scripts）；
           §0.1.22 增加 cp .env.example .env 步骤；
           Phase 0 验收清单加"主仓 china-cities.json 存在 + cities.length === 5"；
        ③ §1.1.13b 新增 src/lib/images/asset-versions.ts + cdnUrl() helper；
           §1.1.14 cdn-fallback / §1.1.15 CdnImage / CdnEarlyProbe 全部走 cdnUrl()；
           §15.1 回滚步骤改为编辑 asset-versions.ts；
        ④ DESIGN §11.3 同步改用 pnpm build:all + pnpm push:cdn；
           CI 故意不设 MAIN_REPO_PATH，sync 优雅跳过；
           原 PUBLIC_ASSETS_VERSION env 已废弃。
  v1.4 — 五轮代码审阅响应（3 项施工契约边角）：
        ① CdnImage prop `series` → `cdnTarget`（与 DESIGN §3.2 双双表 series.cdnTarget 字段同义）；
           stem 允许含子路径（'cat/berry-portrait' / 'invitation/part_1'）；
           调用方约定明确：系列照传 series.cdnTarget，不传 series.id；
           generate-derivatives.ts resolveTarget() 返回 (cdnTarget, stem) 二元组，写入路径含子目录；
           dist/ 树同步为 format-first 一致结构（DESIGN §12 v2.6）；
        ② 归档仓 package.json scripts 重排：
           build:maps 必须含 _sync:main（未同步则前端 build 失败）；
           暴露原子步骤 _maps:venue / _maps:china / _sync:main 便于排错；
           build:all 是最稳路径；
        ③ MAIN_REPO_PATH 处理：
           sync-to-main-repo.ts 内部 expandTilde() 把 ~/ 展开为 os.homedir()；
           .env.example 推荐绝对路径但容忍 ~；
           rsync 前校验 MAIN_REPO_PATH 存在，否则 throw 避免 silent 写错位置。
  v1.3 — 四轮代码审阅响应（5 项 implementation-time 断点）：
        ① §0.1.18 拆为双产出：china-cities.json 同时进 CDN dist 与主仓 src/content/journey/；
           新增 §0.1.18b sync-to-main-repo.ts 步骤；
        ② §1.1.15 CDN fallback 内联 script 完全重写：
           可重入 applyCdnFallback() / DOMContentLoaded 兜底 /
           document capture-phase error 监听器（按 picture 范围切换）/
           AbortController + setTimeout（不再 AbortSignal.timeout）；
           picture 中 source 必须先于 img 重写——浏览器选择器优先级使然；
        ③ §1.1.3 主仓依赖补齐：d3-shape + ical-generator + 类型包；
           §0.1.13 归档仓 package.json 写明 sharp / coordtransform / p-limit / vitest 等；
        ④ §1.1.15 与 §7.5 全面替换 AbortSignal.timeout → AbortController；
        ⑤ §3.1.7 world-110m.json 验收阈值修正为 raw ≤ 100KB / gzipped ≤ 35KB
           （之前 50KB 是把 gzipped 误当 raw）。
  v1.2 — 三轮代码审阅响应（5 项 PLAN/DESIGN 同步收口）：
        ① Phase 3 JourneyMap 改为"读 china-cities.json 像素坐标 + 禁 fitSize"；
           明确禁止导入 d3-geo projection，仅可用 d3-shape；
        ② §1.1.17 wedding.json 模板升级为 coords.{wgs84,gcj02,bd09} 三坐标，
           初始 gcj02/bd09 = null；DetailsMap 据此条件渲染高德/百度按钮；
        ③ Phase 6 §6.1.4 校准步骤重写：跑 expand-coords.ts → 单次写齐三坐标 + 验证偏移合理；
        ④ §1.1.15 CdnImage 集成方式明确为 "构建时常量 srcset + 早期内联 probe + onerror 兜底"，
           不再期待 Astro 组件内部 await（构建时不可行）；
        ⑤ push-to-cdn-repos 脚本契约删除 robots.txt 写入步骤。
  v1.1 — 同步 DESIGN.md v2.3 的 8 项 P1/P2 修订：
        §3 Mapbox 前置移到"阻塞 Phase 0"；
        §4.1.3 robots.txt 步骤删除，改为版权 README + 隐私升级路线说明；
        §4.1.28 Statically URL 改为 @<tag> 格式；
        §7.2 距离 10,754 → 10,755（±1 容差）；
        §7.2 距离展示常量以 `long-distance.json` 为唯一权威；
        §7.2 锚点 N 天文案改为读取 anchor.json 实时计算；
        §15.1 部署回滚路径完全重写——git revert / tag 切换 / ASSET_VERSIONS；
        Garden / Grassland 命名收敛到双双表（详见 DESIGN.md §3.2）；
        各处脚本契约 `cdnTarget` 字段引入。
  v1.0 — 首版施工蓝图。
---

# Forever Begins · 实施计划 PLAN.md

> 这是一份**可勾选、可索引、可独立运转**的施工蓝图。
>
> [DESIGN.md](DESIGN.md) 回答 "为什么这么做"；本文档回答 "怎么做、谁来做、何时做、如何验收"。
>
> 任何脱离本文档的临场决策，须在 §17 决策日志中留痕。

---

## 目录

- [0. 使用说明 How To Use](#0-使用说明-how-to-use)
- [1. 总览 Master Schedule](#1-总览-master-schedule)
- [2. 角色与责任 Roles & Responsibilities](#2-角色与责任-roles--responsibilities)
- [3. 前置物料 Prerequisites](#3-前置物料-prerequisites)
- [4. Phase 0 — 准备 Preparation](#4-phase-0--准备)
- [5. Phase 1 — 基建 Foundation](#5-phase-1--基建)
- [6. Phase 2 — 序幕与请柬 Cover & Invitation](#6-phase-2--序幕与请柬)
- [7. Phase 3 — 第一章 · 我们的故事 Our Story](#7-phase-3--第一章我们的故事)
- [8. Phase 4 — 影像星河验收与降级策略](#8-phase-4--影像星河验收与降级策略)
- [9. Phase 5 — 彩蛋 Family Album](#9-phase-5--彩蛋)
- [10. Phase 6 — 这一天 + 收束 The Day & Closing](#10-phase-6--这一天--收束)
- [11. Phase 7 — 打磨与测试 Polish & QA](#11-phase-7--打磨与测试)
- [12. Phase 8 — 上线与监护 Launch & Stewardship](#12-phase-8--上线与监护)
- [13. 完成标准 Definition of Done](#13-完成标准-definition-of-done)
- [14. 验证矩阵 Test Matrix](#14-验证矩阵-test-matrix)
- [15. 回滚与降级预案 Rollback & Fallback](#15-回滚与降级预案)
- [16. 婚礼前/中/后运营手册 Runbook](#16-婚礼前中后运营手册)
- [17. 决策日志 Decision Log](#17-决策日志)
- [18. 索引：快速跳转表 Quick Index](#18-索引快速跳转表)

---

## 0. 使用说明 How To Use

### 0.1 阅读顺序

1. 第一次阅读：从 §1 开始，建立对总体节奏的概念。
2. 实施时：定位到当前 Phase，逐条勾选。每个勾选项都对应一个**可独立验证**的小操作（10–60 分钟）。
3. 任何一个勾选项需要决策时：先翻 [DESIGN.md](DESIGN.md) 对应章节（已交叉引用）；找不到答案时，在 §17 留下决策记录后再继续。

### 0.2 标记体系

| 符号  | 含义                                 |
| ----- | ------------------------------------ |
| `[ ]` | 待办                                 |
| `[x]` | 已完成（请保留勾选状态作为审计）     |
| 🔵    | 由 **新人（你）** 操作的步骤         |
| 🟢    | 由 **AI（我）** 完成代码或文档       |
| ⚙️    | 由 **CI（GitHub Actions）** 自动完成 |
| ⚠️    | 风险点 / 需小心                      |
| 🔗    | 链接到 DESIGN.md 对应章节            |

### 0.3 工时估算约定

- **1 工日** = 6 个**有效工作小时**（不含会议、喝水、撸猫）
- **粗粒度估时**：每个 Phase 顶部给出
- **细粒度估时**：每个子任务括号中给出（min = 分钟）

### 0.4 当前阻塞点（开工前必读）

⚠️ 进入 Phase 0 之前，下列内容**必须先就位**——见 §3 前置物料。

---

## 1. 总览 Master Schedule

### 1.1 路线图

```
Phase 0  ─┐ 准备 (1.5d)               GitHub 仓 + HEIC 转换 + 派生品 + 地图静态图
          │
Phase 1  ─┤ 基建 (1d)                 Astro + Tailwind + 字体 + 部署管道
          │
Phase 2  ─┤ 序幕 + 请柬 (1d)           §0 Cover + §1 Invitation
          │
Phase 3  ─┤ 第一章 故事 (3d)           StoryPoemScroller + PhotoBeatLayer + 3D Globe
          │
Phase 4  ─┤ 影像星河验收 (2d)          StarCarouselFinale hardening + matrix
          │
Phase 5  ─┤ 彩蛋 (1d)                  三只猫卡片
          │
Phase 6  ─┤ 第四章 + 尾声 (1.5d)       Details + Map + SoftRSVP + Closing + Nav
          │
Phase 7  ─┤ 打磨与测试 (1.5d)          Lighthouse + 跨设备/浏览器/网络
          │
Phase 8  ─┘ 上线 (0.5d + ∞)            自定义域名 + 短链 + 婚礼前/中/后运营

总工期：约 12 个有效工作日（≈ 2 个日历周分散执行）
```

### 1.2 关键依赖关系

```
Phase 0 ─────────► 阻塞所有后续
   │
   └─ 0.4 HEIC 转换 ─────────► Phase 5 三只猫
   └─ 0.5 7 个 CDN 仓 ────────► Phase 4 / 5
   └─ 0.6 地图静态图 ────────► Phase 6（Phase 3 不再消费中国 5 城地图）
   └─ 0.7 jsDelivr 验证 ──────► 所有 photo 渲染

Phase 1 ─────────► Phase 2-6 共享的"地基"
   │
   └─ 1.3 字体 subset ────────► 所有页面文字渲染
   └─ 1.7 CDN fallback ───────► 所有 <Picture> 组件
   └─ 1.8 部署管道 ───────────► 所有迭代

Phase 2 (Cover/Invitation) ──┐
Phase 3 (Story)              ├─► Phase 4 依赖 Globe 后的星场气氛与照片数据
Phase 4 (Photo Stars)        │     建议顺序：Phase 2 → Phase 3 → Phase 4 → Phase 5
Phase 5 (Cats)               ┘     原因：照片长卷与星尘结尾定义了进入猫咪章节的转场
                                  并行可能：Lightbox 可与 Phase 3 后半段并行

Phase 6 (Details + Closing) ─► 等 Phase 0 静态地图就位即可
Phase 7 (QA) ────────────────► 必须等所有功能进入后再做
Phase 8 (Launch) ────────────► 必须 Phase 7 全绿
```

### 1.3 推荐排期（示例：每天 4 小时碎片时间）

| 周次        | 周一  | 周二  | 周三  | 周四 | 周五  | 周末  |
| ----------- | ----- | ----- | ----- | ---- | ----- | ----- |
| **第 1 周** | P0 上 | P0 下 | P1    | P2   | P3 上 | P3 下 |
| **第 2 周** | P4 上 | P4 中 | P4 下 | P5   | P6 上 | P6 下 |
| **第 3 周** | P7 上 | P7 下 | P8    | 缓冲 |       |       |

灵活原则：每个 Phase 内部可拆开多天分散做，跨 Phase 不要并行（除非明确允许）。

---

## 2. 角色与责任 Roles & Responsibilities

| 角色          | 谁              | 主要职责                                                             |
| ------------- | --------------- | -------------------------------------------------------------------- |
| **设计/产品** | 你（杨倚天）    | 内容定稿、审美决策、文案校对、最终上线确认                           |
| **工程/AI**   | 我              | 代码、配置、脚本、测试、文档维护                                     |
| **资产**      | 你 + 我         | 你提供原图与文案，我处理为派生品 + 集成                              |
| **网络运维**  | 你              | GitHub 账号、Mapbox 账号、（可选）域名注册                           |
| **CI**        | 自动            | 派生品生成 + 跨仓推送 + GitHub Pages 部署                            |
| **客人测试**  | 你的朋友 3–5 人 | Phase 7 末期 / Phase 8 灰度时帮忙真实测试（境内 + 境外 各至少 1 人） |

⚠️ **关键约定**：

- 凡是涉及 **GitHub 账号操作 / Mapbox / 域名解析** 的步骤，标 🔵，**必须本人操作**——我无法代登录账号
- 凡是 **仓库内的代码、脚本、配置** —— 我可以全程代写代写代修
- 文案 / 图片**最终选择权在你**

---

## 3. 前置物料 Prerequisites

> 进入 Phase 0 之前，确认下列物料已就位。

### 3.1 必须就位（阻塞 Phase 0）

- [ ] 🔵 **GitHub 账号** `YiTiane`，开启 2FA
- [ ] 🔵 **本地开发环境**：
  - macOS / Linux（Windows 可用 WSL）
  - Node.js ≥ 22.0（推荐 nvm 安装）
  - pnpm ≥ 9.0（`npm i -g pnpm`）
  - git ≥ 2.40
  - GitHub CLI `gh` ≥ 2.40（`brew install gh`），并 `gh auth login`
  - macOS 用户：Preview.app（系统自带，用于 HEIC 手动转换）
  - exiftool（`brew install exiftool`，用于清理 HEIC EXIF 旋转）
- [ ] 🔵 **Mapbox 账号 + token + 自定义样式**（Phase 0 内 0.1.7–0.1.9 / 0.1.24 都需要它）
  - mapbox.com 注册（免费）
  - Default public token，权限 `STYLES:READ` + `FONTS:READ` + `STATIC IMAGES`
  - Mapbox Studio 创建样式 `wedding-watercolor`（详见 §4.5）
- [ ] 🔵 **原图本地齐全**：当前路径已具备 35 张婚纱照 + 8 张猫照 + 2 张邀请函，无需补充

> ⚠️ **v2.3 修订**：原 §3.2 "Mapbox 阻塞 Phase 1" 是错的——Phase 0 中 0.1.10、0.1.17、0.1.18、0.1.24 都已直接调用 Mapbox API。Mapbox 必须在 Phase 0 起步前就位。

### 3.2 必须就位（阻塞 Phase 6）

> 与 Phase 0–5 解耦，可在工程推进时同步收集。

- [ ] 🔵 二道桥大剧院**精确经纬度**（在 Mapbox Studio / 高德地图上拖准）
- [ ] 🔵 **联系方式**：微信 ID + 手机号 + 微信二维码 PNG（≥ 600 × 600）
- [ ] 🔵 婚礼地址**英文/拼音版**（Apple/Google Maps deep link 用）
- [x] 🔵 §4 三只猫文案最终定稿（采用用户 2026-05-06 文案）

### 3.3 可选（锦上添花）

- [ ] 🔵 自定义域名（例 `wedding.YiTiane.com`，需在 DNS 处添加 CNAME）
- [ ] 🔵 短域名服务（如腾讯短链）用于印请柬
- [ ] 🔵 短链生成工具（用于物理请柬印刷）

---

## 4. Phase 0 — 准备

> 🔗 [DESIGN.md §13 Phase 0](DESIGN.md)
>
> **目标**：把所有"代码之外"的物料就位——账户、仓库、密钥、原图、派生品、地图静态图。完工后 Phase 1 可零阻力起步。
>
> **工时**：1.5 工日（≈ 9 小时）
>
> **成功标志**：浏览器打开任意一个 jsDelivr 派生品 URL 能看到图。

### 4.1 子任务清单

#### 4.1.1 GitHub 仓库矩阵

- [ ] 🔵 **0.1.1** 创建主代码仓 `forever-begins`（30 min）

  ```bash
  gh repo create YiTiane/forever-begins --public \
    --description "杨倚天 & 希尔娜依 婚礼网站 · forever-begins.dev"
  cd ~/projects   # 你常用的工作目录
  gh repo clone YiTiane/forever-begins
  ```

  **验收**：`https://github.com/YiTiane/forever-begins` 可访问，仓库为空。

- [ ] 🔵 **0.1.2** 批量创建 7 个 Tier B CDN 仓 + 1 个 Tier C 私有归档仓（20 min）

  ```bash
  CDN_REPOS=(fb-cdn-snow-a fb-cdn-snow-b fb-cdn-grassland fb-cdn-wooden-door fb-cdn-pearl fb-cdn-retro fb-cdn-misc)
  for r in "${CDN_REPOS[@]}"; do
    gh repo create YiTiane/$r --public \
      --description "Forever Begins · 派生品（自动生成 · 请勿手动修改）"
  done
  gh repo create YiTiane/forever-begins-archive --private \
    --description "Forever Begins · 私有归档 · 5K 原图与脚本"
  ```

  **验收**：`gh repo list YiTiane | grep -E '(fb-cdn|forever-begins)'` 输出 9 行。

- [ ] 🔵 **0.1.3** 给所有 Tier B 仓加版权声明 README（15 min）
  - 进入每个 Tier B 仓 → Settings → Topics → 添加 `forever-begins-private-asset`
  - 在每个 Tier B 仓的 README 写明：

    ```md
    # Forever Begins · 派生品仓

    本仓库内容由 CI 自动生成，仅服务于个人婚礼网站。
    未经新人书面同意，禁止任何形式的转载、商业使用、AI 训练。
    Photos © 2026 杨倚天 & 希尔娜依. All Rights Reserved.
    ```

  > ⚠️ **v2.3 修正**：v2.2 曾计划在仓库根放 `robots.txt` 来"阻止搜索引擎索引"。
  > **这是无效的**——`robots.txt` 仅在请求该 origin 根路径时生效。
  >
  > - 本仓的 origin 是 `github.com/YiTiane/...`，由 GitHub 全局 robots 控制（已默认 noindex 大部分文件）
  > - jsDelivr / Statically 用各自的 origin（`cdn.jsdelivr.net` 等），它们各自有 robots，与你写的无关
  > - **README 的版权声明只是道德约束，不构成访问控制**

  > **如果你的真实需求是"图片不被公开访问"** —— 那 jsDelivr / public 仓本身就不可接受，需要切换架构：
  >
  > - 选项 A：所有 Tier B 仓改为 **private**，自托管 GitHub Pages 或 Cloudflare Pages（失去 jsDelivr 边缘缓存）
  > - 选项 B：原图全部上 **Cloudflare R2** + 签名 URL（短期 token），需自定义域名 + Workers
  > - 选项 C：放弃跨境同步，只在腾讯云 COS 用防盗链 + 时效 URL（境外慢但安全）
  >
  > **当前默认是选项"婚礼网站本就要让客人随手打开"**——派生品公开可访问，原图仅在 Tier C 私有归档。这是工程权衡，不是隐私漏洞，但请你**明确签字接受**：

#### 4.1.2 deploy keys（每仓一把）

- [ ] 🔵 **0.1.4** 生成 7 把 deploy key（10 min）

  ```bash
  mkdir -p ~/.ssh/forever-begins-keys
  cd ~/.ssh/forever-begins-keys
  for r in fb-cdn-snow-a fb-cdn-snow-b fb-cdn-grassland fb-cdn-wooden-door fb-cdn-pearl fb-cdn-retro fb-cdn-misc; do
    ssh-keygen -t ed25519 -f ./$r -N "" -C "deploy-$r"
  done
  ls -la
  # 应有 14 个文件: 7 私钥 + 7 .pub
  ```

- [ ] 🔵 **0.1.5** 把 7 把公钥分别上传到对应 Tier B 仓的 Deploy Keys（20 min）

  ```bash
  for r in fb-cdn-snow-a fb-cdn-snow-b fb-cdn-grassland fb-cdn-wooden-door fb-cdn-pearl fb-cdn-retro fb-cdn-misc; do
    gh repo deploy-key add ~/.ssh/forever-begins-keys/$r.pub \
      --repo YiTiane/$r --title "ci-push" --allow-write
  done
  ```

  **验收**：每个 Tier B 仓 Settings → Deploy keys 列表中各有 1 条 "ci-push (Read/write)"

- [ ] 🔵 **0.1.6** 把 7 把私钥作为 GitHub Secrets 配到归档仓（15 min）
  ```bash
  cd ~/.ssh/forever-begins-keys
  for r in fb-cdn-snow-a fb-cdn-snow-b fb-cdn-grassland fb-cdn-wooden-door fb-cdn-pearl fb-cdn-retro fb-cdn-misc; do
    # 把 - 转成 _, 大写, 形成 secret 名
    SECRET_NAME="DEPLOY_KEY_$(echo $r | tr '[:lower:]-' '[:upper:]_')"
    gh secret set $SECRET_NAME --repo YiTiane/forever-begins-archive < ./$r
    echo "set $SECRET_NAME"
  done
  ```
  **验收**：`gh secret list --repo YiTiane/forever-begins-archive` 显示 7 条 `DEPLOY_KEY_*`

#### 4.1.3 Mapbox 配置

- [ ] 🔵 **0.1.7** 注册 / 登录 Mapbox 账号（5 min）
  - 浏览器打开 [account.mapbox.com](https://account.mapbox.com)
  - 创建账号或登录

- [ ] 🔵 **0.1.8** 创建 default public token，命名 `wedding-static-images`（10 min）
  - 进入 Tokens 页面，"Create a token"
  - 权限：勾选 `STYLES:READ`、`FONTS:READ`、`STATIC IMAGES`
  - 名称：`wedding-static-images`
  - URL 限制：暂不限制（CI 用，不暴露给浏览器）

- [ ] 🔵 **0.1.9** 在 Mapbox Studio 复制 / 创建自定义样式 `wedding-watercolor`（30 min · 详见 §4.6）

- [ ] 🔵 **0.1.10** 把 Mapbox token 配到归档仓 Secrets（5 min）
  ```bash
  gh secret set MAPBOX_TOKEN --repo YiTiane/forever-begins-archive
  # 粘贴 token 值后回车
  ```

#### 4.1.4 HEIC 手动转换 ⚠️

> 🔗 [DESIGN.md §7.8](DESIGN.md)

- [ ] 🔵 **0.1.11** 用 macOS Preview 转换 2 个 HEIC（15 min）
  - Finder 打开 `cat/荔枝找你来摸摸.HEIC` → 默认用 Preview 打开
  - File → Export... → Format: JPEG → Quality 滑块拉到最右（1.0）
  - 保存为 `cat/荔枝找你来摸摸.jpg`
  - 同样处理 `cat/陪你睡午觉.HEIC` → `cat/陪你睡午觉.jpg`

- [ ] 🔵 **0.1.12** 清理 EXIF 旋转 + Sharp 兼容性自检（10 min）
  ```bash
  cd <当前工作目录>/cat
  exiftool -all= -overwrite_original 荔枝找你来摸摸.jpg 陪你睡午觉.jpg
  # 用 Sharp 试探读取
  npx sharp-cli --version  # 确保 sharp-cli 安装
  npx sharp-cli --input 荔枝找你来摸摸.jpg --output /tmp/test.webp --width 320
  npx sharp-cli --input 陪你睡午觉.jpg --output /tmp/test2.webp --width 320
  ```
  **验收**：两条 sharp 命令都成功，输出 webp 文件 ≥ 5KB

#### 4.1.5 归档仓初始化

- [ ] 🟢 **0.1.13** 在归档仓搭骨架（15 min）⭐ v1.3 写明依赖清单

  ```
  forever-begins-archive/
  ├── .gitignore               (含 dist/ node_modules/ tmp/)
  ├── .env.example             (MAIN_REPO_PATH=/abs/path/to/forever-begins · 推荐绝对路径，~ 也可)
  ├── README.md
  ├── package.json
  ├── tsconfig.json
  ├── original/
  │   ├── snow/                 (待填)
  │   ├── grassland/
  │   ├── wooden_door/
  │   ├── pearl/
  │   ├── retro/
  │   ├── cat/
  │   └── invitation/
  └── scripts/                   (待写)
      ├── lib/
      ├── assets/world-110m.json
      └── *.ts
  ```

  归档仓 `package.json` 必含的依赖（v1.3 完整列表）：

  ```json
  {
    "type": "module",
    "scripts": {
      // ── 原子步骤（私有，前缀 _）──────────────────────────
      "_maps:venue": "tsx scripts/generate-venue-map.ts",
      "_maps:china": "tsx scripts/generate-china-journey-map.ts",
      "_sync:main": "tsx scripts/sync-to-main-repo.ts",

      // ── 公开复合步骤 ────────────────────────────────────
      // build:derivatives 不依赖主仓；v1.15 起默认脚本内部也是单并发热安全参数
      "build:derivatives": "tsx scripts/generate-derivatives.ts",
      "build:derivatives:safe": "DERIVATIVE_CONCURRENCY=1 DERIVATIVE_AVIF_EFFORT=6 DERIVATIVE_COOLDOWN_MS=5000 tsx scripts/generate-derivatives.ts",

      // build:maps:cdn —— 仅生成静态图，不 sync 主仓（用于 Phase 0 / CI）
      "build:maps:cdn": "pnpm _maps:venue && pnpm _maps:china",

      // build:maps —— v1.22 起仅生成归档/CDN 地图；旧 5 城 JSON 不再 sync 主仓
      "build:maps": "pnpm build:maps:cdn",

      "build:og": "tsx scripts/generate-og.ts",

      // ⭐ build:cdn —— Phase 0 与 CI 用（不依赖主仓 src/content/ 的存在）
      "build:cdn": "pnpm build:derivatives:safe && pnpm build:maps:cdn && pnpm build:og",

      // ⭐ build:all —— v1.22 起不含 sync；主站不再消费 china-cities.json
      "build:all": "pnpm build:cdn",

      // 推 CDN（在 build:cdn 或 build:all 之后）
      "push:cdn": "tsx scripts/push-to-cdn-repos.ts",

      // Phase 6 工具：从 wgs84 扩到 gcj02 + bd09
      "expand:coords": "tsx scripts/expand-coords.ts"
    },
    "dependencies": {
      "sharp": "^0.33", // 派生品 + OG 合成
      "coordtransform": "^2", // §6 wgs84↔gcj02↔bd09
      "heic-convert": "^2", // 注：v2.2 已弃用 CI 自动转，此处仅做兜底；HEIC 仍走手动 Preview
      "p-limit": "^6" // 并发控制（35 张图同时跑会爆内存）
    },
    "devDependencies": {
      "tsx": "^4",
      "typescript": "^5",
      "@types/node": "^22",
      "dotenv": "^16",
      "vitest": "^2" // 单元测试 mercator.ts、coords.ts
    }
  }
  ```

  > **未列依赖**：`d3-shape` 在**主仓**用，不进归档仓；`d3-geo` / `topojson-client` 已随 v1.22 从主仓移除。
  > **mapbox-static**：v2.2 曾提到，实际不需要——直接 `fetch()` Mapbox API URL 即可，少一层依赖。

- [ ] 🔵 **0.1.14** 把所有原图复制到归档仓（30 min · I/O 主导）

  ```bash
  ARCHIVE=~/projects/forever-begins-archive
  SRC=~/Documents/倚天的资料/个人资料/forever-begins
  cp $SRC/wedding_photos/Snow_*.jpg              $ARCHIVE/original/snow/
  cp $SRC/wedding_photos/Grassland_*.jpg         $ARCHIVE/original/grassland/
  cp $SRC/wedding_photos/Wooden_door_*.jpg       $ARCHIVE/original/wooden_door/
  cp $SRC/wedding_photos/Pearl_*.jpg             $ARCHIVE/original/pearl/
  cp $SRC/wedding_photos/Retro_*.jpg             $ARCHIVE/original/retro/
  cp $SRC/cat/*.{JPG,HEIC,jpg}                   $ARCHIVE/original/cat/
  cp $SRC/invitation_part_*.JPG                  $ARCHIVE/original/invitation/
  cd $ARCHIVE && du -sh original/
  # 应输出 ≈ 500 MB
  ```

- [ ] 🟢 **0.1.15** 重命名照片以保证文件名零空格、零汉字（25 min）
  - 重命名规则：
    - 图片系列：保持 `Snow_01.jpg ... Snow_15.jpg`（必要时把 `Snow_1.jpg` 改为 `Snow_01.jpg` 补 0）
    - 猫照：用拼音
      - `老大berry.JPG` → `berry-portrait.jpg`
      - `berry翻肚皮.JPG` → `berry-belly.jpg`
      - `berry爱玩塑料袋.JPG` → `berry-bag.jpg`
      - `二姐荔枝.JPG` → `lizhi-portrait.jpg`
      - `荔枝找你来摸摸.jpg` → `lizhi-petting.jpg`
      - `小宝.JPG` → `xiaobao-portrait.jpg`
      - `蓝色大眼睛.JPG` → `xiaobao-blue-eyes.jpg`
      - `陪你睡午觉.jpg` → `xiaobao-naptime.jpg`
    - 邀请函：`invitation_part_1.JPG` → `invitation/part_1.jpg`
  - 我会写一个 `scripts/normalize-filenames.sh` 跑一次完成所有改名
    > ⚠️ HEIC 原件保留**原汉字名**——它们不进派生品流水线

#### 4.1.6 派生品 / 地图脚本（详见 §4.5、§4.6）

- [ ] 🟢 **0.1.16** 写 `scripts/generate-derivatives.ts`（90 min）⭐ v1.4 format-first + 子路径
  - 输入：`original/{series}/{name}.jpg`
  - **输出（format-first，所有 cdnTarget 一致）**：
    `dist/{cdnTarget}/{format}/{stem}-{w}.{ext}` + `lqip.json`
    - 系列照：`stem` = 文件 basename，例 `Snow_01`
    - misc 仓的子项：`stem` 含子路径，例 `cat/berry-portrait`、`invitation/part_1`
  - 参数：AVIF q=90 effort=9 4:4:4 / WebP q=92 / JPG q=95 mozjpeg
  - 尺寸：[320, 640, 1024, 1600, 2400, 3840]（JPG fallback 仅到 1600w）
  - 映射规则：

    ```ts
    type CdnTarget =
      | "snow-a"
      | "snow-b"
      | "grassland"
      | "wooden-door"
      | "pearl"
      | "retro"
      | "misc";

    /** 从 (series, fileIndex) 决定 (cdnTarget, stem) */
    function resolveTarget(
      series: string,
      fileIndex: number,
      basename: string,
    ): { cdnTarget: CdnTarget; stem: string } {
      switch (series) {
        case "snow":
          return {
            cdnTarget: fileIndex <= 8 ? "snow-a" : "snow-b",
            stem: basename,
          };
        case "grassland":
          return { cdnTarget: "grassland", stem: basename };
        case "wooden_door":
          return { cdnTarget: "wooden-door", stem: basename };
        case "pearl":
          return { cdnTarget: "pearl", stem: basename };
        case "retro":
          return { cdnTarget: "retro", stem: basename };
        case "cat":
          return { cdnTarget: "misc", stem: `cat/${basename}` };
        case "invitation":
          return { cdnTarget: "misc", stem: `invitation/${basename}` };
      }
    }
    ```

  - **写入路径**：`dist/{target}/{fmt}/{stem}-{w}.{ext}`
    - 例 1（雪山）：`dist/snow-a/avif/Snow_01-640.avif`
    - 例 2（猫）：`dist/misc/avif/cat/berry-portrait-640.avif` ← 含子路径
    - 例 3（邀请函）：`dist/misc/avif/invitation/part_1-1600.avif`
  - **生成前必须 `mkdir -p $(dirname …)`** ——子路径目录会自动创建

- [ ] 🟢 **0.1.17** 写 `scripts/generate-venue-map.ts`（30 min · §8.3）
  - 占位坐标 87.6283, 43.7689（待 Phase 6 真实校准）
  - 输出 3 档 PNG 进 `dist/misc/map/`：venue-1280.png / venue-2048.png / venue-2560.png

- [ ] 🟢 **0.1.18** 写 `scripts/generate-china-journey-map.ts`（45 min · §8.4）⭐ v1.22 归档资产
  - 5 城坐标已在 [DESIGN.md §2.C](DESIGN.md) 历史段落提供；**不进入前端叙事**
  - **产出 A**（资产仓 → CDN）：`dist/misc/map/china-journey-2560x1800.png`
  - **产出 B**（归档副本，不同步主仓）：`dist/main-content/journey/china-cities.json`
    - 注意：v1.22 起它只作为排查/归档数据，主站不再 `import`
    - 文件格式见 DESIGN.md §8.4.3（imageWidth/imageHeight/imageScale/viewport/cities[].px）
  - **产出 C**（兜底）：把 china-cities.json 也写一份到 `dist/misc/map/` 以便排查时直接 view

- [ ] 🟢 **0.1.18b** 写 `scripts/sync-to-main-repo.ts`（20 min）⭐ v1.22 历史排查工具
  - v1.22 起默认不运行；保留脚本只为历史排查，避免未来误删 Phase 0 已生成的归档能力
  - 若手动运行，它会把 `dist/main-content/` rsync 到主仓 `src/content/`；当前新设计**禁止**这样做
  - **可直接复制使用**（不要省略任何 import / 检查）：

    ```ts
    // scripts/sync-to-main-repo.ts
    import "dotenv/config"; // ⭐ 必须，否则 process.env 里看不到 .env
    import { existsSync } from "node:fs"; // ⭐ 必须，校验目标路径
    import { homedir } from "node:os";
    import path from "node:path";
    import { spawnSync } from "node:child_process";

    function expandTilde(p: string): string {
      if (p === "~") return homedir();
      if (p.startsWith("~/")) return path.join(homedir(), p.slice(2));
      return p;
    }

    const raw = process.env.MAIN_REPO_PATH ?? "";
    const isCI = process.env.CI === "true"; // GitHub Actions 默认设置

    // ⭐ v1.6 严格模式：本地 .env 写错 / 路径不存在时必须 exit 1，不要静默成功
    //   只有"明确在 CI 环境且未设置 MAIN_REPO_PATH"才 exit 0（CI 不负责同步主仓）
    if (!raw.trim()) {
      if (isCI) {
        console.log("[sync] CI 环境且未设 MAIN_REPO_PATH，跳过主仓同步");
        process.exit(0);
      }
      console.error("[sync] ❌ 本地 MAIN_REPO_PATH 未设置；请检查 .env");
      console.error("       期望：MAIN_REPO_PATH=/abs/path/to/forever-begins");
      console.error("       （CI 环境用 CI=true 才会优雅跳过）");
      process.exit(1);
    }

    const mainRepo = expandTilde(raw);
    const target = path.join(mainRepo, "src", "content");

    if (!existsSync(mainRepo)) {
      // 本地路径错时必须报错；CI 路径错时也报错（CI 不应该设了又指向不存在的位置）
      console.error(`[sync] ❌ MAIN_REPO_PATH 指向的目录不存在: ${mainRepo}`);
      console.error("       检查 .env 里 MAIN_REPO_PATH 是否拼对、绝对路径");
      process.exit(1);
    }

    // 二次校验：目标 src/ 必须已存在（说明 astro init 已跑完）
    if (!existsSync(path.join(mainRepo, "src"))) {
      console.error(`[sync] ❌ ${mainRepo}/src 不存在`);
      console.error("       这表示主仓还没跑 pnpm create astro。");
      console.error(
        "       正确顺序：Phase 0 跑 build:cdn（不含 sync）→ Phase 1 §1.1.1 astro init → §1.1.21b 才跑 sync。",
      );
      process.exit(1);
    }

    // 真正执行 rsync
    const r = spawnSync(
      "rsync",
      ["-a", "--checksum", "dist/main-content/", target + "/"],
      { stdio: "inherit" },
    );

    // ⭐ 必须检查 spawnSync 返回值——它默认不会让 Node 进程跟着失败退出
    if (r.error) {
      console.error("[sync] spawn rsync 失败：", r.error);
      process.exit(1);
    }
    if (r.status !== 0) {
      console.error(`[sync] rsync 退出码 ${r.status}（信号 ${r.signal}）`);
      process.exit(r.status ?? 1);
    }

    // 验收 token：检查关键文件确实出现
    const expected = path.join(target, "journey", "china-cities.json");
    if (!existsSync(expected)) {
      console.error(
        `[sync] rsync 完成但 ${expected} 不存在，请检查 dist/main-content/ 内容`,
      );
      process.exit(1);
    }
    console.log(`[sync] OK → ${expected}`);
    ```

  - 在归档仓 `.env`（**不入仓**，gitignore 过）写：
    ```
    # 推荐填绝对路径；若用 ~ 开头，脚本会自动展开
    MAIN_REPO_PATH=/Users/yitianyang/projects/forever-begins
    ```
    在 `.env.example`（入仓）放占位：
    ```
    MAIN_REPO_PATH=/abs/path/to/forever-begins
    ```
  - **包契约**：
    - `pnpm sync:main` ≡ `tsx scripts/sync-to-main-repo.ts` —— **历史排查工具**；v1.22 起默认不跑
    - `pnpm build:maps` 仅生成 venue / china 归档地图，不再同步主仓
    - `pnpm build:all` 跑全套 CDN 资产，不再触碰主仓
    - **CI 跑 `build:all` 不依赖 MAIN_REPO_PATH**
  - **验收**：跑 `pnpm build:maps` 后，只检查 `dist/misc/map/` 与 `dist/main-content/journey/china-cities.json` 归档副本存在；不要把它同步进主仓
    > v1.4 PLAN 的反例：参考实现没写 `import 'dotenv/config'` 和 `import { existsSync }`，照抄会让 process.env 空 / TypeError；spawnSync 没检查返回值，rsync 失败时仍 exit 0 让 build:maps 假装成功。v1.5 全部修掉。

- [ ] 🟢 **0.1.19** 写 `scripts/generate-og.ts`（45 min · §0/§1 wireframe 备注）
  - Sharp + SVG composite
  - 输出 1200×630 OG 卡 `dist/misc/og/og-cover.jpg`
  - 占位文字（Phase 1 重做更精修版）

- [ ] 🟢 **0.1.20** 写 `scripts/push-to-cdn-repos.ts`（90 min）
  - 读取 `process.env.VERSION` + semver 校验 → 生成 `TAG = v${VERSION}`（缺失/格式错 exit 1）
  - Phase A 全量 preflight：每仓校验 deploy key / src 存在 / 远端 `${TAG}` 不存在
  - Phase B 对每个 Tier B 名称：
    1. clone 仓 to `tmp/{name}` (depth=1, 用对应 deploy key) — clone 前先 `fs.rm` 清 stale
    2. rsync `dist/{name}/` 到 `tmp/{name}/`（含写 README + LICENSE-NOTICE.md，**不再写 robots.txt**——它对第三方 CDN origin 无效）
    3. 写 `probe.png`（**所有 7 个 Tier B 仓** · 1×1 PNG · ~70 字节 · v1.6 修订：原仅 misc 改为全仓，让 §15.1 sanity check 对每个 cdnTarget 都可验证）
    4. `git add . && git commit -m "derivatives: ${TAG} ($(date +%Y-%m-%d-%H%M))"`
    5. `git tag -a ${TAG} -m "${TAG}"`
    6. `git push --tags origin main`
  - 详细可执行实现 + Phase A/B 拆分 + 失败处理：见 §4.6

- [ ] 🟢 **0.1.21** 写 `scripts/normalize-filenames.sh`（15 min）
  - 完成 0.1.15 的批量改名

#### 4.1.7 首次本地跑通

- [ ] 🔵 **0.1.22** 安装依赖 + 跑 normalize-filenames（10 min）

  ```bash
  cd $ARCHIVE
  pnpm install
  bash scripts/normalize-filenames.sh
  ls original/cat/   # 应看到拼音文件名
  ```

  > ⚠️ **此时不创建 `.env`**——Phase 0 故意不 sync 主仓（主仓还没 astro init，src/content/ 不存在）。
  > `.env` 设置移到 Phase 1 §1.1.21c，详见 P1-1 修订说明。

- [x] 🔵 **0.1.23** 跑派生品生成（热安全续跑完成 · 主要 CPU 等待）

  ```bash
  pnpm build:derivatives:safe                  # v1.15：单并发 + AVIF effort 6 + 每张图冷却 5s
  du -sh dist/*
  # 当前实测：dist 409MB；720 派生图 + 7 lqip.json；总 dist 文件数 734
  ```

- [x] 🔵 **0.1.24** 跑地图 + OG（不 sync 主仓）（10 min）⭐ v1.16 低负载分步完成

  ```bash
  export MAPBOX_TOKEN=<你的 token>          # 或加到 shell rc

  # ⭐ Phase 0 用 build:cdn / build:maps:cdn，**不**走 build:maps 与 build:all——
  #    主仓此刻还没 pnpm create astro，src/content/ 不存在；
  #    sync 移到 Phase 1 §1.1.21c 在 astro init 之后再跑。
  pnpm build:cdn                             # = derivatives:safe + maps:cdn + og（不 sync）

  # 或分步：
  # pnpm build:derivatives:safe  &&  pnpm build:maps:cdn  &&  pnpm build:og

  # v1.16 实际执行（避免再次遍历 45 张图片）：
  pnpm build:maps:cdn
  pnpm build:og
  ```

  **验收（Phase 0 仅校验 dist/，不查主仓）**：

  ```bash
  ls dist/misc/map/                                                # venue-*.png + china-journey-*.png
  test -f dist/main-content/journey/china-cities.json              # JSON 已生成（归档备用，不 sync 主仓）
  jq '.cities | length' dist/main-content/journey/china-cities.json  # 应输出 5
  jq '.imageWidth, .imageHeight, .imageScale' \
      dist/main-content/journey/china-cities.json                   # 应是 2560 / 1800 / 2
  ls dist/misc/og/og-cover-1200x630.jpg
  ```

  > v1.22 起不再做主仓 JSON 检查；`china-cities.json` 只保留为归档备用。前端地理高潮由 `GlobeDistanceScene` 实现。

- [x] 🔵 **0.1.25** 把 7 个 deploy key 私钥放到本地环境变量（10 min）

  ```bash
  for r in fb-cdn-snow-a fb-cdn-snow-b fb-cdn-grassland fb-cdn-wooden-door fb-cdn-pearl fb-cdn-retro fb-cdn-misc; do
    NAME="DEPLOY_KEY_$(echo $r | tr '[:lower:]-' '[:upper:]_')"
    export $NAME="$(cat ~/.ssh/forever-begins-keys/$r)"
  done
  ```

- [x] 🔵 **0.1.26** 跑 push-to-cdn-repos，把 7 个仓首次填充（30 min）⭐ v1.8 显式 VERSION

  ```bash
  VERSION=1.0.0 pnpm push:cdn                # ⭐ VERSION 必传，semver 形如 X.Y.Z
  # 观察 7 仓依次 push 成功；最后会输出"全部 7 仓已 push @ v1.0.0"
  ```

  > 后续每次推 CDN 都需要 bump VERSION：
  >
  > - 加照片 / 改文案：`VERSION=1.1.0 pnpm push:cdn`
  > - 仅元数据：`VERSION=1.0.1 pnpm push:cdn`
  >
  > push 后必须把主仓 `src/lib/images/asset-versions.ts` 对应 target 的版本号也改到同一 tag，否则前端仍引用旧 tag。

#### 4.1.8 验证

- [x] 🔵 **0.1.27** 验证每个 Tier B 仓体积 ≤ 90MB（5 min）

  ```bash
  for r in fb-cdn-snow-a fb-cdn-snow-b fb-cdn-grassland fb-cdn-wooden-door fb-cdn-pearl fb-cdn-retro fb-cdn-misc; do
    SIZE=$(gh api repos/YiTiane/$r --jq '.size')   # KB
    echo "$r: $((SIZE/1024)) MB"
  done
  ```

  ⚠️ 任何一个 > 100MB 都应停下排查（可能是派生品参数问题）

- [x] 🔵 **0.1.28** 浏览器验证 jsDelivr 与 Statically 都能拿到资源（15 min）
  - 打开 `https://cdn.jsdelivr.net/gh/YiTiane/fb-cdn-misc@v1.0.0/probe.png` → 应见 1×1 像素图
  - 打开 `https://cdn.jsdelivr.net/gh/YiTiane/fb-cdn-snow-a@v1.0.0/avif/Snow_01-640.avif` → 应见雪山缩略图
  - 同样在 Statically：`https://cdn.statically.io/gh/YiTiane/fb-cdn-snow-a@v1.0.0/avif/Snow_01-640.avif`（注意 `@v1.0.0` 而非 `/v1.0.0`，二者前者直达，后者会走 301）
  - 同样在 Mapbox 静态图：`https://cdn.jsdelivr.net/gh/YiTiane/fb-cdn-misc@v1.0.0/map/venue-1280.png`

- [ ] 🔵 **0.1.29** 浏览器境外验证（30 min · 如手头有 VPN / 海外朋友）— **deferred to Phase 7**
  - 同上四个 URL，从美国/日本/澳洲网络打开看到图即可
  - 如不便，可跳过到 Phase 7 系统化测试

### 4.2 Phase 0 验收清单

- [x] 9 个 GitHub 仓全部就绪（1 主 + 7 Tier B + 1 Tier C）
- [x] 7 把 deploy key 配置完毕，归档仓 Secrets 含 7 条 + Mapbox token
- [x] 2 个 HEIC 已转 JPG，Sharp 可正常打开
- [x] 归档仓 `original/` 含全部 35 张婚纱照 + 8 张猫照（已重命名拼音） + 2 张邀请函 + 2 个 HEIC 原件
- [x] **`build:derivatives:safe + build:maps:cdn + build:og` 跑通无错**（v1.18：因硬件热安全，不再要求完整 build:cdn 重走图片清单）
- [x] `dist/main-content/journey/china-cities.json` 已生成（归档备用，不同步主仓）
- [x] 派生品已生成且 push 到 7 个 Tier B 仓，每仓 ≤ 90MB
- [x] 至少 4 个示例 URL 在 jsDelivr 与 Statically 上都能浏览到
- [x] §17 决策日志中已记录 Mapbox 自定义样式 ID

### 4.3 Phase 0 风险与备案

| 风险                           | 概率 | 影响 | 备案                                                |
| ------------------------------ | ---- | ---- | --------------------------------------------------- |
| Mapbox Studio 自定义样式做不出 | 中   | 中   | 用默认 light-v11 样式临时替代                       |
| Sharp AVIF 编码本机失败        | 低   | 高   | 用 Docker `ghcr.io/lovell/sharp` 镜像跑             |
| HEIC 转出后还是有问题          | 低   | 中   | 退而求其次：用 Photos.app 导出，或用对应 jpg 替代图 |
| jsDelivr 抽风                  | 低   | 高   | 立即 fallback Statically；同时检查仓 size           |
| 任一 Tier B 仓 size > 150MB    | 低   | 高   | 调小派生品最大尺寸（3840w → 2400w）                 |

### 4.4 派生品脚本细节（参考实现）

> 由我（🟢）在 0.1.16 写。这里给出关键骨架，正式实现以提交为准。

```ts
// scripts/generate-derivatives.ts
import sharp from "sharp";
import { readdir, mkdir, writeFile } from "node:fs/promises";
import { join, basename, dirname, extname } from "node:path";

const SIZES = [320, 640, 1024, 1600, 2400, 3840];
const SIZES_JPG = [320, 640, 1024, 1600]; // JPG 不出 4K

type CdnTarget =
  | "snow-a"
  | "snow-b"
  | "grassland"
  | "wooden-door"
  | "pearl"
  | "retro"
  | "misc";

/** v1.4: (series, fileIndex, basename) → (cdnTarget, stem)
 *  stem 含子路径（仅 misc 仓的项需要）。 */
function resolveTarget(
  series: string,
  i: number,
  base: string,
): { cdnTarget: CdnTarget; stem: string } {
  switch (series) {
    case "snow":
      return { cdnTarget: i <= 8 ? "snow-a" : "snow-b", stem: base };
    case "grassland":
      return { cdnTarget: "grassland", stem: base };
    case "wooden_door":
      return { cdnTarget: "wooden-door", stem: base };
    case "pearl":
      return { cdnTarget: "pearl", stem: base };
    case "retro":
      return { cdnTarget: "retro", stem: base };
    case "cat":
      return { cdnTarget: "misc", stem: `cat/${base}` };
    case "invitation":
      return { cdnTarget: "misc", stem: `invitation/${base}` };
    default:
      throw new Error(`unknown series: ${series}`);
  }
}

const ALL_SERIES = [
  "snow",
  "grassland",
  "wooden_door",
  "pearl",
  "retro",
  "cat",
  "invitation",
];

for (const series of ALL_SERIES) {
  const files = await readdir(`original/${series}`);
  for (const f of files.filter((x) => /\.(jpg|jpeg)$/i.test(x))) {
    const i = parseInt(basename(f).match(/_(\d+)/)?.[1] ?? "0");
    const stemBase = basename(f, extname(f));
    const { cdnTarget, stem } = resolveTarget(series, i, stemBase);

    // ⭐ stem 含 / 时（misc 子目录），需要先创建目录
    const writeAt = async (
      fmt: string,
      w: number,
      ext: string,
      buf: Buffer,
    ) => {
      const path = `dist/${cdnTarget}/${fmt}/${stem}-${w}.${ext}`;
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, buf);
    };

    for (const w of SIZES) {
      const baseImg = sharp(`original/${series}/${f}`).resize({
        width: w,
        withoutEnlargement: true,
      });
      await writeAt(
        "avif",
        w,
        "avif",
        await baseImg
          .clone()
          .avif({ quality: 90, effort: 9, chromaSubsampling: "4:4:4" })
          .toBuffer(),
      );
      await writeAt(
        "webp",
        w,
        "webp",
        await baseImg
          .clone()
          .webp({ quality: 92, effort: 6, smartSubsample: true })
          .toBuffer(),
      );
    }
    for (const w of SIZES_JPG) {
      const buf = await sharp(`original/${series}/${f}`)
        .resize({ width: w, withoutEnlargement: true })
        .jpeg({ quality: 95, mozjpeg: true, chromaSubsampling: "4:4:4" })
        .toBuffer();
      await writeAt("jpg", w, "jpg", buf);
    }
    // LQIP (24w base64) —— 写入按 cdnTarget 分桶的 lqip.json
    const lqip = await sharp(`original/${series}/${f}`)
      .resize({ width: 24 })
      .blur(0.6)
      .jpeg({ quality: 40 })
      .toBuffer();
    // 写入 lqip.json (按 target 分桶)
    // ...
  }
}
```

### 4.5 Mapbox 自定义样式步骤

> 🔵 **0.1.9** 详细做法。

1. 进入 [Mapbox Studio](https://studio.mapbox.com)
2. New Style → 选 **Monochrome**（单色起点）
3. 调色（左侧 Components 面板）：
   - Land：`#FAF6EC`（与 `--c-paper` 同）
   - Water：`#7B8A6A` 30% alpha
   - Roads：`#C8C2B4`（与 `--c-mist` 同）
   - Building：隐藏
   - Labels：保留 country/city/place，字体 `DIN Pro Regular`
   - Points of interest：全部关闭（避免视觉杂讯）
4. Style settings → Name: `wedding-watercolor`
5. Publish → Share → 复制 Style URL，记录 Style ID（形如 `YiTiane/clxxxx`）
6. 把 Style ID 填入归档仓 `scripts/config.ts`（我会留好接口）

### 4.6 push-to-cdn-repos 脚本契约

> 🟢 **0.1.20** 设计契约。

```ts
// scripts/push-to-cdn-repos.ts
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { exec as execCb } from 'node:child_process';
const exec = promisify(execCb);

// ⭐ v1.8：VERSION 必须显式提供，且校验 semver 形如 1.2.3
const VERSION = (process.env.VERSION ?? '').trim();
if (!/^\d+\.\d+\.\d+$/.test(VERSION)) {
  console.error(`[push:cdn] ❌ VERSION 必须以 X.Y.Z semver 提供（如 1.0.0）。当前：'${VERSION || '(未设置)'}'`);
  console.error('  例：');
  console.error('    VERSION=1.0.0 pnpm push:cdn        # 首次');
  console.error('    VERSION=1.1.0 pnpm push:cdn        # 加新照片 minor 升级');
  console.error('    VERSION=1.0.1 pnpm push:cdn        # 仅修元数据 patch');
  process.exit(1);
}
const TAG = `v${VERSION}`;

const REPOS: Array<{
  name: string,         // 'fb-cdn-snow-a'
  src: string,          // 'dist/snow-a/'
  envKey: string,       // 'DEPLOY_KEY_FB_CDN_SNOW_A'
}> = [...];

// v1.7：1×1 透明 PNG 字节序列（70 字节左右），所有 7 仓共用同一份
const PROBE_PNG_BYTES = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4' +
  '890000000d4944415478da6300010000000500010d0a2db40000000049454e44ae426082',
  'hex'
);

// v1.8：rm 改为 fs.rm 逐项，不依赖 shell brace expansion（dash 不展开）
const PATHS_TO_CLEAN = ['avif', 'webp', 'jpg', 'lqip.json', 'map', 'og', 'probe.png'];

// ⭐ v1.9：两阶段——先 preflight 全部 REPOS，再进入 clone/push 阶段
//   防止"snow-a 推成功了，snow-b 才发现 tag 已存在 → 部分仓新版、部分仓旧版"

// ── Phase A：preflight 所有仓 ─────────────────────────────────
console.log(`[push:cdn] preflight ${REPOS.length} 仓...`);
const preflightFails: string[] = [];

for (const r of REPOS) {
  // A.1 deploy key 存在
  const key = process.env[r.envKey];
  if (!key) {
    preflightFails.push(`${r.name}: 缺 secret ${r.envKey}`);
    continue;
  }

  // A.2 src 目录存在（dist/{name}/）
  if (!existsSync(r.src)) {
    preflightFails.push(`${r.name}: 源目录 ${r.src} 不存在（先跑 pnpm build:cdn）`);
    continue;
  }

  // A.3 远端 tag 不存在 —— 用 ls-remote 不需要 clone
  await writeKeyToTemp(key, `/tmp/${r.name}.key`);
  const { stdout } = await exec(
    `GIT_SSH_COMMAND="ssh -i /tmp/${r.name}.key -o StrictHostKeyChecking=no" ` +
    `git ls-remote --tags git@github.com:YiTiane/${r.name}.git`
  );
  if (stdout.includes(`refs/tags/${TAG}`)) {
    preflightFails.push(`${r.name}: ${TAG} 已存在远端，请用更高 VERSION`);
  }
}

if (preflightFails.length) {
  console.error(`[push:cdn] ❌ preflight 失败：`);
  preflightFails.forEach(f => console.error('  ✗', f));
  console.error(`\n所有仓未做任何修改。请修正上述问题后重试。`);
  process.exit(1);
}
console.log(`[push:cdn] ✅ preflight 通过：${REPOS.length} 仓全部就绪 @ ${TAG}`);

// ── Phase B：clone / rsync / commit / tag / push ──────────────
// 此阶段开始才会改远端状态。
// ⚠️ v1.11 措辞精度：Phase A preflight 仅消除**可预见**的失败（key 缺 / src 缺 / 远端 tag 已存在），
//   并非"事务性原子提交"。Phase B 仍可能因网络中断 / GitHub 限流等留下 partial tag。
//   真正的"对线上无影响"靠 asset-versions.ts —— 它没切到新 TAG，前端就不会引用半推的状态；
//   见下方失败处理说明 + DESIGN.md §15.1 回滚路径。
const pushed: string[] = [];

for (const r of REPOS) {
  const work = path.join('tmp', r.name);

  // ⭐ v1.10：B.0 clone 前**先清掉本地工作目录**——上一次中途失败可能留下 stale clone，
  //   git clone 在非空目录上会失败。force:true 让目录不存在时也安全。
  await fs.rm(work, { recursive: true, force: true });

  // B.1 clone（key 已在 preflight 写入 /tmp）
  await exec(`GIT_SSH_COMMAND="ssh -i /tmp/${r.name}.key -o StrictHostKeyChecking=no" \
    git clone --depth=1 git@github.com:YiTiane/${r.name}.git ${work}`);

  // B.2 清空旧文件（v1.8：不依赖 shell brace expansion；这里清的是 clone 下来的远端旧版本）
  for (const p of PATHS_TO_CLEAN) {
    await fs.rm(path.join(work, p), { recursive: true, force: true });
  }
  // rsync 把 dist/{name}/ 的新派生品覆盖进 work
  await exec(`rsync -a "${r.src}/" "${work}/"`);

  // B.3 写 README.md + LICENSE-NOTICE.md（**v1.2 起不再写 robots.txt**）
  await writeStandardFiles(`${work}/`);

  // B.4 给**每个** Tier B 仓写一份 probe.png（v1.7）
  await fs.writeFile(path.join(work, 'probe.png'), PROBE_PNG_BYTES);

  // B.5 commit + tag + push
  await exec(`cd ${work} && git add . && \
    git commit -m "derivatives: ${TAG} ($(date +%Y-%m-%d-%H%M))" && \
    git tag -a ${TAG} -m "${TAG}" && \
    GIT_SSH_COMMAND="ssh -i /tmp/${r.name}.key" git push --tags origin main`);

  pushed.push(r.name);
  console.log(`[push:cdn] ✅ ${r.name}@${TAG} (${pushed.length}/${REPOS.length})`);
}

console.log(`\n[push:cdn] 全部 ${REPOS.length} 仓已 push @ ${TAG}`);
console.log(`下一步：在主仓 src/lib/images/asset-versions.ts 把对应 target 的版本改成 '${TAG}'，然后 git push`);
```

> **若 Phase B 中途失败的处理（v1.11 精度修订）**：
>
> Phase A preflight 仅消除**可预见**的失败（key 缺 / src 缺 / 远端 tag 已存在）；
> Phase B 仍可能因网络中断 / GitHub 限流等留下 **partial tag**——前 N 个仓已 push 到 ${TAG}，后续仓还没推。
> **这不是事务性的**，但**线上不受影响**，因为：
>
> 1. 控制接缝在主仓 `asset-versions.ts`：partial tag 时**不要**改主仓的版本号，前端继续引用旧 TAG，浏览器永远看不到半推的状态。
> 2. 修问题后用**同一 VERSION** 再跑：preflight 会在已成功仓上发现 tag 已存在并 fail，提示需 bump VERSION（例 1.0.0 → 1.0.1）。
> 3. 新 VERSION 下重跑：未推完的 + 已推过的全部重新发布该新 TAG；改 asset-versions.ts 到 1.0.1 时全 7 仓都在 1.0.1，无中间态。
>
> **永远不存在"部分仓 v1.0.0、部分仓 v1.0.1"的线上观测**——partial tag 仅在远端存在，前端因 asset-versions.ts 未切而不引用。

**调用方式（v1.8）**：

```bash
# 首次（Phase 0 §0.1.26）
VERSION=1.0.0 pnpm push:cdn

# 后续：bump version
VERSION=1.1.0 pnpm push:cdn       # 加图、加猫、新行程等内容更新走 minor
VERSION=1.0.1 pnpm push:cdn       # 仅 README/LICENSE 变更走 patch
```

⚠️ **`VERSION` 必传**——脚本会在 semver 校验失败时立即 exit 1，不会留下半成品 tag。

**首次 push 后立即验证 probe.png 全仓在线**（v1.12：双 CDN 检测，与 build-time-check 同款语义）：

```bash
TAG="v1.0.0"   # 与刚才 push 的 VERSION 一致
for r in fb-cdn-snow-a fb-cdn-snow-b fb-cdn-grassland fb-cdn-wooden-door fb-cdn-pearl fb-cdn-retro fb-cdn-misc; do
  jp=$(curl -sI "https://cdn.jsdelivr.net/gh/YiTiane/$r@$TAG/probe.png" | head -1 | awk '{print $2}')
  st=$(curl -sI "https://cdn.statically.io/gh/YiTiane/$r@$TAG/probe.png" | head -1 | awk '{print $2}')
  if [ "$jp" = "200" ] && [ "$st" = "200" ]; then
    printf "%-20s ✅ both 200\n" "$r:"
  elif [ "$jp" = "200" ] || [ "$st" = "200" ]; then
    printf "%-20s ⚠️  jsDelivr=$jp / Statically=$st (单边可用，5–15min 后复查)\n" "$r:"
  else
    printf "%-20s ❌ jsDelivr=$jp / Statically=$st\n" "$r:"
  fi
done
```

- **双 200**：完美。
- **单 200 + 单非 200**：CDN 边缘缓存传播延迟，`pnpm prebuild` 时仅 warn 不阻塞；5–15 min 后复跑应转为双 200。
- **双双失败**：push-to-cdn-repos.ts 在该仓上没写到 probe.png，回查脚本（特别检查 §4.6 Phase B 第 4 步是否被跳过）。

---

## 5. Phase 1 — 基建

> 🔗 [DESIGN.md §6/§10/§11](DESIGN.md)
>
> **目标**：搭好主代码仓的工程脚手架，让"任何一个组件能从 0 到上 GitHub Pages"的链路跑通。
>
> **工时**：1 工日（≈ 6 小时）
>
> **成功标志**：把一个写着"Hello"的 index.astro 部署到 GitHub Pages，能打开 URL 看到。

### 5.1 子任务清单

#### 5.1.1 Astro 项目初始化

- [x] 🟢 **1.1.1** `pnpm create astro` 初始化（10 min）

  ```bash
  cd ~/projects/forever-begins
  pnpm create astro@latest .  # 在当前目录
  # 选项: Empty / TypeScript Strict / Yes install / Yes git
  ```

- [x] 🟢 **1.1.2** 安装核心依赖（10 min）

  ```bash
  pnpm add @astrojs/react @astrojs/sitemap astro-icon
  pnpm add react react-dom @types/react @types/react-dom
  pnpm add tailwindcss@next @tailwindcss/vite@next
  pnpm add -D typescript prettier prettier-plugin-astro prettier-plugin-tailwindcss
  pnpm add -D @types/node tsx
  ```

- [x] 🟢 **1.1.3** 安装动效与可视化依赖（10 min）⭐ v1.3 补齐

  ```bash
  # 动效
  pnpm add lenis gsap motion embla-carousel-react scrollama

  # 可视化辅助
  #   d3-shape          SVG 曲线/辅助路径；不再安装 d3-geo/topojson-client，避免恢复 2D 地图路线
  pnpm add d3-shape
  pnpm add -D @types/d3-shape

  # 婚礼详情
  #   ical-generator    §6 生成 wedding-2026-06-14.ics
  pnpm add ical-generator

  # 3D 地球（v1.21）
  #   three / @react-three/fiber / drei 负责 §2 GlobeDistanceScene
  #   @react-three/postprocessing / postprocessing 负责 Bloom / Vignette / ToneMapping
  #   maath 负责阻尼、平滑旋转、曲线采样辅助
  pnpm add three @react-three/fiber @react-three/drei
  pnpm add @react-three/postprocessing postprocessing maath
  pnpm add -D @types/three
  ```

  > **检查**：跑 `pnpm list d3-shape ical-generator three @react-three/fiber @react-three/postprocessing postprocessing maath` 应有版本输出，否则 Phase 3/6 会缺包。

- [x] 🟢 **1.1.4** 配置 `astro.config.ts`（15 min）
  - 集成 React、Tailwind v4、Sitemap
  - `site: 'https://YiTiane.github.io'`、`base: '/forever-begins'`（无自定义域时）
  - Image service 启用 sharp
  - 输出 `output: 'static'`（默认）

- [x] 🟢 **1.1.5** 配置 `tsconfig.json` strict（5 min）

#### 5.1.2 字体子集化

> 🔗 [DESIGN.md §2.3.7](DESIGN.md)

- [x] 🟢 **1.1.6** 下载字体源文件到 `fonts-source/`（不入仓，10 min）
  - Cormorant Garamond Italic 300 / Roman 400：[Google Fonts](https://fonts.google.com/specimen/Cormorant+Garamond) → 下载 ZIP → `.ttf`
  - 思源宋体 Light/Regular：[Adobe](https://github.com/adobe-fonts/source-han-serif) → `.otf`
  - 思源黑体 Light：[Adobe](https://github.com/adobe-fonts/source-han-sans) → `.otf`
  - 霞鹜文楷 Regular：[github.com/lxgw/LxgwWenKai](https://github.com/lxgw/LxgwWenKai) → `.ttf`
  - 马善政毛笔 Regular：[Google Fonts](https://fonts.google.com/specimen/Ma+Shan+Zheng) → `.ttf`
  - Inter Variable：[Google Fonts](https://fonts.google.com/specimen/Inter) → variable `.ttf`

- [x] 🟢 **1.1.7** 写 `scripts/extract-text.ts`（30 min）
  - 扫描 `src/**/*.{astro,tsx,ts,json,md}` 提取所有中文字符
  - 加上常用标点 + 数字 + 拉丁基础
  - 输出 `scripts/.subset-chars.txt`

- [x] 🟢 **1.1.8** 写 `scripts/subset-fonts.sh`（30 min）
  - 用 `pyftsubset` (`pip install fonttools brotli`) 对每个中文字体生成 subset
  - 输出 `public/fonts/*.woff2`，每份 ≤ 200KB
  - 拉丁字体 subset 到 Latin Extended
  - **当前状态**：`pnpm subset:fonts` 已完成；8 个 woff2 总计 828KB；首屏 preload 两项约 186KB
  - **脚本修复**：v1.23 修复 `set -u` 下空 `extra_args` 数组导致 CJK 字体子集化中断的问题

- [x] 🟢 **1.1.9** 字体管线落地（v1.24 完成 · 单一源迁移到 Astro 组件）
  - **已弃用**：~~`src/styles/fonts.css`~~（曾硬编码 `/forever-begins/fonts/...`，触发 8 条 Vite warnings；base 切换会路径分裂）
  - **新单一源**：`src/components/FontFaces.astro`，8 条 `@font-face` 通过 `set:html` 注入由 `import.meta.env.BASE_URL` 模板生成的 CSS
    - 7 个主字体 `font-display: swap`
    - `ma-shan-zheng` `font-display: optional`（落款专用，不抢首屏）
    - 拉丁三族含 `unicode-range`（U+0020-007E + Latin-1 + 通用标点 + 货币 + ligatures）
  - **Base.astro**：导入 `<FontFaces/>`；`<head>` 注入 2 条 preload（`cormorant-italic.woff2` 47.4KB + `noto-serif-sc-light.woff2` 138.9KB，合计 186.3KB < 200KB 目标）
  - **路由拆分**（v1.24 修 P2 smoke 污染）：
    - `/`（`src/pages/index.astro`）：最小 Cover，**仅 2 preload 字体**（Cormorant Italic + Noto Serif SC Light），生产 root 真正兑现 188KB 字体预算承诺
    - `/dev-fonts/`（`src/pages/dev-fonts.astro`）：8 字体冒烟（dev 工具，sitemap 已排除 + 单页 noindex）
  - **预热 helper**：`src/lib/fonts/prewarm-mashan.ts`，Phase 6 §6 Closing 入视口前用 IntersectionObserver 触发 `prewarmMaShanZheng()`，绕过 `font-display: optional` 的 100ms 时限
  - **验证**：`pnpm build` 0 Vite warnings；`dist/index.html` 实际使用 `font-family` 仅 2 族；所有路径 base-aware 一份斜杠

#### 5.1.3 设计令牌系统

> 🔗 [DESIGN.md §2.2 / §2.3.5 / §2.5 / §2.6](DESIGN.md)

- [x] 🟢 **1.1.10** 写 `src/styles/tokens.css`（30 min）⭐ v1.28 完成
  - **落地文件**：`src/styles/tokens.css`（prettier --check 过 · 花括号平衡 · 行数不钉死，随别名 / helper 抽离会漂）
  - **@theme 块**（Tailwind v4 utility 命名空间）：
    - 12 个 OKLCH 色板（3 主色 + 4 强调 + 5 中性 · 每个带 `HEX #...` 注释做归一化）
    - 10 个 `--text-*` 字号 token（mobile 第一档默认 · DESIGN §2.3.5 v2.21 三档表第一列）
    - 4 个 `--leading-*`（tight 1.1 / snug 1.3 / cn 1.7 / quote 1.85）
    - 6 个 `--font-*` 字族（cormorant / inter / cn-song / cn-sans / cn-kaishu / cn-mashan，与 FontFaces.astro 单一源对齐）
    - 间距：`--spacing: 0.25rem` base + `--spacing-section-md/lg`（192 / 256px）
    - 容器：4 档 `--container-*`（narrow 28 / prose 36 / wide 45 / page 75 rem）
    - 圆角：4 档 `--radius-*` · 阴影：3 个 `--shadow-*` · 缓动：2 个 `--ease-*`
    - 自定义断点：`--breakpoint-tablet: 540px` / `--breakpoint-desktop: 960px`（不覆盖 Tailwind 默认）
  - **:root 块**（不入 @theme · 给 raw CSS / SVG 用）：
    - **DESIGN 契约别名**：12 个 `--c-*: var(--color-*)`（v1.28 新增 · 与 DESIGN §2.2 表 / §4 SVG 写法一致）
    - 7 个语义角色 token：`--bg --fg --muted --accent --link --link-hover --rule`
    - 5 个 z-index：`--z-base/-rail/-nav/-lightbox/-toast`
  - **@media (min-width: 540px) :root**：覆写 10 个字号 token（tablet 档全列）
  - **@media (min-width: 960px) :root**：覆写 7 个字号 token（desktop 档 display-_ / title-_ / body-lg；body / caption / meta 与 tablet 同档不再放大）
  - **@media (prefers-color-scheme: dark) :root**：仅切语义角色 token + 阴影；**0 处** `--text-*` / `--leading-*` / `--spacing-*` 出现（验收回归点）
  - **硬约束验证**（grep 通过 · build 通过 · prettier 通过）：
    - 0 处 `vw` / `vh` / `vmin` / `vmax` 在 `--text-*` token
    - 0 处非零 letter-spacing
    - 0 处 `@font-face` / fonts 导入
    - 27 处 `--text-*` 总计（mobile 10 + tablet 10 + desktop 7）
    - 12 处 `--color-*`（@theme 内）+ 12 处 `--c-*` 别名（:root 内）一一对应
  - 验证命令链：`pnpm exec prettier --check src/styles/tokens.css` ✓ / `pnpm build` ✓ 0 warnings · 2 pages / `pnpm exec tsc --noEmit` ✓

- [x] 🟢 **1.1.11** 写 `src/styles/reset.css`（15 min）⭐ v1.29 完成
  - **落地文件**：`src/styles/reset.css`（prettier --check 过 · 花括号平衡 · 行数不钉死）
  - **定位**：在 Tailwind v4 preflight **之上**叠加项目专有约束；不重复 preflight 已做的 box-sizing / margin / 表单 reset
  - **DESIGN §2.3.6 中文排版三件套全部落地**：
    - body: `text-spacing-trim: trim-start trim-end`（C 标点挤压）
    - body: `hanging-punctuation: first allow-end`（E 句首/末标点悬挂）
    - body: `font-feature-settings: "kern" 1, "halt" 1`（D 中英混排基线 + Latin kerning · halt 需显式带"kern"否则 OpenType kerning 被 FFS 覆盖）
  - **body 全局排版基线（A/B）**：
    - `font-family: var(--font-cn-song)`（默认 CN 宋；helper 在 §1.1.12 覆盖）
    - `font-size: var(--text-body)` + `line-height: var(--leading-cn)`（1.7，CN 段落底线）
    - **`letter-spacing: 0`**（DESIGN §2.3.6 B 项目级默认；非零是组件特例，**不**入 reset/global）
    - `text-rendering: optimizeLegibility` + `-webkit-font-smoothing: antialiased`
    - `min-height: 100vh; min-height: 100dvh`（iOS toolbar 兜底）
  - **html 顶层**：`color-scheme: light dark` + `scroll-behavior: smooth` + `hyphens: auto` + `-webkit-text-size-adjust: 100%` + `scroll-padding-top: 0`
  - **标题**：`h1-h6 { line-height: var(--leading-snug) }`（1.3，CN 大标题呼吸 · A）
  - **媒体**：`img / picture / video / canvas / svg { max-width: 100%; height: auto }`；`svg { display: block }`；`img { font-style: italic; ... shape-margin: 0.75rem }` 给 alt 文本兜底排版
  - **链接**：`a { color: var(--link); text-underline-offset: 0.2em; transition: color 200ms var(--ease-paper) }`；hover → `var(--link-hover)`
  - **选区 / 焦点**：
    - `::selection`：`color-mix(in oklch, var(--c-mimosa) 55%, transparent)` 铺底 + `var(--c-olive-ink)` 字色
    - `:focus { outline: none } :focus-visible { outline: 2px solid var(--c-sage); outline-offset: 2px; border-radius: var(--radius-sm) }`（鼠标无环 / 键盘有环 · WCAG）
  - **a11y**：`@media (prefers-reduced-motion: reduce)` 把 `*` 动画 / 过渡压到 0.01ms（保留 listener 触发），并把 html `scroll-behavior` 改回 auto
  - **❌ 严守的硬约束**（grep 通过）：0 处非零 `letter-spacing`；0 处 `vw/vh/vmin/vmax` 在 font-size；0 处 `@font-face`；0 处 `.cn-* / .latin-*` helper class（这些归 §1.1.12）
  - **CSS 变量解析顺序安全性**：reset.css 大量引用 `var(--bg)` `var(--text-body)` `var(--c-sage)` 等，由 §1.1.12 import 链下一步的 tokens.css 在 :root / @theme 提供值；CSS 变量运行时解析，声明顺序不影响最终值
  - **渐进增强**：text-spacing-trim / hanging-punctuation 在不支持的浏览器（Firefox 全系、Chromium 旧版）静默忽略，文本仍可读；现代 evergreen 全支持
  - 验证命令链：`pnpm exec prettier --check src/styles/` ✓ / `pnpm build` ✓ 0 warnings · 2 pages / `pnpm exec tsc --noEmit` ✓

- [x] 🟢 **1.1.12** 写 `src/styles/global.css`（15 min）⭐ v1.30 完成
  - **落地文件**：`src/styles/global.css`（prettier --check 过）+ `src/layouts/Base.astro` 新增 `import '@/styles/global.css'`（prettier-plugin-astro 顺手统一为双引号风格）
  - **3 行严格 import 顺序**（v1.28 收紧 → v1.30 落地）：

    ```css
    @import "tailwindcss"; /* 0：Tailwind v4 base + utilities · 必须最先（@theme 解析依赖） */
    @import "./reset.css"; /* 1：清地基（DESIGN §2.3.6 中文排版三件套挂在 body） */
    @import "./tokens.css"; /* 2：注入 CSS variables（含 :root 别名 + @theme 映射） */
    ```

    - 缺 0 → tokens.css 的 @theme 块不被 Tailwind 解析；utility 与 :root 自动注入都不会发生
    - 缺 1 → modern reset / hanging-punctuation / font-feature-settings 不生效
    - 缺 2 → reset.css / helper 引用的 var(--bg) / var(--font-\*) 全部 invalid

  - **7 个 helper class（DESIGN §2.3.8）**，每个**显式** `letter-spacing: 0`：
    | helper | font-family | extras |
    |---|---|---|
    | `.cn-kaishu` | `var(--font-cn-kaishu)` LXGW WenKai → Noto Serif SC | — |
    | `.cn-song` | `var(--font-cn-song)` Noto Serif SC → 宋体 | — |
    | `.cn-hei` | `var(--font-cn-sans)` Noto Sans SC → 黑体 | DESIGN class 名沿用"黑体"简称 |
    | `.cn-mashan` | `var(--font-cn-mashan)` Ma Shan Zheng → LXGW WenKai | font-display: optional + JS prewarm |
    | `.latin-italic` | `var(--font-cormorant)` | font-style: italic; font-weight: 300 |
    | `.latin-roman` | `var(--font-cormorant)` | font-style: normal; font-weight: 400 |
    | `.latin-mono` | `var(--font-inter)` | font-feature-settings: "tnum" 1; font-variant-numeric: tabular-nums lining-nums |
  - **设计原则**：helper 只设字族 / style / weight / 必需 OpenType feature；**不**设字号、行高、颜色、margin（这些由调用处的语义层 / 组件层叠加）
  - **dist CSS 运行时证据**（首次把 token 系统接进生产 root，验收路径 `dist/_astro/Base.*.css`）：
    - 12 个 OKLCH 色 + 27 个 `--text-*` token 全部到位（mobile @layer theme + tablet/desktop top-level @media）
    - 12 个 `--c-*` 别名活跃（`:root{--c-sage:var(--color-sage);...}`）
    - DESIGN §2.3.6 中文排版三件套挂在 body（text-spacing-trim / hanging-punctuation / font-feature-settings: "kern" 1, "halt" 1）
    - 夜读 `@media(prefers-color-scheme:dark)` 仅切色板与阴影，**0 处** `--text-*`
    - `::selection` 用 `@supports (color:color-mix(in lab,red,red))` 包裹（自动渐进增强）
    - 7 helper class 全部 `letter-spacing:0`
  - **级联正确性**（v1.30 关键洞察）：Tailwind `@theme` → `@layer theme`（低优先级），mobile 默认在该层；
    tokens.css 的顶级 `:root` 与 `@media` 覆写**不在任何 @layer 内**（高优先级），所以 tablet/desktop 档总是赢过 mobile `@layer theme` 默认 → DESIGN §2.3.5 v2.21 三档表能正确切档
  - 验证命令链：`pnpm exec prettier --check src/styles/` ✓ / `pnpm exec prettier --plugin=prettier-plugin-astro --check src/layouts/Base.astro` ✓ / `pnpm build` ✓ 0 warnings · 2 pages / `pnpm exec tsc --noEmit` ✓

#### 5.1.4 Layout 与基础组件

- [x] 🟢 **1.1.13** 写 `src/layouts/Base.astro`（30 min）⭐ v1.31 完成
  - **落地文件**：`src/layouts/Base.astro` v0.3 → v0.4（prettier-plugin-astro --check 过 · build 0 warnings）
  - **完整 SEO meta**：charset / viewport(viewport-fit=cover) / generator / title / description / robots(条件) / **canonical**(`new URL(Astro.url.pathname, Astro.site).href`)
  - **双态 theme-color**：`(prefers-color-scheme: light)` → `#FAF6EC` paper · `(dark)` → `#1F2118` paper-night；让 iOS / Android 浏览器顶栏跟随主题
  - **`color-scheme: light dark`** 元标签（与 reset.css `html { color-scheme: light dark }` 协同）
  - **Open Graph 10 条**：type/title/description/url/image/image:width/image:height/image:alt/locale/site_name；图源经 `cdnUrl('primary', 'misc', 'og/og-cover-1200x630.jpg')` 由 asset-versions.ts 集中接缝
  - **Twitter card 4 条**：summary_large_image + 标题 / 描述 / 图（与 OG 共用）
  - **JSON-LD `SocialEvent` schema**：完整婚礼信息（日期 / 地点 / 主持人 / eventStatus / eventAttendanceMode）以 `<script type="application/ld+json" set:html={JSON.stringify(eventSchema)}>` 注入
  - **新增 Prop `ogImage?`**：让单页可覆盖默认 OG 图（未来 Cover/Story/Cats 章节使用）
  - **favicon**：svg 主 + ico alternate（兜底老浏览器）
  - **保留**：FontFaces 单一源 + 2 条 base-aware preload + noindex Prop（dev-fonts 双重防护）
  - dist/index.html 运行时证据：31 条 head meta + 1 条 JSON-LD payload；dev-fonts noindex 仍生效；sitemap 仍排除 dev-fonts

- [ ] 🟢 **1.1.13a** 重做正式 OG 分享图（45 min）⭐ v1.23 新增
  - 用 Sharp + SVG 合成 `dist/misc/og/og-cover-1200x630.jpg`
  - 左侧：邀请函 part_1 缩略，保持原始像素密度
  - 右侧主句：**杨倚天 & 希尔娜依**
  - 副文案：**诚邀构成我们生命不同经纬的你，共同见证这份回忆的开始。**
  - 下方：新人名字 + 二〇二六年六月十四日 · 晚七点
  - 合成后走 `VERSION=1.1.1 pnpm push:cdn` 仅更新 misc/OG（patch 在当前 misc v1.1.0 之上 · v1.43 修订：之前写 v1.0.1 是基于 v1.42 之前 misc 还在 v1.0.0 的旧基线；v1.42 后 misc 已经 v1.1.0，再发 v1.0.1 反而 < 当前版本，会让回滚定位混乱）；主仓 `asset-versions.ts` 中 `misc` tag 同步改到 `v1.1.1`

- [x] 🟢 **1.1.13b** 写 `src/lib/images/asset-versions.ts`（15 min）⭐ v1.31 完成（v1.5 集中接缝契约落地）

  ```ts
  // src/lib/images/asset-versions.ts
  // 资产仓 tag 集中维护——这是 §15.1 回滚的唯一接缝。
  // 紧急回滚时只需把出问题的那一行改回旧 tag，git push 即可。
  export const ASSET_VERSIONS = {
    "snow-a": "v1.0.0",
    "snow-b": "v1.0.0",
    grassland: "v1.0.0",
    "wooden-door": "v1.0.0",
    pearl: "v1.0.0",
    retro: "v1.0.0",
    misc: "v1.0.0",
  } as const;

  export type CdnTarget = keyof typeof ASSET_VERSIONS;

  /** 构建 jsDelivr 或 Statically 的资产 URL。
   *  所有 <CdnImage>、<CdnEarlyProbe> 都必须经由此 helper，禁止硬编码 @vX.X.X。 */
  export function cdnUrl(
    host: "primary" | "backup",
    target: CdnTarget,
    path: string,
  ): string {
    const version = ASSET_VERSIONS[target];
    const owner = "YiTiane";
    const repo = `fb-cdn-${target}`;
    const base =
      host === "primary"
        ? `https://cdn.jsdelivr.net/gh/${owner}/${repo}@${version}`
        : `https://cdn.statically.io/gh/${owner}/${repo}@${version}`;
    return `${base}/${path}`;
  }
  ```

- [x] 🟢 **1.1.13c** 写 `scripts/build-time-check.ts` + 接 `prebuild` hook（25 min）⭐ v1.31 完成（v1.7 契约落地）
  - **目的**：每次主仓 `pnpm build` 前，遍历 `ASSET_VERSIONS` 校验每个 target 的 `probe.png` 真的 200。
    任何资产 tag 写错 / 仓未发 tag → build 立即失败，而不是上线后客户看到 404。
  - 完整可执行实现（v1.8：双 CDN 检测，仅当 primary+backup 都失败才 fail，单边失败仅 warn）：

    ```ts
    // scripts/build-time-check.ts
    import { ASSET_VERSIONS, cdnUrl } from "../src/lib/images/asset-versions";

    if (process.env.SKIP_BUILD_CHECK === "1") {
      console.log("[build-time-check] SKIP_BUILD_CHECK=1, 跳过");
      process.exit(0);
    }

    const targets = Object.keys(
      ASSET_VERSIONS,
    ) as (keyof typeof ASSET_VERSIONS)[];

    async function probe(
      host: "primary" | "backup",
      target: string,
    ): Promise<{ ok: boolean; msg: string }> {
      const url = cdnUrl(host, target as any, "probe.png");
      try {
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
          // 双 CDN 都挂——必须 fail，运行时 fallback 也救不回来
          failures.push(
            `${target}: 双 CDN 均失败\n        primary: ${p.msg}\n        backup:  ${b.msg}`,
          );
        } else if (!p.ok) {
          // 主 CDN 抖动但备 CDN 健康——前端运行时 fallback 仍能加载，build 不挂
          warnings.push(`${target}: primary 失败但 backup 正常 (${p.msg})`);
        } else if (!b.ok) {
          warnings.push(`${target}: backup 失败但 primary 正常 (${b.msg})`);
        }
      }),
    );

    if (warnings.length) {
      console.warn(
        "[build-time-check] ⚠️ 单边 CDN 失败（不阻塞 build，但建议 5–15 min 后复查）：",
      );
      warnings.forEach((w) => console.warn("  ⚠", w));
    }

    if (failures.length) {
      console.error("\n[build-time-check] ❌ 双 CDN 均失败，build 中止：");
      failures.forEach((f) => console.error("  ✗", f));
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

    // v1.12：成功文案根据 warnings 是否存在条件化输出
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
    ```

  - 接到主仓 `package.json` 的 `prebuild` hook：
    ```json
    {
      "scripts": {
        "prebuild": "tsx scripts/build-time-check.ts",
        "build": "astro build"
      }
    }
    ```
  - **跳过开关**（已写入脚本头部，仅本地开发紧急用）：
    ```bash
    SKIP_BUILD_CHECK=1 pnpm build
    ```
    CI 永远不传 SKIP_BUILD_CHECK，保证生产 build 必跑 sanity check
  - **验收**：在 §1.1.25 push 触发首次部署前，本地手动跑一次 `pnpm prebuild`，期望以 `✅` 结束（无 warning 时输出"双 CDN 健康"，有单边 warning 时输出"至少一侧 CDN 可用，N 项单边 warning"）；只要不是 `❌` 即视为通过

- [x] 🟢 **1.1.14** 写 `src/lib/images/cdn-fallback.ts`（45 min）⭐ v1.32 完成
  - **落地文件**：`src/lib/images/cdn-fallback.ts` v0.1（prettier --check 过 · tsc 过）
  - **定位**：诊断 / 单元测试用途；线上 fallback 路径由 §1.1.15 `CdnEarlyProbe.astro` head inline 脚本完成
  - 导出 2 个 helper：
    - `pickCDN(): Promise<'primary' | 'backup'>` —— Promise.any 在 jsDelivr / Statically 间竞速；全失败退回 'primary'
    - `probeCdnDetailed(): Promise<CdnProbeReport>` —— 双 CDN 状态详情报告（status / error），故障演练用
  - **守卫齐全**（DESIGN §7.5 v2.5 / v2.7 / v2.8 沿用）：
    - AbortController 不支持的极旧浏览器（IE / iOS 12-）→ 直接返回 'primary'
    - fetch 构造阶段 try/catch（防 SecurityError 等同步抛错穿透 Promise.any）
    - 全失败 catch → 返回 'primary'，运行时 <img onerror> capture 监听器接管
  - **probe URL** 经 `cdnUrl('primary'|'backup', 'misc', 'probe.png')`，misc 仓 tag 切换同步生效

- [x] 🟢 **1.1.15** 写 `src/components/CdnImage.astro`（60 min）⭐ v1.32 完成（v1.2 集成模型 / v1.4 cdnTarget 接口落地）

  > **关键澄清**：Astro 组件在**构建时**渲染，浏览器侧 `fetch probe` 完全不可能在 HTML 生成前确定 srcset。v2.3 PLAN 说"内部按 cdn-fallback 决定 base URL"是工程上不可行的——会被静态构建固化成主 CDN，failover 沦为摆设。
  >
  > **v1.2 选定的集成方式：方式 C（早期内联 script）+ 方式 A（onerror 兜底）双保险**。

  **构建时**：组件输出的 `<picture>` 各 `<source>` 只用**主 CDN（jsDelivr）的 srcset**（构建时常量），并给每个 `<source>` 加 `data-srcset-alt` 含备 CDN（Statically）的 srcset。

  **运行时**（v1.3 强化：可重入 + DOM ready + 单图兜底 + picture sources 同步重写）：

  ```astro
  ---
  // src/components/CdnEarlyProbe.astro · 由 Base.astro 在 <head> 末尾内联
  import { cdnUrl, ASSET_VERSIONS } from "@/lib/images/asset-versions";
  // ⭐ v1.5 用 define:vars 把构建时常量带进 inline script，不再硬编码 @v1.0.0
  const probeUrl = cdnUrl("primary", "misc", "probe.png");
  ---

  <script is:inline define:vars={{ probeUrl }}>
    (function () {
      var fallbackApplied = false;

      /**
       * 把 picture 内所有 <source> 与下方 <img> 一起切到备 CDN。
       * 可重入（多次调用幂等）：所有 [data-srcset-alt] / [data-src-alt] 一次性消费。
       */
      function applyCdnFallback(scope) {
        var root = scope || document;
        // <source srcset> 必须先于 <img> 重写——picture 选择器优先级以 source 为先
        root.querySelectorAll("source[data-srcset-alt]").forEach(function (s) {
          s.setAttribute("srcset", s.getAttribute("data-srcset-alt"));
          s.removeAttribute("data-srcset-alt"); // 标记已消费，避免重复
        });
        root.querySelectorAll("img[data-src-alt]").forEach(function (img) {
          img.setAttribute("src", img.getAttribute("data-src-alt"));
          img.removeAttribute("data-src-alt");
        });
      }

      /**
       * 全局触发：probe 失败时整页一次性切换。
       * 注意 DOM 时序——probe 可能比 <body> 还早完成，要等 DOMContentLoaded。
       */
      function triggerGlobalFallback() {
        if (fallbackApplied) return;
        fallbackApplied = true;
        if (document.readyState === "loading") {
          document.addEventListener("DOMContentLoaded", function () {
            applyCdnFallback();
          });
        } else {
          applyCdnFallback();
        }
      }

      /**
       * 单图兜底：任何 <img> 加载失败时，**只切换它所在的 picture**，
       * 不影响其他还能正常加载的图片。capture 阶段才能捕获到 <img> 的 error 事件。
       */
      document.addEventListener(
        "error",
        function (e) {
          var img = e.target;
          if (
            !img ||
            img.tagName !== "IMG" ||
            !img.hasAttribute("data-src-alt")
          )
            return;
          var pic = img.closest("picture");
          if (pic) applyCdnFallback(pic);
          else applyCdnFallback(img.parentNode || document);
        },
        /* useCapture */ true,
      );

      /**
       * 主 CDN 健康探测。用 AbortController + setTimeout（不用 AbortSignal.timeout，
       * 后者在 iOS 15- / 老 WebView 不支持，会在 fetch 前抛 TypeError）。
       */
      // probeUrl 由 Astro define:vars 注入，已包含 ASSET_VERSIONS['misc'] 的当前 tag
      try {
        var ctrl = new AbortController();
        var timer = setTimeout(function () {
          ctrl.abort();
        }, 2000);
        fetch(probeUrl, {
          method: "HEAD",
          cache: "no-store",
          signal: ctrl.signal,
        })
          .then(function (r) {
            clearTimeout(timer);
            if (!r.ok) throw new Error("HTTP " + r.status);
            // 主 CDN 健康——但仍有可能某张图就是 404，靠 onerror 兜底
          })
          .catch(function () {
            clearTimeout(timer);
            triggerGlobalFallback();
          });
      } catch (e) {
        // AbortController 都不支持的极端环境（IE 等）：直接走全局 fallback
        triggerGlobalFallback();
      }
    })();
  </script>
  ```

  **三层防御**：
  1. **probe**：HTTP HEAD 探测主 CDN，失败 → `triggerGlobalFallback`（全页一次性切）
  2. **`<img onerror>`（capture 监听）**：单图加载失败时只切换该 `<picture>`，不波及其他图
  3. **picture sources 同步**：`<picture>` 中浏览器选择优先级是 source > img，重写时 source 必须先于 img

  **这样实现的好处**：
  - HTML 静态可缓存、可 SSR、可 prerender
  - 主 CDN 健康时零额外 JS 开销
  - 主 CDN 全局故障：一次 HEAD + 一次 srcset 重置（即使 probe 比 DOM 还早完成也不漏）
  - 单图故障：仅该 picture 内重置（其他图保持主 CDN 缓存命中）
  - 老浏览器 (`AbortController` 不存在)：直接走全局 fallback，不会因 `AbortSignal.timeout` 不存在而崩溃

  **API 契约（v1.4 修订：cdnTarget + stem 支持子路径）**：

  > **命名**：以前的 `series` prop 名带歧义（与 garden 系列的 `series.id="garden"` 冲突——会拼出不存在的 `fb-cdn-garden`）。
  > 同时，misc 仓含 `cat/`、`invitation/`、`map/` 等子路径，旧 stem 不能表达。
  > **v1.4 起**：prop 改名为 `cdnTarget`（与 DESIGN.md §3.2 双双表的 `series.cdnTarget` 字段同义），并允许 `stem` 含 `/` 子路径。

  ```astro
  ---
  // src/components/CdnImage.astro
  import { cdnUrl, type CdnTarget } from "@/lib/images/asset-versions"; // ⭐ v1.5 集中版本

  interface Props {
    /** CDN 资产仓名（与 DESIGN §3.2 双双表里的 series.cdnTarget 字段一致）。
     *  注意：对 garden 系列，调用者必须传 'grassland'，不是 'garden'。 */
    cdnTarget: CdnTarget;

    /** 派生品文件 stem，**可含子路径**。例：
     *    - 'Snow_01'                 (cdnTarget='snow-a')
     *    - 'Grassland_03'             (cdnTarget='grassland')
     *    - 'cat/berry-portrait'       (cdnTarget='misc')
     *    - 'invitation/part_1'        (cdnTarget='misc')
     *  禁止前后斜杠，禁止扩展名，禁止尺寸后缀。 */
    stem: string;

    sizes: string;
    alt: string;
    priority?: "high" | "low" | "auto";
    widths?: number[]; // 默认 [320,640,1024,1600,2400,3840]
  }
  const {
    cdnTarget,
    stem,
    sizes,
    alt,
    priority = "auto",
    widths = [320, 640, 1024, 1600, 2400, 3840],
  } = Astro.props;

  // ⭐ 构建时常量基址 —— 经由 cdnUrl helper，自动读取 ASSET_VERSIONS[cdnTarget]
  // 永远禁止硬编码 @v1.0.0；要回滚就改 src/lib/images/asset-versions.ts 一行
  const JPG_WIDTHS = widths.filter((w) => w <= 1600); // JPG fallback 仅到 1600w（DESIGN §7.4）
  const buildSrcset = (
    host: "primary" | "backup",
    fmt: "avif" | "webp" | "jpg",
  ) => {
    const ws = fmt === "jpg" ? JPG_WIDTHS : widths;
    return ws
      .map(
        (w) => `${cdnUrl(host, cdnTarget, `${fmt}/${stem}-${w}.${fmt}`)} ${w}w`,
      )
      .join(", ");
  };
  const primaryJpg = cdnUrl("primary", cdnTarget, `jpg/${stem}-1600.jpg`);
  const backupJpg = cdnUrl("backup", cdnTarget, `jpg/${stem}-1600.jpg`);
  ---

  <picture>
    <source
      type="image/avif"
      srcset={buildSrcset("primary", "avif")}
      data-srcset-alt={buildSrcset("backup", "avif")}
      sizes={sizes}
    />
    <source
      type="image/webp"
      srcset={buildSrcset("primary", "webp")}
      data-srcset-alt={buildSrcset("backup", "webp")}
      sizes={sizes}
    />
    <img
      src={primaryJpg}
      data-src-alt={backupJpg}
      alt={alt}
      loading={priority === "high" ? "eager" : "lazy"}
      decoding="async"
      fetchpriority={priority}
    />
    {
      /* 注意：不用写 onerror 内联属性，CdnEarlyProbe.astro 的全局 capture 监听器 */
    }
    {/* 已在 document 层捕获所有 img.error，按 picture 范围切换 srcset */}
  </picture>
  ```

  **调用方约定**：
  - 系列照（snow / garden / wooden-door / pearl / retro）：

    ```astro
    <CdnImage cdnTarget={series.cdnTarget} stem={photo.stem} ... />
    ```

    `series.cdnTarget` 来自 `src/content/series/{garden,...}.json` 中显式声明的字段（不是 `series.id`）。

  - 邀请函：`<CdnImage cdnTarget="misc" stem="invitation/part_1" ... />`
  - 三只猫：`<CdnImage cdnTarget="misc" stem="cat/berry-portrait" ... />`

  **此契约要求 generate-derivatives.ts 输出 format-first 树**，并在 misc 仓里保留 stem 的子路径——见下文 dist 树修订。

  ```

  > **v1.2 取舍说明**：原 v1.0/v1.1 想用"hydrated React 组件"，但需要全站岛屿化所有图片，构建产物 +50KB JS、首屏受影响。
  > 当前方案在主路径零 JS、failover 路径仅 ≤ 1KB 内联 script，工程权衡更优。
  > 备 CDN（Statically）已被 cdn-fallback.ts 单元测试验证可用（详见 DESIGN.md §7.5）。
  ```

#### 5.1.5 内容 schema

> 🔗 [DESIGN.md §12 src/content/](DESIGN.md)

- [x] 🟢 **1.1.16** 写 `src/content.config.ts`（30 min）⭐ v1.32 完成 · **Astro v6 强制位置修正**
  - **落地文件**：`src/content.config.ts`（**注意：v6 起在 src/ 下而非 src/content/ 内**；旧 PLAN 写 `src/content/config.ts` 是 v4 命名，v6 触发 `LegacyContentConfigError`）
  - 5 个 Collections：`meta` / `story` / `journey` / `cats` / `series`，全部用 `glob({ pattern, base })` loader
  - **`series.cdnTarget` 是 zod enum**，通过 `as const satisfies readonly CdnTarget[]` 与 `src/lib/images/asset-versions.ts` 的 7 个 target 编译期对齐
  - **`meta` 只 glob `wedding.json`**（couple.json 是私有联系信息，不入构建产物 · DESIGN §12）
  - **`journey` 用 `.refine()` 兼容**：long-distance.json `{from, to}` 形态 与 cities.json `{cities[]}` 形态二选一
  - **`coords.gcj02 / bd09` 允许 null**（Phase 6 由 expand-coords.ts 写入）
  - **`stem` 字段** regex 校验禁止前后斜杠
  - 验证：astro `[types] Generated 271ms` · tsc 通过 · 类型 `.astro/types.d.ts` 已自动注入

- [x] 🟢 **1.1.17** 填入 `src/content/meta/wedding.json`（10 min · v1.2 三坐标系结构）⭐ v1.34 完成

  ```json
  {
    "groom": "杨倚天",
    "bride": "希尔娜依",
    "date": "2026-06-14T19:00:00+08:00",
    "venue": {
      "cn": "新疆乌鲁木齐市 · 二道桥大剧院",
      "cn_short": "二道桥大剧院",
      "address_cn": "新疆维吾尔自治区乌鲁木齐市天山区解放南路（待补全门牌）",
      "address_en": "Erdaoqiao Grand Theater, Tianshan District, Urumqi, Xinjiang, China",
      "coords": {
        "wgs84": { "lng": 87.6283, "lat": 43.7689 },
        "gcj02": { "lng": null, "lat": null },
        "bd09": { "lng": null, "lat": null }
      }
    },
    "poem": "我们无法判断一个瞬间的价值，直至它变成回忆。\n愿有岁月可回首，且以深情共白头。\n诚邀构成我们生命不同经纬的你，共同见证这份回忆的开始。"
  }
  ```

  > ⚠️ **gcj02 / bd09 在 1.1.17 阶段保持 `null`**——会在 Phase 6 经纬度真实校准后由 `scripts/expand-coords.ts` 一次性算出并写入。
  > 在此之前，地图深链按钮**只渲染 Apple/Google**，等 Phase 6 完成才显示高德/百度。
  > 这条规则强制在 `src/components/DetailsMap.tsx` 中：`if (!coords.gcj02.lng) hide(amapButton)`。

- [x] 🟢 **1.1.18** 填入 `src/content/story/anchor.json`（5 min）⭐ v1.34 完成

  ```json
  {
    "date": "2019-01-27",
    "place": { "cn": "重庆 · 西南大学", "lat": 29.8161, "lng": 106.4253 },
    "caption": "我们相恋于此。"
  }
  ```

- [x] 🟢 **1.1.19** 填入 `src/content/journey/long-distance.json`（10 min）⭐ v1.34 完成
  - 仅落地 `long-distance.json`（乌鲁木齐 → 墨尔本 · distanceKm: 10755 · seed-text 一致）
  - **不**写 `cities.json`（v1.21+ 已删除可见 5 城 JourneyMap，schema 用 .refine() 兼容缺省）

- [x] 🟢 **1.1.20** 填入 `src/content/cats/family.json`（5 min · DESIGN.md §4 wireframe 文案稿）⭐ v1.34 完成
  - 3 只猫（Berry / 荔枝 / 小宝），每只含 portrait + gallery（共 8 张 stems）
  - 文案严格采用 seed-text.ts CATS 段落（Berry 翻肚皮 / 荔枝把自己照顾得超级好 / 小宝最粘人）
  - 所有 stems 经 misc/cat/ 真实清单交叉验证（berry-portrait/-belly/-bag · lizhi-portrait/-petting · xiaobao-portrait/-naptime/-blue-eyes）

- [x] 🟢 **1.1.21** 填入 `src/content/series/{snow,garden,wooden-door,pearl,retro}.json`（30 min）⭐ v1.34 完成（schema v0.3 增强 photo 级 cdnTarget override）
  - 每个含：`id`、`cdnTarget`（资产仓名映射）、`photos[]`（含 stem 名）、`caption`、`subtitle`、`quote`
  - **garden.json 必填** `"cdnTarget": "grassland"`（命名收敛唯一接缝，DESIGN §3.2）✓
  - **photos[].stem 必为原始文件 stem**（如 `Grassland_01`、`Snow_01`），派生品 URL 由 stem + 尺寸拼出 ✓
  - **snow 系列跨双仓拆分**：jsDelivr 单仓 150MB 红线下，snow.json 用 `series.cdnTarget="snow-a"` + 后 7 张 photo 级 `cdnTarget="snow-b"` 覆写，**保留 snow.json 单文件**结构（DESIGN §3.2 一致性）
  - 35 张 stems 全部经 stemSchema（v1.33 收紧）严格校验通过 + 经 GitHub API 实际仓清单交叉验证（每 stem 都对应真实派生品）
  - photo-level cdnTarget override 字段在 src/content.config.ts v0.3 落地

#### 5.1.5b 归档地图资产验收 ⭐ v1.22 修订

> v1.21 起第一章已经删除可见的中国 5 城 JourneyMap。`china-cities.json` 与
> `china-journey-2560x1800.png` 只作为 Phase 0 归档资产保留，不再进入主仓 `src/content/`，
> 也不作为前端实施前置。

- [x] 🟢 **1.1.21a** 确认旧 5 城地图仅留在归档仓（3 min）⭐ v1.35 完成
  - `~/projects/forever-begins-archive/dist/misc/map/china-journey-2560x1800.png` ✓ 存在
  - `~/projects/forever-begins-archive/dist/main-content/journey/china-cities.json` ✓ 存在

  ```bash
  cd ~/projects/forever-begins-archive
  test -f dist/misc/map/china-journey-2560x1800.png
  test -f dist/main-content/journey/china-cities.json
  ```

- [x] 🟢 **1.1.21b** 确认主仓没有恢复 JourneyMap 内容入口（3 min）⭐ v1.35 完成
  - `src/content/journey/china-cities.json` ✓ 不存在
  - 全 src/ 无 JourneyMap 组件 / 5 城列表代码依赖
  - `china-cities` 字面仅出现在 src/content.config.ts 注释（line 32）作为 v1.22 收敛说明，无 import / load / 文件依赖

  ```bash
  cd ~/projects/forever-begins
  test ! -f src/content/journey/china-cities.json
  rg -n "JourneyMap|走过的城市|重庆|杭州|北京|上海|威海" src || true
  ```

  期望：没有 `JourneyMap` 组件、没有 5 城列表。若后续需要展示地理高潮，只实现 §7.1.3 的
  `GlobeDistanceScene`。

- [x] 🟢 **1.1.21c** 保留 `sync:main` 为历史排查工具，不作为施工步骤（0 min）⭐ v1.35 完成
  - 主仓 package.json **无** sync:main script ✓
  - 归档仓 package.json 保留 sync:main（历史排查工具，不日常运行）
  - `MAIN_REPO_PATH` env 未设
  - 不设置 `MAIN_REPO_PATH`
  - 不运行 `pnpm sync:main`
  - 不把 `china-cities.json` commit 进主仓

#### 5.1.6 部署管道

- [x] 🟢 **1.1.22** 写 `.github/workflows/deploy.yml`（15 min · DESIGN.md §11.2）⭐ v1.35 完成
  - 落地文件：`.github/workflows/deploy.yml` · YAML 通过 python3 yaml.safe_load 解析校验
  - 触发：push main / workflow_dispatch · permissions: contents:read pages:write id-token:write
  - jobs.build: checkout@v4 → pnpm/action-setup@v3 → setup-node@v4 (node 22, cache pnpm) → install --frozen-lockfile → pnpm build → upload-pages-artifact@v3
  - jobs.deploy: environment=github-pages · deploy-pages@v4 · 输出 page_url
  - **prebuild hook 自动跑 build-time-check.ts**：双 CDN 抖动单边 warn / 双败 exit 1
  - CI 不传 SKIP_BUILD_CHECK，确保生产 build 必跑 sanity check

- [x] 🟢 **1.1.23** 写一个最小 `src/pages/index.astro`（5 min）⭐ v1.37 现状保留 · **不回退到下方 spec 的最小 h1 示例**
  - 原 spec 给的是 `<Base title="Forever Begins"><h1>Forever Begins</h1></Base>` 极简示例（v1.0 阶段冒烟用）
  - 当前 `src/pages/index.astro` 已是 v0.2 占位 Cover（welcome / 大字 hero / 新人名 / 时间地点 / 诗句），**仅用 2 个 preload 字体** 兑现 188KB 字体预算；已上线 https://yitiane.github.io/forever-begins/ 验证 HTTP 200 + 渲染正常
  - **决策**：保留 v0.2 占位 Cover 不动；§1.1.23 spec 的最小 h1 示例属"v1.0 时代示例"，已被实际 Cover 占位**自然超越**
  - Phase 2 §0 Cover 实装时会把这一占位整体重写为带邀请函水彩 + parallax 的真 Cover；在那之前 v0.2 占位是上线 ready 的状态
  - 审计可校验：`curl https://yitiane.github.io/forever-begins/` 看到的 HTML 正是 v0.2 占位 Cover 的渲染输出

  ```astro
  ---
  import Base from "@/layouts/Base.astro";
  ---

  <!-- 原 spec 提供的示例（v1.0 时代冒烟）—— 不实施，仅作为 PLAN 历史归档 -->
  <Base title="Forever Begins">
    <h1>Forever Begins</h1>
  </Base>
  ```

- [x] 🔵 **1.1.24** 在 GitHub Settings → Pages 启用 Pages from Actions（5 min）⭐ v1.36 完成
  - 通过 **gh API** 代手动启用：`gh api -X POST repos/YiTiane/forever-begins/pages -f build_type=workflow`
  - 实证 gh CLI token 的 `repo` scope 已含 Pages admin 权限，无需用户登 GitHub 网页 UI
  - 当前状态：`build_type: "workflow"` · `source: { branch: "main", path: "/" }` · `https_enforced: true`

- [x] 🟢🔵 **1.1.25** push 触发首次部署（15 min · 等 CI）⭐ v1.36 完成
  - CI 引导期遇到 2 个 P1 修复：① pnpm/action-setup 缺 version → 加 packageManager 字段；② lockfile v9 与本地外层 pnpm 8.11.0 不兼容 → packageManager 改为 9.15.9（与真实写 lockfile 的 Node 22 内层 pnpm 一致）
  - 第 4 次跑（25432948466 · 74202ef）build 25s + deploy 11s 全绿；artifact `github-pages` 上传成功

- [x] 🔵 **1.1.26** 浏览器打开 `https://YiTiane.github.io/forever-begins/` 验证显示 "Forever Begins"（5 min）⭐ v1.36 完成（curl 替代浏览器）
  - HTTP 200 · 10650 bytes · 0.39s
  - title 含「杨倚天 & 希尔娜依」 · body 含 "Forever Begins"
  - canonical / og:image / JSON-LD SocialEvent / CdnEarlyProbe 全在
  - sitemap-0.xml 也 200，只含根页
  - 实际访问入口：https://yitiane.github.io/forever-begins/

### 5.2 Phase 1 验收清单 ⭐ v1.38 全部 [x] · Phase 1 实施完毕

- [x] **Astro + React + Tailwind v4 + TypeScript 跑通**
  - `package.json`：astro ^6.2.2 · react ^19.2.5 · tailwindcss ^4.2.4 · @astrojs/react ^5.0.4 · typescript ^6.0.3 · packageManager `pnpm@9.15.9`
  - `pnpm exec tsc --noEmit` ✓ · `pnpm build` ✓ 0 errors / 0 warnings · 2 pages built / 1.14s
- [x] **8 个字体 subset woff2 已生成且首屏 preload < 200 KB**
  - 实测 `public/fonts/`：8 个 woff2 总计 **818 KB**
  - 首屏 preload 2 个（cormorant-italic 47KB + noto-serif-sc-light 139KB）= **186 KB · < 200KB 目标** ✓
  - 其余 6 个走 `@font-face + font-display: swap` 自然加载
- [x] **tokens.css 完整含色板 / 字号 / 间距**（DESIGN §2.2 / §2.3.5 v2.21 / §2.5）
  - 12 个 OKLCH `--color-*`（@theme 内）+ 12 个 `--c-*` DESIGN 别名（:root 内）一一对应
  - 27 个 `--text-*` 字号 token（mobile 10 + tablet 10 + desktop 7，三档纯 rem · 0 个 vw）
  - 4 个 `--leading-*` · 4 个 `--radius-*` · 5 个 `--shadow-*`
  - `--spacing` 4px base + section-md/lg + 4 个 `--container-*`
- [x] **#4a CdnImage 编译级 gate**（v1.38 完成）
  - `src/components/CdnImage.astro` v0.2 · build-time 编译过 · tsc 类型过 · prettier 过
  - 输出 `<picture>` AVIF/WebP/JPG 三层 srcset · primary jsDelivr 主 + backup Statically 通过 data-srcset-alt 携带
  - JPG fallback 用 `Math.max(...JPG_WIDTHS)`（v1.33 修） · widths 无 ≤1600 时构建期 throw
- [x] **#4b CdnImage runtime gate**（v1.40 收口 · v1.41 证据更新）
  - `src/components/Cover.astro` v0.2 接入 `<CdnImage cdnTarget="misc" stem="invitation/part_1" widths={[320, 640]} width={800} height={1200} priority="high">`，src/pages/index.astro v0.3 渲染 Cover
  - **dist + 线上 HTML 都包含**：1 `<picture>` + 1 AVIF `<source>` + 1 WebP `<source>` + 1 JPG `<img>` 兜底，`<img width="800" height="1200">` aspect-ratio 几何预留（CLS = 0）
  - 渲染出的 srcset URL：**2 个真宽度** × jsDelivr (primary) + 2 个真宽度 × Statically (backup)；
    AVIF/WebP/JPG 三族都仅含 320 / 640 两挡 ≤ 源宽 800w（v1.40 P2 修：从 v1.39 的 6 挡收敛，
    去掉 misc@v1.0.0 谎报为 1024/1600/2400/3840w 但实际 800w 同一文件的 4 个谎报挡）
  - JPG 兜底取 `Math.max(...JPG_WIDTHS) = 640`（CdnImage v0.3 自动跟随 widths 收敛）
  - **CLS 几何预留**：`<img width="800" height="1200">` → 浏览器自动推 `aspect-ratio: 2/3` + CSS `height: auto + width: 100%` 在图片解码完成前就 reserve 完整版心，下方 welcome / hero / 新人 / 时间地点 / 诗句 不会因 image decode 而 reflow
  - **真实抽样**：jsDelivr -320/-640 (avif/webp/jpg) 全 200；Statically 全 301 → 200（透明 redirect）
  - 线上拉 -320.avif `file` 识别为 `ISO Media, AVIF Image`（真 AVIF，非 404 错误页）
  - 验证 git ref：`d211593` · CI run [25435566475](https://github.com/YiTiane/forever-begins/actions/runs/25435566475) success
  - ✓ **misc v1.1.0 republish 完成（v1.42）**：archive `e86ee9b` push:cdn 跑成功，7 仓全部 v1.1.0 tag；主仓 `170f706` bump asset-versions.ts misc → v1.1.0 + Cover widths [320,640,800]；CI run [25437603893](https://github.com/YiTiane/forever-begins/actions/runs/25437603893) success；线上 HTML AVIF srcset 含 part_1-{320,640,800}，`<img src=...part_1-800.jpg width="800" height="1200">`，jsDelivr 拉 -800.avif `file` 识别 `ISO Media, AVIF Image` 241753 bytes（真 800w）
- [x] **`src/lib/images/asset-versions.ts` + `cdnUrl()` 已实装**（DESIGN §15.1 唯一回滚接缝）
  - 7 个 ASSET_VERSIONS（snow-a / snow-b / grassland / wooden-door / pearl / retro / misc 全 v1.0.0）
  - `cdnUrl(host, target, path)` 支持 primary (jsDelivr) / backup (Statically)
  - 类型 `CdnTarget = keyof typeof ASSET_VERSIONS` · 通过 `as const satisfies` 与 src/content.config.ts `CDN_TARGETS` enum 一致性锁
- [x] **`pnpm prebuild` 通过**——build-time-check 7 仓双 CDN 健康
  - 实测：`[build-time-check] ✅ 全部 7 个资产仓双 CDN 健康`
  - 双败 → exit 1 (CI fail) · 单边 → ⚠ warn (不阻塞) · 双 OK → ✅
  - SKIP_BUILD_CHECK 仅本地紧急用 · CI 永不传
- [x] **`src/content/` JSON 已填实际数据**（v1.34 + v1.35 cleanup）
  - 9 个 entry：meta/wedding · story/anchor · journey/long-distance · cats/family · series ×5（snow/garden/wooden-door/pearl/retro）
  - 35 个系列 stem + 8 个猫 stem + 2 个邀请函 stem **经 GitHub API 真实仓清单交叉验证**（每个 stem 对应真实派生品）
  - `china-cities.json` 不在主仓 ✓
  - 全部经 stemSchema（v1.33 收紧）通过：禁前后斜杠 / 禁扩展名 / 禁 -<width> 尺寸后缀
- [x] **主仓未恢复 JourneyMap / china-cities.json / 5 城列表**（v1.22 收敛 · §1.1.21b 验收）
  - `src/content/journey/china-cities.json` 不存在 ✓
  - `rg JourneyMap src/` 0 hit ✓
  - "china-cities" 字面仅出现在 `src/content.config.ts` line 32 的 v1.22 收敛说明注释，无 import / load
  - 地理高潮专由 `GlobeDistanceScene`（Phase 3 §3.1.6）承担
- [x] **GitHub Pages 部署管道一次跑绿**
  - 成功 run：[25432948466](https://github.com/YiTiane/forever-begins/actions/runs/25432948466) · `74202ef` · workflow_dispatch · build 25s + deploy 11s · status `success`
  - `.github/workflows/deploy.yml` 触发 push main / workflow_dispatch · upload-pages-artifact@v3 + deploy-pages@v4
- [x] **线上 URL 显示 "Forever Begins" + 字体已生效**
  - `curl https://yitiane.github.io/forever-begins/` → **HTTP 200** · 10650 bytes · 0.11s
  - `Forever Begins` 字面在 HTML 出现 2 次（hero + og:site_name 等）
  - cormorant-italic.woff2 + noto-serif-sc-light.woff2 两条 preload **均 present**
  - font-family `Cormorant Garamond` + `Noto Serif SC` 都在 HTML 中
  - canonical / og:image / JSON-LD SocialEvent / CdnEarlyProbe inline IIFE 全在

### 5.3 Phase 1 完成纪要（v1.38）

**Phase 1 实施期间：v1.6 → v1.37 共 32 轮迭代** · 主仓 **7 个 Phase 1 commit** pushed to `origin/main` · 最终 Phase 1 HEAD = `74202ef` · 站点 https://yitiane.github.io/forever-begins/ HTTP 200 上线。
（注：v1.40+ 起进入 Phase 2 §0 实施期，main 已加更多 commit · 写报告时 §5.3 始终是 Phase 1 范围；当前主仓总 commit 数请用 `git log --oneline | wc -l` 查实际，Phase 2 部分写在 §6+ 章节）

**完成的 26 项子任务**（Phase 1 §1.1 全部）：

| 范围        | 任务                                                                                                                                                                           | 完成轮次 |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------- |
| 基建        | §1.1.1–§1.1.5 Astro/React/Tailwind v4 初始化 + 字体源就位                                                                                                                      | v1.19    |
| 文案 / 字体 | §1.1.6–§1.1.8 extract-text + seed-text + subset 8 字体 → 818 KB                                                                                                                | v1.20    |
| 字体管线    | §1.1.9 FontFaces.astro base-aware + 路由拆分 / dev-fonts 双重防护 / Ma Shan Zheng prewarm                                                                                      | v1.24    |
| 设计令牌    | §1.1.10–§1.1.12 tokens.css (OKLCH × 三档 rem 字号 × @theme) + reset.css (中文排版三件套) + global.css (3 行严格 import + 7 helper)                                             | v1.30    |
| SEO + 资产  | §1.1.13–§1.1.13c Base.astro v0.4 (canonical + 双态 theme-color + OG×10 + Twitter×4 + JSON-LD SocialEvent) + asset-versions.ts (集中接缝) + build-time-check.ts (双 CDN sanity) | v1.31    |
| CDN gate    | §1.1.14–§1.1.15 cdn-fallback.ts (诊断 helper) + CdnImage + CdnEarlyProbe (Base head 接入) + suppressSocialMeta Prop                                                            | v1.32    |
| Schema 收紧 | §1.1.16 Content Collections 5 schemas (Astro v6 路径修正) + stemSchema 禁扩展名/禁尺寸后缀 + JPG fallback `Math.max(...JPG_WIDTHS)` + fail-fast                                | v1.33    |
| 内容数据    | §1.1.17–§1.1.21 9 个 JSON 落地 (35 系列 + 8 猫 + 2 邀请函 stems · 全经 GitHub API 真实清单交叉验证) + schema photo 级 cdnTarget override 服务 snow 双仓拆分                    | v1.34    |
| 归档验收    | §1.1.21a-c 三项 bash 验证 (5 城地图归档仓 / 主仓未回退 / sync:main 历史工具)                                                                                                   | v1.35    |
| CI 部署     | §1.1.22 deploy.yml + §1.1.24 Pages 启用 (gh API) + §1.1.25 首次部署成功 + §1.1.26 线上 URL HTTP 200 验收                                                                       | v1.36    |
| 文档收口    | §1.1.23 现状保留 (v0.2 Cover 占位已上线)                                                                                                                                       | v1.37    |

**deferred（自愿）：§1.1.13a OG 图重做** —— 邀请函 part_1 + Sharp + SVG 合成专属 1200×630 OG 图；当前 misc@v1.1.0/og/og-cover-1200x630.jpg 已存在 HTTP 200，社交分享 today 即可工作；待源素材整合稳定后单独一轮 push misc → **v1.1.1**（patch on top of v1.1.0；v1.43 修订：之前写 v1.0.1 是 v1.42 之前 misc 还在 v1.0.0 的旧基线，misc 升到 v1.1.0 后再发 v1.0.1 会语义降级），bump asset-versions.ts 一行。

**关键工程产出**：

- **7 commits on main**：c2b1218 → 0fb6841 → 3debcce → 0c5df58 → bd3e918 → dcd008a → 74202ef
  （v1.38 审计 P3 修订：原写 5 与列表 7 不符；`git log --oneline | wc -l` 实测 7）
- **build pipeline**：`pnpm prebuild` (双 CDN sanity, 7 仓 200) → `pnpm build` (Astro static, 0 warnings, 2 pages, ~1.2s) → CI Pages deploy (~36s)
- **字体预算**：186 KB 首屏 preload < 200 KB 目标
- **token 系统**：12 OKLCH 色 × 27 三档 rem 字号 × DESIGN 别名 × Tailwind v4 @theme · 夜读仅切色板不切字号 · 0 letter-spacing 全局
- **CDN 架构**：7 仓 Tier B（jsDelivr 主 + Statically 备）+ 中央 asset-versions.ts 接缝 + build-time / runtime 双层探测兜底
- **SEO**：完整 meta + canonical + 双态 theme-color + OG×10 + Twitter×4 + JSON-LD SocialEvent · suppressSocialMeta Prop 让 dev-only 路由不泄露婚礼信息
- **a11y**：DESIGN §2.3.6 中文排版三件套（text-spacing-trim / hanging-punctuation / font-feature-settings: kern + halt）+ :focus-visible + prefers-reduced-motion

**契约 gate 实战验证**：v1.34 临时把 snow.json[0].stem 改成 `Snow_01.jpg` 触发 zod schema 立即报错"stem 禁止图片扩展名" → 改回后 build 立即恢复。**v1.33 contract gate 在生产数据上首次实战 working as designed**。

### 5.4 Phase 1 风险与备案

| 风险                         | 备案                               |
| ---------------------------- | ---------------------------------- |
| Tailwind v4 不稳/插件不全    | 退到 v3.4 + `@tailwindcss/postcss` |
| pyftsubset 跑不通            | 用 `npm: glyphhanger` 替代         |
| Astro Content Collections 卡 | 退化为单一 JSON import             |
| GitHub Pages base path 问题  | 临时 `base: '/'`，自定义域名时再切 |

---

## 6. Phase 2 — 序幕与请柬

> 🔗 [DESIGN.md §4 §0/§1 (Cover/Invitation)](DESIGN.md)
>
> **目标**：把首屏的"邀请函悬浮纸卡 + 倒计时 + 诗句"做完，并通过审美自评。
>
> **工时**：1 工日
>
> **成功标志**：手机和桌面浏览器分别打开线上 URL，前两屏视觉令你（杨倚天本人）满意。

### 6.1 子任务清单

- [x] 🟢 **2.1.1** Cover 骨架 `src/components/Cover.astro`（v1.39-v1.49 完成）
  - 容器 100vh
  - 邀请函悬浮纸卡（max-width: min(600px, 60vw)，aspect-ratio 2:3）
  - 阴影 `--shadow-paper` + 纸纹 inset shadow
  - 下方"Forever Begins" + 名字 + 日期文本

- [x] 🟢 **2.1.2** 含羞草花瓣 Canvas 粒子（v1.45-v1.46 完成）
  - 6–10 朵粒子，simplex noise 漂浮
  - `prefers-reduced-motion` 关闭
  - 性能：requestAnimationFrame + 跨 tab 暂停

- [x] 🟢 **2.1.3** Cover Mouse Parallax + Device Tilt（v1.47 完成）
  - 桌面：邀请函位移 ≤ 12px（防糊）
  - 移动：DeviceOrientation API（iOS 需用户授权）

- [x] 🟢 **2.1.4** Invitation 骨架 `src/components/Invitation.astro`（v1.50 完成）
  - 与 Cover 同款悬浮纸卡呈现 part_2
  - 诗句下方
  - 倒计时占位

- [x] 🟢 **2.1.5** 倒计时组件 `src/components/invitation/Countdown.astro`（v1.50-v1.51 完成）
  - `tabular-nums`
  - 每秒 tick，跨夜自动 +1 天
  - 婚礼当天：显示 "今 天"

- [ ] 🟢 **2.1.6** 诗句字符级 stagger reveal（deferred motion polish）
  - Framer Motion variants
  - 每 200ms 一行 + 字符级 0.4em blur → 0
  - 仅滚到视口时触发

- [x] 🟢 **2.1.7** 接入 §0/§1 到 `src/pages/index.astro`（v1.50 完成）

- [ ] 🔵 **2.1.8** 真机审美评审：iPhone Safari + iPad Safari + MacBook Chrome（30 min）
  - 检查邀请函图清晰度
  - 检查中英混排基线
  - 检查倒计时不抖动

### 6.2 Phase 2 验收清单

- [x] 邀请函两屏在 4K 桌面**像素清晰**（不发软）
- [x] 邀请函在 iPhone Pro Max 上**留白舒适**，未被横向截断
- [x] 含羞草粒子在 60fps 流畅
- [x] 倒计时数据流与 JSON-LD 同源，a11y 低频朗读已收口
- [x] `prefers-reduced-motion` 时关键动效消失但布局不破

---

## 7. Phase 3 — 第一章 · 我们的故事

> 🔗 [DESIGN.md §4 §2](DESIGN.md)
>
> **目标**：建成 StoryPoemScroller + PhotoBeatLayer + GlobeDistanceScene。旧 JourneyMap 已删除，不再展示中国 5 城地图。
>
> **工时**：3 工日
>
> **成功标志**：文字、照片、3D 地球在"万重山"处汇成一个情绪高潮。

### 7.1 子任务清单

#### 7.1.1 文案与数据

- [x] 🟢 **3.1.1** 写 Story 文案数据（v1.54-v1.64 完成）
  - 当前实现文件：`src/content/story-poem/main.json`
  - 12 个 beats：01-10 photo-poem / 11 globe / 12 finale
  - photo-poem 每张照片显式 `cdnTarget` / `stem` / `layout` / `role` / `fit`
  - `Snow_3.jpg` 等用户口语文件名已统一为规范 stem `Snow_03`

- [x] 🟢 **3.1.2** 写 daysTogether / `[N] 天` CountUp（v1.74-v1.77 完成）
  - 当前实现文件：`src/lib/story/daysTogether.ts`
  - `PoemBeat.astro` 渲染 `[N]`；`StoryPoemScroller.astro` 负责 client-time 写入
  - a11y 收口：visible number `aria-hidden`，sr-only sibling 读稳定终值；
    section heading 改为非数字描述，避免静态部署跨午夜漂移

- [x] 🟢 **3.1.3** 写长距离与多城市路线数据（v1.71-v1.89 完成）
  - 当前实现文件：`src/content/journey/long-distance.json`
  - 乌鲁木齐 / 墨尔本主路线 `10,755 公里`
  - 追加重庆/合肥/杭州/新加坡等多地点连线；最长路线高亮，辅助路线降权

#### 7.1.2 StoryPoemScroller + PhotoBeatLayer

- [x] 🟢 **3.1.4** 写 `src/components/story/StoryPoemScroller.astro`（v1.54-v1.99 完成）
  - 长卷 scrollytelling + hold plateau + hash composed-frame alignment
  - `[N] 天` client-time CountUp
  - compact/portrait/wide 三模式，iOS / mobile 入场进度与 reduced-motion 守卫已接入
  - GlobeBeat / FinaleBeat 已接入，旧 `.story-end-cap` 已替换

- [x] 🟢 **3.1.5** 写 `src/components/story/PoemBeat.astro` + layout solver（v1.54-v1.86 完成）
  - `src/lib/story/beatLayoutSolver.ts` 输出 photo geometry + textPlacement
  - 10 个 photo-poem beats 的 9 套 layout 已上线
  - Snow_14 / Snow_15 diagonal-gaze 宽屏 / portrait 分支已拆分
  - photo `fit` 必填，CDN dimension gate 防止竖幅被错标横幅

#### 7.1.3 GlobeDistanceScene（3D 地球）

- [x] 🟢 **3.1.6** 安装 3D 依赖（Phase 1 完成）

  ```bash
  pnpm add three @react-three/fiber @react-three/drei
  pnpm add @react-three/postprocessing postprocessing maath
  pnpm add -D @types/three
  ```

- [x] 🟢 **3.1.6a** R3F smoke / build integration（v1.71 完成）
  - Astro + React 19 + R3F 组合已通过生产 build
  - Globe / Finale 两个 R3F island 均 `client:visible` 懒 hydration

- [x] 🟢 **3.1.6b** 地球陆地轮廓方案（v1.78-v1.81 完成）
  - 真实方案改为 Natural Earth landmask CanvasTexture，替代早期 `globe-watercolor-2k.jpg` 贴图计划
  - 不显示国家名 / 国界；只画大陆轮廓和低调经纬视觉
  - 乌鲁木齐 / 墨尔本端点落在中国 / 澳大利亚大陆轮廓内

- [x] 🟢 **3.1.7** 写 `src/lib/story/globe.ts`（v1.71 完成）
  - 经纬度 → 球面 Vector3
  - great-circle arc + haversine 距离

- [x] 🟢 **3.1.8** 写 `src/components/story/GlobeDistanceScene.tsx`（v1.71-v1.99 完成）
  - 真实 3D 球体 + Natural Earth landmask
  - 乌鲁木齐 / 墨尔本主路线 + 多地点辅助路线
  - 主路线高亮，辅助路线使用高对比但低权重颜色
  - R3F canvas explicit sizing、hash hard sync、reduced-motion demand frameloop 已 harden

- [x] 🟢 **3.1.9** 截图 / canvas 尺寸 / hash composed-frame 验收（v1.99 完成）
  - `.globe-canvas-root canvas` 与 root rect 对齐，不再回落 300×150
  - `#beat-11-heading` 深链同步到 composed globe frame

### 7.2 Phase 3 验收清单

- [x] 页面不再显示"走过的城市"地图、重庆/杭州/北京/上海/威海列表或 JourneyMap
- [x] 每段文案出现时，指定照片正确出现
- [x] Snow_14 / Snow_15 对视构图成立
- [x] `[N] 天` 实时计算正确，a11y 不读 raw `[N]`
- [x] "松开刹那，才见已过万重山。"旁出现 3D 地球
- [x] 乌鲁木齐 / 墨尔本端点标注正确，距离停在 10,755 公里
- [x] reduced motion 模式仍可完整阅读故事

---

## 8. Phase 4 — 影像星河验收与降级策略

> 🔗 [DESIGN.md §4 §2.C / §3](DESIGN.md)
>
> **目标**：StarCarouselFinale 主叙事已实装并完成 v1.99-v1.100 hardening；Phase 4 当前只保留最终验收矩阵、reduced-motion / low-power polish，以及资源失败兜底复核。独立五画廊已取消；optional Lightbox 已因实测卡死撤回，转入 redesign-deferred，不作为当前下一步。
>
> **工时**：2 工日
>
> **成功标志**：照片像记忆一样出现，又像星星一样留在背景里。

### 8.1 子任务清单

- [x] 🟢 **4.1.1** 写 finale photo sequence（v1.90-v1.91 完成）
  - 当前实现文件：`src/lib/story/finalePhotos.ts`
  - 顺序：Grassland_01-05 → Wooden_door_02/03/05 → Pearl_01/02 → Retro_01-04 → final Pearl_04
  - 每项显式 `cdnTarget` / `stem`

- [x] 🟢 **4.1.2** 写 `src/components/story/StarCarouselFinale.tsx`（v1.90-v1.99 完成）
  - 背景改为 finale 独立满天星空，不再沿用 GlobeDistanceScene 的深色场
  - 每张照片从不同位置出现，小变大
  - 下一张出现时，上一张散成星尘
  - 默认算法：R3F shader + PhotoDustBurst / persistent starfield；Pearl_04 终态 single-source hold
  - texture loading：primary+backup 并发 first-success + 5s timeout；双败隐藏单张并保 fallback
  - 同屏最多 1 张主图 + 少量残留星点
  - final `pearl/Pearl_04` 居中定格为主海报

- [ ] 🟡 **4.1.3** Finale-only Lightbox redesign（deferred，不作为当前下一步）
  - v1.100 前实现已撤回：右上角入口在实测中会卡死，且会干扰 finale 主滚动叙事
  - 后续若重启，必须先写独立设计方案，再实现；不得直接恢复旧组件
  - 第一版仍只能覆盖 finale 15 张照片，且必须证明：不改变主滚动进度、不一次性拉 15 张图、ESC / 左右键 / swipe / focus trap / body scroll lock 全部可靠

- [x] 🟢 **4.1.4** Phase 4 final acceptance matrix + reduced-motion / low-power matrix（v2.02 前完成）
  - wide 1375×997 + mobile 390×844
  - beat 11 / beat 12
  - normal / prefers-reduced-motion / lite tier / static fallback
  - 资源失败：primary fail、backup fail、primary+backup dual fail
  - 验收项：canvas rect == root rect；hash landing 是 composed frame；finale 初始纯星空；首次滚动才出现第一张照片；Pearl_04 final hold 不重复循环；console 无 runtime error
  - 走马灯图片顺序 prefetch：每次最多当前 + 邻近必要图片，禁止一次性 15 张并发请求

- [ ] 🔵 **4.1.5** 真机巡检（45 min · 桌面 + iPhone + iPad + 微信内置浏览器）

### 8.2 Phase 4 验收清单

- [x] 不出现独立"五个画廊"章节卡
- [x] 所有指定照片按用户顺序出现
- [x] 照片散为星尘时不造成明显掉帧（Phase 4 online smoke matrix 通过；真机巡检仍作为上线前人工项）
- [x] final Pearl_04 定格后不重复循环；当前后续章节尚未接入
- [ ] Lightbox redesign 通过独立设计审查后再进入实现；当前阶段不要求 Lightbox 可用

---

## 9. Phase 5 — 彩蛋

> 🔗 [DESIGN.md §4 §4 (Cats)](DESIGN.md)
>
> **目标**：在 Finale 星空之后追加温暖、轻量、可发布的“三只猫 / 彩蛋”家庭相册章节。第一版不做 Lightbox、不新增 WebGL、不新增 React island。
>
> **工时**：1 工日
>
> **成功标志**：你在手机上滚到这一节会笑。

### 9.1 子任务清单

- [x] 🟢 **5.1.1** Cats content schema + metadata hardening（v2.05 已重构为 moments[]）
  - `photoRef.width` / `photoRef.height` 改为必填
  - 7 张 visible cat moment photo 写入真实尺寸
  - `verify-story-photo-dimensions.ts` 覆盖 cats，dimension gate 覆盖范围为 **34 张**（12 story + 15 finale + 7 cats）
  - 当前本地网络下若存在 CDN warning，只能记录为网络不可判定；发布级验收需在稳定网络下取得 **34/34 clean pass**

- [x] 🟢 **5.1.2** 写 `src/components/family/FamilySection.astro`（v2.06 已改为文图交替满宽 + 720px 以上 balanced spread）
  - Astro-only；不新增 React island / WebGL / Lightbox
  - 「彩蛋」+ 引言（v2.11 将可见标题与导航 label 从「我们的家」改为「彩蛋」）
  - Berry / 荔枝 / 小宝 三段家庭相册，按 `moments[]` 顺序渲染
  - 姓名下不再显示重复小字；文案段落后紧跟对应照片
  - 每行单张照片，宽度占满卡片内容区
  - 720px 以上统一使用 Berry 左列、荔枝/小宝右列堆叠；左右/上下 gap 相同
  - 图片全部 `object-fit: contain`，保留真实 aspect ratio，不裁脸、不裁耳朵、不裁蓝眼睛
  - 文案从 `family.json` 的 `moments[].text` 单一来源渲染，组件不再硬编码三只猫的 caption lines

- [x] 🟢 **5.1.3** 三只猫个性化主题色（v2.03 已提交部署）
  - Berry: warm cream / honey
  - 荔枝: soft amber / mimosa
  - 小宝: petal / lavender

- [x] 🟢 **5.1.4** 轻量进入动画（v2.03 已提交部署）
  - CSS + IntersectionObserver：card fade-in / translateY；主图 scale 0.96 → 1
  - `prefers-reduced-motion` 下直接终态

- [x] 🟢 **5.1.5** 接入首页（v2.03 已提交部署）
  - `<FamilySection />` 接在 `<StoryPoemScroller />` 之后
  - Family 自己建立浅纸面背景 + `isolation:isolate`，不继承 Finale starfield

- [ ] 🔵 **5.1.6** 文案最终校对（15 min · 7 个 moment）
  - 当前文案采用 seed-text / 已批准措辞；上线前仍建议人工读一遍语气

### 9.2 Phase 5 验收清单

- [x] 三只猫的肖像清晰可识别（不被裁切到只剩耳朵）
- [x] 文案排版与 §2 Finale / Globe 有视觉区分，回到浅纸面家庭相册语境
- [x] 移动端三卡纵向堆叠不挤压，竖图辅图不被横向裁切
- [x] primary CDN blocked 时 visible cat images 可切到 Statically backup
- [x] 页面中 Lightbox 入口仍为 0；Phase 5 不恢复 Lightbox

---

## 10. Phase 6 — 这一天 + 收束

> 🔗 [DESIGN.md §4 §5/§6 + §8](DESIGN.md)
>
> **目标**：婚礼详情、跨境地图、软性 RSVP、落款全部上线。
>
> **工时**：1.5 工日
>
> **成功标志**：客人能在 30 秒内拿到时间地点 + 跳到自己常用的地图 app。

### 10.1 子任务清单

#### 10.1.1 详情卡

- [ ] 🟢 **6.1.1** 写 `src/components/Details.astro`（45 min）
  - 三栏：日期 / 时间 / 地点
  - 一键导航：高德地图 / 百度地图 / Apple 地图 / Google Maps
  - 添加日历：Apple 日历 / Google Calendar
  - 联系新人：微信 ID / 电话 / 微信二维码

- [ ] 🟢 **6.1.2** 详情区微动效（30 min）
  - 导航/日历/联系按钮轻微 reveal
  - reduced motion 下保持静态

#### 10.1.2 跨境地图

- [ ] 🟢 **6.1.3** 写 `src/components/DetailsMap.tsx`（75 min · §8.3）
  - 加载 fb-cdn-misc 的 venue-2560.png
  - 4 个深链按钮
  - `navigator.language` 智能排序

- [ ] 🔵 **6.1.4** 校准婚礼地点经纬度（30 min）⭐ v1.2 三坐标系
  - **第 1 步 · 取真坐标**：在 Mapbox Studio 把场地标记拖到二道桥大剧院屋顶中心，复制 WGS84 lng/lat
  - **第 2 步 · 写 wgs84**：替换 `src/content/meta/wedding.json` 中 `venue.coords.wgs84.lng / .lat`（**只动 wgs84，gcj02/bd09 保持 null**）
  - **第 3 步 · 跑坐标扩展脚本**（在归档仓）：
    ```bash
    cd ~/projects/forever-begins-archive
    pnpm tsx scripts/expand-coords.ts --in ../forever-begins/src/content/meta/wedding.json --inplace
    ```
    脚本读 wgs84，用 `coordtransform` npm 算出 gcj02 与 bd09，写回 wedding.json
  - **第 4 步 · 验证**：
    - `coords.wgs84` ↔ `coords.gcj02` 偏移 50–500 m（中国境内典型 GCJ-02 偏移量）
    - `coords.gcj02` ↔ `coords.bd09` 偏移再加 ~100–300 m
    - 在浏览器手动打开 4 个深链：每个 app 都把红点落在二道桥大剧院上
  - **第 5 步 · 触发归档仓 CI** 重新生成 venue-map（用 wgs84，因为 Mapbox 以 WGS84 显示）
  - **第 6 步 · 主仓 push**，DetailsMap 会因 `coords.gcj02 != null` 自动显示高德/百度按钮

#### 10.1.3 日历

- [ ] 🟢 **6.1.5** 生成 `.ics` 文件入 `public/calendar/`（30 min）
  - 用 `ical-generator` npm
  - 点击下载按钮触发

#### 10.1.4 软性 RSVP

- [ ] 🟢 **6.1.6** 写 `src/components/SoftRSVP.astro`（45 min）
  - 联系方式文本（手机号点击复制）
  - 微信二维码 modal（图入 `public/wechat-qr/`，需 0.5MB 内）
  - 仪式感文案 "如果方便..."

- [ ] 🔵 **6.1.7** 上传微信二维码图片（10 min）

#### 10.1.5 尾声 + 落款

- [ ] 🟢 **6.1.8** 写 `src/components/Closing.astro`（30 min）
  - 落款用马善政毛笔字
  - 含羞草花瓣再次出现
  - footer 版权

#### 10.1.6 全局导航

- [ ] 🟢 **6.1.9** 写 `src/components/nav/DesktopMenu.astro`（45 min）
  - 右上 sticky 极简菜单（图标级）
  - Hero 隐藏，第二屏开始出现

- [ ] 🟢 **6.1.10** 写 `src/components/nav/MobileMenu.tsx`（60 min）
  - 右下浮点指示器
  - 点击展开半透明全屏菜单

- [ ] 🟢 **6.1.11** 写 `src/components/nav/ScrollProgress.tsx`（30 min）
  - 左侧 1px rail，烫金 fill
  - 章节锚点同步 history.replaceState

- [ ] 🟢 **6.1.12** 全部接入 + 真机巡检（30 min）

### 10.2 Phase 6 验收清单

- [ ] 详情卡三栏在桌面端水平、移动端纵向，文字不溢出
- [ ] 一键导航 / 添加日历 / 联系新人按钮状态清晰，滚到时自然 reveal
- [ ] 婚礼地点地图准确，四个深链按钮在不同设备打开正确 app
- [ ] `.ics` 下载在 macOS Calendar / Google Calendar 都能识别
- [ ] 手机号点击复制成功
- [ ] 微信二维码 modal 不卡顿，图清晰
- [ ] 落款 + 尾声温暖收束
- [ ] 导航在 Hero 隐藏，第二屏起出现

---

## 11. Phase 7 — 打磨与测试

> **目标**：把所有"看起来差不多"打磨到"看起来对"。
>
> **工时**：1.5 工日
>
> **成功标志**：跨设备 / 浏览器 / 网络通过 §14 验证矩阵全绿。

### 11.1 子任务清单

#### 11.1.0 上线前清理（dev-only 路由 / 构建产物）⭐ v1.24 新增

- [ ] 🟢 **7.1.0** 删除 `src/pages/dev-fonts.astro`（5 min）
  - v1.24 引入的字体冒烟测试页，仅 dev 期使用
  - 上线前必删；当前的 sitemap.filter + noindex 只是开发期临时双保险，**不是**上线方案
  - 删除后 `pnpm build` 产物只剩 1 page (`/index.html`)，sitemap 也回到 1 条 URL
  - 校验：`grep -r "dev-fonts" src/ dist/` 应为空

#### 11.1.1 性能

- [ ] 🟢 **7.1.1** Lighthouse audit（30 min）
  - mobile：Perf ≥ 95、A11y ≥ 95、SEO ≥ 95
  - 不达标项 list 在 §17 决策日志

- [ ] 🟢 **7.1.2** 解决 LCP / CLS / INP 问题（90 min · 视具体）
  - 常见：图片 width/height 缺失 → 加上
  - 字体闪烁 → 调 preload + size-adjust
  - 横向 pin 触发 CLS → 调测量

- [ ] 🟢 **7.1.3** 各资源 size 复查（30 min）
  - 首屏 JS gz < 30KB
  - 首屏 CSS gz < 12KB
  - 字体首屏 < 200KB

- [ ] 🟡 **7.1.3a** 评估并消除上游 `THREE.Clock` deprecation warning（30–60 min）
  - 现状：业务代码已不调用 `state.clock.getElapsedTime()`，但 three / R3F / drei 仍可能在 Canvas hydrate 时内部创建 `THREE.Clock`
  - 处理顺序：先评估 `three` / `@react-three/fiber` / `@react-three/drei` 兼容升级，再看上游 Timer 迁移进度
  - 禁止方案：不做全局 `console.warn` monkey-patch，避免吞掉真实运行时 warning

#### 11.1.2 跨浏览器 / 设备 / 网络

- [ ] 🔵 **7.1.4** 跨设备矩阵测试（90 min）
  - iPhone 13 / 15 / SE （iOS 17+）
  - Galaxy S 系列（Android 14+）
  - iPad Pro
  - MacBook Pro 14 (Retina)
  - Windows 1080p
  - 4K 显示器

- [ ] 🔵 **7.1.5** 跨浏览器（45 min）
  - Safari 17+（macOS / iOS）
  - Chrome 130+
  - Firefox 130+
  - Edge 130+
  - **微信内置浏览器**（关键）
  - QQ 浏览器
  - UC 浏览器

- [ ] 🔵 **7.1.6** 跨网络（60 min）
  - Wi-Fi 100M
  - 4G（用 devtools 限速）
  - 3G（用 devtools 限速）
  - 跨境（请境外朋友测）

#### 11.1.3 无障碍

- [ ] 🟢 **7.1.7** axe-core 自动扫描（30 min）
  - `pnpm dlx @axe-core/cli https://your-url`
  - 0 critical / 0 serious

- [ ] 🟢 **7.1.8** 键盘可达 + 屏幕阅读器抽检（30 min）
  - VoiceOver (macOS) 跑一遍主要 CTA
  - Tab 键能到达所有交互
  - Lightbox focus trap 工作

- [ ] 🟢 **7.1.9** `prefers-reduced-motion` 全链路（30 min）
  - 所有动效降级 fade only
  - 大圆弧直接显示完整路径

#### 11.1.4 微信分享卡

- [ ] 🟢🔵 **7.1.10** 微信分享 OG 测试（30 min）
  - 真机用微信发链接给朋友
  - 应显示自定义 OG 图 + 标题 + 简介
  - 必要时通过 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/) 调试

### 11.2 Phase 7 验收清单

- [ ] Lighthouse 全部 ≥ 95（mobile）
- [ ] §14 验证矩阵全绿
- [ ] 微信内置浏览器主流程可用
- [ ] 无障碍 axe 0 critical
- [ ] 隐私扫描：DevTools Network 无任何第三方追踪请求

---

## 12. Phase 8 — 上线与监护

> **目标**：让链接进入婚礼请柬的"印刷状态"，并在婚礼前后稳态运行。
>
> **工时**：0.5 工日 + 婚礼后 ∞
>
> **成功标志**：婚礼当天，亲友能在乌鲁木齐宴会厅 / 远在墨尔本的客人都能流畅打开。

### 12.1 子任务清单

- [ ] 🔵 **8.1.1** （可选）注册自定义域名（30 min）
  - 例 `wedding.YiTiane.com`
  - 在 DNS 添加 CNAME → `YiTiane.github.io`

- [ ] 🔵 **8.1.2** 在主仓 Settings → Pages 配置 Custom domain + 强制 HTTPS（10 min）

- [ ] 🟢 **8.1.3** 主仓 `astro.config.ts` 调整 `site` + `base`（5 min）

- [ ] 🟢 **8.1.4** 重新部署（10 min · 触发 Actions）

- [ ] 🔵 **8.1.5** 生成短链（15 min）
  - 用 `s.co` / 腾讯短链 / 自建（用 Cloudflare Worker 一行 redirect）
  - 例 `wd.yt/2026` → 跳到正式 URL

- [ ] 🔵 **8.1.6** 短链印到物理请柬（与印刷沟通）

- [ ] 🔵 **8.1.7** 灰度：邀请 3–5 位朋友打开，记录卡顿/疑问点（60 min）
  - 至少 1 人在中国大陆
  - 至少 1 人海外（最好 4G 网络）

- [ ] 🟢 **8.1.8** 处理灰度反馈（视具体）

- [ ] 🔵 **8.1.9** 婚礼前 7 天最终冻结（确认所有内容定稿）

- [ ] 🔵 **8.1.10** 婚礼当天监护（见 §16）

### 12.2 Phase 8 验收清单

- [ ] 自定义域名（如启用）TLS 强制 HTTPS
- [ ] 短链能跳转
- [ ] 灰度无 P0/P1 问题
- [ ] §16 婚礼前/中/后清单已制定

---

## 13. 完成标准 Definition of Done

每个 Phase 必须**全部满足**才能进入下一 Phase：

| Phase | DoD                                                                           |
| ----- | ----------------------------------------------------------------------------- |
| 0     | 9 仓就位 / HEIC 转换完毕 / 派生品在 jsDelivr 可访问 / 每仓 ≤ 90MB             |
| 1     | Astro 部署链路绿 / 字体 subset 完成 / tokens.css 完整 / CdnImage 可工作       |
| 2     | Cover + Invitation 在桌面/iPhone 视觉过审 / 倒计时不抖                        |
| 3     | StoryPoemScroller / PhotoBeatLayer / GlobeDistanceScene 上线，3D 地球验证通过 |
| 4     | StarCarouselFinale + Lightbox 可用 / 微信内置浏览器主流程通过                 |
| 5     | 三只猫卡片完成 / 文案最终定稿                                                 |
| 6     | Details / Map / RSVP / Closing / Nav 完整                                     |
| 7     | Lighthouse ≥ 95 / 验证矩阵全绿 / 跨境实测通过                                 |
| 8     | URL 可分享 / 婚礼日运行平稳                                                   |

---

## 14. 验证矩阵 Test Matrix

> 每次 Phase 7 必跑。每个交叉点要么 ✅ 要么 N/A，**不允许 ❌**。

### 14.1 设备 × 浏览器矩阵

|                  | Safari iOS | Chrome iOS | Chrome Android | 微信 | QQ 浏览器 | Safari macOS | Chrome macOS | Firefox macOS | Edge Win | Chrome Win |
| ---------------- | ---------- | ---------- | -------------- | ---- | --------- | ------------ | ------------ | ------------- | -------- | ---------- |
| §0 Cover         |            |            |                |      |           |              |              |               |          |            |
| §1 Invitation    |            |            |                |      |           |              |              |               |          |            |
| §2 AnchorMoment  |            |            |                |      |           |              |              |               |          |            |
| §2 GlobeDistance |            |            |                |      |           |              |              |               |          |            |
| §2 Distance      |            |            |                |      |           |              |              |               |          |            |
| §3 Snow          |            |            |                |      |           |              |              |               |          |            |
| §3 Garden        |            |            |                |      |           |              |              |               |          |            |
| §3 WoodenDoor    |            |            |                |      |           |              |              |               |          |            |
| §3 Pearl         |            |            |                |      |           |              |              |               |          |            |
| §3 Retro         |            |            |                |      |           |              |              |               |          |            |
| §4 Cats          |            |            |                |      |           |              |              |               |          |            |
| §5 Details + Map |            |            |                |      |           |              |              |               |          |            |
| Lightbox         |            |            |                |      |           |              |              |               |          |            |

### 14.2 网络 × 地理矩阵

|                      | Wi-Fi 100M | 4G  | 3G slow | China 4G | 海外 4G |
| -------------------- | ---------- | --- | ------- | -------- | ------- |
| 首屏 LCP < 2.5s      |            |     |         |          |         |
| 全图加载完 < 30s     |            |     |         |          |         |
| Lightbox 大图 < 3s   |            |     |         |          |         |
| §2 Globe 3D 动画流畅 |            |     |         |          |         |

### 14.3 偏好与无障碍

| 测试项                           | 通过？ |
| -------------------------------- | ------ |
| `prefers-reduced-motion: reduce` |        |
| `prefers-reduced-transparency`   |        |
| `prefers-color-scheme: dark`     |        |
| 仅键盘可访问 RSVP / Lightbox     |        |
| VoiceOver 朗读首屏完整           |        |
| axe-core 0 critical              |        |
| 颜色对比 WCAG AA 通过            |        |

---

## 15. 回滚与降级预案 Rollback & Fallback

### 15.1 部署级回滚（v2.3 修订：用真实可行路径）

> GitHub Pages **没有**像 Cloudflare Pages 那样的"一键回退到上个版本"按钮。部署是 Actions 工件覆盖式发布。
>
> 真正可行的回滚有两条路径：

#### A. 主代码仓回滚（站点结构、文案、动效）

```bash
# 1. 找到上一个已知好的提交（last-good）
cd ~/projects/forever-begins
git log --oneline -20

# 2. 任选一种：
#    方式 a: 创建 revert commit（保留历史，最干净，推荐）
git revert <bad-commit-hash>
git push

#    方式 b: 强切到 last-good（彻底回滚但破坏远程历史，谨慎）
git reset --hard <last-good-hash>
git push --force-with-lease

# 3. Actions 自动重新部署，约 3–5 min 上线
```

**长期保险**：在每次"上线节点"打 tag。

```bash
git tag -a release/2026-06-13 -m "婚礼前 1 天稳定版"
git push --tags
# 紧急时：git checkout release/2026-06-13 && git push
```

#### B. 资产仓回滚（图片/地图静态/OG）

每个 Tier B 仓在 push 时都打了 tag（`v1.0.0`、`v1.1.0`...）。

主代码仓在 **`src/lib/images/asset-versions.ts`**（v1.5 起的唯一版本接缝）集中维护：

```ts
// src/lib/images/asset-versions.ts
export const ASSET_VERSIONS = {
  'snow-a':       'v1.0.0',  ← 紧急时改回旧版本号
  'snow-b':       'v1.0.0',
  'grassland':    'v1.0.0',
  'wooden-door':  'v1.0.0',
  'pearl':        'v1.0.0',
  'retro':        'v1.0.0',
  'misc':         'v1.0.0',  ← 包括 probe.png 与所有 invitation/cat/map
} as const;
```

`<CdnImage>` / `<CdnEarlyProbe>` / `cdn-fallback.ts` **全部经由 `cdnUrl()` helper** 读取此表——
没有任何文件硬编码 `@v1.0.0`，所以改这一处 = 改全局。

回滚步骤：

```bash
# 1. 编辑 src/lib/images/asset-versions.ts，把出问题的那一行改回旧 tag
#    例：'snow-a': 'v1.1.0' → 'v1.0.0'
# 2. 提交 + 推送
git commit -am "rollback: snow-a v1.1.0 → v1.0.0"
git push
# 3. Actions 重部署 (~3 min) 后，新页面引用旧 tag，jsDelivr 命中旧缓存
```

⚠️ **不能用** `git revert` 资产仓——派生品体积大、重 push 不稳。**永远靠 tag 切换**。

⚠️ **构建期 sanity check**：

`scripts/build-time-check.ts` 已在 **§1.1.13c** 完整定义并接到 `prebuild` hook。
当前脚本（v1.8 起）的关键特性：

- **双 CDN 检测**：primary（jsDelivr）+ backup（Statically）同时探。**仅当双 CDN 均失败才 fail build**；单边失败仅 `console.warn` 不阻塞。
- 对所有 7 个 Tier B 仓的 `probe.png` 校验（push-to-cdn-repos.ts 给每仓都写）
- 支持 `SKIP_BUILD_CHECK=1` 本地紧急绕过；CI 永不传

> ⚠️ **不要在此处复制脚本实现**——以 §1.1.13c 为唯一权威。
> 历史版本（v1.6 单 CDN 版）已弃用：jsDelivr 单点抖动会让能正常运行的站 fail build，与运行时双 CDN fallback 矛盾。

实际意义：改了 `asset-versions.ts` 但忘了发对应 tag → 双 CDN 都 404 → build 直接失败而非上线后客户看到 404。

#### C. CI 还在跑、又必须立刻止损

- 主仓 Actions 页面 → 取消正在跑的 deploy
- 上一次成功的 Pages 部署保持在线（不会被半成品覆盖）
- 修问题再 push

#### D. 婚礼前 24h 紧急情景手册

| 情景                | 第一动作                                          |
| ------------------- | ------------------------------------------------- |
| 站点白屏 / 报错     | `git revert HEAD && git push`，3 分钟止血         |
| 某张照片加载失败    | 临时把那张图从 `series JSON` 里删除，push         |
| Mapbox 静态图打不开 | 临时把 `<DetailsMap>` 隐藏，只保留四个深链按钮    |
| jsDelivr 整体不稳   | cdn-fallback 本就有 Statically 兜底，无需手动操作 |
| 文案错字            | 直接改 JSON 内容，push（5 分钟）                  |

### 15.2 部分功能降级触发条件

| 触发                                               | 降级行为                                   |
| -------------------------------------------------- | ------------------------------------------ |
| jsDelivr 探测 timeout                              | 自动切到 Statically                        |
| 两个 CDN 都失败                                    | 显示 LQIP + "图片加载失败，刷新重试" 提示  |
| Mapbox Static 请求 4xx                             | 切到预渲染的 OSM 静态图（CI 同时生成备份） |
| `prefers-reduced-motion`                           | 所有动效改 fade，大圆弧直接显示完整        |
| `navigator.connection.effectiveType === 'slow-2g'` | 关闭粒子、关闭 horizontal pin              |
| `navigator.deviceMemory < 4`                       | Lightbox 直接 1600w 而非 3840w             |

### 15.3 婚礼前 24h 紧急修补

- 任何"灾难级"问题（白屏、关键信息错误）：
  1. 立即在主仓 `git revert <bad-commit>` push
  2. 等 Actions 跑完（≤ 5 min）
  3. 微信通知正在打开链接的客人
- 文案错误等"美容级"：可以等

---

## 16. 婚礼前/中/后运营手册 Runbook

### 16.1 婚礼前 7 天

- [ ] 🔵 锁定主仓，禁止再 merge（除非紧急）
- [ ] 🔵 短链 + 二维码确认与请柬印刷一致
- [ ] 🔵 把 URL 在微信群提前发一次（让大家点开预热缓存）
- [ ] 🔵 跑 Lighthouse + 验证矩阵最后一遍

### 16.2 婚礼前 24h

- [ ] 🔵 检查所有外部依赖：
  - jsDelivr 当前可用？（打开 probe.png）
  - Mapbox Static 当前可用？
  - GitHub Pages 当前可用？
- [ ] 🔵 准备一台备用机器随时可改

### 16.3 婚礼当天

- [ ] 🔵 开 5 个 tab 守候：
  - 主仓 Actions（看部署状态）
  - jsDelivr probe.png
  - 主站 URL
  - GitHub Status (status.github.com)
  - 微信群（看反馈）
- [ ] 🔵 签到台旁放二维码立牌（可现场扫）

### 16.4 婚礼后 1 周

- [ ] 🔵 整理客人留言（如开放过软 RSVP 的微信反馈）
- [ ] 🔵 决定是否开放高清原图下载入口（Phase 8.1.1 可选项）
- [ ] 🔵 把网站归档到时间胶囊（commit "wedding-archive" tag）

### 16.5 长期

- [ ] 🔵 每年 1 月 27 日 / 6 月 14 日检查链路是否还活着（jsDelivr 政策可能变）
- [ ] 🔵 婚礼周年时，可在 §6 尾声加一行"已陪伴 N 年" + 婚后照片

---

## 17. 决策日志 Decision Log

> 任何脱离 PLAN.md / DESIGN.md 的临场决策必须在此留痕。格式：日期 · 决策 · 原因 · 影响。

| 日期       | 决策                                                | 原因                                                                                                         | 影响                                                                                                                                                |
| ---------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-05-04 | PLAN.md v1.0 初稿                                   | 启动施工前需要施工蓝图                                                                                       | —                                                                                                                                                   |
| 2026-05-05 | v1.1：同步 DESIGN.md v2.3 八项修订                  | 二轮代码审阅 P1/P2 全部命中要害                                                                              | 解除 8 项上线静默失败风险                                                                                                                           |
| 2026-05-05 | v1.2：三轮收口 5 项 PLAN/DESIGN 残留                | PLAN 中残留 v2.2 旧指令会拉回错误路径                                                                        | 解除 JourneyMap 投影回归 / 单坐标系 / @2x 错位 / Astro 构建时 await / robots.txt 误用                                                               |
| 2026-05-05 | v1.3：四轮收口 5 项 implementation-time 断点        | china-cities.json 链路断 / fallback DOM 时序 / 漏装 d3-shape / AbortSignal.timeout 兼容性 / world-atlas 阈值 | 解除会让 build 失败、运行时静默失败的 5 处真实风险                                                                                                  |
| 2026-05-05 | v1.4：五轮收口 3 项施工契约边角                     | CdnImage prop 与 series.id 冲突 / build:maps 不含 sync / ~/ 字面量不展开                                     | 解除施工时会误操作 / 路径错位的 3 处真实风险                                                                                                        |
| 2026-05-05 | v1.5：六轮收口 4 项执行级断点                       | sync 脚本不可执行 / Phase 0 绕过 build:all / 资产版本未接入 CdnImage / DESIGN CI 绕过 v1.4 契约              | 解除"照 PLAN 跑会断链"的 4 处真实风险                                                                                                               |
| 2026-05-05 | v1.6：七轮收口 5 项 phase 顺序+守卫                 | Phase 0 sync 主仓不存在 / sync 静默 exit 0 / probe.png 不全 / §18 绕过契约 / 旧浏览器无守卫                  | 解除 Phase 顺序锁与 runbook 残留                                                                                                                    |
| 2026-05-05 | v1.7：八轮收口 4 项执行入口落地                     | build-time-check 仅文档化未排入 / probe.png 写盘缺步骤 / §0.1.26 残留 raw tsx / CI 走 build:all 与契约不符   | 让 v1.6 的"可照单施工"真正闭环                                                                                                                      |
| 2026-05-05 | v1.8：九轮收口 4 项 push/sanity 契约                | VERSION 未声明会运行时崩 / brace 展开依赖 shell 方言 / sanity 单 CDN 严格 fail / Tier B 树缺 probe.png       | 让 push:cdn 在首次跑时不崩，sanity 不误伤                                                                                                           |
| 2026-05-05 | v1.9：十轮收口 4 项 CI/原子性契约                   | CI 没传 VERSION / push 中途断会半推半就 / §18.3 缺 VERSION / §15.1 旧 sanity 残留                            | 让 CI/runbook/push 入口与 v1.8 命令契约对齐                                                                                                         |
| 2026-05-05 | v1.10：十一轮收口 3 项重跑/维护边界                 | tmp 残留致 clone 失败 / gh release list 查不到 git tag / Phase 1 验收过严                                    | 让重跑场景与 v1.8 双 CDN sanity 一致                                                                                                                |
| 2026-05-05 | v1.11：十二轮收口 push 原子性措辞精度               | 注释承诺"不会半推半就"与 partial tag 处理段矛盾，造成执行者误判事务性                                        | 让原子性表述与实际行为一致，避免误读                                                                                                                |
| 2026-05-05 | v1.12：十三轮收口 3 项文案/验收一致性               | 首次 probe 单 CDN / 成功文案误报"双健康" / §0.1.20 残留 v1.0.0 硬编码                                        | 与 v1.8 双 CDN sanity 全文一致                                                                                                                      |
| 2026-05-05 | v1.15：热安全模式 + §0.1.23 完成                    | 原派生品生成导致 CPU 温度 >100°C 报警；后续必须保护硬件，降低并发与 AVIF effort，并加入冷却间隔              | build:cdn 改走 build:derivatives:safe；§0.1.23 安全续跑完成，dist 产物齐全                                                                          |
| 2026-05-05 | v1.16：§0.1.24 低负载分步完成                       | build:cdn 会再次遍历图片清单；派生品已完成，为保护硬件只需重跑 maps:cdn 与 og                                | Phase 0 推进到 §0.1.25，dist 保持 734 文件 / 409MB                                                                                                  |
| 2026-05-05 | v1.17：§0.1.25-§0.1.26 CDN 首次发布完成             | deploy key 环境变量必须与 push:cdn 同 shell 执行；首次 VERSION=1.0.0 发布 7 仓                               | 7 个 Tier B 仓均已 push @ v1.0.0，进入 CDN 传播验证                                                                                                 |
| 2026-05-05 | v1.18：Phase 0 本地/CDN 验收完成                    | 双 CDN probe 与真实资产抽样全 200；体积全部低于 90MB；境外人工验证需另有网络条件                             | Phase 1 可启动；§0.1.29 延后到 Phase 7 系统化测试                                                                                                   |
| 2026-05-05 | v1.19：Phase 1 §1.1.1-§1.1.5 完成                   | Astro 6 / Vite 7 下 @tailwindcss/vite@next 解析到旧 4.0.0，有 peer mismatch；私人项目应关闭 telemetry        | 改用 Tailwind latest 4.2.4；基础 build 通过；进入字体子集任务                                                                                       |
| 2026-05-05 | v1.20：§1.1.6-§1.1.8 + 中文文案审计完成             | 用户要求审计所有当前中文语法用词；同时发现 extract-text 兜底字符与 TS6 baseUrl 问题                          | seed 文案已润色；extract:text 统计 536 unique chars；subset 未跑，进入 fonts.css 前需先执行 subset                                                  |
| 2026-05-06 | v1.21：最终文案驱动的 Phase 3/4 重排                | 用户取消独立婚纱照幕间和可见 5 城 JourneyMap，要求独白长卷、3D 地球与星尘走马灯融合                          | Phase 3 改 StoryPoemScroller + GlobeDistanceScene；Phase 4 改 StarCarouselFinale；seed-text 替换最终文案                                            |
| 2026-05-06 | v1.22：删除主仓 `china-cities` 同步契约             | v1.21 仍残留 Phase 1 sync 旧 5 城 JSON 的活跃步骤，会把废弃 JourneyMap 数据重新带进主仓                      | `china-cities.json` 降为归档资产；主仓只实现 3D 地球距离场                                                                                          |
| 2026-05-06 | v1.23：3D/字体/OG 实施契约补强                      | 审计指出地球陆地数据、halo 后期、hydration、星尘算法、字体 preload、OG 图仍需明确                            | 选水彩贴图地球；加 postprocessing/maath；subset 完成；Phase 3 加 R3F smoke；OG 正式重做                                                             |
| 2026-05-09 | v2.00：主仓 v1.99 hardening 后文档状态收口          | PLAN 顶部/Phase 3/4 checklist 仍停在 v1.93，会把执行者带回已完成的 §2.C 实施任务                             | 当前保护点改为 `0998b49`；Phase 3 标为 hardened baseline；Phase 4 剩余任务收敛为验收矩阵、finale reduced-motion/low-power polish、optional Lightbox |
| 2026-05-09 | v2.01：主仓 v1.100 follow-up 后文档状态收口         | v2.00 后 Lightbox 已因实测卡死撤回，finale 首帧已改纯星空；旧 PLAN 仍会把执行者带回 optional Lightbox        | 当前保护点改为 `e095491`；Lightbox 转入 redesign-deferred；下一步锁定 Phase 4 最终验收矩阵与 reduced-motion/low-power 复核                          |
| 2026-05-10 | v2.02：Phase 4 保护点 + Phase 5 Family 实施口径收口 | Phase 4 已验收并决定进入 Phase 5；旧 PLAN 仍会把实施者带回 CatCard.tsx / Lightbox / hover 切主图旧方案       | 当前保护点改为 `3d16da1`；Phase 5 改为 Astro-only FamilySection；cats 8 图加入 dimension gate（v2.03 纠正 clean-pass 口径）                         |
| 2026-05-10 | v2.03：Phase 5 Family 审计修复收口                  | 审计发现 Family 文案绕过 content 单一源、PLAN 误写 35/35 clean verified、实现未进版本保护                    | 当前保护点改为 `e3f083e`；Family caption 改回 `family.json` 单一源；dimension gate 口径改为覆盖 35 张，clean pass 需稳定网络复验                    |

---

## 18. 索引：快速跳转表 Quick Index

### 18.1 我什么时候做什么？

| 我现在想…             | 翻这里                                |
| --------------------- | ------------------------------------- |
| 看总进度 / 这周做什么 | [§1 总览](#1-总览-master-schedule)    |
| 启动一个新 Phase      | 直接定位 §4–§12 中对应 Phase          |
| 设计上拿不准          | [DESIGN.md](DESIGN.md)                |
| 出问题想回滚          | [§15 回滚预案](#15-回滚与降级预案)    |
| 婚礼前后运营          | [§16 Runbook](#16-婚礼前中后运营手册) |

### 18.2 关键文件路径快查

| 内容              | 路径                                            |
| ----------------- | ----------------------------------------------- |
| 这份计划          | `PLAN.md`                                       |
| 设计文档          | `DESIGN.md`                                     |
| 主代码仓          | `~/projects/forever-begins/`                    |
| 私有归档仓        | `~/projects/forever-begins-archive/`            |
| Tier B 仓         | GitHub `YiTiane/fb-cdn-*`                       |
| Mapbox 自定义样式 | Mapbox Studio · `wedding-watercolor`            |
| Deploy keys       | `~/.ssh/forever-begins-keys/`                   |
| 内容定义          | `src/content/{meta,story,journey,cats,series}/` |
| 字体 subset       | `public/fonts/*.woff2`                          |

### 18.3 常用命令快查（v1.9：所有 push:cdn 必传 VERSION）

> ⚠️ **每次 push:cdn 都必须 bump VERSION**（semver `X.Y.Z`）。push 后改主仓 `asset-versions.ts` 同步切版本。
> 内容更新（加照片 / 改文案）走 minor；仅元数据走 patch。

```bash
# ── 主仓：本地开发 / 生产构建 ─────────────────────────────
cd ~/projects/forever-begins && pnpm dev
pnpm build && pnpm preview                  # prebuild 会自动跑双 CDN sanity check

# ── 归档仓：重新生成 + 推 CDN（最常用）───────────────────
cd ~/projects/forever-begins-archive
pnpm build:all                              # = derivatives + maps + og；v1.22 起不 sync 主仓
VERSION=1.1.0 pnpm push:cdn                 # ⭐ VERSION 必传

# ── 仅重做归档地图/婚礼地点地图───────────────────────────
pnpm build:maps                             # _maps:venue + _maps:china；不 sync 主仓
VERSION=1.0.1 pnpm push:cdn                 # ⭐ 仅地图变化走 patch

# ── 仅重做派生品（如换了几张图）──────────────────────────
pnpm build:derivatives:safe
VERSION=1.1.0 pnpm push:cdn                 # ⭐ 加图走 minor

# ── 资产 tag 切换回滚（紧急）─────────────────────────────
cd ~/projects/forever-begins
$EDITOR src/lib/images/asset-versions.ts    # 改回旧 tag (例 1.1.0 → 1.0.0)
git commit -am "rollback asset version" && git push

# ── Phase 6 坐标扩展（一次性）────────────────────────────
cd ~/projects/forever-begins-archive
pnpm expand:coords

# ── Lighthouse / 性能审计 ─────────────────────────────────
pnpm dlx unlighthouse --site https://YiTiane.github.io/forever-begins/

# ── 字体重新 subset（改了文案后）─────────────────────────
cd ~/projects/forever-begins
pnpm tsx scripts/extract-text.ts && bash scripts/subset-fonts.sh
```

> **VERSION 选择速查**：
>
> - 每次 push:cdn 都要新版本号；查上一次用过的 tag 走（v1.10 修正：push 脚本只发 git tag，不发 GitHub Release）：
>   ```bash
>   # 推荐：用 gh api（无 release 时也能列出 tag）
>   gh api repos/YiTiane/fb-cdn-misc/git/refs/tags --jq '.[].ref' | sed 's|refs/tags/||' | sort -V | tail -3
>   # 或 git ls-remote
>   git ls-remote --tags --refs git@github.com:YiTiane/fb-cdn-misc.git | awk '{print $2}' | sed 's|refs/tags/||' | sort -V | tail -3
>   ```
> - 内容变化（图 / 地图 / 文案）→ minor `1.0.0` → `1.1.0`
> - 修元数据（README / 注释）→ patch `1.0.0` → `1.0.1`
> - 删图 / 改 stem（不向后兼容）→ major `1.0.0` → `2.0.0`

> ⚠️ **不要直接** `pnpm tsx scripts/generate-*.ts`——会绕过 sync 契约，让主仓内容落后。
> 临场操作请走 package scripts。

### 18.4 关键人物 / 服务

| 服务          | 入口                                                 | 用途                        |
| ------------- | ---------------------------------------------------- | --------------------------- |
| GitHub        | [github.com/YiTiane](https://github.com/YiTiane)     | 主仓 + 资产仓 + Pages       |
| Mapbox        | [account.mapbox.com](https://account.mapbox.com)     | 静态地图 token + 自定义样式 |
| jsDelivr      | [www.jsdelivr.com](https://www.jsdelivr.com)         | 主 CDN                      |
| Statically    | [statically.io](https://statically.io)               | 备 CDN                      |
| GitHub Status | [www.githubstatus.com](https://www.githubstatus.com) | 婚礼当天看                  |

---

> 这份计划在你勾选每一个方块的过程中，会逐渐从一份清单变成一段记忆——也是你们婚礼故事的一部分。
>
> _愿这条路上没有大风，只有小雨；没有遗漏的步骤，只有按部就班的温柔。_
>
> **— Forever Begins · 实施计划 v2.11 · 2026-05-11 · Phase 1 ✓ done · Phase 2 §0/§1 ✓ done · Phase 3 / §2 Story + Globe + Finale hardened baseline ✓ done · Phase 4 online smoke matrix ✓ done · Phase 5 Family Astro album ✓ deployed（保护点 `f8a45a8`）· Phase 6 Details / Closing / global nav 已部署，venue map 已按二道桥民俗风情一条街真实坐标校准并发布 misc CDN `v1.2.0`；本轮完成邀请 / Family / The Day 文案与标题收口，并将 Family 可见标题与导航改为「彩蛋」，待提交与 GitHub Pages CI 验证 · 路线图已同步进主仓根目录 `PLAN.md`，以本文件所在提交作为版本化保护点 · dimension gate 覆盖 34 张，稳定网络可 clean pass；CDN 抖动按 warning 记录且不误报可用性**
