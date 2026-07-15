import type {
  CheckName,
  CheckResult,
  DoctorOptions,
  DoctorReport,
} from "./types.js";
import {
  checkAws,
  checkAzure,
  checkDisk,
  checkDocker,
  checkGit,
  checkHelm,
  checkKubernetes,
  checkMemory,
  checkNetworking,
  checkNode,
  checkPorts,
  checkTerraform,
} from "./checks.js";

export const ALL_CHECKS: CheckName[] = [
  "docker",
  "kubernetes",
  "helm",
  "terraform",
  "azure",
  "aws",
  "git",
  "node",
  "disk",
  "memory",
  "ports",
  "networking",
];

/**
 * Run deployment environment validation checks.
 */
export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorReport> {
  const soft = options.softMissingCli !== false;
  const only = options.only?.length ? new Set(options.only) : null;
  const skip = new Set(options.skip ?? []);

  const selected = ALL_CHECKS.filter((name) => {
    if (skip.has(name)) return false;
    if (only && !only.has(name)) return false;
    return true;
  });

  /** @type {CheckResult[]} */
  const results: CheckResult[] = [];

  for (const name of selected) {
    switch (name) {
      case "docker":
        results.push(await checkDocker(soft));
        break;
      case "kubernetes":
        results.push(await checkKubernetes(soft));
        break;
      case "helm":
        results.push(await checkHelm(soft));
        break;
      case "terraform":
        results.push(await checkTerraform(soft));
        break;
      case "azure":
        results.push(await checkAzure(soft));
        break;
      case "aws":
        results.push(await checkAws(soft));
        break;
      case "git":
        results.push(await checkGit());
        break;
      case "node":
        results.push(await checkNode());
        break;
      case "disk":
        results.push(await checkDisk(options));
        break;
      case "memory":
        results.push(await checkMemory(options));
        break;
      case "ports":
        results.push(await checkPorts(options));
        break;
      case "networking":
        results.push(await checkNetworking(options));
        break;
      default:
        break;
    }
  }

  const passed = results.filter((r) => r.status === "pass").length;
  const warned = results.filter((r) => r.status === "warn").length;
  const failed = results.filter((r) => r.status === "fail").length;
  const skipped = results.filter((r) => r.status === "skip").length;

  return {
    healthy: failed === 0,
    passed,
    warned,
    failed,
    skipped,
    results,
    timestamp: new Date().toISOString(),
  };
}

export function formatReport(report: DoctorReport, color = true): string {
  const c = {
    reset: color ? "\x1b[0m" : "",
    green: color ? "\x1b[32m" : "",
    yellow: color ? "\x1b[33m" : "",
    red: color ? "\x1b[31m" : "",
    cyan: color ? "\x1b[36m" : "",
    dim: color ? "\x1b[2m" : "",
  };

  const icon = (status: CheckResult["status"]) => {
    if (status === "pass") return `${c.green}PASS${c.reset}`;
    if (status === "warn") return `${c.yellow}WARN${c.reset}`;
    if (status === "fail") return `${c.red}FAIL${c.reset}`;
    return `${c.dim}SKIP${c.reset}`;
  };

  const lines = [
    `${c.cyan}deploy-doctor${c.reset} ${c.dim}${report.timestamp}${c.reset}`,
    "",
  ];

  for (const r of report.results) {
    lines.push(
      `${icon(r.status)}  ${r.title.padEnd(14)} ${r.message} ${c.dim}(${r.durationMs}ms)${c.reset}`,
    );
  }

  lines.push(
    "",
    `Summary: ${report.passed} passed, ${report.warned} warned, ${report.failed} failed, ${report.skipped} skipped`,
    report.healthy
      ? `${c.green}Environment looks deploy-ready.${c.reset}`
      : `${c.red}Fix failing checks before deploying.${c.reset}`,
  );

  return lines.join("\n");
}
