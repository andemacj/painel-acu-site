/* One neutral, symbol-free vector basemap for every configured city. */
(()=>{'use strict';
 const credit='<a href="https://openfreemap.org/" target="_blank" rel="noopener">OpenFreeMap</a> · <a href="https://openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> · <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">© OpenStreetMap</a>';
 const localCredit='<a href="https://www.ibge.gov.br/geociencias/cartas-e-mapas/bases-cartograficas-continuas/15759-brasil.html" target="_blank" rel="noopener">IBGE BC250 2023</a> · referência local 1:250.000';
 const source=ACU_R71R1_URBAN_STYLE;
 function analysisStyle(roads=false){
  const style={version:8,sources:JSON.parse(JSON.stringify(source.sources)),layers:[],metadata:{acu_revision:'R82',scope:'Neutral geometry only; no native symbol, text, shield, sprite or pattern'}};
  for(const original of source.layers){
   const sl=original['source-layer']||'',id=original.id;
   if(original.type==='symbol'||!['background','fill','line'].includes(original.type)||/aeroway|aero|rail|ferry|pattern|hatch|casing/i.test(id))continue;
   const road=sl==='transportation'&&original.type==='line';if(roads!==road)continue;
   if(!road&&original.type!=='background'&&!['water','waterway','landcover','landuse','park','building','boundary'].includes(sl))continue;
   const layer=JSON.parse(JSON.stringify(original));layer.paint={};
   if(layer.type==='background')layer.paint={'background-color':'#f7f8fa'};
   if(layer.type==='fill')layer.paint={'fill-color':sl==='water'?'#edf0f2':sl==='building'?'#eff1f3':'#f3f5f6','fill-opacity':1};
   if(layer.type==='line')layer.paint={'line-color':road?'#7d8993':sl==='waterway'?'#d9e0e4':'#e1e5e8','line-width':road?['interpolate',['linear'],['zoom'],8,.25,12,.45,16,.7,20,1.1]:.6,'line-opacity':road?.22:.6};
   if(layer.layout){delete layer.layout['icon-image'];delete layer.layout['text-field'];}
   style.layers.push(layer);
  }
  return style;
 }
 function mountLocal(map,data){
  const group=L.layerGroup().addTo(map),layers=data?.layers||{};
  for(const [name,z] of [['r82LocalGround',210],['r82LocalWater',215],['r82LocalRoads',430]]){if(!map.getPane(name))map.createPane(name);Object.assign(map.getPane(name).style,{zIndex:z,pointerEvents:'none'});}
  const styles={water:{pane:'r82LocalGround',color:'#e0e5e8',weight:.5,fillColor:'#edf0f2',fillOpacity:1},rivers:{pane:'r82LocalWater',color:'#d8dfe4',weight:.6,opacity:.7},roads:{pane:'r82LocalRoads',color:'#7d8993',weight:.6,opacity:.22}};
  for(const k of ['water','rivers','roads'])if(layers[k])L.geoJSON(layers[k],{pane:styles[k].pane,renderer:L.canvas({pane:styles[k].pane}),interactive:false,style:styles[k]}).addTo(group);
  group._r71Local=true;group._r71Sources=Object.keys(layers);return group;
 }
 function mount(map,data){
  const local=mountLocal(map,data),hasLocal=local._r71Sources.length>0,container=map.getContainer();
  for(const [name,z] of [['r71r1Urban',205],['r82Roads',430]]){if(!map.getPane(name))map.createPane(name);Object.assign(map.getPane(name).style,{zIndex:z,pointerEvents:'none'});}
  let layers=[],disposed=false,timer=null,startTimer=null,state='support',reason='initial',failures=[],ready=new Set(),attempt=0,regionalCredit=false,urbanCredit=false;
  if(hasLocal){map.attributionControl.addAttribution(localCredit);regionalCredit=true;}
  const badge=L.control({position:'bottomleft'});badge.onAdd=()=>{const el=L.DomUtil.create('div','r71r1-base-status r82-base-status');el.setAttribute('role','status');return el;};badge.addTo(map);
  const status=(mode,why)=>{state=mode;reason=why;container.dataset.basemap=mode;badge.getContainer().textContent=mode==='online'?'Base neutra · sem rótulos':hasLocal?'Base local · sem rótulos':'Base neutra · ruas indisponíveis';badge.getContainer().title=mode==='online'?'Referência geométrica OpenFreeMap/OpenMapTiles/OpenStreetMap.':hasLocal?'Geometria de apoio IBGE BC250; mapa de ruas online indisponível.':'O indicador, os limites e as interações permanecem disponíveis.';};
  const clear=()=>{clearTimeout(timer);for(const l of layers)if(map.hasLayer(l))map.removeLayer(l);layers=[];ready.clear();if(urbanCredit){map.attributionControl.removeAttribution(credit);urbanCredit=false;}};
  function support(why){if(disposed)return;clear();if(!map.hasLayer(local))local.addTo(map);if(hasLocal&&!regionalCredit){map.attributionControl.addAttribution(localCredit);regionalCredit=true;}status('support',why);}
  function online(){if(disposed||ready.size!==2||state==='online')return;clearTimeout(timer);if(map.hasLayer(local))map.removeLayer(local);if(regionalCredit){map.attributionControl.removeAttribution(localCredit);regionalCredit=false;}if(!urbanCredit){map.attributionControl.addAttribution(credit);urbanCredit=true;}status('online','both-renderers-idle');}
  function start(){
   if(disposed||state==='online'||layers.length)return;
   if(!navigator.onLine){support('offline');return;}
   if(!window.maplibregl||!L.maplibreGL){support('renderer-unavailable');return;}
   status('support','loading');const token=++attempt;
   if(!urbanCredit){map.attributionControl.addAttribution(credit);urbanCredit=true;}
   try{
    for(const roads of [false,true]){
     const key=roads?'roads':'base',layer=R73MaplibreLayer({style:analysisStyle(roads),pane:roads?'r82Roads':'r71r1Urban',interactive:false,padding:0,renderWorldCopies:false,maxZoom:22,attributionControl:false,preserveDrawingBuffer:true});
     layers.push(layer);layer.addTo(map);const gl=layer.getMaplibreMap();
     gl.on('idle',()=>{if(disposed||token!==attempt)return;ready.add(key);online();});
     gl.on('error',e=>{if(disposed||token!==attempt)return;failures.push({message:String(e.error?.message||e.error||'Resource error')});++attempt;support('provider-or-renderer-error');});
     gl.getCanvas().addEventListener('webglcontextlost',()=>{if(!disposed){++attempt;support('webgl-context-lost');}});
    }
    timer=setTimeout(()=>{if(state!=='online'){++attempt;support('load-timeout');}},20000);
   }catch(e){failures.push({message:String(e)});++attempt;support('renderer-error');}
  }
  const off=()=>{++attempt;support('offline');},on=()=>start();window.addEventListener('offline',off);window.addEventListener('online',on);map.whenReady(()=>{startTimer=setTimeout(start,250);});status('support','initial');
  map.once('unload',()=>{disposed=true;clearTimeout(timer);clearTimeout(startTimer);window.removeEventListener('offline',off);window.removeEventListener('online',on);});
  local.r71r1={snapshot:()=>({state,reason,failures:[...failures],ready:[...ready],urbanLayers:layers.length,webgl:layers.map(l=>!!l.getMaplibreMap()),attribution:map.attributionControl.getContainer().textContent,nativeSymbolLayers:layers.flatMap(l=>l.getMaplibreMap().getStyle()?.layers||[]).filter(l=>l.type==='symbol').length,revision:'R82'}),layers:()=>layers};
  map.r71r1Basemap=local.r71r1;map.r82={snapshot:()=>({base:local.r71r1.snapshot(),legend:map._r82Legend,labels:map.r72Labels?.audit()})};return local;
 }
 window.ACU_R82_BASE={analysisStyle,mount};window.R71R1UrbanContext={mount};
})();
