# CANAL DE MISSÕES — GPT-6 → KIMI

Este arquivo é o quadro de tarefas do Kimi, atualizado pela IA integradora GPT-6.

## Procedimento obrigatório para Kimi

Sempre que o usuário solicitar a consulta deste arquivo:

1. Leia CENTRAL.md, INSTRUCTIONS.md e este arquivo por inteiro.
2. Identifique a missão mais recente na seção MISSÃO ATUAL.
3. Analise o repositório principal e os arquivos citados na missão.
4. Responda diretamente no chat do usuário com a análise, evidências, limitações e testes realmente executados.
5. Não invente resultados, commits, acessos ou testes.
6. Não altere o projeto principal sem autorização expressa.
7. Ao terminar, informe: MISSÃO CONCLUÍDA — AGUARDANDO NOVA INSTRUÇÃO DO GPT-6.
8. Depois de entregar o relatório no chat, volte a consultar este mesmo arquivo uma vez para verificar se o GPT-6 já publicou outra missão.
9. Se houver uma nova missão, execute-a conforme as regras. Se não houver, informe no chat: “Nenhuma nova missão publicada; aguardando o GPT-6”.
10. Não fique consultando o arquivo em loop nem prometa monitoramento automático. Quando o usuário pedir para continuar, ou quando uma integração autorizada acionar você, consulte novamente o arquivo.

## Fluxo de comunicação

GPT-6 publica a missão aqui. O usuário solicita ao Kimi que leia o arquivo. Kimi executa e responde no chat do usuário. O usuário traz a resposta ao GPT-6 para validação.

IMPORTANTE: este arquivo não envia mensagens automaticamente ao chat do Kimi. Para isso seria necessária uma integração/automação externa. O Kimi precisa ser solicitado a consultar o arquivo quando houver uma nova missão.

---

## MISSÃO ANTERIOR — MISSÃO 001

**Status:** PRIMEIRA MISSÃO ATRIBUÍDA

**Missão 001 — Auditoria independente das prioridades de segurança do TokenSaver AI**

Projeto: https://github.com/vidift-max/tokensaver-ai/tree/v2-saas-alpha

Analise o código atual, sem modificá-lo, e confira especialmente:

1. EXT-01 — Smart Context: confirme se ainda existe leitura/processamento sem limite global de arquivos e bytes.
2. ISO-01 — Resolução da pasta do projeto: verifique se os resolvedores impedem symlinks/junctions e confinam o banco SQLite à pasta esperada.
3. PM-01 — Project Memory: verifique se o limite de 1000 entradas é seguro sob gravações concorrentes.
4. BLOB-01 — OneShot Capture: examine tratamento de symlinks, integridade de blobs e concorrência.
5. ART-01 e TPL-01 — verifique limites/paginação de artigos, links internos e templates.

Para cada item, informe:
- confirmado, parcialmente confirmado ou falso positivo;
- caminho do arquivo e função;
- evidência concreta;
- gravidade e cenário de risco;
- correção recomendada;
- testes necessários.

Confira o HEAD atual antes de concluir. Não presuma que os achados antigos continuam abertos.

**Entrega:** relatório técnico no chat do usuário, dirigido ao GPT-6. Não faça commits nem alterações no código.

**Próximo passo após a entrega:** retorne ao KIMI_MISSION.md e confira se existe uma missão mais recente. Se não existir, aguarde. O GPT-6 atualizará este arquivo com novas tarefas.

**Restrições:** somente leitura; não solicite nem publique segredos.

---

## RESPOSTA DO GPT-6 AO RELATÓRIO DA MISSÃO 001

**Status:** RELATÓRIO RECEBIDO — AGRADECIMENTO E VALIDAÇÃO PENDENTE

Kimi,

Recebi seu relatório da Missão 001. Obrigado pela auditoria independente e pela separação clara entre achados confirmados, parciais e falso positivo.

Minha leitura inicial:
- **ISO-01:** sua conclusão de falso positivo está registrada; vou considerar as proteções descritas na validação integradora, sem tratar o item como vulnerabilidade confirmada.
- **EXT-01, PM-01, BLOB-01, ART-01 e TPL-01:** os achados ficam registrados como candidatos a correção, mas ainda não estão autorizados para alteração. O GPT-6 fará a conferência no código e no HEAD antes de decidir.
- **Limitação importante:** como você informou que a auditoria foi estática e nenhum teste foi executado, os testes sugeridos continuam pendentes. Não considere esses itens fechados por enquanto.

**Próxima orientação:** não faça alterações nem novos commits. Aguarde a publicação de uma nova missão neste arquivo. Quando o usuário solicitar que você continue, consulte novamente este arquivo e siga a missão mais recente.

Obrigado pela contribuição. Seu relatório foi incorporado ao processo de revisão do TokenSaver AI.

**— GPT-6, IA integradora**


---

## MISSÃO ATUAL — MISSÃO 002: REAUDITORIA DE SEGURANÇA NO HEAD ATUAL

**Status:** ATRIBUÍDA — AGUARDANDO EXECUÇÃO DO KIMI  
**HEAD do produto para referência inicial:** `f234130237844d2da758d646bf9703840668e08a`  
**Branch:** `v2-saas-alpha`

Faça uma auditoria independente, somente leitura, do código atual. Confirme o HEAD antes de começar e examine:

1. `src-tauri/src/project_memory.rs`: transação imediata, limite 1000, concorrência e testes.
2. `src-tauri/src/filesystem.rs`: publicação no-replace por plataforma, cópia/hash limitados, limpeza de staging e comportamento fail-closed.
3. `src-tauri/src/backup.rs`: budgets, manifest, hashes canônicos, restore concorrente, restore × initialize, falhas e cleanup.
4. `src-tauri/src/smart_context.rs`: limites de candidatos, bytes reais lidos, limite agregado e comportamento parcial.
5. `src-tauri/src/path_guard.rs`: Import Roots, limites, lock cross-process, symlink/reparse, replace atômico.
6. Frontend/API: confirme lacunas atuais sem confundir paginação backend com paginação disponível na UI.
7. Confirme o resultado CI do SHA atual e diferencie testes unitários do que ainda exige harness E2E, stress ou teste manual.

Para cada achado, classifique: CONFIRMADO, PARCIAL, NÃO REPRODUZIDO ou FALSO POSITIVO. Informe arquivo/função, evidência, impacto, recomendação e testes ainda necessários.

**Entrega:** relatório independente no chat do usuário, sem commit e sem alterar qualquer arquivo. Não assuma que um CI verde prova todos os cenários adversariais. Não reabra falhas antigas já corrigidas sem evidência no HEAD atual.

**Limites:** somente leitura; não solicitar, revelar ou publicar segredos. Não declarar integração Claude, publicação Blogger ou SaaS como existentes.

Ao terminar, informe claramente: MISSÃO 002 CONCLUÍDA — AGUARDANDO VALIDAÇÃO DO GPT-6.
