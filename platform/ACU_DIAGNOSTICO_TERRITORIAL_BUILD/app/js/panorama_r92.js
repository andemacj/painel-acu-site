/* Layout do Panorama. Move apenas nós existentes; preserva controles e seus eventos. */
(() => {
  'use strict';
  const main = document.querySelector('#main');
  const view = document.querySelector('#module-view');
  const filters = main?.querySelector('.context-bar');
  const territory = document.querySelector('#crumb-territory');
  const city = document.querySelector('#crumb-city');
  if (!main || !view || !filters) return;

  const heading = document.createElement('div');
  heading.className = 'r92-panorama-heading';
  filters.before(heading);

  function syncTerritory() {
    const label = heading.querySelector('.module-head p');
    if (!label || !city?.textContent || !territory?.textContent) return;
    const next = city.textContent + ' · ' + territory.textContent;
    if (label.textContent !== next) label.textContent = next;
  }

  function layout() {
    const grid = view.querySelector(':scope > .cartography-grid');
    if (document.body.dataset.activeModule !== 'panorama' || !grid) {
      heading.replaceChildren();
      return;
    }

    const header = view.querySelector(':scope > .module-head');
    if (header) heading.replaceChildren(header);
    syncTerritory();

    let rail = grid.querySelector(':scope > .r92-map-rail');
    if (!rail) {
      const mapPanel = grid.querySelector(':scope > .map-panel');
      const legend = mapPanel?.querySelector('#map-legend');
      if (!legend) return;
      rail = document.createElement('section');
      rail.className = 'r92-map-rail';
      rail.setAttribute('aria-label', 'Legenda e informações do mapa');
      mapPanel.after(rail);
      rail.append(legend);
      grid.classList.add('r92-map-layout');
    }

    const status = view.querySelector(':scope > .r71-statusbar');
    if (status) {
      const coverage = status.querySelector(':scope > div:first-child');
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Cobertura e recorte';
      details.className = 'r92-map-coverage';
      details.append(summary);
      if (coverage) details.append(coverage);
      status.append(details);
      rail.append(status);
    }
  }

  // O mapa é montado num frame posterior ao render do módulo. A legenda já
  // está na coluna antes do primeiro cálculo de dimensões do Leaflet.
  new MutationObserver(layout).observe(view, {childList: true});
  if (territory) new MutationObserver(syncTerritory).observe(territory, {childList: true, characterData: true, subtree: true});
  layout();
})();
