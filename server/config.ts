import path from "node:path";

export const CONFLICT_START_ISO = "2026-02-28T00:00:00Z";

export interface AppConfig {
  rootDir: string;
  port: number;
  dbPath: string;
  legacyDir: string;
  blueprintPath: string;
  publicBaseUrl: string;
  operatorApiKey: string;
  enableScheduler: boolean;
  heartbeatReportPath: string;
}

export function loadConfig(rootDir = process.cwd()): AppConfig {
  return {
    rootDir,
    port: Number(process.env.PORT ?? 4311),
    dbPath: path.resolve(rootDir, process.env.WARWATCH_DB_PATH ?? "data/warwatch.sqlite"),
    legacyDir: path.resolve(rootDir, "legacy/warwatch-v3"),
    blueprintPath: path.resolve(rootDir, "docs/reference/WARWATCH-V4-BLUEPRINT.md"),
    publicBaseUrl: process.env.PUBLIC_BASE_URL ?? "",
    operatorApiKey: process.env.OPERATOR_API_KEY ?? "",
    enableScheduler: process.env.WARWATCH_ENABLE_SCHEDULER !== "false",
    heartbeatReportPath: path.resolve(rootDir, "reports/heartbeat/LATEST.md")
  };
}

