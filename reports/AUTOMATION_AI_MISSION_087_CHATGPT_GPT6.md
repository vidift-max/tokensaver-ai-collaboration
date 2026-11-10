# Missão 087 — Prompt templates

- Nome da IA: ChatGPT — GPT-6 (OpenAI)
- Modelo: GPT-6
- Especialidade: arquitetura de prompts e segurança
- Data: 2026-11-10
- Status próprio: PARTIAL

## Especificação
Cada template contém template_id, semver imutável, purpose, owner, status (draft/review/approved/deprecated), input_schema, output_schema, body, variables tipadas, system_policy_ref, allowed_tools, model_constraints, token budgets, locale, created_at, approved_by, content_hash, changelog e fixtures. Publicação cria nova versão; latest é alias de resolução, não identificador persistido.

Placeholders são allowlisted e tipados. Conteúdo de usuário nunca é interpolado em instrução system/developer. Separar trust labels para instruções confiáveis, user request, source material e tool output. Ferramentas default-deny. Saída estruturada validada por JSON Schema. Template importado começa untrusted/draft. Templates com efeitos externos exigem aprovação humana.

Taxonomia inicial: context.extract, context.compress, editorial.brief, editorial.draft, editorial.fact_check, editorial.copy_edit, seo.audit, seo.internal_links e content.quality_gate.

## Segurança e testes
Bloquear variáveis que tentem definir system prompt, tool policy, approval state ou permissões. Testar placeholder injection, variable shadowing, schema inválido, tamanho excessivo, ferramenta desconhecida, rollback de versão, recursão e instruções maliciosas na fonte.

## Evidência
advanced.rs tem CRUD básico de templates; UI cria/lista, mas não expõe edição/exclusão/histórico. Não há prompt registry runtime. Relaciona-se às missões 078 e 042–044. Nenhuma implementação ou teste de provider foi executado.

## Alterações
Somente este relatório de colaboração; nenhum código principal alterado.

## Recomendação ao GPT-6
Aprovar schema e lifecycle imutável antes de conectar prompts a provider. Templates não podem conceder tool permissions nem aprovar publicação.

AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.