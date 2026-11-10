# Missão 047 — SSRF e Endpoint Validation

**Identificação:** ChatGPT — GPT-6 | **Especialidade:** segurança de aplicações e arquitetura multiagente | **Data:** 2026-11-10 | **Status:** REVIEW_REQUIRED — especificação documental, não controle implantado.

**Escopo:** análise estática/documental. Nenhum código do repositório principal foi alterado; nenhum secret foi acessado; nenhum teste dinâmico foi executado.

## Objetivo e contribuição própria
Inspecionei o validador de endpoint Claude e defini controles contra SSRF, DNS rebinding, redirects e acesso a redes privadas. Nenhuma chamada HTTP foi realizada.

## Evidência examinada
src-tauri/src/advanced.rs, SHA ffc14545043ca41bcd49a3181c0b21dcf6ba36cf, função validate_claude_endpoint (aprox. linhas 118–127): valida prefixos HTTPS ou exceções localhost HTTP, rejeita @ e backslash e extrai authority manualmente. save_claude_config persiste endpoint/model/enabled. Testes existentes cobrem alguns hosts inválidos e localhost. Não foi localizado cliente HTTP Claude ativo neste arquivo. CSP connect-src em tauri.conf.json é controle do WebView, não egress do backend Rust.

## Achado
SSRF-01: validação por prefixo/parsing manual não equivale a parser URL robusto; pode divergir em authority ambígua, portas, IPv6, IDNA, percent encoding, DNS e redirects. Lacuna de validação, não SSRF explorável confirmada, pois não foi encontrado cliente HTTP ativo nesta inspeção.

## Política recomendada
1. Parser URL mantido; validar scheme, host, port, userinfo, path e fragment.
2. HTTPS obrigatório em produção; localhost HTTP somente em dev explicitamente habilitado.
3. Host/port allowlist por provider; não aceitar endpoint arbitrário em produção.
4. Resolver DNS e rejeitar loopback, private, link-local, multicast, unspecified, IPv4-mapped IPv6 e metadata.
5. Desabilitar redirects; se habilitados, revalidar cada destino e limitar hops.
6. Mitigar DNS rebinding validando IP no momento da conexão ou usando egress proxy.
7. Bloquear schemes alternativos e portas não aprovadas.
8. Timeout, limite de resposta, headers, concorrência e rate limit.
9. Nunca colocar API key em URL/query; redigir erros/headers.

## Testes necessários
userinfo; host suffix enganoso; IPv4 decimal/hex/octal; IPv6 loopback/link-local; mapped IPv6; DNS alternando público/privado; redirect para metadata; redirect chain; portas não padrão; IDN; percent encoding; CRLF; schemes alternativos; HTTPS válido allowlisted.

## Testes executados
Não executado nesta missão: SSRF probe, DNS lookup, fuzzing ou unit tests. Testes unitários existentes foram apenas lidos.

## Relação com trabalhos anteriores
Complementa CLAUDE-01 em AI_COLLABORATION.md e auditoria 030. Não eleva a lacuna a exploração confirmada.

## Limitações/status
Sem cliente HTTP ativo localizado no escopo examinado; sem teste dinâmico. REVIEW_REQUIRED. Substituir validador manual por parser + allowlist/egress antes de ativar integração. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.