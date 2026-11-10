#!/usr/bin/env bash
# PostToolUse hook: corre ESLint (--fix) sobre el archivo escrito/editado.
file=$(jq -r '.tool_input.file_path // empty')
[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0

case "$file" in
  *.js|*.jsx|*.ts|*.tsx|*.mjs|*.cjs) ;;
  *) exit 0 ;;
esac

case "$file" in
  */references/*|*/.next/*|*/node_modules/*|*/out/*|*/build/*) exit 0 ;;
esac

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
out=$(npx eslint --fix --no-warn-ignored "$file" 2>&1)
status=$?
if [ $status -ne 0 ]; then
  echo "$out" >&2
  exit 2
fi
exit 0
