# Donna Setup Workflow

<objective>
Display the Donna installation status and confirm the stub-to-workflow pipeline is working.
</objective>

<steps>

1. Print the DONNA banner:
   ```
   ━━━ DONNA ▸ Setup ━━━
   ```

2. Read `~/.donna/version.md` and display the installed version. If the file exists, show:
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

3. Print the following message:
   ```
   This is a stub -- real setup coming in Phase 2.
   ```

4. Print next steps:
   ```
   Next steps:
     - Run /donna:setup again after upgrading to see new features
     - Phase 2 will add role configuration, storage setup, and more
   ```

</steps>
