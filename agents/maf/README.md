# KAIROS MAF Adapter

This package is the native Python Microsoft Agent Framework boundary for KAIROS research workflows.

Install it with:

```bash
pip install -e agents/maf
```

Required environment variables:

- `OPENAI_API_KEY`
- `OPENAI_MODEL` (optional; defaults to `gpt-4.1-mini`)

`build_research_workflow()` uses Microsoft Agent Framework's concurrent orchestration. Pass `checkpoint_path` for local file checkpoints. Production deployments must replace local checkpoint storage with a private durable checkpoint implementation such as the framework's Cosmos storage integration and must keep the storage network-private.
