# Donna Follow-Up Workflow

<objective>
Capture a follow-up task with a future due date, resolve relative time expressions to concrete dates, store in donna/follow-ups.md, and commit via donna-tools.cjs.
</objective>

<step name="init">
Run via Bash:
```bash
INIT=$(node ~/.donna/donna-tools.cjs init)
```

Parse the JSON response. If the `error` field is `"not_configured"`, print:
```
x Donna is not configured. Run /donna:setup first.
```
Stop.

Extract `storage_repo`, `daily_folder`, `auto_push` from the JSON.

If `update_available` is non-null, print:
```
Donna v<update_available> available -- run npx @pingvinen/donna-assistant to update
```
Continue normally.
</step>

<step name="parse-input">
The argument is the full user text (e.g., "/donna:follow-up remind team about Q3 planning in 2 months").

**If an argument was provided:**
Use language understanding to extract two things from the argument:
1. `<description>`: The task description (everything that is not a time expression)
2. `<due_expression>`: A time expression (e.g., "in 2 months", "on 2026-09-15", "next Tuesday", "in 3 weeks") — or null if no time expression is found

Examples:
- "remind team about Q3 planning in 2 months" → description: "remind team about Q3 planning", due_expression: "in 2 months"
- "call dentist on 2026-09-15" → description: "call dentist", due_expression: "on 2026-09-15"
- "review the design doc" → description: "review the design doc", due_expression: null
- "/donna:follow-up schedule 1:1 with Sarah next Tuesday at 2pm" → description: "schedule 1:1 with Sarah", due_expression: "next Tuesday"

**If no argument was provided:**
Use AskUserQuestion to ask two questions:

First question:
```
What task would you like to schedule?
```
Store the free-text response as `<description>`.

Second question:
```
When is it due? (e.g. "in 2 months", "on 2026-09-15", or leave blank for today)
```
Store the free-text response as `<due_expression>`. If the user leaves it blank or says "today", set `<due_expression>` to null.

CRITICAL: Use free-text input mode for both questions — do NOT use a picker with predefined options.
</step>

<step name="resolve-date">
Three cases for resolving the due date:

**Case 1: due_expression is null**
Use today's date. Run via Bash:
```bash
node -e "const d=new Date();const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const dd=String(d.getDate()).padStart(2,'0');console.log(y+'-'+m+'-'+dd)"
```
Store the output as `<due_date>`.

**Case 2: due_expression matches YYYY-MM-DD format**
Extract the YYYY-MM-DD part from the expression (strip any leading words like "on"). Store directly as `<due_date>`.

**Case 3: due_expression is a relative expression**
The agent parses the natural language expression into structured {value, unit} pairs:
- "in 2 months" → months: 2
- "in 3 weeks" → weeks: 3
- "in 2 weeks and 3 days" → weeks: 2, days: 3
- "in 1 month and 2 weeks" → months: 1, weeks: 2
- "in 2 months and 5 days" → months: 2, days: 5
- "next Tuesday" → next occurrence of Tuesday from today (count days until the next Tuesday)
- "tomorrow" → days: 1
- "in 5 days" → days: 5

Inject the arithmetic into a Bash node -e command. Command template:
```bash
node -e "
const d = new Date();
<apply setMonth first: d.setMonth(d.getMonth() + N)>
<apply setDate next: d.setDate(d.getDate() + N)>
<apply setFullYear last: d.setFullYear(d.getFullYear() + N)>
const yyyy = d.getFullYear();
const mm = String(d.getMonth() + 1).padStart(2, '0');
const dd = String(d.getDate()).padStart(2, '0');
console.log(yyyy + '-' + mm + '-' + dd);
"
```

Example for "in 2 months and 5 days":
```bash
node -e "const d=new Date();d.setMonth(d.getMonth()+2);d.setDate(d.getDate()+5);const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const dd=String(d.getDate()).padStart(2,'0');console.log(y+'-'+m+'-'+dd)"
```

Example for "in 3 weeks":
```bash
node -e "const d=new Date();d.setDate(d.getDate()+21);const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const dd=String(d.getDate()).padStart(2,'0');console.log(y+'-'+m+'-'+dd)"
```

CRITICAL: Always use local date component extraction (`getFullYear()`, `getMonth() + 1`, `getDate()`) with padding. NEVER use `toISOString()` — it returns UTC which can produce off-by-one dates for users in timezones ahead of UTC.

If the resolved date is NaN or invalid (check by verifying the output matches YYYY-MM-DD format), fall back to today's date (re-run Case 1).

Store the output as `<due_date>`.
</step>

<step name="ensure-file">
Check if `<storage_repo>/donna/follow-ups.md` exists. Use the Read tool to attempt reading it.

If the file does not exist (Read tool returns an error), create it with the Write tool using this content:
```markdown
---
created: <today>
---

## Follow-ups
```
Where `<today>` is today's date in YYYY-MM-DD format.

If the file already exists, continue to the next step.
</step>

<step name="append-entry">
Read `<storage_repo>/donna/follow-ups.md` with the Read tool.

Append the follow-up entry on a new line at the end of the file:
```
- [ ] <description> | due: <due_date>
```

Write the updated file back with the Write tool.
</step>

<step name="git-commit">
Run via Bash:
```bash
node ~/.donna/donna-tools.cjs commit "donna(follow-up): <description>" --files donna/follow-ups.md
```
</step>

<step name="confirm">
Print:
```
✓ Follow-up scheduled: <description> (due: <due_date>)
```
</step>