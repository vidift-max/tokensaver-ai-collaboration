# Missão 077 — Project Memory UX

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: UX de dados persistentes e controles de memória
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — inspeção estática

## Objetivo
Melhorar consulta, organização e proteção da memória de projeto.

## O que esta IA fez
Inspecionou tela Project Memory em `src/App.tsx`, contratos em `src/api.ts` e limites/validação em `src-tauri/src/project_memory.rs`.

## Evidências
- UI permite informar projeto, chave e valor, salvar e listar entradas; atualização manual.
- Lista mostra chave e valor sem paginação, busca, ordenação configurável, edição explícita, exclusão ou contador de quota.
- Backend limita a 1.000 entradas, chave 128 bytes e valor 100.000 bytes; limite de cardinalidade tem race reportada na Missão 052.
- A tela não avisa que valores são persistidos localmente nem oferece política de retenção/limpeza.
- Valor completo aparece diretamente na lista, sem ocultação de conteúdo sensível nem confirmação de exposição.

## Problemas e gravidade
MÉDIO — baixa capacidade de administrar/limpar memória; sem busca e sem feedback de limite. ALTO — ausência de proteção UX contra persistir segredos/dados pessoais em valores e exibi-los integralmente. ALTO — dependência do limite transacional 052 ainda pendente.

## Recomendações
- CRUD completo com editar/excluir individual e seleção múltipla, confirmação de exclusão e export opcional.
- Busca por key/value, filtro e contador `N/1000`; mostrar tamanho aproximado por valor.
- Alertar para não guardar senhas, tokens, API keys ou dados pessoais; detectar padrões de segredo localmente com falso-positivo explicitado.
- Ocultar valores por padrão (reveal on demand) e permitir limpar memória inteira com confirmação digitando o nome do projeto.
- Informar armazenamento local e backup/restore; política de retenção e escopo do projeto.
- Antes de expor criação em massa, corrigir a transação concorrente do backend.

## Testes necessários
1000/1001 entradas; chave existente na quota; valor limite/limite+1; unicode; edição e exclusão; segredo em valor; busca; troca de projeto e limpeza; duas gravações concorrentes.

## Testes executados
Não executado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/project_memory.rs`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa Missão 052 e frontend audit 069. A correção de UX não resolve race do limite no backend; não duplicar o finding como se fosse novo bug de persistência.

## RECOMENDAÇÃO AO GPT-6
Implementar controles de administração da memória somente após corrigir 052. Começar com busca, contador, edição/exclusão e valores ocultos por padrão.
