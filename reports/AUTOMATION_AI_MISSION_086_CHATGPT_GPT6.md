# Missão 086 — Context optimization

- Nome da IA: ChatGPT — GPT-6 (OpenAI)
- Modelo: GPT-6
- Especialidade: arquitetura de IA e otimização de contexto
- Data: 2026-11-10
- Status próprio: PARTIAL

## Objetivo
Reduzir tokens sem remover fatos, restrições, proveniência ou qualificadores.

## Contribuição
Pipeline recomendado: (1) classificar instruções confiáveis, pedido atual, contexto, fontes e conteúdo externo não confiável; (2) normalização lossless somente em texto livre, nunca código/JSON/URLs/citações/texto legal; (3) chunking estrutural com path, offsets, hash e versão; (4) deduplicação exata com aliases e proveniência; (5) seleção lexical + metadados + recência + autoridade, diversidade e cobertura; (6) resumo com fatos atômicos, números/unidades, datas, exceções, incerteza e referências de origem; (7) allocator de budget para instrução, pergunta, evidência, resposta e margem; (8) auditoria de claims/constraints antes/depois.

Contrato por unidade: unit_id, source_id/version, content_hash, offsets, trust_label, kind, token_count, compression_method e preserved_claim_ids. Resultado reporta original_tokens, packed_tokens, omitted_units e razões, coverage, approximate, tokenizer e budget_version.

## Gates
100% de recall para constraints obrigatórias; 100% de rastreabilidade dos claims factuais; nenhuma perda silenciosa de número, unidade, negação, condição, data, ator, fonte ou exceção. Testar código, JSON, tabelas, multilíngue e instruções contraditórias. "Sem perda" só pode ser alegado após validação de equivalência.

## Evidência
smart_context.rs lê blobs integrais e percorre versões sem budget agregado; max_files limita apenas hits finais. limits.rs tem limites locais, não allocator global. UI não mostra cobertura/omissões.

## Relação com trabalhos anteriores
Leitura dos relatórios 051–070 e 071–085; risco de resource exhaustion no Smart Context e ausência de transparency na UI já documentados. Esta missão transforma esses achados em estratégia de packing com cobertura e proveniência.

## Testes
Somente leitura estática. Nenhum benchmark, tokenizer real, fixture de preservação ou teste de regressão executado.

## Alterações
Somente este relatório no repositório de colaboração. Nenhum código do produto principal alterado.

## Recomendação ao GPT-6
Priorizar budget global de bytes/arquivos/deadline no Smart Context antes de sumarização abstrativa. Criar gold set de claims/constraints e medir recall contra texto original. Não alegar lossless até cobertura 100% ser comprovada.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
