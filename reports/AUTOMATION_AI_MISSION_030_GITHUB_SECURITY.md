# Missão 030 — Auditoria de segurança GitHub: secrets, tokens, permissões e eventos

**Responsável:** Automation AI | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED

## Escopo e evidência disponível
Foram consultados o protocolo de colaboração, matriz de permissões 010 e `.github/workflows/ci.yml` do repositório principal `vidift-max/tokensaver-ai` na branch `v2-saas-alpha`. O workflow usa `actions/checkout@v4`, `dtolnay/rust-toolchain@stable`, `actions/setup-node@v4` e `actions/upload-artifact@v4`; não declara `permissions:`, não fixa actions por SHA completo e não define `timeout-minutes` ou `concurrency`. O workflow executa em push e pull_request na branch e empacota o código fonte em artifact por 14 dias. Esta leitura é estática e limitada ao arquivo consultado.

## Achados
| ID | Gravidade | Evidência | Recomendação |
|---|---|---|---|
| GH-01 | Média | Workflow não declara permissões explícitas por job | Definir `permissions: contents: read` no mínimo e elevar somente por job justificado |
| GH-02 | Média | Actions referenciadas por tags (`@v4`, `@stable`) | Fixar SHA completo validado e atualizar por processo controlado |
| GH-03 | Média | Ausência de `timeout-minutes` e `concurrency` explícitos | Definir timeout por job e grupo de concorrência; cancelamento apenas quando seguro |
| GH-04 | Média | ZIP de fonte é publicado como artifact | Confirmar se o artifact deve ser público/compartilhável; filtrar arquivos locais e segredos; reduzir conteúdo ao necessário |
| GH-05 | Informação insuficiente | Não foi possível ler secrets/variables/branch protection por este escopo de leitura | Exigir auditoria autenticada de settings sem revelar valores |

## Checklist de auditoria operacional
1. GitHub App dedicada em vez de PAT; instalação apenas nos repos necessários.
2. Permissions mínimos por endpoint e workflow; tokens de instalação curtos.
3. Secrets apenas em GitHub Environments protegidos; nunca em Issue, payload, artifact, cache ou logs.
4. Rotação, expiração, revogação e inventário de credenciais com owner.
5. Secret scanning e push protection habilitados onde disponíveis; não registrar valor detectado.
6. Restringir eventos: allowlist de `push`, `pull_request`, `workflow_dispatch`, `repository_dispatch` conforme necessidade; validar repository_id, sender, action e delivery ID.
7. Evitar `pull_request_target` com checkout/execução de código de fork.
8. Fixar Actions por SHA, revisar dependências e restringir actions permitidas na organização.
9. Proteger branch, required checks, CODEOWNERS e revisão independente.
10. Separar permissões de Contents, Issues, Actions, Pull Requests e Administration.
11. Não habilitar `workflow_run` privilegiado que consuma artifact não confiável sem validação/isolamento.
12. Restringir upload/download de artifacts, retenção, tamanho e acesso.
13. Auditar audit log da organização/repositório e eventos de instalação do GitHub App.
14. Nenhum segredo deve ser copiado para o repositório de colaboração ou para o TokenSaver principal.

## Critérios de aceite
Inventário de tokens/Apps e scopes sem expor valores; workflows com permissões mínimas; eventos allowlisted e autenticados; secret scanning; proteção de branch; logs/artifacts sem segredos; plano de rotação/revogação; owner para cada credencial.

## Testes requeridos
PR de fork, tentativa de secret exfiltration, evento de sender não autorizado, replay, workflow_dispatch sem permissão, token expirado/revogado, artifact malicioso, workflow com permissões excessivas e detecção de segredo sintético.

## Limitações
Não houve acesso de leitura aos valores/nomes de secrets, environment protections, branch protection, audit log ou políticas organizacionais. Não foi executado secret scan. Portanto, não se afirma que existam secrets expostos nem que as configurações operacionais estejam seguras. Nenhum segredo foi lido ou alterado.

## Recomendação ao GPT-6
Priorizar GH-01 a GH-04 no próximo PR de hardening, após autorização. Solicitar owner/admin para auditoria de settings, secret scanning e audit log; manter automação em read-only até aprovação da Missão 010.