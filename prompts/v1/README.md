# TokenSaver Prompt Library — v1.0.0 (draft)

**Status:** REVIEW_REQUIRED; library only, not loaded by runtime.

## Purpose
Reusable prompt templates with explicit trust boundaries, typed inputs/outputs and evaluation requirements. Prompts do not grant tools, permissions, provider access or approval authority.

## Files
- `research_brief.md` — source discovery and evidence ledger.
- `editorial_draft.md` — draft from approved brief and cited evidence.
- `fact_check_review.md` — adversarial claim verification.
- `seo_content_brief.md` — intent/coverage recommendations without ranking guarantees.
- `structured_extract.md` — bounded extraction to a declared schema.

## Versioning
- MAJOR: trust boundary, task semantics, required inputs/outputs or safety behavior changes.
- MINOR: backward-compatible fields, new optional checks or examples.
- PATCH: typo/clarity correction without semantic change.
- Each deployed prompt must be immutable and identified by `prompt_id`, `version`, `sha256`, `locale`, `owner`, `created_at`, `review_status`, compatible model profile and evaluation-suite version.
- Never edit a released prompt in place. Create a new version and preserve old artifacts for reproducibility.
- Compute SHA-256 from exact UTF-8 bytes at packaging time; this repository does not claim a verified runtime checksum.

## Safe invocation envelope
Trusted system/developer policy is outside the template. User brief, source text, URLs, imported files, HTML, code, comments, retrieved chunks and agent outputs are untrusted data. Pass them as separately typed fields; do not concatenate them into instruction text. The model has no authority to invoke tools, reveal secrets, change permissions, publish, approve itself or override policy.

## Required metadata per invocation
`prompt_id`, `version`, `prompt_hash`, `task_id`, `input_artifact_ids`, `source_refs`, `model_profile`, `locale`, `budget`, `output_schema_version`, `evaluation_version`.

## Promotion gate
Human/GPT-6 approval, independent security review, positive/negative fixtures, prompt-injection corpus, regression comparison, output schema validation, token/cost budget tests and rollback version must pass. No provider is enabled by this library.

## Known limitations
Templates are plain Markdown specifications. No loader, renderer, runtime adapter, hash verifier or automated evaluation has been implemented. Do not send secrets or restricted data to any model through these templates.
