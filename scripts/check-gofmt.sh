#!/bin/sh
# Verify that all tracked Go files are gofmt-clean.
# Exits non-zero with a list of offending files when something needs formatting.
set -eu

# Limit the scan to source directories we own; avoid node_modules and build outputs.
PATHS="main.go internal scripts build"

# gofmt -l prints the names of files that would change. Empty output = clean.
output=$(gofmt -l $PATHS 2>/dev/null || true)

if [ -n "$output" ]; then
  echo "The following Go files are not gofmt-clean:"
  printf '  %s\n' $output
  echo
  echo "Fix with: npm run go:fmt"
  exit 1
fi
