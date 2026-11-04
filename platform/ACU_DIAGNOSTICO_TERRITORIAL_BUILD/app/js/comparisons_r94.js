/* R94: comparable estimates and police records, with source and age kept separate. */
(()=>{'use strict';
 const D=window.ACU_R94_DATA;
 const E=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const N=(x,d=1)=>Number.isFinite(x)?x.toLocaleString('pt-BR',{maximumFractionDigits:d}):'—';
 const P='R94_POBREZA_PLANILHA',V='R94_VIOLENCIA_AMAZONIA';
 const stateByCity={belem:'PA',manaus:'AM',sao_luis:'MA',fortaleza:'CE',recife:'PE',salvador:'BA',rio_de_janeiro:'RJ',sao_paulo:'SP'};
 const regionByState={PA:'N',AM:'N',MA:'NE',CE:'NE',PE:'NE',BA:'NE',RJ:'SE',SP:'SE'};
 const violenceState={belem:'PA',manaus:'AM',sao_luis:'MA_AL'};
 const severity=[['total','Alguma privação'],['intermediate','Privação intermediária'],['extreme','Privação extrema']];
 const numeric=x=>Number.isFinite(x);
 function poverty(city){
  const p=D.poverty,year=Math.max(...p.years),uf=stateByCity[city],region=regionByState[uf],ids=[uf,region,'BR'];
  const g=id=>p.series[id],label=id=>(g(id).level==='region'?'Região ':'')+g(id).label,cols=ids.map(id=>[id,label(id)]);
  const method={workbook_projection:'Percentual × projeção populacional',workbook_absolute_thousands:'Estimativa da planilha, convertida de milhares',regional_sum:'Soma das estimativas estaduais',report_table_04:'Relatório UNICEF, Tabela 04 (p. 22)'};
  const rows=p.metrics.map(m=>{
   const cell=(id,y,s='total')=>g(id).years[y]?.metrics[m.id]?.[s];
   const records=p.years.flatMap(y=>ids.flatMap(id=>severity.map(([s,level])=>{
    const v=cell(id,y,s);
    return {id,y,level,value:v?.pct??null,count:v?.n??null,denominator:g(id).years[y]?.population??null,
     provenance:method[v?.nMethod]||''};
   })));
   return {key:'poverty94|'+m.id,indicator_id:'r94_poverty_'+m.id,label:m.label,period:String(year),year,
    unit:'%',universe:'Pessoas de 0 a 17 anos',definition:m.id==='overall'?p.source.definitions:'Privação em '+m.label.toLocaleLowerCase('pt-BR')+'. Idade de aplicação: '+m.applicableAge+' anos. Os percentuais do quadro usam todos os residentes de 0 a 17 anos no denominador.',
    source_ids:[P],source_short:'UNICEF · PNAD Contínua',lineage_id:'R94_POBREZA_'+m.id,
    limitation:p.source.countMethod+' '+p.source.seriesPrecision+' '+p.source.missingness,
    records,geo:ids.map(id=>({id,label:label(id),level:g(id).level})),cols,countKind:'estimated',
    values:Object.fromEntries(ids.map(id=>[id,cell(id,year)?.pct??null])),
    counts:Object.fromEntries(ids.map(id=>[id,cell(id,year)?.n??null]))};
  });
  return {rows,cols,uf,region};
 }
 function violence(city){
  const v=D.violence,year=2023,geo=new Map(v.geographies.map(g=>[g.id,g]));
  const ids=[...(violenceState[city]?[city,violenceState[city]]:[]),'AL','BR_EX_AL','BR'].filter(x=>geo.has(x));
  const cols=ids.map(id=>[id,geo.get(id).label]);
  const rows=v.metrics.map(m=>{
   const observations=m.observations.filter(o=>ids.includes(o.geo)&&o.age==='0-19');
   const obs=id=>observations.find(o=>o.geo===id&&o.year===year);
   return {key:'violence94|'+m.id,indicator_id:'r94_amazonia_'+m.id,label:m.label,period:String(year),year,cols,
    unit:'taxa por 100 mil pessoas de 0 a 19 anos',universe:'Pessoas de 0 a 19 anos',
    definition:m.definition||m.label,source_ids:[V],source_short:'UNICEF e FBSP · Amazônia Legal',lineage_id:'R94_VIOLENCIA_AMAZONIA_'+m.id,
    limitation:'Registros policiais; a cobertura e a capacidade de notificação variam. O recorte maranhense inclui apenas os municípios da Amazônia Legal. Nenhum total foi calculado a partir de taxa arredondada.',
    values:Object.fromEntries(ids.map(id=>[id,obs(id)?.rate??null])),counts:Object.fromEntries(ids.map(id=>[id,obs(id)?.count??null])),
    geo:ids.map(id=>geo.get(id)),countKind:'registered',
    records:observations.map(o=>({id:o.geo,y:o.year,value:o.rate??null,count:o.count??null,provenance:o.ref||m.table||'',page:o.page??m.page??null}))};
  });
  return {rows,cols,covered:!!violenceState[city]};
 }
 const wrap=(html,kind)=>'<div data-r94-comparison="'+kind+'">'+html+'</div>';
 const value=(r,id)=>r?.values[id],count=(r,id)=>r?.counts[id];
 const pval=(r,id)=>N(value(r,id))+'%'+(numeric(count(r,id))?' ('+N(count(r,id),0)+' pessoas, estimativa)':'');
 function povertyIntro(p){
  const index=p.rows.find(r=>r.indicator_id==='r94_poverty_overall');
  const main=p.rows.filter(r=>r!==index&&numeric(value(r,p.uf))).sort((a,b)=>value(b,p.uf)-value(a,p.uf))[0];
  const label=id=>index?.geo.find(g=>g.id===id)?.label;
  const base=index?.records.find(x=>x.id===p.uf&&x.y===2017&&x.level===severity[0][1]);
  const extreme=index?.records.find(x=>x.id===p.uf&&x.y===2023&&x.level===severity[2][1]);
  const delta=numeric(base?.value)&&numeric(value(index,p.uf))?value(index,p.uf)-base.value:null;
  return '<p class="r85-note">'+(numeric(value(index,p.uf))?'<strong>'+E(label(p.uf))+' · 2023.</strong> Pelo menos uma privação atingia '+N(value(index,p.uf))+'% das pessoas de 0 a 17 anos (estimativa de '+N(count(index,p.uf),0)+' pessoas). O percentual foi de '+E(N(value(index,p.region))+'%')+' na '+E(label(p.region))+' e de '+E(N(value(index,'BR'))+'%')+' no Brasil.'+(numeric(delta)?' Em 2017, eram '+N(base.value)+'% no estado; diferença de '+(delta>0?'+':'')+N(delta)+' p.p. em 2023.':'')+' ':'')+(numeric(extreme?.value)?'A privação extrema alcançava '+N(extreme.value)+'% ('+N(extreme.count,0)+' pessoas, estimativa). ':'')+(main?'A dimensão mais frequente foi '+E(main.label.toLocaleLowerCase('pt-BR'))+': '+E(pval(main,p.uf))+'. ':'')+'As comparações são descritivas. O índice combina sete dimensões e é diferente da pobreza monetária acima. A fonte não fornece estimativas para a capital ou o território.</p>';
 }
 function violenceIntro(v,city){
  const m=v.rows.find(r=>/mvi|mort.*violent/i.test(r.indicator_id+' '+r.label)),s=v.rows.find(r=>/estupro/i.test(r.label));
  const part=(r,title)=>numeric(value(r,city))&&numeric(value(r,'AL'))?title+': '+N(value(r,city))+' na capital e '+N(value(r,'AL'))+' na Amazônia Legal. ':'';
  const from=r=>r?.records.find(x=>x.id==='AL'&&x.y===2021)?.count,to=r=>count(r,'AL');
  const trend=[from(m),to(m),from(s),to(s)].every(numeric)?'Na Amazônia Legal, de 2021 a 2023, as mortes violentas registradas passaram de '+N(from(m),0)+' para '+N(to(m),0)+' e os registros de estupro e estupro de vulnerável, de '+N(from(s),0)+' para '+N(to(s),0)+'. ':'';
  return '<p class="r85-note">Relatório UNICEF e FBSP · 0 a 19 anos · taxas por 100 mil pessoas da faixa etária. '+(v.covered?E(part(m,'Mortes violentas intencionais')+part(s,'Estupro e estupro de vulnerável'))+'O relatório informa taxas para a capital em 2023 somente onde elas aparecem nos gráficos. ':'A capital selecionada não está na cobertura municipal deste relatório. ')+E(trend)+'As taxas usam a população do Censo 2022 nos três anos. Brasil fora da Amazônia Legal é um comparador distinto do Brasil total. Traço indica dado não publicado neste recorte.</p>';
 }
 function history(r){
  const isPoverty=r.countKind==='estimated',g=new Map(r.geo.map(x=>[x.id,x.label]));
  const refs=[...new Set(r.records.map(x=>x.page?'p. '+x.page+(x.provenance?' ('+x.provenance+')':''):x.provenance).filter(Boolean))];
  const method=isPoverty?'<p>As dimensões podem se sobrepor. A privação extrema está contida em “alguma privação”; não some as três linhas. '+E(D.poverty.source.regionalMethod)+' '+E(D.poverty.source.overallNationalDiscrepancy)+'</p>':'<p>Série de 2021 a 2023, na mesma faixa etária. A população do Censo 2022 é a referência nos três anos. Mortes por intervenção policial compõem o total de MVI e não devem ser somadas a ele. Não emendar aos registros de 0 a 17 anos do Anuário. Brasil total só aparece onde o relatório o divulga.</p>';
  const rows=r.records.filter(x=>numeric(x.value)||numeric(x.count));
  return method+(refs.length?'<p><strong>Localização na fonte:</strong> '+E(refs.join(' · '))+'</p>':'')+'<div class="r85-table-scroll" role="region" aria-label="Série da fonte" tabindex="0"><table class="r85-history"><caption>Histórico e recortes disponíveis</caption><thead><tr><th scope="col">Ano</th><th scope="col">Recorte</th>'+(isPoverty?'<th scope="col">Nível</th><th scope="col">Percentual</th><th scope="col">Pessoas estimadas</th>':'<th scope="col">Taxa por 100 mil</th><th scope="col">Vítimas registradas</th>')+'</tr></thead><tbody>'+rows.map(x=>'<tr><td>'+E(x.y)+'</td><th scope="row">'+E(g.get(x.id))+'</th>'+(isPoverty?'<td>'+E(x.level)+'</td>':'')+'<td>'+N(x.value,isPoverty?1:2)+(isPoverty&&numeric(x.value)?'%':'')+'</td><td>'+N(x.count,0)+'</td></tr>').join('')+'</tbody></table></div>';
 }
 function exportRows(r,cityName){
  const isPoverty=r.countKind==='estimated',g=new Map(r.geo.map(x=>[x.id,x]));
  return r.records.map(x=>({city:cityName,geography_id:x.id,geography:g.get(x.id).label,geographic_level:g.get(x.id).level,
   indicator_id:r.indicator_id,indicator:r.label,published_count:isPoverty?null:x.count,count:x.count,
   selected_measure:isPoverty?'estimated_percentage_and_people':'recorded_count_and_rate',selected_value:x.value,percentage:isPoverty?x.value:null,
   availability:numeric(x.value)||numeric(x.count)?'AVAILABLE':'SOURCE_NOT_AVAILABLE',unit:r.unit,period:x.y,definition:r.definition,
   numerator:x.count,denominator:x.denominator??null,lineage_id:r.lineage_id,source_ids:r.source_ids.join('; '),
   source:r.source_short,universe:r.universe,precision:isPoverty?'Estimativa; arredondamento conforme a fonte':'Precisão publicada; sem reconstrução',source_reference:[x.provenance,x.page?'p. '+x.page:''].filter(Boolean).join(' · '),privation_level:x.level||''}));
 }
 window.ACU_R94_COMPARISONS={poverty,violence,povertyIntro,violenceIntro,wrap,history,exportRows,sources:D.sources};
})();
