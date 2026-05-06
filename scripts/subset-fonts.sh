#!/usr/bin/env bash
#
# subset-fonts.sh
#
# 用 pyftsubset 把 fonts-source/ 里的 8 个原始字体文件，
# 按 scripts/.subset-chars.txt 子集化为 public/fonts/*.woff2。
#
# 用法：
#   bash scripts/subset-fonts.sh
#
# 前置：
#   - brew install fonttools  （提供 pyftsubset）
#   - python3 -c "import brotli"  应成功（brotli 库提供 woff2 压缩）
#   - fonts-source/ 下 8 个原始字体已就绪
#
# 行为：
#   1. 自动跑 scripts/extract-text.ts，刷新 .subset-chars.txt
#   2. 对每个字体调 pyftsubset：
#      - --text-file=scripts/.subset-chars.txt
#      - --flavor=woff2
#      - --layout-features='*'  保留所有 OpenType layout（ligatures, kern, ss01...）
#      - --unicodes=U+0020-007F,...  ASCII / Latin-1 Sup 兜底
#      - --no-hinting  去掉 hinting，体积 ↓ 30-50%（屏幕渲染影响极小）
#   3. 输出到 public/fonts/*.woff2
#   4. 报告每个字体子集后的体积
#
# CPU 负载：单线程 pyftsubset，每个字体 1-10 秒不等，整体 < 1 分钟。
# 不会触发硬件热保护（远低于 sharp+AVIF 的负载）。

set -euo pipefail

# ── 路径 ─────────────────────────────────────────────────────────
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE_DIR="$ROOT/fonts-source"
OUT_DIR="$ROOT/public/fonts"
CHARS_FILE="$ROOT/scripts/.subset-chars.txt"

# ── 前置依赖检查 ─────────────────────────────────────────────────
if ! command -v pyftsubset >/dev/null 2>&1; then
  echo "[subset-fonts] ❌ pyftsubset 未找到。请装 fonttools：" >&2
  echo "    brew install fonttools" >&2
  exit 1
fi
if ! python3 -c "import brotli" 2>/dev/null; then
  echo "[subset-fonts] ❌ Python brotli 未装；woff2 输出依赖它。" >&2
  echo "    brew install brotli  或  pip3 install brotli" >&2
  exit 1
fi
if [ ! -d "$SOURCE_DIR" ]; then
  echo "[subset-fonts] ❌ $SOURCE_DIR 不存在；先跑 §1.1.6 下载字体源" >&2
  exit 1
fi

# ── Step 1: 刷新字符集（保证与 src/ 同步）──────────────────────────
echo "[subset-fonts] (1/2) refresh chars..."
if command -v pnpm >/dev/null 2>&1; then
  (cd "$ROOT" && pnpm exec tsx scripts/extract-text.ts) >/dev/null
else
  echo "[subset-fonts] ⚠️ pnpm 不可用，复用现有 $CHARS_FILE"
fi

if [ ! -f "$CHARS_FILE" ]; then
  echo "[subset-fonts] ❌ $CHARS_FILE 不存在，无法继续" >&2
  exit 1
fi

CHAR_COUNT=$(wc -l < "$CHARS_FILE" | tr -d ' ')
echo "[subset-fonts]    chars source: $CHARS_FILE ($CHAR_COUNT chars)"
mkdir -p "$OUT_DIR"

# ── Step 2: 子集化每个字体 ───────────────────────────────────────
echo "[subset-fonts] (2/2) subsetting..."

# pyftsubset 公共参数
COMMON_ARGS=(
  --text-file="$CHARS_FILE"
  --flavor=woff2
  --layout-features='*'
  --no-hinting
  --desubroutinize
)

# Latin 字体的 unicode-range 兜底（即便 chars 里没出现，也保留这些块——
# 让 ABC、阿拉伯数字、常见标点自然渲染，不依赖 chars 完整性）
LATIN_RANGES="--unicodes=U+0020-007E,U+00A0-00FF,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FB01-FB02"

# CJK 字体不需要 unicode-range 兜底（汉字字符空间过大；只用 chars 里实际出现的）

subset_font() {
  local input="$1"
  local output="$2"
  local label="$3"
  shift 3
  local -a extra_args
  extra_args=("$@")

  if [ ! -f "$input" ]; then
    printf "  ✗ %-32s 输入缺失: %s\n" "$label" "$input"
    return 1
  fi

  local before_size
  before_size=$(stat -f%z "$input" 2>/dev/null || stat -c%s "$input")

  local -a cmd
  cmd=(
    pyftsubset "$input"
    --output-file="$output"
    "${COMMON_ARGS[@]}"
  )
  if [ "${#extra_args[@]}" -gt 0 ]; then
    cmd+=("${extra_args[@]}")
  fi
  "${cmd[@]}"

  local after_size
  after_size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output")

  printf "  ✓ %-32s %6.0fKB → %5.1fKB  (%.1f%%)\n" \
    "$label" \
    "$(echo "$before_size / 1024" | bc -l)" \
    "$(echo "$after_size / 1024" | bc -l)" \
    "$(echo "$after_size * 100 / $before_size" | bc -l)"
}

# Latin: Cormorant Italic VF（保留 wght 轴 200-700）
subset_font \
  "$SOURCE_DIR/CormorantGaramond-Italic-VF.ttf" \
  "$OUT_DIR/cormorant-italic.woff2" \
  "Cormorant Italic VF" \
  $LATIN_RANGES

# Latin: Cormorant Regular VF
subset_font \
  "$SOURCE_DIR/CormorantGaramond-VF.ttf" \
  "$OUT_DIR/cormorant-roman.woff2" \
  "Cormorant Roman VF" \
  $LATIN_RANGES

# Latin: Inter Variable
subset_font \
  "$SOURCE_DIR/InterVariable.ttf" \
  "$OUT_DIR/inter-variable.woff2" \
  "Inter Variable" \
  $LATIN_RANGES

# CJK: 思源宋体 Light（章节标题）
subset_font \
  "$SOURCE_DIR/NotoSerifCJKsc-Light.otf" \
  "$OUT_DIR/noto-serif-sc-light.woff2" \
  "Noto Serif SC Light"

# CJK: 思源宋体 Regular（正文）
subset_font \
  "$SOURCE_DIR/NotoSerifCJKsc-Regular.otf" \
  "$OUT_DIR/noto-serif-sc-regular.woff2" \
  "Noto Serif SC Regular"

# CJK: 思源黑体 Light（UI / 数字辅助）
subset_font \
  "$SOURCE_DIR/NotoSansCJKsc-Light.otf" \
  "$OUT_DIR/noto-sans-sc-light.woff2" \
  "Noto Sans SC Light"

# CJK: 霞鹜文楷 Regular（中文大标题主气质）
subset_font \
  "$SOURCE_DIR/LXGWWenKai-Regular.ttf" \
  "$OUT_DIR/lxgw-wenkai.woff2" \
  "LXGW WenKai Regular"

# CJK: 马善政 Regular（落款专用，仅"愿此后山高路长 皆是我们的余生 ..."）
subset_font \
  "$SOURCE_DIR/MaShanZheng-Regular.ttf" \
  "$OUT_DIR/ma-shan-zheng.woff2" \
  "Ma Shan Zheng"

# ── 总览 ─────────────────────────────────────────────────────────
echo ""
echo "[subset-fonts] ✅ done. 输出：$OUT_DIR"
TOTAL_KB=$(du -sk "$OUT_DIR" | awk '{print $1}')
echo "[subset-fonts]    total ${TOTAL_KB}KB across $(ls -1 "$OUT_DIR"/*.woff2 | wc -l | tr -d ' ') woff2 files"
echo "[subset-fonts]    DESIGN.md §2.3.7 关键预算: 首屏 < 200KB（preload critical）"
echo "[subset-fonts]    实际首屏 preload 应只含 cormorant-italic + noto-serif-sc-light"
