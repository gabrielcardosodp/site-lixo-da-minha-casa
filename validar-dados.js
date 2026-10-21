/* Valida os arquivos de dados antes de publicar.
 * Uso (no terminal, na pasta do projeto):  node validar-dados.js
 * Não exige instalação de pacotes.
 */
const fs = require('fs');
const path = require('path');

const pasta = path.join(__dirname, 'src', 'data');
const erros = [];
const avisos = [];

function ler(nome) {
  const caminho = path.join(pasta, nome);
  try {
    return JSON.parse(fs.readFileSync(caminho, 'utf8'));
  } catch (e) {
    erros.push(`${nome}: JSON inválido (${e.message}).`);
    return null;
  }
}

// impacto.json
const impacto = ler('impacto.json');
if (impacto) {
  if (typeof impacto.publicado !== 'boolean') erros.push('impacto.json: "publicado" deve ser true ou false.');
  const ind = impacto.indicadores || {};
  for (const [chave, i] of Object.entries(ind)) {
    if (i.valor === 0) avisos.push(`impacto.json: "${chave}" tem valor 0. Use null se o dado ainda não foi medido.`);
    if (i.valor !== null && typeof i.valor !== 'number') erros.push(`impacto.json: "${chave}.valor" deve ser número ou null.`);
  }
  const temValor = Object.values(ind).some((i) => typeof i.valor === 'number');
  if (impacto.publicado === true && !temValor) erros.push('impacto.json: "publicado" é true, mas nenhum indicador tem valor.');
  if (temValor && impacto.publicado !== true) avisos.push('impacto.json: há valores, mas "publicado" é false. Os números não serão exibidos.');
}

// pontos-coleta.json
const pontos = ler('pontos-coleta.json');
const CATEGORIAS = ['estacao_coleta', 'pev', 'oleo_cozinha', 'tampinhas'];
if (pontos) {
  const ids = new Set();
  (pontos.pontos || []).forEach((p, idx) => {
    const rot = `pontos-coleta.json, item ${idx + 1} (${p.id || 'sem id'})`;
    if (!p.id || /\s/.test(p.id)) erros.push(`${rot}: "id" é obrigatório e não pode conter espaços.`);
    if (ids.has(p.id)) erros.push(`${rot}: id duplicado.`);
    ids.add(p.id);
    if (!p.nome) erros.push(`${rot}: "nome" é obrigatório.`);
    if (!CATEGORIAS.includes(p.categoria)) erros.push(`${rot}: categoria inválida (${p.categoria}).`);
    if (!['confirmado', 'pendente_verificacao'].includes(p.status)) erros.push(`${rot}: status deve ser "confirmado" ou "pendente_verificacao".`);
    if (p.latitude !== null && typeof p.latitude !== 'number') erros.push(`${rot}: latitude deve ser número ou null.`);
    if (p.longitude !== null && typeof p.longitude !== 'number') erros.push(`${rot}: longitude deve ser número ou null.`);
    if (p.status === 'confirmado') {
      if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') avisos.push(`${rot}: confirmado, mas sem coordenadas. Aparece na lista, não no mapa.`);
      if (!p.fonte) erros.push(`${rot}: ponto confirmado precisa de "fonte".`);
      if (!p.data_verificacao) avisos.push(`${rot}: ponto confirmado sem "data_verificacao".`);
    }
    if (p.status === 'pendente_verificacao') avisos.push(`${rot}: pendente de verificação, não aparece na lista nem no mapa.`);
  });
}

// materiais.json
const materiais = ler('materiais.json');
const referencias = ler('referencias.json');
if (materiais && referencias) {
  const idsRef = new Set((referencias.referencias || []).map((r) => r.id));
  (materiais.materiais || []).forEach((m) => {
    if (!(m.categoria in (materiais.categorias || {}))) erros.push(`materiais.json: "${m.id}" tem categoria inválida.`);
    (m.fontes || []).forEach((f) => {
      if (!idsRef.has(f)) erros.push(`materiais.json: "${m.id}" referencia a fonte "${f}", que não existe em referencias.json.`);
    });
  });
}

// referencias.json
if (referencias) {
  (referencias.referencias || []).forEach((r) => {
    if (r.verificado === true && r.url === null && r.tipo !== 'academico') {
      avisos.push(`referencias.json: "${r.id}" está marcado como conferido, mas não tem URL.`);
    }
    if (r.url && !/^https:\/\//.test(r.url)) erros.push(`referencias.json: "${r.id}" deve ter URL iniciando com https://.`);
  });
}

console.log('Validação dos dados do site\n');
if (erros.length) {
  console.log(`ERROS (${erros.length}):`);
  erros.forEach((e) => console.log('  - ' + e));
} else {
  console.log('Nenhum erro encontrado.');
}
if (avisos.length) {
  console.log(`\nAVISOS (${avisos.length}):`);
  avisos.forEach((a) => console.log('  - ' + a));
}
process.exit(erros.length ? 1 : 0);
