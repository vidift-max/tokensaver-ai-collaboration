# Missão 034 — Adaptador Kimi

**Responsável:** ChatGPT / GPT-6 — integração e automação multiagente  
**Data:** 2026-11-10  
**Status:** REVIEW_REQUIRED

## Papel

O adapter Kimi é destinado a auditoria técnica independente, revisão adversarial, análise de consistência e identificação de riscos. A missão deve fornecer escopo, versão/ref imutável e critérios de evidência.

## Contrato

Recebe request 031, arquivos e commit de referência, checklist, criticidade e deadline. Retorna AgentResult v1 e uma lista estruturada de findings contendo ID, severidade, evidência exata, impacto, recomendação, confiança e status de reprodução. Achados sem reprodução são marcados como não verificados.

## Independência

- O auditor não altera o artefato auditado nem aprova seu próprio resultado.
- Não recebe permissão de escrita no produto principal.
- A auditoria deve registrar versão do modelo, commit, paths e limites da inspeção.
- Não afirmar execução de testes, leitura de arquivos ou acesso a settings sem evidência.
- Findings devem diferenciar bug reproduzido, risco plausível e lacuna de evidência.

## Critérios e testes

Mock de finding reproduzido/não reproduzido; arquivo ausente; diff alterado após auditoria; severidade inválida; tentativa de modificar o alvo; saída sem evidência; timeout e rate limit.

## Limitações

Nenhuma API Moonshot/Kimi foi chamada. Modelo, endpoint, quota, preço e recursos não foram presumidos. A independência real depende de execução separada e acesso somente leitura.

## RECOMENDAÇÃO AO GPT-6

Reservar Kimi para revisão independente de entregas de alto risco, com commit congelado e critérios de auditoria explícitos; não atribuir a ele aprovação final.
