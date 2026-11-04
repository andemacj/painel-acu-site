/* R93: responsive thematic labels on the existing map layers. */
(()=>{'use strict';
 const {format,escape:esc}=window.ACU_R72;
 function inside(p,rings){
  let yes=false;for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
   const a=ring[i],b=ring[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;
  }return yes;
 }
 function polygons(feature){const g=feature?.geometry;return g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];}
 function anchor(map,entry,w,h,gap=4){
  const size=map.getSize(),layer=entry.layer,b=layer.getBounds(),nw=map.latLngToContainerPoint(b.getNorthWest()),se=map.latLngToContainerPoint(b.getSouthEast());
  if(se.x<0||nw.x>size.x||se.y<0||nw.y>size.y||se.x-nw.x<w+gap||se.y-nw.y<h+gap)return null;
  const pad=gap/2;
  const polys=polygons(entry.feature).map(poly=>poly.map(r=>r.map(c=>map.latLngToContainerPoint([c[1],c[0]]))));
  const fits=(p,rings)=>[-.5,0,.5].every(x=>[-.5,0,.5].every(y=>inside({x:p.x+x*(w+gap),y:p.y+y*(h+gap)},rings)));
  const candidates=[],gov=entry.feature.properties?.governed_label_anchor;
  if(gov?.inside_polygon)candidates.push(map.latLngToContainerPoint([gov.latitude,gov.longitude]));
  if(entry.marker)candidates.push(map.latLngToContainerPoint(entry.marker.getLatLng()));
  candidates.push({x:(Math.max(0,nw.x)+Math.min(size.x,se.x))/2,y:(Math.max(0,nw.y)+Math.min(size.y,se.y))/2});
  for(const rings of polys){
   const xs=rings[0].map(p=>p.x),ys=rings[0].map(p=>p.y),left=Math.max(w/2+pad,Math.min(...xs)),right=Math.min(size.x-w/2-pad,Math.max(...xs)),top=Math.max(h/2+pad,Math.min(...ys)),bottom=Math.min(size.y-h/2-pad,Math.max(...ys));
   if(right<left||bottom<top)continue;
   for(const p of candidates)if(p.x>=left&&p.x<=right&&p.y>=top&&p.y<=bottom&&fits(p,rings))return p;
   // Screen-space scanlines find interior runs, respecting holes. No geometry changes.
   for(const frac of [.5,.25,.75,.125,.375,.625,.875]){
    const y=top+(bottom-top)*frac,intersections=[];
    for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a.y>y)!==(b.y>y))intersections.push(a.x+(y-a.y)*(b.x-a.x)/(b.y-a.y));}
    intersections.sort((a,b)=>a-b);
    for(let i=0;i+1<intersections.length;i+=2){
     const lo=Math.max(left,intersections[i]+w/2+pad),hi=Math.min(right,intersections[i+1]-w/2-pad);if(lo>hi)continue;
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
  const leaderLayer=document.createElementNS('http://www.w3.org/2000/svg','svg');
  leaderLayer.setAttribute('class','r72-label-leaders');leaderLayer.setAttribute('aria-hidden','true');root.append(leaderLayer);
  function schedule(){if(!frame&&!disposed)frame=requestAnimationFrame(layout);}
  function obstacles(){
   const r=map.getContainer().getBoundingClientRect();
   return [...map.getContainer().querySelectorAll('.leaflet-control,.r71r1-base-status,.r72-update-status:not([hidden]),.leaflet-marker-icon:not(.acu-map-label),.acu-quick-card-overlay:not([hidden])'),...document.querySelectorAll('.r71-map-tools,#map-legend:not([hidden])')].filter(e=>e.getBoundingClientRect().width>0&&getComputedStyle(e).display!=='none').map(e=>{const b=e.getBoundingClientRect();return {left:b.left-r.left-4,right:b.right-r.left+4,top:b.top-r.top-4,bottom:b.bottom-r.top+4};});
  }
  function layout(){
   frame=0;if(disposed||!map._loaded)return;
   const size=map.getSize(),zoom=map.getZoom(),blocked=obstacles(),candidates=[],unplaced=[],shown=[];
   const selection=map._r82Selection||{},priorityIds=selection.priorityIds||new Set();
   const labelPriority=e=>e.id===selection.id?3:priorityIds.has(e.id)?2:Number.isInteger(e.priority)&&e.priority>=0?1:0;
   const priorityOrder=(a,b)=>labelPriority(b)-labelPriority(a)||(b.priority??-1)-(a.priority??-1);
   const maxLabels=size.x<600?6:14,font=Math.round(Math.min(13,Math.max(10.5,10.5+(zoom-9)*.42))*4)/4,line=Math.ceil(font*1.25);
   const widths=new Map();
   function measure(value,weight){
    const key=weight+':'+value;if(!widths.has(key)){ctx.font=weight+' '+font+'px system-ui';widths.set(key,ctx.measureText(value).width);}
    return widths.get(key);
   }
   function box(e,name,value){
    return {e,name,value,w:Math.ceil(Math.max(measure(value,650),name?measure(name,600):0))+6,h:name?line*2:line,
     html:(name?'<span class="r72-name">'+esc(name)+'</span>':'')+'<b class="r72-number">'+esc(value)+'</b>'};
   }
   for(const e of entries){
    const missing=!e.available||e.value==null,value=missing?ACU_R72R1.missing(e.status):format(e.value,e),name=String(e.name||'');
    const full=box(e,name,value),compact=name?box(e,'',value):full;
    const fullPoint=anchor(map,e,full.w,full.h);
    const compactPoint=name&&!fullPoint?anchor(map,e,compact.w,compact.h):null;
    const p=fullPoint||compactPoint;
    if(!p){if(!missing)unplaced.push(full);continue;}
    const world=map.project(map.containerPointToLatLng(p)),cell=Math.floor(world.x/100)+':'+Math.floor(world.y/70);
    candidates.push({...fullPoint?full:compact,p,cell,rank:hash(e.id)});
   }
   // Stable spatial distribution; neither value nor polygon size changes priority.
   const cells=new Map();for(const c of candidates){if(!cells.has(c.cell))cells.set(c.cell,[]);cells.get(c.cell).push(c);}
   const buckets=[...cells].sort((a,b)=>hash(a[0])-hash(b[0])).map(([,xs])=>xs.sort((a,b)=>a.rank-b.rank)),ordered=[];
   for(let i=0;buckets.some(b=>b.length>i);i++)for(const b of buckets)if(b[i])ordered.push(b[i]);
   ordered.sort((a,b)=>priorityOrder(a.e,b.e));
   const accepted=[],kept=new Set(),leaders=[];
   const fits=rect=>rect.left>=0&&rect.right<=size.x&&rect.top>=0&&rect.bottom<=size.y&&
    !blocked.some(b=>overlap(rect,b))&&!accepted.some(b=>overlap(rect,b));
   function place(c,p,origin=p){
    if(kept.has(c.e.id))return false;
    const {e,w,h}=c,rect={left:p.x-w/2-3,right:p.x+w/2+3,top:p.y-h/2-2,bottom:p.y+h/2+2};
    if(!fits(rect))return false;
    let node;
    const callout=p!==origin;
    if(e.marker){
     node=e.marker.getElement();if(!node)return false;
     e.marker.setLatLng(map.containerPointToLatLng(origin));
     node.style.setProperty('display','block','important');
     node.classList.add('r72-native-label');
     node.innerHTML='<div class="r72-label-content">'+c.html+'</div>';
     node=node.firstElementChild;
     node.style.setProperty('--r72-shift-x',(p.x-origin.x)+'px');
     node.style.setProperty('--r72-shift-y',(p.y-origin.y)+'px');
    }else{
     node=nodes.get(e.id);if(!node){node=L.DomUtil.create('div','r72-value-label',root);nodes.set(e.id,node);}
     node.innerHTML=c.html;node.style.display='block';L.DomUtil.setPosition(node,map.containerPointToLayerPoint(p));
     node.style.marginLeft=(-w/2)+'px';node.style.marginTop=(-h/2)+'px';
    }
    node.style.setProperty('--r72-font',font+'px');node.style.setProperty('--r72-line',line+'px');
    node.dataset.unitId=e.id;node.dataset.value=String(e.value);node.dataset.indicator=e.indicator||'';node.dataset.measure=e.unit||'';
    node.dataset.labelMode=callout?'callout':c.name?'full':'compact';
    node.title=(e.name?e.name+' · ':'')+c.value+(e.unit?' · '+e.unit:'');node.style.width=w+'px';
    kept.add(e.id);accepted.push(rect);
    shown.push({id:e.id,name:e.name,status:e.status,available:e.available,value:e.value,text:c.value,indicator:e.indicator,unit:e.unit,point:[origin.x,origin.y],rect,font,mode:node.dataset.labelMode});
    return true;
   }
   function placeInterior(c){return place(c,c.p);}
   function placeCallout(c){
    const origin=anchor(map,c.e,0,0,0);if(!origin)return false;
    const x=origin.x,y=origin.y,w=c.w/2,h=c.h/2;
    for(const [dx,dy] of [[0,-h-12],[0,h+12],[w+12,0],[-w-12,0],[w+10,-h-10],[-w-10,h+10]]){
     const p={x:x+dx,y:y+dy},end={x:p.x-Math.sign(dx)*Math.min(Math.abs(dx),w),y:p.y-Math.sign(dy)*Math.min(Math.abs(dy),h)};
     const trace={left:Math.min(x,end.x)-2,right:Math.max(x,end.x)+2,top:Math.min(y,end.y)-2,bottom:Math.max(y,end.y)+2};
     if(!fits(trace)||!place(c,p,origin))continue;
     leaders.push({x,y,end});accepted.push(trace);return true;
    }
    return false;
   }
   // Reserve room for the selected geography and program priorities in the overview.
   for(const c of ordered)if(labelPriority(c.e)>=2&&kept.size<maxLabels)placeInterior(c);
   const calloutBudget=size.x<600?2:3;
   const priorityCallouts=unplaced.filter(c=>labelPriority(c.e)>=2).sort((a,b)=>priorityOrder(a.e,b.e)||hash(a.e.id)-hash(b.e.id));
   for(const c of priorityCallouts)if(zoom<13&&leaders.length<calloutBudget&&kept.size<maxLabels)placeCallout(c);
   for(const c of ordered){if(kept.size>=maxLabels)break;placeInterior(c);}
   if(!shown.length||!shown.some(c=>c.available)){
    // Very small sectors can all fail interior fitting; anchor only a few to their own polygons.
    const fallback=unplaced.concat(ordered.filter(c=>c.e.available&&!kept.has(c.e.id)).map(c=>box(c.e,String(c.e.name||""),c.value)))
     .sort((a,b)=>priorityOrder(a.e,b.e)||hash(a.e.id)-hash(b.e.id));
    for(const c of fallback.slice(0,48))if(leaders.length<calloutBudget&&kept.size<maxLabels)placeCallout(c);
   }
   for(const e of entries)if(e.marker&&!kept.has(e.id))e.marker.getElement()?.style.setProperty('display','none','important');
   for(const [id,node] of nodes)if(!kept.has(id))node.style.display='none';
   L.DomUtil.setPosition(leaderLayer,map.containerPointToLayerPoint([0,0]));
   leaderLayer.setAttribute('width',size.x);leaderLayer.setAttribute('height',size.y);
   leaderLayer.innerHTML=leaders.map(({x,y,end})=>'<path d="M'+x+' '+y+' L'+end.x+' '+end.y+'"/><circle cx="'+x+'" cy="'+y+'" r="2.4"/>').join('');
   audit={candidates:candidates.length,shown,visible:shown.length,entries:entries.length,zoom,rule:'adaptive interior fit and limited anchored callouts; stable spatial distribution independent of values/area'};
  }
  map.on('move zoom moveend zoomend resize',schedule);
  map.once('unload',()=>{disposed=true;cancelAnimationFrame(frame);map.off('move zoom moveend zoomend resize',schedule);root.remove();});
  return {set(next){for(const e of entries)if(e.marker&&!next.some(n=>n.marker===e.marker))e.marker.getElement()?.style.setProperty("display","none","important");entries=next;const ids=new Set(next.map(e=>e.id));for(const [id,node] of nodes)if(!ids.has(id)){node.remove();nodes.delete(id);}schedule();},schedule,audit:()=>audit,entries:()=>entries};
 }
 window.ACU_R72.labels=mount;
})();
