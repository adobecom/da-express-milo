import { createActionMenuComponent } from '../../scripts/color-shared/components/createActionMenuComponent.js';

function onExpand(expanded) {
  console.log('onExpand', expanded);
}

export default async function decorate(block) {
  block.innerHTML = '';
  block.className = 'color-wheel';

  const paletteConfig = {
    id: 'action-menu-palette',
    type: 'full',
    activeId: 'palette',
    navLinks: [
      {
        id: 'palette',
        label: 'Create palette',
        href: '/drafts/methomas/color/action-menu',
      },
      {
        id: 'contrast',
        label: 'Contrast Checker',
        href: '/drafts/methomas/color/contrast-checker',
      },
      {
        id: 'color-blindness',
        label: 'Color Blindness Simulator',
        href: '/drafts/methomas/color/color-blindness',
      },
    ],
    controls: [
      {
        id: 'undo',
        label: 'Undo',
      },
      {
        id: 'redo',
        label: 'Redo',
      },
      {
        id: 'generate-random',
        label: 'Generate Random',
      },
      {
        id: 'expand',
        label: 'Expand',
      },
    ],
    onExpand,
  };
  const actionMenu = await createActionMenuComponent(paletteConfig);
  block.append(actionMenu.element);

  const contrastNav = [
    {
      id: 'palette',
      label: 'Create palette',
      href: '/drafts/methomas/color/create-palette',
    },
    {
      id: 'contrast',
      label: 'Contrast Checker',
      href: '/drafts/methomas/color/action-menu',
    },
    {
      id: 'color-blindness',
      label: 'Color Blindness Simulator',
      href: '/drafts/methomas/color/color-blindness',
    },
  ];
  const contrastConfig = {
    id: 'action-menu-contrast',
    type: 'full',
    activeId: 'contrast',
    navLinks: contrastNav,
    controls: [
      {
        id: 'undo',
        label: 'Undo',
      },
      {
        id: 'redo',
        label: 'Redo',
      },
    ],
    onExpand,
  };
  const actionMenuContrast = await createActionMenuComponent(contrastConfig);
  block.append(document.createElement('br'), actionMenuContrast.element);

  const blindnessNav = [
    {
      id: 'palette',
      label: 'Create palette',
      href: '/drafts/methomas/color/create-palette',
    },
    {
      id: 'contrast',
      label: 'Contrast Checker',
      href: '/drafts/methomas/color/contrast-checker',
    },
    {
      id: 'color-blindness',
      label: 'Color Blindness Simulator',
      href: '/drafts/methomas/color/action-menu',
    },
  ];
  const actionMenuBlindnessConfig = {
    id: 'action-menu-color-blindness',
    type: 'full',
    activeId: 'color-blindness',
    navLinks: blindnessNav,
    controls: [
      {
        id: 'undo',
        label: 'Undo',
      },
      {
        id: 'redo',
        label: 'Redo',
      },
    ],
  };
  const actionMenuBlindness = await createActionMenuComponent(actionMenuBlindnessConfig);
  block.append(document.createElement('br'), actionMenuBlindness.element);

  const mobileContainer = document.createElement('div');
  mobileContainer.className = 'mobile-container';
  block.append(document.createElement('br'), mobileContainer);

  const actionMenuMobilePaletteConfig = {
    ...paletteConfig,
    id: 'action-menu-mobile-palette',
    type: 'nav-only',
  };
  const actionMenuMobilePalette = await createActionMenuComponent(actionMenuMobilePaletteConfig);
  mobileContainer.append(actionMenuMobilePalette.element);

  const actionMenuMobileContrastConfig = {
    id: 'action-menu-mobile-contrast',
    type: 'nav-only',
    activeId: 'contrast',
    navLinks: contrastNav,
    onExpand,
  };
  const actionMenuMobileContrast = await createActionMenuComponent(actionMenuMobileContrastConfig);
  mobileContainer.append(document.createElement('br'), actionMenuMobileContrast.element);

  const actionMenuMobileBlindnessConfig = {
    id: 'action-menu-mobile-blindness',
    type: 'nav-only',
    activeId: 'color-blindness',
    navLinks: blindnessNav,
    onExpand,
  };
  const mobileBlindness = await createActionMenuComponent(actionMenuMobileBlindnessConfig);
  mobileContainer.append(document.createElement('br'), mobileBlindness.element);

  const actionMenuControlsConfig = {
    id: 'action-menu-mobile-controls',
    type: 'controls-only',
    controls: [
      {
        id: 'undo',
        label: 'Undo',
      },
      {
        id: 'redo',
        label: 'Redo',
      },
      {
        id: 'generate-random',
        label: 'Generate Random',
      },
    ],
    onExpand,
  };
  const actionMenuControls = await createActionMenuComponent(actionMenuControlsConfig);
  mobileContainer.append(document.createElement('br'), actionMenuControls.element);
}
