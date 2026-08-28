import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const policy = JSON.parse(readFileSync(join(root, "infrastructure/finops/policy.json"), "utf8"));
const bicep = readFileSync(join(root, "infrastructure/bicep/main.bicep"), "utf8");
const devParams = readFileSync(join(root, "infrastructure/bicep/environments/dev.bicepparam"), "utf8");

test("FinOps policy defines budget, tags, SKUs, and circuit breakers", () => {
  assert.equal(policy.environments.dev.monthlyBudget, 50);
  assert.ok(policy.environments.dev.requiredTags.includes("shutdownPolicy"));
  assert.ok(policy.allowedBaselineSkus.storage.includes("Standard_LRS"));
  assert.equal(policy.circuitBreakers.maxWorkflowCostUsd, 5);
});

test("Bicep baseline includes required tags from FinOps policy", () => {
  for (const tag of policy.environments.dev.requiredTags) {
    assert.equal(bicep.includes(`${tag}:`), true, `main.bicep is missing tag ${tag}`);
  }
});

test("deferred services in FinOps policy are blocked by architecture guard", () => {
  for (const service of policy.deferredServices) {
    assert.equal(bicep.includes(service), false, `${service} must not appear in baseline Bicep`);
  }
});

test("deployment parameters do not contain placeholder budget recipients", () => {
  assert.equal(devParams.includes("replace-with"), false);
  assert.equal(devParams.includes("example.com"), false);
  assert.equal(devParams.includes("budgetAlertEmails"), true);
});
