(function () {
  "use strict";
  const A = window.ACUAnalytics;
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const unavailableExplanation = item => {
    if (item.value !== null) return "";
    if (item.nd_explanation) return ` ${item.nd_explanation}`;
    if (item.source_geography_label) return ` Dado disponível somente em ${item.source_geography_label}; nenhum valor foi distribuído para a geografia selecionada.`;
    return " A razão da indisponibilidade está registrada no evidence pack.";
  };
  const evidenceValue = item => item.count !== null && item.count !== undefined && item.percentage_of_total !== null && item.percentage_of_total !== undefined
    ? `${A.format(item.count,"pessoas")}, equivalentes a ${A.format(item.percentage_of_total,"%")} da população`
    : A.format(item.value,item.unit);
  function citations(pack) {
    const used = pack.evidence;
    const sources = [...new Set(used.map(item => item.source).filter(Boolean))].join("; ") || "Nenhuma fonte aplicável";
    const periods = [...new Set(used.map(item => item.period))].join("; ") || "N/D";
    const geographies = [...new Set(used.map(item => item.geography))].join("; ") || "N/D";
    const limitations = [...new Set(used.map(item => item.limitation).filter(Boolean))].slice(0, 4).join("; ") || "Consultar a disponibilidade e a granularidade de cada indicador.";
    return `<footer><strong>Fonte:</strong> ${esc(sources)}<br><strong>Período:</strong> ${esc(periods)}<br><strong>Geografia:</strong> ${esc(geographies)}<br><strong>Limitação relevante:</strong> ${esc(limitations)}</footer>`;
  }
  function governedSourceSection(pack, data) {
    const ids = [...new Set([
      ...pack.evidence.map(item => item.source_id),
      ...((pack.analysis_context && pack.analysis_context.program_territories) || []).map(item => item.source_id)
    ].filter(Boolean))];
    const items = ids.map(id => {
      const source = (data.sources || []).find(item => item.source_id === id);
      if (!source) return `<li><code>${esc(id)}</code> — fonte governada não resolvida</li>`;
      const name = source.title || source.source_name || source.name || id;
      const url = source.official_url || source.url || "";
      return `<li><code>${esc(id)}</code> — ${url ? `<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(name)}</a>` : esc(name)}</li>`;
    }).join("");
    return `<section class="report-section"><h3>Fontes</h3><ul class="evidence-list">${items || "<li>Nenhuma fonte aplicável.</li>"}</ul></section>`;
  }
  function characterizationItem(item) {
    if (item.value === null) return `<li><strong>${esc(item.label)}:</strong> <span class="tag missing">N/D · ${esc(item.availability)}</span>${esc(unavailableExplanation(item))}</li>`;
    return `<li><strong>${esc(item.label)}:</strong> ${esc(evidenceValue(item))}.</li>`;
  }
  class DeterministicProvider extends window.ACUAssistant.AssistantProvider {
    generateSummary(context) {
      const pack = context.evidencePack;
      const selected = pack.evidence.find(item => item.indicator_id === context.selectedIndicatorId);
      const ordered = [selected, ...pack.evidence.filter(item => item !== selected && item.value !== null)].filter(Boolean).slice(0, 7);
      const body = ordered.length ? ordered.map(item => `<li><strong>${esc(item.label)}:</strong> ${item.value === null ? `<span class="tag missing">N/D nesta geografia · ${esc(item.availability)}</span>${esc(unavailableExplanation(item))}` : esc(evidenceValue(item))}.</li>`).join("") : "<li>Não há valores disponíveis para a seleção atual.</li>";
      return { pack, html: `<h2>Diagnóstico rápido</h2><p>A leitura abaixo descreve evidências observadas para <strong>${esc(context.territoryName)}</strong>, sem atribuir causalidade ou produzir score.</p><ul class="evidence-list">${body}</ul><p>Ausências e dados não deriváveis permanecem identificados como N/D.</p>${citations(pack)}` };
    }
    characterizeProgramTerritories(context) {
      const pack = context.evidencePack;
      const sections = context.programTerritories.map(territory => {
        const territorial = pack.evidence.filter(item => item.claim_role === "PRIMARY_TERRITORIAL_CLAIM" && item.geography_id === territory.geographyId);
        const coverage = pack.evidence.filter(item => item.claim_role === "SPATIAL_COVERAGE_CONTEXT" && item.geography_id === territory.geographyId);
        const coverageItems = coverage.map(item => {
          const isSchool = item.indicator_id === "SPATIAL_SCHOOL_IDENTIFIED_ENTITY_COUNT";
          const noun = isSchool ? "escola" : "equipamento";
          const plural = isSchool ? "escolas" : "equipamentos";
          const participle = isSchool ? "identificadas" : "identificados";
          const observation = Number(item.value) === 0
            ? `${isSchool ? "Nenhuma" : "Nenhum"} ${noun} espacialmente ${isSchool ? "identificada" : "identificado"} na cobertura validada; isso não demonstra inexistência no território.`
            : `${A.format(item.value,"count")} ${plural} espacialmente ${participle} na cobertura validada.`;
          return `<li><strong>${esc(item.label)}:</strong> ${esc(observation)} <small>${esc(item.limitation)}</small></li>`;
        }).join("");
        return `<section class="report-section"><h3>${esc(territory.geographyName.replace(/\s+—.*$/,""))}</h3><ul class="evidence-list">${territorial.map(characterizationItem).join("") || "<li>Não há indicadores governados disponíveis para este recorte.</li>"}${coverageItems}</ul></section>`;
      }).join("");
      const combined = pack.evidence.filter(item => item.claim_role === "COMBINED_PROGRAM_TERRITORY_CLAIM");
      const joint = `<section class="report-section"><h3>Leitura conjunta</h3>${combined.length ? `<p>A síntese combinada preserva os territórios como recortes distintos e usa somente valores governados deriváveis:</p><ul class="evidence-list">${combined.map(characterizationItem).join("")}</ul>` : "<p>Não há síntese combinada exatamente derivável; os valores individuais permanecem separados.</p>"}<p>Esta leitura é descritiva e não produz ranking, score de vulnerabilidade, inferência de suficiência ou atribuição causal.</p></section>`;
      const limitations = [...new Set([...(pack.analysis_context.limitations || []), ...pack.evidence.map(item => item.limitation).filter(Boolean)])].slice(0, 8);
      const limitationSection = `<section class="report-section"><h3>Limitações</h3><ul class="evidence-list">${limitations.map(item => `<li>${esc(item)}</li>`).join("") || "<li>Consultar a disponibilidade de cada indicador.</li>"}</ul></section>`;
      return { pack, html: `<h2>Caracterização dos territórios da Agenda — ${esc(context.cityName)}</h2><p>Caracterização conjunta dos territórios programáticos ativos, baseada exclusivamente no evidence pack governado.</p>${sections}${joint}${limitationSection}${governedSourceSection(pack,context.data)}` };
    }
    compare(context) {
      const pack = context.evidencePack;
      const evidence = pack.evidence.filter(item => item.value !== null);
      const selected=evidence.filter(item=>item.indicator_id===context.selectedIndicatorId&&item.claim_role==="PRIMARY_TERRITORIAL_CLAIM");
      if(context.comparisonGeographies.length>12&&selected.length){
        const ordered=[...selected].sort((left,right)=>Number(left.value)-Number(right.value)),middle=Math.floor(ordered.length/2),median=ordered.length%2?Number(ordered[middle].value):(Number(ordered[middle-1].value)+Number(ordered[middle].value))/2,min=ordered[0],max=ordered[ordered.length-1],missing=context.comparisonGeographies.length-selected.length;
        const summary=`<ul class="evidence-list"><li><strong>Unidades selecionadas:</strong> ${esc(context.comparisonGeographies.length)}.</li><li><strong>Menor valor observado:</strong> ${esc(min.geography)} — ${esc(evidenceValue(min))}.</li><li><strong>Maior valor observado:</strong> ${esc(max.geography)} — ${esc(evidenceValue(max))}.</li><li><strong>Mediana descritiva:</strong> ${esc(A.format(median,min.unit))}.</li><li><strong>Sem valor governado:</strong> ${esc(missing)} unidade(s).</li></ul>`;
        return {pack,html:`<h2>Comparação territorial</h2><p>Síntese de uma seleção ampla, preservando todas as ${esc(context.comparisonGeographies.length)} unidades e suas evidências no pacote analítico.</p>${summary}<p>A amplitude e a mediana descrevem somente o indicador selecionado; não constituem score nem ranking de vulnerabilidade.</p>${citations(pack)}`};
      }
      const body = evidence.map(item => `<li><strong>${esc(item.geography)}:</strong> ${esc(item.label)} = ${esc(evidenceValue(item))}.</li>`).join("") || "<li>Comparação não disponível para a seleção.</li>";
      return { pack, html: `<h2>Comparação territorial</h2><p>Comparação intramunicipal do indicador selecionado. Valores municipais não são replicados em unidades submunicipais.</p><ul class="evidence-list">${body}</ul>${citations(pack)}` };
    }
    attention(context) {
      const pack = context.evidencePack;
      const items = context.attentionStatements.map(item => `<li>${esc(item.text)}</li>`).join("");
      return { pack, html: `<h2>O que merece atenção?</h2><p>Leitura focal para <strong>${esc(context.territoryName)}</strong>:</p><ul class="evidence-list">${items}</ul>${citations(pack)}` };
    }
    generateReport(context) {
      const pack = context.evidencePack;
      const groups = {};
      pack.evidence.forEach(item => { const metric = context.data.catalog.find(candidate => candidate.indicator_id === item.indicator_id); const theme = metric ? metric.theme : "Outros"; (groups[theme] ||= []).push(item); });
      const sections = Object.entries(groups).map(([theme, items]) => `<section class="report-section"><h3>${esc(theme)}</h3><ul>${items.map(item => `<li>${esc(item.label)}: <strong>${item.value === null ? `N/D nesta geografia · ${esc(item.availability)}` : esc(evidenceValue(item))}</strong></li>`).join("")}</ul></section>`).join("");
      return { pack, html: `<h2>Relatório territorial</h2><p><strong>${esc(context.cityName)} · ${esc(context.territoryName)}</strong></p>${sections || "<p>Não há indicadores disponíveis para compor o relatório.</p>"}<section class="report-section"><h3>Nota metodológica</h3><p>Indicadores descrevem condições observadas. Não demonstram impacto da Agenda Cidade UNICEF; serviços próximos não implicam acesso ou suficiência.</p></section>${citations(pack)}` };
    }
    answerQuestion(context) {
      const question = String(context.question || "").toLowerCase();
      if (context.actionType === "CHARACTERIZE_PROGRAM_TERRITORIES") return this.characterizeProgramTerritories(context);
      if (context.actionType === "SUMMARY") return this.generateSummary(context);
      if (context.actionType === "ATTENTION") return this.attention(context);
      if (/(?:0\s*(?:a|–|-)\s*19|0.?19|zero.*dezenove)/.test(question) && /(quant|pessoas|popula[cç][aã]o|vivem)/.test(question)) {
        const focus = context.evidencePack.evidence.find(item => item.indicator_id === "demo_age_0_19_n" && item.claim_role === "PRIMARY_TERRITORIAL_CLAIM");
        if (!focus) return { pack: context.evidencePack, html: `<h2>População de 0 a 19 anos</h2><p><strong>N/D.</strong> O evidence pack não contém o indicador governado solicitado; nenhuma estimativa foi produzida.</p>${citations(context.evidencePack)}` };
        if (focus.value === null) return { pack: context.evidencePack, html: `<h2>População de 0 a 19 anos</h2><p><strong>${esc(focus.geography)}: N/D.</strong></p><p>${esc(focus.nd_explanation || unavailableExplanation(focus).trim())}</p><p>Nenhuma imputação, interpolação ou redistribuição municipal foi aplicada.</p>${citations(context.evidencePack)}` };
        return { pack: context.evidencePack, html: `<h2>População de 0 a 19 anos</h2><p><strong>${esc(focus.geography)}:</strong> ${esc(evidenceValue(focus))}.</p><p>Contagem e percentual usam a mesma geografia e o mesmo período compatível.</p>${citations(context.evidencePack)}` };
      }
      if (/(?:15\s*(?:a|–|-)\s*19|15.?19)/.test(question) && /(quant|pessoas|popula[cç][aã]o|vivem)/.test(question)) {
        const focus = context.evidencePack.evidence.find(item => item.indicator_id === "demo_age_15_19_n" && item.claim_role === "PRIMARY_TERRITORIAL_CLAIM");
        if (!focus) return { pack: context.evidencePack, html: `<h2>Faixa de 15 a 19 anos</h2><p><strong>N/D.</strong> O evidence pack não contém o indicador governado solicitado; nenhuma estimativa foi produzida.</p>${citations(context.evidencePack)}` };
        if (focus.value === null) return { pack: context.evidencePack, html: `<h2>Faixa de 15 a 19 anos</h2><p><strong>${esc(focus.geography)}: N/D.</strong></p><p>${esc(focus.nd_explanation || unavailableExplanation(focus).trim())}</p><p>Nenhuma soma parcial, imputação ou valor do território ACU homônimo foi usado para preencher a UP.</p>${citations(context.evidencePack)}` };
        return { pack: context.evidencePack, html: `<h2>Faixa de 15 a 19 anos</h2><p><strong>${esc(focus.geography)}:</strong> ${esc(evidenceValue(focus))}.</p><p>Contagem e percentual usam a mesma geografia e o mesmo período compatível.</p>${citations(context.evidencePack)}` };
      }
      if (/(somando|somar|soma).*(viol[eê]ncia sexual|estupro|ass[eé]dio|explora[cç][aã]o)|(?:viol[eê]ncia sexual|estupro|ass[eé]dio|explora[cç][aã]o).*(somando|somar|soma)/.test(question)) {
        const ids = ["SL_SINAN_SEXUAL_VIOLENCE_ANY","SL_SINAN_RAPE","SL_SINAN_SEXUAL_HARASSMENT","SL_SINAN_SEXUAL_EXPLOITATION"].filter(id => context.data.catalog.some(item => item.indicator_id === id));
        const pack = A.evidencePack(context.data, Object.assign({}, context, { indicatorIds: ids, geographyIds: [context.geographyId] }));
        return { pack, html: `<h2>Soma metodologicamente proibida</h2><p><strong>Não é válido somar essas categorias.</strong></p><p>As categorias de violência sexual, estupro, assédio sexual e exploração sexual não são mutuamente exclusivas; uma mesma notificação pode estar em mais de uma categoria. Somá-las produziria dupla contagem.</p>${citations(pack)}` };
      }
      if (/cvli/.test(question) && /(sim|homic[ií]dios?|agress[oõ]es)/.test(question)) {
        return { pack: context.evidencePack, html: `<h2>Fontes e conceitos distintos</h2><p><strong>Não.</strong> CVLI da SSP-MA e óbitos por agressões do SIM têm fontes, conceitos, coberturas territoriais e processos de registro distintos.</p><p>Essas medidas não são somadas, substituídas nem harmonizadas como se fossem equivalentes.</p>${citations(context.evidencePack)}` };
      }
      if (/(nascidos vivos|m[aã]es?).*(10.?19|dez.*dezenove)|(?:10.?19|dez.*dezenove).*(nascidos vivos|m[aã]es?)/.test(question)) {
        const focus = context.evidencePack.evidence.find(item => item.indicator_id === context.selectedIndicatorId && item.claim_role === "PRIMARY_TERRITORIAL_CLAIM");
        const observed = focus && focus.value !== null ? `<p>${esc(focus.label)}: <strong>${esc(A.format(focus.value,focus.unit))}</strong>.</p>` : "";
        return { pack: context.evidencePack, html: `<h2>Nascidos vivos segundo idade da mãe</h2><p>A medida publicada descreve <strong>nascidos vivos segundo idade da mãe</strong>. Ela não é denominada taxa de gravidez na adolescência.</p>${observed}${citations(context.evidencePack)}` };
      }
      if (/resid[eê]ncia/.test(question) && /ocorr[eê]ncia/.test(question) && /sinan|notifica/.test(question)) {
        return { pack: context.evidencePack, html: `<h2>Conceitos territoriais distintos</h2><p>Residência e ocorrência são conceitos distintos no SINAN e não são combinados nem substituídos. O catálogo do Assistente integra apenas o indicador com <code>indicator_id</code> governado para residência; a série de ocorrência permanece separada no produto analítico SL-B3B.</p>${citations(context.evidencePack)}` };
      }
      if (/esgoto|esgotamento/.test(question) && /crian|adolesc/.test(question)) {
        const selectedMetric = context.data.catalog.find(item => item.indicator_id === context.selectedIndicatorId);
        const metric = selectedMetric && /sew|esgot|esg_|sewer/i.test(selectedMetric.indicator_id + " " + selectedMetric.label) ? selectedMetric : context.data.catalog.find(item => /sew|esgot|esg_|sewer/i.test(item.indicator_id + " " + item.label));
        const cell = metric && context.data.values[context.geographyId] && context.data.values[context.geographyId][metric.indicator_id];
        const count = metric ? A.impactCount(metric, cell, { childQuestion: true }) : { policy: A.COUNT_POLICIES.NOT_DERIVABLE, reason: "Não há indicador compatível selecionado." };
        const pack = metric ? A.evidencePack(context.data, Object.assign({}, context, { indicatorIds: [metric.indicator_id], geographyIds: [context.geographyId] })) : { generated_at: new Date().toISOString(), analysis_context: context, evidence: [] };
        return { pack, html: `<h2>Resposta metodologicamente protegida</h2><p><strong>${esc(count.policy)}</strong></p><p>${esc(count.reason)}</p><p>Se houver somente percentual domiciliar, ele não é convertido automaticamente em pessoas; se houver contagem da população total afetada, ela não é repartida por idade sem cruzamento etário exato.</p>${citations(pack)}` };
      }
      if (/compare|compar/.test(question)) return this.compare(context);
      if (/atenç|atenc|evidência|evidencia/.test(question)) return this.attention(context);
      if (/resum|diagnóst|diagnost/.test(question)) return this.generateSummary(context);
      return { pack: context.evidencePack, html: `<h2>Consulta livre não habilitada</h2><p>Esta versão offline interpreta pedidos de resumo, comparação, atenção e esgotamento. Outras perguntas exigem o futuro módulo generativo por endpoint seguro.</p>${citations(context.evidencePack)}` };
    }
  }
  window.ACUAssistant.DeterministicProvider = DeterministicProvider;
})();
