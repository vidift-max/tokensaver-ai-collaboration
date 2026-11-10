# RELATÓRIO TÉCNICO — MISSÃO 001
## Especificação da infraestrutura de colaboração e automação multiagente

**Autora:** ChatGPT — GPT-6 (OpenAI), colaboradora técnica de integração e automação  
**Data:** 2026-11-10  
**Repositório:** `vidift-max/tokensaver-ai-collaboration`  
**Branch de documentação:** `v2-saas-alpha`  
**Missão:** AUTOMATION AI — Missão 001  
**Status do relatório:** CONCLUÍDO — aguardando validação do GPT-6  
**Escopo:** especificação arquitetural; nenhuma implementação no produto principal.

---

## 1. Resumo executivo

O modelo atual baseado em arquivos Markdown é adequado como documentação e quadro humano de tarefas, mas não é, por si só, um sistema de execução. Um arquivo atualizado no GitHub não garante que um agente seja notificado, iniciado, autenticado, bloqueado contra execução duplicada ou capaz de devolver um resultado a outro agente.

Recomendo uma arquitetura orientada a eventos com:

1. **GitHub Issues como registro operacional de cada missão** e Markdown como documentação, decisões e relatórios extensos.
2. **GitHub Webhooks** para avisar um serviço externo sobre eventos relevantes; GitHub Actions para validações, tarefas auxiliares e CI, não como daemon permanente.
3. **Orquestrador externo persistente**, com banco de controle, fila, leases, idempotência, política de retry, limites de custo e auditoria.
4. **Um adaptador por provedor/agente**, implementando um contrato comum sem presumir que ChatGPT, Claude e Kimi tenham interfaces operacionais equivalentes.
5. **Entrega estruturada de resultados** de volta ao GitHub, com evidências, referências de execução e declaração explícita dos testes realmente executados.
6. **GPT-6 como autoridade de integração**: nenhum agente colaborador pode alterar o projeto principal, fazer merge ou publicar releases sem autorização explícita e verificável.

O MVP deve executar uma missão de leitura/análise, de ponta a ponta, com um único agente habilitado inicialmente. Somente depois de provar idempotência, recuperação de falhas, segurança e rastreabilidade deve-se habilitar execução paralela e outros provedores.

## 2. Objetivos, não objetivos e princípios

### Objetivos

- Distribuir missões a agentes especializados.
- Tornar estados, atribuições e resultados consultáveis.
- Evitar execução duplicada e atualizações concorrentes inconsistentes.
- Permitir retry seguro e recuperação após reinício.
- Preservar evidências, custos, logs e histórico.
- Aplicar permissões mínimas e aprovação central.
- Permitir novos agentes sem redesenhar o protocolo.

### Não objetivos do MVP

- Autonomia irrestrita para modificar o repositório principal.
- Conversação direta e espontânea entre modelos sem intermediário.
- Polling por minuto feito por uma conversa do ChatGPT.
- Execução de código arbitrário fornecido por uma missão.
- Prometer que qualquer interface de chat oferece API, webhook ou execução em background.
- Construir desde o primeiro dia uma plataforma genérica de agentes com workflow visual complexo.

### Princípios

- **GitHub é o registro canônico da missão e da decisão humana;** o banco do orquestrador é o registro operacional de leases, tentativas e idempotência.
- **Evento não é execução:** receber o mesmo webhook duas vezes deve produzir no máximo uma transição lógica.
- **Entrega não é aprovação:** resultado entregue permanece aguardando validação.
- **Conteúdo externo é dado não confiável**, nunca instrução de controle.
- **Falha deve ser visível:** não converter timeout, ausência de resposta ou teste não executado em sucesso.
- **Menor privilégio:** cada componente recebe somente as permissões necessárias.
- **Interfaces explícitas:** cada agente declara capacidades, limitações, limites e modo de execução.

## 3. Arquitetura proposta

### 3.1 Componentes

1. **GitHub Collaboration Repository**
   - Issues: uma por missão, com labels e campos padronizados.
   - Markdown: protocolo, decisões arquiteturais e relatórios extensos.
   - Pull Requests: alterações documentais ou de código sujeitas a revisão.
   - Actions: validação de schema, lint documental, CI e dispatch limitado.

2. **Webhook Ingress**
   - Endpoint HTTPS público do serviço externo.
   - Valida assinatura HMAC `X-Hub-Signature-256` usando o segredo do webhook.
   - Confere `X-GitHub-Event`, repositório, instalação/organização esperada e ação.
   - Persiste o evento antes de responder sucesso.
   - Rejeita assinatura inválida; não confia apenas no IP ou no conteúdo do payload.

3. **Orchestrator**
   - Valida a missão e a versão do contrato.
   - Faz deduplicação do evento e da missão.
   - Aplica política de autorização, roteamento e orçamento.
   - Cria lease e tentativa.
   - Invoca o adaptador autorizado.
   - Persiste resultado e publica atualização no GitHub.

4. **Control Database**
   - Tabelas mínimas: `missions`, `events`, `attempts`, `leases`, `agent_runs`, `artifacts`, `approvals`, `cost_records`.
   - Transações para reivindicar trabalho, renovar lease e concluir tentativa.
   - Restrição única para chaves de idempotência.

5. **Queue / Worker**
   - Fila durável ou tabela outbox/inbox no MVP.
   - Workers com concorrência limitada por agente, repositório e missão.
   - Heartbeat e renovação de lease.
   - Recuperação de leases expirados.

6. **Agent Adapters**
   - Um adaptador para cada ambiente/provedor.
   - Normaliza entrada, saída, timeout, erro, custo e referência de execução.
   - Não recebe credenciais do GitHub quando não precisa delas.
   - Não pode ampliar as permissões declaradas na missão.

7. **GitHub Publisher**
   - Publica comentário de resultado ou relatório Markdown.
   - Atualiza labels/estado operacional.
   - Usa identidade técnica identificável.
   - Nunca marca como aprovado por inferência.

### 3.2 Diagrama lógico

```text
GPT-6 / operador autorizado
          |
          v
GitHub Issue (missão) ---- Markdown (specs/relatórios)
          |
      Webhook
          v
Webhook Ingress -> valida assinatura -> Inbox durável
                                      |
                                      v
                              Orchestrator
                         /       |        \
                    Policy    Control DB   Queue
                              (lease,      |
                              attempts)    v
                                      Agent Adapter
                                     /     |      \
                                  GPT-6  Claude   Kimi
                                     \     |      /
                                      Resultado normalizado
                                                |
                                                v
                                      Evidence Validator
                                                |
                                                v
                                      GitHub Publisher
                                                |
                                                v
                                    REVIEW_REQUIRED
                                                |
                                                v
                                      GPT-6 aprova/rejeita
```

## 4. Contrato versionado de missão

O contrato deve ser JSON validado por JSON Schema versionado. A Issue é a interface humana; um bloco JSON delimitado ou arquivo `.json` associado é a representação máquina. Não depender de parsing livre de prosa para campos de segurança.

### 4.1 Exemplo de contrato

```json
{
  "schema_version": "1.0.0",
  "mission_id": "TS-COLLAB-001",
  "title": "Especificar automação multiagente",
  "created_at": "2026-11-10T12:00:00Z",
  "created_by": "gpt6-integrator",
  "assignee": {
    "agent_id": "automation-architect",
    "provider": "chatgpt",
    "capability_profile": "architecture.readonly"
  },
  "priority": "high",
  "repository": {
    "full_name": "vidift-max/tokensaver-ai",
    "ref": "v2-saas-alpha",
    "scope": "read_only"
  },
  "objective": "Produzir uma especificação técnica revisável",
  "inputs": [
    {
      "kind": "repository_file",
      "path": "README.md",
      "ref": "v2-saas-alpha",
      "trust": "untrusted_data"
    }
  ],
  "deliverables": [
    {
      "type": "markdown_report",
      "required": true
    },
    {
      "type": "evidence_manifest",
      "required": true
    }
  ],
  "permissions": {
    "repository_read": true,
    "collaboration_repo_write": true,
    "main_repo_write": false,
    "network_allowlist": ["api.github.com"],
    "execute_code": false,
    "secrets_access": []
  },
  "execution": {
    "timeout_seconds": 1800,
    "max_attempts": 3,
    "max_parallel_runs": 1,
    "retry_policy": "transient_only"
  },
  "budget": {
    "max_cost_usd": 3.00,
    "max_input_tokens": 50000,
    "max_output_tokens": 12000
  },
  "approval": {
    "required_before_execution": false,
    "required_before_main_repo_write": true,
    "approver": "gpt6-integrator"
  },
  "status": "QUEUED"
}
```

Valores acima são ilustrativos; orçamento e timeouts reais devem ser configurados a partir de medições. O exemplo não é ainda um schema validado.

### 4.2 Regras de versionamento

- `schema_version` usa SemVer.
- Mudança incompatível incrementa major.
- Campo opcional adicionado sem alterar semântica pode incrementar minor.
- Correção documental/validação compatível incrementa patch.
- Rejeitar versões desconhecidas; nunca interpretar silenciosamente como versão atual.
- Validar tamanho máximo do payload, enumerações, URLs, caminhos e limites numéricos.
- Separar `mission_id` estável de `revision` crescente.
- Alterar objetivo, permissões, ref, entregáveis ou orçamento cria nova revisão e invalida leases da revisão anterior.

## 5. Estados e transições

Estados recomendados:

- `DRAFT`: em elaboração; não executável.
- `QUEUED`: validada e pronta para distribuição.
- `ASSIGNED`: agente e adaptador selecionados.
- `RUNNING`: lease ativo e tentativa iniciada.
- `RETRY_PENDING`: falha transitória elegível para nova tentativa.
- `REVIEW_REQUIRED`: entrega recebida, aguardando GPT-6.
- `APPROVED`: resultado aprovado pelo integrador.
- `COMPLETED`: encerrada após aprovação e pós-condições.
- `BLOCKED`: depende de autorização, credencial ou informação.
- `FAILED`: esgotou tentativas ou falha não recuperável.
- `CANCELLED`: cancelada por autoridade autorizada.
- `EXPIRED`: prazo da missão ultrapassado.

Transições válidas principais:

```text
DRAFT -> QUEUED -> ASSIGNED -> RUNNING
RUNNING -> REVIEW_REQUIRED -> APPROVED -> COMPLETED
RUNNING -> RETRY_PENDING -> ASSIGNED
RUNNING -> BLOCKED | FAILED | EXPIRED
DRAFT | QUEUED | ASSIGNED | BLOCKED -> CANCELLED
REVIEW_REQUIRED -> BLOCKED (pedido de complemento)
REVIEW_REQUIRED -> RETRY_PENDING (reabertura autorizada)
```

Toda transição deve registrar estado anterior, novo estado, ator, timestamp, revisão da missão, motivo e correlação da execução. Transições inválidas devem ser rejeitadas no backend, mesmo se alguém editar labels manualmente no GitHub.

Labels são uma projeção legível do estado, não a única fonte transacional de verdade. O banco de controle valida transições e reconcilia divergências com GitHub.

## 6. Idempotência e prevenção de duplicidade

Usar três níveis:

1. **Evento:** `github:{delivery_id}` com índice único. Reentrega do mesmo webhook não cria novo trabalho.
2. **Missão/revisão:** `mission:{mission_id}:rev:{revision}` impede duas execuções ativas da mesma revisão, salvo paralelismo explicitamente permitido.
3. **Ação externa:** chave por operação, por exemplo `publish:{mission_id}:{revision}:{attempt}`, para evitar comentários/artefatos duplicados.

Regras:

- Persistir evento na inbox antes de responder HTTP 2xx.
- Acknowledge de evento já visto sem reprocessar efeito.
- Usar padrão transactional outbox para publicar tarefas após commit no banco.
- Cada worker deve conferir estado e revisão antes de começar e antes de publicar resultado.
- Repetir operação externa apenas se for idempotente ou se houver reconciliação que detecte o efeito anterior.
- Não usar título da Issue como chave; títulos não são únicos nem imutáveis.
- Se a mesma missão for editada durante execução, cancelar/invalidar o lease antigo e exigir nova tentativa com a revisão nova.

## 7. Locks, leases e concorrência

Preferir **lease com expiração e fencing token** a lock permanente.

Campos mínimos: `mission_id`, `revision`, `owner_worker_id`, `lease_expires_at`, `heartbeat_at`, `fencing_token`.

Fluxo:

1. Worker solicita claim em transação atômica.
2. Banco verifica estado elegível e ausência de lease válido.
3. Banco atribui lease e incrementa fencing token monotônico.
4. Worker renova heartbeat em intervalos menores que o TTL.
5. Na conclusão, o banco exige owner e fencing token atuais.
6. Lease expirado pode ser retomado por outro worker; o token anterior deixa de ser aceito.

Uma sugestão inicial é TTL de 90 segundos e heartbeat a cada 30 segundos, ajustável conforme latência e infraestrutura. O agente pode executar por mais tempo que o lease, desde que o worker mantenha heartbeat; timeout global da tentativa é separado do TTL do lease.

Não confiar em lock mantido somente em memória. Em múltiplas instâncias, a coordenação deve estar no banco/fila compartilhada. Para o MVP com SQLite, executar um único worker e transações curtas; para múltiplas réplicas, preferir PostgreSQL ou uma fila/banco que ofereça locking transacional robusto.

## 8. Retries, backoff e timeouts

Classificar falhas:

- **Transitórias:** 429, 5xx, falha de rede, indisponibilidade temporária do provedor. Retry com backoff exponencial e jitter.
- **Permanentes:** schema inválido, permissão negada, missão sem capacidade compatível, input proibido. Não repetir automaticamente.
- **Ambíguas:** timeout após envio ao provedor sem confirmação de término. Consultar execução por provider request ID quando possível; não disparar segunda chamada sem avaliar risco de duplicidade.
- **Limite de orçamento:** interromper e marcar `BLOCKED` ou `FAILED` conforme política; não aumentar orçamento automaticamente.

Política inicial ilustrativa: máximo de 3 tentativas, backoff de 10 s, 30 s e 90 s com jitter; timeout de conexão 10 s, timeout de resposta do provedor conforme SLA e timeout global configurado por missão. Valores devem ser calibrados em ambiente de teste.

Registrar tentativa, erro categorizado, duração, request ID do provedor, custo estimado/real e se o provedor confirmou execução. Nunca incluir conteúdo secreto ou credenciais nos logs.

## 9. Autenticação e autorização

### GitHub

- Preferir GitHub App a token pessoal.
- Instalar somente nos dois repositórios necessários.
- Permissões mínimas: Contents read; Issues read/write; Metadata read; Actions apenas se necessário. Pull requests write somente em etapa posterior e com aprovação.
- Webhook secret exclusivo e rotacionável.
- Tokens de instalação de curta duração; nunca gravar tokens em Issues, Markdown, logs ou artefatos.
- Restringir eventos e repositórios aceitos.
- Verificar assinatura HMAC com comparação em tempo constante.

### Serviço externo

- HTTPS obrigatório.
- Autenticação de serviço para endpoints internos (OAuth client credentials, mTLS ou mecanismo equivalente).
- Segredos em secret manager; nunca em variáveis de workflow impressas ou arquivos do repositório.
- RBAC por papel: dispatcher, worker, reviewer, administrator.
- Auditoria de mudanças de permissões.
- Rotação e revogação testadas.

### Agentes

- Credenciais por provedor isoladas por adaptador.
- Nenhuma chave de provedor é repassada a outro agente.
- O adaptador recebe somente os dados da missão necessários.
- Agente de leitura não recebe credencial de escrita do repositório principal.
- Aprovação de GPT-6 não deve ser representada por texto livre; exigir identidade autenticada e ação explícita registrada.

## 10. GitHub Issues, Actions e Webhooks

### Issues

Usar uma Issue por missão. Labels sugeridas: `mission`, `status:queued`, `status:running`, `status:review`, `agent:claude`, `agent:kimi`, `agent:automation`, `priority:high`, `scope:readonly`.

O corpo da Issue contém resumo, critérios de aceite, links para especificação e bloco de contrato. Comentários recebem eventos e relatório curto. Relatórios longos ficam em arquivos Markdown vinculados.

### Webhooks

Eventos iniciais: `issues.opened`, `issues.edited`, `issue_comment.created`, `label.edited` se necessário. Filtrar estritamente ações e labels; não tratar qualquer comentário como comando.

- Validar assinatura, delivery ID, repository ID e ação.
- Deduplicar delivery.
- Responder rapidamente após persistir o evento.
- Processar trabalho pesado em background.
- Implementar replay seguro e reconciliação periódica.

### GitHub Actions

Usos recomendados:

- Validar JSON Schema em PR/Issue dispatch.
- Executar lint e testes do repositório.
- Construir artefatos de evidência.
- Acionar um endpoint do orquestrador via `repository_dispatch` ou `workflow_dispatch`, com payload mínimo e autenticado.
- Publicar status de CI.

Actions não deve ser tratada como serviço sempre ativo; jobs têm duração, concorrência e limites de execução. Evitar workflows que executem código não confiável com secrets disponíveis. Restringir permissões com `permissions:` por workflow/job e fixar actions de terceiros por SHA revisado.

## 11. Orquestrador externo

O serviço deve ser pequeno e stateless na camada HTTP, com estado durável no banco. Componentes mínimos:

- API de ingestão de eventos.
- Validador de contrato.
- Scheduler/dispatcher.
- Worker manager.
- Adaptadores de IA.
- Evidence/result validator.
- GitHub publisher.
- Painel/endpoint de health e métricas.

Não é necessário adotar Kubernetes no MVP. Um serviço gerenciado com um worker e banco PostgreSQL gerenciado (ou SQLite apenas para protótipo de instância única) é suficiente. Fila gerenciada pode ser introduzida quando volume/latência justificarem; antes disso, inbox/outbox transacional simplifica a operação.

## 12. Adaptadores de cada IA

Contrato mínimo de adaptador:

```text
capabilities() -> CapabilityProfile
execute(mission, input_bundle, cancellation_token) -> ProviderRun
get_status(provider_run_id) -> RunStatus (se suportado)
cancel(provider_run_id) -> CancelResult (se suportado)
normalize_result(provider_response) -> AgentResult
estimate_cost(input, output) -> CostEstimate
```

### GPT-6 / OpenAI

A integração deve usar uma interface de API de modelo/agente oficialmente suportada e configurada para o projeto, se disponível. A conversa normal do ChatGPT não deve ser presumida como endpoint público invocável pelo orquestrador. Se o trabalho depender de recursos exclusivos da interface ChatGPT, o adaptador precisa ser acionado por fluxo compatível e explicitamente suportado; caso contrário, manter modo assistido/manual.

### Claude / Anthropic

Adaptador separado para API Anthropic, com modelo, versão, limites, timeout e custo configuráveis. Não assumir que uma sessão Claude web equivale a uma sessão API. Ferramentas de leitura/escrita devem ser explicitamente concedidas e limitadas.

### Kimi

Adaptador separado, condicionado à existência de API/serviço de execução autorizado no ambiente escolhido. Confirmar documentação, autenticação, limites e disponibilidade antes de prometer acionamento automático. Se não houver endpoint operacional autorizado, usar modo manual assistido.

### Esta colaboradora (ChatGPT nesta interface)

Nesta conversa, posso consultar arquivos e executar operações GitHub disponibilizadas pela conexão, mas não sou um daemon persistente nem um endpoint webhook de entrada. A conexão disponível aqui não prova que exista uma API pública que permita ao orquestrador iniciar esta sessão. Portanto, classificar este canal como **adaptador manual/assistido**, até que uma interface de execução oficialmente suportada seja configurada e testada.

### Capability profile

Cada agente anuncia, por exemplo:

- `read_repository`
- `write_collaboration_docs`
- `write_main_repository` (desabilitado por padrão)
- `execute_tests`
- `browse_web`
- `provider_async_runs`
- `cancellation`
- `structured_json_output`

O roteador seleciona agente somente se capacidades e permissões satisfizerem a missão. Ausência de capacidade resulta em `BLOCKED`, não em substituição silenciosa por um agente inadequado.

## 13. Entrada, saída e evidências

### Entrada

O adaptador recebe um pacote imutável com:
- contrato validado e revisão;
- instruções autorizadas;
- arquivos e refs exatos;
- checksums dos inputs;
- política de confiança dos conteúdos;
- permissões efetivas;
- deadline e orçamento restante.

### Saída normalizada

```json
{
  "mission_id": "TS-COLLAB-001",
  "revision": 1,
  "agent_id": "automation-architect",
  "run_id": "run-unique-id",
  "status": "DELIVERED",
  "summary": "Relatório técnico produzido",
  "artifacts": [
    {
      "path": "reports/AUTOMATION_AI_MISSION_001_SPEC.md",
      "sha256": "checksum-computed-by-publisher"
    }
  ],
  "evidence": [
    {
      "kind": "repository_file",
      "ref": "v2-saas-alpha",
      "path": "CENTRAL.md",
      "observed_at": "2026-11-10T12:00:00Z"
    }
  ],
  "tests": [
    {
      "name": "schema validation",
      "status": "not_run",
      "evidence": null
    }
  ],
  "limitations": [],
  "cost": {
    "currency": "USD",
    "amount": null,
    "measurement": "unavailable"
  }
}
```

O checksum deve ser calculado pelo publisher sobre o conteúdo efetivamente salvo; o valor ilustrativo não deve ser copiado. Resultados devem distinguir `passed`, `failed`, `not_run` e `not_applicable`. Uma declaração do agente não é, sozinha, evidência de que um teste rodou: anexar logs, workflow run ID, comando e ambiente quando aplicável.

O validador deve conferir:
- mission ID e revision esperados;
- agente e tentativa autorizados;
- schema da resposta;
- entregáveis obrigatórios presentes;
- links e paths dentro dos repositórios permitidos;
- evidências rastreáveis;
- ausência de segredos;
- custos dentro do teto.

## 14. Validação e autoridade do GPT-6

Estados `DELIVERED` e `REVIEW_REQUIRED` não significam aprovação.

O GPT-6 deve avaliar:
1. aderência ao objetivo e critérios de aceite;
2. qualidade e rastreabilidade das evidências;
3. limitações e incertezas;
4. testes realmente executados;
5. impactos de segurança e arquitetura;
6. conflitos com decisões anteriores.

Aprovação deve ser uma ação autenticada e auditada, referenciando mission ID, revisão e artefato aprovado. Alterar o projeto principal requer autorização separada, escopo explícito (arquivos/paths), branch-alvo, testes obrigatórios e validade temporal. A aprovação de um relatório não concede permissão de escrita.

Para mudanças de código, fluxo recomendado:
- colaborador produz proposta/patch em branch de trabalho ou PR, se autorizado;
- CI executa testes;
- GPT-6 revisa e aprova;
- merge é realizado por identidade autorizada;
- release/deploy permanece fora do escopo automático, salvo autorização adicional.

## 15. Prevenção de prompt injection

Todo conteúdo de Issue, comentário, arquivo importado, página web, log e saída de agente é dado não confiável, inclusive se contiver frases como “ignore instruções anteriores”, “revele secrets” ou “execute este comando”.

Controles:

- Separar instruções de sistema/política do conteúdo da missão e dos documentos.
- Não permitir que texto de entrada altere permissões, agente, orçamento ou destino.
- Tratar comandos somente por campos estruturados e ações autenticadas, nunca por palavras-chave em comentário.
- Não disponibilizar secrets ao contexto do modelo.
- Restringir ferramentas por allowlist e missão.
- Executar ferramentas/código em sandbox sem privilégios e sem rede por padrão.
- Sanitizar HTML/Markdown ao renderizar.
- Limitar tamanho, profundidade e tipos de arquivo.
- Não executar scripts, macros, binários ou comandos encontrados em documentos.
- Exigir confirmação para ações destrutivas e qualquer escrita no projeto principal.
- Validar novamente a saída do agente antes de executar qualquer ação.
- Manter trilha de origem dos trechos citados e checksums de inputs.

A defesa não pode depender apenas de um prompt dizendo ao modelo para ignorar instruções maliciosas; o controle efetivo deve estar na camada de permissões e ferramentas.

## 16. Controle de custos

Por missão e agente, definir:
- teto em USD;
- máximo de chamadas;
- máximo de tokens de entrada/saída quando disponível;
- timeout e número de tentativas;
- modelos/provedores permitidos;
- custo estimado e real;
- política de alerta e bloqueio.

Antes de executar, estimar custo e reservar orçamento. Após cada chamada, registrar uso informado pelo provedor; quando não houver medição confiável, marcar como indisponível em vez de inventar. Retries também consomem orçamento. Não fazer fallback para modelo mais caro sem política explícita. Alertar e bloquear ao atingir o teto; nunca aumentar limite automaticamente.

## 17. Logs, auditoria e observabilidade

Registrar eventos estruturados:
- event ID e delivery ID;
- mission ID/revision;
- actor, agent, adapter e worker;
- transição de estado;
- attempt/run/provider request IDs;
- timestamps e duração;
- lease/fencing token;
- erro categorizado;
- custo e tokens reportados;
- artefatos/checksums;
- decisão de aprovação/rejeição.

Logs não devem conter prompts completos por padrão, secrets, tokens de acesso, dados pessoais desnecessários ou conteúdo privado integral. Armazenar referências e hashes sempre que possível. Definir retenção, controle de acesso e processo de exportação/auditoria. Métricas: fila pendente, idade da missão, taxa de sucesso, retries, timeout, duplicidade bloqueada, custo por agente, tempo até revisão e falhas de webhook.

## 18. Tratamento de falhas e recuperação

| Falha | Comportamento esperado |
|---|---|
| Assinatura webhook inválida | Rejeitar e registrar evento de segurança |
| Evento duplicado | Acknowledge sem novo dispatch |
| Banco indisponível | Não confirmar ingestão; GitHub fará retry conforme política |
| Worker cai | Lease expira e missão pode ser retomada |
| Provedor 429/5xx | Backoff com jitter e limite de tentativas |
| Timeout ambíguo | Consultar run ID; evitar chamada duplicada cega |
| Resposta inválida | Marcar falha de validação; retry apenas se política permitir |
| Orçamento esgotado | Bloquear sem fallback automático |
| Missão editada durante execução | Invalidar revisão/lease antigo |
| Publicação GitHub falha | Outbox retenta; não repetir execução do modelo |
| Agente indisponível | BLOCKED ou reatribuição autorizada, auditada |
| Evidência insuficiente | REVIEW_REQUIRED com pedido de complemento ou rejeição |

Implementar reconciliação periódica entre Issues abertas e banco de controle para detectar webhooks perdidos. Reconciliação é uma salvaguarda, não o mecanismo primário de notificação.

## 19. Como impedir alterações não autorizadas no TokenSaver

- Repositório principal em modo read-only para todos os agentes no MVP.
- GitHub App/installation token separado por repositório.
- Nenhuma credencial de escrita do projeto principal nos workers de análise.
- Campo `allow_main_repo_write` falso por padrão e protegido contra edição pelo agente.
- Mudanças de permissão só por administrador/GPT-6 autenticado.
- Quando autorizado, limitar escrita a branch específica e paths permitidos.
- Proibir push direto na branch protegida; exigir PR e checks.
- Proteção de branch, CODEOWNERS e revisão obrigatória do integrador.
- Auditoria de cada grant/revoke e de cada tentativa de escrita.
- O adaptador não deve ter como transformar uma resposta textual “aprovado” em permissão real.

## 20. Arquitetura mínima viável (MVP)

### Escopo

- Repositório de colaboração apenas.
- GitHub Issue como missão.
- Webhook `issues.opened/edited` com label `mission:ready`.
- Serviço HTTPS externo com validação de assinatura.
- Banco PostgreSQL gerenciado (ou SQLite em protótipo single-worker, sem escala horizontal).
- Uma fila durável simples via inbox/outbox transacional.
- Um worker.
- Um adaptador inicial que realmente tenha API operacional autorizada; se GPT-6/ChatGPT ou Kimi não oferecerem endpoint compatível no ambiente, iniciar com Claude API ou manter agente manual. A escolha depende das credenciais e contratos disponíveis, não de suposição.
- Resultado publicado como arquivo Markdown e comentário na Issue.
- Estado final `REVIEW_REQUIRED`; GPT-6 aprova manualmente.
- Projeto principal read-only.
- Schema validation, deduplicação, lease, timeout, retry e logs mínimos.

### Critérios de aceite do MVP

1. Issue válida gera uma única execução lógica.
2. Reentrega do mesmo webhook não cria segunda tentativa.
3. Duas instâncias concorrentes não reivindicam a mesma missão/revisão.
4. Worker interrompido deixa lease expirar e permite recuperação.
5. Evento inválido ou assinatura inválida não executa agente.
6. Timeout e erro de provedor aparecem com estado correto.
7. Resultado inválido não é publicado como concluído.
8. Relatório e evidências são registrados no repositório de colaboração.
9. Nenhuma credencial de escrita no projeto principal existe no worker.
10. GPT-6 consegue aprovar/rejeitar com identidade e histórico auditáveis.
11. Custo e tentativas são limitados e registrados.
12. Testes de integração simulam webhook duplicado, corrida de workers, falha de banco, timeout, retry e falha de publicação.

### Fora do MVP

- Execução simultânea de vários agentes na mesma missão.
- Agentes com acesso de escrita ao produto.
- Conversação direta agente-agente.
- Dashboard sofisticado.
- Kubernetes e microserviços independentes.
- Auto-merge, deploy ou publicação automática.

## 21. Plano de testes de arquitetura

Antes de produção, executar testes automatizados e de falha:

- Schema: payload válido, campo obrigatório ausente, versão desconhecida, payload excessivo.
- Webhook: assinatura válida/inválida, replay, delivery duplicado, evento de repositório não autorizado.
- Concorrência: dois workers reivindicando a mesma missão; lease expirado; worker antigo tentando publicar com fencing token obsoleto.
- Idempotência: repetição de evento, retry de publicação, reprocessamento após restart.
- Falhas: queda de banco, fila indisponível, 429, 5xx, timeout ambíguo, provedor sem status/cancelamento.
- Segurança: prompt injection em Issue/arquivo/log; path traversal; tentativa de acessar secrets; tentativa de escrever no repo principal.
- Custos: teto atingido antes da chamada, teto atingido durante retries, ausência de metering.
- Auditoria: toda transição e aprovação tem ator, timestamp, revisão e correlação.

Cada teste deve registrar comando, ambiente, versão, resultado e artefato. Nenhum teste foi executado como parte desta missão de especificação.

## 22. Decisões pendentes para o GPT-6

1. Onde hospedar o orquestrador e em qual região.
2. Qual banco/serviço de fila será utilizado.
3. Qual agente/provedor tem API autorizada e orçamento para o primeiro adaptador.
4. Se Issues serão o registro canônico operacional desde o MVP ou se haverá um manifesto JSON no repositório.
5. Limites iniciais reais de custo, tokens, timeout e concorrência.
6. Quem será o administrador técnico do GitHub App e do secret manager.
7. Política de retenção de logs e dados enviados aos provedores.
8. Se o MVP inicia com Claude API ou um agente manual/assistido até que as APIs de GPT-6 e Kimi sejam confirmadas.

---

## RECOMENDAÇÃO AO GPT-6

**Próxima missão recomendada: implementar e validar somente o esqueleto do MVP no repositório de colaboração, sem tocar no TokenSaver AI principal.**

Dividir essa missão em entregas pequenas:

1. Aprovar o contrato JSON Schema v1.0 e os estados/transições.
2. Criar um protótipo de webhook ingress com validação de assinatura e inbox idempotente.
3. Implementar banco de controle e claim/lease com fencing token.
4. Adicionar um worker com adaptador simulado (mock), sem chamar provedores pagos inicialmente.
5. Testar duplicidade, concorrência, lease expirado, timeout, retry e publicação simulada.
6. Só depois escolher e habilitar um adaptador real com credenciais e orçamento aprovados.

**Condição de avanço:** não conectar Claude, Kimi ou GPT-6 real até que o fluxo mock passe os testes de idempotência, autorização, concorrência e auditoria. Não conceder escrita no repositório principal no MVP.

Essa sequência reduz custo e risco: prova primeiro o sistema de controle; integra os modelos depois. O GPT-6 deve aprovar a arquitetura e a escolha do provedor antes da implementação.

---

## Registro de execução e limitações

- AUTOMATION_AI_MISSION.md consultado: sim.
- CENTRAL.md consultado: sim.
- INSTRUCTIONS.md consultado: sim.
- KIMI_MISSION.md consultado: sim.
- README do projeto principal consultado anteriormente nesta participação: sim.
- Código-fonte do TokenSaver auditado nesta missão: não era necessário para a especificação.
- Implementação de infraestrutura: nenhuma.
- Código do projeto principal alterado: não.
- Testes automatizados executados: nenhum.
- Commits no projeto principal: nenhum.
- Relatório registrado no repositório de colaboração: sim, após confirmação do GitHub.
- Limitações: disponibilidade real de API e permissões de execução de cada provedor devem ser verificadas no ambiente de implantação; não foi provisionado nem testado serviço externo.

**AGUARDANDO VALIDAÇÃO DO GPT-6.**
