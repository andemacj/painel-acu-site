/* Shared current-location overlay. No changes to original files, history, or rates. */
(()=>{'use strict';
 const previous=window.ACU_R87_LOCATIONS.apply,cache=new WeakMap(),D=window.ACU_R88_LOCATION_DATA;
 function eligible(row){return (!row.r88_publication_axis||row.r88_publication_axis==='PERMITTED')&&(!row.r88_location_axis||row.r88_location_axis==='CONFIRMED')&&row.map_eligible!==false&&row.latitude!=null&&row.longitude!=null&&row.latitude!==''&&row.longitude!==''&&Number.isFinite(Number(row.latitude))&&Number.isFinite(Number(row.longitude))&&!/NOT_AVAILABLE|INVALID|MISSING|CONFLICT|DERIVED_REQUIRES_REVIEW|CANDIDATE_REJECTED|NO_VALIDATED/.test(row.spatial_status||row.coordinate_status||row.location_status||'');}
 function locationLabel(row){return row.r88_publication_axis==='RESTRICTED_DOCUMENTED'?'Endereço e ponto protegidos pela fonte.':row.r88_publication_axis==='TO_VERIFY'?'Publicação do endereço a verificar.':row.r88_location_axis==='NOT_APPLICABLE'?'Registro sem ponto físico aplicável.':row.r88_cadastre_review_required?'Vínculo cadastral e localização a confirmar.':'Localização a confirmar; registro disponível no diretório.';}
 function redact(row,axis){const out={...row,...axis,map_eligible:false};for(const key of Object.keys(out)){if(/^(latitude|longitude|sector_id|physical_facility_id|colocation_group_size|colocation_reason|r88_current_neighborhood_id|r88_current_acu_program_territory_id|r87_current_acu_program_territory_id|district_id|district_name|subprefecture_id|subprefecture_name|neighborhood_id|neighborhood_name|neighborhood|territory|territory_id|acu_program_territory_id|analytical_neighborhood_id|analytical_acu_program_territory_id|inside_daico|inside_city_operaria_acu|inside_city_olimpica_acu|incid_up|administrative_region_id|planning_area_id)$/.test(key)||/address|endereco/i.test(key))out[key]=null;}out.address=axis.r88_publication_axis==='RESTRICTED_DOCUMENTED'?'Endereço protegido pela fonte':'Publicação do endereço a verificar';out.location_status=axis.r88_publication_axis;out.spatial_status=axis.r88_publication_axis;return out;}
 function apply(city,original){
  if(cache.has(original))return cache.get(original);
  const base=previous(city,original),patches=new Map((D.cities[city]||[]).map(p=>[p.kind+'|'+p.id,p])),states=new Map((D.states[city]||[]).map(r=>[r.kind+'|'+r.id,r]));
  const patch=(kind,rows)=>rows.map(row=>{const key=kind+'|'+row.id,s=states.get(key),p=patches.get(key);if(!s)return row;const axis={r88_location_axis:s.location_axis,r88_publication_axis:s.publication_axis,r88_cadastre_review_required:!!s.cadastre_review_required};if(s.publication_axis!=='PERMITTED')return redact(row,axis);if(!p)return {...row,...axis,...(s.cadastre_review_required?{physical_facility_id:null}:{}),map_eligible:false};return {...row,...p,...axis,address:p.r88_validated_address,official_address:p.r88_validated_address,address_display:p.r88_validated_address,source_ids:[...new Set([...(row.source_ids||[]),...p.location_source_ids])]};});
  const result={...base,schools:patch('schools',base.schools),equipment:patch('equipment',base.equipment),sources:[...base.sources,...D.sources.filter(s=>!base.sources.some(x=>x.source_id===s.source_id))],facts:{...base.facts}};
  const counts=D.counts.filter(r=>r.city===city),sc=counts.find(r=>r.kind==='schools'),ec=counts.find(r=>r.kind==='equipment');Object.assign(result.facts,{schools:sc.registered,spatial_schools:sc.map_after,school_spatial_coverage_pct:sc.after_coverage_pct,equipment:ec.registered,spatial_equipment:ec.map_after});
  if(city==='belem'){
   const a=window.ACU_BELEM_UX_R4_SPATIAL;
   if(!a.r88Applied){a.schools=patch('schools',a.schools);a.equipment=patch('equipment',a.equipment);a.metadata=structuredClone(a.metadata);a.r88Applied=true;
    for(const [kind,key] of [['schools','school_coverage'],['equipment','equipment_coverage']]){const c=counts.find(r=>r.kind===kind),m=a.metadata[key];m.spatialized_count=c.map_after;m.nonspatial_count=c.registered-c.map_after;m.inside_daico_spatialized_count=a[kind].filter(r=>eligible(r)&&r.inside_daico).length;m.outside_daico_spatialized_count=c.map_after-m.inside_daico_spatialized_count;if(kind==='schools')m.spatial_coverage_pct=c.after_coverage_pct;}
   }
  }
  if(city==='sao_paulo'&&D.network){
   const n=window.ACU_R77_DATA;
   for(const update of D.network.unit_updates){const u=n.units.find(u=>u.id===update.id);Object.assign(u,update);u.field_sources={...u.field_sources,location:update.location_source_ids};}
   n.aggregates=structuredClone(D.network.aggregates);n.summary.location=Object.fromEntries([...new Set(n.units.map(u=>u.location_status))].map(s=>[s,n.units.filter(u=>u.location_status===s).length]));
   for(const s of D.sources)if(!n.sources.some(x=>x.source_id===s.source_id))n.sources.push(s);
   result.values={...base.values};const known=new Set(n.metrics.map(m=>m.indicator_id));
   for(const a of n.aggregates){const gid=a.geography_id;if(result.values[gid]===base.values[gid])result.values[gid]={...base.values[gid]};result.values[gid]??={};for(const mode of ['COUNT','DISTANCE']){const id='R77_NETWORK_'+a.type+'_'+mode;if(!known.has(id))continue;const value=mode==='COUNT'?a.located_unit_count:a.distance_m==null?null:a.distance_m/1000;result.values[gid][id]={...result.values[gid][id],value,numerator:value,denominator:null,status:value==null?'SOURCE_NOT_AVAILABLE':'AVAILABLE',source_ids:[...new Set(['SRC_ACU_R77_SP_NETWORK',...a.source_ids])],nearest_unit_id:mode==='DISTANCE'?a.nearest_unit_id:null,period_label:'Localizações · 18/10/2026',r88_current_location_aggregate:true};}}
  }
  result.r88_location_coverage=counts;cache.set(original,result);return result;
 }
 window.ACU_R88_LOCATIONS={apply,eligible,locationLabel};window.ACU_R87_LOCATIONS.apply=apply;
})();
