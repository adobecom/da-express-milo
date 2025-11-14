export default function init(el) {
  const [content, headingCfg, backgroundCfg] = [...el.querySelectorAll(':scope > div')];
  content.classList.add('content');
  [...content.querySelectorAll('a')].forEach((a) => {
    a.classList.remove('button', 'reverse');
    a.classList.add('con-button', 'outline');
    content.append(a);
  });
  if (headingCfg) {
    const setting = headingCfg.textContent;
    [...content.querySelectorAll('strong')].forEach((strong) => {
      if (/linear-gradient/i.test(setting)) {
        strong.style.backgroundImage = setting.trim();
        strong.style.webkitBackgroundClip = 'text';
        strong.style.backgroundClip = 'text';
        strong.style.color = 'transparent';
      } else {
        strong.style.color = setting;
      }
    });
    headingCfg?.remove();
  }
  if (backgroundCfg?.textContent) {
    el.style.background = backgroundCfg.textContent;
    backgroundCfg?.remove();
  }
  return el;
}
