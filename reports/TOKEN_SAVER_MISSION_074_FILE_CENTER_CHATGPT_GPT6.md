# Missão 074 — File Center

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: UX de gestão de arquivos e desenho de interação
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — auditoria estática

## Objetivo
Revisar UX e limites do File Center.

## O que esta IA fez
Inspecionou painel File Center em `src/App.tsx`, tipos e wrappers em `src/api.ts`, backend `src-tauri/src/file_center.rs` e limites em `src-tauri/src/limits.rs` (path citado no módulo).

## Evidências
- Backend implementa `list_project_files(offset, limit)`, limita página a 100 e retorna `has_more`; leitura de versão é chunked e valida tamanho/SHA-256.
- UI chama `listProjectFiles(projectId, 0, 50)` e armazena somente `page.items`; ignora `has_more`, `offset` e `limit`. Não há controles de próxima/anterior página.
- A listagem exibe caminho, versão, bytes e prefixo SHA; não há ação de abrir, pré-visualizar, ler versão, baixar/exportar ou comparar versões.
- Importação exige caminho absoluto manual e caminho lógico manual; formatos aceitos são TXT, MD, JSON, HTML e CSS; autorização de root fica em Settings.
- Empty state existe, mas não diferencia projeto não inicializado, filtro vazio e falha de carregamento.

## Problemas e gravidade
ALTO — paginação de backend não é exposta pela UI; acima de 50 arquivos o usuário não consegue navegar para o restante. MÉDIO — falta de preview/read/export reduz utilidade do centro de arquivos. MÉDIO — import path manual é suscetível a erro de digitação e pouca descoberta.

## Recomendações
- Implementar paginação cursor/offset com Previous/Next, total se disponível e estado de carregamento.
- Mostrar caminho lógico, versão, tamanho formatado, data e status de integridade; SHA completo em detalhe/copiar.
- Adicionar preview de texto por chunks e seleção de versão, sem carregar blob inteiro no renderer.
- Export/download com diálogo nativo e validação backend; nunca abrir HTML/CSS importado como conteúdo ativo.
- Import dialog com seleção nativa de arquivo e escolha de destino lógico; validar extensão/tamanho antes de iniciar e manter backend como autoridade.
- Estados distintos: vazio, carregando, sem resultados, erro, mais páginas.

## Testes necessários
51/50/100/101 arquivos; navegação até última página; arquivo 10 MiB; UTF-8 multibyte entre chunks; blob corrompido; cancelamento; paths inválidos; keyboard navigation.

## Testes executados
Não executado. Nenhum UI test ou backend test executado nesta missão.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/file_center.rs`, `src-tauri/src/limits.rs`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Corrige escopo de 051–070: File Center backend já tem paginação e chunked read; o gap desta missão é a ausência de integração dos controles na UI. Não declarar backend sem paginação.

## RECOMENDAÇÃO AO GPT-6
Priorizar conectar o contrato de paginação existente à interface e adicionar preview em chunks. Não refatorar o backend de paginação sem teste que demonstre necessidade.
