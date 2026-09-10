#!/bin/bash
set -e

TAGS=""
REPORTER=""
# Single combined --grep-invert: Playwright applies only the LAST --grep-invert
# flag, so every exclusion must live in one regex. nopr = never run in PR/CI;
# @monitoring = synthetic monitors. Sharded lanes additionally pass
# NALA_EXTRA_GREP_INVERT="@color" to hand the heavy color blocks off to their
# own serial lane (they starve each other's decoration when clustered).
GREP_INVERT="nopr|@monitoring"
[[ -n "$NALA_EXTRA_GREP_INVERT" ]] && GREP_INVERT="${GREP_INVERT}|${NALA_EXTRA_GREP_INVERT}"
EXCLUDE_TAGS="--grep-invert ${GREP_INVERT}"
EXIT_STATUS=0

echo "GITHUB_REF: $GITHUB_REF"
echo "GITHUB_HEAD_REF: $GITHUB_HEAD_REF"

# Detect branch / PR number
if [[ "$GITHUB_REF" == refs/pull/* ]]; then
  # extract PR number and branch name
  PR_NUMBER=$(echo "$GITHUB_REF" | awk -F'/' '{print $3}')
  FEATURE_BRANCH="$GITHUB_HEAD_REF"
elif [[ "$GITHUB_REF" == refs/heads/* ]]; then
  # extract branch name from GITHUB_REF
  FEATURE_BRANCH=$(echo "$GITHUB_REF" | awk -F'/' '{print $3}')
else
  echo "Unknown reference format"
fi

# Replace "/" characters in the feature branch name with "-"
FEATURE_BRANCH=$(echo "$FEATURE_BRANCH" | sed 's/\//-/g')

echo "PR Number: ${PR_NUMBER:-"N/A"}"
echo "Feature Branch Name: $FEATURE_BRANCH"

repository=${GITHUB_REPOSITORY}
repoParts=(${repository//\// }) 
toRepoOrg=${repoParts[0]}
toRepoName=${repoParts[1]}

prRepo=${prRepo:-$toRepoName}
prOrg=${prOrg:-$toRepoOrg}

# TODO: add HLX5 support later if needed
PR_BRANCH_LIVE_URL_GH="https://$FEATURE_BRANCH--$prRepo--$prOrg.aem.live"

# set env vars
export PR_BRANCH_LIVE_URL_GH
export PR_NUMBER

echo "PR Branch live URL: $PR_BRANCH_LIVE_URL_GH"

# Purge the PR branch before running tests
# echo "Purging branch: $FEATURE_BRANCH"
# PURGE_URL="https://admin.hlx.page/code/$prOrg/$prRepo/$FEATURE_BRANCH/*"

# echo "Executing: curl -si -X POST \"$PURGE_URL\""
# PURGE_RESPONSE=$(curl -si -X POST "$PURGE_URL")

# echo "Waiting 10 seconds for purge to complete..."
# sleep 10

# Check purge response
# if echo "$PURGE_RESPONSE" | grep -q "202"; then
#  echo "Branch $FEATURE_BRANCH successfully purged"
#else
#  echo "Failed to purge branch $FEATURE_BRANCH"
#  echo "Response: $PURGE_RESPONSE"
#fi

# Convert GitHub labels starting with @ into Playwright tags
for label in ${labels}; do
  if [[ "$label" = \@* ]]; then
    label="${label:1}"
    TAGS+="|$label"
  fi
done

# Remove first pipe if TAGS not empty
[[ ! -z "$TAGS" ]] && TAGS="${TAGS:1}" && TAGS="-g $TAGS"

# Positive grep. A lane override (NALA_GREP, e.g. "@color" for the serial color
# lane) takes precedence over PR-label tags.
GREP_ARG="$TAGS"
[[ -n "$NALA_GREP" ]] && GREP_ARG="-g $NALA_GREP"

# Reporter (override if provided)
REPORTER=$reporter
[[ ! -z "$REPORTER" ]] && REPORTER="--reporter $REPORTER"

echo "Running Nala on branch: $FEATURE_BRANCH"
echo "Tags: ${TAGS:-"No @tags or annotations on this PR"}"
echo "Run Command: npx playwright test ${GREP_ARG} ${EXCLUDE_TAGS} ${REPORTER}"
echo -e "\n"
echo "*******************************"

# Move to repo root
cd "$GITHUB_ACTION_PATH" || exit

# Dependencies and browsers are installed by the calling workflow steps.
# (Re-installing here duplicated `npm ci` and pulled every browser + OS deps
# on every run, adding several minutes for no benefit.)

# Browsers to run. Default: chromium only (fast PR gate). Override with
# NALA_PROJECTS to run the full cross-browser matrix, e.g.
# "--project=express-live-chromium --project=express-live-firefox --project=express-live-webkit"
PROJECTS="${NALA_PROJECTS:---project=express-live-chromium}"

# Optional sharding across parallel runner jobs, e.g. SHARD="1/4"
SHARD_ARG=""
[[ -n "$SHARD" ]] && SHARD_ARG="--shard=$SHARD"

# Run Playwright tests
echo "*** Running tests on projects: ${PROJECTS} ${SHARD_ARG:-"(no shard)"} ***"
echo "*** grep-invert: ${GREP_INVERT} ***"
[[ -n "$NALA_GREP" ]] && echo "*** grep (include only): ${NALA_GREP} — workers: ${NALA_WORKERS:-config default} ***"
npx playwright test \
  --config=./playwright.config.cjs \
  ${GREP_ARG} ${EXCLUDE_TAGS} ${REPORTER} \
  ${PROJECTS} ${SHARD_ARG} || EXIT_STATUS=$?

# Exit status
if [ $EXIT_STATUS -ne 0 ]; then
  echo "Some tests failed. Exiting with error."
  exit $EXIT_STATUS
else
  echo "All tests passed successfully."
fi
