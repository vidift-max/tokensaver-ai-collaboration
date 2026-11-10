# Missão 083 — Settings

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de UX de configurações, privacidade e segurança
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — inspeção estática

## Objetivo
Auditar configurações, histórico e segurança.

## O que esta IA fez
Inspecionou painel Settings em `src/App.tsx`, operações de import roots em `src/api.ts` e `src-tauri/src/path_guard.rs`, além da tela Claude Connection e History.

## Evidências
- Painel Settings só gerencia import roots (listar, adicionar, remover).
- Configuração Claude está em módulo separado; toggle enabled salva endpoint/model, mas README diz que não há chamada de rede nem armazenamento de secret no core.
- History é tela separada que carrega até 50 operações e não oferece filtros/export/retention.
- Não há painel de privacidade, local de dados, backup policy, telemetria, logs, idioma/tema ou diagnóstico.
- Remover root não explica impacto sobre arquivos já importados (não deve apagar conteúdo existente).

## Problemas e gravidade
MÉDIO — Settings não funciona como central de preferências; configurações ficam espalhadas. MÉDIO — estado “enabled” da Claude pode ser interpretado como conexão ativa, embora seja apenas configuração. BAIXO/MÉDIO — History sem filtro e sem explicação de retenção.

## Recomendações
- Organizar Settings em seções: Storage & Projects, Import Permissions, Providers, Privacy, Diagnostics e Updates.
- Separar “configured” de “connected/healthy”; atualmente nenhum health check do provedor é demonstrado.
- Mostrar caminho de armazenamento, limites ativos, política de backup e dados locais.
- Confirmar remoção de root e explicar que arquivos já importados permanecem armazenados.
- History com filtro por operação/status/período, paginação, export sanitizado e política de retenção.
- Não adicionar campo de API key ao frontend; quando provider real for aprovado, usar secret store do SO.
- Exibir mensagens claras de que desabilitar/retirar root não apaga os arquivos importados.

## Testes necessários
Adicionar/remover roots; persistência após restart; root removido e arquivo já importado; provider configured vs connected; history empty/50+; logs sem secrets/paths sensíveis.

## Testes executados
Não executado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/path_guard.rs`, `README.md`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa 045/049/068 e 069; não solicita secret audit nem ativa Claude. Configuração local não é prova de conectividade.

## RECOMENDAÇÃO AO GPT-6
Reestruturar Settings após definição do modelo de projeto e provider security. Priorizar clareza de status, local de armazenamento e política de dados.
