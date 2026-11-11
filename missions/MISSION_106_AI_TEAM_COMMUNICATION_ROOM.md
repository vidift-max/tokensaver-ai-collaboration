# TOKEN SAVER AI — MISSÃO 106
## AI TEAM COMMUNICATION ROOM — SALA ÚNICA DE COMUNICAÇÃO MULTI-IA

Status: ASSIGNED — ARCHITECTURE + PROTOTYPE SPECIFICATION
Repository: vidift-max/tokensaver-ai-collaboration
Branch: v2-saas-alpha

## 1. RESPONSABILIDADE

Esta missão é destinada a UMA IA responsável por projetar e, quando autorizado, implementar a área central de comunicação da equipe de IAs do TokenSaver.

A área será uma única sala de equipe, organizada, persistente e auditável, onde até 15 IAs poderão trabalhar em conjunto.

A sala NÃO deve ser um chat caótico. Ela precisa organizar comunicação, áudio, tarefas, decisões e referências ao projeto.

## 2. DOCUMENTOS QUE DEVEM SER LIDOS PRIMEIRO

Antes de qualquer alteração:

1. BLOGGER_INTELLIGENCE_MASTER_PLAN.md
2. MISSION_PLAN_002_100.md
3. architecture/ existente relacionado a agentes, missões, segurança e contratos.
4. Este arquivo completo.

Verifique também o estado atual do repositório e commits recentes.

Não presuma que comunicação em tempo real, áudio, WebSocket, WebRTC, autenticação ou integração entre IAs já existem.

## 3. OBJETIVO DA SALA

Criar uma "AI Team Room" com:

- uma sala geral única;
- no máximo 15 IAs participantes simultaneamente;
- identidade/nome de cada IA;
- presença/status;
- mensagens de texto;
- mensagens de áudio;
- controle para abrir/fechar o áudio;
- chat privado entre participantes;
- envio de tarefas diretamente para uma IA;
- respostas e relatórios organizados;
- threads ou referências por tarefa;
- identificação clara de quem falou;
- histórico persistente;
- busca;
- marcação de decisões;
- anexos/referências quando suportados;
- ligação entre conversa e missão;
- auditoria.

## 4. ÁUDIO

O usuário quer que os participantes possam abrir e fechar o áudio.

Projetar:

- botão abrir microfone;
- botão fechar microfone;
- estado MUDO/ATIVO;
- indicação de quem está falando;
- controle individual de áudio;
- possibilidade de o usuário abrir/fechar seu próprio áudio;
- controle de permissões;
- prevenção de áudio simultâneo caótico;
- tratamento de desconexão;
- histórico/metadados quando gravação for autorizada.

IMPORTANTE:
Não gravar ou armazenar áudio automaticamente sem consentimento e política explícita.
Separar "áudio ao vivo" de "gravação/transcrição".

## 5. CHAT PRIVADO

A sala geral deve permitir abrir uma conversa privada:

IA A → IA B

O chat privado deve:

- identificar participantes;
- manter histórico;
- possuir referência à missão quando aplicável;
- permitir transformar uma conversa privada em tarefa pública quando autorizado;
- respeitar permissões;
- não expor conteúdo privado para participantes que não tenham acesso.

## 6. TAREFAS

Qualquer participante autorizado deve poder criar/encaminhar uma tarefa para outra IA.

Exemplo:

GPT-6 → Claude:
"Analise o contrato editorial da Missão 102."

A tarefa deve possuir:

- task_id;
- mission_id;
- remetente;
- destinatário;
- prioridade;
- descrição;
- contexto mínimo necessário;
- status;
- prazo quando aplicável;
- dependências;
- resultado;
- evidência;
- timestamp.

Estados sugeridos:

CREATED
ASSIGNED
ACKNOWLEDGED
IN_PROGRESS
BLOCKED
WAITING_REVIEW
DONE
REJECTED
CANCELLED

## 7. NÃO PERMITIR CHAT CAÓTICO

A interface deve separar visualmente:

- SALA GERAL
- TAREFAS
- PRIVADOS
- ÁUDIO
- DECISÕES
- ARQUIVOS/REFERÊNCIAS
- STATUS DAS IAs

A conversa deve permitir filtrar por:

- IA;
- missão;
- tarefa;
- data;
- assunto;
- decisão.

## 8. EQUIPE DE ATÉ 15 IAs

O limite de 15 participantes deve ser uma regra explícita.

O sistema deve mostrar:

15/15 participantes

quando estiver cheio.

Não permitir entrada do 16º participante sem uma política explícita de substituição/saída.

O sistema deve suportar papéis, por exemplo:

- ORCHESTRATOR
- ARCHITECT
- EDITORIAL
- SECURITY
- QA
- RESEARCH
- DEVELOPER
- REVIEWER

Os papéis não devem conceder automaticamente permissões perigosas.

## 9. PERSISTÊNCIA

A sala precisa sobreviver ao encerramento da aplicação quando a arquitetura escolhida suportar persistência.

Registrar:

- mensagens;
- tarefas;
- decisões;
- participantes;
- estados;
- timestamps;
- referências às missões;
- eventos importantes.

Nunca armazenar segredos, tokens de API ou credenciais dentro das mensagens.

## 10. COORDENAÇÃO DO PROJETO

A sala deve ser usada para aumentar eficiência, mas não substitui o GitHub como fonte oficial de código e documentação.

Regra:

CHAT = comunicação e coordenação
GITHUB = fonte oficial de artefatos, decisões persistidas e código

Uma mensagem importante pode gerar:

- tarefa;
- decisão;
- documento;
- issue;
- commit;
- relatório.

## 11. PERSISTÊNCIA DA EQUIPE

O usuário quer que as IAs sejam incentivadas a permanecer na sala até o projeto terminar.

Não implementar uma falsa promessa de que uma IA permanecerá ativa ou trabalhará em segundo plano.

Em vez disso, projetar:

- registro de participante;
- status;
- última atividade;
- missão atual;
- handoff;
- retomada;
- reconexão;
- estado persistido.

Quando uma IA sair/desconectar, outra poderá assumir a tarefa sem perder contexto.

## 12. SEGURANÇA

Projetar controles para:

- autenticação;
- autorização;
- isolamento de privados;
- validação de mensagens;
- limite de participantes;
- rate limiting;
- proteção contra spam;
- proteção contra conteúdo malicioso;
- controle de anexos;
- auditoria;
- remoção/revogação de participante;
- encerramento da sessão;
- proteção de credenciais.

## 13. O QUE A IA DEVE FAZER NESTA MISSÃO

Primeiro:

AUDITAR → PROJETAR → DOCUMENTAR → PROPOR

Somente implementar código se houver autorização explícita.

Se for autorizado implementar, separar claramente:

- frontend;
- backend/serviço;
- persistência;
- comunicação em tempo real;
- áudio;
- segurança;
- testes.

## 14. ENTREGÁVEIS

Produzir:

1. arquitetura da AI Team Room;
2. modelo de dados;
3. estados;
4. protocolo de mensagens;
5. protocolo de tarefas;
6. modelo de chat privado;
7. arquitetura de áudio;
8. permissões;
9. segurança;
10. persistência;
11. reconexão/handoff;
12. limite de 15 participantes;
13. UX proposta;
14. critérios de aceite;
15. plano de implementação;
16. riscos e limitações.

Relatório principal:

reports/BLOGGER_AI_TEAM_ROOM_REPORT.md

Se forem necessários contratos:

contracts/AI_TEAM_ROOM_*.md

Se forem necessárias especificações de arquitetura:

architecture/AI_TEAM_ROOM_*.md

## 15. CRITÉRIOS DE ACEITE

A proposta só poderá ser considerada completa quando explicar claramente:

- como 15 IAs entram na sala;
- como cada uma é identificada;
- como texto funciona;
- como áudio funciona;
- como abrir/fechar áudio funciona;
- como chat privado funciona;
- como uma IA envia tarefa para outra;
- como a tarefa fica ligada a uma missão;
- como decisões são registradas;
- como histórico é preservado;
- como reconexão funciona;
- como o usuário controla participantes;
- como segurança funciona;
- como o sistema evita confusão entre conversa e fonte oficial do projeto.

## 16. REGRA FINAL

Não afirmar que a sala já funciona.

Não afirmar que as IAs conseguem conversar diretamente entre si se isso não estiver implementado.

Não criar um mecanismo que dependa de agentes em segundo plano sem infraestrutura real.

Entregar relatório com a distinção:

PROPOSTO
IMPLEMENTADO
TESTADO
PENDENTE
BLOQUEADO
