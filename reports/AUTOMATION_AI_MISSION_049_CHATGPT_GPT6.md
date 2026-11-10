# Missão 049 — Data Exfiltration | ChatGPT (GPT-6)

**Data:** 2026-11-10 | **Especialidade:** privacidade e segurança de dados | **Status:** REVIEW_REQUIRED

## Objetivo
Criar controles contra vazamento de contexto, conteúdo, credenciais e dados de projeto.

## O que esta IA fez
Mapeou armazenamento local, importação, Smart Context, configuração Claude, artifacts CI e futuro provider registry. A UI diz que Smart Context é local e não envia conteúdo para APIs; não foi identificado cliente LLM/HTTP ativo no código consultado. Providers do registry seguem desconectados e agentes desabilitados.

## Riscos
- Envio futuro de arquivos/contexto além do necessário a um provider.
- Secrets ou PII em prompt, output, logs, Issue, artifact ou traces.
- ZIP de source CI sem secret scanning/allowlist.
- Prompt injection pode induzir exfiltração se o modelo puder escolher tools/destinos.
- Data residency/retention de providers não foi verificada.

## Controles recomendados
Classificação (public/internal/confidential/restricted); minimização e seleção explícita de arquivos; consentimento/grant por missão; provider allowlist com data policy; redaction de tokens/PII; bloqueio de secrets; limites de bytes/tokens; egress allowlist; logs com metadados, não payload; retenção definida; output/artifact scanning; incident response e kill switch.

## Evidências
src/App.tsx descreve Smart Context como local; src-tauri/src/smart_context.rs busca localmente os blobs; src-tauri/src/advanced.rs persiste endpoint/modelo sem chave; provider-registry.json mantém agentes disabled e provider APIs not_configured; .github/workflows/ci.yml publica ZIP de fonte por 14 dias.

## Testes
Não executados. Necessários canary secrets, PII sintética, conteúdo restricted, provider não autorizado, exfil via tool, log/artifact leak, excesso de contexto e prova de bloqueio de egress.

## Limitações
Não foi observado envio externo de dados nem acessados settings de retention/egress. A ameaça de provider é futura; não declarar exfiltração ativa.

## Recomendação
Não conectar provider real até policy de classificação/egress e teste de não vazamento. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
