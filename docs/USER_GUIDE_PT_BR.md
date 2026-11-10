# TokenSaver AI — Guia de uso (estado observado na branch `v2-saas-alpha`)

> Documento de referência para a fundação atualmente examinada. A interface e os recursos podem mudar. Este guia descreve somente os comportamentos localizados no código; recomendações futuras não são apresentadas como funções disponíveis.

## 1. O que é o TokenSaver nesta fase

O TokenSaver AI é um aplicativo desktop construído com Tauri 2, React/TypeScript, Rust e SQLite. Os fluxos examinados são locais e determinísticos. A estimativa de tokens é aproximada, não uma contagem oficial de um provedor.

**Importante:** a tela Claude Connection salva apenas configuração (endpoint/modelo/estado habilitado). O README informa que a conexão real de rede ainda não está implementada. Não há publicação real em CMS nesta fase. Não insira API keys em campos de endpoint ou modelo.

## 2. Primeiro uso e projeto

1. Abra o aplicativo.
2. O estado inicial do campo de projeto é `default`.
3. Em módulos que exibem o campo Projeto, informe um identificador com até 64 caracteres, usando somente letras ASCII, números, hífen ou sublinhado.
4. O backend inicializa o armazenamento local do projeto quando os fluxos chamam `initialize_project`.

A interface examinada ainda não oferece um gerenciador central para criar, listar, renomear, arquivar ou excluir projetos. O identificador precisa ser mantido consistente entre as telas.

## 3. Autorizar uma pasta para importação

1. Abra **Settings**.
2. Informe o caminho absoluto da pasta que deseja autorizar.
3. Selecione **Autorizar pasta**.
4. A pasta deve aparecer na lista de áreas autorizadas.
5. Para revogar a autorização, use **Remover** ao lado da pasta.

A autorização controla de onde o aplicativo pode importar arquivos. Remover uma pasta da lista não é uma instrução para apagar arquivos que já foram importados para o armazenamento do projeto.

## 4. Importar arquivos — File Center

1. Abra **File Center**.
2. Informe o ID do projeto.
3. Preencha **Arquivo autorizado** com o caminho do arquivo dentro de uma pasta autorizada.
4. Preencha **Caminho lógico** com o nome/caminho que será usado no projeto, por exemplo `articles/nota.md`.
5. Selecione **Importar arquivo**.

Extensões aceitas pelo fluxo observado: TXT, MD, JSON, HTML e CSS. O limite de arquivo configurado no backend é 10 MiB. O backend valida a origem e UTF-8; não confie somente na validação visual.

A lista atual carrega a primeira página de até 50 itens, mas a interface ainda não apresenta controles de página seguinte/anterior. Também não há preview de conteúdo ou ação de exportação no painel examinado.

## 5. Smart Context

1. Abra **Smart Context**.
2. Confirme o projeto.
3. Digite termos de busca.
4. Selecione **Montar contexto**.

A busca é local e determinística sobre os arquivos importados. A interface solicita até oito resultados e mostra caminho, score, versão, estimativa aproximada de tokens e trecho de texto.

O score é um ranking interno, não uma probabilidade. A interface ainda não informa o universo completo examinado, arquivos excluídos, orçamento de bytes/tempo nem razões de exclusão. Portanto, a lista não deve ser interpretada como prova de que todo o projeto foi incluído.

## 6. Safe Optimizer

1. Abra **Safe Optimizer**.
2. Cole o texto.
3. Selecione **Otimizar**.
4. Compare os caracteres e tokens estimados antes/depois e revise o conteúdo de saída.

A operação observada é uma normalização conservadora de espaços no fim das linhas e linhas vazias redundantes. Não é uma reescrita semântica nem uma garantia de qualidade editorial. A estimativa de tokens é aproximada.

## 7. Project Memory

1. Abra **Project Memory**.
2. Informe o projeto, uma chave e um valor.
3. Selecione **Salvar**.
4. Use **Atualizar** para recarregar a lista.

O backend limita a 1.000 entradas por projeto, chave de até 128 bytes e valor de até 100.000 bytes. A interface atual não oferece busca, edição explícita, exclusão, contador de quota ou ocultação de valores. Evite armazenar senhas, tokens, API keys e dados pessoais nesta memória.

## 8. Cost Simulator

Informe:
- tokens de entrada;
- tokens de saída;
- preço em USD por milhão de tokens de entrada;
- preço em USD por milhão de tokens de saída.

Selecione **Calcular**. A fórmula é:

`custo = tokens × preço_por_milhão / 1.000.000`

O resultado é uma simulação baseada nos preços que você digitou. Não é cotação automática, billing, medição de consumo real ou comparação oficial de provedores. Confirme a unidade e a data dos preços antes de usar o resultado para decisões financeiras.

## 9. Template Master

1. Informe um nome.
2. Edite o conteúdo do template.
3. Use os placeholders `{{title}}` e `{{body}}` quando aplicável.
4. Selecione **Salvar template**.
5. Use **Atualizar** para recarregar a lista.

A interface atual permite criar e listar templates, mas não expõe edição, duplicação ou exclusão dos existentes, embora exista um comando de exclusão na API. O backend observado atualiza por ID; não foi localizado histórico imutável de versões.

## 10. Editorial Engine

Informe título e corpo e selecione **Validar**. A validação é local e básica: verifica título/corpo vazios, tamanho e contagem de palavras, retornando avisos. Não faz fact-check, pesquisa de fontes, análise SEO completa, revisão por IA ou publicação.

## 11. Article Library e Internal Links

- **Article Library:** permite filtrar artigos por caminho e exibe caminho, versão, bytes e prefixo do SHA-256.
- **Internal Links:** recebe termos e sugere caminhos com correspondência lexical. O score atual se baseia em termos no caminho do arquivo, não em compreensão semântica completa do conteúdo.

A biblioteca não apresenta paginação/preview/edição no painel examinado. Links são sugestões; revise o destino e o contexto antes de utilizá-los.

## 12. Final Page Builder

Informe título, corpo e, opcionalmente, um template HTML com `{{title}}` e `{{body}}`. Selecione **Montar** para gerar HTML em uma área somente leitura.

O backend escapa o título e o corpo inseridos nos placeholders, mas aceita o template como HTML livre. Não considere template de terceiros confiável nem abra HTML desconhecido sem revisão: um template pode conter conteúdo ativo, como scripts ou handlers. Não há publicação automática.

## 13. OneShot Capture

Informe um caminho lógico e cole o conteúdo. Selecione **Capturar** para gravar o conteúdo como versão do arquivo no projeto. O backend limita o conteúdo a 2.000.000 bytes.

A interface atual não mostra confirmação detalhada, versão ou hash após salvar e não oferece rascunho recuperável. Após a captura, confira o resultado no File Center/History. O caminho lógico deve ser válido e permanecer dentro do projeto.

## 14. Claude Connection

A tela permite salvar um toggle, endpoint e modelo. Isso representa configuração local, não conectividade confirmada. O README da branch examinada declara que a conexão real ainda depende de camada segura de credenciais/HTTP. Não cole segredo no endpoint/modelo e não interprete “habilitado” como “conectado”.

## 15. Integrity Guardian

Informe o projeto e selecione **Verificar agora**. O painel apresenta estado de integridade, blobs verificados, referências quebradas, blobs ausentes/corrompidos e órfãos, conforme o retorno do backend.

## 16. Backup Center

1. Informe o projeto.
2. Selecione **Criar backup**.
3. Guarde o ID e o caminho exibidos após a conclusão.
4. Para restaurar, informe o ID do backup e um novo ID de projeto.
5. Confirme a restauração.

A interface pede restauração para um novo projeto e avisa que o original não será substituído. Mantenha cópia independente dos backups importantes. Não interrompa o aplicativo durante operações de backup/restore.

## 17. History

Abra **History** e selecione **Atualizar** para carregar operações do projeto. O painel observado solicita até 50 registros. Ainda não há filtros, exportação ou política de retenção exposta na UI.

## 18. Limitações conhecidas da interface

- Dashboard e Token Counter aparecem no menu, mas não têm painéis dedicados identificados no JSX examinado; caem no painel genérico.
- Todos os módulos são marcados `ready:true` estaticamente; isso não significa que todos sejam completos ou conectados a serviços externos.
- Não existe gerenciador central de projetos.
- File Center tem paginação no backend, mas a UI mostra apenas a primeira página.
- Smart Context não mostra relatório de inclusão/exclusão nem budget global.
- Project Memory não tem CRUD completo nem proteção visual de valores.
- Templates não têm gestão completa nem histórico de versões.
- Editorial Engine é validador básico, não fluxo editorial completo.
- Article Library não tem paginação/preview.
- Final Page Builder não tem preview sandboxado ou exportação no painel.
- OneShot não apresenta confirmação detalhada nem rascunho.
- Settings cobre principalmente pastas autorizadas; History é separado e limitado a 50.
- Não foi localizada interface de conexão real Claude, publicação externa, sincronização em nuvem ou billing.

## 19. Suporte e diagnóstico

Se uma operação falhar:
1. confira o ID do projeto;
2. confira se a pasta de origem está autorizada;
3. confira extensão e tamanho do arquivo;
4. tente atualizar a lista do módulo;
5. preserve o código de erro exibido para diagnóstico.

Não compartilhe bancos, arquivos importados, caminhos pessoais, logs com dados sensíveis ou credenciais em issues públicas.

---

## Base documental e validade

Este guia foi redigido por inspeção estática dos arquivos da branch `v2-saas-alpha`, incluindo `README.md`, `src/App.tsx`, `src/api.ts`, `src/styles.css` e módulos Rust relacionados. Não foi executado walkthrough de aplicativo instalado. Antes de distribuir como manual final, valide cada passo contra um build real e atualize o guia com versão/commit.
