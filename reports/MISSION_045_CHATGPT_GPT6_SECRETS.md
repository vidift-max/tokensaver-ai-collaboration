# Missão 045 — Secrets: armazenamento, rotação e exposição mínima

## Identificação
- IA: ChatGPT | Modelo: GPT-6 (OpenAI)
- Especialidade: gestão de segredos e segurança de credenciais
- Função: especificar ciclo de vida de secrets e auditar pontos de exposição observáveis
- Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo
Definir controles de armazenamento, acesso, rotação, revogação e prevenção de vazamento de tokens, API keys, webhook secrets e credenciais GitHub/provider.

## O que esta IA fez
Política proposta:
- Secrets somente em secret manager/OS credential vault ou GitHub Environment protegido; nunca em registry, SQLite de projeto, código, prompt, Issue, artifact, cache ou log.
- Registry guarda credential_ref opaco, nunca valor secreto.
- Um secret por finalidade/provider/ambiente; credenciais GitHub separadas das de provider.
- Entrega just-in-time ao componente necessário; tokens curtos, audience/scope mínimos e sem herança a subprocessos.
- Rotação programada e após incidente, saída de colaborador, exposição suspeita ou mudança de escopo.
- Revogação imediata; inventário com owner, emissão, expiração, última rotação e status, sem valor.
- Redaction antes de log, trace, error, model context e artifact.
- Secrets de webhook com HMAC, key ID/version e janela de rotação limitada.
- Backups não incluem credenciais; restore não restaura tokens expirados/revogados.

## Auditoria estática observada
- provider-registry.json mantém credential_ref null e nenhum valor de chave.
- advanced.rs persiste enabled, endpoint e model da configuração Claude em SQLite; não foi observada API key nessa estrutura consultada. Isso não prova ausência de credenciais em outros caminhos.
- lib.rs expõe get_claude_config e save_claude_config; estrutura lida/escrita contém endpoint/model, não campo de segredo.
- CI empacota ZIP de source com exclusões parciais; não foi executado secret scan.
- Settings administrativos de secrets/environments não estavam disponíveis.

## Arquivos examinados
provider-registry.json, README do registry, src-tauri/src/advanced.rs, src-tauri/src/lib.rs, .github/workflows/ci.yml e relatório 030.

## Relação com trabalhos anteriores
Complementa matriz 010, auditoria 030 e registry 036. Registry guarda referência opaca e não concede acesso.

## Problemas encontrados
- Alto: não há evidência de secret manager, inventário, rotação, revogação ou auditoria de uso implantados.
- Alto: endpoint/model são armazenados em SQLite; endpoint não é secret, mas userinfo/token embutido deve continuar proibido.
- Alto: falta evidência de secret scanning do source ZIP e logs.
- Informação insuficiente: GitHub Secrets, Environment protection e audit log não foram inspecionados; nenhum valor foi acessado.

## Testes executados
Não executado. Nenhum secret scan, rotação, revogação, settings ou redaction test.

## Próximo passo
Owner deve escolher secret manager/vault, definir owners/TTL/rotation SLA e implementar redaction. Provar com canary secrets sintéticos que prompt/log/artifact não os expõem antes de conectar providers.
