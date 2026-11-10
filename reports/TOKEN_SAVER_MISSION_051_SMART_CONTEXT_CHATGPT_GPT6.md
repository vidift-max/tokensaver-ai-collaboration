# Missão 051 — Smart Context: orçamento global de leitura

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria Rust, performance e limites de recursos
- Data: 2026-11-10
- Status: PARTIAL — auditoria concluída; implementação bloqueada

## Objetivo
Avaliar o Smart Context e especificar limites globais de arquivos, bytes, memória e duração.

## O que esta IA fez
Leu o código real de `src-tauri/src/smart_context.rs`, `limits.rs`, `db.rs`, `file_center.rs`, `AI_COLLABORATION.md` e a chamada em `src/App.tsx`.

## Evidência
- `smart_context()` limita a consulta a 512 bytes e a resposta a `max_files.clamp(1,20)`.
- O comando percorre todas as versões mais recentes, lê cada blob completo com `fs::read_to_string`, cria uma cópia lowercase completa e calcula ocorrências antes de truncar a lista de hits.
- Não há orçamento agregado de arquivos/bytes, limite por blob específico do contexto ou deadline/cancelamento visível.
- O frontend solicita 8 hits; isso não limita o volume lido pelo backend.
- O File Center possui paginação/chunking separado; não confundir essa proteção com Smart Context.

## Problema e gravidade
ALTO — projeto grande ou blobs extensos podem causar consumo de memória/CPU e latência sem relação com o limite de resultados.

## Solução proposta
Definir constantes separadas para max scanned files, max bytes/blob, max total bytes, max elapsed time e max excerpt/output bytes. Aplicar leitura limitada incrementalmente; parar deterministicamente ao atingir orçamento e retornar metadados explícitos de truncamento. Não usar apenas o tamanho declarado no DB; validar bytes efetivamente lidos. Preservar ranking determinístico e evitar lowercasing duplicado do blob inteiro.

## Testes necessários
Fixtures com milhares de blobs; limite individual e agregado; blob acima do limite; orçamento atingido antes do fim; zero hits; Unicode; deadline; resultado e memória limitados.

## Testes executados
Não executado. Inspeção estática apenas.

## Arquivos alterados
Nenhum. Nenhuma alteração no repositório principal.

## Relação com trabalho anterior
Confirma EXT-01 em `AI_COLLABORATION.md`. Não há evidência de correção integrada nesta branch.

## Dependências e limitações
A implementação altera código principal e contrato de resposta. O plano mestre exige aprovação dos pré-requisitos e autorização explícita do GPT-6 antes de modificar o TokenSaver.

## RECOMENDAÇÃO AO GPT-6
Aprovar orçamento e semântica de truncamento antes de implementar; adicionar testes de orçamento antes de liberar Smart Context para bibliotecas grandes.
