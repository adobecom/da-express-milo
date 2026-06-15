const BASE_PATH = '/express/code/blocks/font-generator/side-panel';

const CSS_DEPS = [
  `${BASE_PATH}/globals.css`,
  `${BASE_PATH}/styleguide.css`,
  `${BASE_PATH}/styles.css`,
];

function injectStyles() {
  CSS_DEPS.forEach((href) => {
    if (document.querySelector(`link[href="${href}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
  });
}

const template = document.createElement('template');
template.innerHTML = `<div class="font-generator-side">
  <div class="text-field">
    <div class="text-area-l-in-line">
      <div class="field">
        <div class="div-wrapper">
          <div class="div-wrapper">
            <p class="label">Type the preview text you want to get started...</p>
          </div>
        </div>
      </div>
      <div class="counter-expander">
        <div class="character-count">40/200</div>
        <div class="resize-handle">
          <img class="vector" src="${BASE_PATH}/img/vector.svg" alt="" aria-hidden="true" />
        </div>
      </div>
      <div class="suggestions-bar">
        <div class="text-wrapper">Try these:</div>
        <div class="tags-fade">
          <div class="tags-wrap">
            <div class="tag-pills"><div class="tag-m"><div class="content"><div class="text-container"><p class="div">The quick brown fox jumps over the lazy dog</p></div></div></div></div>
            <div class="tag-pills"><div class="tag-m"><div class="content"><div class="text-container"><div class="div">ABCDEFGHIJKLMNOPQRSTUVWXYZ</div></div></div></div></div>
            <div class="tag-pills"><div class="tag-m"><div class="content"><div class="text-container"><p class="div">Realigned equestrian fez bewilders picky monarch</p></div></div></div></div>
            <div class="tag-pills"><div class="tag-m"><div class="content"><div class="text-container"><p class="div">Roger, hungry: ate 236 peaches &amp; cantaloupes in 1904!</p></div></div></div></div>
            <div class="tag-pills"><div class="tag-m"><div class="content"><div class="text-container"><p class="div">Voix ambigu&#235; d&#39;un c&#339;ur qui au z&#233;phyr pr&#233;f&#232;re les jattes de kiwi</p></div></div></div></div>
            <div class="tag-pills"><div class="tag-m"><div class="content"><div class="text-container"><p class="div">Victor jagt zw&#246;lf Boxk&#228;mpfer quer &#252;ber den gro&#223;en Sylter Deich</p></div></div></div></div>
            <div class="tag-pills"><div class="tag-m"><div class="content"><div class="text-container"><p class="div">Quiere la boca exhausta vid, kiwi, pi&#241;a y fugaz jam&#243;n</p></div></div></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="div-2">
    <div class="categories-accordian">
      <div class="div-2">
        <div class="content-stack">
          <div class="spacing"></div>
          <div class="chevron"><img class="s-chevron" src="/express/code/icons/chevron.svg" alt="" aria-hidden="true" /></div>
          <div class="text-stack"><div class="title">Categories</div></div>
          <div class="spacing"></div>
        </div>
        <div class="asset-container">
          <div class="descoped-categories">
            <div class="font-category"><div class="container"><div class="label-wrapper"><div class="label-2" data-theme-mode="light">&#119840;&#119845;&#119845;</div></div></div></div>
            <div class="container-wrapper"><div class="text-container-wrapper"><div class="text-container-2"><div class="label-3">&#9400;&#9416;&#9416;&#9421;</div></div></div></div>
            <div class="font-category-2"><div class="text-container-wrapper"><div class="text-container-2"><div class="label-3">&#820;G&#820;&#820;l&#820;&#820;i&#820;&#820;t&#820;&#820;c&#820;&#820;h&#820;</div></div></div></div>
            <div class="font-category-3"><div class="text-container-wrapper"><div class="text-container-2"><div class="label-4">&#10074;&#9608;&#9552;&#9552;Symbol&#9552;&#9552;&#9608;&#10074;</div></div></div></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="sticky-promo">
    <div class="font-icon-container">
      <img class="icon-group" src="${BASE_PATH}/icon-example.svg" alt="" aria-hidden="true" />
      <div class="title-2">Looking for more fonts?</div>
    </div>
    <button class="button" data-buttons-mode="m">
      <div class="text-frame"><div class="text">Get Adobe Express Free</div></div>
    </button>
  </div>
</div>`;

export function createSidePanel() {
  injectStyles();
  return template.content.firstElementChild.cloneNode(true);
}
