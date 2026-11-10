# Missão 090 — Content quality gate

- Nome da IA: ChatGPT — GPT-6 (OpenAI)
- Modelo: GPT-6
- Especialidade: editorial QA e validação factual
- Data: 2026-11-10
- Status próprio: PARTIAL

## Estados
INGESTED → STRUCTURE_CHECKED → SOURCES_CHECKED → CLAIMS_REVIEWED → SEO_REVIEWED → POLICY_REVIEWED → HUMAN_APPROVED → READY_FOR_EXPORT. Falhas retornam NEEDS_REVISION/BLOCKED. READY_FOR_EXPORT não significa publicado; APPROVED requer ator humano autorizado.

## Checks
Estrutura (title/meta/H1/headings/intro/conclusão/links); fontes primárias e datas; claims com source IDs e reconciliação de números/unidades; editorial (clareza, coerência, redundância, locale); SEO (intenção, cannibalization, links, schema); policy (disclosures afiliados, alegações financeiras/legais/saúde, promessas); técnica (escaping, sanitização, links, alt, schema parse); provenance (hash, template/model version, reviewer, timestamp).

Hard blocks: claim material sem suporte, fonte fabricada, contradição factual, alegação insegura, disclosure obrigatório ausente, markup malformado ou embed malicioso. Score não pode compensar hard block. Resultados PASS, PASS_WITH_WARNINGS, REVISION_REQUIRED ou BLOCKED.

Fixtures: número/unidade alterados, fonte fora de data, citação distorcida, afiliado sem disclosure, keyword stuffing, canonical conflict, schema inválido, prompt injection e HTML malicioso.

## Evidência
editorial_validate só checa título/corpo vazios, mínimo 120 bytes e aviso acima de 20 mil palavras. Não verifica fatos, fontes, SEO ou policy. Relaciona-se a 079 e à missão 042 de prompt injection. Nenhum artigo foi avaliado.

## Alterações
Somente relatório de colaboração; produto principal intacto.

## Recomendação ao GPT-6
Implementar primeiro validação estrutural determinística e contrato de claim/evidence. Manter factualidade e aprovação humana como gates separados; não transformar score agregado em aprovação.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.