// Flash card sync checks. Runs only on in-memory libSQL and never opens a real database.
// Run: tsx lib/__tests__/flashcard-sync.check.ts

import { readFileSync } from "node:fs";
import Module, { createRequire } from "node:module";
import path from "node:path";
import { createClient, type Client } from "@libsql/client";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../db/schema";
import { flashcardMarks, flashcardProgress } from "../db/schema";
import {
  applySync,
  MAX_CARD_ROWS,
  MAX_MARK_ROWS,
  parseSyncBody,
  resolveCard,
  validateCard,
  validateMark,
  type CardRow,
  type Db,
  type FlashcardSyncResponse,
  type MarkRow,
  type SyncCursor,
} from "../flashcard-sync";

const T0 = 1_800_000_000_000;
const MIGRATION = readFileSync(
  path.join(__dirname, "..", "..", "drizzle", "0031_flashcard_progress.sql"),
  "utf8",
);

let passed = 0;
const failures: string[] = [];
function check(name: string, cond: boolean, detail?: string) {
  if (cond) passed++;
  else failures.push(detail ? `${name}: ${detail}` : name);
}

const card = (questionId: string, over: Partial<CardRow> = {}): CardRow => ({
  questionId,
  status: "learning",
  knows: 0,
  knowDay: null,
  step: 0,
  dueDay: null,
  introducedDay: 100,
  lastAgainDay: null,
  updatedAt: T0,
  baseUpdatedAt: null,
  ...over,
});

const mark = (id: string, over: Partial<MarkRow> = {}): MarkRow => ({
  id,
  questionId: "GB-M016",
  lang: "en",
  field: "explanation",
  kind: "user",
  startOffset: 4,
  endOffset: 9,
  quote: "bonds",
  prefix: "the ",
  suffix: " here",
  textHash: "0a1b2c3d",
  keyHash: "4e5f6a7b",
  createdAt: T0,
  updatedAt: T0,
  deletedAt: null,
  ...over,
});

const MARK_A = "m0123456789abcdef";
const MARK_B = "s0123456789abcdef";

async function freshDb(): Promise<{ client: Client; db: Db }> {
  const client = createClient({ url: ":memory:" });
  await client.execute("CREATE TABLE users (id text PRIMARY KEY, email text, deleted_at integer)");
  await client.executeMultiple(MIGRATION);
  return { client, db: drizzle(client, { schema }) };
}

async function addUser(client: Client, id: string) {
  await client.execute({ sql: "INSERT INTO users (id, email) VALUES (?, ?)", args: [id, `${id}@example.test`] });
}

const send = (
  db: Db,
  userId: string,
  rows: { cards?: unknown[]; marks?: unknown[]; cursor?: SyncCursor | null },
  now: number,
): Promise<FlashcardSyncResponse> =>
  applySync(
    db,
    userId,
    {
      v: 1,
      ownerId: userId,
      cursor: rows.cursor ?? null,
      cards: (rows.cards ?? []) as CardRow[],
      marks: (rows.marks ?? []) as MarkRow[],
    },
    now,
  );

async function storedCard(db: Db, userId: string, questionId: string) {
  const [row] = await db.select().from(flashcardProgress)
    .where(and(eq(flashcardProgress.userId, userId), eq(flashcardProgress.questionId, questionId)));
  return row;
}

async function rowCount(client: Client, table: string, userId: string): Promise<number> {
  const res = await client.execute({ sql: `SELECT count(*) AS n FROM ${table} WHERE user_id = ?`, args: [userId] });
  return Number(res.rows[0].n);
}

async function seedCards(db: Db, userId: string, total: number, changedAt: number) {
  const rows = Array.from({ length: total }, (_, i) => {
    const { baseUpdatedAt: _base, ...row } = card(`SEED-${String(i).padStart(5, "0")}`);
    void _base;
    return { ...row, userId, changedAt };
  });
  for (let i = 0; i < rows.length; i += 500) await db.insert(flashcardProgress).values(rows.slice(i, i + 500));
}

async function seedMarks(db: Db, userId: string, total: number, changedAt: number) {
  const rows = Array.from({ length: total }, (_, i) => ({
    ...mark(`m${i.toString(16).padStart(16, "0")}`),
    userId,
    changedAt,
  }));
  for (let i = 0; i < rows.length; i += 500) await db.insert(flashcardMarks).values(rows.slice(i, i + 500));
}

async function checkMigration() {
  const { client } = await freshDb();
  let twice = true;
  try {
    await client.executeMultiple(MIGRATION);
  } catch {
    twice = false;
  }
  check("migration runs twice", twice);

  for (const [table, drizzleTable] of [
    ["flashcard_progress", flashcardProgress],
    ["flashcard_marks", flashcardMarks],
  ] as const) {
    const info = await client.execute(`PRAGMA table_info(${table})`);
    const actual = info.rows.map((r) => String(r.name)).sort();
    const expected = Object.values(drizzleTable)
      .filter((c): c is typeof c & { name: string } => typeof (c as { name?: unknown }).name === "string")
      .map((c) => c.name)
      .sort();
    check(`${table} columns match the schema`, JSON.stringify(actual) === JSON.stringify(expected), actual.join(","));
  }
  client.close();
}

async function checkBatchShapes() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");

  const pull = await send(db, "u1", {}, T0);
  check("pull-only returns nothing", pull.saved.cards.length === 0 && pull.changes.cards.length === 0 && !pull.hasMore);

  const cardsOnly = await send(db, "u1", { cards: [card("GB-M016")] }, T0);
  check("cards-only saves the card", cardsOnly.saved.cards.length === 1 && cardsOnly.saved.marks.length === 0);
  check("saved carries baseUpdatedAt = updatedAt", cardsOnly.saved.cards[0].baseUpdatedAt === cardsOnly.saved.cards[0].updatedAt);
  check("changes carry baseUpdatedAt = updatedAt", cardsOnly.changes.cards.every((c) => c.baseUpdatedAt === c.updatedAt));

  const marksOnly = await send(db, "u1", { marks: [mark(MARK_A)] }, T0);
  check("marks-only saves the mark", marksOnly.saved.marks.length === 1 && marksOnly.saved.cards.length === 0);

  const allBad = await send(db, "u1", { cards: [{ questionId: "bad id" }], marks: [{ id: "nope" }] }, T0);
  check(
    "all-rejected batch reports both",
    allBad.rejected.length === 2 && allBad.saved.cards.length === 0 && allBad.saved.marks.length === 0,
  );

  const mixed = await send(db, "u1", { cards: [card("WM-J008"), card("WM-J009", { step: 99 })] }, T0);
  check("bad row is rejected alone", mixed.saved.cards.length === 1 && mixed.saved.cards[0].questionId === "WM-J008");
  check(
    "bad row names its key",
    mixed.rejected.length === 1 && mixed.rejected[0].key === "WM-J009" && mixed.rejected[0].code === "INVALID",
  );

  const repeated = await send(db, "u1", {
    cards: [card("DUP-1", { step: 1, updatedAt: T0 + 5 }), card("DUP-1", { step: 2, updatedAt: T0 + 9 }), card("DUP-1", { step: 3, updatedAt: T0 + 7 })],
  }, T0 + 10);
  check("a repeated key keeps the newest row", repeated.saved.cards.length === 1 && repeated.saved.cards[0].step === 2);
  client.close();
}

async function checkConflicts() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");

  // Matching base, including a real lapse.
  const first = await send(db, "u1", { cards: [card("LAPSE", { status: "learned", step: 3, knows: 1, updatedAt: T0 })] }, T0);
  const base = first.saved.cards[0].updatedAt;
  const lapse = await send(db, "u1", {
    cards: [card("LAPSE", { status: "learning", step: 1, lastAgainDay: 120, updatedAt: T0 + 1000, baseUpdatedAt: base })],
  }, T0 + 1000);
  check("a matching base applies a real lapse", lapse.saved.cards[0].status === "learning" && lapse.saved.cards[0].step === 1);
  check("last_again_day round trips", lapse.saved.cards[0].lastAgainDay === 120);
  const reread = await send(db, "u1", {}, T0 + 1000);
  check("last_again_day comes back on pull", reread.changes.cards.find((c) => c.questionId === "LAPSE")?.lastAgainDay === 120);

  // Fresh phone cannot lower a stuck card.
  await send(db, "u1", { cards: [card("STUCK", { status: "learned", step: 16, dueDay: 500, updatedAt: T0 })] }, T0);
  const fresh = await send(db, "u1", {
    cards: [card("STUCK", { status: "learning", step: 0, knows: 1, knowDay: 130, updatedAt: T0 + 2000, baseUpdatedAt: null })],
  }, T0 + 2000);
  check("a fresh phone's Know cannot lower a stuck card", fresh.saved.cards[0].status === "learned" && fresh.saved.cards[0].step === 16);

  // Stale offline phone cannot lower step.
  const v1 = await send(db, "u1", { cards: [card("STALE", { status: "learned", step: 2, updatedAt: T0 })] }, T0);
  const v2 = await send(db, "u1", {
    cards: [card("STALE", { status: "learned", step: 3, updatedAt: T0 + 100, baseUpdatedAt: v1.saved.cards[0].updatedAt })],
  }, T0 + 100);
  const staleResult = await send(db, "u1", {
    cards: [card("STALE", { status: "learned", step: 1, lastAgainDay: 140, updatedAt: T0 + 3000, baseUpdatedAt: v1.saved.cards[0].updatedAt })],
  }, T0 + 3000);
  check("a stale offline phone cannot lower step", staleResult.saved.cards[0].step === 3);
  check("a merge stamps past both rows", staleResult.saved.cards[0].updatedAt === Math.max(T0 + 3000, v2.saved.cards[0].updatedAt) + 1);

  // Merge keeps earliest introduced day and latest again day.
  await send(db, "u1", { cards: [card("MERGE", { status: "learned", step: 4, introducedDay: 110, lastAgainDay: 115, updatedAt: T0 })] }, T0);
  const merged = await send(db, "u1", {
    cards: [card("MERGE", { status: "learning", step: 1, introducedDay: 105, lastAgainDay: 125, updatedAt: T0 + 50 })],
  }, T0 + 50);
  check("merge keeps the earliest introducedDay", merged.saved.cards[0].introducedDay === 105);
  check("merge keeps the latest lastAgainDay", merged.saved.cards[0].lastAgainDay === 125);
  check("merge keeps the further-along row", merged.saved.cards[0].status === "learned" && merged.saved.cards[0].step === 4);

  // Identical retry writes nothing.
  const retryFirst = await send(db, "u1", { cards: [card("RETRY", { step: 2, updatedAt: T0 })] }, T0);
  const before = await storedCard(db, "u1", "RETRY");
  const retry = await send(db, "u1", { cards: [card("RETRY", { step: 2, updatedAt: T0 + 9999 })] }, T0 + 9999);
  const after = await storedCard(db, "u1", "RETRY");
  check("an identical retry writes nothing", before.changedAt === after.changedAt && before.updatedAt === after.updatedAt);
  check("a retry still returns the stored row", retry.saved.cards[0].updatedAt === retryFirst.saved.cards[0].updatedAt);

  // Fast clock is clamped and does not loop.
  const fastNow = T0 + 50_000;
  const fast = await send(db, "u1", { cards: [card("FAST", { step: 1, updatedAt: fastNow + 3_600_000 })] }, fastNow);
  check("a fast clock is clamped to now + 5 min", fast.saved.cards[0].updatedAt === fastNow + 300_000);
  const fastStored = await storedCard(db, "u1", "FAST");
  const fastResend = await send(db, "u1", { cards: [card("FAST", { step: 1, updatedAt: fastNow + 3_600_000 })] }, fastNow + 1000);
  const fastAfter = await storedCard(db, "u1", "FAST");
  check(
    "a fast clock does not cause a resend loop",
    fastResend.saved.cards[0].updatedAt === fast.saved.cards[0].updatedAt && fastAfter.changedAt === fastStored.changedAt,
  );

  // Slow clock with a matching base wins.
  const slowFirst = await send(db, "u1", { cards: [card("SLOW", { step: 5, status: "learned", updatedAt: T0 + 80_000 })] }, T0 + 80_000);
  const slowStamp = slowFirst.saved.cards[0].updatedAt;
  const slow = await send(db, "u1", {
    cards: [card("SLOW", { step: 2, status: "learning", updatedAt: T0 + 10, baseUpdatedAt: slowStamp })],
  }, T0 + 81_000);
  check("a slow clock on a matching base wins", slow.saved.cards[0].step === 2 && slow.saved.cards[0].updatedAt === slowStamp + 1);

  // In-flight edit: the phone edits while its upload is out, then sends the edit
  // with the base the ack gave it.
  const flight = await send(db, "u1", { cards: [card("FLIGHT", { step: 2, updatedAt: T0 })] }, T0);
  const flightEdit = await send(db, "u1", {
    cards: [card("FLIGHT", { step: 1, lastAgainDay: 130, updatedAt: T0 + 5, baseUpdatedAt: flight.saved.cards[0].updatedAt })],
  }, T0 + 10);
  check("an in-flight edit survives", flightEdit.saved.cards[0].step === 1 && flightEdit.saved.cards[0].lastAgainDay === 130);

  // Pure rule coverage.
  check("no stored row inserts", resolveCard(card("X"), undefined)?.questionId === "X");
  check("same state resolves to null", resolveCard(card("X", { updatedAt: T0 + 1 }), card("X")) === null);
  client.close();
}

async function checkMarks() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");

  await send(db, "u1", { marks: [mark(MARK_A, { updatedAt: T0 })] }, T0);
  const second = await send(db, "u1", { marks: [mark(MARK_A, { updatedAt: T0 + 40, createdAt: T0 + 40 })] }, T0 + 40);
  check("same mark from two phones is one row", (await rowCount(client, "flashcard_marks", "u1")) === 1);
  check("createdAt keeps the first value", second.saved.marks[0].createdAt === T0);

  const erased = await send(db, "u1", { marks: [mark(MARK_A, { updatedAt: T0 + 50, deletedAt: T0 + 50 })] }, T0 + 50);
  check("erase stores deletedAt", erased.saved.marks[0].deletedAt === T0 + 50);
  const remarked = await send(db, "u1", { marks: [mark(MARK_A, { updatedAt: T0 + 60, deletedAt: null })] }, T0 + 60);
  check("re-mark revives the row", remarked.saved.marks[0].deletedAt === null);
  const older = await send(db, "u1", { marks: [mark(MARK_A, { updatedAt: T0 + 55, deletedAt: T0 + 55 })] }, T0 + 70);
  check("an older mark write loses", older.saved.marks[0].deletedAt === null && older.saved.marks[0].updatedAt === T0 + 60);

  const starter = await send(db, "u1", { marks: [mark(MARK_B, { kind: "starter_off" })] }, T0 + 80);
  check("a starter_off row is accepted", starter.saved.marks[0]?.kind === "starter_off");
  client.close();
}

function checkValidators() {
  const now = T0;
  const badCards: Partial<Record<keyof CardRow, unknown>>[] = [
    { questionId: "-leading" },
    { questionId: "A".repeat(41) },
    { status: "done" },
    { knows: 2 },
    { step: 17 },
    { step: -1 },
    { step: 1.5 },
    { dueDay: 100_001 },
    { knowDay: -1 },
    { introducedDay: "5" },
    { lastAgainDay: 1.5 },
    { updatedAt: 0 },
    { updatedAt: Number.MAX_SAFE_INTEGER + 1 },
    { baseUpdatedAt: 0 },
    { baseUpdatedAt: "1" },
  ];
  for (const over of badCards) {
    check(`card rejected: ${JSON.stringify(over)}`, validateCard({ ...card("OK-1"), ...over }, now) === null);
  }
  check("a good card passes", validateCard(card("OK-1"), now) !== null);
  check("a non-object card is rejected", validateCard("x", now) === null && validateCard(null, now) === null);
  check("card updatedAt is clamped", validateCard(card("OK-1", { updatedAt: now + 999_999 }), now)?.updatedAt === now + 300_000);

  const badMarks: Partial<Record<keyof MarkRow, unknown>>[] = [
    { id: "x0123456789abcdef" },
    { id: "m0123456789ABCDEF" },
    { questionId: "bad id" },
    { lang: "fr" },
    { field: "option" },
    { kind: "starter" },
    { startOffset: -1 },
    { startOffset: 9, endOffset: 9, quote: "" },
    { startOffset: 9, endOffset: 4 },
    { startOffset: 3996, endOffset: 4001, quote: "bonds" },
    { quote: "bond" },
    { startOffset: 0, endOffset: 201, quote: "q".repeat(201) },
    { prefix: "p".repeat(121) },
    { suffix: "s".repeat(121) },
    { textHash: "ABCDEF12" },
    { keyHash: "abc" },
    { createdAt: 0 },
    { updatedAt: -5 },
    { deletedAt: 0 },
  ];
  for (const over of badMarks) {
    check(`mark rejected: ${JSON.stringify(over).slice(0, 60)}`, validateMark({ ...mark(MARK_A), ...over }, now) === null);
  }
  check("a good mark passes", validateMark(mark(MARK_A), now) !== null);
  check(
    "a 200-character quote at the end passes",
    validateMark(mark(MARK_A, { startOffset: 3800, endOffset: 4000, quote: "q".repeat(200) }), now) !== null,
  );

  const envelope = { v: 1, ownerId: "u1", cursor: null, cards: [], marks: [] };
  check("a good envelope parses", parseSyncBody(envelope).ok);
  const codeOf = (json: unknown) => {
    const r = parseSyncBody(json);
    return r.ok ? "ok" : r.code;
  };
  check("wrong version", codeOf({ ...envelope, v: 2 }) === "BAD_VERSION");
  check("non-object body", codeOf([]) === "BAD_BODY");
  check("missing owner", codeOf({ ...envelope, ownerId: "" }) === "BAD_OWNER");
  check("bad cursor", codeOf({ ...envelope, cursor: { cardsAt: -1, cardsId: "", marksAt: 0, marksId: "" } }) === "BAD_CURSOR");
  check("rows not arrays", codeOf({ ...envelope, cards: {} }) === "BAD_ROWS");
  check("over 200 cards", codeOf({ ...envelope, cards: new Array(201).fill(0) }) === "TOO_MANY");
  check("over 200 marks", codeOf({ ...envelope, marks: new Array(201).fill(0) }) === "TOO_MANY");
  check("a bad row does not fail the envelope", codeOf({ ...envelope, cards: [{ junk: true }] }) === "ok");
}

async function checkCeilings() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");

  await seedCards(db, "u1", MAX_CARD_ROWS - 1, T0);
  const cards = await send(db, "u1", {
    cards: [
      card("NEW-1"),
      card("NEW-2"),
      card("SEED-00000", { step: 4, updatedAt: T0 + 5, baseUpdatedAt: T0 }),
    ],
  }, T0 + 5);
  check("cards stop at the ceiling", (await rowCount(client, "flashcard_progress", "u1")) === MAX_CARD_ROWS);
  check(
    "the over-ceiling new card gets LIMIT",
    cards.rejected.length === 1 && cards.rejected[0].key === "NEW-2" && cards.rejected[0].code === "LIMIT",
  );
  check("an existing card still updates at the ceiling", (await storedCard(db, "u1", "SEED-00000")).step === 4);

  await seedMarks(db, "u1", MAX_MARK_ROWS, T0);
  const existingId = `m${(0).toString(16).padStart(16, "0")}`;
  const marks = await send(db, "u1", {
    marks: [mark("mffffffffffffffff"), mark(existingId, { updatedAt: T0 + 9, deletedAt: T0 + 9 })],
  }, T0 + 9);
  check("marks stop at the ceiling", (await rowCount(client, "flashcard_marks", "u1")) === MAX_MARK_ROWS);
  check("the over-ceiling new mark gets LIMIT", marks.rejected.length === 1 && marks.rejected[0].code === "LIMIT");
  check("an existing mark still updates at the ceiling", marks.saved.marks[0]?.deletedAt === T0 + 9);
  client.close();
}

async function checkPaging() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");

  const changedAt = T0 - 600_000;
  await seedCards(db, "u1", 1300, changedAt);
  const seen = new Set<string>();
  let cursor: SyncCursor | null = null;
  let pages = 0;
  let total = 0;
  for (;;) {
    const res: FlashcardSyncResponse = await send(db, "u1", { cursor }, T0);
    pages++;
    total += res.changes.cards.length;
    for (const c of res.changes.cards) seen.add(c.questionId);
    cursor = res.cursor;
    if (!res.hasMore) break;
    if (pages > 10) break;
  }
  check("1,300 rows with one changed_at page in 3", pages === 3, `pages=${pages}`);
  check("every row arrives exactly once", seen.size === 1300 && total === 1300, `seen=${seen.size} total=${total}`);
  const empty = await send(db, "u1", { cursor }, T0 + 1000);
  check("a settled cursor returns nothing", empty.changes.cards.length === 0 && !empty.hasMore);

  // A late commit: a row stamped before the pull that lands after it.
  const late = await freshDb();
  await addUser(late.client, "u1");
  const pullAt = T0;
  await send(late.db, "u1", { cards: [card("EARLY")] }, pullAt - 1000);
  const firstPull = await send(late.db, "u1", {}, pullAt);
  check("a recent row holds the cursor at the floor", firstPull.cursor.cardsAt === pullAt - 120_000 && firstPull.cursor.cardsId === "");
  await send(late.db, "u1", { cards: [card("LATE")] }, pullAt - 500);
  const secondPull = await send(late.db, "u1", { cursor: firstPull.cursor }, pullAt + 1000);
  check("a late commit behind the cursor is still seen", secondPull.changes.cards.some((c) => c.questionId === "LATE"));
  const aged = await send(late.db, "u1", { cursor: secondPull.cursor }, pullAt + 600_000);
  check("the cursor settles once rows age out", aged.cursor.cardsAt === pullAt - 500 && aged.cursor.cardsId === "LATE");
  const settled = await send(late.db, "u1", { cursor: aged.cursor }, pullAt + 601_000);
  check("nothing repeats after it settles", settled.changes.cards.length === 0);
  late.client.close();
  client.close();
}

// Regression checks.
async function checkNoOpMerge() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");

  const first = await send(db, "u1", { cards: [card("NOOP", { status: "learned", step: 4, updatedAt: T0 })] }, T0);
  const base = first.saved.cards[0].updatedAt;
  const before = await storedCard(db, "u1", "NOOP");
  await send(db, "u1", {
    cards: [card("NOOP", { status: "learning", step: 1, updatedAt: T0 + 10, baseUpdatedAt: 5 })],
  }, T0 + 10);
  const after = await storedCard(db, "u1", "NOOP");
  check(
    "a stale upload that changes nothing leaves the row alone",
    after.updatedAt === before.updatedAt && after.changedAt === before.changedAt,
    `updatedAt ${before.updatedAt} -> ${after.updatedAt}`,
  );
  const lapse = await send(db, "u1", {
    cards: [card("NOOP", { status: "learning", step: 1, lastAgainDay: 200, updatedAt: T0 + 20, baseUpdatedAt: base })],
  }, T0 + 20);
  check(
    "an up-to-date phone's lapse survives another phone's stale upload",
    lapse.saved.cards[0].status === "learning" && lapse.saved.cards[0].step === 1,
    `status=${lapse.saved.cards[0].status} step=${lapse.saved.cards[0].step}`,
  );

  await send(db, "u1", { cards: [card("REMERGE", { status: "learned", step: 4, introducedDay: 110 })] }, T0);
  const upload = card("REMERGE", { status: "learning", step: 1, introducedDay: 105, updatedAt: T0 + 5, baseUpdatedAt: 7 });
  const merged = await send(db, "u1", { cards: [upload] }, T0 + 5);
  const mergedRow = await storedCard(db, "u1", "REMERGE");
  check("a real merge is stored", merged.saved.cards[0].introducedDay === 105 && merged.saved.cards[0].step === 4);
  await send(db, "u1", { cards: [upload] }, T0 + 6);
  const retried = await storedCard(db, "u1", "REMERGE");
  check(
    "retrying a merged upload writes nothing",
    retried.updatedAt === mergedRow.updatedAt && retried.changedAt === mergedRow.changedAt,
    `updatedAt ${mergedRow.updatedAt} -> ${retried.updatedAt}`,
  );
  client.close();
}

async function checkMarkRetry() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");

  const fastStamp = T0 + 3_600_000;
  const first = await send(db, "u1", { marks: [mark(MARK_A, { updatedAt: fastStamp })] }, T0);
  const retry = await send(db, "u1", { marks: [mark(MARK_A, { updatedAt: fastStamp })] }, T0 + 240_000);
  check(
    "an identical mark retry from a fast clock writes nothing",
    retry.saved.marks[0].updatedAt === first.saved.marks[0].updatedAt,
    `updatedAt ${first.saved.marks[0].updatedAt} -> ${retry.saved.marks[0].updatedAt}`,
  );
  const eraseAt = T0 + 360_000;
  const erased = await send(db, "u1", { marks: [mark(MARK_A, { updatedAt: eraseAt, deletedAt: eraseAt })] }, eraseAt);
  check("a correct clock's erase wins after a fast clock's retry", erased.saved.marks[0].deletedAt === eraseAt);
  client.close();
}

async function checkPagingBothTables() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");

  const recent = T0 - 1000;
  await seedCards(db, "u1", 1300, recent);
  await seedMarks(db, "u1", 1700, recent);
  const cardIds = new Set<string>();
  const markIds = new Set<string>();
  let cursor: SyncCursor | null = null;
  let rounds = 0;
  for (;;) {
    const res: FlashcardSyncResponse = await send(db, "u1", { cursor }, T0);
    rounds++;
    for (const c of res.changes.cards) cardIds.add(c.questionId);
    for (const m of res.changes.marks) markIds.add(m.id);
    cursor = res.cursor;
    if (!res.hasMore || rounds > 40) break;
  }
  check("two recent tables finish in the larger one's page count", rounds === 4, `rounds=${rounds}`);
  check("two recent tables deliver every row", cardIds.size === 1300 && markIds.size === 1700, `${cardIds.size}/${markIds.size}`);
  check(
    "the final cursor of both tables rests on the safety floor",
    cursor?.cardsAt === T0 - 120_000 && cursor?.cardsId === "" && cursor?.marksAt === T0 - 120_000 && cursor?.marksId === "",
    JSON.stringify(cursor),
  );
  client.close();

  // A table that finishes first holds its exact cursor, so a late commit behind
  // it must still be seen once the whole pull ends and the cursor rewinds.
  const late = await freshDb();
  await addUser(late.client, "u1");
  await send(late.db, "u1", { cards: [card("FIRST")] }, T0 - 100);
  await seedMarks(late.db, "u1", 600, T0 - 1000);
  const round1 = await send(late.db, "u1", {}, T0);
  check("the short table holds its exact cursor mid-pull", round1.hasMore && round1.cursor.cardsAt === T0 - 100 && round1.cursor.cardsId === "FIRST");
  await send(late.db, "u1", { cards: [card("LATE-COMMIT")] }, T0 - 500);
  const round2 = await send(late.db, "u1", { cursor: round1.cursor }, T0);
  check("the pull ends and the short table rewinds", !round2.hasMore && round2.cursor.cardsAt === T0 - 120_000 && round2.cursor.cardsId === "");
  const nextSync = await send(late.db, "u1", { cursor: round2.cursor }, T0 + 1000);
  check("a late commit during a two-table pull is still seen", nextSync.changes.cards.some((c) => c.questionId === "LATE-COMMIT"));
  late.client.close();

  // Page boundaries.
  for (const [rows, expected] of [[500, 1], [501, 2], [1000, 2], [1001, 3]] as const) {
    const edge = await freshDb();
    await addUser(edge.client, "u1");
    await seedCards(edge.db, "u1", rows, T0 - 600_000);
    let at: SyncCursor | null = null;
    let pages = 0;
    let delivered = 0;
    for (;;) {
      const res: FlashcardSyncResponse = await send(edge.db, "u1", { cursor: at }, T0);
      pages++;
      delivered += res.changes.cards.length;
      at = res.cursor;
      if (!res.hasMore || pages > 5) break;
    }
    check(`${rows} rows take ${expected} page(s) with none repeated`, pages === expected && delivered === rows, `pages=${pages} delivered=${delivered}`);
    edge.client.close();
  }
}

function checkStoredTextIsFaithful() {
  for (const over of [
    { startOffset: 0, endOffset: 5, quote: "a\u0000cde" },
    { prefix: "the\u0000" },
    { suffix: "\u0000here" },
  ]) {
    check(
      `a NUL that storage would truncate is rejected: ${Object.keys(over).join(",")}`,
      validateMark({ ...mark(MARK_A), ...over }, T0) === null,
    );
  }
}

async function checkIsolation() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");
  await addUser(client, "u2");

  await send(db, "u1", { cards: [card("SHARED", { step: 7 })], marks: [mark(MARK_A)] }, T0);
  const smuggled = await send(db, "u2", {
    cards: [{ ...card("SHARED", { step: 1 }), userId: "u1", changedAt: 1 }],
    marks: [{ ...mark(MARK_A, { updatedAt: T0 + 5, deletedAt: T0 + 5 }), userId: "u1", changedAt: 1 }],
  }, T0 + 5);
  check("a smuggled userId cannot change another user's card", (await storedCard(db, "u1", "SHARED")).step === 7);
  const [victimMark] = await db.select().from(flashcardMarks)
    .where(and(eq(flashcardMarks.userId, "u1"), eq(flashcardMarks.id, MARK_A)));
  check("a smuggled userId cannot erase another user's mark", victimMark.deletedAt === null);
  check("the same keys are stored for the second user", smuggled.saved.cards[0].step === 1 && smuggled.saved.marks[0].deletedAt === T0 + 5);
  const pull = await send(db, "u2", {}, T0 + 6);
  check(
    "a pull returns only the caller's rows",
    pull.changes.cards.length === 1 && pull.changes.cards[0].step === 1 &&
      pull.changes.marks.length === 1 && pull.changes.marks[0].deletedAt === T0 + 5,
  );
  client.close();
}

// Loads the real route handlers with auth, database and cron helpers replaced in memory.
type Loader = (request: string, parent: unknown, isMain: boolean) => unknown;
const loaderHost = Module as unknown as { _load: Loader };
const stubs = new Map<string, unknown>();
const realLoad = loaderHost._load;
loaderHost._load = (request, parent, isMain) =>
  stubs.has(request) ? stubs.get(request) : realLoad(request, parent, isMain);
const load = createRequire(__filename);

async function checkRoute() {
  const { client, db } = await freshDb();
  await addUser(client, "u1");
  let sessionUser: string | null = null;
  stubs.set("@/auth", { auth: async () => (sessionUser ? { user: { id: sessionUser } } : null) });
  stubs.set("@/lib/db", { db });
  const route = load("../../app/api/flashcards/sync/route") as { POST: (req: Request) => Promise<Response> };

  const post = (body: unknown) =>
    route.POST(new Request("http://local.test/api/flashcards/sync", {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }));
  const good = (ownerId: string) => ({ v: 1, ownerId, cursor: null, cards: [card("ROUTE-1")], marks: [] });

  sessionUser = null;
  check("no session returns 401", (await post(good("u1"))).status === 401);

  sessionUser = "u1";
  const mismatch = await post(good("someone-else"));
  const mismatchBody = (await mismatch.json()) as { code?: string };
  check("409 owner mismatch", mismatch.status === 409 && mismatchBody.code === "OWNER_MISMATCH");
  check("a refused upload writes nothing", (await rowCount(client, "flashcard_progress", "u1")) === 0);

  const broken = await post("{not json");
  check("bad JSON returns 400 BAD_BODY", broken.status === 400 && ((await broken.json()) as { code?: string }).code === "BAD_BODY");
  const badVersion = await post({ ...good("u1"), v: 9 });
  check("bad envelope returns 400", badVersion.status === 400 && ((await badVersion.json()) as { code?: string }).code === "BAD_VERSION");

  const ok = await post(good("u1"));
  const okBody = (await ok.json()) as FlashcardSyncResponse;
  check("a good request returns 200", ok.status === 200 && okBody.v === 1 && okBody.saved.cards.length === 1);

  sessionUser = "rate-user";
  let limited: Response | null = null;
  for (let i = 0; i < 31; i++) limited = await post("{not json");
  check("the 31st request in a minute returns 429", limited?.status === 429 && limited.headers.get("Retry-After") === "60");

  // A database failure must surface as a 500 so the phone keeps its rows dirty.
  sessionUser = "u1";
  await client.execute("DROP TABLE flashcard_marks");
  const quiet = console.error;
  console.error = () => {};
  const failed = await post({ ...good("u1"), marks: [mark(MARK_A)] });
  console.error = quiet;
  check("a database failure returns 500", failed.status === 500);
  client.close();
}

async function checkHardDelete() {
  const { client, db } = await freshDb();
  await client.execute("PRAGMA foreign_keys = OFF"); // proves the explicit delete, not the cascade
  const foreignKeys = await client.execute("PRAGMA foreign_keys");
  check("hard delete test runs with foreign keys off", Number(foreignKeys.rows[0].foreign_keys) === 0);
  await client.execute(
    "CREATE TABLE linked_providers (id text PRIMARY KEY, user_id text, provider text, provider_subject text, linked_at integer, apple_refresh_token text)",
  );
  await client.execute({
    sql: "INSERT INTO users (id, email, deleted_at) VALUES ('gone', 'gone@example.test', ?), ('kept', 'kept@example.test', NULL)",
    args: [Math.floor((Date.now() - 40 * 86_400_000) / 1000)],
  });
  for (const userId of ["gone", "kept"]) {
    await send(db, userId, { cards: [card("HD-1")], marks: [mark(MARK_A)] }, T0);
  }

  stubs.set("@/lib/db", { ...schema, db });
  stubs.set("@/lib/cron-auth", { verifyCronRequest: () => true });
  stubs.set("@/lib/apple-revocation", { revokeAppleRefreshToken: async () => {} });
  const route = load("../../app/api/cron/hard-delete/route") as { GET: (req: unknown) => Promise<Response> };

  const quiet = console.log;
  console.log = () => {};
  const res = await route.GET(new Request("http://local.test/api/cron/hard-delete"));
  console.log = quiet;
  const body = (await res.json()) as { deleted?: number };
  check("hard delete runs", res.status === 200 && body.deleted === 1, JSON.stringify(body));
  check("hard delete removes the user's cards", (await rowCount(client, "flashcard_progress", "gone")) === 0);
  check("hard delete removes the user's marks", (await rowCount(client, "flashcard_marks", "gone")) === 0);
  check("hard delete keeps other users' cards", (await rowCount(client, "flashcard_progress", "kept")) === 1);
  check("hard delete keeps other users' marks", (await rowCount(client, "flashcard_marks", "kept")) === 1);
  client.close();
}

async function main() {
  await checkMigration();
  await checkBatchShapes();
  await checkConflicts();
  await checkMarks();
  checkValidators();
  await checkCeilings();
  await checkPaging();
  await checkNoOpMerge();
  await checkMarkRetry();
  await checkPagingBothTables();
  checkStoredTextIsFaithful();
  await checkIsolation();
  await checkRoute();
  await checkHardDelete();

  if (failures.length) {
    for (const f of failures) console.error(`FAIL ${f}`);
    console.error(`flashcard-sync: ${failures.length} failed, ${passed} passed`);
    process.exit(1);
  }
  console.log(`flashcard-sync: ${passed} passed`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
