# KAIROS — Product Requirements Document

**Product:** KAIROS  
**Tagline:** Autonomous Market Intelligence  
**Document type:** Product Requirements Document (PRD)  
**Status:** Draft v1  
**Target platforms:** Web, iOS  
**Backend:** .NET 10 / ASP.NET Core  
**Web frontend:** Next.js 16.x App Router, React 19.2, TypeScript  
**iOS:** Swift / SwiftUI  
**Agent runtime:** Microsoft Agent Framework  
**Primary cloud:** Microsoft Azure  
**Initial asset classes:** Equities and crypto  
**Target decision horizon:** Seconds to days; explicitly not high-frequency trading

---

## 1. Product vision

KAIROS is an autonomous, agentic market-intelligence and trading platform that continuously observes financial markets, analyses structured and unstructured information, generates competing investment hypotheses, proposes portfolio actions, validates every proposed action against deterministic risk controls, and optionally executes approved trades through brokerage and exchange APIs.

KAIROS should behave less like a single “AI trading bot” and more like a virtual investment organisation composed of specialised analysts, portfolio managers, critics, researchers, deterministic controls, and execution infrastructure.

The core operating model is:

```text
PERCEIVE → UNDERSTAND → DEBATE → DECIDE → CONTROL → ACT → LEARN
```

AI is used where reasoning, interpretation, synthesis, hypothesis generation, and explanation are valuable. Deterministic software is used where correctness, repeatability, safety, accounting, risk limits, execution semantics, and auditability are mandatory.

---

## 2. Product principles

1. **Agents propose; deterministic systems control and execute.**
2. **No LLM has direct, unrestricted access to a brokerage or exchange account.**
3. **Every trading decision must be attributable, reproducible, and auditable.**
4. **Market data and quantitative calculations are authoritative inputs, not LLM-generated facts.**
5. **Multiple agents should be allowed to disagree.**
6. **Model choice is dynamic and evidence-based rather than hard-coded by provider.**
7. **Research, paper trading, and live autonomous trading must use the same underlying decision and execution contracts wherever practical.**
8. **Risk limits must be enforced outside the agent framework.**
9. **Live trading starts with human approval and constrained capital before progressing toward higher autonomy.**
10. **The system optimises portfolio risk-adjusted outcomes, not isolated predictions.**
11. **All model, prompt, tool, strategy, risk-rule, and data versions used in a decision must be recorded.**
12. **The platform is not an HFT system. LLM reasoning must never be placed on a microsecond/millisecond execution path.**

---

## 3. Goals

### 3.1 Primary goals

KAIROS shall:

- continuously ingest equity and crypto market data;
- ingest relevant news, company filings, fundamentals, macroeconomic data, and crypto-native/on-chain data;
- transform raw observations into normalised market state and reusable features;
- use specialist agents to independently analyse opportunities;
- run adversarial Bull/Bear/Critic analysis before material portfolio decisions;
- generate structured trade proposals;
- evaluate proposals in portfolio context;
- enforce deterministic portfolio and risk constraints;
- submit approved orders to supported brokers/exchanges;
- reconcile orders, fills, positions, cash, fees, and P&L;
- support Research, Paper, and Autonomous modes;
- provide complete decision explainability in the web and iOS clients;
- capture outcomes so agent/model/strategy performance can be evaluated over time;
- support multiple model providers through a provider-neutral model-routing layer;
- enable development and validation of new strategies through a Strategy Lab.

### 3.2 Non-goals for v1

KAIROS v1 will not:

- perform latency-sensitive high-frequency trading;
- allow agents to directly invoke unrestricted broker APIs;
- automatically train foundation models;
- trade complex derivatives autonomously at launch;
- use social-media sentiment as an authoritative signal without validation;
- promote an untested strategy directly from generation to live capital;
- permit live operation without hard loss, exposure, and kill-switch controls.

---

## 4. Users

### 4.1 Primary user

The initial product is designed for a sophisticated individual investor/operator who wants to:

- observe the autonomous system;
- understand why it is making decisions;
- configure strategies and risk parameters;
- approve trades in lower autonomy modes;
- analyse portfolio risk;
- inspect agent activity;
- compare model and strategy performance;
- intervene immediately when required.

### 4.2 Future users

Potential future roles:

- Portfolio Manager
- Risk Manager
- Researcher
- Quant Developer
- Read-only Investor
- Platform Administrator
- Compliance/Audit user

The permission model should therefore be role-based from the beginning even if v1 initially has one primary user.

---

## 5. Operating modes

### 5.1 Research mode — L0

```text
Agents: ON
Trading: OFF
Capital: None
```

Capabilities:

- market analysis;
- opportunity detection;
- proposed trades;
- strategy generation;
- backtests;
- scenario analysis;
- agent debate;
- explanations;
- no simulated or real orders.

### 5.2 Paper mode — L1/L2 validation

```text
Agents: ON
Trading: Simulated
Capital: Virtual
```

Paper mode shall exercise the same:

- ProposedTrade contract;
- Risk Engine;
- Order Management System;
- execution state machine;
- portfolio ledger;
- P&L calculation;
- monitoring;
- audit trail.

Only the broker adapter changes to a paper/simulation endpoint.

### 5.3 Autonomous mode

Autonomy is graduated:

```text
L0  Research only

L1  Trade recommendations
    Human approves every trade

L2  Small autonomous trades
    Strict per-order and daily capital ceilings

L3  Autonomous trading within approved strategy/risk mandates

L4  Fully autonomous portfolio operation within hard global limits
```

KAIROS shall not begin production operation at L4.

---

## 6. Supported asset classes

### Phase 1

- US-listed equities
- Major cryptocurrencies
- Cash

### Later phases

- ETFs
- Equity options
- Futures
- FX
- Bonds/fixed income
- Additional exchanges and jurisdictions

Every asset class shall implement a common instrument abstraction while retaining asset-specific market structure and risk properties.

---

## 7. System architecture

```text
                               KAIROS

┌───────────────────────────────────────────────────────────────┐
│                         CLIENTS                               │
│                                                               │
│       Next.js Web                         SwiftUI iOS          │
└───────────────────────────────┬───────────────────────────────┘
                                │
                                ▼
                       Azure Front Door
                                │
                                ▼
                       API Management
                                │
                                ▼
                   ASP.NET Core .NET 10 APIs
                                │
              ┌─────────────────┼────────────────────┐
              │                 │                    │
              ▼                 ▼                    ▼
        Query/API Layer   Agent Orchestration   Trading Platform
                              Layer                  Layer
              │                 │                    │
              │        Microsoft Agent              │
              │           Framework                 │
              │                 │                    │
              │           Model Router              │
              │       ┌─────────┼─────────┐          │
              │       │         │         │          │
              │    OpenAI   Anthropic  Gemini       │
              │                     \   DeepSeek     │
              │                                      │
              └─────────────────┬────────────────────┘
                                │
                  ┌─────────────┼─────────────┐
                  │             │             │
                  ▼             ▼             ▼
              Data Layer    Risk Engine   Execution Engine
                                  │             │
                                  └──────┬──────┘
                                         ▼
                                  Broker/Exchange APIs
```

---

## 8. Technology stack

### 8.1 Backend

**Language/runtime:** .NET 10 / C#  
**Framework:** ASP.NET Core

.NET owns:

- public/backend APIs;
- authentication and authorisation;
- portfolio domain model;
- trade proposal contracts;
- deterministic Risk Engine;
- Order Management System;
- broker/exchange adapters;
- portfolio ledger;
- accounting and reconciliation;
- workflow/application services;
- WebSocket/Web PubSub integration;
- system administration;
- audit services;
- orchestration boundary around agents.

Python may still be used as a specialised compute runtime for quantitative research, numerical libraries, ML models, backtesting, and data science where the Python ecosystem is materially stronger. It is not the primary backend application language.

### 8.2 Web frontend

**Framework:** Next.js 16.x using the App Router  
**Language:** TypeScript  
**UI runtime:** React 19.2  
**Rendering:** React Server Components where appropriate, client components for highly interactive trading surfaces  
**Real-time communication:** Azure Web PubSub/WebSockets  
**State:** server-state/query abstraction plus narrowly scoped client state  
**Charts:** financial charting library selected during implementation  
**Authentication:** Microsoft Entra ID-compatible OIDC/OAuth flow

Next.js remains the selected framework rather than moving to a different web framework. The application requires a mature React ecosystem, strong server/client composition, streaming, excellent TypeScript support, and sophisticated interactive dashboards.

Production deployments shall pin an explicit patched Next.js version instead of blindly following `latest`.

### 8.3 iOS

- Swift
- SwiftUI
- async/await
- shared KAIROS REST/realtime contracts
- Keychain for device-side secrets/tokens where applicable
- push notifications for risk and trade events
- biometric re-authentication for sensitive actions such as live-trading approval or kill-switch changes

Agents do not execute on-device. iOS is a secure client of the Azure-hosted KAIROS platform.

### 8.4 Agent platform

- Microsoft Agent Framework
- stateful workflows
- structured outputs
- concurrent specialist analysis
- deterministic workflow edges where appropriate
- handoffs where agent specialisation requires them
- Magentic/manager-style orchestration only where dynamic task decomposition provides measurable benefit

### 8.5 Model providers

Initial provider abstraction:

- OpenAI / Azure OpenAI
- Anthropic
- Google Gemini
- DeepSeek

No business-domain agent shall depend directly on a vendor SDK. All model access goes through the KAIROS Model Router abstraction.

---

## 9. Azure platform architecture

Recommended services:

- Azure Front Door
- Azure API Management
- Azure Container Apps for application services and workers
- Azure Container Apps Jobs for scheduled/batch workloads where appropriate
- Azure Event Hubs for high-volume event ingestion
- Azure Service Bus for durable business workflows/commands
- Azure Web PubSub for real-time client updates
- Azure Database for PostgreSQL
- Azure Managed Redis
- Azure Data Explorer for high-volume market/time-series analysis
- Azure Data Lake Storage / Blob Storage
- Azure AI Search for research/news/filing retrieval where appropriate
- Microsoft Foundry / supported model endpoints
- Azure Key Vault
- Managed Identities
- Private Endpoints
- Private DNS
- Azure Monitor
- Application Insights
- Log Analytics
- Microsoft Entra ID

---

## 10. Core domain boundaries

KAIROS should be separated into clear bounded contexts.

### 10.1 Market Data

Responsible for:

- instruments;
- exchanges;
- quotes;
- trades/ticks;
- candles;
- order books;
- market status;
- corporate actions;
- derived market features.

### 10.2 Research Intelligence

Responsible for:

- news;
- filings;
- fundamentals;
- macro releases;
- research documents;
- event extraction;
- embeddings/search;
- provenance.

### 10.3 Agent Intelligence

Responsible for:

- agent definitions;
- agent tools;
- workflow execution;
- model routing;
- prompts;
- structured responses;
- debate;
- confidence;
- reasoning summaries;
- evaluation.

### 10.4 Portfolio

Responsible for:

- portfolios;
- accounts;
- positions;
- cash;
- allocation;
- realised/unrealised P&L;
- target weights;
- exposure.

### 10.5 Risk

Responsible for:

- position limits;
- sector/asset limits;
- gross/net exposure;
- leverage;
- drawdown;
- daily loss;
- liquidity;
- concentration;
- volatility;
- portfolio VaR;
- risk budgets;
- kill switch;
- autonomy permission checks.

### 10.6 Execution

Responsible for:

- orders;
- order lifecycle;
- routing;
- partial fills;
- cancellations;
- retries;
- idempotency;
- slippage;
- fees;
- broker/exchange state;
- execution reconciliation.

### 10.7 Strategy

Responsible for:

- strategy definitions;
- strategy versions;
- hypotheses;
- signals;
- backtests;
- validation;
- promotion state;
- live strategy attribution.

### 10.8 Audit and Evaluation

Responsible for:

- immutable decision records;
- model versions;
- prompt versions;
- tool inputs/outputs;
- datasets/features;
- proposals;
- risk decisions;
- executions;
- outcomes;
- agent/model performance metrics.

---

## 11. Market-data subsystem

### 11.1 Required data categories

For equities:

- real-time/delayed prices according to licence;
- bid/ask;
- volume;
- OHLCV;
- corporate actions;
- market breadth;
- options/futures-derived signals where licensed;
- fundamentals;
- earnings;
- analyst estimates/revisions;
- SEC/company filings;
- economic calendar;
- news.

For crypto:

- spot prices;
- perpetual futures;
- funding;
- open interest;
- liquidations;
- order books;
- exchange flows;
- stablecoin flows;
- on-chain transactions/metrics;
- staking metrics;
- protocol TVL;
- token unlocks;
- wallet/whale activity where legally and technically available.

### 11.2 Data quality requirements

Every observation should carry:

- provider;
- instrument ID;
- source timestamp;
- ingestion timestamp;
- market/exchange;
- currency;
- quality status;
- stale-data flag;
- licence/entitlement classification where applicable.

Agents must not silently treat stale or missing data as current.

---

## 12. Event-driven architecture

KAIROS should be event driven.

Representative event flow:

```text
External Feed
    ↓
MarketDataReceived
    ↓
Normalisation
    ↓
MarketStateUpdated
    ↓
Signal/Anomaly Detection
    ↓
AnalysisRequested
    ↓
Agent Workflow
    ↓
TradeProposed
    ↓
RiskAssessmentRequested
    ↓
TradeApproved / TradeReduced / TradeRejected
    ↓
OrderRequested
    ↓
OrderSubmitted
    ↓
OrderPartiallyFilled / OrderFilled / OrderRejected
    ↓
PortfolioUpdated
    ↓
DecisionOutcomeEvaluated
```

Commands and financially significant state transitions must be durable and idempotent.

---

## 13. Agent topology

### 13.1 Kairos Orchestrator

Responsibilities:

- determine which agents are required for a task;
- construct bounded context for each agent;
- execute independent analyses concurrently;
- enforce workflow policies;
- collect structured outputs;
- start debate when required;
- request clarification/data rather than permit hallucinated inputs;
- forward completed analysis to the Portfolio Manager Agent.

The Orchestrator does not execute orders.

### 13.2 Market Data Agent

Primarily tool/data driven.

Responsibilities:

- obtain current market state;
- validate data freshness;
- surface liquidity/market status;
- package data for downstream agents.

### 13.3 Quant Agent

Responsibilities:

- evaluate mathematical/statistical signals;
- call quantitative services;
- compare current state to historical regimes;
- identify momentum, mean reversion, correlation, factor and anomaly signals;
- return metrics plus interpretation.

Numerical calculations occur in deterministic code/Python services rather than in LLM arithmetic.

### 13.4 Technical Analysis Agent

Responsibilities:

- trend;
- support/resistance;
- moving averages;
- RSI/MACD where used;
- volume profile;
- breakout;
- volatility compression;
- multi-timeframe structure.

### 13.5 Fundamental Agent

Responsibilities:

- financial statements;
- growth;
- margins;
- free cash flow;
- capital structure;
- valuation;
- guidance;
- earnings revisions;
- peer comparison;
- filings.

### 13.6 News/Event Agent

Responsibilities:

- ingest relevant news/events;
- identify affected instruments;
- classify event;
- estimate direction, magnitude, confidence, and time horizon;
- retain source provenance.

### 13.7 Macro Agent

Responsibilities:

- rates;
- inflation;
- employment;
- GDP/growth;
- bond yields;
- yield curve;
- FX;
- commodities;
- credit;
- liquidity;
- regime classification.

### 13.8 Sentiment Agent

Responsibilities:

- aggregate permitted sentiment signals;
- distinguish source reliability;
- identify crowding/extremes;
- prevent raw sentiment from being treated as standalone fact.

### 13.9 Crypto Intelligence Agent

Responsibilities:

- crypto-specific market structure;
- funding;
- perpetuals;
- liquidations;
- exchange activity;
- token/protocol state;
- on-chain features.

This may later split into On-Chain, Crypto Quant, Crypto News, and Crypto Market Structure agents.

### 13.10 Bull Agent

Objective:

> Build the strongest evidence-supported case for taking the proposed bullish/long action.

It must cite its evidence and state uncertainty.

### 13.11 Bear Agent

Objective:

> Build the strongest evidence-supported case against the proposed action or for the bearish alternative.

### 13.12 Critic Agent

Responsibilities:

- attack assumptions;
- identify missing information;
- flag data leakage/recency problems;
- challenge correlations presented as causation;
- identify thesis invalidators;
- identify model/agent disagreement.

### 13.13 Alternative Agent

Responsibilities:

- identify superior expressions of the same thesis;
- compare direct equity vs ETF vs hedge vs no-trade;
- optimise expected payoff versus portfolio risk.

### 13.14 Portfolio Manager Agent

Responsibilities:

- consume specialist analyses;
- evaluate proposal in portfolio context;
- account for existing positions and correlations;
- compare candidate opportunities;
- formulate target exposure;
- produce a structured ProposedTrade.

It shall never bypass Risk.

### 13.15 User Agent

Responsibilities:

- answer conversational questions about KAIROS;
- route portfolio/research questions;
- explain decisions;
- trigger simulations/scenarios when authorised;
- never fabricate live portfolio or market state.

---

## 14. Canonical agent response contract

All market-analysis agents should return structured data resembling:

```json
{
  "analysis_id": "uuid",
  "agent": "technical-analysis",
  "agent_version": "1.0.0",
  "model": "provider/model/version",
  "asset": "AAPL",
  "as_of": "2026-08-19T14:37:00Z",
  "signal": "LONG",
  "score": 0.71,
  "confidence": 0.76,
  "horizon": "3-10d",
  "thesis": [
    "..."
  ],
  "risks": [
    "..."
  ],
  "invalidators": [
    "..."
  ],
  "evidence": [
    {
      "source_id": "...",
      "timestamp": "...",
      "claim": "..."
    }
  ]
}
```

Agent free text must not become a broker instruction.

---

## 15. ProposedTrade contract

The Portfolio Manager produces a versioned structured contract:

```json
{
  "proposal_id": "uuid",
  "portfolio_id": "uuid",
  "instrument_id": "NVDA",
  "side": "BUY",
  "target_weight": 0.06,
  "current_weight": 0.04,
  "max_notional": 25000,
  "order_preference": "LIMIT",
  "time_horizon": "1-3m",
  "confidence": 0.76,
  "thesis": "...",
  "invalidators": ["..."],
  "supporting_analysis_ids": ["..."],
  "strategy_id": "...",
  "strategy_version": "...",
  "expires_at": "..."
}
```

A proposal is not an order.

---

## 16. Deterministic Risk Engine

The Risk Engine is a .NET 10 domain service and is not an LLM agent.

### 16.1 Required checks

At minimum:

- per-position maximum;
- per-order maximum;
- sector exposure;
- asset-class exposure;
- gross exposure;
- net exposure;
- cash reserve;
- leverage;
- crypto exposure;
- daily realised/unrealised loss;
- maximum drawdown;
- concentration;
- correlated exposure;
- volatility;
- portfolio VaR or other portfolio risk metric;
- liquidity;
- spread;
- market status;
- stale quote/data;
- strategy capital allocation;
- strategy status;
- autonomy level;
- broker/account permission;
- instrument allow/deny list.

### 16.2 Risk output

```json
{
  "proposal_id": "uuid",
  "decision": "REDUCED",
  "requested_notional": 25000,
  "approved_notional": 15000,
  "reasons": [
    "Semiconductor exposure would otherwise exceed configured threshold."
  ],
  "risk_snapshot_id": "uuid",
  "ruleset_version": "2026.08.1"
}
```

### 16.3 Hard guarantees

- Agents cannot modify risk results.
- Risk rule versions are immutable once used in a decision.
- Live orders cannot exist without a valid approved risk result.
- Risk approval expires.
- Material market/portfolio changes before submission trigger revalidation.

---

## 17. Kill switch

KAIROS requires a system-wide kill switch.

Triggering it shall:

1. disable new autonomous order creation;
2. cancel open orders where configured;
3. optionally initiate a predefined flatten/reduce procedure;
4. prevent agent proposals from reaching execution;
5. raise high-priority alerts;
6. persist actor, timestamp, reason, and resulting actions.

The kill switch must not depend on an LLM.

It must be accessible from authorised web and iOS clients and supported operational tooling.

---

## 18. Order Management System

The OMS shall manage:

- client order IDs;
- idempotency;
- order validation;
- broker/exchange mapping;
- submission;
- acknowledgment;
- partial fills;
- fills;
- cancellation;
- replacement;
- rejection;
- timeouts;
- retries;
- fees;
- slippage;
- market hours;
- stale order handling;
- order reconciliation.

Representative state model:

```text
CREATED
  ↓
RISK_APPROVED
  ↓
SUBMISSION_PENDING
  ↓
SUBMITTED
  ├── PARTIALLY_FILLED
  │       ↓
  │     FILLED
  ├── CANCELED
  ├── REJECTED
  └── EXPIRED
```

Financial state changes must be idempotent.

---

## 19. Broker/exchange abstraction

A broker adapter interface should support:

```text
GetAccounts
GetBalances
GetPositions
GetQuote
GetOpenOrders
SubmitOrder
CancelOrder
ReplaceOrder
GetOrder
GetExecutions
GetTradingStatus
```

Potential integrations include:

- Interactive Brokers
- Alpaca
- Coinbase
- Kraken
- Binance where legally/contractually appropriate
- additional providers later

KAIROS domain logic must not depend on provider-specific order models.

---

## 20. Portfolio ledger

KAIROS requires an authoritative ledger independent of agent state.

It records:

- cash;
- positions;
- cost basis;
- realised P&L;
- unrealised P&L;
- fees;
- executions;
- transfers;
- corporate actions;
- strategy attribution;
- broker reconciliation differences.

Broker state should be regularly reconciled against KAIROS state.

---

## 21. Multi-model architecture

### 21.1 Model Router

Agents request a capability, not a vendor.

```text
Agent
  ↓
ModelRouter
  ├── OpenAI / Azure OpenAI
  ├── Anthropic
  ├── Gemini
  └── DeepSeek
```

Routing dimensions:

- task type;
- benchmark score;
- latency;
- cost;
- context requirements;
- structured-output reliability;
- tool-use reliability;
- region/data-residency constraints;
- temporary provider health;
- experiment allocation.

### 21.2 Evaluation-driven routing

KAIROS should learn empirically which model performs best for each task.

Examples of evaluation metrics:

- factuality;
- source-grounding;
- schema-valid response rate;
- investment forecast calibration;
- precision/recall for event extraction;
- latency;
- cost;
- tool error rate;
- subsequent strategy contribution;
- consistency.

Model rankings must not be based on anecdotal preference.

---

## 22. Agent/model evaluation

Each completed recommendation shall preserve:

```text
prediction
confidence
reasoning summary
market snapshot
input features
evidence
agent versions
model versions
prompt versions
tool versions
strategy version
portfolio state
risk result
execution
subsequent outcome
```

Evaluation should support questions such as:

```text
Which model is best for macro interpretation?
Which agent is consistently overconfident?
What is win rate by confidence bucket?
Which agent combinations produce the highest risk-adjusted returns?
Which strategy survives transaction costs?
How does performance change by market regime?
```

Confidence calibration is particularly important: an agent that says “80% confidence” should empirically succeed at an appropriate rate for the defined prediction event.

---

## 23. Strategy Lab

Strategy Lab provides an isolated research lifecycle:

```text
Strategy Research Agent
        ↓
Hypothesis
        ↓
Quant Implementation
        ↓
Backtest
        ↓
Statistical Validation
        ↓
Adversarial Review
        ↓
Walk-forward / out-of-sample
        ↓
Paper Trading
        ↓
Small Capital
        ↓
Production
```

### 23.1 Promotion gates

A strategy cannot progress automatically unless it passes configured gates for:

- minimum sample size;
- out-of-sample performance;
- transaction costs;
- slippage;
- turnover;
- drawdown;
- Sharpe/Sortino or selected metrics;
- regime robustness;
- concentration;
- overfitting checks;
- paper-trading duration;
- risk approval.

Production promotion should initially require human approval.

---

## 24. Backtesting requirements

Backtesting must avoid common false positives.

Requirements include:

- point-in-time data;
- survivorship-bias controls;
- no future leakage;
- realistic fees;
- realistic spread/slippage;
- delisted instruments where applicable;
- corporate actions;
- market calendars;
- liquidity constraints;
- execution assumptions;
- walk-forward validation;
- parameter stability analysis.

Every backtest should record code, dataset, configuration, and strategy versions.

---

## 25. Web application

The web application is the primary command centre.

### 25.1 Dashboard

Display:

- portfolio NAV;
- daily/YTD/all-time P&L;
- available cash;
- gross/net exposure;
- current risk;
- market summary;
- asset allocation;
- active strategies;
- live agent activity;
- proposed trades;
- open orders;
- recent executions;
- alerts;
- operating/autonomy mode.

### 25.2 Agent activity

Users can see:

- active workflows;
- current agent;
- investigation target;
- start time;
- status;
- completed analyses;
- disagreements;
- pending decisions.

Avoid exposing hidden chain-of-thought. Present concise reasoning summaries, evidence, scores, and structured decision factors.

### 25.3 Decision detail

Every proposed or completed trade should expose:

- instrument;
- direction;
- proposed size;
- approved size;
- execution;
- thesis;
- invalidators;
- Quant analysis;
- Technical analysis;
- Fundamental analysis;
- Macro analysis;
- News/Event analysis;
- Bull case;
- Bear case;
- Critic findings;
- Portfolio Manager conclusion;
- Risk Engine decision;
- resulting P&L/outcome when available.

### 25.4 Portfolio

Views:

- positions;
- allocation;
- sector;
- asset class;
- strategy;
- risk contribution;
- correlations;
- realised/unrealised P&L;
- trade history.

### 25.5 Risk console

Display and configure, subject to role:

- risk limits;
- current utilisation;
- daily loss;
- drawdown;
- leverage;
- VaR;
- concentration;
- autonomy level;
- blocked instruments;
- kill switch.

### 25.6 Strategy Lab

Capabilities:

- create/review hypotheses;
- run backtests;
- inspect results;
- compare versions;
- launch paper trading;
- review promotion status;
- inspect attribution.

### 25.7 Model/agent evaluation

Dashboard showing:

- model accuracy by task;
- cost;
- latency;
- schema reliability;
- confidence calibration;
- agent contribution;
- strategy contribution;
- performance by regime.

### 25.8 Conversational interface

Users can ask:

- Why are we holding this position?
- Why did we sell BTC yesterday?
- Why are we holding cash?
- What are the strongest current ideas?
- What happens if the S&P 500 falls 10%?
- What changed since yesterday?
- Which agent disagrees most strongly with the current portfolio?
- Which strategies are underperforming?

The chat interface must call authoritative KAIROS services for live state rather than rely on model memory.

---

## 26. iOS application

The SwiftUI app should provide:

### v1

- authentication;
- portfolio summary;
- positions;
- P&L;
- current market/risk state;
- agent activity;
- proposals;
- trade approval where enabled;
- completed trades;
- explanations;
- alerts;
- chat;
- kill switch.

### Notifications

Push notifications for configurable events:

- trade proposed;
- approval required;
- trade executed;
- risk threshold reached;
- drawdown threshold;
- kill switch activated;
- broker connectivity issue;
- strategy disabled;
- significant market anomaly.

Sensitive actions can require Face ID/Touch ID re-authentication.

---

## 27. API surface

Representative REST endpoints:

```text
/api/v1/portfolio
/api/v1/portfolios/{id}
/api/v1/positions
/api/v1/orders
/api/v1/trades
/api/v1/proposals
/api/v1/proposals/{id}
/api/v1/proposals/{id}/approve
/api/v1/proposals/{id}/reject
/api/v1/risk
/api/v1/risk/limits
/api/v1/agents
/api/v1/agents/runs
/api/v1/analysis
/api/v1/markets
/api/v1/instruments
/api/v1/strategies
/api/v1/strategies/{id}/backtests
/api/v1/evaluations
/api/v1/chat
/api/v1/system/mode
/api/v1/system/kill-switch
```

Real-time topics/events:

```text
portfolio.updated
market.updated
agent.started
agent.completed
proposal.created
proposal.risk_assessed
order.submitted
order.updated
trade.executed
risk.alert
system.mode_changed
kill_switch.activated
```

---

## 28. Security

### Authentication

- Microsoft Entra ID / External ID architecture as appropriate to deployment model;
- standards-based OAuth 2.0/OIDC;
- short-lived access tokens;
- protected refresh/session handling.

### Authorisation

RBAC for:

- read portfolio;
- research;
- approve trades;
- edit risk;
- change autonomy level;
- trigger kill switch;
- administer brokers;
- manage strategies;
- manage models.

### Secrets

- Azure Key Vault;
- Managed Identity wherever Azure supports it;
- no broker keys in client applications;
- no long-lived secrets in source control.

### Network

- private endpoints for supported Azure services;
- least-privilege networking;
- controlled ingress/egress;
- broker/provider traffic explicitly allowed;
- WAF at edge.

### Auditing

All sensitive actions record:

- identity;
- timestamp;
- IP/device/session metadata where appropriate;
- previous value;
- new value;
- reason;
- correlation ID.

---

## 29. Safety controls

Required safeguards:

- maximum order size;
- maximum position size;
- maximum asset/sector exposure;
- maximum leverage;
- maximum daily loss;
- maximum drawdown;
- stale-market-data block;
- abnormal-spread block;
- disconnected-broker block;
- duplicate-order prevention;
- strategy-level capital budget;
- account-level capital budget;
- autonomy-level permission;
- circuit breaker;
- manual kill switch;
- automated kill conditions;
- trading halt awareness;
- no execution from natural-language output.

---

## 30. Observability

Every request and workflow should receive a correlation/trace ID.

Telemetry:

- API latency/errors;
- agent runs;
- token usage;
- model cost;
- model latency;
- tool calls;
- workflow duration;
- market-data lag;
- event-processing lag;
- risk decisions;
- broker API health;
- order latency;
- rejection rate;
- fill ratio;
- reconciliation differences;
- WebSocket/Web PubSub health.

Distributed tracing should connect:

```text
market event
→ agent workflow
→ proposal
→ risk assessment
→ order
→ broker
→ fill
→ ledger update
→ client notification
```

---

## 31. Auditability and reproducibility

For every decision, KAIROS must be able to answer:

- What data did the system know at that moment?
- Which agents ran?
- Which models and exact model versions were used?
- Which prompts/instructions were used?
- Which tools did they call?
- What did each agent conclude?
- What disagreements existed?
- What portfolio state existed?
- Which risk rules were evaluated?
- Why was the trade approved/reduced/rejected?
- Which order was sent?
- What was filled?
- What happened afterward?

This requirement influences the entire platform design.

---

## 32. Human approval workflow

For L1 operation:

```text
TradeProposed
    ↓
RiskApproved
    ↓
AwaitingHumanApproval
    ↓
User sees thesis + debate + risk
    ↓
Approve / Reject
    ↓
Risk revalidation
    ↓
Order submission
```

Approval expires after a configurable interval or material market-state change.

---

## 33. Example end-to-end workflow

Bitcoin falls 4% quickly.

```text
Market Stream
    ↓
Anomaly Detector
    ↓
AnalysisRequested(BTC)
    ↓
Kairos Orchestrator
    ├── Crypto Agent
    ├── News Agent
    ├── On-Chain Agent
    ├── Quant Agent
    └── Macro Agent
              ↓
          parallel results
              ↓
       Bull + Bear Agents
              ↓
          Critic Agent
              ↓
      Portfolio Manager
              ↓
         ProposedTrade
              ↓
          Risk Engine
              ↓
      APPROVE / REDUCE / REJECT
              ↓
       Human Approval if required
              ↓
          Execution Engine
              ↓
          Broker/Exchange
              ↓
          Execution Report
              ↓
          Portfolio Ledger
              ↓
         Outcome Evaluation
```

Example proposed conclusion:

```text
BTC dislocation appears primarily liquidation-driven.
No corroborating negative fundamental/news event identified.
Funding reset materially.
Longer-term regime remains supportive.

Proposal:
BUY BTC
+0.75% portfolio
confidence 73%
```

Risk can still reduce or reject it.

---

## 34. Data model — principal entities

Core entities:

```text
User
Role
Portfolio
Account
BrokerConnection
Instrument
MarketSnapshot
MarketFeature
ResearchDocument
MarketEvent
AgentDefinition
AgentRun
AgentAnalysis
ModelDefinition
ModelEvaluation
Strategy
StrategyVersion
Signal
TradeProposal
RiskAssessment
RiskRule
RiskRuleSet
Order
Execution
Position
CashLedgerEntry
PortfolioSnapshot
Backtest
BacktestRun
DecisionOutcome
Alert
AuditEvent
```

All financially significant entities use immutable identifiers and explicit versioning where applicable.

---

## 35. Service decomposition

Do not create dozens of microservices on day one.

Recommended initial deployable boundaries:

```text
Kairos.Api
Kairos.AgentService
Kairos.MarketDataService
Kairos.TradingService
Kairos.QuantService
Kairos.Worker
Kairos.Web
Kairos.iOS
```

Logical .NET projects can remain more granular than deployed services.

Possible solution structure:

```text
/src
  /Kairos.Api
  /Kairos.Application
  /Kairos.Domain
  /Kairos.Infrastructure
  /Kairos.Contracts
  /Kairos.Agents
  /Kairos.Risk
  /Kairos.Execution
  /Kairos.Portfolio
  /Kairos.Strategies
  /Kairos.MarketData
  /Kairos.Observability

/quant
  /kairos_quant
  /backtesting
  /feature_engineering
  /models

/web
  /kairos-web

/ios
  /Kairos

/tests
  /unit
  /integration
  /contract
  /e2e
  /simulation

/infra
  /terraform-or-bicep
```

---

## 36. .NET architecture

Recommended approach:

- ASP.NET Core APIs
- vertical slices/use-case handlers at the application boundary
- domain model for Portfolio/Risk/Execution
- strongly typed IDs/value objects for financially significant concepts
- immutable contracts for events
- explicit decimal handling for prices/amounts
- UTC timestamps internally
- resilience policies around external providers
- OpenTelemetry
- dependency injection
- asynchronous message-driven workers

Money calculations must use decimal/fixed-point semantics rather than binary floating point where precision matters.

---

## 37. Quantitative compute architecture

Python services may own:

- feature generation;
- NumPy/Polars/Pandas calculations;
- SciPy;
- statsmodels;
- PyTorch;
- XGBoost;
- vectorised backtesting;
- research notebooks moved into reproducible jobs.

Interfaces to .NET must be typed and versioned.

Options:

- gRPC for low-latency internal calls;
- HTTP for simpler coarse-grained workloads;
- Service Bus/Event Hubs for asynchronous computation.

---

## 38. Storage architecture

### PostgreSQL

Authoritative transactional/application state:

- users;
- portfolios;
- accounts;
- positions;
- strategies;
- proposals;
- risk results;
- orders;
- executions;
- audit indexes/metadata.

### Azure Data Explorer

High-volume time series:

- ticks;
- quotes;
- candles;
- derived metrics;
- market telemetry;
- execution analytics.

### Redis

Ephemeral/current state:

- latest quotes;
- hot portfolio state;
- distributed caching;
- transient coordination where safe.

Redis is not the financial system of record.

### Data Lake / Blob

- raw vendor files;
- historical datasets;
- filings;
- model-evaluation datasets;
- backtest artefacts;
- research artefacts.

### Azure AI Search

Search/retrieval over:

- filings;
- company reports;
- news;
- research;
- agent-accessible knowledge.

Every retrieved item must retain provenance and timestamps.

---

## 39. Reliability requirements

Financial execution paths require stronger guarantees than analytical paths.

### Execution

- durable;
- idempotent;
- retriable;
- exactly-once business semantics achieved through idempotency/reconciliation rather than assumed transport guarantees;
- broker reconciliation;
- duplicate detection.

### Agents

- retries allowed;
- timeout;
- fallback model/provider;
- workflow checkpointing;
- graceful degradation.

Agent failure should produce “analysis unavailable”, not invented output.

---

## 40. Latency targets

KAIROS is not HFT.

Indicative targets:

- web API p95 for normal reads: <500 ms where cached/current data permits;
- live market UI updates: typically <1–2 seconds from platform ingestion;
- simple specialist agent run: seconds;
- multi-agent investment workflow: seconds to low minutes depending on required evidence;
- deterministic risk assessment: sub-second target;
- order handoff after final approval: low hundreds of milliseconds target excluding broker latency.

These are engineering targets, not guarantees about external providers.

---

## 41. Compliance/legal design requirement

Before live trading, KAIROS requires a jurisdiction-specific review covering at minimum:

- broker API terms;
- exchange terms;
- market-data redistribution/licensing;
- algorithmic/automated trading requirements;
- user/account classification;
- record keeping;
- privacy;
- tax reporting implications;
- crypto-specific regulatory restrictions.

The product must make no assumption that an integration permitted technically is permitted contractually or legally.

---

## 42. MVP scope

### MVP 0 — Infrastructure and observation

- Azure foundation
- Entra authentication
- Next.js command centre shell
- .NET 10 APIs
- SwiftUI shell
- market-data ingestion
- portfolio ledger
- paper account
- observability
- no agents making trade decisions yet

### MVP 1 — Research agents

- Microsoft Agent Framework
- Model Router
- OpenAI + Anthropic initially
- Quant Agent
- Technical Agent
- Fundamental Agent
- News Agent
- Macro Agent
- Crypto Agent
- structured agent contracts
- User Agent/chat
- decision explanation
- Research mode only

### MVP 2 — Debate + Portfolio Manager

- Bull Agent
- Bear Agent
- Critic Agent
- Alternative Agent
- Portfolio Manager
- ProposedTrade
- candidate ranking
- complete audit record

### MVP 3 — Paper trading

- deterministic Risk Engine
- OMS
- broker abstraction
- paper broker
- execution reports
- P&L
- reconciliation
- L1 approval workflow
- mobile notifications

### MVP 4 — Strategy Lab

- backtesting
- walk-forward validation
- strategy versioning
- paper strategy promotion
- evaluation dashboards

### MVP 5 — Controlled live trading

- one live broker/exchange
- L1 approval
- tiny capital limits
- kill switch
- production monitoring
- incident procedures

### MVP 6 — Increasing autonomy

Only after validated operational evidence:

- L2
- L3
- potentially L4

---

## 43. Acceptance criteria for first live-capable release

A release is not considered live-capable unless:

- all order paths are idempotent;
- paper trading has demonstrated stable reconciliation;
- Risk Engine unit/integration coverage is comprehensive;
- risk rules cannot be bypassed by agents;
- stale data blocks execution;
- kill switch is tested;
- broker disconnection behaviour is tested;
- duplicate messages cannot create duplicate financial effects;
- all trade decisions have audit trails;
- user can inspect the reason for every trade;
- every agent response validates against a schema;
- model/provider outages have defined behaviour;
- portfolio ledger reconciles to broker state;
- L1 human approval is enforced;
- production limits default conservatively;
- secrets are stored in Key Vault;
- clients contain no brokerage credentials.

---

## 44. Success metrics

### System quality

- market-data freshness;
- uptime;
- event lag;
- order error rate;
- reconciliation accuracy;
- agent schema-validity rate;
- workflow completion rate.

### Intelligence quality

- prediction calibration;
- agent factuality/source grounding;
- strategy out-of-sample performance;
- performance after transaction costs;
- agent/model contribution;
- false-event detection rate.

### Trading quality

- return;
- volatility;
- Sharpe/Sortino;
- maximum drawdown;
- hit rate;
- payoff ratio;
- slippage;
- turnover;
- risk-adjusted alpha relative to selected benchmark.

Raw return alone is not sufficient.

---

## 45. Core user experience

The application should feel like a **market command centre**, not a conventional brokerage screen.

The home experience should answer five questions immediately:

1. What does my portfolio look like right now?
2. What is KAIROS currently investigating?
3. What trades is it considering?
4. What risks is it carrying?
5. Why has it made its recent decisions?

The user should be able to move from a portfolio-level number to the complete underlying agent/risk/execution evidence in a small number of interactions.

---

## 46. Product identity

**Name:** KAIROS  
**Tagline:** Autonomous Market Intelligence

Internal component naming:

```text
Kairos Engine
Kairos Agents
Kairos Research
Kairos Strategy Lab
Kairos Risk
Kairos Execution
Kairos Portfolio
Kairos Model Router
Kairos Command
```

---

## 47. Architectural summary

```text
1. PERCEIVE
   Market data, news, filings, macro and on-chain ingestion

2. UNDERSTAND
   Specialist agents + deterministic quantitative computation

3. DEBATE
   Bull, Bear, Critic and Alternative agents

4. DECIDE
   Portfolio Manager Agent produces a ProposedTrade

5. CONTROL
   Deterministic .NET Risk Engine validates/reduces/rejects

6. ACT
   Deterministic OMS + broker/exchange adapters execute

7. LEARN
   Outcomes, attribution, model evaluation and Strategy Lab
```

This separation is the fundamental KAIROS design rule:

> **AI creates and challenges investment intelligence. Deterministic systems control money.**

---

# KAIROS Data Source Specification

Yes. This needs to move from “market APIs” to an explicit **KAIROS Data Source Specification**. I would define the v1 providers now, while keeping adapters so they can be replaced later.

## Recommended KAIROS v1 data stack

| Information | Primary source | Secondary / validation | Used by |
|---|---|---|---|
| US equity prices, trades, NBBO | **Massive** | IBKR market data | Market/Quant/Technical |
| Historical equity prices | **Massive** | Intrinio | Quant/Backtesting |
| Options market data | **Massive** | IBKR | Quant/Options later |
| Company fundamentals | **Intrinio** | SEC XBRL | Fundamental Agent |
| SEC filings | **SEC EDGAR directly** | Intrinio | Fundamental/News |
| Earnings/calendar/corporate events | **Benzinga** | Intrinio/company filings | News/Fundamental |
| Financial news | **Benzinga Newsfeed** | Official company releases | News Agent |
| US macroeconomic data | **FRED + direct official releases** | IMF/OECD | Macro Agent |
| European macro data | **ECB Data Portal** | Eurostat/OECD | Macro Agent |
| Global macro | **IMF + OECD** | World Bank | Macro Agent |
| Crypto spot prices | **CoinGecko** | Coinbase/Kraken exchange feeds | Crypto Agent |
| Tradable crypto market state | **actual exchange WebSockets** | CoinGecko | Crypto/Execution |
| Crypto derivatives | **CoinGlass** | exchange APIs | Crypto Quant |
| Funding/open interest/liquidations | **CoinGlass** | exchange APIs | Crypto Agent |
| On-chain analytics | **Glassnode** | CoinGecko on-chain | On-Chain Agent |
| DEX/on-chain market prices | **CoinGecko Onchain** | chain-specific providers later | Crypto Agent |
| Equity execution | **Interactive Brokers** | Alpaca for development/paper | Execution |
| Crypto execution | **Coinbase Advanced Trade** | Kraken adapter later | Execution |
| Portfolio/account truth | **Broker/exchange APIs** | KAIROS ledger reconciliation | Portfolio |
| Searchable documents | **Azure AI Search** | — | Agents/RAG |
| Raw historical archive | **Azure Data Lake** | — | Research/Backtesting |
| Fast time-series analytics | **Azure Data Explorer** | — | Quant/Market |

That is the concrete stack I would start building.

---

# 1. Equities market data — Massive

I would use **Massive** as KAIROS's primary US equities market-data provider.

It provides real-time stock data over WebSockets, including trades and NBBO quotes, plus REST APIs and historical data. Its US stock coverage includes the major exchanges, dark pools, FINRA facilities and OTC markets. ([massive.com](https://massive.com/docs/websocket/stocks?utm_source=chatgpt.com))

KAIROS would ingest:

```text id="usgm3i"
Trades
Quotes / NBBO
OHLCV
1-second bars
1-minute bars
Daily bars
Volume
Exchange
Trade conditions
Market status
Corporate actions
Ticker/reference data
Options data
```

Architecture:

```text id="7sk09s"
Massive WebSocket
       ↓
Kairos.MarketDataService
       ↓
normalisation
       ↓
Azure Event Hubs
       ↓
┌───────────────────┬────────────────────┐
│                   │                    │
▼                   ▼                    ▼
Data Explorer   Signal Engine       Live UI
```

The agents **do not call Massive themselves**.

They call:

```text id="4wbg5t"
IMarketDataService
```

For example:

```text id="15rtai"
GetQuote("NVDA")
GetBars("NVDA", 1h, 500)
GetVolatility("NVDA")
GetMarketSnapshot("NVDA")
```

This matters because we don't want vendor-specific APIs leaking into agent prompts.

---

# 2. Company fundamentals — Intrinio

I would use **Intrinio** for normalised fundamental data.

Intrinio provides standardised and as-reported financial statements and company fundamentals through an API, including historical data. ([docs.intrinio.com](https://docs.intrinio.com/documentation/python/get_company_fundamentals_v2?utm_source=chatgpt.com))

We ingest:

```text id="6manaa"
Income statement
Balance sheet
Cash-flow statement

Revenue
Gross margin
Operating margin
EBITDA
Net income
EPS

Cash
Debt
Shares outstanding
Free cash flow

Historical fundamentals

Company metadata
Industry
Sector
```

This gives the Fundamental Agent clean data rather than forcing an LLM to extract numbers from filings every time.

Example:

```text id="ivha3t"
Fundamental Agent
       │
       ├── Intrinio structured financials
       │
       ├── SEC filing text
       │
       └── historical derived metrics
               ↓
          LLM analysis
```

---

# 3. SEC filings — direct SEC EDGAR

For US regulatory filings, I would **go directly to the SEC**.

The SEC exposes REST APIs for company submissions and XBRL company facts through `data.sec.gov`. ([sec.gov](https://www.sec.gov/search-filings/edgar-application-programming-interfaces?utm_source=chatgpt.com))

KAIROS should ingest at least:

```text id="zrdck5"
10-K
10-Q
8-K
DEF 14A
13D
13G
Form 4
S-1
20-F
6-K
```

These documents go into:

```text id="90zyzz"
SEC
 ↓
Kairos.DocumentIngestion
 ↓
Original document
 ↓
Data Lake
 ↓
parse/chunk
 ↓
Azure AI Search
 ↓
Fundamental / News / Research Agents
```

For example, if an agent asks:

> Did NVDA management change its gross-margin guidance?

It should retrieve the relevant filings rather than rely on model memory.

The SEC is the **authoritative source** for the filing itself.

---

# 4. Financial news — Benzinga

For the first serious version I would use **Benzinga Newsfeed API**.

It supplies real-time financial news with ticker/ISIN/CUSIP filtering and structured categories. ([docs.benzinga.com](https://docs.benzinga.com/api-reference/news-api/get-news-items?utm_source=chatgpt.com))

Benzinga also exposes machine-readable quantified news including sentiment, relevance and market-impact indicators. ([docs.benzinga.com](https://docs.benzinga.com/api-reference/newsquantified-api/get-newsquantified-data?utm_source=chatgpt.com))

KAIROS would consume:

```text id="dwz44i"
Breaking news
Earnings
Guidance
Analyst actions
M&A
Management changes
FDA/regulatory events
Legal events
Corporate actions
Economic events
```

But I would distinguish:

```text id="vjas5e"
NEWS CLAIM

from

AUTHORITATIVE EVENT
```

For example:

```text id="fp7390"
Benzinga:
"Apple cuts production forecast"

       ↓ verify where possible

Apple investor relations
SEC 8-K
official press release
```

The News Agent stores provenance.

---

# 5. Company investor-relations information

This is another category I would explicitly add.

KAIROS should ingest:

```text id="i2xrhf"
Company press releases
Investor presentations
Earnings releases
Earnings transcripts where licensed
Guidance documents
Annual reports
```

The source hierarchy should be:

```text id="6ap3e3"
SEC filing                     Authority = 1.00
Company investor relations     Authority = 0.95
Exchange announcement          Authority = 0.95
Professional news provider     Authority = 0.85
Analyst report                 Authority = contextual
Social media                   Authority = unverified
```

Not literally those numerical values initially, but that concept should exist.

---

# 6. US macroeconomic information — FRED + primary agencies

**FRED** is ideal as the main aggregation API.

It currently provides hundreds of thousands of economic time series sourced from numerous official organisations. ([fred.stlouisfed.org](https://fred.stlouisfed.org/?utm_source=chatgpt.com))

KAIROS should maintain important series such as:

```text id="4ussrs"
Federal Funds Rate
SOFR
US 2Y
US 10Y
US 30Y

2s10s spread
3m10y spread

CPI
Core CPI
PCE
Core PCE
PPI

Unemployment
Nonfarm payrolls
Jobless claims

GDP
Industrial production
Retail sales
Housing

M2
Fed balance sheet
Financial conditions

USD indices

Oil
Gold
Credit spreads
```

But for market-moving events we should also ingest the **primary release** where practical.

Thus:

```text id="stnmvu"
BLS / BEA / Fed announcement
           ↓
       Event ingestion
           ↓
        Macro Agent

AND

FRED time series
           ↓
      historical context
```

This prevents FRED from becoming the only dependency for time-critical event detection.

---

# 7. Europe — ECB Data Portal

Because the system should eventually operate globally, I would directly integrate the **ECB Data Portal API**.

The ECB exposes its statistical data and metadata through an SDMX 2.1 REST API. ([data.ecb.europa.eu](https://data.ecb.europa.eu/help/api/overview?utm_source=chatgpt.com))

Use it for:

```text id="zf3lgq"
ECB policy rates
Euro-area yields
Money supply
Bank lending
Inflation-related series
FX
Financial markets
Credit
Eurozone economic indicators
```

---

# 8. Global macro — IMF + OECD

Then:

### IMF API

Useful for:

```text id="yrdlsg"
GDP
Inflation
balance of payments
government debt
forecasts
global economic indicators
```

The IMF's current data platform exposes programmatic API access to its datasets. ([imf.org](https://www.imf.org/en/data?utm_source=chatgpt.com))

### OECD

Useful for:

```text id="8v5ml5"
leading indicators
employment
productivity
trade
economic activity
cross-country comparisons
```

And potentially World Bank for slower structural economic data.

These feeds are **contextual** rather than second-to-second trading feeds.

---

# 9. Crypto prices — two different sources

This is important.

We need to separate:

### Market intelligence price

from:

### Executable price

For broad crypto-market intelligence I recommend **CoinGecko**.

CoinGecko provides market data across a very broad set of tokens and chains and now provides REST and WebSocket access for CEX/DEX and on-chain market data. ([coingecko.com](https://www.coingecko.com/en/api?utm_source=chatgpt.com))

Use it for:

```text id="z2c708"
BTC
ETH
altcoins
market caps
volumes
token metadata
exchange aggregation
DEX markets
cross-exchange prices
historical prices
```

But we do **not** execute a Coinbase trade based purely on the CoinGecko price.

Immediately before trading:

```text id="xzwkta"
Coinbase order book
        ↓
Risk Engine
        ↓
Execution Engine
```

The executable market state comes directly from the venue.

---

# 10. Crypto derivatives — CoinGlass

This one I would definitely add.

**CoinGlass** provides structured derivatives information including:

```text id="dv1mrf"
Open interest
Funding rates
Liquidations
Liquidation heatmaps
Long/short ratios
Derivatives flows
Spot
Options
ETF data
```

Their current API explicitly covers these categories. ([docs.coinglass.com](https://docs.coinglass.com/?utm_source=chatgpt.com))

Liquidation data can update as frequently as one second, depending on the endpoint/plan. ([docs.coinglass.com](https://docs.coinglass.com/reference/liquidation-order?utm_source=chatgpt.com))

This enables signals like:

```text id="emc7b6"
BTC -4.2%

Price                  ↓↓↓
Liquidations           +$850m
Open interest           -17%
Funding                 +0.034 → +0.004
Spot selling            moderate
News                    none

Inference:

Likely leveraged liquidation cascade
rather than fundamental information shock.
```

This is exactly the sort of information the Crypto Agent needs.

---

# 11. On-chain information — Glassnode

For serious BTC/ETH on-chain intelligence, I would use **Glassnode**.

Glassnode provides institutional digital-asset market and on-chain metrics, including extensive metric catalogues. ([glassnode.com](https://glassnode.com/?utm_source=chatgpt.com))

Potential features:

```text id="wpdxg6"
Exchange inflows
Exchange outflows
Exchange balances

Active addresses
Transaction count
Transfer volume

Realised cap
MVRV
SOPR
NUPL

Long-term holder supply
Short-term holder supply

Miner behaviour

Stablecoin supply

Profit/loss metrics
```

Particularly useful is its point-in-time data concept: historical data can represent what was known at that specific point in time, which is extremely valuable for avoiding look-ahead problems in research. ([docs.glassnode.com](https://docs.glassnode.com/data/point-in-time-metrics?utm_source=chatgpt.com))

That is crucial for KAIROS backtesting.

---

# 12. Exchange-native crypto feeds

We should also connect directly to exchanges.

For Coinbase, for example, Advanced Trade exposes REST order-management APIs plus real-time WebSocket market and user-order feeds. ([docs.cdp.coinbase.com](https://docs.cdp.coinbase.com/coinbase-app/advanced-trade-apis/overview?utm_source=chatgpt.com))

We collect:

```text id="crlbzy"
Order book
Trades
Best bid
Best ask
Spread
Depth
Our orders
Our executions
Balances
```

For any venue where we actually trade:

> **That venue is the authoritative source for execution-time market state and account state.**

---

# 13. Equity broker — Interactive Brokers

For real equity execution, **IBKR would be my initial recommendation**.

The TWS API supports autonomous data retrieval and trading and has official C# support, which fits the .NET 10 architecture particularly well. ([ibkrcampus.com](https://ibkrcampus.com/campus/ibkr-api-page/twsapi-doc/?utm_source=chatgpt.com))

The adapter looks like:

```text id="8pjnw0"
Kairos.Execution
       │
       ▼
IBrokerAdapter
       │
       ├── InteractiveBrokersAdapter
       ├── AlpacaAdapter
       └── FutureBrokerAdapter
```

Methods:

```csharp id="7xuoy9"
GetAccounts()
GetPositions()
GetBalances()
GetQuote()
GetOrders()

PlaceOrder()
CancelOrder()
ReplaceOrder()

GetExecutions()
```

Agents never receive this interface.

Only:

```text id="30nxkj"
Execution Engine
```

does.

---

# 14. Alpaca — excellent development/paper environment

I would also integrate **Alpaca**, particularly early in the project.

Its paper environment simulates live trading using real-time market data and follows the same basic API workflow as live trading. ([docs.alpaca.markets](https://docs.alpaca.markets/us/docs/paper-trading?utm_source=chatgpt.com))

Therefore early development could use:

```text id="ct5iek"
KAIROS
  ↓
Risk Engine
  ↓
Execution Engine
  ↓
Alpaca Paper
```

before any real money is involved.

Whether Alpaca becomes a production broker is a separate deployment/jurisdiction decision.

---

# 15. Crypto broker — Coinbase Advanced Trade

Initial crypto execution adapter:

**Coinbase Advanced Trade**.

The API supports programmatic order creation/management, portfolios and real-time market feeds. ([docs.cdp.coinbase.com](https://docs.cdp.coinbase.com/api-reference/advanced-trade-api/rest-api/introduction?utm_source=chatgpt.com))

Then later:

```text id="qwpc26"
ICryptoExchange
       │
       ├── Coinbase
       ├── Kraken
       └── others
```

Again, the agents cannot access:

```text id="czotsf"
PlaceOrder()
```

---

# 16. What about social media?

I would **not make Twitter/X, Reddit, Stocktwits etc. part of the authoritative v1 signal set**.

Eventually:

```text id="nplcue"
X
Reddit
Stocktwits
Google Trends
maybe prediction markets
```

can feed a:

```text id="8sfi55"
Sentiment Agent
```

But the output should be classified as:

```text id="t9wyh4"
UNVERIFIED ALTERNATIVE DATA
```

rather than fact.

Social sources are extremely noisy and susceptible to manipulation.

---

# 17. Analyst estimates and revisions

This is useful enough that I would make it explicit.

Potentially sourced through Intrinio or a dedicated institutional provider later.

Data required:

```text id="zj3frd"
Consensus EPS
Consensus revenue
Target price
Estimate revisions

Upward revisions
Downward revisions

Earnings surprise history
Guidance vs consensus
```

The really useful feature isn't:

```text id="zllltd"
Consensus EPS = $4.52
```

It is:

```text id="xw1zf2"
Consensus EPS

90 days ago   $4.21
60 days ago   $4.28
30 days ago   $4.39
today         $4.52

Revision momentum = STRONGLY POSITIVE
```

That becomes a quantitative feature.

---

# 18. Data shouldn't go directly to agents

This is another architectural change I would make explicit in the PRD.

Bad architecture:

```text id="6zr5t5"
Agent
 ↓
Massive API

Agent
 ↓
Glassnode

Agent
 ↓
FRED
```

Good architecture:

```text id="fjkbuf"
                      PROVIDERS

 Massive   Intrinio   SEC   Benzinga   FRED
    │          │       │       │        │
    └──────────┴───────┴───────┴────────┘
                       │
                       ▼
             KAIROS INGESTION LAYER
                       │
                       ▼
                NORMALISATION
                       │
                       ▼
               KAIROS DATA MODEL
                       │
          ┌────────────┼────────────┐
          │            │            │
          ▼            ▼            ▼
     Data Explorer  PostgreSQL   AI Search
          │            │            │
          └────────────┼────────────┘
                       ▼
                KAIROS TOOL API
                       │
                       ▼
                    AGENTS
```

This gives us **control over what an agent sees**.

---

# 19. Agent tools become our APIs

An agent would receive tools like:

```text id="k5d5t5"
market.get_quote
market.get_bars
market.get_order_book

fundamentals.get_company
fundamentals.get_financials
fundamentals.get_estimate_revisions

filings.search
filings.get

news.search
news.get_latest

macro.get_series
macro.get_regime

crypto.get_market
crypto.get_funding
crypto.get_open_interest
crypto.get_liquidations
crypto.get_onchain_metrics

portfolio.get_positions
portfolio.get_exposure
portfolio.get_performance

quant.calculate_indicator
quant.calculate_factor
quant.calculate_correlation
quant.run_model
```

Not:

```text id="m2k9uw"
HTTP GET random URL
```

That is a major security and reliability boundary.

---

# 20. Every piece of information gets provenance

I would make this mandatory.

Every datum should be wrapped conceptually as:

```json id="1a3adf"
{
  "instrument": "NVDA",
  "field": "last_price",
  "value": 184.42,
  "source": "massive",
  "source_timestamp": "...",
  "received_timestamp": "...",
  "quality": "LIVE",
  "age_ms": 32
}
```

For news:

```json id="go9dzc"
{
  "event": "GUIDANCE_RAISED",
  "instrument": "NVDA",
  "source": "SEC",
  "document": "8-K",
  "published_at": "...",
  "retrieved_at": "...",
  "authority": "PRIMARY",
  "evidence_id": "..."
}
```

Then an agent can't simply claim:

> NVIDIA raised guidance.

Its output must reference:

```text id="ei0jv0"
Evidence IDs:
SEC-983178
BZ-421917
```

That gives us traceability.

---

# 21. Source-of-truth hierarchy

This should be formally defined.

### Prices

```text id="cwxbnb"
Analysis:
Massive / CoinGecko

Execution:
Actual broker/exchange
```

### Company fundamentals

```text id="w5uukp"
Primary:
SEC / company filing

Normalised:
Intrinio
```

### News

```text id="gdp1wk"
Primary event:
SEC / company / government agency

Discovery:
Benzinga
```

### Macro

```text id="z02u8c"
Primary:
Fed / BLS / BEA / ECB / etc.

Historical aggregation:
FRED / ECB / IMF / OECD
```

### Crypto on-chain

```text id="nra3vu"
Analytics:
Glassnode

Derivatives:
CoinGlass

Actual execution market:
Exchange API
```

### Portfolio/account

```text id="n041tj"
Internal:
KAIROS Ledger

External reconciliation:
Broker/exchange

Discrepancy:
BLOCK TRADING + investigate
```

That last one is important.

---

# 22. Data flow in Azure

Putting everything together:

```text id="ejbz5n"
 EXTERNAL INFORMATION SOURCES
 │
 ├── Massive ───────────────────── Equities
 ├── Intrinio ──────────────────── Fundamentals
 ├── SEC EDGAR ─────────────────── Filings
 ├── Benzinga ──────────────────── News
 ├── FRED ──────────────────────── US Macro
 ├── ECB ───────────────────────── EU Macro
 ├── IMF/OECD ──────────────────── Global Macro
 ├── CoinGecko ─────────────────── Crypto
 ├── CoinGlass ─────────────────── Derivatives
 ├── Glassnode ─────────────────── On-chain
 ├── IBKR ──────────────────────── Broker/account
 └── Coinbase ──────────────────── Exchange/account
                    │
                    ▼
           KAIROS CONNECTORS
                    │
                    ▼
             Azure Event Hubs
                    │
                    ▼
          NORMALISATION ENGINE
                    │
       ┌────────────┼──────────────┐
       │            │              │
       ▼            ▼              ▼
 Azure Data     PostgreSQL      Data Lake
 Explorer
       │
       │       Documents
       │            │
       │            ▼
       │      Azure AI Search
       │            │
       └────────────┼──────────────┐
                    │              │
                    ▼              ▼
              Agent Tools      Quant Engine
                    │              │
                    └──────┬───────┘
                           ▼
                     KAIROS AGENTS
```

---

# 23. My actual v1 vendor decision

Rather than leave this open-ended, I would put the following into the PRD as the **baseline implementation**:

```text id="w83b89"
EQUITIES
────────────────────────────────────
Market data        Massive
Fundamentals       Intrinio
Filings            SEC EDGAR
News               Benzinga

MACRO
────────────────────────────────────
US                  FRED + official agencies
Europe              ECB
Global              IMF + OECD

CRYPTO
────────────────────────────────────
Market aggregation  CoinGecko
Derivatives         CoinGlass
On-chain            Glassnode
Execution prices    Exchange-native feeds

EXECUTION
────────────────────────────────────
Equities            Interactive Brokers
Development/paper   Alpaca
Crypto              Coinbase Advanced Trade

AZURE STORAGE
────────────────────────────────────
Time series         Azure Data Explorer
Transactions        PostgreSQL
Raw history         Azure Data Lake
Documents/RAG       Azure AI Search
Hot state/cache     Azure Managed Redis
Streaming           Azure Event Hubs
Business messages   Azure Service Bus
Real-time UI        Azure Web PubSub
```

I would **not add more providers initially**. This is already a substantial information universe.

---

## One important change to the architecture

I would add an entirely new first-class KAIROS component:

# **Kairos Intelligence Fabric**

It sits between external providers and agents.

```text id="d10z46"
                     EXTERNAL WORLD
                           │
                           ▼
             ┌────────────────────────┐
             │ KAIROS INTELLIGENCE    │
             │        FABRIC          │
             │                        │
             │ ingestion              │
             │ normalization          │
             │ timestamps             │
             │ provenance             │
             │ data quality           │
             │ entity resolution      │
             │ deduplication          │
             │ feature computation    │
             │ historical storage     │
             └────────────┬───────────┘
                          │
                          ▼
                    AGENT TOOL API
                          │
                          ▼
                       AGENTS
```

This is the missing layer in the original PRD.

**I would update the KAIROS PRD to make these providers, the Intelligence Fabric, source-of-truth rules, agent tool APIs, data schemas, ingestion frequencies, and provider-failover policies explicit.** At that point the system architecture becomes much closer to something we could actually start implementing.

---

# Political, Government & Insider Intelligence

Yes. I would integrate congressional trading, but I would classify it as **alternative data**, not as authoritative evidence that a politician traded on non-public information.

The useful fact is that members of Congress must publicly disclose qualifying transactions under the STOCK Act. Senate guidance defines Periodic Transaction Reports (PTRs) for purchases, sales, or exchanges over $1,000, and the House publishes financial-disclosure reports online. These disclosures are public, but they are delayed rather than real-time, so they are more useful as a behavioral/positioning signal than as an immediate execution signal. ([ethics.senate.gov](https://www.ethics.senate.gov/public/index.cfm/financialdisclosure?utm_source=chatgpt.com))

I would add a new **Political & Government Intelligence Agent** with inputs such as:

```text id="hih4bd"
Congressional trades
Committee memberships
Committee jurisdiction
Congressional hearings
Introduced legislation
Bill progression
Government contracts
Lobbying activity
Corporate political donations
Regulatory announcements
Federal agency actions
```

For congressional trading specifically, I would use **Quiver Quantitative** as the operational API. It exposes House and Senate trade disclosures with politician, ticker, transaction date, filing date, transaction type, value range, and subsequent market-performance fields. It says new trades become available as they are filed. ([api.quiverquant.com](https://api.quiverquant.com/datasets/congress-trades?utm_source=chatgpt.com))

The important signal is not simply:

```text id="dlb2tk"
Congressperson X bought NVDA
```

KAIROS should construct context:

```text id="p6qypx"
Politician: X
Chamber: Senate

Trade:
    NVDA purchase
    $50k–$100k

Transaction date:
    2026-07-12

Disclosure date:
    2026-08-03

Committee memberships:
    Armed Services
    Intelligence

Relevant company exposure:
    AI / defense / government contracts

Recent government events:
    Defense AI procurement activity
    New appropriations
    Relevant committee hearing

Historical politician signal:
    Previous semiconductor trades: 14
    6-month excess-return hit rate: 68%

Signal:
    MODERATELY POSITIVE

Confidence:
    0.61
```

That is much more interesting.

## What I would actually track

There are four distinct political-data signals.

**1. Congressional transaction signal**

```text id="twp6yn"
BUY / SELL
Ticker
Transaction date
Disclosure date
Reported value range
Politician
Spouse/dependent where disclosed
Chamber
```

Because disclosed amounts are generally ranges, KAIROS must not pretend it knows the exact position size.

**2. Politician track record**

KAIROS can calculate its own historical metrics:

```text id="v0f24s"
1-day excess return
7-day
30-day
90-day
180-day

buy hit rate
sell hit rate
sector hit rate
average alpha
median alpha
maximum drawdown
```

That lets us determine whether an individual's disclosed activity has historically been informative.

**3. Committee relevance**

This is potentially more valuable than blindly following trades.

For example:

```text id="ai32sm"
Senator
  ↓
Armed Services Committee
  ↓
buys defense company
  ↓
committee relevance = HIGH
```

versus:

```text id="odemj8"
Senator
  ↓
Agriculture Committee
  ↓
buys Microsoft
  ↓
committee relevance = LOW
```

I would create a relationship graph:

```text id="rp6dl5"
Politician
    ↓
Committee
    ↓
Jurisdiction
    ↓
Sector
    ↓
Company
```

The agent can therefore score whether the trade overlaps with areas in which the member has unusual policy exposure.

But KAIROS should describe this as **potential informational relevance**, not “insider trading.” Public disclosure alone cannot tell us why the transaction occurred or whether non-public information was involved.

## 4. Government activity around the company

This is where the dataset becomes much stronger.

Quiver also exposes data such as:

```text id="4reca7"
Government contracts
Corporate lobbying
Corporate donors
Congress trading
Insider trading
Off-exchange trading
```

For example, its Government Contracts API tracks US government contract awards to publicly traded companies. ([api.quiverquant.com](https://api.quiverquant.com/datasets/government-contracts?utm_source=chatgpt.com))

Now KAIROS could detect a cluster:

```text id="e25iuz"
RTX

Congressional purchase                  +
Relevant committee membership           +
Increasing government contracts         +
Lobbying activity rising                +
Analyst revisions positive              +
Technical momentum positive             +

POLITICAL/GOVERNMENT SIGNAL:
Strong positive
```

That becomes considerably more interesting than copying politicians' portfolios.

---

# I'd also add corporate insiders

This is arguably **more important** than congressional trading.

Executives and directors must disclose many transactions through SEC Form 4 filings. Quiver exposes an Insider Trades API based on those filings, including whether the individual is an officer/director, transaction type, shares, price, and resulting ownership. ([api.quiverquant.com](https://api.quiverquant.com/datasets/insider-trades?utm_source=chatgpt.com))

So KAIROS should have a broader:

# **Insider & Political Activity Agent**

with two branches:

```text id="7g5k0m"
             Insider & Political Agent
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
 Corporate Insider         Political Intelligence
       │                           │
 Form 4 trades             Congress trades
 CEO/CFO/directors         Committees
 ownership change          Legislation
 purchase clusters         Govt contracts
                           Lobbying
```

Corporate insider purchases can be particularly informative because KAIROS can differentiate:

```text id="4vkucn"
CEO open-market purchase
```

from less meaningful events such as:

```text id="qbwb5q"
option exercise
automatic plan
share grant
tax withholding
```

---

# How it enters the existing KAIROS architecture

I would extend the Intelligence Fabric:

```text id="ub4apj"
                   KAIROS INTELLIGENCE FABRIC

Market
├── Massive

Fundamental
├── Intrinio
├── SEC EDGAR

News
├── Benzinga

Macro
├── FRED
├── ECB
├── IMF
├── OECD

Crypto
├── CoinGecko
├── CoinGlass
├── Glassnode

Political / Alternative
├── Congressional disclosures
├── Quiver Quantitative
├── Committee membership
├── Legislation
├── Government contracts
├── Lobbying
└── Corporate insider trades
```

And expose controlled tools:

```text id="dmx2yb"
political.get_recent_trades
political.get_member_trades
political.get_member_performance
political.get_committee_memberships
political.get_relevant_legislation

government.get_contracts
government.get_company_exposure

insiders.get_recent_trades
insiders.get_company_activity
insiders.get_purchase_clusters
```

Then agents can ask things such as:

```text id="zmsw7w"
Which companies have had:

1. multiple congressional purchases,
2. relevant committee exposure,
3. recent insider buying,
4. increasing government contract awards,
5. positive fundamental revisions?
```

That could generate genuinely useful candidate discoveries.

## One major caveat: disclosure latency

This is critical.

Congressional trades can be disclosed **well after the actual transaction**. Quiver describes the STOCK Act disclosure requirement as within 45 days, and its current data visibly contains examples where transaction and filing dates differ materially. ([quiverquant.com](https://www.quiverquant.com/congresstrading/?utm_source=chatgpt.com))

So KAIROS must always retain:

```text id="fqc2st"
transaction_date
disclosure_date
```

and backtests must use:

```text id="gvqgop"
disclosure_date
```

as the date on which KAIROS could have known about the trade.

Otherwise we'd accidentally create massive look-ahead bias:

```text id="09c9c6"
WRONG:

Politician buys NVDA Jan 5
Discloses Feb 10

Backtest gives Kairos knowledge on Jan 5
```

Correct:

```text id="l40o9p"
Jan 5      trade occurred
Feb 10     information becomes public
Feb 10+    Kairos may act on it
```

This distinction is absolutely mandatory.

### My recommendation

**Yes, add it.** And don't make it just a “Congress Tracker.”

Create a broader **Political, Government & Insider Intelligence** data domain. Congressional trades are one signal inside it, combined with committee relevance, legislation, government contracts, lobbying, corporate insider transactions, and subsequent historical performance.

That has the potential to become one of KAIROS's more distinctive alternative-data capabilities.

