#!/usr/bin/env bash
# PreToolUse hook: block direct git commits to main, and pushes targeting main/master.
# Wired up via settings.json with `if: "Bash(git commit *)"` and `if: "Bash(git push *)"`,
# so this script only runs when those specific commands are about to execute.
# Receives JSON on stdin per Claude Code hook spec.
# Exit 0 = allow. Exit 2 = block (stderr surfaced to Claude as the reason).

set -euo pipefail

input="$(cat)"
command="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"

# Block: git commit on main/master
if [[ "$command" == *"git commit"* ]]; then
  if [[ "$branch" == "main" || "$branch" == "master" ]]; then
    >&2 echo "Blocked: direct commit to '$branch' is not allowed."
    >&2 echo "Create a feature branch first: git switch -c <name>"
    exit 2
  fi
fi

# Block: git push targeting main/master explicitly
if [[ "$command" == *"git push"* ]]; then
  if [[ "$command" == *" main"* || "$command" == *" master"* ]]; then
    >&2 echo "Blocked: push to main/master detected. Open a PR instead."
    exit 2
  fi
fi

exit 0
