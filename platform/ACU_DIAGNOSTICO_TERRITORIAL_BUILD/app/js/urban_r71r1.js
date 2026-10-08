/* Online street context with automatic, explicitly labelled BC250 contingency.
 * Leaflet remains the sole navigation and thematic owner. No changed headers,
 * proxy, identity masking, tile prefetch, or persistent tile download. */
(()=>{'use strict';
 const credit='<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>';
 const regional='<a href="https://www.ibge.gov.br/geociencias/cartas-e-mapas/bases-cartograficas-continuas/15759-brasil.html" target="_blank" rel="noopener">IBGE BC250 2023</a> · contexto local 1:250.000';
 function mount(map,data){
  const local=R71LocalContext.mount(map,data),container=map.getContainer();
  for(const [name,z] of [['r71r1Urban',205],['r71r1StreetLabels',460]]){map.createPane(name);Object.assign(map.getPane(name).style,{zIndex:z,pointerEvents:'none'});}
  let layers=[],disposed=false,timer=null,startTimer=null,state='support',reason='initial',failures=[],ready=new Set(),attempt=0,regionalCredit=true,urbanCredit=false;
  const badge=L.control({position:'bottomleft'});badge.onAdd=()=>{const el=L.DomUtil.create('div','r71r1-base-status');el.setAttribute('role','status');el.textContent='Base regional de apoio · menor detalhe';return el;};badge.addTo(map);
  const setStatus=(mode,why)=>{state=mode;reason=why;container.dataset.basemap=mode;const el=badge.getContainer();if(el){el.textContent=mode==='online'?'Mapa de ruas · online':'Base regional de apoio · menor detalhe';el.title=mode==='online'?'OpenFreeMap · OpenStreetMap. Ruas e rótulos dependem da conexão.':why==='loading'?'Carregando mapa de ruas…':'Mapa de ruas indisponível. Indicadores e navegação preservados.';}};
  const clearUrban=()=>{clearTimeout(timer);for(const layer of layers){if(map.hasLayer(layer))map.removeLayer(layer);}layers=[];ready.clear();if(urbanCredit){map.attributionControl.removeAttribution(credit);urbanCredit=false;}};
  function support(why){if(disposed)return;clearUrban();if(!map.hasLayer(local))local.addTo(map);if(!regionalCredit){map.attributionControl.addAttribution(regional);regionalCredit=true;}setStatus('support',why);}
  function online(){if(disposed||ready.size!==2||state==='online')return;clearTimeout(timer);if(map.hasLayer(local))map.removeLayer(local);if(regionalCredit){map.attributionControl.removeAttribution(regional);regionalCredit=false;}if(!urbanCredit){map.attributionControl.addAttribution(credit);urbanCredit=true;}setStatus('online','both-renderers-idle');}
  function start(){
   if(disposed||state==='online'||layers.length)return;
   if(!navigator.onLine){support('offline');return;}
   if(!window.maplibregl||!L.maplibreGL){support('renderer-unavailable');return;}
   setStatus('support','loading');const thisAttempt=++attempt;
   try{
    for(const mode of ['base','labels']){
     const style=JSON.parse(JSON.stringify(ACU_R71R1_URBAN_STYLE));
     style.layers=style.layers.filter(l=>{const upper=l.type==='symbol'||l.type==='line'&&/transportation/.test(l['source-layer']||'');return mode==='labels'?upper:!upper;});
     // Candidata local: no overfetch outside the viewport; each GL layer is
     // synchronized by the official Leaflet adapter (512px versus 256px zoom).
     const layer=R73MaplibreLayer({style,pane:mode==='base'?'r71r1Urban':'r71r1StreetLabels',interactive:false,padding:0,renderWorldCopies:false,maxZoom:22,attributionControl:false,preserveDrawingBuffer:true});
     layers.push(layer);layer.addTo(map);const gl=layer.getMaplibreMap();ACU_R72R1.attach(map,gl);
     gl.on('idle',()=>{if(disposed||thisAttempt!==attempt)return;ready.add(mode);online();});
     gl.on('error',e=>{if(disposed||thisAttempt!==attempt)return;failures.push({at:new Date().toISOString(),message:String(e.error?.message||e.error||'Resource error')});++attempt;support('provider-or-renderer-error');});
     gl.getCanvas().addEventListener('webglcontextlost',()=>{if(!disposed){++attempt;support('webgl-context-lost');}});
    }
    timer=setTimeout(()=>{if(state!=='online'){++attempt;support('load-timeout');}},20000);
   }catch(e){failures.push({message:String(e)});++attempt;support('renderer-error');}
  }
  const onOffline=()=>{++attempt;support('offline');},onOnline=()=>start();
  window.addEventListener('offline',onOffline);window.addEventListener('online',onOnline);
  map.whenReady(()=>{startTimer=setTimeout(start,400);});
  map.on('unload',()=>{disposed=true;clearTimeout(timer);clearTimeout(startTimer);window.removeEventListener('offline',onOffline);window.removeEventListener('online',onOnline);});
  local.r71r1={snapshot:()=>({state,reason,failures:[...failures],ready:[...ready],urbanLayers:layers.length,webgl:layers.map(l=>!!l.getMaplibreMap()),attribution:map.attributionControl.getContainer().textContent}),layers:()=>layers};
  map.r71r1Basemap=local.r71r1;return local;
 }
 window.R71R1UrbanContext={mount};
})();
