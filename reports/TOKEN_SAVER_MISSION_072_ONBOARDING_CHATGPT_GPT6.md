# Missão 072 — Onboarding

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: UX onboarding e ativação de produto desktop
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — especificação proposta; não implementada

## Objetivo
Definir onboarding simples, seguro e orientado à primeira ação útil.

## O que esta IA fez
Analisou a inicialização em `src/App.tsx`, os módulos e a política de importação em `README.md` e `src-tauri/src/lib.rs`. Elaborou sequência de ativação com consentimento e estados de conclusão.

## Evidências
- Ao montar o componente, a aplicação verifica `api.health()` e carrega import roots; não há wizard ou checklist de primeiro uso.
- O projeto inicial aparece como ID `default`; não há criação/listagem centralizada de projetos na UI.
- A importação depende de root autorizado em Settings, mas essa pré-condição só aparece como texto na tela File Center.
- O usuário informa manualmente caminho de origem e caminho lógico.
- Conteúdo importado é local e determinístico nesta fase; README afirma que não há conexão real de Claude ainda.

## Problema e gravidade
ALTO — primeira sessão não conduz o usuário a um resultado e esconde a pré-condição de autorização de pasta. Risco de confusão entre configuração Claude e conexão operacional.

## Onboarding recomendado
1. **Boas-vindas e escopo:** explicar armazenamento local, estimativas aproximadas e ausência de envio externo nesta fase.
2. **Criar/abrir projeto:** nome/ID validado; mostrar local de armazenamento; evitar assumir `default` silenciosamente.
3. **Autorizar pasta:** selecionar ou digitar pasta; explicar que apenas arquivos dentro dela podem ser importados.
4. **Importar primeiro arquivo:** formatos aceitos TXT/MD/JSON/HTML/CSS; mostrar limite atual e destino lógico.
5. **Primeiro resultado:** sugerir Token Estimate/Safe Optimizer ou Smart Context e explicar limites do resultado.
6. **Backup:** oferecer criação de primeiro backup, sem obrigar.
7. **Checklist persistente:** mostrar etapas concluídas e permitir pular/retomar.

## Regras de segurança/privacidade
- Não ler conteúdo para onboarding sem ação explícita.
- Não enviar dados a provedores externos.
- Não solicitar API key enquanto Claude HTTP/secret store não estiver implementado.
- Mostrar claramente a pasta autorizada e permitir revogar.
- Não confundir health check local com disponibilidade de provedor IA.

## Critérios de aceite propostos
Primeira importação completável em até 3 minutos por usuário novo; nenhuma permissão de pasta concedida sem consentimento; passos retomáveis; erros acionáveis; zero chamadas externas; projeto ativo visível em toda tela.

## Testes executados
Não executado. Especificação baseada em inspeção estática.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/lib.rs`, `README.md`. Nenhum código do produto alterado.

## Relação com trabalhos anteriores
Complementa 071 e 069; respeita os limites de segurança e ausência de conexão real descritos em README e missões 041–050.

## RECOMENDAÇÃO AO GPT-6
Autorizar implementação em etapas pequenas: primeiro projeto ativo + checklist de primeira importação; em seguida wizard de autorização de pasta e recuperação de estado.
