# Donna Contribute Idea Workflow

<objective>
Help users submit feature ideas or bug reports by checking for duplicates against existing GitHub Issues and the project's pending todos, then creating a new issue if the idea is novel.
</objective>

<step name="banner">
Print the Donna banner:
```
━━━ Donna ▸ Contribute Idea ━━━
```
</step>

<step name="check-gh-auth">
Run via Bash:
```bash
gh auth status 2>&1
```

If the exit code is non-zero, print:
```
✗ The gh CLI is not authenticated. Run 'gh auth login' first, then re-run /donna:contribute-idea.
```
Stop.
</step>

<step name="ask-idea">
Use AskUserQuestion:

```
What's your idea or bug report?

Describe it in a few sentences — I'll check if something similar already exists before creating an issue.
```

Store the response as `<user_idea>`.
</step>

<step name="check-duplicates">
Check two sources for potential duplicates.

**Source 1: GitHub Issues**

Run via Bash:
```bash
gh issue list --repo pingvinen/donna --state open --json number,title,url --limit 100
```

Parse the JSON output. Compare each issue title against `<user_idea>` using semantic similarity — judge whether the idea meaningfully overlaps with an existing issue. Do not use brittle substring matching.

**Source 2: GSD pending todos from STATE.md on GitHub**

Run via Bash:
```bash
gh api repos/pingvinen/donna/contents/.planning/STATE.md --jq '.content | @base64d'
```

Parse the `### Pending Todos` section from the decoded content. Each bullet is a pending todo. Compare each todo against `<user_idea>` using semantic similarity.

**If either source has a potential match**, present the match(es) to the user:

```
I found something similar:

[For GitHub Issue match:]
→ Issue #<number>: <title>
  <url>
  You can upvote or comment on this issue instead of creating a new one.

[For pending todo match:]
→ Pending todo: "<todo text>"
  This is already tracked internally.
```

Then use AskUserQuestion:
```
Would you like to:
1. Create a new issue anyway (it's different enough)
2. Skip — the existing one covers my idea
```

If the user chooses option 2, print:
```
✓ Thanks for checking! The existing item covers this.
```
Stop.

If no duplicates are found, proceed to the create-issue step.
</step>

<step name="create-issue">
Help the user create a well-formed GitHub Issue.

Draft a suggested title and body based on `<user_idea>`. Use AskUserQuestion:

```
Let me help you write up the issue. Here's what I've drafted based on your idea:

Title: <suggested title based on user_idea>

Body:
<suggested body with description, context, and expected behavior>

Would you like to:
1. Submit as-is
2. Edit the title or body first
3. Cancel
```

Handle each option:

- **Option 1 (submit as-is):** Run via Bash:
  ```bash
  gh issue create --repo pingvinen/donna --title "<title>" --body "<body>"
  ```
  Print the resulting issue URL with a success message:
  ```
  ✓ Issue created: <url>
  ```

- **Option 2 (edit):** Use AskUserQuestion to collect edits from the user. Re-present the updated draft and repeat until the user chooses to submit or cancel.

- **Option 3 (cancel):** Print:
  ```
  Issue cancelled.
  ```
  Stop.
</step>
