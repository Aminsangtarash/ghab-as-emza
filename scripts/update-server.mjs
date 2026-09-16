#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);

function run(label, command) {
  console.log(`\n==> ${label}`);
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, {
      stdio: "inherit",
      shell: true,
      cwd: root,
      env: process.env,
    });
    child.on("error", reject);
    child.on("exit", (code, signal) => {
      if (signal) {
        reject(new Error(`${label} با سیگنال ${signal} قطع شد.`));
        return;
      }
      if (code !== 0) {
        reject(new Error(`${label} با کد ${code ?? 1} ناموفق بود.`));
        return;
      }
      resolvePromise();
    });
  });
}

try {
  await run("نصب وابستگی‌ها", "npm install --include=dev");
  await run("ساخت Prisma Client", "node scripts/with-db-url.mjs npx prisma generate");
  await run(
    "همگام‌سازی دیتابیس",
    "node scripts/with-db-url.mjs npx prisma db push --skip-generate",
  );
  await run("بیلد برنامه", "npx next build");
  console.log("\nبه‌روزرسانی تمام شد. اگر سرویس با systemd یا pm2 اجرا می‌شود، آن را ری‌استارت کنید.");
} catch (error) {
  console.error(`\n${error instanceof Error ? error.message : error}`);
  process.exit(1);
}
