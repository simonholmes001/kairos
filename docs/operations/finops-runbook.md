# FinOps Runbook

## Purpose

Keep Kairos dev/test/paper/live Azure spend visible and interruptible.

## Immediate Stop Levers

- Pause scheduled ingestion triggers.
- Disable agent workflow dispatchers.
- Set provider/model workflow quotas to zero.
- Disable non-critical replay/backtest jobs.
- Keep kill switch, audit reading, and operator health checks available.

## Required Review Before New Azure Resources

Every IaC PR that adds or increases Azure resources must include:

- linked issue
- expected monthly dev/test/paper/live cost
- private-network cost impact
- SKU rationale
- teardown path
- whether iOS-local state was considered first
- why deferred services are still deferred or explicitly approved

## Baseline SKU Rationale

| Service | Dev Choice | Rationale |
| --- | --- | --- |
| Storage | `Standard_LRS` | Lowest viable durable store for raw provider data, artifacts, queue-backed async work, and replay data. |
| Key Vault | `standard` | Secret boundary for provider/model/broker credentials without premium HSM cost. |
| Log Analytics | `PerGB2018`, 30 days, 1 GB/day cap | Controlled observability spend for early development. |
| Application Insights | workspace-based | Uses the capped Log Analytics workspace. |
| Private endpoints/DNS | enabled for data/secrets | Required by private-network requirement; explicitly accepted baseline cost. |

## Messaging Rules

- Storage Queue is the default for simple retryable async work.
- Service Bus is deferred until a command workflow needs duplicate detection, sessions, transactions, or dead-letter handling.
- Event Hubs is deferred until high-volume streaming/replay is approved.
- Event Grid is deferred until reactive notification fan-out is required.

