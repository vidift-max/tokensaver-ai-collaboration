# Missão 045 — Armazenamento e ciclo de vida de secrets

- **IA/modelo:** ChatGPT — GPT-6 | **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED — política proposta; nenhum secret foi acessado ou criado.

## Modelo de armazenamento
- Desktop: usar Windows Credential Manager/DPAPI ou secret store suportado pelo SO; não guardar API keys em SQLite, config JSON, frontend, logs, crash dumps ou backups.
- Backend futuro: secret manager dedicado (ex.: cloud KMS/secret vault), identidade workload e secret references opacas.
- GitHub: GitHub App com instalação/repositórios mínimos; preferir tokens de curta duração; separar CI read-only de bot de relatório.
- Provider keys: uma credencial por provider/environment/tenant, sem compartilhar entre agentes; restringir quotas e billing.
- Dev/test: mocks e secrets sintéticos; nunca copiar produção.

## Rotação e resposta
1. Inventariar owner, purpose, scopes, environment, created_at, expires_at, last_used e secret_ref.
2. Rotacionar por calendário e imediatamente após suspeita/uso indevido.
3. Revogar credencial antiga após confirmar nova; não manter fallback indefinido.
4. Monitorar uso anômalo, quota e origem.
5. Incidente: disable integration → revoke → preservar logs redigidos → avaliar exposição → notificar owner → reissue.
6. Backups e exports nunca devem incluir secret material.

## Não exposição
- Redaction antes de log/telemetry/error reporting.
- Bloquear patterns de API keys, Authorization, cookies e private keys nos artifacts.
- Não incluir segredos em prompt/contexto nem enviar a agentes.
- Secret scanning em commits, PRs e artifacts; alerta não deve ecoar valor completo.
- Nunca armazenar valor em provider registry; somente secret_ref opaca.

## Evidência
`src-tauri/src/advanced.rs` define ClaudeConfig com enabled/endpoint/model, sem campo de credencial. README declara credenciais fora do frontend/logs. Não foi verificado secret store implementado. Registry de adapters proíbe valores de credenciais e mantém entradas desabilitadas.

## Testes necessários
SC-01 secret em log; SC-02 secret em exception; SC-03 secret em artifact; SC-04 backup contendo secret; SC-05 secret scanning em PR; SC-06 rotação/revogação; SC-07 key cross-tenant. Testes não executados.

## Limitações
Sem acesso a secrets/settings, Windows Credential Manager, vault, billing ou runtime. Não é certificação de ausência de segredos.

## RECOMENDAÇÃO AO GPT-6
Aprovar secret manager e rotação antes de conectar provider. ClaudeConfig deve continuar apenas configuração não secreta; credenciais nunca devem ser adicionadas ao SQLite/frontend.