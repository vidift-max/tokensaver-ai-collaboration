# Missão 071 — UX audit

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de UX de aplicações desktop React/Tauri
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — inspeção estática; sem teste com usuários

## Objetivo
Auditar os fluxos principais do usuário e identificar fricção, estados incompletos, inconsistência entre interface e capacidade real.

## O que esta IA fez
Inspecionou `src/App.tsx`, `src/styles.css`, `src/api.ts`, `README.md` e comandos expostos em `src-tauri/src/lib.rs`. Mapeou a navegação e os fluxos de projeto, importação, contexto, memória, templates, custo, editorial, backup e configurações.

## Evidências
- A navegação lateral lista 18 módulos, todos marcados `ready:true` estaticamente; módulos sem branch específico caem no painel genérico “Fundação funcional”.
- O dashboard não tem painel próprio; apresenta três cartões estáticos.
- Não há onboarding, criação/seleção de projeto central nem visão de projetos existentes. O ID é digitado manualmente em vários módulos e começa como `default`.
- Os fluxos assíncronos não seguem um padrão único: alguns têm busy state; outros não; erros são mantidos em um estado global.
- Há mensagens de empty state em File Center e Integrity Guardian, mas não de forma consistente nos demais módulos.
- O layout usa sidebar fixa e media queries simples; não foi validado em viewport real nem com teclado.

## Problemas e gravidade
- ALTO: prontidão dos módulos é superestimada por `ready:true`; Dashboard e Token Counter não têm fluxo dedicado identificável no JSX.
- ALTO: ausência de onboarding/projeto central torna a primeira tarefa pouco descobrível.
- MÉDIO: estados de loading/error/empty e feedback de sucesso são inconsistentes.
- MÉDIO: navegação longa e inputs densos aumentam fricção em telas pequenas.
- MÉDIO: erros globais podem aparecer fora do módulo que os originou e mensagens de sucesso são ausentes em várias operações.

## Recomendações
1. Substituir `ready:boolean` por status explícito: disponível, parcial, configuração necessária, futuro.
2. Criar fluxo inicial: criar/abrir projeto → autorizar pasta → importar primeiro arquivo → executar primeira ação.
3. Criar dashboard real com projeto ativo, arquivos, últimas operações, integridade e ações recomendadas.
4. Padronizar componentes de formulário, confirmação, loading, empty, success e error por módulo.
5. Mostrar pré-condições antes da ação e resultado verificável após cada operação.
6. Manter módulo de conexão Claude como configuração experimental, sem sugerir que chamadas reais estejam ativas.

## Testes necessários
Teste moderado com 5–8 usuários-alvo; task completion para primeira importação, Smart Context, backup/restore e template; tempo até primeira ação bem-sucedida; keyboard-only; viewport 360/768/1280; testes de regressão React.

## Testes executados
Não executado. Somente inspeção estática; sem browser, build, e2e ou teste com usuários.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/styles.css`, `src/api.ts`, `src-tauri/src/lib.rs`, `README.md`, `package.json`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa a Missão 069 (frontend audit) e achados 051–070. A Missão 069 já apontava status `ready:true` estático e ausência de paginação em áreas avançadas; esta missão amplia a análise para o percurso completo. Não reabre a paginação funcional já existente no backend do File Center.

## RECOMENDAÇÃO AO GPT-6
Priorizar um onboarding guiado e status real de disponibilidade dos módulos antes de adicionar novas funções. Aprovar um protótipo de fluxo principal e validar com usuários antes de refatorar toda a interface.
