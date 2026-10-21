/* O Lixo da Minha Casa - script principal
 * Carrega os dados de src/data/*.json e monta as páginas.
 * Os dados são públicos; não há chaves, segredos ou login neste arquivo.
 */
(function () {
  'use strict';

  const PAGINAS = [
    { id: 'inicio', href: 'index.html', nome: 'Início' },
    { id: 'guia', href: 'guia.html', nome: 'Guia de reciclagem' },
    { id: 'mapa', href: 'mapa.html', nome: 'Mapa de descarte' },
    { id: 'impacto', href: 'impacto.html', nome: 'Impacto' },
    { id: 'participe', href: 'participe.html', nome: 'Participe' },
    { id: 'referencias', href: 'referencias.html', nome: 'Referências' }
  ];

  const CATEGORIAS_PONTO = {
    estacao_coleta: 'Estação de Coleta',
    pev: 'PEV (Ponto de Entrega Voluntária)',
    oleo_cozinha: 'Coleta de óleo de cozinha',
    tampinhas: 'Coleta de tampinhas'
  };

  /* ---------- utilitários ---------- */

  function esc(texto) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  async function carregarJSON(caminho) {
    const resposta = await fetch(caminho, { cache: 'no-cache' });
    if (!resposta.ok) {
      throw new Error(`Não foi possível carregar os dados (${caminho}, HTTP ${resposta.status}).`);
    }
    return resposta.json();
  }

  function mostrarErro(elemento, mensagem) {
    elemento.innerHTML = `<p class="erro" role="alert">${esc(mensagem)}</p>`;
  }

  function dataBR(iso) {
    if (!iso) return null;
    const [a, m, d] = String(iso).split('-');
    if (!a || !m || !d) return iso;
    return `${d}/${m}/${a}`;
  }

  /* ---------- cabeçalho e rodapé ---------- */

  function montarCabecalho(paginaAtual) {
    const el = document.getElementById('site-header');
    if (!el) return;
    el.innerHTML = `
      <header class="cabecalho">
        <div class="container barra">
          <a class="marca" href="index.html">🌱 O Lixo da Minha Casa</a>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-principal">Menu</button>
          <nav id="menu-principal" class="menu" aria-label="Navegação principal">
            ${PAGINAS.map((p) => `<a href="${p.href}"${p.id === paginaAtual ? ' aria-current="page"' : ''}>${esc(p.nome)}</a>`).join('')}
          </nav>
        </div>
      </header>`;
    const botao = el.querySelector('.menu-toggle');
    const menu = el.querySelector('.menu');
    botao.addEventListener('click', () => {
      const aberto = menu.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', String(aberto));
    });
  }

  function montarRodape() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `
      <footer class="rodape">
        <div class="container">
          <p>Projeto de educação ambiental desenvolvido como trabalho acadêmico no Projeto Integrador I
          (Centro Universitário Fundação Santo André - FSA, Faculdade de Engenharia Engenheiro Celso Daniel, 2026).
          Conteúdo de caráter educativo. Confira sempre as orientações oficiais do SEMASA antes de descartar.</p>
          <ul>
            <li><a href="referencias.html">Referências e fontes</a></li>
            <li><a href="participe.html">Como participar</a></li>
          </ul>
        </div>
      </footer>`;
  }

  /* ---------- Guia de reciclagem ---------- */

  async function iniciarGuia() {
    const area = document.getElementById('guia-materiais');
    const busca = document.getElementById('busca-material');
    const filtro = document.getElementById('filtro-categoria');
    const erros = document.getElementById('guia-erros');
    const perguntas = document.getElementById('guia-perguntas');
    if (!area) return;

    let dados;
    try {
      dados = await carregarJSON('src/data/materiais.json');
    } catch (e) {
      mostrarErro(area, e.message);
      return;
    }

    const categorias = dados.categorias || {};
    filtro.innerHTML = '<option value="">Todas as categorias</option>' +
      Object.entries(categorias).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('');

    function renderizar() {
      const termo = (busca.value || '').trim().toLowerCase();
      const cat = filtro.value;
      const lista = (dados.materiais || []).filter((m) => {
        const texto = `${m.nome} ${(m.como_separar || []).join(' ')}`.toLowerCase();
        return (!cat || m.categoria === cat) && (!termo || texto.includes(termo));
      });

      if (!lista.length) {
        area.innerHTML = '<p class="vazio">Nenhum material encontrado com esse termo ou filtro. Tente outra palavra ou remova o filtro.</p>';
        return;
      }

      area.innerHTML = `<div class="grade">${lista.map((m) => `
        <article class="cartao" id="material-${esc(m.id)}">
          <span class="tag">${esc(categorias[m.categoria] || '')}</span>
          <h3>${esc(m.nome)}</h3>
          ${m.aviso ? `<p class="aviso">${esc(m.aviso)}</p>` : ''}
          <h4>Como separar</h4>
          <ul>${(m.como_separar || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <h4>Cuidados</h4>
          <ul>${(m.cuidados || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </article>`).join('')}</div>`;
    }

    busca.addEventListener('input', renderizar);
    filtro.addEventListener('change', renderizar);
    renderizar();

    if (erros) {
      erros.innerHTML = (dados.erros_comuns || []).map((e) => `
        <div class="cartao"><h3>❌ ${esc(e.erro)}</h3><p>✅ ${esc(e.correcao)}</p></div>`).join('');
    }
    if (perguntas) {
      perguntas.innerHTML = (dados.perguntas_frequentes || []).map((p) => `
        <details class="cartao"><summary><strong>${esc(p.pergunta)}</strong></summary><p>${esc(p.resposta)}</p></details>`).join('');
    }
  }

  /* ---------- Mapa de descarte ---------- */

  const CENTRO_SANTO_ANDRE = [-23.6633, -46.5383];

  async function iniciarMapa() {
    const canvas = document.getElementById('mapa-canvas');
    if (!canvas) return;

    const avisoMapa = document.getElementById('mapa-aviso');
    const listaEl = document.getElementById('mapa-lista');
    const filtro = document.getElementById('mapa-filtro');
    const buscaEnd = document.getElementById('mapa-busca');
    const btnBuscar = document.getElementById('mapa-buscar');
    const btnLocal = document.getElementById('mapa-localizacao');
    const msgBusca = document.getElementById('mapa-msg');

    if (typeof L === 'undefined') {
      mostrarErro(avisoMapa, 'O mapa não pôde ser carregado (biblioteca Leaflet indisponível). Verifique sua conexão.');
      listaEl.innerHTML = '';
      return;
    }

    let dados;
    try {
      dados = await carregarJSON('src/data/pontos-coleta.json');
    } catch (e) {
      mostrarErro(avisoMapa, e.message);
      return;
    }

    const todos = Array.isArray(dados.pontos) ? dados.pontos : [];
    const pendentes = todos.filter((p) => p.status !== 'confirmado').length;

    // A lista mostra todos os pontos confirmados; o mapa só recebe os que têm coordenadas válidas.
    const confirmados = todos.filter((p) => p.status === 'confirmado');
    const comCoordenadas = (p) =>
      typeof p.latitude === 'number' && typeof p.longitude === 'number' &&
      Number.isFinite(p.latitude) && Number.isFinite(p.longitude);
    const semCoordenadas = confirmados.filter((p) => !comCoordenadas(p)).length;

    const mapa = L.map(canvas).setView(CENTRO_SANTO_ANDRE, 12);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(mapa);

    const camadas = L.layerGroup().addTo(mapa);

    filtro.innerHTML = '<option value="">Todas as categorias</option>' +
      Object.entries(CATEGORIAS_PONTO).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join('');

    function linhasDetalhe(p) {
      const linhas = [];
      linhas.push(`<dt>Endereço</dt><dd>${esc(p.endereco || 'Não informado')}</dd>`);
      if (Array.isArray(p.materiais_aceitos) && p.materiais_aceitos.length) {
        linhas.push(`<dt>Materiais aceitos</dt><dd>${esc(p.materiais_aceitos.join(', '))}</dd>`);
      }
      if (p.horario) linhas.push(`<dt>Horário</dt><dd>${esc(p.horario)}</dd>`);
      if (p.observacoes) linhas.push(`<dt>Observações</dt><dd>${esc(p.observacoes)}</dd>`);
      linhas.push(`<dt>Fonte</dt><dd>${p.url_fonte ? `<a href="${esc(p.url_fonte)}" rel="noopener" target="_blank">${esc(p.fonte)}</a>` : esc(p.fonte || 'Não informada')}</dd>`);
      if (p.data_verificacao) linhas.push(`<dt>Última verificação</dt><dd>${esc(dataBR(p.data_verificacao))}</dd>`);
      return linhas.join('');
    }

    function desenharLista(pontos) {
      if (!pontos.length) {
        listaEl.innerHTML = '<p class="vazio">Não há locais confirmados nesta categoria no cadastro atual. Os dados dependem de informações oficiais verificadas.</p>';
        return;
      }
      listaEl.innerHTML = `<div class="lista-pontos">${pontos.map((p) => `
        <article class="cartao ponto">
          <span class="tag">${esc(CATEGORIAS_PONTO[p.categoria] || p.categoria)}</span>
          <h3>${esc(p.nome)}</h3>
          <dl>${linhasDetalhe(p)}</dl>
          ${comCoordenadas(p) ? `<a class="botao secundario" rel="noopener" target="_blank"
             href="https://www.google.com/maps/dir/?api=1&amp;destination=${p.latitude},${p.longitude}">
             Abrir rota no Google Maps (site externo)</a>` : ''}
        </article>`).join('')}</div>`;
    }

    function desenharMarcadores(pontos) {
      camadas.clearLayers();
      pontos.filter(comCoordenadas).forEach((p) => {
        const marcador = L.marker([p.latitude, p.longitude]).addTo(camadas);
        marcador.bindPopup(`<strong>${esc(p.nome)}</strong><br>${esc(p.endereco || '')}<br><small>Fonte: ${esc(p.fonte || '')}</small>`);
      });
    }

    function aplicarFiltro() {
      const cat = filtro.value;
      const pontos = confirmados.filter((p) => !cat || p.categoria === cat);
      desenharMarcadores(pontos);
      desenharLista(pontos);
    }

    filtro.addEventListener('change', aplicarFiltro);

    avisoMapa.innerHTML = '';
    if (!confirmados.length) {
      avisoMapa.innerHTML = '<p class="vazio">Não há locais confirmados no cadastro atual.</p>';
    }
    if (semCoordenadas) {
      avisoMapa.insertAdjacentHTML('beforeend',
        `<p class="legenda-mapa">${semCoordenadas} local(is) confirmado(s) ainda sem coordenadas conferidas aparecem na lista, mas não no mapa.</p>`);
    }
    if (pendentes) {
      avisoMapa.insertAdjacentHTML('beforeend',
        `<p class="legenda-mapa">${pendentes} local(is) ainda em verificação não aparecem no mapa nem na lista. A cobertura depende das informações oficiais localizadas e conferidas.</p>`);
    }
    const gerais = document.getElementById('mapa-avisos-gerais');
    if (gerais && Array.isArray(dados.avisos_gerais)) {
      gerais.innerHTML = '<h2>Antes de ir</h2><ul>' + dados.avisos_gerais.map((t) => `<li>${esc(t)}</li>`).join('') + '</ul>';
    }

    aplicarFiltro();

    // Busca manual por endereço (Nominatim/OpenStreetMap). Uso moderado: uma busca por clique.
    btnBuscar.addEventListener('click', async () => {
      const termo = buscaEnd.value.trim();
      if (!termo) {
        msgBusca.textContent = 'Digite um endereço ou bairro para buscar.';
        return;
      }
      msgBusca.textContent = 'Buscando...';
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(termo + ', Santo André, SP')}`;
        const resposta = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
        if (!resposta.ok) throw new Error('serviço indisponível');
        const resultados = await resposta.json();
        if (!resultados.length) {
          msgBusca.textContent = 'Não encontramos esse endereço. Tente outro termo ou um bairro.';
          return;
        }
        mapa.setView([Number(resultados[0].lat), Number(resultados[0].lon)], 15);
        msgBusca.textContent = 'Mapa centralizado no endereço pesquisado.';
      } catch (e) {
        msgBusca.textContent = 'A busca de endereço está indisponível no momento (limite de uso ou falha de conexão). Tente novamente mais tarde.';
      }
    });

    // Localização do dispositivo: somente após clique explícito do usuário.
    btnLocal.addEventListener('click', () => {
      if (!('geolocation' in navigator)) {
        msgBusca.textContent = 'Seu navegador não permite usar a localização.';
        return;
      }
      msgBusca.textContent = 'Solicitando permissão de localização...';
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          mapa.setView([pos.coords.latitude, pos.coords.longitude], 14);
          msgBusca.textContent = 'Mapa centralizado na sua localização. Ela não é armazenada nem enviada ao site.';
        },
        () => {
          msgBusca.textContent = 'Não foi possível obter sua localização. Você pode usar a busca por endereço.';
        },
        { enableHighAccuracy: false, timeout: 10000 }
      );
    });
  }

  /* ---------- Impacto ---------- */

  async function iniciarImpacto() {
    const area = document.getElementById('impacto-cards');
    const aviso = document.getElementById('impacto-aviso');
    if (!area) return;

    let dados;
    try {
      dados = await carregarJSON('src/data/impacto.json');
    } catch (e) {
      mostrarErro(area, e.message);
      return;
    }

    const indicadores = Object.values(dados.indicadores || {});
    const comDados = dados.publicado === true && indicadores.some((i) => typeof i.valor === 'number');

    aviso.innerHTML = comDados
      ? `<p class="fonte">Última atualização: ${esc(dataBR(dados.atualizado_em) || 'não informada')}.</p>`
      : '<p class="destaque">Os resultados do projeto ainda não foram publicados.</p>';

    area.innerHTML = `<div class="grade">${indicadores.map((i) => {
      const temValor = typeof i.valor === 'number' && Number.isFinite(i.valor);
      const valor = temValor
        ? `<span class="numero">${esc(i.valor.toLocaleString('pt-BR'))}</span> <span class="fonte">${esc(i.unidade || '')}</span>`
        : '<span class="numero sem-dados">Aguardando dados</span>';
      return `<article class="cartao indicador"><h3>${esc(i.rotulo)}</h3>${valor}</article>`;
    }).join('')}</div>`;
  }

  /* ---------- Referências ---------- */

  async function iniciarReferencias() {
    const area = document.getElementById('referencias-lista');
    if (!area) return;

    let dados;
    try {
      dados = await carregarJSON('src/data/referencias.json');
    } catch (e) {
      mostrarErro(area, e.message);
      return;
    }

    const grupos = [
      { tipo: 'oficial', titulo: 'Fontes oficiais' },
      { tipo: 'academico', titulo: 'Documento acadêmico do projeto (referência interna)' },
      { tipo: 'complementar', titulo: 'Fontes complementares' }
    ];

    area.innerHTML = grupos.map((g) => {
      const itens = (dados.referencias || []).filter((r) => r.tipo === g.tipo);
      if (!itens.length) return '';
      return `<section class="grupo-refs"><h2>${esc(g.titulo)}</h2><ul>${itens.map((r) => `
        <li>
          <strong>${esc(r.titulo)}</strong><br>
          <span class="fonte">${esc(r.instituicao)}</span><br>
          ${r.url ? `<a href="${esc(r.url)}" rel="noopener" target="_blank">${esc(r.url)}</a>` : '<span class="fonte">Link ainda não disponível</span>'}
          <br><span class="tag">${r.verificado ? 'Conferido pela equipe' : 'Ainda não conferido'}</span>
          ${r.observacoes ? `<br><span class="fonte">${esc(r.observacoes)}</span>` : ''}
        </li>`).join('')}</ul></section>`;
    }).join('');
  }

  /* ---------- inicialização ---------- */

  document.addEventListener('DOMContentLoaded', () => {
    const pagina = document.body.dataset.page || 'inicio';
    montarCabecalho(pagina);
    montarRodape();

    const iniciadores = {
      guia: iniciarGuia,
      mapa: iniciarMapa,
      impacto: iniciarImpacto,
      referencias: iniciarReferencias
    };
    if (iniciadores[pagina]) {
      iniciadores[pagina]().catch((e) => console.error(e));
    }
  });
})();
