/* Official Census 2022 FCU layer and diagnostic context. Local assets only. */
(()=>{'use strict';
 const D=window.ACU_R96_FCU_DATA,E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const finite=x=>typeof x==='number'&&Number.isFinite(x),N=(x,d=0)=>finite(x)?x.toLocaleString('pt-BR',{maximumFractionDigits:d}):'—';
 const fold=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const THEME='FCU_2022',INDICATOR='fcu:population_n';
 const BANDS=Object.freeze([
  {upper:500,label:'Até 500',color:'#fee5d9'},
  {upper:1000,label:'501 a 1.000',color:'#fcbba1'},
  {upper:2000,label:'1.001 a 2.000',color:'#fc9272'},
  {upper:5000,label:'2.001 a 5.000',color:'#fb6a4a'},
  {upper:10000,label:'5.001 a 10.000',color:'#de2d26'},
  {upper:null,label:'Acima de 10.000',color:'#a50f15'}
 ]);
 const cache=new Map(),pending=new Map();let state=null,bridge=null,map=null,layer=null,renderer=null,toolbar=null,enabled=false,request=0,loadedCity=null,loadedKey=null,shown=[],mapError=false,directory={city:null,query:'',scope:'selection',page:0};
 const thematic=()=>state?.theme===THEME;
 const mapKey=()=>state?.cityId+'|'+state?.geographyId;
 const bandIndex=value=>finite(value)&&value>=0?BANDS.findIndex(b=>b.upper===null||value<=b.upper):-1;
 const get=city=>D.cities[city],fields=['municipality','state','region','brazil'];
 function rows(city){const c=get(city);return D.catalog.map(i=>({...i,key:'fcu96|'+i.id,indicator_id:'fcu96_'+i.id,metric:i.id,family:'fcu96',period:'2022',year:2022,universe:i.id==='community_n'?'Favelas e comunidades urbanas com resultados publicados':i.group==='housing'?'Domicílios particulares permanentes ocupados em FCU':i.group==='literacy'?'Pessoas de 15 anos ou mais residentes em FCU':i.id==='population_pct'?'População residente total do recorte':'Moradores de favelas e comunidades urbanas',values:Object.fromEntries(fields.map(s=>[s,c.scopes[s].metrics[i.id]])),evidence:Object.fromEntries(fields.map(s=>[s,{geography_code:c.scopes[s].code,geography_level:c.scopes[s].level,denominator:c.scopes[s].denominators[i.id]??null,lineage_id:'IBGE_CD2022_FCU:'+c.scopes[s].level+':'+c.scopes[s].code+':'+i.id}])),definition:i.definition,limitation:'Resultados do universo do Censo 2022. Cada coluna conserva o seu recorte; os dados municipais não são atribuídos ao território ACU selecionado. Não há série temporal nesta integração. A classificação FCU não determina a condição de pobreza de cada morador.',source_short:'IBGE · Censo 2022',denominator:i.unit==='%'?'Contagem oficial do mesmo recorte em 2022; valores por geografia no detalhe.':null}));}
 function evidence(r,city){const c=get(city);return '<h4>Resultado censitário · 2022</h4><div class="r85-table-scroll"><table class="r85-history"><thead><tr><th scope="col">Recorte</th><th scope="col">'+(r.unit==='%'?'Percentual':'Quantidade')+'</th><th scope="col">Denominador do percentual</th></tr></thead><tbody>'+fields.map(s=>'<tr><th scope="row">'+E(c.labels[s])+'</th><td>'+N(r.values[s],r.unit==='%'?1:0)+(r.unit==='%'&&finite(r.values[s])?'%':'')+'</td><td>'+N(r.evidence[s].denominator)+'</td></tr>').join('')+'</tbody></table></div><p>Contagens censitárias e percentuais calculados a partir de contagens compatíveis. CV e intervalo de confiança amostral não se aplicam a este produto. Ausências são preservadas; não há imputação realizada pelo painel.</p>';}
 function exportRows(r,city){const c=get(city);return fields.map(s=>({city:c.name,geography_id:c.scopes[s].code,geography:c.labels[s],geographic_level:({1:'BRAZIL',2:'REGION',3:'UF',6:'MUNICIPALITY'})[c.scopes[s].level],indicator_id:r.indicator_id,indicator:r.label,selected_measure:r.unit==='%'?'percentage':'census_count',selected_value:r.values[s],count:r.unit==='%'?null:r.values[s],percentage:r.unit==='%'?r.values[s]:null,denominator:r.evidence[s].denominator,unit:r.unit,period:'2022',definition:r.definition,universe:r.universe,availability:finite(r.values[s])?'AVAILABLE':'SOURCE_NOT_AVAILABLE',precision:'Resultados do universo censitário; sem CV amostral',source_ids:r.source_ids.join('; '),lineage_id:r.evidence[s].lineage_id,source:r.source_ids.map(id=>D.sources.find(x=>x.source_id===id)?.official_url||'').join('; ')}));}
 function links(city){const c=get(city);return '<p class="r96-source">IBGE · Censo 2022 · <a href="https://www.ibge.gov.br/geociencias/organizacao-do-territorio/tipologias-do-territorio/15788-favelas-e-comunidades-urbanas.html" target="_blank" rel="noopener noreferrer">Fonte e conceito</a> · '+E(c.name)+'</p>';}
 function relationInfo(city,gid){const c=get(city),hits=c.relations[gid];return hits?{available:true,hits,census:hits.filter(x=>x.coverage==='CENSUS'),reference:hits.filter(x=>x.coverage==='REFERENCE_ONLY')}:{available:false,hits:[]};}
 function geographyNote(city,gid,name){const rel=relationInfo(city,gid);if(!rel.available)return 'Os comparativos abaixo descrevem a capital e os demais recortes oficiais.';return N(rel.census.length)+' comunidades com resultados censitários intersectam '+E(name)+'. '+N(rel.reference.length)+' áreas de referência adicionais estão mapeadas sem estatística própria. A interseção dos limites não informa quantos moradores estão dentro do trecho.';}
 function narrative(city){const c=get(city),m=c.scopes.municipality.metrics,r=c.scopes.region.metrics,b=c.scopes.brazil.metrics,diff=m.population_pct-r.population_pct;
  return 'Em '+E(c.name)+', <strong>'+N(m.population_n)+' pessoas</strong> residiam em favelas e comunidades urbanas em 2022: <strong>'+N(m.population_pct,1)+'%</strong> da população municipal, frente a '+N(r.population_pct,1)+'% na '+E(c.labels.region)+' e '+N(b.population_pct,1)+'% no Brasil. A diferença em relação à região é de '+N(Math.abs(diff),1)+' p.p. '+(diff>=0?'a mais':'a menos')+'. Entre os moradores dessas comunidades, '+N(m.age_0_19_n)+' tinham 0–19 anos ('+N(m.age_0_19_pct,1)+'%).';
 }
 function section(o,group){const c=get(o.cfg.city),col=fields.map(s=>[s,c.labels[s]]),r=o.fcu96;
  const bars=fields.map(s=>{const v=c.scopes[s].metrics.population_pct;return '<div class="r96-bar-row"><span>'+E(c.labels[s])+'</span><div class="r96-track" aria-hidden="true"><i style="width:'+Math.max(0,Math.min(100,v||0))+'%"></i></div><strong>'+N(v,1)+'%</strong></div>';}).join('');
  return '<details class="r85-group r96-fcu-section" data-r96-section><summary>Favelas e comunidades urbanas · Censo 2022<span>Perfil e mapa</span></summary><div class="r96-context"><p class="r96-kicker">Contexto da capital · referência 2022</p><p>'+narrative(o.cfg.city)+'</p><div class="r96-comparisons" aria-label="População residente em comunidades, em percentual do total de cada recorte">'+bars+'</div><p class="r85-note">'+geographyNote(o.cfg.city,o.cfg.geography.id,o.cfg.geographyName)+'</p><div class="r96-actions"><button type="button" class="r85-quiet" data-r96-directory>Explorar comunidades</button><button type="button" class="r85-quiet" data-r96-show-map>Ver camada no mapa →</button></div></div>'+['population','housing','literacy'].map(g=>group(({population:'População e faixas etárias',housing:'Água, esgoto e lixo',literacy:'Alfabetização · 15 anos ou mais'})[g],r.filter(x=>x.group===g),col)).join('')+'<p class="r85-note r96-context">As faixas etárias se sobrepõem. Os dados das comunidades não descrevem automaticamente todas as pessoas do território da Agenda. As áreas não setorizadas permanecem fora dos totais estatísticos acima.</p></details>';
 }
 function augment(o,id,result,expanded,claim){if(!expanded||!['overview','territory'].includes(id))return result;const c=get(o.cfg.city),find=k=>o.fcu96.find(r=>r.metric===k),m=find('population_pct'),a=find('age_0_19_n');if(!m||!a)return result;
  const html='<p>No município de '+E(c.name)+', '+claim(o,find('population_n'),'municipality')+' pessoas viviam em favelas e comunidades urbanas no Censo 2022: '+claim(o,m,'municipality')+' da população, frente a '+claim(o,m,'region')+' na '+E(c.labels.region)+' e '+claim(o,m,'brazil')+' no Brasil. Nessas comunidades da capital, '+claim(o,a,'municipality')+' moradores tinham 0–19 anos. Essa contextualização municipal não estima a população em comunidades dentro de '+E(o.cfg.geographyName)+'.</p>';
  return {...result,html:result.html+html,claims:[...o.used]};
 }
 async function load(city){if(cache.has(city))return cache.get(city);if(!pending.has(city)){pending.set(city,fetch(get(city).asset).then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(d=>{if(d.type!=='FeatureCollection'||!Array.isArray(d.features))throw new Error('Formato inválido');cache.set(city,d);pending.delete(city);return d;}).catch(e=>{pending.delete(city);throw e;}));}return pending.get(city);}
 function rowProfile(label,count,pct){return '<tr><th scope="row">'+E(label)+'</th><td>'+N(count)+'</td><td>'+N(pct,1)+(finite(pct)?'%':'')+'</td></tr>';}
 function profile(feature,back=false){const p=feature.properties,m=p.metrics,modal=document.querySelector('#detail-dialog'),title=document.querySelector('#detail-title'),content=document.querySelector('#detail-content');if(!modal||!content)return;
  title.textContent=p.name;const pc=(n,d)=>finite(n)&&finite(d)&&d>0?100*n/d:null;
  let body='<p class="r96-kicker">Comunidade inteira · Censo 2022</p>';
  if(m){if(m.dwellings_n===0)body+='<p class="r85-note">A fonte registra zero domicílios particulares permanentes ocupados. Os indicadores domiciliares sem resultado não se aplicam a esse universo; a população residente pode incluir outras espécies de domicílio.</p>';if(p.suppressed_sources?.length)body+='<p class="r85-note">O IBGE suprimiu contagens de água e/ou lixo nesta comunidade para preservar o sigilo. Os traços correspondentes permanecem sem valor.</p>';body+='<div class="r96-profile-lead"><strong>'+N(m.population_n)+'</strong><span>moradores</span></div><div class="r85-table-scroll"><table class="r85-table r96-profile-table"><thead><tr><th scope="col">Indicador</th><th scope="col">Quantidade</th><th scope="col">Participação</th></tr></thead><tbody>'+rowProfile('Pessoas de 0–19 anos',m.age_0_19_n,m.age_0_19_pct)+rowProfile('Pessoas de 10–14 anos',m.age_10_14_n,pc(m.age_10_14_n,m.population_n))+rowProfile('Pessoas de 15–19 anos',m.age_15_19_n,pc(m.age_15_19_n,m.population_n))+rowProfile('Pessoas de 10–19 anos',m.age_10_19_n,pc(m.age_10_19_n,m.population_n))+rowProfile('Domicílios particulares permanentes ocupados',m.dwellings_n,null)+rowProfile('Com ligação à rede de água',m.water_network_n,m.water_network_pct)+rowProfile('Esgoto por rede ou fossa ligada à rede',m.sewer_network_n,m.sewer_network_pct)+rowProfile('Com lixo coletado',m.waste_collected_n,m.waste_collected_pct)+rowProfile('Pessoas alfabetizadas de 15 anos ou mais',m.literate_15_plus_n,m.literate_15_plus_pct)+'</tbody></table></div><p class="r85-note">Idades: participação em todos os moradores da comunidade; as faixas se sobrepõem. Água, esgoto e lixo: participação nos '+N(m.dwellings_n)+' domicílios particulares permanentes ocupados. Alfabetização: participação nas '+N(p.denominators.literate_15_plus_pct)+' pessoas de 15 anos ou mais.</p><details class="r96-method"><summary>Definições e fontes deste perfil</summary>'+D.catalog.filter(i=>['water_network_n','sewer_network_n','waste_collected_n','literate_15_plus_n'].includes(i.id)).map(i=>'<p><strong>'+E(i.label)+':</strong> '+E(i.definition)+'</p>').join('')+'<p>'+D.sources.filter(s=>s.source_id!=='r96-municipal_population'&&s.source_id!=='r96-communities').map(s=>'<a href="'+E(s.official_url)+'" target="_blank" rel="noopener noreferrer">'+E(s.title)+'</a>').join(' · ')+'</p></details>';
  }else body+='<p>Área de referência mapeada pelo IBGE, sem setor censitário próprio e sem estatística específica nesta divulgação. Ausência de contagem não significa ausência de moradores.</p>';
  content.innerHTML='<article class="r96-profile" data-r96-profile="'+E(p.code)+'">'+(back?'<button type="button" class="r85-quiet" data-r96-back>← Voltar à lista</button>':'')+body+'<p class="r85-note">Os valores correspondem ao limite completo desta comunidade. Quando ele atravessa o território da Agenda, não se pode atribuir toda a população ao trecho interno.</p><p class="r96-source">Código IBGE '+E(p.code)+' · <a href="https://sidra.ibge.gov.br/tabela/9884" target="_blank" rel="noopener noreferrer">Consultar população na fonte</a></p></article>';
  content.querySelector('[data-r96-back]')?.addEventListener('click',()=>openDirectory(p.code));if(!modal.open)modal.showModal();title.tabIndex=-1;title.focus({preventScroll:true});content.scrollTop=0;modal.scrollTop=0;
 }
 async function openDirectory(returnCode=null){const city=state?.cityId||document.querySelector('.r85-assistant')?.dataset.r85City;if(!city)return;const selected=state?.geographyId||document.querySelector('.r85-assistant')?.dataset.r85Geography;
  if(directory.city!==city)directory={city,query:'',scope:'selection',page:0};
  const modal=document.querySelector('#detail-dialog'),title=document.querySelector('#detail-title'),content=document.querySelector('#detail-content');title.textContent='Favelas e comunidades urbanas · '+get(city).name;
  content.innerHTML='<p role="status">Carregando comunidades…</p>';if(!modal.open)modal.showModal();
  let data;try{data=await load(city);}catch(e){content.innerHTML='<p role="alert">Não foi possível carregar esta camada. <button type="button" data-r96-retry>Tentar novamente</button></p>';content.querySelector('button').onclick=()=>openDirectory();return;}
  if(state?.cityId!==city||!modal.open)return;
  const info=relationInfo(city,selected),municipal=state?.data?.geographies?.find(g=>g.id===selected)?.level==='MUNICIPALITY'||selected==='BELEM_CITY_CONTEXT';
  content.innerHTML='<section class="r96-directory"><p class="r85-note">Escolha uma comunidade para consultar seu perfil inteiro. Os cruzamentos com a seleção indicam apenas a relação entre os limites.</p><div class="r96-directory-tools"><label>Buscar comunidade<input type="search" data-r96-search placeholder="Nome da comunidade" value="'+E(directory.query)+'"></label><label>Área de consulta<select data-r96-scope><option value="selection">Seleção do painel</option><option value="city">Município inteiro</option></select></label></div><p data-r96-list-status aria-live="polite"></p><div data-r96-list></div><div class="r96-pagination"><button type="button" class="r85-quiet" data-r96-prev>← Anterior</button><span data-r96-page></span><button type="button" class="r85-quiet" data-r96-next>Próxima →</button><button type="button" class="r85-quiet" data-r96-csv>CSV da consulta ↓</button></div>'+links(city)+'</section>';
  const search=content.querySelector('[data-r96-search]'),scope=content.querySelector('[data-r96-scope]');scope.value=directory.scope;
  let filtered=[];const relations=new Map(info.hits.map(x=>[x.code,x]));
  function draw(){filtered=data.features.filter(f=>(directory.scope==='city'||municipal||info.available&&relations.has(f.properties.code))&&fold(f.properties.name).includes(fold(directory.query))).sort((a,b)=>(b.properties.metrics?.population_n??-1)-(a.properties.metrics?.population_n??-1)||a.properties.name.localeCompare(b.properties.name,'pt-BR'));
   const pages=Math.max(1,Math.ceil(filtered.length/15));directory.page=Math.min(directory.page,pages-1);const slice=filtered.slice(directory.page*15,directory.page*15+15);
   content.querySelector('[data-r96-list-status]').textContent=(!info.available&&!municipal&&directory.scope==='selection'?'Cruzamento espacial não disponível para esta seleção. ':N(filtered.length)+' comunidades na consulta. ')+ (directory.scope==='selection'&&!municipal?'A relação espacial não é uma contagem populacional do trecho.':'Referência municipal.');
   content.querySelector('[data-r96-list]').innerHTML=slice.map(f=>{const p=f.properties,rel=relations.get(p.code);return '<button type="button" class="r96-list-row" data-r96-code="'+E(p.code)+'"><span><strong>'+E(p.name)+'</strong><small>'+E(p.coverage==='REFERENCE_ONLY'?'Área de referência · sem estatística própria':directory.scope==='selection'&&rel?(rel.relation==='WITHIN'?'Limite inteiramente contido':'Limite atravessa a seleção'):'Comunidade com resultado censitário')+'</small></span><span>'+N(p.metrics?.population_n)+(p.metrics?' moradores':'')+' <span aria-hidden="true">→</span></span></button>';}).join('')||'<p>Nenhuma comunidade encontrada nesta consulta. Isso não demonstra inexistência de assentamentos informais.</p>';
   content.querySelectorAll('[data-r96-code]').forEach(b=>b.onclick=()=>{directory.scroll={modal:modal.scrollTop,content:content.scrollTop};profile(data.features.find(f=>f.properties.code===b.dataset.r96Code),true);});content.querySelector('[data-r96-page]').textContent=(directory.page+1)+' / '+pages;content.querySelector('[data-r96-prev]').disabled=directory.page===0;content.querySelector('[data-r96-next]').disabled=directory.page+1>=pages;
  }
  search.oninput=()=>{directory.query=search.value;directory.page=0;draw();};scope.onchange=()=>{directory.scope=scope.value;directory.page=0;draw();};content.querySelector('[data-r96-prev]').onclick=()=>{directory.page--;draw();};content.querySelector('[data-r96-next]').onclick=()=>{directory.page++;draw();};
  content.querySelector('[data-r96-csv]').onclick=()=>csv(filtered.map(f=>({code:f.properties.code,community:f.properties.name,municipality:get(city).name,reference_year:2022,coverage:f.properties.coverage,spatial_relation:directory.scope==='selection'?relations.get(f.properties.code)?.relation||'MUNICIPAL_CONTEXT':'MUNICIPAL_CONTEXT',...f.properties.metrics,denominators:JSON.stringify(f.properties.denominators),source:'IBGE Censo 2022; tabelas 9884,9886,9887,9892,9893,9894',limit:'Valores da comunidade inteira; não são contagens do trecho de interseção.'})),'acu-comunidades-'+city+'.csv');
  draw();if(returnCode){content.querySelector('[data-r96-code="'+CSS.escape(returnCode)+'"]')?.focus({preventScroll:true});modal.scrollTop=directory.scroll?.modal||0;content.scrollTop=directory.scroll?.content||0;}
 }
 function csv(records,name){if(!records.length)return;const keys=[...new Set(records.flatMap(Object.keys))],quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"',raw=[keys,...records.map(r=>keys.map(k=>r[k]))].map(r=>r.map(quote).join(',')).join('\r\n'),url=URL.createObjectURL(new Blob(['\ufeff'+raw],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),0);}
 function mapScope(city,gid){
  const rel=relationInfo(city,gid),municipal=gid==='BELEM_CITY_CONTEXT'||state?.data?.geographies?.find(g=>g.id===gid)?.level==='MUNICIPALITY';
  return {mode:municipal||!rel.available?'municipality':'selection',municipal,fallback:!municipal&&!rel.available,relations:new Map(rel.hits.map(x=>[x.code,x])),name:bridge?.geographyName?.()||get(city).name};
 }
 function mapFeatures(data,city,gid){
  const scope=mapScope(city,gid);
  return scope.municipal||scope.fallback?data.features:data.features.filter(f=>scope.relations.has(f.properties.code));
 }
 function featureStyle(feature){
  const p=feature.properties,index=p.coverage==='CENSUS'?bandIndex(p.metrics?.population_n):-1;
  return index<0?{color:'#677782',weight:1.3,dashArray:'4 3',fill:false,fillOpacity:0,opacity:1}:
   {color:'#963c37',weight:1.1,dashArray:null,fill:true,fillColor:BANDS[index].color,fillOpacity:.8,opacity:.95};
 }
 function clearLayer(){
  layer?.remove();renderer?.remove();layer=null;renderer=null;shown=[];loadedKey=null;
 }
 function renderedAudit(){
  const classes=BANDS.map(b=>({...b,count:0}));let references=0,missing=0;const referenceStyles=new Map();
  layer?.eachLayer(l=>{
   if(l.feature.properties.coverage==='REFERENCE_ONLY'){references++;const style={fill:l.options.fill,dash:l.options.dashArray,color:l.options.color};referenceStyles.set(JSON.stringify(style),style);return;}
   const actual=classes.find(b=>b.color===l.options.fillColor);
   if(actual&&finite(l.feature.properties.metrics?.population_n))actual.count++;else missing++;
  });
  return {classes,references,missing,reference_styles:[...referenceStyles.values()]};
 }
 function renderToolbar(){
  if(!toolbar?.isConnected||!state)return;
  toolbar.hidden=!enabled;if(!enabled)return;
  const city=state.cityId,c=get(city),ready=loadedKey===mapKey(),scope=mapScope(city,state.geographyId),audit=renderedAudit(),m=c.scopes.municipality.metrics;
  let boundary=null;state.layers.program?.eachLayer(l=>{if(!boundary||l.options.weight>boundary.weight)boundary={color:l.options.color,dash:l.options.dashArray,weight:l.options.weight};});
  const note=scope.municipal?'Município inteiro.':scope.fallback?'Cruzamento com esta seleção indisponível; exibindo o município.':'Comunidades cujo limite intersecta '+scope.name+'.';
  toolbar.innerHTML='<section data-r97-legend aria-label="População das favelas e comunidades urbanas">'+
   '<h3>Moradores por comunidade</h3><p class="r97-legend-unit">Pessoas · Censo 2022 · limite completo</p>'+
   '<p class="r97-color-rule">Mais escuro = mais moradores</p><div class="r97-scale-head"><span>Moradores</span><span>Comunidades</span></div><ul class="r97-scale" aria-label="Faixas de população">'+
   audit.classes.map(b=>'<li data-r97-band="'+E(b.upper??'open')+'"><i style="background:'+b.color+'" aria-hidden="true"></i><span>'+b.label+'</span><small>'+(ready?N(b.count):'—')+'</small></li>').join('')+
   '</ul><p class="r97-scale-note">Faixas fixas nas oito capitais · número absoluto de moradores.</p>'+
   '<p class="r97-reference"><i aria-hidden="true"></i>Área de referência sem estatística própria'+(ready?' · '+N(audit.references):'')+'</p>'+
   (boundary?'<p class="r97-selection-key"><i style="border-top-color:'+E(boundary.color)+';border-top-style:'+(boundary.dash?'dashed':'solid')+'" aria-hidden="true"></i>Territórios da Agenda</p>':'')+
   '<div class="r97-scope"><strong>'+E(scope.municipal||scope.fallback?c.name:scope.name)+'</strong><p>'+E(note)+'</p>'+
   '<p class="r96-layer-status" role="status" aria-live="polite">'+(mapError?'Não foi possível carregar os limites.':ready?N(shown.filter(f=>f.properties.coverage==='CENSUS').length)+' comunidades com população publicada.':'Carregando limites…')+'</p>'+
   (mapError?'<button type="button" data-r97-retry>Tentar novamente</button>':'')+
   '<p class="r97-scope-note">Os valores são da comunidade inteira, inclusive quando seu limite atravessa a seleção.</p></div>'+
   '<div class="r97-context"><span>Contexto da capital · '+E(c.name)+'</span><strong>'+N(m.population_n)+' moradores</strong><p>'+N(m.population_pct,1)+'% da população da capital vive em comunidades.</p>'+
   '<details><summary>Comparar UF, região e Brasil</summary>'+fields.slice(1).map(s=>'<p><span>'+E(c.labels[s])+'</span><b>'+N(c.scopes[s].metrics.population_pct,1)+'%</b></p>').join('')+'</details></div>'+
   '<div class="r97-actions"><button type="button" data-r96-directory>Explorar comunidades →</button><button type="button" data-r97-csv '+(!ready?'disabled':'')+'>CSV ↓</button></div>'+
   '<p class="r96-source">IBGE · Censo 2022 · <a href="https://sidra.ibge.gov.br/tabela/9884" target="_blank" rel="noopener noreferrer">População e fonte</a></p>'+
   (bridge?.pointLegend?.()||'')+'</section>';
  toolbar.querySelector('[data-r96-directory]').onclick=()=>openDirectory();
  toolbar.querySelector('[data-r97-csv]').onclick=()=>csv(mapExportRows(),'acu-comunidades-mapa-'+city+'.csv');
  toolbar.querySelector('[data-r97-retry]')?.addEventListener('click',()=>drawMap());
  const globalExport=document.querySelector('#export-button');if(globalExport)globalExport.disabled=!ready;
 }
 async function drawMap(){
  const localMap=map,city=state.cityId,gid=state.geographyId,key=mapKey(),token=++request;
  if(!enabled||!localMap)return;mapError=false;renderToolbar();
  try{
   const data=await load(city);
   if(token!==request||!enabled||map!==localMap||state.cityId!==city||state.geographyId!==gid||!localMap.getContainer().isConnected)return;
   clearLayer();shown=mapFeatures(data,city,gid);renderer=L.canvas({pane:'r96FCU',padding:.3});
   layer=L.geoJSON({type:'FeatureCollection',features:shown},{
    pane:'r96FCU',renderer,style:featureStyle,
    onEachFeature:(f,l)=>{
     const p=f.properties,n=p.metrics?.population_n;
     l.bindTooltip('<strong>'+E(p.name)+'</strong><br>'+(p.coverage==='CENSUS'&&finite(n)?N(n)+' moradores · 2022':'Área de referência · sem estatística própria')+'<br><small>Limite completo da comunidade · clique para abrir o perfil</small>',{sticky:true,direction:'top',className:'r96-tooltip',opacity:1});
     l.on('click',event=>{if(event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);profile(f);});
     l.on('mouseover',()=>l.setStyle({weight:2.2,color:p.coverage==='CENSUS'?'#6f1b1e':'#43545f'}));
     l.on('mouseout',()=>l.setStyle(featureStyle(f)));
    }
   }).addTo(localMap);
   loadedCity=city;loadedKey=key;renderToolbar();
  }catch(e){
   if(token!==request)return;mapError=true;loadedKey=null;renderToolbar();
  }
 }
 function mapMount(s){
  state=s;enabled=thematic()&&s.module==='panorama';
  if(map!==s.map){toolbar?.remove();request++;map=s.map;layer=null;renderer=null;toolbar=null;shown=[];loadedCity=null;loadedKey=null;}
  if(!map||!map.getContainer().isConnected)return;
  map.getContainer().toggleAttribute('data-r97-fcu-map',enabled);
  if(!enabled){request++;clearLayer();toolbar?.remove();toolbar=null;return;}
  if(!map.getPane('r96FCU')){map.createPane('r96FCU');map.getPane('r96FCU').style.zIndex=455;}
  if(!toolbar?.isConnected){
   toolbar=document.createElement('section');toolbar.className='r96-map-control r97-map-control';toolbar.setAttribute('aria-label','Favelas e comunidades urbanas');
   const rail=document.querySelector('.r92-map-rail');
   if(rail)rail.prepend(toolbar);
   else{const control=L.control({position:'bottomleft'});control.onAdd=()=>toolbar;control.addTo(map);L.DomEvent.disableClickPropagation(toolbar);L.DomEvent.disableScrollPropagation(toolbar);}
  }
  renderToolbar();if(loadedKey!==mapKey()){request++;clearLayer();drawMap();}
 }
 function mapExportRows(){
  if(!enabled||loadedKey!==mapKey())return [];
  const city=state.cityId,scope=mapScope(city,state.geographyId);
  return shown.map(f=>{const p=f.properties,n=p.metrics?.population_n;
   return {city:get(city).name,geography_id:p.code,geography:p.name,geographic_level:'IBGE_FCU_COMPLETE',indicator_id:INDICATOR,indicator:'População residente da comunidade',selected_measure:'census_count',selected_value:finite(n)?n:null,count:finite(n)?n:null,percentage:null,unit:'pessoas',period:'2022',availability:p.coverage==='REFERENCE_ONLY'?'REFERENCE_ONLY':finite(n)?'AVAILABLE':'SOURCE_NOT_AVAILABLE',source:'IBGE · Censo 2022 · https://sidra.ibge.gov.br/tabela/9884',source_id:'r96-population',source_ids:'r96-population',definition:'População residente no limite completo da favela ou comunidade urbana identificada pelo IBGE.',universe:'Moradores da comunidade inteira',estimate_scope:'Comunidade inteira; sem rateio por área de interseção',lineage_id:'IBGE_CD2022_FCU:community:'+p.code+':population_n',spatial_relation:scope.relations.get(p.code)?.relation||'MUNICIPAL_CONTEXT',official_url:'https://sidra.ibge.gov.br/tabela/9884'};
  });
 }
 function connect(s,b){
  state=s;if(b)bridge=b;enabled=thematic()&&s.module==='panorama';
  document.body.classList.toggle('r97-fcu-theme',enabled);
  const globalExport=document.querySelector('#export-button');if(globalExport)globalExport.disabled=enabled&&loadedKey!==mapKey();
 }
 function showMap(){bridge?.showTheme?.();}
 document.addEventListener('click',e=>{if(e.target.closest('.r96-fcu-section [data-r96-directory]'))openDirectory();if(e.target.closest('[data-r96-show-map]'))showMap();});
 window.ACU_R96_FCU={rows,section,evidence,exportRows,augment,connect,mapMount,openDirectory,mapExportRows,themeId:THEME,mapIndicatorId:INDICATOR,sources:D.sources,snapshot:()=>({city:state?.cityId,enabled,loadedCity,ready:loadedKey===mapKey(),features:layer?.getLayers().length||0,scope:enabled?mapScope(state.cityId,state.geographyId).mode:null,...renderedAudit(),viewport:map?._loaded?{center:[map.getCenter().lat,map.getCenter().lng],zoom:map.getZoom()}:null,cachedCities:[...cache.keys()]})};
})();
