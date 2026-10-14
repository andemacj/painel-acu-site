/* Additive city contracts. Every adapter delegates unchanged for the five inherited cities. */
(()=>{'use strict';
 const D=window.ACU_R81_EXPANSION,ids=Object.freeze(Object.keys(D.cities));
 const has=id=>ids.includes(id),E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 Object.assign(window.ACU_CITY_DIAGNOSTIC_RUNTIME.cities,D.cities);
 Object.assign(window.ACU_CITY_DIAGNOSTIC_RUNTIME.public_scale_contract,D.public_scale_contract);
 for(const id of ids){
  Object.assign(window.ACU_CITIES.find(c=>c.city_id===id),{status:'AVAILABLE',availability_status:'AVAILABLE_WITH_LIMITATIONS',data_path:`cities/${id}/city_data.js`});
  window.ACU_R75_POLICY_DATA[id]=Object.fromEntries(Object.entries(D.cities[id].indicators).map(([key,m])=>[key,{direction:m.theme==='Condições domiciliares e WASH'?'adverse':/alfabetizada/.test(m.label)?'favorable':'descriptive',family:m.theme==='Condições domiciliares e WASH'?'red':'blue',reason:m.definition}]));
  window.ACU_R70_CONFIG.cities[id]={name:D.cities[id].city_name,sector_available:false,indicators:{}};
 }
 const originalPercentage=ACUAnalytics.demographicPercentage,originalAudit=ACUAnalytics.auditDemographicPercentages;
 function percentage(data,geo,id){
  if(!has(data?.config?.city_id))return originalPercentage(data,geo,id);
  const cells=data.values[geo]||{},count=cells[id],pc=cells[id.replace(/_n$/,'_pct')];
  if(id==='demo_population_total_n')return {applicable:true,available:ACUAnalytics.isAvailable(count)&&count.value>0,count:count?.value??null,percentage_of_total:count?.value>0?100:null,denominator:count?.value??null,status:'DIRECT_SAME_SOURCE_TOTAL',geography_id:geo,numerator_source_id:count?.source_id,denominator_source_id:count?.source_id};
  const ok=ACUAnalytics.isAvailable(count)&&ACUAnalytics.isAvailable(pc)&&pc.numerator===count.value&&pc.source_id===count.source_id&&pc.denominator>0;
  return {applicable:ACUAnalytics.DEMOGRAPHIC_COUNT_IDS.includes(id),available:ok,count:count?.value??null,percentage_of_total:ok?pc.value:null,denominator:ok?pc.denominator:null,status:ok?'EXACT_SAME_PRODUCT_RATIO':'SOURCE_NOT_AVAILABLE',geography_id:geo,numerator_source_id:count?.source_id,denominator_source_id:pc?.source_id,lineage_id:pc?.lineage_id,formula:pc?.formula,universe:'Denominador do mesmo produto e edição do numerador; pode diferir do Básico revisto',compatibility:'SAME_PRODUCT_EDITION_AND_GEOGRAPHY'};
 }
 ACUAnalytics.demographicPercentage=percentage;
 ACUAnalytics.auditDemographicPercentages=data=>{
  if(!has(data?.config?.city_id))return originalAudit(data);
  let tested=0,unavailable=0;const counters={demographic_percentage_mismatch:0,wrong_geography_denominator:0,missing_percentage_presented_as_zero:0,sex_residual_redistribution:0};
  for(const g of data.geographies)for(const id of ACUAnalytics.DEMOGRAPHIC_COUNT_IDS){const p=percentage(data,g.id,id);if(!p.available){unavailable++;continue;}tested++;if(Math.abs(p.percentage_of_total-100*p.count/p.denominator)>1e-10)counters.demographic_percentage_mismatch++;}
  return {city_id:data.config.city_id,tested,unavailable,counters};
 };
 function factKPIs(data,geo,helpers){
  const {kpi,format,cell,percentage,sourceIds}=helpers,rows=[];
  for(const [id,label] of [['demo_population_total_n','População residente'],['demo_age_0_4_n','Pessoas de 0–4 anos'],['demo_age_5_9_n','Pessoas de 5–9 anos'],['demo_age_10_14_n','Pessoas de 10–14 anos'],['demo_age_15_19_n','Pessoas de 15–19 anos'],['demo_age_0_19_n','Pessoas de 0–19 anos']]){
   const c=cell(id),p=percentage(id);rows.push(kpi(label,ACUAnalytics.isAvailable(c)?format(c.value,'pessoas'):'N/D',id==='demo_population_total_n'?'Censo 2022 · Básico revisto em 2026':p.available?`${format(p.percentage_of_total,'%')} · moradores do produto Demografia 2022`:'Percentual N/D',ACUAnalytics.isAvailable(c)?'AVAILABLE':'SOURCE_SUPPRESSION',sourceIds(c,id),null,id));
  }
  return rows.join('');
 }
 const baseContext=window.ACU_R73_CONTEXT;
 const context=()=>window.ACU_R81_CONTEXT_DATA;
 function sourceLink(id){const s=context().sources.find(s=>s.source_id===id);return s?`<a href="${E(s.official_url)}" target="_blank" rel="noopener">${E(s.institution+' · '+s.title)}</a>`:'';}
 function rowsTable(city,rows){
  const c=context().cities[city];return `<table><thead><tr><th>Indicador</th><th>${E(c.name)}</th><th>${E(c.state)}</th><th>Brasil</th><th>Período</th></tr></thead><tbody>${rows.map(r=>`<tr data-context-indicator="${E(r.indicator_id)}"><td>${E(r.title)}<small>${E(r.universe)}</small></td>${['municipality','state','brazil'].map(k=>`<td data-label="${E(k==='municipality'?c.name:k==='state'?c.state:'Brasil')}">${r.values[k]==null?'N/D':E(ACU_R75.format(r.values[k],r.unit))}</td>`).join('')}<td data-label="Período">${E(r.period||r.year)}</td></tr>`).join('')}</tbody></table>`;
 }
 function details(city,rows){return `<details class="r73-methodology"><summary>Fontes, definições e precisão</summary>${rows.map(r=>`<p><strong>${E(r.title)}:</strong> ${E(r.definition)} ${E(r.filters||'')} ${E(r.limitations||'')} ${sourceLink(r.source_id)}</p>${r.precision?`<p>Precisão municipal: ${E(r.precision.municipality?.ci_lower==null?'IC não publicado':`IC95: ${ACU_R75.number(r.precision.municipality.ci_lower)} a ${ACU_R75.number(r.precision.municipality.ci_upper)}`)}; CV ${E(ACU_R75.number(r.precision.municipality?.cv))}%. Comparação descritiva; sem teste de significância.</p>`:''}`).join('')}</details>`;}
 function render(city,geo,theme,indicator,current){
  if(!has(city))return baseContext.render(city,geo,theme,indicator,current);
  const c=context()?.cities[city];if(!c)return '';
  const families=[['Educação · Ideb e frequência escolar',[...c.ideb,...c.pnad]],['Saúde escolar e proteção · PeNSE 2024',c.pense],['Registros de saúde · residência · TabNet',c.health]];
  return `<section class="r73-context r75-context" data-city="${city}"><header><h2>${E(geo.name)}</h2><p>Contexto da capital · ${E(c.name)} / ${E(c.state)}</p></header><p class="r75-short-note">Capital inteira. A seleção territorial não altera os valores destas tabelas. Pesquisas de escolares, moradores e registros de saúde têm universos próprios.</p>${families.filter(([,rows])=>rows.length).map(([title,rows],i)=>i?`<details><summary>${E(title)}</summary>${rowsTable(city,rows)}${details(city,rows)}</details>`:`<h3>${E(title)}</h3>${rowsTable(city,rows)}${details(city,rows)}`).join('')}<details><summary>Cobertura e pendências</summary>${c.pending.map(p=>`<p>${E(p)}</p>`).join('')}</details></section>`;
 }
 function methodology(city){if(!has(city))return baseContext.methodology(city);const c=context().cities[city];return details(city,[...c.ideb,...c.pnad,...c.pense,...c.health]);}
 function answer(city,question){
  if(!has(city))return baseContext.answer(city,question);
  const q=String(question||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),c=context().cities[city];let rows;
  if(/ideb/.test(q))rows=c.ideb;else if(/pnad|frequencia.*escola|escolarizacao/.test(q))rows=c.pnad;else if(/pense|bullying|humilh|tristeza|cyber|preservativo/.test(q))rows=c.pense;else if(/tabnet|sinasc|sim\b|nascid|obito|saude municipal/.test(q))rows=c.health;else return null;
  const key=/bullying|humilh/.test(q)?'bullying':/cyber/.test(q)?'cyber':/tristeza/.test(q)?'sadness':/preservativo/.test(q)?'condom':null;if(key)rows=rows.filter(r=>r.key===key);
  return {html:`<h2>Contexto municipal · ${E(c.name)}</h2><p>Capital inteira; não representa o bairro ou território ACU selecionado.</p>${rowsTable(city,rows)}${details(city,rows)}`,claims:rows.map(r=>({indicator_id:r.indicator_id,year:r.year,unit:r.unit,geography:c.ibge7,values:r.values,evidence:r.evidence,precision:r.precision})),source_ids:[...new Set(rows.map(r=>r.source_id))],city};
 }
 window.ACU_R73_CONTEXT={render,methodology,answer,data:city=>has(city)?context().cities[city]:baseContext.data(city)};
 window.ACU_R81={cityIds:ids,has,factKPIs};
})();
