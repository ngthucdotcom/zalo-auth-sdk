# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Standalone, framework-free JavaScript SDK that implements "Sign in with Zalo" via a popup OAuth flow (PKCE). No bundler, no transpiler, no test runner — the SDK is a single global `ZaloAuth` IIFE loaded directly via `<script>` tag.

## Commands

- `npm run start` — serves the project root with browser-sync (gulp `serve` task) at the repo root, live-reloading on `*.html`/`*.js` changes. Open `index.html` to exercise the real login flow against `https://oauth.zaloapp.com`.
- `npm run storybook` — runs Storybook (`@storybook/html-vite`) on port 6006 for isolated UI/flow demos without hitting the real Zalo OAuth endpoint.
- `npm run build-storybook` — static Storybook build into `storybook-static/`.
- There is no test suite (`npm test` is a stub) and no lint/build step for the SDK itself — it ships as plain ES2017+ JS.

## Architecture

### Runtime flow (see README.md for the full step-by-step)

`index.html` loads two scripts in order: `src/zalo-auth-sdk.js` (the SDK, exposes `window.ZaloAuth`) then `main.js` (a demo client app wiring up buttons and `sessionStorage`).

1. `main.js` calls `ZaloAuth.login({clientId, redirectUri})`.
2. `src/zalo-auth-sdk.js` builds the Zalo `/permission` authorize URL and opens it in a sized popup (`openSizedPopup`).
3. It polls the popup every 50ms (`setInterval`) to detect the redirect back to `redirectUri`, reading `windowPopup.location.href` (wrapped in try/catch for cross-origin `about:blank` access before the redirect lands).
4. Once the popup's URL matches `redirectUri`, it extracts `code` from the query string, exchanges it for tokens via `getZaloToken` (`POST /v4/access_token`), then fetches the profile via `getZaloProfile` (`GET graph.zalo.me/v2.0/me`), and resolves with a `ZaloProfile` object (`{accessToken, refreshToken, userId, displayName, photoUrl}`).
5. A `setTimeout` (`popupTimeOut`, default 60s) guards against a popup that never redirects.
6. `ZaloAuth.refreshSession({clientId, refreshToken})` re-runs the token exchange + profile fetch using a `refresh_token` grant, skipping the popup entirely.

### Key internals (`src/zalo-auth-sdk.js`)

- Everything is private inside the `ZaloAuth` IIFE except the two exported methods `login` and `refreshSession`. Don't add new public surface without updating this section.
- PKCE challenge/verifier generation is lazy-loaded at runtime: `pkceChallenge()` injects a third-party script (`oauth-pkce` from a CDN, via `injectScriptSheet`) rather than using the local `src/pkce.js`/`pkce-challenge` npm dependency directly. `src/pkce.js` is a vendored copy of that same `getPkce` implementation (not currently `<script>`-included in `index.html`) — if asked to remove the CDN dependency, this is the file to wire in instead.
- All failure paths funnel through `handleErrors(reject, errorCode, extrasData)`, which maps a fixed set of string error codes (`pkce_unavailable`, `popup_blocked`, `popup_closed`, `popup_timeout`, `invalid_auth_code`, `invalid_client_id`, `invalid_grant_type`, `invalid_access_token`, `invalid_refresh_token`, `invalid_scope`, `invalid_profile`, default `unknown`) to a rejected `{error, message, ...extrasData}` object. Add new failure modes here rather than throwing/rejecting ad hoc.
- Network calls hit two fixed Zalo endpoints: `https://oauth.zaloapp.com/v4/access_token` (token exchange) and `https://graph.zalo.me/v2.0/me` (profile). Both are plain `fetch` calls with manually constructed `Headers`/`URLSearchParams`.

### Demo client (`main.js` + `index.html`)

`main.js` is example integration code, not part of the SDK. It stores tokens/profile in `sessionStorage` (`zalo_access_token`, `zalo_refresh_token`, `zalo_user_profile`) and toggles the `#sign-in`/`#login-success` panels in `index.html`. The hardcoded `clientId` in `main.js` is a demo app ID tied to `redirectUri = window.location.href`.

### Storybook

`stories/*.stories.js` are HTML-renderer stories (`@storybook/html-vite`) that **simulate** the login UI/loading states with `setTimeout` fakes — they do not call into `ZaloAuth` or hit the network. Use them for UI iteration on the button/overlay/flow visuals; use `index.html` + `npm run start` to test the actual OAuth integration. `.storybook/main.js` sets `staticDirs: ['../']` so the repo root (including `src/`) is servable.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **zalo-auth-sdk** (106 symbols, 187 relationships, 10 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> Index stale? Run `node .gitnexus/run.cjs analyze` from the project root — it auto-selects an available runner. No `.gitnexus/run.cjs` yet? `npx gitnexus analyze` (npm 11 crash → `npm i -g gitnexus`; #1939).

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows. For regression review, compare against the default branch: `detect_changes({scope: "compare", base_ref: "master"})`.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `query({search_query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `context({name: "symbolName"})`.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method without first running `impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit changes without running `detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/zalo-auth-sdk/context` | Codebase overview, check index freshness |
| `gitnexus://repo/zalo-auth-sdk/clusters` | All functional areas |
| `gitnexus://repo/zalo-auth-sdk/processes` | All execution flows |
| `gitnexus://repo/zalo-auth-sdk/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
