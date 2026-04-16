export function getDefaultEmbed(url) {
  return `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${url.href}" style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;" allowfullscreen=""
      scrolling="no" allow="encrypted-media" title="Content from ${url.hostname}" loading="lazy">
    </iframe>
  </div>`;
}

function extractCCVData(html) {
  const marker = 'window.ccv$serverData = ';
  const start = html.indexOf(marker);
  if (start === -1) return null;
  const jsonStart = html.indexOf('{', start);
  if (jsonStart === -1) return null;
  let depth = 0;
  let i = jsonStart;
  while (i < html.length) {
    if (html[i] === '{') depth += 1;
    else if (html[i] === '}') {
      depth -= 1;
      if (depth === 0) break;
    }
    i += 1;
  }
  try {
    return JSON.parse(html.slice(jsonStart, i + 1));
  } catch {
    return null;
  }
}

export async function embedExpressVideo(url) {
  // Always use express.adobe.com — stageDomainsMap rewrites this to
  // stage.projectx.corp.adobe.com which shows a legacy Spark error view
  const prodUrl = new URL(url.href);
  prodUrl.hostname = 'express.adobe.com';

  try {
    const resp = await fetch(prodUrl.href);
    if (resp.ok) {
      const ccv = extractCCVData(await resp.text());
      if (ccv?.mp4URL) {
        const poster = ccv.posterframe ? ` poster="${ccv.posterframe}"` : '';
        return `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
          <video controls playsinline preload="none"${poster}
            style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
            oncontextmenu="return false" controlsList="nodownload">
            ${ccv.m3u8URL ? `<source src="${ccv.m3u8URL}" type="application/x-mpegURL">` : ''}
            <source src="${ccv.mp4URL}" type="video/mp4">
          </video>
        </div>`;
      }
    }
  } catch {
    // CORS blocks the fetch on stage — fall through to iframe with prod URL
  }

  return `<div style="left: 0; width: 100%; height: 0; position: relative; padding-bottom: 56.25%;">
    <iframe src="${prodUrl.href}"
      style="border: 0; top: 0; left: 0; width: 100%; height: 100%; position: absolute;"
      scrolling="no" allow="autoplay; encrypted-media; fullscreen"
      title="Adobe Express video" loading="lazy">
    </iframe>
  </div>`;
}

export function embedInstagram(url) {
  const location = window.location.href;
  const src = `${url.origin}${url.pathname}${url.pathname.charAt(url.pathname.length - 1) === '/' ? '' : '/'}embed/?cr=1&amp;v=13&amp;wp=1316&amp;rd=${location.endsWith('.html') ? location : `${location}.html`}`;
  const embedHTML = `<div style="width: 100%; position: relative; padding-bottom: 56.25%; display: flex; justify-content: center">
    <iframe class="instagram-media instagram-media-rendered" id="instagram-embed-0" src="${src}"
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
  'express.adobe.com': {
    type: 'express',
    embed: embedExpressVideo,
  },
  'stage.projectx.corp.adobe.com': {
    type: 'express',
    embed: embedExpressVideo,
  },
};

async function decorateBlockEmbeds(block) {
  const links = [...block.querySelectorAll('.embed a:not([href*="youtube.com"], [href*="vimeo.com"], [href*="twitter.com"])')];
  for (const a of links) {
    const url = new URL(a.href.replace(/\/$/, ''));
    const config = EMBEDS_CONFIG[url.hostname];
    let embedContent;
    if (config) {
      // eslint-disable-next-line no-await-in-loop
      embedContent = await config.embed(url);
      if (embedContent instanceof HTMLElement) {
        embedContent = embedContent.outerHTML;
      }
      block.innerHTML = embedContent;
      block.classList = `block embed embed-${config.type}`;
    } else {
      block.innerHTML = getDefaultEmbed(url);
      block.classList = `block embed embed-${getServer(url)}`;
    }
  }
}

export default async function decorate(block) {
  await decorateBlockEmbeds(block);
}
