# Missão 087 — Prompt Templates

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: arquitetura de prompts, versionamento e segurança de templates
- Data: 2026-11-10 | Status: REVIEW_REQUIRED
- Produto de referência: HEAD `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f`, branch `v2-saas-alpha` (read-only)

## Objetivo
Especificar biblioteca versionada de prompts seguros, reutilizáveis e auditáveis, sem habilitar execução de modelos.

## Estado observado
`src-tauri/src/advanced.rs` contém CRUD básico de templates em SQLite: `save_template` faz UPSERT por ID, `list_templates` lista e `delete_template` exclui. O modelo tem id/name/content/updated_at, sem versionamento imutável, schema de variáveis, aprovação ou fixtures. A UI atual salva templates novos com id null; a funcionalidade não constitui biblioteca segura de prompts multiagente.

## Modelo proposto
- Entidade lógica PromptTemplate: template_id, slug, owner_scope, purpose, locale, risk_class, created_at.
- Versão imutável: version, content, variables_schema, system_policy_ref, model_constraints, max_input/output_tokens, status (DRAFT/REVIEW/APPROVED/DEPRECATED), sha256, author, reviewer, timestamps.
- Release pointer separado: versão APPROVED ativa por finalidade; rollback aponta para versão aprovada anterior sem reescrever histórico.
- Variáveis declaradas com JSON Schema estrito (tipo, tamanho, enum, required, pattern); rejeitar variável extra, missing ou inválida.
- Renderização sem avaliação de código: placeholders tipados, escape por contexto, sem eval, JS, shell, URL fetch ou template helper com I/O.

## Política de segurança
1. Separar system/developer policy de dados do usuário, fontes recuperadas e comentários externos.
2. Templates não podem conceder ferramentas, secrets, scopes ou permissões. Tool grants residem no host/policy engine.
3. Conteúdo de fonte é marcado como untrusted; delimitação textual não substitui validação host-side.
4. Proibir credenciais, dados pessoais desnecessários e instruções para exfiltração em exemplos/fixtures.
5. Prompt changes passam por revisão independente, diff semântico, hash e teste de regressão/adversarial.
6. Model output não pode alterar o template nem promover a própria versão a APPROVED.

## Fluxo de ciclo de vida
DRAFT → VALIDATION → REVIEW_REQUIRED → APPROVED → ACTIVE → DEPRECATED. Rejeição volta a DRAFT com feedback. Aprovação exige owner/reviewer distinto do autor para classes de risco elevadas. Versões nunca são editadas in-place.

## Biblioteca inicial recomendada
- brief_normalizer;
- research_query_planner;
- source_extraction;
- outline_builder;
- draft_writer;
- factual_claim_auditor;
- seo_on_page_auditor;
- internal_link_recommender;
- final_copy_editor;
- structured_output_repair.

Cada template deve declarar finalidade, entradas, saída JSON/Markdown esperada, limites, fontes permitidas, não objetivos e fixtures positivas/negativas. Não criar template genérico com acesso a ferramentas irrestritas.

## Testes/aceite
Validação schema de todas as variáveis; golden fixtures; injection corpus; tentativa de tool escalation; Unicode/HTML/Markdown escaping; placeholders desconhecidos; limite de tamanho; compatibilidade de versões; rollback; reprodutibilidade de hash. Exigir 100% de rejeição de variáveis não declaradas e zero side effects em testes de injection.

## Relação com anteriores
Aproveita contratos 003–010, matriz de least privilege 044 e defesa PI/TI 042–043. Gate 050 permanece NO-GO: nenhuma biblioteca deve acionar providers/tools até aprovação formal.

## Testes e limites
Leitura estática de `advanced.rs`, `src/api.ts`, `src/App.tsx` e documentação de segurança. Nenhum template foi persistido ou executado; nenhum teste automatizado foi executado. Produto principal intacto.

## Próximo passo
GPT-6 deve aprovar schema/versioning e política de review. Implementar primeiro storage/version history sem execução, com fixtures locais e migração aprovada.
