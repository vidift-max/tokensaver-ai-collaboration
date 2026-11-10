# Missão 081 — Final page builder

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: UX de geração de HTML e segurança de conteúdo
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — inspeção estática

## Objetivo
Auditar construção de páginas, preview e limites de segurança.

## O que esta IA fez
Inspecionou painel Final Page Builder em `src/App.tsx`, wrapper em `src/api.ts` e comando `build_page` em `src-tauri/src/advanced.rs`.

## Evidências
- UI recebe título, corpo e template opcional; botão “Montar” devolve HTML em textarea read-only.
- Backend limita título/corpo/template por bytes; escapa título e corpo para HTML e substitui placeholders.
- Template fornecido é aceito como HTML livre e inserido sem sanitização; portanto, o escape de title/body não neutraliza script/event handler já presente no template.
- Não há preview isolado/sandbox, validação de placeholders, export/save, copiar, validação de links/imagens ou relatório de warnings.
- Não existe integração de publicação real no comando observado.

## Problemas e gravidade
ALTO — HTML ativo em template livre pode carregar script quando exportado e aberto em browser; interface não avisa nem isola preview. Não foi demonstrada execução de HTML dentro do app. MÉDIO — falta preview/export e validação de template.

## Recomendações
- Distinguir template confiável do usuário e template de terceiros; mostrar aviso de conteúdo ativo.
- Preview em iframe sandbox com `allow-scripts` omitido; preferir `sandbox=""` e CSP restritiva, sem abrir arquivo como conteúdo confiável.
- Sanitização por allowlist se o objetivo for rich text; se HTML arbitrário for requisito, não prometer sanitização.
- Adicionar validação de placeholders e avisos de placeholders ausentes.
- Adicionar copiar/exportar por diálogo nativo e hash do artefato; nunca publicar automaticamente.
- Testar XSS em template, URL javascript:, atributos on*, SVG e HTML malformado em ambiente isolado.

## Testes executados
Não executado. Nenhum preview ou payload de segurança foi executado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/advanced.rs`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa threat model 041–050 e auditoria Tauri/frontend 068–069. Não afirma XSS executável no renderer; o risco está no artefato HTML arbitrário que o usuário pode abrir fora do app.

## RECOMENDAÇÃO AO GPT-6
Não renderizar o HTML gerado na webview principal. Implementar preview sandboxado e aviso explícito antes de exportar HTML de template livre.
