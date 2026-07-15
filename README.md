# deploy-doctor-cli

Deployment validation CLI for DevOps engineers.

> `deploy-doctor` was already taken on npm, so this ships as **`deploy-doctor-cli`**.  
> The binary command is still **`deploy-doctor`**.

```bash
npm install -g deploy-doctor-cli
# or
npx deploy-doctor-cli
npx deploy-doctor
```

## Features

Validates:

- Docker
- Kubernetes (`kubectl`)
- Helm
- Terraform
- Azure CLI (`az`)
- AWS CLI (`aws`)
- Git
- Node.js
- Disk
- Memory
- Ports
- Networking / DNS

## CLI

```bash
deploy-doctor
deploy-doctor --json
deploy-doctor --only docker,kubernetes,node
deploy-doctor --skip azure,aws
deploy-doctor --ports 5432,127.0.0.1:6379
deploy-doctor --hosts api.example.com,1.1.1.1
deploy-doctor --strict
```

Exit code `0` when healthy (no fails), `1` otherwise. Missing optional CLIs are **warnings** by default; use `--strict` to fail.

## Example output

```text
PASS  Node           Node OK (v22.16.0) (1ms)
PASS  Git            Git OK (git version 2.48.1) (12ms)
WARN  Docker         docker not found (optional) (8ms)
PASS  Networking     DNS OK for 2 host(s) (45ms)

Summary: 3 passed, 1 warned, 0 failed, 0 skipped
Environment looks deploy-ready.
```

## Programmatic API

```ts
import { runDoctor, formatReport } from "deploy-doctor-cli";

const report = await runDoctor({
  only: ["docker", "kubernetes", "node", "disk"],
  ports: ["127.0.0.1:5432"],
});

console.log(formatReport(report));
console.log(report.healthy);
```

## Options

| Option | Description |
|--------|-------------|
| `only` / `skip` | Filter checks |
| `ports` | TCP probes (`host:port` or port) |
| `hosts` | DNS lookups |
| `diskPath` | Filesystem path |
| `maxDiskUsedPercent` | Default `90` |
| `maxMemoryUsedPercent` | Default `95` |
| `softMissingCli` | Default `true` |

## Versioning

Semantic Versioning. See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
