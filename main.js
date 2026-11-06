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

  /* ---------- História animada em pixel art (página inicial) ----------
   * O cenário é desenhado num canvas 2D de baixa resolução (cada "pixel" do jogo tem
   * vários pixels da tela) e ampliado sem suavização, como nos jogos clássicos.
   * O progresso é controlado pela rolagem. Sem 3D e sem bibliotecas.
   * Com "reduzir movimento" ativo, a história vira uma sequência de quadros estáticos.
   */

  const PX = {
    PASSOS: [0, 0.16, 0.4, 0.7],
    BIN_X: [74, 88, 102, 116],
    BIN_COR: ['#2f7de1', '#e5483a', '#2fa35a', '#f2b61d'],
    PILHA_CX: 197,
    PILHA_MEIA: 66,
    PILHA_ALT: 82,
    MUNDO_W: 320,
    CHAO: 26,
    PES: 23,
    CONTORNO: '#1b1a26',
    PALETA: {
      topo: ['ceu', '#0f1216', '#35577f', '#46a8e4'],
      meio: ['ceu', '#262a30', '#bf8a6e', '#8fd3f0'],
      base: ['ceu', '#58524d', '#f1c48c', '#e3f6d8'],
      predio: ['ceu', '#22262b', '#6b6a7a', '#86b3c6'],
      colina1: ['terra', '#2e3235', '#547160', '#7cc08f'],
      colina2: ['terra', '#282c2e', '#44684f', '#4fae6e'],
      solo: ['terra', '#201f1d', '#463d33', '#6f5a40'],
      grama: ['terra', '#2d2f2a', '#4f6e45', '#5fbf5b'],
      trilha: ['terra', '#3a3836', '#9b8468', '#d9c79e']
    },
    ELENCO: [
      { pele: '#c98e66', camisa: '#1f8f8a', calca: '#2b3a55', cabelo: '#2a1d17', esc: 1, cab: 4, longo: true, bins: [0, 1, 0], x0: -34, cic: 3, atraso: 0, off: 0 },
      { pele: '#6e4a35', camisa: '#e08a2c', calca: '#3b4a3f', cabelo: '#16110f', esc: 1.04, cab: 4, longo: false, bins: [2, 3, 2], x0: -64, cic: 3, atraso: 0.04, off: -7 },
      { pele: '#f0c39c', camisa: '#d95a7a', calca: '#4b5fa8', cabelo: '#7a4a22', esc: 0.68, cab: 5.2, longo: true, bins: [3, 1, 2], x0: -18, cic: 3, atraso: 0.08, off: -14 }
    ],
    PASSEANTES: [
      { pele: '#c98e66', camisa: '#e0a43c', calca: '#34495e', cabelo: '#2a1d17', cab: 4.2, longo: true },
      { pele: '#8a5a40', camisa: '#4aa3a0', calca: '#3b3b4f', cabelo: '#16110f', cab: 4.2, longo: false }
    ]
  };

  const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const faixa = (p, ini, fim) => limitar((p - ini) / (fim - ini));
  const suave = (t) => t * t * (3 - 2 * t);
  const lerp = (a, b, t) => a + (b - a) * t;
  const pulso = (g, subida, descida) => (g < subida ? suave(g / subida) : g < 1 - descida ? 1 : 1 - suave((g - (1 - descida)) / descida));
  const RAD = Math.PI / 180;

  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function misturar(a, b, t) { const A = hexRgb(a); const B = hexRgb(b); return A.map((v, i) => Math.round(lerp(v, B[i], t))); }
  function cor3(a, b, c, t) { return t < 0.5 ? misturar(a, b, t * 2) : misturar(b, c, (t - 0.5) * 2); }
  const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
  const tom = (c, f) => (f >= 0
    ? [Math.round(lerp(c[0], 255, f)), Math.round(lerp(c[1], 255, f)), Math.round(lerp(c[2], 255, f))]
    : [Math.round(c[0] * (1 + f)), Math.round(c[1] * (1 + f)), Math.round(c[2] * (1 + f))]);
  const hexCss = (h, f) => css(tom(hexRgb(h), f));
  const LE = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
  const c32 = (rgb) => (LE ? ((255 << 24) | (rgb[2] << 16) | (rgb[1] << 8) | rgb[0]) >>> 0 : ((rgb[0] << 24) | (rgb[1] << 16) | (rgb[2] << 8) | 255) >>> 0);

  function semente(n) {
    let a = n >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const ruido = (x, y) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

  /* --- pixels do boneco (buffer pequeno, com contorno automático) --- */

  const BUF = 64;
  function novoBoneco() {
    const cv = document.createElement('canvas');
    cv.width = BUF; cv.height = BUF;
    const c2 = cv.getContext('2d');
    const img = c2.createImageData(BUF, BUF);
    return { cv, c2, img, u: new Uint32Array(img.data.buffer), tmp: new Uint32Array(BUF * BUF) };
  }
  function pset(P, x, y, c) { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < BUF && y < BUF) P.u[y * BUF + x] = c; }
  function prect(P, x, y, w, h, c) { x = Math.round(x); y = Math.round(y); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) pset(P, x + i, y + j, c); }
  function plin(P, x0, y0, x1, y1, th, c) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * 2));
    const o = (th - 1) / 2;
    for (let i = 0; i <= n; i++) prect(P, Math.round(x0 + ((x1 - x0) * i) / n - o), Math.round(y0 + ((y1 - y0) * i) / n - o), th, th, c);
  }
  function pdisc(P, cx, cy, r, c, filtro) {
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dy * dy <= r * r + 0.6 && (!filtro || filtro(dx, dy))) pset(P, cx + dx, cy + dy, c);
      }
    }
  }
  function contornar(P, oc) {
    P.tmp.set(P.u);
    const s = P.tmp; const u = P.u;
    for (let y = 0; y < BUF; y++) {
      for (let x = 0; x < BUF; x++) {
        const i = y * BUF + x;
        if (s[i] === 0 && ((x > 0 && s[i - 1]) || (x < BUF - 1 && s[i + 1]) || (y > 0 && s[i - BUF]) || (y < BUF - 1 && s[i + BUF]))) u[i] = oc;
      }
    }
  }

  const dn = (ang) => [-Math.sin(ang * RAD), Math.cos(ang * RAD)];

  function angulos(d) {
    const a = d.amp; const b = d.bend || 0; const lv = d.wLevar || 0; const kd = d.kDep || 0;
    const s = Math.sin(d.phi); const c = Math.cos(d.phi);
    let oA = lerp(a * 26 * s, -48, lv); let cA = lerp(-10 * a - 4, -78, lv);
    let oB = lerp(-a * 26 * s, -42, lv); let cB = lerp(-10 * a - 4, -70, lv);
    oA = lerp(oA, -86, b); cA = lerp(cA, -12, b); oB = lerp(oB, -76, b); cB = lerp(cB, -10, b);
    oA = lerp(oA, -100, kd); cA = lerp(cA, -8, kd); oB = lerp(oB, -72, kd); cB = lerp(cB, -22, kd);
    return {
      coxaA: lerp(-a * 30 * s, -70, b), coxaB: lerp(a * 30 * s, -64, b),
      canelaA: lerp(a * (8 + 38 * Math.max(0, c)), 86, b), canelaB: lerp(a * (8 + 38 * Math.max(0, -c)), 80, b),
      tronco: 42 * b + a * 3, oA, cA, oB, cB
    };
  }

  function criarPaletaBoneco(o) {
    const pele = hexRgb(o.pele); const camisa = hexRgb(o.camisa); const calca = hexRgb(o.calca); const cabelo = hexRgb(o.cabelo);
    return {
      pele: c32(pele), peleE: c32(tom(pele, -0.16)), camisa: c32(camisa), camisaE: c32(tom(camisa, -0.2)), camisaL: c32(tom(camisa, 0.18)),
      calca: c32(calca), calcaE: c32(tom(calca, -0.24)), cabelo: c32(cabelo), cabeloL: c32(tom(cabelo, 0.2)),
      sapato: c32([30, 36, 40]), sapatoE: c32([18, 22, 26]), olho: c32([20, 20, 28]), contorno: c32(hexRgb(PX.CONTORNO))
    };
  }

  // Desenha o boneco (de perfil, olhando para a direita) e devolve o canvas pronto
  function montarBoneco(P, pal, o, d, e) {
    P.u.fill(0);
    const gx = 32; const gy = 57;
    const b = d.bend || 0;
    const A = angulos(d);
    const L1 = 8.5 * e; const L2 = 8.5 * e; const T = 12 * e; const R = o.cab * e / (e > 0.8 ? 1 : 0.8);
    const thL = Math.max(2, Math.round(3 * e)); const thA = Math.max(1, Math.round(2 * e + 0.2)); const thT = Math.max(3, Math.round(6 * e));
    const hipX = gx - 4.4 * b * e;
    const hipY = gy - (L1 + L2) + 6.1 * e * b;
    const dirT = [Math.sin(A.tronco * RAD), -Math.cos(A.tronco * RAD)];

    const perna = (coxa, canela, cor, sap) => {
      const v = dn(coxa); const kx = hipX + L1 * v[0]; const ky = hipY + L1 * v[1];
      const w = dn(coxa + canela); const ax = kx + L2 * w[0]; const ay = ky + L2 * w[1];
      plin(P, hipX, hipY, kx, ky, thL, cor);
      plin(P, kx, ky, ax, ay, thL, cor);
      prect(P, ax - 1, ay - 0.5, Math.max(3, Math.round(4 * e)), 2, sap);
    };
    const sx = hipX + dirT[0] * (T - 1.6 * e); const sy = hipY + dirT[1] * (T - 1.6 * e);
    const braco = (ombro, cot, manga, pele) => {
      const v = dn(A.tronco + ombro); const ex = sx + 6.2 * e * v[0]; const ey = sy + 6.2 * e * v[1];
      const w = dn(A.tronco + ombro + cot); const hx = ex + 5.8 * e * w[0]; const hy = ey + 5.8 * e * w[1];
      plin(P, sx, sy, ex, ey, thA, manga);
      plin(P, ex, ey, hx, hy, thA, pele);
      prect(P, hx - 0.5, hy - 0.5, 2, 2, pele);
      return [hx, hy];
    };

    braco(A.oB, A.cB, pal.camisaE, pal.peleE);
    perna(A.coxaB, A.canelaB, pal.calcaE, pal.sapatoE);
    // tronco e quadril
    const tx = hipX + dirT[0] * T; const ty = hipY + dirT[1] * T;
    plin(P, hipX, hipY, tx, ty, thT, pal.camisa);
    plin(P, hipX, hipY, hipX + dirT[0] * 3.5 * e, hipY + dirT[1] * 3.5 * e, thT, pal.calca);
    plin(P, hipX - thT / 2 + 0.5, hipY - 1, hipX - thT / 2 + 0.5, ty + 1, 1, pal.camisaE);
    perna(A.coxaA, A.canelaA, pal.calca, pal.sapato);
    // cabeça
    const hcx = tx + dirT[0] * (R + 0.4); const hcy = ty + dirT[1] * (R + 0.4);
    pdisc(P, Math.round(hcx), Math.round(hcy), R, pal.pele);
    pdisc(P, Math.round(hcx), Math.round(hcy), R, pal.cabelo, (dx, dy) => dy < -R * 0.3 || dx < -R * 0.55);
    if (o.longo) prect(P, hcx - R - 0.5, hcy - 1, 2, R * 1.7, pal.cabelo);
    pset(P, hcx + R * 0.35, hcy - R * 0.55, pal.cabeloL);
    pset(P, hcx + R * 0.55, hcy + 0.2, pal.olho);
    // braço da frente e carga
    const mao = braco(A.oA, A.cA, pal.camisa, pal.pele);
    if (d.carga) {
      const bcor = hexRgb(PX.BIN_COR[d.bin === undefined ? 0 : d.bin]);
      const cc = c32(bcor);
      const cl = c32(tom(bcor, 0.3));
      const w = Math.max(4, Math.round(5 * e)); const h = Math.max(4, Math.round(6 * e));
      prect(P, mao[0] - 1, mao[1] - 1, w, h, cc);
      prect(P, mao[0] - 1, mao[1] - 1, w, 1, cl);
    }
    contornar(P, pal.contorno);
    P.c2.putImageData(P.img, 0, 0);
    return { cv: P.cv, ax: gx, ay: gy };
  }

  /* --- peças do cenário em pixels --- */

  function itemPx(ctx, tipo, x, y, s, cor) {
    x = Math.round(x); y = Math.round(y); s = Math.max(2, Math.round(s));
    const esc = '#15171a';
    if (tipo === 'saco') {
      ctx.fillStyle = esc; ctx.fillRect(x - s / 2 - 1, y - s / 2, s + 2, s + 1); ctx.fillRect(x - s / 2, y - s / 2 - 1, s, s + 3);
      ctx.fillStyle = cor; ctx.fillRect(x - s / 2, y - s / 2, s, s + 1); ctx.fillRect(x - s / 2 + 1, y - s / 2 - 1, Math.max(1, s - 2), 1);
      ctx.fillStyle = hexCss(cor, 0.35); ctx.fillRect(x - s / 2 + 1, y - s / 2 + 1, Math.max(1, s / 3), 1);
    } else if (tipo === 'caixa') {
      const w = Math.round(s * 1.4);
      ctx.fillStyle = esc; ctx.fillRect(x - w / 2 - 1, y - s / 2 - 1, w + 2, s + 2);
      ctx.fillStyle = cor; ctx.fillRect(x - w / 2, y - s / 2, w, s);
      ctx.fillStyle = hexCss(cor, -0.25); ctx.fillRect(x - w / 2, y + s / 2 - 1, w, 1);
      ctx.fillStyle = '#e6d8b0'; ctx.fillRect(x - 1, y - s / 2, 1, s);
    } else if (tipo === 'garrafa') {
      const w = Math.max(2, Math.round(s / 2.2));
      ctx.fillStyle = esc; ctx.fillRect(x - w / 2 - 1, y - s / 2 - 2, w + 2, s + 3);
      ctx.fillStyle = cor; ctx.fillRect(x - w / 2, y - s / 2, w, s);
      ctx.fillStyle = '#eceff1'; ctx.fillRect(x - w / 2 + (w > 2 ? 1 : 0), y - s / 2 - 2, Math.max(1, w - 2), 2);
    } else if (tipo === 'lata') {
      const w = Math.max(2, Math.round(s / 1.8));
      ctx.fillStyle = esc; ctx.fillRect(x - w / 2 - 1, y - s / 2 - 1, w + 2, s + 1);
      ctx.fillStyle = cor; ctx.fillRect(x - w / 2, y - s / 2, w, s - 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - w / 2, y - s / 2, w, 1);
    } else {
      ctx.fillStyle = esc; ctx.fillRect(x - s / 2, y - s / 2 - 1, s + 1, s);
      ctx.fillStyle = cor; ctx.fillRect(x - s / 2, y - s / 2, s, Math.max(1, s - 2)); ctx.fillRect(x - s / 2 + 1, y - s / 2 - 1, Math.max(1, s - 2), 1);
    }
  }
  const TIPOS_LIXO = ['saco', 'saco', 'saco', 'caixa', 'garrafa', 'lata', 'papel', 'saco', 'caixa', 'garrafa'];
  const COR_LIXO = {
    saco: ['#16181b', '#242a30', '#cfd3d6', '#b0b8be', '#e3e5e6', '#7f8a94'],
    caixa: ['#9c7448', '#b48a58', '#85623c'],
    garrafa: ['#5a9bd5', '#7bc47f', '#d9dcde', '#e07a5f'],
    lata: ['#c0c4c8', '#d95f4e', '#4a7fb5'],
    papel: ['#dcdad0', '#bdb9ab']
  };

  function disco(ctx, cx, cy, r, cor) {
    ctx.fillStyle = cor;
    for (let dy = -r; dy <= r; dy++) {
      const dx = Math.floor(Math.sqrt(r * r - dy * dy + r * 0.6));
      ctx.fillRect(cx - dx, cy + dy, dx * 2 + 1, 1);
    }
  }
  function linhaPx(ctx, x0, y0, x1, y1, cor, esp) {
    ctx.fillStyle = cor;
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0;
    for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / (n || 1)), Math.round(y0 + ((y1 - y0) * i) / (n || 1)), esp, esp);
  }

  function nuvemSprite(w, h, cores, seed) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const c = cv.getContext('2d'); const r = semente(seed);
    const bolhas = [];
    const n = 4 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) bolhas.push({ cx: (w * (i + 0.7)) / (n + 0.4), cy: h * (0.55 + (r() - 0.5) * 0.3), rx: w * (0.18 + r() * 0.12), ry: h * (0.32 + r() * 0.2) });
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let dentro = false; let topo = 1;
        for (const b of bolhas) {
          const q = ((x - b.cx) / b.rx) ** 2 + ((y - b.cy) / b.ry) ** 2;
          if (q <= 1) { dentro = true; topo = Math.min(topo, (y - (b.cy - b.ry)) / (2 * b.ry)); }
        }
        if (dentro) { c.fillStyle = topo < 0.28 ? cores[0] : topo < 0.7 ? cores[1] : cores[2]; c.fillRect(x, y, 1, 1); }
      }
    }
    return cv;
  }

  const SIMBOLO_RECICLA = ['.###.', '#...#', '#...#', '#..##', '.####'];

  function criarCenaPixel(canvas, caixa) {
    const ctx = canvas.getContext('2d', { alpha: false });
    const S = { W: 0, H: 0, k: 3, x0: 0 };
    const boneco = novoBoneco();
    const pessoas = PX.ELENCO.map((o) => ({ o, pal: criarPaletaBoneco(o), xbs: o.bins.map((b) => PX.BIN_X[b] - 11 * o.esc) }));
    const passeantes = PX.PASSEANTES.map((o) => ({ o: Object.assign({ bins: [0] }, o), pal: criarPaletaBoneco(o) }));
    const sprites = {
      escuras: [0, 1, 2, 3, 4].map((i) => nuvemSprite(52 + i * 11, 15 + (i % 3) * 3, ['#3b4249', '#2a2f35', '#1a1d22'], 40 + i)),
      claras: [0, 1, 2, 3].map((i) => nuvemSprite(48 + i * 13, 14 + (i % 2) * 4, ['#ffffff', '#e6f4fb', '#b8dcee'], 90 + i))
    };
    const halo = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 72;
      const c = cv.getContext('2d');
      for (let y = 0; y < 72; y++) for (let x = 0; x < 72; x++) {
        const dd = Math.hypot(x - 36, y - 36);
        const dens = dd < 14 ? 1 : dd < 22 ? 0.55 : dd < 30 ? 0.28 : dd < 36 ? 0.1 : 0;
        if (dens > 0 && BAYER[(y & 3) * 4 + (x & 3)] / 16 < dens) { c.fillStyle = dd < 22 ? '#fff0a0' : '#ffe08a'; c.fillRect(x, y, 1, 1); }
      }
      return cv;
    })();
    const cacheCeu = { chave: '', cv: null };
    const cacheHor = new Map();
    const cachePilha = new Map();
    const solto = (() => {
      const r = semente(55); const lista = [];
      for (let i = 0; i < 20; i++) lista.push({ x: r() > 0.5 ? 262 + r() * 70 : -10 + r() * 130, u: 5 + r() * 14, tipo: TIPOS_LIXO[Math.floor(r() * TIPOS_LIXO.length)], cor: null, s: 2 + Math.round(r() * 2), f: i / 20 });
      lista.forEach((it) => { const l = COR_LIXO[it.tipo]; it.cor = l[Math.floor(r() * l.length)]; });
      return lista;
    })();
    const voam = (() => { const r = semente(77); return [0, 1, 2, 3, 4].map((i) => ({ u: 70 + r() * 62, f: r(), d: 26 + r() * 14, cor: i % 2 ? '#d9dcdf' : '#2a2f35', tipo: i % 3 === 2 ? 'papel' : 'saco' })); })();
    const arvoresFundo = [[18, 0.6, 0.35], [41, 0.5, 0.45], [66, 0.55, 0.3], [284, 0.55, 0.4], [307, 0.6, 0.5], [330, 0.5, 0.38]];
    const arvoresFrente = [[12, 1.15, 0.1, 'a'], [38, 0.95, 0.3, 'a'], [54, 1, 0.5, 'b'], [281, 1.2, 0.15, 'a'], [309, 1, 0.32, 'a'], [328, 1.1, 0.55, 'b'], [266, 0.9, 0.45, 'b']];
    const turbinas = [[50, 1], [243, 0.85], [300, 0.7], [18, 0.6]];
    const chamines = [[26, 38], [60, 32], [308, 35]];

    function medir() {
      const cw = caixa.clientWidth; const ch = caixa.clientHeight;
      if (!cw || !ch) return false;
      const k = cw < 700 ? 2 : limitar(Math.round(cw / 300), 3, 6);
      S.k = k; S.W = Math.max(150, Math.ceil(cw / k)); S.H = Math.max(90, Math.ceil(ch / k));
      canvas.width = S.W; canvas.height = S.H;
      canvas.style.width = S.W * k + 'px'; canvas.style.height = S.H * k + 'px';
      canvas.style.marginLeft = -(S.W * k) / 2 + 'px';
      S.x0 = Math.round(PX.MUNDO_W / 2 - S.W / 2);
      cacheCeu.chave = '';
      ctx.imageSmoothingEnabled = false;
      return true;
    }

    const colU1 = (x) => Math.round(62 + 5 * Math.sin(x * 0.035 + 1) + 3 * Math.sin(x * 0.09 + 2));
    const colU2 = (x) => Math.round(37 + 3 * Math.sin(x * 0.05) + 2 * Math.sin(x * 0.13 + 1));

    function pintarCeu(ceu) {
      const q = Math.round(ceu * 40);
      const chave = `${S.W}x${S.H}:${q}`;
      if (cacheCeu.chave === chave) return;
      cacheCeu.chave = chave;
      if (!cacheCeu.cv) cacheCeu.cv = document.createElement('canvas');
      const cv = cacheCeu.cv; cv.width = S.W; cv.height = S.H;
      const c = cv.getContext('2d'); const img = c.createImageData(S.W, S.H); const u = new Uint32Array(img.data.buffer);
      const ce = q / 40;
      const topo = cor3(...PX.PALETA.topo.slice(1), ce); const meio = cor3(...PX.PALETA.meio.slice(1), ce); const base = cor3(...PX.PALETA.base.slice(1), ce);
      const N = 9; const niv = [];
      for (let i = 0; i < N; i++) { const t = i / (N - 1); niv.push(c32(t < 0.6 ? [0, 1, 2].map((j) => Math.round(lerp(topo[j], meio[j], t / 0.6))) : [0, 1, 2].map((j) => Math.round(lerp(meio[j], base[j], (t - 0.6) / 0.4))))); }
      const alto = S.H - PX.CHAO - 8;
      for (let y = 0; y < S.H; y++) {
        const pos = limitar(y / alto) * (N - 1); const i0 = Math.min(N - 2, Math.floor(pos)); const f = pos - i0;
        for (let x = 0; x < S.W; x++) u[y * S.W + x] = f > BAYER[(y & 3) * 4 + (x & 3)] / 16 ? niv[i0 + 1] : niv[i0];
      }
      c.putImageData(img, 0, 0);
    }

    function horizonte(ceu) {
      const q = Math.round(ceu * 20);
      if (cacheHor.has(q)) return cacheHor.get(q);
      const cv = document.createElement('canvas'); cv.width = 760; cv.height = 70;
      const c = cv.getContext('2d'); const r = semente(11);
      const cor = cor3(...PX.PALETA.predio.slice(1), q / 20);
      const corE = tom(cor, -0.18); const corL = tom(cor, 0.12);
      for (let x = 0; x < 760;) {
        const w = 7 + Math.floor(r() * 9); const h = 10 + Math.floor(r() * r() * 46);
        c.fillStyle = css(cor); c.fillRect(x, 70 - h, w, h);
        c.fillStyle = css(corL); c.fillRect(x, 70 - h, w, 1);
        c.fillStyle = css(corE); c.fillRect(x + w - 1, 70 - h, 1, h);
        if (r() > 0.75) { c.fillStyle = css(corE); c.fillRect(x + Math.floor(w / 2), 70 - h - 4, 1, 4); }
        for (let wy = 70 - h + 3; wy < 66; wy += 4) {
          for (let wx = x + 2; wx < x + w - 2; wx += 3) {
            const aceso = q < 9 && r() < 0.17;
            c.fillStyle = aceso ? '#d6b04a' : css(q > 12 ? tom(cor, 0.28) : corE);
            c.fillRect(wx, wy, 1, 2);
          }
        }
        x += w + 1;
      }
      cacheHor.set(q, cv);
      return cv;
    }

    function pilhaSprite(nivel, N) {
      const chave = `${nivel}`;
      if (cachePilha.has(chave)) return cachePilha.get(chave);
      const s = lerp(1, 0.2, nivel / (N - 1));
      const w = Math.round(PX.PILHA_MEIA * 2 * s) + 14; const h = Math.round(PX.PILHA_ALT * s) + 10;
      const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
      const c = cv.getContext('2d'); const r = semente(7);
      const cx = w / 2; const base = h - 1;
      // massa escura do monte
      for (let x = 0; x < w; x++) {
        const dx = Math.abs(x - cx) / (PX.PILHA_MEIA * s);
        const alt = dx >= 1 ? 0 : PX.PILHA_ALT * s * Math.pow(1 - dx, 1.05) + (ruido(x, 3) - 0.5) * 3 * s;
        if (alt > 0) {
          c.fillStyle = '#25272b'; c.fillRect(x, base - alt, 1, alt + 1);
          c.fillStyle = '#34373c'; c.fillRect(x, base - alt, 1, 1);
        }
      }
      const total = Math.round(24 + 250 * s * s);
      const itens = [];
      for (let i = 0; i < total; i++) {
        const borda = i % 4 === 0;
        const hh = Math.pow(r(), 0.85) * 0.97;
        const meia = PX.PILHA_MEIA * s * Math.pow(1 - hh, 1.05);
        const sz = Math.max(2, Math.round(lerp(8, 4, hh) * (0.7 + r() * 0.7) * (0.55 + 0.45 * s)));
        const lado = r() > 0.5 ? 1 : -1;
        const x = borda ? cx + lado * Math.max(1, meia * (0.9 + r() * 0.12)) : cx + (r() * 2 - 1) * Math.max(1, meia * 0.96);
        const y = Math.min(base - sz * 0.6, base - hh * PX.PILHA_ALT * s + (r() - 0.5) * 3);
        const tipo = TIPOS_LIXO[Math.floor(r() * TIPOS_LIXO.length)];
        const lista = COR_LIXO[tipo];
        itens.push({ x, y, sz, tipo, cor: lista[Math.floor(r() * lista.length)] });
      }
      itens.sort((a, b) => a.y - b.y);
      itens.forEach((it) => itemPx(c, it.tipo, it.x, it.y, it.sz, it.cor));
      const mask = document.createElement('canvas'); mask.width = w; mask.height = h;
      const m = mask.getContext('2d'); m.drawImage(cv, 0, 0); m.globalCompositeOperation = 'source-in'; m.fillStyle = '#05070a'; m.fillRect(0, 0, w, h);
      const res = { cv, mask, w, h, s };
      cachePilha.set(chave, res);
      return res;
    }

    function arvore(x, yb, sc, g, fundo) {
      const k = Math.round(sc * g * 10) / 10;
      if (k < 0.15) return;
      const th = Math.max(2, Math.round(14 * k * (fundo ? 0.9 : 1)));
      const r1 = Math.max(2, Math.round(8.5 * k)); const r2 = Math.max(2, Math.round(5.6 * k)); const r3 = Math.max(2, Math.round(5.4 * k));
      const cy = yb - th - Math.round(r1 * 0.5);
      ctx.fillStyle = '#17321f'; ctx.fillRect(x - 1 - (k > 0.7 ? 1 : 0), yb - th, k > 0.7 ? 4 : 3, th);
      ctx.fillStyle = '#7a5a3a'; ctx.fillRect(x - (k > 0.7 ? 1 : 0), yb - th, k > 0.7 ? 2 : 1, th);
      const D = [[x, cy, r1, '#2f9e57'], [x - Math.round(r1 * 0.75), cy + Math.round(r1 * 0.45), r2, '#3fb765'], [x + Math.round(r1 * 0.8), cy + Math.round(r1 * 0.42), r3, '#287f48']];
      D.forEach(([dx, dy, rr]) => disco(ctx, dx, dy, rr + 1, '#17452a'));
      D.forEach(([dx, dy, rr, cc]) => disco(ctx, dx, dy, rr, cc));
      disco(ctx, x - Math.round(r1 * 0.3), cy - Math.round(r1 * 0.35), Math.max(1, Math.round(r1 * 0.3)), '#7fe09a');
    }
    function arbusto(x, yb, sc, g) {
      const k = sc * g; if (k < 0.2) return;
      const r = Math.max(2, Math.round(4.5 * k));
      [[x - r, yb - r, r, '#2f9e57'], [x + Math.round(r * 0.8), yb - r - 1, r + 1, '#3fb765'], [x + r * 2, yb - r + 1, Math.max(2, r - 1), '#287f48']].forEach(([a, b, rr]) => disco(ctx, a, b, rr + 1, '#17452a'));
      [[x - r, yb - r, r, '#2f9e57'], [x + Math.round(r * 0.8), yb - r - 1, r + 1, '#3fb765'], [x + r * 2, yb - r + 1, Math.max(2, r - 1), '#287f48']].forEach(([a, b, rr, cc]) => disco(ctx, a, b, rr, cc));
    }

    function lixeira(x, yb, cor, aberta, ocultar) {
      const hexc = hexRgb(cor); const esc = css(tom(hexc, -0.3)); const luz = css(tom(hexc, 0.28)); const corC = css(hexc);
      const h = 14;
      ctx.fillStyle = PX.CONTORNO; ctx.fillRect(x - 6, yb - h - 1, 12, h + 2); ctx.fillRect(x - 7, yb - h - 3, 14, 3);
      ctx.fillStyle = corC; ctx.fillRect(x - 5, yb - h, 10, h);
      ctx.fillStyle = luz; ctx.fillRect(x - 5, yb - h, 2, h);
      ctx.fillStyle = esc; ctx.fillRect(x + 3, yb - h, 2, h); ctx.fillRect(x - 5, yb - 4, 10, 1);
      ctx.fillStyle = '#ffffff';
      SIMBOLO_RECICLA.forEach((lin, j) => { for (let i = 0; i < 5; i++) if (lin[i] === '#') ctx.fillRect(x - 2 + i, yb - h + 3 + j, 1, 1); });
      if (aberta < 0.08) {
        ctx.fillStyle = PX.CONTORNO; ctx.fillRect(x - 7, yb - h - 3, 14, 3);
        ctx.fillStyle = esc; ctx.fillRect(x - 6, yb - h - 2, 12, 1); ctx.fillStyle = luz; ctx.fillRect(x - 6, yb - h - 2, 12, 0);
        ctx.fillStyle = corC; ctx.fillRect(x - 6, yb - h - 2, 12, 2);
        ctx.fillStyle = luz; ctx.fillRect(x - 6, yb - h - 2, 12, 1);
      } else {
        const ang = -68 * aberta * RAD;
        const hx = x - 5; const hy = yb - h - 1;
        linhaPx(ctx, hx, hy, hx + Math.cos(ang) * 12, hy + Math.sin(ang) * 12, PX.CONTORNO, 4);
        linhaPx(ctx, hx, hy, hx + Math.cos(ang) * 12, hy + Math.sin(ang) * 12, corC, 2);
      }
    }

    function desenhar(p, t) {
      if (!S.W) return;
      const { W, H, x0 } = S;
      const tq = Math.floor(t * 8) / 8;
      const ceu = suave(faixa(p, 0.14, 0.6));
      const terra = suave(faixa(p, 0.28, 0.82));
      const par = p * 2 - 1;
      const sh = (kp) => Math.round(par * kp);
      const gy = H - PX.CHAO;
      const pc = (k) => { const [d, a, b, c] = PX.PALETA[k]; return cor3(a, b, c, d === 'ceu' ? ceu : terra); };
      ctx.globalAlpha = 1;

      // céu pontilhado
      pintarCeu(ceu);
      ctx.drawImage(cacheCeu.cv, 0, 0);

      // sol, halo e raios
      const solOp = suave(faixa(p, 0.1, 0.3));
      const raios = suave(faixa(p, 0.18, 0.52)) * (1 - 0.45 * faixa(p, 0.72, 1));
      const sx = 200 - x0 + sh(-3);
      const sy = Math.round(H - 114 + lerp(104, -6, suave(faixa(p, 0.12, 0.58))));
      if (solOp > 0.02) {
        ctx.globalAlpha = solOp * (0.25 + raios * 0.75);
        ctx.drawImage(halo, sx - 36, sy - 36);
        if (raios > 0.03) {
          ctx.globalAlpha = raios * 0.5; ctx.fillStyle = '#fff3b0';
          for (let i = 0; i < 12; i++) {
            const a = (i * 30 + t * 2.2) * RAD;
            for (let rr = 16; rr < Math.max(W, H) * 0.9; rr += 3) {
              if (((rr / 3) | 0) % 2 === 0) ctx.fillRect(Math.round(sx + Math.cos(a) * rr), Math.round(sy + Math.sin(a) * rr), 2, 2);
            }
          }
        }
        ctx.globalAlpha = solOp;
        disco(ctx, sx, sy, 11, '#e89a1c'); disco(ctx, sx, sy, 10, '#ffd44d'); disco(ctx, sx, sy, 7, '#ffe98a'); disco(ctx, sx - 2, sy - 2, 3, '#fffbe0');
        ctx.globalAlpha = 1;
      }

      // nuvens claras e nuvens de poluição
      const fumaca = 1 - suave(faixa(p, 0.1, 0.5));
      const claras = suave(faixa(p, 0.3, 0.7));
      const drift = (i) => Math.round(Math.sin(tq / 11 + i) * 12);
      if (claras > 0.02) {
        ctx.globalAlpha = claras;
        for (let r = 0; r * 24 + 8 < H - 70; r++) {
          for (let c = 0; c < 2; c++) {
            const sp = sprites.claras[(r + c * 2) % 4];
            const wx = ((ruido(r, c + 9) * 380 - 40) | 0);
            ctx.drawImage(sp, wx - x0 + sh(-4) + drift(r), 8 + r * 24 + c * 10);
          }
        }
        ctx.globalAlpha = 1;
      }
      if (fumaca > 0.02) {
        ctx.globalAlpha = fumaca;
        const subir = Math.round((1 - fumaca) * 30);
        for (let r = 0; r * 22 + 2 < H - 60; r++) {
          for (let c = 0; c < 3; c++) {
            const sp = sprites.escuras[(r * 2 + c) % 5];
            const wx = ((ruido(r + 3, c + 1) * 400 - 70) | 0);
            ctx.drawImage(sp, wx - x0 + sh(-6) + drift(r * 2 + c), 2 + r * 22 + (c % 2) * 6 - subir);
          }
        }
        ctx.globalAlpha = 1;
      }

      // horizonte: prédios, chaminés e fumaça
      const hor = horizonte(ceu);
      const hy = H - 46 - 70 + 4;
      ctx.drawImage(hor, -200 - x0 + sh(-7), hy);
      if (fumaca > 0.02) {
        ctx.globalAlpha = fumaca;
        chamines.forEach(([cwx, ch], ci) => {
          const cx = cwx - x0 + sh(-7); const topo = H - 46 - ch + 4;
          ctx.fillStyle = PX.CONTORNO; ctx.fillRect(cx - 1, topo - 1, 6, ch + 1);
          ctx.fillStyle = '#3a3e44'; ctx.fillRect(cx, topo, 4, ch); ctx.fillStyle = '#8c3b2e'; ctx.fillRect(cx, topo, 4, 3);
          for (let i = 0; i < 4; i++) {
            const ph = (tq / 9 + i * 0.25 + ci * 0.1) % 1;
            ctx.globalAlpha = fumaca * (ph < 0.15 ? ph / 0.15 : 1 - (ph - 0.15) / 0.85) * 0.7;
            disco(ctx, cx + 2 + Math.round(ph * 6), Math.round(topo - 2 - ph * 46), Math.round(2 + ph * 5), '#43484f');
          }
          ctx.globalAlpha = fumaca;
        });
        ctx.globalAlpha = 1;
      }

      // colinas, turbinas e vegetação distante
      const col1 = pc('colina1'); const col2 = pc('colina2');
      const turb = suave(faixa(p, 0.55, 0.85));
      const s1 = sh(-11); const s2 = sh(-17);
      for (let x = 0; x < W; x++) {
        const u = colU1(x + x0 - s1);
        ctx.fillStyle = css(col1); ctx.fillRect(x, H - u, 1, u);
        ctx.fillStyle = css(tom(col1, 0.14)); ctx.fillRect(x, H - u, 1, 1);
        if (((x + 2) & 1) === 0) { ctx.fillStyle = css(tom(col1, -0.1)); ctx.fillRect(x, H - u + 3, 1, 1); }
      }
      if (turb > 0.03) {
        ctx.globalAlpha = turb;
        turbinas.forEach(([twx, ts], i) => {
          const tx = Math.round(twx - x0 + s1); const base = H - colU1(twx) + 2; const alt = Math.round(24 * ts + 6);
          ctx.fillStyle = '#f4f8f5'; ctx.fillRect(tx, base - alt, 1, alt);
          ctx.fillStyle = PX.CONTORNO; ctx.fillRect(tx - 1, base - alt - 1, 3, 3);
          const rot = (t * (40 + i * 10)) * RAD; const L = Math.round(12 * ts + 3);
          for (let b = 0; b < 3; b++) linhaPx(ctx, tx, base - alt, tx + Math.cos(rot + b * 2.094) * L, base - alt + Math.sin(rot + b * 2.094) * L, '#ffffff', 1);
        });
        ctx.globalAlpha = 1;
      }
      for (let x = 0; x < W; x++) {
        const u = colU2(x + x0 - s2);
        ctx.fillStyle = css(col2); ctx.fillRect(x, H - u, 1, u);
        ctx.fillStyle = css(tom(col2, 0.16)); ctx.fillRect(x, H - u, 1, 1);
        if (((x + 1) & 1) === 0) { ctx.fillStyle = css(tom(col2, -0.1)); ctx.fillRect(x, H - u + 3, 1, 1); }
      }
      const verde = faixa(p, 0.6, 0.95);
      arvoresFundo.forEach(([twx, sc, d]) => arvore(Math.round(twx - x0 + s2), H - colU2(twx) + 3, sc, limitar((verde * 1.75 - d) * 2.6), true));
      if (verde > 0.02) {
        ctx.globalAlpha = verde;
        const t2 = faixa(p, 0.72, 1);
        passeantes.forEach((pe, i) => {
          const wx = i === 0 ? lerp(266, 294, t2) : lerp(314, 280, t2);
          const d = { x: wx, dir: i === 0 ? 1 : -1, phi: Math.abs(wx) * (Math.PI * 2 / 14) * 1.2, amp: t2 > 0 && t2 < 1 ? 1 : 0, bend: 0, wLevar: 0, kDep: 0, carga: 0 };
          const sp = montarBoneco(boneco, pe.pal, pe.o, d, 0.46);
          const px = Math.round(wx - x0 + s2); const py = H - colU2(wx) + 3;
          ctx.save(); if (d.dir < 0) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.drawImage(sp.cv, -sp.ax, py - sp.ay); } else ctx.drawImage(sp.cv, px - sp.ax, py - sp.ay);
          ctx.restore();
        });
        ctx.globalAlpha = 1;
      }

      // chão
      const solo = pc('solo'); const grama = pc('grama'); const trilha = pc('trilha');
      ctx.fillStyle = css(solo); ctx.fillRect(0, gy, W, H - gy);
      ctx.fillStyle = css(grama); ctx.fillRect(0, gy, W, 6);
      ctx.fillStyle = css(tom(grama, 0.18)); ctx.fillRect(0, gy, W, 1);
      ctx.fillStyle = css(trilha); ctx.fillRect(0, gy + 13, W, 9);
      ctx.fillStyle = css(tom(trilha, 0.15)); ctx.fillRect(0, gy + 13, W, 1);
      for (let x = 0; x < W; x++) {
        const n = ruido(x + x0, 5);
        if (n < 0.16) { ctx.fillStyle = css(tom(grama, n < 0.08 ? 0.2 : -0.18)); ctx.fillRect(x, gy + 1 + ((n * 60) | 0) % 4, 1, 1); }
        if (n > 0.9) { ctx.fillStyle = css(tom(solo, 0.25)); ctx.fillRect(x, gy + 7 + ((n * 97) | 0) % 5, 1, 1); }
        if (n > 0.45 && n < 0.52) { ctx.fillStyle = css(tom(trilha, -0.2)); ctx.fillRect(x, gy + 15 + ((n * 211) | 0) % 6, 1, 1); }
      }

      // sombra e montanha de lixo
      const ps = lerp(1, 0.2, suave(faixa(p, 0.4, 0.95)));
      const NIV = 18;
      const nivel = Math.round(((1 - ps) / 0.8) * (NIV - 1));
      const pil = pilhaSprite(nivel, NIV);
      const pbx = Math.round(PX.PILHA_CX - x0 - pil.w / 2); const pby = H - PX.PES + 1 - pil.h;
      ctx.globalAlpha = 0.28; ctx.fillStyle = '#000';
      const sw = Math.round(PX.PILHA_MEIA * ps + 8);
      for (let j = 0; j < 4; j++) ctx.fillRect(PX.PILHA_CX - x0 - sw + j * 2, H - PX.PES + 1 + j, (sw - j * 2) * 2, 1);
      ctx.globalAlpha = 1;
      ctx.drawImage(pil.cv, pbx, pby);
      if (1 - ceu > 0.02) { ctx.globalAlpha = (1 - ceu) * 0.34; ctx.drawImage(pil.mask, pbx, pby); ctx.globalAlpha = 1; }

      // lixo solto e sacolas ao vento
      const sol = 1 - suave(faixa(p, 0.5, 0.86));
      solto.forEach((it) => { if (it.f < sol) itemPx(ctx, it.tipo, it.x - x0, H - it.u, it.s, it.cor); });
      if (fumaca > 0.02) {
        ctx.globalAlpha = fumaca * 0.9;
        voam.forEach((b) => {
          const ph = (tq / b.d + b.f) % 1;
          const bx = -30 + 380 * ph - x0; const by = H - b.u + Math.round(Math.sin(ph * 12.5) * 10);
          itemPx(ctx, b.tipo, bx, by, 4 + ((tq * 4) % 2 | 0), b.cor);
        });
        ctx.globalAlpha = 1;
      }

      // árvores laterais
      arvoresFrente.forEach(([twx, sc, d, tipo]) => {
        const g = limitar((verde * 1.75 - d) * 2.6);
        const px = Math.round(twx - x0); const yb = H - PX.PES - 1;
        if (tipo === 'a') arvore(px, yb, sc, g, false); else arbusto(px, yb, sc, g);
      });

      // lixeiras da coleta seletiva
      const lix = suave(faixa(p, 0.4, 0.54));
      const trajetos = pessoas.map((pe) => {
        const o = pe.o;
        const xp = PX.PILHA_CX - PX.PILHA_MEIA * ps - 7 + o.off;
        const u = faixa(p, 0.38 + o.atraso, 0.92);
        const cfg = { x0: o.x0, xbs: pe.xbs, bins: o.bins, cic: o.cic };
        const d = trajeto(u, cfg, xp);
        const d0 = trajeto(Math.max(0, u - 0.003), cfg, xp);
        d.amp = limitar(Math.abs(d.x - d0.x) / 1.2);
        d.phi = fase(d, xp);
        d.u = u;
        return d;
      });
      if (lix > 0.04) {
        const abertas = [0, 0, 0, 0];
        trajetos.forEach((d) => { abertas[d.bin] = Math.max(abertas[d.bin], d.aberta || 0); });
        const desl = Math.round((1 - lix) * 16);
        PX.BIN_X.forEach((bx, i) => lixeira(bx - x0, H - PX.PES - 1 + desl, PX.BIN_COR[i], abertas[i], false));
      }

      // personagens
      pessoas.forEach((pe, i) => {
        const d = trajetos[i];
        if (d.u <= 0) return;
        const sp = montarBoneco(boneco, pe.pal, pe.o, d, pe.o.esc);
        const px = Math.round(d.x - x0); const py = H - PX.PES;
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(px - 5, py, 11, 1);
        ctx.save();
        if (d.dir < 0) { ctx.translate(px, 0); ctx.scale(-1, 1); ctx.drawImage(sp.cv, -sp.ax, py - sp.ay); } else ctx.drawImage(sp.cv, px - sp.ax, py - sp.ay);
        ctx.restore();
      });

      // primeiro plano: grama, flores, painel solar e aves
      if (verde > 0.02) {
        const sf = sh(26);
        const g1 = tom(grama, 0.1); const g2 = tom(grama, -0.12);
        for (let x = -2; x < W + 2; x += 3) {
          const wx = x + x0 - sf; const n = ruido(wx, 21);
          const hb = Math.round((2 + n * 5) * limitar(verde * 1.3));
          const yb = H - 2 - Math.round(ruido(wx, 8) * 11);
          const bal = Math.round(Math.sin(tq * 1.1 + wx * 0.3) * 0.9);
          ctx.fillStyle = css(g2); ctx.fillRect(x, yb - hb, 1, hb);
          ctx.fillStyle = css(g1); ctx.fillRect(x + bal, yb - hb, 1, 1);
          if (n > 0.8 && verde > 0.3) { ctx.fillStyle = ['#ffd166', '#ef476f', '#f78fb3', '#ffffff', '#ff9f1c'][((n * 50) | 0) % 5]; ctx.fillRect(x + bal - 1, yb - hb - 2, 2, 2); }
        }
        ctx.globalAlpha = limitar(verde * 1.4);
        const px = 296 - x0 + sf; const py = H - 18;
        ctx.fillStyle = '#5c6770'; ctx.fillRect(px + 9, py + 7, 1, 8); ctx.fillRect(px + 13, py + 7, 1, 8);
        for (let j = 0; j < 9; j++) for (let i = 0; i < 20; i++) {
          const yy = py + j - Math.round(i * 0.25) + 3;
          ctx.fillStyle = (i % 5 === 0 || j % 3 === 0) ? '#bcd6ee' : (j < 2 ? '#2f6aa3' : '#1e4a7a'); ctx.fillRect(px + i, yy, 1, 1);
        }
        ctx.globalAlpha = 1;
      }
      const aves = faixa(p, 0.82, 1);
      if (aves > 0.02) {
        [[138, 0], [120, 18], [144, 34], [128, 52], [114, 66]].forEach(([u, o], i) => {
          const bx = Math.round(aves * 400 - 52 + o - x0); const by = Math.round(H - u - aves * 12);
          const f = (Math.floor(tq * 5) + i) % 2;
          ctx.fillStyle = '#17352c';
          [[-3, f ? 1 : -2], [-2, f ? 1 : -1], [-1, 0], [0, 0], [1, 0], [2, f ? 1 : -1], [3, f ? 1 : -2]].forEach(([dx, dy]) => ctx.fillRect(bx + dx, by + dy, 1, 1));
        });
      }
    }

    return { medir, desenhar };
  }

  /* --- trajetória dos personagens (função pura do progresso) --- */

  function trajeto(u, c, xp) {
    const ENT = 0.17;
    const n = c.xbs.length;
    const d = { x: c.xbs[0], dir: 1, bend: 0, wLevar: 0, kDep: 0, carga: 0, aberta: 0, sentido: 1, bin: c.bins[0] };
    if (u <= 0) { d.x = c.x0; return d; }
    if (u < ENT) { d.x = lerp(c.x0, c.xbs[0], u / ENT); return d; }
    const w = ((u - ENT) / (1 - ENT)) * c.cic;
    let ci = Math.floor(w);
    let f = w - ci;
    if (ci >= c.cic) { ci = c.cic - 1; f = 1; }
    const xIni = ci === 0 ? c.xbs[0] : c.xbs[(ci - 1) % n];
    const xDep = c.xbs[ci % n];
    d.bin = c.bins[ci % n];
    if (f < 0.32) {
      d.x = lerp(xIni, xp, f / 0.32);
    } else if (f < 0.52) {
      const g = (f - 0.32) / 0.2;
      d.x = xp;
      d.bend = pulso(g, 0.35, 0.35);
      d.carga = g > 0.55 ? 1 : 0;
      d.wLevar = suave(faixa(g, 0.6, 1));
    } else if (f < 0.84) {
      d.x = lerp(xp, xDep, (f - 0.52) / 0.32);
      d.dir = f < 0.54 ? 1 : -1;
      d.sentido = -1;
      d.carga = 1;
      d.wLevar = 1;
    } else {
      const g = (f - 0.84) / 0.16;
      d.x = xDep;
      d.dir = f < 0.86 ? -1 : 1;
      d.kDep = pulso(g, 0.3, 0.35);
      d.carga = g < 0.55 ? 1 : 0;
      d.wLevar = g < 0.55 ? 1 : 1 - suave(faixa(g, 0.55, 0.9));
      d.aberta = pulso(g, 0.2, 0.3);
    }
    return d;
  }
  function fase(d, xp) {
    const k = (Math.PI * 2) / 14;
    return d.sentido === -1 ? (2 * xp - d.x) * k : d.x * k;
  }

  /* --- versão com rolagem --- */

  function ativarRolagem(secao, palco, cena) {
    secao.classList.add('ativa');
    const cab = document.getElementById('cabecalho');
    const passos = Array.from(secao.querySelectorAll('.passo'));
    const botoes = Array.from(secao.querySelectorAll('.trilha button'));
    const dica = secao.querySelector('.dica-rolar');
    let ativo = 0;
    let pAtual = 0;
    let pDesenhado = -1;
    let tDesenhado = -1;
    let visivel = true;
    let raf = 0;

    const altCab = () => (cab ? cab.offsetHeight : 0);
    const medir = () => secao.style.setProperty('--cab', altCab() + 'px');
    const total = () => Math.max(1, secao.offsetHeight - palco.offsetHeight);
    const progresso = () => limitar((altCab() - secao.getBoundingClientRect().top) / total());

    function interface_(p) {
      let idx = 0;
      PX.PASSOS.forEach((t, i) => { if (p >= t) idx = i; });
      if (idx !== ativo) {
        ativo = idx;
        passos.forEach((el, i) => { el.classList.toggle('ativo', i === idx); el.toggleAttribute('inert', i !== idx); });
      }
      botoes.forEach((b, i) => {
        const fim = PX.PASSOS[i + 1] === undefined ? 1 : PX.PASSOS[i + 1];
        b.style.setProperty('--f', limitar((p - PX.PASSOS[i]) / (fim - PX.PASSOS[i])).toFixed(3));
        b.classList.toggle('atual', i === idx);
        if (i === idx) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
      if (dica) dica.classList.toggle('some', p > 0.03);
    }

    function quadro(agora) {
      raf = 0;
      if (!visivel || document.hidden) return;
      const p = progresso();
      const t = agora / 1000;
      const tq = Math.floor(t * 8);
      if (Math.abs(p - pDesenhado) > 0.0002 || tq !== tDesenhado) {
        if (Math.abs(p - pDesenhado) > 0.0002) interface_(p);
        pDesenhado = p; tDesenhado = tq; pAtual = p;
        cena.desenhar(p, t);
      }
      raf = requestAnimationFrame(quadro);
    }
    const iniciar = () => { if (!raf && visivel && !document.hidden) raf = requestAnimationFrame(quadro); };

    botoes.forEach((b, i) => b.addEventListener('click', () => {
      const r = secao.getBoundingClientRect();
      const alvo = window.scrollY + r.top - altCab() + total() * Math.min(0.999, PX.PASSOS[i] + (i ? 0.03 : 0));
      window.scrollTo({ top: alvo, behavior: REDUZIR_MOVIMENTO ? 'auto' : 'smooth' });
    }));
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { visivel = es[0].isIntersecting; if (visivel) iniciar(); }).observe(secao);
    }
    document.addEventListener('visibilitychange', iniciar);
    const aoRedimensionar = () => { medir(); if (cena.medir()) { pDesenhado = -1; } };
    if ('ResizeObserver' in window) new ResizeObserver(aoRedimensionar).observe(palco); else window.addEventListener('resize', aoRedimensionar);
    medir();
    cena.medir();
    iniciar();
    return () => pAtual;
  }

  /* --- versão estática (movimento reduzido) --- */

  function montarEstatica(secao, palco) {
    secao.classList.add('estatica');
    const passos = Array.from(secao.querySelectorAll('.passo'));
    const pontos = [0, 0.3, 0.64, 1];
    const lista = document.createElement('div');
    lista.className = 'container quadros';
    const cenas = [];
    passos.forEach((passo, i) => {
      const art = document.createElement('article');
      art.className = 'quadro';
      const fig = document.createElement('div');
      fig.className = 'quadro-cena';
      fig.setAttribute('aria-hidden', 'true');
      const cv = document.createElement('canvas');
      cv.className = 'cena-pixel';
      fig.appendChild(cv);
      const tx = document.createElement('div');
      tx.className = 'quadro-texto';
      passo.removeAttribute('inert');
      while (passo.firstChild) tx.appendChild(passo.firstChild);
      art.append(fig, tx);
      lista.appendChild(art);
      cenas.push({ cena: criarCenaPixel(cv, fig), p: pontos[i], fig });
    });
    palco.replaceWith(lista);
    const redesenhar = () => cenas.forEach((c) => { if (c.cena.medir()) c.cena.desenhar(c.p, 0); });
    redesenhar();
    if ('ResizeObserver' in window) cenas.forEach((c) => new ResizeObserver(redesenhar).observe(c.fig)); else window.addEventListener('resize', redesenhar);
    injetarIconesEstaticos();
  }

  async function iniciarHistoria() {
    const secao = document.querySelector('[data-historia]');
    if (!secao) return;
    const palco = secao.querySelector('.historia-palco');
    const canvas = palco.querySelector('canvas.cena-pixel');
    if (REDUZIR_MOVIMENTO) { montarEstatica(secao, palco); return; }
    ativarRolagem(secao, palco, criarCenaPixel(canvas, palco.querySelector('[data-cena]')));
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
