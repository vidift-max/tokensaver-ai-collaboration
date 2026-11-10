# Missão 047 — SSRF e validação de endpoints

## Identificação
- IA: ChatGPT | Modelo: GPT-6 (OpenAI)
- Especialidade: segurança de rede, SSRF e validação de destinos
- Função: análise estática do endpoint configurável e especificação de egress policy
- Data: 2026-11-10 | Status: REVIEW_REQUIRED

## Objetivo
Evitar que endpoints, URLs, redirects ou resoluções DNS controladas por entrada não confiável alcancem loopback, redes privadas, link-local, metadata services ou serviços internos.

## O que esta IA fez
Analisou validação do endpoint Claude e definiu política para clientes HTTP futuros.

### Evidência no código
Em src-tauri/src/advanced.rs, validate_claude_endpoint():
- aceita HTTPS e exceções HTTP para localhost/127.0.0.1/[::1] em desenvolvimento;
- rejeita userinfo (@) e barra invertida;
- extrai authority por parsing textual simples;
- no trecho observado, não resolve DNS, valida IP resultante ou impõe política de redirects.
save_claude_config() persiste endpoint/model, mas a leitura não identificou chamada HTTP nessa função. Busca por reqwest/URL fetch no index não localizou cliente HTTP; isso não prova ausência em todos os caminhos.

### Política proposta
1. Parser URL robusto; rejeitar URL ambígua e esquemas diferentes de HTTPS; localhost HTTP só em build dev.
2. Allowlist exata de hostname e porta por provider; sem wildcard permissivo.
3. Resolver A/AAAA e rejeitar loopback, private, link-local, multicast, unspecified, reserved e metadata ranges.
4. Revalidar destino no momento da conexão para mitigar DNS rebinding/TOCTOU; preferir egress proxy/firewall.
5. Redirects desabilitados por padrão; revalidar cada hop se necessários.
6. Proibir userinfo, fragment, credenciais na URL, portas não aprovadas e hostname ambíguo sem canonicalização.
7. Não encaminhar Authorization/Cookie entre hosts ou redirects.
8. Limitar connect/read/total timeout, response bytes, content type e decompression ratio.
9. Não aceitar URL de callback/webhook sem ownership validation.
10. Registrar host normalizado, IP/port aprovado e decision code sem query/token sensível.

## Arquivos examinados
src-tauri/src/advanced.rs, src-tauri/Cargo.toml, src-tauri/tauri.conf.json, src-tauri/src/lib.rs e provider-registry.json.

## Relação com trabalhos anteriores
Complementa endpoint Claude, secrets 045 e registry 036. Não há autorização para conectar API real ou ampliar egress.

## Problemas encontrados
- Alto: validação atual é sintática e não impede DNS rebinding ou resolução para IP interno.
- Médio: exceção localhost deve ser limitada a build de desenvolvimento, não apenas texto do host.
- Alto: sem egress enforcement, destino pode mudar entre validação e conexão.

## Testes executados
Não executado. Nenhuma requisição HTTP; nenhum teste DNS, redirect, IPv6 ou SSRF.

## Próximo passo
Implementar validador central e egress enforcement antes de habilitar provider HTTP; testar loopback/private/link-local, DNS rebinding, redirect interno, userinfo, IPv6 e timeout.
