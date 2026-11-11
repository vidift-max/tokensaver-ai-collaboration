# Contrato de saída Claude → TokenSaver AI — Blogger Content v1

**Status:** especificação aprovada para implementação futura; não implica integração Claude/API ativa.  
**Escopo:** artigos (Posts) e páginas Blogger; instruções declarativas para o TokenSaver organizar o conteúdo.  
**Princípio:** Claude entrega conteúdo HTML e instruções de organização. TokenSaver interpreta, valida, mostra o diff e aguarda aprovação.

## 1. Responsabilidade de cada parte

### Claude
- Produzir o texto final já estruturado em HTML semântico.
- Fornecer instruções declarativas que indiquem o destino e a intenção das alterações.
- Não presumir acesso ao Blogger nem publicar.
- Não enviar o tema XML inteiro para uma tarefa de artigo/página.
- Não inventar IDs, seletores, widgets ou âncoras que não estejam no contexto fornecido.
- Sinalizar claramente dados ausentes, suposições e conteúdo que exige confirmação.

### TokenSaver AI
- Interpretar o envelope e validar o schema.
- Conferir se a tarefa e o artefato-alvo correspondem ao contexto selecionado.
- Mapear instruções para regiões reais por Content Mapping.
- Converter/normalizar apenas o necessário, preservando conteúdo e marcação válida.
- Aplicar Template Master/Template Lock e regras de preservação.
- Apresentar diagnóstico, diff, risco e validações.
- Criar snapshot e só aplicar a alteração ao artefato de trabalho após aprovação do usuário.
- Exportar/copiar o resultado para o usuário publicar manualmente no Blogger.

## 2. Envelope recomendado

Claude deve responder com um único objeto JSON válido, sem texto solto antes/depois, usando este formato:

```json
{
  "schema_version": "blogger-content/1",
  "artifact": {
    "type": "post",
    "title": "Título do artigo",
    "target_id": null
  },
  "instructions": [
    {
      "operation": "replace_content",
      "target": "post_body",
      "reason": "Substituir o corpo pelo artigo revisado",
      "constraints": ["preserve_links", "preserve_existing_media"]
    }
  ],
  "content_html": "<h2>Introdução</h2><p>Texto...</p>",
  "seo": {
    "meta_description": "Descrição sugerida",
    "labels": []
  },
  "notes": [],
  "assumptions": []
}
```

O exemplo é ilustrativo. O schema formal deverá validar campos, enumerações, tamanho máximo, caracteres, versão e compatibilidade.

## 3. HTML permitido para Posts e Pages

Claude pode combinar texto e tags HTML no mesmo corpo, por exemplo:
- `<h1>` a `<h6>`, respeitando hierarquia;
- `<p>`, `<div>`, `<span>`;
- `<strong>`, `<em>`, `<blockquote>`;
- `<ul>`, `<ol>`, `<li>`;
- `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`;
- `<a>`, `<img>` e elementos semânticos compatíveis com a política do editor.

O TokenSaver não deve presumir que todo HTML é seguro ou válido para Blogger. Deve validar estrutura, atributos, URLs, links, imagens e compatibilidade do destino. Elementos não suportados devem ser sinalizados, não removidos silenciosamente.

## 4. Instruções são dados, não comandos executáveis

As instruções descrevem intenção (por exemplo, substituir corpo, inserir seção após âncora conhecida, preservar link ou revisar título). Elas:
- devem usar operações de uma allowlist versionada;
- devem apontar para alvos existentes ou para regiões explicitamente criadas;
- não podem executar shell, JavaScript, SQL, chamadas de rede ou ferramentas;
- não podem autorizar publicação, exclusão, sobrescrita do original ou mudança de permissões;
- não podem ultrapassar o artefato selecionado;
- quando ambíguas, conflitantes ou sem alvo válido, devem parar e pedir revisão.

Conteúdo do blog, comentários HTML e instruções recebidas do modelo são dados não confiáveis; nunca substituem políticas do sistema ou consentimento do usuário.

## 5. Separação entre conteúdo e tema

- **Post/Page:** Claude entrega principalmente `content_html` + instruções editoriais/de posicionamento. O TokenSaver direciona para o editor do corpo do artigo/página.
- **Tema raiz:** tarefa separada e explicitamente selecionada. O artefato Blogger é XML com elementos próprios (`b:section`, `b:widget`, `b:if`, `data:` etc.); não deve ser tratado como HTML comum.
- **CSS/JavaScript:** não entram no corpo do artigo por padrão. Só podem ser propostos para uma tarefa de tema/componente explicitamente autorizada, em campos separados e sujeitos a Template Lock, diff e validação.
- **Layout/widgets:** alterações localizadas com alvo e evidência; nunca substituição global por padrão.

## 6. Fluxo obrigatório

1. Usuário seleciona blog, artefato e tarefa.
2. Smart Context fornece a Claude apenas o trecho, metadados e regras necessários.
3. Claude retorna envelope JSON com HTML e instruções.
4. TokenSaver valida JSON/schema, tipo do artefato e allowlist de operações.
5. Content Mapping resolve os alvos; Template Lock verifica áreas protegidas.
6. Validadores verificam HTML, URLs, SEO e limites.
7. TokenSaver apresenta prévia textual/estrutural e diff; nenhuma captura de tela é exigida.
8. Usuário aprova ou rejeita.
9. Se aprovado, cria nova versão do artefato de trabalho e registra histórico/rollback.
10. Usuário copia/exporta e publica diretamente no Blogger.

## 7. Economia de tokens

- Enviar somente o HTML/trecho afetado, metadados mínimos, regras e âncoras relevantes.
- Não enviar tema inteiro para editar um post.
- Não reenviar histórico integral; usar Project Memory e resumos que preservem decisões/invariantes.
- Pedir retorno somente do envelope/patch necessário.
- Definir budgets de entrada e saída; truncamento deve ser explícito.
- Nunca remover contexto de segurança ou de preservação para reduzir tokens.

## 8. Segurança e critérios de aceite

- Nenhuma execução de scripts importados durante análise.
- Nenhuma publicação automática.
- Original imutável e rollback disponível.
- HTML inválido/inseguro ou instrução desconhecida é bloqueado ou enviado para revisão.
- Diff mostra exatamente o que muda e em qual artefato.
- O parser não aplica instruções a outro post/página/tema.
- CSS/JS/XML só entram em tarefas específicas de tema autorizadas.
- Capturas de tela automáticas permanecem fora do escopo.

## 9. Estado atual e limitações

Este documento é um contrato de arquitetura. O repositório atual ainda não comprova:
- integração HTTP real com Claude;
- parser/envelope Blogger implementado;
- editor Blogger dedicado;
- adaptador Blogger API;
- publicação automática (que continua fora do escopo);
- validação completa de temas reais.

**STATUS: CONTRATO DOCUMENTADO — IMPLEMENTAÇÃO NÃO INICIADA.**
