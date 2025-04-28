# Graphite Commands Reference for AI-Assisted Git Workflow

This document focuses on essential commands for managing git workflows with Graphite, particularly for creating, modifying, and submitting PRs.

## Stack Management

### Creating and Modifying Branches

- **`gt create [name]`**: Create a new branch stacked on current branch
  - `-a, --all`: Stage all unstaged changes (including untracked files)
  - `-m, --message`: Specify a commit message
  - `--ai`: Auto-generate branch name and commit message using AI

- **`gt modify`**: Modify current branch by amending or creating a new commit
  - `-a, --all`: Stage all changes
  - `-c, --commit`: Create a new commit instead of amending
  - `-m, --message`: New commit message
  - `-e, --edit`: Open editor to edit commit message

- **`gt absorb`**: Intelligently amend staged changes to relevant commits in the stack
  - `-a, --all`: Stage all unstaged changes before absorbing

### Branch Navigation

- **`gt checkout [branch]`**: Switch branches (opens selector if no branch provided)
  - `-s, --stack`: Show only ancestors and descendants of current branch

- **`gt up [steps]`**: Move to child branch (prompts if multiple children)
  - `-n, --steps`: Number of levels to move upstack

- **`gt down [steps]`**: Move to parent branch
  - `-n, --steps`: Number of levels to move downstack

- **`gt top`**: Switch to the tip branch of current stack

- **`gt bottom`**: Switch to the branch closest to trunk in current stack

### Branch Operations

- **`gt restack`**: Ensure proper parent-child relationships in stack
  - `--upstack`: Only restack current branch and descendants
  - `--downstack`: Only restack current branch and ancestors

- **`gt move`**: Rebase current branch onto a different base
  - `-o, --onto`: Branch to move current branch onto

- **`gt rename [name]`**: Rename the current branch

- **`gt delete [name]`**: Delete a branch (children are restacked onto parent)
  - `-f, --force`: Delete even if not merged/closed

- **`gt fold`**: Combine a branch's changes with its parent

- **`gt squash`**: Squash all commits in current branch into a single commit

## Pull Request Management

### Submitting PRs

- **`gt submit`**: Push branches and create/update PRs for each branch
  - `-s, --stack`: Submit descendants of current branch too
  - `-e, --edit`: Edit metadata for all PRs
  - `--ai`: Auto-generate PR titles and descriptions
  - `-d, --draft`: Create PRs in draft mode
  - `-r, --reviewers`: Set reviewers (comma-separated or prompts)
  - `-v, --view`: Open PR in browser after submitting
  - `--dry-run`: Preview what would be submitted without making changes

### Common Flags for `gt submit`

- `--edit-title`: Only edit PR titles
- `--edit-description`: Only edit PR descriptions
- `-m, --merge-when-ready`: Mark PRs to auto-merge when requirements are met
- `-p, --publish`: Publish all draft PRs being submitted
- `--rerequest-review`: Rerequest review from current reviewers

## Syncing and Remote Operations

- **`gt get [branch]`**: Sync branches from remote (defaults to current stack)
  - `-f, --force`: Overwrite local branches with remote version

- **`gt sync`**: Sync all branches with remote, prompting to delete merged/closed PRs

## Visualization and Information

- **`gt log`**: Show tracked branches and dependencies (standard view)
  - `gt log short`: Compact view of branches (alias: `gt ls`)
  - `gt log long`: Show graph of commit ancestry (alias: `gt ll`)
  - `-s, --stack`: Only show current stack

- **`gt info [branch]`**: Show branch information
  - `-b, --body`: Show PR body
  - `-d, --diff`: Show diff between branch and parent

- **`gt pr [branch]`**: Open the PR page for a branch
  - `--stack`: Open the stack page instead

## Conflict Resolution

- **`gt continue`**: Continue a Graphite command halted by conflicts
  - `-a, --all`: Stage all changes before continuing

- **`gt abort`**: Abort the current Graphite command halted by conflicts

## Authentication

- **`gt auth`**: Add auth token to enable creating/updating PRs
  - `-t, --token`: Auth token (from https://app.graphite.dev/activate)

## Complete Workflow Example

```
# Create a new branch with changes
gt create my-feature -m "Implement new feature"

# Make additional changes on a child branch
gt create my-feature-refinement -m "Refine the feature"

# Fix something in the parent branch
gt down
gt modify -m "Fix bug in feature"

# Submit entire stack as PRs
gt submit --stack --edit

# Later, sync with remote changes
gt get

# Navigate the stack to check status
gt top
gt info
gt down
gt info

# Add requested changes and update PRs
gt modify -a -m "Address review comments"
gt submit

# Once merged, sync to clean up
gt sync
```

## Essential Options for AI Tools

When building AI tools to interact with Graphite:

1. Use `--ai` flags where available for automatic generation of branch names, commit messages, and PR descriptions
2. Use `--dry-run` to preview changes before executing
3. For automation, use the non-interactive flags (`--no-interactive`, `--force`) when appropriate
4. Use `gt info` to gather context about the current state
5. Prefer `gt submit --stack` for submitting complete feature stacks

Remember that Graphite maintains its own metadata to track branch relationships, which is essential for proper stack management.