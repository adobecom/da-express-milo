# Claude Code Guide for Adobe EDS Developers

*April 2026 -- started with Milo (adobecom/milo), applicable to any EDS project*

A progressive guide. Section 0 gets you running in 10 minutes. Each section after
that builds on the previous one -- prerequisites are always covered before they're
needed.

---

## Table of Contents

0. [First 10 Minutes](#0-first-10-minutes)
1. [How Config Works](#1-how-config-works)
2. [CLAUDE.md Files](#2-claudemd-files)
3. [Installing Skills](#3-installing-skills)
4. [How Skills Work](#4-how-skills-work)
5. [Tokens and Credentials](#5-tokens-and-credentials)
6. [MCP Servers](#6-mcp-servers)
7. [Lookup Tools: Jira, Fluffyjaws, and Slack MCPs](#7-lookup-tools-jira-fluffyjaws-and-slack-mcps)
8. [Rules](#8-rules)
9. [Hooks](#9-hooks)
10. [Permissions](#10-permissions)
11. [Power User Techniques](#11-power-user-techniques)
12. [Lessons Learned](#12-lessons-learned)
13. [Quick Reference](#13-quick-reference)
14. [Appendix: Sunil's Setup Status](#14-appendix-sunils-setup-status)
15. [Bonus: Custom Notification App](#15-bonus-custom-notification-app)

---

## 0. First 10 Minutes

New to Claude Code? Do these steps and you'll have a working setup. Everything else
in this guide adds integrations and power tools on top.

**Prerequisites** -- you probably have these already, but verify:
```bash
node --version    # Node.js 18+ required
gh --version      # GitHub CLI -- install with: brew install gh
python3 --version # Python 3 -- needed by Jira/wiki skills
```

If `gh` isn't authenticated: `gh auth login` (follow the prompts, pick HTTPS).
Claude Code uses `gh` for PR operations, and several skills use it for installation.
The permissions allowlist (Section 10) pre-approves `gh pr` and `gh api` so Claude
can read PRs without prompting, while deny rules prevent destructive git operations
like force push -- so `gh` access is safe.

**1. Install Claude Code** (if not already):
```bash
npm install -g @anthropic-ai/claude-code
```

**2. Launch it once** in your project directory to create the `~/.claude/` config
directory. Just run `claude`, then type `/exit`:
```bash
cd ~/dev/milo   # or your milo project
claude
```

**3. Create a project CLAUDE.md** in your repo root. This tells Claude how your
project works. Start minimal -- you can add more later:

```markdown
# My Project

## Commands
- Dev server: `npm start`
- Test: `npm test`
- Lint: `npm run lint`

## Code Style
- [Whatever matters most -- framework, language version, import style]

## Gotchas
- [Anything Claude would get wrong without being told]
```

**4. Try these prompts** to see it work:
```
"What does this project do? Read the main entry point and explain."
"Run the tests and tell me if anything fails."
"Find all usages of [some function] and explain the pattern."
```

That's it. You now have a working Claude Code setup. The rest of this guide adds
skills (reusable workflows), tokens (API access to Jira/Slack), MCP servers
(live connections to external services), rules, hooks, and permissions -- each
section builds on the previous one.

**Want Claude to handle the rest?** Instead of working through each section manually,
you can have Claude set everything up for you interactively. See the next section.

---

## 0.5. Automated Setup (let Claude do it)

Instead of following Sections 1--10 manually, you can have Claude audit your current
setup, ask about your role, and configure everything for you. Nothing changes without
your approval.

### First-time setup

After completing Section 0 above (install Claude Code, launch it once), run this in
your milo project directory:

```bash
claude --enable-auto-mode --model opus --effort max
```

Then paste this prompt:

```
Read claude-code-guide.md in this repo. Go to Section 0.5 — it contains
the full definition of the /setup-dev-env skill. Create the skill file at
.claude/skills/setup-dev-env/SKILL.md from that definition, then run /setup-dev-env.
```

Claude will create the skill, then immediately run it. The skill walks you through
everything interactively -- it asks your role, audits what you have, proposes what to
add, and only acts on what you approve.

### Re-running later

Once the skill file exists, just type `/setup-dev-env` in any Claude session in the
milo repo. Use it to check for drift, update rules after the guide changes, or set up
new integrations you skipped the first time.

### The skill definition

Below is the complete `/setup-dev-env` skill. Claude reads this section and creates
the file at `.claude/skills/setup-dev-env/SKILL.md`. If you prefer, you can create
the file yourself by copying the content between the fences.

<details>
<summary><strong>setup-dev-env/SKILL.md</strong> (click to expand)</summary>

````markdown
---
name: setup-dev-env
description: >
  Interactive AI developer environment setup for Milo/EDS projects. Audits the current
  setup, identifies gaps, and proposes targeted improvements based on the developer's
  role. Sources all configuration from claude-code-guide.md.
user_invocable: true
---

# Setup Dev Environment

You are an AI developer environment setup assistant. Your job is to turn a Milo/EDS
developer into an AI-powered rockstar by configuring their Claude Code environment.

**Your primary source of truth is `claude-code-guide.md` in the repo root.**
Read it fully before proposing anything. All rules, configuration patterns, token setup
instructions, hook recipes, MCP server configs, and permission lists come from that
document. Do not invent configuration -- extract it from the guide.

---

## Phase 0: Understand the developer

Before touching anything, ask the user:

1. **What's your role?** (e.g., frontend developer, full-stack, PM, designer, QA)
2. **What do you mainly work on?** (e.g., milo blocks, features, utils, content authoring, reviews)
3. **Which tools do you use daily?** (e.g., Jira, Slack, Confluence wiki)
4. **Have you already set up any Claude Code configuration?** (e.g., rules, skills,
   tokens, hooks, MCP servers -- even partial or from a different guide). This helps
   catch things the automated audit might miss, like tokens stored under different
   env var names, skills installed in non-standard locations, or MCP servers added
   through Claude Desktop settings rather than CLI.

If the user mentions existing setup, ask follow-up questions to understand what they
have before running the audit. Factor their answers into the audit results -- mark
items they say they have as "user-reported" even if the audit can't detect them, and
confirm during the proposal phase rather than proposing to re-install them.

Use their answers to tailor which phases matter. The mapping below is a starting
point -- adjust based on what the user actually says they work on.

**Block developer** (most common):
- Rules: all 7 (blocks, code-style, accessibility, performance, features, tests, utils)
- Skills: jira-integration, debug-e2e, standup
- Tokens: JIRA_TOKEN
- Hooks: auto-eslint, auto-stylelint, pre-commit lint gate, utils.js warning
- Permissions: full allow/deny lists from the guide
- MCP: Fluffyjaws, Slack (at least slack-mwp)

**QA engineer**:
- Rules: milo-tests (test patterns, fixtures, Chai/Sinon), milo-accessibility (WCAG
  rules -- QA catches a11y bugs), milo-blocks (need to understand block structure to
  write meaningful tests), milo-code-style (reviewing code in PRs)
- Skills: debug-e2e (Playwright failure analysis), webapp-testing (browser interaction),
  jira-integration (reading acceptance criteria, filing bugs), standup
- Tokens: JIRA_TOKEN
- Hooks: pre-commit lint gate (catches issues before CI)
- Permissions: allow test/lint commands, gh pr, read operations. Skip code gen tools.
- MCP: Fluffyjaws (searching for known issues), Slack (at least slack-mwp)
- Skip: auto-stylelint, confluence-wiki (unless they write test documentation)

**PM or content author**:
- Rules: none (they don't write code)
- Skills: jira-integration, confluence-wiki, standup, burndown
- Tokens: JIRA_TOKEN, WIKI_TOKEN
- Hooks: none
- Permissions: allow read operations, gh pr (viewing PRs), Jira read scripts
- MCP: Fluffyjaws, Slack (all 3 workspaces -- PMs need broad visibility)
- Skip: all code rules, code hooks, EDS skills

**Reviewer** (reviews PRs but doesn't build features daily):
- Rules: milo-blocks, milo-code-style, milo-accessibility, milo-tests (need all the
  code convention knowledge to catch issues in review)
- Skills: jira-integration (ticket context for PRs), standup
- Tokens: JIRA_TOKEN
- Hooks: none (they're not committing code)
- Permissions: allow read operations, gh pr, gh api
- MCP: Fluffyjaws, Slack (at least slack-mwp)
- Skip: auto-eslint/stylelint hooks, EDS skills

**Full-stack developer**:
- Everything -- all rules, all skills, all tokens, all hooks, all permissions, all MCPs

Tell the user: "I'll audit your current setup, then propose what to add or improve
based on your role. Nothing gets changed without your OK."

---

## Phase 1: Audit current state

Run these checks silently (don't dump raw output to the user). Build an internal
inventory of what exists vs what's missing.

### Prerequisites
- `node --version` -- Node.js 18+ required
- `gh --version` -- GitHub CLI
- `python3 --version` -- needed by Jira/wiki skills
- `gh auth status` -- is gh authenticated?

### Repo configuration
- Does `CLAUDE.md` exist in the repo root? Read it.
- Does `CLAUDE.local.md` exist? Read it.
- Does `.claude/` directory exist?

### Rules (source: guide Section 8)
- Check `.claude/rules/` for existing rule files
- Compare against the 7 rules defined in the guide: milo-blocks, milo-code-style,
  milo-accessibility, milo-performance, milo-features, milo-tests, milo-utils
- For each existing rule, compare its content against the guide's version --
  note if it's outdated or different

### Skills
- `npx skills list -g` -- global skills
- `npx skills list` -- project skills
- Check `.skills/` for EDS skills (gh upskill)
- Check `~/.claude/skills/` for manually installed skills

### Tokens
- Check if `~/.claude-tokens` exists and has correct permissions (600)
- Check token env vars (existence only, NEVER read values):
  `[ -n "$JIRA_TOKEN" ] && echo "set" || echo "not set"` for each of:
  JIRA_TOKEN, JIRA_BASE_URL, JIRA_PROJECT, WIKI_TOKEN,
  SLACK_BOT_TOKEN_MWP, SLACK_USER_TOKEN_MWP, SLACK_TEAM_ID_MWP,
  SLACK_BOT_TOKEN_AEM_ENG, SLACK_USER_TOKEN_AEM_ENG, SLACK_TEAM_ID_AEM_ENG,
  SLACK_BOT_TOKEN_ADOBEDOTCOM, SLACK_USER_TOKEN_ADOBEDOTCOM, SLACK_TEAM_ID_ADOBEDOTCOM

### Hooks
- Read `~/.claude/settings.json` for global hooks
- Read `.claude/settings.local.json` for project hooks
- Check for: auto-eslint, auto-stylelint, pre-commit lint gate, token protection,
  notification hook, utils.js warning

### Permissions
- Read `~/.claude/settings.json` permissions.allow and permissions.deny
- Compare against the guide's recommended allow/deny lists (Sections 9-10)

### MCP servers
- Read `~/.claude.json` for mcpServers entries
- Check for: Fluffyjaws, Slack MCPs (3 workspaces), any others
- If Slack MCPs exist, check they use `SLACK_DEFAULT_TOKEN=user`

---

## Phase 2: Present the setup report

Summarize findings in a clear table. Group by category:

    YOUR CURRENT SETUP
    ==================

    Prerequisites:        [all good / missing: ...]
    CLAUDE.md:            [exists / missing]
    Rules:                [X/7 installed, Y outdated]
    Skills:               [list installed, note missing ones relevant to role]
    Tokens:               [list which are set vs missing]
    Hooks:                [list active hooks vs recommended ones]
    Permissions:          [summary of allow/deny coverage]
    MCP Servers:          [list connected vs recommended for role]

Then present **prioritized proposals** based on the user's role:

    PROPOSED IMPROVEMENTS (in priority order)
    =========================================

    1. [HIGH] Create 3 missing rule files (milo-blocks, milo-tests, milo-performance)
       Why: These prevent Claude from generating wrong patterns in your daily work areas.

    2. [HIGH] Install jira-integration skill
       Why: You said you use Jira daily. This gives Claude direct ticket read/write access.

    3. [MEDIUM] Add pre-commit lint hook
       Why: Catches lint errors in 5 seconds instead of waiting for CI.

    Shall I proceed with all of these, or would you like to pick specific ones?

Wait for the user to confirm before proceeding. Accept:
- "all" or "yes" -- do everything
- Specific numbers -- "1 and 2" or "just the high priority ones"
- "skip" or "none" for any category

---

## Phase 3: Execute approved changes

For each approved item, execute it and report success/failure. Work through them
in dependency order (prerequisites first, then config, then integrations).

### Creating rules from the guide

Read Section 8 of `claude-code-guide.md`. The full content of each rule
file is in collapsible details blocks. For each rule the user approved:

1. Extract the exact markdown content from the guide (between the ```` fences)
2. Create the file at `.claude/rules/<rule-name>.md`
3. If a rule already exists but is outdated, show the diff and ask before overwriting

The two shorter rules (milo-features.md, milo-utils.md) may not have full content in
the guide's details blocks. If so, check if they exist locally at `.claude/rules/` and
read them. If they don't exist anywhere, create them from the descriptions in Section 8.

### Installing skills

Follow the guide's Section 3 exactly:

    # Individual skills from Adobe Skills Marketplace
    npx skills add OneAdobe/claude-workflow -s <skill-name> -g

    # EDS skills via gh upskill
    gh extension install ai-ecoverse/gh-upskill   # if not already installed
    gh upskill adobe/skills --path skills/aem/edge-delivery-services --all

Only install skills relevant to the user's role.

### Setting up tokens

You cannot create tokens for the user -- they require logging into each service
and generating them manually. Your job is to:

1. Set up the token file infrastructure
2. Walk them through creating each token they need for their role
3. Tell them exactly what to paste into `~/.claude-tokens`
4. Verify the tokens are set after they restart their session

**Step 1: Create the token file** (if it doesn't exist):

    touch ~/.claude-tokens
    chmod 600 ~/.claude-tokens

Check that `.zshrc` sources it. If not sourced, tell the user to add
`source ~/.claude-tokens` to their `.zshrc`.

**Step 2: Walk through each missing token.** Present only the ones relevant to
their role. For each token, give the user the full instructions inline -- don't
tell them "go read Section 5", spell it out right here in the conversation.

**Jira token** (needed by: jira-integration skill):
1. Connect to VPN
2. Go to `jira.corp.adobe.com/secure/ViewProfile.jspa`
3. Left sidebar -> "Personal Access Tokens" -> "Create token"
4. Name it anything, set 90-day max expiration, click Create
5. Copy the token immediately (you can't retrieve it later)
6. Add these lines to `~/.claude-tokens`:
       export JIRA_TOKEN="<paste token here>"
       export JIRA_BASE_URL="https://jira.corp.adobe.com"
       export JIRA_PROJECT="MWPW"
   Ask the user what their Jira project key is -- suggest MWPW as the default
   for Milo developers, but confirm.

**Wiki token** (needed by: confluence-wiki skill):
1. Go to `wiki.corp.adobe.com/plugins/personalaccesstokens/usertokens.action`
2. Create a token, name it, set expiration
3. Copy immediately
4. Add to `~/.claude-tokens`: `export WIKI_TOKEN="<paste token here>"`

**Slack tokens** (needed by: Slack MCP servers -- this is the most complex):
Slack requires creating a Slack app per workspace. Walk the user through the
full process from Section 6 of the guide. Key points to emphasize:
- Use User OAuth Tokens (xoxp-), not just bot tokens
- Required bot scopes: channels:history, channels:read, users:read,
  users:read.email
- Required user scopes: channels:history, channels:read, users:read,
  search:read.public
- WARNING: Do NOT add search:read (exposes DMs), im:history/im:read/
  im:write (exposes private messages), or assistants:write (auto-rejected
  by Adobe Slack admins)
- They need both Bot Token and User Token per workspace
- Get Team ID from the Slack browser URL (T________ after /client/)
- Add to `~/.claude-tokens` with workspace-specific names:
      export SLACK_BOT_TOKEN_MWP="xoxb-..."
      export SLACK_USER_TOKEN_MWP="xoxp-..."
      export SLACK_TEAM_ID_MWP="T0JV553JQ"
  Repeat for each workspace (AEM_ENG, ADOBEDOTCOM).

**Step 3: After the user has added tokens**, remind them:
- "Start a new Claude Code session for tokens to take effect. Running
  source ~/.zshrc mid-session won't work -- tokens are read at startup."
- Offer to verify: "Once you've restarted, I can check that everything is set."

**Security reminder**: Never display, echo, or log token values. When verifying,
only test existence: `[ -n "$JIRA_TOKEN" ] && echo "set" || echo "not set"`

### Configuring hooks

Read the hook configurations from the guide's Section 9. Apply to the correct file:
- Global hooks -> `~/.claude/settings.json`
- Project hooks -> `.claude/settings.local.json`

Merge into existing settings -- never overwrite the entire file. Read the file first,
parse the JSON, add/update the specific hook entries, write back.

### Configuring permissions

Read the allow/deny lists from the guide's Section 10. Merge into
`~/.claude/settings.json` permissions object. Do not remove existing entries --
only add missing ones.

### Setting up Slack MCPs

Follow Section 6 of the guide exactly. This is the most complex setup:
1. Tell the user to create Slack apps (they must do this themselves)
2. Tell them which scopes to add (from the guide -- note the warnings about search:read and im:*)
3. Tell them to add tokens to `~/.claude-tokens`
4. Help build the MCP server binary (clone adobe-mcp-servers, checkout the right branch)
5. Add server entries to `~/.claude.json`

Remind about `SLACK_DEFAULT_TOKEN=user` and `use_user_token: true` for sends.

---

## Phase 4: Verify and summarize

After all changes are applied:

1. Run verification checks:
   - `npx skills list -g` -- confirm skills installed
   - Check rule files exist and have correct frontmatter
   - Check token env vars are set (existence only)
   - Check hooks are in settings files
   - Check permissions are in settings

2. Present final summary:

       SETUP COMPLETE
       ==============

       Installed:   3 rules, 2 skills, pre-commit hook, eslint hook
       Configured:  Jira token, permissions (12 allow, 11 deny)
       Pending:     Slack MCPs (follow the instructions above when ready)

       Next steps:
       - Start a new Claude Code session for all changes to take effect
       - Try: "What does the card block do?" to test your setup
       - Try: "Check my standup" if you installed the standup skill

---

## CRITICAL RULES

- **NEVER display, echo, or log token values.** Test existence only.
- **NEVER overwrite files without showing the user what will change.** Always diff first.
- **The guide is the source of truth.** If something in this skill contradicts the guide,
  the guide wins. Re-read the relevant section.
- **Be conversational, not robotic.** This is an interactive setup, not a script.
  Explain why things matter. Answer questions.
- **Respect existing setup.** If the user already has something configured differently
  from the guide, ask before changing it -- their version might be intentional.
- **Don't install everything for everyone.** A PM doesn't need 7 code rules. A block
  developer doesn't need the spacecat skill. Match the setup to the role.
````

</details>

---

## 1. How Config Works

Claude Code reads config from several files. They fall into three buckets:

| Bucket | What it controls | Files |
|--------|-----------------|-------|
| **Instructions** | What Claude knows about you and your project | CLAUDE.md files, `.claude/rules/*.md` |
| **Capabilities** | What tools and workflows Claude can use | `.claude/skills/*/SKILL.md`, MCP servers |
| **Guardrails** | What Claude is allowed to do | `settings.json`, hooks, permissions |

More specific overrides more general. Personal overrides shared. Project overrides global.

### Where files live

```
~/.claude/
  CLAUDE.md                    -- Your global preferences (all projects)
  settings.json                -- Global hooks + permissions allowlist
  skills/                      -- Personal skills (installed or symlinked)
  agents/                      -- Agent definitions (for multi-agent skills)
  commands/                    -- Slash commands

~/dev/milo/
  CLAUDE.md                    -- Milo project instructions
  CLAUDE.local.md              -- Your personal milo preferences
  .claude/
    settings.local.json        -- Milo-specific hooks
    rules/
      milo-blocks.md           -- Block development rules
    skills/                    -- Project skills (shared via git)
  .skills/                     -- EDS skills (installed via gh upskill)
```

**Key rule**: Files with "local" in the name are gitignored (personal). Files without
"local" can be committed and shared with the team.

---

## 2. CLAUDE.md Files

These are plain markdown files that tell Claude who you are, how you work, and what
the project looks like. Claude reads them at the start of every session.

### Three levels

**Global** (`~/.claude/CLAUDE.md`) -- applies to all projects:
- Your identity (Milo team, EDS developer)
- Communication preference (direct, no fluff)
- Tool selection rules (Jira skill vs fluffyjaws)
- Quality standards (read full files, run tests, no pseudocode)

**Project** (`~/dev/milo/CLAUDE.md`) -- shared with team via git:
- Build/test/lint commands (`aem up`, `npm test`, `npm run lint`)
- Code style rules (ES modules, .js extensions, Airbnb ESLint)
- Block architecture patterns (init, createTag, loadStyle)
- Git conventions (branch naming, commit format, PR template)
- Test environment URLs
- Gotchas (hot repo, browser compat, utils.js size)

**Personal** (`~/dev/milo/CLAUDE.local.md`) -- your preferences only, gitignored:
- Your role and current focus (core developer, Project Lingo)
- Milo-specific quality standards (lint commands, test commands)
- Pointer to global CLAUDE.md for tool selection rules (avoids duplication)

### Tips for writing good CLAUDE.md files

- Keep each file under 100 lines. If Claude ignores a rule, the file is too long.
- Be specific. "Run lint after editing" works. "Be thorough" doesn't.
- Changes take effect on the next session or after `/clear`.
- Edit them directly in your editor. No special tools needed.
- **Don't duplicate instructions across files.** Pick one source of truth per topic.
  Tool selection rules go in global CLAUDE.md. Milo-specific quality standards go in
  CLAUDE.local.md. If the same guidance appears in multiple files, Claude may follow
  one and ignore the other -- and you have to update them all when something changes.

---

## 3. Installing Skills

Skills are reusable workflows that extend what Claude can do -- querying Jira,
generating standup reports, reviewing PRs, etc. Before learning how skills work
(Section 4), you need to install them.

There are three sources of skills, each with its own install method.

### Source 1: Adobe Skills Marketplace (individual skills)

Browse available skills at: `skills.awesome-sites.corp.adobe.com`

Install individual skills with the `skills` CLI:

```bash
# Install a single skill (project-level, goes into .claude/skills/)
# npx skills add OneAdobe/claude-workflow --skill jira-integration

# Install a single skill globally (goes into ~/.claude/skills/) - you want this
npx skills add OneAdobe/claude-workflow --skill jira-integration --global

# List available skills in a collection without installing
npx skills add OneAdobe/claude-workflow --list

# See what's installed
npx skills list        # project skills
npx skills list -g     # global skills

# Update installed skills
npx skills update
```

This is the simplest way to get started. Install just what you need:

| Skill | Install command | What it does |
|-------|----------------|-------------|
| jira-integration | `npx skills add OneAdobe/claude-workflow -s jira-integration -g` | Full Jira CRUD via Python scripts |
| confluence-wiki | `npx skills add OneAdobe/claude-workflow -s confluence-wiki -g` | Create/update Confluence wiki pages + diagrams |
| debug-e2e | `npx skills add OneAdobe/claude-workflow -s debug-e2e -g` | Analyze failed Playwright tests |
| standup | `npx skills add OneAdobe/claude-workflow -s standup -g` | Auto-generate standup from Jira + GitHub activity |
| burndown | `npx skills add OneAdobe/claude-workflow -s burndown -g` | Sprint burndown chart from Jira |
| webapp-testing | `npx skills add OneAdobe/claude-workflow -s webapp-testing -g` | Playwright-based web app testing |
| skill-creator | `npx skills add OneAdobe/claude-workflow -s skill-creator -g` | Create new skills |
| sessions | `npx skills add OneAdobe/claude-workflow -s sessions -g` | Search/filter past Claude Code sessions |
| spacecat | `npx skills add OneAdobe/claude-workflow -s spacecat -g` | SpaceCat API for EDS site management |

**Use `-g` (global)** for skills you want across all projects (Jira, wiki, standup).
Omit `-g` for project-specific skills.

### Source 2: Full claude-workflow suite (for agent-dependent skills)

Some skills depend on shared agents and commands that aren't included in the
individual skill folder. Specifically, `/research`, `/socratize`, `/brainstorm`,
and `/concilize` require agent definitions (claude-researcher, gemini-researcher,
openai-researcher, peer-reviewer, etc.) and commands (`/orchestrate`, `/discover`,
etc.) that only come with the full repository.

I don't have these skills, but
if you need these multi-agent skills, clone the full repo and run its setup script:

```bash
# Clone the repository (use HTTPS if you don't have SSH keys set up for GitHub)
git clone git@github.com:OneAdobe/claude-workflow.git ~/dev/claude-workflow
# or: git clone https://github.com/OneAdobe/claude-workflow.git ~/dev/claude-workflow

# Run the automated setup
cd ~/dev/claude-workflow
bash setup.sh
```

`setup.sh` is interactive -- it will prompt you if symlinks already exist (e.g., if
you installed some skills individually first). It creates symlinks from the repo into
`~/.claude/`:
- Each skill directory -> `~/.claude/skills/<skill-name>`
- Each agent .md file -> `~/.claude/agents/<agent-name>.md`
- Each command .md file -> `~/.claude/commands/<command-name>.md`

After setup, prune skills that aren't relevant to your project:

```bash
# Remove skills you don't need (symlinks, so this is safe)
rm ~/.claude/skills/cold-start          # Scaffolds new projects -- yours already exists
rm ~/.claude/skills/react-spectrum      # Milo uses vanilla CSS, not React Spectrum
rm ~/.claude/skills/ethos-flex-skill    # Different CI/CD platform
rm ~/.claude/skills/slack-integration   # Redundant with Slack MCPs (Section 6)
rm ~/.claude/skills/plato              # Prompt purification -- low practical value
rm ~/.claude/skills/document-skills     # One-shot utility
```

Unused skills have low token cost (deferred loading), but they add noise to Claude's
tool list and can mislead Claude into picking the wrong workflow. 14 well-chosen
skills beat 20 where half are irrelevant.

To uninstall everything later: `bash ~/dev/claude-workflow/unplug.sh`

### Source 3: AEM EDS skills (for Edge Delivery Services projects)

These are project-level skills installed into `.skills/` via the `gh upskill`
GitHub CLI extension. Requires the GitHub CLI (`gh`) -- install with
`brew install gh` if you don't have it.

```bash
# Install the gh extension (one-time)
gh extension install ai-ecoverse/gh-upskill

# Install EDS skills into your project
cd ~/dev/milo
gh upskill adobe/skills --path skills/aem/edge-delivery-services --all
```

This creates `.skills/` in your project root with 17 skill directories:

| Skill | What It Does |
|-------|-------------|
| content-driven-development | Orchestrates full block dev workflow |
| page-import | Orchestrates page migration from other sites |
| building-blocks | Block implementation guide |
| docs-search | Search EDS platform docs |
| block-collection-and-party | Find reference implementations |
| block-inventory | Survey available blocks |
| find-test-content | Find pages using a specific block |
| content-modeling | Content model design |
| testing-blocks | Block testing guide |
| code-review | Code review checklist |
| + 7 more | Various sub-skills for the orchestration pipeline |

**Note for milo**: These skills use generic EDS patterns (`export default async
function decorate(block)`). Milo uses different patterns. Section 8 (Rules) explains
how to override the generic patterns with milo-specific ones.

### Where to find more skills

| Source | URL |
|--------|-----|
| Adobe Skills Marketplace | `skills.awesome-sites.corp.adobe.com` |
| OneAdobe Claude Workflow | `github.com/OneAdobe/claude-workflow` |
| Adobe AI Foundations | `github.com/Adobe-AIFoundations/adobe-skills` |
| Squirrel Skills | `github.com/OneAdobe/squirrel-skills` |
| AEM EDS Skills | `aem.live/developer/ai-coding-agents` |

---

## 4. How Skills Work

Now that you have skills installed (Section 3), here's how they work.

### Anatomy of a skill

A skill is a directory containing a `SKILL.md` file:

```
.claude/skills/my-skill/SKILL.md
```

The SKILL.md has YAML frontmatter (metadata) and markdown body (instructions):

```markdown
---
name: my-skill
description: What it does (used for model invocation matching)
argument-hint: [args]
---

Step-by-step instructions for Claude.
Use $ARGUMENTS for user input.
Use $0, $1 for specific positional arguments.
```

### Two ways skills get triggered

**1. You type `/skill-name`** -- manual invocation, always works.

**2. Model invocation** -- Claude loads it automatically. Claude reads every skill's
`description` field at session start. When your prompt matches a description, Claude
loads and follows that skill without you typing anything.

Example: if you say "review PR #5781 for i18n implications," Claude matches it to
`review-pr` because its description says "Multi-step PR review with Jira ticket
context and diff analysis."

The `description` field is what makes model invocation work. Good descriptions include
explicit trigger phrases like "Use when the user asks for..." to help Claude match.

### Controlling invocation behavior

```yaml
# Default: Claude can model-invoke AND you can /invoke
description: Review a PR and check for i18n implications

# Block model invocation -- only manual /invoke works
disable-model-invocation: true

# Hide from / menu -- Claude can use it, you can't invoke manually
user-invocable: false
```

### Other useful frontmatter options

```yaml
model: opus                 # Override model (opus/sonnet/haiku)
context: fork               # Run in isolated subagent (doesn't fill main context)
paths: "libs/blocks/**"     # Only load for matching file paths
```

These are the most commonly used options. There are additional fields (`effort`,
`agent`, `hooks`, `shell`, `allowed-tools`) -- see the Claude Code docs for the
full list.

### Dynamic injection

Skills can run shell commands and inject the output before Claude reads them:

```markdown
## Current Branch
!`git branch --show-current`

## Recent Changes
!`git log --oneline -5`
```

The output replaces the command when the skill is loaded.

### Natural language vs slash commands

Most of the time, just describe what you want in plain English. Claude reads all
installed skills and auto-invokes the right one when your task matches.

```
"Give me my standup for yesterday and today"
```

That triggers `/standup` automatically. You don't need to know the command.

Use explicit `/skill-name` when:
- You want to force a specific pipeline (`/review-pr` ensures the full review steps)
- The skill is a quick utility (`/standup`, `/commit`, `/burndown`)
- You want to skip Claude's deliberation and go straight to the workflow

For everything else, natural language is better. Claude matches your intent to
skill descriptions semantically, not by keyword. "Help me review this PR" will
find the right skill without you memorizing what it's called.

### Building a new skill

```bash
mkdir -p ~/.claude/skills/my-skill    # personal (all projects)
# or
mkdir -p .claude/skills/my-skill      # project-specific (shared via git)
```

Then create `SKILL.md` with frontmatter + instructions. Or use `/skill-creator`
to have Claude build the skill for you.

---

## 5. Tokens and Credentials

Several skills need API tokens to talk to Adobe systems. This section covers the
simple tokens (Jira, Wiki). Slack tokens are covered in Section 6 alongside
the Slack MCP server setup, since they're tightly coupled.

### Where to store tokens

**Don't put tokens directly in `.zshrc`.** It's readable by every process on your
machine, gets backed up by Time Machine, and may sync to dotfile managers.

Instead, use a dedicated file with restricted permissions:

```bash
touch ~/.claude-tokens
chmod 600 ~/.claude-tokens    # Only you can read/write
```

Add your tokens there, then source it from `.zshrc`:

```bash
# Add this line to ~/.zshrc:
source ~/.claude-tokens
```

**After adding or changing tokens, start a new Claude Code session.** Running
`source ~/.zshrc` mid-session won't work -- it runs in a subprocess and doesn't
propagate env vars to the current process.

All the token setup instructions below (and in Section 6 for Slack) assume you're
adding `export` lines to `~/.claude-tokens`, not `.zshrc` directly.

### Jira token

Required by: **jira-integration** skill (installed in Section 3)

1. VPN on
2. Go to `jira.corp.adobe.com/secure/ViewProfile.jspa`
3. Left sidebar -> "Personal Access Tokens" -> "Create token"
4. Name it, 90-day max expiration, Create
5. Copy immediately (can't retrieve later)
6. Add to `~/.claude-tokens`:

```bash
export JIRA_TOKEN="your-token-here"
export JIRA_BASE_URL="https://jira.corp.adobe.com"
export JIRA_PROJECT="MWPW"
```

### Wiki token (optional)

Required by: **confluence-wiki** skill (installed in Section 3)

1. Go to `wiki.corp.adobe.com/plugins/personalaccesstokens/usertokens.action`
2. Same process as Jira -- name, expiration, copy immediately
3. Add to `~/.claude-tokens`: `export WIKI_TOKEN="your-token-here"`

### Security

Never let Claude display token values. To check if a token is set, test for
existence -- don't echo the value or even its length:

```bash
# Good -- reveals nothing about the token
[ -n "$JIRA_TOKEN" ] && echo "set" || echo "not set"

# Bad -- reveals the token itself
echo $JIRA_TOKEN

# Also bad -- reveals the token length, which narrows the search space
echo $JIRA_TOKEN | wc -c
```

If you see a token printed in the conversation, that's a bug.

---

## 6. MCP Servers

MCP (Model Context Protocol) servers connect Claude to external services -- live
Slack API access, Jira search, wiki search, AEM content management. This section
covers what's available and how to set up the Slack MCPs (the only ones requiring
manual setup).

### Enterprise MCPs

These are managed by Adobe IT. AEM MCPs are auto-configured when you connect Claude
to your Adobe account. Fluffyjaws requires a one-time local setup.

- **AEM Content** (Dev/Stage/Prod) -- manage AEM pages, fragments, launches (auto-configured)
- **AEM DA** -- Document authoring (auto-configured)

### Fluffyjaws setup

Fluffyjaws gives Claude read-only access to Slack archives, Jira, wiki, HelpX, and
Experience League -- all via RAG-indexed semantic search. It's the broadest discovery
tool you'll have.

Follow the official setup instructions at: `fluffyjaws.adobe.com/docs/mcp`

That page walks through installing the `fj` CLI and connecting it to Claude Code.
Once set up, Fluffyjaws tools appear as `mcp__fluffyjaws__*` in your session.

### Slack MCP setup (manual)

The Slack MCPs give Claude live Slack API access -- reading channels, searching
messages, posting replies. Unlike Fluffyjaws (which searches a stale RAG archive),
these hit the Slack API directly with fresh data.

You need three things: (A) a Slack app with tokens, (B) the MCP server binary,
and (C) the configuration in `~/.claude.json`.

#### A. Create Slack apps and get tokens

You need a Slack app per workspace. Using User OAuth Tokens (xoxp-), not bot tokens.

1. Go to `api.slack.com/apps` -> Create New App -> From scratch -> pick workspace
2. Under OAuth & Permissions, add **Bot Token Scopes**:
   - `channels:history`, `channels:read` (public channels)
   - `users:read`, `users:read.email` (user lookups)
3. Add **User Token Scopes**:
   - `channels:history`, `channels:read` (public channels)
   - `users:read` (user lookups)
   - `search:read.public` (search public channels only)
   - Do NOT add `search:read` -- it searches everything you can see, including DMs
   - Do NOT add `im:history`, `im:read`, `im:write` -- these expose your private DMs
   - Do NOT add `assistants:write` -- Adobe Slack admins auto-reject it
4. Install the app, copy both tokens:
   - Bot Token (`xoxb-...`)
   - User Token (`xoxp-...`)
5. Get your Team ID: open Slack in browser, the `T________` in the URL after `/client/` is it
6. Repeat for each workspace you want to connect

Add all tokens to `~/.claude-tokens` (created in Section 5) using workspace-specific
variable names:

```bash
# MWP workspace
export SLACK_BOT_TOKEN_MWP="xoxb-..."
export SLACK_USER_TOKEN_MWP="xoxp-..."
export SLACK_TEAM_ID_MWP="T0JV553JQ"

# AEM Engineering workspace
export SLACK_BOT_TOKEN_AEM_ENG="xoxb-..."
export SLACK_USER_TOKEN_AEM_ENG="xoxp-..."
export SLACK_TEAM_ID_AEM_ENG="T06DUTYDQ"

# adobedotcom workspace
export SLACK_BOT_TOKEN_ADOBEDOTCOM="xoxb-..."
export SLACK_USER_TOKEN_ADOBEDOTCOM="xoxp-..."
export SLACK_TEAM_ID_ADOBEDOTCOM="T036ZJ0TE"
```

#### B. Build the MCP server binary

The Slack MCP server comes from the Adobe MCP Servers repo:

```bash
git clone git@github.com:Adobe-AIFoundations/adobe-mcp-servers.git ~/adobe-mcp-servers
# or: git clone https://github.com/Adobe-AIFoundations/adobe-mcp-servers.git ~/adobe-mcp-servers
cd ~/adobe-mcp-servers

# Use this branch -- it has two critical fixes not yet in main:
#   1. SLACK_DEFAULT_TOKEN env var is actually wired up (without this,
#      read operations always use the bot token, which can't read channels
#      the bot hasn't been invited to)
#   2. search.messages replaced with assistant.search.context (without this,
#      search results include your private DMs - technically this permission is also not granted using the permissions
#      recommended in the tutorial, but just to be safe)
git checkout vhargrave/search-public-channels-only

cd src/slack
npm install
npm run build
```

This produces the server binary at `~/adobe-mcp-servers/src/slack/dist/index.js`.

To update later: `cd ~/adobe-mcp-servers/src/slack && git pull && npm install && npm run build`

Once the branch is merged to main, switch back:
`cd ~/adobe-mcp-servers && git checkout main && git pull`

#### C. Configure in ~/.claude.json

Add one server entry per workspace inside the `mcpServers` object in `~/.claude.json`.
Each entry sources tokens from `~/.claude-tokens` at startup instead of hardcoding
values.

Open `~/.claude.json` in your editor. Find the `"mcpServers"` key (or create it).
Add entries like this -- replace `/Users/YOU` with your actual home directory:

```json
{
  "mcpServers": {
    "slack-mwp": {
      "command": "bash",
      "args": ["-c", "source ~/.claude-tokens && SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN_MWP SLACK_USER_TOKEN=$SLACK_USER_TOKEN_MWP SLACK_TEAM_ID=$SLACK_TEAM_ID_MWP SLACK_DEFAULT_TOKEN=user exec node /Users/YOU/adobe-mcp-servers/src/slack/dist/index.js"]
    },
    "slack-aem-engineering": {
      "command": "bash",
      "args": ["-c", "source ~/.claude-tokens && SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN_AEM_ENG SLACK_USER_TOKEN=$SLACK_USER_TOKEN_AEM_ENG SLACK_TEAM_ID=$SLACK_TEAM_ID_AEM_ENG SLACK_DEFAULT_TOKEN=user exec node /Users/YOU/adobe-mcp-servers/src/slack/dist/index.js"]
    },
    "slack-adobedotcom": {
      "command": "bash",
      "args": ["-c", "source ~/.claude-tokens && SLACK_BOT_TOKEN=$SLACK_BOT_TOKEN_ADOBEDOTCOM SLACK_USER_TOKEN=$SLACK_USER_TOKEN_ADOBEDOTCOM SLACK_TEAM_ID=$SLACK_TEAM_ID_ADOBEDOTCOM SLACK_DEFAULT_TOKEN=user exec node /Users/YOU/adobe-mcp-servers/src/slack/dist/index.js"]
    }
  }
}
```

If `~/.claude.json` already has other content (it will if you've used Claude Code),
merge the `mcpServers` entries into the existing object -- don't replace the whole file.

**Critical**: `SLACK_DEFAULT_TOKEN=user` in the command makes read operations use the
user token, which has access to any channel you're in. Without it, reads use the bot
token, which requires the bot to be invited to every channel.
See "Slack MCP user token bug" in Lessons Learned.

Always pass `use_user_token: true` on outbound Slack messages so they come from you,
not the bot.

### How to manage MCPs

```bash
claude mcp add --transport http <name> <url>                    # Add HTTP server
claude mcp add --transport stdio <name> -- npx some-server       # Add local process
```

Scopes: `--scope local` (default, this project), `--scope project` (shared via .mcp.json),
`--scope user` (all projects).

Use `/mcp` in-session to enable/disable servers.

### Token cost of idle MCPs

MCPs use deferred tool loading -- idle MCPs only add their tool names to context, not
full schemas. The token cost of connected-but-unused MCPs is minimal. Disable via `/mcp`
only if you want a cleaner tool list, not for token savings.

### Disabling scope

Disabling via `/mcp` persists for that project only (saved to `~/.claude.json`).
To disable globally across all projects, disconnect from claude.ai.

### If you get stuck

`#easymcp-support`, `#guild-mcp` on Slack, or
`wiki.corp.adobe.com/spaces/ACPC/pages/3797455093`

---

## 7. Lookup Tools: Jira, Fluffyjaws, and Slack MCPs

Now that skills are installed (Section 3), tokens are set (Section 5), and MCP
servers are configured (Section 6), here's how the lookup tools work together.

Three overlapping tools. Each has strengths. Best results come from using them together.

### Jira Skill (jira-integration)

Precise ticket work. Can read AND write. Skill name: `jira-integration`, located at
`~/.claude/skills/jira-integration/`. Source repo: `OneAdobe/claude-workflow`.
Requires `JIRA_TOKEN` (Section 5) and Python 3 (pre-installed on macOS, or `brew install python3`).

```bash
# Get a ticket
python3 ~/.claude/skills/jira-integration/scripts/jira_query.py --issue MWPW-12345 --summary

# JQL query
python3 ~/.claude/skills/jira-integration/scripts/jira_query.py "project = MWPW AND status = 'In Progress'"

# Add a comment
python3 ~/.claude/skills/jira-integration/scripts/jira_comment.py MWPW-12345 "Comment text here"

# Create a ticket
python3 ~/.claude/skills/jira-integration/scripts/jira_create.py --summary "Title" --description "Details"
```

### Fluffyjaws

Discovery, docs, and broad semantic searches. Read-only. Auto-configured enterprise
MCP (Section 6).

Can: search Jira (semantic/fuzzy), search Slack archives (RAG-indexed), search
Wiki/Confluence, search HelpX, search Experience League.

**Limitations of Fluffyjaws Slack search**:
- RAG-indexed archive, not live Slack API -- can't look up specific threads by URL
- Selective channel coverage -- doesn't index all public channels
- Data freshness varies -- may be days or weeks behind
- Semantic search only -- no channel ID or timestamp lookups

**Fluffyjaws trust model**:
- Good for: discovery, surfacing relevant pages/channels, broad context
- Unreliable for: specific names, dates, numbers -- it can hallucinate plausible-sounding
  details that aren't in its source data
- Always cross-check specific claims against direct Slack MCPs or wiki before reporting

Good for: "has anyone ever discussed X?" Bad for: "read this specific thread" or
"who exactly is the PdM for project X?"

### Slack MCPs (slack-mwp, slack-aem-engineering, slack-adobedotcom)

Live Slack API access across three workspaces. Set up in Section 6. Fills the gaps
fluffyjaws can't cover -- and returns raw messages that are harder to misattribute
than fluffyjaws' summarized results.

9 read-only tools auto-allowed per workspace:
`list_channels`, `get_channel_history`, `get_thread_replies`, `search_messages`,
`get_users`, `get_user_profile`, `get_user_by_email`, `search_users`, `lookup_user`

### Confluence Wiki Skill (confluence-wiki)

Direct Confluence REST API access. Can read AND write wiki pages, create diagrams,
and attach files. Installed in Section 3. Requires `WIKI_TOKEN` (Section 5).

Scripts at `~/.claude/skills/confluence-wiki/scripts/`:
- `wiki_search.py` -- CQL search (`--query "text~'keyword'"` or `--title "Page Title"`)
- `wiki_get_page.py` -- Fetch page content by URL or page ID
- `wiki_create_page.py` -- Create new pages
- `wiki_attach_file.py` -- Attach files to pages
- `render_drawio.py` / `render_plantuml.py` -- Generate diagrams

**Fluffyjaws wiki search vs confluence-wiki**:
- Fluffyjaws: semantic/fuzzy search across wiki. Good for discovery ("has anyone written about X?")
- confluence-wiki: precise CQL queries, can read full page content, can write. Good for
  "read this specific page" or "create a wiki page for this design doc"

### When to use which

| Situation | Tool |
|-----------|------|
| Have a ticket number (MWPW-12345) | Jira skill |
| Need to create/update/comment on a ticket | Jira skill |
| Need docs or "how does X work at Adobe?" | Fluffyjaws |
| Broad "has anyone discussed X?" | Fluffyjaws first, then Slack MCPs to follow up |
| Read a specific wiki page | confluence-wiki (`wiki_get_page.py --url "..."`) |
| Create/update a wiki page | confluence-wiki |
| Specific Slack thread URL or channel | Slack MCP directly |
| Recent Slack conversations (last few days) | Slack MCPs (fluffyjaws may not have indexed yet) |
| Writing a PR, need ticket details | Jira skill |
| Writing a PR, need background context | Fluffyjaws + Slack MCPs |
| Quick factual lookup | One source is fine -- don't fan out |
| Deep research or "get me full context on X" | Fan out across fluffyjaws + all 3 Slack workspaces |
| Setting up Adobe internal tooling | Fluffyjaws first (wiki + slack), not generic web search |

### Research depth levels

Not every question needs all tools. Match the depth to the stakes:

- **Quick context** ("what is X?"): Fluffyjaws alone is fine. Fast, broad, good enough.
  One source, fast answer. Don't spin up 5 parallel searches for a simple question.
- **Detailed research or anything you'll act on**: Fan out across all sources in parallel:
  1. Fluffyjaws wiki search (semantic/fuzzy)
  2. Fluffyjaws Slack archive search (semantic/fuzzy)
  3. Fluffyjaws Jira search (semantic/fuzzy)
  4. confluence-wiki `wiki_search.py` (precise CQL -- catches exact titles Fluffyjaws misses)
  5. `slack_search_messages` on slack-mwp
  6. `slack_search_messages` on slack-aem-engineering
  7. `slack_search_messages` on slack-adobedotcom

  Then synthesize. If a ticket number surfaces, follow up with the Jira skill
  (`jira_query.py`) for the full ticket. Cross-check specific claims (names, dates,
  numbers) from fluffyjaws against direct sources before reporting -- fluffyjaws can
  hallucinate plausible details that aren't in its source data.

**Cache research results to save tokens.** Deep research fan-outs produce large
results that get reprocessed on every subsequent message. To avoid paying for that
repeatedly:

1. **Before researching**: check `/tmp/claude-research-*.md` for existing research on
   the same topic. If found, read it and ask "I found research on [topic] from
   [timestamp] -- use this or re-run?" Honor "re-research" or "fresh search" as
   explicit overrides.
2. **After researching**: write the synthesized results (not the raw search output) to
   `/tmp/claude-research-<topic-slug>.md` with a timestamp header.
3. **After writing**: suggest `/compact` to flush the raw search results from context.

This means follow-up questions about the same topic read a small file instead of
re-running 7 parallel searches. The files are in `/tmp` so they're automatically
cleaned up on reboot -- no accumulation.

**Why tiered?** Every parallel search consumes context window. A 7-source fan-out for
"what does this function do?" wastes context that you'll need later for the actual work.
Save the fan-out for questions where incomplete information has real consequences.

All read tools and Jira scripts are in the permissions allowlist

---

## 8. Rules

**This is the highest-leverage part of your Claude Code setup.** Rules encode how
your codebase actually works -- the patterns and conventions that live in engineers'
heads, not in docs. Without rules, Claude guesses. With rules, it follows your
project's real patterns from the start.

You cannot delegate rule-writing to Claude. Claude can help format them, but the
content must come from engineers who know *why* things are the way they are. One
afternoon of rule-writing by a senior engineer saves weeks of Claude producing
wrong patterns that juniors don't catch.

### What rules are

Rules are path-specific instructions. They activate only when Claude works with
files matching a glob pattern.

- **Skills** = multi-step workflows (do this, then this, then this)
- **Rules** = constraints (when working in this area, follow these patterns)

### Creating rules

```bash
mkdir -p .claude/rules
```

Create a markdown file with `paths` frontmatter:

```markdown
---
paths:
  - "src/components/**"
---

# Component Rules

1. Always use TypeScript
2. Export a default React component
3. Co-locate tests in __tests__/
```

### What's configured for milo

Seven rules covering the main areas of the milo codebase. These were built from three
independent sources: Milo Academy training materials, analysis of ~1450 PR review
comments across 272 merged PRs, and cross-referencing the Cursor IDE rules. Here's
what each contains and why it matters.

**milo-blocks** (`.claude/rules/milo-blocks.md`) -- `libs/blocks/**`:

The most important rule. The EDS `building-blocks` skill teaches Claude to use
`decorate()`. Milo uses `init()`. Without this rule, Claude generates the wrong
export pattern for every block. Also covers DOM creation (`createTag()`), CSS loading
(`loadStyle()`), import extensions, localization (placeholders), CSS conventions
(scoping, nesting, logical properties, tokens, no `!important`, no `@import`),
third-party deps, and a 17-point verification checklist.

**milo-code-style** (`.claude/rules/milo-code-style.md`) -- `libs/blocks/**` + `libs/features/**`:

JS code style patterns sourced from recurring PR review feedback. Shared between
blocks and features. Covers: early returns over nesting, redundant optional chaining,
explicit string checks (`=== 'true'` not truthiness), no `innerHTML` from external
content, no commented-out code, function names as verbs, boolean naming (`is*`/`has*`),
and the list of existing milo utilities to reuse before writing your own.

**milo-accessibility** (`.claude/rules/milo-accessibility.md`) -- `libs/blocks/**` + `libs/features/**`:

WCAG 2.1 AA compliance rules. Adobe.com accessibility bugs are P1 blockers. Covers:
heading hierarchy (no skipping levels), accessible names on interactive elements,
guarding against `aria-label="null"`, alt text on all images, keyboard navigation
(Tab/Enter/Space/Escape/Arrow), 44x44px touch targets, and preferring semantic HTML
over ARIA.

**milo-performance** (`.claude/rules/milo-performance.md`) -- `libs/blocks/**` + `libs/features/**`:

Performance rules with the E-L-D three-phase loading model that's core to how milo
works. Covers: Phase E/L/D definitions (100KB Phase E budget is sacred), parallelizing
independent awaits (`Promise.all`), dynamic imports for conditional code, lazy-loading
below-fold content, CLS prevention (await async work -- don't show content before it's
ready), LCP image handling, aspect ratios, observer lifecycle (always disconnect, scope
narrowly), `matchMedia` over resize, IntersectionObserver over setTimeout, passive
event listeners, and `requestAnimationFrame` for DOM measurements.

**milo-features** (`.claude/rules/milo-features.md`) -- `libs/features/**`:

Features differ from blocks. They export `default async function init(...)` with
varying signatures -- some receive a DOM element, some receive config objects, some
receive path strings. Unlike blocks, features load CSS via explicit path
construction, not `import.meta.url`.

**milo-tests** (`.claude/rules/milo-tests.md`) -- `test/**`:

Covers the milo test stack: Web Test Runner + Chai expect + Sinon stubs. Key patterns:
load tested module via dynamic import, DOM setup via `readFile()`, fixture organization,
test helpers (`delay`, `waitForElement`, `waitForRemoval`), test isolation (clean globals
between tests, rebuild DOM from fixtures per test, avoid real external URLs), and setup
deduplication (`beforeEach`/describe-level queries instead of repeating `querySelector`
in every test).

**milo-utils** (`.claude/rules/milo-utils.md`) -- `libs/utils/**`:

Safety rules for the most critical file in the repo (`utils.js` is 2700+ lines and
used everywhere):
- Search for all callers before modifying any function
- Never remove/rename exports without checking dependents
- Run full test suite (`npm test`), not single file tests

### Full rule file contents

Below is the complete content of each rule file. If you're setting up Claude Code for
a milo project, have Claude create these files in `.claude/rules/`. Each file is
self-contained and ready to copy.

<details>
<summary><strong>milo-blocks.md</strong> (click to expand)</summary>

````markdown
---
paths:
  - "libs/blocks/**"
---

# Milo Block Development Rules

These rules override generic EDS block patterns. Milo blocks differ from standard EDS blocks.

## Export Pattern

Milo blocks export `init`, not `decorate`:

```javascript
// CORRECT for milo
export default function init(block) { ... }

// WRONG -- this is generic EDS, not milo
export default async function decorate(block) { ... }
```

## DOM Creation

Use `createTag()` from utils, not `document.createElement()`:

```javascript
import { createTag } from '../../utils/utils.js';

// CORRECT
const div = createTag('div', { class: 'my-wrapper' });

// WRONG
const div = document.createElement('div');
div.className = 'my-wrapper';
```

## CSS Loading

Every block must load its own styles via `loadStyle()`:

```javascript
import { createTag, loadStyle } from '../../utils/utils.js';

export default function init(block) {
  loadStyle(import.meta.url);
  // ... block logic
}
```

## Import Extensions

All imports must include explicit `.js` extensions:

```javascript
// CORRECT
import { createTag } from '../../utils/utils.js';

// WRONG
import { createTag } from '../../utils/utils';
```

## Test File Required

Every block must have a corresponding test file at:
`test/blocks/<block-name>/<block-name>.test.js`

After creating or modifying a block, run:
```bash
npm run test:file -- test/blocks/<block-name>/<block-name>.test.js
```

## No Hardcoded User-Facing Strings

All user-visible text must come from placeholders, not hardcoded strings.
Milo fetches localized strings from `{contentRoot}/placeholders.json` — a
spreadsheet published as JSON with key/value pairs per locale.

```javascript
import { replaceKey } from '../../features/placeholders.js';
import { getConfig } from '../../utils/utils.js';

// CORRECT -- localized via placeholders
const config = getConfig();
const label = await replaceKey('share-this-page', config);

// CORRECT -- multiple keys at once
import { replaceKeyArray } from '../../features/placeholders.js';
const [closeText, searchText] = await replaceKeyArray(['close', 'search'], config);

// WRONG -- hardcoded English string
const label = 'Share this page';
```

Keys are kebab-case (`copy-to-clipboard`). If a key isn't found, the fallback
converts dashes to spaces (`copy to clipboard`), so choose descriptive keys.

## Use CSS Custom Properties (Design Tokens)

Use Milo's CSS variables for colors, spacing, and typography — not hardcoded
values. This ensures consistency across the design system:

```css
/* CORRECT */
color: var(--color-gray-700);
font-size: var(--type-body-m-size);

/* WRONG */
color: #4b4b4b;
font-size: 18px;
```

## Third-Party Dependencies

Store third-party libraries in the block's `/deps/` directory, not in
`node_modules`. Milo's production sites do not run `npm install` — deps
are committed directly so the site works without a build step.

Only load deps when the block actually needs them (conditional import):

```javascript
// CORRECT -- load dep only when content requires it
if (el.querySelector('.chart-data')) {
  const { Chart } = await import('./deps/chart.js');
  new Chart(canvas, chartConfig);
}
```

## Scope All CSS to the Block Class

Block CSS must be scoped to the block's class. Never write global selectors
that affect elements outside the block — this pollutes other blocks and pages:

```css
/* CORRECT -- scoped to block */
.my-block {
  & .title { font-weight: bold; }
  & .description { color: var(--text-color); }
}

/* WRONG -- global selector affects ALL .title elements everywhere */
.title { font-weight: bold; }

/* WRONG -- blocks don't style their parent sections */
.section { padding: 20px; }
```

## No `@import` in CSS

CSS `@import` blocks rendering. Use `loadStyle()` in JS to load additional
stylesheets dynamically instead:

```css
/* WRONG -- render-blocking */
@import url('additional-styles.css');
```

```javascript
// CORRECT -- non-blocking dynamic load
loadStyle(`${miloLibs || codeRoot}/blocks/tabs/tabs.css`);
```

## Never Use `!important`

`!important` is a code smell in Milo. It creates maintenance debt and signals
a specificity problem. Use CSS nesting or more specific selectors instead:

```css
/* WRONG */
.my-block .title {
  color: var(--color-gray-700) !important;
}

/* CORRECT -- use nesting for specificity */
.my-block {
  & .title {
    color: var(--color-gray-700);
  }
}
```

## Use CSS Nesting

Milo uses modern CSS nesting. Avoid repeating the parent class in every
selector — nest child selectors under the parent:

```css
/* WRONG -- repetitive flat selectors */
.my-block .title { font-size: var(--type-heading-m-size); }
.my-block .description { font-size: var(--type-body-m-size); }
.my-block .cta { margin-block-start: var(--spacing-s); }

/* CORRECT -- nested */
.my-block {
  & .title { font-size: var(--type-heading-m-size); }
  & .description { font-size: var(--type-body-m-size); }
  & .cta { margin-block-start: var(--spacing-s); }
}
```

## Use Logical CSS Properties for RTL

Adobe.com supports RTL languages. Use logical properties so layouts work
in both directions without separate RTL overrides:

```css
/* WRONG -- breaks in RTL */
margin-left: 16px;
margin-right: 24px;
text-align: left;
padding-left: 12px;
border-right: 1px solid;

/* CORRECT -- works in both LTR and RTL */
margin-inline-start: 16px;
margin-inline-end: 24px;
text-align: start;
padding-inline-start: 12px;
border-inline-end: 1px solid;
```

## Use Modern Media Query Range Syntax

Use the range syntax for media queries — this is the Milo convention:

```css
/* WRONG -- old syntax */
@media (min-width: 768px) and (max-width: 1279px) { }

/* CORRECT -- range syntax */
@media (768px <= width < 1280px) { }
@media (width >= 1200px) { }
```

## Use `:is()` to Consolidate Repetitive Selectors

When the same styles apply to multiple child elements, collapse with `:is()`:

```css
/* WRONG -- repetitive */
.my-block img,
.my-block video,
.my-block .milo-video {
  width: 100%;
}

/* CORRECT */
.my-block :is(img, video, .milo-video) {
  width: 100%;
}
```

## Verification Checklist

After building or modifying any block, verify:
1. Uses `init(block)` export (not `decorate`)
2. Uses `createTag()` for DOM creation (not `document.createElement`)
3. Calls `loadStyle(import.meta.url)` for CSS
4. All imports have `.js` extensions
5. No hardcoded user-facing strings (use `replaceKey()` from placeholders)
6. CSS scoped to block class — no global selectors
7. Uses CSS custom properties, not hardcoded color/spacing values
8. No `!important` — use nesting/specificity instead
9. No `@import` in CSS — use `loadStyle()` in JS
10. Uses logical CSS properties (`margin-inline-start`, not `margin-left`)
11. Uses CSS nesting and `:is()` where appropriate
12. No `innerHTML` from external content
13. Images have `alt` text and aspect ratios set
14. Interactive elements keyboard-accessible with touch targets >= 44px
15. Third-party deps committed in `/deps/`, not from `node_modules`
16. Test file exists and passes: `npm run test:file -- test/blocks/<name>/*.test.js`
17. Lint passes: `npm run lint:js -- libs/blocks/<name>/`
````

</details>

<details>
<summary><strong>milo-code-style.md</strong> (click to expand)</summary>

````markdown
---
paths:
  - "libs/blocks/**"
  - "libs/features/**"
---

# Milo JS Code Style

These patterns apply to all JS in blocks and features. Sourced from recurring
PR review feedback across 272 merged PRs (Oct 2025 – Apr 2026).

## Early Returns Over Nested Conditions

Prefer guard clauses that return early over deeply nested if/else blocks:

```javascript
// WRONG -- deep nesting
function decorateCard(el) {
  if (el) {
    const image = el.querySelector('img');
    if (image) {
      const src = image.getAttribute('src');
      if (src) {
        // ... actual logic buried 3 levels deep
      }
    }
  }
}

// CORRECT -- fail fast
function decorateCard(el) {
  if (!el) return;
  const image = el.querySelector('img');
  if (!image) return;
  const src = image.getAttribute('src');
  if (!src) return;
  // ... actual logic at top level
}
```

## Don't Over-Use Optional Chaining

After a null check confirms a value exists, don't add redundant `?.` on it.
Also, `el.dataset` always exists — no need for `el.dataset?.prop`:

```javascript
// WRONG -- el already confirmed non-null
if (!el) return;
el?.classList.add('active');

// WRONG -- dataset always exists on elements
el.dataset?.mepLingo;

// CORRECT
if (!el) return;
el.classList.add('active');
el.dataset.mepLingo;
```

## Check String Values Explicitly

Dataset attributes and env strings are always strings. Checking truthiness on
the string `'false'` evaluates to `true` — always compare explicitly:

```javascript
// WRONG -- 'false' is truthy, this is a bug
if (el.dataset.mepLingo) { ... }

// CORRECT
if (el.dataset.mepLingo === 'true') { ... }
```

## No `innerHTML` from External Content

Never set `innerHTML` with content from fetched data or user-generated sources.
Use `textContent` for plain text or `createTag()` for structured content:

```javascript
// WRONG -- XSS risk from external content
el.innerHTML = data.title;

// CORRECT
el.textContent = data.title;
```

## No Commented-Out Code

Remove dead code — don't comment it out. Git history preserves everything.
Commented code rots, confuses readers, and always gets flagged in review.

## Function Names Must Be Verbs

Name functions for what they do. A function that creates something should start
with `create`, one that checks state should start with `is`/`has`/`should`:

```javascript
// WRONG -- noun, unclear intent
function cardLayout(el) { ... }

// CORRECT -- verb, clear action
function decorateCard(el) { ... }
```

Boolean-returning functions must be named `is*`/`has*`/`should*` and must
actually return a boolean — not a string or object:

```javascript
// WRONG -- name says boolean, returns string
function isLingoSite() { return el.dataset.lingo; }

// CORRECT
function isLingoSite() { return el.dataset.lingo === 'true'; }
```

## Reuse Existing Milo Utilities

Before writing helper logic, check if Milo already provides it:

- `loadIms()` — wait for IMS/auth to be ready
- `createIntersectionObserver()` — lazy-load pattern
- `getMetadata(name)` — read page metadata
- `getConfig()` — access locale, env, paths
- `createTag(tag, attrs, content)` — DOM creation
- `loadStyle(path)` — load CSS
- `getCookie(name)` — read cookies (from `libs/martech/helpers.js`)
````

</details>

<details>
<summary><strong>milo-accessibility.md</strong> (click to expand)</summary>

````markdown
---
paths:
  - "libs/blocks/**"
  - "libs/features/**"
---

# Milo Accessibility Rules

Adobe.com must meet WCAG 2.1 AA standards. Accessibility bugs are P1 blockers.

## Heading Hierarchy Must Not Skip Levels

Headings must follow a logical hierarchy — don't skip from h1 to h3. Authors
control heading levels via their content, but blocks that create headings
must respect the hierarchy:

```javascript
// WRONG -- hardcoded heading level, skips hierarchy
const title = createTag('h3', null, data.title);

// CORRECT -- use decorateBlockText or let authors choose
// The block should accept whatever heading the author provides
const title = el.querySelector('h1, h2, h3, h4, h5, h6');
```

## Every Interactive Element Needs an Accessible Name

Buttons, links, and form controls must have visible text, `aria-label`, or
`aria-labelledby`. Icon-only buttons are a common miss:

```javascript
// WRONG -- icon button with no accessible name
const btn = createTag('button', { class: 'close-btn' });
btn.innerHTML = closeIconSvg;

// CORRECT
const btn = createTag('button', {
  class: 'close-btn',
  'aria-label': await replaceKey('close', config),
});
btn.innerHTML = closeIconSvg;
```

## Guard Against `aria-label="null"`

`getAttribute()` returns `null` for missing attributes. If you concatenate
or assign it, screen readers will announce the literal string "null":

```javascript
// WRONG -- if aria-label is missing, this sets "null"
el.setAttribute('aria-label', el.getAttribute('aria-label'));

// WRONG -- string coercion of null
const label = `${el.getAttribute('aria-label')} - details`;

// CORRECT -- guard with fallback
const label = el.getAttribute('aria-label') || '';
const combined = label ? `${label} - details` : 'details';
```

## All Images Must Have Alt Text

Every `<img>` needs an `alt` attribute. Decorative images get empty `alt=""`,
meaningful images get descriptive text:

```javascript
// WRONG -- no alt attribute
const img = createTag('img', { src: photoUrl });

// CORRECT -- meaningful image
const img = createTag('img', { src: photoUrl, alt: data.description });

// CORRECT -- decorative image
const img = createTag('img', { src: bgPattern, alt: '' });
```

## Keyboard Navigation Must Work

All interactive elements must be reachable and operable via keyboard:
- **Tab** moves between interactive elements
- **Enter/Space** activates buttons and links
- **Escape** closes dialogs/popups
- **Arrow keys** navigate within composite widgets (tabs, menus, carousels)

```javascript
// WRONG -- click-only interaction on a div
div.addEventListener('click', toggle);

// CORRECT -- keyboard accessible button
const btn = createTag('button', { class: 'toggle' });
btn.addEventListener('click', toggle);
// button element gets Enter/Space for free

// CORRECT -- if you must use a non-button element
div.setAttribute('role', 'button');
div.setAttribute('tabindex', '0');
div.addEventListener('click', toggle);
div.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    toggle();
  }
});
```

## Touch Targets Must Be at Least 44x44px

Interactive elements need a minimum touch target of 44x44 CSS pixels for
mobile accessibility (WCAG 2.5.5):

```css
/* CORRECT -- meets minimum touch target */
.my-block button,
.my-block a {
  min-width: 44px;
  min-height: 44px;
}

/* If the visual element is smaller, use padding to expand the hit area */
.my-block .icon-btn {
  padding: 12px; /* visual icon is 20px, total target = 44px */
}
```

## Use Semantic HTML Over ARIA When Possible

Native HTML elements carry built-in accessibility semantics. Prefer them
over `role` and `aria-*` on generic elements:

```javascript
// WRONG -- generic element with ARIA
const el = createTag('div', { role: 'button', tabindex: '0' });

// CORRECT -- native element
const el = createTag('button');

// WRONG -- div with role="list"
const list = createTag('div', { role: 'list' });

// CORRECT -- native list
const list = createTag('ul');
```
````

</details>

<details>
<summary><strong>milo-performance.md</strong> (click to expand)</summary>

````markdown
---
paths:
  - "libs/blocks/**"
  - "libs/features/**"
---

# Milo Performance Rules

Performance is critical. Milo powers adobe.com -- every unnecessary byte or
blocking await affects real page load times.

## Understand the E-L-D Loading Phases

Milo loads content in three phases. Know which phase your code runs in:

- **Phase E (Eager)**: First section only. Critical path to LCP. Must stay
  under **100KB total** (HTML + CSS + JS + images). Single origin only — no
  external CDN, font, or API connections. Target: LCP < 1.6s mobile.
- **Phase L (Lazy)**: Below-fold content. Same-origin. Use IntersectionObserver.
  Loads after LCP is painted.
- **Phase D (Delayed)**: Third-party scripts (analytics, chat, social embeds).
  Must wait **3+ seconds after LCP**. Never impacts Core Web Vitals.

```javascript
// Phase E -- first section, immediate
const isFirstSection = el.closest('.section') === document.querySelector('.section');
if (isFirstSection) {
  // Build LCP structure NOW, no awaits before DOM append
  el.append(buildHeroContent());
}

// Phase L -- below fold, lazy
if (!isFirstSection) {
  createIntersectionObserver({ el, callback: loadContent });
}

// Phase D -- third-party, delayed
setTimeout(() => {
  loadAnalytics();
  loadChatWidget();
}, 3000);
```

The 100KB Phase E budget is sacred. If your block is in the first section,
every byte counts. Measure with DevTools Network tab filtered to before LCP.

## Parallelize independent awaits

Never await two independent operations sequentially. Use `Promise.all()`:

```javascript
// WRONG -- second await waits for first to finish
const data = await fetchData(url);
const strings = await getCaasStrings(placeholderUrl);

// CORRECT
const [data, strings] = await Promise.all([
  fetchData(url),
  getCaasStrings(placeholderUrl),
]);
```

Load module JS and CSS in parallel:

```javascript
// CORRECT -- see global-navigation.js
const [{ default: Search }] = await Promise.all([
  import('./features/search/gnav-search.js'),
  loadStyles(rootPath('features/search/gnav-search.css')),
]);
```

When `loadStyle` uses a callback instead of a promise, wrap it:

```javascript
// CORRECT -- see georoutingv2.js
const [{ default: initTabs }] = await Promise.all([
  import('../../blocks/tabs/tabs.js'),
  new Promise((resolve) => {
    loadStyle(`${miloLibs || codeRoot}/blocks/tabs/tabs.css`, resolve);
  }),
]);
```

## Dynamic imports for conditional code

Do NOT statically import modules that are only used in certain conditions.
Use `await import()` so other code paths don't pay the cost:

```javascript
// WRONG -- personalization.js loaded even when mepFrag is falsy
import { handleFragmentCommand } from '../../features/personalization/personalization.js';
if (mepFrag) {
  relHref = handleFragmentCommand(mepFrag, a);
}

// CORRECT -- see fragment.js
if (mepFrag) {
  const { handleFragmentCommand } = await import('../../features/personalization/personalization.js');
  relHref = handleFragmentCommand(mepFrag, a);
}
```

Inside event handlers, import on interaction:

```javascript
// CORRECT -- see language-banner.js
banner.querySelector('.language-banner-link').addEventListener('click', async (e) => {
  e.preventDefault();
  const { setInternational } = await import('../../utils/utils.js');
  setInternational(market.prefix || 'us');
});
```

For imports that may or may not be needed, use the conditional promise pattern:

```javascript
// CORRECT -- see global-navigation.js
const asideJsPromise = getMetadata('gnav-promo-source')
  ? import('./features/aside/aside.js')
  : null;
// ... later, only await if started
if (asideJsPromise) {
  const { default: initAside } = await asideJsPromise;
}
```

## Lazy-load below-fold content

Use `createIntersectionObserver` from utils for content not visible on initial load:

```javascript
// CORRECT -- see caas.js
import { createIntersectionObserver } from '../../utils/utils.js';

export default async function init(el) {
  createIntersectionObserver({
    el,
    options: { rootMargin: '300px 0px' },
    callback: loadContent,
  });
}
```

## Avoid CLS from unawaited async work

Milo blocks naturally avoid CLS because content appears only after `init()`
completes. The danger is fire-and-forget async work that moves DOM content
around after the block is already visible:

```javascript
// WRONG -- async work modifies DOM after init() returns, causing layout shift
export default function init(el) {
  fetchData(url).then((data) => {
    el.querySelector('.content').textContent = data.title;
    el.append(buildCards(data));
  });
}

// CORRECT -- await async work so block content is ready before it's shown
export default async function init(el) {
  const data = await fetchData(url);
  el.querySelector('.content').textContent = data.title;
  el.append(buildCards(data));
}
```

Individual appends are fine -- the issue is not batching, it's showing content
before it's ready. If async work isn't awaited, the block renders incomplete
and then jumps when the async callback fires.

## LCP images must not be lazy-loaded

Milo automatically handles LCP (Largest Contentful Paint) for the first
section. Do NOT add `loading="lazy"` to images in LCP-critical blocks.

```javascript
// WRONG -- lazy-loading delays the LCP image
img.loading = 'lazy';

// CORRECT -- let Milo handle it (removes loading attr for LCP images)
// No loading attribute = browser loads immediately
```

In rare cases where a block is always the LCP element but Milo doesn't
automatically detect it, explicitly set eager loading and high fetch priority:

```javascript
// RARE -- only when you know this block is always LCP and Milo misses it
img.loading = 'eager';
img.fetchPriority = 'high';
```

## Set Aspect Ratios on Images to Prevent CLS

Always set dimensions or aspect ratios so the browser reserves space before
the image loads. Missing dimensions cause layout shift:

```css
/* CORRECT -- browser reserves space immediately */
.my-block img {
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
}

/* WRONG -- no dimensions, image pops in and shifts layout */
.my-block img {
  /* nothing — CLS when image loads */
}
```

## Always Disconnect Observers

IntersectionObserver, MutationObserver, and ResizeObserver cause memory leaks
if not disconnected. Always provide cleanup logic:

```javascript
// WRONG -- observer never disconnected
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) loadContent(entry.target);
  });
});
observer.observe(el);

// CORRECT -- disconnect after use
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      loadContent(entry.target);
      observer.unobserve(entry.target);
    }
  });
});
observer.observe(el);

// CORRECT -- for MutationObserver, disconnect when done
const mo = new MutationObserver((mutations) => {
  if (targetConditionMet(mutations)) {
    handleChange();
    mo.disconnect();
  }
});
```

## Scope Observers Narrowly

Never observe `document.body` or `main` with `subtree: true` — this fires
on every DOM change across the entire page and is extremely expensive:

```javascript
// WRONG -- observes ALL DOM mutations on the page
const mo = new MutationObserver(callback);
mo.observe(document.body, { childList: true, subtree: true });

// CORRECT -- observe only the specific container
mo.observe(el.querySelector('.dynamic-content'), { childList: true });
```

## Use `matchMedia` Over Resize Event Listeners

The `resize` event fires continuously during resize and is expensive. Use
`matchMedia` for responsive behavior changes:

```javascript
// WRONG -- fires on every pixel of resize
window.addEventListener('resize', () => {
  if (window.innerWidth < 768) switchToMobileLayout();
});

// CORRECT -- fires once at breakpoint crossing
const mq = window.matchMedia('(max-width: 767px)');
mq.addEventListener('change', (e) => {
  if (e.matches) switchToMobileLayout();
});
if (mq.matches) switchToMobileLayout();
```

## Use IntersectionObserver Over setTimeout for Deferred Work

Don't use `setTimeout` with arbitrary delays to wait for elements to be
visible or laid out — use IntersectionObserver instead:

```javascript
// WRONG -- arbitrary delay, unreliable
setTimeout(() => {
  const height = el.offsetHeight;
  adjustLayout(height);
}, 100);

// CORRECT -- fires when element is actually visible
const observer = new IntersectionObserver(([entry]) => {
  if (entry.isIntersecting) {
    adjustLayout(entry.target.offsetHeight);
    observer.disconnect();
  }
});
observer.observe(el);
```

## Use Passive Event Listeners for Scroll and Touch

Scroll and touch event listeners block the browser's compositor thread by
default. Mark them passive so the browser can scroll without waiting:

```javascript
// WRONG -- blocks scrolling until handler completes
el.addEventListener('scroll', handleScroll);
el.addEventListener('touchstart', handleTouch);

// CORRECT -- browser scrolls immediately, handler runs async
el.addEventListener('scroll', handleScroll, { passive: true });
el.addEventListener('touchstart', handleTouch, { passive: true });
el.addEventListener('touchmove', handleTouch, { passive: true });
```

Note: passive listeners cannot call `preventDefault()`. If you need to prevent
default behavior (e.g., preventing scroll on a custom slider), omit `passive`.

## Defer DOM Measurements

Use `requestAnimationFrame` to avoid layout thrashing when reading/writing
layout properties:

```javascript
// CORRECT -- see georoutingv2.js
requestAnimationFrame(() => {
  calcOverflow();
});
```
````

</details>

<details>
<summary><strong>milo-tests.md</strong> (click to expand)</summary>

````markdown
---
paths:
  - "test/**"
---

# Milo Testing Rules

Framework: Web Test Runner + Playwright (Chromium). Assertions: Chai expect. Mocking: Sinon.

## Test File Structure

```javascript
import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';
import { setConfig } from '../../../libs/utils/utils.js';

// Load fixture HTML at file level
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

// Dynamic import of the module under test
const { default: init } = await import('../../../libs/blocks/block-name/block-name.js');

describe('block-name', () => {
  it('should do something', async () => {
    const block = document.querySelector('.block-name');
    await init(block);
    expect(block.querySelector('.expected-element')).to.exist;
  });
});
```

## Key Patterns

**Load tested module via dynamic import** (not static import):
```javascript
const { default: init } = await import('../../../libs/blocks/name/name.js');
```

**DOM setup via readFile** (not string literals):
```javascript
document.body.innerHTML = await readFile({ path: './mocks/body.html' });
```

**Config setup when needed:**
```javascript
const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };
setConfig({ locales, miloLibs: 'http://localhost:2000/libs' });
```

**Fetch mocking with sinon:**
```javascript
sinon.stub(window, 'fetch').callsFake((url) => {
  if (url.includes('expected')) return Promise.resolve({ ok: true, json: () => mockData });
  return Promise.resolve({ ok: false });
});
```

**Cleanup with after/afterEach:**
```javascript
after(() => { sinon.restore(); });
```

## Fixture Organization

Mocks go in `test/<area>/<name>/mocks/`:
```
test/blocks/card/mocks/
  body.html          # Main test HTML fixture
  body-variant.html  # Variant for specific test cases
  data.json          # Mock API responses
```

## Available Test Helpers

From `test/helpers/waitfor.js`:
- `delay(ms)` -- Promise-based setTimeout
- `waitForElement(selector, options)` -- wait for DOM element
- `waitForRemoval(selector)` -- wait for element to disappear

From `@web/test-runner-commands`:
- `readFile({ path })` -- read fixture files
- `sendKeys({ press: 'Enter' })` -- simulate keyboard input
- `setViewport({ width: 375, height: 1500 })` -- responsive testing

## Assertions

Use Chai `expect` style:
```javascript
expect(element).to.exist;
expect(element).to.be.null;
expect(value).to.equal('expected');
expect(stub.calledOnce).to.be.true;
expect(classList.contains('active')).to.be.true;
```

## Test Isolation

Tests run in real browsers and share the global scope. Leaking state between
tests causes flaky CI failures and race conditions.

**Clean up window globals between tests:**
```javascript
afterEach(() => {
  sinon.restore();
  // Remove any globals your block sets
  delete window.gsap;
  // Remove injected scripts
  document.querySelectorAll('script[src*="third-party"]')
    .forEach((s) => s.remove());
});
```

**Don't reuse DOM objects across tests** — rebuild from fixtures:
```javascript
// WRONG -- DOM state leaks between tests
const block = document.querySelector('.my-block');

// CORRECT -- fresh DOM per test
beforeEach(async () => {
  document.body.innerHTML = await readFile({ path: './mocks/body.html' });
});
```

**Deduplicate test setup — use `beforeEach` or `describe`-level queries:**
```javascript
// WRONG -- same querySelector in every test
it('test 1', () => {
  const block = document.querySelector('.my-block');
  // ...
});
it('test 2', () => {
  const block = document.querySelector('.my-block');
  // ...
});

// CORRECT -- query once at describe level or in beforeEach
describe('my-block', () => {
  let block;
  beforeEach(async () => {
    document.body.innerHTML = await readFile({ path: './mocks/body.html' });
    block = document.querySelector('.my-block');
  });
  it('test 1', () => { /* use block */ });
  it('test 2', () => { /* use block */ });
});
```

**Avoid real external URLs in tests:**
```javascript
// WRONG -- 404s in CI, brittle
const img = createTag('img', { src: 'https://real-cdn.adobe.com/photo.jpg' });

// CORRECT -- use local fixtures or stub fetch
const img = createTag('img', { src: '/test/blocks/card/mocks/photo.png' });
```

## After Modifying Tests

```bash
npm run test:file -- test/blocks/<name>/<name>.test.js
```
````

</details>

The `milo-features.md` and `milo-utils.md` rules are shorter and project-specific.
Read them from `.claude/rules/` for the current content.

### Bootstrapping rules for a new developer

Have Claude read this guide, then tell it:

```
Read the rule file contents in Section 8 of claude-code-guide.md
and create each file in .claude/rules/. Skip any that already exist.
```

Claude will create all 7 files. The path-specific frontmatter means each rule
only activates when editing matching files -- zero cost otherwise.

### Why multiple rules matter

Without rules, Claude falls back to generic knowledge for each code area. With rules,
Claude knows that `libs/blocks/` uses `init()` while `libs/features/` uses varying
signatures. It knows that test fixtures use `readFile()` not string literals. It knows
that `libs/utils/` changes require full test suite runs. It knows that sequential
awaits and static imports for conditional code are performance bugs. It knows that CSS
must use nesting, logical properties, and design tokens. And it knows that accessibility
is a P1 requirement, not a nice-to-have.

Rules are passive -- zero cost until you edit in the matching path. But when they fire,
they prevent Claude from guessing wrong and producing code you have to correct.

### Rules and skills layer -- they don't conflict

The EDS building-blocks skill says `decorate()`. The milo-blocks rule says `init()`.
Claude reads both. The rule wins for `libs/blocks/**` because it's more specific.

If the EDS team updates their skills via `gh upskill`, your rules are unaffected --
they live in separate files.

Keep rules focused on conventions that differ from what Claude would do by default.
Don't restate generic best practices -- state what's specific to your project.

---

## 9. Hooks

Hooks are shell commands that run automatically when Claude does things. They're
configured in `settings.json`.

### How they work

1. An event fires (Claude edits a file, finishes responding, etc.)
2. A `matcher` filters which tool or event triggers the hook
3. The hook receives JSON on stdin with event details
4. Exit codes control behavior: `0` = allow, `2` = block (stderr shown to Claude)

### Hook events (common ones)

There are 20+ hook events. These are the ones you'll use most:

| Event | When | Use For |
|-------|------|---------|
| `SessionStart` | Session opens | Load env vars, show status |
| `PreToolUse` | Before a tool runs | Block dangerous commands |
| `PostToolUse` | After a tool succeeds | Auto-format, run lint |
| `Notification` | Claude waiting for input | Desktop notification |
| `Stop` | Claude finishes responding | Verify work |
| `CwdChanged` | Directory changes | Reload env (direnv) |

Others include `SessionEnd`, `SubagentStart`, `SubagentStop`, `PreCompact`,
`PostCompact`, `FileChanged`, and more. See the Claude Code docs for the full list.

### What's configured now

**Global** (`~/.claude/settings.json`):
- When Claude is waiting for input: shows a macOS notification via custom ClaudeNotify app. Clicking the notification switches to WebStorm (see Bonus section)
- Auto `eslint --fix` on any .js file Claude edits (PostToolUse)
- **Token file protection**: PreToolUse hook on `Read|Grep` blocks Claude from reading
  `~/.claude-tokens`. Exit code 2 means Claude sees an explicit error, not a silent
  failure. Bash deny rules (`cat`, `head`, `tail`, `less`, `grep`) add a second layer.

**Milo-specific** (`.claude/settings.local.json`):
- Warning when Claude tries to edit `libs/utils/utils.js` (PreToolUse, critical shared file)
- **Pre-commit lint gate**: runs `npm run lint` (JS + CSS) before any `git commit` and
  blocks the commit if lint fails (PreToolUse on Bash). Catches lint errors in 5 seconds
  instead of waiting for CI.
- **Auto stylelint on CSS files**: runs `npx stylelint --fix` on any .css file Claude
  edits (PostToolUse). Mirrors the JS eslint hook for CSS.

### Useful hook recipes

**Block pushes to main** (belt-and-suspenders with the deny rule in Section 10):
```json
{
  "PreToolUse": [{
    "matcher": "Bash",
    "hooks": [{
      "type": "command",
      "command": "cmd=$(cat | jq -r '.tool_input.command // empty'); if echo \"$cmd\" | grep -q 'git.*push.*main'; then echo 'BLOCKED: Never push directly to main' >&2; exit 2; fi; exit 0"
    }]
  }]
}
```

Note: this hook uses pattern matching and won't catch every push variation (e.g.,
`git push origin HEAD:main`). The deny rules in Section 10 are the primary safeguard.
This hook is a secondary layer.

**Inject JIRA context on session start** (reads ticket number from branch name):
```json
{
  "SessionStart": [{
    "matcher": "startup",
    "hooks": [{
      "type": "command",
      "command": "branch=$(git branch --show-current 2>/dev/null); if [[ \"$branch\" =~ MWPW-([0-9]+) ]]; then echo \"Current branch references JIRA ticket MWPW-${BASH_REMATCH[1]}.\"; fi"
    }]
  }]
}
```

---

## 10. Permissions

By default, Claude asks for approval before running tools. The permissions allowlist
lets you pre-approve safe operations so you aren't clicking "allow" constantly.

Set in `~/.claude/settings.json` (global, all projects).

### What runs without prompting

- **Read operations**: Read, Glob, Grep
- **Fluffyjaws tools**: all search, docs, investigation, and listing tools (25 tools total).
  Only `aem_agent_switch` and `generate_image` require approval (side effects).
- **Slack MCP read tools** (all 3 workspaces): list channels, history, threads, search, user lookups (9 tools x 3 workspaces)
- **Jira integration scripts** (read + append only): `jira_query.py`, `jira_activity.py`,
  `jira_sprint.py`, `jira_comment.py` (append-only), `jira_link.py` (additive)
- **Web search**: read-only
- **Read-only git**: status, diff, log, branch, show, fetch, stash
- **GitHub CLI**: `gh pr`, `gh api`
- **Directory listing**: `ls`, `which`
- **Tests and lint**: npm test, npm run lint, eslint

### What still requires approval

- `Edit` and `Write` (file modifications)
- `git commit`, `git push`, `git checkout`
- `rm` (deletions)
- **Jira write scripts**: `jira_create.py` (creates tickets), `jira_update.py` (modifies fields)
- Slack write operations (`post_message`, `reply_to_thread`, `add_reaction`, `send_dm`, `send_group_dm`)
- Fluffyjaws: `aem_agent_switch`, `generate_image`
- Other MCP write operations

### Deny rules -- hard blocks

Allow rules pre-approve safe operations. Deny rules HARD BLOCK dangerous ones.
The difference matters: CLAUDE.md rules are advisory (Claude follows them but can be
overridden by prompting). Deny rules are enforced at the tool level -- the operation
is blocked regardless of what anyone types.

Add deny rules to `~/.claude/settings.json`:

```json
{
  "permissions": {
    "deny": [
      "Bash(git push --force *)",
      "Bash(git push * --force)",
      "Bash(git push -f *)",
      "Bash(git push * -f)",
      "Bash(git push --force-with-lease *)",
      "Bash(git push * --force-with-lease)",
      "Bash(git reset --hard *)",
      "Bash(rm -rf *)",
      "Bash(rm -fr *)",
      "Bash(git push origin main)",
      "Bash(git push origin master)"
    ]
  }
}
```

These deny rules protect against:
- **Force push** -- including `-f` short flag and `--force-with-lease` (all destroy or
  rewrite remote history)
- **Hard reset** (destroys local uncommitted work)
- **rm -rf / rm -fr** (recursive delete with no confirmation, both flag orderings)
- **Push to main/master** (milo is a hot repo -- main goes straight to production)

These patterns use wildcards (`*`) which match any arguments. The space before `*`
matters: `Bash(rm -rf *)` matches `rm -rf /tmp` but not `rm-rf`. This list is
illustrative -- think about what destructive commands exist in your workflow and
add deny rules for them.

Deny rules go alongside your existing allow rules in the same `permissions` object.
Claude will see a clear error message when blocked, not a silent failure.

### Vibeproofing

**Vibeproofing** = mechanical checks that catch mistakes regardless of how confident
anyone feels about the code.

AI-accelerated development creates a failure mode: code that looks right and feels
right but breaks in production. The speed is intoxicating, the code reads well, and
validation steps get skipped because everything flows so smoothly.

This is what the pre-commit lint hook (Section 9) protects against -- it's a
mechanical gate that fires regardless of how confident you or Claude feel about the
code. Other vibeproofing patterns:

- **Hooks over discipline** -- don't rely on remembering to run lint. Make it automatic.
- **Tests over review** -- reading code and nodding is not validation. Running tests is.
- **CI as final gate** -- even if everything passes locally, CI catches env differences.
- **Never self-merge** -- another human should review AI-assisted PRs, especially if
  you didn't write most of the code yourself.

### Auto Mode

As of Claude Code v2.1.89, Auto Mode is available at Adobe. Start with:

```bash
claude --enable-auto-mode
```

Or cycle through permission modes with `Shift+Tab` during a session. Auto Mode
auto-approves most operations. You still own accountability for what Claude does.
Deny rules still apply in Auto Mode -- they can't be bypassed.

When in doubt, use Default Mode. More info: `#ai-secure-coding` on Slack.

---

## 11. Power User Techniques

### Two modes of working with Claude

There are two fundamentally different ways to use Claude Code. Knowing which one
you're in changes how you prompt, how much context you provide, and how you review.

**Directed mode** -- you drive, Claude assists. You know what to build and roughly
how. Claude writes the code, runs the tests, handles the mechanical parts. You review
each step. This is most of your daily work: bug fixes, feature tweaks, refactors.

**Autonomous mode** -- Claude drives, you review the output. You describe the outcome,
Claude plans the approach, executes multi-step workflows, and delivers a result. This
is skills like `/standup` or `/review-pr` -- you give a goal, Claude runs a
pipeline.

The mistake is using directed prompts in autonomous mode ("now do this, now do that")
or autonomous expectations in directed mode ("just build the whole feature"). Match the
mode to the task. Small targeted changes = directed. Multi-step pipelines with clear
inputs and outputs = autonomous.

### The blast radius rule -- when to let Claude drive

The higher the blast radius of a bug, the more human eyes should be on the code.
Claude can write the first draft of anything -- but for critical paths, you review
every line.

| Blast radius | Who drives | Examples |
|-------------|-----------|---------|
| Pages someone at 2 AM | You, Claude assists | `libs/utils/utils.js`, auth flows, shared infrastructure |
| Shows up in sprint review | Claude drives, you review lightly | New block, CSS fix, test coverage |

### Context management (the #1 skill)

Context is your most valuable resource. Every message reprocesses the FULL conversation
history. This is the most important thing to understand about how Claude Code works:
you're not paying per-message, you're paying per-message TIMES the accumulated context
size. A minimal "hello" in Claude Code consumes ~53k tokens before any conversation
starts (system prompt, tool definitions, CLAUDE.md chain).

This is why `/compact` and `/clear` matter -- they're not just convenience commands,
they directly control how much gets reprocessed on every interaction.

**The discipline:**
1. `/clear` before every new task. Don't carry stale context between tasks.
2. `/compact` every 15-20 messages or when you feel Claude slowing down.
3. Edit your prompt instead of sending corrections. Follow-ups waste context.
4. Batch related questions into one message.
5. Use Plan Mode for exploration -- it doesn't fill context with failed edits.
6. Ask "is this a good idea?" before implementing. Catching a bad approach early
   saves 10+ messages of wasted context.
7. Use `/btw` for side questions -- asks a quick question without adding it to the
   conversation. Good for "what's the syntax for X?" without bloating context.

| Command | When |
|---------|------|
| `/compact` | Mid-task, conversation getting long |
| `/compact [focus]` | Same, but tell Claude what to preserve (e.g., `/compact keep the test plan`) |
| `/clear` | Switching to different task |
| `/rewind` | Claude went wrong direction |

### Fast mode and effort level

**`/fast`** toggles fast mode -- 2.5x faster responses from the same model. No quality
difference, just lower latency at higher cost. Use for quick questions: "What does
this function do?", "Find usages of X". Toggle off for complex multi-step work.

**`/effort`** controls how many thinking tokens Claude spends before responding.
Higher effort = deeper reasoning but more tokens. Lower effort = faster and cheaper
but may miss nuance.

| Level | Use for |
|-------|---------|
| `max` | Hardest problems -- deep debugging, architecture (Opus only, current session only) |
| `high` | Complex debugging, multi-step reasoning (default) |
| `medium` | Routine coding, file edits, test writing. Good default for daily work. |
| `low` | Simple lookups, formatting, classification |
| `auto` | Reset to model default |

Switch mid-session: `/effort medium`. This is a direct cost lever -- `medium` can
meaningfully reduce token spend on routine tasks without noticeable quality loss.
`high`, `medium`, and `low` persist across sessions. `max` resets when you close.

### Daily workflows

These patterns tie your installed skills together for common day-to-day tasks.
You don't need to invoke skills explicitly -- just describe what you want.

**Starting your day:**
```
"Give me my standup -- what did I do yesterday and what's in progress?"
```
Claude uses the standup skill to pull JIRA activity and GitHub commits.

**Picking up work:**
```
"What's the next ticket I should work on?"
```
Claude uses work-next to find your highest-priority unstarted ticket, reads the
acceptance criteria, and proposes an approach.

**Small block changes (CSS tweak, bug fix):** just describe the change:
```
"The card block has a 2px gap between the image and title on mobile. Fix it."
```
Claude will read the block, find the issue, fix it, and run lint. No skill needed.

**Reviewing a PR:**
```
"Review PR #5781. Check for i18n implications."
```
Claude fetches the JIRA ticket from the PR description, reads the diff, checks for
i18n issues, and writes a review. The `feedback_pr_review_jira` memory ensures it
always pulls JIRA context automatically.

**Debugging a failing test:**
```
"The card block tests are failing. Debug it."
```
Or use `/debug-e2e` if it's a Playwright failure with a report to analyze.

**Research / architecture questions:**
```
"How does the localization framework handle link rewriting for federated pages?
Search everything -- wiki, Slack, code."
```
Claude fans out across Fluffyjaws, all three Slack MCPs, and the codebase in parallel,
then synthesizes.

**Sprint check-in:**
```
"Show me the sprint burndown."
```
Claude generates a burndown chart from JIRA data.

### Research and analysis skills

For decisions that need more than a quick answer, you have multi-perspective
analysis tools. Just describe what you need -- Claude picks the right approach.

```
"I need to decide between approach A and B for localizing dynamic content.
Research this thoroughly."
```

Under the hood, Claude can use:
- **/research** -- queries multiple AI models (Claude, OpenAI, Gemini, Perplexity)
  in parallel, has them critique each other's answers anonymously, then synthesizes.
  Best for factual questions with verifiable answers.
- **/socratize** (or /brainstorm) -- multi-perspective Socratic analysis. Creates
  agents with different viewpoints to debate. Best for design decisions with tradeoffs.
- **/concilize** -- combines both: personality-driven debate + multi-model fact-checking.
  Best for complex decisions that need both creative thinking and grounded facts.

**Note**: These multi-agent skills require the full claude-workflow installation
(clone + setup.sh, see Section 3) because they depend on shared agent definitions.
Installing them individually via `npx skills add` won't work.

You don't need to pick between these. Describe the problem and let Claude choose.
Or invoke explicitly when you know what kind of thinking you need.

### Parallel work and agent teams

Claude can spawn multiple agents working simultaneously. This happens automatically
when Claude decides parallel execution is faster, but you can also guide it.

**Subagents** (automatic): Claude spawns background workers for independent tasks.
When you ask "search for X across wiki, Slack, and code", Claude may send three
parallel searches instead of doing them sequentially.

**`/batch` mode**: For large tasks spanning many files. Claude asks clarifying
questions upfront, then parallelizes the work across isolated worktrees. Each
agent works on a separate piece and opens a PR. Useful for:
- Renaming a pattern across 20 files
- Adding tests for multiple untested blocks
- Applying a consistent fix across similar blocks

**`/branch`**: Fork your current session to try a different approach without
losing progress. If the branch fails, go back to the original.

**Writer/Reviewer pattern**: Two sessions for higher quality:
- Session 1 (Writer): "Implement X"
- Session 2 (Reviewer): "Review the code just added for X. Find edge cases."

Fresh context = no confirmation bias. The reviewer doesn't know what shortcuts
the writer took.

### Scheduled and recurring tasks

`/schedule` creates tasks that run automatically on a cron schedule. Two types:

- **Cloud tasks**: run on Anthropic infrastructure (no machine needed)
- **Desktop tasks**: run locally (access to your files and tools)

Practical uses:
```
"Schedule a daily standup summary at 9am on weekdays"
"Run a burndown report every Monday at 10am"
"Check my branch for lint errors every evening"
```

`/loop` is the in-session variant -- repeats a command on an interval:
```
/loop 5m "check if the CI pipeline passed for my latest push"
```

### Plan Mode

Use `/plan` to enter Plan Mode. Claude can read but not edit.

Use for: understanding a bug, designing an approach, getting analysis without
risking changes. This is also good for context management -- exploring in Plan
Mode doesn't create failed edit attempts that waste context.

Workflow: enter Plan Mode -> ask question -> review plan -> exit -> "Implement
the plan."

### Useful commands

| Command | Does |
|---------|------|
| `/clear` | Reset conversation |
| `/compact` | Compress to save context |
| `/fast` | Toggle fast mode (2.5x speed) |
| `/effort` | Set thinking depth (high/medium/low) |
| `/btw` | Side question -- never enters history |
| `/rewind` | Undo |
| `/branch` | Fork session to try different approach |
| `/batch` | Parallelize a large task across agents |
| `/schedule` | Create recurring automated tasks |
| `/loop` | Repeat a command on an interval |
| `/voice` | Speak to Claude (spacebar) |
| `/plan` | Enter Plan Mode (read-only) |
| `/cost` | Show current session token usage |
| `/mcp` | Manage MCP servers |
| `/doctor` | Diagnose setup issues |
| `/hooks` | Show active hooks |
| `/sessions` | Browse past session history |

### Non-interactive mode

```bash
claude -p "What does init do in libs/blocks/card/card.js?"
cat error.log | claude -p "What's causing this?"
claude --continue    # Resume last session
claude --resume      # Pick a session
claude --teleport    # Resume a web session in your local terminal
```

### Keybindings

Customize shortcuts in `~/.claude/keybindings.json`. Supports chord bindings
(e.g., `ctrl+k ctrl+s`) and context-specific actions (Chat, Global, Confirmation).

Use `/keybindings-help` to set them up. Useful if default shortcuts conflict
with WebStorm's terminal keybindings.

### Test coverage is a prerequisite, not a nice-to-have

AI-assisted development amplifies whatever quality level your codebase has. High test
coverage means Claude's changes get validated automatically -- tests catch mistakes
before they ship. Low coverage means mistakes go undetected and compound.

This matters because Claude makes changes confidently, even when wrong. Without tests,
you're manually reviewing every line for correctness. With tests, `npm test` does it.

Milo requires 100% patch coverage on PRs (CI enforces this). That's the right bar.
If you're working in an area with low existing coverage, consider writing tests first
before asking Claude to make changes -- the tests become your safety net for
everything Claude does afterward.

### Tips from Adobe Slack

1. Edit your prompt if you don't like the result. Don't send a follow-up.
2. Start fresh every 15-20 messages. Use `/compact` first.
3. Batch questions into one message.
4. If Claude keeps failing, ask it why. It'll analyze its own approach.
5. Ask "is this a good idea?" before implementing. Catching problems early saves context.
6. For complex tasks, start with "plan how you'd approach this" before implementing.

### Auto-Memory System

Claude Code has a persistent, file-based memory system. When Claude learns something
about you, your preferences, or project context during a session, it writes a memory
file that future sessions can reference. This is how Claude "remembers" you across
conversations.

#### Where memories live

```
~/.claude/projects/<encoded-project-path>/memory/
  MEMORY.md                              -- Index (loaded every session, ~150 char per entry)
  user_<yourname>_profile.md             -- Role, focus, communication style
  feedback_pr_review_jira.md             -- Auto-fetch JIRA context when reviewing PRs
  feedback_use_fluffyjaws.md             -- Tool selection: Jira skill vs fluffyjaws vs Slack MCPs
  feedback_slack_user_token.md           -- Always use_user_token: true on Slack sends
  feedback_use_tools_for_all_questions.md -- Search internal tools for ANY Adobe question
  feedback_follow_all_links.md           -- Follow all links in JIRA/Slack before starting work
  feedback_cache_research.md             -- Cache deep research to /tmp, check before re-running
  reference_confluence_wiki_skill.md     -- Use wiki skill for Confluence URLs
```

The project path is encoded in the directory name (e.g., `/Users/sukamat/Dev/vscode-workspace/milo`
becomes `-Users-sunil-dev-milo`). Memories are scoped to the project -- they don't
appear in other projects, and vice versa.

#### Memory types

| Type | Purpose | Example |
|------|---------|---------|
| `user` | Who you are, how you work | "Prefers direct, no-fluff communication" |
| `feedback` | Corrections and confirmed approaches | "Always use use_user_token: true" |
| `project` | Ongoing work context, decisions, deadlines | "Merge freeze begins 2026-03-05" |
| `reference` | Pointers to external resources | "Bugs tracked in Linear project X" |

#### What's stored now (Victor's setup -- adapt for your own)

**user_sunil_profile.md** (type: `user`) -- Role (Milo core developer), current focus
(Project Lingo), communication preferences (direct, no fluff), Claude Code proficiency
level.

**feedback_pr_review_jira.md** (type: `feedback`) -- When reviewing a PR, proactively
use fluffyjaws to look up the JIRA ticket from the PR description before starting the
review. **Why:** saves the user from reminding Claude each time. **How to apply:**
check PR description for `MWPW-*` ticket links, fetch details before reviewing.

**feedback_use_fluffyjaws.md** (type: `feedback`) -- Non-obvious lookup rules that
supplement the decision tree in `~/.claude/CLAUDE.md`. Covers the fluffyjaws trust
model (good for discovery, unreliable for specific names/dates/numbers -- cross-check
before reporting), Adobe-internal search priority (fluffyjaws first, never generic web
search), and the three Slack workspace names (slack-mwp, slack-aem-engineering,
slack-adobedotcom). Does NOT duplicate the full decision tree -- points to CLAUDE.md
as the single source.

**feedback_slack_user_token.md** (type: `feedback`) -- Always pass `use_user_token: true`
on any outbound Slack message so it comes from your account, not the bot user. **Why:**
bot token lacks access to many channels the user is in. User token means proper channel
access AND messages appear from you.

**feedback_use_tools_for_all_questions.md** (type: `feedback`) -- Use fluffyjaws, Slack
MCPs, and wiki search for ANY Adobe-related question -- not just code. Includes IT,
office infrastructure, printing, tooling, facilities. **Why:** generic troubleshooting
advice fails for Adobe-internal systems. Search first, advise second.

**feedback_follow_all_links.md** (type: `feedback`) -- When reading JIRA tickets or
Slack threads, follow and read ALL linked resources (wiki pages, other Slack threads,
docs, PRs). **Why:** links contain critical context (requirements, constraints,
decisions). Skipping them means missing information.

**feedback_cache_research.md** (type: `feedback`) -- Before running deep research
fan-outs (7+ parallel searches), check `/tmp/claude-research-*.md` for existing
research. After completing deep research, write synthesis to that path and suggest
`/compact`. **Why:** deep fan-outs produce 10-15k tokens of raw results. Caching the
synthesis and compacting means follow-ups read a small file instead of reprocessing.

**reference_confluence_wiki_skill.md** (type: `reference`) -- To read Confluence wiki
pages, use the `confluence-wiki` skill (`wiki_get_page.py --url "URL"`), not fluffyjaws
or WebFetch. The skill has a `WIKI_TOKEN` PAT for authentication.

#### Memory file format

Each memory file uses this frontmatter:

```markdown
---
name: Short descriptive name
description: One-line description (used to decide relevance)
type: user|feedback|project|reference
---

The memory content. For feedback/project types, structure as:

Rule or fact statement.

**Why:** The reason (often a past incident or strong preference).

**How to apply:** When/where this guidance kicks in.
```

`MEMORY.md` is just an index -- one line per entry under ~150 chars:
```markdown
- [Title](filename.md) — one-line hook
```

#### Bootstrapping memories for a new developer

You don't need to copy Sunil's memories verbatim -- they encode Sunil-specific
preferences and corrections. But several are team-wide patterns worth adapting:

**Recommended for all milo developers** (adapt the details):
1. **User profile** -- your role, areas of focus, communication style
2. **PR review JIRA lookup** -- auto-fetch ticket context when reviewing PRs
3. **Follow all links** -- read linked resources in JIRA/Slack before starting work
4. **Tool selection** -- which tools to use for which lookups (if you have the same MCPs)
5. **Cache research** -- write deep research to /tmp to avoid reprocessing

**Sunil-specific** (only if your setup matches):
- Slack user token preference (depends on your Slack MCP config)
- Confluence wiki skill reference (depends on having the skill installed)
- Use tools for all questions (depends on having fluffyjaws/Slack MCPs)

To bootstrap, tell Claude:
```
Read the memory templates in Section 11 of claude-code-guide.md
and create adapted versions for me. My name is [NAME], I work on [AREA],
and I prefer [COMMUNICATION STYLE].
```

Claude will create the memory directory, MEMORY.md index, and starter files.

#### Managing memories

- "Remember that X" -- Claude saves immediately as whichever type fits
- "Forget that X" -- Claude finds and removes the entry
- Edit memory files directly in your editor if you want to update them manually
- `MEMORY.md` index is loaded at session start; individual files are read when relevant
- Memories are point-in-time snapshots -- Claude verifies against current code before
  acting on stale claims

#### What NOT to save in memory

Memory is for things that can't be derived from code or git history:
- Code patterns and conventions (read the code)
- Git history and who-changed-what (use git log/blame)
- Things already in CLAUDE.md files (avoid duplication)
- Ephemeral task details (use tasks within a session instead)

#### Teaching Claude new behaviors via feedback memories

The most powerful memory type is `feedback`. When you correct Claude ("don't do X") or
confirm a non-obvious approach ("yes, that's exactly right"), Claude saves it so the
correction sticks across sessions. Examples:

- "Don't mock the database in tests" -> saved, applies to all future test work
- "Stop summarizing at the end of every response" -> saved, adjusts tone permanently
- "Yes, the single bundled PR was the right call" -> saved as a validated approach

This is how you train Claude to work the way you want without repeating yourself.

---

## 12. Lessons Learned

Things that came up during setup and are worth remembering.

### Don't duplicate instructions across config layers

Early setup had tool selection guidance duplicated in global CLAUDE.md, CLAUDE.local.md,
AND a memory file. Problems:
- When one was updated (e.g., adding a third Slack workspace), the others went stale
- Claude reads all layers -- if they conflict, it picks one unpredictably
- Maintenance burden scales with the number of copies

**Fix**: One source of truth per topic. Tool selection lives in global `~/.claude/CLAUDE.md`.
CLAUDE.local.md points to it instead of repeating it. Memory files only store the
non-obvious lessons (like the fluffyjaws trust model) that aren't in the config files.

**Rule of thumb**: If you're about to write the same instruction in two places, pick
the most appropriate one and reference it from the other.

### "Don't be lazy" doesn't work as an instruction

Vague instructions like "be thorough" are unactionable. Specific ones work:
- "Run lint after editing" -- Claude will do it
- "Read the full file before editing" -- prevents sloppy partial edits
- "No pseudocode, give working code" -- prevents shortcuts

### Tokens can leak through agents -- audit carefully

During an audit of the config setup, a subagent read `~/.claude.json` and printed
all 6 Slack tokens (bot + user for 3 workspaces) verbatim into the conversation.
`~/.zshrc` token values were also printed via a bash output. The fix:

1. Move all tokens to `~/.claude-tokens`. Use workspace-specific variable names for
   Slack so all 9 values can coexist (see Section 5).
2. Use a `bash -c "source ~/.claude-tokens && ..."` wrapper in `~/.claude.json` instead
   of hardcoding token values there (see Section 6).
3. Add a PreToolUse hook that blocks `Read|Grep` on `~/.claude-tokens` (see Section 9).
4. Add Bash deny rules for `cat`, `head`, `tail`, `less`, `grep` on the file (see Section 10).

**`chmod 600` doesn't protect from Claude.** Claude Code runs as your user, so it has
full read permission regardless of the permission bits. The hook is the actual
protection -- chmod is defense against other users on the machine only.

**`Read` deny rules in `settings.json` don't work** when there's a blanket `"Read"`
in the allow list. Deny rules block Bash command strings reliably, but for blocking
the `Read` tool on specific paths, a PreToolUse hook is required.

**After rotating tokens, `source ~/.claude-tokens` mid-session won't update env vars
for the current process.** The source runs in a subprocess. Workaround for testing:
prefix commands with `source ~/.claude-tokens && python3 ...`. For normal use, start
a new session.

### Env vars don't persist mid-session

Adding `export FOO=bar` to `~/.zshrc` and running `source ~/.zshrc` won't work in
the current Claude session. The source runs in a subprocess. Start a new session.

### Never let Claude display tokens

If you ask Claude to read a file with tokens, it'll show them. Check existence,
not values: `[ -n "$JIRA_TOKEN" ] && echo "set" || echo "not set"`. Even
`wc -c` leaks the token length -- avoid it.

### Slack MCP user token bug (fixed)

The Adobe Slack MCP server (`adobe-mcp-servers/src/slack`) had a bug where
`SLACK_DEFAULT_TOKEN` env var was never read. Read operations (get_channel_history,
get_thread_replies) always used the bot token, which requires the bot to be a member
of each channel. This meant Claude couldn't read any channel the bot hadn't been
explicitly invited to -- even public ones you're in.

**The fix** (3 lines in the server source):
1. `config.ts`: Add `defaultToken` to the `SlackConfig` type and read
   `SLACK_DEFAULT_TOKEN` env var in `createConfig()`
2. `utils.ts`: Change token selection to `options.useUserToken ?? (config.defaultToken === 'user')`
   so that `SLACK_DEFAULT_TOKEN=user` in the env config makes all operations use the user token

After fixing, rebuild: `cd ~/adobe-mcp-servers/src/slack && npm run build`

**Lesson**: When an MCP tool returns "not_in_channel" on a public channel, check
whether the server is using the bot token when it should be using the user token.
The config option might exist but not be wired up.

### Slack MCP search exposes DMs (fixed)

By default the Slack MCP server uses `search.messages` (legacy Slack API) with the
user token and the broad `search:read` scope. This causes search results to include
private DMs -- anything the authenticated user can see in Slack.

Several Adobe team wiki setup guides recommend adding `im:history`, `im:read`, `im:write`
scopes to user tokens. This is unnecessary and compounds the problem. The real issue is
`search:read` alone -- even without `im:*` scopes, it returns DM content via search.

**Important**: Removing scopes from the Slack app config and reinstalling does NOT revoke
existing tokens. You must explicitly revoke tokens in the Slack app settings (`api.slack.com/apps`
-> OAuth & Permissions -> Revoke), then reinstall to get fresh tokens.

**The fix**: Replaced `search.messages` with Slack's newer `assistant.search.context` API
in `operations/messages.ts`. Key properties of the new API:
- Supports granular `search:read.public` scope (public channels only) instead of broad `search:read`
- Accepts `channel_types: ['public_channel']` parameter for belt-and-suspenders restriction
- Does NOT require the bot to be a member of public channels to search them
- User token works without an `action_token` (unlike bot tokens with this API)

**Scopes after the fix**:
- User token: `channels:history`, `channels:read`, `chat:write`, `reactions:write`,
  `users:read`, `search:read.public`
- Bot token: `channels:history`, `channels:read`, `chat:write`, `reactions:write`,
  `users:read`
- Removed: `search:read`, `im:history`, `im:read`, `im:write`, `groups:*`, `mpim:*`

The fix is in a PR on `Adobe-AIFoundations/adobe-mcp-servers` (branch `vhargrave/search-public-channels-only`).
After merging (or pulling the branch), rebuild: `cd ~/adobe-mcp-servers/src/slack && npm run build`

### The "sample file trick" for migration

Giving Claude a reference output file dramatically improves migration quality.
Paolo Moz went from 20 min/page to 2 min/page partly because of this.

### MCP disabling is per-project

Disabling via `/mcp` saves to `~/.claude.json` under the project key. Other projects
still have the MCP enabled. Disconnect from claude.ai for global disable.

### Fluffyjaws can hallucinate -- cross-check before reporting

Fluffyjaws searches a RAG-indexed archive (not live APIs). It's great for discovery
but can fabricate plausible-sounding names, dates, and numbers that aren't in its
source data.

**Case study: Project Lingo research.** A fluffyjaws-only writeup contained 9
errors -- wrong PdM name (Roland Karl instead of Joel Blytt), fabricated people
(Olga Omeliukh), wrong dates (April 27 instead of May 2026), wrong numbers
(76 sites instead of 34 sitemaps), and wrong phase groupings. Cross-checking
against direct Slack MCPs and wiki caught every error.

**Rule**: For quick context, fluffyjaws alone is fine. For anything you'll share
or act on, cross-check against direct Slack MCPs and confluence-wiki.

### Claude won't follow links in JIRA/Slack unless you tell it to

When Claude reads a JIRA ticket or Slack thread containing links (wiki pages, other
Slack threads, docs), it won't automatically follow and read them. It treats the link
text as sufficient context, which it isn't -- the linked pages often contain the actual
requirements or decisions.

**What happened**: A JIRA ticket had two wiki URLs and a Slack thread URL in its
comments. Claude read the JIRA ticket and Slack thread but skipped the wiki pages.
When it found the wiki URLs, it tried `fluffyjaws` (RAG search, wrong tool) and
`WebFetch` (can't authenticate to Confluence), instead of the `confluence-wiki` skill
that was already available and had a PAT configured.

**Two fixes applied**:

1. **CLAUDE.md** -- Added explicit URL->tool mappings to the "When to use which" section:
   ```
   - See a wiki.corp.adobe.com URL? -> Confluence wiki skill
   - Links in JIRA comments or Slack threads? -> Follow ALL of them before starting work
   ```
   This eliminates ambiguity about which tool handles Confluence URLs.

2. **Memory** -- Saved two memory files:
   - `feedback_follow_all_links.md`: "When reading JIRA/Slack, follow and read ALL
     linked resources." Includes **Why** (Sunil expects full context gathering) and
     **How to apply** (parse all URLs after fetching a ticket or thread).
   - `reference_confluence_wiki_skill.md`: Maps `wiki.corp.adobe.com` URLs to the
     specific skill command (`wiki_get_page.py --url`). Explicitly says NOT to use
     fluffyjaws or WebFetch for these URLs.

**Why both?** CLAUDE.md is the authoritative instruction set -- it's loaded every
session and applies to all conversations. Memory reinforces it with context (why the
rule exists) and catches edge cases (what NOT to do). The CLAUDE.md rule is the
primary fix; the memory files are belt-and-suspenders.

**General principle**: When Claude fails to use the right tool, the fix is almost
always a missing or ambiguous mapping in CLAUDE.md. "Use tool X for Y" is
actionable; "be thorough" is not. After fixing the instruction, save a memory with
the failure context so Claude understands why the rule exists.

### Always search internally first for Adobe infrastructure

When setting up Adobe tools (MCPs, CI/CD, auth), search fluffyjaws wiki and slack
BEFORE going to generic web docs or npm. Adobe has internal systems, docs, and repos
(like `Adobe-AIFoundations/adobe-mcp-servers`) that won't appear in public searches.

### The page migration experiment (from Adobe Slack)

Paolo Moz migrated 25 pages of thompsonswaterseal.com to EDS using a custom slash command.

Key learnings:
1. Speed: 20 min for first page, eventually 2 min per page with the command
2. Give Claude a sample .md file to copy from (biggest quality improvement)
3. Batch import didn't work well
4. Collected refinement prompts into a reusable slash command

His commands: `github.com/paolomoz/thompsonswaterseal/blob/main/.claude/commands/migrate-eds-page.md`

---

## 13. Quick Reference

### Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Escape` | Stop Claude mid-action |
| `Shift+Tab` | Cycle permission modes |
| `Ctrl+O` | Toggle verbose transcript |
| `Ctrl+G` | Open prompt in external editor |

### File locations

| File | Purpose | Shared? |
|------|---------|---------|
| `~/.claude/CLAUDE.md` | Global preferences | No |
| `CLAUDE.md` | Project instructions | Yes (git) |
| `CLAUDE.local.md` | Personal project notes | No |
| `~/.claude/settings.json` | Global hooks + permissions | No |
| `.claude/settings.local.json` | Project hooks + permissions | No |
| `.claude/rules/*.md` | Path-specific rules | Yes (git) |
| `.claude/skills/*/SKILL.md` | Project skills | Yes (git) |
| `~/.claude/skills/*/SKILL.md` | Personal skills | No |
| `.skills/` | EDS skills (gh upskill) | Gitignored |
| `~/.claude.json` | MCP server config + disables | No |

### Token expiration

| Token | Expires | Renew at |
|-------|---------|----------|
| JIRA_TOKEN | 90 days from creation | `jira.corp.adobe.com/secure/ViewProfile.jspa` |
| WIKI_TOKEN | 90 days from creation | `wiki.corp.adobe.com/plugins/personalaccesstokens/usertokens.action` |

### Adobe resources

| Resource | Location |
|----------|----------|
| Skills Marketplace | `skills.awesome-sites.corp.adobe.com` |
| Claude at Adobe wiki | `wiki.corp.adobe.com/display/devplats/Claude+Code+At+Adobe` |
| Claude Enterprise wiki | `wiki.corp.adobe.com/display/devplats/Claude+Enterprise+At+Adobe` |
| AI Day for Builders | `aidayforbuilders.entapp.adproto.com` |
| Adobe MCP Servers repo | `github.com/Adobe-AIFoundations/adobe-mcp-servers` |
| MCP support Slack | `#easymcp-support`, `#guild-mcp` |
| Slack OAuth generator | `github.com/Adobe-DCMobile/slack-oauth-generator` |
| Auto Mode info | `#ai-secure-coding` Slack channel |

---

## 14. Appendix: Sunil's Setup Status

Everything below is Sunil's specific configuration (April 2026). Your setup will
differ -- this is a reference for what a complete setup looks like, not a prescription.

### Installed

| Component | Location |
|-----------|----------|
| Global CLAUDE.md | `~/.claude/CLAUDE.md` |
| Project CLAUDE.md | `~/dev/milo/CLAUDE.md` |
| Personal CLAUDE.local.md | `~/dev/milo/CLAUDE.local.md` |
| Global permissions + hooks | `~/.claude/settings.json` |
| Milo-specific hooks | `.claude/settings.local.json` |
| Milo rules (7 files: blocks, code-style, accessibility, performance, features, tests, utils) | `.claude/rules/` |
| claude-workflow (14 skills, 14 agents, 4 commands) | `~/dev/claude-workflow` -> `~/.claude/` (via setup.sh) |
| EDS skills (17 skills) | `.skills/` (via `gh upskill`) |
| JIRA_TOKEN, JIRA_BASE_URL, JIRA_PROJECT | `~/.claude-tokens` |
| WIKI_TOKEN | `~/.claude-tokens` |
| Slack tokens (9 values, 3 workspaces) | `~/.claude-tokens` |
| Slack MCP server build | `~/adobe-mcp-servers/src/slack/dist/` |
| Slack MCP server config (bash wrapper, no tokens) | `~/.claude.json` |
| Slack MCP permissions (9 read tools x 3 workspaces) | `~/.claude/settings.json` |
| Memory: user profile (core dev, Project Lingo) | Claude memory system |
| Memory: PR review auto-fetch JIRA | Claude memory system |
| Memory: tool selection (non-obvious rules, supplements CLAUDE.md) | Claude memory system |
| Memory: Slack user token preference | Claude memory system |
| Memory: Use tools for all Adobe questions | Claude memory system |
| Memory: Follow all links in JIRA/Slack | Claude memory system |
| Memory: Cache deep research | Claude memory system |
| Memory: Confluence wiki skill reference | Claude memory system |
| ClaudeNotify app (notification + click-to-activate) | `~/.claude/ClaudeNotify.app` |

### Not installed (and why)

| Component | Why |
|-----------|-----|
| Spectrum MCP | Milo uses vanilla CSS with Spectrum tokens, not React Spectrum. |

### Things that don't exist yet

- **Teams call transcription MCP** -- no one has built this. Workaround: download transcript, paste or pipe into Claude.
- **Milo-specific migration skill** -- EDS migration skills are generic. A milo-specific one could be built on page-import + milo-blocks rule.

---

## 15. Bonus: Custom Notification App

When Claude finishes a task and needs your attention, you get a native macOS
notification. Click it to switch to your IDE. No dock icon, no menu bar -- just
the notification.

### Install

```bash
git clone https://github.com/vhargrave/claude-notifier.git
cd claude-notifier
./install.sh
```

This compiles the Swift source, creates the app bundle at `~/.claude/ClaudeNotify.app`,
and ad-hoc code signs it (no Apple Developer account needed). Requires macOS 13+ and
Xcode Command Line Tools (`xcode-select --install`).

### Configure Claude Code

Add this to `~/.claude/settings.json`:

```json
{
  "Notification": [{
    "matcher": "",
    "hooks": [{
      "type": "command",
      "command": "open ~/.claude/ClaudeNotify.app"
    }]
  }]
}
```

On first launch, macOS will ask for notification permission. Check
**System Settings > Notifications > ClaudeNotify** is set to **Banners** or
**Alerts**, not None.

### Change the target IDE

By default, clicking the notification activates WebStorm. Set `CLAUDE_NOTIFY_IDE`
to change it:

```json
"command": "CLAUDE_NOTIFY_IDE=com.microsoft.VSCode open ~/.claude/ClaudeNotify.app"
```

Common bundle identifiers:

| IDE | Bundle ID |
|-----|-----------|
| WebStorm | `com.jetbrains.WebStorm` |
| IntelliJ IDEA | `com.jetbrains.intellij` |
| VS Code | `com.microsoft.VSCode` |
| Cursor | `com.todesktop.230313mzl4w4u92` |

Find yours with: `osascript -e 'id of app "YourAppName"'`

### Why not terminal-notifier?

`terminal-notifier` hasn't been updated since 2020. On macOS Tahoe (26), its
`-activate` and `-execute` action flags silently break notification delivery --
notifications either don't appear, or appear but clicking does nothing.

### How it works

macOS `UNUserNotificationCenter` requires an app bundle -- a standalone binary can't
post notifications. ClaudeNotify is a minimal Swift app that posts a notification,
stays alive 30 seconds to handle clicks, then exits. `LSBackgroundOnly` + `LSUIElement`
in Info.plist means no dock icon or menu bar.

### Rebuilding after changes

```bash
cd claude-notifier && ./install.sh
```
