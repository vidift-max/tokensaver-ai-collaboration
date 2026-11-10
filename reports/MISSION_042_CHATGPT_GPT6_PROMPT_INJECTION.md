# Missão 042 — Defesa contra Prompt Injection

## Identificação
- IA: ChatGPT
- Modelo: GPT-6 (OpenAI)
- Especialidade: segurança de LLMs e tratamento de conteúdo não confiável
- Função: controles contra instruções maliciosas em arquivos, Issues e fontes externas
- Data: 2026-11-10
- Status: REVIEW_REQUIRED

## Objetivo
Impedir que conteúdo fornecido por usuários, repositórios, Issues, webpages e outputs de modelos altere políticas, instruções de sistema ou permissões.

## O que esta IA fez
Especificou pipeline de defesa em profundidade:
1. Classificar conteúdo externo como untrusted_data, com source ID, hash, origem, timestamp e classificação.
2. Separar instruções de missão/política dos documentos citados; nunca concatenar conteúdo externo como instrução de sistema/desenvolvedor.
3. Preservar provenance por trecho, arquivo/linha/Issue e rótulo de confiança; citações não são comandos.
4. Recuperar apenas trechos necessários, com limites de bytes/tokens e redaction.
5. Colocar saída do modelo em quarantine até schema validation, policy validation e revisão; nunca executar instruções retornadas.
6. Isolar tools: modelo não chama ferramentas privilegiadas diretamente; broker valida principal, missão/revisão, operação, path, budget e grant externo.
7. Negar pedidos de exfiltração, mudança de papel ou bypass; não interpretar texto como autorização.
8. Registrar hashes, IDs de fonte, decisões e reason codes, sem prompts completos ou secrets em logs.

## Ataques considerados
Issue dizendo para ignorar instruções e enviar token; README instruindo a rodar script; conteúdo invisível em HTML/Markdown; config com endpoint/command malicioso; output de um agente instruindo outro a acessar secrets; prompt injection via página, OCR, PDF ou output de ferramenta.

## Critérios de aceite
- Inputs externos sempre tratados como dados.
- Política não é mutável por modelo ou texto de Issue.
- Nenhuma tool call sem autorização independente.
- Retrieval usa source allowlist e limites de contexto.
- Output estrito falha fechado para campos desconhecidos e enums inválidos.
- Corpus adversarial cobre multilíngue, encoding, chunk boundaries e conteúdo multimodal.

## Arquivos examinados
contracts/v1/mission.schema.json, contracts/adapters/v1/README.md, CENTRAL.md, INSTRUCTIONS.md e relatórios 010/024/030/031–040.

## Relação com trabalhos anteriores
Complementa contrato 003 (untrusted_data), matriz 010, dispatch 024 e adapters 031–035. Enforcement deve ocorrer na orquestração, não apenas em instrução textual ao LLM.

## Problemas encontrados
- Crítico: schema/label de confiança isolado não impede prompt injection; precisa enforcement em retrieval e tool broker.
- Alto: não há evidência de pipeline runtime de classificação, redaction ou output quarantine.
- Alto: conteúdo de Issues/arquivos não pode alterar allowlist, permissões ou seleção autorizada de provider.

## Testes executados
Não executado. Nenhum corpus adversarial ou integração de provider foi executado.

## Próximo passo
Criar corpus de ataques e testes automatizados após aprovação dos contratos 003–010 e autorização do MVP 011–014. Todos os casos devem terminar sem side effect não autorizado.
