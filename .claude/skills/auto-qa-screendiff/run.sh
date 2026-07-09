#!/usr/bin/env bash
#
# Auto-QA Screen-Diff — one-shot runner.
# Chains: resolve changed blocks → fetch+select critical pages (+ kitchen-sink
#         demo pages, auto-added per affected block) →
#         (optional) single-block scoped DA crawl → worklist →
#         capture+diff+probe → report.
#
# Usage (from repo root, or anywhere — paths resolve relative to this script):
#   .claude/skills/auto-qa-screendiff/run.sh [options]
#
# Options:
#   --base <branch>       diff base (default: stage)
#   --head <ref>          diff/preview target (default: current checked-out
#                         branch). Use to compare two refs without switching
#                         branches, e.g. --base stage --head main.
#   --crawl-block <name> [repos]
#                         opt-in DA-wide crawl, SCOPED TO ONE BLOCK (default is
#                         curated + kitchen-sink pages only, no crawl at all).
#                         repos is comma-separated (default: express-color,da-express-milo).
#                         Fetches are batched (--crawl-batch-size, default 50)
#                         with a delay between batches (--crawl-batch-delay-ms,
#                         default 8000) to avoid the origin throttling seen
#                         under sustained request volume; progress prints per
#                         batch so a long crawl stays observable.
#   --crawl-batch-size <N>       pages per crawl batch (default: 50)
#   --crawl-batch-delay-ms <N>   delay between crawl batches (default: 8000)
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
CRAWL_BLOCK=""
CRAWL_REPOS="express-color,da-express-milo"
CRAWL_BATCH_SIZE="50"
CRAWL_BATCH_DELAY_MS="8000"
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
    --crawl-block)
      CRAWL_BLOCK="$2"
      if [ $# -ge 3 ] && [ "${3#--}" = "$3" ]; then CRAWL_REPOS="$3"; shift 3; else shift 2; fi;;
    --crawl-batch-size) CRAWL_BATCH_SIZE="$2"; shift 2;;
    --crawl-batch-delay-ms) CRAWL_BATCH_DELAY_MS="$2"; shift 2;;
    --no-capture) DO_CAPTURE=0; shift;;
    --self) SELF="--self"; shift;;
    --limit) LIMIT="$2"; shift 2;;
    --viewports) VIEWPORTS="$2"; shift 2;;
    --concurrency) CONCURRENCY="$2"; shift 2;;
    --open) OPEN=1; shift;;
    -h|--help) sed -n '2,32p' "$0"; exit 0;;
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

step "2/6  Fetch critical pages + select affected (+ kitchen-sink demo pages)"
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

step "3/6  Scoped DA crawl (opt-in)"
CRAWL_ARGS=""
if [ -n "$CRAWL_BLOCK" ]; then
  echo "   crawling for block '$CRAWL_BLOCK' only — batches of $CRAWL_BATCH_SIZE pages, ${CRAWL_BATCH_DELAY_MS}ms apart"
  IFS=',' read -r -a _repos <<< "$CRAWL_REPOS"
  for repo in "${_repos[@]}"; do
    org=$(jq -r --arg r "$repo" '.projects | to_entries[] | select(.value.repo==$r) | .value.org' "$MANIFEST" | head -1)
    if [ -z "$org" ] || [ "$org" = "null" ]; then echo "   skip '$repo' (not in manifest)"; continue; fi
    out="$WORK/crawl-$repo.json"
    SCOPE_ARGS=""
    [ "$repo" = "da-express-milo" ] && SCOPE_ARGS="--skip-locales"
    # shellcheck disable=SC2086
    node "$SCRIPT_DIR/scripts/crawl-affected.mjs" --org "$org" --repo "$repo" --block "$CRAWL_BLOCK" \
      --changed "$WORK/changed-blocks.json" --manifest "$MANIFEST" \
      --out "$out" --exclude drafts --concurrency 10 \
      --batch-size "$CRAWL_BATCH_SIZE" --batch-delay-ms "$CRAWL_BATCH_DELAY_MS" $SCOPE_ARGS
    CRAWL_ARGS="$CRAWL_ARGS --crawl $out"
  done
else
  echo "   skipped (default: curated + kitchen-sink pages only)"
  echo "   pass --crawl-block <name> to additionally crawl for one specific block"
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
