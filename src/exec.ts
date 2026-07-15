import { spawnSync } from "node:child_process";

export interface CommandResult {
  ok: boolean;
  code: number | null;
  stdout: string;
  stderr: string;
  error?: string;
}

export function runCommand(
  command: string,
  args: string[] = [],
  timeoutMs = 8_000,
): CommandResult {
  try {
    const result = spawnSync(command, args, {
      encoding: "utf8",
      timeout: timeoutMs,
      env: process.env,
    });

    if (result.error) {
      return {
        ok: false,
        code: result.status,
        stdout: String(result.stdout ?? ""),
        stderr: String(result.stderr ?? ""),
        error: result.error.message,
      };
    }

    return {
      ok: (result.status ?? 1) === 0,
      code: result.status,
      stdout: String(result.stdout ?? "").trim(),
      stderr: String(result.stderr ?? "").trim(),
    };
  } catch (err) {
    return {
      ok: false,
      code: null,
      stdout: "",
      stderr: "",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export function firstLine(text: string): string {
  return text.split(/\r?\n/).map((l) => l.trim()).find(Boolean) ?? "";
}
