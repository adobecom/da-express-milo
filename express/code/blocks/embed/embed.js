export function getDefaultEmbed(url) {
  return `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;
}

export function embedInstagram(url) {
  const location = window.location.href;
  const src = `${url.origin}${url.pathname}${url.pathname.charAt(url.pathname.length - 1) === '/' ? '' : '/'}embed/?cr=1&amp;v=13&amp;wp=1316&amp;rd=${location.endsWith('.html') ? location : `${location}.html`}`;
  const embedHTML = `<div style="width: 100%; position: relative; padding-bottom: 56.25%; display: flex; justify-content: center">
    <iframe class="instagram-media instagram-media-rendered" id="instagram-embed-0" src="${src}" title="${url.hostname}"
      allowtransparency="true" allowfullscreen="true" frameborder="0" height="530" style="background: white; border-radius: 3px; border: 1px solid rgb(219, 219, 219);
      box-shadow: none; display: block;">
    </iframe>
  </div>`;
  return embedHTML;
}

// 'open.spotify.com' returns 'spotify'
function getServer(url) {
  const l = url.hostname.lastIndexOf('.');
  return url.hostname.substring(url.hostname.lastIndexOf('.', l - 1) + 1, l);
}

const EMBEDS_CONFIG = {
  'www.instagram.com': {
    type: '',
    embed: embedInstagram,
  },
};

function decorateBlockEmbeds(block) {
  block.querySelectorAll('.embed a:not([href*="youtube.com"], [href*="vimeo.com"], [href*="twitter.com"])').forEach((a) => {
    const url = new URL(a.href.replace(/\/$/, ''));

    const config = EMBEDS_CONFIG[url.hostname];

    let embedContent;
    if (config) {
      embedContent = config.embed(url);
      if (embedContent instanceof HTMLElement) {
        embedContent = embedContent.outerHTML;
      }
      block.innerHTML = embedContent;
      block.classList = `block embed embed-${config.type}`;
    } else {
      block.innerHTML = getDefaultEmbed(url);
      block.classList = `block embed embed-${getServer(url)}`;
    }
  });
}

export default function decorate(block) {
  decorateBlockEmbeds(block);
}
