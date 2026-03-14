# Donna Setup Workflow

<objective>
Display the Donna installation status and confirm the stub-to-workflow pipeline is working.
</objective>

<step name="banner">
Print the DONNA banner:
```
━━━ DONNA ▸ Setup ━━━
```
</step>

<step name="version">
Read `~/.donna/version.md` and display the installed version. If the file exists, show:
```
Version: {version}
Installed: {installed date}
Last updated: {updated date}
```
If the file does not exist, show:
```
No version file found. Donna may not be installed correctly.
Try running: npx @pingvinen/donna-assistant
```
</step>

<step name="status">
Print the following message:
```
This is a stub -- real setup coming in Phase 2.
```
</step>

<step name="next">
Print next steps:
```
Next steps:
  - Run /donna:setup again after upgrading to see new features
  - Phase 2 will add role configuration, storage setup, and more
```
</step>
