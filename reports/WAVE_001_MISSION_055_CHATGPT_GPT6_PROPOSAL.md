# WAVE 001 — Missão 055: Backup/Restore — budgets e manifest

## Identificação
- Nome da IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: Rust, SQLite, integridade de backup e gestão de recursos
- Função: proposta técnica independente pós-auditoria; somente leitura
- Data: 2026-11-10
- Status: PROPOSTA PRONTA PARA APROVAÇÃO

## Objetivo
Impedir que backup/restore consumam memória, CPU, tempo ou espaço em disco sem limite, mantendo validação criptográfica, integridade SQLite e publicação via staging.

## Análise do problema atual
O restore lê `manifest.json` integralmente com `fs::read`, desserializa um vetor de tamanho não limitado e percorre/hash todos os blobs. O banco é hasheado sem teto de bytes. Os blobs têm hash e tamanho individuais validados, e o conjunto manifesto↔banco é comparado, mas não há limites explícitos para quantidade, tamanho individual, soma dos blobs, tamanho do banco ou bytes do manifesto.

O backup também percorre e copia todos os blobs, calcula hashes e gera manifesto sem budget agregado. O hashing usa buffer de 64 KiB (memória por bloco limitada), mas isso não limita bytes/CPU/tempo nem staging/disk usage. A validação atual é relevante e deve ser preservada.

## Evidências no código
- `src-tauri/src/backup.rs::restore_project_backup`: `fs::read(manifest_path)`, parse para `BackupManifest { blobs: Vec<_> }`, hash completo do DB e de cada blob.
- `backup.rs::hash_file`: loop streaming de 64 KiB sem parâmetro de limite.
- `backup.rs::create_project_backup`: itera registros de blob, copia cada arquivo e acumula `manifest_blobs` sem orçamento global.
- Restore já verifica format/schema version, SHA-256, tamanho declarado do blob, foreign keys, `PRAGMA integrity_check`, igualdade das listas e staging. A proposta não substitui essas verificações.
- `src-tauri/src/limits.rs`: não há constantes específicas de backup/restore.
- HEAD do produto consultado: `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`.

## Solução proposta
1. Definir em `limits.rs` limites separados para manifest bytes, blob count, DB bytes, blob bytes individual, total de payload (DB + blobs), e tempo total.
2. Valores candidatos para iniciar discussão/benchmark, não aprovados: manifest 16 MiB; até 10.000 blobs; DB até 512 MiB; blob individual até 10 MiB (compatível com o limite atual de importação individual); payload agregado até 2 GiB. Confirmar com tamanhos reais de projeto antes de congelar; reduzir/elevar somente com evidência.
3. Refatorar `hash_file` para aceitar um teto e contar bytes reais; abortar assim que o limite for excedido, usando checked_add para evitar overflow.
4. No restore, abrir manifest com leitura limitada a `MAX_MANIFEST_BYTES + 1`; rejeitar antes do parse se exceder. Aplicar `#[serde(deny_unknown_fields)]` ao manifest e aos itens para rejeitar campos inesperados no formato v1, desde que fixtures existentes confirmem compatibilidade.
5. Validar imediatamente: versão, project_id, schema, tamanho/forma dos hashes, nomes de arquivo, quantidade máxima, duplicatas, somatório com checked_add e limites por item. Nunca alocar/iterar uma coleção ilimitada.
6. Validar metadata real de DB e blobs antes de hashing/cópia; ainda assim, contar bytes durante leitura/hash porque metadata pode ficar desatualizada sob mutação concorrente.
7. No backup, consultar COUNT/SUM de blobs e tamanhos do DB antes da cópia; aplicar o mesmo budget durante cópia/hash e antes de serializar manifesto. Rejeitar antes de encher staging.
8. Manter staging e cleanup; garantir que erro de limite apague somente staging pertencente à operação. Não apagar backup anterior.
9. Verificar espaço livre estimado antes da operação como diagnóstico, mas não tratá-lo como garantia; o write pode falhar depois.
10. Adicionar um resultado de erro estável `BACKUP_LIMIT_EXCEEDED` ou códigos por dimensão; frontend deve exibir limite sem expor paths internos.

## Arquivos envolvidos
- `src-tauri/src/backup.rs`
- `src-tauri/src/limits.rs`
- `src-tauri/src/error.rs` (somente se padronização de código exigir)
- `src/api.ts` e `src/App.tsx` (mensagem/estado de limite, se o contrato atual não apresentar adequadamente)
- testes em `src-tauri/src/backup.rs` e/ou `src-tauri/src/tests.rs`

## Funções/módulos envolvidos
- `backup::restore_project_backup`
- `backup::create_project_backup`
- `backup::hash_file` (substituir por variante limitada)
- `backup::safe_blob_source`
- helpers novos: validar manifest, acumular budget, copiar/hash limitado

## Invariantes de segurança
- Manifest nunca é lido acima do teto.
- Contagem de blobs nunca excede máximo aprovado.
- Bytes reais de DB + blobs nunca excedem budget agregado.
- Hash SHA-256 e comparação de comprimento continuam obrigatórios.
- Cada path do manifesto é derivado de hash validado; sem path arbitrário.
- Banco deve passar integrity_check e foreign_key_check antes da publicação.
- Restore não publica staging parcial.
- Falha de quota não modifica backup original nem projeto existente.
- Somatórios usam checked_add e falham fechados em overflow.

## Riscos de regressão
- Backups antigos acima dos novos limites podem deixar de restaurar; documentar política de compatibilidade e erro explícito.
- Manifestos com campos adicionais podem ser rejeitados se deny_unknown_fields for habilitado; validar versões históricas.
- Limites baixos podem tornar backup de projeto válido impossível.
- Validar quota só após copiar mantém custo de disco; validar metadados antes e bytes reais durante a operação.
- Verificação de integridade SQLite pode consumir tempo proporcional ao DB; incluir no budget/deadline e testar.

## Dependências
- Missão 058: catálogo único de limites e política de budgets.
- Missão 059: deadline/cancelamento efetivo para operações longas.
- Missão 056: publicação segura do diretório de destino.
- Missão 063: resolução segura de paths, rejeição de links/reparse e mitigação de TOCTOU.
- Aprovação dos valores candidatos pelo integrador/produto.

## Testes necessários
### Unitários
- Manifest exatamente no limite e limite+1.
- Quantidade de blobs no máximo e máximo+1.
- DB e blob individual no limite e limite+1.
- Soma total exata e overflow de u64.
- Hash/tamanho incorreto, hash inválido, duplicata, filename não canônico e campo desconhecido.
- Leitura limitada interrompe no primeiro byte excedente.

### Integração
- Backup e restore de projeto pequeno e de maior volume dentro dos budgets.
- Manifest grande, DB oversized, blob oversized e conjunto com soma excessiva; nenhum staging publicado.
- Falha em cada fase de cópia/hash/manifest; cleanup somente do staging da operação.
- Garantir integridade SQLite, foreign keys e equality manifest↔DB continuam validados.
- Backup antigo válido no limite de compatibilidade.

### Concorrência/estresse
- Arquivo alterado durante hash/cópia: bytes reais e hash devem detectar divergência ou falhar.
- Múltiplas operações simultâneas limitadas por semaphore global para impedir multiplicação do consumo por operação.
- Disco quase cheio e falha de write: sem backup/restore parcial publicado.
- Medir CPU/RSS/disk para projetos nos limites.

## Critérios objetivos de aceite
1. Todos os limites são verificados antes e durante o processamento.
2. O restore nunca lê manifest ou payload acima dos budgets.
3. O backup também está protegido por budgets simétricos.
4. Hash, integridade SQLite, FK e staging existentes continuam passando.
5. Toda falha remove apenas staging próprio e deixa origem/destino intactos.
6. Testes de fronteira, corrupção, falha e stress passam em Windows/Linux.
7. Valores finais são justificados por benchmark e compatibilidade de dados reais.

## Limitações
- Não foi possível obter distribuição real de tamanhos de projeto/backup; os valores listados são candidatos, não requisitos aprovados.
- A inspeção é estática. Nenhum teste de disco, stress, backup ou restore foi executado.

## Testes executados
**TESTE NÃO EXECUTADO.** Nenhum build, cargo test ou teste de restore foi executado.

STATUS: PROPOSTA PRONTA PARA APROVAÇÃO

### PATCH PLAN
- arquivo: `src-tauri/src/limits.rs`; função/módulo: constantes; mudança: declarar limites separados de manifest, blobs, DB, payload e deadline; teste: fronteiras e overflow; risco: incompatibilidade com backups históricos.
- arquivo: `src-tauri/src/backup.rs`; função: `hash_file`; mudança: variante limitada que conta bytes reais e aborta no teto; teste: arquivo exato/limite+1 e mutação; risco: chamadas atuais precisam receber budget.
- arquivo: `src-tauri/src/backup.rs`; função: `restore_project_backup`; mudança: bounded manifest read, validação de contagem/soma/tamanhos antes de staging, hash limitado; teste: manifest/DB/blob/payload oversized; risco: rejeitar backup válido legado.
- arquivo: `src-tauri/src/backup.rs`; função: `create_project_backup`; mudança: pré-checagem DB/COUNT/SUM e budget durante cópia/hash/manifest; teste: projeto acima do teto e disk full; risco: operação abortada após iniciar staging.
- arquivo: `src-tauri/src/backup.rs`; função: helper de validação de manifest; mudança: schema estrito, duplicatas e nomes canônicos; teste: fixtures malformadas/versão v1; risco: campos opcionais de versões anteriores.
- arquivo: `src-tauri/src/api.ts` e `src/App.tsx`; funções: backup/restore handlers; mudança: mensagem de limite estável; teste: UI integration; risco: erro não mapeado.
