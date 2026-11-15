# AI-PHONE-02 P2.22 — Relatório de viabilidade e bloqueios

**Autora:** ChatGPT — GPT-6 (OpenAI)  
**Especialidade:** arquitetura Android, integração de agentes e segurança de comunicação  
**Data:** 2026-11-14  
**Status:** BLOCKED — identificação física e canal executável ausentes  
**Escopo:** exclusivamente Phone-02. Phone-01 e workflow de attestation não foram modificados.

## 1. Resultado executivo

A P2.22 encontrou uma central pública de colaboração já existente: `vidift-max/tokensaver-ai-collaboration`. Ela contém especificações documentais de webhook HMAC, inbox/outbox idempotente, lease/fencing, retry/DLQ, máquina de estados, validação de evidências e matriz default-deny.

Isso evita redesenhar os contratos do zero, mas **não prova que exista runtime operacional**. Os documentos consultados declaram explicitamente que endpoint, segredo, GitHub App, banco/fila, worker e adapters não foram provisionados. A prontidão das missões 011–020 permanece bloqueada por aprovação formal das missões 003–010.

O repositório principal `vidift-max/tokensaver-ai` descreve um aplicativo desktop Windows Tauri/React/TypeScript/Rust. Não foi encontrada evidência documental de um aplicativo Android Phone-02 ou de integração móvel.

**Veredito:** a arquitetura pode ser aproveitada; o Phone-02 físico continua não identificado; não há canal de missão ponta a ponta demonstrado. Não é seguro declarar a estação operacional.

## 2. Rodada 1 — Identificação física

| Campo | Estado | Evidência |
|---|---|---|
| Fabricante/modelo | USER_ACTION_REQUIRED | Nenhuma fonte remota autorizada identifica o Phone-02 físico |
| Versão Android | USER_ACTION_REQUIRED | Não coletada do aparelho |
| ABI/arquitetura CPU | USER_ACTION_REQUIRED | Não coletada via Android Build/ADB |
| RAM | USER_ACTION_REQUIRED | Não coletada |
| Armazenamento livre/total | USER_ACTION_REQUIRED | Não coletado |
| Política de bateria/segundo plano | BLOCKED | Depende do fabricante, Android e modelo exatos |
| Estado de rede/permissões | USER_ACTION_REQUIRED | Não há telemetria do Phone-02 |

Não usei metadados do dispositivo que acessa esta conversa como prova do Phone-02.

### Ação física mínima exigida

No Phone-02:
1. Abrir **Configurações → Sobre o dispositivo/tablet**.
2. Informar somente **fabricante/modelo** e **versão Android** (ou enviar captura recortada dessa tela).
3. Não enviar IMEI, número de série, telefone, endereço MAC ou identificadores de conta.

Depois, se necessário, o aplicativo de diagnóstico poderá coletar ABI, RAM, espaço livre e restrições de bateria. Não é necessário ativar Depuração USB para a primeira identificação.

## 3. Rodada 2 — Aplicativo escolhido

**Escolha: aplicativo Android nativo em Kotlin + Jetpack Compose.**

Justificativa:
- integração direta com Room/SQLite, Android Keystore, FCM, WorkManager e notificações;
- maior controle de ciclo de vida e permissões do que PWA/WebView;
- menor dependência de wrappers híbridos para tarefas de background;
- UI simples e testável, sem exigir que o app permaneça aberto.

Não escolher PWA: notificações e execução de background não oferecem a mesma previsibilidade de um aplicativo Android nativo. Não escolher Tauri/desktop para a estação física.

Componentes planejados:
- Kotlin + Jetpack Compose;
- Room para inbox/outbox e estados;
- WorkManager para sincronização recuperável;
- FCM apenas para aviso de nova atividade;
- Android Keystore para chave privada da estação;
- foreground service somente quando a tarefa longa e as regras do Android justificarem.

## 4. Rodada 3 — Canal e broker

### Recomendação técnica condicional

Firebase pode ser usado no protótipo se a conexão Phone-01 puder ser adaptada para ler/escrever no broker:
- Firebase Authentication para identidade de usuário/estação;
- Realtime Database para fila/estado/heartbeat;
- FCM para sinalização;
- App Check com Play Integrity como defesa adicional;
- Security Rules default-deny, com escopo por UID/estação.

Limites atuais relevantes do Spark:
- Realtime Database: 1 GB armazenado;
- 10 GB/mês de downloads;
- 100 conexões simultâneas;
- FCM e App Check listados como sem custo, sujeitos às condições/quota do produto;
- a maioria dos métodos de Firebase Authentication sem custo; autenticação por telefone é cobrada.

Fontes oficiais:
- https://firebase.google.com/pricing
- https://firebase.google.com/docs/database/security
- https://firebase.google.com/docs/app-check/android/play-integrity-provider
- https://firebase.google.com/docs/projects/billing/firebase-pricing-plans

**Risco de arquitetura:** o Spark não deve ser tratado como se incluísse um backend server-side irrestrito. Emissão de custom tokens, validação de assinatura de dispositivo e operações privilegiadas exigem componente servidor confiável. Não colocar credenciais administrativas no APK.

### Bloqueio Phone-01

A sessão GPT-6/ChatGPT atual não é um daemon que faz polling de Firebase nem oferece, nesta missão, um endpoint público de callback configurado. O repositório de colaboração é um canal documental assíncrono, não um broker em tempo real.

Portanto, mesmo que o Phone-02 se conecte ao Firebase, **o GPT-6 não poderá enviar/receber automaticamente pelo ciclo exigido sem um adaptador autorizado no lado Phone-01 ou uma ponte externa já operacional**. A restrição de não modificar Phone-01 foi respeitada; essa dependência não foi contornada.

## 5. Rodada 4 — Registro/autenticação

Fluxo futuro:
1. usuário instala APK assinado;
2. app gera par de chaves no Android Keystore;
3. operador cria convite de pareamento de uso único, curta validade e escopo PHONE-02;
4. app autentica e prova posse da chave privada;
5. serviço confiável valida convite, associa UID + public key + station_id;
6. serviço revoga convite e emite sessão de curta duração;
7. app passa a usar somente credenciais renováveis, nunca uma chave administrativa embutida.

App Check/Play Integrity complementa autenticação; não substitui autenticação, autorização nem prova de identidade da estação. A chave pública e a assinatura do desafio devem ser validadas no backend. O processo de cadastro não foi implementado nem testado.

## 6. Rodadas 5–6 — Caixa de mensagens e executor

### Interface mínima
- **Inbox:** novas missões, ordenadas por prioridade/data;
- **Em execução:** missão atual, revisão, rodada, lease e progresso;
- **Relatórios:** enviados, pendentes e rejeitados;
- **Mensagens GPT-6:** respostas, bloqueios e novas instruções;
- **Histórico:** trilha append-only por mission_id;
- **Conexão:** ONLINE/DEGRADED/OFFLINE/RECONNECTING/AUTH_FAILED/REVOKED.

### Máquina de estados
DRAFT → QUEUED → ASSIGNED → RUNNING → REVIEW_REQUIRED → APPROVED → COMPLETED.

Alternativos: BLOCKED, RETRY_PENDING, FAILED, CANCELLED, EXPIRED.

### Política do executor
- validar schema, assinatura, destinatário, revisão, validade e grant antes de executar;
- persistir a missão localmente antes de confirmar recebimento;
- reivindicar uma missão com lease e fencing token;
- executar somente tarefas dentro da allowlist de capacidades;
- exigir autorização para operações destrutivas, financeiras, publicação, credenciais, permissões ou escopo externo;
- bloquear em missão ambígua, assinatura inválida, grant expirado/revogado, orçamento excedido ou estado conflitante;
- deduplicar por mission_id + revision + run_id;
- gravar evidências e relatório na outbox antes de transmitir;
- não repetir cegamente uma execução após timeout ambíguo.

**Importante:** a IA executora ainda não foi selecionada nem conectada. Um aplicativo Android de mensagens não contém, por si só, um modelo de IA local ou uma API de modelo. O adapter do provedor e suas credenciais precisam ser autorizados separadamente. Não presumir que o app ChatGPT instalado possa ser controlado em background por outro aplicativo.

## 7. Rodada 7 — Continuidade

WorkManager é a base recomendada para sincronização e retomada após reinicialização. Não garante execução ininterrupta de um processo de IA.

- Tela desligada: tarefas agendadas podem continuar dentro das políticas do sistema.
- App em segundo plano: WorkManager/FCM; não depender de WebSocket eterno.
- Internet perdida: manter estado local e outbox.
- Internet recuperada: sincronizar com backoff e idempotência.
- Reinicialização: WorkManager reprograma trabalho persistente.
- Bateria baixa: respeitar restrições e adiar tarefas não urgentes.
- FCM recebido: agendar sincronização; não considerar o push como ACK da missão.
- Missão pendente: retomar somente após validar revisão, lease e estado remoto.

Fontes oficiais:
- https://developer.android.com/develop/background-work/background-tasks/persistent
- https://developer.android.com/about/versions/12/behavior-changes-12
- https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start

O Android restringe iniciar foreground services a partir do background e aplica limites adicionais por versão. Não prometer 24/7 sem ensaio no aparelho específico.

## 8. Rodada 8 — Implementação

**Implementado nesta missão:** nenhum aplicativo, serviço, endpoint, banco, regra Firebase ou adapter.

**Preparado:** escolha de stack Android, fluxo de registro, contratos de estado, arquitetura de armazenamento/sincronização e lista de bloqueios.

Não foi criado APK. Não houve build, instalação, ADB, execução no aparelho ou conexão Firebase.

## 9. Rodada 9 — Teste ponta a ponta

| Critério | Estado |
|---|---|
| A. Phone-02 se identifica | NÃO EXECUTADO |
| B. Phone-01 envia missão | BLOQUEADO — adapter Phone-01 ausente |
| C. Phone-02 recebe | NÃO EXECUTADO |
| D. Phone-02 notifica | NÃO EXECUTADO |
| E. Missão armazenada | NÃO EXECUTADO |
| F. IA executa ou registra bloqueio | NÃO EXECUTADO |
| G. Relatório retorna | NÃO EXECUTADO |
| H. Phone-01 recebe | BLOQUEADO — adapter Phone-01 ausente |
| I. Nova missão pode ser enviada | NÃO EXECUTADO |
| J. Queda não destrói estado | NÃO EXECUTADO |

Nenhum teste ponta a ponta foi executado.

## 10. Rodada 10 — Veredito

### Arquitetura
**PARCIALMENTE DEFINIDA.** A solução Android nativa e a arquitetura de mensageria são tecnicamente viáveis, mas Firebase depende de um adaptador externo autenticado para o GPT-6.

### Implementação
**NÃO IMPLEMENTADA.** Não existe app Android, broker provisionado ou adapter de IA comprovado para este Phone-02.

### Operação
**NÃO EXECUTADA.** O aparelho físico ainda não foi identificado ou conectado.

### Autonomia
**NÃO COMPROVADA.** WorkManager oferece retomada e sincronização; não fornece daemon irrestrito nem garante execução 24/7.

**Classificação do Phone-02: BLOQUEADO.**

## 11. Próximas ações mínimas

1. **Usuário:** fornecer somente fabricante/modelo e versão Android na tela Sobre o dispositivo.
2. **GPT-6 integrador:** definir formalmente o adaptador autorizado de Phone-01 para o broker, sem modificar o Phone-01 durante esta missão. Sem essa ponte, o ciclo automático não existe.
3. **Implementador autorizado:** criar o app Kotlin em branch isolada, sem secrets e sem alterações no workflow de attestation.
4. **Após identificação:** build, instalar APK, parear, testar push, persistência, reinício e ciclo missão/relatório no hardware real.

## 12. Alterações e limites

- Repositório principal `vidift-max/tokensaver-ai`: não alterado.
- Workflow de attestation: não alterado; nenhum dispatch/rerun.
- Phone-01: não alterado.
- Phone-03: não iniciado.
- Banco/SQL/DDL/DML/migrações: nenhum.
- Segredos: nenhum criado, lido ou publicado.
- Infraestrutura paga: nenhuma contratada.
- Testes físicos: nenhum.

**AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.**
