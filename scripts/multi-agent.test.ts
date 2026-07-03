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

// 前回実行の stale 結果がレポートに混入しない回帰（issue #450）
// end-to-end 実行はアダプタが実 CLI を叩くため、末尾の main を無効化して source し、
// cleanup_stale_results / execute_tasks を直接検証する。実在の perspective 名を使う
// （cleanup は当スクリプトが生成し得る perspective ファイルのみ削除するため）。
describe("multi-agent.sh stale-result cleanup (issue #450)", () => {
  const SCRIPTS_DIR = join(REPO_ROOT, "scripts");

  /** main を無効化した multi-agent.sh を temp に書き出しパスを返す */
  function neutralizedScript(): string {
    const raw = readFileSync(SCRIPT, "utf8");
    const neutralized = raw.replace(/^main "\$@"$/m, "true");
    const file = join(stubDir, "multi-agent.neutralized.sh");
    writeFileSync(file, neutralized);
    return file;
  }

  /**
   * bash ハーネスを実行する。ハーネスは必ず `set -euo pipefail` で始め、source 直後に
   * SCRIPT_DIR を実 scripts へ上書きする（$0 由来の推定では perspectives を解決できない）。
   */
  function runHarness(body: string[], workDir: string) {
    const harness = ["set -euo pipefail", 'source "$NEUT"', 'SCRIPT_DIR="$SCRIPTS_DIR"', ...body];
    return spawnSync("bash", ["-c", harness.join("\n")], {
      encoding: "utf8",
      timeout: 30_000,
      env: { ...process.env, NEUT: neutralizedScript(), SCRIPTS_DIR, WORKDIR: workDir },
    });
  }

  it("2回目の実行で、1回目のみに存在した perspective の結果がレポートに含まれない（マルチ CLI）", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ma-stale-"));
    try {
      const r = runHarness(
        [
          "MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; TASK_TYPE=review",
          'OUTPUT_DIR="$WORKDIR/.review-results"',
          'mkdir -p "$OUTPUT_DIR/codex-cli" "$OUTPUT_DIR/claude-code"',
          "# run 1: codex-cli で security-analysis + code-review、claude-code で test-analysis",
          'echo STALE-CODEX-SEC   > "$OUTPUT_DIR/codex-cli/security-analysis.md"',
          'echo RUN1-CODEX-REVIEW > "$OUTPUT_DIR/codex-cli/code-review.md"',
          'echo STALE-CLAUDE-TEST > "$OUTPUT_DIR/claude-code/test-analysis.md"',
          "generate_review_report >/dev/null 2>&1",
          "# run 2: cleanup 後、codex-cli の code-review のみ実行",
          "cleanup_stale_results",
          "# 別 CLI に跨って stale が消えること（マルチ CLI 分離）",
          'test ! -f "$OUTPUT_DIR/codex-cli/security-analysis.md" || { echo LEAK-CODEX; exit 3; }',
          'test ! -f "$OUTPUT_DIR/claude-code/test-analysis.md"   || { echo LEAK-CLAUDE; exit 3; }',
          'echo RUN2-CODEX-REVIEW > "$OUTPUT_DIR/codex-cli/code-review.md"',
          "generate_review_report >/dev/null 2>&1",
          'cat "$OUTPUT_DIR/integrated-report.md"',
        ],
        workDir,
      );
      expect(r.status).toBe(0);
      // 今回実行した code-review の最新結果は含まれる
      expect(r.stdout).toContain("RUN2-CODEX-REVIEW");
      // 1回目のみの stale（両 CLI）は含まれない ← 受け入れ基準
      expect(r.stdout).not.toContain("STALE-CODEX-SEC");
      expect(r.stdout).not.toContain("STALE-CLAUDE-TEST");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it("execute_tasks が実行時に cleanup_stale_results を走らせる（実行時の配線ガード）", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ma-wire-"));
    try {
      const r = runHarness(
        [
          "MODE=cross-model; STRATEGY=balanced; BASE_BRANCH=develop; TASK_TYPE=review; PARALLEL=false",
          'OUTPUT_DIR="$WORKDIR/.review-results"',
          "# 実アダプタ/CLI 起動を防ぐため run_single_task を no-op 化",
          "run_single_task() { return 0; }",
          'mkdir -p "$OUTPUT_DIR/codex-cli"',
          'echo STALE > "$OUTPUT_DIR/codex-cli/security-analysis.md"',
          "# 1 エントリのプランで execute_tasks を実行 → 内部で cleanup が走るはず",
          'EXECUTION_PLAN="codex-cli:code-review"',
          "execute_tasks >/dev/null 2>&1",
          'test ! -f "$OUTPUT_DIR/codex-cli/security-analysis.md" && echo WIRED_OK || echo WIRING_BROKEN',
        ],
        workDir,
      );
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("WIRED_OK");
      expect(r.stdout).not.toContain("WIRING_BROKEN");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  it("空 OUTPUT_DIR ではガードが働き、削除ロジックに入らず正常終了する", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ma-guard-"));
    try {
      const r = runHarness(
        [
          "TASK_TYPE=review",
          "# OUTPUT_DIR が空なら rm 系ロジックへ進まず no-op で return 0",
          'OUTPUT_DIR=""',
          "cleanup_stale_results",
          "echo GUARD_OK",
        ],
        workDir,
      );
      expect(r.status).toBe(0);
      expect(r.stdout).toContain("GUARD_OK");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
