(function () {
  "use strict";

  const COUNT_POLICIES = Object.freeze({
    EXACT_OBSERVED_COUNT: "EXACT_OBSERVED_COUNT",
    EXACT_FROM_CANONICAL_NUMERATOR: "EXACT_FROM_CANONICAL_NUMERATOR",
    APPROXIMATE_FROM_PUBLISHED_RATE: "APPROXIMATE_FROM_PUBLISHED_RATE",
    NOT_DERIVABLE: "NOT_DERIVABLE"
  });

  const DEMOGRAPHIC_COUNT_IDS = Object.freeze([
    "demo_population_total_n",
    "demo_age_0_4_n",
    "demo_age_5_9_n",
    "demo_age_10_14_n",
    "demo_age_15_19_n",
    "demo_age_0_19_n",
    "demo_age_10_19_n",
    "demo_age_12_17_n",
    "demo_female_n",
    "demo_male_n"
  ]);

  const DEMOGRAPHIC_PERCENTAGE_COMPANIONS = Object.freeze({
    demo_age_0_4_n: "demo_age_0_4_pct",
    demo_age_5_9_n: "demo_age_5_9_pct",
    demo_age_10_14_n: "demo_age_10_14_pct",
    demo_age_15_19_n: "demo_age_15_19_pct",
    demo_age_0_19_n: "demo_age_0_19_pct",
    demo_age_10_19_n: "demo_age_10_19_pct",
    demo_age_12_17_n: "demo_age_12_17_pct",
    demo_female_n: "demo_female_pct",
    demo_male_n: "demo_male_pct"
  });

  function isAvailable(cell) {
    return Boolean(cell && cell.value !== null && cell.value !== undefined && !["MISSING_COMPONENT", "NOT_AVAILABLE_AT_THIS_GEOGRAPHIC_LEVEL", "SOURCE_NOT_AVAILABLE", "NOT_DERIVABLE_EXACTLY", "SUPPRESSED"].includes(cell.status));
  }

  function demographicPercentage(data, geographyId, indicatorId) {
    const applicable = DEMOGRAPHIC_COUNT_IDS.includes(indicatorId);
    if (!applicable) return { applicable: false, available: false, count: null, percentage_of_total: null, denominator: null, status: "NOT_APPLICABLE" };
    const metric = data.catalog.find(item => item.indicator_id === indicatorId);
    const totalMetric = data.catalog.find(item => item.indicator_id === "demo_population_total_n");
    const values = data.values[geographyId] || {};
    const cell = values[indicatorId];
    const totalCell = values.demo_population_total_n;
    if (!metric || !isAvailable(cell)) {
      return { applicable: true, available: false, count: null, percentage_of_total: null, denominator: null, status: indicatorId === "demo_age_12_17_n" ? "NOT_AVAILABLE_EXACTLY" : (cell && cell.status) || "SOURCE_NOT_AVAILABLE" };
    }
    if (!totalMetric || !isAvailable(totalCell) || !Number.isFinite(Number(totalCell.value)) || Number(totalCell.value) <= 0) {
      return { applicable: true, available: false, count: Number(cell.value), percentage_of_total: null, denominator: null, status: "TOTAL_POPULATION_NOT_AVAILABLE" };
    }
    if (String(metric.period || "") !== String(totalMetric.period || "")) {
      return { applicable: true, available: false, count: Number(cell.value), percentage_of_total: null, denominator: Number(totalCell.value), status: "INCOMPATIBLE_PERIOD" };
    }
    const companionId = DEMOGRAPHIC_PERCENTAGE_COMPANIONS[indicatorId];
    const companionMetric = companionId && data.catalog.find(item => item.indicator_id === companionId);
    const companionCell = companionId && values[companionId];
    const cellSourceId = cell.effective_source_id || cell.source_id || metric.source_id || null;
    const companionSourceId = companionCell && (companionCell.effective_source_id || companionCell.source_id) || companionMetric && companionMetric.source_id || null;
    const companionProvesCompatibility = companionMetric && String(companionMetric.period || "") === String(metric.period || "") &&
      isAvailable(companionCell) && Number.isFinite(Number(companionCell.denominator)) && Number(companionCell.denominator) > 0 &&
      Number(companionCell.numerator) === Number(cell.value) && companionSourceId === cellSourceId;
    if (companionProvesCompatibility) {
      return {
        applicable: true,
        available: true,
        count: Number(cell.value),
        percentage_of_total: Number(companionCell.value),
        denominator: Number(companionCell.denominator),
        geography_id: geographyId,
        numerator_source_id: cellSourceId,
        denominator_source_id: companionSourceId,
        period: metric.period || null,
        compatibility: "CANONICAL_PERCENTAGE_CELL_EXACT_COMPONENTS",
        status: companionCell.status || "AVAILABLE"
      };
    }
    const totalSourceId = totalCell.effective_source_id || totalCell.source_id || totalMetric.source_id || null;
    let compatibility = cellSourceId && cellSourceId === totalSourceId ? "SAME_SOURCE_AND_PERIOD" : null;
    if (!compatibility && indicatorId !== "demo_population_total_n") {
      return { applicable: true, available: false, count: Number(cell.value), percentage_of_total: null, denominator: Number(totalCell.value), status: "INCOMPATIBLE_SOURCE" };
    }
    const count = Number(cell.value), denominator = Number(totalCell.value);
    return {
      applicable: true,
      available: true,
      count,
      percentage_of_total: indicatorId === "demo_population_total_n" ? 100 : count / denominator * 100,
      denominator,
      geography_id: geographyId,
      numerator_source_id: cellSourceId,
      denominator_source_id: totalSourceId,
      period: metric.period || null,
      compatibility: compatibility || "SELF_DENOMINATOR",
      status: "DERIVED_SAME_GEOGRAPHY_TOTAL"
    };
  }

  function auditDemographicPercentages(data) {
    const testedIds = DEMOGRAPHIC_COUNT_IDS.filter(id => id !== "demo_population_total_n" && id !== "demo_age_12_17_n");
    const counters = {
      demographic_percentage_mismatch: 0,
      wrong_geography_denominator: 0,
      missing_percentage_presented_as_zero: 0,
      sex_residual_redistribution: 0
    };
    let tested = 0, unavailable = 0;
    data.geographies.forEach(geography => {
      const values = data.values[geography.id] || {}, total = values.demo_population_total_n;
      testedIds.forEach(indicatorId => {
        const result = demographicPercentage(data, geography.id, indicatorId), cell = values[indicatorId];
        if (!result.available) {
          unavailable += 1;
          if (result.percentage_of_total === 0) counters.missing_percentage_presented_as_zero += 1;
          return;
        }
        tested += 1;
        const companionId = DEMOGRAPHIC_PERCENTAGE_COMPANIONS[indicatorId], companion = companionId && values[companionId];
        const expected = isAvailable(companion) ? Number(companion.value) : Number(cell.value) / Number(total.value) * 100;
        const expectedDenominator = isAvailable(companion) ? Number(companion.denominator) : Number(total.value);
        if (Math.abs(result.percentage_of_total - expected) > 1e-10) counters.demographic_percentage_mismatch += 1;
        if (result.geography_id !== geography.id || result.denominator !== expectedDenominator) counters.wrong_geography_denominator += 1;
        if (["demo_female_n", "demo_male_n"].includes(indicatorId) && Math.abs(result.percentage_of_total - expected) > 1e-10) counters.sex_residual_redistribution += 1;
      });
    });
    return { city_id: data.config.city_id, tested, unavailable, counters };
  }

  function aggregate(cells, metric) {
    const present = cells.filter(isAvailable);
    if (!present.length) return { value: null, numerator: null, denominator: null, status: "SOURCE_NOT_AVAILABLE" };
    if (present.every(cell => cell.numerator !== null && cell.denominator !== null) && /SUM\(.+\)\s*\/\s*SUM/i.test(metric.aggregation_rule || "")) {
      const numerator = present.reduce((sum, cell) => sum + Number(cell.numerator), 0);
      const denominator = present.reduce((sum, cell) => sum + Number(cell.denominator), 0);
      return denominator ? { value: numerator / denominator * (String(metric.unit).includes("%") ? 100 : 1), numerator, denominator, status: "DERIVED_FROM_CANONICAL_COMPONENTS" } : { value: null, numerator, denominator, status: "NOT_DERIVABLE_EXACTLY" };
    }
    if (String(metric.measure_type).toUpperCase() === "COUNT") {
      const value = present.reduce((sum, cell) => sum + Number(cell.value), 0);
      return { value, numerator: value, denominator: null, status: "DERIVED_SUM_OF_CANONICAL_COUNTS" };
    }
    return { value: null, numerator: null, denominator: null, status: "NOT_DERIVABLE_EXACTLY" };
  }

  function impactCount(metric, cell, options) {
    const settings = options || {};
    if (!isAvailable(cell)) return { policy: COUNT_POLICIES.NOT_DERIVABLE, value: null, label: "N/D", reason: "Indicador indisponível nesta geografia." };
    if (settings.childQuestion && !metric.child_specific) {
      return { policy: COUNT_POLICIES.NOT_DERIVABLE, value: null, label: "N/D", reason: "Os dados disponíveis não permitem identificar exatamente quantas crianças e adolescentes vivem nessa condição." };
    }
    if (String(metric.measure_type).toUpperCase() === "COUNT") return { policy: COUNT_POLICIES.EXACT_OBSERVED_COUNT, value: Number(cell.value), label: String(cell.value), reason: "Contagem observada/canônica." };
    if (cell.numerator !== null && cell.numerator !== undefined && settings.numeratorRepresentsPeople) return { policy: COUNT_POLICIES.EXACT_FROM_CANONICAL_NUMERATOR, value: Number(cell.numerator), label: String(cell.numerator), reason: "Numerador canônico diretamente compatível." };
    if (settings.allowApproximation && cell.denominator !== null && cell.denominator !== undefined) {
      const value = Number(cell.value) / 100 * Number(cell.denominator);
      return { policy: COUNT_POLICIES.APPROXIMATE_FROM_PUBLISHED_RATE, value, label: `aproximadamente ${Math.round(value)}`, reason: "Taxa publicada e denominador compatível, com aproximação explicitamente autorizada." };
    }
    return { policy: COUNT_POLICIES.NOT_DERIVABLE, value: null, label: "N/D", reason: "A medida não possui numerador de pessoas diretamente compatível." };
  }

  function compare(data, geographyIds, indicatorId) {
    const metric = data.catalog.find(item => item.indicator_id === indicatorId);
    if (!metric) return [];
    return geographyIds.map(id => {
      const geo = data.geographies.find(item => item.id === id);
      const cell = data.values[id] && data.values[id][indicatorId];
      return { id, name: geo ? (geo.display_name || geo.name) : id, metric, cell: cell || { value: null, status: "SOURCE_NOT_AVAILABLE" } };
    });
  }

  function evidencePack(data, context) {
    const ids = context.indicatorIds || [];
    const geographies = context.geographyIds || [context.geographyId];
    const actionType = context.actionType || "SUMMARY";
    const analysisContext = context.analysisContext || {
      city: { city_id: data.config.city_id, city_name: data.config.city_name },
      active_geography: {
        geography_id: context.geographyId,
        geography_name: context.territoryName || context.geographyId,
        geography_type: null
      },
      selected_indicator: null,
      selected_theme: context.theme || null,
      filters: context.filters || {},
      period: context.period || null,
      comparison_geographies: [],
      action_type: actionType
    };
    const claims = [];
    function claimFor(geographyId, indicatorId, role, labelOverride) {
      const metric = data.catalog.find(item => item.indicator_id === indicatorId);
      const geo = data.geographies.find(item => item.id === geographyId);
      const cell = data.values[geographyId] && data.values[geographyId][indicatorId];
      if (!metric) return null;
      const demographic = demographicPercentage(data, geographyId, indicatorId);
      return {
        claim_id: `${data.config.city_id}:${geographyId}:${indicatorId}:${role}`,
        city_id: data.config.city_id,
        geography_id: geographyId,
        geography_name: geo ? (geo.display_name || geo.name) : geographyId,
        geography_type: geo ? geo.level : null,
        indicator_id: indicatorId,
        label: labelOverride || metric.label,
        geography: geo ? (geo.display_name || geo.name) : geographyId,
        value: isAvailable(cell) ? cell.value : null,
        count: demographic.applicable ? demographic.count : null,
        percentage_of_total: demographic.applicable ? demographic.percentage_of_total : null,
        percentage_denominator: demographic.applicable ? demographic.denominator : null,
        percentage_status: demographic.applicable ? demographic.status : "NOT_APPLICABLE",
        percentage_compatibility: demographic.applicable ? demographic.compatibility || null : null,
        unit: metric.unit,
        numerator: cell ? cell.numerator : null,
        denominator: cell ? cell.denominator : null,
        period: metric.period,
        source_id: cell && (cell.effective_source_id || cell.source_id) || metric.source_id || null,
        source_ids: cell && (cell.source_ids || [cell.effective_source_id || cell.source_id].filter(Boolean)) || metric.source_ids || (metric.source_id ? [metric.source_id] : []),
        lineage_id: cell && cell.lineage_id || metric.lineage_id || null,
        effective_source_id: cell && (cell.effective_source_id || cell.source_id) || metric.source_id || null,
        recovery_method: cell && cell.recovery_method || null,
        original_status: cell && cell.original_status || null,
        recovered_status: cell && cell.recovered_status || null,
        source: cell && cell.source_file || metric.source,
        source_family: metric.source_family || null,
        source_geography_id: cell && cell.source_geography_id || metric.source_geography_id || null,
        source_geography_label: cell && cell.source_geography_label || metric.source_geography_label || null,
        availability_reason: cell && cell.availability_reason || null,
        nd_reason: cell && cell.nd_reason || null,
        nd_explanation: cell && cell.nd_explanation || null,
        quality: cell ? cell.status : "SOURCE_NOT_AVAILABLE",
        availability: isAvailable(cell) ? "AVAILABLE" : (cell && cell.status) || "SOURCE_NOT_AVAILABLE",
        claim_role: role,
        comparison: null,
        limitation: metric.limitations || null,
        allowed_claims: ["descriptive_value", "within_city_indicator_comparison"],
        forbidden_claims: ["causal_impact", "composite_vulnerability", "unsupported_child_count", "geographic_downscaling", "source_conflation"]
      };
    }
    geographies.forEach(geographyId => {
      ids.forEach(indicatorId => {
        const claim = claimFor(geographyId, indicatorId, "PRIMARY_TERRITORIAL_CLAIM");
        if (claim) claims.push(claim);
      });
    });
    if (actionType !== "COMPARE" && analysisContext.active_geography.geography_type === "MUNICIPALITY") {
      ids.forEach(indicatorId => {
        const metric = data.catalog.find(item => item.indicator_id === indicatorId);
        if (!metric || !Array.isArray(metric.geographies) || !metric.geographies.includes("METROPOLITAN") || !metric.source_geography_id) return;
        const reference = claimFor(metric.source_geography_id, indicatorId, "CONTEXT_REFERENCE", `${metric.label} — referência da fonte`);
        if (reference && reference.value !== null) claims.push(reference);
      });
    }
    return { generated_at: new Date().toISOString(), action_type: actionType, analysis_context: analysisContext, evidence: claims };
  }

  function format(value, unit, maximumFractionDigits) {
    if(window.ACU_R75)return ACU_R75.format(value,unit);
    if (value === null || value === undefined || Number.isNaN(Number(value))) return "N/D";
    const digits = maximumFractionDigits === undefined ? (String(unit).includes("%") ? 1 : (Number(value) % 1 ? 1 : 0)) : maximumFractionDigits;
    const formatted = Number(value).toLocaleString("pt-BR", { maximumFractionDigits: digits });
    if (String(unit).includes("%")) return `${formatted}%`;
    if (["pessoas", "escolas", "equipamentos", "count"].includes(String(unit).toLowerCase())) return formatted;
    return `${formatted} ${unit || ""}`.trim();
  }

  window.ACUAnalytics = { COUNT_POLICIES, DEMOGRAPHIC_COUNT_IDS, isAvailable, demographicPercentage, auditDemographicPercentages, aggregate, impactCount, compare, evidencePack, format };
})();
