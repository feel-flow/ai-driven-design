import { spawnSync } from "node:child_process";
import {
  chmodSync,
  existsSync,
  mkdtempSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "..");
const CODEX_SHIM = join(REPO_ROOT, "scripts", "codex-review.sh");
const BASE_PATH = "/usr/bin:/bin";

function makeReviewRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "review-cli-config-repo-"));
  const git = (...args: string[]) => {
    const result = spawnSync("git", args, {
      cwd: dir,
      encoding: "utf8",
      env: {
        PATH: BASE_PATH,
        GIT_CONFIG_GLOBAL: "/dev/null",
        GIT_CONFIG_SYSTEM: "/dev/null",
      },
    });
    if (result.status !== 0) {
      throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
    }
  };
  git("init", "-b", "develop");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  writeFileSync(join(dir, "base.txt"), "base\n");
  git("add", ".");
  git("commit", "-m", "base");
  git("switch", "-c", "test/config-delegation");
  writeFileSync(join(dir, "change.txt"), "change\n");
  git("add", ".");
  git("commit", "-m", "change");
  return dir;
}

function makeOrchestrator(): { root: string; log: string } {
  const root = mkdtempSync(join(tmpdir(), "codex-shim-orchestrator-"));
  const scripts = join(root, "scripts");
  const log = join(root, "argv.log");
  mkdirSync(scripts);
  writeFileSync(
    join(scripts, "multi-agent.sh"),
    [
      "#!/bin/sh",
      "# fixture marker: --task review explore implement",
      'printf "%s\\n" "$@" > "$ORCH_LOG"',
      'printf "MODEL=%s\\n" "${MULTI_AGENT_MODEL_CODEX_CLI:-}" >> "$ORCH_LOG"',
      'exit "${ORCH_EXIT:-0}"',
      "",
    ].join("\n"),
  );
  chmodSync(join(scripts, "multi-agent.sh"), 0o755);
  return { root, log };
}

function runShim(
  args: string[],
  fixture: { root: string; log: string },
  env: Record<string, string> = {},
) {
  const result = spawnSync("bash", [CODEX_SHIM, ...args], {
    cwd: REPO_ROOT,
    encoding: "utf8",
    env: {
      HOME: process.env.HOME,
      TMPDIR: process.env.TMPDIR,
      PATH: BASE_PATH,
      FF_DEV_TOOLKIT_ROOT: fixture.root,
      ORCH_LOG: fixture.log,
      ...env,
    },
  });
  return { ...result, output: `${result.stdout}\n${result.stderr}` };
}

describe("codex-review.sh の toolkit 委譲 — Issue #476", () => {
  it("--staged を codex-cli の review としてそのまま委譲する", () => {
    const fixture = makeOrchestrator();
    try {
      const result = runShim(["--staged", "--dry-run"], fixture);
      expect(result.status).toBe(0);
      const argv = readFileSync(fixture.log, "utf8").split("\n");
      expect(argv).toContain("--task");
      expect(argv).toContain("review");
      expect(argv).toContain("--cli");
      expect(argv).toContain("codex-cli");
      expect(argv).toContain("--staged");
      expect(argv).not.toContain("--base");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("--staged と --base の同時指定を rc=2 で拒否し、委譲しない", () => {
    const fixture = makeOrchestrator();
    try {
      const result = runShim(["--staged", "--base", "develop"], fixture);
      expect(result.status).toBe(2);
      expect(result.output).toMatch(/同時に指定できません|mutually exclusive/);
      expect(existsSync(fixture.log)).toBe(false);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("旧 CODEX_MODEL を新しい env 名へ写して通知する", () => {
    const fixture = makeOrchestrator();
    try {
      const result = runShim(["--staged", "--dry-run"], fixture, {
        CODEX_MODEL: "gpt model override",
      });
      expect(result.status).toBe(0);
      expect(readFileSync(fixture.log, "utf8")).toContain(
        "MODEL=gpt model override",
      );
      expect(result.output).toContain("MULTI_AGENT_MODEL_CODEX_CLI");
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });

  it("委譲先の非ゼロ終了をそのまま返す", () => {
    const fixture = makeOrchestrator();
    try {
      const result = runShim(["--staged"], fixture, { ORCH_EXIT: "7" });
      expect(result.status).toBe(7);
    } finally {
      rmSync(fixture.root, { recursive: true, force: true });
    }
  });
});

function makeCopilotStub(): { dir: string; log: string } {
  const dir = mkdtempSync(join(tmpdir(), "review-copilot-argv-"));
  const log = join(dir, "argv.log");
  writeFileSync(
    join(dir, "copilot"),
    [
      "#!/bin/sh",
      "flags=",
      "while [ $# -gt 0 ]; do",
      '  if [ "$1" = "-p" ] || [ "$1" = "--prompt" ]; then',
      '    flags="${flags}<$1><__PROMPT__>"',
      "    shift",
      "    [ $# -eq 0 ] || shift",
      "    continue",
      "  fi",
      '  flags="${flags}<$1>"',
      "  shift",
      "done",
      'printf "%s\\n" "$flags" >> "$ARGV_LOG"',
      'echo "Verdict: PASS"',
      "",
    ].join("\n"),
  );
  writeFileSync(join(dir, "timeout"), '#!/bin/sh\nshift\nexec "$@"\n');
  chmodSync(join(dir, "copilot"), 0o755);
  chmodSync(join(dir, "timeout"), 0o755);
  return { dir, log };
}

describe("Copilot CLI config delegation — Issue #470", () => {
  it("未設定なら model を省略し、明示値は 1 argv で渡す", () => {
    const stub = makeCopilotStub();
    const repo = makeReviewRepo();
    try {
      const common = {
        cwd: repo,
        encoding: "utf8" as const,
        env: {
          HOME: process.env.HOME,
          TMPDIR: process.env.TMPDIR,
          PATH: `${stub.dir}:${BASE_PATH}`,
          ARGV_LOG: stub.log,
          REVIEW_BASE_BRANCH: "develop",
        },
      };
      const delegated = spawnSync(
        "bash",
        [join(REPO_ROOT, "scripts", "copilot-review.sh"), "--branch"],
        common,
      );
      expect(delegated.status).toBe(0);
      expect(readFileSync(stub.log, "utf8")).toContain(
        "<-p><__PROMPT__>",
      );

      writeFileSync(stub.log, "");
      const overridden = spawnSync(
        "bash",
        [join(REPO_ROOT, "scripts", "copilot-review.sh"), "--branch"],
        {
          ...common,
          env: { ...common.env, COPILOT_MODEL: "copilot model override" },
        },
      );
      expect(overridden.status).toBe(0);
      expect(readFileSync(stub.log, "utf8")).toContain(
        "<-p><__PROMPT__><--model><copilot model override>",
      );
    } finally {
      rmSync(repo, { recursive: true, force: true });
      rmSync(stub.dir, { recursive: true, force: true });
    }
  });
});
