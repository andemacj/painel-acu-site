/* Display-only clipping. Source features, indicators and statistical scope stay intact. */
(()=>{'use strict';
 const polys=g=>g?.type==='Polygon'?[g.coordinates]:g?.type==='MultiPolygon'?g.coordinates:[];
 function pointInside(g,p){return polys(g).some(rings=>{let yes=false;for(const ring of rings)for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[i],b=ring[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;});}
 function configure(map,city,id,enabled){map._r73Clip=enabled?window['ACU_R73_CLIPS_'+city]?.[id]||null:null;}
 function feature(map,f,id,scale='native'){
  const scope=map._r73Clip?.units[scale];if(!scope)return f;
  if(!scope.ids.includes(id))return null;
  const geometry=scope.derived[id];return geometry?{...f,geometry,properties:{...f.properties,governed_label_anchor:null}}:f;
 }
 function guard(layer,map){const original=layer._containsPoint;if(!original)return;layer._containsPoint=function(p){const g=map._r73Clip?.mask,ll=map.layerPointToLatLng(p);return (!g||pointInside(g,[ll.lng,ll.lat]))&&original.call(this,p);};}
 const Renderer=R71PatternCanvas.extend({
  _draw(){
   const g=this._map?._r73Clip?.mask;this._r73Path=null;
   if(g){const path=new Path2D();for(const poly of polys(g))for(const ring of poly){ring.forEach((c,i)=>{const p=this._map.latLngToLayerPoint([c[1],c[0]]);i?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y);});path.closePath();}this._r73Path=path;}
   return R71PatternCanvas.prototype._draw.call(this);
  },
  _fillStroke(ctx,layer){if(!this._r73Path)return R71PatternCanvas.prototype._fillStroke.call(this,ctx,layer);ctx.save();ctx.clip(this._r73Path,'evenodd');R71PatternCanvas.prototype._fillStroke.call(this,ctx,layer);ctx.restore();}
 });
 const notice=(map,scale)=>map._r73Clip?'Recorte visual; valores '+(scale==='ap'?'das APs inteiras':scale==='setor'?'dos setores inteiros':'das unidades inteiras')+'.':'';
 window.ACU_R73_DISPLAY={configure,feature,guard,Renderer,pointInside,notice,area:map=>map._r73Clip?[{type:'Feature',properties:{},geometry:map._r73Clip.mask}]:null};
})();
