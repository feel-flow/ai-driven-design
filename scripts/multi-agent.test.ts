import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync, chmodSync, rmSync } from "node:fs";
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
