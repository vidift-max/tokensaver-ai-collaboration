# Missão 066 — Regression suite: transformar achados em testes permanentes

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: estratégia de testes de regressão e rastreabilidade
- Data: 2026-11-10
- Status: PARTIAL — matriz de regressão documentada; implementação bloqueada

## Objetivo
Mapear achados conhecidos a testes permanentes e critérios de regressão.

## O que esta IA fez
Converteu achados documentados em `AI_COLLABORATION.md` em matriz requisito → teste → evidência.

## Matriz essencial
| Finding | Regressão permanente |
|---|---|
| EXT-01 | orçamento Smart Context por arquivo/bytes/tempo; truncation flag |
| PM-01 | limite 1.000 sob duas conexões independentes |
| BLOB-01 | symlink, hash, corrida de blob e falha antes do commit |
| ART-01 | paginação e ranking top-k estável |
| BK-01 | manifesto/contagem/bytes acima do limite rejeitados antes de alocar |
| BK-02 | duas restaurações para mesmo destino; sem sobrescrita |
| IMP-01/02 | bounded read e mutações concorrentes de roots |
| TAI-02/03 | tabela de limites e deadline/cancelamento real |
| DB-01/02/03 | integrity diagnostics, constraints e concorrência |
| TAI-02 error | erros SQLite não mascarados como default |
| FS/ISO-01 | symlink/junction/TOCTOU em Linux e Windows |
| CI-01 | fmt/clippy/tests/build e status checks fail-closed |
| Tauri | comandos registrados e permissões/CSP auditados |

## Critérios
Cada teste deve ser determinístico, isolado, independente de ordem, usar tempdir/fixtures sintéticas, limpar recursos e afirmar não apenas erro, mas ausência de side effects e preservação dos dados.

## Testes executados
Não executado. Nenhum teste foi adicionado ou executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Consolida findings e testes já recomendados no canal `AI_COLLABORATION.md`; não declara qualquer finding corrigido.

## Dependências e limitações
Matriz precisa ser ligada a IDs de testes/paths e implementada após autorização GPT-6.

## RECOMENDAÇÃO AO GPT-6
Adotar matriz de regressão como gate obrigatório; todo bug corrigido deve trazer teste que falhe antes da correção e passe depois.
