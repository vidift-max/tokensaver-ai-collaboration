# Missão 089 — SEO Intelligence

## Identificação
- IA: ChatGPT | Modelo: GPT-6
- Especialidade/função: arquitetura de conteúdo e SEO; especificação independente
- Data: 2026-11-10
- Status: REVIEW_REQUIRED

## Objetivo
Especificar inteligência SEO sem implementar publicação.

## Contribuição própria
Pipeline proposto: brief/corpus → intenção de busca → entidades/tópicos → SERP autorizada e datada → keyword clusters → canibalização → recomendações de title/meta/H1/FAQ/schema → links internos → confiança/fontes → relatório. Cada recomendação carrega query, locale, device, recency, evidência, confidence e risco. Canibalização deve considerar sobreposição de intenção/SERP/entidades, não densidade fixa ou similaridade textual isolada. Conteúdo YMYL exige fontes primárias, freshness e revisão humana. Sem publicação automática e sem promessa de ranking.

## Arquivos examinados
Produto: `src-tauri/src/advanced.rs` (Article Library por path, Internal Links lexical, Editorial Engine estrutural); `src/App.tsx`; `README.md`. Relatórios 079/080/085.

## Relação com trabalhos anteriores
Complementa Missões 079/080/085, que descrevem limitações do Editorial Engine, Article Library e ranking de links. Nenhum relatório 089 anterior foi localizado.

## Testes executados
Não executado: SERP, keyword corpus, canibalização, GSC ou benchmark.

## Problemas e limitações
Não há crawler/SERP/GSC connector no desktop. Integrações, quotas e compliance precisam ser definidos.

## Status próprio
REVIEW_REQUIRED — especificação documental.

## Próximo passo
Definir fontes e consentimento; criar corpus rotulado; validar recomendações contra SERPs reais. Nenhuma publicação deve ser implementada sem grant.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
