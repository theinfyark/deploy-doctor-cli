export type CheckStatus = "pass" | "warn" | "fail" | "skip";

export type CheckName =
  | "docker"
  | "kubernetes"
  | "helm"
  | "terraform"
  | "azure"
  | "aws"
  | "git"
  | "node"
  | "disk"
  | "memory"
  | "ports"
  | "networking";

export interface CheckResult {
  name: CheckName;
  title: string;
  status: CheckStatus;
  message: string;
  details?: Record<string, unknown>;
  durationMs: number;
}

export interface DoctorReport {
  healthy: boolean;
  passed: number;
  warned: number;
  failed: number;
  skipped: number;
  results: CheckResult[];
  timestamp: string;
}

export interface DoctorOptions {
  /** Subset of checks to run. Default: all. */
  only?: CheckName[];
  /** Skip these checks. */
  skip?: CheckName[];
  /** Hosts/ports like ["127.0.0.1:5432", "443"]. */
  ports?: string[];
  /** Hostnames for DNS/network checks. */
  hosts?: string[];
  /** Disk path to inspect. Default: cwd / "/". */
  diskPath?: string;
  /** Fail disk when used percent >= this. Default: 90. */
  maxDiskUsedPercent?: number;
  /** Fail memory when used percent >= this. Default: 95. */
  maxMemoryUsedPercent?: number;
  /** Treat missing optional CLIs as warn instead of fail. Default: true. */
  softMissingCli?: boolean;
}
