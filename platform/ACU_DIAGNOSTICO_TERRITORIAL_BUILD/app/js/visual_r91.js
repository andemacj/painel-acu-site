/* Apresentação da navegação. Não altera seleção, rotas, dados ou eventos do painel. */
(() => {
  'use strict';
  const nav = document.querySelector('.side-nav');
  if (!nav) return;
  const icons = {
    panorama:'M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2V5zm6-2v16m6-14v16',
    population:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8-7.87a4 4 0 0 1 0 7.75',
    education:'M3 9l9-5 9 5-9 5-9-5zm4 3v5c3 3 7 3 10 0v-5m4-3v7',
    living:'M3 11l9-8 9 8m-16-2v12h14V9m-10 12v-7h6v7',
    income:'M3 19V5m0 14h18M7 15l4-5 4 2 5-7',
    equipment:'M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3z',
    violence:'M12 3l8 4v5c0 5-8 9-8 9s-8-4-8-9V7l8-4zm-4 9l3 3 5-6',
    pct:'M12 21v-8m-6 8h12M12 3L5 13h14L12 3z',
    compare:'M4 4v16m0-12h7m-7 8h10m2-12v16m0-10h5m-5 7h5',
    sources:'M5 3h10l4 4v14H5V3zm10 0v5h4M8 12h8m-8 4h8',
    assistant:'M4 5h16v12h-9l-5 4v-4H4V5zm4 5h8m-8 3h5'
  };
  const SVG_NS = 'http://www.w3.org/2000/svg';
  let scheduled = false;
  function decorate() {
    scheduled = false;
    for (const button of nav.querySelectorAll('button[data-module]')) {
      const span = button.querySelector('span');
      const path = icons[button.dataset.module];
      if (!span || !path || span.querySelector('.acu-ui-nav-icon')) continue;
      const original = document.createElement('b');
      original.className = 'acu-ui-nav-number';
      original.textContent = span.textContent;
      const svg = document.createElementNS(SVG_NS, 'svg');
      svg.classList.add('acu-ui-nav-icon');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('aria-hidden', 'true');
      svg.setAttribute('focusable', 'false');
      const shape = document.createElementNS(SVG_NS, 'path');
      shape.setAttribute('d', path);
      svg.append(shape);
      span.replaceChildren(original, svg);
    }
    const cityId = document.body.dataset.activeCity;
    const city = (window.ACU_CITIES || []).find(item => item.city_id === cityId);
    let note = nav.querySelector('.acu-ui-city-note');
    if (city) {
      if (!note) {
        note = document.createElement('p');
        note.className = 'acu-ui-city-note';
        const name = document.createElement('strong');
        const cycle = document.createElement('span');
        cycle.textContent = 'Ciclo 2025–2028';
        note.append(name, cycle);
      }
      const label = city.city_name + ' · ' + city.state;
      if (note.firstElementChild.textContent !== label) note.firstElementChild.textContent = label;
      if (nav.lastElementChild !== note) nav.append(note);
    }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(decorate);
  }
  // As atualizações do conteúdo analítico não são observadas.
  const navObserver = new MutationObserver(schedule);
  navObserver.observe(nav, {childList: true, subtree: true});
  const cityObserver = new MutationObserver(schedule);
  cityObserver.observe(document.body, {attributes: true, attributeFilter: ['data-active-city']});
  decorate();
})();
