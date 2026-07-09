#!/usr/bin/env bash
#
# Auto-QA Screen-Diff — one-shot runner.
# Chains: resolve changed blocks → fetch+select critical pages →
#         (optional) DA-wide discovery → worklist → capture+diff+probe → report.
#
# Usage (from repo root, or anywhere — paths resolve relative to this script):
#   .claude/skills/auto-qa-screendiff/run.sh [options]
#
# Options:
#   --base <branch>       diff base (default: stage)
#   --head <ref>          diff/preview target (default: current checked-out
#                         branch). Use to compare two refs without switching
#                         branches, e.g. --base stage --head main.
#   --discover [repos]    run DA-wide crawl; comma-separated repos
#                         (default when flag present: express-color,da-express-milo;
#                         da-express-milo is crawled English-only via --skip-locales
#                         since it's a much larger repo)
#   --no-capture          stop after the worklist (discovery only, no browser)
#   --self                capture B from A's URL (smoke test / no branch preview)
#   --limit <N>           cap number of pages captured
#   --viewports <list>    e.g. chrome,ipad  (default: all in manifest)
#   --concurrency <N>     capture concurrency (default: 3)
#   --open                open the report when done
#   -h|--help             show this help
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
MANIFEST="$SCRIPT_DIR/config/critical-pages.json"
WORK="$REPO_ROOT/.qa-screendiff"

BASE="stage"
HEAD_REF="HEAD"
DO_DISCOVER=0
DISCOVER_REPOS="express-color,da-express-milo"
DO_CAPTURE=1
SELF=""
LIMIT=""
VIEWPORTS=""
CONCURRENCY="3"
OPEN=0

while [ $# -gt 0 ]; do
  case "$1" in
    --base) BASE="$2"; shift 2;;
    --head) HEAD_REF="$2"; shift 2;;
    --discover)
      DO_DISCOVER=1
      if [ $# -ge 2 ] && [ "${2#--}" = "$2" ]; then DISCOVER_REPOS="$2"; shift 2; else shift 1; fi;;
    --no-capture) DO_CAPTURE=0; shift;;
    --self) SELF="--self"; shift;;
    --limit) LIMIT="$2"; shift 2;;
    --viewports) VIEWPORTS="$2"; shift 2;;
    --concurrency) CONCURRENCY="$2"; shift 2;;
    --open) OPEN=1; shift;;
    -h|--help) sed -n '2,25p' "$0"; exit 0;;
    *) echo "unknown option: $1" >&2; exit 2;;
  esac
done

cd "$REPO_ROOT"
BRANCH="$(git rev-parse --abbrev-ref "$HEAD_REF")"
step() { printf '\n\033[1;36m▶ %s\033[0m\n' "$1"; }

# --- token ---
: "${DA_TOKEN:=$(da-auth-helper token 2>/dev/null || true)}"
if [ -z "${DA_TOKEN:-}" ]; then
  echo "ERROR: no DA token. Run 'da-auth-helper login' (Skyline profile) or export DA_TOKEN." >&2
  exit 1
fi
export DA_TOKEN

mkdir -p "$WORK/pages"

step "1/6  Resolve changed blocks (base=$BASE, branch=$BRANCH)"
node "$SCRIPT_DIR/scripts/resolve-changed-blocks.mjs" --base "$BASE" --head "$HEAD_REF" > "$WORK/changed-blocks.json"
node -e 'const j=require(process.argv[1]);console.log("   affected blocks("+j.affectedBlocks.length+"): "+(j.affectedBlocks.join(", ")||"(none)")+"  globalChange="+j.globalChange);' "$WORK/changed-blocks.json"

step "2/6  Fetch critical pages + select affected"
node "$SCRIPT_DIR/scripts/select-affected.mjs" --mode plan --manifest "$MANIFEST" \
  --pages-dir "$WORK/pages" > "$WORK/plan.json"
jq -c '.[]' "$WORK/plan.json" | while read -r row; do
  org=$(jq -r .org <<<"$row"); repo=$(jq -r .repo <<<"$row")
  dp=$(jq -r .daPath <<<"$row"); f=$(jq -r .file <<<"$row")
  code=$(curl -s -o "$f" -w "%{http_code}" \
    "https://admin.da.live/source/${org}/${repo}${dp}" -H "Authorization: Bearer $DA_TOKEN")
  [ "$code" = "200" ] || echo "   WARN: $code fetching $repo$dp" >&2
done
node "$SCRIPT_DIR/scripts/select-affected.mjs" --mode select --manifest "$MANIFEST" \
  --pages-dir "$WORK/pages" --changed "$WORK/changed-blocks.json" \
  --branch "$BRANCH" --out "$WORK/affected-pages.json" | grep -E "affected:|pages checked" || true

step "3/6  DA-wide discovery"
CRAWL_ARGS=""
if [ "$DO_DISCOVER" = "1" ]; then
  IFS=',' read -r -a _repos <<< "$DISCOVER_REPOS"
  for repo in "${_repos[@]}"; do
    org=$(jq -r --arg r "$repo" '.projects | to_entries[] | select(.value.repo==$r) | .value.org' "$MANIFEST" | head -1)
    if [ -z "$org" ] || [ "$org" = "null" ]; then echo "   skip '$repo' (not in manifest)"; continue; fi
    out="$WORK/crawl-$repo.json"
    SCOPE_ARGS=""
    [ "$repo" = "da-express-milo" ] && SCOPE_ARGS="--skip-locales"
    # shellcheck disable=SC2086
    node "$SCRIPT_DIR/scripts/crawl-affected.mjs" --org "$org" --repo "$repo" \
      --changed "$WORK/changed-blocks.json" --manifest "$MANIFEST" \
      --out "$out" --exclude drafts --concurrency 10 $SCOPE_ARGS | grep -E "affected pages:|crawl:" || true
    CRAWL_ARGS="$CRAWL_ARGS --crawl $out"
  done
else
  echo "   skipped (pass --discover to crawl; default repos: express-color,da-express-milo)"
fi

step "4/6  Build worklist"
# shellcheck disable=SC2086
node "$SCRIPT_DIR/scripts/build-worklist.mjs" --manifest "$MANIFEST" \
  --affected "$WORK/affected-pages.json" $CRAWL_ARGS \
  --branch "$BRANCH" --out "$WORK/worklist.json"

if [ "$DO_CAPTURE" = "0" ]; then
  step "Done (worklist only). See $WORK/worklist.json"
  exit 0
fi

# ensure skill-local diff deps
if [ ! -d "$SCRIPT_DIR/node_modules/pixelmatch" ]; then
  step "Installing skill-local deps (pixelmatch, pngjs)"
  ( cd "$SCRIPT_DIR" && npm install --silent )
fi

step "5/6  Capture + diff + broken-block probe"
CAP_ARGS="--worklist $WORK/worklist.json --out-dir $WORK/report --concurrency $CONCURRENCY $SELF"
[ -n "$LIMIT" ] && CAP_ARGS="$CAP_ARGS --limit $LIMIT"
[ -n "$VIEWPORTS" ] && CAP_ARGS="$CAP_ARGS --viewports $VIEWPORTS"
# shellcheck disable=SC2086
node "$SCRIPT_DIR/scripts/capture.mjs" $CAP_ARGS

step "6/6  Render report"
node "$SCRIPT_DIR/scripts/report.mjs" --results "$WORK/report/results.json"

REPORT="$WORK/report/index.html"
step "Done → $REPORT"
if [ "$OPEN" = "1" ]; then command -v open >/dev/null && open "$REPORT" || true; fi
