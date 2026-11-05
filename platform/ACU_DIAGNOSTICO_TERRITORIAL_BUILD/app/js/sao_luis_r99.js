/* São Luís: explicit coverage, direct municipal context and one audited formula correction. */
(() => {
  'use strict';
  const D=window.ACU_R99_SL_DATA,cache=new WeakMap(),audit=new Map(D.audit.by_indicator.map(r=>[r.indicator_id,r]));
  const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const finite=x=>typeof x==='number'&&Number.isFinite(x),fmt=(x,unit)=>finite(x)?x.toLocaleString('pt-BR',{maximumFractionDigits:unit==='%'?1:unit==='pessoas'||unit==='domicílios'||Number.isInteger(x)?0:2})+(unit==='%'?'%':''):'—';
  let state=null,bridge=null,panel=null;
  function apply(city,original){
    if(city!=='sao_luis')return original;if(cache.has(original))return cache.get(original);
    const values={...original.values};values['2111300']={...values['2111300']};
    for(const [id,cell] of Object.entries(D.municipal)){
      if(values['2111300'][id]?.value!=null)throw Error('R99 cannot replace a published municipal observation: '+id);
      values['2111300'][id]={...cell};
    }
    for(const row of D.corrections){
      const old=values[row.geography_id][row.indicator_id];
      if(JSON.stringify(old)!==JSON.stringify(row.before))throw Error('R99 literacy predecessor differs: '+row.geography_id);
      if(values[row.geography_id]===original.values[row.geography_id])values[row.geography_id]={...values[row.geography_id]};
      values[row.geography_id][row.indicator_id]={...row.after};
    }
    const catalog=original.catalog.map(m=>m.indicator_id==='lit_15_19_nonliterate_pct'?{...m,aggregation_rule:'SUM(V00644 - V00748) / SUM(V00644) * 100',definition:'Percentual de pessoas de 15–19 anos não alfabetizadas, dividido pelo total publicado da mesma faixa etária. Correção R99 da soma indevida na fórmula anterior.',r99_corrected:true}:m);
    const result={...original,values,catalog,sources:[...original.sources,...D.sources],r99_audit:D.audit};cache.set(original,result);return result;
  }
  const mapCount=m=>audit.get(m?.indicator_id)?.planning_units_available||0;
  function sortMetrics(rows,coverage){return [...rows].sort((a,b)=>(a.indicator_id==='demo_population_total_n'?-1:b.indicator_id==='demo_population_total_n'?1:(coverage?coverage(b).available-coverage(a).available:mapCount(b)-mapCount(a)))||a.label.localeCompare(b.label,'pt-BR'));}
  const optionLabel=(m,c)=>m.label+' · '+c.available+'/'+c.total+' '+c.label;
  function openMunicipal(){
    const data=state.data,rows=data.catalog.filter(m=>String(m.period)==='2022'&&!/^SL_/.test(m.indicator_id)&&finite(data.values['2111300']?.[m.indicator_id]?.value)),themes=[...new Set(rows.map(r=>r.theme))];
    const sourceBy=id=>data.sources.find(s=>s.source_id===id);
    const content=document.querySelector('#detail-content'),dialog=document.querySelector('#detail-dialog');
    document.querySelector('#detail-title').textContent='São Luís · contexto municipal';
    content.innerHTML='<article class="r99-municipal" data-r99-municipal-dialog><p class="r99-kicker">Contexto municipal · Censo 2022</p><h2>São Luís em números</h2><p>Estes valores representam o município inteiro. O mapa continua mostrando as unidades de planejamento ou os setores selecionados.</p>'+
      '<p>'+D.audit.municipal_added+' resultados municipais acrescentados diretamente de agregados do IBGE. As lacunas nas UPs permanecem quando há componentes ausentes ou suprimidos.</p>'+
      '<label class="r99-search">Buscar indicador<input type="search" data-r99-municipal-search placeholder="Ex.: alfabetização, água, adolescentes"></label><p data-r99-municipal-status role="status">'+rows.length+' resultados publicados no acervo municipal.</p>'+
      themes.map(theme=>'<details data-r99-municipal-theme><summary>'+esc(theme)+'<small>'+rows.filter(r=>r.theme===theme).length+' resultados</small></summary><div class="r99-table-wrap"><table><thead><tr><th>Indicador</th><th>Valor</th><th>Universo e fonte</th></tr></thead><tbody>'+rows.filter(r=>r.theme===theme).map(m=>{
        const c=data.values['2111300'][m.indicator_id],source=sourceBy(c.source_id||m.source_id),url=source?.official_url||source?.url,universe=c.universe||m.universe||'Conforme definição da fonte.';
        return '<tr data-r99-municipal-row data-search="'+esc((m.label+' '+theme).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())+'"><th>'+esc(m.label)+'<small>'+esc(m.period)+' · '+esc(m.unit)+'</small></th><td>'+esc(fmt(c.value,m.unit))+'</td><td><span>'+esc(universe)+'</span>'+(url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(source.institution||'Fonte')+' · fonte</a>':'')+'<details><summary>Cálculo e proveniência</summary><p>'+esc(c.aggregation_rule||m.aggregation_rule)+'</p><p>Numerador: '+esc(c.numerator??'Não aplicável')+'; denominador: '+esc(c.denominator??'Não aplicável')+'.</p><p>'+esc(c.lineage_id||m.lineage_id)+'</p></details></td></tr>';
      }).join('')+'</tbody></table></div></details>').join('')+
      '<p class="r99-note">Cada produto conserva seu universo. Pessoas, domicílios e faces de logradouro têm denominadores distintos. Uma publicação municipal não autoriza preencher uma UP.</p></article>';
    content.querySelector('[data-r99-municipal-search]').addEventListener('input',e=>{
      const q=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();let count=0;
      content.querySelectorAll('[data-r99-municipal-theme]').forEach(group=>{let n=0;group.querySelectorAll('[data-r99-municipal-row]').forEach(row=>{row.hidden=!row.dataset.search.includes(q);if(!row.hidden)n++;});group.hidden=!n;group.open=Boolean(q&&n);count+=n;});
      content.querySelector('[data-r99-municipal-status]').textContent=count+' resultados encontrados.';
    });
    if(!dialog.open)dialog.showModal();content.querySelector('input').focus();
  }
  function mount(s){
    state=s;
    if(s.cityId!=='sao_luis'||s.module!=='panorama'||s.theme==='FCU_2022'){panel?.remove();panel=null;return;}
    const rail=document.querySelector('.r92-map-rail');if(!rail)return;
    if(!panel?.isConnected){panel=document.createElement('section');panel.className='r99-sl-coverage';panel.dataset.r99SlCoverage='';panel.setAttribute('aria-label','Cobertura dos dados de São Luís');rail.append(panel);}
    const m=bridge?.metric?.(),a=audit.get(m?.indicator_id),c=m&&bridge?.mapCoverage?.(m),geo=s.data.geographies.find(g=>g.id===s.geographyId),cell=m&&bridge?.cell?.(s.geographyId,m.indicator_id),isUP=geo?.level==='INCID_PLANNING_UNIT';
    const open=panel.querySelector('details')?.open;
    panel.innerHTML='<details'+(open?' open':'')+'><summary><strong>'+(a?c.available+' de '+c.total+' '+c.label+' com dados':'Dados por setor · Censo 2022')+'</strong><span>Cobertura em São Luís</span></summary>'+
      (a?'<p>As cores representam '+esc(m.label.toLocaleLowerCase('pt-BR'))+'. No mapa: '+c.available+' de '+c.total+' '+c.label+' com valor. Na cidade: '+a.planning_units_available+' de 30 UPs com agregado exato publicado.</p>':'<p>Consulte a legenda para ver quantos setores têm resultado publicado. A mudança de escala preserva as supressões.</p>')+
      (isUP&&a&&!finite(cell?.value)?'<p class="r99-selected-nd"><b>'+esc(geo.name)+':</b> '+esc(cell?.nd_explanation||'Há componentes ausentes ou suprimidos; não há agregado exato publicável.')+'</p>':'')+
      '<p>UP é uma unidade de planejamento do INCID. São Luís não possui bairros definidos por lei. Valores municipais e estimativas do INCID não são transferidos para as UPs do painel.</p><a href="https://www.saoluis.ma.gov.br/sao-luis-em-dados---2010-e-2022/" target="_blank" rel="noopener noreferrer">Regionalização e dados do INCID</a></details>'+
      '<div class="r99-sl-actions">'+(s.theme!=='R71_HOUSEHOLDS'?'<button type="button" data-r99-sectors>Domicílios por setor</button>':'')+'<button type="button" data-r99-municipal>Dados do município</button></div>';
    panel.querySelector('[data-r99-sectors]')?.addEventListener('click',()=>bridge?.sectors?.());panel.querySelector('[data-r99-municipal]').onclick=openMunicipal;
  }
  window.ACU_R99_SL={apply,mapCount,sortMetrics,optionLabel,mount,connect(s,b){state=s;bridge=b;},snapshot:()=>({addedMunicipal:D.audit.municipal_added,correctedCells:D.corrections.length,city:state?.cityId,visible:Boolean(panel?.isConnected)})};
})();
