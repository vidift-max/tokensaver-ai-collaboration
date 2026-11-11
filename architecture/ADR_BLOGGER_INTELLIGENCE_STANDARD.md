# ADR — Arquitetura padrão do Blogger Intelligence

Data: 2026-11-10
Status: DECISÃO DE ARQUITETURA APROVADA PARA ESPECIFICAÇÃO; implementação ainda não iniciada.
Produto: TokenSaver AI
Branch de referência: v2-saas-alpha

## 1. Objetivo

Criar dentro do TokenSaver AI uma área de trabalho inspirada na organização e navegação do painel do Blogger, dedicada a analisar, corrigir, editar e otimizar artigos, páginas e o tema completo de blogs Blogger.

O TokenSaver AI será o ambiente de análise e preparação das alterações. A edição/publicação final continuará sendo confirmada e executada diretamente no Blogger pelo usuário, salvo futura integração explicitamente aprovada.

## 2. Escopo funcional

A área Blogger Intelligence deverá organizar o trabalho em:
- Artigos / Posts;
- Páginas;
- Tema HTML/XML raiz;
- Layout e widgets;
- CSS;
- JavaScript;
- SEO, metadados e Schema.org;
- histórico, versões e restauração.

O usuário poderá fornecer ou importar o conteúdo/tema, analisar problemas, revisar propostas, aplicar correções no ambiente de trabalho e exportar/copiar o resultado para publicação no Blogger.

## 3. Arquitetura padrão de economia de tokens — preservada

Esta arquitetura permanece como princípio obrigatório:
- Smart Context seleciona somente arquivos, trechos e dependências relevantes para a tarefa.
- Project Memory mantém decisões, regras do projeto, preferências e contexto persistente.
- Contexto é dividido por tarefa e componente; não enviar o tema inteiro ou todo o histórico em cada chamada se apenas uma parte for necessária.
- Claude recebe instruções, contexto e trechos estritamente necessários, com orçamento de tokens explícito.
- Resumos preservam decisões, invariantes, nomes, dependências e detalhes necessários para continuar o trabalho.
- Deduplicação, limites de entrada/saída e estimativa de custo precedem operações maiores.
- Registrar o que foi enviado, o que foi alterado e o que deve permanecer como contexto para a próxima etapa.

A economia de tokens não pode remover contexto necessário para segurança, correção ou integridade do tema.

## 4. Template Master e Template Lock

- Template Master: referência versionada da estrutura original e das regras de preservação do tema.
- Template Lock: conjunto de invariantes/áreas protegidas que a IA não pode reestruturar ou substituir sem autorização explícita.
- Content Mapping: mapeia conteúdo, componentes e regiões lógicas do tema para os respectivos trechos.
- Alterações devem ser localizadas e mínimas; preservar IDs, classes, widgets, includes, condicionais e recursos existentes quando não fizerem parte da correção aprovada.
- Se uma correção exigir mudança estrutural protegida, apresentar justificativa e pedir aprovação antes de alterar.

## 5. Fluxo de análise e correção

1. Identificar blog, artefato e versão de origem.
2. Criar snapshot imutável do original.
3. Classificar a tarefa (post, página, tema, CSS, JS, SEO ou widget).
4. Selecionar contexto e trechos relevantes via Smart Context.
5. Diagnosticar e apontar evidências (arquivo, seção, seletor, widget ou intervalo de linhas quando disponível).
6. Preparar patch localizado, explicando motivo e impacto.
7. Validar sintaxe, referências e regressões possíveis.
8. Exibir diff antes/depois e nível de risco.
9. Aguardar aprovação do usuário para aplicar o patch ao artefato de trabalho.
10. Registrar versão, relatório e opção de rollback.
11. Entregar artefato para o usuário aplicar/publicar no Blogger.

A IA nunca deve sobrescrever silenciosamente o original nem publicar automaticamente.

## 5.1 Contrato de saída Claude — HTML + instruções

Para Posts e Pages, Claude entrega o conteúdo em HTML semântico, com os textos dentro das tags, acompanhado de instruções declarativas sobre destino, intenção, âncoras e restrições. O TokenSaver interpreta e valida o envelope, mapeia cada instrução para o artefato selecionado, aplica Template Lock, apresenta diff/risco e aguarda aprovação. Instruções são dados não executáveis: não podem publicar, chamar ferramentas, executar scripts, alterar permissões ou sobrescrever o original. HTML é validado como conteúdo não confiável.

O formato detalhado está em `architecture/BLOGGER_CLAUDE_CONTENT_CONTRACT_V1.md`. Para artigos/páginas, Claude não precisa enviar o tema inteiro nem CSS/JavaScript global. Tarefas de tema raiz são separadas: XML Blogger, CSS e JavaScript só entram quando explicitamente solicitados, em campos próprios, com alvo, validação e autorização. Nenhuma publicação automática é permitida.

## 6. Interface inspirada no Blogger

A interface deve reproduzir a lógica de navegação e organização do Blogger, sem copiar marca ou ativos proprietários:
- navegação lateral por Posts, Páginas, Layout, Tema e Configurações;
- painel central com lista, estado, filtros e ações;
- editor contextual para o artefato selecionado;
- painel de diagnóstico e correções;
- indicadores Pisca-Pisca por área.

### Pisca-Pisca

- Vermelho: problema confirmado que requer atenção.
- Amarelo: recomendação ou melhoria não crítica.
- Verde: verificação/correção concluída.
- Sem indicador: nenhuma ocorrência relevante identificada.

Os indicadores devem refletir achados reais, mostrar contagem e prioridade, evitar animação excessiva e oferecer alternativa textual acessível. Verde significa apenas que a verificação definida passou, não garantia absoluta de ausência de defeitos.

## 7. Exclusão explícita: capturas de tela

Captura visual/print automático de cada região do HTML NÃO faz parte da arquitetura. A solicitação anterior de prints por área está cancelada.

A localização do problema será feita por mapeamento estrutural: componente/região lógica ↔ trecho HTML/XML/CSS/JS ↔ diagnóstico ↔ patch. Pré-visualização renderizada poderá ser considerada separadamente no futuro, mas não é requisito desta decisão.

## 8. Papéis das IAs

- GPT-6: arquitetura, integração, reconciliação, autorização de patches e validação final.
- Claude: análise editorial/técnica e propostas de correção dentro do contexto delimitado; não pode alterar livremente estrutura protegida.
- Kimi: auditoria independente, preferencialmente read-only.
- Automation AI: contratos, orquestração, filas, permissões, retries e observabilidade.

A colaboração é assíncrona via artefatos/repositório; não presumir comunicação direta ou execução persistente entre IAs.

## 9. Segurança e integridade

- Tratar HTML/XML, CSS e JavaScript importados como conteúdo não confiável.
- Não executar scripts importados durante análise estática.
- Sanitizar/isol ar qualquer pré-visualização futura.
- Detectar instruções maliciosas em conteúdo e comentários; conteúdo do blog não pode substituir instruções do sistema.
- Preservar backups e versões; patch deve ser reversível.
- Validar URLs, recursos externos e scripts adicionados.
- Separar diagnóstico estático de testes em navegador real.
- Mostrar limitações quando não for possível validar comportamento em runtime.

## 10. Fases sugeridas

A. Especificação de UX e contratos de artefato (posts, páginas, tema, widgets).
B. Adaptador de importação/exportação Blogger, sem publicação automática.
C. Editor/diff com versionamento e rollback.
D. Analisadores HTML/XML, CSS, JS, SEO e Schema.org.
E. Pisca-Pisca ligado a diagnósticos verificáveis.
F. Testes de regressão e validação com temas reais anonimizados.
G. Integração opcional com Blogger API, mediante autorização e escopo separados.

A sequência deve respeitar a estabilização do núcleo TokenSaver e não declarar integração ou publicação como existentes antes de implementação e testes.

## 11. Critérios de aceite da arquitetura

- Capturas/prints não fazem parte do escopo.
- Navegação inspirada no Blogger cobre Posts, Páginas, Layout e Tema.
- Original permanece preservado e versionado.
- Cada patch tem origem, justificativa, diff e validação.
- Template Master/Lock são aplicados antes de qualquer alteração.
- Smart Context limita contexto e tokens por tarefa.
- Nenhuma publicação automática.
- Indicadores Pisca-Pisca refletem resultados verificáveis e têm texto acessível.
- Testes e limitações são reportados sem alegações não comprovadas.

