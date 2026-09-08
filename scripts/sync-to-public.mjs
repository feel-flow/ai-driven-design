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
 *   - fail-loud: 不正な visibility 値・壊れた frontmatter（閉じデリミタ欠落）を
 *     1つでも検出したら、書き込みを一切行わずに exit 1。
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
/** 公開側で編集する2.0標準・案内。別の同期元からの更新・凍結判定を禁止する。 */
const PUBLIC_OWNED_DOCS = new Set(JSON.parse(fs.readFileSync(new URL('./public-owned-docs.json', import.meta.url), 'utf8')));
/** visibility フィールドの許容値 */
const VALID_VISIBILITY_VALUES = ['public', 'internal'];
/**
 * 同期を許可する target の origin URL（public リポジトリのみ、-internal は末尾アンカーで不一致）。
 * 先頭もアンカーし、パス中に public URL を含むだけの無関係ホストを弾く。
 * 許容形式: https://github.com/... / git@github.com:... / ssh://git@github.com/...
 */
const PUBLIC_ORIGIN_PATTERN =
  /^(?:https:\/\/|git@|ssh:\/\/git@)github\.com[/:]feel-flow\/ai-spec-driven-development(?:\.git)?\/?$/i;

const EXIT_OK = 0;
const EXIT_ERROR = 1;

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(EXIT_ERROR);
}

/** コマンドライン引数を解析する */
function parseArgs(argv) {
  const args = { source: process.cwd(), target: null, dryRun: false };
  const flagValue = (flag, value) => {
    if (value === undefined || value.startsWith('--')) {
      fail(`${flag} に値がありません`);
    }
    return value;
  };
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--source':
        args.source = flagValue('--source', argv[++i]);
        break;
      case '--target':
        args.target = flagValue('--target', argv[++i]);
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      default:
        fail(`不明な引数: ${argv[i]}`);
    }
  }
  if (!args.target) fail('--target <public-checkout> は必須です');
  if (!fs.existsSync(args.source)) fail(`source が存在しません: ${args.source}`);
  return args;
}

/**
 * frontmatter から visibility 値を取り出す。
 * 先に閉じデリミタの存在を確認し、走査は frontmatter ブロック内に限定する
 * （本文中の `visibility:` 例文を拾って公開してしまう事故の防止）。
 *
 * @returns {{ kind: 'absent' | 'broken' | 'frontmatter', visibility: string | undefined }}
 *   - absent: frontmatter なし → 同期対象外（fail-safe の quiet skip）
 *   - broken: 開始デリミタはあるが閉じデリミタ欠落 → 呼び出し側で fail-loud にする
 *   - frontmatter: visibility はキーが無ければ undefined（= internal 扱い）。
 *     キーがあり値が空・許容値外の場合は呼び出し側の検証で fail-loud になる
 */
function readVisibility(content) {
  const DELIM = '---';
  const lines = content.split(/\r?\n/);
  if ((lines[0] ?? '').trim() !== DELIM) {
    return { kind: 'absent', visibility: undefined };
  }
  let closeIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === DELIM) {
      closeIndex = i;
      break;
    }
  }
  if (closeIndex === -1) {
    // 閉じデリミタ欠落 = 構造的に壊れたファイル。silent skip でも本文走査でもなく中断対象
    return { kind: 'broken', visibility: undefined };
  }
  for (let i = 1; i < closeIndex; i++) {
    const match = lines[i].match(/^visibility:\s*(.*)$/);
    if (match) {
      let value = match[1].trim();
      const quoted = value.match(/^(['"])(.*)\1$/);
      if (quoted) {
        value = quoted[2];
      } else {
        // 引用符なしの値は YAML インラインコメント（" #" 以降）を剥がす
        value = value.replace(/\s+#.*$/, '').trim();
      }
      return { kind: 'frontmatter', visibility: value };
    }
  }
  return { kind: 'frontmatter', visibility: undefined };
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
  const git = (...gitArgs) => {
    const result = spawnSync('git', ['-C', target, ...gitArgs], { encoding: 'utf8' });
    if (result.error) {
      // git 自体が起動できない（PATH に無い等）のを「target が git repo でない」と誤診しない
      fail(`git コマンドを実行できません (${result.error.code ?? 'unknown'}): ${result.error.message}`);
    }
    return result;
  };

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

  // 1st pass: 全ファイルを分類し、不正があれば書き込み前に全体を中断する（fail-loud）
  const publishFiles = [];
  const skippedFiles = [];
  const publicOwnedFiles = [];
  const invalidFiles = [];
  for (const relPath of sourceFiles) {
    const content = fs.readFileSync(path.join(source, relPath), 'utf8');
    const { kind, visibility } = readVisibility(content);
    if (kind === 'broken') {
      invalidFiles.push({ relPath, reason: 'frontmatter の閉じデリミタがありません' });
    } else if (visibility !== undefined && !VALID_VISIBILITY_VALUES.includes(visibility)) {
      invalidFiles.push({
        relPath,
        reason: `不正な visibility 値 "${visibility}" (許容値: ${VALID_VISIBILITY_VALUES.join(' | ')})`,
      });
    } else if (PUBLIC_OWNED_DOCS.has(relPath.split(path.sep).join('/'))) {
      publicOwnedFiles.push(relPath);
    } else if (visibility === 'public') {
      publishFiles.push({ relPath, content });
    } else {
      skippedFiles.push(relPath);
    }
  }

  if (invalidFiles.length > 0) {
    console.error('❌ 不正な frontmatter を検出したため、同期を中断しました（書き込みなし）:');
    for (const { relPath, reason } of invalidFiles) {
      console.error(`   - ${relPath}: ${reason}`);
    }
    process.exit(EXIT_ERROR);
  }

  for (const rel of publicOwnedFiles) {
    console.log(`  = public-owned（公開側が正本のため同期対象外）: ${rel}`);
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

  // dry-run では監査しやすいよう、同期対象外（fail-safe skip）の一覧も出す
  if (dryRun && skippedFiles.length > 0) {
    console.log('\nℹ️  skipped（visibility が public でないため同期対象外）:');
    for (const rel of skippedFiles) {
      console.log(`   - ${rel}`);
    }
  }

  // orphan 報告: target にあるが同期対象になっていないファイル（削除はしない）
  const publishSet = new Set(publishFiles.map((f) => f.relPath));
  const orphans = listMarkdownFiles(target, SYNC_ROOT).filter((rel) => !publishSet.has(rel) && !PUBLIC_OWNED_DOCS.has(rel.split(path.sep).join('/')));
  if (orphans.length > 0) {
    console.log(`\nℹ️  orphan（target に存在するが同期対象外。public 側で凍結扱い。削除はしません）:`);
    for (const rel of orphans) {
      console.log(`   - ${rel}`);
    }
  }

  console.log(
    `\n✅ sync-to-public 完了${dryRun ? '（dry-run）' : ''}: ` +
      `copied=${copied} unchanged=${unchanged} skipped=${skippedFiles.length} publicOwned=${publicOwnedFiles.length} orphans=${orphans.length}`,
  );
  process.exit(EXIT_OK);
}

main();
