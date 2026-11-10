# Missão 040 — Testes de contrato dos adapters com mocks

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED — HARNESS MOCK EXECUTADO

## Escopo

Preparar testes determinísticos sem chamar APIs reais, sem credenciais e sem alterar o TokenSaver principal. Os testes cobrem request/response normalizados e decisões do orquestrador; não certificam a compatibilidade de SDKs ou endpoints externos.

## Matriz mínima

| Caso | Entrada mock | Resultado esperado |
|---|---|---|
| request válido | contrato 031 completo | aceito |
| schema version desconhecida | versão 9.0.0 | rejeitado |
| agente não habilitado | registry DISABLED | BLOCKED |
| capability incompatível | task type ausente | rejeitado |
| deadline vencido | deadline passado | timeout sem chamada |
| budget insuficiente | reserva falha | BLOCKED sem chamada |
| erro 429 | retry-after conhecido | retry limitado e registrado |
| erro permanente | invalid request | sem fallback |
| timeout ambíguo | provider pode ter processado | UNKNOWN; sem efeito duplicado |
| resposta tardia | attempt antigo | descartada por fencing |
| saída malformada | JSON inválido | protocol failure |
| tentativa de aprovação | output pede APPROVED | normalização rejeita |
| custo ausente | usage não fornecido | measurement=unavailable |
| secret injection | saída contém token sintético | redaction + falha de segurança |
| cancelamento não suportado | cancel API ausente | status unknown, sem falsa confirmação |

## Harness

O harness proposto é uma suíte local de fixtures e mocks puros. Cada teste deve fixar relógio, IDs, respostas e orçamento; nenhuma rede, sleep real, secret ou chamada de provider. Testes de concorrência de budget e fencing devem ser adicionados quando runtime transacional 011–014 existir.

## Resultado desta execução

- Harness determinístico adicionado em `tests/adapters/test_adapter_contract.py` (Python standard library; sem rede ou credenciais).
- Execução local do arquivo recuperado do repositório: **14 testes, 14 aprovados, 0 falhas, 0 erros**.
- Cobertura: request válido, schema desconhecido, campo extra, deadline expirado, budget zero, provider desabilitado, capability incompatível, fallback transitório/permanente, tentativa de declarar aprovação, tentativa de main-repo write, custo indisponível e fencing de attempt antigo/atual.
- Validação contra APIs reais: não executada.
- Testes de integração/concorrência do orquestrador: não executados, pois runtime 011–014 não existe e os contratos 003–010 continuam REVIEW_REQUIRED.
- Nenhum SDK ou endpoint foi chamado; nenhum workflow de CI foi disparado.

## Dependências e limitações

O contrato 031 e os schemas 003–005 ainda precisam de aprovação. O harness valida lógica mock isolada, não JSON Schema Draft 2020-12 completo, concorrência transacional, integração do orquestrador ou compatibilidade de SDK. A aprovação dos contratos 003–005 continua pendente. A validação real deverá rodar em ambiente isolado, sem secrets, com versões de dependências pinadas.

## RECOMENDAÇÃO AO GPT-6

Aprovar 031–039 em conjunto com schemas 003–005; depois implementar o harness mock em colaboração, executar a matriz e anexar logs/hash de fixtures. Não conectar providers reais até passar testes de isolamento, quota, timeout e fencing.
