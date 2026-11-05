/* Optional FCU overlay. Census observations and the active thematic map remain intact. */
(() => {
  'use strict';
  const D = window.ACU_R96_FCU_DATA;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = value => Number.isFinite(value) ? value.toLocaleString('pt-BR') : '—';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const COLOR = '#ad3035', DARK_COLOR = '#353c43', LINE_WIDTH = .95;
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
  let drawnColor = '', hoverMap = null, tooltip = null, foreignTooltip = null, hovered = null, hitIndex = [], hoverFrame = 0, pointer = null, moving = false, dismissed = null;
  const active = () => Boolean(state?.module === 'panorama' && state.fcuOverlay && state.theme !== 'FCU_2022');
  const key = () => state?.cityId + '|' + state?.geographyId;
  const indexFor = n => typeof n === 'number' && Number.isFinite(n) && n >= 0 ? BANDS.findIndex(b => b.upper === null || n <= b.upper) : -1;
  const hatchColor = () => map?._r82Legend?.model?.direction === 'deprivation' ? DARK_COLOR : COLOR;
  function basePalette(colors, direction) {
    if (!active() || direction === 'deprivation') return colors;
    return colors.map(color => /^#[\da-f]{6}$/i.test(color) ? '#' + [1,3,5].map(i => Math.round(parseInt(color.slice(i,i+2),16)*.8+255*.2).toString(16).padStart(2,'0')).join('') : color);
  }
  function ringContains(ring,x,y) {
    let inside = false;
    for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
      const [xi,yi]=ring[i],[xj,yj]=ring[j];
      if ((yi>y)!==(yj>y) && x<(xj-xi)*(y-yi)/(yj-yi)+xi) inside=!inside;
    }
    return inside;
  }
  function contains(feature,x,y) {
    const g=feature.geometry,polygons=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
    return polygons.some(rings=>rings.length&&ringContains(rings[0],x,y)&&!rings.slice(1).some(r=>ringContains(r,x,y)));
  }
  function indexFeatures() {
    const paths=new Map();layer?.eachLayer(l=>paths.set(l.feature.properties.code,l._path));
    hitIndex=shown.map(feature=>{
      let left=Infinity,right=-Infinity,bottom=Infinity,top=-Infinity;
      const walk=c=>{if(typeof c[0]==='number'){left=Math.min(left,c[0]);right=Math.max(right,c[0]);bottom=Math.min(bottom,c[1]);top=Math.max(top,c[1]);}else c.forEach(walk);};
      walk(feature.geometry.coordinates);return {feature,path:paths.get(feature.properties.code),left,right,bottom,top,area:(right-left)*(top-bottom)};
    }).sort((a,b)=>(a.feature.properties.coverage==='CENSUS'?0:1)-(b.feature.properties.coverage==='CENSUS'?0:1)||a.area-b.area);
  }
  function hit(record,event,x,y){
    // Match the SVG actually painted by Leaflet, including its screen-space
    // simplification at overview zooms. Geographic rings remain the fallback.
    const path=record.path;
    if(record.feature.properties.coverage==='CENSUS'&&typeof path?.isPointInFill==='function'){
      const matrix=path.getScreenCTM();
      if(matrix){const m=matrix.inverse();return path.isPointInFill({x:m.a*event.clientX+m.c*event.clientY+m.e,y:m.b*event.clientX+m.d*event.clientY+m.f});}
    }
    return contains(record.feature,x,y);
  }
  function closeHover() {
    if(hoverFrame)cancelAnimationFrame(hoverFrame);hoverFrame=0;pointer=null;
    if(tooltip){tooltip.remove();tooltip=null;}hovered=null;
    hoverMap?.getContainer().removeAttribute('data-r99-fcu-hover');
  }
  function tooltipHtml(feature) {
    const p=feature.properties,n=p.metrics?.population_n,i=p.coverage==='CENSUS'?indexFor(n):-1;
    return '<strong>'+esc(p.name)+'</strong>'+(i>=0?'<b>'+number(n)+' moradores</b><span>Faixa: '+esc(BANDS[i].label)+' moradores</span>':'<span>Área de referência · sem estatística própria</span>')+
      '<small>IBGE · Censo 2022'+(i>=0?' · comunidade inteira':'')+'</small>';
  }
  function hoverAt() {
    hoverFrame=0;const e=pointer;pointer=null;
    if(!e||!active()||moving||loadedKey!==key()||!hoverMap?.getContainer().isConnected||bridge?.canHover?.()===false){closeHover();return;}
    if(e.target?.closest?.('.leaflet-marker-icon,.leaflet-control,.acu-quick-card-overlay,.r71-toolbar,[data-r98-legend]')){closeHover();return;}
    const ll=hoverMap.mouseEventToLatLng(e),x=ll.lng,y=ll.lat;
    const found=hitIndex.find(r=>x>=r.left&&x<=r.right&&y>=r.bottom&&y<=r.top&&hit(r,e,x,y))?.feature;
    if(!found){dismissed=null;closeHover();return;}
    if(dismissed===found.properties.code){closeHover();return;}
    dismissed=null;bridge?.hideHover?.();
    // The SVG remains pointer-transparent. Native indicator clicks and touch gestures pass through.
    if(foreignTooltip?.isOpen()&&!foreignTooltip.options.permanent)hoverMap.closeTooltip(foreignTooltip);
    if(!tooltip)tooltip=L.tooltip({className:'r99-fcu-tooltip',direction:'auto',offset:[14,-10],opacity:1,interactive:false});
    if(hovered!==found.properties.code){tooltip.setContent(tooltipHtml(found));hovered=found.properties.code;}
    tooltip.setLatLng(ll);if(!hoverMap.hasLayer(tooltip))tooltip.addTo(hoverMap);
    const element=tooltip.getElement();element.style.marginLeft='0px';element.style.marginTop='0px';
    const r=element.getBoundingClientRect(),mr=hoverMap.getContainer().getBoundingClientRect(),left=Math.max(8,mr.left+8),right=Math.min(innerWidth-8,mr.right-8),top=Math.max(8,mr.top+8),bottom=Math.min(innerHeight-8,mr.bottom-8);
    element.style.marginLeft=(r.left<left?left-r.left:r.right>right?right-r.right:0)+'px';element.style.marginTop=(r.top<top?top-r.top:r.bottom>bottom?bottom-r.bottom:0)+'px';
    hoverMap.getContainer().dataset.r99FcuHover=hovered;
  }
  function onPointer(e){if(e.pointerType==='touch')return;pointer=e;if(!hoverFrame)hoverFrame=requestAnimationFrame(hoverAt);}
  function onLeave(){dismissed=null;closeHover();}
  function onMoveStart(){moving=true;dismissed=null;closeHover();}
  function onMoveEnd(){moving=false;}
  function onKey(e){if(e.key==='Escape'){dismissed=hovered;closeHover();}}
  function onTooltipOpen(e){if(e.tooltip!==tooltip)foreignTooltip=e.tooltip;}
  function detachHover(){
    closeHover();if(!hoverMap)return;const c=hoverMap.getContainer();c.removeEventListener('pointermove',onPointer);c.removeEventListener('pointerleave',onLeave);document.removeEventListener('keydown',onKey);
    hoverMap.off('movestart zoomstart',onMoveStart).off('moveend zoomend',onMoveEnd).off('resize',onLeave).off('tooltipopen',onTooltipOpen).off('unload',detachHover);hoverMap=null;foreignTooltip=null;
  }
  function attachHover(){
    if(hoverMap===map)return;detachHover();hoverMap=map;moving=false;
    const c=map.getContainer();c.addEventListener('pointermove',onPointer,{passive:true});c.addEventListener('pointerleave',onLeave);document.addEventListener('keydown',onKey);
    map.on('movestart zoomstart',onMoveStart).on('moveend zoomend',onMoveEnd).on('resize',onLeave).on('tooltipopen',onTooltipOpen).once('unload',detachHover);
  }

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
    closeHover();dismissed=null;hitIndex=[];drawnColor='';
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
        state.fcuOverlay = event.target.checked; bridge?.changed ? bridge.changed() : mapMount(state);
      });
    }
    group.hidden = state.module !== 'panorama' || state.theme === 'FCU_2022';
    group.querySelector('input').checked = Boolean(state.fcuOverlay);
  }
  function pattern(id, spacing) {
    return '<pattern id="' + id + '" width="' + spacing + '" height="' + spacing + '" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">' +
      '<line x1="0" y1="0" x2="0" y2="' + spacing + '" stroke="#ffffff" stroke-width="1.75" stroke-opacity="0.8"/>' +
      '<line x1="0" y1="0" x2="0" y2="' + spacing + '" stroke="' + hatchColor() + '" stroke-width="' + LINE_WIDTH + '" stroke-opacity="0.9"/></pattern>';
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
      '<p>Faixas fixas nas oito capitais. A textura não mede moradores por km² nem grau de precariedade. Passe o mouse sobre a comunidade para ver nome, moradores e faixa. Em telas de toque, use a lista de comunidades.</p></details>' +
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
            {color:hatchColor(),weight:.85,dashArray:null,fill:true,fillColor:'url(#' + prefix + '-band-' + i + ')',fillOpacity:1,opacity:.9};
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
      loadedKey = key(); drawnColor=hatchColor();indexFeatures();attachHover();renderToolbar();
    } catch (error) {
      if (token !== request) return;
      failed = true; clear(); renderToolbar();
    }
  }
  function mapMount(s) {
    state = s; control();
    if (map !== s.map) {
      request++; detachHover();clear(); toolbar?.remove(); toolbar = null; map = s.map;
    }
    if (!map?.getContainer().isConnected) return;
    map.getContainer().toggleAttribute('data-r98-fcu-overlay',active());
    if (!active()) { request++; detachHover();clear(); toolbar?.remove(); toolbar = null; return; }
    if (!map.getPane('r98FCU')) {
      const pane = map.createPane('r98FCU'); pane.style.zIndex = 455; pane.style.pointerEvents = 'none';
    }
    attachHover();
    if (!toolbar?.isConnected) {
      toolbar = document.createElement('section'); toolbar.className = 'r98-map-control'; toolbar.dataset.r98Legend = '';
      toolbar.setAttribute('aria-label','Hachuras das favelas e comunidades urbanas');
      const rail = document.querySelector('.r92-map-rail');
      if (rail) { const main = rail.querySelector('#map-legend'); main ? main.after(toolbar) : rail.prepend(toolbar); }
      else { const c = L.control({position:'bottomleft'}); c.onAdd = () => toolbar; c.addTo(map); L.DomEvent.disableClickPropagation(toolbar); L.DomEvent.disableScrollPropagation(toolbar); }
    }
    renderToolbar();
    if (loadedKey !== key() || drawnColor!==hatchColor()) { request++; clear(); draw(); }
  }
  function snapshot() {
    const bands = BANDS.map(b => ({...b, count:0})); let references = 0, missing = 0;
    const rendered = [];
    layer?.eachLayer(l => {
      const p = l.feature.properties, i = p.coverage === 'CENSUS' ? indexFor(p.metrics?.population_n) : -1;
      if (p.coverage === 'REFERENCE_ONLY') references++; else if (i >= 0) bands[i].count++; else missing++;
      rendered.push({code:p.code,population:p.metrics?.population_n ?? null,band:i,fill:l._path?.getAttribute('fill'),fillOpacity:l._path?.getAttribute('fill-opacity'),interactive:l.options.interactive,dash:l._path?.getAttribute('stroke-dasharray')});
    });
    const patterns = [...(renderer?._container.querySelectorAll('pattern') || [])].map(p => ({id:p.id,spacing:Number(p.getAttribute('width')),width:Number(p.lastElementChild.getAttribute('stroke-width')),color:p.lastElementChild.getAttribute('stroke')}));
    return {requested:Boolean(state?.fcuOverlay),enabled:active(),ready:active() && loadedKey === key(),city:state?.cityId,features:rendered.length,
      scope:active() ? scope().mode : null,bands,references,missing,rendered,patterns,theme:state?.theme,nativeIndicator:state?.mapIndicator,
      pointerEvents:map?.getPane('r98FCU')?.style.pointerEvents || null,cachedCities:[...cache.keys()],hatchColor:hatchColor(),hovered,tooltip:tooltip?.getContent()||null};
  }
  window.ACU_R98_FCU = {
    connect(s,b) { state = s; if (b) bridge = b; }, mapMount, snapshot,basePalette
  };
})();
