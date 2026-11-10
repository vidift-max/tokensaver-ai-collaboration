# Missão 049 — Data Exfiltration

**Identificação:** ChatGPT — GPT-6 | **Especialidade:** segurança de aplicações e arquitetura multiagente | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED — especificação documental, não controle implantado.

**Escopo:** análise estática/documental. Nenhum código do repositório principal foi alterado; nenhum secret foi acessado; nenhum teste dinâmico foi executado.

## Objetivo e contribuição própria
Mapeei caminhos de exfiltração de dados de projeto, segredos e contexto entre projetos via prompts, tools, logs, artifacts, backup e egress.

## Evidência examinada
AI_COLLABORATION.md descreve Tauri/React/Rust/SQLite, arquivos, blobs e memória. src-tauri/src/lib.rs recebe project_id nos comandos IPC, portanto autorização/ownership devem ser verificadas no backend. advanced.rs guarda endpoint/model/enabled, sem cliente HTTP ativo localizado. Adapter spec 031–040 propõe contexto mínimo e não persistir raw response por padrão.

## Caminhos de exfiltração
Context stuffing; prompt injection; tool output fora do escopo; logs/traces/crash dumps; ZIP/artifact/cache; provider endpoint customizado; exception com headers; backup/export; cross-project IDOR; summaries que reintroduzem dados removidos.

## Controles
- Classificação PUBLIC/INTERNAL/CONFIDENTIAL/SECRET/PERSONAL; default CONFIDENTIAL para conteúdo de projeto e SECRET para credenciais.
- Minimização por tarefa: allowlist de arquivos/fields e budgets; nunca enviar projeto inteiro por padrão.
- Ownership/autorização no backend em cada comando; project_id não prova acesso.
- Redaction antes de prompt, log, trace, error e artifact.
- Egress allowlist; modelo não escolhe destino/projeto sem validação.
- DLP de saída com secret patterns, canary e PII detectors; findings bloqueiam/quarentenam.
- Artifact allowlist, manifest, hash, classificação e retenção mínima.
- Isolamento também em cache, embeddings, memória, summaries e dedup.
- Human review para export CONFIDENTIAL.
- Backups não devem incluir vault/secret material.

## Testes necessários
DE-01 prompt pede secret; DE-02 canary em log; DE-03 projeto A pede dados B; DE-04 summary reintroduz texto removido; DE-05 artifact contém .env; DE-06 URL não allowlisted; DE-07 tool retorna arquivo fora do escopo; DE-08 DLP token sintético; DE-09 cache cross-tenant; DE-10 backup contém secret.

## Testes executados
Não executado: DLP, secret scan, tenant isolation, egress ou artifact scan.

## Relação com trabalhos anteriores
Complementa 010, 026, 030, 031 e 045.

## Limitações/status
Não houve auditoria completa de tráfego de rede nem de todos os módulos de backup/filesystem. Cenários não são vazamentos confirmados. REVIEW_REQUIRED. Implementar data-flow policy e testes cross-project antes de conectar providers. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.