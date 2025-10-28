#!/bin/bash
set -e

TAGS=""
REPORTER=""
EXCLUDE_TAGS="--grep-invert nopr"
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

# Reporter (override if provided)
REPORTER=$reporter
[[ ! -z "$REPORTER" ]] && REPORTER="--reporter $REPORTER"

echo "Running Nala on branch: $FEATURE_BRANCH"
echo "Tags: ${TAGS:-"No @tags or annotations on this PR"}"
echo "Run Command: npx playwright test ${TAGS} ${EXCLUDE_TAGS} ${REPORTER}"
echo -e "\n"
echo "*******************************"

# Move to repo root
cd "$GITHUB_ACTION_PATH" || exit

# Install dependencies
npm ci
npx playwright install --with-deps

# Run Playwright tests on all browsers
echo "*** Running tests on Chromium + Firefox + WebKit ***"
npx playwright test \
  --config=./playwright.config.cjs \
  ${TAGS} ${EXCLUDE_TAGS} ${REPORTER} \
  --project=express-live-chromium \
  --project=express-live-firefox \
  --project=express-live-webkit || EXIT_STATUS=$?

# Exit status
if [ $EXIT_STATUS -ne 0 ]; then
  echo "Some tests failed. Exiting with error."
  exit $EXIT_STATUS
else
  echo "All tests passed successfully."
fi
