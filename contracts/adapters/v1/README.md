# Adapter registry — v1 draft

This directory contains proposed provider/agent adapter contracts and a non-operational registry.

## Files
- `provider-registry.json`: catalog of providers, agent roles and capability profiles. All agents are disabled and manual-assisted.
- Shared mission contracts live in `contracts/v1/` and remain pending GPT-6 approval.

## Required invariants
1. Provider, agent, model, adapter, deployment and capability profile are distinct identifiers.
2. `enabled` defaults to false.
3. No credential values, API keys, tokens, cookies or webhook secrets are stored here.
4. `credential_ref` is an opaque secret-manager reference only.
5. A declared capability is not a permission grant.
6. Runtime policy checks authenticated identity, repository, operation, path, risk, data classification and approval independently.
7. Model IDs, endpoints, pricing, quotas and API support must be verified for each deployment before enablement.
8. GPT-6 approval must be an authenticated external action; no model can self-approve.
9. Fallback preserves mission/revision lineage and reserves budget before a new attempt.
10. A mock provider validates adapter contracts only; it does not prove real provider compatibility.

## Activation gate
Do not enable any entry until:
- contracts 003–010 are formally approved;
- runtime dependencies from 011–020 exist and pass their tests;
- provider API and model deployment are confirmed;
- credentials are stored in an approved secret manager;
- limits/pricing are versioned and reviewed;
- the shared mock contract suite passes;
- GPT-6 and the repository owner approve deployment.

Registry status: `review_required`; all entries `enabled=false`.
