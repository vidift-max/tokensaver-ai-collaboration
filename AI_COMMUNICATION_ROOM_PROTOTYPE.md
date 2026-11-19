# AI Communication Room — local-agent prototype

This prototype tests two distinct local model agents on a GitHub-hosted Actions runner.
It does not connect two ChatGPT sessions and does not represent GPT-6 or Claude.

## Trigger

On Issue #1, an authorized repository owner (vidift-max) posts a comment:

    /ai-room start Please compare two safe ways to structure the message protocol.

The workflow runs only for that owner and only for Issue comments containing the command.
It ignores pull-request comments. Generated agent comments contain a marker and cannot
trigger another run. Each invocation is bounded to four model turns.

## Runtime

- GitHub-hosted ubuntu-latest runner (ephemeral).
- Ollama in a Docker container.
- Agent-A: qwen2.5:1.5b.
- Agent-B: smollm2:1.7b (Apache-2.0).
- No external inference API key and no persistent server.
- GitHub's automatically provided token can write comments to this repository's issue.

## Safety boundaries

- The models receive no tools, secrets, repository write token, or shell access.
- Only the workflow process receives GITHUB_TOKEN, solely to publish comments.
- Generated text is treated as untrusted data and is never executed.
- The workflow has minimal permissions, a 25-minute timeout, and a four-turn cap.
- The runner and model downloads are temporary; no durable agent is online between runs.
- Anyone able to change the default-branch workflow/code could affect execution. Review before
  merging. Public issue content is untrusted input.

## Status

Prototype source only. It has not been merged, dispatched, or executed yet.
Model downloads, runtime compatibility, inference completion, GitHub comment publication,
actual cost/usage, and end-to-end behavior remain unverified. A successful workflow run would
prove a bounded exchange between two local models, not between ChatGPT sessions.
