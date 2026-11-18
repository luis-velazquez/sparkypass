#!/usr/bin/env node
// Bundles scripts/offer-test/test.ts with the real lib/offer code (Resend and
// push swapped for mocks.ts) and runs it. Uses libsql on a temp file, so the
// local dev database is never touched.
//   node scripts/offer-test/run.mjs
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, "../..");
const out = join(mkdtempSync(join(tmpdir(), "offer-test-")), "test.cjs");
const mocks = join(HERE, "mocks.ts");
await build({
  entryPoints: [join(HERE, "test.ts")],
  outfile: out,
  bundle: true,
  platform: "node",
  format: "cjs",
  tsconfig: join(ROOT, "tsconfig.json"),
  external: ["better-sqlite3", "@libsql/client"],
  logLevel: "warning",
  plugins: [{
    name: "mocks",
    setup(b) {
      b.onResolve({ filter: /^resend$/ }, () => ({ path: mocks }));
      b.onResolve({ filter: /^@\/lib\/push$/ }, () => ({ path: mocks }));
    },
  }],
});
execFileSync(process.execPath, [out], {
  stdio: "inherit",
  env: { ...process.env, NODE_PATH: join(ROOT, "node_modules"), OFFER_TEST_ROOT: ROOT },
});
