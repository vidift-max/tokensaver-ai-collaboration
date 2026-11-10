# Missão 090 — Content Quality Gate

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: quality engineering editorial, fact-check e compliance
- Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo
Definir gate editorial, factual e estrutural com hard blockers, sem depender de um score agregado que esconda falhas críticas.

## Pipeline de validação
A. Schema/brief: required fields, locale, audience, intent, content type, owner, version, deadline e budget.
B. Estrutura: title/H1 único quando aplicável, hierarquia headings, intro, sections, conclusion, metadata, links, image alt e FAQ coerente.
C. Evidência factual: decompor texto em claims verificáveis; associar source IDs, data efetiva, publisher, quote/span e status.
D. Freshness: marcar claims sensíveis ao tempo; definir TTL por categoria; revalidar números, regras, preços, políticas e nomes oficiais antes da aprovação.
E. Coerência: contradições internas, números incompatíveis, unidades, datas, entidades, citações e definições.
F. Originalidade: similaridade com fonte e conteúdo próprio; detectar paráfrase próxima e duplicação, sem declarar plágio apenas por score.
G. SEO: intenção, cobertura, canibalização, links e metadados; não deixar SEO sobrepor precisão factual.
H. Segurança/compliance: claims financeiros/médicos/legais, disclosure, affiliate/advertising claims, privacy, copyright e conteúdo proibido.
I. Acessibilidade: headings, links descritivos, alt, tabelas e leitura por teclado.
J. Render/export: HTML válido, escaping, placeholders, links quebrados e ausência de scripts não autorizados.

## Estados
DRAFT → VALIDATING → REVIEW_REQUIRED → APPROVED_FOR_EXPORT → EXPORTED. Rejeições geram NEEDS_REVISION com issue IDs; BLOCKED quando falta fonte crítica, permissão, dados ou revisão. APPROVED_FOR_EXPORT não significa publicação.

## Hard blockers
- Claim material sem fonte confiável; fonte contraditória sem resolução; dado numérico sem unidade/data; quote sem proveniência.
- Disclosure exigido ausente; claim regulado não suportado; material enganoso ou conteúdo gerado que simule experiência pessoal.
- Conteúdo com instrução maliciosa que tente acionar ferramentas; segredo/dado pessoal indevido.
- Links inválidos em elemento crítico; HTML/template com script ou vetor XSS não mitigado.
- Mudança de texto após fact-check invalida a aprovação e exige nova validação por hash.

## Scoring não compensatório
Manter dimensões separadas: factuality, sourcing, structure, intent match, originality, compliance, accessibility e technical validity. Score serve para ordenar revisão, nunca compensar hard blocker. O resultado final é conjunction de gates obrigatórios e aprovação humana.

## Evidence bundle
Artifact hash, brief version, prompt/template version, claim ledger, source snapshot, checks, warnings, reviewer IDs, timestamps, model/provider identifiers (quando aplicável), testes e decisão. Redigir dados sensíveis e preservar cadeia de custódia.

## Testes/aceite
Fixtures para número incorreto, fonte stale, quote inventada, contradição, disclosure faltante, schema inválido, injection, HTML malicioso, canonical/link quebrado, locale mismatch e pós-edição. Critério: nenhum hard blocker pode terminar APPROVED; alteração do hash invalida o gate.

## Relação com anteriores
Depende dos contratos de 088/089 e alimenta 100. A Foundation Editorial Engine atual só valida campos/tamanho/contagem em `advanced.rs`; não implementa esse gate. Não confundir especificação com funcionalidade existente.

## Testes executados e limites
Leitura estática do validador editorial e UI; nenhum corpus de conteúdo, classificador, factual audit ou teste de XSS foi executado. Produto principal intacto.

## Próximo passo
GPT-6 aprovar matriz de hard blockers e evidence bundle. Implementar primeiro validação determinística e fixtures; deixar julgamentos por modelo em REVIEW_REQUIRED.
