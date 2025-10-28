import { readBlockConfig, addTempWrapperDeprecated } from '../../scripts/utils.js';
import createCarousel from '../../scripts/widgets/carousel.js';

function getTabIndexFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  if (tabParam) {
    const indexOneBased = parseInt(tabParam, 10);
    if (!Number.isNaN(indexOneBased) && indexOneBased >= 1) {
      return indexOneBased - 1; // convert to 0-based internal index
    }
  }
  return null;
}

function updateURLParameter(index) {
  const url = new URL(window.location);
  url.searchParams.set('tab', index);
  window.history.replaceState({}, '', url);
}

function getDefatultToggleIndex(block) {
  // First check URL parameter
  const urlIndex = getTabIndexFromURL();
  if (urlIndex !== null) {
    return urlIndex;
  }

  // Fall back to data attribute
  const enclosingMain = block.closest('main');
  const toggleDefaultOption = enclosingMain.querySelector('[data-toggle-default]');
  const defaultValue = toggleDefaultOption?.dataset.toggleDefault || toggleDefaultOption?.getAttribute('data-toggle-default');
  const parsedIndex = parseInt(defaultValue, 10);
  const defaultIndex = !defaultValue || Number.isNaN(parsedIndex) ? 0 : parsedIndex - 1;
  return defaultIndex;
}

function initButton(block, buttons, sections, index, initiallyHasTabParam) {
  const setActiveButton = (newIndex) => {
    buttons.forEach((btn) => btn.classList.remove('active'));
    buttons[newIndex].classList.add('active');
    // ARIA: update tab selected and focusability
    buttons.forEach((btn) => {
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1');
    });
    buttons[newIndex].setAttribute('aria-selected', 'true');
    buttons[newIndex].setAttribute('tabindex', '0');
    // Focus the active button for better accessibility
    buttons[newIndex].focus();
  };

  const handleSectionChange = (updateUrl = true) => {
    const activeButton = block.querySelector('.content-toggle-button.carousel-element.active');
    const blockPosition = block.getBoundingClientRect().top;
    const offsetPosition = blockPosition + window.scrollY - 80;

    if (activeButton !== buttons[index]) {
      setActiveButton(index);
      if (updateUrl) updateURLParameter(index + 1); // write 1-based index to URL
      sections.forEach((section) => {
        const isActive = (
          buttons[index].innerText.toLowerCase()
          === section.dataset.toggle.toLowerCase()
        );
        section.classList.toggle('content-toggle-hidden', !isActive);
        section.classList.toggle('content-toggle-active', isActive);
        // ARIA: manage tabpanel hidden state
        section.toggleAttribute('hidden', !isActive);
        section.setAttribute('aria-hidden', (!isActive).toString());
      });
      const withinOffset = (
        window.scrollY < offsetPosition + 1
        && window.scrollY > offsetPosition - 1
      );
      if (!withinOffset) {
        window.scrollTo({
          top: offsetPosition,
          behavior: 'instant',
        });
      }
    }
  };

  if (index === getDefatultToggleIndex(block)) {
    setActiveButton(index);
    // On initial load, only update URL if it already had a tab param
    handleSectionChange(!!initiallyHasTabParam);
  }

  buttons[index].addEventListener('click', () => {
    handleSectionChange(true);
  });

  buttons[index].addEventListener('keydown', (e) => {
    if (e.target !== buttons[index]) return;
    const lastIndex = buttons.length - 1;
    switch (e.key) {
      case 'Enter':
      case ' ': {
        e.preventDefault();
        handleSectionChange(true);
        break;
      }
      case 'ArrowRight':
      case 'ArrowDown': {
        e.preventDefault();
        const next = index === lastIndex ? 0 : index + 1;
        buttons[next].focus();
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        e.preventDefault();
        const prev = index === 0 ? lastIndex : index - 1;
        buttons[prev].focus();
        break;
      }
      case 'Home': {
        e.preventDefault();
        buttons[0].focus();
        break;
      }
      case 'End': {
        e.preventDefault();
        buttons[lastIndex].focus();
        break;
      }
      default:
        break;
    }
  });
}

function decorateSectionMetadata(section) {
  const metadataDiv = section.querySelector(':scope > .section-metadata');
  if (metadataDiv) {
    const meta = readBlockConfig(metadataDiv);
    const keys = Object.keys(meta);
    keys.forEach((key) => {
      if (!['style', 'anchor', 'background'].includes(key)) {
        section.setAttribute(`data-${key}`, meta[key]);
      }
    });
  }
}

function decorteSectionsMetadata() {
  const sections = document.querySelectorAll('.section');
  sections.forEach(decorateSectionMetadata);
}

export default function decorate(block) {
  addTempWrapperDeprecated(block, 'content-toggle');
  decorteSectionsMetadata();

  const enclosingMain = block.closest('main');
  if (enclosingMain) {
    const hadInitialTabParam = new URLSearchParams(window.location.search).has('tab');
    const row = block.querySelector('div');
    const items = block.querySelector('ul');
    const carouselContainer = document.createElement('div');
    carouselContainer.classList.add('content-toggle-carousel-container');
    // ARIA: mark the container as a tablist
    carouselContainer.setAttribute('role', 'tablist');
    carouselContainer.setAttribute('aria-orientation', 'horizontal');
    while (items.firstChild) {
      carouselContainer.appendChild(items.firstChild);
    }

    const toggles = carouselContainer.querySelectorAll('li');
    toggles.forEach((toggle) => {
      const button = document.createElement('button');
      button.innerHTML = toggle.innerHTML;
      button.className = `${toggle.className} content-toggle-button`;
      // ARIA: each toggle becomes a tab
      button.setAttribute('role', 'tab');
      button.setAttribute('aria-selected', 'false');
      button.setAttribute('tabindex', '-1');
      toggle.parentNode.replaceChild(button, toggle);
    });

    createCarousel('button', carouselContainer);

    items.parentNode.replaceChild(carouselContainer, items);
    const sections = enclosingMain.querySelectorAll('[data-toggle]');
    const buttons = row.querySelectorAll('.content-toggle-button');

    // ARIA: link tabs to tabpanels using index-based ids
    buttons.forEach((btn, i) => {
      const tabId = `tab-button-${i + 1}`;
      btn.id = tabId;
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-selected', 'false');
      btn.setAttribute('tabindex', '-1');
      const label = btn.innerText.trim().toLowerCase();
      const panel = Array.from(sections).find((s) => s.dataset.toggle?.toLowerCase() === label);
      if (panel) {
        const panelId = `tab-${i + 1}`;
        panel.id = panelId;
        panel.setAttribute('role', 'tabpanel');
        panel.setAttribute('aria-labelledby', tabId);
        panel.setAttribute('aria-hidden', 'true');
        panel.setAttribute('hidden', '');
        panel.classList.add('content-toggle-hidden');
        btn.setAttribute('aria-controls', panelId);
      }
    });

    for (let i = 0; i < buttons.length; i += 1) {
      initButton(block, buttons, sections, i, hadInitialTabParam);
    }
  }
}
