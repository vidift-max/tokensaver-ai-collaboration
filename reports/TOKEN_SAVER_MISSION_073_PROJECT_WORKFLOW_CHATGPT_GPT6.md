# Missão 073 — Project workflow

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: UX de ciclo de vida e isolamento de projetos
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — análise estática

## Objetivo
Revisar criação, abertura, edição e fechamento de projetos.

## O que esta IA fez
Inspecionou fluxo de `projectId` em `src/App.tsx`, wrappers em `src/api.ts`, `initialize_project` e `project_root` em `src-tauri/src/lib.rs`, e os comandos que recebem project_id.

## Evidências
- Estado inicial `projectId="default"`; input manual aparece em alguns módulos, mas não há seletor global.
- `initialize_project` cria diretório de blobs e abre/cria SQLite para o ID informado.
- Diversos comandos chamam initialize antes da operação; outros módulos usam o ID em seu próprio fluxo.
- Não há UI identificável para listar projetos, renomear, arquivar, fechar, excluir ou trocar com confirmação.
- Alterar o input de projeto não atualiza automaticamente os dados já carregados; arrays de arquivos/memória/artigos/histórico podem permanecer da seleção anterior até recarga.
- Não há indicador global persistente do projeto ativo no cabeçalho, somente campos repetidos em algumas telas.

## Problemas e gravidade
ALTO — ausência de gestão central de projetos e de contexto ativo consistente. MÉDIO — risco de confusão visual entre dados carregados e ID editado, especialmente após trocar projeto sem recarregar. MÉDIO — falta de ações explícitas para lifecycle e política de retenção.

## Recomendações
- Criar Project Registry (listar projetos existentes por metadados, sem inferir diretórios arbitrários).
- Adotar um único ProjectProvider/contexto com ID ativo, estado de inicialização e invalidation de queries na troca.
- Fluxo create/open/close/archive; exclusão somente após backup opcional, confirmação digitando ID e validação backend.
- Exibir ID ativo em header e confirmar ações destrutivas.
- Limpar estados derivados na troca de projeto e cancelar/ignorar respostas assíncronas antigas.
- Definir política de rename (display name vs ID imutável) e backup antes de excluir.

## Testes necessários
Troca rápida entre dois projetos; isolamento de resultados; request antigo completando após troca; ID inválido; projeto vazio; fechamento/reabertura; exclusão cancelada; backup e restore para novo ID.

## Testes executados
Não executado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/lib.rs`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa findings de DB/project isolation e Missão 069 sobre respostas assíncronas obsoletas. Não recomenda excluir projetos até existir política de backup/retention aprovada.

## RECOMENDAÇÃO AO GPT-6
Implementar primeiro o contexto global de projeto e invalidation segura; somente depois expor rename/archive/delete. Manter IDs internos imutáveis.
