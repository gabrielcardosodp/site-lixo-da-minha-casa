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
      if (el.closest('.hero') || el.classList.contains('reveal') || el.classList.contains('visivel')) return;
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
