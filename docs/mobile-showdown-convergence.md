# SparkyPass Mobile ↔ Showdown — Convergence Sub-Plan

**Status:** **Accepted 2026-06-02 — Option β.** Execution in progress: `sparkypass-ui` package being stood up; Showdown migration follows.
**Last updated:** 2026-06-02
**Pairs with:** [mobile-conversion-plan.md](./mobile-conversion-plan.md) §3 (stack convergence locked 2026-05-13), [mobile-build-todo.md](./mobile-build-todo.md) Phase 2

---

## 1. Why this doc exists

The mobile conversion plan locked stack convergence with Showdown (both on React Native + Expo + TypeScript), then deferred a sub-plan covering: repo structure, shared component library, shared primitives (Sparky / audio / Watts UI). Phase 2 bootstrap can't safely start without the repo decision because it's expensive to reverse.

Showdown isn't a planning artifact anymore — it's working code at `/Users/luisvelazquez/Projects/sparkypass-showdown` with its own git history, iOS native folder, and EAS config. That changes the cost shape of every "merge them" option.

---

## 2. Current reality

| | SparkyPass mobile | Showdown |
|---|---|---|
| **Code state** | Doesn't exist yet (Phase 2 not started) | Working Expo app, last commit 2026-04-29 |
| **Stack** | Planned: Expo + expo-router + NativeWind + zustand + react-query | Same — Expo 54 + expo-router + NativeWind 4 + zustand + react-query |
| **Backend** | Vercel + Turso + Drizzle, custom JWT mobile shim (Phase 1 complete) | Supabase (auth + realtime channels + Postgres) |
| **Auth** | SiwA + Google + Email → own backend, RevenueCat for IAP | SiwA + Google + Email → Supabase Auth, free product |
| **Sparky SVGs** | 17 in web's `public/` (canonical) | 18 in `assets/sparky/` (independent copy, +`lightning-bolt.svg`) |
| **Brand tokens** | Defined in web's `app/globals.css` — amber/purple/emerald/sparky-green/cream | `constants/theme.ts` is **still the unmodified Expo template** (teal `#0a7ea4`) — brand alignment is overdue |
| **Question bank** | SparkyPass DB is canonical source | `scripts/seed-questions.ts` — independent copy |
| **Audio pipeline** | ElevenLabs scripts in web repo | `scripts/generate-clue-audio.ts` — independent ElevenLabs setup |

---

## 3. The four decisions

### 3.1 Backend convergence?

**Decision: No. Keep split.**

Showdown needs Supabase realtime channels for live buzz-in multiplayer. SparkyPass core has no realtime requirement and a fully-built REST + JWT backend (Phase 1 of build). Forcing either side onto the other's backend is a rewrite for no functional gain.

Accounts remain independent. A future "Connect your SparkyPass account to Showdown" feature can be added if it ever earns its keep — not v1 for either product.

### 3.2 Repo structure?

Three live options:

**α. Full monorepo** (`/apps/web`, `/apps/mobile`, `/apps/showdown`, `/packages/sparky-ui`)
- Pros: Single source of truth, atomic cross-app refactors, one CI pipeline long-term.
- Cons: Migrates Showdown's git history + iOS native folder + EAS config. Pulls the Next.js web app into a layout it wasn't designed for. ~1–2 days of churn for benefits that mostly materialize when there's a 3rd+ product.

**β. Two repos + shared library package**
- Showdown stays in `sparkypass-showdown`.
- New repo `sparkypass-mobile` for the conversion.
- New repo `sparkypass-ui` published as a private dependency (GitHub Packages, or git URL — registry not required for solo).
- Pros: Zero migration on Showdown. Shared code is explicit. Low risk.
- Cons: Versioning overhead (small at solo scale). Three repos to remember.

**γ. Two repos + copy/sync script**
- No shared package. A `sync-sparky.sh` script copies SVGs + a generated `tokens.ts` from web → each mobile repo on demand.
- Pros: Zero infra.
- Cons: Drifts the moment nobody runs the script. Brand-drift bugs don't get filed; they get shipped.

**Accepted: β (2026-06-02).**

α is the textbook answer but the timing is wrong — Showdown has six weeks of code we'd disrupt for a payoff that's mostly "the same SVG file." γ is too lossy. β buys the dedupe with proportional infra cost and lets us revisit monorepo if/when product #3 appears.

**Defaults picked at acceptance:**
- Package name: `sparkypass-ui` (unscoped)
- Distribution: git URL with version tags, no registry (`"sparkypass-ui": "github:luisvelazquez/sparkypass-ui#v0.1.0"`)
- Local dev: `file:../sparkypass-ui` in consumer `package.json`

### 3.3 What actually gets shared (v1)?

Limit shared surface to things that genuinely benefit from a single source. Everything else duplicates cheaply and diverges intentionally.

**In `sparkypass-ui`:**
- 17 Sparky mascot SVGs (canonical from web `public/`) + the +1 `lightning-bolt.svg` from Showdown
- Generated `tokens.ts` — colors + font names + spacing scale, generated from web's `globals.css` `@theme` block
- `<Sparky name="thinking" size={120} />` — one wrapper component, react-native-svg under the hood
- `<WattsBadge value={1234} />` and `<WattsCounter />` primitives
- NEC category enum + question-shape TypeScript types
- A NativeWind preset that wires the tokens into Tailwind config

**Explicitly NOT shared:**
- Auth flows (different backends)
- Networking layer (different APIs, different auth headers)
- IAP / RevenueCat (Showdown is free)
- Realtime / Supabase channels (Showdown only)
- Screens, navigation, game logic
- Audio playback layer (different content, similar libs)

### 3.4 When does this happen?

**Before Phase 2 bootstrap.** Doing the shared package after SparkyPass mobile is scaffolded means migrating it twice. ~½ day of work to set up `sparkypass-ui` and refactor Showdown to consume it gates Phase 2.

---

## 4. Concrete first moves (~½ day)

1. **Create `sparkypass-ui` repo.** Minimal structure:
   ```
   sparkypass-ui/
     package.json          # name: @sparkypass/ui (or unscoped if no GH org)
     tsconfig.json
     src/
       index.ts            # barrel
       tokens.ts           # generated from web's globals.css @theme block
       sparky/
         Sparky.tsx        # <Sparky name="..." />
         svgs/             # 18 SVG files, one per expression
         index.ts          # name → SVG map (typed)
       watts/
         WattsBadge.tsx
         WattsCounter.tsx
       types/
         nec.ts            # category enum, question shape
       tailwind/
         preset.js         # NativeWind preset exposing tokens
   ```
2. **Token-generation script in web repo.** `scripts/export-design-tokens.ts` — reads `app/globals.css`, emits `tokens.ts` to `sparkypass-ui/src/tokens.ts`. Run manually for now; later wire into CI.
3. **Publish.** Either:
   - GitHub Packages (`@your-org/sparkypass-ui`) — needs a GitHub org, free for private packages on personal account up to a quota.
   - Or git URL dependency: `"sparkypass-ui": "github:luisvelazquez/sparkypass-ui#v0.1.0"` — zero infra, requires tagging.
4. **Migrate Showdown.** Replace `assets/sparky/*.svg` with `<Sparky name="..." />`. Replace `constants/theme.ts` with the NativeWind preset + token imports. **This is also when Showdown gets brand-aligned colors for the first time** (today it's still the Expo template teal).
5. **Phase 2 bootstrap consumes `sparkypass-ui` from day one.**

---

## 5. What this means for Phase 2

Updates to [mobile-build-todo.md](./mobile-build-todo.md) Phase 2:

- Repo structure decision: **β (two repos + `sparkypass-ui` shared package)** — pending user sign-off on this doc.
- Add new Phase 2 prerequisite: "Stand up `sparkypass-ui` repo + migrate Showdown to consume it" (~½ day). Blocks `create-expo-app sparkypass-mobile` only in the sense that we want the new mobile repo to consume the shared package from its first commit; the bootstrap itself can happen in parallel if the package's API is locked first.

---

## 6. Open follow-ups (post-decision)

- [ ] Pick package distribution mechanism (GitHub Packages vs git URL tag) — decide when creating the repo
- [ ] Decide on Sparky SVG naming reconciliation — Showdown has `lightning-bolt.svg`, web doesn't; both should be in the shared set
- [ ] Question bank sharing — out of scope for v1 convergence, but worth a follow-up doc. Showdown currently has its own seed script; long-term Showdown should pull from SparkyPass DB or a shared content CDN.
- [ ] Audio pipeline sharing — same story. ElevenLabs scripts duplicated; could be a shared `scripts/` package later.
- [ ] Revisit monorepo (option α) when/if a third mobile product appears, or when shared surface area exceeds ~30% of either mobile codebase.
