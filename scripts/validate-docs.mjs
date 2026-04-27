#!/usr/bin/env node
/**
 * validate-docs.mjs
 * AI仕様駆動開発のコア7文書の存在を検証するスクリプト
 *
 * Usage: node scripts/validate-docs.mjs [docs-dir]
 *   docs-dir: 検証対象のdocsディレクトリ（デフォルト: ./docs-template）
 */
import fs from 'fs';
import path from 'path';

const DOCS_DIR = process.argv[2] || 'docs-template';
const MINIMUM_LINES = 10;

// コア7文書の定義（最小構成 — フォルダ名の揺れに対応）
const CORE_DOCS = [
  {
    name: 'MASTER.md',
    paths: ['MASTER.md'],
    required: true,
    description: '中央管理ハブ',
  },
  {
    name: 'PROJECT.md',
    paths: ['01-context/PROJECT.md', '01-business/PROJECT.md'],
    required: true,
    description: 'ビジョン・要件',
  },
  {
    name: 'ARCHITECTURE.md',
    paths: ['02-design/ARCHITECTURE.md'],
    required: true,
    description: 'システム設計',
  },
  {
    name: 'DOMAIN.md',
    paths: ['02-design/DOMAIN.md', '01-context/DOMAIN.md', '01-business/DOMAIN.md'],
    required: true,
    description: 'ビジネスロジック',
  },
  {
    name: 'PATTERNS.md',
    paths: ['03-implementation/PATTERNS.md'],
    required: true,
    description: '実装パターン',
  },
  {
    name: 'TESTING.md',
    paths: ['04-quality/TESTING.md', '07-quality/TESTING.md'],
    required: true,
    description: 'テスト戦略',
  },
  {
    name: 'DEPLOYMENT.md',
    paths: ['05-operations/DEPLOYMENT.md'],
    required: true,
    description: '運用手順',
  },
];

// Frontmatter バリデーション定数
const REQUIRED_FRONTMATTER_FIELDS = ['title', 'version', 'status', 'owner', 'created', 'updated'];
const VALID_STATUS_VALUES = ['draft', 'review', 'approved'];
const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

/**
 * Frontmatter を解析する（外部ライブラリ不要の簡易版パーサー）
 * mcp/src/utils.ts parseFrontMatter を参考にした簡略化実装。
 * 差異: null返却（utils.tsは空meta返却）、trim付きデリミタ判定、YAML配列非対応、引用符除去あり。
 * @param {string} content - ファイル全文
 * @returns {{ meta: Record<string, string>, body: string, warnings: string[] } | null}
 *   Frontmatter未検出時または閉じデリミタ欠落時は null
 */
function parseFrontMatter(content) {
  const DELIM = '---';
  const lines = content.split(/\r?\n/);
  if (lines[0].trim() !== DELIM) return null;

  let i = 1;
  const metaLines = [];
  while (i < lines.length && lines[i].trim() !== DELIM) {
    metaLines.push(lines[i]);
    i++;
  }
  if (i === lines.length) return null; // 閉じデリミタなし

  const meta = {};
  const warnings = [];
  for (const line of metaLines) {
    if (!line.trim()) continue; // 空行はスキップ
    const match = line.match(/^(\w+)\s*:\s*(.+)$/);
    if (match) {
      // 先頭/末尾の引用符を個別に除去
      meta[match[1]] = match[2].replace(/^["']|["']$/g, '').trim();
    } else {
      warnings.push(`パース不能な行: "${line.trim()}"`);
    }
  }
  return { meta, body: lines.slice(i + 1).join('\n'), warnings };
}

/**
 * Frontmatter のバリデーション
 * @param {Record<string, string>} meta - パース済み Frontmatter
 * @param {string} fileName - ファイル名（エラーメッセージ用）
 * @returns {{ level: 'error', message: string }[]} バリデーションエラーの配列（問題なしの場合は空配列）
 */
function validateFrontMatter(meta, fileName) {
  const errors = [];

  // 必須フィールド存在チェック（in 演算子でプロパティ存在を正確に判定）
  for (const field of REQUIRED_FRONTMATTER_FIELDS) {
    if (!(field in meta)) {
      errors.push({ level: 'error', message: `${fileName}: 必須フィールド "${field}" が未設定です` });
    }
  }

  // status 値検証
  if (meta.status && !VALID_STATUS_VALUES.includes(meta.status)) {
    errors.push({
      level: 'error',
      message: `${fileName}: status "${meta.status}" は無効です (有効値: ${VALID_STATUS_VALUES.join(', ')})`,
    });
  }

  // version 形式検証（SemVer）
  if (meta.version && !SEMVER_PATTERN.test(meta.version)) {
    errors.push({
      level: 'error',
      message: `${fileName}: version "${meta.version}" はSemVer形式ではありません (例: 1.0.0)`,
    });
  }

  return errors;
}

// MASTER.md 必須セクション
const MASTER_REQUIRED_SECTIONS = [
  { pattern: /プロジェクト|project\s*(name|識別)/i, label: 'プロジェクト識別情報' },
  { pattern: /技術スタック|tech(nology)?\s*stack|FE|BE|DB|Infra/i, label: '技術スタック要約' },
  { pattern: /ルール|rule|命名|naming|convention/i, label: '守るべきルール' },
  { pattern: /確認プロトコル|情報不足|verification|推論禁止/i, label: '情報不足時の確認プロトコル' },
  { pattern: /索引|index|リンク|ドキュメント一覧/i, label: 'ドキュメント索引' },
];

let exitCode = 0;
const results = { files: [], master: [], quality: [], summary: {} };

// --- ファイル存在チェック ---
console.log('\n== 必須ファイル ==\n');
let foundCount = 0;

for (const doc of CORE_DOCS) {
  let found = null;
  for (const p of doc.paths) {
    const fullPath = path.join(DOCS_DIR, p);
    if (fs.existsSync(fullPath)) {
      found = fullPath;
      break;
    }
  }
  if (found) {
    const lines = fs.readFileSync(found, 'utf-8').split('\n').length;
    console.log(`  ✅ ${doc.name} — ${found} (${lines}行)`);
    results.files.push({ name: doc.name, status: 'ok', path: found, lines });
    foundCount++;
  } else {
    console.log(`  ❌ ${doc.name} — 未作成 (${doc.description})`);
    results.files.push({ name: doc.name, status: 'missing' });
    if (doc.required) exitCode = 1;
  }
}

// --- MASTER.md セクションチェック ---
const masterPath = path.join(DOCS_DIR, 'MASTER.md');
if (fs.existsSync(masterPath)) {
  const masterContent = fs.readFileSync(masterPath, 'utf-8');
  console.log('\n== MASTER.md セクション ==\n');
  let sectionFound = 0;

  for (const section of MASTER_REQUIRED_SECTIONS) {
    if (section.pattern.test(masterContent)) {
      console.log(`  ✅ ${section.label}`);
      results.master.push({ label: section.label, status: 'ok' });
      sectionFound++;
    } else {
      console.log(`  ❌ ${section.label} — 見つかりません`);
      results.master.push({ label: section.label, status: 'missing' });
    }
  }
}

// --- 内容品質チェック ---
console.log('\n== 内容品質 ==\n');
let qualityIssues = 0;

for (const file of results.files) {
  if (file.status !== 'ok') continue;
  const content = fs.readFileSync(file.path, 'utf-8');

  // 行数チェック
  if (file.lines < MINIMUM_LINES) {
    console.log(`  ⚠️  ${file.name} — 内容が少ない (${file.lines}行, 最低${MINIMUM_LINES}行推奨)`);
    qualityIssues++;
  }

  // プレースホルダー残存チェック
  const placeholders = content.match(/\{\{[^}]+\}\}/g);
  const todos = content.match(/\bTODO\b|\bTBD\b/gi);
  if (placeholders) {
    console.log(`  ⚠️  ${file.name} — プレースホルダー残存 (${placeholders.length}箇所)`);
    qualityIssues++;
  }
  if (todos) {
    console.log(`  ⚠️  ${file.name} — TODO/TBD残存 (${todos.length}箇所)`);
    qualityIssues++;
  }

  // 見出し構造チェック
  const headings = content.match(/^## .+/gm);
  if (!headings || headings.length === 0) {
    console.log(`  ⚠️  ${file.name} — ## レベルの見出しがありません`);
    qualityIssues++;
  }
}

if (qualityIssues === 0) {
  console.log('  ✅ 品質上の問題は見つかりませんでした');
}

// --- Frontmatter バリデーション ---
console.log('\n== Frontmatter ==\n');
let frontmatterIssues = 0;

for (const file of results.files) {
  if (file.status !== 'ok') continue;
  const content = fs.readFileSync(file.path, 'utf-8');
  const parsed = parseFrontMatter(content);

  if (!parsed) {
    console.log(`  ❌ ${file.name} — Frontmatter が見つかりません`);
    frontmatterIssues++;
    exitCode = 1;
    continue;
  }

  // パース時の警告を表示
  for (const warn of parsed.warnings) {
    console.log(`  ⚠️  ${file.name}: ${warn}`);
    frontmatterIssues++;
  }

  const errors = validateFrontMatter(parsed.meta, file.name);
  for (const err of errors) {
    console.log(`  ❌ ${err.message}`);
    frontmatterIssues++;
    exitCode = 1;
  }
}

if (frontmatterIssues === 0) {
  console.log('  ✅ Frontmatterに問題はありません');
}

// --- サマリー ---
const total = CORE_DOCS.length;
const score = Math.round((foundCount / total) * 100);
console.log('\n== サマリー ==\n');
console.log(`  必須ファイル: ${foundCount}/${total} ✅`);
console.log(`  品質警告: ${qualityIssues}件${qualityIssues === 0 ? ' ✅' : ' ⚠️'}`);
console.log(`  Frontmatter: ${frontmatterIssues}件${frontmatterIssues === 0 ? ' ✅' : ' ❌'}`);
console.log(`  全体スコア: ${score}%${score === 100 ? ' — 完璧！' : score >= 70 ? ' — 良好' : ' — 改善が必要'}`);
console.log('');

process.exit(exitCode);
