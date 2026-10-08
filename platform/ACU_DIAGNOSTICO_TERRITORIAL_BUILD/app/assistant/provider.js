(function () {
  "use strict";
  class AssistantProvider {
    generateSummary() { throw new Error("Not implemented"); }
    characterizeProgramTerritories() { throw new Error("Not implemented"); }
    compare() { throw new Error("Not implemented"); }
    attention() { throw new Error("Not implemented"); }
    generateReport() { throw new Error("Not implemented"); }
    answerQuestion() { throw new Error("Not implemented"); }
  }
  class SecureLLMProvider extends AssistantProvider {
    constructor(endpoint) { super(); this.endpoint = endpoint || null; }
    available() { return Boolean(this.endpoint && /^https:\/\//.test(this.endpoint)); }
    async request() { throw new Error("SecureLLMProvider requer endpoint seguro no backend; nenhuma chave é aceita no navegador."); }
  }
  window.ACUAssistant = { AssistantProvider, SecureLLMProvider };
})();
