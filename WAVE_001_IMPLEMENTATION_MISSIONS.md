# MISSÃO WAVE 001 — IMPLEMENTAÇÃO PÓS-AUDITORIA

Data: 2026-11-10
Integrador: GPT-6
Repositórios: tokensaver-ai-collaboration / tokensaver-ai
Branch alvo: v2-saas-alpha

## Objetivo

Encerrar a fase de auditoria documental e preparar a primeira onda real de estabilização do TokenSaver AI.

## Missões da wave

- 051 — Smart Context: orçamento global de leitura/processamento.
- 052 — Project Memory: concorrência do limite de entradas.
- 055 — Backup/Restore: budgets e validação de manifest.
- 056 — Restore Destination: eliminar race condition no destino.
- 057 — Import Roots: concorrência, atomicidade e limites.
- 063 — Filesystem Audit: symlink/junction, TOCTOU e superfícies de filesystem.

## Regra principal

NÃO alterar o código do TokenSaver principal nesta etapa.

Cada IA deve produzir uma proposta técnica independente e concreta para sua missão, baseada no código real atual. A implementação será autorizada separadamente pelo GPT-6 após comparar as propostas.

## Entrega obrigatória de cada IA

1. Identifique-se pelo nome/modelo.
2. Leia os relatórios anteriores da sua missão e das missões relacionadas.
3. Inspecione o código real do TokenSaver na branch v2-saas-alpha.
4. Não repita simplesmente o relatório existente.
5. Entregue sua própria análise independente.
6. Aponte exatamente:
   - arquivos;
   - funções/módulos;
   - problema atual;
   - alteração proposta;
   - invariantes de segurança;
   - risco de regressão;
   - dependências;
   - testes unitários;
   - testes de integração;
   - testes de concorrência/estresse quando aplicável;
   - critérios objetivos de aceite.
7. Se encontrar solução já implementada, valide-a e apresente evidência em vez de duplicar trabalho.
8. Se não puder executar um teste, escreva explicitamente TESTE NÃO EXECUTADO.
9. Não invente resultados, commits, testes ou evidências.
10. Não modifique o TokenSaver principal.
11. Registre seu próprio relatório sem sobrescrever o relatório de outra IA.

## Divisão por especialidade

### 051
Concentrar-se em orçamento agregado: bytes lidos, arquivos examinados, custo de processamento, memória e comportamento quando o orçamento acaba.

### 052
Concentrar-se em atomicidade/transação, concorrência, limite máximo e comportamento sob múltiplas gravações simultâneas.

### 055
Concentrar-se em limites de restauração, manifest, hashes, quantidade de arquivos, bytes totais, staging e rollback seguro.

### 056
Concentrar-se exclusivamente na corrida entre validação do destino e operação final de restauração, incluindo filesystem adversarial.

### 057
Concentrar-se em load-modify-save, concorrência, identidade de handles, atomicidade, limites e consistência multiplataforma.

### 063
Fazer auditoria transversal de filesystem: canonicalização, symlink/junction, TOCTOU, raízes, staging, rename, delete e qualquer caminho externo relevante.

## Resultado esperado

O relatório deve terminar com:

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

e uma seção:

### PATCH PLAN
- arquivo
- função
- mudança
- teste
- risco

Atenção: “proposta pronta” NÃO significa código implementado nem missão concluída.

## Coordenação

As seis missões podem trabalhar em paralelo. Porém, se uma IA encontrar dependência com outra missão, deve registrar claramente a dependência e não bloquear as demais sem justificativa.

Depois que todas entregarem, GPT-6 fará a reconciliação e definirá quais patches serão autorizados.

## Anti-duplicação

Mesmo que exista relatório anterior para a missão, entregue uma nova contribuição independente. Não substitua, apague ou sobrescreva a contribuição de outra IA.

## Próxima fase

Após a reconciliação, haverá uma segunda ordem explícita:
AUDITORIA -> PATCH AUTORIZADO -> IMPLEMENTAÇÃO -> TESTES -> REAUDITORIA.

Não antecipar essa segunda ordem.
