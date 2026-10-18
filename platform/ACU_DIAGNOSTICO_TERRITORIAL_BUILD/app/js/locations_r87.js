/* Current public points only. Original source bytes and historical school rates are retained. */
(()=>{'use strict';const cache=new WeakMap();
 function apply(city,original){
  if(cache.has(original))return cache.get(original);
  const dataset=window.ACU_R87_LOCATION_DATA,patches=dataset.cities[city]||[],byId=new Map(patches.map(r=>[r.kind+'|'+r.id,r]));
  const patch=(kind,rows)=>rows.map(r=>{const p=byId.get(kind+'|'+r.id);return p?{...r,...p,official_address:p.r87_validated_address,source_ids:[...new Set([...(r.source_ids||[]),...p.location_source_ids])]}:r;});
  const result={...original,schools:patch('schools',original.schools),equipment:patch('equipment',original.equipment),sources:[...original.sources]};
  if(city==='belem'){
   const a=window.ACU_BELEM_UX_R4_SPATIAL;
   if(!a.r87Applied){a.schools=patch('schools',a.schools);a.equipment=patch('equipment',a.equipment);a.r87Applied=true;
    a.metadata=structuredClone(a.metadata);
    for(const [kind,key] of [['schools','school_coverage'],['equipment','equipment_coverage']]){const c=dataset.counts.find(r=>r.city===city&&r.kind===kind),m=a.metadata[key];m.spatialized_count=c.approved_after;m.nonspatial_count=c.pending;m.inside_daico_spatialized_count=a[kind].filter(r=>r.map_eligible&&r.inside_daico).length;m.outside_daico_spatialized_count=c.approved_after-m.inside_daico_spatialized_count;if(kind==='schools')m.spatial_coverage_pct=c.approved_after_pct;}
   }
  }
  for(const p of patches){const id=p.location_source_ids[0],cat=id.startsWith('SRC_R87_CATALOGO');if(!result.sources.some(r=>r.source_id===id))result.sources.push({source_id:id,source_name:cat?'Inep · Catálogo de Escolas':id.startsWith('SRC_R87_CNES')?'Ministério da Saúde · CNES':'IBGE · CNEFE do Censo 2022',institution:cat?'Inep':id.startsWith('SRC_R87_CNES')?'Ministério da Saúde':'IBGE',url:cat?'https://www.gov.br/inep/pt-br/acesso-a-informacao/dados-abertos/inep-data/catalogo-de-escolas/':id.startsWith('SRC_R87_CNES')?'https://apidadosabertos.saude.gov.br/cnes/estabelecimentos/'+Number(id.split('_').pop()):'https://ftp.ibge.gov.br/Cadastro_Nacional_de_Enderecos_para_Fins_Estatisticos/Censo_Demografico_2022/Arquivos_CNEFE/CSV/Municipio/',reference_year:p.r87_location_vintage,access_date:'2026-10-18'});
   if(city==='sao_paulo')for(const u of (window.ACU_R77_DATA?.units||[]).filter(u=>u.equipment_id===p.id)){if(/NO_PUBLIC_ADDRESS|NO_FIXED_SITE/.test(u.location_status||''))continue;Object.assign(u,{latitude:p.latitude,longitude:p.longitude,map_eligible:true,location_status:'VALIDATED',r87_location_method:p.location_method,r87_location_source_ids:p.location_source_ids});}
  }
  for(const s of result.sources.filter(s=>s.source_id?.startsWith('SRC_R87_'))){s.official_url=s.url;s.title=s.source_name;s.reference_period=s.reference_year;s.source_role='LOCATION_ONLY';s.source_geography=original.config.city_name+' · endereço da unidade';s.methodological_limitations='Fonte da localização atual, com competência indicada no registro. Precisão posicional métrica não publicada; não altera retrospectivamente taxas escolares.';}
  if(city==='sao_paulo'){
   const d=window.ACU_R77_DATA,n=dataset.network;
   for(const update of n.unit_updates){const u=d.units.find(u=>u.id===update.id);u.r87_previous_location_source_ids??=[...u.location_source_ids];Object.assign(u,update);u.field_sources={...u.field_sources,location:update.location_source_ids};}
   d.aggregates=structuredClone(n.aggregates);d.summary.location=Object.fromEntries([...new Set(d.units.map(u=>u.location_status))].map(s=>[s,d.units.filter(u=>u.location_status===s).length]));
   for(const s of result.sources.filter(s=>s.source_id?.startsWith('SRC_R87_')))if(!d.sources.some(x=>x.source_id===s.source_id))d.sources.push(s);
   result.values={...original.values};const known=new Set(d.metrics.map(m=>m.indicator_id));
   for(const a of n.aggregates){const gid=a.geography_id;result.values[gid]??={};if(result.values[gid]===original.values[gid])result.values[gid]={...original.values[gid]};for(const mode of ['COUNT','DISTANCE']){const id='R77_NETWORK_'+a.type+'_'+mode;if(!known.has(id))continue;const old=result.values[gid][id],value=mode==='COUNT'?a.located_unit_count:a.distance_m==null?null:a.distance_m/1000;result.values[gid][id]={...old,value,numerator:value,denominator:null,status:value==null?'SOURCE_NOT_AVAILABLE':'AVAILABLE',source_ids:[...new Set(['SRC_ACU_R77_SP_NETWORK',...a.source_ids])],nearest_unit_id:mode==='DISTANCE'?a.nearest_unit_id:null,period_label:'Localizações · 18/10/2026',r87_current_location_aggregate:true};}}
   result.catalog=original.catalog.map(m=>known.has(m.indicator_id)?{...m,period:'Cadastro 07/10/2026 · localizações 18/10/2026'}:m);
  }
  result.r87_location_coverage=dataset.counts.filter(r=>r.city===city);cache.set(original,result);return result;
 }
 window.ACU_R87_LOCATIONS={apply};
})();
