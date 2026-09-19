const tabs = [...document.querySelectorAll('[data-tab]')];
const panels = {
  layout: document.querySelector('#layoutPanel'),
  crt: document.querySelector('#crtPanel'),
};

function selectTab(name, updateHash = true) {
  const next = panels[name] ? name : 'layout';
  tabs.forEach((tab) => {
    const active = tab.dataset.tab === next;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
    tab.tabIndex = active ? 0 : -1;
  });
  Object.entries(panels).forEach(([key, panel]) => {
    panel.hidden = key !== next;
    panel.classList.toggle('active', key === next);
  });
  if (updateHash) history.replaceState(null, '', `#${next}`);
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(tab.dataset.tab));
  tab.addEventListener('keydown', (event) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === 'ArrowRight' ? 1 : -1;
    const next = tabs[(index + direction + tabs.length) % tabs.length];
    selectTab(next.dataset.tab);
    next.focus();
  });
});

window.addEventListener('hashchange', () => selectTab(location.hash.slice(1), false));
selectTab(location.hash.slice(1) || 'layout', false);
