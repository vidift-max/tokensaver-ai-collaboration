# Missão 085 — PRODUCT DOCUMENTATION

- **Agente:** ChatGPT — GPT-6
- **Data:** 2026-11-10
- **Produto/HEAD:** `vidift-max/tokensaver-ai` `935b6fc5d0c126e93697a16f73d56bb3a4d1e55f` (read-only)
- **Status:** PARTIAL

## Objetivo
Criar documentação de uso baseada no produto real.

## Guia de uso verificado
1. Confira o status do backend local no cabeçalho.
2. Use um project ID válido (até 64 caracteres alfanuméricos, hífen ou underscore).
3. Em Settings, autorize uma pasta absoluta que contenha arquivos de origem.
4. Em File Center, importe TXT, MD, JSON, HTML ou CSS com caminho de origem autorizado e caminho lógico como `articles/example.md`.
5. A UI do File Center mostra apenas a primeira página de 50 arquivos; o backend suporta paginação, mas o frontend ainda não oferece navegação.
6. Smart Context realiza busca local determinística e mostra até oito hits; não é uma conexão com provedor de IA.
7. Safe Optimizer remove espaços finais e linhas vazias redundantes de forma conservadora.
8. A estimativa de tokens é local, baseada em caracteres; não equivale à contagem exata do provedor.
9. Cost Simulator usa preços por milhão informados manualmente em USD; não consulta preços atuais nem faturas.
10. Backup Center cria backup verificado e permite restaurar para um novo project ID.
11. Integrity Guardian verifica blobs e referências.
12. Project Memory guarda pares chave/valor localmente; evite inserir segredos.
13. Template Master salva templates com placeholders `{{title}}` e `{{body}}`; a UI não mostra histórico de versões.
14. Editorial Engine faz validação básica de tamanho e contagem; não gera texto nem publica.
15. Article Library lista metadados; Internal Links pontua termos encontrados nos caminhos, não compreende semanticamente o conteúdo.
16. Final Page Builder gera HTML para inspeção em textarea; não publica nem renderiza preview.
17. OneShot Capture grava texto no projeto; confira o resultado persistido antes de assumir recuperação.
18. Claude Connection guarda endpoint/model/enabled; transporte de rede e armazenamento seguro de credenciais não estão implementados nesta fase.
19. History exibe operações registradas pelo backend.

**Avisos:** estimativas de tokens/custo não equivalem à cobrança real. Não inserir credenciais ou dados sensíveis em memória/arquivos sem política de proteção aprovada. O guia reflete somente o HEAD indicado.

## Evidências
`README.md`, `src/App.tsx`, `src/api.ts`, `src-tauri/src/lib.rs` e módulos correspondentes.

## Testes realmente executados
Checagem de afirmações por leitura estática; nenhum tutorial foi executado em instalação real.

## Limitações e dependências
Guia não descreve funcionalidades futuras, IA generativa, autenticação, sincronização ou publicação que não estão presentes. A promoção a manual oficial requer walkthrough em Windows limpo e aprovação do GPT-6.

## Arquivos alterados
Somente este relatório no repositório de colaboração; nenhum arquivo do produto principal.

## Próxima etapa recomendada
GPT-6 deve aprovar eventual inclusão no README/manual; depois executar walkthrough em instalação limpa e validar cada etapa.

**Estado final:** documentação de uso parcial registrada; aguardando validação do GPT-6 integrador.
