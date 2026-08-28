import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const contractDirs = [
  join(root, "backend/contracts/domain"),
  join(root, "backend/contracts/auth")
];

const requiredContracts = new Set([
  "decision-record.schema.json",
  "domain-event.schema.json",
  "analysis.schema.json",
  "command.schema.json",
  "fill.schema.json",
  "instrument.schema.json",
  "ledger-entry.schema.json",
  "market-data-point.schema.json",
  "operator-auth-boundary.schema.json",
  "order.schema.json",
  "portfolio.schema.json",
  "position.schema.json",
  "proposed-trade.schema.json",
  "provenance.schema.json",
  "risk-decision.schema.json",
  "strategy.schema.json"
]);

function readContracts() {
  return contractDirs.flatMap((dir) =>
    readdirSync(dir)
      .filter((name) => name.endsWith(".schema.json"))
      .map((name) => ({ name, path: join(dir, name), schema: JSON.parse(readFileSync(join(dir, name), "utf8")) }))
  );
}

test("canonical domain and auth contracts are present", () => {
  const names = new Set(readContracts().map((contract) => contract.name));
  for (const name of requiredContracts) {
    assert.equal(names.has(name), true, `${name} is missing`);
  }
});

test("contracts are strict JSON schemas with required fields", () => {
  for (const contract of readContracts()) {
    assert.equal(contract.schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(contract.schema.type, "object", `${contract.name} must define an object`);
    assert.equal(contract.schema.additionalProperties, false, `${contract.name} must reject unknown fields`);
    assert.ok(Array.isArray(contract.schema.required), `${contract.name} must define required fields`);
    assert.ok(contract.schema.required.length > 0, `${contract.name} must require at least one field`);
  }
});

test("financial mutation contracts require safety identifiers", () => {
  const byName = Object.fromEntries(readContracts().map((contract) => [contract.name, contract.schema]));
  assert.ok(byName["command.schema.json"].required.includes("correlationId"));
  assert.ok(byName["command.schema.json"].required.includes("idempotencyKey"));
  assert.ok(byName["proposed-trade.schema.json"].required.includes("proposalId"));
  assert.ok(byName["risk-decision.schema.json"].required.includes("policyVersion"));
  assert.ok(byName["order.schema.json"].required.includes("idempotencyKey"));
  assert.ok(byName["domain-event.schema.json"].required.includes("correlationId"));
  assert.ok(byName["domain-event.schema.json"].properties.eventType.enum.includes("kill_switch.changed"));
});
