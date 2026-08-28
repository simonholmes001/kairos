import assert from "node:assert/strict";
import test from "node:test";
import { authorize, enforceRequest, permissionsForRoles } from "../src/authPolicy.mjs";

test("unauthenticated access is blocked except health endpoints", () => {
  assert.deepEqual(enforceRequest({ path: "/portfolio", headers: {} }, "portfolio.read"), {
    allowed: false,
    reason: "missing subject"
  });
  assert.deepEqual(enforceRequest({ path: "/healthz", headers: {} }, "health.read"), {
    allowed: true,
    reason: "public_health"
  });
});

test("role permissions can expand without changing enforcement code", () => {
  assert.equal(permissionsForRoles(["viewer"]).has("portfolio.read"), true);
  assert.equal(permissionsForRoles(["viewer"]).has("proposal.approve"), false);
  assert.equal(permissionsForRoles(["operator"]).has("kill_switch.activate"), true);
});

test("sensitive actions require server-side permission, strong assurance, and audit reason", () => {
  const actor = { subject: "operator-1", roles: ["operator"] };
  assert.deepEqual(authorize(actor, "proposal.approve", { assuranceLevel: "session", reason: "valid thesis" }), {
    allowed: false,
    reason: "strong_assurance_required"
  });
  assert.deepEqual(authorize(actor, "proposal.approve", { assuranceLevel: "biometric_reauth" }), {
    allowed: false,
    reason: "audit_reason_required"
  });

  const result = authorize(actor, "proposal.approve", {
    assuranceLevel: "biometric_reauth",
    reason: "risk approved",
    correlationId: "corr-1"
  });
  assert.equal(result.allowed, true);
  assert.equal(result.auditEvent.actor, "operator-1");
  assert.equal(result.auditEvent.action, "proposal.approve");
  assert.equal(result.auditEvent.correlationId, "corr-1");
});

test("read-only role cannot mutate financial or safety state", () => {
  assert.deepEqual(authorize({ subject: "viewer-1", roles: ["viewer"] }, "kill_switch.activate", {
    assuranceLevel: "biometric_reauth",
    reason: "test"
  }), {
    allowed: false,
    reason: "permission_denied"
  });
});
