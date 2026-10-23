/* O Lixo da Minha Casa - script principal
 * Carrega os dados de *.json e monta as páginas.
 * Não há chaves, segredos ou login neste arquivo.
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

  const REDUZIR_MOVIMENTO = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- ícones (traço, sem emojis) ---------- */

  const ICONES = {
    recicla: '<path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/>',
    pin: '<path d="M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
    livro: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>',
    grafico: '<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    seta: '<path d="M5 12h14"/><path d="M13 6l6 6-6 6"/>',
    externo: '<path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/>',
    menu: '<path d="M3 6h18"/><path d="M3 12h18"/><path d="M3 18h18"/>',
    fechar: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    localizar: '<circle cx="12" cy="12" r="7"/><path d="M12 2v3"/><path d="M12 19v3"/><path d="M2 12h3"/><path d="M19 12h3"/>',
    chevron: '<path d="M6 9l6 6 6-6"/>',
    check: '<path d="M20 6L9 17l-5-5"/>',
    x: '<path d="M18 6L6 18"/><path d="M6 6l12 12"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
    alerta: '<path d="M10.3 3.9L1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
    gota: '<path d="M12 2.7s-6 6.6-6 11a6 6 0 0 0 12 0c0-4.4-6-11-6-11z"/>',
    pessoas: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9"/><path d="M16 3.1a4 4 0 0 1 0 7.8"/>',
    tampa: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
    folha: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10z"/><path d="M2 21c0-3 1.9-5.4 5.1-6C9.5 14.5 12 13 13 12"/>',
    sinal: '<path d="M4 12h16"/><path d="M12 4v16"/>'
  };

  function icone(nome, classe) {
    const extra = classe ? ' ' + classe : '';
    return `<svg class="icone${extra}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICONES[nome] || ''}</svg>`;
  }

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
    elemento.innerHTML = `<p class="erro" role="alert">${icone('alerta', 'pequeno')}<span>${esc(mensagem)}</span></p>`;
  }

  function skeleton(quantidade) {
    return `<div class="grade" aria-busy="true" aria-label="Carregando">${
      Array.from({ length: quantidade }, () => '<div class="skeleton" aria-hidden="true"></div>').join('')
    }</div>`;
  }

  function dataBR(iso) {
    if (!iso) return null;
    const [a, m, d] = String(iso).split('-');
    if (!a || !m || !d) return iso;
    return `${d}/${m}/${a}`;
  }

  /* ---------- revelação ao rolar ---------- */

  const observador = ('IntersectionObserver' in window) && !REDUZIR_MOVIMENTO
    ? new IntersectionObserver((entradas) => {
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            const el = e.target;
            el.classList.add('visivel');
            observador.unobserve(el);
            // Remove a classe de revelação após a animação, para não interferir no hover dos cartões.
            setTimeout(() => el.classList.remove('reveal'), 1000);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;

  function revelar(el, atraso) {
    if (!observador) { el.classList.add('visivel'); return; }
    el.classList.add('reveal');
    el.style.setProperty('--d', `${atraso}ms`);
    observador.observe(el);
  }

  function ativarRevelacao(raiz) {
    const alvos = (raiz || document).querySelectorAll(
      'main h2, main .destaque, main .cartao, main .grade > *, main .lista-pontos > *, main .grupo-refs, main .mapa-caixa, main .reveal-alvo'
    );
    alvos.forEach((el) => {
      if (el.closest('.hero, .historia') || el.classList.contains('reveal') || el.classList.contains('visivel')) return;
      const irmaos = el.parentElement ? Array.from(el.parentElement.children) : [el];
      const posicao = Math.max(0, irmaos.indexOf(el));
      revelar(el, Math.min(posicao, 6) * 70);
    });
  }

  /* ---------- contador numérico ---------- */

  function animarNumero(el, alvo, duracao) {
    if (REDUZIR_MOVIMENTO) { el.textContent = alvo.toLocaleString('pt-BR'); return; }
    const inicio = performance.now();
    el.classList.add('contando');
    function passo(agora) {
      const t = Math.min(1, (agora - inicio) / duracao);
      const suave = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(alvo * suave).toLocaleString('pt-BR');
      if (t < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  /* ---------- cabeçalho, rodapé e efeitos de rolagem ---------- */

  function montarCabecalho(paginaAtual) {
    const el = document.getElementById('site-header');
    if (!el) return;
    el.innerHTML = `
      <header class="cabecalho" id="cabecalho">
        <div class="container barra">
          <a class="marca" href="index.html">
            <svg class="icone" viewBox="0 0 24 24" aria-hidden="true"><g class="arco">${ICONES.recicla}</g></svg>
            <span>O Lixo da Minha Casa</span>
          </a>
          <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="menu-principal" aria-label="Abrir menu">
            ${icone('menu')}
          </button>
          <nav id="menu-principal" class="menu" aria-label="Navegação principal">
            ${PAGINAS.map((p) => `<a href="${p.href}"${p.id === paginaAtual ? ' aria-current="page"' : ''}>${esc(p.nome)}</a>`).join('')}
          </nav>
          <span class="progresso" aria-hidden="true"></span>
        </div>
      </header>`;

    const cabecalho = el.querySelector('#cabecalho');
    const botao = el.querySelector('.menu-toggle');
    const menu = el.querySelector('.menu');
    const progresso = el.querySelector('.progresso');

    botao.addEventListener('click', () => {
      const aberto = menu.classList.toggle('aberto');
      botao.setAttribute('aria-expanded', String(aberto));
      botao.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
      botao.innerHTML = aberto ? icone('fechar') : icone('menu');
    });

    let ticking = false;
    function aoRolar() {
      const topo = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      cabecalho.classList.toggle('rolado', topo > 8);
      progresso.style.transform = `scaleX(${total > 0 ? Math.min(1, topo / total) : 0})`;
      ticking = false;
    }
    window.addEventListener('scroll', () => {
      if (!ticking) { requestAnimationFrame(aoRolar); ticking = true; }
    }, { passive: true });
    aoRolar();
  }

  function montarRodape() {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `
      <footer class="rodape">
        <div class="container">
          <p>Projeto de educação ambiental desenvolvido como trabalho acadêmico no Projeto Integrador I
          (Centro Universitário Fundação Santo André, Faculdade de Engenharia Engenheiro Celso Daniel, 2026).
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

    area.innerHTML = skeleton(4);

    let dados;
    try {
      dados = await carregarJSON('materiais.json');
    } catch (e) {
      mostrarErro(area, e.message);
      return;
    }

    const categorias = dados.categorias || {};
    const iconeCategoria = { reciclavel: 'recicla', organico: 'folha', rejeito: 'alerta', destinacao_especifica: 'gota' };

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
        area.innerHTML = `<p class="vazio">${icone('info', 'pequeno')}<span>Nenhum material encontrado com esse termo ou filtro. Tente outra palavra ou remova o filtro.</span></p>`;
        return;
      }

      area.innerHTML = `<div class="grade">${lista.map((m) => `
        <article class="cartao" id="material-${esc(m.id)}">
          <span class="selo">${icone(iconeCategoria[m.categoria] || 'recicla')}</span>
          <span class="tag neutra">${esc(categorias[m.categoria] || '')}</span>
          <h3>${esc(m.nome)}</h3>
          ${m.aviso ? `<p class="aviso">${icone('alerta')}<span>${esc(m.aviso)}</span></p>` : ''}
          <h4>Como separar</h4>
          <ul>${(m.como_separar || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
          <h4>Cuidados</h4>
          <ul>${(m.cuidados || []).map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        </article>`).join('')}</div>`;
      ativarRevelacao(area);
    }

    busca.addEventListener('input', renderizar);
    filtro.addEventListener('change', renderizar);
    renderizar();

    if (erros) {
      erros.innerHTML = (dados.erros_comuns || []).map((e) => `
        <div class="cartao">
          <h3 style="display:flex;gap:.5rem;align-items:flex-start">${icone('x', 'pequeno')}<span>${esc(e.erro)}</span></h3>
          <p style="display:flex;gap:.5rem;align-items:flex-start;margin-top:.6rem">${icone('check', 'pequeno')}<span>${esc(e.correcao)}</span></p>
        </div>`).join('');
      ativarRevelacao(erros);
    }
    if (perguntas) {
      perguntas.innerHTML = (dados.perguntas_frequentes || []).map((p) => `
        <details class="cartao" style="margin-bottom:.8rem">
          <summary><span>${esc(p.pergunta)}</span>${icone('chevron', 'pequeno')}</summary>
          <p class="corpo">${esc(p.resposta)}</p>
        </details>`).join('');
      ativarRevelacao(perguntas);
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

    listaEl.innerHTML = skeleton(3);

    if (typeof L === 'undefined') {
      mostrarErro(avisoMapa, 'O mapa não pôde ser carregado (biblioteca de mapas indisponível). Verifique sua conexão.');
      listaEl.innerHTML = '';
      return;
    }

    let dados;
    try {
      dados = await carregarJSON('pontos-coleta.json');
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

    const mapa = L.map(canvas, { zoomControl: true }).setView(CENTRO_SANTO_ANDRE, 12);
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
        listaEl.innerHTML = `<p class="vazio">${icone('info', 'pequeno')}<span>Não há locais confirmados nesta categoria no cadastro atual. Os dados dependem de informações oficiais verificadas.</span></p>`;
        return;
      }
      listaEl.innerHTML = `<div class="lista-pontos">${pontos.map((p) => `
        <article class="cartao ponto">
          <span class="tag">${esc(CATEGORIAS_PONTO[p.categoria] || p.categoria)}</span>
          ${comCoordenadas(p) ? '' : `<span class="tag neutra">Sem coordenadas no mapa</span>`}
          <h3>${esc(p.nome)}</h3>
          <dl>${linhasDetalhe(p)}</dl>
          ${comCoordenadas(p) ? `<a class="botao secundario" rel="noopener" target="_blank"
             href="https://www.google.com/maps/dir/?api=1&amp;destination=${p.latitude},${p.longitude}">
             Abrir rota ${icone('externo', 'pequeno')}</a>` : ''}
        </article>`).join('')}</div>`;
      ativarRevelacao(listaEl);
    }

    function desenharMarcadores(pontos) {
      camadas.clearLayers();
      pontos.filter(comCoordenadas).forEach((p) => {
        const marcador = L.circleMarker([p.latitude, p.longitude], {
          radius: 8, color: '#ffffff', weight: 2, fillColor: '#2f7d57', fillOpacity: 1
        }).addTo(camadas);
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
      avisoMapa.innerHTML = `<p class="vazio">${icone('info', 'pequeno')}<span>Não há locais confirmados no cadastro atual.</span></p>`;
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
      ativarRevelacao(gerais);
    }

    aplicarFiltro();

    // Busca manual por endereço (Nominatim/OpenStreetMap). Uma busca por clique.
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
        mapa.flyTo([Number(resultados[0].lat), Number(resultados[0].lon)], 15, { duration: REDUZIR_MOVIMENTO ? 0 : 1.1 });
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
          mapa.flyTo([pos.coords.latitude, pos.coords.longitude], 14, { duration: REDUZIR_MOVIMENTO ? 0 : 1.1 });
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

  const ICONE_INDICADOR = {
    residuos_reciclados_kg: 'recicla',
    familias_participantes: 'pessoas',
    oleo_coletado_litros: 'gota',
    tampinhas_arrecadadas: 'tampa'
  };

  async function iniciarImpacto() {
    const area = document.getElementById('impacto-cards');
    const aviso = document.getElementById('impacto-aviso');
    if (!area) return;

    area.innerHTML = skeleton(4);

    let dados;
    try {
      dados = await carregarJSON('impacto.json');
    } catch (e) {
      mostrarErro(area, e.message);
      return;
    }

    const entradas = Object.entries(dados.indicadores || {});
    const comDados = dados.publicado === true && entradas.some(([, i]) => typeof i.valor === 'number');

    aviso.innerHTML = comDados
      ? `<p class="fonte">Última atualização: ${esc(dataBR(dados.atualizado_em) || 'não informada')}.</p>`
      : `<p class="destaque" style="display:flex;gap:.7rem;align-items:center;margin:0 0 1.5rem;padding:1rem 1.2rem">${icone('info', 'pequeno')}<span>Os resultados do projeto ainda não foram publicados.</span></p>`;

    area.innerHTML = `<div class="grade">${entradas.map(([chave, i]) => {
      const temValor = typeof i.valor === 'number' && Number.isFinite(i.valor);
      const valor = temValor
        ? `<span class="numero" data-alvo="${i.valor}">${esc(i.valor.toLocaleString('pt-BR'))}</span><span class="unidade">${esc(i.unidade || '')}</span>`
        : '<span class="sem-dados">Aguardando dados</span>';
      return `<article class="cartao indicador">
        <span class="selo">${icone(ICONE_INDICADOR[chave] || 'grafico')}</span>
        <h3>${esc(i.rotulo)}</h3>${valor}</article>`;
    }).join('')}</div>`;

    ativarRevelacao(area);

    area.querySelectorAll('.numero[data-alvo]').forEach((el) => {
      const alvo = Number(el.dataset.alvo);
      el.textContent = '0';
      setTimeout(() => animarNumero(el, alvo, 1400), 350);
    });
  }

  /* ---------- Referências ---------- */

  async function iniciarReferencias() {
    const area = document.getElementById('referencias-lista');
    if (!area) return;

    area.innerHTML = skeleton(3);

    let dados;
    try {
      dados = await carregarJSON('referencias.json');
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
          <div class="titulo">${esc(r.titulo)}</div>
          <div class="instituicao">${esc(r.instituicao)}</div>
          ${r.url
            ? `<a href="${esc(r.url)}" rel="noopener" target="_blank">${esc(r.url)}</a>`
            : '<span class="fonte">Link ainda não disponível</span>'}
          <div class="selo-status">${r.verificado
            ? `<span class="tag">${icone('check', 'pequeno')} Conferido pela equipe</span>`
            : `<span class="tag neutra">Ainda não conferido</span>`}</div>
          ${r.observacoes ? `<p class="fonte" style="margin-top:.4rem">${esc(r.observacoes)}</p>` : ''}
        </li>`).join('')}</ul></section>`;
    }).join('');

    ativarRevelacao(area);
  }

  /* ---------- História animada 2D da página inicial ----------
   * Cenário em SVG (camadas com parallax), personagens desenhados em 2D e
   * progresso 100% controlado pela rolagem. Sem 3D, sem bibliotecas.
   * Com "reduzir movimento" ativo, a história vira uma sequência estática.
   */

  const HIST = {
    PASSOS: [0, 0.16, 0.4, 0.7],
    BIN_X: [370, 440, 510, 580],
    BIN_COR: ['#2f7de1', '#e5483a', '#2fa35a', '#f2b61d'],
    PILHA_CX: 985,
    PALETA: {
      'c-ceu-topo': ['ceu', '#0f1216', '#35577f', '#46a8e4'],
      'c-ceu-meio': ['ceu', '#262a30', '#bf8a6e', '#8fd3f0'],
      'c-ceu-base': ['ceu', '#58524d', '#f1c48c', '#e3f6d8'],
      'c-predio': ['ceu', '#22262b', '#6b6a7a', '#86b3c6'],
      'c-colina1': ['terra', '#2e3235', '#547160', '#7cc08f'],
      'c-colina2': ['terra', '#282c2e', '#44684f', '#4fae6e'],
      'c-solo': ['terra', '#201f1d', '#463d33', '#6f5a40'],
      'c-grama': ['terra', '#2d2f2a', '#4f6e45', '#5fbf5b'],
      'c-trilha': ['terra', '#3a3836', '#9b8468', '#d9c79e']
    },
    ELENCO: [
      { pele: '#c98e66', camisa: '#1f8f8a', calca: '#2b3a55', cabelo: '#2a1d17', esc: 1, cab: 14, longo: true, bin: 0, x0: -170, cic: 3, atraso: 0, off: 0 },
      { pele: '#6e4a35', camisa: '#e08a2c', calca: '#3b4a3f', cabelo: '#16110f', esc: 1.04, cab: 14, longo: false, bin: 1, x0: -320, cic: 3, atraso: 0.04, off: -34 },
      { pele: '#f0c39c', camisa: '#d95a7a', calca: '#4b5fa8', cabelo: '#7a4a22', esc: 0.68, cab: 17, longo: true, bin: 2, x0: -90, cic: 3, atraso: 0.08, off: -68 }
    ]
  };

  const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const faixa = (p, ini, fim) => limitar((p - ini) / (fim - ini));
  const suave = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const virar = (t, de) => { const v = de * (1 - 2 * suave(limitar(t))); return (v >= 0 ? 1 : -1) * (0.42 + 0.58 * Math.abs(v)); };
  const pulso = (g, subida, descida) => (g < subida ? suave(g / subida) : g < 1 - descida ? 1 : 1 - suave((g - (1 - descida)) / descida));

  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function misturar(a, b, t) { const A = hexRgb(a); const B = hexRgb(b); return A.map((v, i) => Math.round(lerp(v, B[i], t))); }
  function cor3(a, b, c, t) { return t < 0.5 ? misturar(a, b, t * 2) : misturar(b, c, (t - 0.5) * 2); }
  function escurecer(h, f) { const [r, g, b] = hexRgb(h); return `rgb(${Math.round(r * (1 - f))},${Math.round(g * (1 - f))},${Math.round(b * (1 - f))})`; }

  function semente(n) {
    let a = n >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* --- peças desenhadas em SVG --- */

  function itemSVG(tipo, s, cor) {
    const f = (n) => (n * s).toFixed(1);
    if (tipo === 'saco') {
      return `<path d="M0 ${f(-1)} C${f(.85)} ${f(-.9)} ${f(1.05)} ${f(.35)} ${f(.5)} ${f(.75)} C${f(.15)} ${f(1)} ${f(-.6)} ${f(.95)} ${f(-.85)} ${f(.3)} C${f(-1.1)} ${f(-.4)} ${f(-.4)} ${f(-1)} 0 ${f(-1)}Z" fill="${cor}"/>` +
        `<path d="M${f(-.2)} ${f(-.95)} q${f(.2)} ${f(-.32)} ${f(.45)} 0" fill="none" stroke="${cor}" stroke-width="${(s * .12).toFixed(1)}" stroke-linecap="round"/>` +
        `<ellipse cx="${f(-.3)}" cy="${f(-.3)}" rx="${f(.22)}" ry="${f(.11)}" fill="#fff" opacity=".2" transform="rotate(-30 ${f(-.3)} ${f(-.3)})"/>`;
    }
    if (tipo === 'caixa') {
      return `<rect x="${f(-.8)}" y="${f(-.6)}" width="${f(1.6)}" height="${f(1.2)}" rx="2" fill="${cor}"/>` +
        `<rect x="${f(-.8)}" y="${f(-.08)}" width="${f(1.6)}" height="${f(.16)}" fill="#000" opacity=".16"/>` +
        `<rect x="${f(-.1)}" y="${f(-.6)}" width="${f(.2)}" height="${f(1.2)}" fill="#e6d8b0" opacity=".55"/>`;
    }
    if (tipo === 'garrafa') {
      return `<rect x="${f(-.28)}" y="${f(-.5)}" width="${f(.56)}" height="${f(1)}" rx="${f(.14)}" fill="${cor}"/>` +
        `<rect x="${f(-.12)}" y="${f(-.84)}" width="${f(.24)}" height="${f(.4)}" rx="${f(.06)}" fill="${cor}"/>` +
        `<rect x="${f(-.15)}" y="${f(-.95)}" width="${f(.3)}" height="${f(.13)}" rx="1.5" fill="#eceff1"/>` +
        `<rect x="${f(-.18)}" y="${f(-.3)}" width="${f(.1)}" height="${f(.6)}" rx="1.5" fill="#fff" opacity=".28"/>`;
    }
    if (tipo === 'lata') {
      return `<rect x="${f(-.3)}" y="${f(-.45)}" width="${f(.6)}" height="${f(.9)}" rx="${f(.08)}" fill="${cor}"/>` +
        `<ellipse cx="0" cy="${f(-.45)}" rx="${f(.3)}" ry="${f(.09)}" fill="#fff" opacity=".35"/>` +
        `<rect x="${f(-.3)}" y="${f(-.1)}" width="${f(.6)}" height="${f(.2)}" fill="#000" opacity=".14"/>`;
    }
    // papel amassado
    const pts = [[-.7, -.2], [-.3, -.7], [.3, -.6], [.75, -.1], [.5, .55], [-.1, .7], [-.65, .4]]
      .map(([x, y]) => `${f(x)},${f(y)}`).join(' ');
    return `<polygon points="${pts}" fill="${cor}"/><path d="M${f(-.4)} ${f(-.3)} L${f(.1)} ${f(.1)} L${f(.4)} ${f(-.2)}" stroke="#000" stroke-opacity=".15" fill="none"/>`;
  }

  const TIPOS_LIXO = ['saco', 'saco', 'saco', 'caixa', 'garrafa', 'lata', 'papel', 'saco', 'caixa', 'garrafa'];
  const COR_LIXO = {
    saco: ['#16181b', '#1f2327', '#cfd3d6', '#b9bfc4', '#e3e5e6', '#7f8a94', '#2b3036'],
    caixa: ['#9c7448', '#b48a58', '#85623c', '#a98253'],
    garrafa: ['#5a9bd5', '#7bc47f', '#d9dcde', '#e07a5f', '#b9d3e6'],
    lata: ['#c0c4c8', '#d95f4e', '#4a7fb5', '#9aa1a6'],
    papel: ['#dcdad0', '#bdb9ab', '#cfcabb']
  };

  function sortearItem(r, tipo) { const lista = COR_LIXO[tipo]; return lista[Math.floor(r() * lista.length)]; }

  function itemPosicionado(r, tipo, x, y, s, flutuar) {
    const cor = sortearItem(r, tipo);
    const rot = (r() * 360).toFixed(0);
    const miolo = itemSVG(tipo, s, cor);
    if (flutuar) {
      const amp = ((2 + r() * 3) * (r() > 0.5 ? 1 : -1)).toFixed(1);
      return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})"><g class="tremula" style="--a:${amp}">${miolo}</g></g>`;
    }
    return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rot})">${miolo}</g>`;
  }

  function nuvemSVG(r, cores, x, y, escala) {
    const partes = [];
    const n = 4 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const rx = (80 + r() * 90) * escala;
      const ry = (24 + r() * 22) * escala;
      const dx = (i - n / 2) * 70 * escala + (r() - 0.5) * 40;
      const dy = (r() - 0.5) * 26 * escala;
      const c = cores[Math.floor(r() * cores.length)];
      partes.push(`<ellipse cx="${(x + dx).toFixed(0)}" cy="${(y + dy).toFixed(0)}" rx="${rx.toFixed(0)}" ry="${ry.toFixed(0)}" fill="${c}" opacity="${(0.6 + r() * 0.35).toFixed(2)}"/>`);
    }
    return partes.join('');
  }

  function lixeiraSVG(x, cor, i) {
    const escura = escurecer(cor, 0.22);
    return `<g class="lixeira" transform="translate(${x} 774)">
      <ellipse cx="0" cy="3" rx="34" ry="5" fill="#000" opacity=".2"/>
      <path d="M-25 -62 L25 -62 L21 0 L-21 0Z" fill="${cor}"/>
      <path d="M-25 -62 L-14 -62 L-11 0 L-21 0Z" fill="#fff" opacity=".14"/>
      <path d="M-23 -40 L23 -40 L22 -33 L-22 -33Z" fill="${escura}" opacity=".55"/>
      <g transform="translate(-11 -57) scale(1.05)" fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" opacity=".92">
        <path d="M21 12a9 9 0 1 1-2.64-6.36" transform="scale(.8) translate(2 2)"/><path d="M21 3v6h-6" transform="scale(.8) translate(2 2)"/>
      </g>
      <g class="tampa" data-i="${i}" transform="translate(-25 -62)"><g class="tampa-r"><rect x="-3" y="-9" width="56" height="10" rx="4" fill="${escura}"/><rect x="-3" y="-9" width="56" height="4" rx="2" fill="#fff" opacity=".18"/></g></g>
    </g>`;
  }

  function pessoaSVG(o) {
    const camisaL = escurecer(o.camisa, 0.2);
    const calcaL = escurecer(o.calca, 0.22);
    const peleL = escurecer(o.pele, 0.14);
    const sapato = '#1e2428';
    const r = o.cab;
    const cx = 3;
    const hy = -(56 + r + 1);
    const perna = (suf, cor, sap) => `<g transform="translate(0 -78)"><g class="coxa${suf}" transform="rotate(0)">
        <path d="M0 0V40" stroke="${cor}" stroke-width="13" stroke-linecap="round" fill="none"/>
        <g transform="translate(0 40)"><g class="canela${suf}" transform="rotate(0)">
          <path d="M0 0V36" stroke="${cor}" stroke-width="11" stroke-linecap="round" fill="none"/>
          <ellipse cx="7" cy="34" rx="12" ry="5.5" fill="${sap}"/>
        </g></g></g></g>`;
    const braco = (suf, manga, pele, carga) => `<g transform="translate(0 -48)"><g class="ombro${suf}" transform="rotate(0)">
        <path d="M0 0V24" stroke="${manga}" stroke-width="9" stroke-linecap="round" fill="none"/>
        <g transform="translate(0 23)"><g class="cotovelo${suf}" transform="rotate(0)">
          <path d="M0 0V20" stroke="${pele}" stroke-width="8" stroke-linecap="round" fill="none"/>
          <circle cx="0" cy="23" r="5" fill="${pele}"/>
          ${carga ? '<g class="carga" opacity="0"><rect class="carga-f" x="-4" y="12" width="24" height="26" rx="5" fill="#2f7de1"/><rect x="-4" y="12" width="24" height="7" rx="3" fill="#fff" opacity=".28"/></g>' : ''}
        </g></g></g></g>`;
    const cabelo = `<path d="M${cx - r} ${hy}A${r} ${r} 0 0 1 ${cx + r} ${hy}Q${cx + r * 0.25} ${hy - r * 0.3} ${cx - r} ${hy}Z" fill="${o.cabelo}"/>` +
      (o.longo ? `<path d="M${cx - r} ${hy}C${cx - r - 6} ${hy + r * 0.8} ${cx - r - 4} ${hy + r * 1.7} ${cx - r + 5} ${hy + r * 1.9}L${cx - r * 0.2} ${hy + r * 0.5}Z" fill="${o.cabelo}"/>` : '');
    return `<g class="pessoa"><g class="pos" transform="translate(0 0)">
        <ellipse cx="2" cy="2" rx="${(30 * o.esc).toFixed(0)}" ry="5" fill="#000" opacity=".22"/>
        <g class="dir" transform="scale(1 1)"><g transform="scale(${o.esc})"><g class="corpo" transform="translate(0 0)">
          ${perna('B', calcaL, '#151a1e')}
          <g transform="translate(0 -78)"><g class="tronco" transform="rotate(0)">
            ${braco('B', camisaL, peleL, false)}
            <path d="M0 2V-16" stroke="${o.calca}" stroke-width="24" stroke-linecap="round" fill="none"/>
            <path d="M0 -12V-48" stroke="${o.camisa}" stroke-width="26" stroke-linecap="round" fill="none"/>
            <rect x="-4" y="-66" width="8" height="12" rx="3" fill="${o.pele}"/>
            <circle cx="${cx}" cy="${hy}" r="${r}" fill="${o.pele}"/>
            ${cabelo}
            <circle cx="${(cx + r * 0.58).toFixed(1)}" cy="${hy + 1}" r="1.8" fill="#1b1b1b"/>
            ${braco('A', o.camisa, o.pele, true)}
          </g></g>
          ${perna('A', o.calca, sapato)}
        </g></g></g></g></g>`;
  }

  /* --- geração do cenário (roda uma vez) --- */

  function popularCena(cena) {
    const g = (nome) => cena.querySelector(`[data-g="${nome}"]`);
    const leve = window.innerWidth < 700 || (navigator.deviceMemory && navigator.deviceMemory <= 4);
    const dens = leve ? 0.62 : 1;

    // Prédios distantes
    let r = semente(11);
    let html = '';
    for (let x = -260; x < 1860;) {
      const w = 34 + r() * 46;
      const h = 50 + r() * r() * 190;
      html += `<rect x="${x.toFixed(0)}" y="${(668 - h).toFixed(0)}" width="${w.toFixed(0)}" height="${h.toFixed(0)}"/>`;
      if (r() > 0.7) html += `<rect x="${(x + w / 2 - 1).toFixed(0)}" y="${(668 - h - 22).toFixed(0)}" width="2" height="22"/>`;
      x += w + 2 + r() * 8;
    }
    g('predios').innerHTML = html;

    // Chaminés com fumaça
    const chamines = [[130, 190], [300, 160], [1540, 175]];
    html = '';
    chamines.forEach(([x, h], ci) => {
      html += `<rect class="chamine" x="${x}" y="${668 - h}" width="22" height="${h}"/><rect class="chamine-faixa" x="${x}" y="${668 - h}" width="22" height="9"/>`;
      for (let i = 0; i < 4; i++) {
        html += `<ellipse class="fumaca-bola" cx="${x + 11}" cy="${668 - h}" rx="26" ry="18" data-f="${(i * 0.25 + ci * 0.1).toFixed(2)}"/>`;
      }
    });
    g('fumaca').innerHTML = html;

    // Nuvens de poluição e nuvens claras (linhas extras aparecem em telas verticais)
    r = semente(23);
    const linhasEscuras = [400, 300, 190, 80, -40, -170, -310, -450, -600, -760];
    html = '';
    html += '<g class="deriva">';
    linhasEscuras.forEach((y) => {
      const n = leve ? 2 : 3;
      for (let k = 0; k < n; k++) {
        html += nuvemSVG(r, ['#15181c', '#20242a', '#2c3036', '#394048'], -80 + (k + r() * 0.8) * (1800 / n), y + r() * 40, 1 + r() * 0.5);
      }
    });
    html += '</g>';
    g('nuvens-escuras').innerHTML = html;

    html = '<g class="deriva inversa">';
    [380, 250, 130, 10, -130, -270, -420].forEach((y) => {
      for (let k = 0; k < 2; k++) {
        html += nuvemSVG(r, ['#ffffff', '#f3fbff', '#e1f3fb'], 100 + (k + r() * 0.7) * 800, y + r() * 30, 0.9 + r() * 0.5);
      }
    });
    html += '</g>';
    g('nuvens-claras').innerHTML = html;

    // Turbinas eólicas na colina distante
    html = '';
    [[250, 584, 1], [1215, 596, 0.85], [1500, 576, 0.7], [90, 612, 0.6]].forEach(([x, y, s], i) => {
      html += `<g transform="translate(${x} ${y - 112 * s}) scale(${s})"><path class="torre" d="M-3.5 0L3.5 0L2 112L-2 112Z"/><g class="helice" data-v="${(0.9 + i * 0.25).toFixed(2)}">` +
        '<path d="M0 0L-4 -64L0 -74L4 -64Z"/><path d="M0 0L-4 -64L0 -74L4 -64Z" transform="rotate(120)"/><path d="M0 0L-4 -64L0 -74L4 -64Z" transform="rotate(240)"/>' +
        '<circle r="5.5"/></g></g>';
    });
    g('turbinas').innerHTML = html;

    // Árvores e arbustos (crescem com a transformação)
    const copas = ['#2f9e57', '#3fb765', '#58c878', '#287f48'];
    const arvore = (x, y, s, d) => {
      const c = (i) => copas[(i + Math.round(x)) % copas.length];
      return `<g class="arvore" style="transform-origin:${x}px ${y}px;--d:${d}">` +
        `<rect x="${x - 5 * s}" y="${y - 70 * s}" width="${10 * s}" height="${70 * s}" rx="3" fill="#7a5a3a"/>` +
        `<circle cx="${x}" cy="${y - 100 * s}" r="${40 * s}" fill="${c(0)}"/>` +
        `<circle cx="${x - 26 * s}" cy="${y - 78 * s}" r="${28 * s}" fill="${c(1)}"/>` +
        `<circle cx="${x + 27 * s}" cy="${y - 80 * s}" r="${27 * s}" fill="${c(2)}"/>` +
        `<circle cx="${x - 10 * s}" cy="${y - 112 * s}" r="${15 * s}" fill="#fff" opacity=".12"/></g>`;
    };
    const arbusto = (x, y, s, d) => `<g class="arvore" style="transform-origin:${x}px ${y}px;--d:${d}">` +
      `<circle cx="${x - 16 * s}" cy="${y - 14 * s}" r="${18 * s}" fill="#2f9e57"/><circle cx="${x + 12 * s}" cy="${y - 18 * s}" r="${22 * s}" fill="#3fb765"/><circle cx="${x + 34 * s}" cy="${y - 10 * s}" r="${14 * s}" fill="#287f48"/></g>`;
    g('arvores-fundo').innerHTML = [[90, 716, 0.6, 0.35], [205, 712, 0.5, 0.45], [330, 722, 0.55, 0.3], [1420, 726, 0.55, 0.4], [1535, 716, 0.6, 0.5], [1650, 712, 0.5, 0.38]].map((a) => arvore(...a)).join('');
    g('arvores').innerHTML = [
      arvore(60, 786, 1.15, 0.1), arvore(190, 790, 0.95, 0.3), arbusto(268, 790, 1, 0.5),
      arvore(1405, 784, 1.2, 0.15), arvore(1545, 790, 1, 0.32), arbusto(1640, 792, 1.1, 0.55), arbusto(1330, 790, 0.9, 0.45)
    ].join('');

    // Montanha de lixo
    r = semente(7);
    const itens = [];
    const total = Math.round(250 * dens);
    for (let i = 0; i < total; i++) {
      const h = Math.pow(r(), 0.85) * 0.97;
      const meia = 335 * Math.pow(1 - h, 1.05);
      const cxh = HIST.PILHA_CX + 20 * h;
      const s = lerp(40, 20, h) * (0.65 + r() * 0.8);
      const x = cxh + (r() * 2 - 1) * Math.max(4, meia * 0.92 - s * 0.45);
      const y = Math.min(779 - s * 0.85, 782 - h * 412 + (r() - 0.5) * 14);
      itens.push({ x, y, s, tipo: TIPOS_LIXO[Math.floor(r() * TIPOS_LIXO.length)] });
    }
    itens.sort((a, b) => a.y - b.y);
    g('pilha-itens').innerHTML = itens.map((it, i) => itemPosicionado(r, it.tipo, it.x, it.y, it.s, i % 40 === 0)).join('');

    // Lixo solto no chão
    html = '';
    for (let i = 0; i < Math.round(18 * dens); i++) {
      const lado = r() > 0.5;
      const x = lado ? 1330 + r() * 360 : -60 + r() * 680;
      html += itemPosicionado(r, TIPOS_LIXO[Math.floor(r() * TIPOS_LIXO.length)], x, 800 + r() * 70, 11 + r() * 8, false);
    }
    g('solto').innerHTML = html;

    // Sacolas e papéis levados pelo vento
    html = '';
    for (let i = 0; i < (leve ? 3 : 6); i++) {
      const y = 230 + r() * 330;
      html += `<g class="voa" data-y="${y.toFixed(0)}" data-f="${r().toFixed(2)}" data-d="${(26 + r() * 14).toFixed(0)}"><g class="tremula" style="--a:${((6 + r() * 6) * (i % 2 ? 1 : -1)).toFixed(1)}">${itemSVG(i % 3 === 2 ? 'papel' : 'saco', 15 + r() * 6, i % 2 ? '#d9dcdf' : '#1c1f23')}</g></g>`;
    }
    g('voa').innerHTML = html;

    // Lixeiras da coleta seletiva
    g('lixeiras').innerHTML = HIST.BIN_X.map((x, i) => lixeiraSVG(x, HIST.BIN_COR[i], i)).join('');

    // Personagens e caminhantes distantes
    g('pessoas').innerHTML = HIST.ELENCO.map((o) => pessoaSVG(o)).join('');
    g('passeantes').innerHTML = [
      { pele: '#c98e66', camisa: '#e0a43c', calca: '#34495e', cabelo: '#2a1d17', esc: 0.3, cab: 14, longo: true },
      { pele: '#8a5a40', camisa: '#4aa3a0', calca: '#3b3b4f', cabelo: '#16110f', esc: 0.3, cab: 14, longo: false }
    ].map((o) => pessoaSVG(o)).join('');

    // Grama e flores do primeiro plano
    html = '';
    for (let i = 0; i < Math.round(64 * dens); i++) {
      const x = -180 + r() * 1960;
      const y = 806 + r() * 94;
      const h = 22 + r() * 40;
      const lean = (r() - 0.5) * 18;
      html += `<g class="lamina" style="transform-origin:${x.toFixed(0)}px ${y.toFixed(0)}px;--a:${((1.5 + r() * 4) * (r() > 0.5 ? 1 : -1)).toFixed(1)}"><path d="M${x.toFixed(0)} ${y.toFixed(0)}Q${(x + lean / 2).toFixed(0)} ${(y - h / 2).toFixed(0)} ${(x + lean).toFixed(0)} ${(y - h).toFixed(0)}"/></g>`;
    }
    g('grama').innerHTML = html;
    html = '';
    const corFlor = ['#ffd166', '#ef476f', '#f78fb3', '#ffffff', '#ff9f1c'];
    for (let i = 0; i < Math.round(30 * dens); i++) {
      const x = -150 + r() * 1900;
      const y = 820 + r() * 70;
      html += `<g><path d="M${x.toFixed(0)} ${y.toFixed(0)}l0 -${(12 + r() * 10).toFixed(0)}" stroke="#2f8f50" stroke-width="2" fill="none"/><circle cx="${x.toFixed(0)}" cy="${(y - 16).toFixed(0)}" r="${(3.5 + r() * 3).toFixed(1)}" fill="${corFlor[i % corFlor.length]}"/></g>`;
    }
    g('flores').innerHTML = html;

    // Pássaros
    html = '';
    [[210, 0], [300, 90], [180, 170], [260, 250], [330, 330]].forEach(([y, o], i) => {
      html += `<g class="ave" data-o="${o}" data-y="${y}"><path d="M0 0Q8 -9 16 0Q24 -9 32 0" style="--p:${(i * 0.9).toFixed(2)}"/></g>`;
    });
    g('aves').innerHTML = html;
  }

  /* --- poses dos personagens (função pura do progresso) --- */

  function trajeto(u, c, xp) {
    const ENT = 0.17;
    const xb = c.xb;
    const d = { x: xb, dir: 1, bend: 0, wLevar: 0, kDep: 0, carga: 0, aberta: 0, sentido: 1 };
    if (u <= 0) { d.x = c.x0; return d; }
    if (u < ENT) { d.x = lerp(c.x0, xb, u / ENT); return d; }
    const w = ((u - ENT) / (1 - ENT)) * c.cic;
    let ci = Math.floor(w);
    let f = w - ci;
    if (ci >= c.cic) { ci = c.cic - 1; f = 1; }
    d.ciclo = ci;
    if (f < 0.32) {
      d.x = lerp(xb, xp, f / 0.32);
    } else if (f < 0.52) {
      const g = (f - 0.32) / 0.2;
      d.x = xp;
      d.bend = pulso(g, 0.35, 0.35);
      d.carga = g > 0.55 ? 1 : 0;
      d.wLevar = suave(faixa(g, 0.6, 1));
    } else if (f < 0.84) {
      d.x = lerp(xp, xb, (f - 0.52) / 0.32);
      d.dir = virar(faixa(f, 0.52, 0.57), 1);
      d.sentido = -1;
      d.carga = 1;
      d.wLevar = 1;
    } else {
      const g = (f - 0.84) / 0.16;
      d.x = xb;
      d.dir = -virar(faixa(f, 0.84, 0.89), 1);
      d.kDep = pulso(g, 0.3, 0.35);
      d.carga = g < 0.55 ? 1 : 0;
      d.wLevar = g < 0.55 ? 1 : 1 - suave(faixa(g, 0.55, 0.9));
      d.aberta = pulso(g, 0.2, 0.3);
    }
    return d;
  }

  const PASSO_CAMINHADA = (Math.PI * 2) / 84;

  function fase(d, xp) {
    return d.sentido === -1 ? (2 * xp - d.x) * PASSO_CAMINHADA : d.x * PASSO_CAMINHADA;
  }

  function aplicarPose(r, d) {
    const a = d.amp;
    const b = d.bend || 0;
    const s = Math.sin(d.phi);
    const c = Math.cos(d.phi);
    const set = (el, v) => { if (el && el.__v !== v) { el.__v = v; el.setAttribute('transform', v); } };
    set(r.pos, `translate(${d.x.toFixed(1)} ${d.y})`);
    set(r.dir, `scale(${d.dir.toFixed(3)} 1)`);
    set(r.corpo, `translate(${(-22 * b).toFixed(1)} ${(28 * b).toFixed(1)})`);
    set(r.coxaA, `rotate(${lerp(-a * 30 * s, -70, b).toFixed(1)})`);
    set(r.coxaB, `rotate(${lerp(a * 30 * s, -64, b).toFixed(1)})`);
    set(r.canelaA, `rotate(${lerp(a * (8 + 38 * Math.max(0, c)), 86, b).toFixed(1)})`);
    set(r.canelaB, `rotate(${lerp(a * (8 + 38 * Math.max(0, -c)), 80, b).toFixed(1)})`);
    set(r.tronco, `rotate(${(42 * b + a * 3).toFixed(1)})`);
    if (r.ombroA) {
      const lv = d.wLevar || 0;
      const kd = d.kDep || 0;
      let oA = lerp(a * 26 * s, -48, lv);
      let cA = lerp(-10 * a - 4, -78, lv);
      let oB = lerp(-a * 26 * s, -42, lv);
      let cB = lerp(-10 * a - 4, -70, lv);
      oA = lerp(oA, -86, b); cA = lerp(cA, -12, b);
      oB = lerp(oB, -76, b); cB = lerp(cB, -10, b);
      oA = lerp(oA, -100, kd); cA = lerp(cA, -8, kd);
      oB = lerp(oB, -72, kd); cB = lerp(cB, -22, kd);
      set(r.ombroA, `rotate(${oA.toFixed(1)})`);
      set(r.cotoveloA, `rotate(${cA.toFixed(1)})`);
      set(r.ombroB, `rotate(${oB.toFixed(1)})`);
      set(r.cotoveloB, `rotate(${cB.toFixed(1)})`);
      if (r.carga) {
        const v = d.carga ? '1' : '0';
        if (r.carga.__o !== v) { r.carga.__o = v; r.carga.setAttribute('opacity', v); }
      }
    }
  }

  function coletarPessoa(el) {
    const q = (cl) => el.querySelector('.' + cl);
    return {
      pos: q('pos'), dir: q('dir'), corpo: q('corpo'), tronco: q('tronco'),
      coxaA: q('coxaA'), coxaB: q('coxaB'), canelaA: q('canelaA'), canelaB: q('canelaB'),
      ombroA: q('ombroA'), ombroB: q('ombroB'), cotoveloA: q('cotoveloA'), cotoveloB: q('cotoveloB'),
      carga: q('carga'), cargaF: q('carga-f')
    };
  }

  /* --- controlador de uma cena (serve para a animação e para os quadros estáticos) --- */

  function criarCena(cena) {
    const $ = (s) => cena.querySelector(s);
    const $$ = (s) => Array.from(cena.querySelectorAll(s));
    const pessoas = $$('[data-g="pessoas"] .pessoa').map(coletarPessoa);
    pessoas.forEach((r, i) => {
      const o = HIST.ELENCO[i];
      r.cfg = Object.assign({}, o, { xb: HIST.BIN_X[o.bin] - 48 * o.esc });
      if (r.cargaF) r.cargaF.setAttribute('fill', HIST.BIN_COR[o.bin]);
    });
    const tampas = $$('.tampa-r');
    const passeantes = $$('[data-g="passeantes"] .pessoa').map(coletarPessoa);
    const num = (el, nome) => parseFloat(el.dataset[nome] || el.style.getPropertyValue('--' + nome)) || 0;
    // Elementos que mudam com a rolagem. Os estilos são gravados direto nesses elementos
    // (e não em variáveis CSS na raiz), para o navegador recalcular o mínimo a cada quadro.
    const R = {
      ceu: $('.ceu-fundo'), vinheta: $('.cena-vinheta'),
      camadas: $$('.camada').map((el) => ({ el, k: num(el, 'k') })),
      sol: $('.sol'), solPos: $('.sol-pos'), raios: $('.raios'), halo: $('.sol-halo'), bruma: $('.bruma'),
      escuras: $('.nuvens.escuras'), claras: $('.nuvens.claras'), fumacaG: $('.fumaca-g'), predios: $('.predios'),
      c1: $('.colina.c1'), c2: $('.colina.c2'), turb: $('.turbinas'), passe: $('.passeantes'),
      solo: $('.solo'), faixa: $('.grama-faixa'), trilha: $('.trilha-chao'), sombra: $('.sombra-pilha'),
      pilha: $('.pilha'), veu: $('.pilha-veu'), solto: $('.solto'), voaG: $('.voa-g'), lix: $('.lixeiras'),
      arvores: $$('.arvore').map((el) => ({ el, d: num(el, 'd') })),
      solar: $('.painel-solar'), gramaG: $('.grama-g'), flores: $('.flores-g'), avesG: $('.aves'),
      aves: $$('.ave').map((el) => ({ el, o: num(el, 'o'), y: num(el, 'y') }))
    };
    const est = (el, prop, v) => { const k = '_' + prop; if (el && el[k] !== v) { el[k] = v; el.style[prop] = v; } };
    const f3 = (n) => n.toFixed(3);

    function atualizar(p) {
      const ceu = suave(faixa(p, 0.14, 0.6));
      const terra = suave(faixa(p, 0.28, 0.82));
      const cor = (k) => {
        const [dr, a1, b1, c1] = HIST.PALETA[k];
        const [r, g, b2] = cor3(a1, b1, c1, dr === 'ceu' ? ceu : terra);
        return `rgb(${r},${g},${b2})`;
      };
      est(R.ceu, 'background', `linear-gradient(180deg, ${cor('c-ceu-topo')} 0%, ${cor('c-ceu-meio')} 46%, ${cor('c-ceu-base')} 76%)`);
      est(R.predios, 'fill', cor('c-predio'));
      est(R.c1, 'fill', cor('c-colina1'));
      est(R.c2, 'fill', cor('c-colina2'));
      est(R.solo, 'fill', cor('c-solo'));
      est(R.faixa, 'fill', cor('c-grama'));
      est(R.trilha, 'fill', cor('c-trilha'));
      est(R.gramaG, 'stroke', cor('c-grama'));

      const par = p * 2 - 1;
      R.camadas.forEach((c) => est(c.el, 'transform', `translateX(${(par * c.k).toFixed(1)}px)`));

      const fumaca = 1 - suave(faixa(p, 0.1, 0.5));
      est(R.escuras, 'opacity', f3(fumaca));
      est(R.escuras, 'transform', `translateY(${((1 - fumaca) * -140).toFixed(1)}px)`);
      est(R.fumacaG, 'opacity', f3(fumaca));
      est(R.voaG, 'opacity', f3(fumaca * 0.9));
      est(R.claras, 'opacity', f3(suave(faixa(p, 0.3, 0.7))));

      const raios = suave(faixa(p, 0.18, 0.52)) * (1 - 0.45 * faixa(p, 0.72, 1));
      est(R.raios, 'opacity', f3(raios));
      est(R.halo, 'opacity', f3(0.25 + raios * 0.75));
      est(R.bruma, 'opacity', f3(raios * 0.7));
      est(R.solPos, 'transform', `translateY(${lerp(520, -30, suave(faixa(p, 0.12, 0.58))).toFixed(1)}px)`);
      est(R.sol, 'opacity', f3(suave(faixa(p, 0.1, 0.3))));

      const ps = lerp(1, 0.2, suave(faixa(p, 0.4, 0.95)));
      est(R.pilha, 'transform', `scale(${f3(ps)})`);
      est(R.sombra, 'transform', `scaleX(${f3(ps)})`);
      est(R.veu, 'opacity', f3((1 - ceu) * 0.34));
      est(R.vinheta, 'opacity', f3(0.35 + (1 - ceu) * 0.65));
      est(R.solto, 'opacity', f3(1 - suave(faixa(p, 0.5, 0.86))));

      const lix = suave(faixa(p, 0.4, 0.54));
      est(R.lix, 'opacity', f3(lix));
      est(R.lix, 'transform', `translateY(${((1 - lix) * 46).toFixed(1)}px)`);

      const verde = faixa(p, 0.6, 0.95);
      R.arvores.forEach((a2) => est(a2.el, 'transform', `scale(${f3(limitar((verde * 1.75 - a2.d) * 2.6))})`));
      est(R.solar, 'opacity', f3(limitar(verde * 1.4)));
      est(R.gramaG, 'opacity', f3(limitar(verde * 1.3)));
      est(R.gramaG, 'transform', `translateY(${((1 - verde) * 34).toFixed(1)}px)`);
      est(R.flores, 'opacity', f3(limitar(verde * 1.2)));
      est(R.passe, 'opacity', f3(verde));
      est(R.turb, 'opacity', f3(suave(faixa(p, 0.55, 0.85))));
      const aves = faixa(p, 0.82, 1);
      est(R.avesG, 'opacity', f3(aves));
      R.aves.forEach((a2) => est(a2.el, 'transform', `translate(${(aves * 2000 - 260 + a2.o).toFixed(1)}px, ${(a2.y - aves * 60).toFixed(1)}px)`));

      // personagens da família
      const abertas = [0, 0, 0, 0];
      pessoas.forEach((r) => {
        const c = r.cfg;
        const xp = HIST.PILHA_CX - 335 * ps - 36 + c.off;
        const u = faixa(p, 0.38 + c.atraso, 0.92);
        const d = trajeto(u, c, xp);
        const d0 = trajeto(Math.max(0, u - 0.003), c, xp);
        d.amp = limitar(Math.abs(d.x - d0.x) / 6);
        d.phi = fase(d, xp);
        d.y = 792;
        aplicarPose(r, d);
        est(r.pos, 'visibility', u <= 0 ? 'hidden' : 'visible');
        abertas[c.bin] = Math.max(abertas[c.bin], d.aberta || 0);
      });
      tampas.forEach((t, i) => {
        const val = `rotate(${(-68 * abertas[i]).toFixed(1)})`;
        if (t.__v !== val) { t.__v = val; t.setAttribute('transform', val); }
      });

      // caminhantes ao fundo
      passeantes.forEach((r, i) => {
        const t = faixa(p, 0.72, 1);
        const x = i === 0 ? lerp(1330, 1470, t) : lerp(1570, 1400, t);
        aplicarPose(r, { x, y: 724, dir: i === 0 ? 1 : -1, phi: Math.abs(x) * PASSO_CAMINHADA * 2.2, amp: t > 0 && t < 1 ? 1 : 0, bend: 0, wLevar: 0, kDep: 0, carga: 0 });
      });
    }
    return { atualizar };
  }

  /* --- movimento ambiente: só roda quando a rolagem está parada, para não competir com ela --- */

  function criarAmbiente(cena) {
    const $$ = (s) => Array.from(cena.querySelectorAll(s));
    const fumos = $$('.fumaca-bola').map((el) => ({ el, f: parseFloat(el.dataset.f), cx: parseFloat(el.getAttribute('cx')), cy: parseFloat(el.getAttribute('cy')) }));
    const helices = $$('.helice').map((el) => ({ el, v: parseFloat(el.dataset.v) }));
    const voam = $$('.voa').map((el) => ({ el, y: parseFloat(el.dataset.y), f: parseFloat(el.dataset.f), d: parseFloat(el.dataset.d) }));
    const derivas = $$('.deriva').map((el) => ({ el, k: el.classList.contains('inversa') ? -0.7 : 1 }));
    const raios = cena.querySelector('.raios');
    const balancos = $$('.tremula, .lamina').map((el) => ({ el, a: parseFloat(el.style.getPropertyValue('--a')) || 3 }));
    const asas = $$('.ave path');
    let t = 0;
    return function passo(dt) {
      t += dt;
      const drift = Math.sin(t / 11) * 70;
      derivas.forEach((d) => { d.el.style.transform = `translateX(${(drift * d.k).toFixed(1)}px)`; });
      raios.style.transform = `rotate(${((t * 2.2) % 360).toFixed(2)}deg)`;
      const vento = Math.sin(t * 1.1);
      balancos.forEach((b) => b.el.setAttribute('transform', `rotate(${(vento * b.a).toFixed(2)})`));
      const bate = (Math.sin(t * 11) + 1) / 2;
      asas.forEach((a) => { a.style.transform = `scaleY(${(0.68 + 0.32 * bate).toFixed(2)})`; });
      fumos.forEach((m) => {
        const ph = (t / 9 + m.f) % 1;
        m.el.setAttribute('transform', `translate(${m.cx} ${(m.cy - 230 * ph).toFixed(1)}) scale(${(0.5 + 1.8 * ph).toFixed(2)}) translate(${-m.cx} ${-m.cy})`);
        m.el.style.opacity = (ph < 0.15 ? (ph / 0.15) * 0.55 : 0.55 * (1 - (ph - 0.15) / 0.85)).toFixed(3);
      });
      helices.forEach((h) => h.el.setAttribute('transform', `rotate(${((t * 40 * h.v) % 360).toFixed(1)})`));
      voam.forEach((b) => {
        const ph = (t / b.d + b.f) % 1;
        b.el.setAttribute('transform', `translate(${(-260 + 2260 * ph).toFixed(1)} ${(b.y + 70 * Math.sin(ph * 12.566)).toFixed(1)}) rotate(${(ph * 600).toFixed(0)})`);
      });
    };
  }

  function ajustarViewBox(svg, caixa) {
    const w = caixa.clientWidth;
    const h = caixa.clientHeight;
    if (!w || !h) return;
    const a = w / h;
    const Wv = limitar(940 + (a - 0.5) * 560, 940, 1600);
    const Hv = Wv / a;
    svg.setAttribute('viewBox', `${((1600 - Wv) / 2).toFixed(1)} ${(900 - Hv).toFixed(1)} ${Wv.toFixed(1)} ${Hv.toFixed(1)}`);
  }

  function observarTamanho(cena) {
    const svg = cena.querySelector('svg.cena');
    const f = () => ajustarViewBox(svg, cena);
    if ('ResizeObserver' in window) new ResizeObserver(f).observe(cena); else window.addEventListener('resize', f);
    f();
  }

  /* --- versão com rolagem --- */

  function ativarRolagem(secao, palco, cena, api) {
    secao.classList.add('ativa');
    const cab = document.getElementById('cabecalho');
    const passos = Array.from(secao.querySelectorAll('.passo'));
    const botoes = Array.from(secao.querySelectorAll('.trilha button'));
    const dica = secao.querySelector('.dica-rolar');
    let ativo = 0;
    let ultimo = -1;
    let agendado = false;

    const altCab = () => (cab ? cab.offsetHeight : 0);
    const medir = () => secao.style.setProperty('--cab', altCab() + 'px');
    const total = () => Math.max(1, secao.offsetHeight - palco.offsetHeight);

    function progresso() {
      const r = secao.getBoundingClientRect();
      return limitar((altCab() - r.top) / total());
    }

    function desenhar() {
      agendado = false;
      const p = progresso();
      if (Math.abs(p - ultimo) < 0.0003) return;
      ultimo = p;
      api.atualizar(p);
      let idx = 0;
      HIST.PASSOS.forEach((t, i) => { if (p >= t) idx = i; });
      if (idx !== ativo) {
        ativo = idx;
        passos.forEach((el, i) => {
          el.classList.toggle('ativo', i === idx);
          el.toggleAttribute('inert', i !== idx);
        });
      }
      botoes.forEach((b, i) => {
        const fim = HIST.PASSOS[i + 1] === undefined ? 1 : HIST.PASSOS[i + 1];
        b.style.setProperty('--f', limitar((p - HIST.PASSOS[i]) / (fim - HIST.PASSOS[i])).toFixed(3));
        b.classList.toggle('atual', i === idx);
        if (i === idx) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      if (dica) dica.classList.toggle('some', p > 0.03);
    }

    const ambiente = criarAmbiente(cena);
    let ultimoScroll = 0;
    let rafAmb = 0;
    let tAnt = 0;
    function laco(agora) {
      rafAmb = 0;
      if (document.hidden || palco.classList.contains('pausado')) return;
      if (agora - ultimoScroll > 160 && agora - tAnt > 30) {
        ambiente(Math.min(0.1, (agora - (tAnt || agora)) / 1000));
        tAnt = agora;
      } else if (agora - ultimoScroll <= 160) {
        tAnt = agora;
      }
      rafAmb = requestAnimationFrame(laco);
    }
    function iniciarLaco() { if (!rafAmb) rafAmb = requestAnimationFrame(laco); }
    document.addEventListener('visibilitychange', iniciarLaco);
    function pedir() {
      ultimoScroll = performance.now();
      if (!agendado) { agendado = true; requestAnimationFrame(desenhar); }
    }

    botoes.forEach((b, i) => b.addEventListener('click', () => {
      const r = secao.getBoundingClientRect();
      const alvo = window.scrollY + r.top - altCab() + total() * Math.min(0.999, HIST.PASSOS[i] + (i ? 0.03 : 0));
      window.scrollTo({ top: alvo, behavior: REDUZIR_MOVIMENTO ? 'auto' : 'smooth' });
    }));

    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { palco.classList.toggle('pausado', !es[0].isIntersecting); if (es[0].isIntersecting) iniciarLaco(); }).observe(secao);
    }
    window.addEventListener('scroll', pedir, { passive: true });
    window.addEventListener('resize', () => { medir(); ultimo = -1; pedir(); });
    medir();
    observarTamanho(cena);
    ultimo = -1;
    desenhar();
    iniciarLaco();
  }

  /* --- versão estática (movimento reduzido) --- */

  function montarEstatica(secao, cena) {
    secao.classList.add('estatica');
    const passos = Array.from(secao.querySelectorAll('.passo'));
    const pontos = [0, 0.3, 0.64, 1];
    const lista = document.createElement('div');
    lista.className = 'container quadros';
    passos.forEach((passo, i) => {
      const clone = cena.cloneNode(true);
      criarCena(clone).atualizar(pontos[i]);
      const art = document.createElement('article');
      art.className = 'quadro';
      const fig = document.createElement('div');
      fig.className = 'quadro-cena';
      fig.setAttribute('aria-hidden', 'true');
      fig.appendChild(clone);
      const tx = document.createElement('div');
      tx.className = 'quadro-texto';
      passo.removeAttribute('inert');
      while (passo.firstChild) tx.appendChild(passo.firstChild);
      art.append(fig, tx);
      lista.appendChild(art);
    });
    secao.querySelector('.historia-palco').replaceWith(lista);
    lista.querySelectorAll('.palco-cena').forEach(observarTamanho);
    injetarIconesEstaticos();
  }

  async function iniciarHistoria() {
    const secao = document.querySelector('[data-historia]');
    if (!secao) return;
    const palco = secao.querySelector('.historia-palco');
    const cena = palco.querySelector('[data-cena]');
    popularCena(cena);
    if (REDUZIR_MOVIMENTO) { montarEstatica(secao, cena); return; }
    ativarRolagem(secao, palco, cena, criarCena(cena));
  }

  /* ---------- Inicialização ---------- */

  function injetarIconesEstaticos() {
    document.querySelectorAll('[data-icone]').forEach((el) => {
      el.innerHTML = icone(el.dataset.icone);
      el.firstElementChild && el.firstElementChild.classList.add('icone');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    const pagina = document.body.dataset.page || 'inicio';
    montarCabecalho(pagina);
    montarRodape();
    injetarIconesEstaticos();
    ativarRevelacao(document);

    const iniciadores = {
      inicio: iniciarHistoria,
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
