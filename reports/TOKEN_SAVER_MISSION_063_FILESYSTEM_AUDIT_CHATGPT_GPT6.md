# Missão 063 — Filesystem audit: paths, symlinks, junctions e TOCTOU

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: auditoria de segurança filesystem multiplataforma
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — auditoria estática parcial

## Objetivo
Auditar confinamento físico de diretórios, symlinks, junctions/reparse points e corridas TOCTOU.

## O que esta IA fez
Inspecionou `lib.rs`, `path_guard.rs`, `smart_context.rs`, `project_memory.rs`, `file_center.rs`, `backup.rs`, `advanced.rs` e achados ISO-01/BLOB-01/IMP-01.

## Evidência
- Vários módulos constroem `storage/projects/{project_id}` localmente e abrem `db.sqlite`; não há resolvedor canônico compartilhado demonstrado em todos os módulos.
- Smart Context/File Center canonicalizam blobs e verificam confinamento em seus fluxos, mas isso ocorre após resolver/abrir o DB do projeto.
- Backup possui verificações `symlink_metadata` em diretórios/arquivos relevantes; o projeto raiz e operações adjacentes ainda precisam de prova consistente contra troca concorrente.
- OneShot usa exists/metadata/read que seguem symlinks e não reutiliza o helper seguro.
- path_guard contém canonicalização e verificações de links em operações de import, mas load/save roots possui corrida de arquivo de configuração.
- Nenhum teste Windows de junction/reparse point foi executado.

## Problema e gravidade
ALTO — a segurança é implementada por módulos, sem garantia comprovada de resolução única e resistente a TOCTOU em todas as fronteiras.

## Solução proposta
Criar ProjectRoot/VerifiedPath abstraction única; abrir diretórios com APIs handle-relative/no-follow quando suportadas; validar cada componente e revalidar antes de uso; no Windows rejeitar reparse points/junctions; não confiar apenas em canonicalize seguida de open. Documentar diferenças de plataforma.

## Testes necessários
Symlink no storage, projects, project_id, blobs, backup, manifest, roots e temporários; junction/reparse; troca concorrente entre validação e open; paths case-insensitive/UNC; Linux/Windows; garantir que nenhum arquivo externo seja lido/escrito.

## Testes executados
Não executado. Apenas inspeção estática.

## Arquivos alterados
Nenhum.

## Relação com trabalho anterior
Consolida ISO-01 e BLOB-01; preserva que alguns fluxos já têm checks de symlink/hash. Não afirma que toda operação é explorável.

## Dependências e limitações
Auditoria parcial baseada em arquivos lidos; exige testes reais em Windows/Linux e autorização para implementar.

## RECOMENDAÇÃO AO GPT-6
Priorizar resolvedor seguro de projeto e abstração de handles antes de refatorações cosméticas; exigir testes de junctions no Windows.
