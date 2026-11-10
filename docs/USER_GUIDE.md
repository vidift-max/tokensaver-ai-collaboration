# TokenSaver AI — Guia do usuário (estado observado na branch v2-saas-alpha)

> Este guia descreve somente as funções verificadas no código consultado em 10 de novembro de 2026. A interface pode mudar. O aplicativo é uma fundação desktop Windows baseada em Tauri 2, React, TypeScript, Rust e SQLite. Não confunda configuração de um recurso com integração operacional já ativa.

## 1. Visão geral

TokenSaver AI reúne ferramentas locais para importar e versionar arquivos, estimar tokens, buscar contexto, normalizar texto, guardar notas de projeto, validar estrutura editorial, calcular custos informados manualmente, gerar HTML e criar backups.

O menu observado contém: Dashboard, File Center, Token Counter, Smart Context, Safe Optimizer, Project Memory, Claude Connection, Template Master, Editorial Engine, Article Library, Internal Links, Final Page Builder, OneShot Capture, Cost Simulator, Integrity Guardian, Backup Center, Settings e History.

Os dados do projeto são armazenados localmente em diretórios separados por ID de projeto. O SQLite guarda metadados; os conteúdos de arquivos ficam em blobs endereçados por SHA-256 e versões lógicas imutáveis.

## 2. Primeira utilização

1. Abra o aplicativo. O Dashboard consulta a saúde do backend e carrega as pastas de importação autorizadas.
2. O campo de projeto começa com o ID `default`. Vários módulos inicializam automaticamente o banco/diretório quando uma ação é executada.
3. Abra **Settings** e autorize uma pasta específica que contenha os arquivos que deseja importar. O backend restringe a importação a roots autorizados e rejeita caminhos/links não permitidos.
4. Abra **File Center**, informe o caminho absoluto do arquivo dentro da pasta autorizada e um caminho lógico para armazená-lo no projeto, por exemplo `articles/brief.md`.
5. Clique em **Importar arquivo**. Tipos aceitos pela Foundation: TXT, MD, JSON, HTML e CSS. O tamanho máximo por arquivo é 10 MiB; o conteúdo precisa ser UTF-8.
6. Use File Center para atualizar o índice, ou os módulos de contexto/editorial para trabalhar com os arquivos importados.

**Importante:** o código consultado não oferece um gerenciador formal de projetos com listagem, renomeação, exclusão ou fechamento. Alterar o campo de ID não é a mesma coisa que usar um seletor completo. Registre o ID usado para não perder a referência ao projeto.

## 3. Módulos

### Dashboard
Mostra o estado do backend e informações gerais sobre armazenamento, integridade e estimativa de tokens. O estado online indica que o comando de saúde respondeu; não significa que provedores externos estejam conectados.

### File Center
Importa arquivos de uma pasta autorizada e lista metadados (caminho lógico, versão mais recente, bytes e prefixo do SHA-256). O backend suporta páginas de até 100 registros e leitura em chunks UTF-8, mas a interface observada busca apenas a primeira página de 50 itens e não apresenta um visualizador de conteúdo ou seletor de versão.

### Token Counter
O comando de estimativa local conta caracteres Unicode e divide por quatro, arredondando para cima. É uma estimativa aproximada, não o tokenizer de um provedor. A API marca o método como `local_estimate`, `approximate=true` e inclui uma limitação explícita.

### Smart Context
Recebe uma consulta e procura termos nos arquivos mais recentes do projeto, localmente. Exibe caminho, score lexical, versão, estimativa aproximada de tokens e um trecho. A tela solicita até oito resultados. A busca atual não é um sistema semântico nem uma chamada de modelo; a implementação ainda precisa de limites agregados de leitura e explicação de arquivos omitidos.

### Safe Optimizer
Normaliza texto de forma conservadora: padroniza quebras de linha, remove espaços finais e linhas vazias redundantes. Exibe estimativas antes/depois e conteúdo normalizado. Não reescreve o texto com IA nem garante redução de tokens real do provedor.

### Project Memory
Permite salvar notas por chave/valor no banco do projeto e atualizar a lista. A mesma chave atualiza o valor existente. Limites observados no backend: 1.000 entradas por projeto, chave até 128 bytes e valor até 100.000 bytes. A interface não oferece exclusão, busca ou edição separada; salvar novamente com a mesma chave substitui o valor.

### Claude Connection
Salva por projeto os campos enabled, endpoint e model. O código observado não implementa cliente HTTP, teste de conexão ou armazenamento de chave secreta. Habilitar esta configuração não significa que Claude esteja conectado ou que conteúdo será enviado a um provedor. Não coloque API keys neste formulário.

### Template Master
Cria e lista templates locais com placeholders `{{title}}` e `{{body}}`. O backend limita nome a 128 bytes e conteúdo a 200.000 bytes. A interface observada cria novos IDs e não expõe edição, exclusão ou histórico de versões; portanto não trate o módulo como versionamento de templates.

### Editorial Engine
Executa verificações estruturais locais: título/corpo não vazios, corpo com pelo menos 120 bytes e aviso para mais de 20.000 palavras. Mostra contagem de palavras e avisos. Não verifica factualidade, fontes, SEO, originalidade, qualidade editorial ou conformidade legal.

### Article Library
Lista metadados do último arquivo/versão e filtra por caminho lógico. Não apresenta o conteúdo do artigo nem um editor/preview. A busca é por caminho, não pelo texto integral do artigo.

### Internal Links
Sugere arquivos cujos caminhos contêm termos da consulta. A pontuação é lexical e baseada no caminho lógico; não é recomendação semântica baseada no conteúdo. Revise os destinos antes de usar.

### Final Page Builder
Gera uma string HTML com título e corpo escapados, usando template padrão ou template customizado com `{{title}}` e `{{body}}`. O corpo é escapado como texto, então marcação HTML inserida no corpo não é preservada. Templates customizados são HTML raw e devem ser tratados como conteúdo confiável. A interface mostra o HTML em uma área somente leitura. O módulo não publica páginas nem oferece preview isolado.

### OneShot Capture
Salva texto em um caminho lógico do projeto, com limite de 2 MB, hash SHA-256 e versão imutável. Conteúdo idêntico ao da versão mais recente não cria outra versão. A tela observada não apresenta claramente o hash ou número de versão retornado; consulte File Center/History para acompanhar o projeto.

### Cost Simulator
Calcula custo estimado em USD a partir de tokens de entrada/saída e preços informados manualmente por milhão de tokens. Fórmula: `tokens × preço_por_milhão ÷ 1.000.000`. O backend limita cada contador de tokens a 100 milhões e rejeita preços negativos ou não finitos. Não consulta tabelas de preço nem inclui cache, tiers ou tarifas especiais; confirme os preços atuais antes de usar.

### Integrity Guardian
Executa verificação de blobs, referências e hashes SHA-256. A verificação é diagnóstica; não presuma que corrija automaticamente arquivos corrompidos.

### Backup Center
Cria backup com cópia consistente do SQLite e verificação de blobs. A restauração é direcionada a um **novo ID de projeto**; a interface pede confirmação e informa que o projeto original não será substituído. Guarde o ID e o local do backup retornados. As limitações de orçamento/tamanho do restore ainda estão sob auditoria.

### Settings
Gerencia roots de importação autorizados: adicionar, listar e remover pastas. Autorize somente diretórios necessários. A configuração de Claude aparece em outro módulo, não nesta tela.

### History
Lista operações registradas (a tela pede até 50) com tipo, status, progresso e timestamp. Não é um log completo de auditoria e não exibe necessariamente todos os detalhes/códigos de erro.

## 4. Limites observados

| Recurso | Limite/capacidade no código consultado |
|---|---|
| Importação de arquivo | 10 MiB; TXT, MD, JSON, HTML, CSS; UTF-8 |
| File Center | página 1–100; UI atualmente pede 50 |
| Leitura de versão | leitura em chunks UTF-8 |
| Profundidade de caminho padrão | 32 componentes em `limits.rs`; OneShot tem validação local própria de até 64 componentes |
| Smart Context | query até 512 bytes; até 12 termos; UI pede 8 resultados; sem budget global explícito de bytes/arquivos |
| Safe Optimizer | 2.000.000 bytes |
| Project Memory | 1.000 entradas; chave 128 bytes; valor 100.000 bytes |
| Template | nome 128 bytes; conteúdo 200.000 bytes |
| Editorial validation | título 512 bytes; corpo 2.000.000 bytes; aviso acima de 20.000 palavras |
| Final Page Builder | título 512 bytes; corpo 2.000.000 bytes; template 200.000 bytes |
| OneShot Capture | conteúdo 2.000.000 bytes |
| Cost Simulator | até 100.000.000 tokens por tipo; preço finito e não negativo |
| Import roots | até 32 roots |

Os limites acima são derivados do código; não são garantia de que a interface mostre todos eles. Os módulos de backup, restore, Smart Context e operações longas ainda precisam de budgets agregados e validação dinâmica.

## 5. Privacidade e segurança

- A arquitetura observada armazena conteúdo e metadados localmente no diretório de dados do aplicativo.
- Importação exige root autorizado; não autorize a raiz inteira do disco sem necessidade.
- Arquivos importados são tratados como dados; não execute scripts/macros importados.
- Estimativas de tokens são locais e aproximadas.
- Não há integração Claude HTTP operacional demonstrada nem armazenamento de secret no módulo Claude Connection.
- Não insira senhas, tokens ou chaves em campos de texto, Project Memory, templates ou artigos.
- Faça backups em local controlado e verifique o ID do projeto de destino antes de restaurar.

## 6. Limitações conhecidas da versão observada

- Não há onboarding guiado ou Project Switcher completo.
- File Center não expõe preview, leitura ou paginação completa na UI.
- Smart Context não informa arquivos excluídos nem orçamento consumido.
- Project Memory não oferece exclusão/organização.
- Template Master não oferece edição/exclusão/histórico de versões na UI.
- Editorial Engine é um validador estrutural mínimo.
- Article Library não abre conteúdo; Internal Links usa termos no caminho.
- Final Page Builder gera HTML, mas não publica nem oferece preview sandboxed.
- OneShot Capture não mostra claramente o resultado/versionamento.
- Settings e History são básicos.
- Acessibilidade não foi certificada; rótulos, foco, mensagens anunciadas e contraste precisam de auditoria.
- Nenhuma orientação deste documento substitui testes em um instalador Windows.

## 7. Diagnóstico básico

1. Se o status mostrar Backend offline, confirme se o aplicativo desktop foi iniciado corretamente e reabra o app; o status depende do comando local `health`.
2. Se a importação falhar, confirme que a pasta está autorizada em Settings, que o caminho absoluto está dentro dela, que o formato é aceito, que o arquivo não excede 10 MiB e que o texto é UTF-8.
3. Se Smart Context não retornar arquivos, confirme o ID do projeto, importe os arquivos primeiro e tente termos presentes no caminho/conteúdo.
4. Se um cálculo de custo parecer incorreto, confirme que os preços são USD por milhão de tokens e que input/output usam preços separados.
5. Se a restauração falhar, não tente sobrescrever o projeto original; escolha um novo ID de destino.

## 8. Escopo desta documentação

Este manual foi escrito por leitura estática de `src/App.tsx`, `src/api.ts`, `src-tauri/src/lib.rs`, módulos Rust relacionados e `README.md`, na branch `v2-saas-alpha`, em 2026-11-10. Nenhum procedimento foi validado em aplicativo instalado. Confirme a versão do app e repita os passos em ambiente de teste antes de usar dados importantes.
