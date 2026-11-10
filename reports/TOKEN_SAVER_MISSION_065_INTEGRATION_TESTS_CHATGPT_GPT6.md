# Missão 065 — Integration tests: suíte dos módulos críticos

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: arquitetura de testes Rust/Tauri/SQLite
- Data: 2026-11-10
- Status: PARTIAL — plano de suíte documentado; implementação bloqueada

## Objetivo
Criar uma estratégia de testes de integração para módulos críticos.

## O que esta IA fez
Inspecionou `src-tauri/src/tests.rs`, testes unitários de `advanced.rs`/Smart Context, `db.rs`, `backup.rs`, `path_guard.rs` e workflow CI.

## Evidência
- Existem testes Rust para migração/criação de tabelas, deduplicação/versionamento, chunk UTF-8 e validações pontuais.
- Smart Context possui teste de excerpt Unicode; advanced inclui testes de endpoint, LIKE escaping, ranking e path validation.
- Não foi demonstrada suíte de integração que exercite o fluxo completo de import → DB → blob → Smart Context → backup → restore → integrity.
- Não foi demonstrada concorrência real com conexões independentes para Project Memory, restore destination e Import Roots.
- CI executa cargo check/test e frontend build, mas esta sessão não executou CI.

## Suíte proposta
- Project lifecycle e isolamento de projetos.
- Import e blob dedup/versioning.
- File Center pagination/read chunk.
- Smart Context budget/truncation.
- Project Memory cardinality sob concorrência.
- OneShot crash recovery e symlink.
- Backup/restore resource limits e destination reservation.
- Import Roots locking e bounded parse.
- DB migrations from historical fixtures.
- IPC error contract e frontend command mapping.

## Testes executados
Não executado nesta missão.

## Arquivos alterados
Nenhum. Não foi criada suíte no repositório principal por falta de autorização.

## Relação com trabalho anterior
Aproveita testes existentes; evita duplicar unit tests já presentes e foca nos gaps de integração e concorrência.

## Dependências e limitações
O plano mestre proíbe alteração automática no TokenSaver principal; autorização GPT-6 e definição de harness/fixtures são necessárias.

## RECOMENDAÇÃO AO GPT-6
Criar test harness de integração com tempdir e SQLite real, sem Tauri GUI quando possível; adicionar testes de plataforma em CI para filesystem.
