import { describe, it, expect } from "vitest";
import {
  runDoctor,
  formatReport,
  checkNode,
  checkDisk,
  checkMemory,
  checkNetworking,
  checkPorts,
  ALL_CHECKS,
} from "../src/index.js";

describe("deploy-doctor-cli", () => {
  it("runs core local checks", async () => {
    const report = await runDoctor({
      only: ["node", "git", "disk", "memory", "networking"],
      hosts: ["example.com"],
    });

    expect(report.results.length).toBeGreaterThanOrEqual(4);
    expect(report.results.find((r) => r.name === "node")?.status).toBe("pass");
    expect(["pass", "warn", "fail"]).toContain(
      report.results.find((r) => r.name === "disk")?.status,
    );
    expect(typeof report.healthy).toBe("boolean");
    expect(report.timestamp).toMatch(/T/);
  });

  it("formats human-readable reports", async () => {
    const report = await runDoctor({ only: ["node"] });
    const text = formatReport(report, false);
    expect(text).toContain("PASS");
    expect(text).toContain("Node");
    expect(text).toContain("Summary:");
  });

  it("skips ports when none configured and probes when set", async () => {
    const skipped = await checkPorts({});
    expect(skipped.status).toBe("skip");

    const probed = await checkPorts({ ports: ["127.0.0.1:1"] });
    expect(probed.status).toBe("fail");
  });

  it("checks networking DNS", async () => {
    const result = await checkNetworking({ hosts: ["example.com"] });
    expect(result.status).toBe("pass");
  });

  it("exposes individual checkers", async () => {
    expect((await checkNode()).status).toBe("pass");
    expect(["pass", "warn", "fail"]).toContain((await checkDisk()).status);
    expect(["pass", "warn", "fail"]).toContain((await checkMemory()).status);
  });

  it("lists all supported checks", () => {
    expect(ALL_CHECKS).toContain("docker");
    expect(ALL_CHECKS).toContain("kubernetes");
    expect(ALL_CHECKS).toContain("terraform");
    expect(ALL_CHECKS).toContain("azure");
    expect(ALL_CHECKS).toContain("aws");
    expect(ALL_CHECKS.length).toBe(12);
  });

  it("supports only/skip filters", async () => {
    const report = await runDoctor({
      only: ["node", "git", "docker"],
      skip: ["docker"],
    });
    expect(report.results.map((r) => r.name).sort()).toEqual(["git", "node"]);
  });
});
