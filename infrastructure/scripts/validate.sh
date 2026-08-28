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
  az deployment sub what-if \
    --location "${AZURE_LOCATION:-swedencentral}" \
    --template-file infrastructure/bicep/main.bicep \
    --parameters infrastructure/bicep/environments/${ENVIRONMENT}.bicepparam
  exit 0
fi

if [ "$MODE" = "--deploy" ]; then
  az deployment sub create \
    --location "${AZURE_LOCATION:-swedencentral}" \
    --name "kairos-${ENVIRONMENT}-$(date -u +%Y%m%d%H%M%S)" \
    --template-file infrastructure/bicep/main.bicep \
    --parameters infrastructure/bicep/environments/${ENVIRONMENT}.bicepparam
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
  while IFS= read -r file; do
    az bicep build-params --file "$file"
  done < <(find infrastructure -name '*.bicepparam' | sort)
else
  echo "No Kairos Bicep files found; validation is limited to guard tests."
fi

if [ "$MODE" = "--lint-only" ]; then
  echo "Kairos Azure lint validation completed."
fi
