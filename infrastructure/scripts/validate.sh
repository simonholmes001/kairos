#!/usr/bin/env bash
set -euo pipefail

ENVIRONMENT="${1:-dev}"
MODE="${2:-}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

case "$ENVIRONMENT" in
  dev)
    ;;
  *)
    echo "Unsupported environment: $ENVIRONMENT" >&2
    exit 2
    ;;
esac

bash ./infrastructure/scripts/guard-tests.sh

if [ "$MODE" = "--what-if" ]; then
  echo "No Kairos Azure resources are defined yet; what-if is intentionally empty."
  exit 0
fi

if [ "$MODE" != "" ] && [ "$MODE" != "--lint-only" ]; then
  echo "Unsupported validation mode: $MODE" >&2
  exit 2
fi

if find infrastructure -name '*.bicep' -print -quit | grep -q .; then
  while IFS= read -r file; do
    az bicep build --file "$file"
  done < <(find infrastructure -name '*.bicep' | sort)
else
  echo "No Kairos Bicep files found; validation is limited to guard tests."
fi
