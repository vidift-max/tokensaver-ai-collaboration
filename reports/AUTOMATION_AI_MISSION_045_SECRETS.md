# Missão 045 — Secrets Management

**Identificação:** ChatGPT — GPT-6 | **Especialidade:** segurança de aplicações e arquitetura multiagente | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED — especificação documental, não controle implantado.

**Escopo:** análise estática/documental. Nenhum código do repositório principal foi alterado; nenhum secret foi acessado; nenhum teste dinâmico foi executado.

## Objetivo e contribuição própria
Especifiquei armazenamento, acesso, rotação, revogação, redaction e incident response para API keys, GitHub App credentials e webhook secrets. Nenhum secret foi lido, criado, copiado ou alterado.

## Evidência examinada
src-tauri/src/advanced.rs (SHA ffc14545043ca41bcd49a3181c0b21dcf6ba36cf): ClaudeConfig persiste enabled, endpoint e model em SQLite; não há campo de API key nessa estrutura. save_claude_config grava configuração. Nenhum cliente HTTP Claude ativo foi localizado nesta inspeção. Matriz 010 e auditoria 030 recomendam short-lived credentials e separação de secrets.

## Política
1. Servidor: secret manager gerenciado, criptografia em repouso/trânsito e workload identity.
2. Desktop: OS credential vault (Credential Manager/Keychain/libsecret); nunca SQLite plaintext, arquivo de config, localStorage, prompt ou repo.
3. Modelo nunca recebe secret bruto; adapter usa credencial internamente e retorna somente metadados.
4. GitHub: preferir GitHub App, instalação restrita e tokens curtos; evitar PAT pessoal.
5. Credenciais isoladas por provider, ambiente, tenant e finalidade.
6. Redaction antes de logs, traces, exceptions, artifacts, crash dumps e telemetry.
7. Inventário sem valores: secret_id, owner, purpose, scope, environment, expiry, last rotation e status.
8. Rotação versionada; troca atômica; revogar imediatamente em suspeita.
9. Secrets excluídos de backup/export e nunca copiados para Issues/relatórios.
10. Separar acesso de leitura, rotação e administração; agentes não administram o vault.

## Incident response
Revogar primeiro; preservar evidência redigida; avaliar destinos/logs; rotacionar credenciais relacionadas; invalidar tokens/cache; registrar incidente sem copiar valor. Testar token expirado e revogação em sandbox.

## Testes necessários
SC-01 canary ausente dos logs; SC-02 erro HTTP sem header; SC-03 prompt sem secret; SC-04 artifact/backup sem vault; SC-05 token expirado falha fechado; SC-06 rotação invalida versão antiga; SC-07 tenant isolation; SC-08 revogação interrompe chamadas; SC-09 exception sanitization.

## Testes executados
Não executado: secret scan, vault integration, rotation, revocation ou canary tests. Nenhum valor secreto foi acessado.

## Relação com trabalhos anteriores
Complementa matriz 010, auditoria 030 e adapter contracts 031–040.

## Limitações/status
A estrutura Claude observada guarda endpoint/model/enabled, não chave; não se conclui que secrets estejam ausentes em toda infraestrutura. Settings/vault não foram acessados. REVIEW_REQUIRED. Owner deve selecionar vault e identidade antes de conectar providers. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.