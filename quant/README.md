# KAIROS Quant

The quant package contains deterministic, side-effect-free computations for agent tools. Price analysis currently exposes moving averages, percentage returns, and annualized sample volatility. Inputs must be normalized market data and freshness/provenance checks belong at the ingestion/tool boundary.

This path will hold deterministic quantitative analysis, feature computation, backtesting, strategy validation, and portfolio analytics.

LLM agents may consume quant outputs through controlled tools, but deterministic calculations should not be performed by prompts.

## Validation

```bash
npm --prefix quant test
```
