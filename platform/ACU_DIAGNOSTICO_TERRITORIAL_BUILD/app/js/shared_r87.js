/* Presentation only: one equipment choice; original categories and territorial IDs retained. */
(()=>{'use strict';
 const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const groups=[['EDUCATION','Educação'],['HEALTH','Saúde'],['SOCIAL_ASSISTANCE','Assistência social'],['RIGHTS_PROTECTION','Proteção e direitos'],['CULTURE_LEISURE','Cultura, esporte e lazer'],['OTHER_SERVICES','Outros serviços']];
 const mapping={EDUCATION_NON_SCHOOL:'EDUCATION',EDUCACAO:'EDUCATION',EDUCATION:'EDUCATION',HEALTH:'HEALTH',MENTAL_HEALTH:'HEALTH',SAUDE:'HEALTH',SAUDE_MENTAL:'HEALTH',SOCIAL_ASSISTANCE:'SOCIAL_ASSISTANCE',ASSISTENCIA_SOCIAL:'SOCIAL_ASSISTANCE',FOOD_SECURITY_AND_SUPPLY:'SOCIAL_ASSISTANCE',INTERSECTORAL_COMMUNITY:'SOCIAL_ASSISTANCE',INTERSETORIAL:'SOCIAL_ASSISTANCE',RIGHTS_PROTECTION:'RIGHTS_PROTECTION',PROTECAO_DIREITOS:'RIGHTS_PROTECTION',JUSTICE_AND_RIGHTS:'RIGHTS_PROTECTION',PUBLIC_SECURITY_GENERAL:'RIGHTS_PROTECTION',CITIZENSHIP_SERVICES:'RIGHTS_PROTECTION',YOUTH:'RIGHTS_PROTECTION',CULTURE:'CULTURE_LEISURE',CULTURA:'CULTURE_LEISURE',SPORTS_LEISURE:'CULTURE_LEISURE',ESPORTE_LAZER:'CULTURE_LEISURE',PUBLIC_SPACE:'CULTURE_LEISURE',ENVIRONMENTAL_SERVICE:'OTHER_SERVICES',MOBILITY_INFRASTRUCTURE:'OTHER_SERVICES'};
 const networkTypes=new Set(['DDM','DEAM','CASA_DA_MULHER_BRASILEIRA','CASA_MULHER_BRASILEIRA','CENTRO_REFERENCIA_MULHER','CENTRO_DE_REFERENCIA_DA_MULHER','CENTRO_ATENDIMENTO_MULHER','WOMEN_SUPPORT','WOMEN_PROTECTION','VIOLENCE_AGAINST_WOMEN_SERVICE','WOMEN_SPECIALIZED_POLICE','CEAM','SALA_DA_MULHER','NUAM','CASA_DA_MULHER','MULHER']);
 const network=r=>r.r77_network===true||!!r.r77_unit_ids?.length||r.women_network===true||networkTypes.has(String(r.canonical_subcategory||r.subcategory||r.type||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_'));
 const group=r=>['PUBLIC_MARKET','AGROFEIRA'].includes(r.canonical_subcategory||r.subcategory)?'OTHER_SERVICES':mapping[r.canonical_category||r.category]||'OTHER_SERVICES';
 const matches=(r,category)=>!category||(category==='WOMEN_NETWORK'?network(r):group(r)===category);
 function options(rows){const found=new Set(rows.map(group));return groups.filter(([id])=>found.has(id)).concat(rows.some(network)?[['WOMEN_NETWORK','Rede de proteção e apoio à mulher']]:[]);}
 function normalize(state,rows){
  const prior=state.equipmentFilters||{};let value=prior.category||'';
  if(Array.isArray(prior.categories))value=prior.categories.length===1?prior.categories[0]:'';
  if(value==='R77_NETWORK')value='WOMEN_NETWORK';else if(!groups.some(([id])=>id===value)&&value!=='WOMEN_NETWORK')value=mapping[value]||'';
  if(!options(rows).some(([id])=>id===value))value='';
  state.equipmentFilters={category:value};state.equipmentFilter=value;return value;
 }
 function controls(state,rows,mode='map'){
  const value=normalize(state,rows),id=mode==='map'?'map-equipment-category':'equipment-category';
  return '<label class="r83-field r87-category"><span>Categoria</span><select id="'+id+'" data-r87-equipment-category aria-label="Categoria"><option value="">Todas as categorias</option>'+options(rows).map(([k,t])=>'<option value="'+k+'"'+(value===k?' selected':'')+'>'+E(t)+'</option>').join('')+'</select></label>'+(mode==='map'?'<button type="button" class="quiet-button" data-r87-equipment-directory>Consultar diretório</button>':'');
 }
 function shortName(value){if(/^territ[oó]rios\s+(?:ACU|Agenda Cidade)/i.test(String(value??'')))return 'Todos os territórios';return String(value??'').replace(/^(?:territ[oó]rio\s+(?:priorit[aá]rio\s+)?(?:ACU|Agenda Cidade(?: UNICEF)?)(?:\s+observado)?)\s*[:·—-]?\s*/i,'').replace(/\s*[—·-]\s*territ[oó]rio\s+(?:priorit[aá]rio\s+)?(?:ACU|Agenda Cidade(?: UNICEF)?).*$/i,'').replace(/\s*\((?:territ[oó]rio\s+)?ACU(?:\s+observado)?\)\s*$/i,'').replace(/\s*[—·-]\s*Agenda Cidade(?: UNICEF)?\s*$/i,'').replace(/\s+ACU\b/ig,'').replace(/\s*\(\d+ setores\)\s*$/i,'').trim();}
 const label=id=>groups.find(([k])=>k===id)?.[1]||(id==='WOMEN_NETWORK'?'Rede de proteção e apoio à mulher':id);
 window.ACU_R87_UI={groups,mapping,group,network,matches,options,normalize,controls,shortName,label};
})();
