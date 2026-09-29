# Protocol: Git Workflow & Branching Strategy

## 1. Overview & Objective
This protocol defines the strict branching model, synchronization standards, and Pull Request (PR) lifecycle for the repository. Standardizing Git operations ensures stability, clear release tracking, and regression prevention.

## 2. Branch Hierarchy
* `main`: Production branch. Highly protected. Under no circumstances should feature or fix branches merge directly into `main`.
* `dev`: Development target branch. All agentic development targets `dev`. Features and bug fixes are integrated into `dev` first.
* `feature/<feature-name>` or `fix/<fix-name>`: Working branches branched from up-to-date `dev`.

## 3. Standard Operating Procedure (SOP) Before Modifying Code
Before any agent creates or modifies files, the following procedure must be strictly executed:

```bash
git status
git checkout dev
git pull origin dev
git checkout -b <branch_name>
```
* Example branch names: `feature/modular-agent-roles`, `fix/team-balance-algorithm`.

## 4. Pull Request (PR) Process
* All Pull Requests MUST target the `dev` branch (`gh pr create --base dev --fill`).
* Feature and fix branches must NEVER target `main` directly.
* A PR should only be opened by the **Document Writer** role after the **Code Reviewer** has issued an `[APPROVED]` verdict in `4_review.md`.
* PR creation command:
  ```bash
  gh pr create --base dev --fill
  ```

## 5. Parallel & Concurrent Execution
* If parallel tasks or independent agents need to work in parallel on separate branches, use Git worktrees:
  ```bash
  git worktree add <path> <branch>
  ```
* Worktrees allow clean directory separation without branch conflicts or dirty working trees.
