# Missão 063 — Filesystem audit

## Identificação
- IA: ChatGPT | Modelo: GPT-6 | Especialidade: engenharia de software, Tauri/Rust/SQLite e segurança de produto
- Função: revisão técnica read-only independente | Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo e contribuição própria
Revisar o escopo resumido da Fase F contra o código real do TokenSaver principal, branch `v2-saas-alpha`. Li os relatórios anteriores e produzi avaliação independente. Nenhum código foi alterado.

## Evidências e achados
`lib.rs::project_root`, `smart_context.rs`, `project_memory.rs`, `integrity.rs`, `history.rs` e `advanced.rs::project_root` constroem `app_data_dir/storage/projects/<id>` com validação textual de ID, sem um resolver comum que rejeite symlink/junction nos diretórios-pai e prove confinamento antes de abrir `db.sqlite`. `backup.rs` faz verificações próprias mais fortes; `path_guard::open_verified` tem validação de import path e identidade do handle. ISO-01 permanece específico ao root físico do projeto; não prova mistura lógica entre DBs.
- Severidade: HIGH.
- HEAD consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.
- Arquivos examinados: `src-tauri/src/db.rs`, `src-tauri/src/error.rs`, `src-tauri/src/lib.rs`, `src-tauri/src/advanced.rs`, `src-tauri/src/backup.rs`, `src-tauri/src/path_guard.rs`, `src-tauri/src/tests.rs`, `src/App.tsx`, `src/api.ts`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `.github/workflows/ci.yml` conforme escopo.

## Solução recomendada
Implementar resolver central de projeto que valide storage/projects/projeto e rejeite symlink/junction/reparse points, revalidando em operações sensíveis; usar handles/OS primitives para reduzir TOCTOU. Não tratar canonicalize isolado como defesa completa.

## Testes realmente executados
Não executado. Testar symlink/junction no storage, projects e projeto; troca durante abertura; Linux e Windows; garantir nenhum DB externo aberto/modificado.

## Relação com trabalhos anteriores
Consultei `AI_COLLABORATION.md`, `CENTRAL.md`, `INSTRUCTIONS.md` e `MISSION_PLAN_002_100.md`. A revisão preserva correções e falsos positivos anteriores: importação individual e File Center têm proteções; o CI #193 passou nos dois jobs; isso não substitui testes específicos de segurança, integração ou release.

## Limitações e autoridade
`AUTOMATION_AI_MISSION.md` não contém enunciados formais 051–070; o plano mestre contém somente descrições resumidas. `CENTRAL.md`/ `INSTRUCTIONS.md` reservam mudanças no produto principal ao integrador/engenheiro responsável. Esta é revisão read-only, sem autorização para implementar. Não houve execução local, testes dinâmicos ou release.

## Recomendação ao GPT-6
Implementar resolver central de projeto que valide storage/projects/projeto e rejeite symlink/junction/reparse points, revalidando em operações sensíveis; usar handles/OS primitives para reduzir TOCTOU. Não tratar canonicalize isolado como defesa completa.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
