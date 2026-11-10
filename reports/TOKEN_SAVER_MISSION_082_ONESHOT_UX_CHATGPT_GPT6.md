# Missão 082 — OneShot UX

- IA: ChatGPT — GPT-6 (OpenAI)
- Especialidade/função: UX de captura, salvamento e recuperação
- Data: 2026-11-10
- Status: REVIEW_REQUIRED — inspeção estática

## Objetivo
Auditar captura e recuperação do usuário.

## O que esta IA fez
Inspecionou painel OneShot Capture em `src/App.tsx`, wrapper `oneshotCapture` em `src/api.ts` e implementação em `src-tauri/src/advanced.rs`.

## Evidências
- Interface oferece caminho lógico e textarea; captura grava nova versão no projeto.
- Limite backend de conteúdo é 2.000.000 bytes e valida path lógico.
- Após sucesso, UI apenas limpa erro; não exibe confirmação, SHA, versão gravada ou caminho persistido.
- Não há autosave, rascunho recuperável, histórico de captura ou confirmação ao descartar conteúdo não salvo.
- Não há preview do destino/projeto no painel; projeto ID é compartilhado como estado, mas não exibido aqui.
- O comando retorna SHA-256, porém a UI ignora o valor retornado.

## Problemas e gravidade
MÉDIO — usuário não recebe prova de que captura foi persistida. MÉDIO — perda acidental de conteúdo ao navegar/fechar sem rascunho. MÉDIO — falta de prevenção contra caminho lógico incorreto e versão inesperada.

## Recomendações
- Exibir sucesso com SHA abreviado, projeto, caminho e versão criada; botão copiar hash.
- Avisar limite de 2 MB e contador de bytes.
- Mostrar preview do path e projeto ativo; validar extensão/política de path conforme contrato backend.
- Adicionar draft local com retenção/clear explícitos e aviso antes de descartar; não persistir automaticamente sem consentimento.
- Mostrar estado “mesmo conteúdo: nenhuma nova versão” versus “nova versão criada” se backend expuser essa distinção.
- Link para History e File Center após captura.

## Testes necessários
Vazio, 1 byte, 2 MB, 2 MB+1, Unicode, path traversal, conteúdo idêntico, conteúdo alterado, erro DB e recuperação após reiniciar.

## Testes executados
Não executado.

## Arquivos examinados ou alterados
Examinados: `src/App.tsx`, `src/api.ts`, `src-tauri/src/advanced.rs`. Nenhum arquivo do produto alterado.

## Relação com trabalhos anteriores
Complementa 054 e 069. A segurança do blob/TOCTOU pertence à correção backend de 054; esta missão foca feedback, rascunho e recuperação da interface.

## RECOMENDAÇÃO AO GPT-6
Adicionar feedback de persistência e link para histórico antes de desenvolver autosave. Drafts locais precisam de política explícita de privacidade/retention.
