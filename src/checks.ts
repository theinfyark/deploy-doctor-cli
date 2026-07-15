import os from "node:os";
import fs from "node:fs/promises";
import net from "node:net";
import dns from "node:dns/promises";
import path from "node:path";
import type { CheckName, CheckResult, DoctorOptions } from "./types.js";
import { firstLine, runCommand } from "./exec.js";

async function timed(
  name: CheckName,
  title: string,
  fn: () => Promise<Omit<CheckResult, "name" | "title" | "durationMs">>,
): Promise<CheckResult> {
  const started = Date.now();
  try {
    const result = await fn();
    return { name, title, durationMs: Date.now() - started, ...result };
  } catch (err) {
    return {
      name,
      title,
      status: "fail",
      message: err instanceof Error ? err.message : String(err),
      durationMs: Date.now() - started,
    };
  }
}

function missingCli(
  soft: boolean,
  tool: string,
  error?: string,
): Omit<CheckResult, "name" | "title" | "durationMs"> {
  return {
    status: soft ? "warn" : "fail",
    message: soft
      ? `${tool} not found (optional)`
      : `${tool} is required but not found`,
    details: error ? { error } : undefined,
  };
}

export async function checkDocker(soft = true): Promise<CheckResult> {
  return timed("docker", "Docker", async () => {
    const version = runCommand("docker", ["--version"]);
    if (!version.ok) return missingCli(soft, "docker", version.error || version.stderr);
    const info = runCommand("docker", ["info", "--format", "{{.ServerVersion}}"]);
    if (!info.ok) {
      return {
        status: "warn",
        message: `Docker CLI present (${firstLine(version.stdout)}) but daemon unreachable`,
        details: { cli: firstLine(version.stdout), error: info.stderr || info.error },
      };
    }
    return {
      status: "pass",
      message: `Docker OK (${firstLine(version.stdout)})`,
      details: { version: firstLine(version.stdout), server: firstLine(info.stdout) },
    };
  });
}

export async function checkKubernetes(soft = true): Promise<CheckResult> {
  return timed("kubernetes", "Kubernetes", async () => {
    const version = runCommand("kubectl", ["version", "--client", "--output=yaml"]);
    if (!version.ok) {
      const plain = runCommand("kubectl", ["version", "--client"]);
      if (!plain.ok) return missingCli(soft, "kubectl", plain.error || plain.stderr);
    }
    const cluster = runCommand("kubectl", ["cluster-info"]);
    const cliLine = firstLine(version.stdout) || firstLine(runCommand("kubectl", ["version", "--client"]).stdout);
    if (!cluster.ok) {
      return {
        status: "warn",
        message: `kubectl present but cluster not reachable`,
        details: { client: cliLine, error: cluster.stderr || cluster.error },
      };
    }
    return {
      status: "pass",
      message: "Kubernetes cluster reachable",
      details: { client: cliLine },
    };
  });
}

export async function checkHelm(soft = true): Promise<CheckResult> {
  return timed("helm", "Helm", async () => {
    const version = runCommand("helm", ["version", "--short"]);
    if (!version.ok) return missingCli(soft, "helm", version.error || version.stderr);
    return {
      status: "pass",
      message: `Helm OK (${firstLine(version.stdout)})`,
      details: { version: firstLine(version.stdout) },
    };
  });
}

export async function checkTerraform(soft = true): Promise<CheckResult> {
  return timed("terraform", "Terraform", async () => {
    const version = runCommand("terraform", ["version"]);
    if (!version.ok) return missingCli(soft, "terraform", version.error || version.stderr);
    return {
      status: "pass",
      message: `Terraform OK (${firstLine(version.stdout)})`,
      details: { version: firstLine(version.stdout) },
    };
  });
}

export async function checkAzure(soft = true): Promise<CheckResult> {
  return timed("azure", "Azure CLI", async () => {
    const version = runCommand("az", ["version", "--output", "json"]);
    if (!version.ok) {
      const plain = runCommand("az", ["--version"]);
      if (!plain.ok) return missingCli(soft, "az", plain.error || plain.stderr);
      return {
        status: "pass",
        message: `Azure CLI OK`,
        details: { version: firstLine(plain.stdout) },
      };
    }
    const account = runCommand("az", ["account", "show", "--output", "json"]);
    return {
      status: account.ok ? "pass" : "warn",
      message: account.ok
        ? "Azure CLI authenticated"
        : "Azure CLI installed but not logged in",
      details: {
        version: firstLine(version.stdout),
        loggedIn: account.ok,
      },
    };
  });
}

export async function checkAws(soft = true): Promise<CheckResult> {
  return timed("aws", "AWS CLI", async () => {
    const version = runCommand("aws", ["--version"]);
    if (!version.ok) return missingCli(soft, "aws", version.error || version.stderr);
    const identity = runCommand("aws", ["sts", "get-caller-identity"]);
    return {
      status: identity.ok ? "pass" : "warn",
      message: identity.ok
        ? "AWS CLI authenticated"
        : "AWS CLI installed but credentials not verified",
      details: {
        version: firstLine(version.stdout),
        loggedIn: identity.ok,
      },
    };
  });
}

export async function checkGit(): Promise<CheckResult> {
  return timed("git", "Git", async () => {
    const version = runCommand("git", ["--version"]);
    if (!version.ok) {
      return {
        status: "fail",
        message: "git not found",
        details: { error: version.error || version.stderr },
      };
    }
    return {
      status: "pass",
      message: `Git OK (${firstLine(version.stdout)})`,
      details: { version: firstLine(version.stdout) },
    };
  });
}

export async function checkNode(): Promise<CheckResult> {
  return timed("node", "Node.js", async () => {
    const version = process.version;
    const major = Number(version.slice(1).split(".")[0]);
    if (major < 18) {
      return {
        status: "fail",
        message: `Node ${version} is below required >=18`,
        details: { version, major },
      };
    }
    return {
      status: "pass",
      message: `Node OK (${version})`,
      details: { version, platform: process.platform, arch: process.arch },
    };
  });
}

export async function checkDisk(options: DoctorOptions = {}): Promise<CheckResult> {
  return timed("disk", "Disk", async () => {
    const target = options.diskPath ?? process.cwd();
    const maxUsed = options.maxDiskUsedPercent ?? 90;

    if (typeof fs.statfs === "function") {
      const stats = await fs.statfs(target);
      const total = Number(stats.blocks) * Number(stats.bsize);
      const free = Number(stats.bavail) * Number(stats.bsize);
      const usedPercent = total ? ((total - free) / total) * 100 : 0;
      const status = usedPercent >= maxUsed ? "fail" : usedPercent >= maxUsed - 10 ? "warn" : "pass";
      return {
        status,
        message: `Disk ${usedPercent.toFixed(1)}% used on ${target}`,
        details: {
          path: target,
          usedPercent: Number(usedPercent.toFixed(2)),
          totalBytes: total,
          freeBytes: free,
        },
      };
    }

    // Fallback writable probe
    const probe = path.join(target, `.deploy-doctor-${process.pid}`);
    await fs.writeFile(probe, "ok");
    await fs.unlink(probe);
    return {
      status: "pass",
      message: `Disk writable at ${target}`,
      details: { path: target, note: "statfs unavailable; write probe used" },
    };
  });
}

export async function checkMemory(options: DoctorOptions = {}): Promise<CheckResult> {
  return timed("memory", "Memory", async () => {
    const maxUsed = options.maxMemoryUsedPercent ?? 95;
    const total = os.totalmem();
    const free = os.freemem();
    const usedPercent = total ? ((total - free) / total) * 100 : 0;
    const status = usedPercent >= maxUsed ? "fail" : usedPercent >= maxUsed - 10 ? "warn" : "pass";
    return {
      status,
      message: `Memory ${usedPercent.toFixed(1)}% used`,
      details: {
        usedPercent: Number(usedPercent.toFixed(2)),
        totalBytes: total,
        freeBytes: free,
      },
    };
  });
}

function parsePortTarget(target: string): { host: string; port: number } | null {
  if (/^\d+$/.test(target)) return { host: "127.0.0.1", port: Number(target) };
  const m = target.match(/^\[?([^\]]+)\]?:(\d+)$/);
  if (!m) return null;
  return { host: m[1]!, port: Number(m[2]) };
}

export async function checkPorts(options: DoctorOptions = {}): Promise<CheckResult> {
  return timed("ports", "Ports", async () => {
    const targets = options.ports ?? [];
    if (targets.length === 0) {
      return {
        status: "skip",
        message: "No ports configured (pass ports: ['127.0.0.1:5432'])",
      };
    }

    const details: Record<string, boolean> = {};
    for (const target of targets) {
      const parsed = parsePortTarget(target);
      if (!parsed) {
        details[target] = false;
        continue;
      }
      details[target] = await new Promise<boolean>((resolve) => {
        const socket = net.connect({ host: parsed.host, port: parsed.port });
        const done = (ok: boolean) => {
          socket.destroy();
          resolve(ok);
        };
        socket.setTimeout(1500);
        socket.on("connect", () => done(true));
        socket.on("timeout", () => done(false));
        socket.on("error", () => done(false));
      });
    }

    const failed = Object.entries(details).filter(([, ok]) => !ok).map(([k]) => k);
    return {
      status: failed.length ? "fail" : "pass",
      message: failed.length
        ? `Unreachable ports: ${failed.join(", ")}`
        : `All ${targets.length} port(s) reachable`,
      details,
    };
  });
}

export async function checkNetworking(options: DoctorOptions = {}): Promise<CheckResult> {
  return timed("networking", "Networking", async () => {
    const hosts = options.hosts ?? ["example.com", "1.1.1.1"];
    const resolved: Record<string, string[] | string> = {};
    const failures: string[] = [];

    for (const host of hosts) {
      try {
        if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
          // Reverse lookup optional; treat IP as reachable via DNS system
          resolved[host] = host;
          continue;
        }
        const addresses = await dns.lookup(host, { all: true });
        resolved[host] = addresses.map((a) => a.address);
      } catch (err) {
        failures.push(host);
        resolved[host] = err instanceof Error ? err.message : String(err);
      }
    }

    return {
      status: failures.length ? "fail" : "pass",
      message: failures.length
        ? `DNS failed for: ${failures.join(", ")}`
        : `DNS OK for ${hosts.length} host(s)`,
      details: { resolved },
    };
  });
}
