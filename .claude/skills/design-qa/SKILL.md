---
name: design-qa
description: >
  Runs an implementation-versus-design QA pass intended to eliminate as much
  design feedback as possible before the first human review. Collects a complete
  review packet up front, validates exact Figma frames and variables, exercises
  breakpoint boundaries and interaction states in real browsers, separates code
  defects from authoring/content defects, checks affected pages for regressions,
  fixes findings when authorized, and produces a designer-ready handoff. Use when
  asked for design QA, design review, first-pass visual QA, Figma fidelity review,
  or to prepare an implementation for designer sign-off.
---

# Design QA

The goal is not merely to prove that a branch differs safely from its baseline.
The goal is to make the implementation match the intended design as completely
as possible **before the first human design review**.

A baseline comparison answers “what changed?” Figma validation answers “is the
change correct?” This skill requires both when both references exist. Never
substitute branch-versus-stage equality for design fidelity.

## Non-negotiable rules

1. **Prompt before testing.** Start every invocation with the grouped intake
   questionnaire below. Infer repository facts first, but ask the user to confirm
   every design-critical value. Do not scatter questions across multiple rounds
   when one structured prompt can collect them together.
2. **Pin the source of truth.** Every claimed viewport must have an exact Figma
   node, explicit written acceptance criteria, or be reported as unverified.
3. **Human design approval is always required.** Automated evidence can make the
   first human pass fast; it cannot grant design sign-off.
4. **Inspect, do not threshold-pass.** Pixel percentages prioritize evidence.
   They do not excuse a local font, focus-ring, word-wrap, alignment, or 16px
   spacing defect.
5. **Test boundaries, not labels.** “Mobile/tablet/desktop” is insufficient.
   Exercise the exact design and CSS transition widths on both sides.
6. **Test states, not screenshots.** Default, hover, focus, active, open, copied,
   loading, error, empty, overflow, sticky, scroll, keyboard, and touch states are
   in scope whenever the component supports them.
7. **Use production-shaped content.** A handcrafted page that cannot reproduce
   production authoring or dynamic data is not adequate evidence.
8. **Separate ownership.** Classify every finding as implementation,
   authoring/content, design ambiguity, localization/domain review, environment,
   or accepted intentional deviation.
9. **Do not silently invent missing design behavior.** Ask the user/designer,
   mark the item blocked, and continue all independently verifiable work.
10. **Respect content safety.** Never modify or publish a non-`/drafts/*` DA/AEM
    path without explicit approval for that exact org/repo/path and operation.

---

## Phase 0 — Mandatory invocation intake

Before asking, inspect the current repository, branch, diff, Jira reference in
conversation, and any supplied URLs so the questionnaire is pre-filled wherever
possible. Do not ask the user for facts tools can establish. Then ask for all
missing or uncertain information in **one grouped message**.

Use this exact structure. Preserve the numbering so the response can be parsed
without another clarification round.

### Design QA intake

**A. Review target**

1. Candidate URL(s), including required query parameters or feature flags.
2. Candidate branch or commit.
3. Baseline URL/ref, if regression comparison is required; default to `stage`
   only after telling the user.
4. Jira ticket or written acceptance criteria.
5. Block/component name and selector, if known.
6. Review mode:
   - **Fix loop** — find, fix, and re-check issues before handoff (recommended).
   - **Review only** — collect and report findings without changing code.

**B. Design source of truth**

7. Exact Figma frame URL for every designed viewport. Label each URL with its
   intended width or range.
8. Exact Figma nodes for non-default states: hover, focus, active, open/closed,
   selected, copied/success, loading, error, empty, disabled, sticky/scrolled,
   drawers/modals, and motion.
9. Whether the supplied Figma is final and which file/page/version is canonical.
10. Known intentional deviations from Figma, including who approved each one.
11. Relevant design-system source: Express SoT, S2A component, token library,
    Bluelines, or another specification.

**C. Responsive contract**

12. Required viewport widths and heights, including short mobile heights.
13. Known breakpoint thresholds or content-driven layout transitions.
14. Expected behavior at each transition: stacking, wrapping, column count,
    card min/max width, carousel activation, terminal padding, max-width,
    sticky behavior, and element visibility/order.
15. Whether page surroundings matter, requiring full-page evidence in addition
    to element evidence.

**D. Behavior and accessibility**

16. Required interactions and state transitions.
17. Keyboard behavior, focus order, focus styling, announcements, and dismissal
    behavior.
18. Pointer/touch behavior, including swipe/drag, hover alternatives, tooltip
    persistence, and outside-click/Escape handling.
19. Motion timing/easing and reduced-motion behavior.
20. Existing Nala/Playwright tests or tags that represent the intended contract.

**E. Browser, device, locale, and content coverage**

21. Required browsers/devices. Ask explicitly whether Safari/iOS evidence is
    needed; do not assume Chromium is sufficient.
22. Required locales, RTL coverage, long-string coverage, and the locale/domain
    approver for semantic questions the designer cannot validate.
23. Content/data variants: shortest, longest, empty, missing image, many cards,
    one card, dynamic/personalized content, authenticated state, and errors.
24. Whether the candidate page uses the intended production authoring, variants,
    metadata, placeholders, and dynamic data source.
25. Personalization, MEP, martech, experiment, authentication, consent, or cache
    conditions that can change what reviewers see.

**F. Handoff**

26. Human design approver and any additional locale/product/accessibility owner.
27. Desired deliverable: local report, Jira-ready comment, Slack-ready request,
    portable HTML, screenshots/diffs, or all of these.
28. Deadline or review sequencing constraints.

### Intake rules

- Present all applicable questions at once, grouped A–F.
- Clearly mark already inferred answers and ask the user to correct them.
- Provide “not applicable,” “unknown—please infer,” and “not yet designed” as
  valid answers where appropriate.
- Recommend **Fix loop**, exact Figma nodes, boundary-width testing, all
  implemented states, production-shaped content, and Safari/iOS whenever the
  feature is touch- or WebKit-sensitive.
- Do not begin visual capture until the following minimum packet exists:
  candidate URL, candidate ref, exact scope, at least one source-of-truth Figma
  frame or explicit written design specification, and review mode.
- Missing optional coverage does not stop independent work. Record it as an
  explicit coverage gap in the final report.

---

## Phase 1 — Resolve and validate the review packet

1. Normalize every supplied URL and preserve required query parameters.
2. Confirm that the candidate URL actually serves the candidate branch/commit.
3. Record the baseline ref and URL separately from the design reference.
4. Extract and pin each Figma file key and node ID. Do not rely on the current
   Figma selection when a stable node URL is available.
5. Before `get_design_context`, invoke the `figma-design-to-code` skill. For
   every relevant node, collect:
   - screenshot;
   - design context and exact computed values;
   - variable definitions and token names;
   - annotations and component/state properties;
   - motion context when animation exists.
6. If a node is stale, moved, inaccessible, or ambiguous, locate the correct
   node through metadata when possible. Otherwise ask for a fresh selection
   link. Never guess a replacement node.
7. Record the Figma retrieval time and node IDs in the report. If the Figma
   changes during QA, invalidate prior design comparisons and repeat them.
8. Resolve ticket acceptance criteria and identify contradictions between Jira,
   Figma, historical behavior, and current product. Surface contradictions
   before fixes; do not choose a source silently.

### Reference hierarchy

Unless the user states otherwise, use:

1. Explicit approved ticket acceptance criteria.
2. Exact final Figma nodes and bound design variables.
3. Current design-system component/SoT specification.
4. Approved intentional deviations.
5. Existing production behavior only as regression context, never as proof of
   design correctness.

---

## Phase 2 — Build the first-pass coverage matrix

Create a matrix before opening the browser. Include one row per combination that
can expose a distinct contract. Show it to the user only when material coverage
choices remain unresolved; otherwise proceed and include it in the final report.

### Viewports

Include:

- every exact Figma frame width;
- every CSS/design breakpoint at `b - 1`, `b`, and `b + 1`;
- widths called out by the design or ticket;
- a representative width inside every range;
- minimum and maximum card/container widths;
- short, standard, and tall mobile heights when viewport height affects content;
- widescreen/max-container behavior.

Read the changed CSS and shared layout styles to discover implementation
breakpoints. Compare them with Figma annotations. A mismatch between CSS and
Figma breakpoint values is itself a finding.

### States

Inventory every supported state from Figma, code, annotations, and acceptance
criteria:

- default, hover, active/pressed, focus-visible, disabled;
- selected/unselected, expanded/collapsed, open/closed;
- copied/success, loading, error, empty, unavailable;
- sticky before/after threshold, scrolled, first/last carousel position;
- tooltip shown/dismissed and timing;
- drawer/modal open, outside click, Escape, swipe/drag dismissal;
- long/short text, wrapping, truncation, resize, overflow;
- reduced motion.

If code implements a state absent from Figma, ask whether the state is
intentional and how it should look. Do not omit it from the matrix.

### Browsers and devices

- Chromium desktop is the minimum smoke target.
- Include WebKit/Safari when fonts, sticky positioning, viewport units, touch,
  tooltips, drawers, media, or mobile behavior are involved.
- Use the exact user-reported browser/device for reproduced bugs.
- Never claim iOS/Safari coverage from a Chromium mobile emulation.

### Locales and content

- Include required locales and at least one RTL locale for direction-sensitive
  changes.
- Include long localized strings for wrapping/truncation.
- Identify semantic checks that require a locale or product specialist.
- Exercise production-shaped data and authoring variants, not only a fixed demo.

---

## Phase 3 — Environment and authoring preflight

Before judging pixels:

1. If rendering draft AEM/DA content locally or through authenticated previews,
   invoke `aem-login` first.
2. Verify the candidate and baseline load without console errors, failed assets,
   404s, stale CSS/module caches, or unexpected redirects.
3. Confirm feature flags, experiments, personalization, martech, MEP, consent,
   and authentication produce the intended experience.
4. Inspect the DOM and authored structure:
   - correct block and variants;
   - required rows/columns/content;
   - correct metadata and placeholders;
   - dynamic data really enabled;
   - expected card/item count;
   - images complete with non-zero natural dimensions;
   - expected fonts loaded;
   - no fallback content masking a failure.
5. Compare the candidate test page with the intended production authoring
   pattern. If it is not representative, stop design judgment for affected
   cases and classify the issue as an authoring/evidence blocker.
6. Record ownership separately:
   - **Implementation** — JS/CSS/DOM/component behavior.
   - **Authoring/content** — page structure, variant, metadata, copy, asset, data.
   - **Environment** — auth, experiment, cache, service, browser setup.

Do not “fix” authoring by hard-coding code to match an unrepresentative test
page.

---

## Phase 4 — Design fidelity pass

Use a real browser. At each matrix row:

1. Set the exact viewport dimensions.
2. Navigate with the required flags and wait for fonts, images, dynamic data,
   and animations to settle deterministically.
3. Put the component into the target state using real user interaction.
4. Capture both:
   - the component/element for detailed comparison;
   - full-page or surrounding-section context when spacing, backgrounds,
     floating UI, sticky behavior, or composition can be affected.
5. Run `screenshot-diff` against the exact Figma frame where available.
6. Inspect the diff image regardless of percentage when the changed region is
   small or semantically important.
7. Measure computed styles and geometry for critical properties:
   - position, size, min/max width, aspect ratio;
   - padding, margin, gap, alignment, grid/flex direction;
   - font family, size, weight, line height, letter spacing, wrap/truncation;
   - color, background, border, radius, shadow, opacity;
   - visibility, clipping, overflow, z-index and sticky offsets;
   - focus ring and state styling;
   - transition duration/easing and reduced-motion result.
8. Resolve design variables and repository/S2A CSS variables to their exact
   computed values before comparing them. Variable names, semantic tiers and
   apparent token equivalence are not evidence that the values match. Compare
   the rendered pixel/color values: for example, a Figma spacing variable that
   resolves to `80px` does not match an S2A variable that resolves to `64px`.
   Prefer an existing repository token only when its resolved value matches the
   design. If no correct token exists, use the exact design value (including a
   literal pixel value) rather than preserving a visually incorrect variable
   substitution. Record the mismatch and chosen value in the handoff.
9. Check element presence and ordering. Missing or extra UI is a finding even if
   the remaining pixels match.
10. Check copy exactly, including placeholder text, capitalization, punctuation,
    result summaries and accessible names.

### Visual verdicts

For each matrix row use:

- **Pass** — inspected against its source of truth with no unresolved mismatch.
- **Fail** — confirmed mismatch with clear ownership.
- **Blocked** — reference, environment, content, or specialist evidence missing.
- **Accepted deviation** — explicit approver and rationale recorded.
- **Unverified** — no source of truth exists; never relabel as pass.

---

## Phase 5 — Behavior and accessibility pass

Exercise rather than infer:

- keyboard order, arrow-key contracts, focus visibility and focus restoration;
- hover/pressed/selected/disabled state parity;
- tooltip readability, persistence and dismissal;
- drawer/modal open, close, Escape, outside click, touch and swipe behavior;
- carousel first/last positions, controls, terminal padding and clipping;
- sticky transitions and overlap with global navigation;
- loading, error, empty and retry behavior;
- copied/success transitions and timing;
- motion easing, duration and `prefers-reduced-motion`;
- text zoom and long-content overflow when relevant.

Run existing targeted Nala/Playwright tests when they defend the changed
contract. Tests supplement browser observation; they do not replace Figma/state
comparison. If the intended behavior lacks durable coverage and represents a new
observable contract, add a focused test during Fix loop mode.

---

## Phase 6 — Regression pass

Design correctness and regression safety are separate gates.

1. For a shared block, invoke `affected-pages` before judging blast radius.
2. Invoke `comparison` for branch versus baseline across affected pages.
3. Use `mode=both` when global spacing, page composition, sticky/floating UI,
   backgrounds, or surrounding content can change; element mode alone is not
   sufficient for those cases.
4. Include required locales.
5. When changes touch shared scripts, widgets, typography, tokens, or global
   styles, do not rely on direct changed-block detection. Manually map affected
   blocks/pages and test them.
6. Inspect every minor diff involving text, spacing, focus, icons or small
   controls. Do not dismiss it because it occupies a small percentage.

A branch can pass regression comparison and fail design fidelity, or the reverse.
Report both verdicts.

---

## Phase 7 — Fix loop

Skip edits in Review-only mode.

In Fix loop mode:

1. Group findings by root cause rather than patching screenshots individually.
2. Fix in this order:
   - source-of-truth or authoring blockers;
   - structure and responsive contract;
   - interaction/accessibility behavior;
   - typography and spacing tokens;
   - visual treatment and assets;
   - residual polish.
3. Prefer shared contracts when the design rule is shared. Do not introduce a
   page-specific exception for a system-wide grid or spacing rule.
4. Re-run every matrix row affected by the root-cause change, not only the row
   where the defect was noticed.
5. Re-run affected-page regression checks after the Figma fidelity pass is clean.
6. Continue until every row is Pass, Accepted deviation, Blocked with a named
   dependency, or Unverified with an explicit missing reference.
7. Never hide unresolved findings to produce a clean summary.

If the Figma or acceptance criteria changes during the loop, record the change,
invalidate affected evidence, and rebuild those matrix rows.

---

## Phase 8 — Designer-ready first-pass handoff

Produce one self-contained review packet containing:

1. Ticket, branch, commit and candidate URL with exact query parameters.
2. Baseline URL/ref.
3. Exact Figma file/node links, viewport labels and retrieval time.
4. Intentional deviations and approvers.
5. Coverage matrix with viewport, height, browser/device, locale, content case,
   state, source of truth and verdict.
6. Before/candidate/Figma screenshots and highlighted diffs.
7. Critical computed-value checks for layout, typography and states.
8. Separate verdicts for:
   - Figma/design fidelity;
   - behavior/accessibility;
   - authoring/content validity;
   - baseline regression safety;
   - browser/device coverage;
   - localization/domain review.
9. Findings fixed during QA, grouped by root cause.
10. Remaining blockers, unverified cases and accepted deviations.
11. Exact human approvals still required and who owns them.
12. Reproduction steps for every unresolved issue.

Generate the user-requested formats: local Markdown, portable HTML, Jira-ready
comment, and/or Slack-ready design-review request. Do not post to Jira, Slack, or
another shared system without explicit user approval.

### Handoff status

Use one overall status:

- **READY FOR FIRST DESIGN REVIEW** — all available design, behavior, authoring,
  browser and regression evidence passes; only human sign-off remains.
- **READY WITH DECLARED GAPS** — all executable work passes, but named references
  or specialist approvals are unavailable.
- **NOT READY** — unresolved implementation, authoring, environment or design
  ambiguity would waste the designer’s first pass.

Never use “approved” or “design passed” before the named human designer signs off.

---

## First-pass completeness checklist

Before declaring the packet ready, confirm:

- [ ] Candidate URL serves the intended branch/commit and flags.
- [ ] Exact Figma node/version recorded for every claimed viewport/state.
- [ ] CSS and design breakpoint boundaries tested at `b-1`, `b`, `b+1`.
- [ ] Short mobile height and widescreen/max-container behavior checked.
- [ ] Element and surrounding-page composition checked where applicable.
- [ ] Typography, wrapping, truncation and exact copy checked.
- [ ] Grid margins, gaps, card min/max widths and terminal padding checked.
- [ ] Design and repository variables compared by resolved value, not token name;
      mismatched substitutions replaced with the exact design value.
- [ ] Images, fonts, icons and dynamic data verified as loaded.
- [ ] Hover, focus, active, selected, copied, open/closed and error states checked.
- [ ] Keyboard, touch, tooltip and dismissal behavior exercised.
- [ ] Safari/iOS checked when relevant or explicitly listed as a gap.
- [ ] Required locales and RTL checked; semantic approver named.
- [ ] Production authoring/variants/metadata confirmed.
- [ ] Shared/global change blast radius mapped manually when necessary.
- [ ] Branch-versus-baseline regressions inspected separately from Figma fidelity.
- [ ] Small localized diffs inspected rather than threshold-dismissed.
- [ ] Every finding has ownership and evidence.
- [ ] All accepted deviations name an approver.
- [ ] Human review request contains one stable, complete review packet.
