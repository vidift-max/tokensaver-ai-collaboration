# Missão 050 — Security Gate pré-produção

- **IA/modelo:** ChatGPT — GPT-6 | **Data:** 2026-11-10
- **Status:** BLOCKED_FOR_PRODUCTION — checklist proposto; evidências de runtime ausentes.

## Gate obrigatório (todos devem passar)
### Governança e identidade
- [ ] Identidade de agentes autenticada fora do prompt/model output.
- [ ] Grants default-deny, escopo repo/ref/path/operação/ambiente e TTL.
- [ ] Separação executor/auditor/aprovador; aprovação GPT-6 é evento autenticado.
- [ ] Inventário de dados, classificação e política por provider/região/retention.

### Prompt e tools
- [ ] Inputs externos marcados untrusted; instruções confiáveis isoladas.
- [ ] Suíte de prompt injection PI-01..PI-10 aprovada.
- [ ] Tool broker com schemas fechados e allowlist; TI-01..TI-10 aprovados.
- [ ] Nenhum shell/secret read/write privilegiado exposto diretamente ao modelo.

### Secrets e rede
- [ ] Secret manager aprovado; nenhum secret em frontend, SQLite, prompt, log ou artifact.
- [ ] Rotação/revogação testadas.
- [ ] SSRF/DNS rebinding/redirect/private IP testados; egress allowlist ativo.
- [ ] TLS verificado, timeout e response limits configurados.

### GitHub e supply chain
- [ ] Actions pinadas por SHA completo e permissions mínimos por job.
- [ ] Lockfiles versionados e installs frozen/locked.
- [ ] CODEOWNERS/branch rules/status checks revisados por owner.
- [ ] SBOM, provenance, vulnerability scan e artifact integrity disponíveis.
- [ ] Fork PRs sem secrets/write tokens.

### Orquestração e dados
- [ ] HMAC, timestamp, event ID, replay protection e dedupe transacional aprovados.
- [ ] Lease/fencing, unknown outcome e retry sem side effects duplicados testados.
- [ ] Budget ledger atômico, rate limits e circuit breaker comprovados.
- [ ] Isolamento por projeto/tenant, DLP, redaction e retenção validados.
- [ ] Audit trail correlaciona missão/run/agente/grant/commit/evidências.

### Operação
- [ ] Threat model aprovado e owners atribuídos a riscos residuais.
- [ ] Incident response e revogação testados.
- [ ] Pentest/review independente concluído.
- [ ] Build/test/CI e release provenance aprovados.
- [ ] GPT-6 integrador e repository owner concederam aprovação explícita.

## Estado da avaliação
**Não aprovado para produção.** O checklist não pode ser marcado como PASS com base apenas em documentação. Não há evidência de orquestrador operacional, webhook receiver, provider adapters, secret manager ou tool broker implantados. As fases 003–020 ainda constam pendentes/review_required no controle central.

## Critério de saída
Cada checkbox precisa apontar para evidência reproduzível (commit, workflow run, test report, config attestation ou approval record) e owner. Qualquer item crítico desconhecido = BLOCKED, não PASS.

## Testes executados
Nenhum teste de segurança dinâmico, pentest, CI ou integração foi executado nesta missão.

## RECOMENDAÇÃO AO GPT-6
Manter produção e providers reais bloqueados. Aprovar a política documental, depois implementar e validar gates em sandbox. Não converter ausência de evidência em aceite.