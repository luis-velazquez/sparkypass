#!/usr/bin/env node
/**
 * Builds the public practice-test snapshots from the app's question bank.
 *
 *   node scripts/build-practice-tests.mjs
 *
 * Reads  data/practice-tests/manifest.json  (which ids go in which test, plus
 * any site-only text overrides approved during review) and the bank under
 * data/questions/*.json, and writes data/practice-tests/test-{1,2,3}.json with
 * a whitelisted field set and deterministically shuffled options.
 *
 * Override shape (all optional):
 *   { prompt, options[4], answer, explanation, tip, ref2023, ref2026, topic,
 *     replace: { prompt|explanation|tip: [[from, to], ...] } }
 * A `replace` whose `from` text is no longer present throws, so a bank edit
 * can never silently drop a reviewed correction.
 */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BANK_DIR = join(ROOT, "data", "questions");
const OUT_DIR = join(ROOT, "data", "practice-tests");

const TOPIC_LABELS = {
  "box-fill": "Box Fill",
  "calculations-and-theory": "Calculations & Theory",
  "grounding-bonding": "Grounding & Bonding",
  "grounding-and-bonding": "Grounding & Bonding",
  "motors-and-generators": "Motors & Generators",
  services: "Services",
  "special-occupancies": "Special Occupancies",
  "transformer-sizing": "Transformers",
  "wiring-methods": "Wiring Methods",
  "load-calculations": "Load Calculations",
  "wiring-devices": "Wiring Devices",
  "branch-circuits": "Branch Circuits",
  luminaires: "Luminaires",
  "fire-pumps": "Fire Pumps",
  "elevators-and-escalators": "Elevators",
  "switchboards-panelboards-switchgear": "Switchboards & Panelboards",
  "switchboards-and-panelboards": "Switchboards & Panelboards",
  "conduit-fill": "Conduit Fill",
};

// ---------- load bank ----------
const bank = new Map();
for (const file of readdirSync(BANK_DIR).filter((f) => f.endsWith(".json"))) {
  const doc = JSON.parse(readFileSync(join(BANK_DIR, file), "utf8"));
  for (const tier of ["apprentice", "journeyman", "master"]) {
    for (const q of doc[tier] ?? []) bank.set(q.id, { ...q, _tier: tier, _file: file });
  }
}

// ---------- helpers ----------
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffledIndices(n, seed) {
  const rnd = mulberry32(seed);
  const idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  return idx;
}
const stripRef = (s) => (s ?? "").replace(/\bNEC\s+/gi, "").trim();
const stripTipPrefix = (s) => (s ?? "").replace(/^(Field Logic Tip|Index Sniper Tip)\s*[💡🎯]?\s*:\s*/u, "").trim();
/** Collapse runs of spaces/tabs but keep intentional paragraph breaks. */
const clean = (s) => (s ?? "").replace(/[ \t]+/g, " ").replace(/\s*\n\s*/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

function applyReplacements(id, field, text, pairs) {
  let out = text;
  for (const [from, to] of pairs ?? []) {
    if (!out.includes(from)) throw new Error(`${id}: replace target not found in ${field}: ${JSON.stringify(from)}`);
    out = out.split(from).join(to);
  }
  return out;
}

// ---------- build ----------
const manifest = JSON.parse(readFileSync(join(OUT_DIR, "manifest.json"), "utf8"));
const overrides = manifest.overrides ?? {};
const seen = new Set();
const usedOverrides = new Set();
const summary = [];

for (const test of manifest.tests) {
  if (test.questionIds.length !== 20) throw new Error(`${test.slug}: expected 20 ids, got ${test.questionIds.length}`);
  const questions = test.questionIds.map((id, i) => {
    const q = bank.get(id);
    if (!q) throw new Error(`${test.slug}: id ${id} not found in bank`);
    if (q._tier !== "journeyman") throw new Error(`${test.slug}: ${id} is ${q._tier}, not journeyman`);
    if (seen.has(id)) throw new Error(`${id} used twice`);
    seen.add(id);
    if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error(`${id}: needs 4 options`);
    const versions = Array.isArray(q.necVersions) ? q.necVersions : [];
    if (!versions.includes("2023") || !versions.includes("2026")) throw new Error(`${id}: not valid for both 2023 and 2026 (${JSON.stringify(q.necVersions)})`);

    const o = overrides[id] ?? {};
    if (overrides[id]) usedOverrides.add(id);
    const rep = o.replace ?? {};

    const prompt = clean(applyReplacements(id, "prompt", o.prompt ?? q.questionText, rep.prompt));
    const sourceOptions = (o.options ?? q.options).map(clean);
    if (sourceOptions.length !== 4 || new Set(sourceOptions).size !== 4) throw new Error(`${id}: options must be 4 distinct strings`);
    const correctSource = o.answer ?? q.correctAnswer;
    if (typeof correctSource !== "number" || correctSource < 0 || correctSource > 3) throw new Error(`${id}: bad correctAnswer`);

    const order = shuffledIndices(4, hashSeed(`${test.slug}:${id}`));
    const options = order.map((k) => sourceOptions[k]);
    const answer = order.indexOf(correctSource);

    return {
      id,
      n: i + 1,
      topic: o.topic ?? TOPIC_LABELS[q.category] ?? "NEC",
      calculation: Boolean(q.calculation),
      prompt,
      options,
      answer,
      explanation: clean(applyReplacements(id, "explanation", o.explanation ?? q.explanation, rep.explanation)),
      ref2023: stripRef(o.ref2023 ?? q.necReferences?.["2023"] ?? q.necReference),
      ref2026: stripRef(o.ref2026 ?? q.necReferences?.["2026"] ?? q.necReference),
      tip: clean(applyReplacements(id, "tip", o.tip ?? stripTipPrefix(q.sparkyTip), rep.tip)),
    };
  });

  for (const q of questions) {
    for (const f of ["prompt", "explanation", "ref2023", "ref2026", "tip"]) {
      if (!q[f]) throw new Error(`${q.id}: empty ${f}`);
    }
    if (/^(Field Logic Tip|Index Sniper Tip)/.test(q.tip)) throw new Error(`${q.id}: tip prefix survived`);
  }

  const out = {
    slug: test.slug,
    number: test.number,
    title: test.title,
    blurb: test.blurb,
    focus: test.focus ?? [],
    questions,
  };
  writeFileSync(join(OUT_DIR, `${test.slug}.json`), JSON.stringify(out, null, 2) + "\n");

  const positions = [0, 0, 0, 0];
  questions.forEach((q) => positions[q.answer]++);
  summary.push(
    `${test.slug}: ${questions.length} q, ${questions.filter((q) => q.calculation).length} calc, answer positions A/B/C/D = ${positions.join("/")}, renumbered-in-2026 = ${questions.filter((q) => q.ref2023 !== q.ref2026).length}`,
  );
}

const unused = Object.keys(overrides).filter((id) => !usedOverrides.has(id));
if (unused.length) throw new Error(`overrides for ids not in any test: ${unused.join(", ")}`);

console.log(summary.join("\n"));
console.log(`wrote ${manifest.tests.length} tests, ${seen.size} questions, ${usedOverrides.size} with site-only overrides`);
