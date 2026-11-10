# WAVE 001 — RECONCILIAÇÃO TÉCNICA E PATCH PLAN CONSOLIDADO

Data: 2026-11-10
Integrador: ChatGPT — GPT-6
Branch: v2-saas-alpha

## Status
REVIEW CONSOLIDADO — PRONTO PARA AUTORIZAÇÃO DE IMPLEMENTAÇÃO

Esta etapa reconcilia as propostas das missões 051, 052, 055, 056, 057 e 063. Nenhum código do produto foi alterado nesta etapa.

## Decisão arquitetural

A principal conclusão é que as seis missões não devem ser implementadas como seis correções isoladas. Existe uma dependência transversal:

**063 — filesystem seguro → base para 051/055/056/057**
**058/059 — catálogo de limites e operações longas → base para 051/055/057**
**051/052/055/056/057 — correções funcionais específicas**
**testes → reauditoria → release gate 070**

Não aprovar uma grande refatoração de uma vez. A implementação deve ser incremental, com commits pequenos e testes após cada camada.

## Prioridade P0

### P0-1 — 052 Project Memory
Correção pequena e de alto valor.

Implementar `set_project_memory` usando `TransactionBehavior::Immediate`, mantendo existência + COUNT + UPSERT + COMMIT na mesma transação.

Aceite obrigatório:
- nunca > 1000 entradas por project_id;
- update de chave existente continua permitido em 1000;
- teste com múltiplas conexões e 999 entradas.

### P0-2 — 056 Restore Destination
Eliminar check-then-rename.

Criar primitive de publicação no-replace por plataforma. Não usar `exists + rename` como garantia de exclusividade. O target existente jamais pode ser substituído.

Além do restore, `initialize_project` deve participar do mesmo protocolo de claim/criação exclusiva do project ID, evitando corrida restore × initialize.

Aceite obrigatório:
- duas restaurações concorrentes: exatamente uma publica;
- target preexistente permanece intacto;
- ausência de suporte nativo resulta em fail-closed.

### P0-3 — 051 Smart Context
Adicionar orçamento agregado real.

Não aceitar somente `max_files` como proteção.

Budget deve limitar:
- arquivos examinados;
- bytes reais lidos por blob;
- bytes agregados;
- saída/excerpts;
- deadline cooperativo.

Resultado parcial precisa ser explicitamente marcado.

Os números sugeridos nos relatórios são CANDIDATOS, não devem ser congelados sem benchmark.

### P0-4 — 055 Backup/Restore
Adicionar budgets antes e durante processamento.

Obrigatórios:
- manifest bytes;
- blob count;
- DB bytes;
- blob individual;
- payload agregado;
- deadline;
- staging.

Preservar integralmente as validações existentes de SHA, SQLite integrity/FK, manifest↔DB e staging.

Não aprovar `deny_unknown_fields` até verificar compatibilidade dos backups históricos.

## Prioridade P1

### P1-1 — 057 Import Roots
Corrigir lost update e atomicidade.

Preferência inicial: manter o JSON e implementar:
- leitura limitada antes do parse;
- validação centralizada;
- lock cross-process;
- temp exclusivo;
- flush/sync;
- replace atômico sem apagar o original antes;
- limite de 32 aplicado sob lock.

A migração para SQLite deve ser considerada separadamente. Não introduzir uma migração de persistência nesta mesma correção sem necessidade comprovada.

### P1-2 — 063 Filesystem
Não fazer uma reescrita completa do filesystem antes dos P0.

Criar primeiro um módulo pequeno e bem testado de primitives seguras, começando pelas necessidades concretas de 056/055/051/057.

Primitives candidatas:
- abertura segura de arquivo;
- identidade do handle;
- cópia/hash limitada;
- publish no-replace;
- atomic replace;
- cleanup pertencente à operação.

A abstração deve ser adotada gradualmente. Não substituir todas as APIs do projeto de uma vez.

## O que NÃO aprovar agora

1. Não congelar números de budgets sem benchmark.
2. Não migrar Import Roots para SQLite nesta primeira rodada.
3. Não adicionar várias crates nativas de filesystem sem verificar OS suportados, licença e necessidade.
4. Não prometer TOCTOU absoluto em todas as plataformas sem testes reais.
5. Não usar fallback permissivo para `rename`, symlink/reparse ou primitive de segurança não suportada.
6. Não alterar contratos frontend sem inventário dos consumidores.
7. Não habilitar `deny_unknown_fields` em backups sem corpus de compatibilidade.
8. Não executar uma refatoração global de todos os módulos de filesystem em um único commit.

## Ordem oficial de implementação

### Fase A — correção simples
1. 052 Project Memory
2. testes concorrentes 052

### Fase B — primitive de publicação
3. 063: primitive mínima de publish no-replace
4. 056: restore usando publish no-replace
5. initialize_project usando o mesmo protocolo
6. testes de corrida 056

### Fase C — budgets
7. 063: primitive bounded stream/hash
8. 051: Smart Context budget
9. 055: Backup/Restore budget
10. testes de limites, corrupção e stress

### Fase D — configuração
11. 057: lock + bounded JSON + atomic replace
12. testes concorrentes e de falha

### Fase E — hardening transversal
13. ampliar 063 para consumidores restantes, somente após os testes anteriores
14. reauditar 051/052/055/056/057/063
15. atualizar 058/059/064 conforme evidências
16. executar regressão 065/066
17. revisar CI/Tauri/frontend 067–069
18. reavaliar 070 Release Readiness

## Política de implementação

Nenhuma proposta desta reconciliação autoriza alteração automática do código principal.

A autorização de patch deve identificar:
- missão;
- arquivos;
- funções;
- commit/branch alvo;
- testes obrigatórios;
- critérios de aceite.

Cada patch deve:
1. ser pequeno;
2. compilar;
3. executar testes relevantes;
4. registrar exatamente o que foi executado;
5. não declarar testes não executados como aprovados;
6. passar por reauditoria antes da próxima camada.

## Testes mínimos obrigatórios

### 052
Concorrência real com múltiplas conexões SQLite.

### 056
Concorrência real entre processos/threads e target criado durante o intervalo de validação.

### 051
Limite por arquivo, limite agregado, truncamento, UTF-8 e medição de bytes reais.

### 055
Manifest oversized, blob oversized, DB oversized, payload total, corrupção e falha de staging.

### 057
Lost update, limite 32, JSON oversized, falha de replace e concorrência.

### 063
Linux + Windows no mínimo, e macOS se oficialmente suportado; symlink/junction/reparse, TOCTOU e primitives de publicação.

## Critério de saída da Wave 001

A Wave 001 só será considerada IMPLEMENTADA quando:
- todos os P0 estiverem corrigidos;
- testes obrigatórios passarem;
- P1 estiver concluído ou explicitamente aceito como exceção;
- nenhuma regressão crítica for encontrada;
- reauditoria confirmar as invariantes;
- 070 puder ser reavaliada com evidência real.

## Conclusão

A melhor solução não é escolher uma única proposta de uma IA. É combinar as partes fortes:

- 052: correção transacional mínima;
- 056: publicação no-replace real;
- 051/055: budgets medidos por bytes reais;
- 057: persistência serializada e atomicidade;
- 063: primitives de filesystem seguras, introduzidas gradualmente.

**STATUS: RECONCILIAÇÃO PRONTA PARA AUTORIZAÇÃO DE PATCH**

**IMPORTANTE:** este documento é um plano consolidado. Ele NÃO é autorização para modificar o código principal.
