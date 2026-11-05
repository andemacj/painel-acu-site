/* Optional FCU overlay. Census observations and the active thematic map remain intact. */
(() => {
  'use strict';
  const D = window.ACU_R96_FCU_DATA;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number.isFinite(value) ? value.toLocaleString('pt-BR') : '—';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const COLOR = '#ad3035', LINE_WIDTH = .95;
  const BANDS = Object.freeze([
    {upper:500, label:'Até 500', spacing:22},
    {upper:1000, label:'501–1.000', spacing:15},
    {upper:2000, label:'1.001–2.000', spacing:10},
    {upper:5000, label:'2.001–5.000', spacing:6.5},
    {upper:10000, label:'5.001–10.000', spacing:4.6},
    {upper:null, label:'Mais de 10.000', spacing:3.2}
  ]);
  const cache = new Map(), pending = new Map();
  let state = null, bridge = null, map = null, layer = null, renderer = null;
  let toolbar = null, loadedKey = null, shown = [], request = 0, failed = false, prefix = '';
  const active = () => Boolean(state?.module === 'panorama' && state.fcuOverlay && state.theme !== 'FCU_2022');
  const key = () => state?.cityId + '|' + state?.geographyId;
  const indexFor = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 ? BANDS.findIndex(b => b.upper === null || n <= b.upper) : -1;

  function scope() {
    const city = D.cities[state.cityId], relations = city.relations[state.geographyId];
    const municipal = state.geographyId === 'BELEM_CITY_CONTEXT' || state.data?.geographies?.find(g => g.id === state.geographyId)?.level === 'MUNICIPALITY';
    return {mode:municipal || !relations ? 'municipality' : 'selection', fallback:!municipal && !relations,
      ids:new Set((relations || []).map(r => r.code)), name:bridge?.geographyName?.() || city.name};
  }
  async function load(city) {
    if (cache.has(city)) return cache.get(city);
    if (!pending.has(city)) pending.set(city, fetch(D.cities[city].asset).then(r => {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    }).then(data => {
      if (data.type !== 'FeatureCollection' || !Array.isArray(data.features)) throw new Error('FCU inválida');
      cache.set(city, data); pending.delete(city); return data;
    }).catch(error => { pending.delete(city); throw error; }));
    return pending.get(city);
  }
  function clear() {
    layer?.remove(); renderer?.remove(); layer = null; renderer = null;
    loadedKey = null; shown = [];
  }
  function control() {
    const panel = document.querySelector('.r83-controls');
    if (!panel) return;
    let group = panel.querySelector('[data-r98-fcu-control]');
    if (!group) {
      group = document.createElement('details');
      group.className = 'r83-control-group r98-fcu-control';
      group.dataset.r98FcuControl = ''; group.dataset.r83Group = 'communities'; group.setAttribute('name','r83-map-group');
      group.innerHTML = '<summary><span>Favelas e comunidades urbanas</span><small>Camada · IBGE 2022</small></summary>' +
        '<div class="r83-control-content"><label class="r83-layer-toggle"><input type="checkbox" data-r98-fcu-layer><span>Mostrar sobre os indicadores<small>Mais linhas = mais moradores na comunidade inteira</small></span></label>' +
        '<p class="r83-hint">As cores continuam representando o indicador selecionado.</p></div>';
      panel.insertBefore(group, panel.querySelector('[data-r83-group="schools"]') || panel.querySelector('footer'));
      group.querySelector('input').addEventListener('change', event => {
        state.fcuOverlay = event.target.checked; mapMount(state); bridge?.changed?.();
      });
    }
    group.hidden = state.module !== 'panorama' || state.theme === 'FCU_2022';
    group.querySelector('input').checked = Boolean(state.fcuOverlay);
  }
  function pattern(id, spacing) {
    return '<pattern id="' + id + '" width="' + spacing + '" height="' + spacing + '" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">' +
      '<line x1="0" y1="0" x2="0" y2="' + spacing + '" stroke="#ffffff" stroke-width="1.75" stroke-opacity="0.8"/>' +
      '<line x1="0" y1="0" x2="0" y2="' + spacing + '" stroke="' + COLOR + '" stroke-width="' + LINE_WIDTH + '" stroke-opacity="0.82"/></pattern>';
  }
  function renderToolbar() {
    if (!toolbar?.isConnected || !active()) return;
    const ready = loadedKey === key(), s = scope();
    const previous = toolbar.querySelector('details'), expanded = previous ? previous.open : false;
    toolbar.innerHTML = '<details class="r98-hatch-guide"' + (expanded ? ' open' : '') + '><summary><strong>Comunidades · moradores</strong><span>Hachuras · Censo 2022</span><small class="r98-hatch-rule">Mais linhas = mais moradores</small></summary>' +
      '<ul class="r98-hatch-scale" aria-label="Número absoluto de moradores por comunidade">' +
      BANDS.map((b,i) => '<li><svg width="32" height="18" viewBox="0 0 32 18" aria-hidden="true"><defs>' + pattern(prefix + '-key-' + i,b.spacing) +
        '</defs><rect width="32" height="18" fill="url(#' + prefix + '-key-' + i + ')"/></svg><span>' + b.label + '</span></li>').join('') + '</ul>' +
      '<p class="r98-hatch-status" role="status" aria-live="polite">' + (failed ? 'Não foi possível carregar os limites.' : ready ? number(shown.filter(f => f.properties.coverage === 'CENSUS').length) + ' comunidades com população publicada.' : 'Carregando limites…') + '</p>' +
      (failed ? '<button type="button" data-r98-retry>Tentar novamente</button>' : '') +
      '<p class="r98-reference"><i aria-hidden="true"></i>Tracejado cinza: área sem estatística própria.</p>' +
      '<details class="r98-hatch-method"><summary>Recorte e leitura</summary><p>' + esc(s.fallback ? 'Cruzamento indisponível; exibindo o município.' : s.mode === 'municipality' ? 'Município inteiro.' : 'Comunidades que intersectam ' + s.name + '.') +
      ' As hachuras usam moradores da comunidade inteira, sem rateio pelo trecho. As cores mantêm o indicador e a geografia da legenda principal.</p>' +
      '<p>Faixas fixas nas oito capitais. A textura não mede moradores por km² nem grau de precariedade.</p></details>' +
      '<button type="button" data-r98-directory>Explorar comunidades e fontes →</button></details>';
    toolbar.querySelector('[data-r98-directory]').onclick = () => window.ACU_R96_FCU.openDirectory();
    toolbar.querySelector('[data-r98-retry]')?.addEventListener('click', draw);
  }
  async function draw() {
    const token = ++request, localMap = map, city = state.cityId, gid = state.geographyId;
    if (!active() || !localMap) return;
    failed = false; renderToolbar();
    try {
      const data = await load(city);
      if (token !== request || !active() || map !== localMap || state.cityId !== city || state.geographyId !== gid || !localMap.getContainer().isConnected) return;
      clear();
      const s = scope(); shown = s.mode === 'municipality' ? data.features : data.features.filter(f => s.ids.has(f.properties.code));
      prefix = 'r98-fcu-' + L.stamp(localMap) + '-' + token;
      renderer = L.svg({pane:'r98FCU', padding:.3}).addTo(localMap);
      layer = L.geoJSON({type:'FeatureCollection', features:shown}, {
        pane:'r98FCU', renderer, interactive:false,
        style:feature => {
          const p = feature.properties, i = p.coverage === 'CENSUS' ? indexFor(p.metrics?.population_n) : -1;
          return i < 0 ? {color:'#677782',weight:1.2,dashArray:'4 3',fill:false,opacity:1} :
            {color:COLOR,weight:.85,dashArray:null,fill:true,fillColor:'url(#' + prefix + '-band-' + i + ')',fillOpacity:1,opacity:.9};
        },
        onEachFeature:(feature,l) => l.on('add', () => {
          if (!l._path) return;
          l._path.dataset.r98FcuCode = feature.properties.code;
          l._path.dataset.r98FcuBand = feature.properties.coverage === 'CENSUS' ? indexFor(feature.properties.metrics?.population_n) : -1;
          l._path.setAttribute('aria-hidden','true');
        })
      }).addTo(localMap);
      const defs = document.createElementNS(SVG_NS,'defs');
      defs.innerHTML = BANDS.map((b,i) => pattern(prefix + '-band-' + i,b.spacing)).join('');
      renderer._container.prepend(defs);
      loadedKey = key(); renderToolbar();
    } catch (error) {
      if (token !== request) return;
      failed = true; clear(); renderToolbar();
    }
  }
  function mapMount(s) {
    state = s; control();
    if (map !== s.map) {
      request++; clear(); toolbar?.remove(); toolbar = null; map = s.map;
    }
    if (!map?.getContainer().isConnected) return;
    map.getContainer().toggleAttribute('data-r98-fcu-overlay',active());
    if (!active()) { request++; clear(); toolbar?.remove(); toolbar = null; return; }
    if (!map.getPane('r98FCU')) {
      const pane = map.createPane('r98FCU'); pane.style.zIndex = 455; pane.style.pointerEvents = 'none';
    }
    if (!toolbar?.isConnected) {
      toolbar = document.createElement('section'); toolbar.className = 'r98-map-control'; toolbar.dataset.r98Legend = '';
      toolbar.setAttribute('aria-label','Hachuras das favelas e comunidades urbanas');
      const rail = document.querySelector('.r92-map-rail');
      if (rail) { const main = rail.querySelector('#map-legend'); main ? main.after(toolbar) : rail.prepend(toolbar); }
      else { const c = L.control({position:'bottomleft'}); c.onAdd = () => toolbar; c.addTo(map); L.DomEvent.disableClickPropagation(toolbar); L.DomEvent.disableScrollPropagation(toolbar); }
    }
    renderToolbar();
    if (loadedKey !== key()) { request++; clear(); draw(); }
  }
  function snapshot() {
    const bands = BANDS.map(b => ({...b, count:0})); let references = 0, missing = 0;
    const rendered = [];
    layer?.eachLayer(l => {
      const p = l.feature.properties, i = p.coverage === 'CENSUS' ? indexFor(p.metrics?.population_n) : -1;
      if (p.coverage === 'REFERENCE_ONLY') references++; else if (i >= 0) bands[i].count++; else missing++;
      rendered.push({code:p.code,population:p.metrics?.population_n ?? null,band:i,fill:l._path?.getAttribute('fill'),fillOpacity:l._path?.getAttribute('fill-opacity'),interactive:l.options.interactive,dash:l._path?.getAttribute('stroke-dasharray')});
    });
    const patterns = [...(renderer?._container.querySelectorAll('pattern') || [])].map(p => ({id:p.id,spacing:Number(p.getAttribute('width')),width:Number(p.lastElementChild.getAttribute('stroke-width'))}));
    return {requested:Boolean(state?.fcuOverlay),enabled:active(),ready:active() && loadedKey === key(),city:state?.cityId,features:rendered.length,
      scope:active() ? scope().mode : null,bands,references,missing,rendered,patterns,theme:state?.theme,nativeIndicator:state?.mapIndicator,
      pointerEvents:map?.getPane('r98FCU')?.style.pointerEvents || null,cachedCities:[...cache.keys()]};
  }
  window.ACU_R98_FCU = {
    connect(s,b) { state = s; if (b) bridge = b; }, mapMount, snapshot
  };
})();
