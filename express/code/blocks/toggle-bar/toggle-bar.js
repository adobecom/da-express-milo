import { getLibs, getFixedTopOffset, fixIcons, readBlockConfig, addTempWrapperDeprecated } from '../../scripts/utils.js';
import { sendEventToAnalytics, textToName } from '../../scripts/instrument.js';

let createTag;

function decorateButton(block, toggle) {
  const li = createTag('li');
  const button = createTag('button', { class: 'toggle-bar-button' });
  const iconsWrapper = createTag('div', { class: 'icons-wrapper' });
  const textWrapper = createTag('div', { class: 'text-wrapper' });
  const icons = toggle.querySelectorAll('img');

  const tagText = toggle.textContent.trim().match(/\[(.*?)\]/);

  if (tagText) {
    const [fullText, tagTextContent] = tagText;
    const tag = createTag('span', { class: 'tag' });
    textWrapper.textContent = toggle.textContent.trim().replace(fullText, '').trim();
    button.dataset.text = textWrapper.textContent.toLowerCase();
    tag.textContent = tagTextContent;
    textWrapper.append(tag);
  } else {
    textWrapper.textContent = toggle.textContent.trim();
    button.dataset.text = textWrapper.textContent.toLowerCase();
  }

  if (icons.length > 0) {
    icons.forEach((icon) => {
      iconsWrapper.append(icon);
    });
  }

  button.append(iconsWrapper, textWrapper);
  li.append(button);
  toggle.parentNode.replaceChild(li, toggle);

  let texts = [];
  let child = textWrapper.firstChild;
  while (child) {
    if (child.nodeType === 3) {
      texts.push(child.data);
    }
    child = child.nextSibling;
  }

  texts = texts.join('') || textWrapper.textContent.trim();
  const eventName = `adobe.com:express:homepage:intentToggle:${textToName(texts)}`;
  button.addEventListener('click', () => {
    sendEventToAnalytics(eventName);
  });
}

function initButton(block, sections, index, props) {
  const enclosingMain = block.closest('main');
  if (enclosingMain) {
    const buttons = block.querySelectorAll('.toggle-bar-button');

    buttons[index].addEventListener('click', () => {
      const activeButton = block.querySelector('button.active');
      props.activeTab = buttons[index].dataset.text;

      localStorage.setItem('createIntent', buttons[index].dataset.text);

      if (activeButton !== buttons[index]) {
        activeButton.classList.remove('active');
        buttons[index].classList.add('active');

        sections.forEach((section) => {
          if (buttons[index].dataset.text === section.dataset.toggle.toLowerCase()) {
            section.style.display = 'block';
            props.activeSection = section;
          } else {
            section.style.display = 'none';
          }
        });
      }

      if (!block.classList.contains('sticky')) {
        window.scrollTo({
          top: Math.round(window.scrollY + block.getBoundingClientRect().top) - 24,
          behavior: 'smooth',
        });
      }
    });

    if (index === 0) {
      buttons[index].classList.add('active');
      props.activeTab = buttons[index].dataset.text;
      [props.activeSection] = sections;
    }
  }
}

function syncWithStoredIntent(block) {
  const buttons = block.querySelectorAll('button');
  const createIntent = localStorage.getItem('createIntent');

  if (createIntent) {
    const targetBtn = Array.from(buttons).find((btn) => btn.dataset.text === createIntent);
    if (targetBtn) targetBtn.click();
  }
}

function initStickyBehavior(block, props) {
  const toggleBar = block.querySelector('div:nth-of-type(2)');
  const gNav = document.querySelector('header.global-navigation');
  const topValue = gNav ? getFixedTopOffset() : 0;

  if (toggleBar) {
    document.addEventListener('scroll', () => {
      const blockRect = block.getBoundingClientRect();
      const sectionRect = props.activeSection && props.activeSection.getBoundingClientRect();

      if (sectionRect && sectionRect.bottom < 0) {
        block.classList.add('hidden');
      } else if (blockRect.top < topValue) {
        block.classList.remove('hidden');
        block.classList.add('sticking');
        if (gNav) block.classList.add('bumped-by-gnav');
      } else if (blockRect.top >= topValue) {
        block.classList.remove('sticking');
        block.classList.remove('hidden');
        block.classList.remove('bumped-by-gnav');
      }
    }, { passive: true });
  }
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

export default async function decorate(block) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), fixIcons(block)]).then(([utils]) => {
    ({ createTag } = utils);
  });
  addTempWrapperDeprecated(block, 'toggle-bar');
  decorteSectionsMetadata();

  const props = { activeTab: '', activeSection: null };
  const enclosingMain = block.closest('main');
  if (enclosingMain) {
    const sections = enclosingMain.querySelectorAll('[data-toggle]');
    const toggles = block.querySelectorAll('li');

    toggles.forEach((toggle, index) => {
      decorateButton(block, toggle);
      initButton(block, sections, index, props);
    });

    if (sections) {
      sections.forEach((section, index) => {
        if (index > 0) {
          section.style.display = 'none';
        }
      });
    }

    syncWithStoredIntent(block);

    if (block.classList.contains('sticky')) {
      initStickyBehavior(block, props);
    }
  }
}
