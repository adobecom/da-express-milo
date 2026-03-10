# PR Checklist — detailed code review (MWPW-187642)

Review of `.github/workflows/pr-checklist-comment.yml` and related docs. Review date: 2025-02.

---

## 1. Workflow: pr-checklist-comment.yml

### 1.1 Correctness

- **Draft skip:** Both jobs check `context.payload.pull_request?.draft === true` and return early. Correct; draft PRs are not commented on and status check still runs but exits successfully (no-op). ✅
- **Target branch filter:** `baseRef !== targetBranch` with `targetBranch = (process.env.TARGET_BRANCH || 'color').trim()`. If someone sets `PR_CHECKLIST_TARGET_BRANCH` to empty string, `.trim()` yields `''` and no PR base ref will match, so both jobs skip. Safe. **Suggestion:** Normalize empty to default: `const targetBranch = (process.env.TARGET_BRANCH || 'color').trim() || 'color';` so that an accidentally empty variable still defaults to `color`. (Low priority.)
- **Boolean parsing:** `(process.env.X || 'true').toString().toLowerCase() === 'true'` — any value other than the string `'true'` (case-insensitive) is false. Correct. Empty string, `false`, `0` all yield false. ✅
- **Emergency kill switch:** `!strictEnabled` causes immediate return in both jobs; no comments, no failure. ✅

### 1.2 Checklist parsing

- **Section regex:** `/## Pre-merge checklist\s*([\s\S]*?)(?=\n## |\n--- |$)/i`  
  - Captures from the heading to the next `## ` or `--- ` or end of string.  
  - `$` matches end of string (or before final `\n`), so bodies without a trailing newline are fine. ✅  
  - If there is no "## Pre-merge checklist" in the body, `checklistMatch` is `null`, `section` is `''`, and `unchecked` is `[]`.
- **Unchecked items regex:** `/^\s*-\s+\[\s\]\s*(.+)$/gm`  
  - Matches list items with `- [ ]` (space inside brackets). Correct for GitHub-style task lists.  
  - Does not match `[x]` or `[X]` (checked). ✅
- **No checklist section:** When the PR body has no "## Pre-merge checklist" section, both jobs treat it as "no unchecked items" (comment job: may update to "All complete" if a previous bot comment exists; status job: passes). So PRs that don’t use the checklist template are not blocked. **Design choice:** Intentional to avoid blocking legacy or non-template PRs. If you ever want to require the section, that would be a separate (stricter) mode. ✅

### 1.3 Comment job (checklist-comment)

- **Bot marker:** `<!-- pr-checklist-bot -->` is unique and in the comment body; finding existing comment via `c.user.type === 'Bot' && c.body && c.body.includes(botMarker)` is correct. Only the Actions bot (or another bot with the same marker) could collide; acceptable. ✅
- **Update vs create:** If there are unchecked items and a previous bot comment exists, we update it; otherwise we create. If all items are checked and a previous bot comment exists, we update to "All complete". Correct. ✅
- **"All complete" when section missing:** When the PR has no Pre-merge checklist section (`section === ''`), we still have `unchecked.length === 0`, so we hit the `else` branch. If a previous run had left a bot comment (e.g. from an earlier version of the body that had the section), we’d update it to "All complete". Edge case and rare; acceptable. **Optional improvement:** Only update to "All complete" when `section !== ''` (i.e. we actually parsed a checklist and found zero unchecked). Not required for ship.

### 1.4 Status job (checklist-status)

- **Exit behavior:** Early returns (draft, wrong branch, strict off, all checked, comment-only with unchecked) exit the script without `process.exit`, so the job **succeeds**. Only `process.exit(1)` when unchecked and not comment-only fails the job. Correct. ✅
- **No `permissions` block:** The job does not comment or modify PR state; default permissions are enough. ✅

### 1.5 Permissions and security

- **checklist-comment** has `pull-requests: write` for creating/updating comments. Minimal and correct. ✅
- **Secrets:** No secrets used; only repo Variables. No risk of leaking secrets in logs. ✅
- **Injection:** Comment body is built from `unchecked.map(item => \`- ${item}\`)`. Checklist item text is from the PR description (author-controlled). If an author put markdown or HTML in an item, it would appear in the bot comment. GitHub comment UI typically escapes or sanitizes; no change suggested unless you need strict sanitization. ✅

### 1.6 Duplication and maintainability

- **Duplicate logic:** Draft check, base-ref check, strict check, and checklist parsing (regex + unchecked extraction) are duplicated in both jobs. Acceptable for a two-job workflow; each job stays self-contained and readable. Extracting to a shared composite action would reduce duplication but add another artifact to maintain. **Verdict:** Leave as-is unless you add more jobs that need the same logic. ✅

### 1.7 Pinning and supply chain

- **actions/github-script@v7:** Uses a major version tag. For stricter supply-chain hygiene, consider pinning to a full digest (e.g. `@v7.0.0` or the SHA). Optional; many repos use `@v7`. ✅

---

## 2. Documentation

### 2.1 PR_CHECKLIST_CONFIG.md

- Variables and defaults match the workflow. Emergency section is clear. ✅
- Link to `PR_CHECKLIST_ENFORCEMENT_OPTIONS.md` and `PR_CHECKLIST_ANALYSIS_AND_FLAGS.md` is correct. ✅

### 2.2 PR_CHECKLIST_ENFORCEMENT_OPTIONS.md

- Phases 1–3 match workflow behavior. ✅
- **Minor:** Line 30 uses a curly quote in "All complete"; rest of repo uses straight quotes. Cosmetic only. ✅

### 2.3 PR_CHECKLIST_ANALYSIS_AND_FLAGS.md

- **Phase table bug:** Row "2b – Optional check, real signal" says "comment-only = true" but describes "red when incomplete". For the check to go red when incomplete, `PR_CHECKLIST_COMMENT_ONLY` must be **false**. So Phase 2b should show `PR_CHECKLIST_COMMENT_ONLY=false` (optional red signal, check not required). Phase 2 is "comment-only, check always passes"; Phase 2b is "optional red, COMMENT_ONLY=false". **Fix:** Update the Phase 2b row so COMMENT_ONLY is `false`, or remove 2b and describe "optional red" under Phase 2 as "set COMMENT_ONLY=false, don’t require check." ✅ (fix applied below)

### 2.4 Cross-references

- Architecture links: `dev/architecture/01-engineering-dev-charter.md`, `03-contracts-as-boundaries.md`, `02-shared-blocks-principles.md`, `dev/06-guides/ASYNC_AND_REMOTE_COLLABORATION.md`. Paths are correct. ✅

---

## 3. Summary and action items

| Area | Verdict | Action |
|------|--------|--------|
| Workflow logic | Correct | None required |
| Draft / target / strict | Correct | Optional: normalize empty `TARGET_BRANCH` to `'color'` |
| Checklist parsing | Correct | Optional: only update "All complete" when `section !== ''` |
| Permissions / security | Good | None required |
| Docs vs implementation | Aligned | Fix Phase 2b row in ANALYSIS doc (see below) |
| Config and emergency | Clear | None required |

**Recommended fix:** In `PR_CHECKLIST_ANALYSIS_AND_FLAGS.md`, correct the Phase 2b row so that "optional check, real signal" (red when incomplete) corresponds to `PR_CHECKLIST_COMMENT_ONLY=false`. Optional: add `|| 'color'` after `.trim()` for `targetBranch` in both jobs for robustness.

---

## 4. Applied fixes (from this review)

- **Phase table:** Merged Phase 2 and 2b into two rows: Phase 1 (comment-only, check passes), Phase 2 (optional red signal: `COMMENT_ONLY=false`, check fails when incomplete, not required), Phase 3 (blocking: same + required). Removed the inconsistent "2b" row.
- **Workflow:** `targetBranch` now normalizes empty string to `'color'`: `(process.env.TARGET_BRANCH || 'color').trim() || 'color'` in both jobs.
