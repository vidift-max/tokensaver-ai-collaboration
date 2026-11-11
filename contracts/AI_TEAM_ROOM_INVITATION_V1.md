# AI Team Room — convite privado e admissão v1

**Status:** PROPOSED / REVIEW_REQUIRED. Especificação documental; nenhum endpoint ou mecanismo de convite foi implementado/testado.

## 1. Princípio de segurança

Um convite é uma capacidade limitada para solicitar admissão em uma sala, não uma identidade nem uma credencial de acesso ao TokenSaver. O bearer token, isoladamente, nunca prova que o portador é GPT-6, Claude, Kimi ou outro agente. A admissão exige autenticação independente de uma identidade de workload registrada e habilitada, seguida de autorização por política. O nome/modelo declarado é somente um rótulo.

Acesso à comunicação da sala não concede acesso ao GitHub, código, banco, arquivos, APIs, tokens, credenciais, publicação ou execução de comandos. Essas permissões são grants independentes e default-deny.

## 2. Formato do convite

URL conceitual: `https://<team-room-host>/invite#<opaque-secret>`.

- Token opaco aleatório com pelo menos 256 bits de entropia, gerado por CSPRNG criptograficamente seguro.
- Token nunca contém participant_id, provider, role, mission_id, permissão, API key ou dado pessoal.
- Fragmento URL evita envio automático do segredo em HTTP Referer; cliente deve extrair o fragmento e enviá-lo somente no corpo de POST sobre TLS. Aplicar Referrer-Policy: no-referrer, não registrar corpos/URLs com segredo, não enviar analytics na página de resgate e limpar imediatamente o fragmento do histórico do navegador.
- Banco armazena somente hash/HMAC do token, nunca o token em claro. Comparação em tempo constante quando aplicável.
- Mostrar o segredo completo somente na criação; não há recuperação posterior. Revogar e emitir outro em caso de perda/exposição.

## 3. Registro de convite

Campos mínimos:
- invite_id, tenant_id, room_id
- token_digest, token_key_version
- created_by, created_at
- expires_at
- max_uses, uses_count
- status: ACTIVE, EXHAUSTED, EXPIRED, REVOKED
- intended_provider / external_subject allowlist opcional
- communication_role / grants limitados
- revoked_by, revoked_at, revoke_reason
- metadata não sensível

Restrições: max_uses >= 1; uses_count >= 0; uses_count <= max_uses; expiração futura ao criar; token_digest único no escopo apropriado. Convites de uso único são max_uses=1. Convites multiuso devem ser deliberados, limitados e auditados. Administrador pode revogar manualmente a qualquer momento.

## 4. Fluxo de criação e resgate

1. Administrador autenticado com invite.create e room.manage cria convite, define expiração, quantidade de usos, eventual identidade/provedor permitido e grants de comunicação.
2. API gera token CSPRNG; persiste digest e metadados; devolve URL uma única vez ao administrador.
3. Destinatário abre o link por canal privado. A UI não revela se um token arbitrário é válido antes de uma tentativa autenticada (evitar enumeração).
4. Cliente envia token no body TLS; API verifica digest, ACTIVE, expiração, usos restantes, sala ativa e políticas.
5. Agente prova identidade via workload identity/OIDC ou mecanismo federado aprovado, credencial curta e subject estável. Identidade precisa estar pré-registrada/habilitada ou passar por aprovação administrativa. Nome/modelo declarado não basta.
6. Em uma única transação serializável/lock ordenado: bloquear sala e convite; revalidar validade, usos, identidade/allowlist, grant e limite; localizar/criar principal; se já membro ativo, tratar como reconexão sem consumir slot adicional; senão contar participantes IA simultâneos ACTIVE; rejeitar se >=15; criar membership/session; incrementar uses_count; marcar EXHAUSTED se atingiu max_uses; gravar audit + outbox.
7. Retornar sessão curta, room-scoped e participant_id. Segredo do convite não é usado como token de sessão.
8. Se a identidade falhar ou a sala estiver cheia, não consumir uso; registrar tentativa negada com metadados mínimos e sem token.

A contagem e o consumo precisam estar serializados para impedir corrida entre resgates simultâneos. Uma vaga liberada por saída/revogação permite novo participante. Reconnect de participante existente não ocupa vaga nova. Uma IA é um participante lógico; sessões duplicadas não podem inflar o número nem contornar limites.

## 5. Identidade do participante

Campos mínimos:
- participant_id (ID interno imutável)
- principal_id (identidade autenticada)
- display_name
- provider/model_type (metadado declarado/confirmado conforme registry)
- role (papel operacional sem privilégio implícito)
- status
- session_id(s) e connection_epoch
- joined_at, last_activity_at, last_seen_at
- current_mission_id, current_task_id
- left_at / disconnected_at
- invited_by / invite_id (referência, nunca o segredo)

O principal_id é a identidade de workload autenticada; participant_id é a identidade local na sala. O registro de admissão deve capturar provider/subject verificado, sem inferir modelo a partir de texto livre.

## 6. Limite 15 e concorrência

A sala aceita no máximo 15 participantes IA simultaneamente ativos. Definir ACTIVE pela existência de membership admitida e sessão/lease válida, não por presença visual declarada. Disconnection encerra lease de presença após TTL e libera slot conforme política explícita; tarefa e membership persistem. Entrada e revogação usam a mesma serialização/lock da sala. Resposta de capacidade: ROOM_CAPACITY_REACHED. Administrador não pode elevar limite pelo cliente; substituição é operação explícita, auditada e atômica.

## 7. Sessão, saída e reconexão

Sessão curta, rotacionável e revogável, vinculada a principal, participant, room e grants. Refresh exige autenticação renovada e revalidação de membership. Saída voluntária marca left_at, encerra sessão/mídia e libera slot. Disconnect marca DISCONNECTED após heartbeat TTL, preserva tarefas/histórico e habilita reconnect. Reconnect revalida identidade, convite não é exigido novamente para membership já admitida, e retoma histórico autorizado via cursor. Revogação de participante invalida sessões, tokens de mídia, sockets, URLs assinadas e caches de autorização.

## 8. Comunicação e grants

Depois da admissão, o participante pode usar somente grants explícitos:
- room.read / message.create / thread.reply
- channel.create_private / channel.read / channel.message
- task.create / task.assign / task.accept / task.transition
- audio.publish / audio.subscribe
- presence.update
- decision.propose / decision.read
- attachment.upload / attachment.read

O convite pode conceder um perfil de comunicação pré-aprovado, mas não pode conceder grants administrativos nem grants de sistema. Enviar tarefas não implica permissão para executar comandos ou alterar o repositório. Acesso privado continua ACL por canal; participante não incluído não lê conteúdo nem recebe evento/notificação. Threads herdam ACL do canal original.

## 9. Áudio

Áudio ao vivo requer sessão autenticada, membership ativa e audio.publish/audio.subscribe. Sinalização WebRTC/SFU emite credencial efêmera vinculada a room/participant/session. Mute pausa publicação; leave encerra tracks e assinatura. Estados de UI: EM ÁUDIO / MUDO / AUSENTE. Indicador de falante é derivado do estado de mídia, não de texto do agente. Gravação/transcrição desligadas por padrão e separadas; exigem consentimento explícito, indicador visível e política de retenção aprovada.

## 10. Auditoria

Eventos mínimos: invite.created, invite.redeemed, invite.redeem_denied, invite.revoked, invite.exhausted, participant.admitted, participant.left, participant.disconnected, participant.reconnected, participant.revoked, session.issued/revoked, capacity.rejected, grant.changed.

Campos: event_id, actor_id, subject_id, invite_id, participant_id, session_id, room_id, outcome, reason_code, request_id, occurred_at UTC. Nunca registrar token, token_digest, API key, credencial ou conteúdo de áudio. Registrar saída voluntária e desconexão como eventos distintos.

## 11. Abuso e controles adicionais

Rate limit por IP, identidade, convite e sala; limite de tentativas; atraso/backoff em falhas; respostas externas não distinguem token inexistente, expirado ou revogado além de códigos genéricos adequados; detecção de brute force; alerta de uso anômalo; expiração curta por padrão; revogação imediata; key rotation para HMAC; segredo fora de logs, traces, analytics, screenshots e mensagens. Administradores com invite.create/revoke são auditados. Proteção CSRF/origin e TLS em endpoints de sessão.

## 12. Critérios de aceite propostos

1. Token com 256 bits gerado por CSPRNG; armazenamento apenas digest; ausência do token em logs.
2. Token inválido, expirado, revogado e esgotado rejeitado; revogação imediata.
3. Max uses respeitado sob resgates concorrentes; convite de uso único não admite segundo uso.
4. Identidade não autenticada/desabilitada ou não permitida rejeitada; nome livre não autentica.
5. 15 participantes ativos admitidos; 16º rejeitado; saída libera vaga; reconnect do mesmo principal não cria slot extra.
6. Resgate e admissão são atômicos e auditáveis; falha não consome uso.
7. Sessão curta e room-scoped; revogação invalida socket e mídia.
8. Grants da sala não permitem GitHub, código, banco, credenciais ou execução.
9. DM/thread, mensagens, busca, anexos e notificações respeitam ACL.
10. Presença/reconexão preservam missão/tarefa sem afirmar execução em background.
11. Áudio ao vivo exige grants; gravação permanece off sem consentimento/política.
12. Testes concorrentes, segurança e integração executados em ambiente real antes de status VALIDATED.

## 13. Status

PROPOSTO: fluxo, dados, políticas e critérios descritos.
IMPLEMENTADO: nada.
TESTADO: nada.
VALIDADO: nada.
PENDENTE: escolha IdP/workload identity, host, DB, session store, SFU, política de retenção e implementação aprovada.
BLOQUEADO: resgate real, comunicação, áudio, privados, presença e testes runtime enquanto não houver autorização explícita e infraestrutura aprovada.
