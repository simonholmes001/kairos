#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

FORBIDDEN_PATTERNS=(
  "Microsoft.ApiManagement/"
  "Microsoft.Cdn/profiles"
  "Microsoft.SignalRService/WebPubSub"
  "Microsoft.Cache/Redis"
  "Microsoft.Kusto/"
  "Microsoft.EventHub/"
  "Microsoft.Search/searchServices"
)

FOUND=0
while IFS= read -r file; do
  for pattern in "${FORBIDDEN_PATTERNS[@]}"; do
    if grep -q "$pattern" "$file"; then
      echo "::error file=$file::Deferred Azure service found: $pattern"
      FOUND=1
    fi
  done
done < <(find infrastructure -type f \( -name '*.bicep' -o -name '*.bicepparam' -o -name '*.json' \) | sort)

if find . -path './.git' -prune -o -path './ios/KairosApp/.build' -prune -o -type d -name web -print -quit | grep -q .; then
  echo "::error::MVP architecture forbids an active web/ application path."
  FOUND=1
fi

if [ "$FOUND" -ne 0 ]; then
  exit 1
fi

echo "Kairos infrastructure guard tests passed."
