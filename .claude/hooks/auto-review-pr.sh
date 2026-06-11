#!/bin/bash
# Fires after gh pr create runs. Extracts the PR URL from gh output and
# injects context back to Claude to trigger a /review.

INPUT=$(cat /dev/stdin)

# gh pr create outputs the PR URL as the last line of stdout
PR_URL=$(echo "$INPUT" | jq -r '.. | strings | select(test("https://github\\.com/.+/pull/[0-9]+"))' 2>/dev/null | head -1)

if [ -n "$PR_URL" ]; then
  jq -n --arg url "$PR_URL" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: ("PR created at " + $url + ". Please run /review now to review this PR.")
    }
  }'
fi
