// The three offer emails (HQ Plan/sparkypass-offer-emails-plan.md, v0.2).
//
// From "Luis at SparkyPass", plain and short, one button, signed "Luis"
// (E-15). English first, then the same email in Spanish (E-03 option a: the
// server doesn't know who uses Español). Every email has the footer the US
// anti-spam law needs: why they got it, an unsubscribe link, a postal address.
//
// Only rendering lives here; lib/offer/run.ts decides who gets what.

import { APP_STORE_URL, LEGAL_ENTITY } from "@/lib/site";

export interface Rendered {
  subject: string;
  html: string;
  text: string;
}

export interface Footer {
  unsubscribeUrl: string;
  mailingAddress: string;
}

export interface Day6Input {
  name: string;
  when: "tomorrow" | "monday";
  answered: number;
  watts: number;
  fullPrice: string;
}

export interface Day15Input {
  name: string;
  version: "A" | "B";
  answered: number;
  watts: number;
  code: string;
  redeemUrl: string;
  useBy: Date;
  timeZone: string;
  price: string;
  fullPrice: string;
}

export interface Day19Input {
  name: string;
  daysLeft: number;
  code: string;
  redeemUrl: string;
  useBy: Date;
  timeZone: string;
  price: string;
  fullPrice: string;
}

// ─── helpers ────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** First word of the account name, unless it's empty or looks like an email. */
export function firstName(name: string): string | null {
  const first = (name || "").trim().split(/\s+/)[0] ?? "";
  if (!first || first.includes("@") || first.length > 40) return null;
  return first;
}

const hiEn = (name: string) => {
  const f = firstName(name);
  return f ? `Hi ${f},` : "Hi there,";
};
const hiEs = (name: string) => {
  const f = firstName(name);
  return f ? `Hola, ${f}:` : "Hola:";
};

const num = (n: number) => n.toLocaleString("en-US");

export function formatDate(d: Date, timeZone: string, lang: "en" | "es"): string {
  return new Intl.DateTimeFormat(lang === "en" ? "en-US" : "es-US", {
    timeZone,
    month: "long",
    day: "numeric",
  }).format(d);
}

const PRO_EN =
  "Pro is the whole app: 600+ practice questions, the Calc Trainer, load calculation practice, flashcards, daily questions and your progress report, in English or Español.";
const PRO_ES =
  "Pro es toda la app: más de 600 preguntas de práctica, el Calc Trainer, práctica de cálculos de carga, tarjetas de estudio, preguntas diarias y tu reporte de progreso, en inglés o en español.";

/** One email, both languages. A paragraph is plain text; `**x**` makes x bold. */
interface Body {
  subject: string;
  preheader: string;
  en: string[];
  es: string[];
  button: { label: string; url: string };
  /** Plain-text link under the Spanish copy (one button per email). */
  esLink: { label: string; url: string };
  /** The button (and the Spanish link) goes after this paragraph. Default: last. */
  buttonAfter?: number;
}

function inline(p: string): string {
  return esc(p).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}
const plain = (p: string) => p.replace(/\*\*(.+?)\*\*/g, "$1");

function build(b: Body, footer: Footer): Rendered {
  const para = (p: string) =>
    `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1c1917;">${inline(p)}</p>`;
  const cut = (b.buttonAfter ?? b.en.length - 1) + 1;
  const button = `<p style="margin:8px 0 24px;"><a href="${esc(b.button.url)}" style="background:#f59e0b;color:#000000;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;display:inline-block;">${esc(b.button.label)}</a></p>`;
  const esLink = `<p style="margin:0 0 16px;font-size:16px;line-height:1.5;"><a href="${esc(b.esLink.url)}" style="color:#b45309;font-weight:bold;">${esc(b.esLink.label)}</a></p>`;
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(b.subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(b.preheader)}</div>
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px 20px;">
${b.en.slice(0, cut).map(para).join("\n")}
${button}
${b.en.slice(cut).map(para).join("\n")}
${para("Luis")}
<hr style="border:none;border-top:1px solid #e7e5e4;margin:28px 0 20px;">
<p style="margin:0 0 12px;font-size:13px;color:#78716c;text-transform:uppercase;letter-spacing:0.05em;">En español</p>
${b.es.slice(0, cut).map(para).join("\n")}
${esLink}
${b.es.slice(cut).map(para).join("\n")}
${para("Luis")}
<hr style="border:none;border-top:1px solid #e7e5e4;margin:28px 0 16px;">
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#78716c;">Sent by SparkyPass because you have a SparkyPass account. · Te lo enviamos porque tienes una cuenta de SparkyPass.</p>
<p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:#78716c;"><a href="${esc(footer.unsubscribeUrl)}" style="color:#78716c;">Unsubscribe from offer emails · Darme de baja de las ofertas</a></p>
<p style="margin:0;font-size:12px;line-height:1.5;color:#78716c;">${esc(LEGAL_ENTITY)} · ${esc(footer.mailingAddress)}</p>
</div>
</body></html>`;

  const text = [
    ...b.en.slice(0, cut).map(plain),
    `${b.button.label}: ${b.button.url}`,
    ...b.en.slice(cut).map(plain),
    "Luis",
    "",
    "— En español —",
    "",
    ...b.es.slice(0, cut).map(plain),
    `${b.esLink.label}: ${b.esLink.url}`,
    ...b.es.slice(cut).map(plain),
    "Luis",
    "",
    "---",
    "Sent by SparkyPass because you have a SparkyPass account. · Te lo enviamos porque tienes una cuenta de SparkyPass.",
    `Unsubscribe from offer emails · Darme de baja de las ofertas: ${footer.unsubscribeUrl}`,
    `${LEGAL_ENTITY} · ${footer.mailingAddress}`,
  ].join("\n\n");

  return { subject: b.subject, html, text };
}

// ─── Email 1: day 6 ─────────────────────────────────────────────────────────

export function renderDay6(i: Day6Input, footer: Footer): Rendered {
  const whenEn = i.when === "monday" ? "Monday" : "tomorrow";
  const whenEs = i.when === "monday" ? "el lunes" : "mañana";
  const statsEn =
    i.answered === 0
      ? "You haven't taken a quiz yet. Try a quick 5-question one before your free week ends."
      : `This week you answered ${num(i.answered)} question${i.answered === 1 ? "" : "s"}${
          i.watts > 0 ? ` and earned ${num(i.watts)} Watts` : ""
        }.`;
  const statsEs =
    i.answered === 0
      ? "Todavía no has hecho ningún quiz. Haz uno rápido de 5 preguntas antes de que termine tu semana gratis."
      : `Esta semana respondiste ${num(i.answered)} pregunta${i.answered === 1 ? "" : "s"}${
          i.watts > 0 ? ` y ganaste ${num(i.watts)} Watts` : ""
        }.`;
  return build(
    {
      subject: `Your free week ends ${whenEn} · Tu semana gratis termina ${whenEs}`,
      preheader: statsEn,
      en: [
        hiEn(i.name),
        `Your SparkyPass free week ends ${whenEn}.`,
        statsEn,
        `To keep going, open SparkyPass and choose Pro: ${i.fullPrice} a month, cancel anytime. Your progress stays saved either way.`,
      ],
      es: [
        hiEs(i.name),
        `Tu semana gratis de SparkyPass termina ${whenEs}.`,
        statsEs,
        `Para seguir, abre SparkyPass y elige Pro: ${i.fullPrice} al mes, cancela cuando quieras. Tu progreso queda guardado de todos modos.`,
      ],
      button: { label: "Open SparkyPass", url: APP_STORE_URL },
      esLink: { label: "Abrir SparkyPass", url: APP_STORE_URL },
    },
    footer,
  );
}

// ─── Email 2: day 15, version A (studied) or B (barely tried) ───────────────

export function renderDay15(i: Day15Input, footer: Footer): Rendered {
  const dateEn = formatDate(i.useBy, i.timeZone, "en");
  const dateEs = formatDate(i.useBy, i.timeZone, "es");
  const redeemEn = `Or open SparkyPass, tap **Redeem a code**, and enter **${i.code}**.`;
  const redeemEs = `O abre SparkyPass, toca **Canjear un código** e ingresa **${i.code}**.`;
  const termsEn = `Use it by ${dateEn}. After the first month, Pro is ${i.fullPrice}/month. Cancel anytime in your iPhone Settings.`;
  const termsEs = `Úsalo antes del ${dateEs}. Después del primer mes, Pro cuesta ${i.fullPrice} al mes. Cancela cuando quieras en los Ajustes de tu iPhone.`;

  const studied = i.version === "A";
  const wattsEn = i.watts > 0 ? ` and earned ${num(i.watts)} Watts` : "";
  const wattsEs = i.watts > 0 ? ` y ganaste ${num(i.watts)} Watts` : "";
  const openEn = studied
    ? `In your free week you answered ${num(i.answered)} questions${wattsEn}. Your exam won't wait, so here's your first month of Pro for ${i.price} to keep going.`
    : `Your free week went by before you got a real look at SparkyPass. Here's a month of Pro for ${i.price}, so you can try it at your own pace. Start with a quick 5-question quiz.`;
  const openEs = studied
    ? `En tu semana gratis respondiste ${num(i.answered)} preguntas${wattsEs}. Tu examen no va a esperar, así que aquí tienes tu primer mes de Pro por ${i.price} para seguir.`
    : `Tu semana gratis se pasó antes de que pudieras conocer bien SparkyPass. Aquí tienes un mes de Pro por ${i.price} para que lo pruebes a tu ritmo. Empieza con un quiz rápido de 5 preguntas.`;

  return build(
    {
      subject: studied
        ? `Your first month of Pro for ${i.price} · Tu primer mes por ${i.price}`
        : `Try Pro for a month for ${i.price} · Prueba Pro un mes por ${i.price}`,
      preheader: `Your code: ${i.code}. Use it by ${dateEn}.`,
      en: [hiEn(i.name), openEn, redeemEn, PRO_EN, termsEn],
      es: [hiEs(i.name), openEs, redeemEs, PRO_ES, termsEs],
      button: { label: `Get my ${i.price} month`, url: i.redeemUrl },
      esLink: { label: `Obtener mi mes por ${i.price}`, url: i.redeemUrl },
      buttonAfter: 1,
    },
    footer,
  );
}

// ─── Email 3: day 19 reminder ───────────────────────────────────────────────

export function renderDay19(i: Day19Input, footer: Footer): Rendered {
  const dateEn = formatDate(i.useBy, i.timeZone, "en");
  const dateEs = formatDate(i.useBy, i.timeZone, "es");
  const leftEn = `${i.daysLeft} day${i.daysLeft === 1 ? "" : "s"} left`;
  const leftEs = i.daysLeft === 1 ? "Te queda 1 día" : `Te quedan ${i.daysLeft} días`;
  return build(
    {
      subject: `${leftEn} on your ${i.price} month · ${leftEs}`,
      preheader: `Your code ${i.code} is good through ${dateEn}.`,
      en: [
        hiEn(i.name),
        `Your ${i.price} first month of Pro is still waiting. It's good through ${dateEn}. Your code: **${i.code}**.`,
        `After the first month, Pro is ${i.fullPrice}/month. Cancel anytime.`,
      ],
      es: [
        hiEs(i.name),
        `Tu primer mes de Pro por ${i.price} todavía te espera. Es válido hasta el ${dateEs}. Tu código: **${i.code}**.`,
        `Después del primer mes, Pro cuesta ${i.fullPrice} al mes. Cancela cuando quieras.`,
      ],
      button: { label: `Get my ${i.price} month`, url: i.redeemUrl },
      esLink: { label: `Obtener mi mes por ${i.price}`, url: i.redeemUrl },
      buttonAfter: 1,
    },
    footer,
  );
}

// ─── Day-15 push (E-09) ─────────────────────────────────────────────────────

export function day15Push(price: string, useBy: Date, timeZone: string) {
  return {
    title: `Your first month for ${price} ⚡`,
    body: `Your code is waiting in the app until ${formatDate(useBy, timeZone, "en")}. · Tu código te espera en la app.`,
  };
}
