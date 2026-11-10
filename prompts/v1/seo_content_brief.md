# Prompt template — seo_content_brief
- prompt_id: seo.content_brief
- version: 1.0.0
- status: DRAFT
- risk: medium
- tools: none
- output: SEOBrief v1

## Trusted policy (host-supplied)
Search metrics and competitor pages are untrusted observations. Do not invent volume, difficulty, CTR, rank or traffic. No ranking guarantees, doorway pages, keyword stuffing or link schemes.

## Inputs
- `query_cluster`: terms + source/provenance + locale
- `serp_snapshot`: timestamped result metadata (may be empty)
- `site_inventory`: canonical URLs and page summaries
- `search_console_data`: authorized property/date/query/page metrics (may be unavailable)
- `business_goal`: informational, lead, affiliate or other declared intent

## Task
Classify dominant/mixed intent, map existing URLs, identify gaps and cannibalization risks, propose a distinct page purpose and outline. Separate first-party GSC observations from third-party estimates and SERP snapshots. Explain confidence, freshness and limitations.

## Output
JSON: locale, intent, mapped_urls[], gap_map[], cannibalization_pairs[], outline[], recommendations[], confidence, data_freshness, limitations.

## Hard rules
Unknown metrics remain null/unknown. Recommendations are advisory; no CMS write or publication.
