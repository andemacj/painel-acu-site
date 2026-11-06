/* INCID published estimates: complete UP coverage without changing geographies. */
(()=>{'use strict';
 const cache=new WeakMap(),finite=Number.isFinite,E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const D=()=>window.ACU_R100_SL_DATA,sourceId=t=>'R100_INCID_'+t.id;
 let state=null,bridge=null,panel=null;
 const fmt=(v,u)=>finite(v)?v.toLocaleString('pt-BR',{maximumFractionDigits:u==='moradores/domicílio'?2:0}):'—';
 function pageURL(t){const u=new URL(t.source_url),pages=u.searchParams.getAll('pageName');if(pages.length)u.searchParams.set('pageName',pages.at(-1));return u.href;}
 function apply(city,original){
  if(city!=='sao_luis')return original;if(cache.has(original))return cache.get(original);
  const d=D();if(!d||d.audit.full_30_up_metrics!==77)throw Error('Dados INCID das 30 UPs não carregados.');
  const replaced=new Set(original.catalog.filter(m=>String(m.source_id).startsWith('SRC_IBGE_CENSO2022_')).map(m=>m.indicator_id));
  const values=Object.fromEntries(Object.entries(original.values).map(([g,vs])=>[g,Object.fromEntries(Object.entries(vs).filter(([id])=>!replaced.has(id)))]));
  const derivations=new Map(d.derivations.map(x=>[x.geography+'|'+x.metric,x]));
  const sources=[{source_id:'R100_INCID_CENSO2022',...d.source,source_role:'CANONICAL',source_geography:'INCID_PLANNING_UNIT / INCID_NEIGHBORHOOD / MUNICIPALITY'},...d.tables.map(t=>({source_id:sourceId(t),institution:d.source.institution,title:t.chart+' · Censo 2022 · '+t.level,official_url:pageURL(t),reference_period:'2022',source_role:'CANONICAL',source_geography:t.level,collection_date:t.captured_at,sha256:t.sha256,methodological_limitations:d.source.methodological_limitations,capture_path:t.path}))];
  const lookup=new Map();
  for(const [g,m,value,t,row,column,published] of d.cells){
   const geo=d.geographies[g],metric=d.metrics[m],der=derivations.get(g+'|'+m),table=t>=0?d.tables[t]:null;
   const cell={value,numerator:metric.measure_type==='COUNT'?value:null,denominator:null,unit:metric.unit,period:'2022',universe:metric.universe,
    status:value===null?'SOURCE_NOT_AVAILABLE':der?'DERIVED_FROM_INCID_ESTIMATES':'ESTIMATED_BY_INCID',r100_incid:true,
    count_interpretation:metric.count_interpretation,estimate_scope:'INCID_TERRITORIAL_OVERLAY',source_geography_id:geo.id,source_geography_label:geo.name,
    source_id:table?sourceId(table):'R100_INCID_CENSO2022',source_ids:table?[sourceId(table)]:[],
    lineage_id:'ACU-R100-INCID:'+geo.id+':'+metric.indicator_id,
    source_file:table?.path||'Soma explícita dos componentes publicados',published_text:published,
    capture_reference:table?{table_id:table.id,row,column,sha256:table.sha256}:null,
    original_variables:table?.columns?.find(c=>c.col===column)?.ref||null,
    aggregation_rule:der?der.method:'PUBLISHED_INCID_TERRITORIAL_ESTIMATE',
    denominator_reason:'Percentual não publicado neste produto; universos distintos entre tabelas não são combinados.',
    limitations:d.source.methodological_limitations};
   if(der)cell.derivation=der;
   values[geo.id]??={};values[geo.id][metric.indicator_id]=cell;lookup.set(g+'|'+m,cell);
  }
  function resolve(key,seen=new Set()){
   if(seen.has(key))throw Error('Ciclo na linhagem INCID');const cell=lookup.get(key);if(!cell)return [];
   const der=derivations.get(key);if(!der?.components)return cell.source_ids;
   seen.add(key);cell.source_ids=[...new Set(der.components.flatMap(k=>resolve(k.join('|'),new Set(seen))))];cell.source_id=cell.source_ids[0]||'R100_INCID_CENSO2022';return cell.source_ids;
  }
  for(const key of lookup.keys())resolve(key);
  const catalog=[...original.catalog.filter(m=>!replaced.has(m.indicator_id)),...d.metrics.map(m=>({...m}))];
  const facts={...original.facts,population:values['2111300'].demo_population_total_n?.value,age_0_19:values['2111300'].demo_age_0_19_n?.value,age_10_19:values['2111300'].demo_age_10_19_n?.value,program_population:values.ACU_SAO_LUIS_COMBINED.demo_population_total_n?.value,program_age_0_19:values.ACU_SAO_LUIS_COMBINED.demo_age_0_19_n?.value,program_age_10_19:values.ACU_SAO_LUIS_COMBINED.demo_age_10_19_n?.value};
  const result={...original,values,catalog,facts,sources:[...original.sources,...sources],r100_incid:d.audit};cache.set(original,result);return result;
 }
 function governance(id,city){
  if(city!=='sao_luis')return null;const m=D()?.metrics.find(m=>m.indicator_id===id);if(!m)return null;
  const municipalityOnly=m.geographies.length===1&&m.geographies[0]==='MUNICIPALITY';
  return {...m,menu_visible:true,public_map_visible:m.map_eligible,publication_mode:m.map_eligible?'TERRITORIAL_CHOROPLETH':municipalityOnly?'MUNICIPAL_CONTEXT_ONLY':'PROGRAM_PROFILE_ONLY',allowed_map_scales:m.map_eligible?['INCID_PLANNING_UNIT']:[],recommended_geography:m.map_eligible?'INCID_PLANNING_UNIT':municipalityOnly?'MUNICIPALITY':'AGENDA_CITY_TERRITORY',coverage_by_scale:m.map_eligible?{INCID_PLANNING_UNIT:{available:30,total:30,message:'30 de 30 UPs com estimativas publicadas pelo INCID.'}}:{},limitations:D().source.methodological_limitations};
 }
 function sortMetrics(rows,coverage){return [...rows].sort((a,b)=>(a.indicator_id==='demo_population_total_n'?-1:b.indicator_id==='demo_population_total_n'?1:coverage(b).available-coverage(a).available)||a.label.localeCompare(b.label,'pt-BR'));}
 const optionLabel=(m,c)=>m.label+' · '+c.available+'/'+c.total+' '+c.label;
 function openMunicipal(){
  const d=state.data,rows=d.catalog.filter(m=>m.r100_incid&&finite(d.values['2111300']?.[m.indicator_id]?.value)),themes=[...new Set(rows.map(m=>m.theme))],content=document.querySelector('#detail-content'),dialog=document.querySelector('#detail-dialog');
  document.querySelector('#detail-title').textContent='São Luís · dados publicados pelo INCID';
  content.innerHTML='<article class="r99-municipal" data-r100-municipal-dialog><p class="r99-kicker">Prefeitura de São Luís · INCID · Censo 2022</p><h2>Contexto do município</h2><p>Estes dados representam o município inteiro e conservam os universos publicados. Não são transferidos para UPs ou bairros.</p><label class="r99-search">Buscar indicador<input type="search" data-r100-municipal-search placeholder="Ex.: alfabetização, água, adolescentes"></label><p role="status" data-r100-municipal-status>'+rows.length+' resultados municipais.</p>'+themes.map(theme=>'<details data-r100-municipal-theme><summary>'+E(theme)+'<small>'+rows.filter(m=>m.theme===theme).length+' resultados</small></summary><div class="r99-table-wrap"><table><thead><tr><th>Indicador</th><th>Valor</th><th>Universo e fonte</th></tr></thead><tbody>'+rows.filter(m=>m.theme===theme).map(m=>{const c=d.values['2111300'][m.indicator_id],ss=d.sources.filter(s=>c.source_ids.includes(s.source_id));return '<tr data-r100-municipal-row data-search="'+E((m.label+' '+theme).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())+'"><th>'+E(m.label)+'<small>2022 · '+E(m.unit)+'</small></th><td>'+fmt(c.value,m.unit)+'</td><td>'+E(m.universe)+ss.map(s=>'<a target="_blank" rel="noopener noreferrer" href="'+E(s.official_url)+'">INCID · tabela de origem</a>').join('')+'<details><summary>Método e proveniência</summary><p>'+E(c.aggregation_rule)+'</p><p>'+E(c.lineage_id)+'</p><p>'+E(c.limitations)+'</p></details></td></tr>';}).join('')+'</tbody></table></div></details>').join('')+'<p class="r99-note">Pessoas, domicílios e médias têm universos próprios. Não há recomposição de totais divergentes nem cálculo de percentuais com bases incompatíveis.</p></article>';
  content.querySelector('input').oninput=e=>{const q=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();let total=0;content.querySelectorAll('[data-r100-municipal-theme]').forEach(group=>{let n=0;group.querySelectorAll('[data-r100-municipal-row]').forEach(r=>{r.hidden=!r.dataset.search.includes(q);if(!r.hidden)n++;});group.hidden=!n;group.open=!!q&&n>0;total+=n;});content.querySelector('[data-r100-municipal-status]').textContent=total+' resultados encontrados.';};
  if(!dialog.open)dialog.showModal();content.querySelector('input').focus();
 }
 function mount(s){
  state=s;if(s.cityId!=='sao_luis'||s.module!=='panorama'||s.theme==='FCU_2022'){panel?.remove();panel=null;return;}
  const rail=document.querySelector('.r92-map-rail');if(!rail)return;
  if(!panel?.isConnected){panel=document.createElement('section');panel.className='r99-sl-coverage r100-incid';panel.dataset.r100SlCoverage='';panel.setAttribute('aria-label','Cobertura dos dados de São Luís');rail.append(panel);}
  const m=bridge?.metric?.(),c=m&&bridge?.mapCoverage?.(m),incid=m?.r100_incid,open=panel.querySelector('details')?.open;
  if(incid){const interpretation=m.measure_type==='MEAN'?'Mais escuro = maior média':'Mais escuro = maior quantidade',model=window.ACU_R71_PANORAMA?.getMap?.()?._r82Legend?.model,reading=document.querySelector('#map-legend .r82-reading'),summary=document.querySelector('#map-legend .r82-legend-shell>summary');if(model)model.interpretation=interpretation;if(reading)reading.textContent=interpretation;if(summary?.title)summary.title=summary.title.replace(/Mais escuro = .*$/,interpretation);}
  panel.innerHTML='<details'+(open?' open':'')+'><summary><strong>'+E(incid?c.available+' de '+c.total+' '+c.label+' com dados':'Dados publicados na escala da fonte')+'</strong><span>'+(incid?'Prefeitura/INCID · Censo 2022 · estimativas':'Consulte a fonte e o recorte do indicador')+'</span></summary><p>'+E(D().source.methodological_limitations)+'</p><p>UP e bairro são recortes diferentes. As 30 UPs têm 77 indicadores elegíveis; os bairros da Agenda conservam seus próprios valores. Faixas etárias não publicadas para UP não são desmembradas.</p><a href="'+E(D().source.official_url)+'" target="_blank" rel="noopener noreferrer">Fonte e regionalização do INCID</a></details><div class="r99-sl-actions"><button type="button" data-r100-municipal>Dados do município</button></div>';
  panel.querySelector('[data-r100-municipal]').onclick=openMunicipal;
 }
 function assistantMount(s){if(s.cityId!=='sao_luis')return;for(const id of ['overview','territory']){const p=document.querySelector('#r85-panel-'+id);if(p&&!p.querySelector('[data-r100-method]'))p.insertAdjacentHTML('afterbegin','<p class="r100-method" data-r100-method>Prefeitura de São Luís · INCID · Censo 2022. Estimativas territoriais; cada dado conserva o bairro ou a UP de origem. <a href="'+E(D().source.official_url)+'" target="_blank" rel="noopener noreferrer">Método</a></p>');}}
 const A=window.ACUAnalytics,priorPercentage=A.demographicPercentage,priorImpact=A.impactCount,priorPack=A.evidencePack,priorAggregate=A.aggregate;
 A.demographicPercentage=function(data,g,id){if(!data?.r100_incid||!D()?.metrics.some(m=>m.indicator_id===id))return priorPercentage(data,g,id);return {applicable:A.DEMOGRAPHIC_COUNT_IDS.includes(id),available:false,count:data.values[g]?.[id]?.value??null,percentage_of_total:null,denominator:null,status:'PERCENTAGE_NOT_PUBLISHED_BY_INCID',geography_id:g,period:'2022'};};
 A.aggregate=function(cells,m){if(!m?.r100_incid||m.measure_type==='COUNT')return priorAggregate(cells,m);if(cells.length===1&&A.isAvailable(cells[0]))return {...cells[0]};return {value:null,numerator:null,denominator:null,status:'NOT_DERIVABLE_EXACTLY',reason:'Não há denominadores compatíveis para agregar as médias publicadas pelo INCID.'};};
 A.impactCount=function(m,c,options){if(!m?.r100_incid||!A.isAvailable(c)||m.measure_type!=='COUNT'||options?.childQuestion&&!m.child_specific)return priorImpact(m,c,options);return {policy:'PUBLISHED_TERRITORIAL_ESTIMATE',value:c.value,label:fmt(c.value,m.unit),reason:'Estimativa territorial publicada pelo INCID; não é contagem observada exata.'};};
 A.evidencePack=function(data,...args){const p=priorPack(data,...args);if(data?.r100_incid)for(const e of p.evidence||[]){const m=data.catalog.find(m=>m.indicator_id===e.indicator_id);if(!m?.r100_incid)continue;e.percentage_of_total=null;e.percentage_denominator=null;e.percentage_compatibility=null;e.percentage_status='PERCENTAGE_NOT_PUBLISHED_BY_INCID';e.count_interpretation=m.count_interpretation;e.estimate_scope='INCID_TERRITORIAL_OVERLAY';}return p;};
 window.ACU_R100_SL={apply,governance,sortMetrics,optionLabel,mount,assistantMount,connect(s,b){state=s;bridge=b;},snapshot:()=>({city:state?.cityId,visible:!!panel?.isConnected,...(D()?.audit||{})})};
})();
