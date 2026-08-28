# KAIROS Agents

This path will hold agent workflow definitions, tool contracts, prompt assets, and evaluation harnesses.

Agents must use KAIROS-controlled tools only. They must not call arbitrary provider APIs, broker APIs, URLs, or secret-backed services directly.

The agent foundation provides bounded analysis contracts, a deny-by-default tool gateway, a provider-neutral model router, and a research-only orchestrator. Execution tools are outside the agent surface.

## Validation

```bash
npm --prefix agents test
```
