# Missões 041–050 — Threat Model e Controles de Segurança

**IA:** ChatGPT (GPT-6)  
**Especialidade:** arquitetura, integração e segurança de sistemas  
**Data:** 2026-11-10  
**Repositório de trabalho:** vidift-max/tokensaver-ai-collaboration  
**Branch:** v2-saas-alpha  
**Repositório principal analisado:** vidift-max/tokensaver-ai, branch v2-saas-alpha  
**HEAD principal observado:** 935b6fc5d0c126e93697a16f73d56bb3a4d1e55f  
**Status geral:** REVIEW_REQUIRED — threat model estático entregue; controles operacionais e validação dinâmica pendentes.

## 1. Escopo e método

Foi feita leitura estática, read-only, do HEAD indicado, do workflow CI, configuração Tauri, manifests de dependências, comandos Rust/IPC e documentação de colaboração/contratos. Foram cruzados os relatórios das Missões 006 (webhook), 010 (permissões), 021 (Issues como fila), 030 (segurança GitHub) e 031–040 (adapters).

O trabalho cobre dois planos distintos:
1. **Aplicativo desktop atual:** Tauri 2, React/TypeScript, Rust e SQLite, com arquivos locais, blobs, backup, importação, contexto, templates e configuração Claude.
2. **Plano futuro multiagente:** mission contract, adapters, provider registry, GitHub automation, webhook ingress, grants e execução de ferramentas. O registry está draft, todos os agentes estão desabilitados/manual-assisted e providers reais não estão conectados.

Não foram alterados arquivos do TokenSaver principal. Não foram lidos valores de secrets/settings privados, nem executados testes, scans, builds ou chamadas externas.

## 2. Ativos, identidades e fronteiras de confiança

### Ativos que exigem proteção
- Conteúdo importado pelo usuário, versões, metadados, banco SQLite e blobs SHA-256.
- Backups, manifestos e diretórios de staging.
- Áreas de importação autorizadas e configurações locais, incluindo endpoint Claude.
- Código-fonte, dependências, artifacts e credenciais do CI/GitHub.
- Missões, aprovações, grants, evidências, resultados e custos do futuro orquestrador.
- Credenciais de provedores e dados enviados a modelos externos, quando essa integração existir.

### Fronteiras
- UI React → Tauri IPC → comandos Rust → filesystem/SQLite.
- Pastas autorizadas → importação → armazenamento local.
- Conteúdo de arquivo/Issue/URL → contexto de agente (futuro) → provider externo.
- GitHub event → webhook ingress → inbox/ledger → worker (futuro).
- GitHub Actions → checkout/dependências/build/artifacts.
- GPT-6/owner autenticado → grant limitado → operação automatizada.

### Premissa de confiança
Arquivos importados, Issues, comentários, URLs, outputs de modelos, artifacts e metadados externos são dados não confiáveis. Não podem conceder autoridade, alterar grants, definir comandos ou sobrescrever políticas.

## 3. Threat model resumido (STRIDE)

| Ameaça | Ativo/fronteira | Cenário | Estado observado | Severidade |
|---|---|---|---|---|
| Spoofing | webhook, agente, aprovação | evento ou agente se apresenta como autorizado | webhook/worker não implementados; spec 006 exige HMAC e identidade | Alta para implementação futura |
| Tampering | DB, blobs, backups, registry, artifacts | conteúdo ou manifesto adulterado | hashes e validações existem em partes; integridade de toda a cadeia não foi testada | Média/Alta |
| Repudiation | grants, decisões, execuções | não conseguir provar quem autorizou/alterou | contratos e relatórios registram IDs; trilha runtime ainda não existe | Média |
| Information disclosure | arquivos locais, secrets, provider e artifacts | contexto ou credencial sai do limite permitido | sem provider real; artifact de fonte é publicado no CI; settings não foram auditados | Alta futura / Média CI |
| Denial of service | Smart Context, SQLite, CI, webhook futuro | varredura, payload ou execução consome recursos | Smart Context percorre todos os blobs; sem orçamento global demonstrado | Alta |
| Elevation of privilege | IPC, tools, GitHub grants | conteúdo ou agente chama ferramenta/ação privilegiada | 29 comandos no invoke handler; grants/adapters ainda documentais | Alta futura |

## 4. Achados priorizados

### SEC-01 — Smart Context sem orçamento global
**Severidade: ALTA.** Em src-tauri/src/smart_context.rs, smart_context() percorre todas as versões mais recentes, lê blobs completos, cria cópia lowercase e só limita o número de hits ao final. Não há limite global de arquivos examinados, bytes totais ou deadline. Um projeto grande pode consumir memória/CPU e travar a UI. Definir budget de arquivos, bytes, tempo e tamanho de saída, truncamento explícito e testes de carga.

### SEC-02 — Validação superficial do endpoint Claude
**Severidade: MÉDIA (latente, não SSRF explorável demonstrado).** advanced.rs valida endpoint por prefixos e parsing manual da authority. save_claude_config persiste URL/modelo; não foi encontrado cliente HTTP/reqwest nem chamada de rede Claude no código consultado. Se o endpoint vier a ser consumido, a validação atual não é suficiente contra DNS rebinding, IPs privados/link-local, credenciais embutidas, portas e redirects. Usar parser URL real, allowlist de host, validação DNS/IP no momento da conexão e política de redirect; não habilitar outbound até isso.

### SEC-03 — Cadeia de dependências e CI sem pinning determinístico
**Severidade: MÉDIA.** .github/workflows/ci.yml usa Actions por tags (@v4, @stable), Rust stable, npm install; package.json usa ranges caret; não foi localizado Cargo.lock nem package-lock.json nos paths examinados. Não há evidência de pin de SHA, SBOM, assinatura/proveniência ou scan de dependências. Fixar Actions por SHA completo, versionar lockfiles, usar npm ci, toolchain Rust fixada e auditoria automatizada de vulnerabilidades/SBOM.

### SEC-04 — Permissões explícitas ausentes no workflow
**Severidade: MÉDIA.** O workflow CI não declara permissions por workflow/job. Adotar permissions: contents: read no mínimo e elevar somente quando justificado; separar jobs e limitar tokens. Acesso a secrets e branch protection não foi inspecionado.

### SEC-05 — Artefato ZIP de fonte sem filtro de conteúdo sensível
**Severidade: MÉDIA.** O workflow empacota a árvore do checkout e exclui .git, node_modules, target e dist; não há etapa explícita de secret scanning do ZIP. .gitignore exclui .env, storage e SQLite, mas isso não impede inclusão de arquivos já rastreados ou inclusão futura por mudanças no workflow. Fazer allowlist de arquivos, scanner de segredos e verificação de conteúdo antes do upload.

### SEC-06 — Comandos Tauri sem política por comando demonstrada
**Severidade: MÉDIA / ALTA no futuro multiagente.** src-tauri/src/lib.rs registra 29 comandos em generate_handler!. default.json concede core:default; não foi localizada política de grant por missão/risco/identidade aplicada aos comandos customizados. Hoje a UI local invoca comandos determinísticos; não há agente autônomo integrado. Antes de permitir agentes/tools, aplicar autorização backend por identidade, comando, projeto, path, risco e grant; deny-by-default.

### SEC-07 — Prompt/tool injection sem enforcement runtime
**Severidade: ALTA futura.** O contrato mission.schema.json marca inputs como untrusted_data e a documentação 021 proíbe comandos livres em Issues. Contudo, o registry e os adapters 031–040 são drafts e não há runtime demonstrado que mantenha a separação entre instrução confiável e conteúdo recuperado. Adotar isolamento de dados, delimitadores/proveniência, tool allowlist fora do modelo e validação de argumentos no host.

### SEC-08 — Secrets e settings operacionais não auditados
**Severidade: ALTA por incerteza; sem evidência de vazamento.** O schema Claude armazena enabled/endpoint/model, sem campo de API key. .gitignore exclui .env e .env.*, mas os valores de secrets GitHub, environments, audit log e secret scanning não foram acessíveis nesta leitura. Exigir auditoria autenticada por owner; secret manager, tokens curtos, rotação/revogação e redaction.

### SEC-09 — Replay e webhook ainda não testáveis
**Severidade: ALTA antes de ativar ingress.** Não foi encontrado servidor webhook/worker ativo no desktop. Missão 006 define HMAC do corpo bruto, delivery ID, inbox única, quarentena para mesmo delivery com digest divergente e resposta após persistência. Missões 007/011–020 ainda não entregaram runtime confirmado. Não abrir endpoint até inbox idempotente, fencing e testes de replay.

### SEC-10 — Controles contra exfiltração de dados ainda não aplicados
**Severidade: ALTA futura.** A UI descreve Smart Context como local e não enviando conteúdo a APIs externas; não foi identificado cliente de provider. No entanto, quando a orquestração externa existir, falta enforcement runtime demonstrado de classificação, minimização, allowlist de dados, consentimento, redaction e auditoria de egress. Não enviar dados internos a provider até gate de privacidade.

## 5. Missões 041–050 — resultado individual

| Missão | Resultado desta IA | Status |
|---|---|---|
| 041 Threat model | Ativos, fronteiras, STRIDE, riscos e dependências documentados | REVIEW_REQUIRED |
| 042 Prompt injection | Defesa proposta; nenhum agente/runtime ativo para validar | REVIEW_REQUIRED |
| 043 Tool injection | Política deny-by-default, allowlist e validação host-side propostas | REVIEW_REQUIRED |
| 044 Least privilege | Matriz por agente/ação/branch/path/ambiente; enforcement não demonstrado | REVIEW_REQUIRED |
| 045 Secrets | Estratégia de vault, rotação, redaction e auditoria owner-only; settings inacessíveis | BLOCKED para auditoria operacional |
| 046 Supply chain | CI, manifests, ausência de lockfiles e pinning identificados | REVIEW_REQUIRED |
| 047 SSRF/endpoints | Validação superficial; sem HTTP client ativo encontrado | REVIEW_REQUIRED |
| 048 Replay | Especificação 006 aproveitada; ingress/inbox não implementados | BLOCKED para testes operacionais |
| 049 Data exfiltration | Fluxos e controles de egress especificados; provider não conectado | REVIEW_REQUIRED |
| 050 Security gate | Checklist e critérios de bloqueio para produção definidos | REVIEW_REQUIRED; release BLOCKED |

## 6. Matriz de controles obrigatórios

1. **Input:** tratar arquivo, Issue, comentário, URL, artifact e output de modelo como dado não confiável; schema/size/type validation antes de parsing.
2. **Prompt:** separar system/developer policy de retrieved content; registrar proveniência; não interpolar conteúdo externo como instrução.
3. **Tools:** allowlist estática; schema de argumentos; validação de identidade/grant no backend; confirmação humana para operações de alto risco; sem shell arbitrário.
4. **Permissions:** default deny; grant limitado a missão+revision+agent+repo+branch+paths+operation+expiry+budget; revogação e auditoria.
5. **Secrets:** secret manager; nenhum segredo em registry, issue, prompt, artifact ou log; tokens curtos; rotação/revogação testada.
6. **Supply chain:** lockfiles, SHA pinning, SBOM, provenance, dependency review, secret scanning e artifacts allowlisted.
7. **SSRF:** parser URL real, scheme/host/port allowlist, bloqueio de IP privado/loopback/link-local/metadata, DNS pinning/validation, redirects off ou revalidados.
8. **Replay:** HMAC do raw body, delivery ID único persistido, hash do payload, timestamp como defesa adicional, inbox/outbox transacional e fencing.
9. **Egress:** classificação de dados, minimização, redaction, provider allowlist, data residency/retention, aprovação por classe e log de destino sem conteúdo sensível.
10. **Runtime:** timeout, rate limit, quotas, circuit breaker, kill switch, logs redacted, monitoramento e incident response.

## 7. Security gate antes de produção

**Bloquear release/integração externa enquanto qualquer item abaixo estiver pendente:**
- contratos 003–010 aprovados e runtime 011–020 implementado/testado;
- registry 031–039 aprovado; adapters e tools com grants reais testados;
- threat model revisado pelo owner e findings críticos fechados;
- prompt/tool injection testados em arquivos, Issues, outputs e artifacts hostis;
- matriz least-privilege aplicada e negação comprovada;
- inventário de secrets, rotação/revogação, secret scanning e redaction validados por owner;
- lockfiles, Actions pinadas, SBOM e proveniência dos artifacts;
- endpoint allowlist e SSRF tests, se existir outbound HTTP;
- HMAC/inbox/replay/fencing testados antes de webhook;
- classificação de dados e exfiltration tests por provider;
- CI Linux/Windows verde no commit candidato, testes de segurança e revisão independente;
- plano de incident response, rollback, backups e kill switch.

## 8. Testes necessários — não executados nesta missão

- Prompt injection em Markdown/HTML/JSON, Issues, comentários e resposta de provider; confirmar que nenhum texto altera policy/grant.
- Tool injection: shell, path traversal, repo/branch/path alternativo, tool name desconhecida, parâmetros extra e approval spoofing.
- RBAC: matriz allow/deny, grant expirado/revogado, missão/revision divergente, path/branch fora do escopo, self-approval.
- Secrets: secret sintético em source/ZIP/log/artifact; redaction; rotação current/next; revogação e token expirado.
- Supply chain: lockfile drift, action tag mutable, dependency vulnerability, artifact tampering, SBOM/provenance verification.
- SSRF: localhost, RFC1918, link-local, IPv6 local, IPv4-mapped IPv6, DNS rebinding, redirect para rede privada, userinfo, IP literal e porta inválida.
- Replay: HMAC válido/inválido, byte alterado, delivery duplicado, mesmo ID/digest diferente, concorrência, falha entre persistência e ACK.
- Exfiltration: arquivos classificados, segredo-canário, prompt com PII, contexto excessivo, provider não autorizado, output/log/artifact leak.
- DoS: Smart Context com milhares de blobs e arquivos grandes, payloads excessivos, requests concorrentes, quota e timeout.
- CI: PR de fork, permissões efetivas, secret exposure e artifact content inspection.

**Executado:** leitura estática de arquivos/contratos e buscas no repositório; parsing JSON do registry adapter já registrado anteriormente não foi repetido como teste desta missão.  
**Não executado:** build, testes Rust/TS, CI, scanner de dependências, secret scan, DAST, fuzzing, harness de webhook, provider calls ou testes de carga.

## 9. Arquivos examinados

No repositório principal: .github/workflows/ci.yml; package.json; .gitignore; src-tauri/Cargo.toml; src-tauri/tauri.conf.json; src-tauri/capabilities/default.json; src-tauri/src/lib.rs; src-tauri/src/advanced.rs; src-tauri/src/path_guard.rs; src-tauri/src/smart_context.rs; src-tauri/src/db.rs; src-tauri/src/commands.rs; src-tauri/src/limits.rs; src/App.tsx; src/api.ts; AI_COLLABORATION.md.

No repositório de colaboração: CENTRAL.md; INSTRUCTIONS.md; contratos contracts/v1; relatórios 006, 010, 021, 030 e 031–040; contracts/adapters/v1/README.md; provider-registry.json; AUTOMATION_AI_MISSION.md; MISSION_PLAN_002_100.md.

## 10. Limitações e decisões pendentes

- A auditoria é estática e limitada aos arquivos recuperados no HEAD 935b6fc. Não equivale a pentest ou auditoria de settings.
- Não foram acessados secrets, environment protections, branch protection, GitHub audit log, permissões de instalação, artifacts privados nem configurações organizacionais.
- Não foi feita inspeção exaustiva de todos os módulos Rust/React e dependências transitivas.
- Não se afirma existência de segredo vazado, endpoint SSRF explorável, webhook vulnerável ou exfiltração ativa.
- O endpoint Claude é apenas armazenado; a existência de cliente HTTP ativo não foi encontrada nas dependências e arquivos consultados.
- A Fase E é documentação/revisão, não autorização para alterar código, ativar providers, criar webhook ou habilitar tools.

## 11. Próximas decisões do GPT-6 / owner

1. Aprovar ou corrigir este threat model e os níveis de severidade.
2. Priorizar SEC-01, SEC-03/04/05 e SEC-06 antes de ampliar o produto.
3. Determinar política de endpoint Claude e impedir uso até implementação de parser/egress control.
4. Solicitar ao owner/admin a auditoria autenticada de secrets, Actions permissions, branch protection e audit log.
5. Resolver gates 003–020 e autorizar separadamente implementação/testes isolados da Fase E.
6. Manter providers, webhooks, agent tools, main write, merge e release desabilitados até evidência de aprovação.

**Estado final:** Missões 041–050 documentadas em relatórios individuais e consolidados. Segurança de produção NÃO aprovada. Aguardando validação da IA integradora.
