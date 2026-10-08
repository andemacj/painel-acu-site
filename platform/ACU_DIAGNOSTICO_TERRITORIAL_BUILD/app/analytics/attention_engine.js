(function () {
  "use strict";
  function analyze(data, indicatorId, geographyIds, activeGeographyId) {
    if (activeGeographyId) {
      const focal = window.ACUAnalytics.compare(data, [activeGeographyId], indicatorId)[0];
      if (!focal || !window.ACUAnalytics.isAvailable(focal.cell)) {
        return [
          { type: "availability", text: `O indicador selecionado está N/D em ${focal ? focal.name : "esta geografia"}; nenhum valor de outra geografia foi usado como substituto.` },
          { type: "guardrail", text: "Esta leitura não substitui ausência por zero, por valor municipal ou por outra unidade territorial." }
        ];
      }
      return [
        { type: "focal", text: `Em ${focal.name}, o valor observado para ${focal.metric.label.toLowerCase()} é ${window.ACUAnalytics.format(focal.cell.value, focal.metric.unit)}.` },
        { type: "guardrail", text: "Esta leitura focal descreve um indicador isolado; não constitui score, ranking de vulnerabilidade ou avaliação de impacto." }
      ];
    }
    const rows = window.ACUAnalytics.compare(data, geographyIds, indicatorId);
    const valid = rows.filter(row => window.ACUAnalytics.isAvailable(row.cell));
    const statements = [];
    if (!valid.length) return [{ type: "availability", text: "O indicador selecionado não está disponível nas geografias comparadas." }];
    const sorted = [...valid].sort((a, b) => Number(b.cell.value) - Number(a.cell.value));
    const highest = sorted[0], lowest = sorted[sorted.length - 1];
    if (valid.length > 1 && Number(highest.cell.value) !== Number(lowest.cell.value)) {
      statements.push({ type: "distribution", text: `${highest.name} apresenta o maior valor observado para ${highest.metric.label.toLowerCase()} entre as unidades selecionadas (${window.ACUAnalytics.format(highest.cell.value, highest.metric.unit)}).` });
      statements.push({ type: "distribution", text: `${lowest.name} apresenta o menor valor observado no mesmo recorte (${window.ACUAnalytics.format(lowest.cell.value, lowest.metric.unit)}).` });
    }
    const missing = rows.filter(row => !window.ACUAnalytics.isAvailable(row.cell));
    if (missing.length) statements.push({ type: "missing", text: `${missing.length} unidade(s) não possuem valor publicável para este indicador; ausência não foi tratada como zero.` });
    if (valid.some(row => /PARTIAL/i.test(row.cell.status || ""))) statements.push({ type: "partial", text: "Há fonte ou período parcial; a interpretação exige considerar a limitação registrada." });
    statements.push({ type: "guardrail", text: "Esta leitura descreve um indicador isolado; não constitui score, ranking de vulnerabilidade ou avaliação de impacto." });
    return statements;
  }
  window.ACUAttention = { analyze };
})();
