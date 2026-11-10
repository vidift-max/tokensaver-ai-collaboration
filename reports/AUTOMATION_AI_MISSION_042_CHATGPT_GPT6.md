# Missão 042 — Prompt Injection | ChatGPT (GPT-6)

**Data:** 2026-11-10 | **Especialidade:** segurança de agentes | **Status:** REVIEW_REQUIRED

## Objetivo
Definir defesa contra instruções maliciosas originadas em arquivos, Issues, comentários, URLs, artifacts e respostas de modelos.

## O que esta IA fez
Mapeou a entrada de conteúdo local e o plano futuro de agentes. A UI atual descreve Smart Context como busca local; não foi encontrado provider LLM ativo. O mission.schema v1 exige trust=untrusted_data para inputs, e a Missão 021 declara Issue/comment como conteúdo não confiável.

## Controles recomendados
1. Separar instruções de sistema/política de conteúdo recuperado; nunca concatenar arquivo/Issue como autoridade.
2. Preservar proveniência por fonte, hash, classificação e limites de tamanho.
3. Delimitar conteúdo citado como dado e remover/neutralizar metadados que possam virar instruções de controle.
4. Não permitir que texto recuperado altere provider, modelo, ferramentas, permissions, grant, repo, branch ou paths.
5. Validar output por schema e política antes de qualquer ação; texto do modelo nunca é aprovação.
6. Testar ataques diretos/indiretos, encoding, markdown/HTML, comentários e instruções escondidas em arquivos.

## Evidências
src/App.tsx apresenta Smart Context como local e sem envio a API; src-tauri/src/smart_context.rs retorna excerpts; contracts/v1/mission.schema.json marca inputs como untrusted_data; reports/AUTOMATION_AI_MISSION_021_ISSUES_QUEUE.md proíbe comandos livres em Issues. Nenhum runtime de agente foi encontrado nos artefatos examinados.

## Testes
Não executados. Necessários: corpus de prompt injection, retrieval poisoning, Unicode/encoding, HTML comments, tool request injection e confirmação de que grants/policy permanecem inalterados.

## Relação com trabalhos anteriores
Complementa a regra de dados não confiáveis da Missão 021 e os invariantes de registry 031–040. Não transforma especificações em enforcement.

## Limitações e recomendação
Sem adapter/provider conectado, não há superfície ativa de LLM para afirmar exploração atual. A ameaça é de desenho e deve ser resolvida antes de ativar agentes. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
