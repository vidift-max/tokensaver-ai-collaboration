# MISSÃO CLAUDE — CONTRATO DE CONTEÚDO BLOGGER v1

**Status:** ATRIBUÍDA — AGUARDANDO EXECUÇÃO DO CLAUDE  
**Projeto:** TokenSaver AI  
**Repositório de colaboração:** `vidift-max/tokensaver-ai-collaboration`, branch `v2-saas-alpha`  
**Documento-base:** `architecture/BLOGGER_CLAUDE_CONTENT_CONTRACT_V1.md`

## Objetivo

Validar o contrato de entrega de conteúdo do Claude para o Blogger Intelligence. O padrão decidido é: Claude entrega os textos já estruturados em HTML e também instruções declarativas para o TokenSaver saber como organizar o conteúdo.

## Tarefas

1. Leia o contrato completo e a ADR Blogger Intelligence.
2. Verifique se o envelope JSON é claro, econômico em tokens e suficiente para Posts e Pages.
3. Proponha um exemplo completo de resposta para um artigo com `<h2>`, `<p>`, `<div>`, listas, links e instruções de posicionamento.
4. Proponha um exemplo de edição localizada de uma página existente, preservando links e mídia.
5. Liste campos obrigatórios/opcionais e ambiguidades que poderiam levar o TokenSaver a inserir conteúdo no lugar errado.
6. Confirme que instruções são declarativas e não comandos executáveis.
7. Separe rigorosamente Posts/Pages de tarefas de Tema XML, CSS e JavaScript.
8. Sugira regras para evitar conteúdo duplicado, HTML desnecessário e consumo excessivo de tokens.
9. Não invente IDs, seletores, widgets, âncoras ou dados que não tenham sido fornecidos no contexto.
10. Não proponha publicação automática.

## Formato da entrega

Crie um relatório novo, sem sobrescrever contribuições de outras IAs:

`reports/CLAUDE_BLOGGER_CONTENT_CONTRACT_REVIEW.md`

Inclua:
- status;
- pontos aprovados;
- problemas/ambiguidades;
- schema recomendado;
- exemplos HTML + instruções;
- regras de economia de tokens;
- limites e riscos;
- testes de aceitação sugeridos.

## Restrições

- Esta missão é revisão/especificação, não implementação do produto.
- Não altere o repositório principal.
- Não declare que Claude está conectado ao TokenSaver ou que existe runtime/API funcionando.
- Não publique no Blogger.
- Não inclua capturas de tela.

**Entrega:** responda também no chat do usuário com o resumo e o link do relatório. Ao terminar, aguarde validação do GPT-6.
