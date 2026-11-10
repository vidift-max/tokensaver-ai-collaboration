# Missão 084 — Accessibility

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de acessibilidade WCAG 2.2 AA e aplicações desktop
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — inspeção estática; sem avaliação assistiva

## Objetivo
Auditar teclado, contraste, foco e semântica.

## O que esta IA fez
Inspecionou JSX de `src/App.tsx` e estilos de `src/styles.css`; avaliou semântica observável e estados acessíveis.

## Evidências
- Estrutura inclui `main`, `aside`, `nav`, `header`, `section`, headings e botões nativos.
- Muitos inputs usam somente placeholder, sem label associado; há alguns labels com input aninhado.
- Mensagens de erro, status backend e resultados assíncronos não usam `aria-live` ou região de status explícita.
- Não foi localizada gestão de foco após erros, troca de módulo ou conclusão de operação.
- CSS define hover e active, mas não há regra explícita `:focus-visible`/indicador customizado consistente.
- Layout mobile usa breakpoint 700/900 px; navegação lateral não tem padrão responsivo alternativo comprovado.
- Não foram executados contrast checker, axe, NVDA, Narrator ou teste teclado.

## Problemas e gravidade
ALTO — campos sem label programático em vários painéis; leitores de tela podem não identificar finalidade. ALTO — ausência de anúncio de loading/erro/sucesso reduz operação assistiva. MÉDIO — foco visível e navegação mobile precisam de validação. Contraste não pode ser classificado sem medição.

## Recomendações
- Cada input/textarea deve ter label visível associado por id/htmlFor; placeholder apenas como exemplo.
- Usar `role="status"`/aria-live polite para progresso e sucesso; `role="alert"` para erros críticos, sem duplicar anúncio.
- Garantir foco visível com contraste adequado e ordem de tabulação previsível.
- Gerenciar foco ao trocar módulo e ao abrir/fechar diálogos; evitar confirmação somente via window.confirm se substituída por modal acessível.
- Botões com nomes acessíveis; ícones decorativos ocultos; headings hierárquicos.
- Validar contraste de texto normal 4.5:1, texto grande 3:1 e componentes/foco conforme WCAG 2.2 AA.
- Executar keyboard-only, NVDA/Narrator, axe-core e teste de zoom/reflow.

## Testes necessários
Teclado completo; leitor de tela; 200% zoom; viewport 320/360 px; contraste automático/manual; foco após erro; live announcements; formulários com erro; dialogs e lista de módulos.

## Testes executados
Não executado. Auditoria exclusivamente estática; não declarar conformidade WCAG.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/styles.css`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Amplia 069, que já apontava a11y pendente. Esta missão identifica labels/live regions/foco como gaps; não substitui auditoria manual de contraste e leitor de tela.

## RECOMENDAÇÃO AO GPT-6
Tratar labels, anúncios de status e foco visível como correções prioritárias; depois realizar validação manual WCAG 2.2 AA em Windows com Narrator/NVDA.
