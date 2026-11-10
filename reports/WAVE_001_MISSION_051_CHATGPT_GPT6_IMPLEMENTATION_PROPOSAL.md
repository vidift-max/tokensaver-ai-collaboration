# WAVE 001 — Missão 051: Smart Context — orçamento global

- **Nome da IA:** ChatGPT — GPT-6 (OpenAI)
- **Modelo:** GPT-6
- **Especialidade:** arquitetura Rust/SQLite, segurança de filesystem e confiabilidade
- **Função:** proposta técnica independente pós-auditoria; somente leitura
- **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED
- **Branch analisada:** `v2-saas-alpha`
- **HEAD/arquivos:** evidências obtidas por fetch dos arquivos indicados; hashes anotados abaixo. Nenhum teste de runtime foi executado.

## Análise do problema atual
A função faz uma consulta ordenada de todas as versões atuais do projeto e lê cada blob integralmente antes de decidir se entra no ranking. `max_files.clamp(1,20)` limita apenas o vetor final. Portanto não limita linhas examinadas, bytes lidos, pico de memória, CPU gasto em lowercase/matches nem tempo. Um único blob muito grande pode causar pressão de memória; muitos blobs pequenos podem causar custo cumulativo ilimitado. Há também duplicação de memória: texto original, lowercase completo e vetor de chars dentro de `excerpt`.

## Evidências no código
- `src-tauri/src/smart_context.rs`, SHA `4f60ad434a18526e2293d16f663eca1c47e60a7d`: `smart_context` usa SELECT sem LIMIT; loop usa `fs::read_to_string`; cria `text.to_lowercase()`; `excerpt` cria `Vec<char>`; só aplica `hits.truncate(limit)` depois de todo o trabalho.
- `src-tauri/src/limits.rs`, SHA `07565208f5d9a3a3012ed5b68f6e1e09d0d46e6b`: limites existentes não definem budget de Smart Context.
- `src-tauri/src/lib.rs`: comando é exposto diretamente por `smart_context::smart_context`.

## Solução proposta
Criar um `ContextBudget` tipado e validado no início: máximo de arquivos examinados, bytes totais lidos, bytes por blob, bytes/itens de saída e deadline. Valores devem ser aprovados pelo produto e documentados em `limits.rs`, sem reutilizar automaticamente MAX_FILES_PER_BATCH como se fosse equivalente.

1. Aplicar `LIMIT max_files_scanned + 1` no SQL, com ordenação determinística; o elemento extra detecta truncamento. Isso limita a varredura do DB, não só hits.
2. Ler blobs por `File` + `Read::take(min(blob_budget, remaining_budget)+1)`; contar bytes reais, rejeitar/ignorar blob acima do limite conforme política explícita. Nunca confiar apenas em `byte_len` do banco.
3. Validar SHA/path e tipo de arquivo no mesmo handle aberto, idealmente via helper seguro compartilhado da Missão 063; evitar canonicalize→reopen.
4. Fazer matching em streaming/chunks com overlap suficiente para termos e excerpt; ou, como primeiro patch menor, impor teto pequeno por blob e usar `read_to_end` limitado. Evitar criar lowercase de todo blob; normalização por chunk precisa preservar UTF-8 e fronteiras de termo.
5. Ao esgotar budget, parar imediatamente e retornar metadados de truncamento (`budget_exhausted`, reason, files_scanned, bytes_read) em um response struct versionado. Não retornar sucesso silencioso como se o resultado fosse completo.
6. Ordenar hits determinística e manter o top-k com estrutura limitada, sem acumular hits ilimitados.

## Arquivos e funções envolvidos
- `src-tauri/src/smart_context.rs`: `smart_context`, `excerpt`, novo budget reader/matcher.
- `src-tauri/src/limits.rs`: constantes e limites versionados de arquivos, bytes/blob, bytes totais, deadline e saída.
- `src-tauri/src/path_guard.rs` ou módulo novo `safe_fs.rs`: abertura verificada de blob sem reabrir path (dependência Missão 063).
- `src/api.ts` e componente chamador em `src/App.tsx`: atualizar tipo/UX para resultado parcial e motivo do limite; confirmar caller atual antes de alterar.
- `src-tauri/src/lib.rs`: assinatura/registro só se response contract mudar.

## Invariantes de segurança
- O custo máximo de leitura é limitado por bytes e número de arquivos medidos, não por metadados.
- Nunca ler além do budget + 1 byte de detecção.
- Não atravessar symlink/junction nem ler blob fora do diretório autorizado.
- Um resultado truncado nunca é apresentado como busca completa.
- Erro de I/O, corrupção ou budget exhaustion não vira fallback silencioso.
- Deadline verificado durante o loop, não apenas no início.

## Riscos e dependências
- Streaming de UTF-8 e case-fold Unicode pode alterar ranking/excerpts; o MVP deve explicitar semântica lexical e preservar testes Unicode.
- Ordenação + SQL LIMIT pode enviesar resultados para paths iniciais; registrar truncamento e avaliar cursor/estratégia futura.
- Alterar Vec<ContextHit> para response struct exige atualização coordenada no frontend.
- Dependência alta da Missão 063 para identidade de handle e da Missão 058 para catálogo coerente de budgets.

## Testes necessários
- Unitários: budget exato, budget + 1, zero remaining, arquivo vazio, UTF-8 multibyte dividido em chunk, query Unicode, deadline e saída top-k.
- Integração: projeto com zero/1/limite/limite+1 arquivos; um blob > teto; total de blobs ultrapassando bytes totais; hash incorreto; blob fora de root/symlink.
- Concorrência/estresse: centenas/milhares de blobs em fixture; chamadas simultâneas no mesmo projeto; medir bytes realmente lidos e RSS em subprocesso.
- Regressão: mesmos resultados/ranking em fixtures abaixo do budget; UI sinaliza parcial.

## Critérios objetivos de aceite
- Contadores instrumentados provam `files_scanned <= max_files_scanned` e `bytes_read <= max_total_bytes`.
- Nenhum blob lido acima do teto por blob; deadline interrompe em prazo definido com tolerância documentada.
- Resultado contém estado de completude e reason; truncamento é visível.
- Sem regressão de confinamento/hash e testes Windows/Linux verdes.
- TESTE NÃO EXECUTADO: build, unit, integração, stress, benchmark e UI.

## Limitações
Análise estática; não foram medidos bytes, RSS ou latência reais. Valores numéricos finais de budgets precisam de decisão do GPT-6/owner e benchmark em hardware mínimo. Não há evidência de comportamento runtime nesta proposta.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- **arquivo:** `src-tauri/src/limits.rs` | **função:** constantes de limits | **mudança:** definir budgets nomeados e documentados para Smart Context | **teste:** unitário boundary de cada teto | **risco:** valores muito baixos reduzem recall.
- **arquivo:** `src-tauri/src/smart_context.rs` | **função:** `smart_context` | **mudança:** SQL scan cap, budget agregado, leitura limitada, deadline, top-k limitado e response parcial | **teste:** integração com muitos blobs e limites exatos | **risco:** mudança de ranking e contrato frontend.
- **arquivo:** `src-tauri/src/smart_context.rs` | **função:** `excerpt` e matcher | **mudança:** eliminar alocações proporcionais ao blob e tratar UTF-8/chunk | **teste:** Unicode, termo entre chunks, RSS | **risco:** diferença em case-fold e trecho.
- **arquivo:** `src-tauri/src/path_guard.rs` / novo `safe_fs.rs` | **função:** novo open blob verified | **mudança:** validar identidade no handle e confinamento | **teste:** symlink swap e path race | **risco:** diferenças de API por SO.
- **arquivo:** `src/api.ts`, `src/App.tsx` | **função:** caller Smart Context | **mudança:** apresentar truncamento/razão sem confundir com resultado completo | **teste:** componente para completed/partial/error | **risco:** incompatibilidade de tipo.

## Fontes consultadas e integridade
- Wave spec: `WAVE_001_IMPLEMENTATION_MISSIONS.md` SHA `6ac5f4213961fa991e272fd146708bf78d3570fd`.
- Protocolo: `CENTRAL.md` e `INSTRUCTIONS.md`.
- Relatórios anteriores individuais: `reports/AUTOMATION_AI_MISSION_051_CHATGPT_GPT6.md` (lido antes desta proposta); missões relacionadas consultadas conforme dependência: 054, 058, 064, 041 e 050.
- Código principal: hashes indicados nas seções de evidência. Nenhum arquivo do produto foi alterado.
- **TESTE NÃO EXECUTADO:** build, cargo test, CI, integração, stress e testes multi-plataforma.

**Decisão:** proposta técnica, não implementação. Depende de aprovação do GPT-6 integrador antes de qualquer patch.
