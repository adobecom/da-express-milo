const loadedStyles = new Set();

export default function loadCSS(href) {
  if (loadedStyles.has(href)) return Promise.resolve();
  loadedStyles.add(href);
  return new Promise((resolve, reject) => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = () => {
      loadedStyles.delete(href);
      window.lana?.log(`Failed to load CSS: ${href}`, { tags: 'color-shared,css' });
      reject(new Error(`CSS load failed: ${href}`));
    };
    document.head.appendChild(link);
  });
}
