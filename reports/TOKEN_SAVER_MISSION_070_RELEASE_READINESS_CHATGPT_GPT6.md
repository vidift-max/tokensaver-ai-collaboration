# Missão 070 — Release readiness: checklist para versão candidata

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: release engineering e avaliação de prontidão
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — checklist documental; NO-GO até evidências

## Objetivo
Definir checklist técnico verificável para uma release candidate.

## O que esta IA fez
Consolidou evidências de código/CI e dependências das missões 051–069 em critérios go/no-go.

## Checklist obrigatório
1. **Código:** correções aprovadas para findings P0/P1; revisão independente; diff limpo; nenhum segredo.
2. **Build:** cargo check/test/fmt/clippy; npm ci/build/test; build Tauri em Linux e Windows; versões/toolchains fixadas.
3. **Dados:** migrações de versões suportadas; backup/restore real; integridade SQLite/FKs; recovery após falhas.
4. **Limites:** Smart Context, artigos/templates, Restore e Import Roots com budgets comprovados.
5. **Filesystem:** symlink/junction/TOCTOU tests em Linux/Windows; destination reservation concorrente.
6. **Concorrência:** Project Memory, OneShot, Import Roots, restore e migrações com conexões/threads independentes.
7. **Segurança:** Tauri command inventory, CSP, secrets scan, dependency audit, artifact scan e permissões mínimas CI.
8. **Frontend:** smoke tests, keyboard/a11y, error/loading/empty states e fluxos principais.
9. **Artefatos:** artifact allowlist, SHA-256, SBOM/provenance/assinatura conforme política aprovada.
10. **Operação:** versão/changelog, rollback, backup testado, suporte de plataforma, logs sem conteúdo sensível.
11. **Governança:** approvals owner/GPT-6 autenticados; findings aceitos com prazo/compensating controls; required checks no commit exato.
12. **Release:** tag protegida, build reproduzível, digest verificado e promoção separada de build/test.

## Evidências atuais e decisão
- CI consultado executa cargo check/test e npm install/build em Linux/Windows, mas não fmt/clippy, testes frontend, SBOM ou verificação de assinatura.
- Workflow usa Actions por tags e não declara permissions/timeouts/concurrency explicitamente.
- Achados 051–069 permanecem sem correção/teste nesta execução; dependências anteriores 003–010 continuam REVIEW_REQUIRED e 011–020 BLOCKED no registro.
- Não há evidência nesta sessão de release candidate, assinatura, SBOM, provenance, smoke test instalado ou aprovação de owner.

**Decisão: NO-GO para release candidate/produção com base nas evidências disponíveis.** Isso é decisão de readiness documental, não declaração de vulnerabilidade crítica comprovada.

## Testes executados
Não executado. Nenhum build, CI, packaging, install smoke, backup/restore ou release workflow foi disparado.

## Arquivos alterados
Nenhum. Nenhuma tag/release foi criada.

## Relação com trabalho anterior
Consolida as missões 051–069 e gate de segurança 050; não substitui aprovações ou evidências de execução.

## Dependências e limitações
Todos os itens precisam ser vinculados ao commit exato e revisados por pessoa/agente diferente do autor. O plano mestre proíbe alteração do repositório principal sem autorização.

## RECOMENDAÇÃO AO GPT-6
Manter NO-GO. Priorizar correções de Smart Context, Project Memory, OneShot, Restore, Import Roots e paginação; executar matriz de regressão/CI completa; só então emitir aprovação de RC.
