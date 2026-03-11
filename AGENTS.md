# Agent Instructions

## Versioning Workflow

- This plugin uses Semantic Versioning for all tracked changes: `MAJOR.MINOR.PATCH`.
- Before making persistent file changes, decide whether the task requires a version bump.
- Use `MAJOR` for breaking changes to plugin behavior, commands, settings, or data compatibility.
- Use `MINOR` for backward-compatible features or meaningful capability additions.
- Use `PATCH` for backward-compatible fixes, refactors, tests, build/config updates, docs, and other non-breaking maintenance work.
- If a task is exploratory only or produces no persistent repo changes, do not bump the version.

## Files To Keep In Sync

- Update the same version in `manifest.json`, `package.json`, and `package-lock.json`.
- In `package-lock.json`, update both the top-level `version` field and `packages[""].version`.

## Changelog Workflow

- Update `CHANGELOG.md` as part of the same task where the version is bumped.
- Add the newest entry at the top using `## [x.y.z] - YYYY-MM-DD`.
- Use concise bullets under one or more of: `Added`, `Changed`, `Fixed`, `Removed`.
- Write changelog bullets in user-facing language that summarizes the reason for the change, not low-level implementation details.

## Prompt Execution Rule

- Complete the version bump and changelog update before finishing the task so the repo state always matches the work that was done.
- If the user explicitly instructs otherwise, follow the user's instruction and note that the normal versioning workflow was skipped.
- If a commit is requested for a versioned change, mention the new version in the commit message summary or body.
