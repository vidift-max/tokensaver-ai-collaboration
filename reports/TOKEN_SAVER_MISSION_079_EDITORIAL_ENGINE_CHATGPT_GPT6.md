# Missão 079 — Editorial engine

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: UX de fluxo editorial e validação de conteúdo
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — funcionalidade local limitada

## Objetivo
Auditar fluxo editorial sem conectar publicação real.

## O que esta IA fez
Inspecionou painel Editorial Engine em `src/App.tsx`, API `src/api.ts` e `editorial_validate` em `src-tauri/src/advanced.rs`.

## Evidências
- O painel recebe título e corpo e chama validação local; mostra validade, contagem de palavras e avisos.
- Backend verifica limites de entrada, título/corpo vazios, corpo menor que 120 bytes e acima de 20.000 palavras.
- Não há workflow editorial por estado (draft/review/approved), checklist de fontes, revisão factual, SEO, autoria, histórico ou persistência de artigo.
- A validação não consulta fontes nem modelos; é determinística e local.
- Nenhum comando de publicação real aparece nesse fluxo; README diz que publicação será adicionada em fase posterior.

## Problemas e gravidade
MÉDIO — nome “Editorial Engine” pode criar expectativa de suíte editorial completa, mas a capacidade atual é um validador básico. MÉDIO — ausência de salvamento/rascunho e histórico torna o fluxo descartável. BAIXO — avisos de comprimento são heurísticos e não equivalem a qualidade editorial.

## Recomendações
- Rotular como “Validação editorial básica (local)” até ampliar escopo.
- Criar estados Draft → In Review → Approved, com identidade local, timestamps e histórico.
- Checklist configurável: fontes primárias, fact-check, SEO, estrutura, disclosure e direitos de imagem.
- Salvar rascunho local sem publicar; diferenciar validação estrutural de verificação factual.
- Não conectar CMS/publicação nesta missão; qualquer futura publicação exige autorização, preview e confirmação humana.

## Testes necessários
Título/corpo vazios; 119/120 bytes; 20.000/20.001 palavras; Unicode; salvamento/recuperação; transições inválidas; nenhuma chamada externa nem publicação.

## Testes executados
Não executado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/advanced.rs`, `README.md`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa segurança 041–050 e UX 071–072; mantém explicitamente fora do escopo a conexão de publicação real.

## RECOMENDAÇÃO AO GPT-6
Não ligar publicação. Primeiro transformar o validador em fluxo de rascunho/revisão auditável, com distinção clara entre checagem estrutural e fact-check.
