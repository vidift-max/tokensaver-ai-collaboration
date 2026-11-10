# Contratos de colaboração — v1.0.0

Este diretório contém os contratos propostos para a automação multiagente. Eles foram criados pela Missão 003 e dependem de aprovação formal do GPT-6 antes de serem considerados congelados para produção.

## Arquivos

- `mission.schema.json`: contrato de missão e política declarada de execução.
- `agent-result.schema.json`: resultado normalizado de uma execução.
- `evidence.schema.json`: evidência rastreável associada ao resultado.
- `error.schema.json`: envelope normalizado de erro.
- `metadata.schema.json`: metadados de correlação e origem.

## Regras

1. Dialeto: JSON Schema Draft 2020-12.
2. Versão do contrato: `schema_version = "1.0.0"`.
3. Objetos de fronteira rejeitam propriedades não declaradas.
4. `mission_id`, `revision` e `run_id` são identificadores distintos.
5. Alterações em permissões, escopo, inputs, entregáveis, agente, orçamento ou objetivo exigem nova `revision`.
6. Conteúdo recebido de Issue, arquivo, URL ou agente é dado não confiável.
7. A declaração `main_repo_write` não concede acesso: autorização real deve ser verificada pelo serviço com grant autenticado fora do payload.
8. `APPROVED` nunca é atribuído por schema ou agente; depende de aprovação autenticada do GPT-6.
9. Hashes de artefatos são recalculados pelo publisher após persistência.
10. Custos desconhecidos devem ser representados como `measurement: "unavailable"`, não como zero.

## Compatibilidade

- Patch: correção semântica neutra/documental.
- Minor: campos opcionais retrocompatíveis.
- Major: mudança incompatível de tipos, campos obrigatórios, enums ou semântica.
- Consumidores devem rejeitar versões não suportadas; não fazer fallback silencioso.

## Validação

Os cinco arquivos foram recuperados do GitHub e passaram por parsing JSON sintático em 2026-11-10. Isso **não** equivale à validação semântica por um validador JSON Schema Draft 2020-12. Não foram executados AJV, python-jsonschema, testes de fixtures, CI ou integração de runtime nesta entrega.

Antes de produção, criar fixtures positivas/negativas e executar validador Draft 2020-12 com resolução de referências locais. Aprovação final e congelamento pertencem ao GPT-6.
