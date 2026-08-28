import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("..", import.meta.url).pathname;
const deferredAzurePatterns = [
  "Microsoft.ApiManagement/",
  "Microsoft.Cdn/profiles",
  "Microsoft.SignalRService/WebPubSub",
  "Microsoft.Cache/Redis",
  "Microsoft.Kusto/",
  "Microsoft.EventHub/",
  "Microsoft.Search/searchServices",
  "Microsoft.Web/sites",
  "Microsoft.App/containerApps",
  "Microsoft.ServiceBus/"
];

function walk(dir, predicate = () => true) {
  const entries = [];
  for (const name of readdirSync(dir)) {
    if (name === ".git" || name === ".build" || name === "node_modules") {
      continue;
    }

    const path = join(dir, name);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      entries.push(...walk(path, predicate));
    } else if (predicate(path)) {
      entries.push(path);
    }
  }

  return entries;
}

test("MVP scaffold has no active web application directory", () => {
  assert.equal(existsSync(join(root, "web")), false);
});

test("infrastructure does not include deferred Azure services", () => {
  const files = walk(join(root, "infrastructure"), (path) => /\.(bicep|bicepparam|json)$/.test(path));
  for (const file of files) {
    const body = readFileSync(file, "utf8");
    for (const pattern of deferredAzurePatterns) {
      assert.equal(body.includes(pattern), false, `${file} includes deferred Azure service ${pattern}`);
    }
  }
});

test("dev IaC baseline includes private data and cost controls", () => {
  const bicep = walk(join(root, "infrastructure/bicep"), (path) => path.endsWith(".bicep"))
    .map((path) => readFileSync(path, "utf8"))
    .join("\n");
  for (const pattern of [
    "Microsoft.Network/privateEndpoints",
    "Microsoft.Network/privateDnsZones",
    "Microsoft.KeyVault/vaults",
    "Microsoft.Storage/storageAccounts",
    "publicNetworkAccess: 'Disabled'",
    "Microsoft.Consumption/budgets"
  ]) {
    assert.equal(bicep.includes(pattern), true, `dev Bicep is missing ${pattern}`);
  }
});

test("dev IaC keeps network and platform resource boundaries explicit", () => {
  const main = readFileSync(join(root, "infrastructure/bicep/main.bicep"), "utf8");
  const network = readFileSync(join(root, "infrastructure/bicep/network.bicep"), "utf8");
  const platform = readFileSync(join(root, "infrastructure/bicep/platform.bicep"), "utf8");
  assert.match(main, /rg-\$\{normalized\}-network/);
  assert.match(main, /rg-\$\{normalized\}-platform/);
  assert.match(network, /resourceBoundary: 'network'/);
  assert.match(platform, /resourceBoundary: 'platform'/);
  assert.match(main, /module platform[\s\S]*dependsOn:[\s\S]*platformResourceGroup/);
  assert.match(main, /module network[\s\S]*dependsOn:[\s\S]*networkResourceGroup[\s\S]*platform/);
});

test("resource group bootstrap is subscription scoped and separate", () => {
  const rgBicep = readFileSync(join(root, "infrastructure/bicep/resource-group.bicep"), "utf8");
  assert.equal(rgBicep.includes("targetScope = 'subscription'"), true);
  assert.equal(rgBicep.includes("Microsoft.Resources/resourceGroups"), true);
});

test("Azure dev deploy workflow uses OIDC and deploys only from main", () => {
  const workflow = readFileSync(join(root, ".github/workflows/azure-dev-deploy.yaml"), "utf8");
  assert.equal(workflow.includes("branches: [main]"), true);
  assert.equal(workflow.includes("id-token: write"), true);
  assert.equal(workflow.includes("azure/login@"), true);
  assert.equal(workflow.includes("environment: dev"), true);
  assert.equal(workflow.includes("validate.sh dev --what-if"), true);
  assert.equal(workflow.includes("validate.sh dev --deploy"), true);
});

test("PR infrastructure validation is lint-only and does not require Azure OIDC", () => {
  const workflow = readFileSync(join(root, ".github/workflows/infrastructure-validate.yaml"), "utf8");
  assert.equal(workflow.includes("pull_request:"), true);
  assert.equal(workflow.includes("id-token: write"), false);
  assert.equal(workflow.includes("azure/login@"), false);
  assert.equal(workflow.includes("validate.sh dev --lint-only"), true);
  assert.equal(workflow.includes("validate.sh dev --what-if"), false);
  assert.equal(workflow.includes("validate.sh dev --deploy"), false);
});
