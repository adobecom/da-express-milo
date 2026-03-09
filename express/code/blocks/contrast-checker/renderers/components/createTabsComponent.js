import { createTag } from '../../../../scripts/utils.js';

export default function createTabsComponent({ tabs, defaultTab, onChange }) {
  let activeTab = defaultTab || tabs[0]?.id;
  const buttons = [];
  const listeners = new Map();

  const container = createTag('div', { class: 'cc-tabs', role: 'tablist' });

  tabs.forEach(({ id, label }) => {
    const isActive = id === activeTab;
    const btn = createTag('button', {
      class: isActive ? 'cc-tab cc-tab--active' : 'cc-tab',
      role: 'tab',
      'aria-selected': String(isActive),
      'data-tab-id': id,
    }, label);

    const handleClick = () => {
      if (id === activeTab) return;
      activateTab(id);
      onChange?.(id);
    };

    const handleKeydown = (e) => {
      const currentIndex = tabs.findIndex((t) => t.id === id);
      let targetIndex;

      switch (e.key) {
        case 'ArrowRight':
          targetIndex = (currentIndex + 1) % tabs.length;
          break;
        case 'ArrowLeft':
          targetIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          targetIndex = 0;
          break;
        case 'End':
          targetIndex = tabs.length - 1;
          break;
        default:
          return;
      }

      e.preventDefault();
      buttons[targetIndex].focus();
    };

    btn.addEventListener('click', handleClick);
    btn.addEventListener('keydown', handleKeydown);
    listeners.set(btn, { click: handleClick, keydown: handleKeydown });

    buttons.push(btn);
    container.appendChild(btn);
  });

  function activateTab(id) {
    activeTab = id;
    buttons.forEach((btn) => {
      const isTarget = btn.dataset.tabId === id;
      btn.classList.toggle('cc-tab--active', isTarget);
      btn.setAttribute('aria-selected', String(isTarget));
    });
  }

  function getActiveTab() {
    return activeTab;
  }

  function setActiveTab(id) {
    activateTab(id);
  }

  function destroy() {
    listeners.forEach((handlers, btn) => {
      btn.removeEventListener('click', handlers.click);
      btn.removeEventListener('keydown', handlers.keydown);
    });
    listeners.clear();
    buttons.length = 0;
    container.replaceChildren();
  }

  return {
    element: container,
    getActiveTab,
    setActiveTab,
    destroy,
  };
}
