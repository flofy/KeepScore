# github-safe-edit

## Purpose

This skill defines the mandatory workflow for making repository changes safely, especially when changes are committed through GitHub APIs or other remote-editing tools.

The goal is to prevent partial-file commits, accidental truncation, duplicated declarations, unrelated deletions, and commits that have not been validated.

## Mandatory workflow

Before every code commit:

1. **Inspect the current branch state**
   - Confirm the target branch and base branch.
   - Never assume the working tree or remote branch still matches an earlier tool result.
   - If the change is for a pull request, work from the PR head branch and keep the PR base explicit.

2. **Read the complete current file before editing**
   - Fetch every file that will be modified from the exact branch being changed.
   - Do not reconstruct a file from a snippet, search result, stale conversation context, or memory.
   - For large files, use a reliable full-file retrieval method rather than editing from an excerpt.

3. **Make the smallest possible change**
   - Prefer targeted edits over full-file replacement.
   - Preserve all unrelated content, formatting, imports, exports, tests, and surrounding behavior.
   - Do not rewrite a whole file when the requested change affects only a small section.
   - If a full rewrite is genuinely required, first capture the complete current file and verify that the replacement preserves unrelated content.

4. **Re-read the complete modified file**
   - After generating the change, fetch/read the resulting file from the branch again.
   - Check that the file is complete and structurally coherent.
   - Specifically look for:
     - duplicated declarations;
     - duplicated imports;
     - missing closing braces/tags;
     - malformed JSX/TS/CSS;
     - accidentally removed functions, exports, styles, or tests;
     - suspiciously large deletions;
     - truncated files.

5. **Inspect the diff before committing**
   - Compare the branch against its intended base or previous commit.
   - Review every changed file.
   - Treat unexpected deletions as a blocking issue.
   - If a change is supposed to be local but the diff removes or rewrites unrelated sections, stop and fix it before committing.
   - Do not rationalize an unexpected diff as harmless without inspecting the affected source.

6. **Validate before pushing**
   - Run the repository's existing formatting, linting, type-checking, tests, build, and unused-code checks when available.
   - Use the repository's package-manager commands and existing scripts rather than inventing alternatives.
   - If local execution is unavailable, state that explicitly and rely on CI only after it has actually run.

7. **Commit only validated changes**
   - Use a focused commit message.
   - Do not combine unrelated fixes merely to get CI green.
   - Never commit a known-broken intermediate state just because another change is expected to fix it later.

8. **Verify CI after pushing**
   - Check the actual workflow run for the pushed commit.
   - Do not claim that CI is green until the relevant checks have completed successfully.
   - If CI fails, inspect the failure first and fix the root cause before making additional unrelated changes.

## GitHub-specific safety rules

- Never edit `main` directly when the repository workflow requires pull requests.
- Create or reuse the appropriate feature/fix branch.
- Before updating an existing file through a GitHub contents API, fetch its current blob/content and use the current SHA.
- Never send partial file content to a full-file update operation.
- If a tool requires complete file content, provide complete file content.
- When several files are related, update them deliberately and verify each one.
- After each remote file update, treat the returned commit as a new source of truth; do not continue from an older copy of the file.
- When a conflict or concurrent update is detected, refresh the branch and rebase/reconcile mentally before editing again.

## Diff-risk heuristics

A change requires extra inspection when any of these are true:

- a file is much shorter after the change;
- a file has a large deletion count compared with the requested change;
- a CSS file loses many unrelated selectors;
- a TS/TSX file loses exports, components, hooks, or tests;
- imports disappear without an obvious reason;
- multiple identical declarations appear;
- generated/configuration files change unexpectedly;
- a change touches more files than the request requires.

These heuristics are warnings, not permission to ignore the diff. Unexpected changes must be understood before commit.

## Recovery rule

If a bad partial commit has already been made:

1. Stop adding unrelated changes.
2. Inspect the failing CI check and exact changed files.
3. Compare the affected files with the branch base.
4. Restore lost content from the correct base/current branch where appropriate.
5. Reapply only the intended change.
6. Re-read and diff the repaired files.
7. Re-run validation.
8. Push the repair and verify CI.

## KeepScore-specific expectations

For `flofy/KeepScore`:

- Preserve the existing PR-driven workflow.
- Treat `main` as protected.
- Existing CI is the validation authority; do not add redundant CI merely to compensate for unsafe editing.
- Keep UI/style changes minimal because `src/styles.css` contains broad application styling.
- Treat `src/features/game/GameScreen.tsx`, UI hooks, tests, and shared styles as high-risk files: always inspect the complete file and resulting diff.
- Existing Oxfmt/formatting, lint, Vitest, build, and Knip checks should be used rather than recreated.
- Do not declare a PR ready solely because the source looks plausible; verify the actual GitHub checks.

## Non-negotiable rule

**No commit without: current-file read -> targeted edit -> complete-file re-read -> diff inspection -> validation.**

If any step cannot be performed reliably, stop before committing and explain what information or access is missing.
