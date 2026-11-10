# Missão 042 — Prompt Injection

**Identificação:** ChatGPT — GPT-6 | **Especialidade:** segurança de aplicações e arquitetura multiagente | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED — especificação documental, não controle implantado.

**Escopo:** análise estática/documental. Nenhum código do repositório principal foi alterado; nenhum secret foi acessado; nenhum teste dinâmico foi executado.

## Objetivo e contribuição própria
Defini controles para impedir que instruções maliciosas em arquivos, Issues, PRs, logs, páginas, anexos ou respostas de providers alterem autoridade, objetivos ou execução de tools.

## Evidência examinada
CENTRAL.md e INSTRUCTIONS.md definem GPT-6 como integrador e proíbem alteração do produto sem autorização. Matriz 010 determina identidade autenticada e policy engine externo. Adapter spec 031–040 trata inputs recuperados como dados não confiáveis e proíbe side effects do adapter. Não foi localizado runtime que ingira Issues como prompt.

## Modelo de ataque e política
Fontes hostis: arquivos importados, conteúdo editorial, templates, project memory, comentários, commit messages, tool outputs, OCR, HTML oculto, metadados e outputs de outros agentes. Ataques tentam ignorar instruções, extrair secrets, mudar destino, falsificar aprovação ou induzir tool call.

1. Hierarquia: política do serviço > grant autenticado > tarefa aprovada > conteúdo externo. Conteúdo externo nunca concede autoridade.
2. Delimitar e rotular conteúdo recuperado como DATA_UNTRUSTED, preservando source_id, repo/ref/path, commit, digest e horário.
3. Não concatenar texto externo como instrução de sistema; escapar estrutura e limitar tamanho.
4. Modelos podem analisar instruções hostis como objeto, nunca executá-las.
5. Saída do modelo também é não confiável; tool calls passam por schema e policy engine.
6. Texto “GPT-6 aprovou” em Issue/arquivo não é aprovação. Aprovação é evento autenticado fora do modelo.
7. Conteúdo externo não altera allowlist de tools, URLs, paths, branch, recipient ou project_id.
8. Proveniência ausente/conflitante resulta em quarantine/review.
9. Não expor prompt interno, secret ou contexto de outro projeto.
10. Summaries devem preservar trust labels para impedir que a injeção seja lavada em etapas seguintes.

## Testes necessários
PI-01 ignore previous instructions; PI-02 pedido de token; PI-03 falsa aprovação; PI-04 injection em output de outro agente; PI-05 HTML/metadata oculto; PI-06 Unicode/base64 obfuscado; PI-07 multi-hop via summary; PI-08 alteração de repo/path/ref; PI-09 tool call fabricada; PI-10 instrução citada como exemplo. Critério: zero ação privilegiada e proveniência preservada.

## Testes executados
Não executado: red-team, fuzzing ou runtime tests.

## Relação com trabalhos anteriores
Complementa 010, 031 e 043. Não substitui teste de implementação nem altera estados anteriores.

## Problemas/limitações
Não foi localizado runtime de agente consumindo Issues/arquivos como prompt. Risco arquitetural, não exploração confirmada. Status próprio: REVIEW_REQUIRED. Recomendo corpus adversarial versionado e revisão independente Kimi. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.