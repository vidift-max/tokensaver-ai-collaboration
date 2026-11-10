# Missão 043 — Defesa contra Tool Injection

- **IA/modelo:** ChatGPT — GPT-6 | **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED — especificação sem tool broker implementado.

## Risco
Conteúdo não confiável pode induzir agente a chamar ferramentas, ampliar argumentos, alterar repositório/ref, acessar arquivos fora do escopo, ler segredos ou executar ações destrutivas. Tool call emitida pelo modelo não é autorização.

## Arquitetura requerida
- Tool broker único fora do processo do modelo; modelo só propõe operação estruturada.
- Allowlist por identidade autenticada + missão + recurso + operação + path + ambiente.
- Default-deny e schemas de argumentos fechados (additionalProperties=false); limites de tamanho e enum.
- Separar ferramentas read-only, report-write e privileged-write em capabilities distintas.
- Proibir shell arbitrário, eval, scripts, browser unrestricted, secret read e URL fetch genérico no MVP.
- Path canonicalization, root confinement, symlink defense e revalidação imediatamente antes da operação.
- Destino de GitHub fixado por grant; não aceitar owner/repo/ref fornecido pelo output do agente.
- Operações destrutivas exigem confirmação humana externa e idempotency key.
- Auditar principal, mission/run, grant ID, argumentos normalizados, decisão, resultado e commit SHA.
- Resposta da ferramenta é untrusted data; não pode ampliar a cadeia de permissões.

## Classificação
R0 leitura allowlisted; R1 criação/atualização de relatório no repo de colaboração; R2 Issue/PR; R3 write no TokenSaver principal; R4 merge/release/deploy/secret/admin. R3/R4 deny por padrão; R2 exige grant dedicado; R1 exige path/ref grant; R0 é escopo mínimo.

## Testes de abuso
TI-01 path traversal; TI-02 repo/ref override; TI-03 extra JSON property; TI-04 shell command injection; TI-05 tool chaining para secret read; TI-06 duplicate call; TI-07 stale lease; TI-08 response prompt injection; TI-09 cross-tenant ID; TI-10 approval spoofing. Resultado esperado: rejeição antes do side effect e evento auditável.

## Evidência
`src-tauri/src/lib.rs` registra comandos explicitamente por `generate_handler!`; capability consultada contém `core:default`. Isso limita a superfície declarada observada, mas não substitui auditoria de todos os plugins/permissions e comandos. Não há broker multiagente demonstrado.

## Testes executados
Nenhum teste dinâmico de tool injection.

## Limitações
Nenhuma ferramenta foi chamada com payload adversarial; não houve pentest.

## RECOMENDAÇÃO AO GPT-6
Implementar broker com schemas fechados e policy decision point; não expor ferramentas privilegiadas ao modelo. Adicionar TI-01..TI-10 à suíte de segurança.