# Missão 041 — Threat Model

**Identificação:** ChatGPT — GPT-6 | **Especialidade:** segurança de aplicações e arquitetura multiagente | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED — especificação documental, não controle implantado.

**Escopo:** análise estática/documental. Nenhum código do repositório principal foi alterado; nenhum secret foi acessado; nenhum teste dinâmico foi executado.

## Objetivo e contribuição própria
Modelei ativos, atores, fronteiras de confiança e ameaças STRIDE para a aplicação Tauri 2 / React / Rust / SQLite e para a futura arquitetura multiagente. Diferenciei achados de código de riscos de componentes ainda propostos.

## Arquivos examinados
- TokenSaver: AI_COLLABORATION.md (SHA fb3a873713c45984160ae96196ce19543b43de57), src-tauri/src/lib.rs (SHA 2083acb1d685593928f35425beb1acd60043b5be), src-tauri/src/advanced.rs (SHA ffc14545043ca41bcd49a3181c0b21dcf6ba36cf), src-tauri/tauri.conf.json (SHA 1c3463cd583f10ae409b3c65345722c2aaf733b9), src-tauri/capabilities/default.json (SHA 349c36a3577e02f844b720428ae906d06e4ed575).
- Colaboração: CENTRAL.md, INSTRUCTIONS.md, matriz 010, relatório 030 e especificação consolidada 031–040.

## Ativos e fronteiras
Dados de projeto (SQLite, arquivos, blobs, memória, templates); integridade/backup; segredos futuros de providers/GitHub/webhooks; identidade/grants/aprovações/leases; código, dependências, workflows e artifacts. Fronteiras: OS/filesystem ↔ Tauri; WebView ↔ IPC; projeto A ↔ B; conteúdo não confiável ↔ instruções; adapter ↔ provider; agente ↔ policy engine; evento ↔ worker; dependências ↔ artifact.

## Threat register
| ID | Ameaça | Impacto | Controle prioritário |
|---|---|---|---|
| TM-01 | path traversal, symlink, TOCTOU | acesso/alteração fora do projeto | resolver raiz segura, handles e testes de corrida |
| TM-02 | prompt injection em arquivo/Issue | agente desvia tarefa ou tenta revelar contexto | rotular como dado, separar instruções |
| TM-03 | tool injection/confused deputy | operação privilegiada fora do grant | broker, ABAC e deny-by-default |
| TM-04 | SSRF/DNS rebinding/redirect | acesso a rede interna/metadata | parser URL, allowlist, validação DNS/redirect |
| TM-05 | secret leakage | comprometimento de provider/GitHub | vault, redaction, egress control |
| TM-06 | replay/forgery | duplicação de execução/efeitos | HMAC, timestamp, nonce, inbox transacional |
| TM-07 | supply chain | código/dependência maliciosa | lockfiles, SHA pinning, SBOM/provenance |
| TM-08 | resource exhaustion | indisponibilidade | budgets de bytes/CPU/time/concurrency |
| TM-09 | cross-project leakage | violação de isolamento | autorização server-side em cada comando |
| TM-10 | artifact/log leakage | exposição de dados/segredos | allowlist, classificação, retenção mínima |

## Severidade e plano
Prioridade crítica antes de automação privilegiada: TM-02/03/05/06. Alta: TM-01/04/07/09/10. Disponibilidade: TM-08. São prioridades qualitativas, não CVSS nem exploração confirmada. Exigir executor separado de auditor/aprovador, grant por repo/ref/path/action/commit/TTL, logs redigidos, egress allowlist e testes negativos fail-closed.

## Testes necessários
Symlink race, isolamento entre projetos, prompt injection, tool call sem grant, secret canary em logs/artifacts, SSRF para loopback/private/link-local/metadata, replay concorrente, dependência adulterada, artifact não autorizado e flood de arquivos/bytes.

## Testes executados
Não executado: pentest, fuzzing, threat simulation, build, CI ou testes dinâmicos.

## Relação com trabalhos anteriores
Aproveita matriz 010, auditoria 030, contratos 031–040 e achados registrados em AI_COLLABORATION.md. Complementa com ativos/fronteiras; não substitui nem aprova esses documentos.

## Limitações e status
Não foi localizado runtime multiagente, policy engine, secret manager ou webhook receiver operacional. Riscos futuros foram rotulados como arquiteturais. **REVIEW_REQUIRED.** Recomendo revisão independente de Kimi e aprovação GPT-6/owner antes de implementação. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.