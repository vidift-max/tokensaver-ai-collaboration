# Missão 068 — Tauri security: comandos, permissões e fronteiras

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de segurança Tauri 2 / IPC
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — auditoria estática parcial

## Objetivo
Auditar superfície de comandos, capabilities, permissões e fronteiras frontend/backend.

## O que esta IA fez
Inspecionou `src-tauri/src/lib.rs`, `src-tauri/capabilities/default.json`, `tauri.conf.json`, `src/api.ts` e `src/App.tsx`.

## Evidência
- `lib.rs::run()` registra explicitamente comandos via `tauri::generate_handler!`, incluindo importação, File Center, backup/restore, Smart Context, Project Memory, templates, artigos, links, OneShot e Import Roots.
- Capability `default` aplica-se à janela `main` e declara `core:default`; não há capability customizada por domínio/comando nesse arquivo.
- Os comandos de aplicação recebem inputs controlados pelo renderer; precisam validar IDs, tamanhos, paths e ownership no backend, não confiar na UI.
- CSP está definida no Tauri config; não foi feita análise dinâmica de XSS/navigation nem de permissões do SO.
- `invoke_handler` e capability JSON são superfícies distintas; não assumir que capability default, sozinha, substitui validação de cada comando customizado.

## Problema e gravidade
ALTO — superfície IPC ampla; a revisão estática não prova least privilege nem robustez de todos os handlers.

## Solução proposta
Inventário command-by-command: inputs, validações, side effects, project scope, filesystem, limite e erro. Aplicar allowlist/validation backend; avaliar capabilities e CSP por janela; limitar navigation, asset protocol e shell/open plugins (se habilitados). Documentar comandos internos versus renderer-facing.

## Testes necessários
Invocar comandos com IDs inválidos, paths traversal, payloads acima do limite, project cross-scope; CSP/XSS; navigation externa; capabilities por janela; verificar que comandos não autorizados não podem ser chamados.

## Testes executados
Não executado. Nenhum teste Tauri/runtime foi executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Complementa matriz de comandos e riscos IPC; relaciona-se a ISO-01, TAI-02 e threat model 041.

## Dependências e limitações
Auditoria parcial: nenhum teste de webview, OS permission ou bundle foi realizado; nenhuma permissão foi alterada.

## RECOMENDAÇÃO AO GPT-6
Criar inventário completo de invoke commands e testes negativos; revisar cada boundary antes de ativar plugins ou ampliar permissões.
