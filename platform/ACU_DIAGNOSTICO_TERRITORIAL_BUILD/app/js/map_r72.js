/* R72 shared value formatting, interior labels and Canvas-compatible color updates. */
(()=>{'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function format(value,meta={}){
  if(value===null||value===undefined||value===''||!Number.isFinite(Number(value)))return 'N/D';
  const unit=String(meta.unit||''),percent=unit.includes('%')||/PERCENT/i.test(meta.measure_type||''),mean=meta.mean===true||/m[eé]dia|moradores.*domic|pessoas.*domic|pessoas\/dom/i.test(unit);
  const count=/COUNT/i.test(meta.measure_type||'')||/^(pessoas?|domic[ií]lios?|n[uú]mero|n|unidades?|registros?)$/i.test(unit);
  return ACU_R75.number(value,mean?2:count?0:percent?1:2)+(percent?'%':mean||count?'':unit?' '+unit:'');
 }
 function rgb(c){
  if(/^#[0-9a-f]{6}$/i.test(c||''))return [1,3,5].map(i=>parseInt(c.slice(i,i+2),16));
  const m=/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i.exec(c||'');
  return m?m.slice(1,4).map(Number):null;
 }
 function animate(group,style){
  if(!group)return;group._r72Generation=(group._r72Generation||0)+1;const token=group._r72Generation,changes=[],map=group._map,bounds=map?.getBounds();
  group.eachLayer(l=>{const target=style(l.feature),prior={fillColor:l.options.fillColor,fillOpacity:l.options.fillOpacity},a=rgb(prior.fillColor),b=rgb(target.fillColor);l._r72FinalStyle={...target};
   if(a&&b&&prior.fillColor!==target.fillColor&&!l.options.r71Missing&&!target.r71Missing&&target.fillOpacity>0&&prior.fillOpacity>0&&l.getBounds?.().intersects(bounds))changes.push({l,a,b,prior,target});
   l.setStyle(target);
  });
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||!changes.length||changes.length>1200)return;
  changes.forEach(x=>x.l.setStyle(x.prior));const start=performance.now();
  function step(t){if(group._r72Generation!==token||!group._map)return;const f=Math.min(1,(t-start)/180);
   changes.forEach(x=>x.l.setStyle({fillColor:f===1?x.target.fillColor:'#'+x.a.map((v,i)=>Math.round(v+(x.b[i]-v)*f).toString(16).padStart(2,'0')).join(''),fillOpacity:x.prior.fillOpacity+(x.target.fillOpacity-x.prior.fillOpacity)*f}));
   if(f<1)requestAnimationFrame(step);
  }requestAnimationFrame(step);
 }
 function inside(p,rings){
  let yes=false;for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i],b=ring[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;
  }return yes;
 }
 function polygons(feature){const g=feature?.geometry;return g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];}
 function anchor(map,entry,w,h){
  const size=map.getSize(),layer=entry.layer,b=layer.getBounds(),nw=map.latLngToContainerPoint(b.getNorthWest()),se=map.latLngToContainerPoint(b.getSouthEast());
  if(se.x<0||nw.x>size.x||se.y<0||nw.y>size.y||se.x-nw.x<w+4||se.y-nw.y<h+4)return null;
  const polys=polygons(entry.feature).map(poly=>poly.map(r=>r.map(c=>map.latLngToContainerPoint([c[1],c[0]]))));
  const fits=(p,rings)=>[-.5,0,.5].every(x=>[-.5,0,.5].every(y=>inside({x:p.x+x*(w+4),y:p.y+y*(h+4)},rings)));
  const candidates=[],gov=entry.feature.properties?.governed_label_anchor;
  if(gov?.inside_polygon)candidates.push(map.latLngToContainerPoint([gov.latitude,gov.longitude]));
  if(entry.marker)candidates.push(map.latLngToContainerPoint(entry.marker.getLatLng()));
  candidates.push({x:(Math.max(0,nw.x)+Math.min(size.x,se.x))/2,y:(Math.max(0,nw.y)+Math.min(size.y,se.y))/2});
  for(const rings of polys){
   const xs=rings[0].map(p=>p.x),ys=rings[0].map(p=>p.y),left=Math.max(w/2+2,Math.min(...xs)),right=Math.min(size.x-w/2-2,Math.max(...xs)),top=Math.max(h/2+2,Math.min(...ys)),bottom=Math.min(size.y-h/2-2,Math.max(...ys));
   if(right<left||bottom<top)continue;
   for(const p of candidates)if(p.x>=left&&p.x<=right&&p.y>=top&&p.y<=bottom&&fits(p,rings))return p;
   // Screen-space scanlines find interior runs, respecting holes. No geometry changes.
   for(const frac of [.5,.25,.75,.125,.375,.625,.875]){
    const y=top+(bottom-top)*frac,intersections=[];
    for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.y>y)!==(b.y>y))intersections.push(a.x+(y-a.y)*(b.x-a.x)/(b.y-a.y));}
    intersections.sort((a,b)=>a-b);
    for(let i=0;i+1<intersections.length;i+=2){
     const lo=Math.max(left,intersections[i]+w/2+2),hi=Math.min(right,intersections[i+1]-w/2-2);if(lo>hi)continue;
     const p={x:(lo+hi)/2,y};if(fits(p,rings))return p;
    }
   }
  }return null;
 }
 function hash(s){let h=2166136261;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
 const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
 function mount(map){
  const pane=map.createPane('r72Values');pane.style.zIndex='620';pane.style.pointerEvents='none';
  const root=L.DomUtil.create('div','r72-values',pane),ctx=document.createElement('canvas').getContext('2d');let entries=[],nodes=new Map(),frame=0,disposed=false,audit={};
  function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(layout);}
  function obstacles(){
   const r=map.getContainer().getBoundingClientRect();
   return [...map.getContainer().querySelectorAll('.leaflet-control,.r71r1-base-status,.r72-update-status:not([hidden]),.leaflet-marker-icon:not(.acu-map-label),.acu-quick-card-overlay:not([hidden])'),...document.querySelectorAll('.r71-map-tools')].filter(e=>e.getBoundingClientRect().width>0&&getComputedStyle(e).display!=='none').map(e=>{const b=e.getBoundingClientRect();return {left:b.left-r.left-4,right:b.right-r.left+4,top:b.top-r.top-4,bottom:b.bottom-r.top+4};});
  }
  function layout(){
   frame=0;if(disposed||!map._loaded)return;const size=map.getSize(),blocked=obstacles(),candidates=[],shown=[],allMarkers=new Set(entries.filter(e=>e.marker).map(e=>e.marker));
   for(const e of entries){
    const missing=!e.available||e.value==null;
    const value=missing?ACU_R72R1.missing(e.status):format(e.value,e),name=String(e.name||''),displayName=name;
    ctx.font='600 12px system-ui';const vw=ctx.measureText(value).width;ctx.font='500 11px system-ui';const w=Math.ceil(Math.max(vw,name?ctx.measureText(displayName).width:0))+4,h=name?30:17;
    const p=anchor(map,e,w,h);if(!p){if(e.marker)e.marker.getElement()?.style.setProperty('display','none','important');continue;}
    const world=map.project(map.containerPointToLatLng(p)),cell=Math.floor(world.x/100)+':'+Math.floor(world.y/70);
    candidates.push({e,value,name:displayName,w,h,p,cell,rank:hash(e.id),html:(name?'<span class="r72-name">'+esc(displayName)+'</span>':'')+'<b class="r72-number">'+esc(value)+'</b>'});
   }
   // Equal spatial opportunity: round-robin across world-anchored screen cells,
   // stable identifier order within each cell; never rank by value or polygon area.
   const cells=new Map();for(const c of candidates){if(!cells.has(c.cell))cells.set(c.cell,[]);cells.get(c.cell).push(c);}
   const buckets=[...cells].sort((a,b)=>hash(a[0])-hash(b[0])).map(([,xs])=>xs.sort((a,b)=>a.rank-b.rank)),ordered=[];
   for(let i=0;buckets.some(b=>b.length>i);i++)for(const b of buckets)if(b[i])ordered.push(b[i]);
   if(candidates.some(c=>Number.isInteger(c.e.priority)))ordered.sort((a,b)=>(b.e.priority??-1)-(a.e.priority??-1)||a.rank-b.rank);
   const accepted=[],kept=new Set();for(const c of ordered){
    const {p,w,h,e}=c,rect={left:p.x-w/2-3,right:p.x+w/2+3,top:p.y-h/2-2,bottom:p.y+h/2+2};
    if(rect.left<0||rect.right>size.x||rect.top<0||rect.bottom>size.y||blocked.some(b=>overlap(rect,b))||accepted.some(b=>overlap(rect,b))){if(e.marker)e.marker.getElement()?.style.setProperty('display','none','important');continue;}
    accepted.push(rect);kept.add(e.id);let node;
    if(e.marker){e.marker.setLatLng(map.containerPointToLatLng(p));node=e.marker.getElement();if(!node)continue;node.style.setProperty('display','block','important');node.style.setProperty('--acu-label-shift-x','0px');node.style.setProperty('--acu-label-shift-y','0px');node.classList.add('r72-native-label');node.innerHTML='<div class="r72-label-content">'+c.html+'</div>';node=node.firstElementChild;}
    else{node=nodes.get(e.id);if(!node){node=L.DomUtil.create('div','r72-value-label',root);nodes.set(e.id,node);}node.innerHTML=c.html;node.style.display='block';L.DomUtil.setPosition(node,map.containerPointToLayerPoint(p));}
    if(!e.marker){node.style.marginLeft=(-w/2)+'px';node.style.marginTop=(-h/2)+'px';}
    node.dataset.unitId=e.id;node.dataset.value=String(e.value);node.dataset.indicator=e.indicator||'';node.dataset.measure=e.unit||'';node.title=(e.name?e.name+' · ':'')+c.value+(e.unit?' · '+e.unit:'');node.style.width=w+'px';
    shown.push({id:e.id,name:e.name,status:e.status,available:e.available,value:e.value,text:c.value,indicator:e.indicator,unit:e.unit,point:[p.x,p.y],rect});
   }
   for(const [id,node] of nodes)if(!kept.has(id))node.style.display='none';
   audit={candidates:candidates.length,shown,visible:shown.length,entries:entries.length,zoom:map.getZoom(),rule:entries.some(e=>Number.isInteger(e.priority))?'interior-fit + obstacle/collision prevention; most recent selection first, independent of values/area':'interior-fit + obstacle/collision prevention; world-cell round robin and stable id hash, independent of values/area'};
  }
  map.on('zoom moveend zoomend resize',schedule);
  map.once('unload',()=>{disposed=true;cancelAnimationFrame(frame);map.off('zoom moveend zoomend resize',schedule);root.remove();});
  return {set(next){for(const e of entries)if(e.marker&&!next.some(n=>n.marker===e.marker))e.marker.getElement()?.style.setProperty("display","none","important");entries=next;const ids=new Set(next.map(e=>e.id));for(const [id,node] of nodes)if(!ids.has(id)){node.remove();nodes.delete(id);}schedule();},schedule,audit:()=>audit,entries:()=>entries};
 }
 window.ACU_R72={format,animate,labels:mount,interiorAnchor:anchor,escape:esc};
})();
