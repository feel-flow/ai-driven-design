#!/usr/bin/env node
// ff-dev-toolkit正本の固定Gitオブジェクトから、レビューした対象だけを一方向に出力する。
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const FILES = Object.freeze([
  'MASTER.md', '01-context/PROJECT.md', '02-design/DOMAIN.md',
  '02-design/ARCHITECTURE.md', '03-implementation/PATTERNS.md',
  '04-quality/TESTING.md', '05-operations/DEPLOYMENT.md',
]);
const PREFIX = 'plugins/ff-dev-toolkit';
const METADATA = '.template-source.json';
const LICENSE = 'SOURCE_LICENSE.txt';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const json = value => `${JSON.stringify(value, null, 2)}\n`;
const assert = (condition, message) => { if (!condition) throw new Error(message); };
// Hookから渡るGit設定で別リポジトリやURL書換えを参照しない。ネットワーク操作は行わない。
const gitEnvironment = () => ({ ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))),
  GIT_CONFIG_GLOBAL: process.platform === 'win32' ? 'NUL' : '/dev/null', GIT_CONFIG_SYSTEM: process.platform === 'win32' ? 'NUL' : '/dev/null' });
const git = (cwd, ...args) => execFileSync('git', args, { cwd, env: gitEnvironment(), stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
const gitText = (cwd, ...args) => git(cwd, ...args).toString('utf8').trim();
function repository(root, name) {
  root = fs.realpathSync(root);
  assert(fs.realpathSync(gitText(root, 'rev-parse', '--show-toplevel')) === root, 'Use a repository root');
  const origin = gitText(root, 'remote', 'get-url', 'origin');
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  assert(new RegExp(`^(?:https://|git@|ssh://git@)github\\.com[/:]feel-flow/${escaped}(?:\\.git)?/?$`).test(origin), `Unexpected ${name} origin`);
  return root;
}
function targetFile(root, relative) {
  let current = root;
  for (const part of ['docs-template', ...relative.split('/')]) {
    current = path.join(current, part);
    const stat = fs.lstatSync(current, { throwIfNoEntry: false });
    assert(!stat?.isSymbolicLink(), `Output symlink is not allowed: ${relative}`);
  }
  return current;
}
function currentHash(root, relative) {
  const filename = targetFile(root, relative);
  const stat = fs.lstatSync(filename, { throwIfNoEntry: false });
  assert(!stat || stat.isFile(), `Output is not a regular file: ${relative}`);
  return stat ? hash(fs.readFileSync(filename)) : null;
}
function blob(source, commit, relative) {
  const entry = gitText(source, 'ls-tree', commit, '--', relative);
  assert(/^100(?:644|755) blob [0-9a-f]+\t/.test(entry), `Missing or non-file source: ${relative}`);
  return git(source, 'show', `${commit}:${relative}`);
}
export function prepare({ source, target, ref, commit }) {
  assert(typeof ref === 'string' && ref && !ref.startsWith('-') && !/[\x00-\x20]/.test(ref), 'A source ref or tag is required');
  assert(typeof commit === 'string' && /^(?:[0-9a-f]{40}|[0-9a-f]{64})$/.test(commit), 'Provide the full expected source commit');
  source = repository(source, 'feelflow-plugins');
  target = repository(target, 'ai-spec-driven-development');
  assert(source !== target, 'Source and target must differ');
  const resolved = gitText(source, 'rev-parse', '--verify', `${ref}^{commit}`);
  assert(resolved === commit, 'Source ref no longer resolves to the expected commit');
  const plugin = JSON.parse(blob(source, commit, `${PREFIX}/.claude-plugin/plugin.json`).toString('utf8'));
  assert(plugin.name === 'ff-dev-toolkit' && typeof plugin.version === 'string' && typeof plugin.license === 'string', 'Invalid source plugin metadata');
  const files = new Map(FILES.map(name => [name, blob(source, commit, `${PREFIX}/docs-template/${name}`)]));
  files.set(LICENSE, blob(source, commit, `${PREFIX}/LICENSE`));
  const provenance = {
    schemaVersion: 1,
    source: { repository: 'feel-flow/feelflow-plugins', ref, commit, plugin: 'ff-dev-toolkit', version: plugin.version, license: plugin.license },
    // これはGit由来の証拠であり、Releaseの公開や配布完了を証明するフィールドではない。
    files: Object.fromEntries([...files].map(([name, value]) => [name, hash(value)])),
  };
  files.set(METADATA, Buffer.from(json(provenance)));
  const entries = [...files].map(([name, value]) => ({ path: `docs-template/${name}`, before: currentHash(target, name), after: hash(value) }));
  return { target, files, provenance, review: { schemaVersion: 1, source: provenance.source, entries } };
}
export function verify(prepared) {
  const mismatches = prepared.review.entries.filter(entry => currentHash(prepared.target, entry.path.slice('docs-template/'.length)) !== entry.after).map(entry => entry.path);
  return { matches: mismatches.length === 0, mismatches, source: prepared.provenance.source };
}
export function applyExport(prepared, reviewed) {
  assert(JSON.stringify(reviewed) === JSON.stringify(prepared.review), 'Reviewed plan differs from source or target; inspect a fresh plan before applying');
  // 全対象の現在値を再照合してから書く。計画後の利用者編集は上書きしない。
  for (const entry of prepared.review.entries) {
    assert(currentHash(prepared.target, entry.path.slice('docs-template/'.length)) === entry.before, `Target changed after review: ${entry.path}`);
  }
  const changed = [];
  for (const [name, bytes] of prepared.files) {
    const entry = prepared.review.entries.find(candidate => candidate.path === `docs-template/${name}`);
    const beforeWrite = currentHash(prepared.target, name);
    if (beforeWrite === entry.after) continue;
    assert(beforeWrite === entry.before, `Target changed during export: ${entry.path}`);
    const destination = targetFile(prepared.target, name);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    const temporary = `${destination}.${process.pid}.export-tmp`;
    let written = false;
    try {
      fs.writeFileSync(temporary, bytes, { flag: 'wx' });
      written = true;
      assert(currentHash(prepared.target, name) === entry.before, `Target changed during export: ${entry.path}`);
      fs.renameSync(temporary, destination);
    } finally {
      if (written) fs.rmSync(temporary, { force: true });
    }
    changed.push(`docs-template/${name}`);
  }
  const result = verify(prepared);
  assert(result.matches, `Export incomplete; current output differs: ${result.mismatches.join(', ')}`);
  return { changed, source: prepared.provenance.source };
}
export function main(args) {
  const options = { target: process.cwd() };
  let mode = 'plan', reviewPath;
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (['--source', '--target', '--ref', '--commit', '--review-plan'].includes(flag)) {
      const value = args[++i];
      assert(value && !value.startsWith('--'), `${flag} requires a value`);
      if (flag === '--review-plan') reviewPath = value; else options[flag.slice(2)] = value;
    } else if (['--apply', '--check'].includes(flag)) {
      assert(mode === 'plan', 'Choose --apply or --check');
      mode = flag.slice(2);
    } else throw new Error(`Unknown flag: ${flag}`);
  }
  assert(options.source, '--source is required');
  assert(mode === 'apply' ? reviewPath : !reviewPath, '--review-plan is required only with --apply');
  const prepared = prepare(options);
  const result = mode === 'check' ? verify(prepared) : mode === 'apply' ? applyExport(prepared, JSON.parse(fs.readFileSync(reviewPath, 'utf8'))) : prepared.review;
  process.stdout.write(json(result));
  return mode === 'check' && !result.matches ? 1 : 0;
}
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try { process.exitCode = main(process.argv.slice(2)); }
  catch (error) {
    // Gitのstderrには認証やローカル情報が含まれうるため転記しない。
    process.stderr.write(`Template export: ${error.status !== undefined ? 'Git operation failed; no source was verified' : error.message}\n`);
    process.exitCode = 1;
  }
}
