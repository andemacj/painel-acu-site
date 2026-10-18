/* A single current-year selector for all consumers; original sealed assets stay intact. */
(()=>{'use strict';
 const D=window.ACU_R87_EDUCATION_DATA,E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const current=(city,rows=[])=>D.cities[city]?[...rows.filter(r=>!['abandonment','distortion'].includes(r.family)),...D.cities[city].records]:rows;
 for(const registry of [window.ACU_R73_CONTEXT_DATA,window.ACU_R74_CONTEXT_DATA]){
  if(!registry)continue;registry.sources.push(...D.sources);
  for(const [id,meta] of Object.entries(D.cities)){const old=registry.cities[id]||{};registry.cities[id]={...old,...meta,records:current(id,old.records||[]),ideb:old.ideb||window.ACU_R81_CONTEXT_DATA?.cities[id]?.ideb||[],access:old.access||[],supplementary:old.supplementary||[],pending:old.pending||[],reference_year:2025};}
 }
 function historical(city,question){
  const q=String(question||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(),year=+(q.match(/\b(20\d{2})\b/)||[])[1];
  if(!D.cities[city]||!year||year===2025||!/abandono|distor/.test(q))return null;
  const family=/abandono/.test(q)?'abandonment':'distortion',stage=/anos iniciais/.test(q)?'AI':/anos finais/.test(q)?'AF':/ensino medio/.test(q)?'EM':'EF',base=D.cities[city].records.find(r=>r.family===family&&r.stage===stage),r=base?.history.find(h=>h.year===year),c=D.cities[city];
  const text=v=>v==null?'Sem valor publicável':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:1})+'%';
  return {html:'<h2>'+E(base.title)+' · '+year+'</h2>'+(r?'<p>'+E(c.name)+' (capital): '+text(r.values.municipality)+'. '+E(c.state_name)+' (UF): '+text(r.values.state)+'. Brasil: '+text(r.values.brazil)+'. Todas as redes e localizações; ensino regular, '+E(stage)+'.</p><p>Agregados oficiais, sem atribuição aos moradores do território selecionado.</p>':'<p>Esse ano não está integrado neste recorte do acervo. Não foi substituído por outro período.</p>'),claims:r?[{indicator_id:base.indicator_id,year,values:r.values,evidence:r.evidence}]:[],source_ids:r?r.source_ids:[],city};
 }
 window.ACU_R87_EDUCATION={current,historical,data:D};
})();
