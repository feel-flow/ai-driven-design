import { afterEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
// @ts-expect-error 検証対象はNode.jsで直接実行するESMスクリプト
import { FILES, prepare, applyExport, verify } from './export-toolkit-templates.mjs';

const roots: string[] = [];
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); for (const root of roots.splice(0)) fs.rmSync(root, { recursive: true, force: true }); });
function temp() { const root = fs.mkdtempSync(path.join(os.tmpdir(), 'template-export-')); roots.push(root); return root; }
const env = { ...Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_'))), GIT_CONFIG_GLOBAL: '/dev/null', GIT_CONFIG_SYSTEM: '/dev/null' };
const git = (root: string, ...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8', env, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
function put(root: string, name: string, data: string) { const p = path.join(root, name); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, data); }
function fixture() {
  const source = temp(), target = temp();
  for (const [root, repo] of [[source, 'feelflow-plugins'], [target, 'ai-spec-driven-development']]) {
    git(root, 'init', '-b', 'test'); git(root, 'config', 'user.name', 'Test'); git(root, 'config', 'user.email', 'test@example.invalid');
    git(root, 'remote', 'add', 'origin', `https://github.com/feel-flow/${repo}.git`);
  }
  const prefix = 'plugins/ff-dev-toolkit';
  for (const file of FILES) put(source, `${prefix}/docs-template/${file}`, `source ${file}\n`);
  put(source, `${prefix}/docs-template/.github/skills/example/SKILL.md`, 'never export skills');
  put(source, `${prefix}/.claude-plugin/plugin.json`, JSON.stringify({ name: 'ff-dev-toolkit', version: '0.90.0', license: 'Apache-2.0' }));
  put(source, `${prefix}/LICENSE`, 'Apache-2.0 license fixture\n');
  git(source, 'add', '.'); git(source, 'commit', '-m', 'source'); git(source, 'tag', 'release-fixture');
  const commit = git(source, 'rev-parse', 'HEAD');
  put(target, 'docs-template/MASTER.md', 'legacy MASTER\n');
  put(target, 'docs-template/SETUP_CURSOR.md', 'preserve legacy URL\n');
  return { source, target, ref: 'release-fixture', commit, prefix };
}
describe('固定コミットからのテンプレート直接配布', () => {
  it('symlink経由のCLIでも計画・出力・実ファイル不一致を判定する', () => {
    const f = fixture(), cli = path.join(temp(), 'export-alias.mjs');
    fs.symlinkSync(fileURLToPath(new URL('./export-toolkit-templates.mjs', import.meta.url)), cli);
    const args = [cli, '--source', f.source, '--target', f.target, '--ref', f.ref, '--commit', f.commit];
    const plan = JSON.parse(execFileSync(process.execPath, args, { env, encoding: 'utf8' }));
    expect(plan.entries).toHaveLength(9);
    const reviewed = path.join(temp(), 'review.json');
    fs.writeFileSync(reviewed, JSON.stringify(plan));
    const applied = JSON.parse(execFileSync(process.execPath, [...args, '--apply', '--review-plan', reviewed], { env, encoding: 'utf8' }));
    expect(applied.changed).toHaveLength(9);
    put(f.target, 'docs-template/MASTER.md', 'later edit');
    const checked = spawnSync(process.execPath, [...args, '--check'], { env, encoding: 'utf8' });
    expect(checked.status).toBe(1);
    expect(JSON.parse(checked.stdout).mismatches).toContain('docs-template/MASTER.md');
  });

  it('呼び出し元HookのGit設定が別リポジトリを指していても対象rootだけを読む', () => {
    const f = fixture();
    vi.stubEnv('GIT_DIR', path.join(f.target, '.git'));
    vi.stubEnv('GIT_WORK_TREE', f.target);
    vi.stubEnv('GIT_CONFIG_COUNT', '1');
    vi.stubEnv('GIT_CONFIG_KEY_0', 'remote.origin.url');
    vi.stubEnv('GIT_CONFIG_VALUE_0', 'https://example.invalid/wrong');
    expect(prepare(f).provenance.source.commit).toBe(f.commit);
  });
  it('既定の計画は書き込まず、承認した対象7文書と由来・ライセンスのみ出力する', () => {
    const f = fixture(), p = prepare(f);
    expect(fs.readFileSync(path.join(f.target, 'docs-template/MASTER.md'), 'utf8')).toBe('legacy MASTER\n');
    expect(verify(p).matches).toBe(false);
    expect(applyExport(p, p.review).changed).toHaveLength(9);
    expect(verify(p).matches).toBe(true);
    expect(fs.readFileSync(path.join(f.target, 'docs-template/SETUP_CURSOR.md'), 'utf8')).toBe('preserve legacy URL\n');
    expect(fs.existsSync(path.join(f.target, 'docs-template/.github'))).toBe(false);
    const provenance = JSON.parse(fs.readFileSync(path.join(f.target, 'docs-template/.template-source.json'), 'utf8'));
    expect(provenance.source).toMatchObject({ commit: f.commit, version: '0.90.0', license: 'Apache-2.0' });
    expect(fs.readFileSync(path.join(f.target, 'docs-template/SOURCE_LICENSE.txt'), 'utf8')).toBe('Apache-2.0 license fixture\n');
    const before = fs.statSync(path.join(f.target, 'docs-template/MASTER.md')).mtimeMs;
    const repeat = prepare(f); expect(applyExport(repeat, repeat.review).changed).toEqual([]);
    expect(fs.statSync(path.join(f.target, 'docs-template/MASTER.md')).mtimeMs).toBe(before);
  });
  it('未コミットのsource変更を混入させず、移動したrefと不一致SHAを拒否する', () => {
    const f = fixture(); put(f.source, `${f.prefix}/docs-template/MASTER.md`, 'uncommitted');
    const p = prepare(f); applyExport(p, p.review);
    expect(fs.readFileSync(path.join(f.target, 'docs-template/MASTER.md'), 'utf8')).toBe('source MASTER.md\n');
    git(f.source, 'add', '.'); git(f.source, 'commit', '-m', 'change'); git(f.source, 'tag', '-f', 'release-fixture');
    expect(() => prepare(f)).toThrow(/expected commit/);
  });
  it('計画後のtarget編集を拒否し、他の対象にも書き込まない', () => {
    const f = fixture(), p = prepare(f);
    put(f.target, 'docs-template/MASTER.md', 'hand edited');
    expect(() => applyExport(p, p.review)).toThrow(/changed after review/);
    expect(fs.existsSync(path.join(f.target, 'docs-template/01-context/PROJECT.md'))).toBe(false);
    expect(() => applyExport(prepare(f), p.review)).toThrow(/Reviewed plan differs/);
  });
  it('checkはsource由来ファイル・ライセンス・provenanceの改変を検出する', () => {
    const f = fixture(), p = prepare(f); applyExport(p, p.review);
    const checked = prepare(f);
    for (const file of ['MASTER.md', 'SOURCE_LICENSE.txt', '.template-source.json']) {
      const full = path.join(f.target, 'docs-template', file), bytes = fs.readFileSync(full);
      fs.writeFileSync(full, 'tampered');
      expect(verify(checked).mismatches).toContain(`docs-template/${file}`);
      fs.writeFileSync(full, bytes);
    }
    expect(verify(prepare(f)).matches).toBe(true);
  });
  it('出力開始後に後続ファイルが編集されても上書きしない', () => {
    const f = fixture(), p = prepare(f), rename = fs.renameSync.bind(fs);
    vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      rename(from, to);
      if (String(to).endsWith('/MASTER.md')) put(f.target, 'docs-template/01-context/PROJECT.md', 'concurrent edit');
    });
    expect(() => applyExport(p, p.review)).toThrow(/changed during export/);
    expect(fs.readFileSync(path.join(f.target, 'docs-template/01-context/PROJECT.md'), 'utf8')).toBe('concurrent edit');
    expect(fs.existsSync(path.join(f.target, 'docs-template/.template-source.json'))).toBe(false);
  });
  it('最後の出力後に先行ファイルが変わった場合も完了扱いにしない', () => {
    const f = fixture(), p = prepare(f), rename = fs.renameSync.bind(fs);
    vi.spyOn(fs, 'renameSync').mockImplementation((from, to) => {
      rename(from, to);
      if (String(to).endsWith('/.template-source.json')) put(f.target, 'docs-template/MASTER.md', 'concurrent edit');
    });
    expect(() => applyExport(p, p.review)).toThrow(/Export incomplete/);
    expect(verify(p).matches).toBe(false);
    expect(fs.readFileSync(path.join(f.target, 'docs-template/MASTER.md'), 'utf8')).toBe('concurrent edit');
  });
  it('sourceのsymlinkとtargetのsymlinkを出力前に拒否する', () => {
    const f = fixture();
    fs.unlinkSync(path.join(f.source, f.prefix, 'docs-template/MASTER.md'));
    fs.symlinkSync('/etc/hosts', path.join(f.source, f.prefix, 'docs-template/MASTER.md'));
    git(f.source, 'add', '.'); git(f.source, 'commit', '-m', 'symlink');
    expect(() => prepare({ ...f, ref: 'HEAD', commit: git(f.source, 'rev-parse', 'HEAD') })).toThrow(/non-file source/);
    fs.unlinkSync(path.join(f.target, 'docs-template/MASTER.md'));
    fs.symlinkSync('/etc/hosts', path.join(f.target, 'docs-template/MASTER.md'));
    expect(() => prepare(f)).toThrow(/symlink/);
  });
  it('無関係なoriginとレビュー内容の改変を拒否する', () => {
    const f = fixture(), p = prepare(f);
    expect(() => applyExport(p, { ...p.review, source: { ...p.review.source, commit: '0'.repeat(40) } })).toThrow(/Reviewed plan differs/);
    git(f.target, 'remote', 'set-url', 'origin', 'https://evil.example/feel-flow/ai-spec-driven-development.git');
    expect(() => prepare(f)).toThrow(/origin/);
  });
});
