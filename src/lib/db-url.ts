/**
 * Builds Prisma DATABASE_URL from split env vars.
 * Prefer an explicit DATABASE_URL when set; otherwise:
 * DB_USER (default root), DB_PASSWORD (default empty), DB_HOST, DB_PORT, DB_NAME.
 */
export function buildDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const existing = env.DATABASE_URL?.trim();
  if (existing) return existing;

  const user = env.DB_USER?.trim() || "root";
  const password = env.DB_PASSWORD ?? "";
  const host = env.DB_HOST?.trim() || "127.0.0.1";
  const port = env.DB_PORT?.trim() || "3306";
  const name = env.DB_NAME?.trim() || "ghabazemza_db";
  const auth =
    password === ""
      ? `${encodeURIComponent(user)}:`
      : `${encodeURIComponent(user)}:${encodeURIComponent(password)}`;

  return `mysql://${auth}@${host}:${port}/${name}`;
}

export function ensureDatabaseUrl(env: NodeJS.ProcessEnv = process.env) {
  const url = buildDatabaseUrl(env);
  env.DATABASE_URL = url;
  return url;
}
