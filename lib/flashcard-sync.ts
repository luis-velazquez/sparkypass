// Flash card sync: validation, conflict rules, upsert and keyset pull for
// POST /api/flashcards/sync. Takes `db` as a parameter so the check file can
// run it on in-memory libSQL.

import { and, asc, count, eq, getTableColumns, gt, inArray, or, sql, type SQL } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import type { SQLiteTable } from "drizzle-orm/sqlite-core";
import { flashcardMarks, flashcardProgress } from "@/lib/db/schema";
import type * as schema from "@/lib/db/schema";

export type Db = LibSQLDatabase<typeof schema>;

export type CardPile = "new" | "learning" | "learned";
export type MarkField = "question" | "answer" | "explanation" | "tip";
export type MarkKind = "user" | "starter_off";
export type CardLang = "en" | "es";

export interface CardRow {
  questionId: string;
  status: CardPile;
  knows: 0 | 1;
  knowDay: number | null;
  step: number;
  dueDay: number | null;
  introducedDay: number | null;
  lastAgainDay: number | null;
  updatedAt: number;
  baseUpdatedAt: number | null;
}

export interface MarkRow {
  id: string;
  questionId: string;
  lang: CardLang;
  field: MarkField;
  kind: MarkKind;
  startOffset: number;
  endOffset: number;
  quote: string;
  prefix: string;
  suffix: string;
  textHash: string;
  keyHash: string;
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
}

export interface SyncCursor {
  cardsAt: number;
  cardsId: string;
  marksAt: number;
  marksId: string;
}

export interface FlashcardSyncRequest {
  v: 1;
  ownerId: string;
  cursor: SyncCursor | null;
  cards: CardRow[];
  marks: MarkRow[];
}

export interface FlashcardSyncResponse {
  v: 1;
  serverTime: number;
  saved: { cards: CardRow[]; marks: MarkRow[] };
  rejected: { kind: "card" | "mark"; key: string; code: string }[];
  changes: { cards: CardRow[]; marks: MarkRow[] };
  cursor: SyncCursor;
  hasMore: boolean;
}

export const MAX_BATCH = 200;
export const MAX_CARD_ROWS = 2_000;
export const MAX_MARK_ROWS = 10_000;
export const PAGE = 500;

const MAX_CURSOR_ID = 64;
const MAX_REJECTED_KEY = 200;
const MAX_DAY = 100_000;
const MAX_STEP = 16;
const MAX_OFFSET = 4_000;
const MAX_QUOTE = 200;
const MAX_CONTEXT = 120;
const FUTURE_LIMIT_MS = 5 * 60_000;
const CURSOR_SAFETY_MS = 120_000;

const QUESTION_ID = /^[A-Za-z0-9][A-Za-z0-9-]{0,39}$/;
const MARK_ID = /^[ms][0-9a-f]{16}$/;
const HASH = /^[0-9a-f]{8}$/;

const PILES: readonly string[] = ["new", "learning", "learned"];
const LANGS: readonly string[] = ["en", "es"];
const FIELDS: readonly string[] = ["question", "answer", "explanation", "tip"];
const KINDS: readonly string[] = ["user", "starter_off"];

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);
const isInt = (v: unknown): v is number => Number.isSafeInteger(v);
const isStamp = (v: unknown): v is number => isInt(v) && v > 0;
const isStampOrNull = (v: unknown): v is number | null => v === null || isStamp(v);
const isDay = (v: unknown): v is number | null => v === null || (isInt(v) && v >= 0 && v <= MAX_DAY);
// A NUL is refused because libSQL reads the text back cut off at it.
const isText = (v: unknown, max: number): v is string =>
  typeof v === "string" && v.length <= max && !v.includes("\u0000");
const isHash = (v: unknown): v is string => typeof v === "string" && HASH.test(v);
const isQuestionId = (v: unknown): v is string => typeof v === "string" && QUESTION_ID.test(v);
const isOneOf = (v: unknown, allowed: readonly string[]): v is string =>
  typeof v === "string" && allowed.includes(v);

function parseCursor(raw: unknown): SyncCursor | null | undefined {
  if (raw === null) return null;
  if (!isRecord(raw)) return undefined;
  const { cardsAt, cardsId, marksAt, marksId } = raw;
  if (!isInt(cardsAt) || cardsAt < 0 || !isInt(marksAt) || marksAt < 0) return undefined;
  if (!isText(cardsId, MAX_CURSOR_ID) || !isText(marksId, MAX_CURSOR_ID)) return undefined;
  return { cardsAt, cardsId, marksAt, marksId };
}

/**
 * Checks the envelope only. Rows are validated one by one in applySync, so a
 * bad row is rejected alone and never fails the whole batch.
 */
export function parseSyncBody(
  json: unknown,
): { ok: true; body: FlashcardSyncRequest } | { ok: false; code: string } {
  if (!isRecord(json)) return { ok: false, code: "BAD_BODY" };
  if (json.v !== 1) return { ok: false, code: "BAD_VERSION" };
  if (typeof json.ownerId !== "string" || json.ownerId.length === 0) {
    return { ok: false, code: "BAD_OWNER" };
  }
  const cursor = parseCursor(json.cursor);
  if (cursor === undefined) return { ok: false, code: "BAD_CURSOR" };
  if (!Array.isArray(json.cards) || !Array.isArray(json.marks)) {
    return { ok: false, code: "BAD_ROWS" };
  }
  if (json.cards.length > MAX_BATCH || json.marks.length > MAX_BATCH) {
    return { ok: false, code: "TOO_MANY" };
  }
  return {
    ok: true,
    body: {
      v: 1,
      ownerId: json.ownerId,
      cursor,
      cards: json.cards as CardRow[],
      marks: json.marks as MarkRow[],
    },
  };
}

export function validateCard(raw: unknown, now: number): CardRow | null {
  if (!isRecord(raw)) return null;
  const { questionId, status, knows, knowDay, step, dueDay, introducedDay, lastAgainDay, updatedAt, baseUpdatedAt } = raw;
  if (!isQuestionId(questionId) || !isOneOf(status, PILES)) return null;
  if (knows !== 0 && knows !== 1) return null;
  if (!isInt(step) || step < 0 || step > MAX_STEP) return null;
  if (!isDay(knowDay) || !isDay(dueDay) || !isDay(introducedDay) || !isDay(lastAgainDay)) return null;
  if (!isStamp(updatedAt) || !isStampOrNull(baseUpdatedAt)) return null;
  return {
    questionId,
    status: status as CardPile,
    knows,
    knowDay,
    step,
    dueDay,
    introducedDay,
    lastAgainDay,
    updatedAt: Math.min(updatedAt, now + FUTURE_LIMIT_MS),
    baseUpdatedAt,
  };
}

export function validateMark(raw: unknown, now: number): MarkRow | null {
  if (!isRecord(raw)) return null;
  const {
    id, questionId, lang, field, kind, startOffset, endOffset,
    quote, prefix, suffix, textHash, keyHash, createdAt, updatedAt, deletedAt,
  } = raw;
  if (typeof id !== "string" || !MARK_ID.test(id) || !isQuestionId(questionId)) return null;
  if (!isOneOf(lang, LANGS) || !isOneOf(field, FIELDS) || !isOneOf(kind, KINDS)) return null;
  if (!isInt(startOffset) || !isInt(endOffset)) return null;
  if (startOffset < 0 || startOffset >= endOffset || endOffset > MAX_OFFSET) return null;
  if (!isText(quote, MAX_QUOTE) || quote.length < 1 || quote.length !== endOffset - startOffset) return null;
  if (!isText(prefix, MAX_CONTEXT) || !isText(suffix, MAX_CONTEXT)) return null;
  if (!isHash(textHash) || !isHash(keyHash)) return null;
  if (!isStamp(createdAt) || !isStamp(updatedAt) || !isStampOrNull(deletedAt)) return null;
  return {
    id,
    questionId,
    lang: lang as CardLang,
    field: field as MarkField,
    kind: kind as MarkKind,
    startOffset,
    endOffset,
    quote,
    prefix,
    suffix,
    textHash,
    keyHash,
    createdAt,
    updatedAt: Math.min(updatedAt, now + FUTURE_LIMIT_MS),
    deletedAt,
  };
}

const RANK = { new: 0, learning: 1, learned: 2 } as const;
const rankOf = (c: CardRow): [number, number, number] => [RANK[c.status], c.step, c.knows];

function compareRank(a: CardRow, b: CardRow): number {
  const [x, y] = [rankOf(a), rankOf(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return a.updatedAt - b.updatedAt;
}

const sameState = (a: CardRow, b: CardRow) =>
  a.status === b.status && a.knows === b.knows && a.knowDay === b.knowDay && a.step === b.step &&
  a.dueDay === b.dueDay && a.introducedDay === b.introducedDay && a.lastAgainDay === b.lastAgainDay;

const minDay = (a: number | null, b: number | null) => (a === null ? b : b === null ? a : Math.min(a, b));
const maxDay = (a: number | null, b: number | null) => (a === null ? b : b === null ? a : Math.max(a, b));

/** The row to store, or null when the stored row already says the same thing. */
export function resolveCard(incoming: CardRow, stored: CardRow | undefined): CardRow | null {
  if (!stored) return incoming;
  if (sameState(incoming, stored)) return null;
  if (incoming.baseUpdatedAt === stored.updatedAt) {
    return { ...incoming, updatedAt: Math.max(incoming.updatedAt, stored.updatedAt + 1) };
  }
  const winner = compareRank(incoming, stored) >= 0 ? incoming : stored;
  const merged: CardRow = {
    ...winner,
    introducedDay: minDay(incoming.introducedDay, stored.introducedDay),
    lastAgainDay: maxDay(incoming.lastAgainDay, stored.lastAgainDay),
    updatedAt: Math.max(incoming.updatedAt, stored.updatedAt) + 1,
  };
  // A merge that changes nothing must not move the stamp: that would turn another
  // phone's up-to-date base stale and cost it a real lapse.
  return sameState(merged, stored) ? null : merged;
}

/** True when an upload would leave the stored mark saying the same thing. */
const sameMark = (a: MarkRow, b: MarkRow) =>
  a.questionId === b.questionId && a.lang === b.lang && a.field === b.field && a.kind === b.kind &&
  a.startOffset === b.startOffset && a.endOffset === b.endOffset && a.quote === b.quote &&
  a.prefix === b.prefix && a.suffix === b.suffix && a.textHash === b.textHash &&
  a.keyHash === b.keyHash && a.deletedAt === b.deletedAt;

const excludedSet = (table: SQLiteTable, skip: string[]) =>
  Object.fromEntries(
    Object.entries(getTableColumns(table))
      .filter(([k]) => !skip.includes(k))
      .map(([k, c]) => [k, sql.raw(`excluded."${c.name}"`)]),
  ) as Record<string, SQL>;

function toCard(r: typeof flashcardProgress.$inferSelect): CardRow {
  return {
    questionId: r.questionId,
    status: r.status as CardPile,
    knows: r.knows === 1 ? 1 : 0,
    knowDay: r.knowDay,
    step: r.step,
    dueDay: r.dueDay,
    introducedDay: r.introducedDay,
    lastAgainDay: r.lastAgainDay,
    updatedAt: r.updatedAt,
    baseUpdatedAt: r.updatedAt,
  };
}

function toMark(r: typeof flashcardMarks.$inferSelect): MarkRow {
  return {
    id: r.id,
    questionId: r.questionId,
    lang: r.lang as CardLang,
    field: r.field as MarkField,
    kind: r.kind as MarkKind,
    startOffset: r.startOffset,
    endOffset: r.endOffset,
    quote: r.quote,
    prefix: r.prefix,
    suffix: r.suffix,
    textHash: r.textHash,
    keyHash: r.keyHash,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    deletedAt: r.deletedAt,
  };
}

/** If a batch repeats a key, keep the row with the highest updatedAt. */
function latestByKey<T extends { updatedAt: number }>(rows: T[], keyOf: (row: T) => string): T[] {
  const best = new Map<string, T>();
  for (const row of rows) {
    const key = keyOf(row);
    const current = best.get(key);
    if (!current || row.updatedAt >= current.updatedAt) best.set(key, row);
  }
  return [...best.values()];
}

/** Existing keys always pass; new keys pass only while the user has room. */
function admit<T>(rows: T[], keyOf: (row: T) => string, known: Set<string>, room: number) {
  const admitted: T[] = [];
  const over: T[] = [];
  let left = room;
  for (const row of rows) {
    if (known.has(keyOf(row))) {
      admitted.push(row);
    } else if (left > 0) {
      left--;
      admitted.push(row);
    } else {
      over.push(row);
    }
  }
  return { admitted, over };
}

function rejectedKey(raw: unknown, field: "questionId" | "id"): string {
  if (!isRecord(raw)) return "";
  const key = raw[field];
  return typeof key === "string" ? key.slice(0, MAX_REJECTED_KEY) : "";
}

const finalCursor = (
  prevAt: number,
  prevId: string,
  last: { changedAt: number; key: string } | undefined,
  now: number,
) => {
  const floor = now - CURSOR_SAFETY_MS;
  if (last && last.changedAt <= floor) return { at: last.changedAt, id: last.key };
  if (!last && prevAt <= floor) return { at: prevAt, id: prevId };
  return { at: Math.min(last?.changedAt ?? prevAt, floor), id: "" };
};

/** Trims the PAGE + 1 fetch. */
function pageOf<T extends { changedAt: number }>(rows: T[], keyOf: (row: T) => string) {
  const more = rows.length > PAGE;
  const kept = more ? rows.slice(0, PAGE) : rows;
  const tail = kept[kept.length - 1];
  const last = tail ? { changedAt: tail.changedAt, key: keyOf(tail) } : undefined;
  return { kept, more, last };
}

/**
 * While either table has more pages, each cursor is the exact last row. Rewinding
 * one table to the safety floor early would re-read it and keep hasMore true.
 */
const nextCursor = (
  last: { changedAt: number; key: string } | undefined,
  prevAt: number,
  prevId: string,
  anyMore: boolean,
  now: number,
) => {
  if (!anyMore) return finalCursor(prevAt, prevId, last, now);
  return last ? { at: last.changedAt, id: last.key } : { at: prevAt, id: prevId };
};

export async function applySync(
  db: Db,
  userId: string,
  body: FlashcardSyncRequest,
  now: number,
): Promise<FlashcardSyncResponse> {
  const rejected: FlashcardSyncResponse["rejected"] = [];

  const checkedCards: CardRow[] = [];
  for (const raw of body.cards as unknown[]) {
    const card = validateCard(raw, now);
    if (card) checkedCards.push(card);
    else rejected.push({ kind: "card", key: rejectedKey(raw, "questionId"), code: "INVALID" });
  }
  const checkedMarks: MarkRow[] = [];
  for (const raw of body.marks as unknown[]) {
    const mark = validateMark(raw, now);
    if (mark) checkedMarks.push(mark);
    else rejected.push({ kind: "mark", key: rejectedKey(raw, "id"), code: "INVALID" });
  }

  const uniqueCards = latestByKey(checkedCards, (c) => c.questionId);
  const uniqueMarks = latestByKey(checkedMarks, (m) => m.id);
  const cardIds = uniqueCards.map((c) => c.questionId);
  const markIds = uniqueMarks.map((m) => m.id);

  const stored = cardIds.length
    ? await db.select().from(flashcardProgress)
        .where(and(eq(flashcardProgress.userId, userId), inArray(flashcardProgress.questionId, cardIds)))
    : [];
  const storedBy = new Map(stored.map((r) => [r.questionId, toCard(r)]));

  const storedMarks = markIds.length
    ? await db.select().from(flashcardMarks)
        .where(and(eq(flashcardMarks.userId, userId), inArray(flashcardMarks.id, markIds)))
    : [];
  const storedMarkBy = new Map(storedMarks.map((r) => [r.id, toMark(r)]));
  const knownMarks = new Set(storedMarkBy.keys());

  let cardRoom = 0;
  if (uniqueCards.some((c) => !storedBy.has(c.questionId))) {
    const [row] = await db.select({ n: count() }).from(flashcardProgress)
      .where(eq(flashcardProgress.userId, userId));
    cardRoom = MAX_CARD_ROWS - (row?.n ?? 0);
  }
  let markRoom = 0;
  if (uniqueMarks.some((m) => !knownMarks.has(m.id))) {
    const [row] = await db.select({ n: count() }).from(flashcardMarks)
      .where(eq(flashcardMarks.userId, userId));
    markRoom = MAX_MARK_ROWS - (row?.n ?? 0);
  }

  const cardGate = admit(uniqueCards, (c) => c.questionId, new Set(storedBy.keys()), cardRoom);
  const markGate = admit(uniqueMarks, (m) => m.id, knownMarks, markRoom);
  for (const c of cardGate.over) rejected.push({ kind: "card", key: c.questionId, code: "LIMIT" });
  for (const m of markGate.over) rejected.push({ kind: "mark", key: m.id, code: "LIMIT" });

  const cardWrites = cardGate.admitted.flatMap((c) => {
    const next = resolveCard(c, storedBy.get(c.questionId));
    if (!next) return [];
    const { baseUpdatedAt: _base, ...row } = next; // not a column
    void _base;
    return [{ ...row, userId, changedAt: now }];
  });

  // One multi-row statement per table, because db.transaction differs between
  // the local and Turso drivers. Drizzle's values([]) throws, so each is guarded.
  if (cardWrites.length) {
    await db.insert(flashcardProgress).values(cardWrites).onConflictDoUpdate({
      target: [flashcardProgress.userId, flashcardProgress.questionId],
      set: excludedSet(flashcardProgress, ["userId", "questionId"]),
      setWhere: sql`excluded."updated_at" > ${flashcardProgress.updatedAt}`,
    });
  }
  // A retry of what is already stored writes nothing. With a fast clock its clamped
  // stamp would otherwise creep forward and beat a later edit from a correct clock.
  const markWrites = markGate.admitted.filter((m) => {
    const current = storedMarkBy.get(m.id);
    return !current || !sameMark(m, current);
  });
  if (markWrites.length) {
    await db.insert(flashcardMarks)
      .values(markWrites.map((m) => ({ ...m, userId, changedAt: now })))
      .onConflictDoUpdate({
        target: [flashcardMarks.userId, flashcardMarks.id],
        set: excludedSet(flashcardMarks, ["userId", "id", "createdAt"]),
        setWhere: sql`excluded."updated_at" > ${flashcardMarks.updatedAt}`,
      });
  }

  const savedCardIds = cardGate.admitted.map((c) => c.questionId);
  const savedMarkIds = markGate.admitted.map((m) => m.id);
  const savedCards = savedCardIds.length
    ? await db.select().from(flashcardProgress)
        .where(and(eq(flashcardProgress.userId, userId), inArray(flashcardProgress.questionId, savedCardIds)))
    : [];
  const savedMarks = savedMarkIds.length
    ? await db.select().from(flashcardMarks)
        .where(and(eq(flashcardMarks.userId, userId), inArray(flashcardMarks.id, savedMarkIds)))
    : [];

  const cardsAt = body.cursor?.cardsAt ?? 0;
  const cardsId = body.cursor?.cardsId ?? "";
  const marksAt = body.cursor?.marksAt ?? 0;
  const marksId = body.cursor?.marksId ?? "";

  const cardRows = await db.select().from(flashcardProgress)
    .where(and(
      eq(flashcardProgress.userId, userId),
      or(
        gt(flashcardProgress.changedAt, cardsAt),
        and(eq(flashcardProgress.changedAt, cardsAt), gt(flashcardProgress.questionId, cardsId)),
      ),
    ))
    .orderBy(asc(flashcardProgress.changedAt), asc(flashcardProgress.questionId))
    .limit(PAGE + 1);
  const markRows = await db.select().from(flashcardMarks)
    .where(and(
      eq(flashcardMarks.userId, userId),
      or(
        gt(flashcardMarks.changedAt, marksAt),
        and(eq(flashcardMarks.changedAt, marksAt), gt(flashcardMarks.id, marksId)),
      ),
    ))
    .orderBy(asc(flashcardMarks.changedAt), asc(flashcardMarks.id))
    .limit(PAGE + 1);

  const cardPage = pageOf(cardRows, (r) => r.questionId);
  const markPage = pageOf(markRows, (r) => r.id);
  const hasMore = cardPage.more || markPage.more;
  const nextCards = nextCursor(cardPage.last, cardsAt, cardsId, hasMore, now);
  const nextMarks = nextCursor(markPage.last, marksAt, marksId, hasMore, now);

  return {
    v: 1,
    serverTime: now,
    saved: { cards: savedCards.map(toCard), marks: savedMarks.map(toMark) },
    rejected,
    changes: { cards: cardPage.kept.map(toCard), marks: markPage.kept.map(toMark) },
    cursor: { cardsAt: nextCards.at, cardsId: nextCards.id, marksAt: nextMarks.at, marksId: nextMarks.id },
    hasMore,
  };
}
