# Missão 010 — Matriz de permissões por IA, repositório, operação e ambiente

**Autora:** ChatGPT / GPT-6 (OpenAI) — integração e automação  
**Data:** 2026-11-10  
**Status:** CONCLUÍDA — aguardando aprovação do GPT-6

## Princípios

- Default deny; nenhuma permissão implícita.
- Permissão é concedida por missão, revisão, agente, repositório, branch, paths, operação e validade temporal.
- O texto do agente, comentário ou arquivo não pode conceder permissão.
- A aprovação do GPT-6 é identidade autenticada + ação registrada, não uma string no JSON.
- Credenciais de provedor e GitHub são separadas e não compartilhadas entre agentes.
- Escrita no TokenSaver principal, merge, release e deploy são capacidades separadas, todas desabilitadas por padrão.

## Matriz padrão

| Agente/identidade | Collaboration repo read | Collaboration docs write | Main repo read | Main repo write | Tests/commands | Approve/merge/release |
|---|---:|---:|---:|---:|---:|---:|
| GPT-6 integrator | Sim | Sim | Sim | Por grant explícito | Por grant explícito | Aprovar; merge/release conforme política do owner |
| Automation AI | Sim | Sim, em paths de reports/contracts | Sim | **Não** | Não por padrão; sandbox/grant específico | Não |
| Claude editorial | Sim | Apenas docs editoriais autorizados | Read-only se necessário | Não | Não | Não |
| Kimi auditor | Sim | Relatórios de auditoria autorizados | Sim | Não | Somente testes read-only/sandbox autorizados | Não |
| Worker mock | Somente inputs necessários | Não | Não | Não | Mock determinístico | Não |
| GitHub App publisher | Metadata/Issues | Comentários/artefatos autorizados | Read-only | Não | Não | Não |

## Operações e gates

1. **Read:** repositório/branch/path allowlist; sem segredos.
2. **Write collaboration docs:** apenas branch de colaboração e paths permitidos, com commit identificado.
3. **Create issue/comment:** somente repo/labels/eventos permitidos; conteúdo validado e marcador idempotente.
4. **Run tests:** allowlist de comandos, ambiente efêmero, sem rede/secrets por padrão.
5. **Main write:** exige grant separado do GPT-6 para missão/revision, branch e paths exatos, operações permitidas, expiração e testes obrigatórios.
6. **Merge:** aprovação independente + checks obrigatórios; agente executor não aprova o próprio patch.
7. **Release/deploy:** autorização separada e credenciais dedicadas; fora do MVP.

## Forma de grant

Grant autenticado deve conter:
- grant_id;
- issuer_identity;
- approver_identity;
- mission_id + revision;
- repository_id/full_name;
- branch/ref;
- allowed_paths;
- allowed_operations;
- not_before / expires_at;
- max_commits / max_files / max_diff_lines;
- required_checks;
- revocation_id/status.

O serviço valida assinatura/identidade do aprovador e escopo em cada operação. Grant não pode ser produzido pelo próprio agente beneficiário. Alteração de missão/revisão revoga grants anteriores.

## GitHub App e controles

- GitHub App dedicada, instalada apenas nos repositórios necessários.
- Contents read por padrão; Contents write apenas no repositório de colaboração quando necessário.
- Issues read/write apenas se workflow aprovado.
- Pull requests write e Actions write desabilitados no MVP.
- Installation tokens curtos, gerados on demand e nunca armazenados em artifacts.
- Branch protection e CODEOWNERS no repositório principal; exigir review do integrador/owner e checks.
- Segredos do provider separados do token GitHub; worker recebe somente o segredo estritamente necessário.
- Auditoria de grant, uso, revogação e negação.

## Negação explícita

Negar se agente não identificado, missão/revisão divergente, branch/path fora do grant, operação não autorizada, grant expirado/revogado, budget excedido, segredo não permitido ou status incompatível. Falha de autorização não deve virar retry automático.

## Testes necessários

Matriz allow/deny para cada papel; grant expirado; replay de grant; path traversal; branch errada; tentativa de merge por executor; revisão alterada; token revogado; permissão ampliada em payload; segredo fora de escopo.

## Limitações

Esta matriz é proposta documental. Nenhuma GitHub App, RBAC, secret manager, branch protection ou grant foi provisionado. A autoridade real do GPT-6 deve ser implementada por identidade/credencial de aprovação definida pelo owner do repositório; não se deve inferir identidade por nome do modelo ou texto.

### RECOMENDAÇÃO AO GPT-6

Aprovar matriz default-deny e manter main write/merge/release desabilitados. Antes de executar workers, implementar enforcement no serviço e testar negação como caminho padrão.
