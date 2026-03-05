const TOKEN_LINK_ID = 'color-tokens-css';

export function loadColorTokens() {
  if (document.getElementById(TOKEN_LINK_ID)) return;
  const link = document.createElement('link');
  link.id = TOKEN_LINK_ID;
  link.rel = 'stylesheet';
  link.href = '/express/code/scripts/color-shared/color-tokens.css';
  document.head.appendChild(link);
}
