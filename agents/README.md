# KAIROS Agents

This path will hold agent workflow definitions, tool contracts, prompt assets, and evaluation harnesses.

Agents must use KAIROS-controlled tools only. They must not call arbitrary provider APIs, broker APIs, URLs, or secret-backed services directly.

## Validation

```bash
npm --prefix agents test
```
