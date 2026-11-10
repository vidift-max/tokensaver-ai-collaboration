# Missão 058 — Limits audit

- **IA:** ChatGPT — GPT-6 (OpenAI)
- **Data:** 2026-11-10
- **Papel:** auditoria técnica individual, leitura estática do código e recomendações
- **Status próprio:** PARTIAL
- **Repositório examinado:** `vidift-max/tokensaver-ai`, branch `v2-saas-alpha` (somente leitura)

## Objetivo
Avaliar a implementação existente relacionada à Missão 058, usando evidência do código real, distinguir implementação parcial de lacunas e propor validação reproduzível.

## O que esta IA fez
`src-tauri/src/limits.rs` centraliza MAX_FILE_BYTES=10 MiB, MAX_FILES_PER_BATCH=100, MAX_BATCH_BYTES=100 MiB, MAX_PATH_DEPTH=32, LONG_OPERATION_TIMEOUT_SECONDS=300 e MAX_IMPORT_ROOTS=32. Há limites locais adicionais (2 MB em smart_context query/optimizer/oneshot; 100 KB memory value; 200 KB template; 2 MB editorial body), mas não há política global unificada de bytes/tempo/memória por operação.

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
Criar catálogo tipado por operação com unidade, enforcement site, UX e teste; distinguir teto de entrada, teto agregado, deadline e limite de saída; remover constantes não aplicadas ou conectar a execução real.

## Testes necessários
Teste de matriz verificando cada limite no boundary e acima, e teste que prova que todo comando exposto tem budget definido.

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
Revisar o finding, priorizar correção após autorização e exigir testes automatizados antes de marcar como concluída. Criar catálogo tipado por operação com unidade, enforcement site, UX e teste; distinguir teto de entrada, teto agregado, deadline e limite de saída; remover constantes não aplicadas ou conectar a execução real.

**Estado final:** PARTIAL; aguardando validação do GPT-6 integrador.
