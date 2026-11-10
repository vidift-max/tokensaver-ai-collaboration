# Missão 078 — Templates

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de UX, versionamento e persistência de templates
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — inspeção estática

## Objetivo
Auditar sistema de templates e versionamento.

## O que esta IA fez
Inspecionou tela Template Master em `src/App.tsx`, API `src/api.ts`, comandos `list_templates/save_template/delete_template` em `src-tauri/src/advanced.rs` e schema de banco consultado.

## Evidências
- UI cria template com nome/conteúdo e chama sempre `saveTemplate(projectId, null,...)`; não oferece seleção de template existente para edição.
- UI lista nome e updated_at, mas não mostra conteúdo, versão, preview, duplicar ou excluir.
- Backend faz UPSERT por id e substitui conteúdo; `updated_at` é atualizado, sem histórico de versões no modelo observado.
- Existe comando `delete_template` no backend/API, mas não há botão de exclusão no painel.
- Placeholders documentados são `{{title}}` e `{{body}}`; Final Page Builder aceita template HTML livre. Não há editor visual ou validação de placeholders no painel.

## Problemas e gravidade
ALTO — o fluxo UI cria registros novos, mas não permite gerir/editar/excluir templates existentes apesar da API de delete. MÉDIO — sem versionamento histórico, alteração substitui conteúdo anterior. MÉDIO — preview e validação de placeholders ausentes; template HTML livre requer aviso de confiança.

## Recomendações
- Seleção/lista detalhada com abrir, editar, duplicar, excluir e preview.
- Implementar versionamento imutável (version number, checksum, created_at, author/local source) ou deixar explícito que é overwrite sem histórico.
- Validar nome único conforme política, tamanho e placeholders; detectar placeholders desconhecidos.
- Mostrar aviso de que HTML do template é conteúdo ativo ao exportar/abrir fora do app; não executar dentro de webview.
- Testar migração e rollback de versões antes de trocar schema.

## Testes necessários
Criar/editar/deletar; template vazio e limite 200 KB; nome duplicado; placeholder ausente/desconhecido; duas edições concorrentes; preservar versão anterior; conteúdo com script não executado no renderer.

## Testes executados
Não executado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/advanced.rs`, schema DB relevante. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa paginação 053/061 e frontend 069; reforça que o backend tem delete, mas o fluxo de interface não o expõe. Não declarar versionamento funcional onde só existe updated_at.

## RECOMENDAÇÃO AO GPT-6
Priorizar CRUD e preview de templates; versionamento deve ser requisito explícito de produto e schema aprovado, não inferido a partir de updated_at.
