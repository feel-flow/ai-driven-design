#!/usr/bin/env node
/**
 * sync-to-public.mjs
 * internal リポジトリ (SSOT) から public リポジトリへ、frontmatter で
 * `visibility: public` と明示されたドキュメントだけを一方向同期する。
 *
 * Usage:
 *   node scripts/sync-to-public.mjs --target <public-checkout> [--source <dir>] [--dry-run]
 *
 * 設計原則 (Issue #467):
 *   - fail-safe: visibility が 'public' 以外（'internal'・未指定・frontmatter なし）は
 *     絶対に同期しない。公開はオプトイン。
 *   - fail-loud: 不正な visibility 値を1つでも検出したら、書き込みを一切行わずに exit 1。
 *   - guard: target は origin が public リポジトリを指す git repo のみ許可
 *     （internal への逆方向同期・無関係リポジトリへの書き込みを入口で遮断）。
 *   - 非破壊: target 側のファイルは削除しない。同期対象外になったファイルは
 *     orphan（凍結）として報告のみ行う。
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/** 同期対象のルートディレクトリ（これ以外は visibility があっても対象外） */
const SYNC_ROOT = 'docs';
/** visibility フィールドの許容値 */
const VALID_VISIBILITY_VALUES = ['public', 'internal'];
/** 同期を許可する target の origin URL（public リポジトリのみ、-internal は不一致） */
const PUBLIC_ORIGIN_PATTERN =
  /github\.com[/:]feel-flow\/ai-spec-driven-development(\.git)?\/?$/;

const EXIT_OK = 0;
const EXIT_ERROR = 1;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(EXIT_ERROR);
}

/** コマンドライン引数を解析する */
function parseArgs(argv) {
  const args = { source: process.cwd(), target: null, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--source':
        args.source = argv[++i];
        break;
      case '--target':
        args.target = argv[++i];
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      default:
        fail(`不明な引数: ${argv[i]}`);
    }
  }
  if (!args.target) fail('--target <public-checkout> は必須です');
  return args;
}

/**
 * frontmatter から visibility 値を取り出す。
 * @returns {{ hasFrontmatter: boolean, visibility: string | undefined }}
 *   frontmatter なし / 閉じデリミタ欠落は hasFrontmatter: false（= 同期対象外）
 */
function readVisibility(content) {
  const DELIM = '---';
  const lines = content.split(/\r?\n/);
  if ((lines[0] ?? '').trim() !== DELIM) {
    return { hasFrontmatter: false, visibility: undefined };
  }
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === DELIM) {
      return { hasFrontmatter: true, visibility: undefined };
    }
    const match = lines[i].match(/^visibility:\s*['"]?([^'"]*?)['"]?\s*$/);
    if (match) {
      return { hasFrontmatter: true, visibility: match[1] };
    }
  }
  // 閉じデリミタ欠落 = 壊れた frontmatter → fail-safe で同期対象外
  return { hasFrontmatter: false, visibility: undefined };
}

/** dir 以下の .md ファイルを相対パスで列挙する（dir が無ければ空） */
function listMarkdownFiles(rootDir, subDir) {
  const base = path.join(rootDir, subDir);
  if (!fs.existsSync(base)) return [];
  const results = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        results.push(path.relative(rootDir, abs));
      }
    }
  };
  walk(base);
  return results.sort();
}

/** target が「public リポジトリの checkout」であることを検証する */
function assertValidTarget(source, target) {
  if (!fs.existsSync(target)) {
    fail(`target が存在しません: ${target}`);
  }
  if (fs.realpathSync(target) === fs.realpathSync(source)) {
    fail('source と target が同一ディレクトリです');
  }
  const git = (...gitArgs) =>
    spawnSync('git', ['-C', target, ...gitArgs], { encoding: 'utf8' });

  const inWorkTree = git('rev-parse', '--is-inside-work-tree');
  if (inWorkTree.status !== 0 || inWorkTree.stdout.trim() !== 'true') {
    fail(`target は git リポジトリではありません: ${target}`);
  }
  const originUrl = git('remote', 'get-url', 'origin');
  if (originUrl.status !== 0) {
    fail(`target に origin リモートがありません: ${target}`);
  }
  const url = originUrl.stdout.trim();
  if (!PUBLIC_ORIGIN_PATTERN.test(url)) {
    fail(
      `target の origin が public リポジトリではありません: ${url}\n` +
        '   （internal への逆方向同期・無関係リポジトリへの書き込みを防ぐため中断します）',
    );
  }
}

function main() {
  const { source, target, dryRun } = parseArgs(process.argv.slice(2));
  assertValidTarget(source, target);

  const sourceFiles = listMarkdownFiles(source, SYNC_ROOT);
  if (sourceFiles.length === 0) {
    fail(`source に ${SYNC_ROOT}/ 配下の .md ファイルが見つかりません: ${source}`);
  }

  // 1st pass: 全ファイルを分類し、不正値があれば書き込み前に全体を中断する（fail-loud）
  const publishFiles = [];
  const skippedFiles = [];
  const invalidFiles = [];
  for (const relPath of sourceFiles) {
    const content = fs.readFileSync(path.join(source, relPath), 'utf8');
    const { visibility } = readVisibility(content);
    if (visibility !== undefined && !VALID_VISIBILITY_VALUES.includes(visibility)) {
      invalidFiles.push({ relPath, visibility });
    } else if (visibility === 'public') {
      publishFiles.push({ relPath, content });
    } else {
      skippedFiles.push(relPath);
    }
  }

  if (invalidFiles.length > 0) {
    console.error('❌ 不正な visibility 値を検出したため、同期を中断しました（書き込みなし）:');
    for (const { relPath, visibility } of invalidFiles) {
      console.error(`   - ${relPath}: "${visibility}" (許容値: ${VALID_VISIBILITY_VALUES.join(' | ')})`);
    }
    process.exit(EXIT_ERROR);
  }

  // 2nd pass: コピー実行（非破壊・冪等）
  let copied = 0;
  let unchanged = 0;
  for (const { relPath, content } of publishFiles) {
    const dest = path.join(target, relPath);
    const exists = fs.existsSync(dest);
    if (exists && fs.readFileSync(dest, 'utf8') === content) {
      unchanged++;
      console.log(`  = unchanged: ${relPath}`);
      continue;
    }
    if (dryRun) {
      console.log(`  + would copy: ${relPath}`);
      copied++;
      continue;
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, content);
    copied++;
    console.log(`  + copied: ${relPath}`);
  }

  // orphan 報告: target にあるが同期対象になっていないファイル（削除はしない）
  const publishSet = new Set(publishFiles.map((f) => f.relPath));
  const orphans = listMarkdownFiles(target, SYNC_ROOT).filter((rel) => !publishSet.has(rel));
  if (orphans.length > 0) {
    console.log(`\nℹ️  orphan（target に存在するが同期対象外。public 側で凍結扱い。削除はしません）:`);
    for (const rel of orphans) {
      console.log(`   - ${rel}`);
    }
  }

  console.log(
    `\n✅ sync-to-public 完了${dryRun ? '（dry-run）' : ''}: ` +
      `copied=${copied} unchanged=${unchanged} skipped=${skippedFiles.length} orphans=${orphans.length}`,
  );
  process.exit(EXIT_OK);
}

main();
