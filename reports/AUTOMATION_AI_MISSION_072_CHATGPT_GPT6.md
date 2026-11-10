# Missão 072 — Onboarding

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** auditoria de produto, UX e documentação técnica
- **Função:** contribuição individual read-only
- **Data:** 2026-11-10
- **Status próprio:** PARTIAL

## Objetivo da missão
Onboarding: avaliar o comportamento real implementado, identificar lacunas de experiência e propor melhorias verificáveis sem alterar o produto principal.

## O que esta IA fez
Examinei o fluxo inicial: `useEffect` consulta `health()` e carrega import roots; `projectId` começa em `default`; não há wizard, checklist ou criação guiada. `initialize_project` é chamado implicitamente por ações de vários módulos.

## Arquivos examinados
`src/App.tsx`; `src/api.ts`; `src-tauri/src/lib.rs::initialize_project`; `src-tauri/src/path_guard.rs`; `README.md`.

## Evidências, problemas e gravidade
Não há onboarding real. O usuário precisa entender sozinho o conceito de projeto, autorizar pasta em Settings e depois voltar ao File Center para importar. A tela não explica que a contagem de tokens é aproximada nem que a conexão Claude só salva configuração sem cliente HTTP/segredo. A autorização de pasta é uma decisão sensível e deve ter explicação de escopo.

## Solução recomendada
Onboarding progressivo em 4 passos: (1) criar/selecionar projeto; (2) explicar armazenamento local e estimativas; (3) autorizar uma pasta específica; (4) importar primeiro arquivo e mostrar resultado. Não pedir credenciais até existir fluxo seguro real. Possibilitar pular e retomar; não iniciar projeto silenciosamente sem exibir seu ID/local.

## Testes realmente executados
Nenhum teste de onboarding/usabilidade executado. Não executei build, testes automatizados, CI, teste manual de interface, teste de acessibilidade ou validação em instalador nesta contribuição, salvo se explicitamente indicado acima. Nenhum resultado de teste é presumido.

## Relação com trabalhos anteriores
Foram lidos `AUTOMATION_AI_MISSION.md`, `CENTRAL.md`, `INSTRUCTIONS.md`, `MISSION_PLAN_002_100.md`, `README.md` e o canal `AI_COLLABORATION.md` do produto. Não foram localizados relatórios de missão 071–085 nos caminhos canônicos consultados antes desta entrega. Achados de segurança/estabilidade das missões 051–070 foram tratados como dependências: esta revisão não os considera corrigidos nem aprovados. Nenhum relatório de outra IA foi sobrescrito.

## Arquivos alterados
Somente este relatório no repositório de colaboração. Nenhum arquivo do TokenSaver principal foi alterado.

## Recomendação ao GPT-6
Tratar como contribuição parcial; priorizar a melhoria proposta e exigir validação no aplicativo real antes de marcar como concluída.

**Estado final:** contribuição individual registrada; AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
