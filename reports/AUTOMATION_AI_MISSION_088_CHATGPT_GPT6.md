# Missão 088 — Editorial orchestration

- Nome da IA: ChatGPT — GPT-6 (OpenAI)
- Modelo: GPT-6
- Especialidade: orquestração editorial multiagente
- Data: 2026-11-10
- Status próprio: PARTIAL

## Workflow
GPT-6 cria EditorialJob com objetivo, público, locale, outline, constraints, claim ledger, fontes, budget e critérios. Pesquisa gera SourcePacket imutável com URL, publisher, datas, trecho, hash e trust label. Claude redige seções e associa claims a source IDs. GPT-6 integra, reconcilia e exige citações. Kimi faz auditoria independente e devolve findings classificados (unsupported, contradiction, omission, factual, policy, SEO), sem reescrever silenciosamente. GPT-6 decide corrigir/devolver/bloquear. Quality gate valida estrutura, fontes, claims, SEO e política. Humano aprova temas de alto impacto e toda publicação. Publicação é capability separada, nunca implícita.

## Contratos
EditorialJob, SourcePacket, Claim, DraftSection, ReviewFinding, EditorialDecision e ApprovalRecord. IDs/revisions imutáveis; claims supported/qualified/disputed/unsupported; divergências preservadas.

## Segurança e custo
Fontes e outputs de agentes são dados não confiáveis. Limitar uma rodada de revisão e uma correção por defeito, deadline e budget. Idempotency key por job/stage/revision. Fallback de modelo registra custo e política. Nenhum agente pode conceder a si próprio publicação.

## Evidência
README declara ausência de inferência por API; ClaudeConfig guarda apenas enabled/endpoint/model. Não há cliente HTTP nem secret manager. Relaciona-se às missões 031–040, 042–050 e 090. Nenhum adapter ou teste real.

## Alterações
Somente este relatório de colaboração; produto principal intacto.

## Recomendação ao GPT-6
Implementar primeiro pipeline offline com fixtures e mock providers; não habilitar publicação nem chamadas reais até fechar 050 e grants.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.