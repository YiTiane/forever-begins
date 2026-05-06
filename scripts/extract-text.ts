/**
 * extract-text.ts
 *
 * 收集字体子集所需的全部字符：
 *   ① 扫描 src/**\/\*.{astro,tsx,ts,jsx,js,json,md} 中的所有字符
 *   ② union 上 seed-text.ts 中的"已知 UI 文案"
 *   ③ 加上结构性兜底：常用全角/半角标点、阿拉伯数字、罗马数字
 *
 * 输出：
 *   scripts/.subset-chars.txt    （UTF-8，每行一字符不重复）
 *   scripts/.subset-chars.json   （含分类统计，调试用）
 *
 * 用法：
 *   pnpm tsx scripts/extract-text.ts
 *
 * 触发时机：
 *   - 手动：每次新增 / 修改 src/ 内容后跑一次
 *   - 自动：subset-fonts.sh 运行前会先调用本脚本（保证 chars 同步）
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SEED_TEXT } from './seed-text.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SRC_ROOT = path.join(REPO_ROOT, 'src');
const OUT_TXT = path.join(__dirname, '.subset-chars.txt');
const OUT_JSON = path.join(__dirname, '.subset-chars.json');

const SCAN_EXTS = new Set(['.astro', '.tsx', '.ts', '.jsx', '.js', '.json', '.md', '.mdx']);

/** 兜底标点 + 数字。即便 src/ 没出现也保证 subset 含。 */
const PUNCT_AND_DIGITS = (() => {
  const halfWidth = '0123456789' + 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ' + ' ,.;:!?\'"()-_/\\@#$%&*+=[]{}<>|~`^';
  // 用 codepoint 数组避免源文件里的 curly quote 被误解析
  const fullWidthDigits = '０１２３４５６７８９〇一二三四五六七八九十两';
  const fullWidthPunct = String.fromCodePoint(
    0xff0c, // ，
    0x3002, // 。
    0x3001, // 、
    0xff1b, // ；
    0xff1a, // ：
    0xff01, // ！
    0xff1f, // ？
    0x201c, // "
    0x201d, // "
    0x2018, // '
    0x2019, // '
    0xff08, // （
    0xff09, // ）
    0x2014, // —
    0x2026, // …
    0x300a, // 《
    0x300b, // 》
    0x3010, // 【
    0x3011, // 】
    0x300c, // 「
    0x300d, // 」
    0x300e, // 『
    0x300f, // 』
    0x3008, // 〈
    0x3009, // 〉
  );
  const fullWidth = fullWidthDigits + fullWidthPunct;
  const romanNumerals = 'IVX' + 'iⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩ';
  const misc = '·❀❦✦❧✿•◦●○↓→←↑✓✗⚠️⭐❤︎♡';
  return halfWidth + fullWidth + romanNumerals + misc;
})();

async function* walk(dir: string): AsyncGenerator<string> {
  let entries;
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else if (entry.isFile() && SCAN_EXTS.has(path.extname(entry.name).toLowerCase())) yield full;
  }
}

async function main(): Promise<void> {
  const buckets: Record<string, Set<string>> = {
    fromSrc: new Set(),
    fromSeed: new Set(),
    fromFallback: new Set(),
  };

  // ① 扫 src/
  let scannedFiles = 0;
  for await (const file of walk(SRC_ROOT)) {
    const text = await fs.readFile(file, 'utf-8');
    for (const ch of text) buckets.fromSrc!.add(ch);
    scannedFiles++;
  }

  // ② Seed
  for (const ch of SEED_TEXT) buckets.fromSeed!.add(ch);

  // ③ 兜底
  for (const ch of PUNCT_AND_DIGITS) buckets.fromFallback!.add(ch);

  // 全 union
  const all = new Set<string>();
  for (const set of Object.values(buckets)) {
    for (const ch of set) {
      // 跳过控制字符 / 替代区 / 行结束
      const cp = ch.codePointAt(0)!;
      if (cp < 0x20) continue;                        // 控制字符
      if (cp >= 0xd800 && cp <= 0xdfff) continue;    // surrogate
      if (cp === 0xfeff) continue;                    // BOM
      all.add(ch);
    }
  }

  // 排序输出（按 codepoint，便于 diff）
  const sorted = [...all].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);
  await fs.writeFile(OUT_TXT, sorted.join('\n') + '\n', 'utf-8');

  // 分类统计（用于审计）
  const stats = {
    totalUnique: all.size,
    bySource: {
      src: buckets.fromSrc!.size,
      seed: buckets.fromSeed!.size,
      fallback: buckets.fromFallback!.size,
    },
    byScript: {
      ascii: 0,
      latin1Sup: 0,        // U+0080–U+00FF
      cjkUnified: 0,       // U+4E00–U+9FFF
      cjkExtA: 0,          // U+3400–U+4DBF
      cjkExtB: 0,          // U+20000+
      bopomofo: 0,
      hiragana: 0,
      katakana: 0,
      cjkPunct: 0,         // U+3000–U+303F
      fullwidth: 0,        // U+FF00–U+FFEF
      symbols: 0,
      other: 0,
    },
    scannedFiles,
    output: { txt: OUT_TXT, json: OUT_JSON },
  };

  for (const ch of all) {
    const cp = ch.codePointAt(0)!;
    if (cp < 0x80) stats.byScript.ascii++;
    else if (cp < 0x100) stats.byScript.latin1Sup++;
    else if (cp >= 0x4e00 && cp <= 0x9fff) stats.byScript.cjkUnified++;
    else if (cp >= 0x3400 && cp <= 0x4dbf) stats.byScript.cjkExtA++;
    else if (cp >= 0x20000) stats.byScript.cjkExtB++;
    else if (cp >= 0x3000 && cp <= 0x303f) stats.byScript.cjkPunct++;
    else if (cp >= 0xff00 && cp <= 0xffef) stats.byScript.fullwidth++;
    else if (cp >= 0x3040 && cp <= 0x309f) stats.byScript.hiragana++;
    else if (cp >= 0x30a0 && cp <= 0x30ff) stats.byScript.katakana++;
    else if (cp >= 0x3100 && cp <= 0x312f) stats.byScript.bopomofo++;
    else if (cp >= 0x2000 && cp <= 0x2fff) stats.byScript.symbols++;
    else stats.byScript.other++;
  }

  await fs.writeFile(OUT_JSON, JSON.stringify(stats, null, 2), 'utf-8');

  console.log(`[extract-text] scanned ${scannedFiles} files in src/`);
  console.log(`[extract-text] unique chars: ${all.size}`);
  console.log(`  · ASCII:        ${stats.byScript.ascii}`);
  console.log(`  · CJK 统一:     ${stats.byScript.cjkUnified}`);
  console.log(`  · CJK 标点:     ${stats.byScript.cjkPunct}`);
  console.log(`  · 全角:         ${stats.byScript.fullwidth}`);
  console.log(`  · 其他符号:     ${stats.byScript.symbols + stats.byScript.other}`);
  console.log(`[extract-text] wrote ${path.relative(REPO_ROOT, OUT_TXT)}`);
  console.log(`[extract-text] stats ${path.relative(REPO_ROOT, OUT_JSON)}`);
}

await main();
