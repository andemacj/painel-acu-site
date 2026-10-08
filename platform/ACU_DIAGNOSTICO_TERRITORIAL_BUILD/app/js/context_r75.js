/* Municipal and survey context only; never writes territorial values or map state. */
(()=>{
 'use strict';
 const D=ACU_R74_CONTEXT_DATA,S=ACU_R75_SURVEYS,base=ACU_R74_CONTEXT,E=ACU_R72.escape,P=ACU_R75;
 const oldRows=c=>[...c.records,...c.supplementary,...c.ideb,...c.access];
 const source=id=>S.sources.find(s=>s.source_id===id)||D.sources.find(s=>s.source_id===id);
 const sourceIds=r=>[...new Set([r.source_id,...Object.values(r.evidence||{}).map(e=>e.source_id)].filter(Boolean))];
 const links=r=>sourceIds(r).map(source).filter(Boolean).map(s=>'<a href="'+E(s.official_url)+'" target="_blank" rel="noopener">'+E(s.institution+' · '+s.title)+'</a>').join(' · ');
 const fmt=(v,r)=>v==null?'Sem dado':P.number(v,r.family==='access'?2:1)+(r.family==='ideb'?'':r.family==='access'?' km':'%');
 function method(c,r){
   const survey=r.family==='pnad'||r.family==='pense',geo=[['municipality',c.name],['state',c.state],['brazil','Brasil']];
   const precision=survey?'<p><b>Precisão publicada:</b></p>'+geo.map(([key,label])=>{const q=r.precision[key];return '<p>'+E(label)+': '+(q?.ci_lower!=null?'IC95 '+P.number(q.ci_lower,2)+'–'+P.number(q.ci_upper,2)+'%; ':'IC não disponibilizado neste agregado; ')+(q?.cv_raw!==undefined?'CV oficial: '+E(q.cv_raw)+(Number.isFinite(Number(String(q.cv_raw).replace(',','.')))?'%.':'.'):q?.cv!=null?'CV '+P.number(q.cv,2)+'%.':'')+' '+E(q?.flag||'Sem medida publicável.')+'</p>';}).join(''):'';
   return '<details class="r75-row-method"><summary>Fonte e metodologia</summary><p>'+links(r)+'</p><p><b>Período:</b> '+E(r.period||(r.family==='pnad'?r.year+' · segundo trimestre':r.year))+'.</p>'+(r.filters?'<p><b>Filtros e referência:</b> '+E(r.filters)+'</p>':'')+'<p><b>Universo:</b> '+E(r.short_universe||r.universe||r.definition||'Conforme fonte e rede indicadas.')+(r.network?' Rede '+E(r.network)+', localização urbana.':'')+'</p><p><b>Definição:</b> '+E(r.definition||r.title)+'</p>'+(r.denominator?'<p><b>Denominador:</b> '+E(String(r.denominator))+'</p>':'')+(r.category?'<p><b>Categoria:</b> '+E(r.category)+'</p>':'')+precision+'<p><b>Limitação:</b> '+E(r.limitations|| (survey?'Estimativa amostral. Comparação descritiva, sem teste de significância ou inferência causal. Resultados não representam bairros, setores, APs ou territórios ACU.':'Resultados municipais, com comparabilidade condicionada à rede, etapa e localização.'))+'</p>'+(survey?'<p>Taxa diretamente publicada. Numerador e denominador numéricos não reconstruídos. <a href="governance/r75/SURVEY_LINEAGE.json" target="_blank">Rastreabilidade das células</a></p>':'<p><a href="governance/context_r74/CONTEXT_DICTIONARY.json" target="_blank">Definições e evidências do contexto</a></p>')+'</details>';
 }
 function table(city,rows,caption,local=false){
  if(!rows.length)return '';
  const c=D.cities[city],levels=local?[['municipality',c.name]]:[['municipality',c.name],['state',c.state],['brazil','Brasil']];
  return '<div class="r75-context-scroll"><table class="r75-context-table"><caption>'+E(caption)+'</caption><thead><tr><th>Indicador</th>'+levels.map(([,name])=>'<th>'+E(name)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr data-context-indicator="'+E(r.indicator_id)+'" data-family="'+P.profile(city,r.indicator_id).family+'"><th scope="row">'+E(r.title)+'<small>'+r.year+(r.network?' · '+E(r.network)+' · urbana':'')+' · '+E(r.family==='ideb'?'índice 0–10':r.family==='access'?'km':'%')+'</small>'+method(c,r)+'</th>'+levels.map(([key])=>'<td data-context-level="'+key+'" data-value="'+(r.values[key]??'')+'">'+(r.availability?.[key]==='INCOMPATIBLE_UNIVERSE'?'<span title="Brasil urbano e rural, diferente do município e da UF urbanos">Recorte distinto¹</span>':fmt(r.values[key],r))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>';
 }
 const fold=(title,body,opened=false)=>body?'<details class="r75-context-block"'+(opened?' open':'')+'><summary>'+E(title)+'</summary>'+body+'</details>':'';
 function pense(city,primary=true){
  const rows=S.cities[city].pense,keys=['bullying','cyber','journey','sadness'],first=rows.filter(r=>keys.includes(r.key)),others=rows.filter(r=>!keys.includes(r.key));
  return '<section data-context-family="pense"><p class="r75-short-note">PeNSE 2024 · escolares de 13–17 anos · redes pública e privada. São escolares elegíveis, não todos os adolescentes residentes.</p>'+table(city,first,'Saúde escolar e proteção · contexto da capital')+fold('Ver indicadores PeNSE · '+others.length+' adicionais',table(city,others,'Outros indicadores elegíveis · filtros próprios em cada linha'))+'</section>';
 }
 function render(city,geo,theme,indicator,current){
  const c=D.cities[city];if(!c)return '';
  const edu=/educ|alfabet|lit_/i.test(theme+' '+indicator),viol=/viol|pense|saude/i.test(theme+' '+indicator),living=theme==='R71_HOUSEHOLDS'||/living|wash|renda|income|domicil/i.test(theme+' '+indicator);
  const primary=[...c.ideb.filter(r=>r.primary),...c.records.filter(r=>r.stage==='EF')];
  const education=table(city,primary,'Educação · Inep · contextos e períodos próprios')+'<small>¹ Ideb dos anos iniciais: Brasil da rede pública excluído por universo urbano/rural distinto.</small>'+table(city,S.cities[city].pnad,'PNAD Contínua · Educação 2025 · moradores · 2º trimestre')+fold('Outras etapas e rede estadual',table(city,[...c.ideb.filter(r=>!r.primary),...c.records.filter(r=>r.stage!=='EF')],'Recortes escolares complementares'));
  const wash=table(city,c.supplementary,'WASH nas escolas · matrículas de escolas estaduais e municipais ativas',true);
  const access=table(city,c.access,'Distâncias geométricas em linha reta · não medem acesso escolar',true);
  const general=!edu&&!viol&&!(living&&wash);
  let lead=edu?education:viol?pense(city):living&&wash?wash:table(city,S.cities[city].pnad,'PNAD Contínua · frequência escolar · moradores · 2º trimestre de 2025');
  const reading=current?'<div class="r75-current-reading"><strong>'+E(current.label)+'</strong><span>'+E(current.value)+'</span><small>'+E(current.period||'')+' · '+E(current.unit||'')+'</small></div>':'';
  return '<section class="r73-context r75-context" data-city="'+city+'"><header><h2>'+E(geo.name)+'</h2><p>Contexto da capital · '+E(c.name)+' / '+E(c.state)+'</p></header>'+reading+'<p class="r75-short-note">As tabelas abaixo se referem à capital inteira. A seleção territorial não altera esses valores.</p>'+lead+(edu?'':fold(general?'Educação · Inep':'Educação · Inep e PNAD Contínua',general?table(city,primary,'Educação · Inep · contextos e períodos próprios')+fold('Outras etapas e rede estadual',table(city,[...c.ideb.filter(r=>!r.primary),...c.records.filter(r=>r.stage!=='EF')],'Recortes escolares complementares')):education))+(viol?'':fold('Saúde escolar e proteção · PeNSE 2024',pense(city)))+(living&&wash?'':fold('WASH nas escolas',wash))+fold('Dispersão e afastamento geométrico',access)+fold('Como interpretar · cobertura e pendências','<p>Comparações descritivas. PNAD pesquisa moradores; PeNSE pesquisa escolares elegíveis; Inep registra escolas e matrículas. Esses universos não são intercambiáveis. As taxas municipais não são atribuídas ao território ACU.</p><p>PNDS: pendência documental histórica separada. <a href="'+E(D.pnds.methodology)+'" target="_blank">Registro PNDS</a>.</p>')+'</section>';
 }
 function methodology(city){
   const all=[...S.cities[city].pnad,...S.cities[city].pense];
   return fold('PNAD Contínua e PeNSE · fontes dos indicadores de contexto',table(city,all,'Agregados oficiais · fontes e precisão por indicador')+'<p><a href="governance/r75/SURVEY_AGGREGATES.csv">Baixar agregados em precisão original</a> · <a href="governance/r75/SURVEY_SOURCE_REGISTRY.json" target="_blank">Registro das fontes</a></p>')+base.methodology(city);
 }
 function answer(city,question){
  const q=String(question||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  if(!/pnad|pense|bullying|humilh|preservativo|tristeza|cyber|escolarizacao|frequencia.*escola/.test(q))return base.answer(city,question);
  const isPense=/pense|bullying|humilh|preservativo|tristeza|cyber/.test(q),rs=S.cities[city][isPense?'pense':'pnad'];
  const wanted=/preservativo/.test(q)?'condom':/bullying|humilh/.test(q)?'bullying':/tristeza/.test(q)?'sadness':/cyber/.test(q)?'cyber':null,rows=wanted?rs.filter(r=>r.key===wanted):rs;
  return {html:'<h2>Contexto da capital · '+E(D.cities[city].name)+'</h2><p>'+ (isPense?'PeNSE 2024: escolares elegíveis de 13–17 anos; filtros condicionais em cada linha.':'PNAD Contínua: moradores; Educação 2025, segundo trimestre.')+' Não representa o território prioritário selecionado.</p>'+table(city,rows,'Estimativas oficiais · comparação descritiva'),claims:rows.map(r=>({indicator_id:r.indicator_id,year:r.year,unit:r.unit,geography:D.cities[city].ibge7,source_id:r.source_id,values:r.values,evidence:r.evidence,precision:r.precision})),source_ids:[...new Set(rows.flatMap(sourceIds))],city};
 }
 window.ACU_R75_CONTEXT={render,methodology,answer,data:city=>D.cities[city]};
 window.ACU_R73_CONTEXT=window.ACU_R75_CONTEXT;
})();
