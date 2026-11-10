# Missões 071–085 — Auditoria independente de produto e experiência

- **IA:** ChatGPT — GPT-6 (OpenAI)
- **Especialidade:** UX audit, análise funcional, acessibilidade e documentação de produto
- **Data:** 2026-11-10
- **Repositório principal examinado:** vidift-max/tokensaver-ai, branch v2-saas-alpha (somente leitura)
- **Repositório de colaboração:** vidift-max/tokensaver-ai-collaboration, branch v2-saas-alpha
- **Status geral:** PARTIAL / REVIEW_REQUIRED; nenhuma alteração de código do produto.

## Escopo e método

Li o protocolo oficial, CENTRAL.md, INSTRUCTIONS.md, plano mestre, README.md e AI_COLLABORATION.md. Inspecionei o frontend React/Tauri, estilos, API TypeScript, comandos Rust, armazenamento SQLite e configuração Tauri. Consultei Issues por UX audit, Mission 071 e Onboarding; não foram encontradas Issues correspondentes. Os relatórios anteriores 071–085 não foram localizados nos caminhos canônicos verificados; os relatórios individuais desta contribuição foram criados sem sobrescrever arquivos de terceiros.

O plano mestre descreve a Fase G como auditoria/definição de experiência e documentação. A regra de colaboração proíbe alterações no projeto principal sem autorização expressa do GPT-6 integrador. Portanto, a execução foi read-only no produto.

## Matriz de status desta contribuição

| Missão | Tema | Status próprio | Relatório |
|---|---|---|---|
| 071 | UX audit | PARTIAL | reports/AUTOMATION_AI_MISSION_071_CHATGPT_GPT6.md |
| 072 | Onboarding | PARTIAL | reports/AUTOMATION_AI_MISSION_072_CHATGPT_GPT6.md |
| 073 | Project workflow | REVIEW_REQUIRED | reports/AUTOMATION_AI_MISSION_073_CHATGPT_GPT6.md |
| 074 | File Center | PARTIAL | reports/AUTOMATION_AI_MISSION_074_CHATGPT_GPT6.md |
| 075 | Smart Context UX | PARTIAL | reports/AUTOMATION_AI_MISSION_075_CHATGPT_GPT6.md |
| 076 | Cost simulator | REVIEW_REQUIRED | reports/AUTOMATION_AI_MISSION_076_CHATGPT_GPT6.md |
| 077 | Project Memory UX | PARTIAL | reports/AUTOMATION_AI_MISSION_077_CHATGPT_GPT6.md |
| 078 | Templates | PARTIAL | reports/AUTOMATION_AI_MISSION_078_CHATGPT_GPT6.md |
| 079 | Editorial engine | PARTIAL | reports/AUTOMATION_AI_MISSION_079_CHATGPT_GPT6.md |
| 080 | Article library | PARTIAL | reports/AUTOMATION_AI_MISSION_080_CHATGPT_GPT6.md |
| 081 | Final page builder | REVIEW_REQUIRED | reports/AUTOMATION_AI_MISSION_081_CHATGPT_GPT6.md |
| 082 | OneShot UX | PARTIAL | reports/AUTOMATION_AI_MISSION_082_CHATGPT_GPT6.md |
| 083 | Settings | PARTIAL | reports/AUTOMATION_AI_MISSION_083_CHATGPT_GPT6.md |
| 084 | Accessibility | REVIEW_REQUIRED | reports/AUTOMATION_AI_MISSION_084_CHATGPT_GPT6.md |
| 085 | Product documentation | PARTIAL | reports/AUTOMATION_AI_MISSION_085_CHATGPT_GPT6.md |

## Síntese de achados por jornada

### 1. Descoberta e início (071–073)
- App inicia no Dashboard; backend health e import roots são consultados no useEffect.
- projectId começa em default; não há onboarding guiado, project switcher ou ciclo formal create/open/close/rename/delete.
- Ações inicializam projeto implicitamente; trocar ID em campos não limpa/valida de forma geral dados antigos e requests em voo.
- Menu marca 18 módulos como ready:true, embora algumas UIs não exponham todas as operações do backend.

### 2. Arquivos e contexto (074–075)
- File Center backend já pagina (1–100) e lê chunks UTF-8; UI solicita offset 0/limit 50 e não oferece paginação, preview ou seletor de versão.
- Importação aceita TXT/MD/JSON/HTML/CSS, exige root autorizado, UTF-8 e limite de 10 MiB.
- Smart Context exibe caminho, score, versão, token estimate e excerpt; não expõe contagem de arquivos examinados/excluídos, motivo de exclusão, truncamento ou budget. O método é busca lexical local, não semantic search.

### 3. Custos e memória (076–077)
- Fórmula de custo está correta para preço manual USD por milhão: input tokens × input price / 1e6 + output tokens × output price / 1e6. Não é cotação dinâmica nem medição de economia realizada.
- Project Memory suporta chave/valor, até 1.000 entradas, chave 128 bytes e valor 100 KB. UI não oferece delete, filtro, organização ou confirmação de sobrescrita.

### 4. Produção editorial (078–082)
- Template backend oferece list/save/delete, mas UI apenas cria e lista; o handler envia ID null, não expõe editar/delete e não existe histórico de versões.
- Editorial Engine verifica somente título/corpo, corpo mínimo de 120 bytes e aviso acima de 20.000 palavras; não é avaliação factual/SEO.
- Article Library lista metadados e filtra caminho; não abre conteúdo. Internal Links ranqueia correspondência lexical nos caminhos, não semântica.
- Final Page Builder escapa título/corpo e substitui placeholders; template customizado é HTML raw; não há preview isolado nem publicação.
- OneShot grava conteúdo até 2 MB em versão imutável e evita nova versão se conteúdo não mudar; UI descarta hash de retorno e não mostra sucesso/versão.

### 5. Configuração, histórico e acessibilidade (083–084)
- Settings gerencia import roots; Claude Connection está separado e persiste enabled/endpoint/model sem cliente HTTP nem secret. History exibe até 50 operações com kind/status/progress/time.
- Muitos inputs usam placeholder sem label associado; não foram observados :focus-visible, aria-live ou associação sistemática de erros; contraste não foi medido. Não é possível afirmar WCAG compliance sem testes.

### 6. Documentação (085)
- README é visão técnica geral, não manual operacional. Foi criado docs/USER_GUIDE.md no repositório de colaboração, derivado dos comandos e UI existentes, com fluxo inicial, limites, módulos, privacidade, restrições e troubleshooting.
- Guia explicita ausências e não promete Claude HTTP, publicação, lifecycle formal de projeto, preview da Library ou versionamento de templates.

## Prioridades recomendadas

**P0 — reduzir confusão e riscos de uso**
1. Onboarding explícito com escolha/criação de projeto e explicação de dados locais/estimativas.
2. Project Switcher e invalidação de estado/request na troca de projeto.
3. Clarificar Claude Connection como configuração não conectada; impedir que enabled seja interpretado como teste de conexão.
4. Corrigir labels, foco e anúncios de status/erro; não declarar acessibilidade aprovada antes de axe/keyboard/screen reader.

**P1 — tornar fluxos principais utilizáveis**
5. File Center: paginação, preview e navegação de versões.
6. Smart Context: idle/empty/results, contagem e explicação de inclusão/exclusão/limites.
7. Project Memory e Template Master: edição/exclusão confirmadas, filtros e limites visíveis.
8. OneShot: resultado com SHA/versão, limite e acesso ao arquivo salvo.
9. Article Library: preview de conteúdo; Internal Links deve declarar score lexical e permitir inspeção do destino.
10. Final Page Builder: separar conteúdo texto/HTML confiável e adicionar preview sandboxed.

**P2 — precisão e clareza**
11. Cost Simulator: labels de unidade, validação frontend, fonte/data do preço e cenários.
12. Editorial Engine: nome e avisos compatíveis com o conjunto real de verificações.
13. Settings/History: agrupar segurança/armazenamento/provedores e exibir detalhes seguros de operação.

## Testes realmente executados

- Fetch/leitura estática dos arquivos e consultas de Issues.
- Nenhum build, cargo test, npm build, CI, Playwright, axe, Lighthouse, contrast checker, teste de teclado/leitor de tela, usability test, instalador ou teste manual em aplicativo foi executado.
- Nenhum dado de usuário foi utilizado; nenhum provider externo foi chamado.

## Alterações

- Repositório de colaboração: 15 relatórios individuais e docs/USER_GUIDE.md.
- TokenSaver principal: nenhum arquivo alterado.
- Nenhuma Issue, PR, workflow, secret, setting, permissão, release ou deploy alterado.

## Limitações e dependências

- Esta é uma auditoria estática da branch consultada; não prova o comportamento do instalador nem acessibilidade.
- Missões 051–070 e security gate 050 permanecem dependências não aprovadas; UX não deve ocultar riscos de recursos, filesystem ou segurança ainda pendentes.
- O guia é um snapshot datado e deve ser validado contra a próxima versão do aplicativo.

## RECOMENDAÇÃO AO GPT-6

1. Aprovar o relatório e decidir prioridades de produto; não interpretar PARTIAL como feature concluída.
2. Autorizar uma primeira wave de UX sem mudanças backend: labels/feedback/estados vazios, navegação responsiva, Smart Context transparency e resultados de OneShot.
3. Depois autorizar Project Switcher/onboarding, File Center pagination/preview e gestão de templates/memória com contratos claros.
4. Exigir teste manual no Windows, Playwright para fluxos críticos e axe + teclado/leitor de tela antes de fechar 084.
5. Manter produto principal read-only até grant explícito por patch. Nenhuma publicação real ou conexão Claude deve ser ativada por esta fase.

**Estado final:** relatórios individuais e guia registrados no repositório de colaboração. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
