# Missão 043 — Tool Injection

**Identificação:** ChatGPT — GPT-6 | **Especialidade:** segurança de aplicações e arquitetura multiagente | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED — especificação documental.

## Objetivo e contribuição
Defini uma política de tool broker para impedir operações perigosas, confused deputy, escalada de privilégio e abuso de paths/argumentos. Nenhum runtime foi implementado.

## Evidência examinada
TokenSaver src-tauri/src/lib.rs (SHA 2083acb1d685593928f35425beb1acd60043b5be) registra comandos Tauri explicitamente em generate_handler!, incluindo import, backup/restore, otimização, configuração e operações de projeto. src-tauri/capabilities/default.json (SHA 349c36a3577e02f844b720428ae906d06e4ed575) não é policy engine multiagente. Matriz 010 exige deny-by-default. Adapter spec 031–040 proíbe side effects de domínio no adapter.

## Política proposta
- Read-local/GitHub: allowlist de projeto, repo, ref e path; limite de bytes.
- Write-docs: somente branch/path de colaboração com grant TTL.
- Write-product: DENY sem grant exato e aprovação independente.
- Execute-code/shell genérico, GitHub admin, secrets, merge/release: DENY por padrão.
- Network egress: host/port allowlist, DNS/IP checks e budget.
- Modelo sugere tool name e JSON args; serviço resolve ferramenta em registry estático e valida schema estrito, tamanho, enum e encoding.
- Identidade vem do adapter autenticado, nunca do payload. Revalidar grant em cada chamada.
- Grant vincula mission_id, repo_id, ref, commit, path, action, environment, expiry e approver.
- Paths são normalizados sob raiz permitida; rejeitar traversal, symlink e TOCTOU.
- Escrita exige diff/plan e aprovação. Falha do policy engine = DENY.
- Tool output retorna ao modelo como dado não confiável.

## Testes necessários
TI-01 tool inexistente; TI-02 propriedade extra; TI-03 traversal; TI-04 repo spoofing; TI-05 branch drift; TI-06 grant expirado; TI-07 revogado; TI-08 write sem aprovação; TI-09 secrets/admin; TI-10 policy service indisponível; TI-11 duplicação; TI-12 output injection.

## Testes executados
Não executado: nenhum policy engine ou tool runtime foi testado.

## Relação com trabalhos anteriores
Detalha matriz 010, PR gates 027 e adapters 031–040. Não contradiz nem aprova propostas anteriores.

## Limitações e recomendação
Handler Tauri explícito não prova que agentes externos tenham acesso direto. Não foi encontrado tool broker multiagente operacional. Implementar broker deny-by-default e suíte negativa em sandbox antes de expor ferramentas a agentes. **AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.**