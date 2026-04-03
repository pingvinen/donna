# Donna Remove-Tool Workflow

<objective>
Remove a registered tool from tools.md cleanly — confirm with the user, delete the tool's section, and commit.
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

<step name="read-tools-md">
Read `<storage_repo>/donna/tools.md` with the Read tool. If the file does not exist or has no tool sections, print:
```
! No tools registered. Nothing to remove.
```
Stop.

Parse each tool section (starting with `## <tool_name>`). For each tool, extract `type`, `command`, `scope`, and the capabilities list.

Store as `<registered_tools>`.
</step>

<step name="select-tool">
If a tool name was provided as argument (e.g., `/donna:remove-tool gh`), look it up in `<registered_tools>`. If not found, print `! Tool "<name>" not found in tools.md` and stop.

If no argument was provided, list all registered tools via AskUserQuestion:
```
Which tool would you like to remove?

<numbered list of tool names with their type>
```
Store the selected tool as `<selected_tool>`.
</step>

<step name="confirm-removal">
Display the tool's current configuration summary:
```
About to remove <tool_name>:

  type:         <type>
  command:      <command>
  scope:        <scope>
  capabilities: <count> registered

This will delete the tool's entire section from tools.md.
```

Use AskUserQuestion:
```
Remove <tool_name>? (yes/no)
```

If no, print `Cancelled.` and stop.
</step>

<step name="remove-from-tools-md">
Read `<storage_repo>/donna/tools.md`. Remove the entire `## <tool_name>` section (from the `## <tool_name>` heading up to but not including the next `## ` heading, or end of file). Preserve all other tool sections unchanged. Write the full file back with the Write tool.

If no tool sections remain after removal, write the file with just the frontmatter header (preserve any existing frontmatter).
</step>

<step name="git-commit">
Run via Bash:
```bash
node ~/.donna/donna-tools.cjs commit "donna(remove-tool): removed <tool_name>" --files donna/tools.md
```
</step>

<step name="confirm">
Print:
```
! Removed <tool_name> from tools.md

To re-add with a different configuration: /donna:add-tool <tool_name>
```
</step>
