# Missão 043 — Defesa contra Tool Injection

## Identificação
- IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: autorização de ferramentas e segurança de execução
- Função: controles para tool calls e operações perigosas
- Data: 2026-11-10
- Status: REVIEW_REQUIRED

## Objetivo
Impedir que texto de usuário, Issue, documento ou saída de agente induza execução de ferramentas fora da autorização explícita.

## O que esta IA fez
Propôs Tool Broker independente do modelo:
1. Receber intenção estruturada; nunca executar texto shell arbitrário.
2. Autenticar identidade e validar mission/revision/run/attempt.
3. Resolver capability do registry, mas tratar capability como elegibilidade, não permissão.
4. Exigir grant externo assinado e não expirado para operação mutável.
5. Validar repo ID, branch, path allowlist, endpoint, argumentos e limites.
6. Aplicar deny-by-default, rate limit, budget e timeout.
7. Executar em sandbox sem rede/secrets por padrão; separar read-only, collaboration write, Issues, Actions e main write.
8. Verificar postcondition e persistir audit event; não repetir operação ambígua.
9. Rejeitar comandos livres, shell interpolado, tool chaining não autorizado e tentativas de alterar policy.

## Classes de ferramenta
| Classe | Política padrão |
|---|---|
| Read de arquivo | allowlist repo/ref/path |
| Escrita de relatório | grant específico, branch colaboração e paths reports/ |
| GitHub Issue/comment | desabilitado até grant |
| Actions dispatch/secrets/settings | negado |
| Shell/processo/rede | negado; sandbox explícito |
| Main write/merge/release/deploy | negado sem grants independentes e owner |

## Arquivos examinados
Relatórios 010/024/030, contracts/v1/mission.schema.json, provider-registry.json, src-tauri/src/lib.rs e .github/workflows/ci.yml.

## Evidências e relação com trabalhos anteriores
Matriz 010 define default deny e grants escopados. Registry mantém 4 agentes desabilitados e afirma que capability não concede permissão. lib.rs registra conjunto explícito de comandos Tauri. CI não declara permissions explícitas; permissões padrão remotas não foram verificadas. Consolida 010, 021–030 e 031–040.

## Problemas encontrados
- Crítico: sem broker/policy engine runtime comprovado, tool orchestration futura não pode ser considerada segura.
- Alto: superfície IPC precisa de inventário com owner, input limits e permission scope.
- Alto: evitar run_command ou fetch_url genérico exposto a agentes.

## Testes executados
Não executado. Nenhum broker foi criado/acionado; nenhum teste de autorização, sandbox ou tool injection foi feito.

## Próximo passo
Após desbloquear 003–020, começar com ferramentas mock read-only e matriz allow/deny; testar traversal, replay de grant, branch/path errados, argumentos inesperados e tool chaining.
