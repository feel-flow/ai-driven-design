import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, rmSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

// multi-agent.sh の実行プラン生成の回帰テスト（PR #449）
// - review 既定プランから copilot-cli が除外されること
// - --cli copilot-cli による明示オプトインが distributed / cross-model 両モードで機能すること
// - 空プランがサイレント成功しないこと（exit 1）
// - config 読み込みで set -e によるサイレント終了が起きないこと（apply_task_defaults / load_config）
//
// CLI 検出を決定論化するため、5 CLI すべてのスタブ実行ファイルを PATH 先頭に置く。
// dry-run とプラン構築のみを検証するので、スタブが実際に呼ばれることはない。

const REPO_ROOT = resolve(__dirname, "..");
const SCRIPT = join(REPO_ROOT, "scripts", "multi-agent.sh");
const CLI_COMMANDS = ["claude", "codex", "copilot", "gemini", "cursor-agent"];

let stubDir: string;

function runScript(args: string[], extraEnv: Record<string, string> = {}) {
  const result = spawnSync("bash", [SCRIPT, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    timeout: 30_000,
    env: {
      ...process.env,
      PATH: `${stubDir}:${process.env.PATH ?? ""}`,
      ...extraEnv,
    },
  });
  return { ...result, output: `${result.stdout}\n${result.stderr}` };
}

/** プラン表示から「cli 名の見出し行」以降のパースペクティブ行を取り出す */
function planEntries(output: string): string[] {
  return output
    .split("\n")
    .filter((line) => /^\s+(\S+) \[[a-z-]+\]:$/.test(line) || /^\s+- /.test(line));
}

beforeAll(() => {
  stubDir = mkdtempSync(join(tmpdir(), "multi-agent-stubs-"));
  for (const cmd of CLI_COMMANDS) {
    const stub = join(stubDir, cmd);
    writeFileSync(stub, "#!/bin/sh\nexit 0\n");
    chmodSync(stub, 0o755);
  }
});

afterAll(() => {
  rmSync(stubDir, { recursive: true, force: true });
});

describe("multi-agent.sh review plan (distributed mode)", () => {
  it("既定プランから copilot-cli を除外し、test-analysis→codex / comment-analysis→gemini に割り当てる", () => {
    const r = runScript(["--task", "review", "--dry-run"]);
    expect(r.status).toBe(0);

    const entries = planEntries(r.output).join("\n");
    expect(entries).not.toContain("copilot-cli");
    expect(r.output).toContain("copilot-cli skipped (metered)");

    // codex が test-analysis を担当
    expect(r.output).toMatch(/codex-cli \[standard\]:[\s\S]*?- test-analysis/);
    // gemini が comment-analysis を担当
    expect(r.output).toMatch(/gemini-cli \[free-tier\]:[\s\S]*?- comment-analysis/);
  });

  it("--cli copilot-cli の明示オプトインで copilot がプランに載る", () => {
    const r = runScript(["--task", "review", "--cli", "copilot-cli", "--dry-run"]);
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/copilot-cli \[metered\]:[\s\S]*?- test-analysis/);
    expect(r.output).toMatch(/copilot-cli \[metered\]:[\s\S]*?- comment-analysis/);
  });

  it("--cli copilot-cli --perspective test-analysis で該当観点のみ実行される", () => {
    const r = runScript([
      "--task", "review",
      "--cli", "copilot-cli",
      "--perspective", "test-analysis",
      "--dry-run",
    ]);
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/copilot-cli \[metered\]:[\s\S]*?- test-analysis/);
    expect(r.output).not.toMatch(/- comment-analysis/);
  });
});

describe("multi-agent.sh review plan (cross-model mode)", () => {
  it("既定では copilot をスキップし、他の 4 CLI で同一観点を実行する", () => {
    const r = runScript(["--task", "review", "--mode", "cross-model", "--dry-run"]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("copilot-cli skipped (metered)");
    const entries = planEntries(r.output).join("\n");
    expect(entries).not.toContain("copilot-cli");
    // 4 CLI が code-review を実行
    const count = (entries.match(/- code-review/g) ?? []).length;
    expect(count).toBe(4);
  });

  it("--cli copilot-cli で cross-model にもオプトインできる", () => {
    const r = runScript([
      "--task", "review", "--mode", "cross-model",
      "--cli", "copilot-cli", "--dry-run",
    ]);
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/copilot-cli \[metered\]:[\s\S]*?- code-review/);
  });
});

describe("multi-agent.sh silent-failure guards", () => {
  it("空プランは exit 1 で失敗する（サイレント成功しない）", () => {
    // 存在しない perspective でフィルタ → プランが空になる（CLI は一切起動されない）
    const r = runScript([
      "--task", "review",
      "--cli", "copilot-cli",
      "--perspective", "nonexistent-perspective",
    ]);
    expect(r.status).toBe(1);
    expect(r.output).toContain("Execution plan is empty");
  });

  it("explore タスクでは copilot が既定プランに残る", () => {
    const r = runScript(["--task", "explore", "--description", "test", "--dry-run"]);
    expect(r.status).toBe(0);
    expect(r.output).toMatch(/copilot-cli \[metered\]:[\s\S]*?- api-surface-analysis/);
  });
});

describe("multi-agent.sh config loading (set -e regression)", () => {
  const hasYq = spawnSync("bash", ["-c", "command -v yq"]).status === 0;

  it("同梱 config（全値供給）でもサイレント終了しない — apply_task_defaults 回帰", () => {
    const r = runScript(["--task", "review", "--dry-run"]);
    expect(r.status).toBe(0);
    expect(r.output).toContain("Execution Plan");
  });

  it.skipIf(!hasYq)(
    "output_dir を持たない v2 config でもサイレント終了しない — load_config 回帰",
    () => {
      const cfg = join(stubDir, "min-config.yaml");
      writeFileSync(
        cfg,
        ['version: "2.0"', "tasks:", "  review:", "    cost_strategy: balanced", ""].join("\n"),
      );
      const r = runScript(["--task", "review", "--config", cfg, "--dry-run"]);
      expect(r.status).toBe(0);
      expect(r.output).toContain("Execution Plan");
    },
  );
});

// レポートが「今回の実行分（EXECUTION_PLAN）」だけを収録し、前回実行の stale 結果を
// 混入させない回帰（issue #450）。アダプタが実 CLI を叩くため末尾の main を無効化して
// source し、generate_report / execute_tasks を直接検証する。方針: レポートは plan 駆動で
// 収集し、実行前に「プランの自分の出力先だけ」を rm する（他 CLI/他 perspective/ユーザー
// ファイルは非破壊）。不正な cli/perspective トークンは validate_execution_plan で
// fail-loud に拒否し、write/clear/read のどの経路でも OUTPUT_DIR 外へ出さない。
describe("multi-agent.sh plan-scoped report (issue #450)", () => {
  /**
   * main を無効化した multi-agent.sh を temp に書き出しパスを返す。呼び出し形の変化に
   * 寛容にするため `main` で始まる行全体を対象にし（`main "$@"` / `main "$@" || exit`
   * 等）、置換不発なら loud fail する（実装形変更を silent no-op で見逃さない）。
   */
  function neutralizedScript(): string {
    const raw = readFileSync(SCRIPT, "utf8");
    const neutralized = raw.replace(/^main(?:\s.*)?$/m, "true");
    if (neutralized === raw) {
      throw new Error("neutralization failed: エントリポイント 'main ...' 行が見つからない（呼び出し形が変わった可能性）");
    }
    const file = join(stubDir, "multi-agent.neutralized.sh");
    writeFileSync(file, neutralized);
    return file;
  }

  /** bash ハーネスを実行する。必ず `set -euo pipefail` で始める（途中失敗を握り潰さない）。 */
  function runHarness(body: string[], workDir: string) {
    const harness = ["set -euo pipefail", 'source "$NEUT"', ...body];
    return spawnSync("bash", ["-c", harness.join("\n")], {
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env, NEUT: neutralizedScript(), WORKDIR: workDir },
    });
  }

  // 公開ディスパッチャ generate_report を TASK_TYPE で切り替えて 3 タスク種を検証する
  // （検証込みの実エントリポイント。builder 直呼びより実挙動に近い）。
  const TASK_TYPES = ["review", "explore", "implement"] as const;

  // 境界条件（プラン外除外/非破壊・空プラン・欠落可視化）を 3 タスク種すべてで検証する。
  for (const type of TASK_TYPES) {
    it(`${type}: レポートは EXECUTION_PLAN のエントリのみ収録し、プラン外の stale/ユーザーファイルを混入させない（非破壊）`, () => {
      const workDir = mkdtempSync(join(tmpdir(), `ma-${type}-`));
      try {
        const r = runHarness(
          [
            `MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; DESCRIPTION=test; TASK_TYPE=${type}`,
            'OUTPUT_DIR="$WORKDIR/out"',
            'mkdir -p "$OUTPUT_DIR/codex-cli" "$OUTPUT_DIR/claude-code"',
            "# 今回のプラン分（codex-cli:alpha, claude-code:beta）",
            'echo CURRENT-CODEX  > "$OUTPUT_DIR/codex-cli/alpha.md"',
            'echo CURRENT-CLAUDE > "$OUTPUT_DIR/claude-code/beta.md"',
            "# プラン外: 前回のみの stale と、ユーザー自身の Markdown",
            'echo STALE-GAMMA > "$OUTPUT_DIR/codex-cli/gamma.md"',
            'echo USER-NOTES  > "$OUTPUT_DIR/codex-cli/my-notes.md"',
            "EXECUTION_PLAN=$'codex-cli:alpha\\nclaude-code:beta'",
            "generate_report >/dev/null 2>&1",
            "# レポートは読むだけ — ディスク上のプラン外ファイルは消えない（非破壊）",
            'test -f "$OUTPUT_DIR/codex-cli/gamma.md" && test -f "$OUTPUT_DIR/codex-cli/my-notes.md" && echo NONDESTRUCTIVE_OK',
            'cat "$OUTPUT_DIR/integrated-report.md"',
          ],
          workDir,
        );
        expect(r.status).toBe(0);
        expect(r.stdout).toContain("CURRENT-CODEX");
        expect(r.stdout).toContain("CURRENT-CLAUDE");
        expect(r.stdout).not.toContain("STALE-GAMMA");
        expect(r.stdout).not.toContain("USER-NOTES");
        expect(r.stdout).toContain("NONDESTRUCTIVE_OK");
      } finally {
        rmSync(workDir, { recursive: true, force: true });
      }
    });

    it(`${type}: 空プランでは (No ${type} results found.) に落ちる`, () => {
      const workDir = mkdtempSync(join(tmpdir(), `ma-empty-${type}-`));
      try {
        const r = runHarness(
          [
            `MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; DESCRIPTION=test; TASK_TYPE=${type}`,
            'OUTPUT_DIR="$WORKDIR/out"',
            'mkdir -p "$OUTPUT_DIR/codex-cli"',
            "# ディスクに残骸があってもプランが空なら何も収録しない",
            'echo STALE > "$OUTPUT_DIR/codex-cli/alpha.md"',
            'EXECUTION_PLAN=""',
            "generate_report >/dev/null 2>&1",
            'cat "$OUTPUT_DIR/integrated-report.md"',
          ],
          workDir,
        );
        expect(r.status).toBe(0);
        expect(r.stdout).toContain(`(No ${type} results found.)`);
        expect(r.stdout).not.toContain("STALE");
      } finally {
        rmSync(workDir, { recursive: true, force: true });
      }
    });

    it(`${type}: プラン内エントリの出力欠落を黙殺せずレポートに可視化する`, () => {
      const workDir = mkdtempSync(join(tmpdir(), `ma-missing-${type}-`));
      try {
        const r = runHarness(
          [
            `MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; DESCRIPTION=test; TASK_TYPE=${type}`,
            'OUTPUT_DIR="$WORKDIR/out"',
            'mkdir -p "$OUTPUT_DIR/codex-cli"',
            "# codex-cli:alpha は成功、gemini-cli:alpha は出力欠落（CLI 失敗相当）",
            'echo OK-CODEX > "$OUTPUT_DIR/codex-cli/alpha.md"',
            "EXECUTION_PLAN=$'codex-cli:alpha\\ngemini-cli:alpha'",
            "generate_report >/dev/null 2>&1",
            'cat "$OUTPUT_DIR/integrated-report.md"',
          ],
          workDir,
        );
        expect(r.status).toBe(0);
        expect(r.stdout).toContain("OK-CODEX");
        expect(r.stdout).toContain("gemini-cli — alpha");
        expect(r.stdout).toContain("No output produced by this task");
      } finally {
        rmSync(workDir, { recursive: true, force: true });
      }
    });
  }

  it("部分実行（--cli 相当）: 他 CLI の既存結果はレポート非収録だが、ディスク上は破壊しない", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ma-partial-"));
    try {
      const r = runHarness(
        [
          "MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; TASK_TYPE=review",
          'OUTPUT_DIR="$WORKDIR/out"',
          'mkdir -p "$OUTPUT_DIR/codex-cli" "$OUTPUT_DIR/gemini-cli"',
          "# 前回は全 CLI 実行、今回は codex-cli のみ実行（部分実行）",
          'echo OLD-GEMINI > "$OUTPUT_DIR/gemini-cli/code-review.md"',
          'echo NEW-CODEX  > "$OUTPUT_DIR/codex-cli/code-review.md"',
          'EXECUTION_PLAN="codex-cli:code-review"',
          "generate_report >/dev/null 2>&1",
          'if [[ -f "$OUTPUT_DIR/gemini-cli/code-review.md" ]]; then echo GEMINI-KEPT; fi',
          'cat "$OUTPUT_DIR/integrated-report.md"',
        ],
        workDir,
      );
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("NEW-CODEX");
      expect(r.stdout).not.toContain("OLD-GEMINI");
      expect(r.stdout).toContain("GEMINI-KEPT");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it("同名 cli/perspective の前回 stale は execute_tasks の事前クリアで混入せず、欠落として可視化される", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ma-samepath-"));
    try {
      const r = runHarness(
        [
          "MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; TASK_TYPE=review; PARALLEL=false",
          'OUTPUT_DIR="$WORKDIR/out"',
          'mkdir -p "$OUTPUT_DIR/codex-cli"',
          "# 前回の同名 stale。今回 CLI は失敗して上書きしない（run_single_task 失敗で模擬）",
          'echo STALE-PREV > "$OUTPUT_DIR/codex-cli/code-review.md"',
          "run_single_task() { return 1; }",
          'EXECUTION_PLAN="codex-cli:code-review"',
          "# execute_tasks は task 失敗を検知して非0（握り潰さず rc を明示検証）。",
          '# 事前クリアで stale ファイルは消える。想定外の rc はテストで検出する。',
          'rc_exec=0; execute_tasks >/dev/null 2>&1 || rc_exec=$?',
          'echo "rc_exec=$rc_exec"',
          "generate_report >/dev/null 2>&1",
          'cat "$OUTPUT_DIR/integrated-report.md"',
        ],
        workDir,
      );
      expect(r.status).toBe(0);
      // run_single_task 失敗により execute_tasks は非0（task 失敗）で返る（設定不備等の別要因ではない）
      expect(r.stdout).toContain("rc_exec=1");
      // 前回の同名 stale は current として混入しない
      expect(r.stdout).not.toContain("STALE-PREV");
      // 代わりに欠落として可視化される
      expect(r.stdout).toContain("No output produced by this task");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it("パストラバーサルな cli/perspective 名は fail-loud で拒否され、OUTPUT_DIR 外を読み書きしない", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ma-traversal-"));
    try {
      const r = runHarness(
        [
          "MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; TASK_TYPE=review; PARALLEL=false",
          'OUTPUT_DIR="$WORKDIR/out"',
          'mkdir -p "$OUTPUT_DIR/codex-cli" "$WORKDIR/secretdir"',
          'echo TOP-SECRET > "$WORKDIR/secretdir/secret.md"',
          "run_single_task() { echo RAN-TASK >&2; return 0; }",
          "# $OUTPUT_DIR/codex-cli/../../secretdir/secret(.md) == $WORKDIR/secretdir/secret.md",
          'EXECUTION_PLAN="codex-cli:../../secretdir/secret"',
          "# 1) execute_tasks（write/clear 経路）は検証で fail-loud し、clear/run へ進まない",
          'rc_exec=0; execute_tasks >/dev/null 2>"$WORKDIR/exec_err.txt" || rc_exec=$?',
          'echo "rc_exec=$rc_exec"',
          'if grep -q "unsafe token" "$WORKDIR/exec_err.txt"; then echo EXEC_LOUD; fi',
          'if grep -q "RAN-TASK" "$WORKDIR/exec_err.txt"; then echo TASK_RAN; else echo TASK_NOT_RAN; fi',
          'if [[ -f "$WORKDIR/secretdir/secret.md" ]]; then echo SECRET_KEPT; else echo SECRET_DELETED; fi',
          "# 2) generate_report（read 経路）も fail-loud し、秘密を読まない",
          'rc_rep=0; generate_report >/dev/null 2>"$WORKDIR/rep_err.txt" || rc_rep=$?',
          'echo "rc_rep=$rc_rep"',
          'if grep -q "unsafe token" "$WORKDIR/rep_err.txt"; then echo REP_LOUD; fi',
          'if [[ -f "$OUTPUT_DIR/integrated-report.md" ]] && grep -q TOP-SECRET "$OUTPUT_DIR/integrated-report.md"; then echo SECRET_LEAKED; else echo NO_LEAK; fi',
        ],
        workDir,
      );
      expect(r.status).toBe(0);
      // execute_tasks: 非0 で fail-loud、run_single_task 未実行、外部 secret は削除されない
      expect(r.stdout).toContain("rc_exec=1");
      expect(r.stdout).toContain("EXEC_LOUD");
      expect(r.stdout).toContain("TASK_NOT_RAN");
      expect(r.stdout).toContain("SECRET_KEPT");
      // generate_report: 非0 で fail-loud、秘密はレポートに漏れない
      expect(r.stdout).toContain("rc_rep=1");
      expect(r.stdout).toContain("REP_LOUD");
      expect(r.stdout).toContain("NO_LEAK");
      expect(r.stdout).not.toContain("TOP-SECRET");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it("不正な EXECUTION_PLAN（区切り ':' 無し・'.'・'..'）は generate_report で fail-loud に拒否される", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ma-malformed-"));
    try {
      const r = runHarness(
        [
          "MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; TASK_TYPE=review",
          'OUTPUT_DIR="$WORKDIR/out"',
          'mkdir -p "$OUTPUT_DIR/codex-cli"',
          "check() { # $1=plan $2=ラベル",
          '  local rc=0; EXECUTION_PLAN="$1" generate_report >/dev/null 2>"$WORKDIR/e.txt" || rc=$?',
          '  if [[ "$rc" -ne 0 ]] && grep -qiE "unsafe|malformed" "$WORKDIR/e.txt"; then echo "$2:LOUD"; else echo "$2:PASSED-THROUGH"; fi',
          "}",
          '# ":" 無し（cli_name と persp_name が同値になる不正形）',
          'check "codex-cli" NOCOLON',
          '# perspective が ".." （traversal 境界）',
          'check "codex-cli:.." DOTDOT',
          '# cli_name が "." （境界）',
          'check ".:code-review" DOT',
        ],
        workDir,
      );
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("NOCOLON:LOUD");
      expect(r.stdout).toContain("DOTDOT:LOUD");
      expect(r.stdout).toContain("DOT:LOUD");
      expect(r.stdout).not.toContain("PASSED-THROUGH");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it("clear_planned_outputs は execute_tasks 経由でプラン外（他 CLI/他 perspective/ユーザー .md）を消さない", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ma-clearscope-"));
    try {
      const r = runHarness(
        [
          "MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; TASK_TYPE=review; PARALLEL=false",
          'OUTPUT_DIR="$WORKDIR/out"',
          'mkdir -p "$OUTPUT_DIR/codex-cli" "$OUTPUT_DIR/gemini-cli"',
          "# プラン対象（今回クリア＆再生成される）",
          'echo PREV > "$OUTPUT_DIR/codex-cli/code-review.md"',
          "# プラン外: 他 CLI / 同 CLI 別 perspective / ユーザーファイル",
          'echo KEEP-GEMINI  > "$OUTPUT_DIR/gemini-cli/code-review.md"',
          'echo KEEP-OTHERP  > "$OUTPUT_DIR/codex-cli/security-analysis.md"',
          'echo KEEP-USER    > "$OUTPUT_DIR/codex-cli/my-notes.md"',
          "run_single_task() { return 0; }",
          'EXECUTION_PLAN="codex-cli:code-review"',
          "execute_tasks >/dev/null 2>&1 || true",
          '# プラン対象だけがクリアされ、他は温存される',
          'if [[ ! -f "$OUTPUT_DIR/codex-cli/code-review.md" ]]; then echo TARGET_CLEARED; fi',
          'if [[ -f "$OUTPUT_DIR/gemini-cli/code-review.md" ]]; then echo GEMINI_KEPT; fi',
          'if [[ -f "$OUTPUT_DIR/codex-cli/security-analysis.md" ]]; then echo OTHERP_KEPT; fi',
          'if [[ -f "$OUTPUT_DIR/codex-cli/my-notes.md" ]]; then echo USER_KEPT; fi',
        ],
        workDir,
      );
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("TARGET_CLEARED");
      expect(r.stdout).toContain("GEMINI_KEPT");
      expect(r.stdout).toContain("OTHERP_KEPT");
      expect(r.stdout).toContain("USER_KEPT");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it("プラン内の重複 cli:perspective はレポートに二重掲載されない", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ma-dup-"));
    try {
      const r = runHarness(
        [
          "MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; TASK_TYPE=review",
          'OUTPUT_DIR="$WORKDIR/out"',
          'mkdir -p "$OUTPUT_DIR/codex-cli"',
          'echo DUP-CONTENT > "$OUTPUT_DIR/codex-cli/code-review.md"',
          "# 同じエントリを重複させる",
          "EXECUTION_PLAN=$'codex-cli:code-review\\ncodex-cli:code-review'",
          "generate_report >/dev/null 2>&1",
          '# 見出しの出現回数を数える',
          'grep -c "^## codex-cli — code-review " "$OUTPUT_DIR/integrated-report.md" | sed "s/^/HEADING_COUNT=/"',
        ],
        workDir,
      );
      expect(r.status).toBe(0);
      // 重複エントリでも見出しは 1 回だけ
      expect(r.stdout).toContain("HEADING_COUNT=1");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
