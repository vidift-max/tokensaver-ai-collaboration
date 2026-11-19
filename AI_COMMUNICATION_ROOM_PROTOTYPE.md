# AI Communication Room — local-agent prototype

This prototype tests two distinct local model agents on a GitHub-hosted Actions runner.
It does not connect two ChatGPT sessions and does not represent GPT-6 or Claude.

## Trigger

On Issue #1, the repository owner (vidift-max) posts a comment beginning with:

    /ai-room start Please compare two safe ways to structure the message protocol.

The workflow ignores pull-request comments and accepts only this exact prefix from the owner on Issue #1. Generated agent comments do not match the trigger. Each invocation is bounded to four model turns.

## Runtime

- GitHub-hosted ubuntu-latest runner (linux/amd64 expected).
- Official Ollama Docker image pinned to linux/amd64 manifest digest `sha256:a372a1c0d1e15b68e9521189785c3ca17795c26c2356f8b1b10122cfb59ed0d7`.
- Agent-A: `qwen2.5:1.5b`.
- Agent-B: `smollm2:1.7b` (Apache-2.0).
- No external inference API key and no persistent server.
- GitHub's automatically provided token can read the Issue comment ledger and write comments.

## Safety boundaries

- The models receive no tools, secrets, repository write token, or shell access.
- Only the workflow process receives GITHUB_TOKEN, solely to inspect the Issue comment ledger and publish comments.
- Generated text is treated as untrusted data and is never executed.
- Model-generated @ mentions are neutralized to avoid accidental user notifications.
- The initial user prompt is limited to 2,000 characters; model output is limited to 4,000 characters.
- The workflow has minimal permissions, a 25-minute timeout, and a four-turn cap.
- The runner and model downloads are temporary; no durable agent is online between runs.
- Anyone able to change the default-branch workflow/code could affect execution. Review before merging.

## Duplicate-delivery protection

- Workflow concurrency is serialized by Issue number.
- Each run receives the triggering GitHub comment ID.
- Before inference, the script scans the Issue comment ledger for output carrying that source ID; if found, it skips the run.
- If the ledger cannot be read completely, the script fails closed before inference.
- This protects completed runs from webhook redelivery. It is not a transactional exactly-once guarantee if a run is interrupted partway through publishing its four replies.

## Offline tests

Run `python3 scripts/test_ai_room_exchange.py` to verify:
- four alternating model calls and four comment payloads with mocked HTTP;
- duplicate source-comment detection skips inference;
- API ledger failures fail closed;
- oversized prompts and invalid source IDs are rejected before inference;
- generated @ mentions are neutralized.

These tests do not invoke real models or GitHub.

## Supply-chain note

The Docker Hub page for the official Ollama 0.40.16 image identifies the pinned manifest digest above for linux/amd64. Re-verify the digest and platform before changing the image reference.

Agent labels distinguish two model configurations within one workflow; they are not cryptographic workload identities.

## Status

Prototype source only. It has not been merged, dispatched, or executed in GitHub Actions.
Offline tests have been reproduced in an isolated local harness with mocked HTTP; this does not validate runner behavior.
Model downloads, runtime compatibility, inference completion, GitHub comment publication, actual cost/usage, and end-to-end behavior remain unverified. A successful workflow run would prove a bounded exchange between two local models, not between ChatGPT sessions.
