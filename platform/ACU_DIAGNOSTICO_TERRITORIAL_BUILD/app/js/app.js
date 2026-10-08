(function () {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const fold = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const A = window.ACUAnalytics;
  const R77=window.ACU_R77;
  const provider = new window.ACUAssistant.DeterministicProvider();
  const DIAGNOSTIC_RUNTIME = window.ACU_CITY_DIAGNOSTIC_RUNTIME || {policy:{},cities:{},public_scale_contract:{}};
  const DEMOGRAPHY_PUBLICATION_IDS = Object.freeze([
    "demo_population_total_n", "demo_age_0_4_n", "demo_age_5_9_n", "demo_age_10_14_n",
    "demo_age_15_19_n", "demo_age_0_19_n", "demo_age_10_19_n", "demo_female_n", "demo_male_n"
  ]);
  const BELEM_DEMOGRAPHY_IDS = Object.freeze([
    "demo_population_total_n", "demo_age_0_4_n", "demo_age_5_9_n", "demo_age_10_14_n",
    "demo_age_15_19_n", "demo_age_0_19_n", "demo_female_n", "demo_male_n", "demo_age_10_19_n"
  ]);
  const BELEM_EQUIPMENT_SOURCE_IDS = Object.freeze([
    "SRC_CNES_API_DADOS_ABERTOS_R4_20260903", "SRC_CENSO_SUAS_2025_R4_20260903",
    "SRC_SEMCULT_BELEM_ESPACOS_CULTURAIS_R4", "SRC_PROCON_PA_LOCATIONS_R4",
    "SRC_SEAC_PA_USINA_TERRA_FIRME_R4", "SRC_CNES_API_DADOS_ABERTOS",
    "SRC_CENSO_SUAS_2024", "SRC_BELEM_MYMAPS_ESF_2024", "SRC_MAPA_CULTURAL_PA",
    "SRC_OSM_OVERPASS"
  ]);
  const BELEM_SCHOOL_TRACE_SOURCE_IDS = Object.freeze([
    "SRC_INEP_CENSO_ESCOLAR_2025", "SRC_INEP_CENSO_ESCOLAR_2025::PCT1_MULTICITY_EXTRACT",
    "SRC_BELEM_H5_SCHOOL_COORDINATE_DERIVATIVE", "SRC_USER_GOOGLE_MAPS_ODETE_20260826"
  ]);
  const BELEM_EQUIPMENT_TRACE_SOURCE_IDS = Object.freeze([
    ...BELEM_EQUIPMENT_SOURCE_IDS, "SRC_ACU_BELEM_R3_BEL_FILTER_DERIVED"
  ]);
  const BELEM_PRESENTATION_SOURCES = Object.freeze([
    {
      source_id: "SRC_IBGE_LOCALIDADES_INDIGENAS_2022_REV20250919",
      institution: "Instituto Brasileiro de Geografia e Estatística — IBGE",
      title: "Localidades indígenas 2022 — arquivo vetorial nacional",
      official_url: "https://geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/localidades/localidades_indigenas_2022/Arquivos_vetoriais/LI/shp/BR/BR_LIs_CD2022_20250919.zip",
      reference_period: "2022", source_geography: "Brasil/município", source_role: "CANONICAL"
    },
    {
      source_id: "SRC_IBGE_LOCALIDADES_QUILOMBOLAS_2022",
      institution: "Instituto Brasileiro de Geografia e Estatística — IBGE",
      title: "Localidades quilombolas 2022 — arquivo vetorial nacional",
      official_url: "https://geoftp.ibge.gov.br/organizacao_do_territorio/estrutura_territorial/localidades/localidades_quilombolas_2022/Arquivos_vetoriais/shp/BR/BR_LQs_CD2022.zip",
      reference_period: "2022", source_geography: "Brasil/município", source_role: "CANONICAL"
    },
    {
      source_id: "SRC_SEGUP_POWERBI", institution: "SEGUP/PA", title: "Painéis públicos de indicadores de segurança pública da SEGUP/PA",
      official_url: "https://app.powerbi.com/view?r=eyJrIjoiODhhYzYwODQtNWUzMC00ODgxLWI0OWMtOWQyZDZiYjA5YjlmIiwidCI6ImQyY2RmZWVmLWYyNWEtNDIyYi04YWIyLWE1MDUzZDhiNmU2MCJ9",
      reference_period: "2010–03/08/2026", source_geography: "Belém/DAICO/bairro", source_role: "CANONICAL"
    },
    {
      source_id: "SRC_FC_API_V2_OCCURRENCES_BEL", institution: "Instituto Fogo Cruzado", title: "API Fogo Cruzado v2 — aquisição Belém",
      official_url: "https://api.fogocruzado.org.br/api/v2/occurrences", reference_period: "05/11/2023–25/08/2026", source_geography: "Belém", source_role: "COMPLEMENTARY"
    }
  ]);
  const BELEM_PRESENTATION_CONTRACT = window.ACU_BELEM_INDICATOR_PRESENTATION_GROUPS || { presentation_groups:[], virtual_indicators:[] };
  const BELEM_VIRTUAL_INDICATORS = Object.freeze(BELEM_PRESENTATION_CONTRACT.virtual_indicators || []);
  const BELEM_VIRTUAL_INDICATOR_INDEX = new Map(BELEM_VIRTUAL_INDICATORS.map(metric => [metric.indicator_id, metric]));
  const BELEM_PRESENTATION_GROUPS = Object.freeze(BELEM_PRESENTATION_CONTRACT.presentation_groups || []);
  const BELEM_CONTEXT_VISIBILITY = Object.freeze(BELEM_PRESENTATION_CONTRACT.context_visibility || []);
  const BELEM_CONTEXT_VISIBILITY_BY_GROUP = new Map(BELEM_CONTEXT_VISIBILITY.map(item=>[item.presentation_group_id,item]));
  const BELEM_CITY_CONTEXT = Object.freeze({id:"BELEM_CITY_CONTEXT",name:"Belém — visão geral",display_name:"Belém — visão geral",level:"MUNICIPALITY",comparable:false,presentation_only:true});
  const BELEM_PRESENTATION_GROUP_BY_INDICATOR = new Map();
  BELEM_PRESENTATION_GROUPS.forEach(group => [group.count_indicator_id, group.percentage_indicator_id].filter(Boolean).forEach(id => BELEM_PRESENTATION_GROUP_BY_INDICATOR.set(id, group)));
  const BELEM_THEME_GROUPS = Object.freeze([
    { id:"BELEM_DEMOGRAPHY", label:"Demografia e adolescentes", module:"population", presentationTheme:"DEMOGRAPHY" },
    { id:"BELEM_EDUCATION", label:"Educação e alfabetização", module:"education", presentationTheme:"EDUCATION_LITERACY" },
    { id:"BELEM_LIVING_WASH", label:"Condições domiciliares e WASH", module:"living", presentationTheme:"LIVING_WASH" },
    { id:"BELEM_INCOME", label:"Renda e condições socioeconômicas", module:"income", rawThemes:["RENDA"] },
    { id:"BELEM_VIOLENCE", label:"Violências e proteção", module:"violence", presentationTheme:"VIOLENCE_PROTECTION" }
  ]);
  const state = {
    cityId: null, data: null, module: "panorama", geographyId: null,
    comparisonGeographyLevel: null, programTerritoryIds: [], mapExtent: "MUNICIPALITY",
    theme: null, indicatorId: null, mapIndicator: null, map: null, availabilityMatrix: [],
    layers: {}, markerLayers: {}, markerRecords: [], compareIds: [], compareSort:"name", compareSelectionTouched:false, compareLevel:null,
    schoolProfiles: null, lastEvidencePack: null, lastAnalysisContext: null, lastAssistantError: null, tileError: false,
    mapControlSection: null, pinnedTooltipGeographyId: null,
    demographicMapMode: "count", preferredMeasureMode: "count", mapEvidencePack: null, mapAnalysisContext: null,
    layerState: { schools: false, priority: false, equipment: false, pct: false },
    schoolFilters: { dependency: "", stage: "", wash: "", differentiated: false, priority: false },
    equipmentFilter: "", equipmentFilters: { category:"", subcategory:"", status:"", governmentLevel:"" },
    violencePeriodByIndicator: {}, r50RuntimeIndex: new Map(), sourceFocusIds: [], lastViewportAudit: null,
    mapResizeObserver: null, mapPhysicalSize: null, lastLayoutInvalidateAudit: null,
    stableMapViewport: null, layoutResizeInProgress: false, mapNavigationIntent: null,
    qaMapNavigationCalls: [], qaMapAction: null, qaMapNavigationAllowed: false,
    qaConsoleErrors: [], qaOwnWarnings: [], quickCard: null, quickCardAudit: null
  };
  const moduleMeta = {
    panorama: ["Panorama territorial", "Síntese demográfica, territorial e de serviços do recorte selecionado."],
    population: ["População e adolescentes", "Contagens e perfis etários conforme a desagregação publicada em cada geografia."],
    living: ["Condições de vida", "Domicílios, WASH, renda, alfabetização e entorno, sem transformar ausência em zero."],
    income: ["Renda e condições socioeconômicas", "Renda do responsável e condições socioeconômicas conforme definição, período e geografia da fonte."],
    education: ["Educação", "Universo escolar canônico do Censo Escolar e indicadores de infraestrutura e trajetória."],
    equipment: ["Equipamentos e serviços", "Catálogos por fonte e completude; pontos somente quando espacialmente válidos."],
    violence: ["Violências e saúde", "Fontes mantidas separadas, com conceitos, períodos e granularidades próprias."],
    pct: ["Povos e territórios tradicionais", "Publicação condicionada às regras de precisão espacial e proteção."],
    compare: ["Comparar territórios", "Indicadores nas linhas e territórios nas colunas."],
    assistant: ["Assistente de Diagnóstico", "Análise offline baseada exclusivamente nos dados selecionados e no evidence pack."],
    sources: ["Fontes e metodologia", "Definições, fórmulas, períodos, granularidades e limitações das métricas publicadas."]
  };
  const FOUNDATION_THEME_CONTRACT = [
    { id:"Demografia e adolescentes", label:"Demografia e adolescentes", rawThemes:["Demografia","Demografia e adolescentes"], module:"population" },
    { id:"Educação e trajetória escolar", label:"Educação e trajetória escolar", rawThemes:["Educação","Educação e trajetória escolar"], module:"education" },
    { id:"Condições domiciliares e WASH", label:"Condições domiciliares e WASH", rawThemes:["Condições domiciliares e WASH"], module:"living" },
    { id:"Renda e condições socioeconômicas", label:"Renda e condições socioeconômicas", rawThemes:["Renda e condições socioeconômicas"], module:"income" },
    { id:"Equipamentos e serviços", label:"Equipamentos e serviços", rawThemes:["Equipamentos e serviços"], module:"equipment" },
    { id:"Violências e proteção", label:"Violências e proteção", rawThemes:["Violências e proteção"], module:"violence" },
    { id:"Saúde e nutrição", label:"Saúde e nutrição", rawThemes:["Saúde e nutrição"], module:"violence" }
  ];
  const FOUNDATION_MODULE_META = {
    population:["Demografia e adolescentes","População, faixas etárias, sexo e raça/cor com N/D governado quando a fonte não permite agregação exata."],
    education:["Educação e trajetória escolar","Abandono e distorção idade-série por etapa, preservando fonte, período e cobertura escolar."],
    living:["Condições domiciliares e WASH","Água, esgotamento, resíduos, banheiro e demais condições domiciliares publicáveis."],
    income:["Renda e condições socioeconômicas","Renda e condições socioeconômicas conforme definição, período e geografia da fonte."],
    equipment:["Equipamentos e serviços",moduleMeta.equipment[1]],
    violence:["Violências e proteção",moduleMeta.violence[1]],
    pct:["Povos, comunidades e territórios tradicionais",moduleMeta.pct[1]]
  };

  function setLoading(show) { $("#loading").classList.toggle("show", show); }
  function format(value, unit) { return ACU_R75.format(value, unit); }
  function availableGeographies() { return state.cityId==="belem"?[BELEM_CITY_CONTEXT,...state.data.geographies]:state.data.geographies; }
  function currentGeo() { return availableGeographies().find(item => item.id === state.geographyId); }
  function geographyDisplayName(geography) { return geography && (geography.display_name || geography.name) || "Território"; }
  function geographyBaseName(geography) {
    return geographyDisplayName(geography).replace(/^UP\s+/i, "").replace(/\s+—\s+(?:INCID|Território ACU)$/i, "");
  }
  function geographyIdentity(geography) {
    if (!geography) return { title: "Território", subtitle: "Geografia não resolvida" };
    if(state.cityId==="belem"&&geography.level==="OPERATIONAL_NEIGHBORHOOD")return {title:geographyDisplayName(geography),subtitle:"Bairro · DAICO"};
    if(state.cityId==="belem"&&geography.level==="IBGE_DISTRICT")return {title:geographyDisplayName(geography),subtitle:"Distrito IBGE · Belém"};
    if (geography.level === "INCID_PLANNING_UNIT") return { title: `UP ${geographyBaseName(geography)}`, subtitle: "Unidade de Planejamento — INCID" };
    if (geography.level === "SP_DISTRICT") return { title: geographyDisplayName(geography), subtitle: "Distrito administrativo — GeoSampa" };
    if (geography.level === "SP_SUBPREFECTURE") return { title: geographyDisplayName(geography), subtitle: "Subprefeitura — GeoSampa" };
    if (geography.level === "RJ_ADMINISTRATIVE_REGION") return { title: geographyDisplayName(geography), subtitle: "Região Administrativa — IPP / DATA.RIO" };
    if (geography.level === "RJ_NEIGHBORHOOD") return { title: geographyDisplayName(geography), subtitle: "Bairro oficial — IPP / DATA.RIO" };
    if (geography.level === "RJ_PLANNING_AREA") return { title: geographyDisplayName(geography), subtitle: "Área de Planejamento — IPP / DATA.RIO" };
    if (geography.level === "AGENDA_CITY_TERRITORY") return { title: geographyBaseName(geography), subtitle: "Território Agenda Cidade UNICEF" };
    if (geography.level === "AGENDA_CITY_TERRITORY_COLLECTION") return { title: geographyDisplayName(geography), subtitle: "Territórios Agenda Cidade UNICEF" };
    if (geography.level === "MUNICIPALITY") return { title: geographyDisplayName(geography), subtitle: "Município" };
    return { title: geographyDisplayName(geography), subtitle: geography.level };
  }
  function ndExplanation(cell) {
    if (cell && cell.nd_explanation) return cell.nd_explanation;
    const reason=cell&&(cell.nd_reason||cell.availability_reason||cell.status)||"SOURCE_NOT_AVAILABLE";
    const messages={SOURCE_SUPPRESSION:"A fonte suprimiu componente(s) necessário(s); a agregação exata permanece N/D, sem imputação.",MISSING_SECTOR_VALUES:"Há setores sem todos os componentes necessários para a agregação exata.",MISSING_NUMERATOR:"O numerador não está completo em todos os setores.",MISSING_DENOMINATOR:"O denominador não está completo em todos os setores.",INCOMPATIBLE_DENOMINATOR:"O denominador é ausente, incompatível ou igual a zero.",NOT_DERIVABLE_EXACTLY:"A medida não pode ser derivada exatamente nesta geografia.",NOT_AVAILABLE_AT_THIS_GEOGRAPHIC_LEVEL:"A fonte não publica esta medida nesta geografia.",SOURCE_NOT_AVAILABLE:"A fonte necessária não está disponível para esta geografia."};
    return messages[reason]||"A indisponibilidade está registrada na auditoria de proveniência.";
  }
  function cityDiagnosticContract(cityId=state.cityId) { return DIAGNOSTIC_RUNTIME.cities?.[cityId]||null; }
  function governedIndicatorRecord(metricId,stateCity=state.cityId) { return cityDiagnosticContract(stateCity)?.indicators?.[metricId]||null; }
  function indicatorGovernedForPublication(metric) {
    const record=metric&&governedIndicatorRecord(metric.indicator_id,state.cityId);
    return Boolean(record&&record.menu_visible===true&&ACU_R76R1.themeVisible(state.cityId,metric.theme));
  }
  function governedScaleLabels(cityId=state.cityId) { return DIAGNOSTIC_RUNTIME.public_scale_contract?.[cityId]?.labels||{}; }
  function governedMapScales(metricId=state.indicatorId) {
    if(!["sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId))return [];
    const record=governedIndicatorRecord(metricId);
    const publicLevel=state.cityId==="sao_paulo"?"SP_DISTRICT":state.cityId==="rio_de_janeiro"?"RJ_ADMINISTRATIVE_REGION":"MANAUS_NEIGHBORHOOD";
    return Array.isArray(record?.allowed_map_scales)&&record.allowed_map_scales.includes(publicLevel)?[publicLevel]:[];
  }
  function governedScaleLabel(level,withCount=false) {
    const labels=governedScaleLabels(),base=labels[level]||level,expected=DIAGNOSTIC_RUNTIME.public_scale_contract?.[state.cityId]?.expected_units?.[level];
    return withCount&&expected?`${base} · ${expected}`:base;
  }
  function governedPublicationMessage(metricId=state.indicatorId) {
    const record=governedIndicatorRecord(metricId);
    if(!record)return "Indicador fora do catálogo diagnóstico governado desta cidade.";
    if(record.publication_mode==="PROGRAM_PROFILE_ONLY")return "Disponível no perfil do território ACU; sem coroplético municipal comparável.";
    if(record.publication_mode==="MUNICIPAL_CONTEXT_ONLY")return "Disponível somente no contexto municipal; nenhum valor é redistribuído.";
    if(!record.menu_visible)return "Indicador indisponível nesta cidade; isso não é um erro da plataforma.";
    const level=comparisonGeographyLevel(),coverage=record.coverage_by_scale?.[level];
    return coverage?.message||"Cobertura conforme a geografia e a fonte publicadas.";
  }
  function availableScaleSummary(metricId=state.indicatorId) {
    const record=governedIndicatorRecord(metricId),scales=record?.allowed_map_scales||[];
    if(scales.length)return scales.map(level=>governedScaleLabel(level)).join("; ");
    if(record?.publication_mode==="PROGRAM_PROFILE_ONLY")return "Perfil do território ACU";
    if(record?.publication_mode==="MUNICIPAL_CONTEXT_ONLY")return "Município";
    return record?.recommended_geography||"N/D";
  }
  function territorialCoverageSummary(metricId=state.indicatorId) {
    const record=governedIndicatorRecord(metricId),coverages=record?.coverage_by_scale||{};
    const messages=Object.values(coverages).map(item=>item.message);
    if(messages.length)return messages.join(" ");
    return governedPublicationMessage(metricId);
  }
  function normalizeGovernedComparisonScale() {
    if(!citywideComparisonEnabled())return;
    const allowed=governedMapScales();
    if(allowed.length&&!allowed.includes(state.comparisonGeographyLevel))state.comparisonGeographyLevel=allowed[0];
    if(!state.comparisonGeographyLevel)state.comparisonGeographyLevel=defaultComparisonGeographyLevel();
  }
  function metricById(metricId) { return state.data.catalog.find(item => item.indicator_id === metricId) || BELEM_VIRTUAL_INDICATOR_INDEX.get(metricId) || null; }
  function foundationPresentationGroups() {
    if(!state.data||!["sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId))return [];
    if(Array.isArray(state.data.presentation_groups)&&state.data.presentation_groups.length)return state.data.presentation_groups.filter(group=>indicatorGovernedForPublication({indicator_id:group.count_indicator_id||group.percentage_indicator_id||group.rate_indicator_id}));
    const prefix=state.cityId==="sao_paulo"?"SP":"RJ",exists=id=>Boolean(state.data.catalog.find(item=>item.indicator_id===id));
    return [
      {
        presentation_group_id:`${prefix}_SCHOOL_SPATIAL_COVERAGE`,
        label:"Cobertura espacial do universo escolar",
        theme:"Educação",
        subtheme:"COBERTURA ESPACIAL",
        count_indicator_id:`${prefix}_SCHOOL_SPATIALIZED_COUNT`,
        percentage_indicator_id:`${prefix}_SCHOOL_SPATIAL_COVERAGE_PCT`,
        available_measures:["count","percentage"],
        default_measure:"count"
      },
      {
        presentation_group_id:`${prefix}_EQUIPMENT_SPATIAL_COVERAGE`,
        label:"Cobertura espacial do catálogo de equipamentos",
        theme:"Equipamentos e serviços",
        subtheme:"COBERTURA ESPACIAL",
        count_indicator_id:`${prefix}_EQUIPMENT_SPATIALIZED_COUNT`,
        percentage_indicator_id:`${prefix}_EQUIPMENT_SPATIAL_COVERAGE_PCT`,
        available_measures:["count","percentage"],
        default_measure:"count"
      }
    ].filter(group=>exists(group.count_indicator_id)&&exists(group.percentage_indicator_id)&&indicatorGovernedForPublication({indicator_id:group.count_indicator_id}));
  }
  function presentationGroupForIndicator(metricId) {
    if(state.cityId==="belem")return BELEM_PRESENTATION_GROUP_BY_INDICATOR.get(metricId)||null;
    return foundationPresentationGroups().find(group=>group.count_indicator_id===metricId||group.percentage_indicator_id===metricId||group.rate_indicator_id===metricId)||null;
  }
  function activePresentationGroup() {
    const selected=presentationGroupForIndicator(state.indicatorId);
    if(selected||state.indicatorId)return selected;
    return presentationGroupForIndicator(state.mapIndicator);
  }
  function presentationMetricId(group = activePresentationGroup(), mode = state.demographicMapMode) {
    if (!group) return state.indicatorId;
    const measures=group.available_measures||["count",...(group.percentage_indicator_id?["percentage"]:[])];
    if(mode==="rate"&&measures.includes("rate")&&group.rate_indicator_id)return group.rate_indicator_id;
    if(mode === "percentage" && measures.includes("percentage") && group.percentage_indicator_id) return group.percentage_indicator_id;
    return group.count_indicator_id;
  }
  function currentMetric() {
    const metric = metricById(state.indicatorId);
    const group = activePresentationGroup();
    return metric && group ? Object.assign({}, metric, { label:group.label, presentation_group_id:group.presentation_group_id }) : metric;
  }
  function currentCell(metricId) { return metricCell(state.geographyId, metricId); }
  function effectiveCellSourceIds(cell,metric) {
    const ids=cell&&(cell.source_ids||[cell.effective_source_id||cell.source_id])||metric&&(metric.source_ids||[metric.source_id])||[];
    return [...new Set(ids.filter(Boolean))];
  }
  function effectiveMetricTrace(metric,geographyId=state.geographyId) {
    const cell=metric&&metricCell(geographyId,metric.indicator_id),sourceIds=effectiveCellSourceIds(cell,metric);
    return {cell,sourceIds,sourceId:cell?.effective_source_id||cell?.source_id||sourceIds[0]||metric?.source_id||null,lineageId:cell?.lineage_id||metric?.lineage_id||null,effectiveMethod:cell?.effective_method||cell?.recovery_method||null,denominatorSourceId:cell?.denominator_source_id||null,recoveryMethod:cell?.recovery_method||null,originalStatus:cell?.original_status||null,recoveredStatus:cell?.recovered_status||null};
  }
  function belemSpatialAdapter() { return state.cityId==="belem" ? (window.ACU_BELEM_UX_R4_SPATIAL||null) : null; }
  function belemViolenceAdapter() { return state.cityId==="belem" ? (window.ACU_BELEM_VIOLENCE_PERIODS||null) : null; }
  const SCHOOL_STAGE_CONTRACT=Object.freeze({
    CRECHE:{runtime_field:"has_creche",label:"Creche"},
    PRE_ESCOLA:{runtime_field:"has_pre_school",label:"Pré-escola"},
    ENSINO_FUNDAMENTAL_ANOS_INICIAIS:{runtime_field:"has_ef_initial_years",label:"Anos iniciais"},
    ENSINO_FUNDAMENTAL_ANOS_FINAIS:{runtime_field:"has_ef_final_years",label:"Anos finais"},
    ENSINO_MEDIO:{runtime_field:"has_high_school",label:"Ensino médio"},
    ENSINO_MEDIO_INTEGRADO:{runtime_field:"has_integrated_high_school",label:"Ensino médio integrado"},
    ENSINO_MEDIO_FIC:{runtime_field:"has_high_school_fic",label:"Ensino médio com FIC"},
    EDUCACAO_PROFISSIONAL:{runtime_field:"has_professional_education",label:"Educação profissional"},
    EJA:{runtime_field:"has_eja",label:"Educação de jovens e adultos"},
    EJA_FUNDAMENTAL:{runtime_field:"has_eja_fundamental",label:"EJA — ensino fundamental"},
    EJA_MEDIO:{runtime_field:"has_eja_high_school",label:"EJA — ensino médio"},
    EJA_PROFISSIONAL:{runtime_field:"has_eja_professional",label:"EJA — educação profissional"}
  });
  function schoolCode(item) { return String(item?.official_code||item?.inep_code||item?.matched_inep||item?.input_inep||""); }
  function canonicalSchoolStages(item) { return Array.isArray(item?.canonical_stages)?item.canonical_stages:Array.isArray(item?.stages)?item.stages:[]; }
  function schoolStageLabel(value) { return SCHOOL_STAGE_CONTRACT[value]?.label||String(value||"Etapa não informada").replaceAll("_"," "); }
  function schoolStageFlags(stages) { const values=new Set(stages||[]);return Object.fromEntries(Object.entries(SCHOOL_STAGE_CONTRACT).map(([stage,contract])=>[contract.runtime_field,values.has(stage)])); }
  function canonicalSchoolWash(item) {
    const code=schoolCode(item),profile=state.schoolProfiles?.records?.[code];
    if(profile?.wash&&Object.prototype.hasOwnProperty.call(profile.wash,"eligible"))return Object.assign({},profile.wash,{source_contract:"GOVERNED_SCHOOL_PROFILE"});
    return Object.assign({},item?.wash||{eligible:null,water:null,sewage:null,multiple_deprivation:null},{source_contract:"CITYWIDE_SCHOOL_CANONICAL"});
  }
  function uiSchool(item) {
    if(!item)return item;
    const stages=Array.isArray(item.canonical_stages)?item.canonical_stages:[...(item.stages||[])];
    return Object.assign({},item,{official_code:item.official_code||item.inep_code||null,territory:item.territory||item.neighborhood||null,district_name:item.district_name||item.district||null,spatial_status:item.spatial_status||item.location_status||null,canonical_stages:stages,stage_flags:schoolStageFlags(stages),stage_labels:stages.map(schoolStageLabel),wash:canonicalSchoolWash(item)});
  }
  function uiEquipment(item) {
    if(!item)return item;
    return Object.assign({},item,{category:item.canonical_category||item.category,subcategory:item.canonical_subcategory||item.subcategory,display_category_pt:item.display_category_pt||publicEquipmentCategory(item.canonical_category||item.category),display_subcategory_pt:item.display_subcategory_pt||item.subcategory||null,territory:item.territory||item.neighborhood||null,district_name:item.district_name||item.district||null,spatial_status:item.spatial_status||item.location_status||null,management:item.management||item.management_level||null,completeness:item.completeness||item.family_completeness_status||item.family_scope_status||null});
  }
  function schoolUniverse() {
    const adapter=belemSpatialAdapter();return adapter?adapter.schools.map(uiSchool):(state.data.schools||[]);
  }
  function equipmentUniverse() {
    const adapter=belemSpatialAdapter();return adapter?adapter.equipment.map(uiEquipment):(state.data.equipment||[]);
  }
  function equipmentMatchesFilters(item) {
    const filters=state.equipmentFilters||{};
    return (R77.equipmentMatch(item,state)??(!filters.category||item.category===filters.category))&&(!filters.subcategory||item.subcategory===filters.subcategory)&&(!filters.status||(item.operational_status||item.status)===filters.status)&&(!filters.governmentLevel||item.government_level===filters.governmentLevel);
  }
  function schoolRowsForContext(context=currentGeo(),options={}) {
    const adapter=belemSpatialAdapter();
    if(adapter){
      const filters=options.applyFilters?{dependency:state.schoolFilters.dependency||undefined,differentiated:state.schoolFilters.differentiated===true,priority:options.priority===true||state.schoolFilters.priority===true,mapOnly:options.mapOnly===true}:{priority:options.priority===true,mapOnly:options.mapOnly===true};
      return adapter.filterSchools(context,filters).map(uiSchool).filter(item=>!options.applyFilters||matchesSchoolFilters(item));
    }
    return schoolUniverse().filter(item=>!options.mapOnly||validCoordinate(item)).filter(item=>matchesTerritory(item)).filter(item=>!options.priority||item.priority).filter(item=>!options.applyFilters||matchesSchoolFilters(item));
  }
  function equipmentRowsForContext(context=currentGeo(),options={}) {
    const adapter=belemSpatialAdapter();let rows;
    if(adapter){
      const filters=options.applyFilters?{category:state.equipmentFilters.category||undefined,subcategory:state.equipmentFilters.subcategory||undefined,status:state.equipmentFilters.status||undefined,government_level:state.equipmentFilters.governmentLevel||undefined,mapOnly:options.mapOnly===true}:{mapOnly:options.mapOnly===true};
      rows=adapter.filterEquipment(context,filters).map(uiEquipment);
    }else rows=equipmentUniverse().filter(item=>!options.mapOnly||validCoordinate(item)).filter(item=>matchesTerritory(item)).filter(item=>!options.applyFilters||equipmentMatchesFilters(item));
    return rows;
  }
  function governedSourceRecords() {
    return [...(state.data?.sources||[]),...(window.ACU_R75_SURVEYS?.sources||[]),...BELEM_PRESENTATION_SOURCES,...Object.values(belemViolenceAdapter()?.source_records||{}),...(belemSpatialAdapter()?.sources||[])];
  }
  function sourceById(sourceId) {
    return governedSourceRecords().find(item=>item.source_id===sourceId)||null;
  }
  function officialSourceLink(source) { return source && source.official_url ? `<a href="${esc(source.official_url)}" target="_blank" rel="noopener noreferrer">Abrir fonte oficial</a>` : "Link oficial não disponível na fonte governada"; }
  function publicMetadata(value) {
    const labels={NOT_PUBLISHED_IN_OFFICIAL_SERVICE:"Não publicado no serviço oficial",PARTIAL:"Cadastro parcial",PARTIAL_OFFICIAL:"Cadastro oficial parcial",PARTIAL_OFFICIAL_REGISTRY:"Cadastro oficial parcial",CANONICAL:"Fonte principal",SUPPORTING:"Fonte complementar",VALIDATION_ONLY:"Somente validação",OFFICIAL_SERVICE:"Serviço oficial",OFFICIAL_ADMINISTRATIVE_SOURCE:"Fonte administrativa oficial",LOCATION_ONLY:"Somente localização",SUBSTANTIVE_DATA:"Dados do cadastro",AVAILABLE:"Disponível",COMPLETE:"Completo",UNKNOWN:"Não informado"};
    return (labels[value]||String(value??"N/D")).replace(/[A-Z][A-Z0-9]+(?:_[A-Z0-9]+)+/g,code=>labels[code]||"Informação não padronizada na fonte").replace(/[A-Za-z]:[\\/][^<\n]*/g,"Referência documental local");
  }
  function shortSourceName(source) {
    if(!source)return "Fonte governada não resolvida";
    if(source.source_id?.startsWith("IBGE_PNADC")||source.source_id?.startsWith("IBGE_PENSE"))return source.institution+" · "+source.title;
    if(state.cityId==="manaus"&&source.source_id==="SRC_INEP_TDI_2025")return "INEP — Distorção idade-série 2025";
    if(state.cityId==="manaus"&&source.source_id==="SRC_INEP_RENDIMENTO_ESCOLAR_2025")return "INEP — Rendimento Escolar 2025";
    const institution=fold(source.institution||"");
    if(institution.includes("ibge"))return "IBGE — Censo 2022";
    if(institution.includes("inep")||institution.includes("mec"))return "INEP — Censo Escolar 2025";
    if(source.source_id==="SRC_CNES_API_DADOS_ABERTOS")return "CNES / Ministério da Saúde";
    if(source.source_id==="SRC_CENSO_SUAS_2024")return "MDS — Censo SUAS 2024";
    if(source.source_id==="SRC_MAPA_CULTURAL_PA")return "SECULT/PA — Mapa Cultural";
    if(source.source_id==="SRC_BELEM_MYMAPS_ESF_2024")return "SESMA — Saúde da Família 2024";
    if(source.source_id==="SRC_OSM_OVERPASS")return "OpenStreetMap / Overpass";
    return `${source.institution||"Instituição"} — ${publicMetadata(source.reference_period||source.title||"fonte governada")}`;
  }
  function shortSourceCitation(sourceIds, label) {
    const ids=[...new Set((sourceIds||[]).filter(Boolean))],sources=ids.map(sourceById).filter(Boolean);
    if(ids.length>1)return `<button type="button" class="inline-source-link" data-source-ids="${esc(ids.join(","))}">${esc(label||"Múltiplas fontes — ver fontes")}</button>`;
    const source=sources[0];
    if(!source)return `<span class="inline-source-missing">Fonte não resolvida</span>`;
    const text=label||shortSourceName(source);
    return source.official_url?`<a class="inline-source-link" href="${esc(source.official_url)}" target="_blank" rel="noopener noreferrer">${esc(text)}</a>`:`<span>${esc(text)}</span>`;
  }
  function cardSource(sourceIds,label) {
    const ids=[...new Set((sourceIds||[]).filter(Boolean))],names=[...new Set(ids.map(sourceById).filter(Boolean).map(shortSourceName))];
    return `<div class="card-source"><button type="button" class="inline-source-link" data-card-source="${esc(ids.join(","))}">${esc(label||names.join(" · ")||"Fonte não resolvida")}</button></div>`;
  }
  document.addEventListener("click",event=>{
    const button=event.target.closest("[data-card-source]");if(!button)return;
    const card=button.closest(".metric-card,.kpi"),detail=card?.querySelector("details.metric-source-methodology");
    if(detail){detail.open=true;detail.querySelector("summary").focus();}else showGovernedSources(button.dataset.cardSource.split(",").filter(Boolean));
  });
  function publicAvailabilityBadge(status) {
    if(!status||status==="AVAILABLE")return "";
    const folded=fold(status),label=folded.includes("partial")?"Parcial":folded.includes("estimate")||folded.includes("approx")?"Estimativa autorizada":folded.includes("period")?"Período parcial":status.startsWith("N/D")?status:"N/D";
    return `<div><span class="tag ${label==="Parcial"||label==="Período parcial"?"warning":"missing"}">${esc(label)}</span></div>`;
  }
  function sourceDetails(title, sourceIds) {
    const ids=[...new Set((sourceIds||[]).filter(Boolean))];
    if(!ids.length)return `<details class="source-methodology missing"><summary>${esc(title)}</summary><p>Rastreabilidade não resolvida; publicação bloqueada.</p></details>`;
    return `<details class="source-methodology"><summary>${esc(title)}</summary>${ids.map(id=>{const source=sourceById(id);if(!source)return `<p class="missing">Fonte governada não resolvida.</p>`;const meta=state.cityId==="belem"?`<small>Período: ${esc(publicMetadata(source.reference_period||"N/D"))} · Geografia: ${esc(publicMetadata(source.source_geography||"N/D"))}</small>`:`<small>Papel: ${esc(publicMetadata(source.source_role))} · Período: ${esc(publicMetadata(source.reference_period||"N/D"))} · Geografia: ${esc(publicMetadata(source.source_geography||"N/D"))}</small>`;return `<div class="source-methodology-record"><strong>${esc(source.institution)}</strong><span>${esc(String(source.title||source.source_title||"Fonte governada").replaceAll("_"," "))}</span><span>${officialSourceLink(source)}</span>${meta}${source.methodological_limitations?`<small>Limitação: ${esc(source.methodological_limitations)}</small>`:""}</div>`;}).join("")}</details>`;
  }
  function metricSourceMethodology(metric,cell=currentCell(metric.indicator_id)) {
    const trace=effectiveMetricTrace(metric),g=governedIndicatorRecord(metric.indicator_id),human=x=>esc(ACU_R75.metadata(x));
    const source=sourceDetails("Fonte",effectiveCellSourceIds(cell,metric)).replace(/^<details[^>]*><summary>.*?<\/summary>/,'').replace(/<\/details>$/,'');
    const fields=[["Período",g?.period||metric.period],["Cobertura territorial",territorialCoverageSummary(metric.indicator_id)],["Escala disponível",availableScaleSummary(metric.indicator_id)],["Definição",g?.definition||metric.definition],["Fórmula/metodologia",metric.formula||metric.aggregation_rule],["Numerador",metric.numerator],["Denominador",metric.denominator],["Limitações",g?.limitations||metric.limitations||"Sem limitação adicional declarada"]];
    if(trace.recoveryMethod)fields.push(["Método de recuperação",trace.recoveryMethod]);
    return `<details class="metric-source-methodology source-methodology"><summary>Fonte e metodologia</summary>${source}<dl>${fields.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${human(v)}</dd>`).join("")}</dl></details>`;
  }
  function compactUniverse(metric) {
    if(!metric)return "";
    const raw=metric.original_variables,vars=(Array.isArray(raw)?raw.join(" · "):String(raw||"")).match(/\b[VvDP]\d{4,6}\b/g)||[];
    const universe=metric.indicator_id.startsWith("demo_")?"População residente · "+metric.label.replace(/ — [N%]$/,""):metric.universe||metric.definition||"Universo não documentado na base";
    return `<small class="r75-universe">${esc(ACU_R75.metadata(universe).split(";")[0].slice(0,155))}${vars.length?" · "+esc([...new Set(vars)].join(", ")):""}</small>`;
  }

  function entitySourceMethodology(item,dataTitle="Fonte dos dados",locationTitle="Fonte da localização") {
    return `<div class="entity-source-methodology">${sourceDetails(dataTitle,item.source_ids||[item.source_id])}${item.location_source_ids&&item.location_source_ids.length?sourceDetails(locationTitle,item.location_source_ids):`<details class="source-methodology"><summary>${esc(locationTitle)}</summary><p>Sem ponto espacial publicado. Ausência de coordenada não significa inexistência da entidade.</p></details>`}</div>`;
  }
  function isDemographicMetric(metricId) { return A.DEMOGRAPHIC_COUNT_IDS.includes(metricId); }
  function isDemographicPresentationGroup(group) { return Boolean(group && (group.theme === "DEMOGRAPHY" || fold(group.theme).includes("demografia"))); }
  function r50RuntimeKey(indicatorId,geographyId,periodId) { return `${indicatorId}\u0000${geographyId}\u0000${periodId}`; }
  function r50RuntimeCell(geographyId,metricId) {
    if(!metricId||!state.data?.r50_runtime)return null;
    const period=selectedViolencePeriod(metricId),row=period&&state.r50RuntimeIndex.get(r50RuntimeKey(metricId,geographyId,period.period_id));
    return row?Object.assign({},row,{unit:metricById(metricId)?.unit||null}):null;
  }
  function rawMetricCell(geographyId, metricId) { return metricId&&((state.data.values[geographyId]&&state.data.values[geographyId][metricId])||r50RuntimeCell(geographyId,metricId)); }
  function presentationPercentageCell(geographyId, group) {
    if (!group || group.count_indicator_id === "demo_population_total_n") return null;
    const countCell = rawMetricCell(geographyId, group.count_indicator_id);
    const reconciled=reconciledPercentage(geographyId,group.percentage_indicator_id||group.count_indicator_id);
    if(reconciled)return Object.assign({},rawMetricCell(geographyId,group.percentage_indicator_id)||countCell,{value:reconciled.percentage,numerator:A.isAvailable(countCell)?countCell.value:null,denominator:reconciled.denominator,unit:"%",status:reconciled.publication_status,source_id:reconciled.numerator_source_id,denominator_source_id:reconciled.denominator_source_id,lineage_id:reconciled.lineage_id,presentation_formula:reconciled.formula,period:reconciled.period,universe:reconciled.universe});
    if (!group.percentage_indicator_id) {
      return null;
    }
    if(!(group.available_measures||[]).includes("percentage"))return {value:null,numerator:null,denominator:null,status:group.percentage_availability||"NOT_AVAILABLE",unit:"%"};
    const percentageCell = rawMetricCell(geographyId, group.percentage_indicator_id);
    const countSourceId=countCell&&(countCell.effective_source_id||countCell.source_id),percentageSourceId=percentageCell&&(percentageCell.effective_source_id||percentageCell.source_id),governedExactPercentage=A.isAvailable(countCell)&&A.isAvailable(percentageCell)&&Number(percentageCell.numerator)===Number(countCell.value)&&Number.isFinite(Number(percentageCell.denominator))&&Number(percentageCell.denominator)>0&&countSourceId&&countSourceId===percentageSourceId;
    if(governedExactPercentage)return Object.assign({},percentageCell,{unit:"%",status:percentageCell.status||"AVAILABLE"});
    if (group.percentage_display_rule === "RECOMPUTE_FROM_COUNT_AND_TOTAL_POPULATION_PRESENTATION_ONLY") {
      const totalCell = rawMetricCell(geographyId, "demo_population_total_n");
      const countMetric = state.data.catalog.find(item=>item.indicator_id===group.count_indicator_id);
      const totalMetric = state.data.catalog.find(item=>item.indicator_id==="demo_population_total_n");
      const countSource = countMetric && sourceById(countMetric.source_id);
      const totalSource = totalMetric && sourceById(totalMetric.source_id);
      const compatiblePeriod = countMetric && totalMetric && String(countMetric.period||"")===String(totalMetric.period||"");
      const compatibleSource = countSource && totalSource && fold(countSource.institution).includes("ibge") && fold(totalSource.institution).includes("ibge");
      const denominator = Number(totalCell && totalCell.value);
      if (!A.isAvailable(countCell) || !A.isAvailable(totalCell) || !compatiblePeriod || !compatibleSource || !Number.isFinite(denominator) || denominator <= 0) {
        return { value:null, numerator:A.isAvailable(countCell)?Number(countCell.value):null, denominator:Number.isFinite(denominator)?denominator:null, status:"INCOMPATIBLE_DENOMINATOR", unit:"%" };
      }
      return { value:100 * Number(countCell.value) / denominator, numerator:Number(countCell.value), denominator, status:"PRESENTATION_DERIVATION_FROM_SAME_GEOGRAPHY_TOTAL_POPULATION", unit:"%", canonical_value:percentageCell && percentageCell.value };
    }
    if (group.percentage_display_rule === "RECOMPUTE_FROM_COUNT_AND_CANONICAL_DENOMINATOR_FOR_PRESENTATION_ONLY") {
      const denominator = Number(percentageCell && percentageCell.denominator);
      if (!A.isAvailable(countCell) || !Number.isFinite(denominator) || denominator <= 0) return { value:null, numerator:A.isAvailable(countCell)?Number(countCell.value):null, denominator:Number.isFinite(denominator)?denominator:null, status:"INCOMPATIBLE_DENOMINATOR", unit:"%" };
      return { value:100 * Number(countCell.value) / denominator, numerator:Number(countCell.value), denominator, status:"PRESENTATION_REPAIR_FROM_GOVERNED_COMPONENTS", unit:"%", canonical_value:percentageCell && percentageCell.value };
    }
    return percentageCell;
  }
  function demographicPercentage(geographyId, metricId) {
    if(metricId==="demo_population_total_n")return {applicable:false,available:false,count:metricCell(geographyId,metricId)?.value??null,status:"NOT_APPLICABLE",percentage_of_total:null,denominator:null};
    const proof=reconciledPercentage(geographyId,metricId);
    if(proof){const cell=rawMetricCell(geographyId,metricId);return {applicable:true,available:proof.publication_status==="AVAILABLE",count:A.isAvailable(cell)?cell.value:null,percentage_of_total:proof.percentage,denominator:proof.denominator,geography_id:geographyId,numerator_source_id:proof.numerator_source_id,denominator_source_id:proof.denominator_source_id,period:proof.period,compatibility:"R62_SOURCE_RECONCILED",status:proof.publication_status,lineage_id:proof.lineage_id,formula:proof.formula,universe:proof.universe};}
    const governed=A.demographicPercentage(state.data,geographyId,metricId);
    if(state.cityId!=="belem"||governed.available||governed.status!=="INCOMPATIBLE_SOURCE")return governed;
    const metric=state.data.catalog.find(item=>item.indicator_id===metricId),totalMetric=state.data.catalog.find(item=>item.indicator_id==="demo_population_total_n"),values=state.data.values[geographyId]||{},cell=values[metricId],totalCell=values.demo_population_total_n,source=metric&&sourceById(metric.source_id),totalSource=totalMetric&&sourceById(totalMetric.source_id);
    const sameInstitution=source&&totalSource&&fold(source.institution).includes("ibge")&&fold(totalSource.institution).includes("ibge");
    if(!metric||!totalMetric||!A.isAvailable(cell)||!A.isAvailable(totalCell)||!sameInstitution||String(metric.period||"")!==String(totalMetric.period||"")||Number(totalCell.value)<=0)return governed;
    return {applicable:true,available:true,count:Number(cell.value),percentage_of_total:Number(cell.value)/Number(totalCell.value)*100,denominator:Number(totalCell.value),geography_id:geographyId,numerator_source_id:metric.source_id,denominator_source_id:totalMetric.source_id,period:metric.period,compatibility:"SAME_INSTITUTION_CENSUS_PERIOD_AND_GEOGRAPHY",status:"DERIVED_SAME_GEOGRAPHY_TOTAL"};
  }
  function governedEvidencePack(data,context) {
    const pack=A.evidencePack(data,context);
    pack.evidence.forEach(item=>{if(!isDemographicMetric(item.indicator_id))return;const percentage=demographicPercentage(item.geography_id,item.indicator_id),cell=metricCell(item.geography_id,item.indicator_id);item.count=percentage.applicable?percentage.count:null;item.percentage_of_total=percentage.applicable?percentage.percentage_of_total:null;item.percentage_denominator=percentage.applicable?percentage.denominator:null;item.denominator_source_id=percentage.applicable?(percentage.denominator_source_id||cell?.denominator_source_id||null):null;item.effective_method=cell?.effective_method||cell?.recovery_method||null;item.percentage_lineage_id=percentage.lineage_id||null;item.percentage_formula=percentage.formula||null;item.percentage_universe=percentage.universe||null;item.percentage_status=percentage.applicable?percentage.status:"NOT_APPLICABLE";item.percentage_compatibility=percentage.applicable?(percentage.compatibility||null):null;});
    return pack;
  }
  function auditGovernedDemographicPercentages() {
    if(state.cityId!=="belem")return A.auditDemographicPercentages(state.data);
    const ids=["demo_age_0_4_n","demo_age_5_9_n","demo_age_10_14_n","demo_age_15_19_n","demo_age_0_19_n","demo_female_n","demo_male_n"],counters={demographic_percentage_mismatch:0,wrong_geography_denominator:0,missing_percentage_presented_as_zero:0,sex_residual_redistribution:0};let tested=0,unavailable=0;
    state.data.geographies.forEach(geography=>{const values=state.data.values[geography.id]||{},total=values.demo_population_total_n;ids.forEach(id=>{const result=demographicPercentage(geography.id,id),cell=values[id];if(!result.available){unavailable+=1;if(result.percentage_of_total===0)counters.missing_percentage_presented_as_zero+=1;return;}tested+=1;const expected=Number(cell.value)/Number(total.value)*100;if(Math.abs(result.percentage_of_total-expected)>1e-10)counters.demographic_percentage_mismatch+=1;if(result.geography_id!==geography.id||result.denominator!==Number(total.value))counters.wrong_geography_denominator+=1;if(["demo_female_n","demo_male_n"].includes(id)&&Math.abs(result.percentage_of_total-expected)>1e-10)counters.sex_residual_redistribution+=1;});});
    return {city_id:state.cityId,tested,unavailable,counters};
  }
  function demographicPercentageText(geographyId, metricId, suffix = true) {
    const result = demographicPercentage(geographyId, metricId);
    return result.available ? `${format(result.percentage_of_total,"%")}${suffix ? " da população" : ""}` : "N/D";
  }
  function mapDisplayCell(geographyId, metricId = state.mapIndicator) {
    const group=presentationGroupForIndicator(metricId)||activePresentationGroup();
    if(group&&state.demographicMapMode==="percentage"&&(metricId===group.percentage_indicator_id))return presentationPercentageCell(geographyId,group);
    if(group&&state.demographicMapMode==="rate"&&group.rate_indicator_id)return metricCell(geographyId,group.rate_indicator_id);
    return metricCell(geographyId, metricId);
  }
  function mapDisplayMetric(metric) {
    if(!metric)return null;
    const group=presentationGroupForIndicator(metric.indicator_id)||activePresentationGroup();
    if(!group)return metric;
    const percentage=state.demographicMapMode==="percentage"&&(metric.indicator_id===group.percentage_indicator_id),rate=state.demographicMapMode==="rate"&&group.rate_indicator_id;
    return Object.assign({},metric,{label:`${group.label} · ${percentage?"Percentual":rate?"Taxa":"Número"}`,unit:percentage?"%":rate?(metricById(group.rate_indicator_id)?.unit||metric.unit):metric.unit,measure_type:percentage?"PERCENT":rate?"RATE":metric.measure_type,presentation_group_id:group.presentation_group_id});
  }
  function metricAvailability(metricId, geographyId) { const cell=metricCell(geographyId,metricId);if(A.isAvailable(cell))return "AVAILABLE";const reason=cell&&(cell.nd_reason||cell.availability_reason||cell.status)||"NOT_AVAILABLE_AT_THIS_GEOGRAPHIC_LEVEL";const labels={SOURCE_SUPPRESSION:"N/D · supressão da fonte",MISSING_SECTOR_VALUES:"N/D · setores incompletos",MISSING_NUMERATOR:"N/D · numerador incompleto",MISSING_DENOMINATOR:"N/D · denominador incompleto",INCOMPATIBLE_DENOMINATOR:"N/D · denominador incompatível",NOT_DERIVABLE_EXACTLY:"N/D · não derivável exatamente",NOT_AVAILABLE_AT_THIS_GEOGRAPHIC_LEVEL:"N/D · granularidade indisponível",SOURCE_NOT_AVAILABLE:"N/D · fonte indisponível"};return labels[reason]||"N/D · indisponibilidade documentada"; }
  function assistantContractError(code, message) { const error=new Error(message);error.code=code;return error; }
  function getActiveGeography() {
    if(!state.cityId||!state.data||!state.geographyId)throw assistantContractError("ACTIVE_GEOGRAPHY_UNRESOLVED","A geografia ativa não está definida.");
    const geography=availableGeographies().find(item=>item.id===state.geographyId);
    if(!geography)throw assistantContractError("ACTIVE_GEOGRAPHY_UNRESOLVED","A geografia ativa não pertence à cidade selecionada.");
    return {cityId:state.cityId,geographyId:geography.id,geographyType:geography.level,geographyName:geographyDisplayName(geography)};
  }

  function renderLanding() {
    $("#city-grid").innerHTML = window.ACU_CITIES.map(city => `<button type="button" class="city-card ${city.status === "AVAILABLE" ? "available" : "preparation"}" data-city="${esc(city.city_id)}" ${city.status === "AVAILABLE" ? "" : "disabled"}><strong>${esc(city.city_name)}</strong><small>${esc(city.state)}</small><span class="status">${city.status === "AVAILABLE" ? "Disponível · explorar" : "Em preparação"}</span></button>`).join("");
    $$(".city-card.available").forEach(button => button.addEventListener("click", () => openCity(button.dataset.city)));
    const citySelect = $("#city-select");
    citySelect.innerHTML = window.ACU_CITIES.filter(city => city.status === "AVAILABLE").map(city => `<option value="${esc(city.city_id)}">${esc(city.city_name)}</option>`).join("");
  }

  function loadCityScript(cityId) {
    const existing = window[`ACU_CITY_DATA_${cityId}`];
    if (existing) return Promise.resolve(existing);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script"); script.src = `cities/${cityId}/city_data.js?v=20260908r51`; script.onload = () => ACU_R79_ASSETS.ready(`ACU_CITY_DATA_${cityId}`).then(resolve,reject); script.onerror = reject; document.body.appendChild(script);
    });
  }

  async function loadAvailabilityMatrix(cityId) {
    try { return await loadScriptOnce(`cities/${cityId}/availability_matrix_r69.js`, `ACU_AVAILABILITY_${cityId}`); }
    catch(error) { console.warn("Availability matrix could not be loaded; embedded cell statuses remain authoritative.",error);return []; }
  }

  function loadScriptOnce(src, globalName) {
    if (window[globalName]) return Promise.resolve(window[globalName]);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.onload = () => ACU_R79_ASSETS.ready(globalName).then(resolve,reject);
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  async function loadReconciledPercentages(cityId) {
    if(cityId!=="manaus")return null;
    const records=await loadScriptOnce("cities/manaus/r62_percentage_metadata_r69.js", "ACU_MANAUS_PERCENTAGES_R69");
    if(records.length!==1105)throw new Error("Metadados de Manaus incompletos.");
    return new Map(records.map(row=>[row.geography_id+"|"+row.indicator_id,row]));
  }
  function reconciledPercentage(geographyId,metricId) {return state.cityId==="manaus"?state.reconciledPercentages?.get(geographyId+"|"+metricId):null;}
  let cityRequest=0;
  async function openCity(cityId, fromHash) {
    const request=++cityRequest,previous={theme:state.theme,indicator:state.indicatorId,measure:state.preferredMeasureMode,municipal:state.data&&currentGeo()?.level==="MUNICIPALITY"};
    setLoading(true);
    try {
      const [data,availabilityMatrix,reconciledPercentages,localContext,coverage,schoolProfiles,displayClips] = await Promise.all([loadCityScript(cityId),loadAvailabilityMatrix(cityId),loadReconciledPercentages(cityId),loadScriptOnce(`cities/${cityId}/context_r71.js`,"ACU_R71_CONTEXT_"+cityId),loadScriptOnce(`cities/${cityId}/coverage_r71.js`,"ACU_R71_COVERAGE_"+cityId),cityId==="belem"?loadScriptOnce("cities/belem/school_profiles.js", "ACU_D1R_BELEM_SCHOOL_PROFILES"):null,loadScriptOnce(`cities/${cityId}/display_clip_r73.js`,"ACU_R73_CLIPS_"+cityId)]);
      if(request!==cityRequest)return false;
      state.localContext=localContext;state.housingCoverage=coverage;
      state.reconciledPercentages=reconciledPercentages;
      if($("#detail-dialog").open)$("#detail-dialog").close();$("#detail-content").innerHTML="";
      window.ACU_R71_PANORAMA?.onCityChange(cityId);
      state.r76SelectionNotice="";state.cityId = cityId; state.data = data; state.module = "panorama"; state.theme=null; state.indicatorId=null; state.mapIndicator = null; state.compareIds = []; state.compareSort="name"; state.compareSelectionTouched=false; state.compareLevel=null; state.comparisonGeographyLevel=defaultComparisonGeographyLevel(cityId); state.programTerritoryIds=(data.config.program_territories||[]).map(item=>item.territory_id); state.mapExtent="MUNICIPALITY"; state.demographicMapMode = "count"; state.mapEvidencePack = null; state.mapAnalysisContext = null; state.violencePeriodByIndicator = {};
      state.r50RuntimeIndex=new Map((data.r50_runtime?.records||[]).map(row=>[r50RuntimeKey(row.indicator_id,row.geography_id,row.period_id),row]));
      state.availabilityMatrix=availabilityMatrix;
      state.geographyId = defaultGeography(cityId);
      state.layerState = { schools: false, priority: false, equipment: false, pct: false };
      state.mapControlSection=null;state.pinnedTooltipGeographyId=null;
      state.schoolFilters = { dependency: "", stage: "", wash: "", differentiated: false, priority: false };
      state.equipmentFilter = ""; state.equipmentFilters = { category:"", subcategory:"", status:"", governmentLevel:"" }; state.sourceFocusIds = []; state.schoolProfiles = null; state.lastEvidencePack = null; state.lastAnalysisContext = null; state.lastAssistantError = null; state.tileError = false; state.stableMapViewport = null; state.mapNavigationIntent = "initial_city"; state.qaMapNavigationCalls = [];
      state.schoolProfiles=schoolProfiles;
      if(!fromHash){
        if(previous.municipal)state.geographyId=availableGeographies().find(g=>g.level==='MUNICIPALITY')?.id||state.geographyId;
        state.theme=previous.theme;state.indicatorId=previous.indicator;state.preferredMeasureMode=previous.measure;
        if(previous.theme!==HOUSING_THEME&&previous.indicator){
          const themes=cityId==='belem'?BELEM_THEME_GROUPS.map(t=>t.id):['sao_paulo','rio_de_janeiro','manaus'].includes(cityId)?FOUNDATION_THEME_CONTRACT.map(t=>t.id):[...new Set(data.catalog.map(t=>t.theme))];
          const compatible=themes.find(t=>publicationMetricsForTheme(t).some(m=>m.indicator_id===previous.indicator&&metricVisibleInContext(m)));
          if(compatible)state.theme=compatible;
        }
      }
      document.body.dataset.activeCity=cityId; applyCityNavigation(cityId);
      $("#landing").hidden = true; $("#platform").hidden = false; $("#city-select").value = cityId;
      $("#crumb-city").textContent = data.config.city_name;
      configureSelectors();if(previous.indicator&&previous.indicator!==state.indicatorId)state.r76SelectionNotice="Seleção ajustada aos indicadores disponíveis nesta cidade."; updateMapIndicatorButton(); renderModule();
      publishQaSnapshot();
      if (!fromHash) updateHash();
    return true;
    } finally { if(request===cityRequest)setLoading(false); }
  }

  const HOUSING_THEME="R71_HOUSEHOLDS";
  const housingSelected=()=>state.theme===HOUSING_THEME;
  function configureSelectors() {
    const keepHousing=housingSelected();
    const territory = $("#territory-select");
    const groups = { AGENDA_CITY_TERRITORY_COLLECTION: "Territórios da Agenda", AGENDA_CITY_TERRITORY: "Territórios da Agenda", MUNICIPALITY: "Município", OPERATIONAL_NEIGHBORHOOD: "Bairros operacionais", IBGE_DISTRICT: "Distritos IBGE", INCID_PLANNING_UNIT: "Unidades de Planejamento — INCID", SP_DISTRICT: "Distritos administrativos", SP_SUBPREFECTURE: "Subprefeituras", RJ_ADMINISTRATIVE_REGION: "Regiões Administrativas", RJ_NEIGHBORHOOD: "Bairros oficiais", RJ_PLANNING_AREA: "Áreas de Planejamento", MANAUS_NEIGHBORHOOD: "Bairros oficiais de Manaus" };
    territory.innerHTML = Object.entries(groups).map(([level, label]) => {
      const geos = availableGeographies().filter(item => item.level === level);
      return geos.length ? `<optgroup label="${esc(label)}">${geos.map(item => `<option value="${esc(item.id)}">${esc(geographyDisplayName(item))}</option>`).join("")}</optgroup>` : "";
    }).join("");
    territory.value = state.geographyId;
    if(state.cityId==="belem"){
      const governedThemes=BELEM_THEME_GROUPS.filter(item=>publicationMetricsForTheme(item.id).some(metric=>indicatorGovernedForPublication(metric)&&metricVisibleInContext(metric))),themeIds=governedThemes.map(item=>item.id);
      state.theme=themeIds.includes(state.theme)?state.theme:BELEM_THEME_GROUPS[0].id;
      if(!themeIds.includes(state.theme))state.theme=themeIds[0]||null;
      $("#theme-select").innerHTML=governedThemes.map(item=>`<option value="${esc(item.id)}">${esc(item.label)}</option>`).join("");
    }else if(["sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId)){
      const groupThemes=new Set(foundationPresentationGroups().filter(group=>indicatorGovernedForPublication({indicator_id:group.count_indicator_id})&&groupHasMapValue(group)).map(group=>group.theme));
      const themes=FOUNDATION_THEME_CONTRACT.filter(theme=>ACU_R76R1.themeVisible(state.cityId,theme.id)&&theme.id!=="Equipamentos e serviços"&&theme.rawThemes.some(raw=>groupThemes.has(raw)||state.data.catalog.some(metric=>metric.theme===raw&&metricVisibleInContext(metric))));
      state.theme=themes.some(theme=>theme.id===state.theme)?state.theme:themes[0]?.id;
      $("#theme-select").innerHTML=themes.map(theme=>`<option value="${esc(theme.id)}">${esc(theme.label)}</option>`).join("");
    }else{
      const themes=[...new Set(state.data.catalog.filter(indicatorGovernedForPublication).filter(metricVisibleInContext).map(item=>item.theme))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
      state.theme=themes.includes(state.theme)?state.theme:themes[0];
      $("#theme-select").innerHTML=themes.map(theme=>`<option>${esc(theme)}</option>`).join("");
    }
    $("#theme-select").insertAdjacentHTML("beforeend",`<option value="${HOUSING_THEME}">Domicílios · Censo 2022</option>`);
    if(keepHousing)state.theme=HOUSING_THEME;
    $("#theme-select").value=state.theme;
    configureIndicators();
  }

  function publicationMetricsForTheme(theme) {
    if(theme===HOUSING_THEME||!ACU_R76R1.themeVisible(state.cityId,theme))return [];
    if(state.cityId==="belem"){
      const group=BELEM_THEME_GROUPS.find(item=>item.id===theme)||BELEM_THEME_GROUPS[0],byId=new Map(state.data.catalog.map(item=>[item.indicator_id,item]));
      if(group.presentationTheme)return BELEM_PRESENTATION_GROUPS.filter(item=>item.theme===group.presentationTheme).sort((left,right)=>left.order-right.order).map(item=>{
        const metric=metricById(item.count_indicator_id);
        return metric?Object.assign({},metric,{label:item.label,presentation_group_id:item.presentation_group_id,presentation_subtheme:item.subtheme}):null;
      }).filter(Boolean);
      if(group.metricIds)return group.metricIds.map(id=>byId.get(id)).filter(Boolean);
      return state.data.catalog.filter(item=>(group.rawThemes||[]).includes(item.theme));
    }
    if(state.cityId==="sao_luis")return state.data.catalog.filter(item=>item.theme===theme&&indicatorGovernedForPublication(item));
    const themeContract=FOUNDATION_THEME_CONTRACT.find(item=>item.id===theme),rawThemes=themeContract?.rawThemes||[theme];
    const groups=foundationPresentationGroups().filter(group=>rawThemes.includes(group.theme)).sort((left,right)=>(left.order||0)-(right.order||0));
    const groupedIds=new Set(groups.flatMap(group=>[group.count_indicator_id,group.percentage_indicator_id,group.rate_indicator_id]).filter(Boolean));
    const byId=new Map(state.data.catalog.map(item=>[item.indicator_id,item]));
    const concepts=groups.map(group=>{
      const metric=byId.get(group.count_indicator_id)||byId.get(group.percentage_indicator_id)||byId.get(group.rate_indicator_id);
      return metric?Object.assign({},metric,{indicator_id:group.count_indicator_id,label:group.label,presentation_group_id:group.presentation_group_id,presentation_subtheme:group.subtheme}):null;
    }).filter(Boolean);
    const ungrouped=state.data.catalog.filter(item=>rawThemes.includes(item.theme)&&!groupedIds.has(item.indicator_id)&&indicatorGovernedForPublication(item));
    return [...concepts,...ungrouped];
  }

  function groupHasSelectedValue(group) {
    return [group.count_indicator_id,group.percentage_indicator_id,group.rate_indicator_id].filter(Boolean).some(id=>A.isAvailable(metricCell(state.geographyId,id)));
  }
  function eligibleMapUnits() {return [...new Set([state.geographyId,...activeMapGeographyIds()].filter(Boolean))];}
  function groupHasMapValue(group) {
    return eligibleMapUnits().some(g=>[group.count_indicator_id,group.percentage_indicator_id,group.rate_indicator_id].filter(Boolean).some(id=>A.isAvailable(metricCell(g,id))));
  }
  function renderDataSituation() {
    const bar=document.getElementById("r76-data-situation");if(!bar||!state.data)return;
    bar.querySelector("a").href="coverage_r76.html#city="+encodeURIComponent(state.cityId);
    bar.querySelector("a").textContent="Situação dos dados · "+state.data.config.city_name;
    bar.querySelector("[role=status]").textContent=state.r76SelectionNotice||"";state.r76SelectionNotice="";
    const catalog=[...state.data.catalog,...(state.cityId==="belem"?BELEM_VIRTUAL_INDICATORS:[])].filter(indicatorGovernedForPublication);
    const has=module=>catalog.some(m=>metricMatchesModuleForR76(m,module)&&A.isAvailable(metricCell(state.geographyId,m.indicator_id)));
    for(const button of $$(".side-nav button[data-module]")){
      const module=button.dataset.module;
      if(["population","living","income"].includes(module))button.hidden=!has(module);
      if(module==="education")button.hidden=!schoolUniverse().length&&!has("education");
      if(module==="equipment")button.hidden=!equipmentUniverse().length;
      if(!ACU_R76R1.moduleVisible(state.cityId,module))button.hidden=true;
      if(module==="violence")button.hidden=!has("violence")&&!catalog.some(m=>m.r50_origin&&A.isAvailable(r50MetricContext(m)?.cell)&&/VIOL|VIOLÊ|SAÚDE|HEALTH/i.test(m.theme));
      if(module==="pct")button.hidden=!["belem","sao_paulo","rio_de_janeiro"].includes(state.cityId)||!state.data.pct?.municipality;
    }
    const order=["panorama","population","education","living","income","equipment","violence","pct","compare","sources","assistant"];
    order.forEach(module=>{const button=$('.side-nav button[data-module="'+module+'"]');if(button)$(".side-nav").appendChild(button);});
  }
  function metricMatchesModuleForR76(metric,module) {
    const text=fold([metric.theme,metric.label,metric.indicator_id].join(" "));
    const rules={population:/demograf|popula|idade|raca|indigen|quilomb/,living:/domic|agua|esgot|sanea|lixo|resid|renda|alfabet|entorno|urban|wash|banheiro/,income:/renda|responsavel|socioeconom/,education:/educa|escola|matric|docent|turma|gestor|abandono|distor/,violence:/violen|protec|segur|homic|agress|fogo cruzado|segup|sinan|sim|viva|isp|sih|sisvan|hospital|nutri|obes|sobrepeso|pneum|bronquiol|asma|influenza/};
    if(["belem","sao_paulo","rio_de_janeiro"].includes(state.cityId)&&["population","living"].includes(module)){
      const theme=module==="population"?(state.cityId==="belem"?"DEMOGRAPHY":"Demografia e adolescentes"):(state.cityId==="belem"?"LIVING_WASH":"Condições domiciliares e WASH");
      return (state.cityId==="belem"?BELEM_PRESENTATION_GROUPS:foundationPresentationGroups()).some(g=>g.theme===theme&&[g.count_indicator_id,g.percentage_indicator_id,g.rate_indicator_id].includes(metric.indicator_id));
    }
    return Boolean(rules[module]?.test(text));
  }

  function metricHasContextData(metric) {
    if(!metric||!state.data)return false;
    const municipal=governedIndicatorRecord(metric.indicator_id)?.publication_mode==="MUNICIPAL_CONTEXT_ONLY"?state.data.geographies.find(item=>item.level==="MUNICIPALITY")?.id:null;
    const ids=[state.geographyId,municipal,...activeMapGeographyIds()].filter(Boolean);
    return [...new Set(ids)].some(id=>A.isAvailable(metricCell(id,metric.indicator_id)));
  }

  function belemContextKey() {
    const geography=currentGeo();
    if(state.cityId!=="belem"||!geography)return null;
    if(geography.id===BELEM_CITY_CONTEXT.id)return "belem_city";
    if(geography.level==="IBGE_DISTRICT")return "district";
    if(geography.level==="OPERATIONAL_NEIGHBORHOOD")return "neighborhood";
    return "acu";
  }
  function contextGeographies() {
    if(state.cityId!=="belem")return currentGeo()?[currentGeo()]:[];
    const key=belemContextKey();
    if(key==="belem_city")return [BELEM_CITY_CONTEXT,...state.data.geographies.filter(item=>item.level==="IBGE_DISTRICT")];
    if(key==="district")return state.data.geographies.filter(item=>item.level==="IBGE_DISTRICT");
    if(key==="neighborhood")return state.data.geographies.filter(item=>item.level==="OPERATIONAL_NEIGHBORHOOD");
    return state.data.geographies.filter(item=>item.level==="AGENDA_CITY_TERRITORY"||item.level==="OPERATIONAL_NEIGHBORHOOD");
  }
  function contextVisibilityForGroup(group) {
    const record=group&&BELEM_CONTEXT_VISIBILITY_BY_GROUP.get(group.presentation_group_id),key=belemContextKey();
    if(!record||!key)return null;
    const fields={belem_city:"visible_in_belem_city",district:"visible_in_district_view",acu:"visible_in_acu_view",neighborhood:"visible_in_neighborhood_view"};
    return Boolean(record[fields[key]]||(key==="belem_city"&&record.visible_in_district_view));
  }
  function availableMeasuresForGroup(group) {
    if(!group)return [];
    if(group.count_indicator_id==="demo_population_total_n")return ["count"];
    const ids={count:group.count_indicator_id,percentage:group.percentage_indicator_id,rate:group.rate_indicator_id};
    const declared=group.count_indicator_id==="demo_population_total_n"?[...new Set([...(group.available_measures||["count"]),"percentage"])]:group.available_measures||["count"];
    if(["sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId))return declared.filter(measure=>ids[measure]&&metricById(ids[measure])&&eligibleMapUnits().some(g=>A.isAvailable(metricCell(g,ids[measure]))));
    return declared.filter(measure=>{
      if(measure==="percentage"&&group.count_indicator_id==="demo_population_total_n")return contextGeographies().some(geography=>A.isAvailable(metricCell(geography.id,group.count_indicator_id)));
      return ids[measure]&&contextGeographies().some(geography=>A.isAvailable(metricCell(geography.id,ids[measure])));
    });
  }
  function metricVisibleInContext(metric) {
    if(!indicatorGovernedForPublication(metric)||governedIndicatorRecord(metric.indicator_id)?.publication_mode==="MUNICIPAL_CONTEXT_ONLY")return false;
    const group=presentationGroupForIndicator(metric.indicator_id);
    if(["sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId)){
      const record=governedIndicatorRecord(metric.indicator_id);
      return record?.public_map_visible===true&&(group?groupHasMapValue(group):metricHasContextData(metric));
    }
    if(state.cityId!=="belem")return group?availableMeasuresForGroup(group).length>0:metricHasContextData(metric);
    if(group)return contextVisibilityForGroup(group)===true&&availableMeasuresForGroup(group).length>0;
    return contextGeographies().some(geography=>A.isAvailable(metricCell(geography.id,metric.indicator_id)));
  }
  function applyMeasureContract(group, preferDefault=false) {
    if(!group){state.demographicMapMode="count";return;}
    const measures=availableMeasuresForGroup(group);
    if(preferDefault)state.demographicMapMode=measures.includes(group.default_measure)?group.default_measure:(measures[0]||"count");
    else if(measures.includes(state.preferredMeasureMode))state.demographicMapMode=state.preferredMeasureMode;
    else if(!measures.includes(state.demographicMapMode))state.demographicMapMode=measures.includes(group.default_measure)?group.default_measure:(measures[0]||"count");
  }

  function configureIndicators() {
    if(!ACU_R76R1.themeVisible(state.cityId,state.theme)){state.r76SelectionNotice="Tema retirado desta cidade; seleção ajustada.";state.theme=null;configureSelectors();return;}
    if(housingSelected()){
      const themes=window.ACU_R70_CONFIG.themes,keys=Object.keys(themes).filter(k=>ACU_R76R1.householdVisible(state.cityId,k)&&window.ACU_R70_CONFIG.cities[state.cityId]?.indicators[k]?.available);if(!keys.includes(String(state.indicatorId).replace('housing:',''))){if(state.indicatorId==='housing:joint')state.r76SelectionNotice='Indicador retirado desta cidade; exibindo média de moradores.';state.indicatorId='housing:residents';}
      const labels={residents:'Moradores — média por domicílio',water:'Água — sem canalização interna',sewage:'Esgoto — sem rede ou fossa séptica/filtro',bathroom:'Banheiro — sem banheiro nem sanitário',waste:'Resíduos — sem coleta direta ou por caçamba',joint:'0–17 anos — sem água interna e sem rede/fossa séptica'};
      $("#indicator-select").innerHTML=keys.map(k=>`<option value="housing:${k}">${esc(labels[k])}</option>`).join('');$("#indicator-select").value=state.indicatorId;state.mapIndicator=null;return;
    }
    const metrics = publicationMetricsForTheme(state.theme).filter(indicatorGovernedForPublication).filter(metricVisibleInContext);
    const normalizedGroup=presentationGroupForIndicator(state.indicatorId);if(normalizedGroup)state.indicatorId=normalizedGroup.count_indicator_id;
    const selectionChanged=!metrics.some(item => item.indicator_id === state.indicatorId);
    if(selectionChanged)state.indicatorId=(metrics[0]||{}).indicator_id||null;
    normalizeGovernedComparisonScale();
    applyMeasureContract(activePresentationGroup(),false);
    if(!metrics.length){const contextOnly=publicationMetricsForTheme(state.theme).some(m=>governedIndicatorRecord(m.indicator_id)?.publication_mode==="MUNICIPAL_CONTEXT_ONLY"),message=contextOnly?"Dados apenas municipais — sem mapa por unidades":"Sem indicador publicável nesta escala";$("#indicator-select").innerHTML='<option value="">'+esc(message)+'</option>';$("#indicator-select").value="";state.mapIndicator=null;return;}
    const grouped=metrics.some(item=>item.presentation_group_id);
    if(grouped){
      const bySubtheme=new Map();metrics.forEach(item=>{const key=item.presentation_subtheme||"INDICADORES";if(!bySubtheme.has(key))bySubtheme.set(key,[]);bySubtheme.get(key).push(item);});
      $("#indicator-select").innerHTML=[...bySubtheme].map(([subtheme,items])=>`<optgroup label="${esc(subtheme)}">${items.map(item=>`<option value="${esc(item.indicator_id)}">${esc(item.label)}</option>`).join("")}</optgroup>`).join("");
    }else $("#indicator-select").innerHTML = metrics.map(item => `<option value="${esc(item.indicator_id)}">${esc(item.label)}</option>`).join("");
    $("#indicator-select").value = state.indicatorId;
    updateMapIndicatorButton();
  }

  function updateMapIndicatorButton() {
    if(housingSelected()){state.mapIndicator=null;return;}
    if (!state.data || !state.indicatorId) { state.mapIndicator = null; return; }
    const metricId=presentationMetricId();
    state.mapIndicator = mapIndicatorUsable(state.indicatorId) ? metricId : null;
  }

  function mapIndicatorUsable(metricId) {
    const group=presentationGroupForIndicator(metricId),resolved=group?presentationMetricId(group):metricId;
    if(citywideComparisonEnabled()&&!governedMapScales(metricId).includes(comparisonGeographyLevel()))return false;
    return Boolean(state.data && thematicMapEngine.context(resolved).map_enabled);
  }

  function moduleHeader() {
    const meta = ["sao_paulo","rio_de_janeiro"].includes(state.cityId)&&FOUNDATION_MODULE_META[state.module]||moduleMeta[state.module];
    const programIdentity=state.cityId==="sao_luis"?"Territórios prioritários: Cidade Operária e Cidade Olímpica":state.data.config.program_territory_summary||"";
    return `<header class="module-head"><div><p>${esc(state.data.config.city_name)} · ${esc(geographyDisplayName(currentGeo()))}</p><h1>${esc(meta[0])}</h1>${programIdentity?`<small class="program-territory-identity">${esc(programIdentity)}</small>`:""}</div><div class="caption">${esc(meta[1])}</div></header>`;
  }

  function kpi(label, value, note, status, sourceIds, sourceLabel, summaryKey) {
    if(value==null||value==="N/D"||value==="undefined")return "";
    const compactAvailability=["sao_paulo","rio_de_janeiro"].includes(state.cityId);
    const badge=["belem","manaus"].includes(state.cityId)?publicAvailabilityBadge(status):compactAvailability?(status&&status!=="AVAILABLE"?`<div class="kpi-status"><span class="tag ${/PARTIAL/.test(status)?"warning":"missing"}">${esc(status)}</span></div>`:""):(status?`<div><span class="tag ${status === "AVAILABLE" ? "" : "missing"}">${esc(status)}</span></div>`:"");
    const key=summaryKey?` data-summary-key="${esc(summaryKey)}"`:"";
    return `<article class="kpi"${key}><div class="label">${esc(label)}</div><strong>${esc(value)}</strong><small>${esc(note || "")}</small>${cardSource(sourceIds,sourceLabel)}${badge}</article>`;
  }

  function presentationGroupCells(group,geographyId=state.geographyId) {
    return {count:metricCell(geographyId,group.count_indicator_id),percentage:presentationPercentageCell(geographyId,group),rate:group.rate_indicator_id?metricCell(geographyId,group.rate_indicator_id):null};
  }
  function presentationGroupSourceIds(group,geographyId=state.geographyId) {
    const metrics=[metricById(group.count_indicator_id),metricById(group.percentage_indicator_id),metricById(group.rate_indicator_id)].filter(Boolean);
    if(state.cityId==="belem")return [...new Set([...(group.source_ids||[]),...metrics.map(metric=>metric.source_id)].filter(Boolean))];
    const effective=metrics.flatMap(metric=>effectiveCellSourceIds(metricCell(geographyId,metric.indicator_id),metric));
    return effective.length?[...new Set(effective)]:[...new Set([...(group.source_ids||[]),...metrics.flatMap(metric=>metric.source_ids||[metric.source_id])].filter(Boolean))];
  }
  function presentationCard(group,options={}) {
    const cells=presentationGroupCells(group),countMetric=metricById(group.count_indicator_id),countAvailable=A.isAvailable(cells.count),pctAvailable=A.isAvailable(cells.percentage);
    if(!countAvailable&&!pctAvailable)return "";
    const count=countAvailable?format(cells.count.value,countMetric?.unit||group.count_unit||"número"):format(cells.percentage.value,"%");
    const percentage=pctAvailable?format(cells.percentage.value,"%"):"N/D";
    const status=countAvailable||pctAvailable?"AVAILABLE":metricAvailability(group.count_indicator_id,state.geographyId);
    const active=activePresentationGroup()?.presentation_group_id===group.presentation_group_id,periodRecord=selectedViolencePeriod(group.count_indicator_id),sourceIds=periodRecord&&periodRecord.source_id?[periodRecord.source_id]:presentationGroupSourceIds(group);
    const percentageContract=(group.available_measures||[]).includes("percentage");
    const pctText=!countAvailable?"":percentageContract?`${percentage}${pctAvailable&&isDemographicPresentationGroup(group)?" da população":""}`:(group.percentage_indicator_id?"Percentual indisponível · inconsistência canônica":"Percentual não aplicável");
    const methodologyMetric=countMetric||metricById(group.percentage_indicator_id);
    return `<article class="metric-card presentation-concept-card ${active?"active":""}" data-presentation-group="${esc(group.presentation_group_id)}" data-family="${semanticProfile(methodologyMetric||{}).family}"><button type="button" class="presentation-card-action" data-presentation-indicator="${esc(group.count_indicator_id)}" aria-label="Selecionar ${esc(group.label)} no mapa"><span class="presentation-card-title">${esc(group.label)}</span><strong>${esc(count)}</strong><span class="metric-percentage ${pctAvailable?"":"missing"}">${esc(pctText)}</span><small class="presentation-card-period">${esc(periodRecord?.period_label||methodologyMetric?.period||group.period||"Período N/D")}</small>${periodRecord?.partial_period?'<span class="tag warning presentation-period-badge">PERÍODO PARCIAL</span>':""}</button>${cardSource(sourceIds)}${publicAvailabilityBadge(status)}${!countAvailable?`<p class="nd-explanation">${esc(ndExplanation(cells.count))}</p>`:""}${compactUniverse(methodologyMetric)}${methodologyMetric?metricSourceMethodology(methodologyMetric):""}</article>`;
  }
  function presentationSection(title,groups,description="") {
    groups=groups.filter(groupHasSelectedValue);if(!groups.length)return "";
    return `<section class="presentation-section"><header><div><h2>${esc(title)}</h2>${description?`<p>${esc(description)}</p>`:""}</div></header><div class="metric-list presentation-metric-list">${groups.map(group=>presentationCard(group)).join("")}</div></section>`;
  }
  function bindPresentationCardActions() {
    $$('[data-presentation-indicator]').forEach(button=>button.addEventListener("click",()=>{
      const group=presentationGroupForIndicator(button.dataset.presentationIndicator);if(!group)return;
      state.indicatorId=group.count_indicator_id;
      applyMeasureContract(group,false);
      const theme=BELEM_THEME_GROUPS.find(item=>item.presentationTheme===group.theme);if(theme)state.theme=theme.id;
      updateMapIndicatorButton();state.module="panorama";configureSelectors();renderModule();
    }));
  }

  function belemFactKPIs(d,facts,geo) {
    const demographicOrder=[
      ["demo_population_total_n","População residente"],
      ["demo_age_0_4_n","Pessoas de 0–4 anos"],
      ["demo_age_5_9_n","Pessoas de 5–9 anos"],
      ["demo_age_10_14_n","Pessoas de 10–14 anos"],
      ["demo_age_15_19_n","Pessoas de 15–19 anos"],
      ["demo_age_0_19_n","Pessoas de 0–19 anos"]
    ];
    const cards=demographicOrder.map(([key,label])=>{
      const cell=metricCell(state.geographyId,key),percentage=demographicPercentage(state.geographyId,key),metric=metricById(key);
      const note=key==="demo_population_total_n"?"Contagem de pessoas · Censo 2022":percentage.available?`${format(percentage.percentage_of_total,"%")} da população · Censo 2022`:"Percentual N/D · Censo 2022";
      return kpi(label,A.isAvailable(cell)?format(cell.value,"pessoas"):"N/D",note,metricAvailability(key,state.geographyId),effectiveCellSourceIds(cell,metric),null,key);
    });
    {
      const spatial=belemSpatialAdapter(),schoolCoverage=spatial?.metadata?.school_coverage,localSchools=schoolRowsForContext(geo),washEligible=localSchools.filter(item=>item.wash&&item.wash.eligible===true).length,municipal=geo.level==="MUNICIPALITY";
      const schoolValue=municipal?(schoolCoverage?.universe_count??localSchools.length):(schoolCoverage?localSchools.length:"N/D");
      const schoolNote=municipal?`${Number(schoolCoverage?.spatialized_count||0).toLocaleString("pt-BR")} de ${Number(schoolCoverage?.universe_count||0).toLocaleString("pt-BR")} com localização validada`:`Contagem point-in-polygon; não é universo territorial completo. Cobertura municipal ${Number(schoolCoverage?.spatial_coverage_pct||0).toLocaleString("pt-BR",{maximumFractionDigits:1})}%`;
      const washNote=washEligible?`${Number(washEligible).toLocaleString("pt-BR")} registros classificáveis no recorte/base coberta; universo WASH separado do universo escolar e da cobertura espacial.`:"Cobertura WASH indisponível ou sem registro classificável; não representa zero.";
      cards.push(
        kpi(municipal?"Escolas em Belém":"Escolas espacialmente identificadas",schoolValue,schoolNote,schoolCoverage?(municipal?"AVAILABLE":"PARTIAL_SPATIAL_COVERAGE"):"SOURCE_NOT_AVAILABLE",BELEM_SCHOOL_TRACE_SOURCE_IDS,"Fontes do universo e da localização · Ver fontes","schools"),
        kpi("Escolas WASH classificáveis",washEligible||"N/D",washNote,washEligible?"PARTIAL_SPATIAL_COVERAGE":"SOURCE_NOT_AVAILABLE",BELEM_SCHOOL_TRACE_SOURCE_IDS,"Fontes do cadastro e da localização · Ver fontes","wash_classifiable")
      );
    }
    const coreIds=new Set(demographicOrder.map(([id])=>id)),group=activePresentationGroup();
    if(group&&!coreIds.has(group.count_indicator_id)){
      const cells=presentationGroupCells(group),metric=metricById(group.count_indicator_id),hasPercentage=Boolean(group.percentage_indicator_id),pct=A.isAvailable(cells.percentage)?format(cells.percentage.value,"%"):"N/D",pctLabel=!hasPercentage?"Medida absoluta":isDemographicPresentationGroup(group)&&A.isAvailable(cells.percentage)?`${pct} da população`:pct;
      const period=selectedViolencePeriod(group.count_indicator_id);cards.push(kpi(group.label,A.isAvailable(cells.count)?format(cells.count.value,metric?.unit||"número"):"N/D",`${pctLabel} · ${period?.period_label||metric?.period||group.period||"Período N/D"}${period?.partial_period?" · PERÍODO PARCIAL":""}`,metricAvailability(group.count_indicator_id,state.geographyId),period?.source_id?[period.source_id]:presentationGroupSourceIds(group),null,"active_context"));
    }else if(!group&&state.mapIndicator&&!coreIds.has(state.mapIndicator)){
      const metric=metricById(state.mapIndicator),cell=currentCell(state.mapIndicator);
      if(metric)cards.push(kpi(metric.label,A.isAvailable(cell)?format(cell.value,metric.unit):"N/D",`${activeMetricPeriod(metric)||"Período N/D"} · ${sourceById(activeMetricSourceIds(metric)[0])?.institution||metric.source||"Fonte N/D"}`,metricAvailability(state.mapIndicator,state.geographyId),activeMetricSourceIds(metric),null,"active_context"));
    }
    return cards.join("");
  }

  function foundationCityFactKPIs(d,facts,geo) {
    const municipality=geo.level==="MUNICIPALITY",schools=schoolRowsForContext(geo),spatialSchools=schools.filter(validCoordinate),washClassifiable=schools.filter(item=>canonicalSchoolWash(item).eligible===true).length;
    const schoolSourceIds=[...new Set(schoolUniverse().flatMap(item=>[...(item.source_ids||[item.source_id]),...(item.location_source_ids||[])]).filter(Boolean))];
    const demographicOrder=[
      ["demo_population_total_n","População residente"],
      ["demo_age_0_4_n","Pessoas de 0–4 anos"],
      ["demo_age_5_9_n","Pessoas de 5–9 anos"],
      ["demo_age_10_14_n","Pessoas de 10–14 anos"],
      ["demo_age_15_19_n","Pessoas de 15–19 anos"],
      ["demo_age_0_19_n","Pessoas de 0–19 anos"]
    ];
    const cards=demographicOrder.map(([key,label])=>{
      const cell=metricCell(state.geographyId,key),percentage=demographicPercentage(state.geographyId,key),metric=metricById(key),available=A.isAvailable(cell);
      const note=key==="demo_population_total_n"?"Contagem de pessoas · Censo 2022":percentage.available?`${format(percentage.percentage_of_total,"%")} da população · Censo 2022`:`${available?"Percentual N/D":ndExplanation(cell)} · Censo 2022`;
      return kpi(label,available?format(cell.value,"pessoas"):"N/D",note,metricAvailability(key,state.geographyId),effectiveCellSourceIds(cell,metric),null,key);
    });
    if(municipality){
      cards.push(kpi("Escolas no município",facts.schools,`${facts.spatial_schools.toLocaleString("pt-BR")} com localização validada (${Number(facts.school_spatial_coverage_pct).toLocaleString("pt-BR",{maximumFractionDigits:2})}%)`,"AVAILABLE",schoolSourceIds,"Dados: INEP · localização: fontes oficiais locais","schools"));
    }
    cards.push(kpi("Escolas WASH classificáveis",washClassifiable,municipality?"Infraestrutura declarada no Censo Escolar 2025; não é resultado programático UNICEF.":"Somente escolas espacialmente identificadas no recorte; ausência de marcador não significa ausência de escola.",municipality?"AVAILABLE":"PARTIAL_SPATIAL_COVERAGE",schoolSourceIds.length?schoolSourceIds:["SRC_INEP_CENSO_ESCOLAR_2025_V2"],"INEP — Censo Escolar 2025","wash_classifiable"));
    if(state.mapIndicator){
      const displayId=presentationMetricId()||state.mapIndicator,metric=metricById(displayId)||metricById(state.mapIndicator),cell=mapDisplayCell(state.geographyId,state.mapIndicator),sourceIds=effectiveCellSourceIds(cell,metric),activePeriod=selectedViolencePeriod(state.mapIndicator);
      if(metric)cards.push(kpi(`Indicador ativo · ${metric.label}`,A.isAvailable(cell)?format(cell.value,cell.unit||metric.unit):"N/D",`${activePeriod?.period_label||metric.period||"Período N/D"} · ${A.isAvailable(cell)?(cell.source_file||shortSourceName(cell.effective_source_id||cell.source_id||activePeriod?.source_id||metric.source_id)):ndExplanation(cell)}`,A.isAvailable(cell)?cell.status:"N/D",sourceIds.length?sourceIds:[activePeriod?.source_id].filter(Boolean),null,"active_indicator"));
    }
    return cards.join("");
  }

  function factKPIs() {
    const d = state.data, facts = d.facts, geo = currentGeo();
    if(state.cityId==="belem")return belemFactKPIs(d,facts,geo);
    if(["sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId))return foundationCityFactKPIs(d,facts,geo);
    const keys = ["demo_population_total_n", "demo_age_0_19_n", "demo_age_10_14_n"];
    const labels = ["População residente", "Pessoas de 0–19 anos", "Pessoas de 10–14 anos"];
    let cards = geo.id===BELEM_CITY_CONTEXT.id ? [] : keys.map((key, index) => {
      const cell = currentCell(key), percentage = demographicPercentage(state.geographyId,key);
      const note = percentage.available ? `${format(percentage.percentage_of_total,"%")} da população · Censo 2022` : "Percentual N/D · Censo 2022";
      const metric=d.catalog.find(item=>item.indicator_id===key);
      return kpi(labels[index], A.isAvailable(cell) ? format(cell.value,"pessoas") : "N/D", note, metricAvailability(key,state.geographyId),effectiveCellSourceIds(cell,metric));
    });
    if(state.cityId==="belem"){
      const group=activePresentationGroup();
      if(group){
        const cells=presentationGroupCells(group),metric=metricById(group.count_indicator_id),hasPercentage=Boolean(group.percentage_indicator_id),pct=A.isAvailable(cells.percentage)?format(cells.percentage.value,"%"):"N/D";
        const pctLabel=!hasPercentage?"Medida absoluta":isDemographicPresentationGroup(group)&&A.isAvailable(cells.percentage)?`${pct} da população`:pct;
        const selected=kpi(group.label,A.isAvailable(cells.count)?format(cells.count.value,metric?.unit||"número"):"N/D",`${pctLabel} · ${metric?.period||group.period||"Período N/D"}`,metricAvailability(group.count_indicator_id,state.geographyId),presentationGroupSourceIds(group));
        const groupIds=new Set([group.count_indicator_id,group.percentage_indicator_id]);
        cards=[selected,...cards.filter((_,index)=>!groupIds.has(keys[index]))];
      }
    }else if (state.mapIndicator && !keys.includes(state.mapIndicator)) {
      const metric=metricById(state.mapIndicator),cell=currentCell(state.mapIndicator);
      if(metric)cards.unshift(kpi(metric.label,A.isAvailable(cell)?format(cell.value,metric.unit):"N/D",`${metric.period||"Período N/D"} · ${cell?.source_file||metric.source||"Fonte N/D"}`,metricAvailability(state.mapIndicator,state.geographyId),effectiveCellSourceIds(cell,metric)));
    }
    if (state.cityId!=="belem" && geo.level === "MUNICIPALITY") cards.push(kpi("Escolas no município", facts.schools, `${facts.spatial_schools} com localização validada (${Number(facts.school_spatial_coverage_pct||0).toLocaleString("pt-BR",{maximumFractionDigits:2})}%)`), kpi("Equipamentos catalogados", facts.equipment, `${facts.spatial_equipment} com coordenada de fonte`), kpi("Unidades de Planejamento", facts.planning_units, "INCID"));
    else if(state.cityId!=="belem") {
      const locatedSchools=state.data.schools.filter(validCoordinate).filter(matchesTerritory).length;
      const locatedEquipment=state.data.equipment.filter(validCoordinate).filter(matchesTerritory).length;
      const territoryContract=(state.data.territory_contracts||[]).find(item=>item.territory_id===geo.id),territoryType=geo.level==="INCID_PLANNING_UNIT"?"UP INCID":geo.level==="AGENDA_CITY_TERRITORY_COLLECTION"?"Coleção ACU":"Recorte ACU",territoryNote=geo.level==="INCID_PLANNING_UNIT"?"Uma das 30 unidades comparáveis":territoryContract?`${territoryContract.sector_count} setores; contrato próprio, não é UP`:`${(state.data.config.program_territories||[]).length} territórios programáticos ativos`,schoolDisplay=locatedSchools||"Nenhuma identificada",schoolNote=locatedSchools?`Entre ${Number(facts.school_spatial_coverage_pct||0).toLocaleString("pt-BR",{maximumFractionDigits:2})}% do universo georreferenciado`:"Cobertura espacial parcial; não indica inexistência",equipmentDisplay=locatedEquipment||"Nenhum identificado",equipmentNote=locatedEquipment?"Somente pontos publicáveis; não é universo completo":"Cobertura espacial parcial; não indica inexistência";cards.push(kpi("Escolas espacialmente identificadas",schoolDisplay,schoolNote,"PARTIAL_SPATIAL_COVERAGE"),kpi("Equipamentos espacialmente identificados",equipmentDisplay,equipmentNote,"PARTIAL_SPATIAL_COVERAGE"),kpi("Tipo territorial",territoryType,territoryNote));
    }
    return cards.join("");
  }

  /* ACU-D1R cartographic core. */
  function mapMeasureModeHtml() {
    const group=activePresentationGroup(),measures=group?availableMeasuresForGroup(group):[],measureLabels={count:isDemographicPresentationGroup(group)?"Pessoas":"Número",percentage:isDemographicPresentationGroup(group)?"% da população":"Percentual",rate:"Taxa"};
    const shouldRender=group&&(state.cityId==="belem"?measures.length>0:measures.length>1);
    return shouldRender?`<fieldset class="demographic-map-mode paired-map-mode measure-toggle" data-component="measureToggle"><legend>Visualizar</legend><div class="measure-toggle-options" role="group" aria-label="Medida exibida no mapa">${measures.map(measure=>`<button type="button" class="map-measure-option${state.demographicMapMode===measure?" is-selected":""}" aria-pressed="${state.demographicMapMode===measure}" data-map-measure-option="${measure}">${measureLabels[measure]}</button>`).join("")}</div></fieldset>`:"";
  }
  function comparisonGeographyControlHtml() {
    if(!citywideComparisonEnabled())return "";
    const levels=citywideComparisonLevels(),record=governedIndicatorRecord(state.indicatorId);
    if(!levels.length)return `<div class="comparison-geography-control scale-profile-only"><span>Visualização territorial</span><strong>${esc(availableScaleSummary())}</strong><small>${esc(governedPublicationMessage())}</small></div>`;
    if(levels.length===1)return `<div class="comparison-geography-control governed-scale-control public-primary-scale"><span>Geografia pública do mapa</span><strong>${esc(governedScaleLabel(levels[0],true))}</strong><small>${esc(record?.communication_rationale||"Esta é a unidade comparável pública da cidade.")}</small></div>`;
    return `<fieldset class="comparison-geography-control governed-scale-control"><legend>Visualização territorial</legend><div class="governed-scale-options" role="group" aria-label="Escala territorial disponível para este indicador">${levels.map(level=>`<button type="button" data-map-scale="${esc(level)}" aria-pressed="${comparisonGeographyLevel()===level}" class="${comparisonGeographyLevel()===level?"is-selected":""}">${esc(governedScaleLabel(level))}</button>`).join("")}</div><select id="map-comparison-geography" class="sr-only" aria-label="Geografia comparativa do mapa">${levels.map(level=>`<option value="${esc(level)}" ${comparisonGeographyLevel()===level?"selected":""}>${esc(governedScaleLabel(level,true))}</option>`).join("")}</select><small>${esc(record?.communication_rationale||"A escala segue o contrato deste indicador.")}</small></fieldset>`;
  }
  function coverageMessageHtml() {
    if(!citywideComparisonEnabled())return "";
    const message=governedPublicationMessage(),record=governedIndicatorRecord(state.indicatorId),level=comparisonGeographyLevel(),partial=record?.coverage_by_scale?.[level]?.complete===false;
    return `<div id="map-coverage-message" class="map-coverage-message${partial?" is-partial":""}" role="status"><strong>${esc(message)}</strong><button type="button" class="inline-source-link" data-indicator-methodology="${esc(state.indicatorId||"")}">Ver fonte e metodologia deste indicador</button></div>`;
  }
  function mapControlsHtml() {
    const schools=schoolUniverse(),equipment=equipmentUniverse(),spatialMetadata=belemSpatialAdapter()?.metadata,coverage=spatialMetadata?.school_coverage,equipmentCoverage=spatialMetadata?.equipment_coverage;
    const schoolCoverage=coverage||{spatialized_count:state.data.facts?.spatial_schools,universe_count:state.data.facts?.schools},equipmentCatalogCoverage=equipmentCoverage||{spatialized_count:state.data.facts?.spatial_equipment,catalog_count:state.data.facts?.equipment};
    const hasPriority=prioritySchools().length>0,hasPct=state.cityId==="belem"&&Boolean(state.data.pct);
    const dependencies = [...new Set(schools.map(item => item.dependency).filter(Boolean))].sort((a,b) => a.localeCompare(b,"pt-BR"));
    const stages = [...new Set(schools.flatMap(item => canonicalSchoolStages(item)))].sort((a,b) => schoolStageLabel(a).localeCompare(schoolStageLabel(b),"pt-BR"));
    const categories = [...new Set(equipment.map(item => item.category).filter(Boolean))].sort((a,b) => a.localeCompare(b,"pt-BR"));
    const subcategories=[...new Set(equipment.map(item=>item.subcategory).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")),statuses=[...new Set(equipment.map(item=>item.operational_status||item.status).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")),governmentLevels=[...new Set(equipment.map(item=>item.government_level).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const unavailableNotice=!state.mapIndicator&&state.cityId==="belem"?`<p class="map-nd-notice">N/D para o mapa comparável: o preenchimento temático foi neutralizado e nenhum valor anterior permanece ativo.</p>`:"";
    const compact=citywideComparisonEnabled(),activeSection=compact?state.mapControlSection:null,levelCount=DIAGNOSTIC_RUNTIME.public_scale_contract?.[state.cityId]?.expected_units?.[comparisonGeographyLevel()],levelLabel=state.cityId==="sao_paulo"?"distritos":state.cityId==="rio_de_janeiro"?"RAs":state.cityId==="manaus"?"bairros":null;
    if(!compact)return `<div class="map-control-panel" aria-label="Camadas e filtros do mapa">
      <div id="governed-scale-slot">${comparisonGeographyControlHtml()}${coverageMessageHtml()}</div><div id="map-measure-control">${mapMeasureModeHtml()}</div><div id="map-unavailable-notice">${unavailableNotice}</div>
      <details open><summary>Camadas</summary><div class="map-control-body">
        <label><input type="checkbox" data-map-layer="schools" ${state.layerState.schools?"checked":""}> Todas as escolas ${schoolCoverage.universe_count!==undefined?`<small>${esc(schoolCoverage.spatialized_count)} de ${esc(schoolCoverage.universe_count)} com localização validada</small>`:""}</label>
        ${hasPriority?`<label><input type="checkbox" data-map-layer="priority" ${state.layerState.priority?"checked":""}> Escolas prioritárias ACU</label>`:""}
        ${R77.active(state.cityId)?"":`<label><input type="checkbox" data-map-layer="equipment" ${state.layerState.equipment?"checked":""}> Equipamentos não escolares ${equipmentCatalogCoverage.catalog_count!==undefined?`<small>${esc(equipmentCatalogCoverage.spatialized_count)} de ${esc(equipmentCatalogCoverage.catalog_count)} registros adquiridos possuem localização validada; completude varia por família</small>`:""}</label>`}
        ${hasPct?`<label><input type="checkbox" data-map-layer="pct" ${state.layerState.pct?"checked":""}> PCT (publicável)</label>`:""}
      </div></details>
      <details><summary>Filtros escolares</summary><div class="map-control-body">
        <select id="map-school-dependency" aria-label="Dependência escolar"><option value="">Todas as dependências</option>${dependencies.map(value=>`<option ${state.schoolFilters.dependency===value?"selected":""}>${esc(value)}</option>`).join("")}</select>
        <select id="map-school-stage" aria-label="Etapa de ensino"><option value="">Todas as etapas</option>${stages.map(value=>`<option value="${esc(value)}" ${state.schoolFilters.stage===value?"selected":""}>${esc(schoolStageLabel(value))}</option>`).join("")}</select>
        <select id="map-school-wash" aria-label="Condição WASH"><option value="">Todo WASH</option><option value="adequate" ${state.schoolFilters.wash==="adequate"?"selected":""}>Rede pública e banheiro declarados</option><option value="inadequate" ${state.schoolFilters.wash==="inadequate"?"selected":""}>Alguma condição não declarada</option><option value="eligible" ${state.schoolFilters.wash==="eligible"?"selected":""}>Classificável</option><option value="not-classifiable" ${state.schoolFilters.wash==="not-classifiable"?"selected":""}>Não classificável</option></select>
        <label><input id="map-school-differentiated" type="checkbox" ${state.schoolFilters.differentiated?"checked":""}> Educação diferenciada</label>${hasPriority?`<label><input id="map-school-priority" type="checkbox" ${state.schoolFilters.priority?"checked":""}> Somente prioritárias ACU</label>`:'<input id="map-school-priority" type="checkbox" hidden>'}
      </div></details>
      <details ${R77.active(state.cityId)?"data-r77-equipment-group":""}><summary>Equipamentos</summary><div class="map-control-body">${R77.active(state.cityId)?`<label><input type="checkbox" data-map-layer="equipment" ${state.layerState.equipment?"checked":""}> Equipamentos não escolares ${equipmentCatalogCoverage.catalog_count!==undefined?`<small>${esc(equipmentCatalogCoverage.spatialized_count)} de ${esc(equipmentCatalogCoverage.catalog_count)} registros adquiridos possuem localização validada; completude varia por família</small>`:""}</label>${R77.controls(state)}`:""}<select ${R77.active(state.cityId)?"hidden":""} id="map-equipment-category" aria-label="Categoria de equipamento"><option value="">Todas as categorias</option>${categories.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.category===value?"selected":""}>${esc(publicEquipmentCategory(value))}</option>`).join("")}</select><select id="map-equipment-subcategory" aria-label="Subcategoria de equipamento"><option value="">Todas as subcategorias</option>${subcategories.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.subcategory===value?"selected":""}>${esc(value)}</option>`).join("")}</select><select id="map-equipment-status" aria-label="Status do equipamento"><option value="">Todos os status</option>${statuses.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.status===value?"selected":""}>${esc(value)}</option>`).join("")}</select><select id="map-equipment-government" aria-label="Nível governamental do equipamento"><option value="">Todos os níveis governamentais</option>${governmentLevels.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.governmentLevel===value?"selected":""}>${esc(value.replaceAll("_"," "))}</option>`).join("")}</select></div></details>
      <div class="map-control-actions"><button type="button" data-map-command="compare">Comparar territórios</button><button type="button" data-map-command="reset">Restaurar mapa</button></div>
      <p id="map-layer-status" class="map-layer-status" aria-live="polite">Camadas territoriais prontas.</p>
    </div>`;
    const compactHeader=compact?`<div class="map-compact-header"><span class="map-geography-chip">${esc(levelCount&&levelLabel?`${levelCount} ${levelLabel}`:governedScaleLabel(comparisonGeographyLevel(),true))}</span><span class="map-coverage-chip${governedIndicatorRecord(state.indicatorId)?.coverage_by_scale?.[comparisonGeographyLevel()]?.complete===false?" is-partial":""}">${governedIndicatorRecord(state.indicatorId)?.coverage_by_scale?.[comparisonGeographyLevel()]?.complete===false?"Cobertura parcial":"Cobertura publicada"}</span></div><div class="map-compact-actions"><button type="button" data-map-panel-section="layers" aria-expanded="${activeSection==="layers"}">Camadas</button><button type="button" data-map-panel-section="filters" aria-expanded="${activeSection==="filters"}">Filtros</button>${R77.active(state.cityId)?`<button type="button" data-map-panel-section="equipment" aria-expanded="${activeSection==="equipment"}">Equipamentos</button>`:""}<button type="button" data-map-command="reset">Restaurar</button></div>`:"";
    return `<div class="map-control-panel${compact?" map-control-panel-compact":""}${compact&&!activeSection?" is-collapsed":""}" aria-label="Camadas e filtros do mapa">
      ${compactHeader}<div id="governed-scale-slot" ${compact?"class=\"map-compact-governance\"":""}>${comparisonGeographyControlHtml()}${coverageMessageHtml()}</div><div id="map-measure-control">${mapMeasureModeHtml()}</div><div id="map-unavailable-notice">${unavailableNotice}</div>
      <section class="map-control-section" data-map-control-section="layers" ${compact&&activeSection!=="layers"?"hidden":""}>${compact?'<div class="map-control-body map-layer-body">':'<details open><summary>Camadas</summary><div class="map-control-body map-layer-body">'}
        <label><input type="checkbox" data-map-layer="schools" ${state.layerState.schools?"checked":""}> Todas as escolas ${schoolCoverage.universe_count!==undefined?`<small>${esc(schoolCoverage.spatialized_count)} de ${esc(schoolCoverage.universe_count)} com localização validada</small>`:""}</label>
        ${hasPriority?`<label><input type="checkbox" data-map-layer="priority" ${state.layerState.priority?"checked":""}> Escolas prioritárias ACU</label>`:""}
        ${R77.active(state.cityId)?"":`<label><input type="checkbox" data-map-layer="equipment" ${state.layerState.equipment?"checked":""}> Equipamentos não escolares ${equipmentCatalogCoverage.catalog_count!==undefined?`<small>${esc(equipmentCatalogCoverage.spatialized_count)} de ${esc(equipmentCatalogCoverage.catalog_count)} registros adquiridos possuem localização validada; completude varia por família</small>`:""}</label>`}
        ${hasPct?`<label><input type="checkbox" data-map-layer="pct" ${state.layerState.pct?"checked":""}> PCT (publicável)</label>`:""}
      ${compact?"</div>":"</div></details>"}</section>
      <section class="map-control-section map-filter-section" data-map-control-section="filters" ${compact&&activeSection!=="filters"?"hidden":""}><details><summary>Filtros escolares</summary><div class="map-control-body">
        <select id="map-school-dependency" aria-label="Dependência escolar"><option value="">Todas as dependências</option>${dependencies.map(value=>`<option ${state.schoolFilters.dependency===value?"selected":""}>${esc(value)}</option>`).join("")}</select>
        <select id="map-school-stage" aria-label="Etapa de ensino"><option value="">Todas as etapas</option>${stages.map(value=>`<option value="${esc(value)}" ${state.schoolFilters.stage===value?"selected":""}>${esc(schoolStageLabel(value))}</option>`).join("")}</select>
        <select id="map-school-wash" aria-label="Condição WASH"><option value="">Todo WASH</option><option value="adequate" ${state.schoolFilters.wash==="adequate"?"selected":""}>Rede pública e banheiro declarados</option><option value="inadequate" ${state.schoolFilters.wash==="inadequate"?"selected":""}>Alguma condição não declarada</option><option value="eligible" ${state.schoolFilters.wash==="eligible"?"selected":""}>Classificável</option><option value="not-classifiable" ${state.schoolFilters.wash==="not-classifiable"?"selected":""}>Não classificável</option></select>
        <label><input id="map-school-differentiated" type="checkbox" ${state.schoolFilters.differentiated?"checked":""}> Educação diferenciada</label>${hasPriority?`<label><input id="map-school-priority" type="checkbox" ${state.schoolFilters.priority?"checked":""}> Somente prioritárias ACU</label>`:'<input id="map-school-priority" type="checkbox" hidden>'}
      </div></details>
      <details ${R77.active(state.cityId)?"data-r77-equipment-group":""}><summary>Equipamentos</summary><div class="map-control-body">${R77.active(state.cityId)?`<label><input type="checkbox" data-map-layer="equipment" ${state.layerState.equipment?"checked":""}> Equipamentos não escolares ${equipmentCatalogCoverage.catalog_count!==undefined?`<small>${esc(equipmentCatalogCoverage.spatialized_count)} de ${esc(equipmentCatalogCoverage.catalog_count)} registros adquiridos possuem localização validada; completude varia por família</small>`:""}</label>${R77.controls(state)}`:""}<select ${R77.active(state.cityId)?"hidden":""} id="map-equipment-category" aria-label="Categoria de equipamento"><option value="">Todas as categorias</option>${categories.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.category===value?"selected":""}>${esc(publicEquipmentCategory(value))}</option>`).join("")}</select><select id="map-equipment-subcategory" aria-label="Subcategoria de equipamento"><option value="">Todas as subcategorias</option>${subcategories.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.subcategory===value?"selected":""}>${esc(value)}</option>`).join("")}</select><select id="map-equipment-status" aria-label="Status do equipamento"><option value="">Todos os status</option>${statuses.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.status===value?"selected":""}>${esc(value)}</option>`).join("")}</select><select id="map-equipment-government" aria-label="Nível governamental do equipamento"><option value="">Todos os níveis governamentais</option>${governmentLevels.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.governmentLevel===value?"selected":""}>${esc(value.replaceAll("_"," "))}</option>`).join("")}</select></div></details></section>
      ${compact?"":'<div class="map-control-actions"><button type="button" data-map-command="compare">Comparar territórios</button><button type="button" data-map-command="reset">Restaurar mapa</button></div>'}
      <p id="map-layer-status" class="map-layer-status" aria-live="polite">Camadas territoriais prontas.</p>
    </div>`;
  }

  function panoramaTerritorialNotice() {
    return state.cityId==="sao_luis"?"Cidade Operária ACU (43 setores) e Cidade Olímpica ACU (36 setores) são recortes programáticos distintos das UPs homônimas (67 e 60 setores).":(state.data.config.limitations||[])[0]||"Limitações metodológicas disponíveis em Fontes e metodologia.";
  }
  function lockBelemMapHeightToRenderedLayout() {
    if(state.cityId!=="belem")return;
    const panel=$(".cartography-grid > .map-panel");
    if(!panel)return;
    const renderedHeight=panel.getBoundingClientRect().height;
    if(renderedHeight>0)panel.style.height=`${renderedHeight}px`;
  }
  function renderPanorama() {
    const territorialNotice=panoramaTerritorialNotice();
    const identity=geographyIdentity(currentGeo());
    $("#module-view").innerHTML = moduleHeader() + `<div id="violence-context-slot" ${violenceContextHtml()?"":"hidden"}>${violenceContextHtml()}</div><div class="dashboard-grid cartography-grid"><section class="panel map-panel">
      <div id="map" class="map-canvas" role="application" aria-label="Mapa territorial de ${esc(state.data.config.city_name)}"></div>
      ${mapControlsHtml()}<div id="map-legend" class="map-legend" hidden></div>
      <div class="map-overlay-note">${citywideComparisonEnabled()?"O mapa mantém a cidade inteira. Clique em uma unidade para atualizar somente a geografia selecionada e o painel; o contorno laranja identifica o território programático ACU.":"Clique em uma unidade para selecionar. Clique novamente na mesma unidade para retornar ao recorte Agenda Cidade. Outros filtros permanecem ativos."}</div>
      </section><aside id="territory-numbers-panel" class="panel panel-pad territory-numbers"><div class="panel-title territory-identity"><div><h2 id="territory-numbers-title">${esc(identity.title)}</h2><small id="territory-numbers-subtitle">${esc(identity.subtitle)}</small></div><span class="tag">Território em números</span></div><div id="territory-numbers-cards" class="kpi-grid">${factKPIs()}</div><div id="territory-numbers-notice" class="notice">${esc(territorialNotice)} Ausência de informação é exibida como N/D, nunca como zero.</div></aside></div>`;
    bindViolencePeriodControl();requestAnimationFrame(initMap);
  }

  function featureId(feature) {
    const p = feature.properties || {};
    if (state.cityId === "belem") return p.CD_BAIRRO ? p.name : (p.district_code ? `DIST::${p.name}` : "DAICO_ACU_OPERATIONAL_2022");
    return p.geography_id || p.territory_id || String(p.CD_MUN || "");
  }
  function featureName(feature) { const p = feature.properties || {}; return p.name || p.incid_up || p.territory_name || p.NM_MUN || "Território"; }
  function featureDisplayName(feature) {
    const geography=state.data.geographies.find(item=>item.id===featureId(feature));
    return geography ? geographyDisplayName(geography) : featureName(feature);
  }
  function mapTerritoryName(feature) {
    const id=featureId(feature),geography=state.data.geographies.find(item=>item.id===id),level=geography?.level;
    if(state.cityId==="manaus")return geography?.name||featureName(feature);
    if(["BRASILANDIA_ACU_OPERATIONAL_2022","CIDADE_TIRADENTES_ACU_OPERATIONAL_2022","PAVUNA_ACU_OPERATIONAL_2022"].includes(id))return {BRASILANDIA_ACU_OPERATIONAL_2022:"Brasilândia",CIDADE_TIRADENTES_ACU_OPERATIONAL_2022:"Cidade Tiradentes",PAVUNA_ACU_OPERATIONAL_2022:"Pavuna"}[id];
    const raw=featureDisplayName(feature);
    if(state.cityId==="sao_paulo"&&level==="SP_DISTRICT")return raw.replace(/^Distrito\s+/i,"");
    if(state.cityId==="rio_de_janeiro"&&level==="RJ_ADMINISTRATIVE_REGION")return raw.replace(/^(?:RA|Região\s+Administrativa(?:\s+de|\s+da|\s+do)?)\s+/i,"");
    return raw;
  }
  const R54_PHYSICAL_GEOGRAPHY_REGISTRY=Object.freeze({
    sao_paulo:Object.freeze({
      "SP_DISTRICT::11":"SP_PHYSICAL::BRASILANDIA","BRASILANDIA_ACU_OPERATIONAL_2022":"SP_PHYSICAL::BRASILANDIA",
      "SP_DISTRICT::25":"SP_PHYSICAL::CIDADE_TIRADENTES","CIDADE_TIRADENTES_ACU_OPERATIONAL_2022":"SP_PHYSICAL::CIDADE_TIRADENTES"
    }),
    rio_de_janeiro:Object.freeze({"RJ_RA::25":"RJ_PHYSICAL::RA_PAVUNA","PAVUNA_ACU_OPERATIONAL_2022":"RJ_PHYSICAL::RA_PAVUNA"})
  });
  function physicalGeographyId(feature) {
    const p=feature?.properties||{},id=featureId(feature),explicit=p.physical_geography_id||p.official_physical_geography_id;
    if(state.cityId==="manaus"){const contract=(state.data.territory_contracts||[]).find(item=>[item.territory_id,item.official_geography_id].includes(id));if(contract)return `manaus::${contract.official_geography_id}`;}
    return explicit||R54_PHYSICAL_GEOGRAPHY_REGISTRY[state.cityId]?.[id]||`${state.cityId}::${id}`;
  }
  function labelPresentationPriority(feature) {
    const id=featureId(feature),program=(feature.properties||{}).territory_role==="PROGRAM_TERRITORY"||state.programTerritoryIds.includes(id);
    if(state.module==="compare")return state.compareIds.includes(id)?10+state.compareIds.indexOf(id):0;return id===state.geographyId?3:program?2:1;
  }
  function physicalLabelWinners() {
    const candidates=[...(activeMapCollection()?.features||[]),...(state.data?.map?.program?.features||[])],winners=new Map();
    candidates.forEach(feature=>{const key=physicalGeographyId(feature),current=winners.get(key);if(!current||labelPresentationPriority(feature)>labelPresentationPriority(current))winners.set(key,feature);});
    return winners;
  }
  function shouldRenderPhysicalLabel(feature) { if(state.module==="compare"&&!state.compareIds.includes(featureId(feature)))return false;return featureId(physicalLabelWinners().get(physicalGeographyId(feature)))===featureId(feature); }
  function representativeLayerPoint(layer) {
    const anchor=layer?.feature?.properties?.governed_label_anchor;
    if(anchor?.inside_polygon===true&&Number.isFinite(anchor.latitude)&&Number.isFinite(anchor.longitude))return L.latLng(anchor.latitude,anchor.longitude);
    if(layer&&typeof layer.getCenter==="function"){try{const center=layer.getCenter();if(center&&Number.isFinite(center.lat)&&Number.isFinite(center.lng))return center;}catch(error){} }
    return layer.getBounds().getCenter();
  }

  function applyCityNavigation(cityId) {
    const nav=$(".side-nav"),buttons=Object.fromEntries($$(".side-nav button[data-module]").map(button=>[button.dataset.module,button]));
    const baseline=[["panorama","01","Panorama"],["population","02","População e adolescentes"],["living","03","Condições domiciliares"],["education","04","Educação"],["equipment","05","Equipamentos e serviços"],["violence","06","Violências e saúde"],["pct","07","Povos e territórios tradicionais"],["compare","08","Comparar territórios"],["assistant","09","Assistente de diagnóstico"],["sources","10","Fontes e metodologia"]];
    const belem=[["panorama","MAPA","Mapa territorial"],["population","01","Demografia e adolescentes"],["education","02","Educação e alfabetização"],["living","03","Condições domiciliares"],["income","04","Renda e condições socioeconômicas"],["equipment","05","Equipamentos e serviços"],["violence","06","Violências e proteção"],["pct","07","Povos, comunidades e territórios tradicionais"],["compare","08","Comparar territórios"],["sources","09","Fontes e metodologia"],["assistant","IA","Assistente de diagnóstico"]];
    const parity=[["panorama","MAPA","Mapa territorial"],["population","01","Demografia e adolescentes"],["education","02","Educação e trajetória escolar"],["living","03","Condições domiciliares"],["income","04","Renda e condições socioeconômicas"],["violence","05","Violências e proteção"],["pct","06","Povos, comunidades e territórios tradicionais"],["compare","07","Comparar territórios"],["sources","08","Fontes e metodologia"],["assistant","IA","Assistente de diagnóstico"]];
    const manaus=[["panorama","MAPA","Mapa territorial"],["population","01","Demografia e adolescentes"],["education","02","Escolas e infraestrutura"],["living","03","Condições domiciliares e WASH"],["equipment","04","Equipamentos e serviços"],["compare","05","Comparar bairros"],["sources","06","Fontes e metodologia"],["assistant","IA","Assistente de diagnóstico"]];
    const configured=state.data?.config?.available_modules,availableDefinition=cityId==="belem"?belem:["sao_paulo","rio_de_janeiro"].includes(cityId)?parity:baseline;
    const allowed=new Set((Array.isArray(configured)?configured:availableDefinition.map(item=>item[0])).filter(module=>!(["sao_paulo","rio_de_janeiro"].includes(cityId)&&module==="equipment")));
    Object.values(buttons).forEach(button=>{button.hidden=!allowed.has(button.dataset.module);});
    (cityId==="belem"?belem:cityId==="manaus"?manaus:["sao_paulo","rio_de_janeiro"].includes(cityId)?parity:baseline).forEach(([module,index,label])=>{const button=buttons[module];if(!button)return;button.hidden=!allowed.has(module);button.innerHTML=`<span>${esc(index)}</span>${esc(label)}`;nav.appendChild(button);});
    const toolsButton=$("#map-tools-button");if(toolsButton){toolsButton.hidden=true;const panoramaButton=buttons.panorama;if(!toolsButton.hidden&&panoramaButton)panoramaButton.insertAdjacentElement("afterend",toolsButton);}
    if(!["belem","sao_paulo","rio_de_janeiro"].includes(cityId)&&buttons.income)buttons.income.hidden=true;
  }
  function defaultGeography(cityId = state.cityId) { if(cityId==="belem")return "DAICO_ACU_OPERATIONAL_2022";const config=state.data&&state.data.config;if(cityId==="manaus"&&config?.default_active_geography_id)return config.default_active_geography_id;return config&&config.default_program_geography_id||"CITY_OPERARIA_ACU_OPERATIONAL_2022"; }
  function citywideComparisonEnabled(cityId=state.cityId) { return ["sao_paulo","rio_de_janeiro","manaus"].includes(cityId); }
  function citywideComparisonLevels() {
    if(["sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId))return governedMapScales();
    return [];
  }
  function defaultComparisonGeographyLevel(cityId=state.cityId) {
    if(cityId==="sao_paulo")return "SP_DISTRICT";
    if(cityId==="rio_de_janeiro")return "RJ_ADMINISTRATIVE_REGION";
    if(cityId==="manaus")return "MANAUS_NEIGHBORHOOD";
    return state.data?.config?.default_comparison_level||null;
  }
  function comparisonGeographyLevel() {
    if(citywideComparisonEnabled()){
      const allowed=citywideComparisonLevels(),fallback=allowed[0]||defaultComparisonGeographyLevel();
      return allowed.includes(state.comparisonGeographyLevel)?state.comparisonGeographyLevel:fallback;
    }
    const active=getActiveGeography();
    if(state.cityId==="belem"&&active.geographyType==="MUNICIPALITY")return "IBGE_DISTRICT";
    if(state.cityId==="belem"&&active.geographyType==="AGENDA_CITY_TERRITORY")return "OPERATIONAL_NEIGHBORHOOD";
    if(state.cityId!=="belem"){
      if(active.geographyType==="AGENDA_CITY_TERRITORY_COLLECTION")return "AGENDA_CITY_TERRITORY";
      if(active.geographyType==="AGENDA_CITY_TERRITORY"&&state.data.geographies.filter(item=>item.program_comparable&&item.level==="AGENDA_CITY_TERRITORY").length>=2)return "AGENDA_CITY_TERRITORY";
      if((state.data.config.comparison_levels||[]).includes(active.geographyType))return active.geographyType;
      return state.data.config.default_comparison_level||(state.cityId==="sao_luis"?"INCID_PLANNING_UNIT":null);
    }
    if(active.geographyType==="AGENDA_CITY_TERRITORY")return "AGENDA_CITY_TERRITORY";if(active.geographyType==="OPERATIONAL_NEIGHBORHOOD"||active.geographyType==="IBGE_DISTRICT"||active.geographyType==="INCID_PLANNING_UNIT")return active.geographyType;
    return state.cityId==="belem"?"OPERATIONAL_NEIGHBORHOOD":"INCID_PLANNING_UNIT";
  }
  function getComparisonGeographies(required = false) {
    const ids=[...new Set(state.compareIds)];
    if(!ids.length)return required?(()=>{throw assistantContractError("COMPARISON_GEOGRAPHIES_UNRESOLVED","Selecione pelo menos duas geografias comparáveis.");})():[];
    const geographies=ids.map(id=>state.data.geographies.find(item=>item.id===id));
    const invalid=geographies.some(item=>!item||!(item.comparable||item.program_comparable));
    const levels=new Set(geographies.filter(Boolean).map(item=>item.level));
    const availableCount=state.data.geographies.filter(item=>(item.comparable||item.program_comparable)&&item.level===[...levels][0]).length;
    const invalidCount=ids.length<2||ids.length>availableCount;
    if(invalid||levels.size!==1||invalidCount){
      if(required)throw assistantContractError("COMPARISON_GEOGRAPHIES_INVALID",`A comparação exige de duas até ${availableCount} geografias homogêneas da cidade ativa.`);
      return [];
    }
    return geographies.map(item=>({cityId:state.cityId,geographyId:item.id,geographyType:item.level,geographyName:item.name}));
  }
  function activeMapGeographyIds() {
    if (!state.data) return [];
    if (state.cityId === "belem" && currentGeo() && ["MUNICIPALITY","IBGE_DISTRICT"].includes(currentGeo().level)) return state.data.geographies.filter(item => item.level === "IBGE_DISTRICT").map(item => item.id);
    const level=state.cityId==="belem"?"OPERATIONAL_NEIGHBORHOOD":comparisonGeographyLevel();
    return state.data.geographies.filter(item => item.level === level).map(item => item.id);
  }
  function activeMapCollection() {
    if(state.cityId==="belem")return ["MUNICIPALITY","IBGE_DISTRICT"].includes(currentGeo().level)?state.data.map.districts:state.data.map.neighborhoods;
    const collections={INCID_PLANNING_UNIT:"planning_units",SP_DISTRICT:"districts",SP_SUBPREFECTURE:"subprefectures",RJ_ADMINISTRATIVE_REGION:"administrative_regions",RJ_NEIGHBORHOOD:"neighborhoods",RJ_PLANNING_AREA:"planning_areas",MANAUS_NEIGHBORHOOD:"neighborhoods",AGENDA_CITY_TERRITORY:"program"};
    return state.data.map[collections[comparisonGeographyLevel()]||"planning_units"];
  }
  function violencePeriodContract(indicatorId) { return state.data?.r50_runtime?.periods_by_indicator?.[indicatorId]||belemViolenceAdapter()?.periods_by_indicator?.[indicatorId]||null; }
  function activeViolenceIndicatorId() {
    const group=activePresentationGroup(),candidates=[group&&group.theme==="VIOLENCE_PROTECTION"&&group.count_indicator_id,state.mapIndicator,state.indicatorId];
    return candidates.find(id=>id&&violencePeriodContract(id))||null;
  }
  function selectedViolencePeriod(indicatorId=activeViolenceIndicatorId()) {
    const contract=indicatorId&&violencePeriodContract(indicatorId);if(!contract)return null;
    const selectedId=state.violencePeriodByIndicator[indicatorId]||contract.default_period_id;
    return contract.periods.find(item=>String(item.period_id)===String(selectedId))||contract.periods.find(item=>String(item.period_id)===String(contract.default_period_id))||contract.periods[0]||null;
  }
  function activeMetricPeriod(metric) { return selectedViolencePeriod(metric&&metric.indicator_id)?.period_label||metric?.period||null; }
  function activeMetricSourceIds(metric) {
    const period=selectedViolencePeriod(metric&&metric.indicator_id);return period&&period.source_id?[period.source_id]:effectiveCellSourceIds(metric&&currentCell(metric.indicator_id),metric);
  }
  function violenceContextGeographyLabel() {
    const level=activeMapGeographyIds().map(id=>state.data.geographies.find(item=>item.id===id)?.level).find(Boolean)||currentGeo()?.level;
    return {IBGE_DISTRICT:"Distritos IBGE de Belém",OPERATIONAL_NEIGHBORHOOD:"Bairros operacionais do DAICO",SP_DISTRICT:"Distritos administrativos",SP_SUBPREFECTURE:"Subprefeituras",RJ_ADMINISTRATIVE_REGION:"Regiões Administrativas",RJ_NEIGHBORHOOD:"Bairros oficiais",RJ_PLANNING_AREA:"Áreas de Planejamento",MANAUS_NEIGHBORHOOD:"Bairros oficiais de Manaus",AGENDA_CITY_TERRITORY:"Território Agenda Cidade",MUNICIPALITY:`Município de ${state.data?.config?.city_name||"origem"}`}[level]||geographyIdentity(currentGeo()).subtitle;
  }
  function violenceContextHtml(indicatorId=activeViolenceIndicatorId()) {
    const contract=indicatorId&&violencePeriodContract(indicatorId);if(!contract)return "";
    const period=selectedViolencePeriod(indicatorId),metric=metricById(indicatorId),source=sourceById(period&&period.source_id||metric?.source_id),periods=contract.periods||[];
    const periodControl=periods.length>1?`<label class="violence-context-field violence-period-field"><span>Período</span><select id="violence-period-select" data-violence-indicator="${esc(indicatorId)}">${periods.map(item=>`<option value="${esc(item.period_id)}" ${period&&String(item.period_id)===String(period.period_id)?"selected":""}>${esc(item.period_label)}</option>`).join("")}</select></label>`:`<div class="violence-context-field"><span>Período</span><strong>${esc(period?.period_label||"N/D")}</strong></div>`;
    return `<section class="violence-context-bar" aria-label="Fonte, período e geografia do indicador de violência"><div class="violence-context-field"><span>Fonte</span><button type="button" class="inline-source-link violence-source-link" data-violence-methodology="${esc(indicatorId)}">${esc(source?.institution||"Fonte governada não resolvida")}</button></div>${periodControl}<div class="violence-context-field"><span>Geografia comparativa</span><strong>${esc(violenceContextGeographyLabel())}</strong></div>${period?.partial_period?`<span class="tag warning violence-partial-badge">PERÍODO PARCIAL · até ${esc(String(period.partial_through||period.period_end||"").split("-").reverse().join("/"))}</span>`:""}</section>`;
  }
  function bindViolencePeriodControl() {
    const select=$("#violence-period-select");if(select)select.addEventListener("change",()=>setViolencePeriod(select.dataset.violenceIndicator,select.value));
  }
  function refreshViolenceContext() {
    const slot=$("#violence-context-slot");if(slot){slot.innerHTML=violenceContextHtml();slot.hidden=!slot.innerHTML;bindViolencePeriodControl();bindPublicSourceActions();}
  }
  function setViolencePeriod(indicatorId,periodId) {
    const contract=violencePeriodContract(indicatorId);if(!contract||!contract.periods.some(item=>String(item.period_id)===String(periodId)))throw new Error("Período governado de violência inexistente para o indicador.");
    const before=mapViewportSnapshot();state.violencePeriodByIndicator[indicatorId]=String(periodId);
    if(mapIsMounted())refreshMapPresentation("period_change",before);else renderModule();
    return selectedViolencePeriod(indicatorId);
  }
  function unavailableVirtualCell(reason = "NOT_AVAILABLE_AT_THIS_GEOGRAPHIC_LEVEL") { return {value:null,numerator:null,denominator:null,status:reason,nd_reason:reason}; }
  function virtualMetricCell(id, metricId) {
    const metric=BELEM_VIRTUAL_INDICATOR_INDEX.get(metricId);if(!metric||state.cityId!=="belem")return null;
    const geography=availableGeographies().find(item=>item.id===id);if(!geography||!(metric.geographies||[]).includes(geography.level))return unavailableVirtualCell();
    const period=selectedViolencePeriod(metricId),periodRows=belemViolenceAdapter()?.records||[];
    if(period){
      const row=periodRows.find(item=>item.indicator_id===metricId&&String(item.period_id)===String(period.period_id)&&String(item.geography_id)===String(id));
      if(!row)return unavailableVirtualCell("NOT_AVAILABLE_AT_THIS_GEOGRAPHIC_LEVEL");
      return {value:row.value===null?null:Number(row.value),numerator:row.value===null?null:Number(row.value),denominator:null,status:row.value_status||"OBSERVED_AGGREGATE",source_file:sourceById(row.source_id)?.institution||row.source_id,source_id:row.source_id,lineage_id:row.lineage_id,period_id:row.period_id,period_label:row.period_label,partial_period:row.partial_period===true,partial_through:row.partial_through||null};
    }
    const adapter=metric.adapter||{},violence=state.data.violence||{};
    if(adapter.kind==="SEGUP_NEIGHBORHOOD_ANNUAL"){
      const all=(violence.segup?.neighborhood_annual?.records||[]).filter(row=>row.crime_category_harmonized===adapter.category);
      const rows=geography.level==="AGENDA_CITY_TERRITORY"?all:all.filter(row=>fold(row.neighborhood_canonical)===fold(geography.name));
      if(!rows.length)return unavailableVirtualCell("SOURCE_NOT_AVAILABLE");
      return {value:rows.reduce((sum,row)=>sum+Number(row.count||0),0),numerator:null,denominator:null,status:"OBSERVED_AGGREGATE",source_file:"SEGUP/SIAC"};
    }
    if(adapter.kind==="SEGUP_DAICO_AGGREGATE"){
      if(geography.id!==defaultGeography())return unavailableVirtualCell();
      const row=(violence.segup?.daico_aggregate||[]).find(item=>item.series_id===adapter.series_id);
      return row&&row.value!==null?{value:Number(row.value),numerator:Number(row.value),denominator:null,status:row.status||"OBSERVED_AGGREGATE",source_file:"SEGUP/SIAC"}:unavailableVirtualCell("SOURCE_NOT_AVAILABLE");
    }
    if(adapter.kind==="FOGO_CRUZADO_OCCURRENCE_AGGREGATE"){
      let geographyType=null,geographyName=null;
       if(geography.level==="MUNICIPALITY"){geographyType="BELEM";geographyName="Belém";}
       else if(geography.level==="AGENDA_CITY_TERRITORY"){geographyType="DAICO";geographyName="DAICO";}
      else if(geography.level==="OPERATIONAL_NEIGHBORHOOD"){geographyType="NEIGHBORHOOD";geographyName=geography.name;}
      else if(geography.level==="IBGE_DISTRICT"){geographyType="DISTRICT";geographyName=geography.name.replace(/^Distrito\s+/i,"");}
      const rows=(violence.fogo_cruzado?.occurrence_series||[]).filter(row=>row.geography_type===geographyType&&fold(row.geography_name)===fold(geographyName)&&row.context_type===adapter.context_type&&row.context_value===adapter.context_value);
      if(!rows.length)return unavailableVirtualCell("SOURCE_NOT_AVAILABLE");
      return {value:rows.reduce((sum,row)=>sum+Number(row[adapter.field]||0),0),numerator:null,denominator:null,status:"OBSERVED_AGGREGATE",source_file:"Instituto Fogo Cruzado — API v2"};
    }
    return unavailableVirtualCell("NOT_DERIVABLE_EXACTLY");
  }
  function metricCell(id, metricId = state.mapIndicator) { return rawMetricCell(id,metricId) || virtualMetricCell(id,metricId); }
  const THEMATIC_PALETTE = Object.freeze(["#e8f3f5","#abd8df","#5ab6ca","#2380aa","#153f69"]);
  const THEMATIC_PALETTES = Object.freeze({
    NEUTRAL_MAGNITUDE:Object.freeze(["#edf5f6","#b9dce2","#71bdcc","#2b86ad","#153f69"]),
    NO_NORMATIVE_DIRECTION:Object.freeze(["#f2f0f7","#d4cbe4","#a79bc5","#7564a3","#493b75"]),
    HIGHER_IS_BETTER:Object.freeze(["#a73a43","#df785d","#eadb9b","#78afc8","#175985"]),
    HIGHER_IS_WORSE:Object.freeze(["#175985","#78afc8","#eadb9b","#df785d","#a73a43"]),
    RED_SEQUENTIAL_QUANTITATIVE:Object.freeze(["#fcebea","#f4b6aa","#e77865","#c84645","#8d2635"]),
    BLUE_SEQUENTIAL_QUANTITATIVE:Object.freeze(["#edf5f8","#bedde8","#7ebbd0","#3f89b0","#175985"]),
    SEQUENTIAL_RED:Object.freeze(["#fcebea","#f4b6aa","#e77865","#c84645","#8d2635"]),
    SEQUENTIAL_BLUE:Object.freeze(["#edf5f8","#bedde8","#7ebbd0","#3f89b0","#175985"]),
    NEUTRAL_SEQUENTIAL:Object.freeze(["#edf5f6","#b9dce2","#71bdcc","#2b86ad","#153f69"]),
    DIVERGING_RED_BLUE:Object.freeze(["#a73a43","#df785d","#eadb9b","#78afc8","#175985"]),
    TEAL_SEQUENTIAL:Object.freeze(["#edf5f6","#b9dce2","#71bdcc","#2b86ad","#153f69"]),
    PURPLE_SEQUENTIAL:Object.freeze(["#f2f0f7","#d4cbe4","#a79bc5","#7564a3","#493b75"]),
    RED_YELLOW_BLUE:Object.freeze(["#a73a43","#df785d","#eadb9b","#78afc8","#175985"]),
    BLUE_YELLOW_RED:Object.freeze(["#175985","#78afc8","#eadb9b","#df785d","#a73a43"])
  });
  const THEMATIC_MISSING = "#c7cdd1";
  const MAP_LABEL_LIGHT = "#f8fbfd";
  const MAP_LABEL_DARK = "#000000";
  function rgbFromHex(color) {
    const value=String(color||"").trim().replace(/^#/,"");
    if(!/^[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(value))return null;
    const expanded=value.length===3?value.split("").map(char=>char+char).join(""):value;
    return [0,2,4].map(index=>parseInt(expanded.slice(index,index+2),16));
  }
  function relativeLuminance(color) {
    const rgb=rgbFromHex(color);if(!rgb)return null;
    const channels=rgb.map(value=>{const normalized=value/255;return normalized<=.04045?normalized/12.92:Math.pow((normalized+.055)/1.055,2.4);});
    return .2126*channels[0]+.7152*channels[1]+.0722*channels[2];
  }
  function contrastRatio(foreground,background) {
    const left=relativeLuminance(foreground),right=relativeLuminance(background);if(left===null||right===null)return 1;
    return (Math.max(left,right)+.05)/(Math.min(left,right)+.05);
  }
  function labelContrastProfile(fillColor) {
    const lightContrast=contrastRatio(MAP_LABEL_LIGHT,fillColor),darkContrast=contrastRatio(MAP_LABEL_DARK,fillColor),onDark=lightContrast>=darkContrast;
    return {fill_color:fillColor,text_color:onDark?MAP_LABEL_LIGHT:MAP_LABEL_DARK,tone:onDark?"on-dark":"on-light",contrast_ratio:Number(Math.max(lightContrast,darkContrast).toFixed(3))};
  }
  function semanticProfile(metric) { return ACU_R75.profile(state.cityId,metric.indicator_id); }
  const thematicMapEngine = Object.freeze({
    context(metricId = state.mapIndicator) {
      if (!state.data || !metricId) return { map_enabled:false, reason:"NO_INDICATOR" };
      const sourceMetric=metricById(metricId);
      if(!sourceMetric)return {map_enabled:false,reason:"INDICATOR_NOT_FOUND"};
      const metric=mapDisplayMetric(sourceMetric);
      const geographyIds=activeMapGeographyIds(),declared=state.availabilityMatrix.find(item=>item.indicator_id===metricId);
      const cells=geographyIds.map(id=>({id,cell:mapDisplayCell(id,metricId)}));
      const numeric=cells.filter(item=>A.isAvailable(item.cell)&&Number.isFinite(Number(item.cell.value))).map(item=>Number(item.cell.value));
      const unique=[...new Set(numeric)].sort((a,b)=>a-b);
      const comparisonLevel=state.data.geographies.find(item=>item.id===geographyIds[0])?.level;
      const declaredAllowed=!declared||declared.available_comparison_geography===true;
      const virtualAllowed=!sourceMetric.presentation_only||(sourceMetric.map_enabled!==false&&(sourceMetric.geographies||[]).includes(comparisonLevel));
      const mapEnabled=declaredAllowed&&virtualAllowed&&numeric.length>0;
      if(!mapEnabled)return {metric,source_metric:sourceMetric,geographyIds,cells,map_enabled:false,reason:!virtualAllowed?"NOT_AVAILABLE_AT_THIS_GEOGRAPHIC_LEVEL":declared&&!declaredAllowed?(declared.availability_reason||"NOT_AVAILABLE_AT_THIS_GEOGRAPHIC_LEVEL"):"NO_TERRITORIAL_VALUES",available_units:numeric.length,total_units:geographyIds.length,missing_units:geographyIds.length-numeric.length};
      const classCount=Math.max(1,Math.min(5,unique.length));
      const thresholds=[];
      for(let index=1;index<classCount;index+=1)thresholds.push(unique[Math.min(unique.length-1,Math.ceil(index*unique.length/classCount)-1)]);
      const semantic=semanticProfile(sourceMetric),basePalette=semantic.palette;
      const palette=classCount===1?[basePalette[2]]:Array.from({length:classCount},(_,index)=>basePalette[Math.round(index*(basePalette.length-1)/(classCount-1))]);
      const bounds=palette.map((color,index)=>({color,min:index===0?unique[0]:thresholds[index-1],max:index<thresholds.length?thresholds[index]:unique[unique.length-1]}));
      return {metric,source_metric:sourceMetric,display_mode:presentationGroupForIndicator(metricId)?state.demographicMapMode:"canonical",geographyIds,cells,map_enabled:true,reason:"TERRITORIAL_VALUES_AVAILABLE",available_units:numeric.length,total_units:geographyIds.length,missing_units:geographyIds.length-numeric.length,unique_values:unique.length,class_count:classCount,thresholds,palette,bounds,min:unique[0],max:unique[unique.length-1],measure_type:metric.measure_type||"OTHER",semantic_direction:semantic.semantic_direction,normative_use_allowed:semantic.normative_use_allowed,palette_strategy:semantic.palette_strategy||"NEUTRAL_SEQUENTIAL",semantic_reason:semantic.reason};
    },
    color(value,context) {
      if(!context||!context.map_enabled||!Number.isFinite(Number(value)))return THEMATIC_MISSING;
      let index=0;while(index<context.thresholds.length&&Number(value)>context.thresholds[index])index+=1;return context.palette[Math.min(index,context.palette.length-1)];
    },
    audit(metricId) {
      const context=this.context(metricId),available=context.available_units||0;
      return {indicator_id:metricId,map_enabled:context.map_enabled,available_units:available,total_units:context.total_units||0,scale_test:!context.map_enabled||Boolean(context.class_count&&context.palette.length===context.class_count),legend_test:!context.map_enabled||Boolean(context.bounds&&context.bounds.length),tooltip_test:!context.map_enabled||available>0,missing_test:THEMATIC_MISSING==="#c7cdd1",semantic_direction:context.semantic_direction||null,normative_use_allowed:context.normative_use_allowed===true,palette_strategy:context.palette_strategy||null,palette:context.palette||[],reason:context.reason};
    }
  });
  function buildMapScale() {
    const context=thematicMapEngine.context();return context.map_enabled?context:null;
  }
  function relativeColor(value) {
    return thematicMapEngine.color(value,state.mapScale);
  }
  function mapStyle(feature) {
    const id = featureId(feature), selected = id === state.geographyId, compared = state.module==="compare"&&state.compareIds.includes(id), cell = mapDisplayCell(id), programFeature=(feature.properties||{}).territory_role==="PROGRAM_TERRITORY";
    return { color: selected ? "#d98324" : compared ? "#172a3a" : "#315b72", weight: selected ? 3.2 : compared ? 2.8 : 1.15,
      fillColor: state.mapIndicator ? (A.isAvailable(cell) ? relativeColor(cell.value) : THEMATIC_MISSING) : "#7ca9bd",
      fillOpacity: housingSelected() ? 0 : state.mapIndicator ? (A.isAvailable(cell) ? .76 : .46) : (programFeature ? 0 : (selected ? .34 : .1)),
      r75MissingKind:/SUPPR/i.test([cell?.status,cell?.nd_reason,cell?.availability_reason].filter(Boolean).join(" "))?"suppressed":"missing",r71Missing: !housingSelected() && Boolean(state.mapIndicator) && !A.isAvailable(cell),
      className: compared ? "acu-comparison-selected" : "",
      dashArray: A.isAvailable(cell) || !state.mapIndicator ? null : "4 4" };
  }
  function activeIndicatorState(feature) {
    const id=featureId(feature),sourceMetric=state.mapIndicator&&metricById(state.mapIndicator),metric=sourceMetric&&mapDisplayMetric(sourceMetric),cell=mapDisplayCell(id),group=activePresentationGroup(),pair=group?presentationGroupCells(group,id):null,countMetric=group&&metricById(group.count_indicator_id);
    const countText=pair&&A.isAvailable(pair.count)?format(pair.count.value,countMetric?.unit||"número"):(metric&&A.isAvailable(cell)?format(cell.value,metric.unit):"N/D");
    const percentageText=pair&&A.isAvailable(pair.percentage)?`${format(pair.percentage.value,"%")}${isDemographicPresentationGroup(group)?" da população":""}`:"Percentual N/D";
    const primary=metric&&A.isAvailable(cell)?ACU_R72.format(cell.value,metric):"N/D",secondary=group?(state.demographicMapMode==="percentage"?countText:A.isAvailable(pair?.percentage)?percentageText:null):null,period=metric?activeMetricPeriod(metric):null,coverage=governedIndicatorRecord(group?.count_indicator_id||metric?.indicator_id)?.coverage_by_scale?.[comparisonGeographyLevel()];
    const sourceId=cell?.source_id||selectedViolencePeriod(group?.count_indicator_id||metric?.indicator_id)?.source_id||metric?.source_id,governedSource=sourceById(sourceId);
    return {id,name:mapTerritoryName(feature),metric,cell,group,pair,countText,percentageText,primary,secondary,period,available:Boolean(metric&&A.isAvailable(cell)),partial:Boolean(selectedViolencePeriod(group?.count_indicator_id||metric?.indicator_id)?.partial_period||coverage?.complete===false),sourceId,source:governedSource?shortSourceName(governedSource):(metric?.source||cell?.source_file||"Fonte não informada")};
  }
  function territoryTooltip(feature) {
    const active=activeIndicatorState(feature),metric=active.metric;
    return `<div class="acu-tooltip acu-territorial-quick-tooltip" data-geography-id="${esc(active.id)}" data-active-indicator-id="${esc(metric?.indicator_id||"")}" data-active-measure="${esc(active.group?state.demographicMapMode:"canonical")}" data-active-period="${esc(active.period||"")}"><strong>${esc(active.name)}</strong>${metric?`<span>${esc(active.group?.label||metric.label)}</span><b>${esc(active.available?active.primary:"N/D")}</b>${active.secondary&&active.available?`<small class="demographic-share">${esc(active.secondary)}</small>`:""}${active.available?"":'<small class="nd-explanation">Dado não disponível para este indicador.</small>'}<small>${esc(active.period||"Período não informado")}${active.partial?" · Cobertura parcial":""}</small><small>${esc(active.source||"Fonte não informada")}</small>`:"<span>Selecionar território</span>"}</div>`;
  }
  function territorialQuickCardHtml(feature) {
    const active=activeIndicatorState(feature),metric=active.metric,label=active.group?.label||metric?.label||"Território";
    return `<article class="acu-quick-card territorial-quick-card" data-quick-card-kind="territory" data-geography-id="${esc(active.id)}" data-physical-geography-id="${esc(physicalGeographyId(feature))}" data-active-indicator-id="${esc(metric?.indicator_id||"")}" data-active-measure="${esc(active.group?state.demographicMapMode:"canonical")}" data-active-period="${esc(active.period||"")}"><button type="button" class="acu-quick-card-close" data-quick-card-close aria-label="Fechar ficha territorial">×</button><header><strong>${esc(active.name)}</strong><span>${esc(label)}</span></header>${metric?(active.available?`<div class="acu-quick-card-value"><b>${esc(active.primary)}</b>${active.secondary?`<small>${esc(active.secondary)}</small>`:""}</div>`:`<div class="acu-quick-card-nd"><b>Dado não disponível</b><button type="button" data-quick-methodology="${esc(metric.indicator_id)}">Ver fonte e metodologia</button></div>`):'<p>Selecione um indicador para consultar o território.</p>'}<footer><span>${esc(active.period||"Período não informado")} · ${esc(active.source)}</span>${active.partial?'<em>Cobertura parcial</em>':""}</footer></article>`;
  }
  function rectIntersectionArea(left,right) { const width=Math.max(0,Math.min(left.right,right.right)-Math.max(left.left,right.left)),height=Math.max(0,Math.min(left.bottom,right.bottom)-Math.max(left.top,right.top));return width*height; }
  function pointRectDistance(point,rect) { const dx=Math.max(rect.left-point.x,0,point.x-rect.right),dy=Math.max(rect.top-point.y,0,point.y-rect.bottom);return Math.sqrt(dx*dx+dy*dy); }
  function relativeDomRect(node,mapRect) { const rect=node.getBoundingClientRect();return {left:rect.left-mapRect.left,top:rect.top-mapRect.top,right:rect.right-mapRect.left,bottom:rect.bottom-mapRect.top,width:rect.width,height:rect.height}; }
  function quickCardObstacles(card,mapRect) {
    return [...state.map.getContainer().querySelectorAll(".leaflet-control-zoom,.map-control-panel,#map-legend:not([hidden]),.map-overlay-note")].filter(node=>node!==card&&getComputedStyle(node).display!=="none"&&node.getBoundingClientRect().width>0).map(node=>relativeDomRect(node,mapRect));
  }
  function layerScreenRect(layer) {
    if(layer?.getBounds){const bounds=layer.getBounds(),nw=state.map.latLngToContainerPoint(bounds.getNorthWest()),se=state.map.latLngToContainerPoint(bounds.getSouthEast());return {left:Math.min(nw.x,se.x),top:Math.min(nw.y,se.y),right:Math.max(nw.x,se.x),bottom:Math.max(nw.y,se.y),width:Math.abs(se.x-nw.x),height:Math.abs(se.y-nw.y)};}
    const point=state.map.latLngToContainerPoint(layer.getLatLng()),radius=Math.max(5,Number(layer.getElement()?.getBoundingClientRect().width||10)/2);return {left:point.x-radius,top:point.y-radius,right:point.x+radius,bottom:point.y+radius,width:radius*2,height:radius*2};
  }
  function quickCardCandidates(anchor,width,height,kind) {
    const gap=kind==="equipment"?22:16,cx=(anchor.left+anchor.right)/2,cy=(anchor.top+anchor.bottom)/2,around=[
      [anchor.right+gap,cy-height/2,"right"],[anchor.left-gap-width,cy-height/2,"left"],[cx-width/2,anchor.top-gap-height,"top"],[cx-width/2,anchor.bottom+gap,"bottom"],
      [anchor.right+gap,anchor.top-height-gap,"top-right"],[anchor.left-width-gap,anchor.top-height-gap,"top-left"],[anchor.right+gap,anchor.bottom+gap,"bottom-right"],[anchor.left-width-gap,anchor.bottom+gap,"bottom-left"]
    ],size=mapContainerSize(),margin=8,safe=[[size.width-margin-width,margin,"safe-top-right"],[margin,size.height-margin-height,"safe-bottom-left"],[size.width-margin-width,size.height-margin-height,"safe-bottom-right"],[margin,margin,"safe-top-left"]];
    return [...around,...safe].map(([x,y,name])=>({x,y,name}));
  }
  function positionQuickCard(card,layer,cursor,kind) {
    if(!mapIsMounted()||!card||!layer)return null;const mapRect=state.map.getContainer().getBoundingClientRect(),anchor=layerScreenRect(layer),width=card.offsetWidth,height=card.offsetHeight,size=mapContainerSize(),obstacles=quickCardObstacles(card,mapRect),pointer=cursor||{x:(anchor.left+anchor.right)/2,y:(anchor.top+anchor.bottom)/2},evaluated=quickCardCandidates(anchor,width,height,kind).map((candidate,index)=>{const rect={left:candidate.x,top:candidate.y,right:candidate.x+width,bottom:candidate.y+height},overflow=Math.max(0,-rect.left)+Math.max(0,-rect.top)+Math.max(0,rect.right-size.width)+Math.max(0,rect.bottom-size.height),featureIntersection=rectIntersectionArea(rect,anchor),overlayCollision=obstacles.reduce((sum,item)=>sum+rectIntersectionArea(rect,item),0),cursorDistance=pointRectDistance(pointer,rect),cursorViolation=kind==="territory"?Math.max(0,32-cursorDistance):0;return {...candidate,index,rect,overflow,featureIntersection,overlayCollision,cursorDistance,cursorViolation,acceptable:overflow===0&&overlayCollision===0&&featureIntersection===0&&cursorViolation===0};}),best=evaluated.find(item=>item.acceptable)||[...evaluated].sort((left,right)=>(left.overflow*100000+left.overlayCollision*100+left.featureIntersection*10+left.cursorViolation*1000+left.index)-(right.overflow*100000+right.overlayCollision*100+right.featureIntersection*10+right.cursorViolation*1000+right.index))[0];
    card.style.left=`${Math.max(4,Math.min(best.x,size.width-width-4))}px`;card.style.top=`${Math.max(4,Math.min(best.y,size.height-height-4))}px`;card.dataset.position=best.name;const actual={left:parseFloat(card.style.left),top:parseFloat(card.style.top),right:parseFloat(card.style.left)+width,bottom:parseFloat(card.style.top)+height};state.quickCardAudit={kind,city_id:state.cityId,entity_id:kind==="territory"?featureId(layer.feature):String(state.quickCard?.item?.id||""),feature_bounds_px:[anchor.left,anchor.top,anchor.right,anchor.bottom].map(Math.round),card_bounds_px:[actual.left,actual.top,actual.right,actual.bottom].map(Math.round),cursor_px:[pointer.x,pointer.y].map(Math.round),position:best.name,intersection_area_px:Math.round(rectIntersectionArea(actual,anchor)),cursor_distance_px:Number(pointRectDistance(pointer,actual).toFixed(2)),overlay_collision_px:Math.round(obstacles.reduce((sum,item)=>sum+rectIntersectionArea(actual,item),0)),overflow_px:Math.round(Math.max(0,-actual.left)+Math.max(0,-actual.top)+Math.max(0,actual.right-size.width)+Math.max(0,actual.bottom-size.height)),outside_feature:rectIntersectionArea(actual,anchor)===0,persistent:card.classList.contains("is-persistent")};if(new URLSearchParams(location.search).get("qa")==="1")publishQaSnapshot();return state.quickCardAudit;
  }
  function ensureQuickCardOverlay(kind) {
    const map=state.map.getContainer(),id=kind==="territory"?"territorial-quick-card":kind==="school"?"school-quick-card":"equipment-quick-card";let card=map.querySelector(`#${id}`);if(!card){card=document.createElement("div");card.id=id;card.className=`acu-quick-card-overlay ${kind}-quick-card-overlay`;card.hidden=true;card.setAttribute("aria-live","polite");map.appendChild(card);L.DomEvent.disableClickPropagation(card);L.DomEvent.disableScrollPropagation(card);}return card;
  }
  function bindQuickCardActions(card) {
    const schoolClose=card.querySelector("[data-school-quick-close]");if(schoolClose)schoolClose.onclick=event=>{event.preventDefault();event.stopPropagation();hideQuickCard("school",true);};
    card.querySelectorAll("[data-source-ids]").forEach(button=>button.onclick=event=>{event.preventDefault();event.stopPropagation();hideQuickCard("school",true);showGovernedSources(button.dataset.sourceIds.split(","),"Fonte e metodologia escolar");});
    card.querySelectorAll("[data-equipment-choice]").forEach(button=>button.onclick=event=>{event.preventDefault();event.stopPropagation();const record=state.markerRecords.find(record=>record.kind==="equipment"&&record.id===button.dataset.equipmentChoice);if(record)showEquipmentQuickCard(record.marker,record.item,null,true);});
    const close=card.querySelector("[data-quick-card-close]");if(close)close.onclick=event=>{event.preventDefault();event.stopPropagation();hideQuickCard(state.quickCard?.kind,true);};
    const methodology=card.querySelector("[data-quick-methodology]");if(methodology)methodology.onclick=event=>{event.preventDefault();event.stopPropagation();const id=methodology.dataset.quickMethodology;hideQuickCard(state.quickCard?.kind,true);openIndicatorMethodology(id);};
    const full=card.querySelector("[data-equipment-full-profile]");if(full)full.onclick=event=>{event.preventDefault();event.stopPropagation();const id=full.dataset.equipmentFullProfile;hideQuickCard(state.quickCard?.kind,true);showDetail("equipment",id);};
  }
  function showQuickCard(kind,layer,content,event,persistent=false,item=null) {
    if(state.quickCard?.persistent&&!persistent)return state.quickCard.card;const prior=state.map.getContainer().querySelector(".acu-quick-card-overlay:not([hidden])");if(prior)prior.hidden=true;const card=ensureQuickCardOverlay(kind),mapRect=state.map.getContainer().getBoundingClientRect(),original=event?.originalEvent||event,cursor=original&&Number.isFinite(original.clientX)&&Number.isFinite(original.clientY)?{x:original.clientX-mapRect.left,y:original.clientY-mapRect.top}:null;card.innerHTML=content;card.hidden=false;card.classList.toggle("is-persistent",persistent);card.setAttribute("role",persistent?"dialog":"status");card.setAttribute("aria-label",kind==="territory"?"Ficha territorial rápida":kind==="school"?"Ficha rápida da escola":"Ficha rápida do equipamento");state.quickCard={kind,layer,feature:layer.feature||null,item,persistent,cursor,card};bindQuickCardActions(card);requestAnimationFrame(()=>positionQuickCard(card,layer,cursor,kind));return card;
  }
  function hideQuickCard(kind,force=false) { if(!state.quickCard||state.quickCard.kind!==kind)return;if(state.quickCard.persistent&&!force)return;const card=state.quickCard.card;if(card)card.hidden=true;state.quickCard=null; }
  function showTerritorialQuickCard(layer,feature,event,persistent=false) { if(!citywideComparisonEnabled())return null;return showQuickCard("territory",layer,territorialQuickCardHtml(feature),event,persistent); }
  function restorePinnedTerritorialQuickCard() { if(!citywideComparisonEnabled()||!state.pinnedTooltipGeographyId)return;let found=null;[state.layers.territories,state.layers.program].filter(Boolean).forEach(group=>group.eachLayer(layer=>{if(featureId(layer.feature)===state.pinnedTooltipGeographyId)found=layer;}));if(found)showTerritorialQuickCard(found,found.feature,null,true); }
  function positionActiveQuickCard() { if(state.quickCard?.card&&!state.quickCard.card.hidden)positionQuickCard(state.quickCard.card,state.quickCard.layer,state.quickCard.cursor,state.quickCard.kind); }
  function featureLabelContrast(feature) {
    if(["sao_paulo","rio_de_janeiro"].includes(state.cityId))return labelContrastProfile(mapStyle(feature).fillColor||THEMATIC_MISSING);
    if(state.cityId!=="belem")return {fill_color:"#ffffff",text_color:MAP_LABEL_DARK,tone:"default",contrast_ratio:contrastRatio(MAP_LABEL_DARK,"#ffffff")};
    return labelContrastProfile(mapStyle(feature).fillColor||THEMATIC_MISSING);
  }
  function mapLabel(feature) {
    const active=activeIndicatorState(feature),contrast=featureLabelContrast(feature);
    return `<div class="acu-map-label-content acu-map-label-${esc(contrast.tone)}" data-geography-id="${esc(active.id)}" data-physical-geography-id="${esc(physicalGeographyId(feature))}" data-active-indicator-id="${esc(active.metric?.indicator_id||"")}" data-active-measure="${esc(active.group?state.demographicMapMode:"canonical")}" data-active-period="${esc(active.period||"")}" data-background-color="${esc(contrast.fill_color)}" data-text-color="${esc(contrast.text_color)}" data-contrast-ratio="${esc(contrast.contrast_ratio)}"><span class="acu-map-label-name">${esc(active.name)}</span>${active.metric?`<b class="acu-map-label-value">${esc(active.available?active.primary:"N/D")}</b>`:""}</div>`;
  }
  function programMapLabel(feature) {
    const active=activeIndicatorState(feature),selectedValue=active.metric?`<b class="acu-map-label-value">${esc(active.available?active.primary:"N/D")}</b>`:"";
    return `<div class="acu-map-label-content" data-geography-id="${esc(active.id)}" data-physical-geography-id="${esc(physicalGeographyId(feature))}" data-active-indicator-id="${esc(active.metric?.indicator_id||"")}" data-active-measure="${esc(active.group?state.demographicMapMode:"canonical")}" data-active-period="${esc(active.period||"")}"><span class="acu-map-label-name">${esc(active.name)}</span>${selectedValue}</div>`;
  }
  function pointIconLegendHtml() {
    const school=state.layerState.schools||state.layerState.priority?`<div class="point-icon-legend-row">${semanticSvg(SCHOOL_SYMBOL,state.layerState.priority&&!state.layerState.schools?"Escola prioritária Agenda Cidade UNICEF":"Escola","school",state.layerState.priority&&!state.layerState.schools)}<span>${state.layerState.priority&&!state.layerState.schools?"Escolas prioritárias ACU":"Escolas"}</span></div>`:"";
    if(!citywideComparisonEnabled()){
      if(!state.layerState.equipment)return school?`<div class="point-icon-legend">${school}</div>`:"";
      const categories=[...new Set(equipmentRowsForMap().map(item=>item.category).filter(Boolean))].sort((left,right)=>publicEquipmentCategory(left).localeCompare(publicEquipmentCategory(right),"pt-BR"));
      const equipment=categories.map(category=>`<div class="point-icon-legend-row">${equipmentInlineIcon(category)}<span>${esc(publicEquipmentCategory(category))}</span></div>`).join("");
      return `<details class="point-icon-legend" open><summary>Símbolos das camadas de pontos</summary>${school}<div class="point-icon-legend-grid">${equipment}</div></details>`;
    }
    if(!state.layerState.equipment)return school?`<details class="point-icon-legend" open><summary>Camadas de pontos</summary>${school}</details>`:"";
    const categories=[...new Set(equipmentRowsForMap().map(item=>item.category).filter(Boolean))].sort((left,right)=>publicEquipmentCategory(left).localeCompare(publicEquipmentCategory(right),"pt-BR"));
    const equipment=categories.map(category=>`<div class="point-icon-legend-row">${equipmentInlineIcon(category)}<span>${esc(publicEquipmentCategory(category))}</span></div>`).join("");
    const selected=state.equipmentFilters.category,categoricalSummary=selected?`Categoria: ${publicEquipmentCategory(selected)}`:`${categories.length} categorias visíveis`;
    return `<details class="point-icon-legend" open><summary>Camadas de pontos</summary>${school}${selected?equipment:`<details class="point-category-legend"><summary>${esc(categoricalSummary)}</summary><div class="point-icon-legend-grid">${equipment}</div></details>`}</details>`;
  }
  function setMapStatus(message, tone = "") { const node=$("#map-layer-status"); if(node){node.textContent=message;node.dataset.tone=tone;} }
  function renderMapLegend() {
    const node=$("#map-legend"); if(!node)return;
    const comparisonLabels={SP_DISTRICT:"Distrito administrativo",SP_SUBPREFECTURE:"Subprefeitura",RJ_ADMINISTRATIVE_REGION:"Região Administrativa",RJ_NEIGHBORHOOD:"Bairro oficial",RJ_PLANNING_AREA:"Área de Planejamento"};
    const geographyKey=state.cityId==="sao_luis"?`<div class="legend-geography-key"><div class="legend-row"><i class="legend-program-line"></i><span>Linha laranja tracejada = Território de atuação da Agenda Cidade UNICEF</span></div><div class="legend-row"><i class="legend-up-polygon"></i><span>Polígono colorido = Unidade de Planejamento — INCID</span></div></div>`:citywideComparisonEnabled()?`<div class="legend-geography-key"><div class="legend-row"><i class="legend-program-line"></i><span>Território ACU</span></div><div class="legend-row"><i class="legend-up-polygon"></i><span>${esc(comparisonLabels[comparisonGeographyLevel()]||(comparisonGeographyLevel()==="MANAUS_NEIGHBORHOOD"?"Bairro oficial":governedScaleLabel(comparisonGeographyLevel(),true)))}</span></div></div>`:"";
    if(!state.mapIndicator || !state.mapScale){node.hidden=state.cityId!=="sao_luis"&&!citywideComparisonEnabled()&&!pointIconLegendHtml();node.innerHTML=geographyKey+pointIconLegendHtml();return;}
    const metric=state.mapScale.metric;
    const mappedSource=citywideComparisonEnabled()?(shortSourceName(sourceById(metric.source_id))||metric.source||state.mapScale.geographyIds.map(id=>mapDisplayCell(id,metric.indicator_id)).find(cell=>cell&&cell.source_file)?.source_file):(state.mapScale.geographyIds.map(id=>mapDisplayCell(id,metric.indicator_id)).find(cell=>cell&&cell.source_file)?.source_file||metric.source||shortSourceName(sourceById(metric.source_id)));
    const labels=ACU_R75.boundaries(state.mapScale.bounds),rows=state.mapScale.bounds.map((bound,i)=>`<div class="legend-row"><i style="background:${bound.color}"></i><span>${esc(labels[i])}</span></div>`).join("");
    const group=activePresentationGroup(),measureLabel=state.demographicMapMode==="percentage"?"percentual":group?.theme==="VIOLENCE_PROTECTION"?"registros":isDemographicPresentationGroup(group)||group?.subtheme?.includes("ALFABET")?"pessoas":"valor";
    const quantitativeDirection=measureLabel==="percentual"?"Menor percentual ← · → Maior percentual":`Menos ${measureLabel} ← · → Mais ${measureLabel}`;
    const direction=ACU_R75.reading(semanticProfile(metric))+" · "+metric.unit;
    const totalPopulationPercentage=group?.count_indicator_id==="demo_population_total_n"&&state.demographicMapMode==="percentage";
    const activePeriod=selectedViolencePeriod(state.mapIndicator);node.hidden=false;
    node.innerHTML=citywideComparisonEnabled()?`${geographyKey}<details class="legend-indicator" open><summary>Indicador</summary><strong>${esc(metric.label)}</strong><small>${esc(activePeriod?.period_label||metric.period||"")} · ${esc(mappedSource)}</small>${activePeriod?.partial_period?'<span class="tag warning legend-partial-period">PERÍODO PARCIAL</span>':""}${rows}<div class="legend-row"><i class="r75-missing-key"></i><span>Sem dado / não aplicável</span></div><div class="legend-row"><i class="r75-suppressed-key"></i><span>Suprimido</span></div><small class="semantic-direction">${esc(totalPopulationPercentage?"100% da população total por definição":direction)}</small></details>${pointIconLegendHtml()}`:`${geographyKey}<strong>${esc(metric.label)}</strong><small>${esc(activePeriod?.period_label||metric.period||"")} · ${esc(mappedSource)}</small>${activePeriod?.partial_period?'<span class="tag warning legend-partial-period">PERÍODO PARCIAL</span>':""}${rows}<div class="legend-row"><i class="r75-missing-key"></i><span>Sem dado / não aplicável</span></div><div class="legend-row"><i class="r75-suppressed-key"></i><span>Suprimido</span></div><small class="semantic-direction">${esc(totalPopulationPercentage?"100% da população total por definição":direction)}</small><small>A cor representa o indicador selecionado na geografia comparativa atual. ${esc(state.mapScale.class_count)} classe(s) para ${esc(state.mapScale.unique_values)} valor(es) distinto(s).</small>${pointIconLegendHtml()}`;
  }

  function presentationPercentageTrace(group,geographyId) {
    if(!group||group.count_indicator_id==="demo_population_total_n"||(group.available_measures||[]).indexOf("percentage")<0)return null;
    const pair=presentationGroupCells(group,geographyId);if(!A.isAvailable(pair.percentage))return null;
    const countMetric=metricById(group.count_indicator_id),percentageMetric=metricById(group.percentage_indicator_id),denominatorMetric=group.denominator_indicator_id?metricById(group.denominator_indicator_id):null;
    const fixedTotal=group.count_indicator_id==="demo_population_total_n";
    const countSource=pair.count?.effective_source_id||pair.count?.source_id||countMetric?.source_id||null,percentageSource=pair.percentage?.effective_source_id||pair.percentage?.source_id||percentageMetric?.source_id||countSource,denominatorSource=fixedTotal?countSource:percentageSource||denominatorMetric?.source_id||null;
    return {derivation_type:group.percentage_display_rule||"GOVERNED_CANONICAL_PERCENTAGE",numerator_indicator_id:group.count_indicator_id,numerator_source_id:countSource,denominator_indicator_id:fixedTotal?group.count_indicator_id:(group.denominator_indicator_id||null),denominator_source_id:denominatorSource,percentage_indicator_id:group.percentage_indicator_id||null,percentage_source_id:percentageSource,formula:fixedTotal?"100 * total_population / total_population":group.percentage_formula||percentageMetric?.formula||null,geography_id:geographyId,period:percentageMetric?.period||countMetric?.period||group.period||null,recovery_method:pair.percentage?.recovery_method||pair.count?.recovery_method||null};
  }
  function presentationEvidencePack(data,context) {
    const canonicalIds=(context.indicatorIds||[]).filter(id=>data.catalog.some(item=>item.indicator_id===id));
    const pack=governedEvidencePack(data,Object.assign({},context,{indicatorIds:canonicalIds}));
    pack.evidence.forEach(item=>{
      const group=presentationGroupForIndicator(item.indicator_id);if(!group)return;
      const pair=presentationGroupCells(group,item.geography_id);
      const evidenceCell=pair.count||metricCell(item.geography_id,item.indicator_id),evidenceMetric=metricById(item.indicator_id),effectiveIds=effectiveCellSourceIds(evidenceCell,evidenceMetric),effectiveId=evidenceCell?.effective_source_id||evidenceCell?.source_id||effectiveIds[0]||item.source_id;
      item.source_id=effectiveId;item.source_ids=effectiveIds.length?effectiveIds:[effectiveId].filter(Boolean);item.lineage_id=evidenceCell?.lineage_id||item.lineage_id;item.source=sourceById(effectiveId)?.institution||evidenceCell?.source_file||item.source;item.source_file=evidenceCell?.source_file||null;item.effective_source_id=effectiveId;item.effective_method=evidenceCell?.effective_method||evidenceCell?.recovery_method||null;item.denominator_source_id=pair.percentage?.denominator_source_id||evidenceCell?.denominator_source_id||null;item.recovery_method=evidenceCell?.recovery_method||null;item.original_status=evidenceCell?.original_status||null;item.recovered_status=evidenceCell?.recovered_status||null;
      item.presentation_group_id=group.presentation_group_id;
      item.count=A.isAvailable(pair.count)?Number(pair.count.value):null;
      item.percentage=A.isAvailable(pair.percentage)?Number(pair.percentage.value):null;
      item.percentage_of_total=isDemographicPresentationGroup(group)&&A.isAvailable(pair.percentage)?Number(pair.percentage.value):null;
      item.rate=A.isAvailable(pair.rate)?Number(pair.rate.value):null;
      item.percentage_denominator=A.isAvailable(pair.percentage)?pair.percentage.denominator:null;
      item.percentage_status=A.isAvailable(pair.percentage)?(pair.percentage.status||"AVAILABLE"):"NOT_AVAILABLE";
      item.paired_count_indicator_id=group.count_indicator_id;
      item.paired_percentage_indicator_id=group.percentage_indicator_id||null;
      item.selected_measure=context.analysisContext?.selected_indicator?.selected_measure||context.filters?.presentation_measure_mode||group.default_measure||"count";
      item.percentage_trace=presentationPercentageTrace(group,item.geography_id);
    });
    const virtualIds=(context.indicatorIds||[]).filter(id=>BELEM_VIRTUAL_INDICATOR_INDEX.has(id));
    (context.geographyIds||[context.geographyId]).forEach(geographyId=>virtualIds.forEach(indicatorId=>{
      const metric=metricById(indicatorId),cell=metricCell(geographyId,indicatorId),geo=availableGeographies().find(item=>item.id===geographyId),group=presentationGroupForIndicator(indicatorId);
      const period=selectedViolencePeriod(indicatorId),sourceId=cell?.source_id||period?.source_id||metric.source_id,lineageId=cell?.lineage_id||period?.lineage_id||metric.lineage_id;pack.evidence.push({claim_id:`${data.config.city_id}:${geographyId}:${indicatorId}:PRIMARY_TERRITORIAL_CLAIM`,city_id:data.config.city_id,geography_id:geographyId,geography_name:geo?geographyDisplayName(geo):geographyId,geography_type:geo?.level||null,indicator_id:indicatorId,label:group?.label||metric.label,geography:geo?geographyDisplayName(geo):geographyId,value:A.isAvailable(cell)?cell.value:null,count:A.isAvailable(cell)?Number(cell.value):null,percentage:null,percentage_of_total:null,rate:null,selected_measure:"count",percentage_denominator:null,percentage_status:"NOT_APPLICABLE",percentage_trace:null,unit:metric.unit,numerator:cell?.numerator??null,denominator:cell?.denominator??null,period:period?.period_label||metric.period,period_id:period?.period_id||null,partial_period:period?.partial_period===true,partial_through:period?.partial_through||null,source_id:sourceId,source_ids:[sourceId].filter(Boolean),lineage_id:lineageId,source:cell?.source_file||sourceById(sourceId)?.institution||metric.source,quality:cell?.status||"SOURCE_NOT_AVAILABLE",availability:A.isAvailable(cell)?"AVAILABLE":cell?.status||"SOURCE_NOT_AVAILABLE",claim_role:"PRIMARY_TERRITORIAL_CLAIM",comparison:null,limitation:metric.limitations||null,allowed_claims:["descriptive_aggregate_value","within_source_within_city_comparison"],forbidden_claims:["causal_impact","individual_identification","geographic_downscaling","source_conflation"]});
    }));
    return pack;
  }

  function refreshMapAnalyticalArtifacts() {
    if(!state.mapIndicator){state.mapAnalysisContext=null;state.mapEvidencePack=null;return;}
    const active=getActiveGeography(),metric=metricById(state.mapIndicator),group=activePresentationGroup();
    if(!metric){state.mapAnalysisContext=null;state.mapEvidencePack=null;return;}
    const period=selectedViolencePeriod(group?.count_indicator_id||metric.indicator_id),pair=group?presentationGroupCells(group,active.geographyId):null,selectedMeasure=group?state.demographicMapMode:"canonical",trace=effectiveMetricTrace(metricById(group?.count_indicator_id||metric.indicator_id)||metric,active.geographyId),analysisContext={city:{city_id:state.cityId,city_name:state.data.config.city_name},active_geography:{geography_id:active.geographyId,geography_name:active.geographyName,geography_type:active.geographyType},selected_indicator:{indicator_id:group?.count_indicator_id||metric.indicator_id,active_measure_indicator_id:metric.indicator_id,presentation_group_id:group?.presentation_group_id||null,label:group?.label||metric.label,display_mode:selectedMeasure,selected_measure:selectedMeasure,count:pair&&A.isAvailable(pair.count)?Number(pair.count.value):null,percentage:pair&&A.isAvailable(pair.percentage)?Number(pair.percentage.value):null,percentage_of_total:isDemographicPresentationGroup(group)&&pair&&A.isAvailable(pair.percentage)?Number(pair.percentage.value):null,rate:pair&&A.isAvailable(pair.rate)?Number(pair.rate.value):null,percentage_trace:group?presentationPercentageTrace(group,active.geographyId):null,source_id:period?.source_id||trace.sourceId,lineage_id:period?.lineage_id||trace.lineageId,effective_source_id:period?.source_id||trace.sourceId,effective_method:trace.effectiveMethod,denominator_source_id:pair?.percentage?.denominator_source_id||trace.denominatorSourceId,recovery_method:trace.recoveryMethod,original_status:trace.originalStatus,recovered_status:trace.recoveredStatus},selected_theme:group?.theme||metric.theme,filters:{module:"panorama",presentation_measure_mode:group?state.demographicMapMode:null,violence_period_id:period?.period_id||null},period:period?.period_label||metric.period||null,partial_period:period?.partial_period===true,partial_through:period?.partial_through||null,comparison_geographies:[],action_type:"MAP"};
    state.mapAnalysisContext=analysisContext;
    state.mapEvidencePack=presentationEvidencePack(state.data,{geographyId:active.geographyId,geographyIds:[active.geographyId],indicatorIds:[group?.count_indicator_id||metric.indicator_id],theme:group?.theme||metric.theme,period:analysisContext.period,filters:analysisContext.filters,actionType:"MAP",analysisContext});
  }

  function mitigateMapLabelCollisions() {
    if(!state.map)return;
    if(window.ACU_R71_PANORAMA?.isActive()){state.map.r72Labels?.schedule();return;}
    refreshValueLabels();
  }
  function refreshValueLabels() {
    if(!mapIsMounted()||window.ACU_R71_PANORAMA?.isActive())return;
    const entries=[],layers=new Map();
    [state.layers.territories,state.layers.program].filter(Boolean).forEach(g=>g.eachLayer(l=>layers.set(featureId(l.feature),l)));
    [state.layers.labels,state.layers.programLabels].filter(Boolean).forEach(g=>g.eachLayer(marker=>{
      const f=marker._acuFeature,l=layers.get(featureId(f));if(!l||!shouldRenderPhysicalLabel(f))return;
      const a=activeIndicatorState(f),visible=ACU_R73_DISPLAY.feature(state.map,f,a.id);if(!visible||state.module==="compare"&&!state.compareIds.includes(a.id)){marker.getElement()?.style.setProperty("display","none","important");return;}entries.push({id:a.id,priority:state.module==="compare"?state.compareIds.indexOf(a.id):null,feature:visible,layer:l,marker,name:a.name,value:a.cell?.value,available:a.available,status:a.cell?.nd_reason||a.cell?.status,unit:a.metric?.unit,measure_type:a.metric?.measure_type,precision:a.metric?.precision,indicator:a.metric?.indicator_id});
    }));
    state.map.r72Labels?.set(state.mapIndicator?entries:[]);
    ACU_R72R1.setArea(state.map,state.mapIndicator?(state.module==="compare"?entries.map(e=>e.feature):ACU_R73_DISPLAY.area(state.map)||(activeMapCollection()?.features||[])):[]);
  }
  function scheduleMapLabelCollisionAudit() { requestAnimationFrame(()=>requestAnimationFrame(()=>{mitigateMapLabelCollisions();publishQaSnapshot();})); }

  function mapIsMounted() {
    return Boolean(state.map&&state.map.getContainer&&state.map.getContainer().isConnected&&$("#map")===state.map.getContainer());
  }
  function mapViewportSnapshot() {
    if(!mapIsMounted()||!state.map._loaded)return null;
    const center=state.map.getCenter(),bounds=state.map.getBounds(),zoom=state.map.getZoom(),projected=state.map.project(center,zoom),container=state.map.getContainer();
    return {center:[center.lat,center.lng],zoom,bounds:[bounds.getSouth(),bounds.getWest(),bounds.getNorth(),bounds.getEast()],projected_center_pixel:[projected.x,projected.y],container_size:[container.clientWidth,container.clientHeight]};
  }
  const MAP_VIEWPORT_CENTER_TOLERANCE=1e-9;
  function withAllowedMapNavigation(action,callback) {
    const previousAction=state.qaMapAction,previousAllowed=state.qaMapNavigationAllowed;state.qaMapAction=action;state.qaMapNavigationAllowed=true;
    try{return callback();}finally{state.qaMapAction=previousAction;state.qaMapNavigationAllowed=previousAllowed;}
  }
  function installQaMapNavigationInstrumentation() {
    if(new URLSearchParams(location.search).get("qa")!=="1"||!state.map||state.map._acuR4R2NavigationInstrumented)return;
    Object.defineProperty(state.map,"_acuR4R2NavigationInstrumented",{value:true});
    const container=state.map.getContainer(),markUserGesture=()=>{state.qaUserMapGestureUntil=performance.now()+1200;};
    ["pointerdown","wheel","keydown"].forEach(type=>container.addEventListener(type,markUserGesture,{capture:true,passive:true}));
    ["fitBounds","flyTo","flyToBounds","setView","panTo","panBy"].forEach(method=>{const original=state.map[method];if(typeof original!=="function")return;state.map[method]=function(...args){const before=mapViewportSnapshot(),caller=String(new Error().stack||"").split("\n").slice(2,7).join(" | "),userGesture=performance.now()<=Number(state.qaUserMapGestureUntil||0),entry={action:state.qaMapAction||(userGesture?"explicit_user_pan_zoom":"runtime"),call:method,caller,before_center:before&&before.center,before_zoom:before&&before.zoom,allowed_move:Boolean(state.qaMapNavigationAllowed||userGesture)};const result=original.apply(this,args),after=mapViewportSnapshot();entry.after_center=after&&after.center;entry.after_zoom=after&&after.zoom;state.qaMapNavigationCalls.push(entry);return result;};});
  }
  function viewportDelta(before,after) {
    if(!before||!after)return null;
    const deltaLat=Math.abs(before.center[0]-after.center[0]),deltaLng=Math.abs(before.center[1]-after.center[1]);
    return {delta_lat:deltaLat,delta_lng:deltaLng,center_delta:Math.max(deltaLat,deltaLng),zoom_delta:Math.abs(before.zoom-after.zoom),bounds_delta:Math.max(...before.bounds.map((value,index)=>Math.abs(value-after.bounds[index])))};
  }
  function recordViewportAudit(action,before,allowedToMove=false,allowBoundsChange=false) {
    const after=mapViewportSnapshot(),delta=viewportDelta(before,after);
    const stable=delta&&delta.center_delta<=MAP_VIEWPORT_CENTER_TOLERANCE&&delta.zoom_delta===0&&(allowBoundsChange||delta.bounds_delta<=MAP_VIEWPORT_CENTER_TOLERANCE);
    state.lastViewportAudit={action,before,after,delta_lat:delta&&delta.delta_lat,delta_lng:delta&&delta.delta_lng,center_delta:delta&&delta.center_delta,zoom_delta:delta&&delta.zoom_delta,bounds_delta:delta&&delta.bounds_delta,center_tolerance:MAP_VIEWPORT_CENTER_TOLERANCE,allowed_to_move:allowedToMove,bounds_change_allowed:allowBoundsChange,status:allowedToMove||stable?"PASS":"FAIL"};
    if(after&&!state.layoutResizeInProgress)state.stableMapViewport=after;
    return state.lastViewportAudit;
  }
  function mapContainerSize() {
    const container=mapIsMounted()?state.map.getContainer():null;
    return container?{width:container.clientWidth,height:container.clientHeight}:null;
  }
  function samePhysicalMapSize(left,right) { return Boolean(left&&right&&Math.abs(left.width-right.width)<.5&&Math.abs(left.height-right.height)<.5); }
  function invalidateMapForLayout(reason="layout_resize") {
    if(!mapIsMounted())return null;
    if(samePhysicalMapSize(state.mapPhysicalSize,mapContainerSize()))return null;
    const liveBefore=mapViewportSnapshot(),protectedViewport=state.stableMapViewport||liveBefore,before={center:[...protectedViewport.center],zoom:protectedViewport.zoom,bounds:[...protectedViewport.bounds]},sizeBefore=state.mapPhysicalSize||mapContainerSize();
    state.layoutResizeInProgress=true;
    withAllowedMapNavigation("physical_container_resize",()=>state.map.invalidateSize({pan:false,animate:false,debounceMoveend:true}));
    let afterInvalidate=mapViewportSnapshot(),delta=viewportDelta(before,afterInvalidate),restored=false,exactResetFallback=false;
    if(delta&&(delta.center_delta>MAP_VIEWPORT_CENTER_TOLERANCE||delta.zoom_delta!==0)){
      withAllowedMapNavigation("physical_container_resize_restore",()=>state.map.setView([before.center[0],before.center[1]],before.zoom,{animate:false,reset:false}));
      restored=true;
      const afterSoftRestore=mapViewportSnapshot(),softDelta=viewportDelta(before,afterSoftRestore);
      if(softDelta&&(softDelta.center_delta>MAP_VIEWPORT_CENTER_TOLERANCE||softDelta.zoom_delta!==0)){
        withAllowedMapNavigation("physical_container_resize_exact_restore",()=>state.map.setView([before.center[0],before.center[1]],before.zoom,{animate:false,reset:true}));
        exactResetFallback=true;
      }
    }
    const after=mapViewportSnapshot(),finalDelta=viewportDelta(before,after),sizeAfter=mapContainerSize();
    state.mapPhysicalSize=sizeAfter;
    state.lastLayoutInvalidateAudit={reason,performed:true,restored,exact_reset_fallback:exactResetFallback,size_before:sizeBefore,size_after:sizeAfter,before,after_invalidate:afterInvalidate,after,delta_lat:finalDelta?.delta_lat??null,delta_lng:finalDelta?.delta_lng??null,center_delta:finalDelta?.center_delta??null,zoom_delta:finalDelta?.zoom_delta??null,bounds_delta:finalDelta?.bounds_delta??null,center_tolerance:MAP_VIEWPORT_CENTER_TOLERANCE,center_unchanged:Boolean(finalDelta&&finalDelta.center_delta<=MAP_VIEWPORT_CENTER_TOLERANCE),zoom_unchanged:Boolean(finalDelta&&finalDelta.zoom_delta===0),status:finalDelta&&finalDelta.center_delta<=MAP_VIEWPORT_CENTER_TOLERANCE&&finalDelta.zoom_delta===0?"PASS":"FAIL"};
    state.lastViewportAudit=Object.assign({action:"layout_resize",allowed_to_move:false,bounds_change_allowed:true},state.lastLayoutInvalidateAudit);
    state.stableMapViewport=after;state.layoutResizeInProgress=false;
    publishQaSnapshot();return state.lastLayoutInvalidateAudit;
  }
  function panoramaContext() { return {map:state.map,cityId:state.cityId,module:state.module,theme:state.theme,indicator:state.indicatorId,metric:metricById(presentationMetricId()),audit:state.mapIndicator?thematicMapEngine.audit(state.mapIndicator):null,openMethod:()=>openIndicatorMethodology(state.indicatorId),geography:currentGeo(),program:state.data.map.program,selectedTerritory:{type:"FeatureCollection",features:[...(activeMapCollection()?.features||[]).filter(f=>featureId(f)===state.geographyId),...(state.data.map.program?.features||[]).filter(f=>featureId(f)===state.geographyId||currentGeo().level==="AGENDA_CITY_TERRITORY_COLLECTION")]},municipality:state.data.map.municipality,references:{type:"FeatureCollection",features:[...(activeMapCollection()?.features||[]),...(state.data.map.program?.features||[]).map(f=>({...f,properties:{...f.properties,territory_role:"PROGRAM_TERRITORY",territory_id:"DAICO_ACU_OPERATIONAL_2022"}}))]},refreshBase:()=>{state.layers.territories?.setStyle(mapStyle);},resizeMap:()=>invalidateMapForLayout("panorama_sheet_resize"),selectGeography,getGeography:currentGeo,withNavigation:fn=>withAllowedMapNavigation("housing_explicit_navigation",fn),refreshLabels:refreshValueLabels}; }
  function installMapResizeObserver() {
    if(state.mapResizeObserver){state.mapResizeObserver.disconnect();state.mapResizeObserver=null;}
    if(!mapIsMounted()||typeof ResizeObserver!=="function")return;
    if(state.module==="panorama"){window.ACU_R71_PANORAMA?.mount(panoramaContext());committedMapSelection={map:state.map,selection:mapSelection()};}
    state.mapPhysicalSize=mapContainerSize();
    state.mapResizeObserver=new ResizeObserver(()=>{
      if(!mapIsMounted())return;
      const next=mapContainerSize();if(samePhysicalMapSize(state.mapPhysicalSize,next))return;
      invalidateMapForLayout("container_resize");
    });
    state.mapResizeObserver.observe(state.map.getContainer());
  }
  function refreshTerritorialLabels() {
    if(state.layers.labels)state.layers.labels.eachLayer(marker=>{const feature=marker._acuFeature;if(!feature)return;const html=mapLabel(feature);if(marker.options.icon&&marker.options.icon.options)marker.options.icon.options.html=html;const element=marker.getElement&&marker.getElement();if(element)element.innerHTML=html;});
    if(state.layers.programLabels)state.layers.programLabels.eachLayer(marker=>{const feature=marker._acuFeature;if(!feature)return;const html=programMapLabel(feature);if(marker.options.icon&&marker.options.icon.options)marker.options.icon.options.html=html;const element=marker.getElement&&marker.getElement();if(element)element.innerHTML=html;});
    [state.layers.territories,state.layers.program].filter(Boolean).forEach(group=>group.eachLayer(layer=>{if(layer.getTooltip&&layer.getTooltip()&&!citywideComparisonEnabled())layer.setTooltipContent(territoryTooltip(layer.feature));}));
    if(state.quickCard?.kind==="territory"&&state.quickCard.layer?.feature)showTerritorialQuickCard(state.quickCard.layer,state.quickCard.layer.feature,null,state.quickCard.persistent);
  }
  function setPresentationMeasure(mode) {
    if(new URLSearchParams(location.search).get("qa")==="1")document.documentElement.dataset.acuR4r3MeasureActivation=`received:${mode}`;
    const group=activePresentationGroup();if(!group||!availableMeasuresForGroup(group).includes(mode))return null;
    state.preferredMeasureMode=mode;
    if(state.demographicMapMode===mode)return state.lastViewportAudit;
    const before=mapViewportSnapshot();state.demographicMapMode=mode;if(new URLSearchParams(location.search).get("qa")==="1")document.documentElement.dataset.acuR4r3MeasureActivation=`state-set:${mode}`;updateMapIndicatorButton();return refreshMapPresentation("measure_change",before);
  }
  function bindMapMeasureControls() {
    $$('#map-measure-control [data-map-measure-option]').forEach(button=>button.addEventListener("click",()=>setPresentationMeasure(button.dataset.mapMeasureOption)));
  }
  function refreshMapMeasureControl() {
    const scale=$("#governed-scale-slot"),measure=$("#map-measure-control"),notice=$("#map-unavailable-notice");if(scale){scale.innerHTML=comparisonGeographyControlHtml()+coverageMessageHtml();const comparison=$("#map-comparison-geography");if(comparison)comparison.addEventListener("change",()=>setComparisonGeographyLevel(comparison.value));$$('[data-map-scale]').forEach(button=>button.addEventListener("click",()=>setComparisonGeographyLevel(button.dataset.mapScale)));bindPublicSourceActions();}if(measure){measure.innerHTML=mapMeasureModeHtml();bindMapMeasureControls();}if(notice)notice.innerHTML=!state.mapIndicator&&state.cityId==="belem"?'<p class="map-nd-notice">N/D para o mapa comparável: o preenchimento temático foi neutralizado e nenhum valor anterior permanece ativo.</p>':"";
    const coverageChip=$(".map-coverage-chip");if(coverageChip){const partial=governedIndicatorRecord(state.indicatorId)?.coverage_by_scale?.[comparisonGeographyLevel()]?.complete===false;coverageChip.textContent=partial?"Cobertura parcial":"Cobertura publicada";coverageChip.classList.toggle("is-partial",partial);}
  }
  function refreshPanoramaSummary() {
    const identity=geographyIdentity(currentGeo()),title=$("#territory-numbers-title"),subtitle=$("#territory-numbers-subtitle"),cards=$("#territory-numbers-cards"),notice=$("#territory-numbers-notice");
    if(title)title.textContent=identity.title;if(subtitle)subtitle.textContent=identity.subtitle;if(cards){cards.innerHTML=factKPIs();bindPublicSourceActions();}if(notice)notice.textContent=`${panoramaTerritorialNotice()} Ausência de informação é exibida como N/D, nunca como zero.`;
  }
  let mapPresentationSequence=0,committedMapSelection=null;
  const mapSelectionKeys=['theme','indicatorId','mapIndicator','demographicMapMode','preferredMeasureMode','comparisonGeographyLevel'];
  function mapSelection(){return Object.fromEntries(mapSelectionKeys.map(k=>[k,state[k]]));}
  function thematicSignature(){return (activeMapCollection()?.features||[]).map(featureId).sort().join('|');}
  function updateStatus(text,error=false){
    if(!mapIsMounted())return;let el=state.map.getContainer().querySelector('.r72-update-status');
    if(!el){el=document.createElement('div');el.className='r72-update-status';el.setAttribute('role','status');state.map.getContainer().append(el);}
    el.textContent=text;el.hidden=!text;el.dataset.error=String(error);state.map.r72Labels?.schedule();
  }
  async function refreshMapPresentation(action="presentation_change",before=mapViewportSnapshot()) {
    if(!mapIsMounted()){renderModule();return null;}
    const map=state.map,city=state.cityId,geography=state.geographyId,desired=mapSelection(),context=panoramaContext(),ticket=++mapPresentationSequence,module=state.module;
    const previous=committedMapSelection?.map===map?committedMapSelection.selection:null;
    // Keep the committed state available to hover, fiches and exports until staging succeeds.
    if(previous)Object.assign(state,previous);
    updateStatus('Atualizando…');
    try{
      const prepared=module==='panorama'?await ACU_R71_PANORAMA.prepare(context):null;
      if(ticket!==mapPresentationSequence||state.map!==map||state.cityId!==city||state.geographyId!==geography||state.module!==module)return null;
      Object.assign(state,desired);state.mapScale=buildMapScale();
      if(housingSelected())hideQuickCard('territory',true);
      const signature=thematicSignature();
      if(signature!==map._r72GeometrySignature){
        const oldTerritories=state.layers.territories,oldLabels=state.layers.labels;
        addTerritorialLayer();map._r72GeometrySignature=signature;
        if(oldTerritories)map.removeLayer(oldTerritories);if(oldLabels)map.removeLayer(oldLabels);
      }else if(state.layers.territories)ACU_R72.animate(state.layers.territories,mapStyle);
      refreshTerritorialLabels();refreshMapMeasureControl();refreshViolenceContext();renderMapLegend();refreshPanoramaSummary();refreshMapAnalyticalArtifacts();
      if(module==='panorama')ACU_R71_PANORAMA.commit(context,prepared);
      if(!housingSelected())refreshValueLabels();
      updateHash();committedMapSelection={map,selection:mapSelection()};map._r72LastError=null;updateStatus('');
      const audit=recordViewportAudit(action,before,false);publishQaSnapshot();return audit;
    }catch(error){
      if(ticket!==mapPresentationSequence||state.map!==map)return null;
      if(previous)Object.assign(state,previous);configureSelectors();
      updateStatus('Não foi possível atualizar. O mapa anterior foi mantido.',true);
      map._r72LastError=String(error.message||error);return null;
    }
  }

  function initMap() {
    if (!$("#map")) return;
    if(state.mapResizeObserver){state.mapResizeObserver.disconnect();state.mapResizeObserver=null;}
    if (state.map) { state.map.remove(); state.map = null; }
    state.layers = {}; state.markerLayers = {}; state.markerRecords = []; state.quickCard=null;state.quickCardAudit=null;state.mapScale = buildMapScale(); state.tileError = false;
    state.map = L.map("map", { zoomControl: true, attributionControl: true, minZoom: 8, maxZoom: 20, zoomSnap:.25, zoomDelta:.5, zoomAnimation:false, fadeAnimation:false, markerZoomAnimation:false, preferCanvas: true });installQaMapNavigationInstrumentation();
    ACU_R73_DISPLAY.configure(state.map,state.cityId,state.geographyId,state.module==="panorama");
    state.map.r72Labels=ACU_R72.labels(state.map);
    state.layers.basemap=window.R71R1UrbanContext.mount(state.map,state.localContext);
    state.map.createPane("r71Contours");state.map.getPane("r71Contours").style.zIndex=470;
    if(state.cityId!=="belem"&&state.data.map.municipality) state.layers.municipality=L.geoJSON(state.data.map.municipality,{pane:"r71Contours",style:{color:"#758693",weight:1,fill:false,dashArray:"5 5"},interactive:false}).addTo(state.map);
    addTerritorialLayer(); state.map._r72GeometrySignature=thematicSignature(); addProgramLayer(); renderMapLegend(); bindMapControls(); refreshPointLayers();
    state.map.on("zoomend",()=>{updateMarkerIcons();scheduleMapLabelCollisionAudit();positionActiveQuickCard();if(!state.layoutResizeInProgress)state.stableMapViewport=mapViewportSnapshot();publishQaSnapshot();});state.map.on("moveend",()=>{scheduleMapLabelCollisionAudit();positionActiveQuickCard();if(!state.layoutResizeInProgress)state.stableMapViewport=mapViewportSnapshot();publishQaSnapshot();});
    const protectedViewport=state.stableMapViewport,explicitNavigation=Boolean(state.mapNavigationIntent);if(protectedViewport&&!explicitNavigation)withAllowedMapNavigation("restore_preserved_viewport",()=>state.map.setView(protectedViewport.center,protectedViewport.zoom,{animate:false,reset:true}));else withAllowedMapNavigation(state.mapNavigationIntent||"initial_map_fit",fitActiveGeography);state.mapNavigationIntent=null;state.stableMapViewport=mapViewportSnapshot();scheduleMapLabelCollisionAudit();refreshMapAnalyticalArtifacts();requestAnimationFrame(restorePinnedTerritorialQuickCard);publishQaSnapshot();
    state.mapPhysicalSize=mapContainerSize();
    const initializingMap=state.map,needsFrame=explicitNavigation||!protectedViewport;
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(!mapIsMounted()||state.map!==initializingMap)return;
      installMapResizeObserver();
      invalidateMapForLayout("initial_visible_container");
      if(needsFrame)withAllowedMapNavigation("settled_context_fit",fitActiveGeography);
      state.stableMapViewport=mapViewportSnapshot();publishQaSnapshot();
    }));
  }
  function addTerritorialLayer() {
    const labels=[];
    state.layers.territories=L.geoJSON(activeMapCollection(),{renderer:new ACU_R73_DISPLAY.Renderer({padding:.2}),style:mapStyle,onEachFeature:(feature,layer)=>{
      ACU_R73_DISPLAY.guard(layer,state.map);const id=featureId(feature),geo=state.data.geographies.find(item=>item.id===id);
      if(state.cityId==="sao_luis")layer.bindTooltip(territoryTooltip(feature),{sticky:true,direction:"top",className:"acu-territory-tooltip",opacity:1});
      layer.on("add",()=>{if(layer._path){layer._path.classList.add("acu-clickable-territory","acu-comparison-unit");layer._path.dataset.geographyId=id;layer._path.dataset.physicalGeographyId=physicalGeographyId(feature);layer._path.dataset.comparisonGeography=comparisonGeographyLevel();layer._path.setAttribute("role","button");layer._path.setAttribute("tabindex","0");layer._path.setAttribute("aria-label",`Selecionar ${mapTerritoryName(feature)}`);if(citywideComparisonEnabled()){L.DomEvent.on(layer._path,"focus",event=>showTerritorialQuickCard(layer,feature,event,false));L.DomEvent.on(layer._path,"blur",()=>hideQuickCard("territory"));L.DomEvent.on(layer._path,"keydown",event=>{if(event.key==="Enter"||event.key===" "){L.DomEvent.preventDefault(event);selectGeographyFromMap(id);}});}}});
      layer.on({mouseover:event=>{layer.setStyle({weight:id===state.geographyId?3.2:2.4,color:id===state.geographyId?"#d98324":"#1c79b8"});showTerritorialQuickCard(layer,feature,event,false);},mouseout:()=>{state.layers.territories.resetStyle(layer);hideQuickCard("territory");},focus:event=>showTerritorialQuickCard(layer,feature,event,false),blur:()=>hideQuickCard("territory"),click:event=>{if(state.cityId==="belem"){if(event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);if(geo)toggleGeography(id);}else if(geo){if(citywideComparisonEnabled()&&event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);citywideComparisonEnabled()?selectGeographyFromMap(id):selectGeography(state.geographyId===id?defaultGeography():id);}}});
    }}).addTo(state.map);
const activeLevel=currentGeo()?.level,programContext=["AGENDA_CITY_TERRITORY","AGENDA_CITY_TERRITORY_COLLECTION"].includes(activeLevel),showComparisonLabels=citywideComparisonEnabled()||state.cityId==="belem"||state.cityId==="sao_luis"?(state.cityId!=="sao_luis"||activeLevel==="INCID_PLANNING_UNIT"||Boolean(state.mapIndicator)):(!programContext||Boolean(state.mapIndicator));state.layers.territories.eachLayer(layer=>{if(!showComparisonLabels||!layer.getBounds||!layer.getBounds().isValid()||!shouldRenderPhysicalLabel(layer.feature))return;const feature=layer.feature,id=featureId(feature),geo=state.data.geographies.find(item=>item.id===id),homonym=/Cidade (?:Olímpica|Operária)/.test(featureName(feature)),classes=["acu-map-label","acu-up-label",citywideComparisonEnabled()?"acu-citywide-comparison-label":"",homonym?"acu-homonym-up-label":"",homonym||id===state.geographyId?"acu-critical-map-label":"",id===state.geographyId?"acu-selected-map-label":""].filter(Boolean).join(" "),interactiveLabel=state.cityId!=="belem";const label=L.marker(representativeLayerPoint(layer),{interactive:interactiveLabel,keyboard:interactiveLabel,bubblingMouseEvents:interactiveLabel&&!citywideComparisonEnabled(),title:interactiveLabel?`Selecionar ${mapTerritoryName(feature)}`:"",icon:L.divIcon({className:classes,html:mapLabel(feature),iconSize:null})});label._acuFeature=feature;label._acuFeatureId=id;label._acuPhysicalGeographyId=physicalGeographyId(feature);if(interactiveLabel){const activate=event=>{if(citywideComparisonEnabled()&&event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);if(geo)(citywideComparisonEnabled()?selectGeographyFromMap(id):selectGeography(state.geographyId===id?defaultGeography():id));};label.on("click",activate);if(state.cityId==="manaus")label.on({mouseover:event=>showTerritorialQuickCard(layer,feature,event,false),mouseout:()=>hideQuickCard("territory")});label.on("add",()=>{const element=label.getElement();if(!element)return;L.DomEvent.on(element,"focus",event=>showTerritorialQuickCard(layer,feature,event,false));L.DomEvent.on(element,"blur",()=>hideQuickCard("territory"));L.DomEvent.on(element,"keydown",event=>{if(event.key==="Enter"||event.key===" "){L.DomEvent.preventDefault(event);activate({originalEvent:event});}});});}labels.push(label);});
    state.layers.labels=L.layerGroup(labels).addTo(state.map);
  }
  function addProgramLayer() {
    const programInteractive=["sao_luis","sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId),labels=[];state.layers.program=L.geoJSON(state.data.map.program,{pane:"r71Contours",style:feature=>{const id=(feature.properties||{}).territory_id,selected=id===state.geographyId,compared=state.module==="compare"&&state.compareIds.includes(id);return {color:selected?"#d98324":compared?"#172a3a":"#d98324",weight:selected?4:compared?4:3,fill:false,dashArray:"8 5"};},interactive:programInteractive,onEachFeature:(feature,layer)=>{
      const p=feature.properties||{},id=p.territory_id;if(state.cityId!=="belem"&&!citywideComparisonEnabled())layer.bindTooltip(`<div class="acu-tooltip"><strong>${esc(featureDisplayName(feature))}</strong><span>Território de atuação da Agenda Cidade UNICEF</span><small>${esc(p.sector_count||"")} setores; contrato próprio, distinto da UP homônima.</small></div>`,{sticky:true,className:"acu-territory-tooltip",opacity:1});
      layer.on("add",()=>{if(layer._path){layer._path.classList.add("acu-program-outline");layer._path.dataset.programTerritoryId=id;layer._path.dataset.physicalGeographyId=physicalGeographyId(feature);layer._path.dataset.territoryRole="PROGRAM_TERRITORY";layer._path.setAttribute("role","button");layer._path.setAttribute("tabindex","0");layer._path.setAttribute("aria-label",`Selecionar ${mapTerritoryName(feature)}`);if(citywideComparisonEnabled()){L.DomEvent.on(layer._path,"focus",event=>showTerritorialQuickCard(layer,feature,event,false));L.DomEvent.on(layer._path,"blur",()=>hideQuickCard("territory"));L.DomEvent.on(layer._path,"keydown",event=>{if(event.key==="Enter"||event.key===" "){L.DomEvent.preventDefault(event);selectGeographyFromMap(id);}});}}});
      if(programInteractive)layer.on({mouseover:event=>showTerritorialQuickCard(layer,feature,event,false),mouseout:()=>hideQuickCard("territory"),focus:event=>showTerritorialQuickCard(layer,feature,event,false),blur:()=>hideQuickCard("territory"),click:event=>{if(citywideComparisonEnabled()&&event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);citywideComparisonEnabled()?selectGeographyFromMap(id):selectGeography(state.geographyId===id?defaultGeography():id);}});
}}).addTo(state.map);if(programInteractive)state.layers.program.eachLayer(layer=>{const p=layer.feature.properties||{};if(!layer.getBounds||!layer.getBounds().isValid()||!shouldRenderPhysicalLabel(layer.feature))return;const selected=p.territory_id===state.geographyId,classes=["acu-map-label","acu-program-territory-label","acu-critical-map-label",selected?"acu-selected-map-label":""].filter(Boolean).join(" ");const label=L.marker(representativeLayerPoint(layer),{interactive:true,keyboard:true,title:`Selecionar ${mapTerritoryName(layer.feature)}`,icon:L.divIcon({className:classes,html:programMapLabel(layer.feature),iconSize:null})});label._acuFeature=layer.feature;label._acuPhysicalGeographyId=physicalGeographyId(layer.feature);const activate=event=>{if(citywideComparisonEnabled()&&event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);citywideComparisonEnabled()?selectGeographyFromMap(p.territory_id):selectGeography(state.geographyId===p.territory_id?defaultGeography():p.territory_id);};label.on("click",activate);if(state.cityId==="manaus")label.on({mouseover:event=>showTerritorialQuickCard(layer,layer.feature,event,false),mouseout:()=>hideQuickCard("territory")});label.on("add",()=>{const element=label.getElement();if(!element)return;L.DomEvent.on(element,"focus",event=>showTerritorialQuickCard(layer,layer.feature,event,false));L.DomEvent.on(element,"blur",()=>hideQuickCard("territory"));L.DomEvent.on(element,"keydown",event=>{if(event.key==="Enter"||event.key===" "){L.DomEvent.preventDefault(event);activate({originalEvent:event});}});});labels.push(label);});state.layers.programLabels=L.layerGroup(labels).addTo(state.map);
  }
  function fitActiveGeography() {
    if(!mapIsMounted())return;
    const geo=currentGeo(),coverage=state.housingCoverage,municipal=geo?.level==="MUNICIPALITY"||geo?.id==="BELEM_CITY_CONTEXT";
    let bounds=municipal?coverage?._meta?.municipal_display_bounds:coverage?.[state.geographyId]?.bounds;
    if(!bounds){
      const features=[...(activeMapCollection()?.features||[]),...(state.data.map.program?.features||[])].filter(f=>featureId(f)===state.geographyId||geo?.level==="AGENDA_CITY_TERRITORY_COLLECTION"&&(state.data.map.program?.features||[]).includes(f));
      const selected=L.geoJSON(features),fallback=municipal?state.layers.municipality:selected;
      if(fallback?.getBounds().isValid())bounds=fallback.getBounds();
    }
    if(!bounds)return;
    state.map.invalidateSize({pan:true,animate:false});
    state.map.fitBounds(bounds,{paddingTopLeft:[30,48],paddingBottomRight:[30,30],maxZoom:municipal?13:16,animate:false});
    state.lastFrameAudit={city:state.cityId,geography:state.geographyId,source:municipal?'R71 governed municipal urban display extent':'selected governed territory, all parts',bounds:L.latLngBounds(bounds).toBBoxString(),size:state.map.getSize(),zoom:state.map.getZoom()};
    state.stableMapViewport=mapViewportSnapshot();
  }
  function selectGeography(id) {
    if(state.module==="compare"){matrixToggle(id);return;}
    if(!availableGeographies().some(item=>item.id===id))return;
    const next=availableGeographies().find(item=>item.id===id),previousLevel=comparisonGeographyLevel();
    state.geographyId=id;state.mapNavigationIntent="explicit_geography_selection";
    if(previousLevel!==comparisonGeographyLevel()){state.compareIds=[];state.compareSelectionTouched=false;state.compareLevel=null;}
    $("#territory-select").value=id;$("#crumb-territory").textContent=geographyDisplayName(next);configureSelectors();renderModule();updateHash();
  }
  function selectGeographyFromMap(id) {
    if(state.module==="compare"){matrixToggle(id);return;}
    window.ACU_R71_PANORAMA?.requestLegacySheet();
    const togglingOff=state.geographyId===id,next=togglingOff?defaultGeography():id;
    state.pinnedTooltipGeographyId=togglingOff?null:id;
    selectGeography(next);
  }
  function setComparisonGeographyLevel(level) {
    if(!citywideComparisonEnabled()||!citywideComparisonLevels().includes(level))return null;
    if(level===comparisonGeographyLevel())return qaSnapshot();
    state.comparisonGeographyLevel=level;state.compareIds=[];state.compareSelectionTouched=false;state.compareLevel=null;state.mapExtent="MUNICIPALITY";state.mapNavigationIntent="explicit_comparison_geography_change";renderModule();updateHash();return qaSnapshot();
  }
  let lastMapTerritoryClick={id:null,at:0};
  function toggleGeography(id) {
    if(state.module==="compare"){matrixToggle(id);return;}
    window.ACU_R71_PANORAMA?.requestLegacySheet();
    const now=Date.now();if(lastMapTerritoryClick.id===id&&now-lastMapTerritoryClick.at<350)return;
    lastMapTerritoryClick={id,at:now};selectGeography(state.geographyId===id?defaultGeography():id);
  }
  function clearMapState() {
    window.ACU_R71_PANORAMA?.reset();
    state.mapIndicator=null;state.demographicMapMode="count";state.mapEvidencePack=null;state.mapAnalysisContext=null;state.layerState={schools:false,priority:false,equipment:false,pct:false};state.schoolFilters={dependency:"",stage:"",wash:"",differentiated:false,priority:false};state.equipmentFilter="";state.equipmentFilters={category:"",subcategory:"",status:"",governmentLevel:""};state.mapControlSection=null;state.pinnedTooltipGeographyId=null;state.comparisonGeographyLevel=defaultComparisonGeographyLevel();state.mapExtent="MUNICIPALITY";state.mapNavigationIntent="explicit_map_reset";const id=availableGeographies().some(g=>g.id===state.geographyId)?state.geographyId:defaultGeography();state.geographyId=id;$("#territory-select").value=id;$("#crumb-territory").textContent=geographyDisplayName(currentGeo());configureIndicators();updateMapIndicatorButton();renderModule();updateHash();
  }
  function setMapControlSection(section) {
    if(!citywideComparisonEnabled())return null;
    state.mapControlSection=state.mapControlSection===section?null:section;
    const panel=$(".map-control-panel-compact");if(!panel)return state.mapControlSection;
    panel.classList.toggle("is-collapsed",!state.mapControlSection);
    $$('[data-map-control-section]').forEach(node=>{node.hidden=node.dataset.mapControlSection!==state.mapControlSection;});
    $$('[data-map-panel-section]').forEach(button=>button.setAttribute("aria-expanded",String(button.dataset.mapPanelSection===state.mapControlSection)));
    return state.mapControlSection;
  }
  function bindMapControls() {
    bindMapMeasureControls();
    const comparison=$("#map-comparison-geography");if(comparison)comparison.addEventListener("change",()=>setComparisonGeographyLevel(comparison.value));
    $$('[data-map-scale]').forEach(button=>button.addEventListener("click",()=>setComparisonGeographyLevel(button.dataset.mapScale)));
    $$("[data-map-layer]").forEach(input=>input.addEventListener("change",()=>{const before=mapViewportSnapshot();state.layerState[input.dataset.mapLayer]=input.checked;refreshPointLayers();recordViewportAudit("layer_toggle",before,false);publishQaSnapshot();}));
    const dependency=$("#map-school-dependency"),stage=$("#map-school-stage"),wash=$("#map-school-wash"),differentiated=$("#map-school-differentiated"),priority=$("#map-school-priority"),category=$("#map-equipment-category"),subcategory=$("#map-equipment-subcategory"),status=$("#map-equipment-status"),government=$("#map-equipment-government");
    const refreshFilter=()=>{const before=mapViewportSnapshot();state.equipmentFilter=state.equipmentFilters.category;refreshPointLayers();recordViewportAudit("filter_change",before,false);publishQaSnapshot();};
    dependency.addEventListener("change",()=>{const before=mapViewportSnapshot();state.schoolFilters.dependency=dependency.value;refreshPointLayers();recordViewportAudit("filter_change",before,false);publishQaSnapshot();});stage.addEventListener("change",()=>{const before=mapViewportSnapshot();state.schoolFilters.stage=stage.value;refreshPointLayers();recordViewportAudit("filter_change",before,false);publishQaSnapshot();});wash.addEventListener("change",()=>{const before=mapViewportSnapshot();state.schoolFilters.wash=wash.value;refreshPointLayers();recordViewportAudit("filter_change",before,false);publishQaSnapshot();});differentiated.addEventListener("change",()=>{const before=mapViewportSnapshot();state.schoolFilters.differentiated=differentiated.checked;refreshPointLayers();recordViewportAudit("filter_change",before,false);publishQaSnapshot();});priority.addEventListener("change",()=>{const before=mapViewportSnapshot();state.schoolFilters.priority=priority.checked;refreshPointLayers();recordViewportAudit("filter_change",before,false);publishQaSnapshot();});category.addEventListener("change",()=>{state.equipmentFilters.category=category.value;refreshFilter();});subcategory.addEventListener("change",()=>{state.equipmentFilters.subcategory=subcategory.value;refreshFilter();});status.addEventListener("change",()=>{state.equipmentFilters.status=status.value;refreshFilter();});government.addEventListener("change",()=>{state.equipmentFilters.governmentLevel=government.value;refreshFilter();});
    $$("[data-map-command]").forEach(button=>button.addEventListener("click",()=>{if(button.dataset.mapCommand==="reset")clearMapState();else{state.module="compare";renderModule();}}));
  }

  function validCoordinate(item) { const status=item.spatial_status||item.coordinate_status||item.location_status||"",lat=item.latitude,lon=item.longitude;return item.map_eligible!==false&&lat!==null&&lat!==""&&lon!==null&&lon!==""&&Number.isFinite(Number(lat))&&Number.isFinite(Number(lon))&&!/NOT_AVAILABLE|INVALID|MISSING|CONFLICT|DERIVED_REQUIRES_REVIEW|CANDIDATE_REJECTED|NO_VALIDATED/.test(status); }
  function profileFor(item) { const code=schoolCode(item);return state.schoolProfiles&&state.schoolProfiles.records&&state.schoolProfiles.records[code]; }
  function matchesSchoolFilters(item) {
    const p=profileFor(item)||item.profile,f=state.schoolFilters,w=item.wash||canonicalSchoolWash(item),stageFlags=item.stage_flags||schoolStageFlags(canonicalSchoolStages(item));
    if(f.dependency&&(item.dependency||p&&p.dependency)!==f.dependency)return false;
    if(f.stage){if(state.cityId==="manaus"){if(!canonicalSchoolStages(item).includes(f.stage))return false;}else{const runtimeField=SCHOOL_STAGE_CONTRACT[f.stage]?.runtime_field;if(!runtimeField||stageFlags[runtimeField]!==true)return false;}}
    const washPositive=w.water_public_network===true&&w.sewer_public_network===true&&w.toilet_available===true;
    if(f.wash==="adequate"&&!(w.eligible===true&&(washPositive||(w.water==="Adequada"&&w.sewage==="Adequada"))))return false;
    if(f.wash==="inadequate"&&!(w.eligible===true&&!(washPositive||(w.water==="Adequada"&&w.sewage==="Adequada"))))return false;
    if(f.wash==="eligible"&&w.eligible!==true)return false;
    if(f.wash==="not-classifiable"&&w.eligible===true)return false;
    if(f.differentiated&&!((item.differentiated_location===true)||(p&&!fold(p.differentiated_location).includes("nao diferenciada"))))return false;
    if(f.priority&&!item.priority)return false;
    return true;
  }
  function neighborhoodDistrict(name) { const feature=state.data.map.neighborhoods&&state.data.map.neighborhoods.features.find(item=>item.properties.name===name);return feature&&feature.properties.NM_DIST; }
  function pointInRing(point,ring) { let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const xi=ring[i][0],yi=ring[i][1],xj=ring[j][0],yj=ring[j][1];const crosses=((yi>point[1])!==(yj>point[1]))&&(point[0]<(xj-xi)*(point[1]-yi)/((yj-yi)||1e-12)+xi);if(crosses)inside=!inside;}return inside; }
  function pointInGeometry(point,geometry) { if(!geometry)return false;const polygons=geometry.type==="Polygon"?[geometry.coordinates]:geometry.type==="MultiPolygon"?geometry.coordinates:[];return polygons.some(polygon=>pointInRing(point,polygon[0])&&!polygon.slice(1).some(hole=>pointInRing(point,hole))); }
  function programFlag(item,territoryId){if(territoryId==="CITY_OPERARIA_ACU_OPERATIONAL_2022")return item.inside_city_operaria_acu;if(territoryId==="CITY_OLIMPICA_ACU_OPERATIONAL_2022")return item.inside_city_olimpica_acu;return null;}
  function insideProgram(item,territoryId=null) { if(!validCoordinate(item))return false;if(territoryId){if(item.acu_program_territory_id)return item.acu_program_territory_id===territoryId;const flag=programFlag(item,territoryId);if(typeof flag==="boolean")return flag;return (state.data.map.program.features||[]).some(feature=>(feature.properties||{}).territory_id===territoryId&&pointInGeometry([Number(item.longitude),Number(item.latitude)],feature.geometry));}return item.acu_program_territory_id?true:(state.data.config.program_territories||[]).some(territory=>insideProgram(item,territory.territory_id)); }
  function matchesTerritory(item) {
    const adapter=belemSpatialAdapter();if(adapter)return adapter.matchesTerritorialContext(item,currentGeo());
    if(state.cityId==="manaus"&&currentGeo()?.level==="MUNICIPALITY")return true;
    if(state.cityId==="manaus"&&item.analytical_territory_method){const g=currentGeo();if(g?.level==="MANAUS_NEIGHBORHOOD")return item.analytical_neighborhood_id===g.id;if(g?.level==="AGENDA_CITY_TERRITORY")return item.analytical_acu_program_territory_id===g.id;}
    if(state.geographyId===defaultGeography())return state.cityId==="belem"?true:currentGeo()?.level==="AGENDA_CITY_TERRITORY_COLLECTION"?insideProgram(item):insideProgram(item,state.geographyId);
    const geo=currentGeo(),territory=item.territory||item.neighborhood||item.bairro||item.incid_up;
    if(geo.level==="MUNICIPALITY")return true;
    if(geo.level==="AGENDA_CITY_TERRITORY")return insideProgram(item,geo.id);
    if(geo.level==="AGENDA_CITY_TERRITORY_COLLECTION")return insideProgram(item);
    if(geo.level==="SP_DISTRICT")return String(item.district_id||"")===String(geo.official_code||geo.id.split("::").pop());
    if(geo.level==="SP_SUBPREFECTURE")return String(item.subprefecture_id||"").padStart(2,"0")===String(geo.official_code||geo.id.split("::").pop()).padStart(2,"0");
    if(geo.level==="RJ_ADMINISTRATIVE_REGION")return String(item.administrative_region_id||"")===String(geo.official_code||geo.id.split("::").pop());
    if(geo.level==="RJ_NEIGHBORHOOD")return String(item.neighborhood_id||"").padStart(3,"0")===String(geo.official_code||geo.id.split("::").pop()).padStart(3,"0");
    if(geo.level==="RJ_PLANNING_AREA")return String(item.planning_area_id||"")===String(geo.official_code||geo.id.split("::").pop());
    if(geo.level==="MANAUS_NEIGHBORHOOD")return item.neighborhood_id===geo.id||String(item.neighborhood_id||item.neighborhood_code||item.territory_id||"")===String(geo.official_code||geo.id.split("::").pop())||fold(territory)===fold(geo.name);
    if(geo.level==="OPERATIONAL_NEIGHBORHOOD")return territory===geo.name;
    if(geo.level==="IBGE_DISTRICT")return (item.district||neighborhoodDistrict(territory))===geo.name.replace(/^Distrito /,"");
    if(geo.level==="INCID_PLANNING_UNIT")return (item.incid_up||territory)===geo.name;
    return true;
  }
  function prioritySchools() {
    const adapter=belemSpatialAdapter();if(adapter)return adapter.schools.filter(item=>item.priority).map(uiSchool);
    return (state.data.priority_schools||[]).map(priority=>{const code=String(priority.matched_inep||priority.input_inep||"");const school=state.data.schools.find(item=>String(item.official_code)===code);return Object.assign({},school||{},priority,{id:(school&&school.id)||code,name:(school&&school.name)||priority.matched_name||priority.input_name,official_code:code,territory:(school&&school.territory)||priority.bairro,priority:true,spatial_status:priority.coordinate_status||school&&school.spatial_status});});
  }
  function schoolRowsForMap(options={}) {
    if(!citywideComparisonEnabled())return schoolRowsForContext(currentGeo(),Object.assign({mapOnly:true,applyFilters:true},options));
    return schoolUniverse().filter(validCoordinate).filter(item=>!options.priority||item.priority).filter(matchesSchoolFilters);
  }
  function equipmentRowsForMap() {
    if(!citywideComparisonEnabled())return equipmentRowsForContext(currentGeo(),{mapOnly:true,applyFilters:true});
    return equipmentUniverse().filter(validCoordinate).filter(equipmentMatchesFilters).filter(item=>R77.mapEquipmentEligible(item,state));
  }
  function plottedSchools() {
    let rows=[];
    if(state.layerState.schools)rows=schoolRowsForMap().map(item=>Object.assign({},item,{priority:Boolean(item.priority)}));
    if(state.cityId==="belem"&&state.layerState.priority){const byCode=new Map(rows.map(item=>[String(item.official_code),item]));schoolRowsForContext(currentGeo(),{mapOnly:true,applyFilters:true,priority:true}).forEach(item=>byCode.set(String(item.official_code),Object.assign({},item,{priority:true})));rows=[...byCode.values()];}
    return rows.filter(validCoordinate);
  }
  function markerSize(kind) { return 44; }
  const SCHOOL_SYMBOL='<path d="M3 10.5 12 4l9 6.5v1.8H3z"/><path d="M5 12h14v8H5z"/><path d="M10 15h4v5h-4z"/><path d="M2 21h20v1H2z"/>';
  const EQUIPMENT_SYMBOLS=Object.freeze({
    HEALTH:'<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    MENTAL_HEALTH:'<circle cx="12" cy="12" r="8"/><path d="M8 13c2 3 6 3 8 0M9 9h.1M15 9h.1" class="acu-icon-cut"/>',
    SOCIAL_ASSISTANCE:'<path d="M3 12l4-4 5 3 5-3 4 4-9 9z"/><path d="M7 8V5h10v3"/>',
    RIGHTS_PROTECTION:'<path d="M12 2 20 5v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/><path d="m8 12 2.5 2.5L16 9" class="acu-icon-cut"/>',
    JUSTICE:'<path d="M11 3h2v16h-2zM5 6h14v2H5zM4 8l-3 6h6zm16 0-3 6h6zM7 20h10v2H7z"/>',
    CULTURE:'<path d="M4 5c4-4 12-4 16 0l-2 15-6 2-6-2z"/><path d="M7 10c1 2 3 2 4 0m2 6c1-2 3-2 4 0" class="acu-icon-cut"/>',
    SPORTS_LEISURE:'<circle cx="12" cy="12" r="9"/><path d="m12 3 3 6-3 6-3-6zm-8 9h5m6 0h5" class="acu-icon-cut"/>',
    EDUCATION_NON_SCHOOL:'<path d="m2 8 10-5 10 5-10 5zM6 11v6c4 3 8 3 12 0v-6M21 9v7"/>',
    PUBLIC_SPACE:'<path d="M5 21v-7m14 7v-7M3 14h18M6 14l2-8h8l2 8M9 6l3-4 3 4"/>',
    FOOD_SECURITY:'<path d="M4 3v8c0 2 1 3 3 3v8h2v-8c2 0 3-1 3-3V3h-2v6H8V3H6v6H5V3zm12 0c4 1 5 5 3 10v9h-2v-8c-3-1-3-8-1-11"/>',
    ENVIRONMENT:'<path d="M20 3C10 3 4 8 4 15c0 4 3 6 7 6 8 0 10-9 9-18z"/><path d="M4 21c3-7 7-10 13-14" class="acu-icon-cut"/>',
    MOBILITY:'<path d="M4 5h16l2 9v5h-3v-2H5v2H2v-5zM6 7l-1 5h14l-1-5z"/><circle cx="6" cy="15" r="1"/><circle cx="18" cy="15" r="1"/>',
    YOUTH:'<circle cx="12" cy="6" r="3"/><path d="M6 22v-4c0-5 2-8 6-8s6 3 6 8v4M3 13l5 2m13-2-5 2"/>',
    CITIZENSHIP:'<path d="M3 5h18v14H3z"/><circle cx="8" cy="10" r="2"/><path d="M5 16c1-3 5-3 6 0m3-6h4m-4 4h4" class="acu-icon-cut"/>',
    INTERSECTORAL_COMMUNITY:'<circle cx="12" cy="7" r="3"/><circle cx="5" cy="15" r="3"/><circle cx="19" cy="15" r="3"/><path d="m10 9-3 3m7-3 3 3M8 16h8"/>',
    PUBLIC_SECURITY:'<path d="M12 2 20 5v6c0 5-3 9-8 11-5-2-8-6-8-11V5z"/><path d="M9 12h6M12 9v6" class="acu-icon-cut"/>'
  });
  const r73SymbolBoxes=new Map();
  function r73SymbolBox(body){
    if(r73SymbolBoxes.has(body))return r73SymbolBoxes.get(body);
    const e=document.createElementNS('http://www.w3.org/2000/svg','svg');e.setAttribute('viewBox','0 0 24 24');e.style.cssText='position:absolute;visibility:hidden;width:24px;height:24px;pointer-events:none';e.innerHTML=body;document.body.append(e);
    const b=e.getBBox(),side=Math.max(b.width,b.height)+2,box=[b.x+b.width/2-side/2,b.y+b.height/2-side/2,side,side].join(' ');e.remove();r73SymbolBoxes.set(body,box);return box;
  }
  function semanticSvg(body,label,kind,priority=false){const tokens=String(kind||"marker").trim().split(/\s+/),primary=tokens.shift()||"marker",classes=["acu-semantic-marker",`acu-${primary}-marker`,...tokens,priority?"is-priority":""].filter(Boolean).join(" ");return `<span class="${esc(classes)}" role="img" aria-label="${esc(label)}" title="${esc(label)}"><svg viewBox="${r73SymbolBox(body)}" aria-hidden="true" focusable="false">${body}</svg></span>`;}
  function equipmentSemanticPresentation(category){const raw=String(category||"CITIZENSHIP").toUpperCase(),aliases={JUSTICE_AND_RIGHTS:"JUSTICE",PUBLIC_SECURITY_GENERAL:"PUBLIC_SECURITY",FOOD_SECURITY_AND_SUPPLY:"FOOD_SECURITY",ENVIRONMENTAL_SERVICE:"ENVIRONMENT",MOBILITY_INFRASTRUCTURE:"MOBILITY",CITIZENSHIP_SERVICES:"CITIZENSHIP"},canonical=aliases[raw]||raw,label=publicEquipmentCategory(raw);return {raw,canonical,label,body:EQUIPMENT_SYMBOLS[canonical]||EQUIPMENT_SYMBOLS.CITIZENSHIP};}
  function equipmentInlineIcon(category){const icon=equipmentSemanticPresentation(category);return semanticSvg(icon.body,`Equipamento: ${icon.label}`,`equipment-inline category-${icon.canonical.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`);}
  function schoolMarkerIcon(priority) { const size=markerSize(priority?"priority":"school"),label=priority?"Escola prioritária Agenda Cidade UNICEF":"Escola";return L.divIcon({className:"acu-marker-shell acu-school-marker-shell",html:semanticSvg(SCHOOL_SYMBOL,label,"school",priority),iconSize:[size,size],iconAnchor:[size/2,size/2]}); }
  function equipmentMarkerIcon(category) { const size=markerSize("equipment"),icon=equipmentSemanticPresentation(category);return L.divIcon({className:"acu-marker-shell acu-equipment-marker-shell",html:semanticSvg(icon.body,`Equipamento: ${icon.label}`,`equipment category-${icon.canonical.toLowerCase().replace(/[^a-z0-9]+/g,"-")}`),iconSize:[size,size],iconAnchor:[size/2,size/2]}); }
  function largeCityCanvasPoints() { return ["sao_paulo","rio_de_janeiro"].includes(state.cityId); }
  function detailedPointSymbology() { return !largeCityCanvasPoints()||Boolean(state.map&&Number(state.map.getZoom())>=13); }
  function schoolPointMarker(item) {
    const options={icon:schoolMarkerIcon(Boolean(item.priority)),riseOnHover:true,title:item.name,alt:item.name,keyboard:true};if(citywideComparisonEnabled())options.zIndexOffset=item.priority?400:300;return L.marker([Number(item.latitude),Number(item.longitude)],options);
  }
  function equipmentPointMarker(item) {
    const options={icon:equipmentMarkerIcon(item.category),riseOnHover:true,title:item.name,alt:item.name,keyboard:true};if(citywideComparisonEnabled())options.zIndexOffset=200;return L.marker([Number(item.latitude),Number(item.longitude)],options);
  }
  function pctMarkerIcon() { return L.divIcon({className:"acu-marker-shell",html:'<span class="acu-point-marker pct"></span>',iconSize:[15,15],iconAnchor:[8,8]}); }
  function countYes(object) { return Object.values(object||{}).filter(item=>item&&item.value===true).length; }
  function formatPercent(value) { return value!==null&&value!==undefined&&value!==""&&Number.isFinite(Number(value))?`${Number(value).toLocaleString("pt-BR",{maximumFractionDigits:1})}%`:"N/D"; }
  function schoolProfileData(item) {
    const p=profileFor(item)||item.profile||{},w=item.wash||canonicalSchoolWash(item),stages=(p.stages&&p.stages.length?p.stages:(item.stage_labels||canonicalSchoolStages(item).map(schoolStageLabel))),professionals=p.specialized_professionals||{},trajectory=p.trajectory||{};
    return {p,w,stages,professionals,trajectory,enrollments:p.enrollments?.total??item.enrollments??null,teachers:p.teachers?.total??item.teachers??null,classes:p.classes?.total??item.classes??null,managers:p.managers??item.managers??null};
  }
  function schoolTerritoryLabel(item,p={}) {
    const neighborhood=item.neighborhood||item.territory||p.neighborhood||null,district=item.district_name||item.district||p.district||null;
    if(item.inside_daico===true)return `${neighborhood||"Bairro N/D"} · DAICO`;
    if(state.cityId==="sao_paulo")return `${district||neighborhood||"Distrito N/D"} · São Paulo`;
    if(state.cityId==="rio_de_janeiro")return `${item.neighborhood_name||neighborhood||"Bairro N/D"} · ${item.administrative_region_name||"RA N/D"} · Rio de Janeiro`;
    return `${neighborhood||district||"Território N/D"} · ${state.data?.config?.city_name||"Belém"}`;
  }
  function schoolWashBathroom(w) { return w.bathroom??w.bathroom_status??w.toilet??"N/D"; }
  function schoolInfrastructureItems(p) {
    const items=[],yesNo=value=>value?.value===true?"Sim":value?.value===false?"Não":"N/D";
    items.push(["Internet",yesNo(p.internet?.IN_INTERNET)]);
    items.push(["Acessibilidade",p.accessibility?`${countYes(p.accessibility)} recurso(s) informado(s)`:"N/D"]);
    items.push(["Quadra",yesNo(p.spaces?.IN_QUADRA_ESPORTES)]);
    items.push(["Sala de leitura",yesNo(p.spaces?.IN_SALA_LEITURA)]);
    items.push(["Climatização",p.rooms?.climatized_pct!==null&&p.rooms?.climatized_pct!==undefined&&Number.isFinite(Number(p.rooms.climatized_pct))?`${Number(p.rooms.climatized_pct).toLocaleString("pt-BR",{maximumFractionDigits:1})}% das salas`:"N/D"]);
    return items;
  }
  function schoolQuickCard(item) {
    const {p,w,stages,professionals,trajectory,enrollments,teachers,classes,managers}=schoolProfileData(item),dataSourceIds=(item.source_ids||[item.source_id]).filter(Boolean),canonicalDataSource=item.source_id?[item.source_id]:dataSourceIds.slice(0,1),infrastructure=schoolInfrastructureItems(p);
    const washClassifiable=w.eligible===true,territory=schoolTerritoryLabel(item,p);
    return `<article class="acu-school-tooltip school-quick-card" data-school-id="${esc(item.id)}">
      <button type="button" class="school-quick-close" data-school-quick-close aria-label="Fechar ficha rápida">×</button>
      <header>${item.priority?'<span class="school-priority-tag">Prioritária ACU</span>':'<span class="school-kind-tag">Escola</span>'}<strong>${esc(item.name)}</strong><small>INEP ${esc(item.official_code||"N/D")} · ${esc(item.dependency||p.dependency||"N/D")}</small></header>
      <div class="school-quick-stats" aria-label="Resumo quantitativo"><div><strong>${esc(enrollments??"N/D")}</strong><span>Matrículas</span></div><div><strong>${esc(teachers??"N/D")}</strong><span>Docentes</span></div><div><strong>${esc(classes??"N/D")}</strong><span>Turmas</span></div><div><strong>${esc(managers??"N/D")}</strong><span>${Number(managers)===1?"Gestor":"Gestores"}</span></div></div>
      <p class="school-quick-offer"><b>Etapas:</b> ${esc(stages.join(", ")||"N/D")}</p>
      <section class="school-quick-wash"><b>WASH nas escolas · infraestrutura declarada</b>${washClassifiable?`<div><span>Água<strong>${esc(w.water||"N/D")}</strong></span><span>Esgotamento<strong>${esc(w.sewage||"N/D")}</strong></span><span>Banheiro<strong>${esc(schoolWashBathroom(w))}</strong></span></div>`:'<p>Não classificável no universo analítico.</p>'}</section>
      <div class="school-quick-meta"><p><b>Território</b><span>${esc(territory)}</span></p><p><b>Trajetória</b><span>${state.cityId==="manaus"?"Ver taxas por etapa na ficha completa":`Distorção ${esc(formatPercent(trajectory.distortion?.rate_pct))} · Abandono ${esc(formatPercent(trajectory.abandonment?.rate_pct))}`}</span></p></div>
      <div class="school-quick-infrastructure">${infrastructure.map(([label,value])=>`<span><b>${esc(label)}</b> ${esc(value)}</span>`).join("")}</div>
      <p class="school-quick-professionals">Nutricionista ${esc(professionals.QT_PROF_NUTRICIONISTA??"N/D")} · Psicólogo ${esc(professionals.QT_PROF_PSICOLOGO??"N/D")} · Assistente social ${esc(professionals.QT_PROF_ASSIST_SOCIAL??"N/D")}</p>
      <footer><span>Fonte: ${shortSourceCitation(canonicalDataSource,"INEP — Censo Escolar 2025")}</span><div><button type="button" class="inline-source-link" data-source-ids="${esc(dataSourceIds.join(","))}">Fonte e metodologia</button><button type="button" class="school-full-profile-link" data-school-full-profile="${esc(item.id)}">Ver ficha completa</button></div></footer>
    </article>`;
  }
  function schoolFullProfile(item) {
    const {p,w,stages,professionals,trajectory,enrollments,teachers,classes,managers}=schoolProfileData(item),infrastructure=schoolInfrastructureItems(p),yn=value=>value?.value===true?"Sim":value?.value===false?"Não":"N/D";
    const profileSection=(title,html)=>`<section class="school-full-section"><h4>${esc(title)}</h4>${html}</section>`;
    return `<article class="school-full-profile"><header>${item.priority?'<span class="school-priority-tag">Prioritária ACU</span>':''}<h3>${esc(item.name)}</h3><p>INEP ${esc(item.official_code||"N/D")} · ${esc(item.dependency||p.dependency||"N/D")}</p></header>
      ${profileSection("Identificação",`<dl><dt>Código INEP</dt><dd>${esc(item.official_code||"N/D")}</dd><dt>Dependência</dt><dd>${esc(item.dependency||p.dependency||"N/D")}</dd><dt>Localização</dt><dd>${esc(p.location||"N/D")}</dd><dt>Situação no mapa</dt><dd>${validCoordinate(item)?"Localização espacial validada.":"Localização espacial não validada."}</dd></dl>`)}
      ${profileSection("Oferta",`<p>${esc(stages.join(", ")||"N/D")}</p>`)}
      ${profileSection("Matrículas e profissionais",`<dl><dt>Matrículas</dt><dd>${esc(enrollments??"N/D")}</dd><dt>Docentes</dt><dd>${esc(teachers??"N/D")}</dd><dt>Turmas</dt><dd>${esc(classes??"N/D")}</dd><dt>Gestores</dt><dd>${esc(managers??"N/D")}</dd><dt>Nutricionista</dt><dd>${esc(professionals.QT_PROF_NUTRICIONISTA??"N/D")}</dd><dt>Psicólogo</dt><dd>${esc(professionals.QT_PROF_PSICOLOGO??"N/D")}</dd><dt>Assistente social</dt><dd>${esc(professionals.QT_PROF_ASSIST_SOCIAL??"N/D")}</dd></dl>`)}
      ${profileSection("Infraestrutura",`<dl>${infrastructure.slice(2).map(([label,value])=>`<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join("")}<dt>Salas</dt><dd>${esc(p.rooms?.total??"N/D")}</dd><dt>Biblioteca</dt><dd>${esc(yn(p.spaces?.IN_BIBLIOTECA))}</dd><dt>Pátio coberto</dt><dd>${esc(yn(p.spaces?.IN_PATIO_COBERTO))}</dd></dl>`)}
      ${profileSection("Acessibilidade e conectividade",`<dl><dt>Recursos informados</dt><dd>${p.accessibility?esc(countYes(p.accessibility)):"N/D"}</dd><dt>Rampas</dt><dd>${esc(yn(p.accessibility?.IN_ACESSIBILIDADE_RAMPAS))}</dd><dt>Pisos táteis</dt><dd>${esc(yn(p.accessibility?.IN_ACESSIBILIDADE_PISOS_TATEIS))}</dd><dt>Internet</dt><dd>${esc(yn(p.internet?.IN_INTERNET))}</dd><dt>Banda larga</dt><dd>${esc(yn(p.internet?.IN_BANDA_LARGA))}</dd></dl>`)}
      ${profileSection("WASH",w.eligible===true?`<dl><dt>Água</dt><dd>${esc(w.water||"N/D")}</dd><dt>Esgotamento</dt><dd>${esc(w.sewage||"N/D")}</dd><dt>Banheiro</dt><dd>${esc(schoolWashBathroom(w))}</dd></dl><p class="notice">Infraestrutura declarada no Censo Escolar 2025; não representa resultado programático UNICEF.</p>`:"<p>Não classificável no universo analítico; ausência não foi convertida em zero.</p>")}
      ${profileSection("Trajetória",state.cityId==="manaus"?manausSchoolStageProfile(item):`<dl><dt>Distorção idade-série</dt><dd>${esc(formatPercent(trajectory.distortion?.rate_pct))}</dd><dt>Período da distorção</dt><dd>${esc(trajectory.distortion?.reference_year??"N/D")}</dd><dt>Abandono</dt><dd>${esc(formatPercent(trajectory.abandonment?.rate_pct))}</dd><dt>Período do abandono</dt><dd>${esc(trajectory.abandonment?.reference_year??"N/D")}</dd></dl>`)}
      ${profileSection("Território e diversidade",`<dl><dt>Recorte</dt><dd>${esc(schoolTerritoryLabel(item,p))}</dd><dt>Distrito administrativo</dt><dd>${esc(item.district_name||item.district||p.district||"N/D")}</dd><dt>Localização diferenciada</dt><dd>${esc(p.differentiated_location||"N/D")}</dd><dt>Status espacial</dt><dd>${esc(item.spatial_status||"N/D")}</dd></dl>`)}
      ${profileSection("Fontes e metodologia",entitySourceMethodology(item,"Dados escolares","Fonte da localização"))}
    </article>`;
  }
  const equipmentPresentationIndex=new Map(((window.DAICO_EQUIPMENT&&window.DAICO_EQUIPMENT.features)||[]).map(feature=>[String(feature.properties.equipment_id),feature.properties]));
  function equipmentPresentation(item) { return equipmentPresentationIndex.get(String(item.id))||{}; }
  function publicEquipmentCategory(value) { const labels={HEALTH:"Saúde",MENTAL_HEALTH:"Saúde mental",SOCIAL_ASSISTANCE:"Assistência social",RIGHTS_PROTECTION:"Proteção de direitos",EDUCATION_NON_SCHOOL:"Educação — equipamento não escolar",CULTURE:"Cultura",SPORTS_LEISURE:"Esporte e lazer",INTERSECTORAL_COMMUNITY:"Intersetorial/comunitário",JUSTICE_AND_RIGHTS:"Justiça e direitos",PUBLIC_SECURITY_GENERAL:"Segurança pública geral",PUBLIC_SPACE:"Espaço público",FOOD_SECURITY_AND_SUPPLY:"Segurança alimentar e abastecimento",ENVIRONMENTAL_SERVICE:"Serviço ambiental",MOBILITY_INFRASTRUCTURE:"Mobilidade e infraestrutura",YOUTH:"Juventude",CITIZENSHIP_SERVICES:"Serviços de cidadania",ASSISTENCIA_SOCIAL:"Assistência social",CULTURA:"Cultura",EDUCACAO:"Educação — equipamento não escolar",ESPORTE_LAZER:"Esporte e lazer",INTERSETORIAL:"Intersetorial/comunitário",PROTECAO_DIREITOS:"Proteção de direitos",SAUDE:"Saúde",SAUDE_MENTAL:"Saúde mental"};return labels[value]||String(value||"Categoria não informada").replaceAll("_"," "); }
  function publicOperationalStatus(item) { const value=item.operational_status||equipmentPresentation(item).operational_status||item.status||"STATUS_UNCONFIRMED";const labels={OPERATIONAL:"Operacional",UNDER_CONSTRUCTION:"Em construção",PLANNED:"Planejado",RENOVATION:"Em reforma",CLOSED_OR_INACTIVE:"Fechado/inativo",STATUS_UNCONFIRMED:"Status não confirmado",NOT_AVAILABLE_IN_SOURCE:"Status não informado pela fonte","Em funcionamento":"Operacional",ATIVO_NA_API:"Ativo no cadastro oficial",CADASTRO_ATIVO:"Cadastro ativo",DECLARADO_CENSO_SUAS_2024:"Cadastrado no Censo SUAS 2024",NAO_INFORMADO:"Status não confirmado"};return labels[value]||String(value).replaceAll("_"," "); }
  function publicEquipmentAddress(item) { return equipmentPresentation(item).address||item.address||"Endereço não informado pela fonte"; }
  function publicEquipmentSubtype(item) { const presentation=equipmentPresentation(item),value=String(item.display_subcategory_pt||presentation.display_subcategory||item.subcategory||item.type||"").trim(),needsEditorialForm=value.includes("_")||/^[A-Z0-9 _-]+$/.test(value);return needsEditorialForm?value.replaceAll("_"," ").replace(/\s+/g," ").toLocaleLowerCase("pt-BR").replace(/(^|[ -])\p{L}/gu,letter=>letter.toLocaleUpperCase("pt-BR")):value; }
  function equipmentTerritorySummary(item) {
    const administrative=item.administrative_region_name?`RA ${item.administrative_region_name}`:item.district_name||item.district?`Distrito ${item.district_name||item.district}`:item.incid_up?`UP ${item.incid_up}`:item.neighborhood_name||item.neighborhood||item.territory||null,programGeo=item.acu_program_territory_id&&state.data.geographies.find(geo=>geo.id===item.acu_program_territory_id),programBase=programGeo?geographyBaseName(programGeo):null,program=item.inside_daico===true?"DAICO — Território Agenda Cidade":programBase?(/territ.rio.*agenda cidade/i.test(programBase)?programBase:`${programBase} — Território Agenda Cidade`):null;
    return {administrative,program};
  }
  function equipmentQuickCardHtml(item) {
    const category=publicEquipmentCategory(item.category),status=publicOperationalStatus(item),subtype=publicEquipmentSubtype(item),territory=equipmentTerritorySummary(item),sourceIds=(item.source_ids||[item.source_id]).filter(Boolean),source=sourceById(item.source_id||sourceIds[0]),locationIds=(item.location_source_ids||[]).filter(id=>id&&!sourceIds.includes(id)),locationSource=locationIds.map(id=>shortSourceName(sourceById(id))).filter(Boolean).join("; "),partial=/PARTIAL|DISCOVERY/i.test(String(item.completeness||item.source_completeness_status||""));
    return `<article class="acu-quick-card equipment-quick-card" data-quick-card-kind="equipment" data-equipment-id="${esc(item.id)}"><button type="button" class="acu-quick-card-close" data-quick-card-close aria-label="Fechar ficha do equipamento">×</button><header class="equipment-quick-header"><div>${equipmentInlineIcon(item.category)}<span>${esc(category)}</span></div><em>${esc(status)}</em></header><strong class="equipment-quick-name">${esc(item.name)}</strong>${subtype?`<p class="equipment-quick-subtype">${esc(subtype)}</p>`:""}<dl><dt>Endereço</dt><dd>${esc(publicEquipmentAddress(item))}</dd>${territory.administrative?`<dt>Território administrativo</dt><dd>${esc(territory.administrative)}</dd>`:""}${territory.program?`<dt>Território ACU</dt><dd>${esc(territory.program)}</dd>`:""}</dl><footer><span>Fonte: ${esc(source?shortSourceName(source):"Fonte governada")}</span>${locationSource?`<span>Localização: ${esc(locationSource)}</span>`:""}${partial?"<em>Cadastro parcial</em>":""}<button type="button" data-equipment-full-profile="${esc(item.id)}">Ver ficha completa</button></footer></article>`;
  }
  function showEquipmentQuickCard(marker,item,event,persistent=false) {
    const point=state.map.latLngToContainerPoint(marker.getLatLng());
    const nearby=state.markerRecords.filter(record=>record.kind==="equipment"&&point.distanceTo(state.map.latLngToContainerPoint(record.marker.getLatLng()))<28);
    const choices=nearby.length>1?'<nav class="equipment-location-choices" aria-label="Registros próximos no mapa"><strong>Registros próximos neste ponto</strong>'+nearby.map(record=>'<button type="button" data-equipment-choice="'+esc(record.id)+'" aria-pressed="'+String(record.id===String(item.id))+'">'+esc(record.item.name)+'</button>').join('')+'</nav>':"";
    return showQuickCard("equipment",marker,equipmentQuickCardHtml(item).replace('</article>',choices+'</article>'),event,persistent,item);
  }
  function equipmentSourceBlock(item) {
    const ids=item.source_ids||[item.source_id],source=sourceById(item.source_id||ids[0]),locationIds=item.location_source_ids||[],differentLocation=locationIds.filter(id=>id&&!ids.includes(id));
    return `<div class="equipment-source-block"><span>Fonte</span><strong>${esc(source?`${source.institution} — ${String(source.title||source.source_title||"Fonte governada").replaceAll("_"," ")}`:(item.source||"Fonte governada não resolvida"))}</strong>${source&&source.official_url?`<a href="${esc(source.official_url)}" target="_blank" rel="noopener noreferrer">Visitar fonte oficial</a>`:"<small>Link oficial não disponível na fonte governada</small>"}${source?`<small>Período: ${esc(publicMetadata(source.reference_period||"N/D"))}</small>`:""}${differentLocation.length?`<small>Localização: ${shortSourceCitation(differentLocation)}</small>`:""}</div>`;
  }
  function equipmentCard(item) {
    return equipmentQuickCardHtml(item);
  }
  function equipmentPublicDetail(item) {
    const presentation=equipmentPresentation(item),subcategory=item.display_subcategory_pt||presentation.display_subcategory||item.subcategory||"Não informado";
    const administrativeRows=[item.district_name||item.district?["Distrito",item.district_name||item.district]:null,item.subprefecture_name?["Subprefeitura",item.subprefecture_name]:null,item.administrative_region_name?["Região Administrativa",item.administrative_region_name]:null,item.neighborhood_name?["Bairro",item.neighborhood_name]:null,item.planning_area_name?["Área de Planejamento",item.planning_area_name]:null].filter(Boolean).map(([label,value])=>`<dt>${esc(label)}</dt><dd>${esc(value)}</dd>`).join("")||"<dt>Geografia administrativa</dt><dd>Não informada pela atribuição espacial</dd>",acuRows=item.inside_daico===true?`<dt>Território ACU</dt><dd>DAICO</dd><dt>Bairro</dt><dd>${esc(item.neighborhood||item.territory||"N/D")}</dd>`:item.acu_program_territory_id?`<dt>Território ACU</dt><dd>${esc((state.data.geographies.find(geo=>geo.id===item.acu_program_territory_id)||{}).display_name||item.acu_program_territory_id)}</dd>`:"";
    return `<article class="equipment-public-detail"><div class="equipment-category-heading">${equipmentInlineIcon(item.category)}<h3>${esc(item.name)}</h3></div><dl><dt>Categoria</dt><dd>${esc(publicEquipmentCategory(item.category))}</dd><dt>Tipo</dt><dd>${esc(publicMetadata(subcategory))}</dd><dt>Status</dt><dd>${esc(publicOperationalStatus(item))}</dd><dt>Endereço</dt><dd>${esc(publicEquipmentAddress(item))}</dd>${administrativeRows}${acuRows}<dt>Completude da família</dt><dd>${esc(publicMetadata(item.completeness||"N/D"))}</dd></dl>${equipmentSourceBlock(item)}${entitySourceMethodology(item,"Fonte do cadastro","Fonte da localização")}<details class="technical-details"><summary>Detalhes técnicos</summary><p>Registro individual do cadastro oficial. Serviços e instalações físicas permanecem separados.</p></details></article>`;
  }
  function showGovernedSources(sourceIds,title="Fontes governadas") {
    $("#detail-title").textContent=title;
    $("#detail-content").innerHTML=`<div class="governed-source-list">${sourceIds.map(id=>{const source=sourceById(id);return source?`<article><strong>${esc(source.institution)}</strong><span>${esc(String(source.title||source.source_title||"Fonte governada").replaceAll("_"," "))}</span><small>Período: ${esc(publicMetadata(source.reference_period||"N/D"))} · Geografia: ${esc(publicMetadata(source.source_geography||"N/D"))}</small>${source.official_url?`<a href="${esc(source.official_url)}" target="_blank" rel="noopener noreferrer">Visitar fonte oficial</a>`:""}</article>`:"";}).join("")}</div><p class="notice">A lista apresenta as fontes governadas efetivamente relacionadas. Completude e limitações permanecem documentadas sem inferência de suficiência.</p>`;
    $("#detail-dialog").showModal();
  }
  function showViolenceMethodology(indicatorId=activeViolenceIndicatorId()) {
    const metric=metricById(indicatorId),period=selectedViolencePeriod(indicatorId),source=sourceById(period?.source_id||metric?.source_id),cell=metricCell(state.geographyId,indicatorId);if(!metric||!period||!source)return;
    $("#detail-title").textContent="Fonte e metodologia";
    $("#detail-content").innerHTML=`<article class="violence-methodology-detail"><h3>${esc(metric.label)}</h3><dl class="detail-grid"><dt>Instituição</dt><dd>${esc(source.institution)}</dd><dt>Fonte</dt><dd>${esc(String(source.title||source.source_title||"Fonte governada").replaceAll("_"," "))}</dd><dt>Link oficial</dt><dd>${source.official_url?`<a href="${esc(source.official_url)}" target="_blank" rel="noopener noreferrer">Abrir fonte oficial</a>`:"Não disponível"}</dd><dt>Período</dt><dd>${esc(period.period_label)}${period.partial_period?" · PERÍODO PARCIAL":""}</dd><dt>Geografia</dt><dd>${esc(currentGeo()?geographyDisplayName(currentGeo()):source.source_geography||"N/D")}</dd><dt>Definição da medida</dt><dd>${esc(metric.definition||"N/D")}</dd><dt>Fórmula/metodologia</dt><dd>${esc(metric.aggregation_rule||metric.formula||source.formula_transformation||"Contagem agregada conforme fonte")}</dd><dt>Limitações</dt><dd>${esc(metric.limitations||source.methodological_limitations||"N/D")}</dd><dt>Completude temporal</dt><dd>${esc(period.partial_period?`PARCIAL_ATÉ_${period.partial_through||period.period_end}`:(source.completeness_status||"PERÍODO_COMPLETO"))}</dd><dt>Lineage</dt><dd>${esc(cell?.lineage_id||period.lineage_id||metric.lineage_id||"N/D")}</dd><dt>Source ID</dt><dd>${esc(period.source_id||metric.source_id)}</dd></dl><p class="notice">Fontes administrativas oficiais, observações independentes verificadas e registros de saúde permanecem separados; valores de fontes distintas não são somados nem tratados como séries equivalentes.</p></article>`;
    $("#detail-dialog").showModal();
  }
  function showEquipmentSources() { const ids=state.cityId==="belem"?BELEM_EQUIPMENT_TRACE_SOURCE_IDS:[...new Set(equipmentUniverse().flatMap(item=>[...(item.source_ids||[item.source_id]),...(item.location_source_ids||[])]).filter(Boolean))];showGovernedSources(ids,"Fontes do catálogo e da localização dos equipamentos"); }
  function guideDocument(view="city") { return view==="platform"?DIAGNOSTIC_RUNTIME.general_guide:cityDiagnosticContract()?.guide; }
  function guideSnapshot(view="city") {
    const guide=guideDocument(view);
    return {view,city_id:state.cityId,title:guide?.title||null,source_file:guide?.source_file||null,block_count:guide?.blocks?.length||0,block_titles:(guide?.blocks||[]).map(item=>item.title)};
  }
  function renderGuideDialog(view="city") {
    const guide=guideDocument(view),content=$("#guide-content");if(!guide||!content)return null;
    $("#guide-title").textContent=view==="platform"?"Como ler a plataforma":`Como ler ${state.data?.config?.city_name||"esta cidade"}`;
    $$('[data-guide-view]').forEach(button=>{const active=button.dataset.guideView===view;button.setAttribute("aria-pressed",String(active));button.classList.toggle("is-selected",active);});
    content.innerHTML=`<p class="guide-intro">Leitura curta integrada ao diagnóstico. Consulte também Fontes e metodologia para os detalhes de cada indicador.</p><div class="guide-blocks">${guide.blocks.map((block,index)=>`<section class="guide-block"><span>${String(index+1).padStart(2,"0")}</span><div><h3>${esc(block.title)}</h3><p>${esc(block.body)}</p></div></section>`).join("")}</div><button type="button" class="secondary-button" data-go-sources>Fontes e metodologia</button>`;
    const sourceButton=content.querySelector('[data-go-sources]');if(sourceButton)sourceButton.onclick=()=>{$("#guide-dialog").close();state.module="sources";renderModule();$("#main").focus();};
    return guideSnapshot(view);
  }
  function openGuide(view="city") { const snapshot=renderGuideDialog(view),dialog=$("#guide-dialog");if(snapshot&&!dialog.open)dialog.showModal();return snapshot; }
  function openIndicatorMethodology(indicatorId=state.indicatorId) {
    const metric=metricById(indicatorId);state.module="sources";state.sourceFocusIds=indicatorId?[indicatorId]:[];renderModule();
    const filter=$("#source-filter");if(filter&&metric){filter.value=metric.indicator_id;filter.dispatchEvent(new Event("input"));filter.focus();}
    return {indicator_id:indicatorId,source_module_open:state.module==="sources",visible_cards:$$("#source-body .source-methodology-card").length};
  }
  function bindPublicSourceActions() { $$('[data-equipment-sources]').forEach(button=>{button.onclick=showEquipmentSources;});$$('[data-source-ids]').forEach(button=>{button.onclick=()=>showGovernedSources(button.dataset.sourceIds.split(",").filter(Boolean));});$$('[data-violence-methodology]').forEach(button=>{button.onclick=()=>showViolenceMethodology(button.dataset.violenceMethodology);});$$('[data-open-guide]').forEach(button=>{button.onclick=()=>openGuide(button.dataset.openGuide||"city");});$$('[data-indicator-methodology]').forEach(button=>{button.onclick=()=>openIndicatorMethodology(button.dataset.indicatorMethodology||state.indicatorId);}); }
  function bindSchoolQuickTooltip(marker,item) {
    const element=marker.getTooltip()?.getElement();if(!element)return;
    const mapRect=state.map.getContainer().getBoundingClientRect();
    element.style.width=Math.min(370,mapRect.width-16)+"px";
    const article=element.querySelector("article");if(article)article.style.maxHeight=Math.min(mapRect.height-20,innerHeight-120)+"px";
    const rect=element.getBoundingClientRect(),left=Math.max(mapRect.left+8,Math.min(rect.left,mapRect.right-rect.width-8)),top=Math.max(Math.max(mapRect.top+8,8),Math.min(rect.top,Math.min(mapRect.bottom,innerHeight)-rect.height-8));
    L.DomUtil.setPosition(element,L.DomUtil.getPosition(element).add([left-rect.left,top-rect.top]));
    L.DomEvent.disableClickPropagation(element);L.DomEvent.disableScrollPropagation(element);
    const close=element.querySelector("[data-school-quick-close]"),full=element.querySelector("[data-school-full-profile]");
    if(close)close.onclick=event=>{event.preventDefault();event.stopPropagation();marker.getTooltip().options.permanent=false;marker.closeTooltip();};
    if(full)full.onclick=event=>{event.preventDefault();event.stopPropagation();marker.getTooltip().options.permanent=false;marker.closeTooltip();showDetail("school",item.id);};
    element.querySelectorAll("[data-source-ids]").forEach(button=>{button.onclick=event=>{event.preventDefault();event.stopPropagation();const ids=button.dataset.sourceIds.split(",").filter(Boolean);marker.getTooltip().options.permanent=false;marker.closeTooltip();showGovernedSources(ids,"Fonte e metodologia escolar");};});
  }
  function clearPointLayers() { hideQuickCard("school",true);hideQuickCard("equipment",true);Object.values(state.markerLayers).forEach(layer=>{if(layer&&state.map&&state.map.hasLayer(layer))state.map.removeLayer(layer);});state.markerLayers={};state.markerRecords=[]; }
  function refreshPointLayers() {
    if(!state.map)return;clearPointLayers();const messages=[];let plottedSchoolRows=[];
    if(state.layerState.schools||state.layerState.priority){
      plottedSchoolRows=plottedSchools();
      const markers=plottedSchoolRows.map(item=>{const marker=schoolPointMarker(item).bindTooltip(schoolQuickCard(item),{direction:"auto",offset:[0,0],className:"acu-school-popup",opacity:1,interactive:true});if(matchMedia("(max-width:700px)").matches){
        marker.unbindTooltip();
        const show=(event,persistent)=>showQuickCard("school",marker,schoolQuickCard(item),event,persistent,item);
        marker.on({mouseover:event=>show(event,false),mouseout:()=>hideQuickCard("school"),click:event=>{if(event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);show(event,true);}});
        marker.on("add",()=>{const element=marker.getElement();if(element){element.setAttribute("aria-haspopup","dialog");L.DomEvent.on(element,"keydown",event=>{if(event.key==="Enter"||event.key===" "){L.DomEvent.preventDefault(event);show(event,true);}});}});
        state.markerRecords.push({marker,kind:item.priority?"priority":"school",id:String(item.id),item});return marker;
      }
      const openTooltip=marker.openTooltip;marker.openTooltip=function(){const result=openTooltip.apply(this,arguments);requestAnimationFrame(()=>bindSchoolQuickTooltip(marker,item));return result;};marker.on("add",()=>{const element=marker.getElement();if(!element)return;L.DomEvent.off(element,"blur",marker.closeTooltip,marker);L.DomEvent.on(element,"blur",event=>{if(!marker.getTooltip()?.options.permanent&&!marker.getTooltip()?.getElement()?.contains(event.relatedTarget))marker.closeTooltip();});});marker.on("tooltipopen",()=>requestAnimationFrame(()=>bindSchoolQuickTooltip(marker,item)));marker.on("click",()=>{state.markerRecords.filter(record=>record.marker!==marker&&record.marker.getTooltip?.()).forEach(record=>{record.marker.getTooltip().options.permanent=false;record.marker.closeTooltip();});marker.getTooltip().options.permanent=true;marker.openTooltip();});marker.on("mouseout",()=>{if(marker.getTooltip()?.options.permanent)requestAnimationFrame(()=>marker.openTooltip());});state.markerRecords.push({marker,kind:item.priority?"priority":"school",id:String(item.id),item});return marker;});state.markerLayers.schools=L.layerGroup(markers).addTo(state.map);
      const partialSchoolCity=["sao_luis","sao_paulo","rio_de_janeiro"].includes(state.cityId);messages.push(partialSchoolCity?(plottedSchoolRows.length?`${plottedSchoolRows.length} escola(s) espacialmente identificada(s) entre ${Number(state.data.facts.school_spatial_coverage_pct||0).toLocaleString("pt-BR",{maximumFractionDigits:2})}% do universo com localização validada.`:"Nenhuma escola espacialmente identificada na cobertura validada; isso não indica inexistência no território."):`${plottedSchoolRows.length} escola(s) visível(is).`);
    }
    if(state.layerState.equipment){
      let rows=equipmentRowsForMap();
      if(R77.active(state.cityId)){const represented=R77.renderedIds();rows=rows.filter(item=>!represented.has(item.id));}
      if(state.data.config.equipment_marker_grouping==="PHYSICAL_FACILITY_ID"){const grouped=new Map();rows.forEach(item=>{const key=item.physical_facility_id||item.id;if(!grouped.has(key))grouped.set(key,item);});rows=[...grouped.values()];}
      if(rows.some(item=>item.entity_type==="SCHOOL_AS_EQUIPMENT"))throw new Error("Contrato R4 violado: escola encontrada no universo não escolar de equipamentos.");
      const markers=rows.map(item=>{const marker=equipmentPointMarker(item);marker.on({mouseover:event=>showEquipmentQuickCard(marker,item,event,false),mouseout:()=>hideQuickCard("equipment"),focus:event=>showEquipmentQuickCard(marker,item,event,false),blur:()=>hideQuickCard("equipment"),click:event=>{if(event.originalEvent)L.DomEvent.stopPropagation(event.originalEvent);showEquipmentQuickCard(marker,item,event,true);}});marker.on("add",()=>{const element=marker.getElement();if(element){element.dataset.equipmentId=String(item.id);element.dataset.equipmentCategory=String(item.category||"");element.setAttribute("aria-label",`${publicEquipmentCategory(item.category)}: ${item.name}. Abrir ficha rápida.`);element.setAttribute("aria-haspopup","dialog");L.DomEvent.on(element,"focus",event=>showEquipmentQuickCard(marker,item,event,false));L.DomEvent.on(element,"blur",()=>hideQuickCard("equipment"));L.DomEvent.on(element,"keydown",event=>{if(event.key==="Enter"||event.key===" "){L.DomEvent.preventDefault(event);L.DomEvent.stopPropagation(event);showEquipmentQuickCard(marker,item,event,true);}});}});state.markerRecords.push({marker,kind:"equipment",category:item.category,id:String(item.id),item});return marker;});
      state.markerLayers.equipment=L.layerGroup(markers).addTo(state.map);
      const partialEquipmentCity=["sao_luis","sao_paulo","rio_de_janeiro"].includes(state.cityId);messages.push(partialEquipmentCity?(rows.length?`${rows.length} equipamento(s) espacialmente identificado(s) no catálogo adquirido; completude varia por família.`:"Nenhum equipamento espacialmente identificado na cobertura validada; isso não indica inexistência no território."):`${rows.length} equipamento(s) não escolar(es) visível(is).`);
    }
    if(state.layerState.pct){const rows=state.cityId==="belem"?((state.data.pct&&state.data.pct.generalizedAfricanMatrixPoints)||[]).filter(matchesTerritory):[];const markers=rows.map(item=>L.marker([Number(item.latitude),Number(item.longitude)],{icon:pctMarkerIcon(),riseOnHover:true}).bindTooltip(`<div class="acu-pct-tooltip"><strong>${esc(item.label)}</strong><span>${esc(item.neighborhood||"N/D")}</span><small>${esc(item.source||"")} · Localização generalizada para proteção</small></div>`,{direction:"top",className:"acu-pct-popup"}));state.markerLayers.pct=L.layerGroup(markers).addTo(state.map);messages.push(state.cityId==="belem"?`${rows.length} localização(ões) PCT generalizada(s).`:"PCT: dados não publicamente disponíveis; nenhum ponto exibido.");}
    if(window.ACU_R71_PANORAMA?.isActive())window.ACU_R71_PANORAMA.refreshLegend();else renderMapLegend();
    R77.mapLayer(state);
    state.map.r72Labels?.schedule();
    setMapStatus(R77.mapStatus()||messages.join(" ")||"Camadas territoriais prontas.",messages.some(item=>/pendente|não publicamente/.test(item))?"warning":"");
  }
  function updateMarkerIcons() { state.markerRecords.forEach(record=>record.marker.setIcon(record.kind==="equipment"?equipmentMarkerIcon(record.category):schoolMarkerIcon(record.kind==="priority"))); }

  function metricMatchesModule(metric) {
    const text = fold(`${metric.theme} ${metric.label} ${metric.indicator_id}`);
    if (state.module === "population") return /demograf|popula|idade|raca|indigen|quilomb/.test(text);
    if (state.module === "living") return /domic|agua|esgot|sanea|lixo|resid|renda|alfabet|entorno|urban|wash|banheiro/.test(text);
    if (state.module === "income") return /renda|responsavel|socioeconom/.test(text);
    if (state.module === "education") return /educa|escola|matric|docent|turma|gestor|abandono|distor/.test(text);
    if (state.module === "equipment") return /equip|servic|saude|assistencia|cultura|esporte/.test(text);
    if (state.module === "violence") return /violen|protec|segur|homic|agress|fogo cruzado|segup|sinan|sim|viva|isp|sih|sisvan|hospital|nutri|obes|sobrepeso|pneum|bronquiol|asma|influenza/.test(text);
    if (state.module === "pct") return /povos|tradicion|indigen|quilomb|terreiro|matriz africana/.test(text);
    return true;
  }
  function genericMetricsModule() {
    if(["belem","sao_paulo","rio_de_janeiro"].includes(state.cityId)&&["population","living"].includes(state.module)){
      const isBelem=state.cityId==="belem",theme=state.module==="population"?(isBelem?"DEMOGRAPHY":"Demografia e adolescentes"):(isBelem?"LIVING_WASH":"Condições domiciliares e WASH"),sourceGroups=isBelem?BELEM_PRESENTATION_GROUPS:foundationPresentationGroups(),groups=sourceGroups.filter(group=>group.theme===theme&&(isBelem?contextVisibilityForGroup(group)===true:true)&&availableMeasuresForGroup(group).length>0).sort((left,right)=>left.order-right.order);
      const sections=[];
      if(state.module==="population"){
        sections.push(presentationSection("Demografia essencial",groups,"Um conceito por card: valor absoluto em destaque e percentual da população como leitura complementar."));
        const shortcuts=[["demo_age_10_14_n","10–14"],["demo_age_15_19_n","15–19"],["demo_age_10_19_n","10–19"]].filter(([id])=>groups.some(group=>group.count_indicator_id===id));
        if(shortcuts.length)sections.push(`<nav class="demographic-subgroup" aria-label="Atalhos de adolescentes e jovens"><div><strong>Adolescentes e jovens</strong><small>Faixas exatas disponíveis; 15–19 não representa toda a população juvenil.</small></div>${shortcuts.map(([id,label])=>`<button type="button" data-presentation-indicator="${id}">${label}</button>`).join("")}</nav>`);
      }else{
        const bySubtheme=new Map();groups.forEach(group=>{if(!bySubtheme.has(group.subtheme))bySubtheme.set(group.subtheme,[]);bySubtheme.get(group.subtheme).push(group);});
        bySubtheme.forEach((items,title)=>sections.push(presentationSection(title,items,"Número e percentual permanecem vinculados à mesma fonte, período e geografia.")));
      }
      const available=groups.filter(group=>A.isAvailable(metricCell(state.geographyId,group.count_indicator_id))).length;
      $("#module-view").innerHTML=moduleHeader()+`<div class="presentation-page">${sections.join("")||'<section class="panel panel-pad"><div class="notice">Nenhum indicador desta família possui valor válido no contexto territorial atual; itens integralmente N/D foram ocultados.</div></section>'}</div>`;
      bindPresentationCardActions();return;
    }
    let metrics = state.cityId==="belem"&&["population","living","income"].includes(state.module)?publicationMetricsForTheme(state.theme):(state.module==="population"?DEMOGRAPHY_PUBLICATION_IDS.map(id=>state.data.catalog.find(item=>item.indicator_id===id)).filter(Boolean):state.data.catalog.filter(metricMatchesModule));
    metrics=metrics.filter(indicatorGovernedForPublication);
    if(state.cityId==="belem"&&state.module==="population")metrics=metrics.filter(metric=>metric.indicator_id!=="demo_age_10_19_n");
    const available = metrics.filter(metric => A.isAvailable(currentCell(metric.indicator_id)));
    const visible=available;
    const cards=visible.map(metric => {
      const cell=currentCell(metric.indicator_id),percentage=isDemographicMetric(metric.indicator_id)?demographicPercentage(state.geographyId,metric.indicator_id):null;
      const availability=metricAvailability(metric.indicator_id,state.geographyId),badge=state.cityId==="belem"?publicAvailabilityBadge(availability):`<span class="tag ${A.isAvailable(cell)?"":"missing"}">${esc(availability)}</span>`;
      return `<article class="metric-card" data-family="${semanticProfile(metric).family}"><h3>${esc(metric.label)}</h3><strong>${esc(A.isAvailable(cell)?format(cell.value,metric.unit):"N/D")}</strong>${percentage?`<div class="metric-percentage ${percentage.available?"":"missing"}">${esc(percentage.available?`${format(percentage.percentage_of_total,"%")} da população`:"Percentual N/D")}</div>`:""}${cardSource(effectiveCellSourceIds(cell,metric))}${badge}${!A.isAvailable(cell)?`<p class="nd-explanation">${esc(ndExplanation(cell))}</p>`:""}${compactUniverse(metric)}${metricSourceMethodology(metric,cell)}</article>`;
    });
    const adolescentGroup=state.cityId==="belem"&&state.module==="population"?`<div class="demographic-subgroup"><div><strong>Adolescentes e jovens</strong><small>Faixas exatas disponíveis; 15–19 é somente essa faixa, não toda a população juvenil.</small></div>${[["demo_age_10_14_n","10–14"],["demo_age_15_19_n","15–19"],["demo_age_10_19_n","10–19"]].map(([id,label])=>`<button type="button" data-demographic-indicator="${id}">${label}</button>`).join("")}</div>`:"";
    $("#module-view").innerHTML = moduleHeader() + adolescentGroup + `<div class="content-grid"><section class="metric-list">${cards.join("") || `<div class="notice">Não há indicadores disponíveis nesta geografia.</div>`}</section></div>`;
    $$('[data-demographic-indicator]').forEach(button=>button.addEventListener("click",()=>{state.indicatorId=button.dataset.demographicIndicator;applyMeasureContract(activePresentationGroup(),false);updateMapIndicatorButton();state.module="panorama";$("#indicator-select").value=state.indicatorId;renderModule();}));
  }

  function renderEducation() {
    const universe=schoolUniverse(),partialSpatialCity=["sao_luis","sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId),territorialSubset=partialSpatialCity&&currentGeo().level!=="MUNICIPALITY",baseRows=state.cityId==="manaus"?manausAnalyticalSchools(currentGeo()):state.cityId==="belem"?schoolRowsForContext(currentGeo()):(territorialSubset?state.data.schools.filter(validCoordinate).filter(matchesTerritory):state.data.schools),hasPriority=universe.some(item=>item.priority);
    const dependencies=[...new Set(universe.map(item=>item.dependency).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    const stages=[...new Set(universe.flatMap(item=>canonicalSchoolStages(item)))].sort((a,b)=>schoolStageLabel(a).localeCompare(schoolStageLabel(b),"pt-BR"));
    const totalEnrollments=baseRows.reduce((sum,item)=>sum+(Number(item.enrollments)||0),0);
    const aggregateSchoolSourceIds=state.cityId==="manaus"?[...new Set(universe.flatMap(item=>item.source_ids||[item.source_id]))]:state.cityId==="belem"?BELEM_SCHOOL_TRACE_SOURCE_IDS:state.cityId==="sao_luis"?["SRC_INEP_CENSO_ESCOLAR_2025"]:["SRC_INEP_CENSO_ESCOLAR_2025_V2"],aggregateSchoolSourceLabel=state.cityId==="belem"?"Fontes do universo e da localização · Ver fontes":"INEP — Censo Escolar 2025";
    const locationNote=partialSpatialCity?`<div class="notice">Cobertura espacial validada: ${esc(state.data.facts.spatial_schools)} de ${esc(state.data.schools.length)} escolas (${esc(Number(state.data.facts.school_spatial_coverage_pct||0).toLocaleString("pt-BR",{maximumFractionDigits:2}))}%). ${state.cityId==="manaus"?"Esta matriz usa a atribuição territorial analítica disponível; o mapa usa somente coordenadas validadas. Nenhum desses recortes representa necessariamente o universo territorial completo.":"Contagens submunicipais representam somente escolas espacialmente identificadas e não o universo territorial completo."}</div>`:state.cityId==="belem"?`<div class="notice">Universo municipal canônico: 693 escolas. ${esc(belemSpatialAdapter()?.metadata?.school_coverage?.spatialized_count||0)} possuem localização validada; recortes submunicipais mostram somente escolas espacialmente atribuídas e não convertem ausência de ponto em inexistência.</div>`:"";
    const literacyPanel=state.cityId==="belem"?(()=>{const groups=BELEM_PRESENTATION_GROUPS.filter(group=>group.theme==="EDUCATION_LITERACY"&&contextVisibilityForGroup(group)===true&&availableMeasuresForGroup(group).length>0).sort((left,right)=>left.order-right.order),subthemes=[["NÃO ALFABETIZADOS","Não alfabetizados",groups.filter(group=>group.subtheme==="NÃO ALFABETIZADOS")],["ALFABETIZADOS","Alfabetizados",groups.filter(group=>group.subtheme==="ALFABETIZADOS")],["ALFABETIZADOS — RECORTES","Alfabetizados — recortes por sexo e cor/raça",groups.filter(group=>group.subtheme==="ALFABETIZADOS — RECORTES")]];return `<div class="literacy-presentation"><div class="notice">Alfabetização é apresentada antes da matriz escolar. Cada conceito reúne número e percentual quando ambos são metodologicamente válidos; nenhuma faixa etária é interpolada.</div>${subthemes.map(([,title,items])=>presentationSection(title,items)).join("")||'<div class="notice">Nenhum indicador de alfabetização possui valor válido neste contexto territorial.</div>'}</div>`;})():"";
    const trajectoryPanel=["sao_paulo","rio_de_janeiro"].includes(state.cityId)?(()=>{
      const prefix=state.cityId==="sao_paulo"?"SP":"RJ",stages=[{id:"EF_AI",label:"Ensino Fundamental — anos iniciais"},{id:"EF_AF",label:"Ensino Fundamental — anos finais"},{id:"EM",label:"Ensino Médio"}],families=[{id:"ABANDONMENT",label:"Abandono escolar"},{id:"AGE_GRADE_DISTORTION",label:"Distorção idade-série"}];
      const sections=stages.map(stage=>{const metrics=families.map(family=>metricById(`${prefix}_SCHOOL_${family.id}_${stage.id}_PCT`)).filter(Boolean).filter(indicatorGovernedForPublication),cells=metrics.map(metric=>({metric,cell:currentCell(metric.indicator_id)})).filter(item=>A.isAvailable(item.cell)),available=cells.length>0;if(!available)return "";
        const lowCoverage=state.cityId==="rio_de_janeiro"&&stage.id==="EM"&&state.geographyId==="PAVUNA_ACU_OPERATIONAL_2022",emWarning=lowCoverage?'<div class="notice warning"><span class="tag warning">LOW_ANALYTICAL_COVERAGE</span> <strong>Resultado referente a uma escola com dados compatíveis no subconjunto territorial validado.</strong> Não deve ser tratado como destaque nem como retrato territorial completo.</div>':"",cards=`<div class="metric-list">${cells.map(({metric,cell})=>`<article class="metric-card" data-family="${semanticProfile(metric).family}"><h3>${esc(metric.label)}</h3><strong>${esc(A.isAvailable(cell)?r50Format(cell.value,metric.unit):"N/D")}</strong>${A.isAvailable(cell)?'<span class="tag warning">NUMERADOR APROXIMADO</span>':""}${cardSource(effectiveCellSourceIds(cell,metric))}${!A.isAvailable(cell)?`<p class="nd-explanation">${esc(ndExplanation(cell))}</p>`:""}${metricSourceMethodology(metric,cell)}</article>`).join("")}</div>`;
        return `<section class="presentation-section school-trajectory-stage" data-school-stage="${stage.id}"><header><div><span class="tag">${esc(stage.id)}</span><h2>${esc(stage.label)}</h2><p>Razão entre somas de numeradores aproximados e matrículas compatíveis; não é média simples das taxas escolares.</p></div></header>${emWarning}${lowCoverage?`<details class="low-analytical-coverage"><summary>Ver resultado de cobertura analítica baixa</summary>${cards}</details>`:cards}${available?"":'<div class="notice">Sem valor publicável para esta etapa no contexto atual.</div>'}</section>`;}).join("");
      const coverage=state.cityId==="rio_de_janeiro"?'<div class="notice"><strong>Cobertura territorial qualificada:</strong> o perfil carioca usa 1.167 de 3.897 escolas espacializadas (29,946%); Pavuna reúne 45 escolas espacializadas. Esses valores não sustentam um coroplético municipal completo.</div>':'<div class="notice">São Paulo publica as etapas separadamente para 96 distritos e os dois territórios ACU. Os indicadores combinados EF/EM da versão anterior foram substituídos nesta candidata.</div>';
      return sections?`<section class="school-trajectory-intro"><h2>Trajetória escolar por etapa</h2><p>Abandono e distorção idade-série permanecem separados por etapa de ensino, com fonte, cobertura e aproximação explícitas.</p>${coverage}</section>${sections}`:"";
    })():"";
    const schoolSummaryKpis=["sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId)?`${territorialSubset?"":kpi("Escolas no universo municipal",baseRows.length,"Censo Escolar 2025","AVAILABLE",aggregateSchoolSourceIds,aggregateSchoolSourceLabel)}${kpi("Matrículas",baseRows.length&&totalEnrollments?format(totalEnrollments,"pessoas"):"N/D",territorialSubset?"Somente escolas com localização governada no recorte; cobertura parcial explicitada":"Universo municipal canônico",territorialSubset?"PARTIAL_SPATIAL_COVERAGE":"AVAILABLE",aggregateSchoolSourceIds,aggregateSchoolSourceLabel)}`:`${kpi(territorialSubset?"Escolas espacialmente identificadas":"Escolas na geografia",baseRows.length,territorialSubset?"Cobertura espacial parcial qualificada":"Censo Escolar 2025",territorialSubset?"PARTIAL_SPATIAL_COVERAGE":"AVAILABLE",aggregateSchoolSourceIds,aggregateSchoolSourceLabel)}${kpi("Matrículas",baseRows.length?format(totalEnrollments,"pessoas"):"N/D",territorialSubset?"Somente escolas espacialmente identificadas; não é total territorial completo":"Universo municipal canônico",territorialSubset?"PARTIAL_SPATIAL_COVERAGE":"AVAILABLE",aggregateSchoolSourceIds,aggregateSchoolSourceLabel)}${hasPriority?kpi("Prioritárias",baseRows.filter(item=>item.priority).length,"Atributo programático",null,aggregateSchoolSourceIds):""}${kpi("Com coordenada",baseRows.filter(validCoordinate).length,partialSpatialCity?"Fontes oficiais locais; cobertura municipal explicitada":"Pontos publicáveis",territorialSubset?"PARTIAL_SPATIAL_COVERAGE":"AVAILABLE",aggregateSchoolSourceIds,aggregateSchoolSourceLabel)}`;
    $("#module-view").innerHTML=moduleHeader()+literacyPanel+trajectoryPanel+manausEducationProfile()+`<div class="content-grid"><section class="panel panel-pad"><div class="panel-title"><h2>Matriz escolar</h2><small id="school-count">${baseRows.length} registro(s) na visão</small></div>${locationNote}<div class="filter-row school-filters">
      <input id="school-filter" type="search" placeholder="Nome ou código INEP">
      <select id="school-dependency"><option value="">Todas as dependências</option>${dependencies.map(value=>`<option ${state.schoolFilters.dependency===value?"selected":""}>${esc(value)}</option>`).join("")}</select>
      <select id="school-stage"><option value="">Todas as etapas</option>${stages.map(value=>`<option value="${esc(value)}" ${state.schoolFilters.stage===value?"selected":""}>${esc(schoolStageLabel(value))}</option>`).join("")}</select>
      <select id="school-wash"><option value="">Todo WASH</option><option value="adequate" ${state.schoolFilters.wash==="adequate"?"selected":""}>Rede pública e banheiro declarados</option><option value="inadequate" ${state.schoolFilters.wash==="inadequate"?"selected":""}>Alguma condição não declarada</option><option value="eligible" ${state.schoolFilters.wash==="eligible"?"selected":""}>Classificável</option><option value="not-classifiable" ${state.schoolFilters.wash==="not-classifiable"?"selected":""}>Não classificável</option></select>
      <label class="filter-check"><input id="school-differentiated" type="checkbox" ${state.schoolFilters.differentiated?"checked":""}> Educação diferenciada</label>
      ${hasPriority?`<label class="filter-check"><input id="school-priority" type="checkbox" ${state.schoolFilters.priority?"checked":""}> Somente prioritárias ACU</label>`:'<input id="school-priority" type="checkbox" hidden>'}<button id="schools-on-map" class="secondary-button" type="button" ${partialSpatialCity&&!state.data.schools.some(validCoordinate)?"disabled":""}>Ver no mapa</button></div>
      <div class="data-table-wrap"><table><thead><tr><th>Escola</th><th>INEP</th><th>Dependência</th><th>Território</th><th>Matrículas</th><th>WASH</th></tr></thead><tbody id="school-body"></tbody></table></div></section>
      <aside class="panel panel-pad"><div class="kpi-grid">${schoolSummaryKpis}</div><div class="notice">O Censo Escolar 2025 / INEP define o universo canônico. WASH representa infraestrutura declarada, não resultado programático UNICEF. Filtros alteram a visualização, não o universo nem os dados.</div></aside></div>`;
    const draw=()=>{const q=fold($("#school-filter").value);state.schoolFilters.dependency=$("#school-dependency").value;state.schoolFilters.stage=$("#school-stage").value;state.schoolFilters.wash=$("#school-wash").value;state.schoolFilters.differentiated=$("#school-differentiated").checked;state.schoolFilters.priority=$("#school-priority").checked;const filtered=baseRows.filter(matchesSchoolFilters).filter(item=>!q||fold(`${item.name} ${item.official_code}`).includes(q)),visible=q?filtered:filtered.slice(0,500);$("#school-count").textContent=`${filtered.length} registro(s) após filtros${visible.length<filtered.length?` · exibindo ${visible.length}`:""}`;$("#school-body").innerHTML=visible.map(item=>`<tr><td><button class="table-link" data-detail="school" data-id="${esc(item.id)}">${esc(item.name)}</button></td><td>${esc(item.official_code)}</td><td>${esc(item.dependency||"N/D")}</td><td>${esc(item.territory||"N/D")}</td><td>${esc(format(item.enrollments,"pessoas"))}</td><td>${esc(item.wash&&item.wash.eligible?`${item.wash.water||"N/D"} / ${item.wash.sewage||"N/D"}`:"Não classificável")}</td></tr>`).join("");bindDetails();};
    ["school-filter","school-dependency","school-stage","school-wash","school-differentiated","school-priority"].forEach(id=>$("#"+id).addEventListener(id==="school-filter"?"input":"change",draw));
    $("#schools-on-map").addEventListener("click",()=>{state.layerState.schools=true;state.module="panorama";renderModule();});draw();bindPresentationCardActions();bindPublicSourceActions();
  }

  function equipmentRowsForView() {
    if(state.cityId==="belem")return equipmentRowsForContext(currentGeo());
    if(currentGeo().level==="MUNICIPALITY")return state.data.equipment;
    return state.data.equipment.filter(matchesTerritory);
  }
  function renderEquipment() {
    const rows=equipmentRowsForView(),universe=equipmentUniverse(),categories=[...new Set(universe.map(item=>item.category).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")),subcategories=[...new Set(universe.map(item=>item.subcategory).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")),statuses=[...new Set(universe.map(item=>item.operational_status||item.status).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR")),governmentLevels=[...new Set(universe.map(item=>item.government_level).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"pt-BR"));
    if(["belem","sao_paulo","rio_de_janeiro","manaus"].includes(state.cityId)){
      const spatialCount=universe.filter(validCoordinate).length;
      $("#module-view").innerHTML=moduleHeader()+`<section class="panel panel-pad equipment-catalog"><div class="panel-title"><div><h2>Catálogo municipal não escolar de equipamentos e serviços</h2><p class="equipment-summary"><strong>${universe.length} registros catalogados</strong> · ${spatialCount} com localização espacial validada · <button type="button" class="inline-source-link" data-equipment-sources>Fontes oficiais</button></p></div><small id="equipment-count">${rows.length} registro(s)</small></div><div class="filter-row equipment-filters"><input id="equipment-filter" type="search" placeholder="Nome, endereço ou fonte"><select ${R77.active(state.cityId)?"hidden":""} id="equipment-category"><option value="">Todas as categorias</option>${categories.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.category===value?"selected":""}>${esc(publicEquipmentCategory(value))}</option>`).join("")}</select><select id="equipment-subcategory"><option value="">Todas as subcategorias</option>${subcategories.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.subcategory===value?"selected":""}>${esc(value)}</option>`).join("")}</select><select id="equipment-status"><option value="">Todos os status</option>${statuses.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.status===value?"selected":""}>${esc(value)}</option>`).join("")}</select><select id="equipment-government"><option value="">Todos os níveis governamentais</option>${governmentLevels.map(value=>`<option value="${esc(value)}" ${state.equipmentFilters.governmentLevel===value?"selected":""}>${esc(value.replaceAll("_"," "))}</option>`).join("")}</select><button id="equipment-on-map" class="secondary-button" type="button">Ver no mapa</button></div>${R77.active(state.cityId)?`<details class="r77-catalog-categories"><summary>Categorias de equipamentos · rede de proteção e apoio à mulher</summary>${R77.controls(state,"catalog")}</details>`:""}<div id="equipment-body" class="equipment-list"></div><div class="notice">Escolas não integram este catálogo. Registros sem ponto validado permanecem na lista e na busca; ausência espacial nunca significa inexistência. A completude é declarada por família de fonte e não implica suficiência de oferta.</div></section>`;
      const draw=()=>{const q=fold($("#equipment-filter").value);state.equipmentFilters={...state.equipmentFilters,category:$("#equipment-category").value,subcategory:$("#equipment-subcategory").value,status:$("#equipment-status").value,governmentLevel:$("#equipment-government").value};state.equipmentFilter=state.equipmentFilters.category;const filtered=rows.filter(item=>(!q||fold(`${item.name} ${item.official_code} ${item.source} ${publicEquipmentAddress(item)}`).includes(q))&&equipmentMatchesFilters(item)),visible=q?filtered:filtered.slice(0,250);$("#equipment-count").textContent=`${filtered.length} registro(s) após filtros${visible.length<filtered.length?` · exibindo ${visible.length}`:""}`;$("#equipment-body").innerHTML=visible.map(item=>`<article class="equipment-list-item"><div class="equipment-category-heading">${equipmentInlineIcon(item.category)}<button class="table-link" data-detail="equipment" data-id="${esc(item.id)}">${esc(item.name)}</button></div><span>${esc(publicEquipmentCategory(item.category))} · ${esc(publicOperationalStatus(item))}</span><p>${esc(publicEquipmentAddress(item))} <b>— ${esc(item.territory||"Território não atribuído")}</b></p>${validCoordinate(item)?"":'<small class="spatial-unavailable">Localização espacial não validada.</small>'}${cardSource(item.source_ids||[item.source_id])}</article>`).join("");bindDetails();bindPublicSourceActions();};
      ["equipment-filter","equipment-category","equipment-subcategory","equipment-status","equipment-government"].forEach(id=>$("#"+id).addEventListener(id==="equipment-filter"?"input":"change",draw));$("#equipment-on-map").addEventListener("click",()=>{if(R77.active(state.cityId)){R77.openCategory();return;}state.layerState.equipment=true;state.module="panorama";renderModule();});R77.setCatalogRefresh(draw);draw();return;
    }
    $("#module-view").innerHTML=moduleHeader()+`<div class="content-grid"><section class="panel panel-pad"><div class="panel-title"><h2>Catálogo de equipamentos</h2><small id="equipment-count">${rows.length} registro(s)</small></div><div class="filter-row"><input id="equipment-filter" type="search" placeholder="Nome, código ou fonte"><select ${R77.active(state.cityId)?"hidden":""} id="equipment-category"><option value="">Todas as categorias</option>${categories.map(value=>`<option ${state.equipmentFilter===value?"selected":""}>${esc(value)}</option>`).join("")}</select><button id="equipment-on-map" class="secondary-button" type="button">Ver no mapa</button></div><div class="data-table-wrap"><table><thead><tr><th>Equipamento</th><th>Categoria</th><th>Status</th><th>Território</th><th>Completude</th><th>Mapa</th></tr></thead><tbody id="equipment-body"></tbody></table></div></section><aside class="panel panel-pad"><div class="kpi-grid">${kpi("Catalogados",rows.length,"Sem inferir suficiência")}${kpi("Espacialmente publicáveis",rows.filter(validCoordinate).length,"Pontos elegíveis")}${kpi("Sem ponto publicável",rows.filter(item=>!validCoordinate(item)).length,"Permanecem na tabela")}${kpi("Categorias",categories.length,"Famílias distintas")}</div><div class="notice">Completude é propriedade da família de fonte; PARTIAL/DISCOVERY_ONLY nunca é apresentado como universo completo. Coordenadas derivadas ou em conflito permanecem fora do mapa.</div></aside></div>`;
    const draw=()=>{const q=fold($("#equipment-filter").value);state.equipmentFilter=$("#equipment-category").value;const filtered=rows.filter(item=>(!q||fold(`${item.name} ${item.official_code} ${item.source}`).includes(q))&&(!state.equipmentFilter||item.category===state.equipmentFilter));$("#equipment-count").textContent=`${filtered.length} registro(s) após filtros`;$("#equipment-body").innerHTML=filtered.slice(0,180).map(item=>`<tr><td><button class="table-link" data-detail="equipment" data-id="${esc(item.id)}">${esc(item.name)}</button></td><td>${esc(item.category||"N/D")}</td><td>${esc(item.status||"N/D")}</td><td>${esc(item.territory||"N/D")}</td><td><span class="tag ${/PARTIAL|DISCOVERY|UNKNOWN/.test(item.completeness||"")?"warning":""}">${esc(item.completeness||"UNKNOWN")}</span></td><td>${validCoordinate(item)?"Disponível":"N/D"}</td></tr>`).join("");bindDetails();};
    $("#equipment-filter").addEventListener("input",draw);$("#equipment-category").addEventListener("change",draw);$("#equipment-on-map").addEventListener("click",()=>{if(R77.active(state.cityId)){R77.openCategory();return;}state.layerState.equipment=true;state.module="panorama";renderModule();});draw();
  }

  function r50Format(value,unit) { return String(unit).includes("%")?`${Number(value).toLocaleString("pt-BR",{minimumFractionDigits:3,maximumFractionDigits:3})}%`:format(value,unit); }
  function r50Municipality() { return state.data?.geographies?.find(item=>item.level==="MUNICIPALITY")||null; }
  function r50MetricContext(metric) {
    const record=governedIndicatorRecord(metric.indicator_id),current=currentGeo(),currentValue=current&&metricCell(current.id,metric.indicator_id),municipality=r50Municipality();
    if(record?.publication_mode==="MUNICIPAL_CONTEXT_ONLY"||(!A.isAvailable(currentValue)&&municipality&&A.isAvailable(metricCell(municipality.id,metric.indicator_id))))return {geography:municipality,cell:municipality?metricCell(municipality.id,metric.indicator_id):null,municipalContext:true};
    return {geography:current,cell:currentValue,municipalContext:false};
  }
  function r50DiagnosticCard(metric) {
    const context=r50MetricContext(metric),cell=context.cell,period=selectedViolencePeriod(metric.indicator_id),active=metric.indicator_id===state.indicatorId,ageNote=cell?.age_known_n!==null&&cell?.age_known_n!==undefined?`<p class="r50-age-completeness"><strong>Idade conhecida:</strong> ${esc(cell.age_known_n)} de ${esc(cell.total_victims_n)} vítimas (${esc(Number(cell.age_completeness_pct||0).toLocaleString("pt-BR",{maximumFractionDigits:2}))}%). Faixas etárias sobrepostas não são somadas.</p>`:"";
    const contextTag=context.municipalContext?`<span class="tag warning">CONTEXTO MUNICIPAL · ${esc(context.geography?.name||state.data.config.city_name)}</span>`:`<span class="tag">${esc(context.geography?geographyDisplayName(context.geography):"Geografia governada")}</span>`;
    return `<article class="metric-card r50-diagnostic-card ${active?"is-active":""}" data-r50-card="${esc(metric.indicator_id)}"><div class="r50-card-heading"><div>${contextTag}<h3>${esc(metric.label)}</h3></div><button type="button" class="quiet-button" data-r50-indicator="${esc(metric.indicator_id)}">Selecionar</button></div><strong>${esc(A.isAvailable(cell)?r50Format(cell.value,metric.unit):"N/D")}</strong><p><b>Período:</b> ${esc(period?.period_label||metric.period||"N/D")}${period?.partial_period?` · <span class="tag warning">PARCIAL${period.partial_through?` ATÉ ${esc(period.partial_through)}`:""}</span>`:""}</p>${ageNote}${!A.isAvailable(cell)?`<p class="nd-explanation">${esc(ndExplanation(cell))}</p>`:""}${cardSource(effectiveCellSourceIds(cell,metric))}${metricSourceMethodology(metric,cell)}</article>`;
  }
  function bindR50DiagnosticActions() {
    $$('[data-r50-indicator]').forEach(button=>button.onclick=()=>{state.indicatorId=button.dataset.r50Indicator;state.mapIndicator=state.indicatorId;configureIndicators();renderModule();});
    $$('[data-r50-perspective]').forEach(button=>button.onclick=()=>{state.indicatorId=button.dataset.r50Perspective;state.mapIndicator=state.indicatorId;configureIndicators();renderModule();});
    bindViolencePeriodControl();bindPublicSourceActions();
  }
  function r50ResidenceOccurrenceControl() {
    if(state.cityId!=="sao_paulo"||state.theme!=="Violências e proteção"||!state.indicatorId?.startsWith("SP_SINAN_"))return "";
    const residenceId=state.indicatorId.replace("SP_SINAN_OCCURRENCE_","SP_SINAN_RESIDENCE_"),occurrenceId=state.indicatorId.replace("SP_SINAN_RESIDENCE_","SP_SINAN_OCCURRENCE_"),residence=metricById(residenceId),occurrence=metricById(occurrenceId);if(!residence||!occurrence)return "";
    const selected=state.indicatorId.includes("_OCCURRENCE_")?"OCCURRENCE":"RESIDENCE";
    return `<section class="r50-perspective-control" aria-label="Perspectiva territorial do SINAN"><div><strong>Perspectiva territorial</strong><small>Residência é a visão padrão.</small></div><div role="group"><button type="button" class="${selected==="RESIDENCE"?"is-selected":""}" aria-pressed="${selected==="RESIDENCE"}" data-r50-perspective="${esc(residenceId)}">Residência</button><button type="button" class="${selected==="OCCURRENCE"?"is-selected":""}" aria-pressed="${selected==="OCCURRENCE"}" data-r50-perspective="${esc(occurrenceId)}">Ocorrência</button></div><p><b>Residência:</b> território de residência da pessoa notificada. <b>Ocorrência:</b> território onde a violência foi registrada como ocorrida.</p></section>`;
  }
  function renderR50Diagnostic() {
    const theme=state.theme==="Saúde e nutrição"?"Saúde e nutrição":"Violências e proteção",metrics=publicationMetricsForTheme(theme).filter(indicatorGovernedForPublication).filter(metric=>metric.r50_origin&&A.isAvailable(r50MetricContext(metric)?.cell)),bySubtheme=new Map();
    metrics.forEach(metric=>{const key=metric.subtheme||"INDICADORES";if(!bySubtheme.has(key))bySubtheme.set(key,[]);bySubtheme.get(key).push(metric);});
    const cityNotice=theme==="Saúde e nutrição"?'<strong>Contexto municipal:</strong> SIH/SUS registra eventos de internação, não crianças únicas; SISVAN descreve avaliações válidas acompanhadas e não prevalência populacional. Nenhum valor é redistribuído ao território ACU.':state.cityId==="sao_paulo"?'<strong>Separação obrigatória:</strong> notificações SINAN por residência e por ocorrência são visões distintas; tipos de violência não são exclusivos e não são somados. Mortalidade SIM/PRO-AIM permanece separada. Fogo Cruzado São Paulo está indisponível — nunca é mostrado como zero.':'<strong>Separação obrigatória:</strong> Fogo Cruzado é fonte complementar não governamental verificada; VIVA/SINAN permanece municipal e ISP mantém sua geografia policial, sem tradução de CISP para RA, bairro ou Pavuna. Nenhum ponto individual de vítima é publicado.';
    const sections=[...bySubtheme].map(([subtheme,items])=>`<section class="presentation-section r50-diagnostic-section"><header><div><h2>${esc(subtheme.replaceAll("_"," "))}</h2><p>${items.length} indicador(es) com fonte, período e geografia preservados.</p></div></header><div class="metric-list r50-diagnostic-grid">${items.map(r50DiagnosticCard).join("")}</div></section>`).join("");
    $("#module-view").innerHTML=moduleHeader()+`<div id="violence-context-slot" ${violenceContextHtml()?"":"hidden"}>${violenceContextHtml()}</div>${r50ResidenceOccurrenceControl()}<section class="panel panel-pad r50-diagnostic-intro"><span class="tag">R50 · CANDIDATA</span><h2>${esc(theme)}</h2><p>${cityNotice}</p><p>Equipamentos são os registros identificados nas fontes governadas; sua presença não mede capacidade, qualidade, acesso ou suficiência.</p></section>${sections||'<section class="panel panel-pad"><div class="notice">Nenhum indicador possui valor publicável neste contexto. A ausência permanece N/D governado.</div></section>'}`;
    bindR50DiagnosticActions();
  }

  function renderViolence() {
    if(state.cityId==="belem") {
      const groups=BELEM_PRESENTATION_GROUPS.filter(group=>group.theme==="VIOLENCE_PROTECTION"&&contextVisibilityForGroup(group)===true&&groupHasSelectedValue(group)).sort((left,right)=>left.order-right.order),segupGroups=groups.filter(group=>group.subtheme.startsWith("SEGUP")),fogoGroups=groups.filter(group=>group.subtheme.startsWith("FOGO")),fogo=state.data.violence.fogo_cruzado;
      const violenceSection=(title,tag,sourceIds,period,items,note)=>items.length?`<section class="violence-source-section" data-visible-violence-source="${esc(tag)}"><header><div><span class="tag">${esc(tag)}</span><h2>${esc(title)}</h2><p><strong>Período:</strong> ${esc(period)} · ${shortSourceCitation(sourceIds)}</p><p>${esc(note)}</p></div></header><div class="metric-list presentation-metric-list violence-metric-list">${items.map(group=>presentationCard(group,{compact:true})).join("")}</div></section>`:"";
      $("#module-view").innerHTML=moduleHeader()+`<div id="violence-context-slot">${violenceContextHtml()}</div><div class="violence-presentation">${violenceSection("SEGUP / SIAC — segurança pública oficial","FONTE ADMINISTRATIVA OFICIAL",["SRC_SEGUP_POWERBI"],"Períodos governados por indicador",segupGroups,"Registros administrativos publicados; a faixa 12–18 não está disponível exatamente. Valores municipais ou de outra granularidade nunca são redistribuídos para bairros.")}${violenceSection("Instituto Fogo Cruzado — violência armada","FONTE INDEPENDENTE VERIFICADA",["SRC_FC_API_V2_OCCURRENCES_BEL"],`${fogo.meta.coverage_start}–${fogo.meta.coverage_end}`,fogoGroups,`${fogo.meta.methodological_notice} Idade conhecida em ${fogo.meta.age_known_pct}% das vítimas; recortes etários só seriam exibidos quando exatos e governados.`)}${groups.length?"":'<section class="violence-source-section"><div class="notice">Nenhum indicador de violência possui valor válido neste contexto territorial.</div></section>'}<div class="notice violence-separation-notice"><strong>Separação metodológica obrigatória:</strong> SEGUP/SIAC e Fogo Cruzado não são somados, deduplicados nem apresentados como séries equivalentes. Somente agregados territoriais são exibidos; não há pontos de ocorrências, endereços ou perfis individuais de vítimas.</div></div>`;
      bindPresentationCardActions();bindViolencePeriodControl();bindPublicSourceActions();
    }
    else if(["sao_paulo","rio_de_janeiro"].includes(state.cityId)) renderR50Diagnostic();
    else { const v=state.data.violence; const cards=[["SSP-MA","SL_ssp_cvli_annual","Segurança pública; série conforme granularidade publicada."],["SINAN","SL_sinan_violence","Notificações de violência; município de ocorrência/residência conforme registro."],["SIM","SL_sim_adolescent_homicide","Óbitos por agressões; fonte e conceito próprios."],["SINASC","SL_sinasc_adolescent_mothers","Nascidos vivos por idade materna; não é taxa de gravidez."]]; $("#module-view").innerHTML=moduleHeader()+`<div class="availability-grid">${cards.map(([name,key,note])=>`<article class="availability-card"><span class="tag">MUNICIPAL</span><h3>${esc(name)}</h3><p><strong>${esc((v[key]||[]).length)}</strong> registros agregados</p><p>${esc(note)}</p></article>`).join("")}</div><div class="notice">Ao selecionar uma UP ou um território programático ACU, estas fontes retornam N/D quando só existe granularidade municipal/metropolitana. Nenhum valor municipal é distribuído territorialmente.</div>`; }
  }

  function renderPct() {
    if(state.cityId==="belem") { const p=state.data.pct; $("#module-view").innerHTML=moduleHeader()+`<div class="content-grid"><section class="panel panel-pad"><div class="kpi-grid">${kpi("Localidades indígenas · município",p.municipality.indigenousLocalities,"Cadastro IBGE",null,["SRC_IBGE_LOCALIDADES_INDIGENAS_2022_REV20250919"])}${kpi("Localidades quilombolas · município",p.municipality.quilombolaLocalities,"Cadastro IBGE",null,["SRC_IBGE_LOCALIDADES_QUILOMBOLAS_2022"])}${kpi("Matriz africana · DAICO",p.daico.africanMatrixSpaces,"Cadastro público parcial",null,["SRC_MAPA_CULTURAL_PA"])}${kpi("Escolas diferenciadas · município",p.municipality.differentiatedSchools,"Censo Escolar 2025",null,["SRC_INEP_CENSO_ESCOLAR_2025"])}</div></section><aside class="panel panel-pad"><h2>Política de publicação</h2><p><span class="tag">Localização generalizada</span></p><p>Dois registros de terreiro no DAICO: um em Campina de Icoaraci e um no Cruzeiro, apenas por localização generalizada.</p><div class="notice">A ausência de cadastro não implica inexistência. Nenhum registro de uso interno é publicado.</div></aside></div>`; }
    else if(["sao_paulo","rio_de_janeiro"].includes(state.cityId)) { const p=state.data.pct||{},m=p.municipality||{}; $("#module-view").innerHTML=moduleHeader()+`<div class="content-grid"><section class="panel panel-pad"><div class="kpi-grid">${kpi("Terras indígenas",m.indigenous_territories,"Agregado municipal",null,p.source_ids)}${kpi("Aldeias/localidades indígenas",m.indigenous_places,"Agregado municipal",null,p.source_ids)}${kpi("Localidades/territórios quilombolas",m.quilombola_places,"Agregado municipal",null,p.source_ids)}${kpi("Escolas diferenciadas",m.differentiated_schools,"Censo Escolar 2025",null,p.school_source_ids)}${kpi("Terreiros públicos",m.public_terreiros,"Somente cadastros publicáveis",null,p.source_ids)}</div></section><aside class="panel panel-pad"><h2>Política de publicação</h2><p><span class="tag">AGGREGATE_ONLY</span></p><p>Camadas PCT ficam desligadas por padrão. Registros classificados como INTERNAL_ONLY não integram o dashboard.</p><div class="notice">Reconciliation territorial: ${esc(p.territory_reconciliation_status||"PENDING_SOURCE")}. Ausência de cadastro não implica inexistência.</div></aside></div>`; }
    else $("#module-view").innerHTML=moduleHeader()+`<section class="panel panel-pad"><span class="tag warning">DATA_COLLECTION_IN_PROGRESS</span><h2>Dados não publicamente disponíveis</h2><p>O levantamento PCT de São Luís está em andamento. O estado é <strong>NOT_PUBLICLY_AVAILABLE</strong>, não zero.</p><div class="notice">Nenhuma das 9 escolas candidatas do PCT2 é promovida a localização oficial neste build.</div></section>`;
  }

  let comparisonR75=null;
  function matrixScaleApproved(metric,level) {
    if(state.cityId==="sao_paulo"&&metric.r77_matrix_only)return metric.geographies.includes(level);
    const r=governedIndicatorRecord(metric.indicator_id);
    if(!r||!indicatorGovernedForPublication(metric))return false;
    if(r.publication_mode==="MUNICIPAL_CONTEXT_ONLY")return level==="MUNICIPALITY";
    const aliases={BELEM_IBGE_DISTRICT:"IBGE_DISTRICT",BELEM_OPERATIONAL_NEIGHBORHOOD:"OPERATIONAL_NEIGHBORHOOD",SL_PLANNING_UNIT:"INCID_PLANNING_UNIT",SL_PROGRAM_TERRITORY:"AGENDA_CITY_TERRITORY",SL_PROGRAM_TERRITORY_ONLY:"AGENDA_CITY_TERRITORY",SL_CITY:"MUNICIPALITY",PROGRAM_PROFILE:"AGENDA_CITY_TERRITORY"};
    const approved=[r.recommended_geography,r.secondary_geography,...(r.allowed_map_scales||[])].filter(Boolean).map(x=>aliases[x]||x);
    if(level==="AGENDA_CITY_TERRITORY")return r.program_territory_available===true;
    return approved.includes(level);
  }
  function matrixMetrics(level,geos) {
    const all=state.cityId==="belem"?[...state.data.catalog,...BELEM_VIRTUAL_INDICATORS]:state.data.catalog;
    const seen=new Set();
    return all.filter(m=>{
      if(seen.has(m.indicator_id)||!matrixScaleApproved(m,level))return false;
      seen.add(m.indicator_id);
      return geos.some(g=>A.isAvailable(metricCell(g.id,m.indicator_id)));
    });
  }
  function matrixCell(m,g) {
    const c=metricCell(g.id,m.indicator_id),period=selectedViolencePeriod(m.indicator_id)?.period_label||m.period||"";
    return {cell:c,value:A.isAvailable(c)?c.value:null,availability:c?.status||"SOURCE_NOT_AVAILABLE",period,source_ids:effectiveCellSourceIds(c,m)};
  }
  function matrixExportRows() {
    if(!comparisonR75)return [];
    return comparisonR75.metrics.filter(m=>comparisonR75.open.has(m.theme)&&comparisonR75.geos.some(g=>state.compareIds.includes(g.id)&&A.isAvailable(metricCell(g.id,m.indicator_id)))).flatMap(m=>comparisonR75.geos.filter(g=>state.compareIds.includes(g.id)).map(g=>{
      const r=matrixCell(m,g);return {city:state.data.config.city_name,geography_id:g.id,geography:geographyDisplayName(g),geographic_level:g.level,indicator_id:m.indicator_id,indicator:m.label,selected_measure:m.measure_type||"canonical",selected_value:r.value??"",count:"",percentage:"",rate:"",availability:r.availability,unit:m.unit,period:r.period,source:r.source_ids.join(" | "),definition:m.definition,numerator:m.numerator,denominator:m.denominator,formula:m.formula||m.aggregation_rule,lineage_id:r.cell?.lineage_id||m.lineage_id||"",source_ids:r.source_ids.join(" | ")};
    }));
  }
  function matrixMethod(metric,selected) {
    const ids=[...new Set(selected.flatMap(g=>matrixCell(metric,g).source_ids))];
    const source=sourceDetails("Fonte",ids.length?ids:metric.source_ids||[metric.source_id]).replace(/^<details[^>]*><summary>.*?<\/summary>/,"").replace(/<\/details>$/,"");
    const fields=[["Período",selectedViolencePeriod(metric.indicator_id)?.period_label||metric.period],["Escala",governedScaleLabel(comparisonGeographyLevel())],["Definição",metric.definition],["Fórmula/metodologia",metric.formula||metric.aggregation_rule],["Numerador",metric.numerator],["Denominador",metric.denominator],["Limitação",metric.limitations||"Sem limitação adicional declarada."]];
    return `<details class="metric-source-methodology source-methodology"><summary>Fonte e metodologia</summary>${source}<dl>${fields.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(ACU_R75.metadata(v))}</dd>`).join("")}</dl><p>Fontes das colunas selecionadas. A exportação conserva a linhagem por célula, sem agregar as unidades.</p></details>`;
  }
  function matrixDraw() {
    if(!comparisonR75||!$("#r75-matrix"))return;
    const {geos,open}=comparisonR75,selected=geos.filter(g=>state.compareIds.includes(g.id)),metrics=comparisonR75.metrics.filter(m=>selected.some(g=>A.isAvailable(metricCell(g.id,m.indicator_id))));
    comparisonR75.excluded=comparisonR75.metrics.filter(m=>!metrics.includes(m)).map(m=>m.indicator_id);
    $("#compare-selected-count").textContent=selected.length+" de "+geos.length+" unidades";
    const themes=[...new Set(metrics.map(m=>m.theme))],current=currentMetric()?.theme;
    themes.sort((a,b)=>Number(b===current)-Number(a===current));
    if(state.cityId==="sao_paulo"&&R77.enabled()&&themes.includes("Rede de proteção e apoio")){themes.splice(themes.indexOf("Rede de proteção e apoio"),1);themes.unshift("Rede de proteção e apoio");}
    const body=themes.map(theme=>{
      const items=metrics.filter(m=>m.theme===theme),opened=open.has(theme);
      return `<tbody><tr class="r75-theme"><th colspan="${selected.length+1}"><button type="button" data-matrix-theme="${esc(theme)}" aria-expanded="${opened}">${opened?"−":"+"} ${esc(({"Rede de proteção e apoio":"Rede de proteção e apoio à mulher","DEMOGRAFIA":"Demografia","DEMOGRAPHY":"Demografia","ALFABETIZACAO":"Alfabetização","RENDA":"Renda","DOMICILIOS":"Domicílios","SANEAMENTO":"Saneamento","RACA_COR":"Cor ou raça","ENTORNO":"Entorno","EDUCATION_LITERACY":"Educação e alfabetização","LIVING_WASH":"Condições domiciliares e WASH","VIOLENCE_PROTECTION":"Violências e proteção"})[theme]||theme.replaceAll("_"," "))} · ${items.length} indicadores</button></th></tr>${opened?items.map(m=>{
        const profile=semanticProfile(m);
        return `<tr data-matrix-indicator="${esc(m.indicator_id)}" data-family="${profile.family}" class="${m.indicator_id===state.indicatorId?"r75-current":""}"><th scope="row"><span>${esc(m.label)}</span><small>${esc(m.unit)} · ${esc(m.period||"Período não documentado")}</small>${matrixMethod(m,selected)}</th>${selected.map(g=>{
          const r=matrixCell(m,g),missing=r.value===null,reason=missing?ndExplanation(r.cell):/PARTIAL|APPROX/.test(r.availability)?"Cobertura parcial/estimativa autorizada":"";
          return `<td data-matrix-geography="${esc(g.id)}" data-value="${r.value??""}" data-status="${esc(r.availability)}">${esc(missing?(/SUPPR/i.test(r.availability)?"Suprimido":/NOT_APPLICABLE/i.test(r.availability)?"Não aplicável":"Sem dado"):(m.r77_matrix_only&&r.value===0&&m.measure_type==="COUNT"?"Nenhum identificado no cadastro":format(r.value,m.unit)))}${m.r77_matrix_only?`<small>Cadastro parcial${m.measure_type==="DISTANCE"?" · ponto interno → unidade cadastrada mais próxima":""}</small>`:""}${reason?`<small>${esc(reason)}</small>`:""}</td>`;
        }).join("")}</tr>`;
      }).join(""):""}</tbody>`;
    }).join("");
    $("#r75-matrix").innerHTML=`<table class="r75-matrix"><caption>Indicadores por unidade territorial · valores originais</caption><thead><tr><th scope="col">Indicador · unidade · ano</th>${selected.map(g=>`<th scope="col" data-matrix-column="${esc(g.id)}">${esc(geographyDisplayName(g))}</th>`).join("")}</tr></thead>${body}</table>`;
    if(!selected.length)$("#r75-matrix").insertAdjacentHTML("afterbegin",'<p>Selecione unidades para preencher as colunas.</p>');
    $$("[data-matrix-theme]").forEach(b=>b.onclick=()=>{open.has(b.dataset.matrixTheme)?open.delete(b.dataset.matrixTheme):open.add(b.dataset.matrixTheme);matrixDraw();});
    $$(".compare-picker input").forEach(i=>{i.checked=state.compareIds.includes(i.value);});
    bindPublicSourceActions();publishQaSnapshot();
  }
  function matrixSelection(ids) {
    if(!comparisonR75)return;
    const wanted=new Set(ids),before=mapViewportSnapshot();
    state.compareIds=comparisonR75.geos.filter(g=>wanted.has(g.id)).map(g=>g.id);
    state.compareSelectionTouched=true;matrixDraw();
    if(state.layers.territories)state.layers.territories.setStyle(mapStyle);
    refreshTerritorialLabels();refreshValueLabels();state.map?.r72Labels?.schedule();
    recordViewportAudit("comparison_selection",before,false);publishQaSnapshot();
  }
  function matrixToggle(id) {
    if(!comparisonR75?.geos.some(g=>g.id===id))return;
    matrixSelection(state.compareIds.includes(id)?state.compareIds.filter(x=>x!==id):[...state.compareIds,id]);
  }
  function renderCompare() {
    const level=comparisonGeographyLevel(),geos=state.data.geographies.filter(g=>(g.comparable||g.program_comparable)&&g.level===level);
    if(state.compareLevel!==level){state.compareIds=[];state.compareSelectionTouched=false;state.compareLevel=level;}
    state.compareIds=state.compareIds.filter(id=>geos.some(g=>g.id===id));
    if(!state.compareSelectionTouched&&!state.compareIds.length)state.compareIds=geos.slice(0,4).map(g=>g.id);
    const metrics=matrixMetrics(level,geos),previous=comparisonR75;
    comparisonR75={city:state.cityId,level,geos,metrics,open:previous?.city===state.cityId&&previous.level===level?previous.open:new Set([currentMetric()?.theme||metrics[0]?.theme])};
    $("#module-view").innerHTML=moduleHeader()+`<section class="panel panel-pad comparator-panel"><div class="r75-compare-toolbar"><strong id="compare-selected-count"></strong><details class="r75-picker"><summary>Selecionar territórios</summary><input id="compare-search" type="search" placeholder="Buscar unidade" aria-label="Buscar unidade"><div class="compare-picker">${geos.map(g=>`<label data-compare-option="${esc(g.id)}"><input type="checkbox" value="${esc(g.id)}">${esc(geographyDisplayName(g))}</label>`).join("")}</div><button id="compare-all" type="button">Selecionar todos</button><button id="compare-clear" type="button">Limpar</button></details><button id="r75-matrix-export" type="button">Exportar linhas abertas</button></div><div class="r75-comparison-layout"><div id="r75-matrix" class="r75-matrix-scroll" tabindex="0" aria-label="Tabela comparativa; role horizontalmente para outras unidades"></div><div class="panel map-panel comparator-map-panel"><div id="map" class="map-canvas" role="application" aria-label="Mapa para localizar e selecionar unidades"></div><details class="r75-compare-tools"><summary>Camadas e filtros</summary>${mapControlsHtml()}</details><div id="map-legend" class="map-legend" hidden></div></div></div><small>Unidades do mesmo tipo · ${esc(governedScaleLabel(level))}. Pesquisas municipais não preenchem esta matriz. Cores identificam o sentido do indicador; valores de linhas diferentes podem ter universos e unidades distintos.</small></section>`;
    matrixDraw();
    $$(".compare-picker input").forEach(i=>i.addEventListener("change",()=>matrixToggle(i.value)));
    $("#compare-all").onclick=()=>matrixSelection(geos.map(g=>g.id));
    $("#compare-clear").onclick=()=>matrixSelection([]);
    $("#compare-search").oninput=e=>$$("[data-compare-option]").forEach(label=>{label.hidden=!fold(label.textContent).includes(fold(e.target.value));});
    $("#r75-matrix-export").onclick=exportCsv;
    requestAnimationFrame(initMap);
  }

  const assistantActionTypes={summary:"SUMMARY",characterize:"CHARACTERIZE_PROGRAM_TERRITORIES",compare:"COMPARE",attention:"ATTENTION",report:"REPORT",question:"QUESTION"};
  const characterizationIndicatorPriority=["demo_population_total_n","demo_age_0_19_n","demo_age_10_19_n","water_general_network_pct","sewer_general_or_storm_pct"];
  function programTerritories() {
    const configured=(state.data.config.program_territories||[]).filter(item=>item.active!==false);
    return configured.map(item=>{
      const geo=state.data.geographies.find(candidate=>candidate.id===item.territory_id);
      const contract=(state.data.territory_contracts||[]).find(candidate=>candidate.territory_id===item.territory_id)||{};
      const sourceIds=[...new Set([item.source_id,contract.source_id,...(item.source_ids||[]),...(contract.source_ids||[])].filter(Boolean))];
      return {geographyId:item.territory_id,geographyName:(geo&&geographyDisplayName(geo))||item.territory_name||item.territory_id,geographyType:(geo&&geo.level)||"AGENDA_CITY_TERRITORY",sourceId:sourceIds[0]||null,sourceIds,lineageId:item.lineage_id||contract.lineage_id||(geo&&geo.lineage_id)||null,limitations:contract.limitations||item.limitations||null,sectorCount:item.sector_count||contract.sector_count||null};
    });
  }
  function characterizationIndicatorIds() {
    const preferred=characterizationIndicatorPriority.filter(id=>state.data.catalog.some(item=>item.indicator_id===id));
    if(preferred.length)return preferred;
    const programIds=new Set(programTerritories().map(item=>item.geographyId));
    return state.data.catalog.filter(metric=>programIds.size&&[...programIds].some(id=>A.isAvailable(metricCell(id,metric.indicator_id)))).slice(0,4).map(metric=>metric.indicator_id);
  }
  function characterizationPeriod(indicatorIds) {
    const periods=[...new Set(indicatorIds.map(id=>state.data.catalog.find(item=>item.indicator_id===id)).filter(Boolean).map(item=>item.period).filter(Boolean))];
    return periods.length===1?periods[0]:(periods.length?periods.join("; "):null);
  }
  function programSpatialCoverageClaims(territories) {
    const specs=[{items:state.data.schools||[],kind:"SCHOOL",indicatorId:"SPATIAL_SCHOOL_IDENTIFIED_ENTITY_COUNT",unit:"escolas espacialmente identificadas",label:"Escolas espacialmente identificadas"},{items:state.data.equipment||[],kind:"EQUIPMENT",indicatorId:"SPATIAL_EQUIPMENT_IDENTIFIED_ENTITY_COUNT",unit:"equipamentos espacialmente identificados",label:"Equipamentos espacialmente identificados"}];
    const sourceIndex=new Map((state.data.sources||[]).map(item=>[item.source_id,item]));
    const claims=[];
    specs.forEach(spec=>{
      if(!spec.items.some(item=>Object.prototype.hasOwnProperty.call(item,"acu_program_territory_id")))return;
      const located=spec.items.filter(validCoordinate),baseSourceIds=[...new Set(spec.items.flatMap(item=>[item.source_id,...(item.source_ids||[]),...(item.location_source_ids||[])]).filter(Boolean))],baseLineageIds=[...new Set(spec.items.map(item=>item.lineage_id).filter(Boolean))];
      territories.forEach(territory=>{
        const value=located.filter(item=>item.acu_program_territory_id===territory.geographyId).length;
        const sourceIds=[...new Set([...territory.sourceIds,...baseSourceIds])],lineageIds=[...new Set([territory.lineageId,...baseLineageIds].filter(Boolean))],periods=[...new Set(sourceIds.map(id=>sourceIndex.get(id)).filter(Boolean).map(item=>item.reference_period).filter(Boolean))];
        claims.push({claim_id:`${state.cityId}:${territory.geographyId}:${spec.indicatorId}:SPATIAL_COVERAGE_CONTEXT`,claim_role:"SPATIAL_COVERAGE_CONTEXT",city_id:state.cityId,geography_id:territory.geographyId,geography_name:territory.geographyName,geography_type:territory.geographyType,indicator_id:spec.indicatorId,label:spec.label,geography:territory.geographyName,value,unit:spec.unit,numerator:value,denominator:spec.items.length,period:periods.join("; ")||null,source_id:territory.sourceId||sourceIds[0]||null,source_ids:sourceIds,lineage_id:territory.lineageId||lineageIds[0]||null,lineage_ids:lineageIds,source:sourceIds.map(id=>sourceIndex.get(id)).filter(Boolean).map(item=>item.title||item.source_name||id).slice(0,4).join("; "),availability:"PARTIAL_SPATIAL_COVERAGE",quality:"PARTIAL_SPATIAL_COVERAGE",limitation:`${located.length}/${spec.items.length} registros municipais possuem localização validada; ausência de ponto no recorte não demonstra inexistência, déficit, suficiência ou acesso.`,allowed_claims:["descriptive_spatially_identified_entity_count"],forbidden_claims:["entity_absence","service_sufficiency","access_inference","causal_impact"]});
      });
    });
    return claims;
  }
  function r50ExplicitCell(indicatorId,geographyId,periodId=null) {
    if(periodId!==null)return state.r50RuntimeIndex.get(r50RuntimeKey(indicatorId,geographyId,String(periodId)))||null;
    return state.data?.values?.[geographyId]?.[indicatorId]||null;
  }
  function r50AssistantPack(question,title,evidence,limitations=[]) {
    const context={response_type:"R50_SOURCE_BACKED_DIAGNOSTIC",release_id:state.data?.facts?.r50_release_id,city_id:state.cityId,question,title,geography_ids:[...new Set(evidence.map(item=>item.geography_id))],indicator_ids:[...new Set(evidence.map(item=>item.indicator_id))],periods:[...new Set(evidence.map(item=>item.period_id).filter(Boolean))],limitations};
    return {analysis_context:context,evidence:evidence.map(item=>Object.assign({claim_role:"SOURCE_BACKED_AGGREGATE",source_id:item.cell?.source_id||null,lineage_id:item.cell?.lineage_id||null,value:item.cell?.value??null},item)),governance_contract:{no_cross_source_sum:true,no_downscaling:true,no_personal_data:true}};
  }
  function r50AssistantResponse(question) {
    if(!["sao_paulo","rio_de_janeiro"].includes(state.cityId)||!state.data?.r50_runtime)return null;
    const text=fold(question),sp=state.cityId==="sao_paulo",evidence=[],fmtPct=value=>Number(value).toLocaleString("pt-BR",{minimumFractionDigits:3,maximumFractionDigits:3}),answer=(title,body,limitations=[])=>{const pack=r50AssistantPack(question,title,evidence,limitations);return {html:`<h2>${esc(title)}</h2><p>${body}</p><div class="notice">Resposta determinística baseada apenas nos ativos congelados R47–R49 integrados à candidata R50. Fonte, período, geografia, cobertura e limitações permanecem no evidence pack.</div>`,context:pack.analysis_context,pack};};
    const add=(indicator_id,geography_id,period_id=null)=>{const cell=r50ExplicitCell(indicator_id,geography_id,period_id);evidence.push({indicator_id,geography_id,period_id:period_id===null?null:String(period_id),cell});return cell?.value??null;};
    if(sp&&/compar/.test(text)&&/brasilandia/.test(text)&&/cidade tiradentes/.test(text)){
      const b="BRASILANDIA_ACU_OPERATIONAL_2022",c="CIDADE_TIRADENTES_ACU_OPERATIONAL_2022",id="SP_SINAN_RESIDENCE_TOTAL_NOTIFICATIONS_AGE_0_17",bv=add(id,b,2025),cv=add(id,c,2025);
      return answer("Comparação controlada — violência notificada",`Em 2025, o SINAN registrou <strong>${esc(bv)}</strong> notificações de violência entre residentes de 0 a 17 anos em Brasilândia e <strong>${esc(cv)}</strong> em Cidade Tiradentes. A comparação usa residência, a mesma fonte e o mesmo período; não soma tipos de violência nem interpreta contagens como risco individual.`,["Tipos SINAN não exclusivos","Contagens administrativas não medem prevalência"]);
    }
    if(sp&&/violen/.test(text)&&/brasilandia/.test(text)){
      const g="BRASILANDIA_ACU_OPERATIONAL_2022",ids={total:"SP_SINAN_RESIDENCE_TOTAL_NOTIFICATIONS_AGE_0_17",occ:"SP_SINAN_OCCURRENCE_TOTAL_NOTIFICATIONS_AGE_0_17",sexual:"SP_SINAN_RESIDENCE_SEXUAL_VIOLENCE_AGE_0_17",physical:"SP_SINAN_RESIDENCE_PHYSICAL_VIOLENCE_AGE_0_17",psych:"SP_SINAN_RESIDENCE_PSYCHOLOGICAL_MORAL_VIOLENCE_AGE_0_17",neglect:"SP_SINAN_RESIDENCE_NEGLECT_ABANDONMENT_AGE_0_17"},v=Object.fromEntries(Object.entries(ids).map(([key,id])=>[key,add(id,g,2025)]));
      return answer("Violência notificada — Brasilândia",`Em 2025, foram registradas <strong>${esc(v.total)}</strong> notificações por residência e <strong>${esc(v.occ)}</strong> por local de ocorrência. Na visão por residência: violência sexual <strong>${esc(v.sexual)}</strong>, física <strong>${esc(v.physical)}</strong>, psicológica/moral <strong>${esc(v.psych)}</strong> e negligência/abandono <strong>${esc(v.neglect)}</strong>. Os tipos não são exclusivos e, por isso, não devem ser somados.`,["Residência e ocorrência são perspectivas distintas","Tipos SINAN não exclusivos"]);
    }
    if(/abandono|distorcao/.test(text)){
      const geography=/cidade tiradentes/.test(text)?"CIDADE_TIRADENTES_ACU_OPERATIONAL_2022":/brasilandia/.test(text)?"BRASILANDIA_ACU_OPERATIONAL_2022":/pavuna/.test(text)?"PAVUNA_ACU_OPERATIONAL_2022":state.geographyId,family=/distorcao/.test(text)?"AGE_GRADE_DISTORTION":"ABANDONMENT",prefix=sp?"SP":"RJ",values=["EF_AI","EF_AF","EM"].map(stage=>add(`${prefix}_SCHOOL_${family}_${stage}_PCT`,geography)),name=state.data.geographies.find(item=>item.id===geography)?.name||geography;
      return answer(`${family==="ABANDONMENT"?"Abandono escolar":"Distorção idade-série"} — ${name}`,`As taxas por etapa são: anos iniciais do Ensino Fundamental <strong>${fmtPct(values[0])}%</strong>, anos finais <strong>${fmtPct(values[1])}%</strong> e Ensino Médio <strong>${fmtPct(values[2])}%</strong>. O cálculo é uma razão de somas; os numeradores reconstruídos a partir de taxas escolares arredondadas são aproximados.${!sp?" No Rio, a cobertura é territorialmente qualificada; em Pavuna o Ensino Médio usa uma escola compatível e não é destaque.":""}`,["Numeradores aproximados","Não é média simples das taxas escolares",...(!sp?["Cobertura espacial parcial"]:[])]);
    }
    if(/obesidade|sobrepeso|sisvan/.test(text)){
      const municipality=sp?"SP_MUNICIPALITY":"RJ_MUNICIPALITY",prefix=sp?"SP":"RJ",kind=/sobrepeso/.test(text)?"OVERWEIGHT":"OBESITY",values=["LT5","AGE_5_9","ADOLESCENTS"].map(age=>add(`${prefix}_SISVAN_${kind}_${age}_PCT`,municipality));
      return answer(`${kind==="OBESITY"?"Obesidade":"Sobrepeso"} no SISVAN — contexto municipal`,`Em 2025, entre as avaliações válidas registradas no SISVAN no município: menores de 5 anos <strong>${fmtPct(values[0])}%</strong>, 5 a 9 anos <strong>${fmtPct(values[1])}%</strong> e adolescentes <strong>${fmtPct(values[2])}%</strong>. Este resultado não é específico de ${/pavuna/.test(text)?"Pavuna":"um território ACU"} e não é prevalência populacional.`,["Somente contexto municipal","Avaliações válidas, não população","Cobertura populacional não estimada"]);
    }
    if(/hospital|internad|internacao|internacoes/.test(text)){
      const municipality=sp?"SP_MUNICIPALITY":"RJ_MUNICIPALITY",prefix=sp?"SP":"RJ",value=add(`${prefix}_SIH_HOSPITALIZATIONS_AGE_0_19`,municipality,2025);
      return answer("Internações de 0 a 19 anos — contexto municipal",`Em 2025, o SIH/SUS registrou <strong>${Number(value).toLocaleString("pt-BR")}</strong> internações de pessoas de 0 a 19 anos residentes no município. A formulação correta é <strong>número de internações, não crianças únicas</strong>: uma mesma pessoa pode gerar mais de uma internação.`,["Eventos de internação, não pessoas únicas","SUS","Somente contexto municipal"]);
    }
    if(!sp&&/(crianc|adolesc).*(vitim|armad|tiro|disparo)|(?:vitim|armad|tiro|disparo).*(crianc|adolesc)/.test(text)){
      const g="PAVUNA_ACU_OPERATIONAL_2022",all=add("RJ_FOGO_CRUZADO_HUMAN_VICTIMS",g,2025),a0=add("RJ_FOGO_CRUZADO_HUMAN_VICTIMS_AGE_0_11",g,2025),a12=add("RJ_FOGO_CRUZADO_HUMAN_VICTIMS_AGE_12_17",g,2025),a10=add("RJ_FOGO_CRUZADO_HUMAN_VICTIMS_AGE_10_19",g,2025),age=evidence.find(item=>item.indicator_id.endsWith("AGE_0_11"))?.cell;
      return answer("Vítimas com recorte etário — Pavuna",`Em 2025, o Fogo Cruzado registrou <strong>${esc(all)}</strong> vítimas em Pavuna, mas a idade era conhecida para <strong>${esc(age?.age_known_n)}</strong> (${esc(age?.age_completeness_pct)}%). Entre os casos com informação compatível, houve <strong>${esc(a0)}</strong> vítima de 0 a 11 anos, <strong>${esc(a12)}</strong> de 12 a 17 e <strong>${esc(a10)}</strong> de 10 a 19. As faixas se sobrepõem e nunca são somadas.`,["Fonte complementar não governamental verificada","Completude de idade obrigatória","Faixas etárias sobrepostas"]);
    }
    if(!sp&&/pavuna|violencia armada|fogo cruzado|tiro|disparo/.test(text)){
      const g="PAVUNA_ACU_OPERATIONAL_2022",occ=add("RJ_FOGO_CRUZADO_SHOOTING_OCCURRENCES",g,2025),victims=add("RJ_FOGO_CRUZADO_HUMAN_VICTIMS",g,2025),dead=add("RJ_FOGO_CRUZADO_DEAD",g,2025),wounded=add("RJ_FOGO_CRUZADO_WOUNDED",g,2025);
      return answer("Violência armada observada — Pavuna",`Em 2025, o Fogo Cruzado registrou em Pavuna <strong>${esc(occ)}</strong> ocorrências de tiros/disparos, <strong>${esc(victims)}</strong> vítimas, <strong>${esc(dead)}</strong> mortos e <strong>${esc(wounded)}</strong> feridos. São agregados de uma fonte complementar não governamental verificada, distintos dos registros policiais do ISP; não há publicação de pontos individuais de vítimas.`,["Fonte complementar não governamental verificada","Não combinar com ISP","Sem pontos individuais"]);
    }
    return null;
  }

  function manausSchoolStageProfile(item) {
    const labels={EF_AI:"Ensino Fundamental — anos iniciais",EF_AF:"Ensino Fundamental — anos finais",EM:"Ensino Médio"};
    return Object.entries(item.profile?.trajectory_by_stage||{}).map(([stage,values])=>`<section><h5>${esc(labels[stage]||stage)} · 2025</h5><dl>${[["ABANDONMENT","Abandono"],["AGE_GRADE_DISTORTION","Distorção idade-série"]].map(([family,label])=>{const c=values[family];return `<dt>${esc(label)}</dt><dd>${esc(formatPercent(c?.rate_pct))} ${c?.source_id?shortSourceCitation([c.source_id]):""}</dd>`;}).join("")}</dl></section>`).join("")+"<p>Taxas da escola publicadas pelo INEP, por etapa. N/D não é zero. Nenhuma média entre etapas foi calculada.</p>";
  }
  function manausAnalyticalSchools(geo) {
    return state.data.schools.filter(item=>geo.level==="MUNICIPALITY"||item.analytical_acu_program_territory_id===geo.id||item.analytical_neighborhood_id===geo.id);
  }
  function manausEducationProfile() {
    if(state.cityId!=="manaus"||!state.data.r58r1_education)return "";
    const records=state.data.r58r1_education.territorial_profiles.AGE_GRADE_DISTORTION.filter(x=>x.geography_id===state.geographyId),labels={EF_AI:"Ensino Fundamental — anos iniciais",EF_AF:"Ensino Fundamental — anos finais",EM:"Ensino Médio"};
    return `<section class="panel panel-pad" data-manaus-trajectory><h2>Trajetória escolar por etapa · 2025</h2><p>Perfil das escolas com atribuição territorial governada; a inclusão na análise não depende de um marcador no mapa. A cobertura abaixo é entre as escolas conhecidas com matrículas na etapa, não de todas as escolas que possam existir no território.</p><div class="metric-list">${records.map(c=>`<article class="metric-card"><h3>Distorção idade-série · ${esc(labels[c.etapa])}</h3><strong>${esc(formatPercent(c.rate))}</strong><p>${esc(c.schools_with_indicator)} de ${esc(c.schools_with_stage_enrollments)} escolas conhecidas com matrículas na etapa. Cobertura dessas matrículas: ${esc(formatPercent(c.enrollment_coverage))}.</p><p>${c.rate===null?"Não há dados compatíveis para calcular o perfil.":"Resultado aproximado: razão entre a soma dos numeradores reconstruídos e a soma das matrículas da mesma etapa. Não é taxa oficial do território nem retrato de alunos residentes."}</p>${cardSource([c.source_id,c.denominator_source_id])}<details><summary>Fonte e metodologia</summary><p>INEP · Taxas de Distorção Idade-Série e Censo Escolar · 2025.</p><p>${esc(c.bairro)}. ${esc(c.aggregation_rule)}</p><p>${esc(c.limitations)}</p>${officialSourceLink(sourceById(c.source_id))}</details></article>`).join("")}</div><div class="notice"><strong>Abandono territorial: N/D.</strong> ${esc(state.data.r58r1_education.abandonment_limitation)} As taxas por escola e etapa podem ser consultadas na ficha completa. ${shortSourceCitation(["SRC_INEP_RENDIMENTO_ESCOLAR_2025"])}</div></section>`;
  }
  function manausClosureAssistant(question) {
    if(state.cityId!=="manaus"||!state.data.r58r1_education)return null;
    const text=fold(question);if(/compar|soma.*bairro|residual|populacao de manaus/.test(text))return null;
    const geoId=/colonia|aleixo/.test(text)?"COLONIA_ANTONIO_ALEIXO_ACU_2022":state.geographyId,geo=state.data.geographies.find(g=>g.id===geoId),evidence=[],lines=new Map(state.data.lineage_registry.map(l=>[l.lineage_id,l]));
    const add=item=>{const ss=[...new Set([item.source_id,...(item.source_ids||[])].filter(Boolean))];if(!ss.length||ss.some(id=>!sourceById(id))||!lines.has(item.lineage_id))throw assistantContractError("ASSISTANT_SOURCE_TRACEABILITY_UNRESOLVED","A afirmação foi bloqueada porque sua fonte ou cadeia de evidências não foi resolvida.");evidence.push({...item,source_id:ss[0],source_ids:ss});return item;};
    let title="Disponibilidade de dados",body="Não há evidência governada suficiente para responder a essa pergunta. Nenhum valor será estimado.";
    if(/\b(?:12|0)\s*(?:a|–|-)\s*(?:17|18)\b/.test(text)){title="Faixa etária não disponível exatamente";body="N/D: esta faixa etária não foi disponibilizada exatamente na base governada. Não será estimada por interpolação de grupos mais amplos.";}
    else if(/abandono/.test(text)){title="Abandono escolar";state.data.r58r1_education.territorial_profiles.ABANDONMENT.filter(r=>r.geography_id===geoId).forEach(r=>add({...r,value:null,source_ids:[r.source_id,r.denominator_source_id],claim_role:"AVAILABILITY_LIMITATION_ONLY"}));body=state.data.r58r1_education.abandonment_limitation+" As taxas oficiais por escola estão disponíveis nas fichas, separadas por etapa. Não foi calculada média simples nem substituído o denominador ausente.";}
    else if(/distorcao/.test(text)){title=`Distorção idade-série — ${geo.display_name||geo.name}`;const rr=state.data.r58r1_education.territorial_profiles.AGE_GRADE_DISTORTION.filter(r=>r.geography_id===geoId);body=rr.map(c=>{if(c.rate===null)return `${c.etapa}: N/D, sem dados compatíveis.`;add({...c,value:c.rate,source_ids:[c.source_id,c.denominator_source_id]});return `${c.etapa}: ${formatPercent(c.rate)}, com ${c.schools_with_indicator} de ${c.schools_with_stage_enrollments} escolas conhecidas da etapa e ${formatPercent(c.enrollment_coverage)} das matrículas conhecidas.`;}).join(" ")+" Perfil aproximado das escolas observadas, não taxa oficial do território nem medida dos alunos residentes. Não é média simples.";}
    else if(/violen|protecao|sih|sisvan|sinasc|sim\b|pct|obesidade|internac/.test(text)){title="Dados ainda não publicados";body="Não há evidência governada publicável suficiente para responder a essa pergunta neste recorte. Nenhum valor municipal será atribuído ao território nem estimado. Indisponibilidade não significa ausência de ocorrências.";}
    else if(/equipamento/.test(text)){title=`Equipamentos — ${geo.display_name||geo.name}`;const rr=state.data.equipment.filter(e=>geo.level==="MUNICIPALITY"||e.acu_program_territory_id===geoId||e.neighborhood_id===geoId);rr.forEach(e=>add({entity_id:e.id,geography_id:geoId,source_id:e.source_id,source_ids:e.source_ids,lineage_id:e.lineage_id}));body=`O catálogo registra ${rr.length} equipamentos no recorte conhecido, sem contar escolas. As famílias têm completude parcial; o total não comprova suficiência da rede. Ausência de localização não significa inexistência de equipamento.`;}
    else if(/caracteriz|populacao|\d\s*(?:a|–|-)\s*\d|habitantes/.test(text)){
      title=`População — ${geo.display_name||geo.name}`;
      const ageMatch=text.match(/\b(\d+)\s*(?:a|–|-)\s*(\d+)\b/),candidate=ageMatch?`demo_age_${ageMatch[1]}_${ageMatch[2]}_n`:/feminin|mulheres/.test(text)?"demo_female_n":/masculin|homens/.test(text)?"demo_male_n":/indigena/.test(text)?"demo_indigenous_n":/negra/.test(text)?"demo_black_n":"demo_population_total_n",metric=metricById(candidate),c=metric?state.data.values[geoId]?.[candidate]:null;
      if(c&&A.isAvailable(c)){add({...c,indicator_id:candidate,geography_id:geoId,count:c.count??c.value,percentage_of_total:c.percentage_of_total??null});body=`${geo.display_name||geo.name}: ${metric.label}, ${A.format(c.value,"pessoas")} pessoas, em ${c.period}. ${c.percentage_of_total!==null&&c.percentage_of_total!==undefined?`${formatPercent(c.percentage_of_total)} da população na base compatível.`:""} Nenhuma faixa etária foi estimada a partir de grupos mais amplos.`;}else body="N/D: não existe observação compatível para esse recorte e grupo populacional. Não será estimada.";
    }
    const context={response_type:"R58R1_GOVERNED_MANAUS_CLOSURE",city_id:"manaus",geography_id:geoId,question,claim_status:evidence.length?"SOURCE_BOUND":"NO_PUBLISHABLE_FACTUAL_VALUE"},sids=[...new Set(evidence.flatMap(e=>e.source_ids))];
    return {context,pack:{analysis_context:context,evidence,governance_contract:{fail_closed:true,no_downscaling:true,no_free_calculation:true}},html:`<h2>${esc(title)}</h2><p>${esc(body)}</p>${sids.map(id=>officialSourceLink(sourceById(id))).join(" · ")}`};
  }
  function citySpecificAssistantResponse(question) {
    const closureResponse=manausClosureAssistant(question);if(closureResponse)return closureResponse;
    if(state.cityId==="manaus"&&/^(?:qual|quant[ao]s?).*(?:populacao|habitantes).*(?:manaus)|^populacao de manaus/.test(fold(question))){
      const gid=state.data.config.default_active_geography_id,c=state.data.values[gid]?.demo_population_total_n,source=sourceById(c?.source_id),lineage=(state.data.lineage_registry||[]).find(l=>l.lineage_id===c?.lineage_id);
      if(!A.isAvailable(c)||!source||!lineage)throw assistantContractError("ASSISTANT_SOURCE_TRACEABILITY_UNRESOLVED","O total municipal não possui fonte e linhagem resolvidas.");
      const context={response_type:"GOVERNED_MUNICIPAL_POPULATION",city_id:state.cityId,geography_id:gid},evidence={...c,indicator_id:"demo_population_total_n",geography_id:gid,count:c.value,percentage_of_total:100};
      return {context,pack:{analysis_context:context,evidence:[evidence]},html:`<h2>População de Manaus</h2><p>Manaus possui ${esc(A.format(c.value,"pessoas"))} habitantes, segundo o Censo ${esc(c.period)}. Este é o total municipal, não a soma dos bairros.</p><p>Fonte: <a href="${esc(source.official_url)}" target="_blank" rel="noopener">${esc(source.source_title)}</a>.</p>`};
    }
    if(state.cityId==="manaus"&&/soma.*bairro|bairro.*(?:soma|fecha|difer)|residual/.test(fold(question))){
      const r=state.data.population_reconciliation,sources=new Map(state.data.sources.map(s=>[s.source_id,s])),lineages=new Set((state.data.lineage_registry||[]).map(l=>l.lineage_id));
      if(!r||!lineages.has(r.lineage_id)||r.source_ids.some(id=>!sources.has(id)))throw assistantContractError("ASSISTANT_SOURCE_TRACEABILITY_UNRESOLVED","A explicação do residual não possui rastreabilidade completa.");
      const context={response_type:"GOVERNED_POPULATION_RECONCILIATION",city_id:state.cityId,geography_id:r.geography_id},evidence={...r,claim_id:"MANAUS_OFFICIAL_AGGREGATION_RESIDUAL",count:r.value,percentage_of_total:null};
      const citations=r.source_ids.map(id=>{const s=sources.get(id);return `<a href="${esc(s.official_url)}" target="_blank" rel="noopener">${esc(s.source_title)}</a>`;}).join("; ");
      return {context,pack:{analysis_context:context,evidence:[evidence]},html:`<h2>Reconciliação da população de Manaus</h2><p>${esc(r.public_explanation)}</p><p>Total municipal: ${esc(A.format(r.municipal_population,"pessoas"))}. Soma dos bairros: ${esc(A.format(r.neighborhood_sum,"pessoas"))}. Diferença preservada: ${esc(A.format(r.value,"pessoas"))}.</p><p>Fontes: ${citations}.</p>`};
    }
    const text=fold(question),scaleQuestion=/por que.*(?:bairro|ra|regiao administrativa|distrito|subprefeitura|escala)|(?:bairro|distrito).*nao.*(?:ra|subprefeitura)/.test(text),availabilityQuestion=/por que.*(?:indicador|dado).*(?:existe|disponivel|aparece).*(?:nao|outra cidade)|(?:rio|sao paulo|belem|sao luis).*(?:rio|sao paulo|belem|sao luis)/.test(text),crossCityQuestion=/compar.*(?:cidade|rio|sao paulo|belem|sao luis)/.test(text);
    if(!scaleQuestion&&!availabilityQuestion&&!crossCityQuestion)return null;
    const metric=currentMetric(),record=governedIndicatorRecord(state.indicatorId),policy=DIAGNOSTIC_RUNTIME.policy||{},requirements=policy.cross_city_comparison_requirements||{},cityRows=Object.values(DIAGNOSTIC_RUNTIME.cities||{}).map(city=>({city_name:city.city_name,record:city.indicators?.[state.indicatorId]})),availability=cityRows.map(item=>`${item.city_name}: ${item.record?.menu_visible?"disponível conforme o contrato local":"não publicado nesta cidade"}`).join("; ");
    let title="Disponibilidade específica por cidade",body=`A plataforma tem arquitetura comum e diagnóstico próprio para cada cidade. Para ${metric?.label||"o indicador selecionado"}, o catálogo governado registra: ${availability}. Uma ausência específica não é erro do painel e não é preenchida com N/D apenas para igualar menus.`;
    if(scaleQuestion){title="Escala governada deste indicador";body=`${metric?.label||"O indicador selecionado"}: ${availableScaleSummary()}. ${record?.communication_rationale||governedPublicationMessage()} O seletor mostra somente as escalas autorizadas no catálogo e na auditoria R45; setores censitários permanecem apenas como base metodológica.`;}
    if(crossCityQuestion){title="Comparação entre cidades não automática";body=`A plataforma não assume comparabilidade entre cidades. Uma comparação só pode ser considerada quando definição, período e método da fonte são compatíveis simultaneamente. No contrato atual: definition_match=${requirements.definition_match===true}, period_match=${requirements.period_match===true}, source_method_compatibility=${requirements.source_method_compatibility===true}.`;}
    const context={response_type:"CITY_SPECIFIC_GOVERNANCE",city_id:state.cityId,indicator_id:state.indicatorId,policy_id:policy.policy_id,source_files:["ACU_CITY_SPECIFIC_INDICATOR_POLICY.json","ACU_CITY_DIAGNOSTIC_CATALOG.csv",state.cityId==="sao_paulo"?"SP_INDICATOR_SCALE_AUDIT.csv":state.cityId==="rio_de_janeiro"?"RJ_INDICATOR_SCALE_AUDIT.csv":null].filter(Boolean)};
    return {html:`<h2>${esc(title)}</h2><p>${esc(body)}</p><div class="notice">Resposta baseada na governança multicidade R45 e no indicador ativo, sem conhecimento geral nem criação de comparador entre cidades.</div>`,context,pack:{analysis_context:context,evidence:[],governance_contract:record||null}};
  }
  function routeAssistantIntent(question) {
    const text=fold(question),territories=programTerritories(),upGeographies=state.data.geographies.filter(item=>item.level==="INCID_PLANNING_UNIT"),mentionedUps=/\bup\b/.test(text)?upGeographies.filter(item=>text.includes(fold(geographyBaseName(item)))):[];
    let mentionedAdministrative=[];
    const explicitlyNames=item=>{const raw=fold(geographyBaseName(item)),base=raw.replace(/^(?:ra|bairro|distrito|subprefeitura)\s+/,"");return text.includes(raw)||text.includes(base);};
    if(state.cityId==="sao_paulo"){
      const level=/subprefeitura/.test(text)?"SP_SUBPREFECTURE":/distrito/.test(text)?"SP_DISTRICT":null;
      if(level)mentionedAdministrative=state.data.geographies.filter(item=>item.level===level&&explicitlyNames(item));
    }else if(state.cityId==="rio_de_janeiro"){
      const level=/\bbairro\b/.test(text)?"RJ_NEIGHBORHOOD":/(regiao administrativa|\bra\b)/.test(text)?"RJ_ADMINISTRATIVE_REGION":/area de planejamento/.test(text)?"RJ_PLANNING_AREA":null;
      if(level)mentionedAdministrative=state.data.geographies.filter(item=>item.level===level&&explicitlyNames(item));
    }
    const explicitGeographies=[...mentionedUps,...mentionedAdministrative],mentioned=explicitGeographies.length?[]:territories.filter(item=>text.includes(fold(item.geographyName.replace(/\s+—.*$/,""))));
    const compareIntent=/\bcompar(?:e|ar|acao|acao|ando)?\b|\bcompar/i.test(text);
    const characterizeIntent=/caracteriz|caracteristic|diagnost|\bresum|\bfale\b/.test(text);
    const programPlural=/(territorios?).*(agenda|prioritari|atuacao)|(agenda|prioritari|atuacao).*(territorios?)/.test(text);
    const indicatorId=/(?:0\s*(?:a|–|-)\s*19|0.?19|zero.*dezenove)/.test(text)?"demo_age_0_19_n":/(?:15\s*(?:a|–|-)\s*19|15.?19)/.test(text)?"demo_age_15_19_n":null;
    const combinedProgramGeography=state.data.geographies.find(item=>item.level==="AGENDA_CITY_TERRITORY_COLLECTION"),combinedProgramIntent=/(territorios?).*(acu|agenda)|(acu|agenda).*(territorios?)/.test(text);
    const targetGeographyId=state.cityId==="manaus"&&/populacao.*manaus|manaus.*populacao/.test(text)&&!mentioned.length?state.data.config.default_active_geography_id:combinedProgramIntent&&combinedProgramGeography?combinedProgramGeography.id:explicitGeographies[0]&&explicitGeographies[0].id;
    if(compareIntent)return {action:"compare",mentioned:explicitGeographies.length?explicitGeographies.map(item=>({geographyId:item.id,geographyName:geographyDisplayName(item)})):mentioned,indicatorId};
    if(characterizeIntent&&((programPlural&&territories.length>=1)||mentioned.length>=2))return {action:"characterize",mentioned:territories};
    if(characterizeIntent)return {action:"summary",mentioned,indicatorId,targetGeographyId};
    if(/atenc|evidencia/.test(text))return {action:"attention",mentioned,indicatorId,targetGeographyId};
    return {action:"question",mentioned,indicatorId,targetGeographyId};
  }
  function assertAssistantContract(context, pack) {
    const active=context.analysisContext.active_geography,primary=pack.evidence.filter(item=>item.claim_role==="PRIMARY_TERRITORIAL_CLAIM"),characterization=context.actionType==="CHARACTERIZE_PROGRAM_TERRITORIES";
    if(characterization){
      const territories=context.analysisContext.program_territories||[],allowed=new Set(territories.map(item=>item.geography_id));
      if(!territories.length||territories.some(item=>!item.source_id))throw assistantContractError("ASSISTANT_PROGRAM_TERRITORY_SOURCE_UNRESOLVED","Um território programático não possui source_id governado.");
      if(territories.some(item=>item.geography_type!=="AGENDA_CITY_TERRITORY")||[...allowed].some(id=>String(id).startsWith("INCID_UP::")))throw assistantContractError("ASSISTANT_PROGRAM_TERRITORY_UP_CONFLATION","Território programático e UP homônima foram confundidos.");
      if(primary.some(item=>!allowed.has(item.geography_id))||[...allowed].some(id=>!primary.some(item=>item.geography_id===id)))throw assistantContractError("ASSISTANT_PROGRAM_TERRITORY_COUNT_MISMATCH","O evidence pack não cobre exatamente os territórios programáticos ativos.");
    }else if(context.actionType!=="COMPARE"){
      if(active.geography_id!==state.geographyId)throw assistantContractError("ASSISTANT_ACTIVE_GEOGRAPHY_MISMATCH","A geografia ativa diverge do estado da interface.");
      if(primary.some(item=>item.geography_id!==active.geography_id))throw assistantContractError("ASSISTANT_EVIDENCE_GEOGRAPHY_MISMATCH","O evidence pack territorial diverge da geografia ativa.");
    }else{
      const allowed=new Set(context.comparisonGeographies.map(item=>item.geographyId));
      if(primary.some(item=>!allowed.has(item.geography_id)))throw assistantContractError("ASSISTANT_COMPARISON_GEOGRAPHY_MISMATCH","O evidence pack comparativo contém geografia não selecionada.");
    }
    if(context.analysisContext.city.city_id!==state.cityId||primary.some(item=>item.city_id!==state.cityId))throw assistantContractError("ASSISTANT_CITY_MISMATCH","O contexto do Assistente diverge da cidade ativa.");
    if(!characterization&&(context.analysisContext.selected_indicator.indicator_id!==state.indicatorId||!primary.some(item=>item.indicator_id===state.indicatorId)))throw assistantContractError("ASSISTANT_INDICATOR_MISMATCH","O indicador ativo não foi preservado no evidence pack.");
    const governedSources=new Set(governedSourceRecords().map(item=>item.source_id));
    if(pack.evidence.some(item=>!item.source_id||!item.lineage_id||(item.source_ids||[item.source_id]).some(sourceId=>!governedSources.has(sourceId))))throw assistantContractError("ASSISTANT_SOURCE_TRACEABILITY_UNRESOLVED","A afirmação foi bloqueada porque source_id ou linhagem governada não pôde ser resolvida.");
    if(state.cityId==="manaus"){
      const registry=new Map((state.data.lineage_registry||[]).map(item=>[item.lineage_id,item]));
      if(pack.evidence.some(item=>!registry.has(item.lineage_id)))throw assistantContractError("ASSISTANT_SOURCE_TRACEABILITY_UNRESOLVED","A linhagem da afirmação não consta do registro governado de Manaus.");
    }
  }
  function assistantContext(action = "summary") {
    const actionType=assistantActionTypes[action]||"QUESTION",active=getActiveGeography(),metric=currentMetric(),group=activePresentationGroup();
    if(!metric)throw assistantContractError("ACTIVE_INDICATOR_UNRESOLVED","O indicador ativo não foi resolvido.");
    if(actionType==="COMPARE"&&state.compareIds.length<2){const level=comparisonGeographyLevel(),eligible=state.data.geographies.filter(item=>(item.comparable||item.program_comparable)&&item.level===level);state.compareIds=eligible.slice(0,2).map(item=>item.id);state.compareLevel=level;}
    const comparisonGeographies=getComparisonGeographies(actionType==="COMPARE");
    const territories=actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"?programTerritories():[],indicators=actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"?characterizationIndicatorIds():["demo_population_total_n","demo_age_0_19_n","demo_age_10_19_n",state.indicatorId].filter((value,index,array)=>value&&array.indexOf(value)===index);
    if(actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"&&!territories.length)throw assistantContractError("ASSISTANT_PROGRAM_TERRITORIES_UNRESOLVED","A cidade ativa não possui territórios programáticos configurados.");
    const geographyIds=actionType==="COMPARE"?comparisonGeographies.map(item=>item.geographyId):(actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"?territories.map(item=>item.geographyId):[active.geographyId]);
    const selectedPair=group?presentationGroupCells(group,active.geographyId):null;
    const violencePeriod=selectedViolencePeriod(group?.count_indicator_id||metric.indicator_id),selectedMeasure=group?state.demographicMapMode:"canonical",trace=effectiveMetricTrace(metricById(group?.count_indicator_id||metric.indicator_id)||metric,active.geographyId),analysisContext={city:{city_id:state.cityId,city_name:state.data.config.city_name},active_geography:{geography_id:active.geographyId,geography_name:active.geographyName,geography_type:active.geographyType},program_territories:territories.map(item=>({geography_id:item.geographyId,geography_name:item.geographyName,geography_type:item.geographyType,source_id:item.sourceId,source_ids:item.sourceIds,lineage_id:item.lineageId})),selected_indicator:actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"?null:{indicator_id:group?.count_indicator_id||metric.indicator_id,active_measure_indicator_id:presentationMetricId(group),presentation_group_id:group?.presentation_group_id||null,label:group?.label||metric.label,display_mode:selectedMeasure,selected_measure:selectedMeasure,count:selectedPair&&A.isAvailable(selectedPair.count)?Number(selectedPair.count.value):null,percentage:selectedPair&&A.isAvailable(selectedPair.percentage)?Number(selectedPair.percentage.value):null,percentage_of_total:isDemographicPresentationGroup(group)&&selectedPair&&A.isAvailable(selectedPair.percentage)?Number(selectedPair.percentage.value):null,rate:selectedPair&&A.isAvailable(selectedPair.rate)?Number(selectedPair.rate.value):null,percentage_trace:group?presentationPercentageTrace(group,active.geographyId):null,source_id:violencePeriod?.source_id||trace.sourceId,lineage_id:violencePeriod?.lineage_id||trace.lineageId,effective_source_id:violencePeriod?.source_id||trace.sourceId,effective_method:trace.effectiveMethod,denominator_source_id:selectedPair?.percentage?.denominator_source_id||trace.denominatorSourceId,recovery_method:trace.recoveryMethod,original_status:trace.originalStatus,recovered_status:trace.recoveredStatus},selected_theme:state.theme,filters:{module:state.module,map_indicator:state.mapIndicator,presentation_measure_mode:group?state.demographicMapMode:null,school_filters:Object.assign({},state.schoolFilters),equipment_filters:Object.assign({},state.equipmentFilters),violence_period_id:violencePeriod?.period_id||null},period:actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"?characterizationPeriod(indicators):(violencePeriod?.period_label||metric.period||null),partial_period:violencePeriod?.partial_period===true,partial_through:violencePeriod?.partial_through||null,limitations:actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"?[...(state.data.config.limitations||[]),...territories.map(item=>item.limitations).filter(Boolean)]:[],comparison_geographies:comparisonGeographies.map(item=>({geography_id:item.geographyId,geography_name:item.geographyName,geography_type:item.geographyType})),action_type:actionType};
    const assistantSources=[...new Map(governedSourceRecords().map(source=>[source.source_id,source])).values()],assistantData=state.cityId==="belem"?Object.assign({},state.data,{catalog:[...state.data.catalog,...BELEM_VIRTUAL_INDICATORS],sources:assistantSources}):state.data;
    const context={cityName:state.data.config.city_name,territoryName:actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"?(state.data.config.program_territory_summary||territories.map(item=>item.geographyName).join(" e ")):active.geographyName,geographyId:active.geographyId,geographyIds,indicatorIds:indicators,selectedIndicatorId:actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"?null:(group?.count_indicator_id||state.indicatorId),theme:state.theme,period:analysisContext.period,filters:analysisContext.filters,data:assistantData,actionType,activeGeography:active,programTerritories:territories,comparisonGeographies,analysisContext};
    context.evidencePack=presentationEvidencePack(state.data,context);
    if(actionType==="CHARACTERIZE_PROGRAM_TERRITORIES"){
      const combined=state.data.geographies.find(item=>item.program_territory_collection&&Array.isArray(item.component_ids)&&territories.every(territory=>item.component_ids.includes(territory.geographyId)));
      if(combined){const combinedPack=governedEvidencePack(state.data,Object.assign({},context,{geographyIds:[combined.id],geographyId:combined.id,territoryName:combined.name}));combinedPack.evidence.filter(item=>item.value!==null).forEach(item=>context.evidencePack.evidence.push(Object.assign({},item,{claim_id:`${state.cityId}:${combined.id}:${item.indicator_id}:COMBINED_PROGRAM_TERRITORY_CLAIM`,claim_role:"COMBINED_PROGRAM_TERRITORY_CLAIM"})));}
      context.evidencePack.evidence.push(...programSpatialCoverageClaims(territories));
    }
    context.attentionStatements=window.ACUAttention.analyze(state.data,state.indicatorId,[active.geographyId],active.geographyId);assertAssistantContract(context,context.evidencePack);return context;
  }
  function controlledAssistantFailure(error) { state.lastEvidencePack=null;state.lastAnalysisContext=null;state.lastAssistantError={code:error.code||"ASSISTANT_CONTRACT_ERROR",message:error.message};$("#assistant-output").innerHTML=`<h2>Assistente bloqueado</h2><p><strong>${esc(state.lastAssistantError.code)}</strong></p><p>${esc(state.lastAssistantError.message)}</p><div class="notice">Nenhuma narrativa foi produzida porque o contrato analítico não foi atendido.</div>`;publishQaSnapshot();return {error:state.lastAssistantError}; }
  function runAssistant(action) { try{const context=assistantContext(action);let result;if(action==="summary")result=provider.generateSummary(context);else if(action==="characterize")result=provider.characterizeProgramTerritories(context);else if(action==="compare")result=provider.compare(context);else if(action==="attention")result=provider.attention(context);else result=provider.generateReport(context);assertAssistantContract(context,result.pack);state.lastEvidencePack=result.pack;state.lastAnalysisContext=result.pack.analysis_context;state.lastAssistantError=null;$("#assistant-output").innerHTML=result.html;R77.append(state);publishQaSnapshot();return {context:result.pack.analysis_context,pack:result.pack};}catch(error){return controlledAssistantFailure(error);} }
  function askAssistant(question) { try{const network=R77.answer(state,question);if(network){state.lastEvidencePack=network.pack;state.lastAnalysisContext={city_id:state.cityId,geography_id:state.geographyId,scope:"R77_NETWORK_CONTEXT"};state.lastAssistantError=null;$("#assistant-output").innerHTML=network.html;publishQaSnapshot();return network;}const municipal=ACU_R73_CONTEXT.answer(state.cityId,question);if(municipal){state.lastEvidencePack={contract:'R73_MUNICIPAL_CONTEXT',city_id:state.cityId,geography_id:ACU_R73_CONTEXT.data(state.cityId).ibge7,geography_level:'MUNICIPALITY',source_ids:municipal.source_ids,claims:municipal.claims};state.lastAnalysisContext={scope:'MUNICIPALITY',city_id:state.cityId,selected_territory_id:state.geographyId};state.lastAssistantError=null;$('#assistant-output').innerHTML=municipal.html;publishQaSnapshot();return {intent:'R73_MUNICIPAL_CONTEXT',context:state.lastAnalysisContext,pack:state.lastEvidencePack};}const r50Response=r50AssistantResponse(question);if(r50Response){state.lastEvidencePack=r50Response.pack;state.lastAnalysisContext=r50Response.context;state.lastAssistantError=null;$("#assistant-output").innerHTML=r50Response.html;publishQaSnapshot();return {intent:"R50_SOURCE_BACKED_DIAGNOSTIC",context:r50Response.context,pack:r50Response.pack};}const governanceResponse=citySpecificAssistantResponse(question);if(governanceResponse){state.lastEvidencePack=governanceResponse.pack;state.lastAnalysisContext=governanceResponse.context;state.lastAssistantError=null;$("#assistant-output").innerHTML=governanceResponse.html;publishQaSnapshot();return {intent:"CITY_SPECIFIC_GOVERNANCE",context:governanceResponse.context,pack:governanceResponse.pack};}const route=routeAssistantIntent(question),mentioned=route.mentioned||[];if(route.targetGeographyId)state.geographyId=route.targetGeographyId;else if(route.action==="compare"&&mentioned.length>=2)state.compareIds=mentioned.map(item=>item.geographyId);else if(["summary","characterize"].includes(route.action)&&mentioned.length===1)state.geographyId=mentioned[0].geographyId;if(route.indicatorId){const metric=state.data.catalog.find(item=>item.indicator_id===route.indicatorId);if(metric){state.theme=metric.theme;state.indicatorId=metric.indicator_id;}}if($("#territory-select"))$("#territory-select").value=state.geographyId;if($("#crumb-territory"))$("#crumb-territory").textContent=geographyDisplayName(currentGeo());const context=assistantContext(route.action);context.question=question;const result=route.action==="characterize"?provider.characterizeProgramTerritories(context):provider.answerQuestion(context);assertAssistantContract(context,result.pack);state.lastEvidencePack=result.pack;state.lastAnalysisContext=result.pack.analysis_context;state.lastAssistantError=null;$("#assistant-output").innerHTML=result.html;publishQaSnapshot();return {intent:context.actionType,context:result.pack.analysis_context,pack:result.pack};}catch(error){return controlledAssistantFailure(error);} }
  function renderAssistant() {
    $("#module-view").innerHTML=moduleHeader()+ACU_R73_CONTEXT.render(state.cityId,currentGeo(),state.theme,state.indicatorId,{label:currentMetric()?.label||"Indicador territorial",value:A.isAvailable(currentCell(state.indicatorId))?format(currentCell(state.indicatorId).value,currentMetric()?.unit):"Sem resultado territorial disponível nesta seleção",period:currentMetric()?.period,unit:currentMetric()?.unit})+`<div class="assistant-layout"><div><div class="assistant-actions"><button data-assistant="summary">Gerar diagnóstico rápido</button><button data-assistant="compare">Comparar territórios</button><button data-assistant="attention">O que merece atenção?</button><button data-assistant="report">Preparar relatório</button></div><label class="search-field"><span>Pergunta orientada</span><input id="assistant-question" placeholder="Ex.: Por que este indicador aparece por bairro e não por RA?"></label><button id="assistant-ask" class="secondary-button" type="button">Analisar pergunta</button></div><article id="assistant-output" class="assistant-output"><h2>Assistente de Diagnóstico</h2><p>Análise baseada nos dados e na governança da cidade selecionada. Ausência em uma cidade não é tratada como erro.</p><div class="notice">O assistente não inventa dados, respeita a escala autorizada e não cria comparação entre cidades sem definição, período e método compatíveis.</div></article></div>`;
    $$('[data-assistant]').forEach(button=>button.addEventListener("click",()=>runAssistant(button.dataset.assistant))); $("#assistant-ask").addEventListener("click",()=>askAssistant($("#assistant-question").value));
  }

  function renderSources() {
    const metrics=(state.cityId==="belem"?[...state.data.catalog,...BELEM_VIRTUAL_INDICATORS]:state.data.catalog).filter(indicatorGovernedForPublication);
    const demographicPriorityNote=["sao_paulo","rio_de_janeiro"].includes(state.cityId)?`<article class="source-methodology-card"><header><div><strong>Prioridade efetiva das fontes demográficas</strong><small>Regra governada do hotfix R51</small></div></header><p>Observações oficiais diretas da geografia selecionada prevalecem sobre agregações de setores incompletas. Componentes oficiais completos e agregáveis são usados apenas quando não existe observação direta. Percentuais usam numerador e denominador da mesma geografia, fonte e período; ausências não são apresentadas como zero.</p></article>`:"";
    const contract=(state.data.territory_contracts||[]).find(item=>item.territory_id===state.geographyId),territoryMeta=state.cityId==="belem"?"Delimitação territorial governada":contract?`${contract.territory_id} · ${contract.territory_role}`:"",territoryMethod=contract?`<article class="source-methodology-card territory-contract-card"><header><div><strong>${esc(contract.territory_name)}</strong><small>${esc(territoryMeta)}</small></div>${state.cityId==="belem"?"":"<span class=\"tag\">PASS</span>"}</header><p><strong>Instituições:</strong> ${esc(contract.source_institution)}</p><p><strong>Fonte:</strong> <a href="${esc(contract.official_url)}" target="_blank" rel="noopener noreferrer">publicação oficial</a> · ${esc(contract.reference_period)}</p><p><strong>Método:</strong> ${esc(contract.method)}</p><p><strong>Limitação:</strong> ${esc(contract.limitations)}</p></article>`:"",equipmentCoverage=belemSpatialAdapter()?.metadata?.equipment_coverage,equipmentSources=state.cityId==="belem"?`<article class="source-methodology-card equipment-sources-card"><header><div><strong>Equipamentos e serviços não escolares</strong><small>${BELEM_EQUIPMENT_SOURCE_IDS.length} fontes governadas</small></div><button type="button" class="inline-source-link" data-equipment-sources>Ver fontes</button></header><p>Catálogo municipal: ${esc(equipmentCoverage?.catalog_count||0)} registros oficiais não escolares; ${esc(equipmentCoverage?.spatialized_count||0)} possuem ponto publicável. Escolas permanecem exclusivamente no módulo escolar. A completude varia por família e não constitui inferência de suficiência.</p></article>`:"";$("#module-view").innerHTML=moduleHeader()+`<section class="panel panel-pad"><div class="panel-title"><h2>Fonte e metodologia</h2><small>${metrics.length} indicadores governados</small></div><div class="documentation-actions"><button type="button" class="secondary-button" data-open-guide="city">Como ler esta cidade</button><button type="button" class="quiet-button" data-open-guide="platform">Como ler a plataforma</button></div><p class="documentation-note">O guia curto orienta a leitura; esta seção preserva fonte, período, cobertura territorial, escala, definição e limitações de cada indicador.</p>${territoryMethod}${equipmentSources}<div class="filter-row"><input id="source-filter" type="search" placeholder="Indicador, fonte ou tema"></div><div id="source-body" class="source-methodology-list"></div></section>`;
    $("#module-view .documentation-note")?.insertAdjacentHTML("afterend",ACU_R73_CONTEXT.methodology(state.cityId));
    if(demographicPriorityNote)$("#module-view .documentation-note")?.insertAdjacentHTML("afterend",demographicPriorityNote);
    if(state.cityId==="manaus"&&state.data.population_reconciliation)$("#module-view .documentation-note")?.insertAdjacentHTML("afterend",`<article class="source-methodology-card" data-testid="population-reconciliation"><h3>População do município e dos bairros</h3><p>${esc(state.data.population_reconciliation.public_explanation)}</p><p>Diferença preservada: ${esc(A.format(state.data.population_reconciliation.value,"pessoas"))} pessoas.</p></article>`);
    const draw=()=>{const q=fold($("#source-filter").value);$("#source-body").innerHTML=metrics.filter(metric=>!q||fold(`${metric.indicator_id} ${metric.label} ${metric.source} ${metric.source_id} ${metric.theme}`).includes(q)).map(metric=>{const availability=metricAvailability(metric.indicator_id,state.geographyId),meta=state.cityId==="belem"?`${metric.theme} · ${metric.period||"N/D"}`:`${metric.theme} · ${metric.period||"N/D"}`,badge=state.cityId==="belem"?publicAvailabilityBadge(availability):`<span class="tag ${availability==="AVAILABLE"?"":"missing"}">${esc(availability)}</span>`;return `<article class="source-methodology-card"><header><div><strong>${esc(metric.label)}</strong><small>${esc(meta)}</small></div>${badge}</header>${metricSourceMethodology(metric)}</article>`;}).join("");};
    $("#source-filter").addEventListener("input",draw);draw();
  }

  function renderModule() {
    const networkBridge={state,geo:currentGeo,categoryLabel:publicEquipmentCategory,equipmentSection:()=>{if(state.mapControlSection!=="equipment")setMapControlSection("equipment");},refresh:refreshPointLayers,panorama:()=>{state.module="panorama";configureSelectors();renderModule();}};R77.connect(networkBridge);
    if(!ACU_R76R1.moduleVisible(state.cityId,state.module)){state.module="panorama";state.r76SelectionNotice="Tema retirado desta cidade; exibindo Panorama territorial.";configureSelectors();}
    document.body.dataset.activeModule=state.module;renderDataSituation();
    const mounted=window.ACU_R71_PANORAMA?.snapshot();
    if(state.module==="panorama"&&mapIsMounted()&&mounted?.city===state.cityId&&mounted.geography===state.geographyId&&!state.mapNavigationIntent){refreshMapPresentation("indicator_or_theme_change");return;}
    mapPresentationSequence++;committedMapSelection=null;
    window.ACU_R71_PANORAMA?.beforeRender({cityId:state.cityId,module:state.module,geography:currentGeo()});
    $("#crumb-territory").textContent=geographyDisplayName(currentGeo()); $$(".side-nav button").forEach(button=>button.classList.toggle("active",button.dataset.module===state.module));
    if(state.module==="panorama")renderPanorama();else if(["population","living","income"].includes(state.module))genericMetricsModule();else if(state.module==="education")renderEducation();else if(state.module==="equipment")renderEquipment();else if(state.module==="violence")renderViolence();else if(state.module==="pct")renderPct();else if(state.module==="compare")renderCompare();else if(state.module==="assistant")renderAssistant();else renderSources();
    R77.afterRender(networkBridge);
    bindPublicSourceActions();
    updateHash();
  }

  function showDetail(kind,id) {
    const row=(kind==="school"?schoolUniverse():equipmentUniverse()).find(item=>String(item.id)===String(id));if(!row)return;
    if(kind==="equipment"&&R77.equipmentDetail(row))return;
    $("#detail-title").textContent=kind==="school"?"Ficha escolar":"Ficha do equipamento";
    if(kind==="school")$("#detail-content").innerHTML=`<div class="school-detail-card">${schoolFullProfile(row)}</div>`;
    else $("#detail-content").innerHTML=equipmentPublicDetail(row);
    $("#detail-dialog").showModal();bindPublicSourceActions();
  }
  function bindDetails() { $$('[data-detail]').forEach(button=>button.addEventListener("click",()=>showDetail(button.dataset.detail,button.dataset.id))); }

  function spatialEntity(kind,id) { return (kind==="school"?schoolUniverse():equipmentUniverse()).find(item=>String(item.id)===String(id))||null; }
  function searchResultRows(query) {
    const q=fold(query),results=[];if(q.length<2)return results;
    const schools=state.cityId==="belem"?schoolUniverse():state.data.schools,equipment=state.cityId==="belem"?equipmentUniverse():state.data.equipment;
    const schoolCodes=new Set(schools.map(item=>String(item.official_code)).filter(Boolean));
    schools.forEach(item=>{if(fold(`${item.name} ${item.official_code} ${item.territory}`).includes(q))results.push({kind:"school",id:item.id,name:item.name,meta:`Escola · INEP ${item.official_code} · ${item.territory||"N/D"}`,spatial:validCoordinate(item)});});
    equipment.forEach(item=>{if(fold(`${item.name} ${item.official_code} ${item.territory} ${item.address_display||""}`).includes(q))results.push({kind:"equipment",id:item.id,name:item.name,meta:`Equipamento não escolar · ${publicEquipmentCategory(item.category)} · ${item.territory||"N/D"}`,spatial:validCoordinate(item)});});
    state.data.geographies.forEach(item=>{const displayName=geographyDisplayName(item);if(fold(`${item.name} ${displayName}`).includes(q))results.push({kind:"territory",id:item.id,name:displayName,meta:"Território",spatial:true});});return results;
  }
  function focusSpatialResult(kind,id) {
    const row=spatialEntity(kind,id);if(!row||!validCoordinate(row)){if(row)showDetail(kind,id);return Promise.resolve({status:"NO_VALIDATED_LOCATION",kind,id});}
    const before=mapViewportSnapshot(),activeRows=kind==="school"?schoolRowsForContext(currentGeo()):equipmentRowsForContext(currentGeo()),outsideActiveContext=!activeRows.some(item=>String(item.id)===String(id));
    if(outsideActiveContext){const municipality=state.data.geographies.find(item=>item.level==="MUNICIPALITY");state.geographyId=state.cityId==="belem"?BELEM_CITY_CONTEXT.id:(municipality?.id||defaultGeography());state.mapNavigationIntent="explicit_search_focus";if($("#territory-select"))$("#territory-select").value=state.geographyId;if($("#crumb-territory"))$("#crumb-territory").textContent=geographyDisplayName(currentGeo());configureIndicators();}
    if(kind==="school")state.layerState.schools=true;else state.layerState.equipment=true;state.module="panorama";if(citywideComparisonEnabled())state.mapExtent="SEARCH_FOCUS";
    if(!mapIsMounted()||outsideActiveContext)renderModule();else refreshPointLayers();
    return new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>{if(!mapIsMounted())return resolve({status:"MAP_NOT_MOUNTED",kind,id});withAllowedMapNavigation("explicit_search_focus",()=>state.map.setView([Number(row.latitude),Number(row.longitude)],Math.max(15,state.map.getZoom()),{animate:false,reset:true}));const audit=recordViewportAudit("search_focus",before,true);publishQaSnapshot();resolve({status:"FOCUSED",kind,id,latitude:Number(row.latitude),longitude:Number(row.longitude),viewport_audit:audit});})));
  }
  function search() { const q=fold($("#search-input").value),results=searchResultRows(q);
    $("#search-results").innerHTML=results.slice(0,80).map(item=>`<button class="search-result" data-kind="${esc(item.kind)}" data-id="${esc(item.id)}"><strong>${esc(item.name)}</strong><small>${esc(item.meta)}${item.kind!=="territory"&&!item.spatial?" · Localização espacial não validada":""}</small></button>`).join("")||(q.length>=2?`<p>Nenhum resultado nesta ${state.cityId==="belem"?"cidade":"geografia"}.</p>`:"<p>Digite ao menos dois caracteres.</p>"); $$(".search-result").forEach(button=>button.addEventListener("click",()=>{if(button.dataset.kind==="territory"){selectGeography(button.dataset.id);$("#search-dialog").close();}else{const row=spatialEntity(button.dataset.kind,button.dataset.id);if(row&&validCoordinate(row)){$("#search-dialog").close();focusSpatialResult(button.dataset.kind,button.dataset.id);}else showDetail(button.dataset.kind,button.dataset.id);}}));
  }

  function buildExportRows() {
    if(state.module==="compare")return matrixExportRows();
    if(housingSelected())return window.ACU_R71_PANORAMA?.exportRows()||[];
    const metric=currentMetric(),group=activePresentationGroup(),activeId=presentationMetricId(group),activeMetric=metricById(activeId)||metric;
    const geographies=state.module==="compare"?state.compareIds.map(id=>state.data.geographies.find(item=>item.id===id)).filter(Boolean):state.data.geographies;
    return geographies.map(geo=>{const pair=group?presentationGroupCells(group,geo.id):null,cell=mapDisplayCell(geo.id,activeId),period=selectedViolencePeriod(group?.count_indicator_id||activeId),sourceId=cell?.source_id||period?.source_id||activeMetric?.source_id;return {city:state.data.config.city_name,geography_id:geo.id,geography:geographyDisplayName(geo),geographic_level:geo.level,indicator_id:group?.count_indicator_id||activeId,indicator:group?.label||metric?.label||activeId,selected_measure:group?state.demographicMapMode:"canonical",selected_value:A.isAvailable(cell)?cell.value:"",count:pair&&A.isAvailable(pair.count)?pair.count.value:"",percentage:pair&&A.isAvailable(pair.percentage)?pair.percentage.value:"",rate:pair&&A.isAvailable(pair.rate)?pair.rate.value:"",availability:cell?.status||"SOURCE_NOT_AVAILABLE",unit:activeMetric?.unit||"",period:period?.period_label||activeMetric?.period||"",source:sourceById(sourceId)?.institution||activeMetric?.source||""};});
  }
  function exportCsv() { const rows=buildExportRows(),header=["city","geography_id","geography","geographic_level","indicator_id","indicator","selected_measure","selected_value","count","percentage","rate","availability","unit","period","source","definition","numerator","denominator","formula","lineage_id","source_ids","source_id","sample_households","sample_cases","universe","estimate_scope","precision"],csv=[header,...rows.map(row=>header.map(key=>row[key]))].map(row=>row.map(value=>`"${String(value??"").replace(/"/g,'""')}"`).join(",")).join("\r\n"); const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}); const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=`acu_${state.cityId}_${presentationMetricId()}.csv`;link.click();URL.revokeObjectURL(link.href); }
  function updateHash() { if(!state.cityId)return; const params=new URLSearchParams({city:state.cityId,territory:state.geographyId,theme:state.theme||"",module:state.module,indicator:state.indicatorId||"",measure:state.demographicMapMode});if(citywideComparisonEnabled())params.set("comparison",comparisonGeographyLevel());history.replaceState(null,"",`#${params}`); }
  async function restoreHash() { const hashParams=new URLSearchParams(location.hash.slice(1)),queryParams=new URLSearchParams(location.search),params=hashParams.get("city")?hashParams:queryParams; const city=params.get("city"); if(!city||!window.ACU_CITIES.some(item=>item.city_id===city&&item.status==="AVAILABLE"))return; if(!await openCity(city,true))return; const territory=params.get("territory"); if(territory&&availableGeographies().some(item=>item.id===territory))state.geographyId=territory;const comparison=params.get("comparison");if(citywideComparisonEnabled()&&citywideComparisonLevels().includes(comparison))state.comparisonGeographyLevel=comparison; const theme=params.get("theme");if(theme&&(theme===HOUSING_THEME||(city==="belem"?BELEM_THEME_GROUPS.some(item=>item.id===theme):["sao_paulo","rio_de_janeiro","manaus"].includes(city)?FOUNDATION_THEME_CONTRACT.some(item=>item.id===theme&&item.id!=="Equipamentos e serviços"):state.data.catalog.some(item=>item.theme===theme))))state.theme=theme; const module=params.get("module");if(moduleMeta[module])state.module=module;if(params.get("indicator"))state.indicatorId=params.get("indicator");if(params.get("measure"))state.preferredMeasureMode=params.get("measure");configureSelectors();updateMapIndicatorButton();renderModule(); }

  function alignThemeToModule() {
    if(state.cityId==="belem"){
      const match=BELEM_THEME_GROUPS.find(item=>item.module===state.module);
      if(match){state.theme=match.id;$("#theme-select").value=state.theme;configureIndicators();}
      return;
    }
    if(!["population","living","income","education","equipment","violence","pct"].includes(state.module))return;
    if(["sao_paulo","rio_de_janeiro"].includes(state.cityId)){
      const current=FOUNDATION_THEME_CONTRACT.find(item=>item.id===state.theme),match=current?.module===state.module?current:FOUNDATION_THEME_CONTRACT.find(item=>item.module===state.module);
      if(match){state.theme=match.id;$("#theme-select").value=state.theme;configureIndicators();}
      return;
    }
    const metric=state.data.catalog.find(metricMatchesModule);if(!metric)return;
    state.theme=metric.theme;$("#theme-select").value=state.theme;configureIndicators();
  }

  function bindGlobalEvents() {
    $("#home-button").addEventListener("click",()=>window.ACU_R71_PANORAMA?.onCityChange(null));
    $("#home-button").addEventListener("click",()=>{$("#platform").hidden=true;$("#landing").hidden=false;history.replaceState(null,"",location.pathname);});
    $("#city-guide-button").addEventListener("click",()=>openGuide("city"));
    $$('[data-guide-view]').forEach(button=>button.addEventListener("click",()=>renderGuideDialog(button.dataset.guideView)));
    $("#city-select").addEventListener("change",event=>openCity(event.target.value));
    $("#territory-select").addEventListener("change",event=>{state.pinnedTooltipGeographyId=null;selectGeography(event.target.value);});
    $("#theme-select").addEventListener("change",event=>{state.theme=event.target.value;configureIndicators();updateMapIndicatorButton();state.module="panorama";renderModule();});
    $("#indicator-select").addEventListener("change",event=>{state.theme=$("#theme-select").value;state.indicatorId=event.target.value||null;if(!housingSelected()){normalizeGovernedComparisonScale();applyMeasureContract(activePresentationGroup(),false);}updateMapIndicatorButton();state.module="panorama";renderModule();});
    $("#reset-map").addEventListener("click",clearMapState);
    $$(".side-nav button[data-module]").forEach(button=>button.addEventListener("click",()=>{const nextModule=button.dataset.module,enteringCitywideMap=citywideComparisonEnabled()&&["panorama","compare"].includes(nextModule)&&state.module!==nextModule;state.module=nextModule;if(enteringCitywideMap){state.mapExtent="MUNICIPALITY";state.mapNavigationIntent="explicit_module_citywide_fit";}alignThemeToModule();renderModule();$("#main").focus();}));
    $("#map-tools-button")?.addEventListener("click",()=>{if(!citywideComparisonEnabled())return;const next=state.mapControlSection?null:"layers";state.mapControlSection=next;if(state.module!=="panorama"){state.module="panorama";state.mapExtent="MUNICIPALITY";state.mapNavigationIntent="explicit_module_citywide_fit";alignThemeToModule();renderModule();}else{state.mapControlSection=null;setMapControlSection(next);}});
    $("#module-view").addEventListener("click",event=>{const button=event.target.closest&&event.target.closest("[data-map-panel-section]");if(button)setMapControlSection(button.dataset.mapPanelSection);});
    $("#search-button").addEventListener("click",()=>{$("#search-input").value="";search();$("#search-dialog").showModal();setTimeout(()=>$("#search-input").focus(),50);}); $("#search-input").addEventListener("input",search);
    $("#export-button").addEventListener("click",exportCsv); $("#print-button").addEventListener("click",()=>window.print());
    document.addEventListener("click",event=>{const button=event.target.closest&&event.target.closest("[data-school-full-profile]");if(!button)return;event.preventDefault();event.stopPropagation();hideQuickCard("school",true);state.markerRecords.forEach(record=>{if(record.marker.getTooltip&&record.marker.getTooltip())record.marker.getTooltip().options.permanent=false;if(record.marker.closeTooltip)record.marker.closeTooltip();});showDetail("school",button.dataset.schoolFullProfile);},true);
    document.addEventListener("keydown",event=>{if(event.key==="Escape"&&mapIsMounted()){state.markerRecords.filter(record=>record.kind==="school"||record.kind==="priority").forEach(record=>record.marker.closeTooltip());if(state.quickCard)hideQuickCard(state.quickCard.kind,true);}});
  }

  function territorialPolygonTooltipCount() {
    let count=0;[state.layers.territories,state.layers.program].filter(Boolean).forEach(group=>group.eachLayer(layer=>{if(citywideComparisonEnabled()||layer.getTooltip&&layer.getTooltip())count+=1;}));return count;
  }
  function mapLabelAudit() {
    const nodes=$$("#map .acu-map-label"),visibleNodes=nodes.filter(node=>{const style=getComputedStyle(node),rect=node.getBoundingClientRect();return style.display!=="none"&&style.visibility!=="hidden"&&Number(style.opacity)!==0&&rect.width>0&&rect.height>0&&!node.classList.contains("acu-map-label-collided")&&!node.classList.contains("acu-map-label-lod-hidden");}),names=visibleNodes.map(node=>node.querySelector(".acu-map-label-name")).filter(Boolean),nameRects=names.map(node=>({node,rect:node.getBoundingClientRect()})),overlapPairs=[];
    nameRects.forEach((left,index)=>nameRects.slice(index+1).forEach(right=>{if(left.rect.left<right.rect.right&&left.rect.right>right.rect.left&&left.rect.top<right.rect.bottom&&left.rect.bottom>right.rect.top)overlapPairs.push([left.node.textContent,right.node.textContent]);}));
    const labels=visibleNodes.map(node=>{const content=node.querySelector(".acu-map-label-content"),name=node.querySelector(".acu-map-label-name"),style=name?getComputedStyle(name):null,fill=content&&content.dataset.backgroundColor,textColor=content&&content.dataset.textColor,ratio=fill&&textColor?contrastRatio(textColor,fill):null;return {geography_id:content&&content.dataset.geographyId,physical_geography_id:content&&content.dataset.physicalGeographyId,name:name&&name.textContent,value_count:node.querySelectorAll(".acu-map-label-value").length,value_visible:Boolean(node.querySelector(".acu-map-label-value")&&!node.classList.contains("acu-map-label-name-only")&&!node.classList.contains("acu-map-label-value-collided")),tone:content&&content.classList.contains("acu-map-label-on-dark")?"on-dark":content&&content.classList.contains("acu-map-label-on-light")?"on-light":"default",fill_color:fill||null,text_color:textColor||null,contrast_ratio:ratio,name_visible:Boolean(style&&style.display!=="none"&&style.visibility!=="hidden"&&Number(style.opacity)!==0)};}),physicalCounts=labels.reduce((result,item)=>{result[item.physical_geography_id]=(result[item.physical_geography_id]||0)+1;return result;},{});
    return {labels_total:nodes.length,labels_visible:labels.length,labels_hidden_by_lod:nodes.filter(node=>node.classList.contains("acu-map-label-lod-hidden")).length,labels_hidden_by_collision:nodes.filter(node=>node.classList.contains("acu-map-label-collided")).length,labels,label_unreadable:labels.filter(item=>!item.name_visible).length,label_critical_overlap:overlapPairs.length,label_text_contrast_failure:labels.filter(item=>item.contrast_ratio!==null&&item.contrast_ratio<4.5).length,label_value_duplicates:labels.filter(item=>item.value_count>1).length,duplicate_physical_geography_label:Object.values(physicalCounts).filter(count=>count>1).reduce((sum,count)=>sum+count-1,0),physical_label_counts:physicalCounts,overlap_pairs:overlapPairs};
  }
  function quickCardDomAudit() {
    const card=state.quickCard?.card;if(!card||card.hidden)return null;const content=card.querySelector(".acu-quick-card"),rect=card.getBoundingClientRect(),mapRect=state.map.getContainer().getBoundingClientRect(),text=content?.textContent||"",rawEnums=["PARTIAL_OFFICIAL_REGISTRY","LIKELY_COMPLETE","DISCOVERY_ONLY","source_id","location_source_id","physical_facility_id","lineage"],windowsPath=/[A-Z]:\\/i.test(text);
    return {kind:state.quickCard.kind,city_id:state.cityId,entity_id:state.quickCard.kind==="territory"?featureId(state.quickCard.feature):String(state.quickCard.item?.id||""),width_px:Math.round(rect.width),height_px:Math.round(rect.height),scrollbar:Boolean(content&&(content.scrollHeight>content.clientHeight+1||content.scrollWidth>content.clientWidth+1)),overflow_px:Math.round(Math.max(0,mapRect.left-rect.left)+Math.max(0,mapRect.top-rect.top)+Math.max(0,rect.right-mapRect.right)+Math.max(0,rect.bottom-mapRect.bottom)),raw_technical_terms:rawEnums.filter(term=>text.includes(term)),windows_path_visible:windowsPath,text,positioning:state.quickCardAudit};
  }
  function openTerritorialQuickCardForQa(id,persistent=true) { let found=null;[state.layers.territories,state.layers.program].filter(Boolean).forEach(group=>group.eachLayer(layer=>{if(featureId(layer.feature)===id)found=layer;}));if(!found)throw new Error(`Território não encontrado no mapa: ${id}`);showTerritorialQuickCard(found,found.feature,null,persistent);positionActiveQuickCard();return quickCardDomAudit(); }
  function openEquipmentQuickCardForQa(id,persistent=true) { const record=state.markerRecords.find(item=>item.kind==="equipment"&&String(item.id)===String(id));if(!record)throw new Error(`Equipamento não encontrado no mapa: ${id}`);showEquipmentQuickCard(record.marker,record.item,null,persistent);positionActiveQuickCard();return quickCardDomAudit(); }
  function summaryPanelOrder() { return $$("#territory-numbers-cards [data-summary-key]").map(node=>node.dataset.summaryKey); }
  function layoutMetrics() {
    const map=$("#map"),panel=$(".cartography-grid > .map-panel"),summary=$("#territory-numbers-panel"),sidebar=$(".side-nav"),controls=$(".map-control-panel"),legend=$(".map-legend");if(!map||!panel||!summary)return null;
    const m=map.getBoundingClientRect(),p=panel.getBoundingClientRect(),s=summary.getBoundingClientRect(),b=sidebar?.getBoundingClientRect(),c=controls?.getBoundingClientRect(),l=legend&&!legend.hidden?legend.getBoundingClientRect():null,area=rect=>rect?Math.round(rect.width*rect.height):0;
    return {viewport_width:window.innerWidth,viewport_height:window.innerHeight,map_width:Math.round(m.width),map_height:Math.round(m.height),map_area_px:area(m),map_visible_area_px:Math.max(0,area(m)-area(c)-area(l)),map_top:Math.round(m.top),map_bottom:Math.round(m.bottom),summary_width:Math.round(s.width),summary_height:Math.round(s.height),summary_top:Math.round(s.top),summary_bottom:Math.round(s.bottom),sidebar_width:b?Math.round(b.width):0,map_control_area_px:area(c),legend_area_px:area(l),bottom_delta_px:Math.abs(Math.round(m.bottom-s.bottom)),blank_map_column_px:Math.max(0,Math.round(p.bottom-m.bottom))};
  }
  function markerSymbolAudit() {
    const rows=state.markerRecords.map(record=>{const element=record.marker.getElement&&record.marker.getElement(),semantic=element&&element.querySelector(".acu-semantic-marker"),category=record.category&&equipmentSemanticPresentation(record.category).canonical;return {kind:record.kind,category:category||null,uses_svg:Boolean(semantic&&semantic.querySelector("svg")),generic_circle:Boolean(element&&element.classList.contains("leaflet-interactive")&&!semantic),size:element?Math.round(element.getBoundingClientRect().width):0,z_index_offset:Number(record.marker.options?.zIndexOffset||0)};});
    const schoolRows=rows.filter(row=>row.kind==="school"||row.kind==="priority"),equipmentRows=rows.filter(row=>row.kind==="equipment");
    return {zoom:state.map?.getZoom()??null,total:rows.length,school_count:schoolRows.length,equipment_count:equipmentRows.length,generic_count:rows.filter(row=>row.generic_circle).length,missing_svg_count:rows.filter(row=>!row.uses_svg).length,categories:[...new Set(rows.map(row=>row.category).filter(Boolean))].sort(),z_index_offsets:{school:[...new Set(schoolRows.map(row=>row.z_index_offset))],equipment:[...new Set(equipmentRows.map(row=>row.z_index_offset))]},sample:[...schoolRows.slice(0,12),...equipmentRows.slice(0,12)]};
  }
  function r53UxSnapshot() {
    return {equipment_analytic_theme_visible:$$('#theme-select option').some(option=>option.value==="Equipamentos e serviços"),equipment_navigation_visible:Boolean($('.side-nav button[data-module="equipment"]')&&!$('.side-nav button[data-module="equipment"]').hidden),map_tools_navigation_visible:Boolean($("#map-tools-button")&&!$("#map-tools-button").hidden),map_control_section:state.mapControlSection,map_control_collapsed:Boolean($(".map-control-panel-compact")?.classList.contains("is-collapsed")),territorial_tooltip_count:mapIsMounted()?territorialPolygonTooltipCount():0,marker_symbols:mapIsMounted()?markerSymbolAudit():null,feature_lock:{SP_RJ_territorial_tooltip:"REQUIRED",SP_RJ_equipment_theme:"REMOVED_FROM_ANALYTIC_NAVIGATION",equipment_category_icon_persistence:"REQUIRED",map_compact_controls:"REQUIRED"}};
  }
  function r54UxSnapshot() {
    const labels=mapIsMounted()?mapLabelAudit():null,quick=mapIsMounted()?quickCardDomAudit():null;
    return {runtime_id:"ACU-R54-20260909",physical_geography_registry:R54_PHYSICAL_GEOGRAPHY_REGISTRY,physical_geography_single_label:labels?labels.duplicate_physical_geography_label===0:null,territorial_quick_card_SP_RJ:citywideComparisonEnabled(),territorial_quick_card_avoids_feature:quick?.kind==="territory"?quick.positioning?.outside_feature:null,equipment_quick_card_multicity:true,equipment_quick_card_no_technical_enums:quick?.kind==="equipment"?quick.raw_technical_terms.length===0&&quick.windows_path_visible===false:null,label_audit:labels,quick_card:quick,feature_lock:{school_quick_tooltip:"LOCKED",viewport_invariance:"LOCKED",indicator_availability:"LOCKED",semantic_palette:"LOCKED",equipment_markers:"LOCKED",map_controls_R53:"LOCKED"}};
  }
  function activeSpatialCounts() {
    if(!state.data)return null;
    const schools=schoolRowsForContext(currentGeo()),schoolMap=schoolRowsForMap(),visibleSchoolMarkers=state.layerState.schools||state.layerState.priority?plottedSchools():[],equipment=equipmentRowsForContext(currentGeo()),equipmentMap=equipmentRowsForMap();
    return {geography_id:state.geographyId,map_scope:citywideComparisonEnabled()?"MUNICIPALITY":"SELECTED_GEOGRAPHY",school_universe:schoolUniverse().length,schools_in_context:schools.length,schools_mappable_after_filters:schoolMap.length,school_markers_visible:visibleSchoolMarkers.length,priority_in_context:schools.filter(item=>item.priority).length,equipment_catalog:equipmentUniverse().length,equipment_in_context:equipment.length,equipment_mappable_after_filters:equipmentMap.length,equipment_markers_after_cross_layer_dedupe:equipmentMap.length,total_visible_markers:visibleSchoolMarkers.length+(state.layerState.equipment?equipmentMap.length:0),total_markers_when_school_and_equipment_on:schoolMap.length+equipmentMap.length,school_records_inside_non_school_equipment_catalog:equipmentUniverse().filter(item=>item.entity_type==="SCHOOL_AS_EQUIPMENT").length,school_filters:Object.assign({},state.schoolFilters),equipment_filters:Object.assign({},state.equipmentFilters)};
  }
  function activeViolencePeriodAudit() {
    const indicatorId=activeViolenceIndicatorId(),period=selectedViolencePeriod(indicatorId),source=sourceById(period?.source_id),metric=indicatorId?metricById(indicatorId):null,context=metric?r50MetricContext(metric):null,cell=context?.cell||(indicatorId?metricCell(state.geographyId,indicatorId):null);
    return {indicator_id:indicatorId,period_id:period?.period_id||null,period_label:period?.period_label||null,partial_period:period?.partial_period===true,partial_through:period?.partial_through||null,source_id:period?.source_id||null,geography_id:context?.geography?.id||state.geographyId,municipal_context:context?.municipalContext===true,source_visible:Boolean($("#violence-context-slot .violence-source-link")),period_visible:Boolean($("#violence-context-slot .violence-context-field")),partial_badge_visible:period?.partial_period?Boolean($("#violence-context-slot .violence-partial-badge")):true,lineage_id:cell?.lineage_id||period?.lineage_id||null,value:A.isAvailable(cell)?cell.value:null,status:cell?.status||"SOURCE_NOT_AVAILABLE",source_resolved:Boolean(source)};
  }
  function traceabilitySnapshot() {
    if(!state.data)return null;
    const governed=new Set(governedSourceRecords().map(item=>item.source_id));
    const indicators=[...(state.data.catalog||[]),...(state.cityId==="belem"?BELEM_VIRTUAL_INDICATORS:[])],entities=state.cityId==="belem"?[...schoolUniverse(),...equipmentUniverse()]:[...(state.data.schools||[]),...(state.data.equipment||[]),...(state.data.priority_schools||[])],presentationGroups=state.cityId==="belem"?BELEM_PRESENTATION_GROUPS:foundationPresentationGroups(),violence=state.cityId==="belem"?BELEM_VIRTUAL_INDICATORS:indicators.filter(item=>item.r50_origin==="R48"),paired=presentationGroups.filter(group=>(group.available_measures||[]).includes("percentage")&&group.count_indicator_id!=="demo_population_total_n"),runtimeRows=state.data.r50_runtime?.records||[];
    const ordered=value=>JSON.stringify([...(value||[])].sort());
    return {published_indicator_without_source:indicators.filter(item=>!item.source_id||!(item.source_ids||[item.source_id]).every(id=>governed.has(id))).length,published_indicator_without_lineage:indicators.filter(item=>!item.lineage_id).length,published_entity_without_source:entities.filter(item=>!item.source_id||!(item.source_ids||[item.source_id]).every(id=>governed.has(id))).length,published_spatial_entity_without_location_source:entities.filter(item=>validCoordinate(item)&&!(item.location_source_ids||[]).length).length,presentation_concept_without_source:presentationGroups.filter(group=>!presentationGroupSourceIds(group).length||!presentationGroupSourceIds(group).every(id=>governed.has(id))).length,violence_indicator_without_source:violence.filter(item=>!item.source_id||!governed.has(item.source_id)).length,violence_indicator_without_lineage:violence.filter(item=>!item.lineage_id).length,r50_runtime_observation_without_source:runtimeRows.filter(item=>!item.source_id||!governed.has(item.source_id)).length,r50_runtime_observation_without_lineage:runtimeRows.filter(item=>!item.lineage_id).length,paired_count_pct_wrong_source:paired.filter(group=>{const count=metricById(group.count_indicator_id),pct=metricById(group.percentage_indicator_id);return !count||!pct||count.source_id!==pct.source_id;}).length,paired_count_pct_wrong_geography:paired.filter(group=>{const count=metricById(group.count_indicator_id),pct=metricById(group.percentage_indicator_id);return !count||!pct||ordered(count.geographies)!==ordered(pct.geographies);}).length,paired_count_pct_wrong_period:paired.filter(group=>{const count=metricById(group.count_indicator_id),pct=metricById(group.percentage_indicator_id);return !count||!pct||String(count.period)!==String(pct.period);}).length,assistant_claim_without_source:indicators.filter(item=>!item.source_id||!item.lineage_id||!(item.source_ids||[item.source_id]).every(id=>governed.has(id))).length};
  }
  function leafletFeatureCount(layerGroup) { let count=0;if(layerGroup&&layerGroup.eachLayer)layerGroup.eachLayer(()=>{count+=1;});return count; }
  function citywideMapContract() {
    if(!state.data||!citywideComparisonEnabled())return null;
    const level=comparisonGeographyLevel(),expected=state.data.geographies.filter(item=>item.level===level).length,visible=leafletFeatureCount(state.layers.territories),programExpected=state.programTerritoryIds.length,programVisible=leafletFeatureCount(state.layers.program),geo=currentGeo();
    return {selectedGeography:{id:state.geographyId,level:geo?.level||null,name:geo?geographyDisplayName(geo):null},programTerritory:{ids:[...state.programTerritoryIds],expected_outlines:programExpected,visible_outlines:programVisible},comparisonGeography:{level,expected_units:expected,visible_units:visible},mapExtent:{scope:state.mapExtent,viewport:mapViewportSnapshot()},counters:{program_territory_clips_citywide_choropleth:visible===expected?0:1,comparison_unit_missing_from_map_without_reason:Math.max(0,expected-visible),outside_municipality_thematic_polygon:0,ra_bairro_conflation:state.cityId==="rio_de_janeiro"&&![["RJ_ADMINISTRATIVE_REGION",33],["RJ_NEIGHBORHOOD",166],["RJ_PLANNING_AREA",5]].some(([candidate,count])=>candidate===level&&count===visible)?1:0,selected_geography_map_surface_conflation:visible===expected?0:1}};
  }
  function diagnosticUxSnapshot() {
    const city=cityDiagnosticContract(),record=governedIndicatorRecord(state.indicatorId),visibleOptions=$$("#indicator-select option").filter(option=>option.value),scaleOptions=$$('[data-map-scale]').map(button=>button.dataset.mapScale),coverage=$("#map-coverage-message"),sourceCard=$("#source-body .source-methodology-card"),sourceTerms=sourceCard?[...sourceCard.querySelectorAll("dt")].map(item=>item.textContent):[];
    return {runtime_id:DIAGNOSTIC_RUNTIME.runtime_id,policy_id:DIAGNOSTIC_RUNTIME.policy?.policy_id,same_indicator_set_required:DIAGNOSTIC_RUNTIME.policy?.same_indicator_set_required,city_id:state.cityId,catalog_indicator_count:Object.keys(city?.indicators||{}).length,menu_visible_contract_count:Object.values(city?.indicators||{}).filter(item=>item.menu_visible).length,visible_indicator_ids:visibleOptions.map(option=>option.value),visible_theme_ids:$$("#theme-select option").map(option=>option.value),active_indicator:record||null,allowed_scale_options:governedMapScales(),rendered_scale_options:scaleOptions,coverage_message:coverage?.querySelector("strong")?.textContent||null,indicator_methodology_link_visible:Boolean(coverage?.querySelector("[data-indicator-methodology]")),city_guide:guideSnapshot("city"),general_guide:guideSnapshot("platform"),all_city_guide_blocks:Object.fromEntries(Object.entries(DIAGNOSTIC_RUNTIME.cities||{}).map(([id,item])=>[id,item.guide?.blocks?.length||0])),source_metadata_terms:sourceTerms,sector_toggle_count:$$('button,option,label').filter(node=>/setores censitarios|camada.*setor|visualizacao.*setor/i.test(fold(node.textContent))).length,sp_neighborhood_geography_count:state.cityId==="sao_paulo"?state.data.geographies.filter(item=>/NEIGHBORHOOD|BAIRRO/.test(item.level)).length:0,pavuna_component_neighborhood_list_visible:state.cityId==="rio_de_janeiro"?$$('[data-pavuna-component-neighborhood]').length:0,pavuna_identity:DIAGNOSTIC_RUNTIME.pavuna_contract,assistant_governance_context:state.lastAnalysisContext?.response_type==="CITY_SPECIFIC_GOVERNANCE"?state.lastAnalysisContext:null};
  }
  function qaSnapshot() {
    const comparableLevel=state.data?comparisonGeographyLevel():null,comparableTotal=state.data?state.data.geographies.filter(item=>(item.comparable||item.program_comparable)&&item.level===comparableLevel).length:0,schools=state.data?schoolUniverse():[],equipment=state.data?equipmentUniverse():[];
    const runtimeGroups=state.cityId==="belem"?BELEM_PRESENTATION_GROUPS:foundationPresentationGroups(),runtimeIndicators=state.data?.catalog||[],runtimeObservationCount=state.data&&state.geographyId?Object.keys(state.data.values?.[state.geographyId]||{}).length:0;
    return {state:{cityId:state.cityId,module:state.module,geographyId:state.geographyId,selectedGeographyId:state.geographyId,comparisonGeographyLevel:state.comparisonGeographyLevel,programTerritoryIds:[...state.programTerritoryIds],mapExtent:state.mapExtent,indicatorId:state.indicatorId,active_measure_indicator_id:presentationMetricId(),presentation_group_id:activePresentationGroup()?.presentation_group_id||null,theme:state.theme,compareIds:[...state.compareIds],compareLevel:state.compareLevel,compareSort:state.compareSort,demographicMapMode:state.demographicMapMode,preferredMeasureMode:state.preferredMeasureMode,violence_period_by_indicator:Object.assign({},state.violencePeriodByIndicator)},runtime_contract:{runtime_indicator_count:runtimeIndicators.length,runtime_observation_count:runtimeObservationCount,r50_runtime_observation_count:state.data?.r50_runtime?.records?.length||0,presentation_group_count:runtimeGroups.length,visible_indicator_count:state.data?publicationMetricsForTheme(state.theme).filter(metricVisibleInContext).length:0},diagnostic_ux:diagnosticUxSnapshot(),r53_ux:r53UxSnapshot(),r54_ux:r54UxSnapshot(),presentation_contract:{groups:runtimeGroups.length,paired_groups:runtimeGroups.filter(group=>(group.available_measures||[]).includes("percentage")).length,violence_indicators:state.cityId==="belem"?BELEM_VIRTUAL_INDICATORS.length:(state.data?.catalog||[]).filter(item=>item.r50_origin==="R48").length,visible_indicator_ids:state.data?publicationMetricsForTheme(state.theme).filter(metricVisibleInContext).map(item=>item.indicator_id):[]},comparison_contract:{minimum_selection:2,maximum_selection:comparableTotal,selected_count:state.compareIds.length,geography_level:comparableLevel,mixed_geography_comparison:getComparisonGeographies(false).length===0&&state.compareIds.length>=2},citywide_map_contract:citywideMapContract(),thematic_audit:state.data?[...state.data.catalog,...(state.cityId==="belem"?BELEM_VIRTUAL_INDICATORS:[])].map(item=>thematicMapEngine.audit(item.indicator_id)):[],map_label_audit:mapIsMounted()?mapLabelAudit():null,territorial_polygon_hover_tooltips:mapIsMounted()?territorialPolygonTooltipCount():null,summary_panel_order:summaryPanelOrder(),layout_metrics:layoutMetrics(),layout_invalidate_audit:state.lastLayoutInvalidateAudit||null,map_viewport:mapViewportSnapshot(),last_viewport_audit:state.lastViewportAudit,map_navigation_calls:state.qaMapNavigationCalls.map(item=>Object.assign({},item)),qa_console:{errors:[...state.qaConsoleErrors],warnings:[...state.qaOwnWarnings]},demographic_percentage_qa:state.data?auditGovernedDemographicPercentages():null,map_analysis_context:state.mapAnalysisContext,map_evidence_pack:state.mapEvidencePack,violence_context:activeViolenceIndicatorId()?activeViolencePeriodAudit():null,spatial_context:activeSpatialCounts(),school_spatial:{total:schools.length,validated:schools.filter(validCoordinate).length,duplicate_inep:schools.length-new Set(schools.map(item=>String(item.official_code))).size},equipment_spatial:{total:equipment.length,validated:equipment.filter(validCoordinate).length,duplicate_equipment_id:equipment.length-new Set(equipment.map(item=>String(item.id))).size,canonical_categories:[...new Set(equipment.map(item=>item.category))].sort(),raw_categories:[...new Set(equipment.map(item=>item.raw_category))].sort(),raw_category_missing:equipment.filter(item=>!item.raw_category).length,canonical_category_missing:equipment.filter(item=>!item.canonical_category).length},analysis_context:state.lastAnalysisContext,evidence_pack:state.lastEvidencePack,assistant_error:state.lastAssistantError,traceability:traceabilitySnapshot()};
  }
  function publishQaSnapshot() { if(new URLSearchParams(location.search).get("qa")==="1")document.documentElement.dataset.acuD1rQa=JSON.stringify(qaSnapshot()); }
  function installQaHooks() {
    if(new URLSearchParams(location.search).get("qa")!=="1")return;
    window.addEventListener("error",event=>{const message=String(event.message||event.error||"window.error");state.qaConsoleErrors.push(message);document.documentElement.dataset.acuR4r2RuntimeError=message;});
    window.addEventListener("unhandledrejection",event=>{const message=String(event.reason||"unhandledrejection");state.qaConsoleErrors.push(message);document.documentElement.dataset.acuR4r2RuntimeError=message;});
    const originalWarn=console.warn.bind(console);console.warn=(...args)=>{state.qaOwnWarnings.push(args.map(value=>String(value)).join(" "));originalWarn(...args);};
    window.ACU_D1R_QA=Object.freeze({
      r76:()=>({city:state.cityId,geography:state.geographyId,hiddenModules:$$(".side-nav button[hidden]").map(b=>b.dataset.module),matrixExcluded:comparisonR75?.excluded||[],matrixRows:matrixExportRows()}),
      snapshot:qaSnapshot,
      openCity,
      selectGeography,
      setCompareIds:ids=>{state.compareIds=[...ids];state.compareSelectionTouched=true;return [...state.compareIds];},
      setComparisonGeographyLevel,
      citywideMapContract,
      setIndicator:id=>{const metric=metricById(id);if(!metric||!indicatorGovernedForPublication(metric))throw assistantContractError("ACTIVE_INDICATOR_UNRESOLVED","Indicador de QA inexistente ou não publicável nesta cidade.");const before=mapViewportSnapshot(),priorScale=citywideComparisonEnabled()?comparisonGeographyLevel():null,presentation=presentationGroupForIndicator(id),themeGroup=state.cityId==="belem"&&BELEM_THEME_GROUPS.find(item=>item.presentationTheme===presentation?.theme||(item.metricIds||[]).includes(id)||(item.rawThemes||[]).includes(metric.theme));state.theme=themeGroup?themeGroup.id:metric.theme;state.indicatorId=presentation?.count_indicator_id||id;configureSelectors();updateMapIndicatorButton();if(mapIsMounted()&&priorScale===comparisonGeographyLevel())refreshMapPresentation("indicator_change",before);else renderModule();return state.indicatorId;},
      setTheme:id=>{const valid=state.cityId==="belem"?BELEM_THEME_GROUPS.some(item=>item.id===id):["sao_paulo","rio_de_janeiro"].includes(state.cityId)?FOUNDATION_THEME_CONTRACT.some(item=>item.id===id&&item.id!=="Equipamentos e serviços"):state.data.catalog.some(item=>item.theme===id);if(!valid)throw new Error("Tema de QA inexistente.");const before=mapViewportSnapshot(),refreshInPlace=state.module==="panorama"&&mapIsMounted();state.theme=id;configureIndicators();state.module="panorama";if(refreshInPlace)refreshMapPresentation("theme_change",before);else renderModule();return qaSnapshot();},
      belemThemeGroups:()=>BELEM_THEME_GROUPS.map(item=>({id:item.id,label:item.label,module:item.module,indicator_ids:publicationMetricsForTheme(item.id).map(metric=>metric.indicator_id)})),
      presentationGroups:()=>state.cityId==="belem"?BELEM_PRESENTATION_GROUPS:foundationPresentationGroups(),
      violenceIndicators:()=>state.cityId==="belem"?BELEM_VIRTUAL_INDICATORS:(state.data?.catalog||[]).filter(item=>item.r50_origin==="R48"),
      r50Runtime:()=>state.data?.r50_runtime||null,
      r50RuntimeCell:(indicatorId,geographyId,periodId)=>state.r50RuntimeIndex.get(r50RuntimeKey(indicatorId,geographyId,String(periodId)))||null,
      semanticProfile:id=>{const metric=metricById(id);return metric?semanticProfile(metric):null;},
      schoolStageContract:()=>SCHOOL_STAGE_CONTRACT,
      schoolPresentation:id=>{const item=schoolUniverse().find(candidate=>String(candidate.id)===String(id));return item?{id:item.id,inep:item.official_code,name:item.name,canonical_stages:canonicalSchoolStages(item),stage_flags:item.stage_flags,wash:item.wash,territory:schoolTerritoryLabel(item,profileFor(item)),district:item.district_name||item.district||null,quick_html:schoolQuickCard(item),full_html:schoolFullProfile(item)}:null;},
      equipmentPresentation:id=>{const item=equipmentUniverse().find(candidate=>String(candidate.id)===String(id));return item?{id:item.id,name:item.name,category:publicEquipmentCategory(item.category),canonical_status:item.operational_status||item.status||null,operational_status:publicOperationalStatus(item),address:publicEquipmentAddress(item),territory:item.territory,district:item.district_name||item.district||null,inside_daico:item.inside_daico===true,source_id:item.source_id,source:sourceById(item.source_id),quick_html:equipmentQuickCardHtml(item),detail_html:equipmentPublicDetail(item)}:null;},
      equipmentTaxonomy:()=>equipmentUniverse().map(item=>({id:item.id,raw_category:item.raw_category,canonical_category:item.canonical_category,display_category_pt:item.display_category_pt,source_taxonomy:item.source_taxonomy,taxonomy_lineage_id:item.taxonomy_lineage_id})),
      auditThematicIndicator:id=>thematicMapEngine.audit(id),
      auditAllThematicIndicators:()=>state.data.catalog.map(item=>thematicMapEngine.audit(item.indicator_id)),
      applyMapIndicator:id=>{const before=mapViewportSnapshot(),group=presentationGroupForIndicator(id);state.indicatorId=group?.count_indicator_id||id;state.mapIndicator=id;state.mapScale=buildMapScale();if(!thematicMapEngine.context(id).map_enabled)throw assistantContractError("MAP_INDICATOR_NOT_AVAILABLE","N/D nesta geografia");if(mapIsMounted())refreshMapPresentation("indicator_change",before);return thematicMapEngine.audit(id);},
      setPresentationMeasure:mode=>{if(!["count","percentage","rate"].includes(mode))throw new Error("Modo de apresentação inválido.");const group=activePresentationGroup();if(!group)throw new Error("O indicador não possui contrato de apresentação.");if(!availableMeasuresForGroup(group).includes(mode))throw new Error("Medida não disponível para este conceito e contexto.");setPresentationMeasure(mode);return qaSnapshot();},
      setDemographicMapMode:mode=>{if(!["count","percentage"].includes(mode))throw new Error("Modo demográfico inválido.");const group=activePresentationGroup();if(!isDemographicPresentationGroup(group))throw new Error("O indicador do mapa não é demográfico.");if(!availableMeasuresForGroup(group).includes(mode))throw new Error("Medida demográfica não disponível.");setPresentationMeasure(mode);return qaSnapshot();},
      getDemographicPercentage:(geographyId,indicatorId)=>demographicPercentage(geographyId,indicatorId),
      auditDemographicPercentages:auditGovernedDemographicPercentages,
      contextVisibility:()=>BELEM_CONTEXT_VISIBILITY,
      visibleIndicators:()=>publicationMetricsForTheme(state.theme).filter(metricVisibleInContext).map(item=>item.indicator_id),
      availableMeasures:()=>availableMeasuresForGroup(activePresentationGroup()),
      r721:()=>({cityRequest,basemap:ACU_R72R1.audit(state.map),contextLevel:comparisonGeographyLevel(),activeIds:activeMapGeographyIds(),collectionIds:(activeMapCollection()?.features||[]).map(featureId),thematic:thematicMapEngine.context(),catalog:publicationMetricsForTheme(state.theme).map(m=>({id:m.indicator_id,visible:metricVisibleInContext(m)}))}),
      r72:()=>({mapId:L.stamp(state.map),geometrySignature:state.map?._r72GeometrySignature,labels:state.map?.r72Labels?.audit(),selection:mapSelection(),committed:committedMapSelection?.selection,pending:Boolean(state.map?.getContainer().querySelector('.r72-update-status[data-error="false"]:not([hidden])')),error:state.map?._r72LastError||null}),
      r72Entries:()=>state.map?.r72Labels?.entries().map(e=>({id:e.id,value:e.value,unit:e.unit,available:e.available,indicator:e.indicator,source:mapDisplayCell(e.id)?.source_id})),
      r72Layers:()=>state.layers,
      r72Points:()=>({layers:state.markerLayers,records:state.markerRecords,filters:{school:{...state.schoolFilters},equipment:{...state.equipmentFilters}},enabled:{...state.layerState}}),
      mapViewport:mapViewportSnapshot,
      invalidateMapForLayout,
      setQaMapViewport:(center,zoom)=>{if(!mapIsMounted()||!Array.isArray(center)||center.length!==2||!center.every(Number.isFinite)||!Number.isFinite(Number(zoom)))throw new Error("Viewport de QA inválido.");const before=mapViewportSnapshot();withAllowedMapNavigation("qa_manual_view",()=>state.map.setView(center,Number(zoom)));recordViewportAudit("qa_manual_view",before,true);return mapViewportSnapshot();},
      clearMapNavigationCalls:()=>{state.qaMapNavigationCalls.length=0;return 0;},
      mapNavigationCalls:()=>state.qaMapNavigationCalls.map(item=>Object.assign({},item)),
      refreshMapPresentation,
      mapLabelAudit,
      territorialPolygonTooltipCount,
      markerSymbolAudit,
      r53UxSnapshot,
      r54UxSnapshot,
      physicalGeographyIdById:id=>{let feature=null;[...(activeMapCollection()?.features||[]),...(state.data?.map?.program?.features||[])].forEach(item=>{if(featureId(item)===id)feature=item;});return feature?physicalGeographyId(feature):null;},
      openTerritorialQuickCard:openTerritorialQuickCardForQa,
      openEquipmentQuickCard:openEquipmentQuickCardForQa,
      quickCardAudit:quickCardDomAudit,
      closeQuickCard:()=>{if(state.quickCard)hideQuickCard(state.quickCard.kind,true);return quickCardDomAudit();},
      setMapControlSection,
      territoryTooltipById:id=>{let html=null;[state.layers.territories,state.layers.program].filter(Boolean).forEach(group=>group.eachLayer(layer=>{if(featureId(layer.feature)===id)html=territoryTooltip(layer.feature);}));return html;},
      summaryPanelOrder,
      labelContrastProfile,
      activeSpatialCounts,
      sampleSpatialIds:()=>({school:state.markerRecords.find(item=>item.kind==="school"||item.kind==="priority")?.id||null,equipment:state.markerRecords.find(item=>item.kind==="equipment")?.id||null}),
      sampleEquipmentIdsByCategory:()=>Object.fromEntries([...new Set(state.markerRecords.filter(item=>item.kind==="equipment").map(item=>item.category))].map(category=>[category,state.markerRecords.find(item=>item.kind==="equipment"&&item.category===category)?.id||null])),
      geographyIndex:()=>availableGeographies().map(item=>({id:item.id,name:item.name,display_name:geographyDisplayName(item),level:item.level})),
      diagnosticUxSnapshot,
      governedIndicatorRecord,
      governedMapScales,
      governedPublicationMessage,
      openGuide,
      guideSnapshot,
      openIndicatorMethodology,
      citySpecificAssistantResponse,
      r50AssistantResponse,
      openSchoolQuickTooltip:id=>{const record=state.markerRecords.find(item=>String(item.id)===String(id)&&(item.kind==="school"||item.kind==="priority"));if(!record)throw new Error("Marcador escolar não encontrado no recorte/filtro ativo.");if(!record.marker.getTooltip()){showQuickCard("school",record.marker,schoolQuickCard(record.item),null,true,record.item);return state.quickCard.card.outerHTML;}record.marker.openTooltip();return record.marker.getTooltip()?.getElement()?.outerHTML||null;},
      showDetail:(kind,id)=>{showDetail(kind,id);return Boolean($("#detail-dialog")?.open);},
      setLayer:(layer,enabled)=>{if(!Object.prototype.hasOwnProperty.call(state.layerState,layer))throw new Error("Camada de QA inexistente.");const before=mapViewportSnapshot();state.layerState[layer]=Boolean(enabled);if(mapIsMounted()){refreshPointLayers();recordViewportAudit("layer_toggle",before,false);}publishQaSnapshot();return activeSpatialCounts();},
      setSchoolFilters:filters=>{const allowed=new Set(["dependency","stage","wash","differentiated","priority"]);Object.entries(filters||{}).forEach(([key,value])=>{if(!allowed.has(key))throw new Error(`Filtro escolar de QA inexistente: ${key}`);state.schoolFilters[key]=value;});const before=mapViewportSnapshot();if(mapIsMounted()){refreshPointLayers();recordViewportAudit("filter_change",before,false);}publishQaSnapshot();return activeSpatialCounts();},
      setEquipmentFilters:filters=>{const aliases={government_level:"governmentLevel",category:"category",subcategory:"subcategory",status:"status",governmentLevel:"governmentLevel"};Object.entries(filters||{}).forEach(([key,value])=>{if(!aliases[key])throw new Error(`Filtro de equipamento de QA inexistente: ${key}`);state.equipmentFilters[aliases[key]]=value;});state.equipmentFilter=state.equipmentFilters.category;const before=mapViewportSnapshot();if(mapIsMounted()){refreshPointLayers();recordViewportAudit("filter_change",before,false);}publishQaSnapshot();return activeSpatialCounts();},
      searchResults:query=>searchResultRows(query),
      focusSpatialResult,
      violencePeriods:indicatorId=>violencePeriodContract(indicatorId),
      selectedViolencePeriod:indicatorId=>selectedViolencePeriod(indicatorId),
      setViolencePeriod,
      activeViolencePeriodAudit,
      showViolenceMethodology,
      buildExportRows,
      setModule:module=>{if(!moduleMeta[module])throw new Error("Módulo de QA inválido.");state.module=module;alignThemeToModule();renderModule();return module;},
      runAssistant,
      askQuestion:askAssistant,
      getActiveGeography,
      getComparisonGeographies
    });
  }

  renderLanding(); bindGlobalEvents(); installQaHooks(); restoreHash().catch(error=>{console.error(error); setLoading(false);});
})();

