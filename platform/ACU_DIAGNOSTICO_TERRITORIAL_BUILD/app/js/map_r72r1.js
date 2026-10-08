/* R72-R1: preserve original style filters; use actual polygon coordinates.
 * MapLibre 5.6.2 supports within for points/lines (not polygon fills). */
(()=>{'use strict';
 const states=new WeakMap(),categories=['suburb','neighbourhood','neighborhood','quarter','borough','city_district'];
 function state(map){if(!states.has(map)){states.set(map,{features:[],mask:null,renderers:new Set(),revision:0});map.once('unload',()=>states.delete(map));}return states.get(map);}
 function missing(status){
  const s=String(status||'').toLowerCase();
  if(/suppressed_or_missing|missing_or_suppressed|absent.*suppres/.test(s))return 'Ausente ou suprimido';
  if(/suppression|suppressed|suprim/.test(s))return 'Valor suprimido';
  if(/denominator_zero/.test(s))return 'Sem denominador';
  if(/universe_not_applicable|not_applicable/.test(s))return 'Não aplicável';
  return 'Sem dado';
 }
 function apply(s,r){
  const gl=r.gl;if(!gl.isStyleLoaded()||r.revision===s.revision)return;
  for(const layer of gl.getStyle().layers){
   if(layer.type==='symbol'&&layer['source-layer']==='place'&&layer.id==='label_other'){
    if(!r.filters.has(layer.id))r.filters.set(layer.id,gl.getFilter(layer.id)||null);
    const original=r.filters.get(layer.id);
    const keep=['!', ['all',['in',['get','class'],['literal',categories]],['within',s.mask||{type:'Polygon',coordinates:[]}]]];
    gl.setFilter(layer.id,s.mask?(original?['all',original,keep]:keep):original);
   }
   if(layer.type==='fill'&&layer.paint?.['fill-pattern']==='wetland_bg_11'){
    if(!r.textures.has(layer.id))r.textures.set(layer.id,gl.getPaintProperty(layer.id,'fill-opacity')??1);
    // Texture attenuation only; no mask or thematic hatch modification.
    gl.setPaintProperty(layer.id,'fill-opacity',s.mask?.coordinates.length?0.12:r.textures.get(layer.id));
   }
  }
  r.revision=s.revision;r.applies++;
 }
 function setArea(map,features){
  const s=state(map),next=features.filter(f=>['Polygon','MultiPolygon'].includes(f.geometry?.type));
  if(s.features.length===next.length&&next.every((f,i)=>f.geometry===s.features[i]?.geometry))return;
  s.features=next;
  s.mask=next.length?{type:'MultiPolygon',coordinates:next.flatMap(f=>f.geometry.type==='Polygon'?[f.geometry.coordinates]:f.geometry.coordinates)}:null;
  s.revision++;for(const r of s.renderers)apply(s,r);
 }
 function attach(map,gl){
  const s=state(map),r={gl,filters:new Map(),textures:new Map(),revision:-1,applies:0};s.renderers.add(r);
  gl.on('load',()=>apply(s,r));gl.on('idle',()=>apply(s,r));gl.on('remove',()=>s.renderers.delete(r));
  if(gl.isStyleLoaded())apply(s,r);
 }
 function audit(map){const s=states.get(map);return s?{version:window.maplibregl?.getVersion?.(),features:s.features.length,polygonParts:s.mask?.coordinates.length||0,revision:s.revision,renderers:[...s.renderers].map(r=>({revision:r.revision,applies:r.applies,filterLayers:[...r.filters.keys()],textureLayers:[...r.textures.keys()]}))}:null;}
 window.ACU_R72R1={setArea,attach,audit,missing,categories};
})();
