---
name: performance-testing
description: >
  Compares Largest Contentful Paint (LCP) between a test URL and a control URL
  under standardized mobile throttling, then reports whether the test improved
  or regressed LCP. Use this whenever the user wants to check LCP, compare page
  speed or load performance between two URLs, verify a preview/branch deploy
  against prod/main, confirm whether a change made a page faster or slower, or
  reproduce PageSpeed Insights (PSI) mobile testing locally — even if they don't
  say "LCP" explicitly (e.g. "did my change slow the page down?", "compare the
  performance of these two links", "is the branch faster than prod?"). Drives a
  real headless Chromium via Playwright, so it needs an environment with npm and
  network access (Claude Code locally or CI) — it will not work in a sandboxed
  chat with no network.
---

# Performance Testing

This skill covers performance testing for Express pages. Today it has one
mode — **LCP comparison** — with room to grow into others (a single-page
report, other Core Web Vitals like CLS, network-waterfall analysis with
improvement suggestions) without becoming a different skill: they'd all share
the same device/throttling setup and the same kind of trigger phrasing
("check performance," "is this page fast"), so they belong together rather
than splintered across skills that duplicate the underlying plumbing.

**LCP comparison** automates a manual Chrome DevTools workflow: measure
**Largest Contentful Paint** for a *test* URL and a *control* URL under
identical mobile throttling, repeat several times each, average the results,
and report the difference with a plain verdict (improved / regressed / no
meaningful change).

It replaces this hand workflow: undock DevTools → emulate Moto G Power → set CPU
4× + network throttling in the Performance panel → record a reload 5× per URL →
average the LCPs → compare. The bundled Playwright script reproduces those
conditions and does the runs and math for you.

The `scripts/` directory is split so future modes don't duplicate this: `lib/
measure.mjs` loads one URL under given conditions and returns metrics (this is
where a future CLS/network capture would extend, not fork), `lib/stats.mjs` is
the metric-agnostic confidence-interval math, and `compare.mjs` is the thin CLI
that wires them together for the two-URL comparison. A future `report.mjs`
(single-page mode) would reuse both lib files rather than duplicate them.

## When to use it

Trigger on any request to compare load performance / LCP between two pages —
branch vs prod, preview vs published, before vs after a change, or two local
branches that haven't been deployed anywhere yet — or to reproduce PSI mobile
numbers locally.

## Interactive workflow — run this yourself, don't just hand back commands

When a user invokes this skill, drive the whole thing conversationally. Don't
dump shell commands and leave the user to run them — ask what you need, then
execute every step (including standing up local dev servers, if needed) and
report the result.

**Step 1 — figure out the mode.** If the user's request doesn't already make it
obvious, ask (e.g. with a two-option question):

- **Compare two URLs** — the test and control are already reachable somewhere
  (a deployed branch, prod, a running local dev server the user already has up).
- **Compare two local branches** — neither branch is deployed; you'll check
  each one out and serve it locally yourself.

**Step 2a — URL mode.** Ask for the test URL and the control URL (plain
conversational questions — these are free-text values, not a short list of
choices). Confirm run count / throttle profile only if the user wants to
override the defaults (10 runs, Slow 4G — see below); otherwise just use them.
Then run the script as described in "How to run."

**Step 2b — local branch mode.** Ask for three things: the **test branch**, the
**control branch**, and the **page path** to load on each (e.g.
`/express/create/story/instagram` — same path on both, since the comparison
should isolate code differences, not content differences). Then:

1. `git branch --show-current` and `git worktree list` to see what's already
   checked out. If a requested branch matches the *current* worktree (or any
   other existing worktree), reuse that directory for it — don't create a
   redundant checkout. For any other requested branch, **use `git clone`, not
   `git worktree add`**:
   `git clone <this-repo-root> ../perf-test-<branch-safe-name> --branch <branch> --single-branch`
   (replace `/` in the branch name with `-` for the directory name).

   **Why a real clone, not a worktree:** `aem up` fails on a worktree — a
   worktree's `.git` is a plain pointer file (`gitdir: ...`), which `aem up`'s
   project detection misreads as "this is a git submodule" and refuses to run
   (`git submodules are not supported`). A real clone has a genuine `.git`
   directory and doesn't hit this.

2. **Two follow-up fixes a fresh clone needs before `aem up` will work:**
   - `git -C <clone-dir> remote set-url origin <the real GitHub remote URL>`
     — cloning from a local path leaves `origin` pointing at that filesystem
     path, and `aem up` needs a real GitHub URL to identify the project
     (otherwise it fails with `Invalid URL`).
   - If the repo root has an untracked `.hlx/` directory (check
     `.gitignore` for `.hlx/*` — it holds the local AEM CLI auth session,
     e.g. `.hlx-token`), copy it into the fresh clone:
     `cp -r <repo-root>/.hlx <clone-dir>/.hlx`. Without it, any content that
     needs authentication will 401 in the clone even though it works fine in
     the checkout you copied it from. This stays entirely local — you're
     reusing the user's own already-established session for a second local
     server instance, not transmitting or re-entering a credential anywhere.
     Mention to the user that you're doing this since it involves a token
     file, but it doesn't need to block on confirmation — it's the same kind
     of thing as reusing a cached login across two local dev servers you
     already control.

3. Pick two free ports (start at `3001`/`3002`, bump on conflict). For each
   checkout, start the local dev server in the background:
   `cd <checkout-dir> && npx aem up --port <port> --stop-other=false --no-open --no-livereload`.
   - Always pass `--stop-other=false` — the default `true` would kill an
     unrelated dev server the user already has running on that port.
   - Always pass `--no-livereload` — live-reload keeps a persistent
     connection open, which defeats this skill's "no in-flight requests"
     settle detection (see "Avoiding the DevTools cutoff"): every run will
     hit `--max-wait` and print its warning, even though the LCP values
     underneath are usually still fine. Skipping live-reload avoids the
     spurious warning entirely for local runs.
4. Poll the **actual target page path** (not just `/`) on each until it
   returns `200` — a few seconds for `aem up` to boot, give it up to ~30s.
   Don't just check the root path: it can legitimately 404 while the real
   page still works, and conversely a page needing auth can 401 even once the
   server itself is up (see step 2's `.hlx` fix if that happens).
5. Run the script with
   `--test http://localhost:<portA><pagePath> --control http://localhost:<portB><pagePath>`.
6. Report the results (see "Interpreting the output").
7. Clean up: stop both background `aem up` processes. **Leave the clones on
   disk** (mention their paths) rather than removing them — that's a
   destructive, hard-to-reverse step and re-running the comparison later is
   faster with them already checked out. Only remove one if the user asks.

Both dev servers pull authored content from the same source (the project's
`fstab.yaml`, which is committed and identical across clones of the same
repo), so this isolates code differences between the two branches — content
stays constant.

**The test and control branches don't need this skill present on them.** The
checkouts you create for them only need to run `aem up` to serve their code;
the `compare.mjs` script itself runs once, from wherever you invoked this
skill, and just points a browser at the two `localhost` URLs. So a branch like
`stage` — which may not have this skill committed yet — works fine as a
comparison target. (The one real constraint: the checkout you're running the
skill *from* obviously needs it, same as any skill.)

## Requirements (must run where there's real network + a browser)

This drives a real browser and loads real pages — including `localhost` dev
servers, since Chromium runs on the same machine as the script. It works in
Claude Code on a local machine or in CI — **not** in a restricted/sandboxed
chat with no network. Install dependencies once:

```bash
cd .claude/skills/performance-testing/scripts
npm install playwright && npx playwright install chromium
```

(`npm install` in that folder also triggers `playwright install chromium` via a
postinstall hook, so the second command is usually redundant.)

## Inputs

**URL mode:**

| Input | Required | Notes |
|-------|----------|-------|
| **Test URL** | Yes | Any URL — a preview/branch deploy, a PR's EDS branch URL, `http://localhost:3000/...`, etc. No domain restriction; TLS errors on local/self-signed certs are ignored so `https://localhost` works too. |
| **Control URL** | Yes | Any URL — prod, `main`/`stage`, the page before the change, or another localhost port. Test and control don't need to be on the same host. |

**Local-branch mode:**

| Input | Required | Notes |
|-------|----------|-------|
| **Test branch** | Yes | Git branch to check out (or reuse if it's the current worktree's branch) and serve locally. |
| **Control branch** | Yes | Same, for the baseline. |
| **Page path** | Yes | Same relative path loaded on both, e.g. `/express/create/story/instagram`. |

**Both modes:**

| Input | Required | Notes |
|-------|----------|-------|
| Run count | No | Default **10** per URL (see "How many runs?" below). |
| Throttling / device | No | Defaults reproduce PSI mobile (see below). |

## How to run

From the skill's `scripts/` directory (or anywhere, using the full path):

```bash
node .claude/skills/performance-testing/scripts/compare.mjs \
  --test "https://my-branch--da-express-milo--adobecom.aem.live/express/some-page" \
  --control "https://main--da-express-milo--adobecom.aem.live/express/some-page"
```

Positional form also works: `node compare.mjs <testUrl> <controlUrl>`.

Either URL can be `localhost` — e.g. comparing a local dev server against a
published page, or two local ports against each other:

```bash
node compare.mjs --test "http://localhost:3000/express/some-page" \
  --control "https://main--da-express-milo--adobecom.aem.live/express/some-page"
```

Common overrides:

```bash
# More runs (tighter confidence interval), save a full JSON report
node compare.mjs --test <t> --control <c> --runs 20 --json report.json

# Watch it run in a visible browser window
node compare.mjs --test <t> --control <c> --headed

# Use a different network profile
node compare.mjs --test <t> --control <c> --network fast-4g
```

Run `node compare.mjs --help` for every flag.

## What conditions it reproduces (and why)

All values are taken verbatim from Chrome DevTools and Lighthouse source so they
match "pick the preset from the dropdown," not approximations.

- **Device — Moto G Power** (Lighthouse/PSI mobile emulation): viewport
  `412×823`, `deviceScaleFactor: 1.75`, mobile UA, `isMobile`/`hasTouch` on.
  (PSI emulates at DPR **1.75** — not the phone's raw hardware DPR.)
- **CPU throttling — 4×** via CDP `Emulation.setCPUThrottlingRate`.
- **Network — "Slow 4G"** by default, via CDP `Network.emulateNetworkConditions`:
  180,000 B/s down (~1.6 Mbps), 84,375 B/s up (~750 Kbps), 562.5 ms latency.
- **LCP capture** via an injected `PerformanceObserver` on
  `largest-contentful-paint` (the same signal DevTools and web-vitals use). See
  "Avoiding the DevTools cutoff" below for how it decides *when* the value is
  final. FCP and TTFB are captured too for context.
- **Cold cache each run:** every iteration uses a fresh browser context (no
  shared cache/storage/cookies), mirroring a PSI "first view" so caching between
  runs can't skew results.

### ⚠️ Why the default is `slow-4g`, not the "Fast 4G" you click by hand

This is worth spelling out clearly because it's counterintuitive: **the
default here is named differently from the DevTools menu item you're used to
picking, on purpose.**

Chrome **renamed** its throttling presets in May 2024. What today's DevTools
dropdown calls **"Fast 4G"** is a *new*, faster profile — roughly 9 Mbps down /
1.5 Mbps up / ~165 ms latency. The profile that PSI and Lighthouse actually use
for mobile scoring — 150 ms target RTT, 1.6 Mbps down, 750 Kbps up — is what the
*old* "Fast 3G" preset became; today it's relabeled **"Slow 4G."**

So if you've been clicking the item literally labeled "Fast 4G" in DevTools,
you've likely been testing under Chrome's newer, faster profile — not the one
that determines PSI/Lighthouse mobile scores. That's an easy trap: the menu
item kept a name you recognize, but the numbers behind it changed out from
under it.

This skill's default (`slow-4g`) reproduces the *actual PSI mobile scoring
profile* (150 ms / 1.6 Mbps / 750 Kbps) — the numbers, not the current label —
because that was the explicit goal when this was built: results that reflect
what PSI would report. If what you actually want is parity with your own
by-hand habit of clicking today's "Fast 4G" menu item, pass `--network
fast-4g` and you'll get that faster profile instead. Available profiles:
`slow-4g` (default, = PSI mobile), `fast-4g` (today's DevTools "Fast 4G",
faster), `slow-3g`, `none`.

## Avoiding the DevTools cutoff

If you've done this by hand, you've probably hit this: under Slow 4G, the
Performance panel's "reload and record" often stops the recording before a
slow LCP element (something 5-6s+ out) ever paints — DevTools auto-stops once
the page *looks* quiet (network + CPU idle for a bit), and if the true LCP
fires after that stop point, it's just missing from the trace.

This skill doesn't have that problem in the same way, because it isn't
recording a DevTools trace at all — it reads directly from the browser's own
`PerformanceObserver('largest-contentful-paint')` signal, which keeps updating
on its own regardless of any recording window. But it still has to decide
*when to trust the value as final*, and a naive fixed delay would reintroduce
the exact same failure: read too early and you report an earlier, smaller
candidate as if it were the real one.

So instead of a fixed wait, it tracks **actual in-flight network requests**
and only calls LCP final once there are **zero pending requests and the LCP
value hasn't changed** for `--settle` ms — gated by `--max-wait` as a safety
valve so a page that never truly goes quiet (long-polling, analytics beacons)
doesn't hang forever. If `--max-wait` is hit, the run is flagged in the output
so a truncated value is visible, not silent.

**One honest limitation:** this only helps when there's network activity to
observe. If a page's real LCP element shows up very late purely from a JS
timer — no fetch, no image request, nothing to track — there's no signal to
wait on, and it can still be missed. That's a fundamentally different failure
mode than the Slow-4G/slow-image case (which this fix directly targets) and
isn't solvable without knowledge of the page's own internals.

## Configurable options

| Flag | Default | Purpose |
|------|---------|---------|
| `--runs <n>` | 10 | Measured iterations per URL. |
| `--network <profile>` | `slow-4g` | `slow-4g` \| `fast-4g` \| `slow-3g` \| `none`. |
| `--cpu <rate>` | 4 | CPU slowdown multiplier. |
| `--settle <ms>` | 2000 | Quiet period (no in-flight requests, no LCP change) required before a value is treated as final. |
| `--max-wait <ms>` | 20000 | Safety-valve cap on total time spent waiting for that quiet period. Warns if hit. |
| `--warmup <n>` | 0 | Discarded warm-up runs per URL (not counted in the average). |
| `--confidence <p>` | 0.95 | Confidence level for the interval on the delta. |
| `--min-delta-ms <ms>` | 50 | *Practical*-significance floor, absolute (annotation only). |
| `--min-pct <pct>` | 5 | *Practical*-significance floor, percent (annotation only). |
| `--timeout <ms>` | 90000 | Per-navigation timeout. |
| `--headed` | off | Show the browser window. |
| `--json <path>` | — | Also write full per-run results (incl. CI/p-value) as JSON. |
| `--api-key <key>` | — | Sent as `authorization: token <key>` on every request. Also read from `AEM_API_KEY`. See "`.aem.page` returns 401" below — unconfirmed for page-view auth. |

## Interpreting the output

The script prints, for each URL, every run's LCP (plus FCP/TTFB and the LCP
element), then the **average**, median, min/max, and stdev. The verdict is based
on a **confidence interval for the difference of the two means** (Welch's
two-sample t-test, which tolerates the two URLs having different variance):

- **delta = test avg − control avg.** Negative → the test is *faster*
  (improvement); positive → *slower* (regression).
- The script prints the `95% CI on delta` plus the Welch `t`, `df`, and
  `p`-value. The verdict comes from **where that interval sits relative to 0**:
  - CI entirely **below 0** → **IMPROVED** (the speed-up is statistically real).
  - CI entirely **above 0** → **REGRESSED**.
  - CI **straddles 0** → **NO SIGNIFICANT DIFFERENCE** — the delta can't be told
    apart from run-to-run noise at this sample size. In that case the script
    estimates how many runs per URL you'd need to resolve a difference that size
    and suggests re-running with a larger `--runs`.
- **Statistical vs. practical significance.** A difference can be statistically
  real but tiny. When a result is significant but smaller than the
  `--min-delta-ms` / `--min-pct` floors, the script flags it as unlikely to be
  user-perceptible. These floors are *annotations now* — they no longer gate the
  verdict (the CI does).

The process **exits non-zero (code 2) on a REGRESSED verdict**, so it can gate a
CI job. When reporting back to the user, give them: both averages, the delta in
ms and %, the confidence interval, and the verdict.

## How many runs?

There's no universal right number — it's driven by (a) how noisy the page's LCP
is and (b) the smallest change you care to detect. Fewer runs → wider CI → only
big regressions are detectable; more runs → tighter CI → smaller changes become
resolvable, with diminishing returns. Rough guide for a typical Express page
(LCP variance similar to what we've measured):

| Want to reliably detect | Runs per URL (~80% power) |
|---|---|
| ≥ 5% change | ~5 |
| ≥ 4% change | ~7 |
| ≥ 3% change | ~11 |
| ≥ 2% change | ~24 |
| ≥ 1% change | ~90 |

The default of **10** resolves ~3–4% changes on most pages while still finishing
in a few minutes. If a run comes back **NO SIGNIFICANT DIFFERENCE** but the delta
looks directionally interesting, the script tells you the run count it would
take — but past ~10–15 runs you usually get more by *reducing noise* (use
`--warmup 1` to discard a cold first load, close other apps, avoid a loaded CI
box) than by piling on iterations.

## Notes & caveats

- Results are relative and machine-dependent — a busy laptop inflates LCP. What's
  meaningful is the *delta* between test and control measured back-to-back on the
  same machine, not the absolute numbers versus PSI's servers.
- Applied (packet-level) throttling is a close but not bit-identical match to
  Lighthouse's default *simulated* (Lantern) throttling. It faithfully
  reproduces the manual DevTools Performance-panel workflow, which is the point.
- Some pages fire no LCP (no large content) — those runs are reported as "no LCP
  entry" and excluded from the average.
- A non-2xx/3xx response on the main document (auth walls on `.aem.page` stage
  URLs, 404s, 500s) is reported as `FAILED server returned <status>` rather
  than silently measuring whatever error page rendered. Since an HTTP-status
  failure like this won't change on retry, the tool **stops after the first
  one for that URL** instead of burning through all the planned runs — the
  other URL keeps running its full count independently. If either URL fails
  every run, no verdict is produced.

## `.aem.page` returns 401 — this can't be logged into directly

**Don't try to authenticate a plain browser session against `.aem.page`.** It
doesn't work, and it's not a bug in this skill — `.aem.page` stage previews
have no page-level login at all. Visiting one directly (as this skill's
Playwright browser does) just returns a static `401 unauthenticated` with
nothing to click. The actual auth is handled entirely by the **AEM Sidekick
browser extension**: when it's active in your everyday Chrome, *it* injects
the "Sign in" button and manages the resulting session. A bare
`chromium.launch()` has no extensions loaded, so there's no login affordance
to find — an earlier version of this skill tried a plain interactive-login
flow here and it was a dead end for exactly this reason. Loading the actual
Sidekick extension into Playwright was considered and rejected: it isn't
vendored in this repo or any dependency (verified — nothing to load), and
fetching/maintaining a copy of a third-party browser extension just for this
would be a disproportionate amount of fragile machinery for what it buys.

Use one of these instead, matching how the rest of this repo already handles
the same problem:

- **If the content is published:** use the equivalent `.aem.live` URL. Same
  content, publicly viewable, no auth needed. This is what the other
  Figma-based skills in this repo (`build-block-from-figma` etc.) do —
  they explicitly resolve `.aem.page` → `.aem.live` before ever touching
  Playwright.
- **If it's on a branch that isn't published yet:** use this skill's
  **local-branch mode** (see the Interactive workflow above) — it clones the
  branch and serves it locally via `aem up`, authenticated through a
  completely different mechanism (the local `.hlx-token` CLI credential, not
  Sidekick) that already works today.
- **Worth trying, unconfirmed:** the [AEM Admin API accepts an `authorization:
  token $API_KEY` header](https://www.aem.live/docs/admin.html#tag/authentication)
  as an alternative to its own interactive cookie login. It's architecturally
  plausible Sidekick uses this same mechanism internally, but the docs only
  explicitly confirm it for calls to `admin.hlx.page`, not for raw page-view
  requests to `.aem.page` itself — I could not verify this either way. If you
  provision a site API key (via the Admin API's "Create Site API key"
  operation, which needs your own interactive login to set up — this skill
  can't provision one for you), pass it with `--api-key <key>` or set
  `AEM_API_KEY`, and see whether it actually gets you past the 401. If it
  works, treat that as new information worth folding back into this doc.
