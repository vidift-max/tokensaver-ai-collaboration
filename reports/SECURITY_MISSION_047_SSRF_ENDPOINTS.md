# Missão 047 — SSRF e validação de endpoints

- **IA/modelo:** ChatGPT — GPT-6 | **Data:** 2026-11-10
- **Status:** REVIEW_REQUIRED — análise estática e política; nenhum request de rede realizado.

## Evidência
`src-tauri/src/advanced.rs` possui `validate_claude_endpoint` e `save_claude_config`. Validação observada exige HTTPS, exceto localhost/127.0.0.1/[::1] HTTP para desenvolvimento; rejeita userinfo e backslash, verifica authority e tem testes unitários de alguns hosts malformados. Não foi localizada implementação de HTTP/provider client na base consultada.

## Riscos residuais da validação sintática
- HTTPS não impede DNS rebinding ou resolução para IP privado/link-local/metadata.
- Prefix checks de hostname podem não cobrir todas as formas IPv4/IPv6, IDN, trailing dot, IPv4-mapped IPv6 ou representações numéricas.
- Sem política de resolução DNS e revalidação de IP no momento da conexão, hostname permitido pode resolver a destino proibido.
- Redirect pode redirecionar para endereço interno; não foi evidenciada política de redirects.
- Proxy environment, TLS trust e porta arbitrária podem alterar o destino efetivo.
- HTTP localhost é exceção aceitável apenas em modo dev explicitamente habilitado; não deve ser ativável em produção.
- Endpoint configurável pode tornar-se vetor SSRF quando um cliente de rede for adicionado.

## Política de egress
1. Preferir provider IDs/URLs fixos do registry; não permitir URL livre fornecida pela missão.
2. HTTPS obrigatório; portas e hosts allowlisted por deployment.
3. Resolver DNS, rejeitar loopback, private, link-local, multicast, unspecified, reserved e cloud metadata; validar IPv4 e IPv6.
4. Fixar IP validado à conexão ou revalidar cada resolução; impedir DNS rebinding.
5. Redirects desabilitados por padrão; se necessários, revalidar cada hop e limitar a 1.
6. Bloquear userinfo, fragment, esquema alternativo, IP literal não allowlisted e portas não aprovadas.
7. Controlar proxies; TLS certificate verification obrigatória.
8. Timeout, response size, content type e redirect limits.
9. Egress firewall no backend como defesa adicional.
10. Não enviar conteúdo do usuário a endpoint arbitrário.

## Testes necessários
SSRF-01 localhost/private; SSRF-02 169.254.169.254; SSRF-03 IPv6 loopback/link-local; SSRF-04 DNS rebinding; SSRF-05 redirect to private; SSRF-06 encoded/alternate IP; SSRF-07 proxy bypass; SSRF-08 invalid TLS. Nenhum executado.

## RECOMENDAÇÃO AO GPT-6
Manter ausência de cliente HTTP real; antes de implementar, substituir validação puramente sintática por URL parser + DNS/IP policy + redirect controls + egress allowlist e testes adversariais.