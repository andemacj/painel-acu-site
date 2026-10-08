globalThis.R68Core=(()=>{
 const finite=x=>typeof x==='number'&&Number.isFinite(x);
 const fmt=(x,n=2)=>ACU_R75.number(x,n);
 function modes(theme){return theme==='residents'?['value','diff','relative','large_value','large_count']:['value','count','diff','relative'];}
 function resolve(state){return {metric:state.reading.startsWith('large_')?'large':state.theme,mode:state.reading.startsWith('large_')?state.reading.slice(6):state.reading};}
 function transition(old,patch){
  const s={...old,...patch};if(s.theme==='joint')s.scale='ap';
  if(!modes(s.theme).includes(s.reading))s.reading='value';
  if(!['setor','ap'].includes(s.scale)||!['urban','belem','daico'].includes(s.frame))throw Error('Estado inválido');
  return s;
 }
 function config(data,state){const r=resolve(state);return data.views[state.scale][r.metric][r.mode];}
 function measure(data,state,unit){const r=resolve(state),m=unit.metrics[r.metric],cfg=config(data,state);return {value:m[cfg.field],status:r.mode==='count'?m.quantity_status:m.status,metric:m};}
 function color(data,cfg,value){
  if(!finite(value))return '#c6cbd1';
  const p=data.palettes[cfg.palette],t=Math.max(0,Math.min(1,(value-cfg.domain[0])/(cfg.domain[1]-cfg.domain[0])));
  return p[Math.round(t*(p.length-1))];
 }
 function digits(state){
  const r=resolve(state);return r.mode==='count'?(state.scale==='setor'?0:2):r.mode==='relative'?1:r.metric==='residents'&&r.mode==='value'?(state.scale==='setor'?1:2):r.metric==='bathroom'?3:2;
 }
 function count(x){return typeof x==='string'&&/^\d+$/.test(x)?Number(x):null;}
 function category(raw,def){
  const a=def.components.map(k=>raw[k]),den=count(raw[def.denominator]);
  const status=a.includes('X')?'suppression':a.some(x=>x===undefined||x===null||x==='')?'no_observation':a.some(x=>count(x)===null)?'processing_problem':'published';
  const num=status==='published'?a.reduce((s,x)=>s+count(x),0):null;
  const ps=status!=='published'?status:raw[def.denominator]==='X'?'suppression':den===null?'no_observation':den===0?'denominator_zero':'published';
  return {num,quantity:num,quantity_status:status,den,value:ps==='published'?100*num/den:null,status:ps};
 }
 return {finite,fmt,modes,resolve,transition,config,measure,color,digits,category};
})();
