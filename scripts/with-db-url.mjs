import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.local"));

function ensureDatabaseUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL;

  const user = process.env.DB_USER?.trim() || "root";
  const password = process.env.DB_PASSWORD ?? "";
  const host = process.env.DB_HOST?.trim() || "127.0.0.1";
  const port = process.env.DB_PORT?.trim() || "3306";
  const name = process.env.DB_NAME?.trim() || "ghabazemza_db";
  const auth =
    password === ""
      ? `${encodeURIComponent(user)}:`
      : `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;

  process.env.DATABASE_URL = `mysql://${auth}@${host}:${port}/${name}`;
  return process.env.DATABASE_URL;
}

ensureDatabaseUrl();

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Usage: node scripts/with-db-url.mjs <command> [...args]");
  process.exit(1);
}

const child = spawn(args[0], args.slice(1), {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
