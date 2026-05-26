// Admin moderation queue for /api/feedback submissions.
//
// Per OQ#9 resolution: feedback Watts rewards are gated on manual approval to
// prevent spam farming. This page is the operator UX for that queue. Access
// is gated by the API (ADMIN_USER_IDS env var); a non-admin sees a 403 from
// the underlying calls and gets a "not authorized" message here.

"use client";

import { useCallback, useEffect, useState } from "react";

type ModerationStatus = "pending" | "approved" | "rejected";

interface FeedbackItem {
  id: string;
  type: "bug" | "improvement" | "confusing";
  message: string;
  page: string | null;
  moderationStatus: ModerationStatus;
  rewardedAt: string | null;
  createdAt: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
}

const TYPE_BADGE: Record<FeedbackItem["type"], string> = {
  bug: "bg-red-100 text-red-800 border-red-200",
  improvement: "bg-blue-100 text-blue-800 border-blue-200",
  confusing: "bg-amber-100 text-amber-800 border-amber-200",
};

const TYPE_LABEL: Record<FeedbackItem["type"], string> = {
  bug: "Bug",
  improvement: "Suggestion",
  confusing: "Confusing",
};

export default function FeedbackModerationPage() {
  const [status, setStatus] = useState<ModerationStatus>("pending");
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`/api/admin/feedback?status=${status}&limit=100`, {
        cache: "no-store",
      });
      if (res.status === 403) {
        setError("You are not authorized to view this page.");
        setItems([]);
        return;
      }
      if (!res.ok) {
        setError(`Failed to load (${res.status})`);
        setItems([]);
        return;
      }
      const data = (await res.json()) as { items: FeedbackItem[] };
      setItems(data.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
      setItems([]);
    }
  }, [status]);

  useEffect(() => {
    setItems(null);
    load();
  }, [load]);

  async function moderate(id: string, decision: "approved" | "rejected") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/feedback/${id}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decision }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `Moderate failed (${res.status})`);
        return;
      }
      // Optimistic remove from the current list.
      setItems((cur) => cur?.filter((i) => i.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Feedback moderation</h1>
          <p className="mt-1 text-sm text-stone-600">
            Approve to award Watts; reject to drop without penalty. Approval is
            idempotent — already-approved submissions don&apos;t double-award.
          </p>
        </div>
        <div className="flex gap-2">
          {(["pending", "approved", "rejected"] as ModerationStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-md border px-3 py-1.5 text-sm capitalize ${
                status === s
                  ? "border-amber-400 bg-amber-50 text-amber-900"
                  : "border-stone-200 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {items === null && !error && (
        <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
          Loading…
        </div>
      )}

      {items !== null && items.length === 0 && !error && (
        <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
          No {status} submissions.
        </div>
      )}

      <ul className="space-y-3">
        {items?.map((item) => (
          <li
            key={item.id}
            className="rounded-lg border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded border px-2 py-0.5 text-xs font-medium ${TYPE_BADGE[item.type]}`}
                >
                  {TYPE_LABEL[item.type]}
                </span>
                <span className="text-sm font-medium text-stone-900">
                  {item.userName ?? "Unknown user"}
                </span>
                {item.userEmail && (
                  <span className="text-xs text-stone-500">{item.userEmail}</span>
                )}
                {item.page && (
                  <span className="rounded bg-stone-100 px-1.5 py-0.5 font-mono text-xs text-stone-600">
                    {item.page}
                  </span>
                )}
              </div>
              <span className="shrink-0 text-xs text-stone-500">
                {new Date(item.createdAt).toLocaleString()}
              </span>
            </div>

            <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-stone-800">
              {item.message}
            </p>

            {status === "pending" ? (
              <div className="flex gap-2">
                <button
                  disabled={busyId === item.id}
                  onClick={() => moderate(item.id, "approved")}
                  className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                >
                  Approve · award 25W
                </button>
                <button
                  disabled={busyId === item.id}
                  onClick={() => moderate(item.id, "rejected")}
                  className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
                >
                  Reject
                </button>
              </div>
            ) : (
              <div className="text-xs text-stone-500">
                {item.moderationStatus === "approved" && item.rewardedAt
                  ? `Approved — Watts awarded ${new Date(item.rewardedAt).toLocaleString()}`
                  : item.moderationStatus === "approved"
                    ? "Approved (no Watts logged)"
                    : "Rejected"}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
