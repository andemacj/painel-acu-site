/* Shared visual contract. No observations, denominators or source geometry are changed. */
(()=>{'use strict';
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const valid=x=>(typeof x==='number'||typeof x==='string'&&x.trim()!=='')&&Number.isFinite(Number(x));
 const levels={IBGE_DISTRICT:['distrito','distritos'],OPERATIONAL_NEIGHBORHOOD:['bairro','bairros'],MANAUS_NEIGHBORHOOD:['bairro','bairros'],CENSO2022_NEIGHBORHOOD:['bairro','bairros'],INCID_PLANNING_UNIT:['UP','UPs'],SP_DISTRICT:['distrito','distritos'],SP_SUBPREFECTURE:['subprefeitura','subprefeituras'],RJ_ADMINISTRATIVE_REGION:['RA','RAs'],RJ_NEIGHBORHOOD:['bairro','bairros'],RJ_PLANNING_AREA:['área','áreas'],setor:['setor','setores'],ap:['AP','APs']};
 const direction=p=>/HIGHER_IS_WORSE|DEPRIVATION|PRIVA/i.test(p?.semantic_direction||p?.direction||'')?'deprivation':/HIGHER_IS_BETTER|COVERAGE|FAVORABLE/i.test(p?.semantic_direction||p?.direction||'')?'coverage':'descriptive';
 const palette=p=>(direction(p)==='deprivation'?ACU_R75.palettes.red:ACU_R75.palettes.blue).slice();
 const interpretation=p=>direction(p)==='deprivation'?'Mais escuro = maior privação':direction(p)==='coverage'?'Mais escuro = maior cobertura':'Mais escuro = maior valor';
 function readableThresholds(cuts,values){
  const bucket=(v,ts)=>ts.filter(t=>v>t).length;
  for(let digits=cuts.every(Number.isInteger)?0:2;digits<=15;digits++){
   const factor=10**digits,next=cuts.map(v=>Math.ceil((v-Number.EPSILON*Math.max(1,Math.abs(v)))*factor)/factor);
   if(next.every(Number.isFinite)&&new Set(next).size===next.length&&values.every(v=>bucket(v,cuts)===bucket(v,next)))return next;
  }return cuts;
 }
 function missingKind(cell){const s=String(cell?.nd_reason||cell?.status||cell||'');return /suppressed_or_missing|missing_or_suppressed|absent.*suppres/i.test(s)?'unknown':/SUPPR|SUPRIM/i.test(s)?'suppressed':/NOT_APPLICABLE|UNIVERSE_NOT_APPLICABLE/i.test(s)?'notApplicable':'missing';}
 function formatter(values,unit){
  const sorted=[...new Set(values.filter(valid).map(Number))].sort((a,b)=>a-b);let digits=sorted.every(Number.isInteger)?0:2;
  const formats=new Map(),fmt=d=>{if(!formats.has(d))formats.set(d,new Intl.NumberFormat('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:0}));return formats.get(d);};
  while(digits<20&&(new Set(sorted.map(v=>fmt(digits).format(v))).size<sorted.length||sorted.some(v=>Number(fmt(digits).format(v).replaceAll('.','').replace(',','.'))!==v)))digits++;
  return value=>{if(!valid(value))return 'N/D';const v=Number(value),s=fmt(digits).format(v),parsed=Number(s.replaceAll('.','').replace(',','.'));return (v!==0&&parsed===0?new Intl.NumberFormat('pt-BR',{notation:'scientific',maximumSignificantDigits:17}).format(v):s)+(String(unit).includes('%')?'%':'');};
 }
 function scale({values=[],indicator='',title='',unit='',period='',geography='',profile={},fixedThresholds=null,universe='',source=''}){
  const numeric=values.filter(valid).map(Number).sort((a,b)=>a-b),unique=[...new Set(numeric)],base=palette(profile);
  let thresholds=[],colors=[],fixedReference=false,method='Grupos de valores distintos do universo disponível na cidade e escala; não são classes de qualidade';
  if(unique.length){
   if(fixedThresholds&&unique.length>=4){fixedReference=true;thresholds=[...new Set(fixedThresholds)].sort((a,b)=>a-b);method='Faixas visuais fixas da referência cartográfica governada, com limites internos a duas casas; não são limiares de risco';}
   else {const n=Math.min(5,unique.length);for(let i=1;i<n;i++)thresholds.push(unique[Math.ceil(i*unique.length/n)-1]);}
   colors=thresholds.length?Array.from({length:thresholds.length+1},(_,i)=>base[Math.round(i*(base.length-1)/thresholds.length)]):[base[2]];
  }
  const referenceThresholds=thresholds.slice();thresholds=fixedReference?thresholds.map(v=>Math.round(v*100)/100):readableThresholds(thresholds,unique);
  const format=formatter(thresholds.length?thresholds:unique,unit);
  const classes=colors.map((color,i)=>({index:i,color,min:i?thresholds[i-1]:unique[0],max:i<thresholds.length?thresholds[i]:unique.at(-1),lowerInclusive:i===0,upperInclusive:true,count:0,label:''}));
  for(const c of classes)c.label=unique.length===1?'Valor único: '+format(unique[0]):classes.length===1?'De '+format(unique[0])+' a '+format(unique.at(-1)):c.index===0?'Até '+format(c.max):c.index===classes.length-1?'Acima de '+format(c.min):'Acima de '+format(c.min)+' até '+format(c.max);
  const model={indicator,title,unit,period,geography,universe,source,method,direction:direction(profile),interpretation:interpretation(profile),domain:unique.length?[unique[0],unique.at(-1)]:null,thresholds,referenceThresholds,colors,classes,unique_values:unique.length,valid_units:numeric.length,format,reference:fixedReference?'fixed':'city-full-scale',missing:{missing:'#eef0f2',suppressed:'#e4e8eb',unknown:'#eef0f2',notApplicable:'#f7f8fa'}};
  for(const v of numeric)classes[classIndex(v,model)].count++;
  return model;
 }
 function classIndex(value,model){if(!valid(value)||!model?.classes?.length)return null;let i=0;while(i<model.thresholds.length&&Number(value)>model.thresholds[i])i++;return Math.min(i,model.classes.length-1);}
 const color=(value,model)=>{const i=classIndex(value,model);return i===null?'#eef0f2':model.classes[i].color;};
 function publicModel(m){return m?Object.fromEntries(Object.entries(m).filter(([k])=>k!=='format')):null;}
 function fitLegend(node,map){
  const summary=node?.querySelector('.r82-legend-shell>summary'),body=node?.querySelector('.r82-legend-body'),container=map?.getContainer?.();
  if(!summary||!body||!container?.isConnected||!container.clientHeight)return;
  const narrow=matchMedia('(max-width:760px)').matches,budget=narrow?container.clientHeight*.58-10:container.clientHeight-70;
  body.style.maxHeight=Math.max(0,Math.min(narrow?160:340,budget-summary.getBoundingClientRect().height-4))+'px';
 }
 function render(node,{model=null,selection=null,pointHtml='',onMethod=null,map=null,missingStates=[],priority=true,partial=false}={}){
  if(!node)return;
  const previous=node.querySelector('.r82-legend-shell'),expanded=previous?previous.open:!matchMedia('(max-width:760px)').matches;
  node.classList.add('r82-legend');node.classList.remove('r71-household-legend');node.hidden=!model&&!pointHtml;
  if(node.hidden){node.replaceChildren();return;}
  const title=model?.title||'Equipamentos e serviços',labels=levels[model?.geography]||['unidade','unidades'];
  const displayUnit=model?(String(model.unit).includes('%')?'%':/pessoas.*domic|moradores.*domic/i.test(model.unit)?'pessoas/domicílio':model.unit):'';
  const metadata=model?[displayUnit,model.period,labels[1]].filter(Boolean).join(' · '):'Símbolos das camadas escolhidas';
  const index=selection?.inScale?classIndex(selection.value,model):null;
  const rows=model?.classes.map(c=>`<li class="r82-class${c.index===index?' is-selected':''}" data-class-index="${c.index}" data-lower-inclusive="${c.lowerInclusive}" data-upper-inclusive="true" data-min="${c.min}" data-max="${c.max}"${c.index===index?' aria-current="true"':''}><i style="background:${c.color}" aria-hidden="true"></i><span>${esc(c.label)}</span><small>${c.count.toLocaleString('pt-BR')} ${esc(c.count===1?labels[0]:labels[1])}</small></li>`).join('')||'';
  const states=[...new Set(missingStates)],stateLabels={missing:'Sem informação',suppressed:'Suprimido pela fonte',unknown:'Ausente ou suprimido — motivo não distinguido na fonte',notApplicable:'Não aplicável'};
  const absent=states.map(kind=>`<span class="r82-key"><i class="r82-pattern-${kind}" aria-hidden="true"></i>${esc(stateLabels[kind]||stateLabels.missing)}</span>`).join('');
  const selected=selection?`<p class="r82-selected"><b>${esc(selection.name)}</b>${model&&(selection.inScale||valid(selection.value))?' · '+esc(valid(selection.value)?model.format(selection.value)+(String(model.unit).includes('%')?'':' '+displayUnit):stateLabels[selection.status]||'N/D'):''}${model&&!selection.inScale&&valid(selection.value)?'<small>Recorte selecionado; as faixas representam '+esc(labels[1])+'.</small>':''}</p>`:'';
  node.innerHTML=`<details class="r82-legend-shell"${expanded?' open':''}><summary aria-label="${esc(title)}; expandir ou recolher as faixas"><strong>${esc(title)}</strong><span class="r82-meta">${esc(metadata)}</span>${model?`<span class="r82-reading">${esc(model.interpretation)}</span>`:''}<span class="r82-expand-hint">Faixas e símbolos <span aria-hidden="true">⌄</span></span></summary><div class="r82-legend-body" tabindex="0" aria-label="Faixas, seleção e símbolos do mapa">${partial?'<p class="r82-partial">Período parcial</p>':''}${model?.classes.length?`<ol class="r82-classes" aria-label="Faixas do indicador">${rows}</ol>`:model?'<p>Sem valores compatíveis para preencher o mapa.</p>':''}${selected}<div class="r82-keys">${absent}${priority?'<span class="r82-key"><i class="r82-priority-key"></i>Território prioritário ACU</span>':''}<span class="r82-key"><i class="r82-selection-key"></i>Seleção</span></div>${pointHtml?'<div class="r82-point-keys">'+pointHtml+'</div>':''}${model?`<footer><span class="r82-source">Fonte: ${esc(model.source||'ver metodologia')}</span><details class="r82-method"><summary>Como ler esta escala</summary><p>${esc(model.method)}. O limite superior pertence à classe; a classe seguinte começa acima dele. As faixas não mudam ao mover ou ampliar o mapa.</p>${model.unique_values===1?'<p>Todos os valores válidos são iguais.</p>':''}<p>Zero é um valor válido. As contagens junto às faixas representam unidades territoriais, não população ou área.</p>${displayUnit!==model.unit?'<p>Unidade completa: '+esc(model.unit)+'</p>':''}${model.universe?'<p>'+esc(model.universe)+'</p>':''}<button type="button" data-r82-method>Fonte e metodologia do indicador</button></details></footer>`:''}</div></details>`;
  node.querySelector('[data-r82-method]')?.addEventListener('click',()=>onMethod?.());
  const shell=node.querySelector('.r82-legend-shell'),tools=document.querySelector('.r71-map-tools');
  shell?.addEventListener('toggle',()=>{if(shell.open&&matchMedia('(max-width:760px)').matches&&tools)tools.open=false;fitLegend(node,map);map?.r72Labels?.schedule();});
  if(tools&&!tools._r82LegendToggle){tools._r82LegendToggle=true;tools.addEventListener('toggle',()=>{if(tools.open&&matchMedia('(max-width:760px)').matches){const s=document.querySelector('.r82-legend-shell');if(s)s.open=false;}});}
  if(map&&!map._r82CompactListener){const mq=matchMedia('(max-width:760px)'),compact=()=>{if(mq.matches&&document.querySelector('.r71-map-tools')?.open){const s=document.querySelector('.r82-legend-shell');if(s)s.open=false;}fitLegend(document.querySelector('#map-legend'),map);};mq.addEventListener('change',compact);map.on('resize',compact);map.once('unload',()=>mq.removeEventListener('change',compact));map._r82CompactListener=compact;}
  fitLegend(node,map);
  if(map){L.DomEvent.disableClickPropagation(node);L.DomEvent.disableScrollPropagation(node);map._r82Legend={model:publicModel(model),selection,missingStates:states};map.r72Labels?.schedule();}
 }
 window.ACU_R82={scale,classIndex,color,render,publicModel,palette,direction,interpretation,missingKind,valid,escape:esc,levels};
})();
