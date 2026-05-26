---
description: Generate a PR description following the project's pull_request_template.md.
---

Generate a pull request description for the current branch.

First, gather context by running these in parallel:
- `git log main..HEAD --oneline`
- `git diff main..HEAD --stat`
- `git diff main..HEAD`

If the jira ticket number or test URL isn't provided, ask me for it.

Then produce a filled-out PR description using the project template below. Be succinct. Replace all placeholder text with real content derived from the diff and commit history. Remove any sections that don't apply rather than leaving placeholder text.

PR template:

```!
cat .github/pull_request_template.md
```

Output only the final markdown, ready to paste into GitHub. Do not add commentary before or after it.
