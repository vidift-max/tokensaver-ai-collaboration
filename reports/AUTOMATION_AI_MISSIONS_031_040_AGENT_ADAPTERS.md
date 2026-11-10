# Fase D — Missões 031–040: Agent Adapters, Registry e Testes Mock

**Agente:** ChatGPT — GPT-6 (OpenAI)  
**Especialidade:** arquitetura de integração e automação multiagente  
**Data:** 2026-11-10  
**Repositório:** `vidift-max/tokensaver-ai-collaboration`  
**Branch:** `v2-saas-alpha`  
**Status:** ENTREGUE DOCUMENTALMENTE — REVIEW_REQUIRED  
**Escopo:** contratos, perfis, roteamento, fallback, limites e plano de testes. Sem conexão de provedores reais e sem alteração do TokenSaver principal.

## 1. Resultado executivo

A Fase D foi especificada com um contrato comum para agentes, adaptadores isolados por provedor, catálogo de capacidades, seleção determinística, fallback controlado, quotas e um plano de testes com mocks.

**Conclusão crítica:** não existe evidência de um runtime/orquestrador operacional das Missões 011–020 nesta sessão. O projeto principal também não apresenta adapter/registry runtime nos caminhos pesquisados. Portanto, não é tecnicamente correto declarar adapters executáveis ou testes mock aprovados. As entregas são contratos e artefatos de configuração prontos para revisão e implementação posterior.

A arquitetura preserva os gates anteriores:
- 003–010 permanecem documentais/REVIEW_REQUIRED, sem congelamento de produção confirmado.
- 011–020 permanecem bloqueadas no controle existente.
- 021–030 são documentação proposta, não automação implantada.
- Nenhuma API OpenAI, Anthropic ou Moonshot/Kimi foi chamada.
- Nenhum segredo, endpoint, model ID comercial, preço ou quota real foi presumido.

## 2. Evidências e estado consultado

### Repositório de colaboração
- `CENTRAL.md`: GPT-6 é o integrador; Claude é editorial; Kimi é auditoria técnica; nenhuma IA altera o projeto principal sem autorização do integrador.
- `INSTRUCTIONS.md`: análises devem citar arquivos/evidências; não inventar testes; aguardar validação.
- `MISSION_PLAN_002_100.md`: Fase D define 031 interface comum, 032 GPT, 033 Claude, 034 Kimi, 035 Automation AI, 036 registry, 037 capability matching, 038 fallback, 039 limites, 040 testes dos adapters.
- `contracts/v1/README.md` e schemas: contrato de missão/resultado v1.0.0 é proposta pendente de aprovação; não deve ser tratado como congelado.
- `reports/AUTOMATION_AI_MISSION_001_SPEC.md`: já prevê `capabilities`, `execute`, `get_status`, `cancel`, normalização e estimativa de custo no adaptador.

### Projeto principal
- Repositório: `vidift-max/tokensaver-ai`, branch `v2-saas-alpha`.
- `contracts/schemas/model-ref.json`: define uma referência simples de modelo com providers `anthropic`, `openai`, `google`, `kimi` e `mock`, e campo `model` obrigatório. Isso é um schema de referência, não prova existência de cliente API, registry, autenticação ou runtime de adapter.
- Busca de código por `agent adapter`, `provider registry` e `capability profile`: nenhum arquivo runtime correspondente foi localizado.
- O workflow e o manifesto consultados em missão anterior não fornecem evidência de runtime de orquestração.

### Interpretação
Os nomes de agentes e papéis são os definidos na central. Capacidades específicas abaixo são perfis propostos para o roteador, não afirmações sobre permissões técnicas ou disponibilidade de APIs. Todo agente/provedor fica desabilitado para invocação automática até integração e credenciais serem verificadas.

---

## 3. MISSÃO 031 — Interface comum Agent Adapter

### 3.1 Interface lógica

O contrato comum separa identidade/capacidade, execução, ciclo de vida, normalização e medição. É independente do SDK do fornecedor.

```text
AgentAdapter
  descriptor() -> AdapterDescriptor
  capabilities() -> CapabilityProfile
  healthCheck() -> AdapterHealth
  execute(ExecutionRequest) -> ExecutionReceipt
  getStatus(providerRunId) -> ProviderRunStatus
  cancel(providerRunId, reason) -> CancelReceipt
  normalizeResult(providerPayload) -> AgentResult
  estimateCost(UsageEstimateInput) -> CostEstimate
```

Todos os métodos que dependem de recurso não suportado devem retornar explicitamente `UNSUPPORTED`; não simular sucesso nem inventar provider request ID.

### 3.2 Envelope de entrada

Campos obrigatórios propostos:
- `contract_version`, `mission_id`, `revision`, `run_id`, `attempt`;
- `agent_id`, `provider_id`, `capability_profile_id`;
- `idempotency_key`, `correlation_id`, `trace_id`;
- `issued_at`, `deadline_at`, `timeout_ms`;
- `mission` validada e `input_bundle[]`;
- `required_output_schema`;
- `budget_reservation` (limites, moeda, tokens/custo);
- `cancellation_handle` opaco, sem credenciais;
- `trust_labels` para cada input e `policy_context` mínimo.

O adapter recebe somente o contexto necessário. Não recebe GitHub token, installation token, secret manager credential, webhook secret, nem grant de escrita do repositório.

### 3.3 Envelope de saída

`ExecutionReceipt` deve distinguir:
- `accepted`: fornecedor aceitou e devolveu ID de execução;
- `completed`: resposta final disponível;
- `rejected`: chamada não aceita;
- `unknown`: resultado ambíguo, por exemplo timeout após envio.

Campos: `adapter_id`, `provider_id`, `provider_run_id?`, `provider_request_id?`, `status`, `started_at`, `finished_at?`, `usage`, `cost`, `normalized_result?`, `error?`, `retry_advice`, `raw_response_digest?`.

Nunca gravar resposta bruta sensível por padrão. Persistir digest e payload sanitizado; retenção do raw payload exige política explícita.

### 3.4 Regras semânticas obrigatórias

1. **Sem side effects de domínio:** adapter só invoca o modelo/provedor. Não altera Issues, labels, branches, PRs, arquivos ou permissões.
2. **Idempotência:** propagar chave idempotente se o provider suportar. Se não suportar, declarar `idempotency_support: false`; timeout ambíguo não autoriza repetição cega.
3. **Deadline:** timeout local e deadline da missão são distintos. Nenhuma execução pode continuar publicando após deadline/revisão inválida.
4. **Cancelamento:** best effort; retornar `UNSUPPORTED` quando não suportado. O orquestrador ainda invalida o fencing token.
5. **Normalização:** converter saída para AgentResult v1 apenas depois de validar campos; conteúdo do modelo permanece não confiável.
6. **Erros:** mapear para envelope comum 009; preservar categoria, retryable, provider code sanitizado e correlation ID.
7. **Uso/custo:** separar provider-reported, estimated e unavailable; unknown não é zero.
8. **Versionamento:** descriptor declara versões de contrato aceitas; incompatibilidade bloqueia antes de chamada.
9. **Segurança:** credenciais ficam no adaptador/secret manager; nunca entram no prompt, resultado ou log.
10. **Observabilidade:** registrar duração, tentativa, request IDs, uso, custo e status sem registrar segredo ou prompt completo por padrão.

### 3.5 Contrato de concorrência

O orquestrador é dono do lease/fencing token. O adapter não adquire lease nem decide que a missão ainda está autorizada. Antes de persistir resultado, o orquestrador verifica mission revision, run ID, lease owner e fencing token atuais.

---

## 4. MISSÃO 032 — Adaptador GPT / OpenAI

**Papel no programa:** GPT-6 integrador e decisor técnico.  
**Provider lógico:** `openai`.  
**Modo inicial:** `manual_assisted`; execução API desabilitada até configuração e autorização.

### Contrato específico
- Entrada: ExecutionRequest comum + instruções de tarefa separadas de dados não confiáveis.
- Saída: AgentResult comum com summary, artifacts/evidence, tests, limitations e usage.
- Configuração: model ID explícito e aprovado, API base allowlisted, timeout, max output, limites de contexto e política de retenção.
- Identidade: `agent_id` vem do registro autenticado do adapter, nunca de texto do modelo.
- Aprovação: o adapter GPT pode produzir recomendação, mas não pode autoaprovar resultado, autorizar o próprio grant nem converter texto em aprovação formal.
- Ferramentas: nenhuma ferramenta de escrita GitHub é exposta ao modelo por este adapter. Tool calls, se um dia aprovadas, passam por policy engine separado.
- Custo: uso reportado pela API quando disponível; estimativa versionada quando não houver dado; caso contrário `unavailable`.

### Limitação
A conversa normal do ChatGPT não é presumida como endpoint de API invocável pelo orquestrador. A integração deve usar produto/API oficialmente suportado e configuração explícita. Nenhum endpoint ou model ID foi configurado ou testado nesta missão.

---

## 5. MISSÃO 033 — Adaptador Claude / Anthropic

**Papel:** análise e produção editorial, conforme CENTRAL.md.  
**Provider lógico:** `anthropic`.  
**Modo inicial:** `manual_assisted`; API desabilitada.

### Contrato específico
- Recebe objetivo editorial, audiência, formato, critérios e fontes autorizadas como dados.
- Retorna texto/artefatos, resumo, limitações, evidências citadas e estado de testes.
- Deve separar fatos fornecidos, inferências e lacunas; não inventar fonte nem citação.
- Não publica conteúdo, não altera o TokenSaver e não aprova o próprio trabalho.
- Model ID, região/base URL, limites de contexto/saída e pricing devem ser configurados por ambiente, nunca hardcoded.
- Rate limit, timeout, overloaded/unavailable e invalid request são normalizados para o envelope comum.

### Limitação
Nenhuma API Anthropic, credencial, SDK, model ID ou preço foi verificado nesta execução. Não se presume que a interface Claude usada por um colaborador seja automaticamente API acessível.

---

## 6. MISSÃO 034 — Adaptador Kimi / Moonshot

**Papel:** auditoria técnica e revisão independente, conforme CENTRAL.md.  
**Provider lógico:** `kimi` (mapeamento de provider externo a confirmar no registry de deployment).  
**Modo inicial:** `manual_assisted`; API desabilitada.

### Contrato específico
- Entrada inclui escopo, commit SHA, paths, critérios de auditoria, evidências e versão de contrato.
- Saída inclui findings com severity, arquivo/linha, evidência, impacto, recomendação, teste necessário e confidence.
- Deve distinguir `confirmed`, `suspected`, `not_tested` e `not_applicable`.
- Não altera o código, não fecha finding e não aprova implementação que auditou.
- Revisão independente deve evitar reutilizar como única evidência o relatório do autor; sempre que possível, inspecionar fonte/artefato primário.

### Limitação
O schema existente no projeto principal usa enum `kimi`, mas isso não confirma endpoint, SDK, identidade de conta, nome comercial do provider ou API. O mapeamento Moonshot/Kimi deve ser confirmado pelo owner antes da implementação. Nenhuma API ou credencial foi testada.

---

## 7. MISSÃO 035 — Adaptador Automation AI

**Papel:** integração, orquestração, automação GitHub e documentação técnica.  
**Provider lógico:** `openai` somente como associação de deployment futura; não é prova de API autônoma.  
**Modo inicial:** `manual_assisted`.

### Contrato específico
- Entradas: missão autorizada, contexto de repositório read-only ou colaboração write allowlisted, estado de workflow, critérios e limites.
- Saídas: plano de execução, mudanças documentais, manifests, evidências, recomendações e status honesto.
- Escrita em colaboração é uma capacidade separada, concedida ao serviço GitHub e não ao modelo.
- Operações no projeto principal, merge, release, deploy, secrets e configuração administrativa são negadas por padrão.
- A automação não pode se autoconceder permissões a partir de conteúdo de Issue ou prompt.
- A aprovação do GPT-6 precisa ser uma identidade/ação autenticada e auditável fora do texto do modelo.

### Limitação
A participação nesta conversa não cria um worker persistente, webhook ou adapter executável. Não há processo background contínuo nem credencial de GitHub exposta ao adapter por design.

---

## 8. MISSÃO 036 — Provider registry

### 8.1 Separação de conceitos

- **Provider:** fornecedor/serviço técnico (openai, anthropic, kimi, mock).
- **Agent:** papel/identidade lógica (gpt6-integrator, claude-editorial, kimi-auditor, automation-ai).
- **Model:** ID de modelo do fornecedor, configurado em deployment.
- **Adapter:** implementação que conecta contrato comum ao provider.
- **Capability profile:** conjunto versionado de tarefas e limites que o agente pode executar.
- **Deployment:** ambiente/região/endpoint e referência opaca de credencial.

Não misturar papel, provider e model name. O registry não armazena valores de segredo.

### 8.2 Campos do registro

`registry_version`, `agents[]`, `agent_id`, `display_name`, `role`, `provider_id`, `adapter_id`, `execution_mode`, `enabled`, `operational_status`, `capability_profile_ids[]`, `supported_contract_versions[]`, `limits_ref`, `deployment_ref`, `credential_ref` (opaque), `last_health_check`, `owner`, `reviewed_at`.

Regras:
- `enabled=false` por padrão.
- `credential_ref` é nome opaco do secret manager; nunca valor.
- `deployment_ref` aponta para configuração protegida.
- `model_id` é obrigatório apenas quando deployment API estiver habilitado.
- Alterações em provider, endpoint, capability, limite ou enablement exigem auditoria e aprovação.
- Registry é configuração de controle, não permissão; policy engine verifica grants independentes.

### 8.3 Artefato
O arquivo `contracts/adapters/v1/provider-registry.json` contém um catálogo inicial não operacional. Os quatro papéis estão em modo manual e desabilitados para invocação automática. Não inclui model IDs, endpoints ou secrets.

---

## 9. MISSÃO 037 — Capability matching

### 9.1 Requisitos da missão

A missão deve declarar `required_capabilities[]`, `required_output_schema`, `trust_level`, `risk_level`, `budget_ceiling`, `deadline`, `provider_allowlist[]`, `agent_allowlist[]` opcional e `human_review_required`.

Cada CapabilityProfile declara:
- capabilities com versão;
- input/output formats;
- supported contract versions;
- max input/output tokens e max duration;
- risk classes aceitas;
- data classification/trust boundary;
- supported tools (vazio por padrão);
- availability e execution mode.

### 9.2 Algoritmo determinístico inicial

**Hard filters (todos obrigatórios):**
1. agent enabled e operational_status = ready;
2. provider e adapter habilitados;
3. versão de contrato compatível;
4. todas as required capabilities satisfeitas;
5. risco e classificação de dados suportados;
6. limites de tokens, duração e custo suficientes;
7. allowlists da missão respeitadas;
8. policy engine autoriza agente e operação;
9. não existe conflito de papel (ex.: autor não revisa/aprova a própria entrega).

Se nenhum agente passar, estado `BLOCKED` com reason code `NO_COMPATIBLE_AGENT`; não relaxar filtros.

**Ranking apenas entre candidatos válidos:**
- especialização exata: 40%;
- qualidade/score medido para capability: 25%;
- custo estimado dentro do teto: 15%;
- latência histórica: 10%;
- disponibilidade/health: 10%.

Pesos são proposta e devem ser calibrados com telemetria. Sem dados históricos, o ranking usa apenas especialização e critérios explícitos, sem fabricar score. Tie-breaker determinístico: prioridade configurada e depois `agent_id` lexicográfico.

Não escolher pelo menor preço se isso violar qualidade, risco, confidencialidade ou revisão independente. Não inferir capabilities a partir de texto livre, nome do modelo ou resposta anterior.

### 9.3 Registro de decisão

Persistir candidatos, filtros aprovados/reprovados e reason codes, capability profile version, registry version, policy decision ID, custo/limites considerados e vencedor. Isso permite explicar por que um agente foi escolhido.

---

## 10. MISSÃO 038 — Fallback de provedor

Fallback é nova tentativa rastreada, nunca substituição silenciosa.

### Erros elegíveis
- rate limit / 429;
- indisponibilidade transitória / 5xx;
- conexão recusada antes do envio;
- falha transitória confirmada pelo provider;
- timeout somente se status da execução original puder ser reconciliado ou se duplicidade for explicitamente segura.

### Não elegíveis por padrão
- autorização negada;
- schema/contrato inválido;
- input proibido ou risco de prompt injection;
- orçamento excedido;
- incompatibilidade de capability;
- falha permanente de conteúdo;
- timeout ambíguo sem status/reconciliação.

### Regras
1. Alternativa deve constar em fallback policy aprovada e passar novamente pelos hard filters.
2. Preservar mission_id/revision e criar novo attempt/run; registrar predecessor e motivo.
3. Reservar orçamento adicional antes da chamada; respeitar teto global e teto por provider.
4. Não fazer downgrade de confidencialidade, segurança, qualidade mínima ou requisito de auditoria.
5. Não usar o agente autor como auditor independente nem permitir self-approval.
6. Respeitar cooldown e retry-after quando fornecidos.
7. Máximo de fallbacks configurável; proposta inicial: um fallback por falha de provider, além do retry no mesmo provider apenas quando seguro.
8. Se nenhum fallback válido existir, `BLOCKED` ou `FAILED` com reason code; nunca mascarar falha como sucesso.
9. Resultado parcial do provider original é preservado como tentativa, não descartado.

### Timeout ambíguo
Se a requisição pode ter sido processada, primeiro chamar getStatus por provider_run_id/request_id. Se status não for suportado, marcar `UNKNOWN_OUTCOME` e exigir reconciliação/decisão; não disparar fallback que duplique custo/efeito sem autorização explícita.

---

## 11. MISSÃO 039 — Limites por provedor

### Camadas de quota

1. **Global:** teto de gasto, tokens e chamadas por janela.
2. **Provider:** requests/minute, tokens/minute, concorrência, custo diário/mensal.
3. **Model/deployment:** contexto máximo, saída máxima, timeout e preço vigente.
4. **Agent:** concorrência, tipos de missão e orçamento alocado.
5. **Mission/run:** custo máximo, tokens de entrada/saída, tentativas e deadline.

### Campos normalizados
- `max_requests_per_minute`;
- `max_tokens_per_minute`;
- `max_concurrent_runs`;
- `max_input_tokens`, `max_output_tokens`;
- `timeout_ms`, `max_attempts`;
- `max_cost_per_run`, `max_cost_per_day`, `max_cost_per_month`;
- `price_table_version`, `effective_from`, `currency`;
- `usage_measurement_mode` = provider_reported | estimated | unavailable.

Valores devem vir de configuração aprovada e documentação/preço vigente de cada provider. Não preencher números arbitrários como se fossem limites reais.

### Reserva e liquidação
1. Estimar antes da chamada; se estimativa indisponível, aplicar política conservadora ou bloquear.
2. Reservar orçamento atomicamente no ledger.
3. Rejeitar se reserva exceder qualquer teto.
4. Após resposta, liquidar com usage provider-reported; registrar estimate variance.
5. Se custo final exceder teto por comportamento do provider, bloquear novas chamadas, registrar incidente e exigir revisão.
6. Retries/fallback consomem orçamento separado.
7. Não aumentar quota automaticamente.
8. Custos desconhecidos são `null/unavailable`, nunca zero.

### Rate limit
Respeitar Retry-After e reset headers quando disponíveis; aplicar token bucket/leaky bucket no orquestrador; jitter para retry; circuit breaker por provider/deployment; não permitir que vários workers contornem quota compartilhada.

### Preços
Nenhuma tabela de preço foi preenchida nesta missão. Pricing é mutável por modelo/região/modalidade; manter arquivo versionado com fonte, data de verificação e effective_from antes de habilitar cobrança estimada.

---

## 12. MISSÃO 040 — Testes dos adapters com mocks

### 12.1 Estratégia

Criar uma suíte de contrato compartilhada que roda contra:
- MockAdapter determinístico;
- cada adapter real em sandbox, somente depois de aprovação e credenciais de teste;
- testes de integração reais como etapa separada, sem confundir mocks com prova de API.

O mock deve simular resultados, IDs, usage e erros; não alegar compatibilidade real com o provider.

### 12.2 Matriz de testes

| ID | Cenário | Resultado esperado |
|---|---|---|
| AD-001 | capabilities() | Descriptor válido e versão compatível |
| AD-002 | execute válido | Receipt aceito e normalização para AgentResult |
| AD-003 | schema de entrada inválido | Rejeição antes da chamada |
| AD-004 | provider retorna resposta válida | Campos normalizados e evidências preservadas |
| AD-005 | resposta malformada | Erro de validação, sem sucesso implícito |
| AD-006 | timeout antes do envio | Falha transitória segura conforme classificação |
| AD-007 | timeout após envio | UNKNOWN_OUTCOME; sem retry cego |
| AD-008 | HTTP 429 / rate limit simulado | Retry-After respeitado; quota não excedida |
| AD-009 | HTTP 5xx transitório | Retry limitado e backoff com jitter |
| AD-010 | 4xx permanente/authorization | Sem retry automático |
| AD-011 | cancelamento suportado | CancelReceipt coerente e estado reconciliado |
| AD-012 | cancelamento não suportado | UNSUPPORTED explícito; lease invalidado pelo orquestrador |
| AD-013 | custo provider-reported | Uso/custo persistido e ledger liquidado |
| AD-014 | custo indisponível | measurement=unavailable; nunca zero inventado |
| AD-015 | teto de custo excedido | Chamada negada antes de execução ou bloqueio após reconciliação |
| AD-016 | capability inexistente | NO_COMPATIBLE_AGENT; nenhum adapter chamado |
| AD-017 | adapter desabilitado | Policy deny antes da chamada |
| AD-018 | registry/provider version incompatível | Falha fechada |
| AD-019 | chave idempotente repetida | Um único efeito lógico; duplicata retorna estado existente |
| AD-020 | duas execuções concorrentes | Limite de concorrência respeitado |
| AD-021 | lease/fencing obsoleto | Resultado antigo rejeitado pelo orquestrador |
| AD-022 | output contém instrução de ferramenta | Tratado como dado não confiável; nenhuma tool executada |
| AD-023 | output contém segredo sintético | Redaction/detector bloqueia publicação e gera finding |
| AD-024 | resposta excede limite de tamanho/tokens | Rejeição/truncamento controlado e reportado |
| AD-025 | fallback após 429 elegível | Novo attempt/run com lineage e orçamento reservado |
| AD-026 | fallback após autorização negada | Proibido |
| AD-027 | fallback após timeout ambíguo | Proibido até reconciliação |
| AD-028 | self-review/self-approval | Política rejeita conflito de função |
| AD-029 | cancelamento concorrente com conclusão | Uma transição final válida; sem dupla publicação |
| AD-030 | reinício do worker mock | Estado recuperado por ledger; sem execução duplicada |
| AD-031 | erro do adapter sem provider code | Código normalizado e correlação mantida |
| AD-032 | prompt/input injection no bundle | Conteúdo isolado como untrusted data |
| AD-033 | credencial ausente/expirada | Falha de configuração/autorização, sem log do segredo |
| AD-034 | provider indisponível no health check | Não selecionado para nova missão |
| AD-035 | contrato de resultado desconhecido | Bloqueio por versão não suportada |

### 12.3 Testes de contrato para cada provider

Para OpenAI, Anthropic e Kimi, executar exatamente a mesma suíte contra um adapter de teste; apenas mapeamentos específicos podem variar. MockAdapter precisa suportar cenários determinísticos por fixture e relógio controlado, sem chamadas de rede.

### 12.4 Critério de aprovação

- 100% dos testes de contrato e segurança críticos passam.
- Nenhuma execução duplica efeitos lógicos sob replay/restart.
- Nenhuma credencial aparece em logs/artefatos.
- Todas as falhas são classificadas e correlacionadas.
- Nenhum fallback viola capability, budget ou independência.
- Nenhuma resposta do modelo altera permissões ou aprova a própria entrega.
- Integração real permanece desabilitada até revisão GPT-6 + owner.

**Execução nesta missão:** nenhum teste de software foi executado. A matriz acima é plano de teste, não resultado de execução.

---

## 13. Artefatos produzidos

- `reports/AUTOMATION_AI_MISSIONS_031_040_AGENT_ADAPTERS.md` — especificação completa e registro.
- `contracts/adapters/v1/provider-registry.json` — registry inicial manual-only/desabilitado.
- `contracts/adapters/v1/README.md` — regras de evolução e ativação do registry.

Não foram alterados schemas canônicos `contracts/v1/` nem o projeto principal. A referência existente `contracts/schemas/model-ref.json` foi apenas consultada.

## 14. Registro por missão

| Missão | Entrega | Status |
|---|---|---|
| 031 | Interface comum, envelopes, ciclo de vida e invariantes | CONCLUÍDA — ESPECIFICAÇÃO |
| 032 | Contrato GPT/OpenAI, limites e modo manual inicial | CONCLUÍDA — ESPECIFICAÇÃO |
| 033 | Contrato Claude/Anthropic e limites | CONCLUÍDA — ESPECIFICAÇÃO |
| 034 | Contrato Kimi/Moonshot e revisão independente | CONCLUÍDA — ESPECIFICAÇÃO |
| 035 | Contrato Automation AI e separação de permissões | CONCLUÍDA — ESPECIFICAÇÃO |
| 036 | Modelo de registry e catálogo inicial | CONCLUÍDA — ARTEFATO CONFIGURACIONAL NÃO OPERACIONAL |
| 037 | Algoritmo determinístico de capability matching | CONCLUÍDA — ESPECIFICAÇÃO |
| 038 | Fallback, retries e timeout ambíguo | CONCLUÍDA — ESPECIFICAÇÃO |
| 039 | Quotas, budget reservation e ledger | CONCLUÍDA — ESPECIFICAÇÃO |
| 040 | Suíte mock e 35 cenários de contrato/falha/segurança | CONCLUÍDA — PLANO; TESTES NÃO EXECUTADOS |

## 15. Testes realmente executados e limitações

**Executado:**
- Leitura de CENTRAL.md, INSTRUCTIONS.md, MISSION_PLAN_002_100.md, relatórios 001/003/004/009/010/021–030 e schemas relevantes.
- Consulta do schema `contracts/schemas/model-ref.json` no TokenSaver principal.
- Busca por adapter, registry e capability profile no projeto principal; nenhum runtime correspondente foi localizado.
- Busca de relatórios específicos 031–040 no repositório de colaboração; nenhum relatório prévio foi encontrado.

**Não executado:**
- Build, lint, unit test, contract test ou CI.
- JSON Schema validator para novos contratos (nenhum schema runtime foi introduzido).
- MockAdapter executável.
- Chamadas OpenAI, Anthropic ou Kimi.
- Testes de autenticação, quotas reais, billing, cancelamento ou provider status.
- Benchmark de qualidade, latência ou custo.

**Limitações:**
- API e nome de deployment/model de cada provedor devem ser confirmados pelo owner.
- Preços e limites variam por modelo, região e modalidade; não foram inventados.
- O runtime das Missões 011–020 ainda é pré-requisito para testes integrados reais.
- A aprovação do contrato 003–010 permanece pendente no registro.
- Nenhuma alteração no TokenSaver principal foi autorizada ou realizada.

## RECOMENDAÇÃO AO GPT-6

1. Revisar a interface 031 e congelar o contrato de adapter apenas depois de resolver a aprovação de 003–010.
2. Aprovar os papéis/capabilities e o registry manual-only; confirmar com cada owner qual provider/API e model deployment estão realmente disponíveis.
3. Desbloquear e implementar o runtime 011–020 no repositório de colaboração antes de transformar os adapters em workers executáveis.
4. Implementar primeiro MockAdapter determinístico e executar AD-001–AD-035 em CI, incluindo restart, replay, timeout ambíguo, orçamento e fencing.
5. Só depois integrar um provider real por vez, inicialmente em sandbox e sem ferramentas de escrita.
6. Manter todos os providers desabilitados por padrão; sem fallback automático para aprovação, auditoria independente ou tarefas com dados acima da classificação permitida.

**Estado final:** Fase D documentada e registrada para revisão. Nenhum adapter real ativado. AGUARDANDO VALIDAÇÃO DO GPT-6 INTEGRADOR.
