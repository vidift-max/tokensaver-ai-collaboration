# Missão 047 — SSRF e Endpoints | ChatGPT (GPT-6)

**Data:** 2026-11-10 | **Especialidade:** segurança de rede e validação de URL | **Status:** REVIEW_REQUIRED

## Objetivo
Validar endpoints configuráveis e impedir requisições a destinos internos/privilegiados.

## O que esta IA fez
Inspecionou src-tauri/src/advanced.rs::validate_claude_endpoint, get_claude_config e save_claude_config; Cargo.toml; tauri.conf.json e buscas por cliente HTTP.

## Evidências e conclusão
A validação usa prefixos https:// ou localhost HTTP e parsing manual de authority; rejeita userinfo e barra invertida, mas não usa parser URL completo, não valida porta/IP/DNS e não implementa política contra DNS rebinding/redirects. A configuração é persistida no SQLite. O Cargo.toml consultado não declara reqwest ou cliente HTTP equivalente e não foi localizado código de chamada Claude ativo nos arquivos examinados.

**Conclusão:** não há SSRF explorável demonstrada no HEAD porque não foi identificado consumidor HTTP do endpoint; há risco latente MÉDIO caso o endpoint seja usado futuramente.

## Controles recomendados
Parser URL robusto; allowlist de hosts; bloqueio de loopback, RFC1918, link-local, multicast e metadata; resolução DNS validada no momento da conexão; proteção DNS rebinding; redirects desabilitados ou revalidados; HTTPS obrigatório salvo localhost explicitamente em dev; timeout e limite de resposta; egress allowlist no host.

## Testes
Não executados. Necessários: IP literal privado, IPv6, IPv4-mapped, link-local, metadata IP, hostname que resolve para privado, DNS rebinding, redirect interno, userinfo, porta inválida e formatos URL ambíguos.

## Relação com trabalhos anteriores
Complementa CLAUDE-01 e GH-09 na documentação AI_COLLABORATION.md e Missão 030. Mantém a conclusão anterior de não classificar como SSRF ativa sem cliente HTTP.

## Recomendação
Não ativar integração HTTP Claude até parser/egress guard e testes aprovados. AGUARDANDO VALIDAÇÃO DA IA INTEGRADORA.
