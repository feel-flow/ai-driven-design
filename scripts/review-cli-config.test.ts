import { spawnSync } from "node:child_process";
import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = resolve(__dirname, "..");
const BASE_PATH = "/usr/bin:/bin";

function initFixtureRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "review-cli-config-fixture-"));
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

function makeArgvStub(cli: "codex" | "copilot"): { dir: string; log: string } {
  const dir = mkdtempSync(join(tmpdir(), `review-${cli}-argv-`));
  const log = join(dir, "argv.log");
  const body =
    cli === "codex"
      ? [
          "flags=",
          "while [ $# -gt 1 ]; do",
          '  flags="${flags}<$1>"',
          "  shift",
          "done",
        ]
      : [
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
        ];

  writeFileSync(
    join(dir, cli),
    [
      "#!/bin/sh",
      ...body,
      'printf "%s\\n" "$flags" >> "$ARGV_LOG"',
      "cat >/dev/null",
      'echo "Verdict: PASS"',
      "",
    ].join("\n"),
  );
  writeFileSync(join(dir, "timeout"), '#!/bin/sh\nshift\nexec "$@"\n');
  chmodSync(join(dir, cli), 0o755);
  chmodSync(join(dir, "timeout"), 0o755);
  return { dir, log };
}

function captureArgv(
  script: "codex-review.sh" | "copilot-review.sh",
  cli: "codex" | "copilot",
  env: Record<string, string>,
): { calls: string[]; output: string; status: number | null } {
  const repo = initFixtureRepo();
  const stub = makeArgvStub(cli);
  try {
    const result = spawnSync(
      "bash",
      [join(REPO_ROOT, "scripts", script), "--branch"],
      {
        cwd: repo,
        encoding: "utf8",
        timeout: 60_000,
        env: {
          HOME: process.env.HOME,
          TMPDIR: process.env.TMPDIR,
          PATH: `${stub.dir}:${BASE_PATH}`,
          ARGV_LOG: stub.log,
          REVIEW_BASE_BRANCH: "develop",
          ...env,
        },
      },
    );
    return {
      calls: readFileSync(stub.log, "utf8").trim().split("\n"),
      output: `${result.stdout}\n${result.stderr}`,
      status: result.status,
    };
  } finally {
    rmSync(repo, { recursive: true, force: true });
    rmSync(stub.dir, { recursive: true, force: true });
  }
}

describe("review CLI config delegation — Issue #470", () => {
  it("Codex omits -m when unset and preserves an explicit model as one argv", () => {
    const delegated = captureArgv("codex-review.sh", "codex", {});
    expect(delegated.status).toBe(0);
    expect(delegated.calls.every((call) => call === "<exec>")).toBe(true);
    expect(delegated.output).toContain("model: codex config default");

    const overridden = captureArgv("codex-review.sh", "codex", {
      CODEX_MODEL: "gpt model override",
    });
    expect(overridden.status).toBe(0);
    expect(
      overridden.calls.every(
        (call) => call === "<exec><-m><gpt model override>",
      ),
    ).toBe(true);
  });

  it("Copilot omits --model when unset and preserves an override as one argv", () => {
    const delegated = captureArgv("copilot-review.sh", "copilot", {});
    expect(delegated.status).toBe(0);
    expect(delegated.calls.every((call) => call === "<-p><__PROMPT__>")).toBe(
      true,
    );
    expect(delegated.output).toContain("model: copilot config default");

    const overridden = captureArgv("copilot-review.sh", "copilot", {
      COPILOT_MODEL: "copilot model override",
    });
    expect(overridden.status).toBe(0);
    expect(
      overridden.calls.every(
        (call) => call === "<-p><__PROMPT__><--model><copilot model override>",
      ),
    ).toBe(true);
  });
});
