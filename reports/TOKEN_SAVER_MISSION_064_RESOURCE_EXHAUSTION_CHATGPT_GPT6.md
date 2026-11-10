# Missão 064 — Resource exhaustion: memória, CPU, disco e arquivos grandes

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: engenharia de confiabilidade e teste de limites
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — matriz de testes proposta; execução pendente

## Objetivo
Definir e validar resistência a esgotamento de memória, CPU, disco, descritores e operações com arquivos grandes.

## O que esta IA fez
Correlacionou limites em `limits.rs` com Smart Context, Restore, Import Roots, Article Library, templates, File Center e OneShot.

## Evidência
- Limites declarados: arquivo 10 MiB; batch 100 arquivos/100 MiB; path depth 32; roots 32; timeout declarado 300s.
- Smart Context, list_articles/find_internal_links, list_templates e manifesto Restore não têm orçamento global explícito no código examinado.
- Import Roots lê arquivo integral antes de aplicar limite de cardinalidade.
- File Center já limita páginas/chunks; import individual lê no máximo limite + 1.
- Não existem resultados de benchmark/load test nesta sessão.

## Problema e gravidade
ALTO — há caminhos com processamento proporcional a todos os registros/bytes, sem orçamento global comprovado.

## Matriz de testes proposta
1. Arquivos no limite e limite+1.
2. Biblioteca com 10k/100k metadados e blobs grandes.
3. Restore com manifest/blob/DB no limite e acima.
4. Disco quase cheio e erro de quota.
5. Muitas operações concorrentes no mesmo e em projetos distintos.
6. CPU/memória sob Smart Context e ranking de links.
7. File descriptors e falhas de I/O.
8. Timeout/cancelamento e limpeza após interrupção.
9. Import roots JSON gigante e arrays 32/33.
10. Windows/Linux com monitoramento de peak RSS, duração, bytes lidos/escritos e handles.

## Critério de aceite
Sem panic/crash/corrupção; limites rígidos e previsíveis; falha controlada; nenhum artefato parcial publicado; memória/CPU/tempo dentro de budgets aprovados.

## Testes executados
Não executado. Nenhum benchmark, stress test, profile ou fault injection.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Consolida EXT-01, ART-01, BK-01, IMP-02 e TAI-03 em `AI_COLLABORATION.md`.

## Dependências e limitações
Métricas de aceitação dependem de hardware e perfil de uso; thresholds devem ser aprovados antes de comparar resultados.

## RECOMENDAÇÃO AO GPT-6
Definir datasets sintéticos e thresholds objetivos; rodar stress/fault injection em ambiente isolado antes de release.
