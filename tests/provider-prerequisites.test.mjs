import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const manifestPath = join(new URL("..", import.meta.url).pathname, "docs/setup/provider-prerequisites.json");
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

test("provider manifest has required setup guardrails", () => {
  assert.equal(manifest.policy.noSecretValuesInRepository, true);
  assert.equal(manifest.policy.paidSubscriptionsRequireIssueLinkedApproval, true);
  assert.equal(manifest.policy.paperAndLiveBrokerCredentialsMustBeSeparated, true);
});

test("provider manifest records required pre-implementation providers", () => {
  const required = manifest.providers
    .filter((provider) => provider.requiredBeforeImplementation)
    .map((provider) => provider.name)
    .sort();

  assert.deepEqual(required, [
    "Alpaca",
    "Azure",
    "CoinGecko",
    "FRED",
    "Massive",
    "SEC EDGAR"
  ]);
});

test("provider manifest does not contain obvious secret values", () => {
  const forbiddenValuePattern = /(api[_-]?key|secret|token)\s*[:=]\s*['"]?[A-Za-z0-9_\-.]{12,}/i;
  const raw = readFileSync(manifestPath, "utf8");
  assert.equal(forbiddenValuePattern.test(raw), false);
});
