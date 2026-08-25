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
  "Microsoft.Search/searchServices"
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
