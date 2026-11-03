/* Geographic authority: exact UF code -> IBGE region, shared by every comparison. */
(()=>{'use strict';
 const D=ACU_R90_DATA;
 function forCity(city){const c=ACU_R84_CONTEXT_DATA.cities.find(c=>c.city_id===city),r=D.regions_by_uf[c?.state_code];if(!c||!r||r.code!==c.region_code)throw Error('R90: cidade/UF/região incompatível');return {...r,label:'Região '+r.name,city:c};}
 for(const dataset of [window.ACU_R75_SURVEYS,window.ACU_R81_CONTEXT_DATA].filter(Boolean))for(const [id,c] of Object.entries(dataset.cities)){
  const region=forCity(id);c.region_name=region.name;c.region_code=region.code;
  c.pense=c.pense.map(r=>{const q=D.pense_regions[r.indicator_id]?.[region.code];if(!q)throw Error('R90: agregado regional PeNSE ausente');const values={...r.values},precision={...r.precision},evidence={...r.evidence},availability={...r.availability};for(const o of [values,precision,evidence,availability])delete o.north;return {...r,values:{...values,region:q.value},precision:{...precision,region:q.precision},evidence:{...evidence,region:q.evidence},availability:{...availability,region:q.publication_status},comparison_region:{code:region.code,name:region.name},r90_edition:'20260525'};});
 }
 function migrateHash(){const p=new URLSearchParams(location.hash.slice(1));let changed=false;for(const k of ['pense_region','pnad_region','benchmark_region','comparison_region'])if(p.has(k)){p.delete(k);changed=true;}if(/^(north|norte|1)$/i.test(p.get('region')||'')){p.delete('region');changed=true;}if(changed)history.replaceState(history.state,'','#'+p);}
 window.ACU_R90_CONTEXT={forCity,migrateHash,violence:city=>D.fbsp[city]||[],sources:D.sources};
})();
