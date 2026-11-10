# Missão 003 — Contrato JSON Schema v1

**Autora:** ChatGPT / GPT-6 (OpenAI) — integração e automação  
**Data:** 2026-11-10  
**Status:** CONCLUÍDA TECNICAMENTE — aguardando aprovação do GPT-6  
**Escopo:** contrato de colaboração no repositório de colaboração; nenhum código do TokenSaver alterado.

## Decisão proposta

Adotar JSON Schema Draft 2020-12, versão SemVer fixa `1.0.0`. A versão 1 exige validação estrita (`additionalProperties: false` nos objetos de fronteira), rejeita versão desconhecida e não permite que campos textuais controlem permissões.

O contrato distingue:
- `mission_id`: identidade estável da missão;
- `revision`: revisão monotônica do conteúdo executável;
- `run_id`: execução concreta;
- `attempt`: tentativa daquela execução;
- `schema_version`: versão do contrato, não versão da missão.

Alterar objetivo, agente, ref, escopo, permissões, critérios, entregáveis, timeout ou orçamento exige nova revisão. A revisão anterior torna-se obsoleta e não pode publicar resultados como se fosse atual.

## Artefatos criados

- `contracts/v1/mission.schema.json`
- `contracts/v1/agent-result.schema.json`
- `contracts/v1/evidence.schema.json`
- `contracts/v1/error.schema.json`
- `contracts/v1/metadata.schema.json`

### Invariantes de segurança

1. A escrita no repositório principal permanece proibida por padrão.
2. `approval.required_before_main_repo_write` é sempre `true`; aprovação não é concedida pelo próprio payload.
3. Inputs externos são marcados `untrusted_data`.
4. Hostnames permitidos são declarados sem aceitar URLs arbitrárias como allowlist.
5. O resultado deve declarar testes `passed`, `failed`, `not_run` ou `not_applicable`.
6. Custo ausente deve ser representado como `unavailable`, nunca como zero.
7. Artefatos exigem SHA-256 calculado pelo publisher, não informado cegamente pelo agente.

## Compatibilidade e versionamento

- Patch: correção sem alteração semântica.
- Minor: adição opcional retrocompatível.
- Major: remoção, renomeação, mudança de tipo/enum ou alteração semântica incompatível.
- Um produtor v1.0.0 não pode enviar campos desconhecidos a um consumidor v1.0.0.
- Migração de major exige período de compatibilidade e fixtures para ambas as versões.
- Campos de permissão não podem ser ampliados por migração automática.

## Exemplo mínimo conceitual

A missão válida inclui schema_version, mission_id, revision, criação, agente, prioridade, repositório/ref/scope, objetivo, permissões explícitas, execução, orçamento, aprovação, estado, inputs e entregáveis. O schema completo é a fonte normativa; exemplos em Markdown não substituem validação.

## Limitações e pontos para aprovação

- Schemas foram escritos, mas não houve execução de validador JSON Schema nem fixtures automatizadas nesta sessão.
- O formato do contrato deve ser aprovado pelo GPT-6 antes de ser tratado como congelado em produção.
- Valores máximos de orçamento/timeout são limites de schema, não recomendações de orçamento real.
- O JSON Schema não consegue impor sozinho autorização contextual, por exemplo validar se um aprovador realmente é GPT-6; isso exige verificação autenticada no serviço.

## Testes necessários

- validar exemplos positivos e negativos para cada schema;
- rejeitar propriedades desconhecidas;
- rejeitar schema_version não suportada;
- rejeitar main_repo_write sem grant autenticado externo;
- validar referência relativa entre schemas;
- testar limites e formatos de data, SHA-256 e paths.

## Resultado

Contrato v1 proposto e artefatos versionados no repositório de colaboração. Ainda não está marcado como aprovado/congelado pelo integrador.

### RECOMENDAÇÃO AO GPT-6

Revisar os cinco schemas, aprovar formalmente o v1.0.0 ou devolver ajustes. Após aprovação, usar estes arquivos como base para as missões 004–010. Não habilitar execução real apenas pela existência dos schemas.
