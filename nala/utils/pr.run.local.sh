#!/bin/bash
# Run Nala suite locally the same way as in a PR (same browsers, timeouts, retries, workers).
# Use this when a test times out in the PR but passes locally — reproduces CI behavior.
#
# Usage: ./nala/utils/pr.run.local.sh [branch-name]
#   If branch-name is omitted, uses current git branch (with "/" replaced by "-").
#
# Requires: repo root as cwd, or set GITHUB_ACTION_PATH to repo root.

set -e

REPO_ROOT="${GITHUB_ACTION_PATH:-$(git rev-parse --show-toplevel)}"
cd "$REPO_ROOT" || exit 1

# Branch: first arg, or current git branch (slash replaced with dash)
if [[ -n "$1" ]]; then
  FEATURE_BRANCH="${1//\//-}"
else
  FEATURE_BRANCH=$(git rev-parse --abbrev-ref HEAD | sed 's/\//-/g')
fi

# Repo org/name (from remote or default)
REMOTE_URL=$(git config --get remote.origin.url 2>/dev/null || true)
if [[ "$REMOTE_URL" =~ github\.com[:/](.*)/(.*)\.git ]]; then
  prOrg="${BASH_REMATCH[1]}"
  prRepo="${BASH_REMATCH[2]%.git}"
  [[ -z "$prRepo" ]] && prRepo="${BASH_REMATCH[2]}"
else
  prOrg="${prOrg:-adobecom}"
  prRepo="${prRepo:-da-express-milo}"
fi

# Same env as GitHub Actions so global setup and config match PR
export GITHUB_ACTION_PATH="$REPO_ROOT"
export GITHUB_ACTIONS=true
export GITHUB_REF="refs/heads/$FEATURE_BRANCH"
export GITHUB_HEAD_REF="$FEATURE_BRANCH"
export GITHUB_REPOSITORY="${prOrg}/${prRepo}"
export prOrg
export prRepo
export CI=true

echo "Running Nala like PR: branch=$FEATURE_BRANCH repo=$prOrg/$prRepo"
echo "URL: https://${FEATURE_BRANCH}--${prRepo}--${prOrg}.aem.live"
echo ""

./nala/utils/pr.run.sh
