/* Additive city context: approved PNAD domains never become territorial map values. */
(() => {
  'use strict';
  const E = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const data = () => window.ACU_R84_CONTEXT_DATA;
  const valid = row => row?.publication_status === 'APPROVED' && typeof row.estimate_pct === 'number' && Number.isFinite(row.estimate_pct);
  const key = (id,level,code,year) => [id,level,code,year].join('|');
  const fmt = value => {
    if (typeof value !== 'number' || !Number.isFinite(value)) return 'N/D';
    const digits = value > 0 && value < .1 || value < 100 && value > 99.9 ? 3 : 1;
    return value.toLocaleString('pt-BR',{minimumFractionDigits:1,maximumFractionDigits:digits}) + '%';
  };
  const interval = row => valid(row) && typeof row.ci95_lower_pct === 'number' && typeof row.ci95_upper_pct === 'number'
    ? fmt(row.ci95_lower_pct) + ' a ' + fmt(row.ci95_upper_pct) : 'Não disponível';
  let index = null;
  function lookup(id,level,code,year) {
    if (!index) index = new Map((data()?.estimates || []).map(r => [r.estimate_key,r]));
    return index.get(key(id,level,code,year));
  }
  function scope(city,selection) {
    if (selection.display_geography_level === 'municipality') return city.city_name + ' · estimativa da capital';
    if (selection.display_geography_level === 'state') return city.state_name + ' · contexto estadual de ' + city.city_name;
    return city.city_name + ' · contexto municipal indisponível';
  }
  function compare(indicator,city,selection) {
    const year = selection.reference_year;
    const candidates = [['municipality',city.context_city_code,city.city_name + ' · capital'],['state',city.state_code,city.state_name + ' · estado'],['region',city.region_code,city.region_name],['brazil','1','Brasil']];
    const seen = new Set(), available = [], unavailable = [];
    for (const [level,code,label] of candidates) {
      const k = level + ':' + code;
      if (seen.has(k)) continue;
      seen.add(k);
      const row = lookup(indicator.indicator_id,level,code,year);
      if (valid(row)) available.push({row,label}); else unavailable.push(label);
    }
    const rows = available.map(({row,label}) => {
      const ci = typeof row.ci95_lower_pct === 'number' && typeof row.ci95_upper_pct === 'number';
      return '<li data-r84-comparator="'+E(row.geography_level+':'+row.geography_code)+'" data-r84-year="'+year+'"><div class="r84-plot-label"><span>'+E(label)+'</span><strong>'+fmt(row.estimate_pct)+'</strong></div><div class="r84-plot" role="img" aria-label="'+E(label+': '+fmt(row.estimate_pct)+(ci?'; intervalo de confiança de 95% de '+interval(row):''))+'">'+(ci?'<span class="r84-whisker" style="left:'+row.ci95_lower_pct+'%;width:'+(row.ci95_upper_pct-row.ci95_lower_pct)+'%"></span>':'')+'<span class="r84-point" style="left:'+row.estimate_pct+'%"></span></div></li>';
    }).join('');
    return '<section class="r84-comparison"><h4>Comparação no mesmo ano · '+year+'</h4><p>Percentual de pessoas na faixa etária do indicador.</p>'+(rows?'<ul class="r84-plots">'+rows+'</ul><div class="r84-axis" aria-hidden="true"><span>0%</span><span>50%</span><span>100%</span></div><p class="r84-chart-key">Ponto: estimativa. Traço: intervalo de confiança de 95%.</p>':'<p>Não há estimativas aprovadas para esta comparação.</p>')+(unavailable.length?'<p class="r84-unavailable-comparators">Sem estimativa aprovada: '+E(unavailable.join('; '))+'.</p>':'')+'</section>';
  }
  function history(indicator,city) {
    const years = data().history_years[indicator.indicator_id] || [];
    const body = years.map(year => {
      const cap = lookup(indicator.indicator_id,'municipality',city.context_city_code,year), state = lookup(indicator.indicator_id,'state',city.state_code,year);
      return '<tr><th scope="row">'+year+'</th><td data-r84-history-level="municipality">'+(valid(cap)?fmt(cap.estimate_pct):'<span title="Estimativa indisponível para este recorte">N/D</span>')+'</td><td data-r84-history-level="state">'+(valid(state)?fmt(state.estimate_pct):'<span title="Estimativa indisponível para este recorte">N/D</span>')+'</td></tr>';
    }).join('');
    return '<div class="r84-history"><table><caption>Histórico · capital e estado</caption><thead><tr><th scope="col">Ano</th><th scope="col">'+E(city.city_name)+'<small>Capital</small></th><th scope="col">'+E(city.state_name)+'<small>Estado</small></th></tr></thead><tbody>'+body+'</tbody></table></div><p class="r84-history-note">N/D: estimativa não disponível ou sem precisão suficiente. Os períodos não investigados aparecem como lacunas. Variações são descritivas e não demonstram impacto da Agenda.</p>';
  }
  function card(indicator,city) {
    const selection = data().display.find(r => r.context_city_code === city.context_city_code && r.indicator_id === indicator.indicator_id);
    if (!selection) throw Error('R84: seleção de exibição ausente');
    const row = selection.estimate_key ? index.get(selection.estimate_key) : null;
    const approved = valid(row);
    const why = selection.fallback_used ? '<p class="r84-fallback">Estimativa municipal sem precisão suficiente neste ano. O cartão apresenta o estado.</p>' : '';
    const quality = approved ? '<p class="r84-precision">Estimativa amostral · IC 95%: '+interval(row)+'.'+(row.quality_status==='APPROVED_CAUTION'?' Precisão mais limitada; interpretar com cautela.':'')+'</p>' : '';
    const older = selection.last_approved_municipal_year && selection.last_approved_municipal_year < selection.reference_year ? '<p class="r84-history-note">Última estimativa municipal aprovada: '+selection.last_approved_municipal_year+'. Consulte o histórico.</p>' : '';
    return '<article class="r84-card" data-r84-indicator="'+E(indicator.indicator_id)+'" data-r84-geography-level="'+E(selection.display_geography_level||'unavailable')+'" data-r84-geography-code="'+E(selection.display_geography_code||'')+'" data-r84-reference-year="'+selection.reference_year+'" data-r84-fallback="'+selection.fallback_used+'"><header><h3>'+E(indicator.short_label)+'</h3><p>'+indicator.age_min+'–'+indicator.age_max+' anos</p></header>'+(approved?'<strong class="r84-value" data-r84-value="'+row.estimate_pct+'">'+fmt(row.estimate_pct)+'</strong>':'<p class="r84-missing">Estimativa indisponível para este recorte</p>')+'<p class="r84-scope">'+E(scope(city,selection))+'</p><p class="r84-period">'+selection.reference_year+'</p>'+why+'<p class="r84-direction">'+(indicator.desired_direction==='increase'?'Referência: ampliar o acesso':'Referência: reduzir')+'</p><details class="r84-detail"><summary>Comparação, histórico e definição</summary><div>'+compare(indicator,city,selection)+quality+older+history(indicator,city)+'<section class="r84-definition"><h4>O que este indicador mede</h4><p>'+E(indicator.public_definition)+'</p><p>'+E(indicator.public_limit)+'</p></section></div></details></article>';
  }
  function render(cityId) {
    const d = data(), city = d?.cities.find(c => c.city_id === cityId);
    if (!city || !d.estimates.some(valid)) return '';
    if (!index) index = new Map(d.estimates.map(r => [r.estimate_key,r]));
    return '<div class="r84-child-context" data-r84-context-city="'+E(city.context_city_code)+'"><header class="r84-context-header"><span class="r83-eyebrow">Infância e adolescência</span><h2>Infância e adolescência: contexto da cidade</h2><p>Seis indicadores para conhecer '+E(city.city_name)+' e comparar seu contexto com o estado, a região e o Brasil.</p><p class="r84-context-note">Cada cartão informa a geografia e o ano da estimativa. Estes dados não representam bairros ou territórios de intervenção.</p></header><div class="r84-card-grid">'+d.indicator_catalog.map(i => card(i,city)).join('')+'</div><details class="r84-sources"><summary>Fontes e critérios de leitura</summary><div><p>IBGE · PNAD Contínua. Percentuais estimados para pessoas, com pesos e desenho amostral da pesquisa. As faixas etárias e os períodos próprios dos temas são preservados.</p><p>Quando a estimativa da capital não atende aos critérios de precisão, é apresentado o estado no mesmo ano. Se o estado também não atende, o cartão fica sem valor; comparadores aprovados podem continuar visíveis.</p><ul>'+d.sources.map(s=>'<li><a href="'+E(s.url)+'" target="_blank" rel="noopener noreferrer">'+E(s.title)+'</a></li>').join('')+'</ul><p>A avaliação da precisão considera amostra, eventos, unidades de pesquisa, coeficiente de variação e intervalo de confiança. O critério conservador do projeto é aplicado às quatro escalas. Séries usam pesos revisados; a transição da Amostra Mestra iniciada em 2025 consta na documentação.</p></div></details></div>';
  }
  const original = window.ACU_R83_DIAGNOSTIC?.render;
  if (!original) throw Error('R84: componente de diagnóstico anterior não está disponível');
  window.ACU_R83_DIAGNOSTIC.render = function(cfg) {
    const html = original(cfg), context = render(cfg.city);
    if (!context) return html;
    const template = document.createElement('template'); template.innerHTML = html;
    const nav = template.content.querySelector('.r83-tabs'), registry = template.content.querySelector('#r83-source-registry');
    const button = document.createElement('button');button.type='button';button.id='r83-tab-child-context';button.dataset.r83Tab='child-context';button.setAttribute('role','tab');button.setAttribute('aria-controls','r83-panel-child-context');button.setAttribute('aria-selected','false');button.tabIndex=-1;button.textContent='Infância e adolescência';nav.append(button);
    const panel = document.createElement('section');panel.id='r83-panel-child-context';panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.hidden=true;panel.innerHTML=context;registry.before(panel);
    return template.innerHTML;
  };
  window.ACU_R84_CONTEXT = {render,lookup,valid,formatPercent:fmt,key};
})();
