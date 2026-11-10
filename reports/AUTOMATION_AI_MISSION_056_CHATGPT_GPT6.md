# Missão 056 — Restore destination

- **IA:** ChatGPT — GPT-6 (OpenAI)
- **Data:** 2026-11-10
- **Papel:** auditoria técnica individual, leitura estática do código e recomendações
- **Status próprio:** REVIEW_REQUIRED
- **Repositório examinado:** `vidift-max/tokensaver-ai`, branch `v2-saas-alpha` (somente leitura)

## Objetivo
Avaliar a implementação existente relacionada à Missão 056, usando evidência do código real, distinguir implementação parcial de lacunas e propor validação reproduzível.

## O que esta IA fez
`restore_project_backup` verifica `symlink_metadata(target)` antes de criar `.restore-<uuid>.tmp`, depois publica com `fs::rename(stage,target)`. A verificação de inexistência e publicação não formam uma operação atômica no-cross-platform; outra instância pode criar o destino entre ambas. A restauração já recusa `target_project_id == source_project_id` e usa staging + transação DB.

## Arquivos examinados
- `src-tauri/src/smart_context.rs`
- `src-tauri/src/project_memory.rs`
- `src-tauri/src/file_center.rs`
- `src-tauri/src/advanced.rs`
- `src-tauri/src/backup.rs`
- `src-tauri/src/path_guard.rs`
- `src-tauri/src/db.rs`
- `src-tauri/src/limits.rs`
- `src-tauri/src/commands.rs`
- `src-tauri/src/lib.rs`
- `src-tauri/src/tests.rs`
- `src/App.tsx`, `src/api.ts`, `package.json`, `src-tauri/Cargo.toml`, `.github/workflows/ci.yml`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json` (conforme pertinência)

## Solução recomendada
Criar destino por operação atômica no-replace/claim lock com identidade de operação; revalidar diretório pai e destino imediatamente antes da publicação; definir semântica Windows/POSIX e rollback quando o destino for ocupado.

## Testes necessários
Teste com duas restaurações concorrentes para mesmo target, criação externa concorrente, symlink/junction no parent, crash antes/depois do rename e garantia de não sobrescrever.

## Testes realmente executados
- Fetch/leitura estática de arquivos do repositório via GitHub.
- Nenhum build, teste Rust/TypeScript, CI, teste dinâmico, benchmark, fuzz, stress ou teste multi-plataforma foi executado nesta sessão.

## Relação com trabalhos anteriores
Foram lidos os registros das Missões 041–050 e o plano mestre. Esta contribuição é uma avaliação individual do código atual; não substitui relatórios anteriores nem afirma que propostas anteriores foram implementadas. Não foram localizados relatórios prévios de 051–070 nos paths canônicos consultados antes da criação deste documento.

## Alterações e limitações
- Arquivos do TokenSaver principal alterados: **nenhum**.
- Secrets, providers, workflows, Issues, PRs, settings ou permissões alterados: **nenhum**.
- Limitação: análise estática de arquivos selecionados; não é certificação de segurança nem prova de comportamento em runtime.

## Recomendação ao GPT-6
Revisar o finding, priorizar correção após autorização e exigir testes automatizados antes de marcar como concluída. Criar destino por operação atômica no-replace/claim lock com identidade de operação; revalidar diretório pai e destino imediatamente antes da publicação; definir semântica Windows/POSIX e rollback quando o destino for ocupado.

**Estado final:** REVIEW_REQUIRED; aguardando validação do GPT-6 integrador.
