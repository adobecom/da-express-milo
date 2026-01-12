import { getLibs, getIconElementDeprecated } from '../../../../scripts/utils.js';

let createTag;
let escapeKeyHandler = null;

export async function closeDrawer() {
  const curtain = document.querySelector('.pdpx-curtain');
  const drawer = document.querySelector('#pdpx-drawer');
  curtain.classList.add('hidden');
  drawer.classList.add('hidden');
  document.body.classList.remove('disable-scroll');

  if (escapeKeyHandler) {
    document.removeEventListener('keydown', escapeKeyHandler);
    escapeKeyHandler = null;
  }
}

export function setupEscapeKeyHandler() {
  if (!escapeKeyHandler) {
    escapeKeyHandler = (e) => {
      const drawer = document.querySelector('#pdpx-drawer');
      if (e.key === 'Escape' && drawer && !drawer.classList.contains('hidden')) {
        e.preventDefault();
        closeDrawer();
      }
    };
    document.addEventListener('keydown', escapeKeyHandler);
  }
}

export async function createDrawer() {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const curtain = createTag('div', { class: 'pdpx-curtain hidden' });
  const drawer = createTag('div', { class: 'pdpx-drawer hidden', id: 'pdpx-drawer' });
  curtain.addEventListener('click', closeDrawer);
  return { curtain, drawer };
}

export function createDrawerHead(drawerLabel) {
  const drawerHead = createTag('div', { class: 'pdpx-drawer-head' });
  const drawerHeadLabelContainer = createTag('div', { class: 'pdpx-drawer-head-label-container' });
  const drawerHeadLabel = createTag('h6', { class: 'pdpx-drawer-head-label' }, drawerLabel);
  const closeButton = createTag('button', { 'aria-label': 'close' }, getIconElementDeprecated('close-black')); // TODO: analytics
  closeButton.addEventListener('click', closeDrawer);
  drawerHeadLabelContainer.appendChild(drawerHeadLabel);
  drawerHead.append(drawerHeadLabelContainer, closeButton);
  return drawerHead;
}
