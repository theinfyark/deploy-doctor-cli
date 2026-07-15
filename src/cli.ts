import { runDoctor, formatReport, ALL_CHECKS } from "./doctor.js";
import type { CheckName } from "./types.js";

function printHelp(): void {
  console.log(`deploy-doctor — deployment validation CLI

Usage:
  deploy-doctor [options]

Options:
  --json                 Print JSON report
  --only <list>          Comma-separated checks to run
  --skip <list>          Comma-separated checks to skip
  --ports <list>         Ports/hosts to probe (e.g. 5432,127.0.0.1:6379)
  --hosts <list>         Hosts for DNS checks
  --disk-path <path>     Disk path to inspect
  --strict               Missing CLIs count as fail
  --no-color             Disable ANSI colors
  --help                 Show help

Checks:
  ${ALL_CHECKS.join(", ")}
`);
}

function parseList(value: string | undefined): string[] {
  if (!value) return [];
  return value.split(",").map((s) => s.trim()).filter(Boolean);
}

export async function main(argv = process.argv.slice(2)): Promise<number> {
  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return 0;
  }

  const get = (flag: string) => {
    const idx = argv.indexOf(flag);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  };

  const only = parseList(get("--only")) as CheckName[];
  const skip = parseList(get("--skip")) as CheckName[];
  const ports = parseList(get("--ports"));
  const hosts = parseList(get("--hosts"));
  const diskPath = get("--disk-path");
  const json = argv.includes("--json");
  const strict = argv.includes("--strict");
  const color = !argv.includes("--no-color") && Boolean(process.stdout.isTTY);

  const report = await runDoctor({
    ...(only.length ? { only } : {}),
    ...(skip.length ? { skip } : {}),
    ...(ports.length ? { ports } : {}),
    ...(hosts.length ? { hosts } : {}),
    ...(diskPath ? { diskPath } : {}),
    softMissingCli: !strict,
  });

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReport(report, color));
  }

  return report.healthy ? 0 : 1;
}

const isDirect =
  process.argv[1] &&
  (process.argv[1].endsWith("cli.js") ||
    process.argv[1].endsWith("cli.ts") ||
    process.argv[1].includes("deploy-doctor"));

if (isDirect) {
  main().then((code) => {
    process.exitCode = code;
  });
}
