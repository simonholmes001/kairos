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
  "Microsoft.Web/sites"
  "Microsoft.App/containerApps"
  "Microsoft.ServiceBus/"
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

if find infrastructure -name '*.bicep' -print -quit | grep -q .; then
  REQUIRED_PATTERNS=(
    "Microsoft.Network/privateEndpoints"
    "Microsoft.Network/privateDnsZones"
    "Microsoft.KeyVault/vaults"
    "Microsoft.Storage/storageAccounts"
    "publicNetworkAccess: 'Disabled'"
    "Microsoft.Consumption/budgets"
  )

  for pattern in "${REQUIRED_PATTERNS[@]}"; do
    if ! grep -R -q "$pattern" infrastructure/**/*.bicep infrastructure/*.bicep 2>/dev/null; then
      echo "::error::Required private/cost baseline pattern missing: $pattern"
      FOUND=1
    fi
  done
fi

if find . -path './.git' -prune -o -path './ios/KairosApp/.build' -prune -o -type d -name web -print -quit | grep -q .; then
  echo "::error::MVP architecture forbids an active web/ application path."
  FOUND=1
fi

if [ "$FOUND" -ne 0 ]; then
  exit 1
fi

echo "Kairos infrastructure guard tests passed."
