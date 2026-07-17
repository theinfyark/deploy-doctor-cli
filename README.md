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

## Quick Start

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
import { runDoctor, formatReport } from 'deploy-doctor-cli';

const report = await runDoctor({
  only: ['docker', 'kubernetes', 'node', 'disk'],
  ports: ['127.0.0.1:5432'],
});

console.log(formatReport(report));
console.log(report.healthy);
```

## Options

| Option                 | Description                      |
| ---------------------- | -------------------------------- |
| `only` / `skip`        | Filter checks                    |
| `ports`                | TCP probes (`host:port` or port) |
| `hosts`                | DNS lookups                      |
| `diskPath`             | Filesystem path                  |
| `maxDiskUsedPercent`   | Default `90`                     |
| `maxMemoryUsedPercent` | Default `95`                     |
| `softMissingCli`       | Default `true`                   |

## Versioning

Semantic Versioning. See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT

## Introduction

**deploy-doctor-cli** helps you ship reliable Node.js / TypeScript applications with a small, focused API.

## Why this package exists

Popular stacks need small, trustworthy utilities with excellent DX. **deploy-doctor-cli** exists to solve one problem well: clear APIs, strong typing, minimal dependencies, and production-ready defaults — without the overhead of larger frameworks.

## Installation

```bash
npm install deploy-doctor-cli
# or
pnpm add deploy-doctor-cli
yarn add deploy-doctor-cli
```

Requires Node.js 18+.

## API Reference

See the exports from `deploy-doctor-cli` and the inline TypeScript types for the full surface area. Primary entry points are documented in **Quick Start** and **Examples** above.

## Examples

Minimal usage is shown in **Quick Start**. Prefer copying those snippets first, then expand into your app’s error handling and configuration patterns.

## Advanced Examples

- Combine with environment validation, logging, and health checks in production services
- Prefer dependency injection / custom `fetch` / client injection in tests
- Keep configuration explicit; avoid hidden global state

## Framework Integration

Works with Express, Fastify, Hono, NestJS, and plain Node HTTP servers. Import ESM (or CJS where published) and call the documented APIs from route handlers, middleware, or background jobs.

## TypeScript Usage

```ts
import { runDoctor, formatReport } from 'deploy-doctor-cli';
```

Types ship with the package (`types` / `exports.types`). Enable `strict` in your `tsconfig` for the best DX.

## Error Handling

- Fail fast with typed / named errors where provided
- Never swallow errors silently in production paths
- Prefer returning structured error payloads in HTTP layers
- Surface actionable messages (what failed + how to fix)

## Performance

- Minimal runtime work on the hot path
- Avoid unnecessary allocations and dependencies
- Tree-shakeable ESM entry points
- Prefer streaming / lazy work when dealing with large payloads

## Best Practices

- Pin major versions with SemVer ranges you trust
- Validate configuration at process startup
- Add health checks and observability around I/O
- Write tests for failure modes (timeouts, bad input, missing credentials)

## FAQ

**Does it work with ESM and CommonJS?**  
Yes where the package publishes dual exports. Prefer ESM for new projects.

**Is it production-ready?**  
Yes — tests, types, and SemVer releases are part of the maintenance model.

**How do I report a bug?**  
Open a GitHub issue using the bug template.

## Migration Guide

### From 0.x / early drafts

This package follows SemVer. Breaking changes land in major releases and are called out in `CHANGELOG.md`.

### Upgrading patch/minor

Patch and minor releases are backward compatible. Run your test suite after upgrading.

## Troubleshooting

| Symptom                   | Likely cause                         | Fix                                  |
| ------------------------- | ------------------------------------ | ------------------------------------ |
| `ERR_MODULE_NOT_FOUND`    | Wrong Node version / bad import path | Use Node 18+ and package `exports`   |
| Types not resolving       | Old moduleResolution                 | Use `bundler` or `node16`+           |
| Auth / network failures   | Missing env or blocked egress        | Check credentials and firewall       |
| Unexpected runtime errors | Invalid input                        | Validate options; read error message |

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). PRs with tests and docs are welcome.
