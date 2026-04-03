# Contributing to Donna

Thanks for your interest in contributing! This guide covers local setup, project structure, and how to add new skills.



## Prerequisites

- Node.js 18+
- An AI coding assistant (tested with [Claude Code](https://docs.anthropic.com/en/docs/claude-code))



## How to test

Make sure the scripts can actually run

```bash
npm install
```

Make your machine use the tool directly from the development repo

```bash
npm link
```

`donna-assistant` is now available globally on your machine so you can test changes end-to-end.

Run the installer and force it to skip the "is the version already installed"-check.

```bash
donna-assistant --force
```

**Claude**: To pick up newly added skills, you will have to restart your session

You can now fool around with the `/donna:` skills to test them out.



## How to develop new things

Donna uses the [GSD planning framework](https://github.com/gsd-build/get-shit-done) for all development, so you should familiarize with how that works. At the time of writing, it is being very actively developed, so this documentation here is kept light on purpose, so that it _hopefully_ stays true for longer.

**Note** that we do all planning etc. on the `main` branch. Only the actual execution runs in a new branch which is merged with a PR.

If you have something that should be done at some point, you add it with `/gsd:add-todo`.

If you want to help out and _get shit done_, you can do something like:

1. `/gsd:add-phase`
2. Follow the conversation to pick the pending todos that should be part of that phase

GSD is pretty good at telling you what the next steps are, so just follow those!

Note that **it is important to run the verification and UAT steps** (there is a PR gate that checks this).


### GSD deviation

GSD revolves around _milestones_, which seem to be what drives releases and versions etc. That is **not how we do it**.

We work from a backlog (the todos) and ship when enough value has accumulated. Releases happen organically. Archive completed phase artifacts periodically for context hygiene, not as milestone ceremony.

This repo contains instructions in `CLAUDE.md` which should make it possible to have Claude do the creation of branches, PRs etc.
