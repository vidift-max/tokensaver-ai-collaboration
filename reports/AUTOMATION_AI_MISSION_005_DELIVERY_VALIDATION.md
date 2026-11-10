# Missão 005 — Validação automática de entregas e evidências

**Autora:** ChatGPT / GPT-6 (OpenAI) — integração e automação  
**Data:** 2026-11-10  
**Status:** CONCLUÍDA — especificação pronta para revisão

## Pipeline de validação

1. **Identidade:** mission_id, revision, run_id, agente e attempt correspondem ao claim ativo.
2. **Contrato:** AgentResult valida contra `contracts/v1/agent-result.schema.json`.
3. **Estado:** missão ainda está RUNNING e o lease/fencing token apresentado é atual.
4. **Entregáveis:** todos os deliverables required estão presentes no path permitido.
5. **Integridade:** publisher calcula SHA-256 e tamanho dos bytes armazenados.
6. **Evidência:** cada evidência possui fonte rastreável; refs, paths e URLs pertencem ao escopo autorizado.
7. **Testes:** status e evidência coerentes; `passed` exige log/Workflow ID/comando reproduzível; `not_run` nunca é promovido a sucesso.
8. **Segredos:** varredura de credenciais, tokens, chaves privadas e padrões sensíveis antes da publicação.
9. **Orçamento:** custo medido/estimado somado às tentativas não ultrapassa o teto.
10. **Publicação:** grava artefatos imutáveis e um manifest; depois transiciona para REVIEW_REQUIRED.

## Resultado da validação

- `ACCEPT`: todas as verificações obrigatórias passam; permite REVIEW_REQUIRED, nunca APPROVED.
- `REJECT`: payload inválido, identidade divergente, hash incorreto, path fora do escopo, permissão violada ou evidência adulterada.
- `QUARANTINE`: suspeita de segredo, prompt injection operacional, arquivo malicioso ou conteúdo que requer revisão de segurança.
- `RETRY_VALIDATION`: falha transitória no serviço de validação/storage, sem nova chamada ao agente.

## Manifesto de evidências

Cada artefato publicado deve ter: artifact_id, mission_id, revision, run_id, relative_path, media_type, size_bytes, sha256, created_at, uploader_identity e validation_status. O manifest é append-only e assinado pelo serviço de publicação quando possível.

## Regras críticas

- O agente não pode autodeclarar hash como prova: o serviço recalcula.
- Uma URL externa não é evidência suficiente sem snapshot, digest ou referência temporal verificável.
- Caminhos absolutos, traversal (`..`), symlinks e links para fora do workspace são rejeitados.
- Não executar arquivos recebidos para “validá-los”.
- Saída textual do agente é dado não confiável; não pode alterar permissões ou estado.
- Relatório sem testes executados deve declarar explicitamente “não executados”.
- Aprovação editorial/técnica é decisão humana/integrador, fora do validador automático.

## Casos de teste requeridos

- schema inválido e campo desconhecido;
- resultado de outra revisão/run;
- artifact ausente, duplicado ou hash divergente;
- path traversal, symlink e URL não permitida;
- teste marcado passed sem evidência;
- segredo detectado;
- custo excedido;
- evento duplicado;
- storage indisponível;
- publisher repetido sem comentário/artefato duplicado.

## Limitações

Especificação documental; nenhum validador foi implementado nem executado. Scanner de segredos pode produzir falso positivo e exige quarentena/revisão.

### RECOMENDAÇÃO AO GPT-6

Aprovar critérios ACCEPT/REJECT/QUARANTINE. Implementar validador puro sobre fixtures antes de acoplá-lo ao webhook ou a qualquer agente real.
