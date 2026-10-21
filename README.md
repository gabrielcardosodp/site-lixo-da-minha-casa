# O Lixo da Minha Casa

Portal de educação ambiental do projeto "O Lixo da Minha Casa: diagnóstico da geração de resíduos e incentivo à reciclagem no ambiente residencial" (Projeto Integrador I, Centro Universitário FSA, 2026).

## Tecnologias

- HTML5, CSS3 e JavaScript puros. Não há framework nem etapa de build.
- Leaflet 1.9.4 (mapa) e tiles do OpenStreetMap, carregados por CDN.
- Busca de endereço pelo serviço Nominatim do OpenStreetMap.
- Dados em arquivos JSON editáveis, sem banco de dados e sem painel administrativo.

Por não usar build nem servidor próprio, o site pode ser hospedado em qualquer serviço de arquivos estáticos (GitHub Pages, Vercel, Netlify etc.).

## Estrutura

```
site-lixo-da-minha-casa/
├── index.html          Página inicial
├── guia.html           Guia de reciclagem (busca, filtro, erros comuns, FAQ)
├── mapa.html           Mapa de descarte
├── impacto.html        Painel de impacto
├── participe.html      Como participar
├── referencias.html    Fontes e referências
├── css/style.css       Estilos globais
├── js/main.js          Lógica de todas as páginas
├── validar-dados.js    Verifica os arquivos de dados antes de publicar
└── src/data/           ARQUIVOS QUE VOCÊ EDITA
    ├── impacto.json        Indicadores de resultado
    ├── pontos-coleta.json  Locais de descarte
    ├── materiais.json      Conteúdo do guia
    └── referencias.json    Fontes e links
```

## Como ver o site no seu computador

Abra a pasta no Visual Studio Code com a extensão "Live Server" e clique em "Go Live". Ou, se tiver Python instalado, rode na pasta do projeto:

```
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`.

Não abra os arquivos com duplo clique (`file://`): o navegador bloqueia o carregamento dos JSON.

## Como editar o conteúdo (sem mexer nos componentes)

Regra geral: edite somente os arquivos em `src/data/`. Não é preciso alterar `js/` nem `css/` para atualizar dados.

### Atualizar os indicadores de impacto (`src/data/impacto.json`)

1. Abra o arquivo e localize o indicador, por exemplo `"oleo_coletado_litros"`.
2. Troque `"valor": null` por um número, sem aspas. Exemplo: `"valor": 120.5`.
3. Atualize `"atualizado_em"` com a data no formato `AAAA-MM-DD`.
4. Quando houver resultados reais, mude `"publicado"` para `true`.

Atenção: use `null` enquanto o dado não existir. Não use `0` para indicar "ainda não medido", pois isso seria apresentado como resultado.

### Adicionar ou alterar um ponto de descarte (`src/data/pontos-coleta.json`)

1. Copie um bloco existente dentro de `"pontos"` e troque os valores.
2. Preencha `latitude` e `longitude` com números, por exemplo `-23.6600` e `-46.5300`.
3. Use `"status": "confirmado"` somente depois de conferir o local em fonte oficial. Apenas locais confirmados aparecem no mapa.
4. Preencha `fonte`, `url_fonte` e `data_verificacao`.
5. Campos opcionais (`materiais_aceitos`, `horario`, `observacoes`) podem ser omitidos se não estiverem confirmados.

Para obter coordenadas, use o Google Maps ou o OpenStreetMap: clique com o botão direito sobre o local e copie a latitude e a longitude exibidas.

### Editar o guia (`src/data/materiais.json`)

- Para alterar um material, edite o bloco correspondente dentro de `"materiais"`.
- `"categoria"` deve ser um dos valores de `"categorias"`.
- `"fontes"` deve conter ids existentes em `referencias.json`.
- `"aviso"` é opcional e aparece em destaque.
- Para perguntas e erros comuns, edite as listas `"erros_comuns"` e `"perguntas_frequentes"`.

### Editar as referências (`src/data/referencias.json`)

- Cada item tem `tipo` (`oficial`, `academico` ou `complementar`).
- `"verificado": true` só deve ser usado depois de você abrir o link e conferir a informação.
- Não invente URLs. Se o link ainda não existir, use `"url": null`.

## Validar antes de publicar

No terminal, na pasta do projeto, rode:

```
node validar-dados.js
```

Se Node.js não estiver instalado, o script não roda; nesse caso, a publicação funciona mesmo assim, mas os erros de formatação só aparecerão no navegador. O script aponta erros (que impedem a exibição correta) e avisos (que merecem conferência).

## Estado atual dos dados

- Indicadores de impacto: sem valores publicados. O painel mostra "Os resultados do projeto ainda não foram publicados".
- Pontos de descarte: as duas Estações de Coleta citadas no documento acadêmico (Vila Guiomar e Caminho do Pilar) estão cadastradas como "pendente_verificacao", sem coordenadas. Por isso, o mapa ainda não exibe marcadores. Isso deve ser mudado somente após conferência no SEMASA.
- Referências: a maioria ainda está marcada como "Ainda não conferido".

## Limitações conhecidas

- Os dados de pontos de descarte dependem de conferência manual em fontes oficiais. O site não promete cobertura completa.
- A busca de endereço depende do serviço Nominatim, que tem limite de uso. Em caso de falha, o site exibe mensagem e a busca pode ser tentada mais tarde.
- Os mapas e a busca usam serviços externos gratuitos do OpenStreetMap; não há chave de API no código.
- A localização do dispositivo só é usada após clique do usuário e não é armazenada.

## Publicação

Veja o arquivo `TUTORIAL-GITHUB.md`, com o passo a passo para GitHub e Vercel.
