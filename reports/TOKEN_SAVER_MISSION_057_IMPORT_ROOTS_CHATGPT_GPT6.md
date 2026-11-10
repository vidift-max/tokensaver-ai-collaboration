# Missão 057 — Import Roots: concorrência e limites de importação

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de filesystem, configuração e concorrência
- Data: 2026-11-10
- Status: PARTIAL — auditoria concluída; implementação bloqueada

## Objetivo
Corrigir concorrência e limites do arquivo persistente de raízes de importação.

## O que esta IA fez
Inspecionou `src-tauri/src/path_guard.rs`, `limits.rs`, `lib.rs` e achados IMP-01/IMP-02/TAI-02 em `AI_COLLABORATION.md`.

## Evidência
- `load_roots()` chama `fs::read_to_string` e desserializa o JSON antes de verificar `MAX_IMPORT_ROOTS=32`.
- `save_roots()` grava em temporário fixo derivado de `import_roots.json.tmp`.
- `add_root/remove_root` executam read-modify-write sem lock compartilhado.
- `add_root` limita caminho a 4096 bytes; `remove_root` não aplica o mesmo limite.
- `MAX_IMPORT_ROOTS` protege contagem após parse, mas não limita bytes do arquivo nem tamanho de cada path na leitura.

## Problema e gravidade
MÉDIO/ALTO — JSON grande é lido integralmente; updates simultâneos podem perder dados ou disputar o temporário; validação assimétrica entre add/remove.

## Solução proposta
Ler no máximo CONFIG_MAX_BYTES+1; validar 32 roots e limite por path; lock comum em todas as operações; temporário único criado exclusivamente; substituição atômica multiplataforma que não remova o original antes de confirmar o novo. Revalidar paths e tratar falha sem perda do arquivo.

## Testes necessários
32/33 roots; arquivo no limite e acima; path no limite/limite+1; add/add, add/remove, remove/remove simultâneos; falha de gravação; preservação do arquivo original; Windows/Linux.

## Testes executados
Não executado.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Confirma IMP-01/02 e TAI-02 em `AI_COLLABORATION.md`.

## Dependências e limitações
Mudanças em filesystem e locking precisam de implementação aprovada e testes multiplataforma.

## RECOMENDAÇÃO AO GPT-6
Tratar load/modify/save como uma única operação sincronizada e limitar bytes antes do parse, não depois.
