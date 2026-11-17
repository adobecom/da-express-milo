import { getLibs, getIconElementDeprecated, convertToInlineSVG, readBlockConfig } from '../../scripts/utils.js';

let createTag;

const iconRegex = /icon-\s*([^\s]+)/;

function convertToId(text) {
  return text?.trim().toLowerCase().replaceAll(' ', '-');
}

function tagPanels(main) {
  const sections = [...main.querySelectorAll('.section')];
  const panels = [];
  sections.forEach((section) => {
    const metadataDiv = section.querySelector(':scope > .section-metadata');
    if (!metadataDiv) return;
    const meta = readBlockConfig(metadataDiv);
    const keys = Object.keys(meta);
    let isPanel = false;
    keys.filter((key) => key.trim().toLowerCase() === 'ax-panel').forEach((key) => {
      isPanel = true;
      const val = convertToId(meta[key]);
      section.setAttribute('role', 'tabpanel');
      section.setAttribute('id', `ax-panel-${val}`);
      section.setAttribute('data-ax-panel', val);
    });
    isPanel && panels.push(section);
  });
  return panels;
}

export default async function init(el) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const enclosingMain = el.closest('main');
  if (!enclosingMain) return;

  const [headingContainer, tabListContainer] = el.querySelectorAll(':scope > div');
  headingContainer.classList.add('ax-panels-heading-container');
  tabListContainer.classList.add('tablist-container');

  const panels = tagPanels(enclosingMain);

  const tabList = tabListContainer.querySelector('ul');
  tabList.setAttribute('role', 'tablist');
  const headingId = headingContainer.querySelector('h2,h3')?.id;
  headingId && tabList.setAttribute('aria-labelledby', headingId);

  let tabs;
  const activateTab = (tab) => {
    if (tab.getAttribute('aria-selected') === 'true') return;
    tabs.forEach((t) => {
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabIndex', '-1');
    });
    tab.setAttribute('aria-selected', 'true');
    tab.setAttribute('tabIndex', '0');
    tab.focus();
    panels.forEach((panel) => panel.classList.add('hide'));
    document.getElementById(tab.getAttribute('aria-controls'))?.classList?.remove('hide');
    tab.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
  };

  tabs = [...tabList.querySelectorAll('li')].map((listItem, index) => {
    const tabVal = convertToId(listItem.textContent);
    const tabId = `ax-panel-tab-${tabVal}`;
    const controlledPanel = panels.filter((panel) => panel.id === `ax-panel-${tabVal}`)[0];
    const tab = createTag('button', {
      role: 'tab',
      'aria-selected': index === 0,
      id: tabId,
      'aria-controls': controlledPanel?.id,
      tabIndex: index > 0 ? '-1' : '0',
    });
    controlledPanel?.setAttribute('aria-labelledby', tabId);
    if (index > 0) controlledPanel?.classList.add('hide');
    const icon = listItem.querySelector('.icon');
    const match = icon && iconRegex.exec(icon.className);
    if (match?.[1]) {
      convertToInlineSVG(getIconElementDeprecated(match[1])).then((svg) => {
        icon.setAttribute('aria-hidden', 'true');
        icon.append(svg);
      });
    }
    if (icon) tab.append(icon);
    tab.append(listItem.textContent);
    tab.addEventListener('click', () => activateTab(tab));
    listItem.replaceWith(tab);
    return tab;
  });

  tabList.addEventListener('keydown', (e) => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    e.preventDefault();
    const currTabIndex = tabs.findIndex((tab) => tab.getAttribute('aria-selected') === 'true');
    if (currTabIndex === -1) return;
    const direction = getComputedStyle(tabList).direction === 'rtl' ? -1 : 1;
    const nextTabIndex = (currTabIndex + (e.key === 'ArrowLeft' ? -direction : direction) + tabs.length) % tabs.length;
    activateTab(tabs[nextTabIndex]);
  });
}
