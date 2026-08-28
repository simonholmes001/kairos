export const roles = Object.freeze({
  operator: [
    "portfolio.read",
    "decision.read",
    "proposal.approve",
    "proposal.reject",
    "risk.mode_change",
    "kill_switch.activate",
    "kill_switch.deactivate"
  ],
  approver: ["portfolio.read", "decision.read", "proposal.approve", "proposal.reject"],
  viewer: ["portfolio.read", "decision.read"],
  admin: [
    "portfolio.read",
    "decision.read",
    "operator.manage",
    "risk.policy_manage",
    "audit.read"
  ],
  audit: ["audit.read", "decision.read"]
});

export const sensitiveActions = new Set([
  "proposal.approve",
  "proposal.reject",
  "risk.mode_change",
  "kill_switch.activate",
  "kill_switch.deactivate",
  "operator.manage",
  "risk.policy_manage"
]);

export function permissionsForRoles(actorRoles) {
  return new Set(actorRoles.flatMap((role) => roles[role] ?? []));
}

export function authenticate(request) {
  if (request.path === "/healthz" || request.path === "/readyz") {
    return { kind: "public-health" };
  }

  const subject = request.headers?.["x-kairos-subject"];
  if (!subject) {
    return { kind: "unauthenticated", reason: "missing subject" };
  }

  const roleHeader = request.headers?.["x-kairos-roles"] ?? "";
  const actorRoles = roleHeader
    .split(",")
    .map((role) => role.trim())
    .filter(Boolean);

  return {
    kind: "authenticated",
    actor: {
      subject,
      roles: actorRoles,
      permissions: [...permissionsForRoles(actorRoles)]
    }
  };
}

export function authorize(actor, action, context = {}) {
  const permissions = permissionsForRoles(actor.roles);
  if (!permissions.has(action)) {
    return {
      allowed: false,
      reason: "permission_denied"
    };
  }

  if (sensitiveActions.has(action)) {
    if (context.assuranceLevel !== "biometric_reauth" && context.assuranceLevel !== "break_glass") {
      return {
        allowed: false,
        reason: "strong_assurance_required"
      };
    }
    if (!context.reason || context.reason.trim().length === 0) {
      return {
        allowed: false,
        reason: "audit_reason_required"
      };
    }
  }

  return {
    allowed: true,
    auditEvent: {
      eventType: "authorization.decision",
      actor: actor.subject,
      action,
      decision: "allowed",
      reason: context.reason ?? "not_required",
      assuranceLevel: context.assuranceLevel ?? "session",
      correlationId: context.correlationId ?? "missing-correlation-id"
    }
  };
}

export function enforceRequest(request, action, context = {}) {
  const auth = authenticate(request);
  if (auth.kind === "public-health") {
    return { allowed: action === "health.read", reason: action === "health.read" ? "public_health" : "health_only" };
  }

  if (auth.kind !== "authenticated") {
    return { allowed: false, reason: auth.reason };
  }

  return authorize(auth.actor, action, context);
}
