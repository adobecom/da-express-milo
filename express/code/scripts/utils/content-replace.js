import { titleCase } from './string.js';
import { getLibs, yieldToMain } from '../utils.js';

let getConfig; let getMetadata;
let replaceKey;

const HtmlSanitizer = new (function handSanitizer() {
  const tagWL = {
    A: true,
    ABBR: true,
    B: true,
    BLOCKQUOTE: true,
    BODY: true,
    BR: true,
    CENTER: true,
    CODE: true,
    DD: true,
    DIV: true,
    DL: true,
    DT: true,
    EM: true,
    FONT: true,
    H1: true,
    H2: true,
    H3: true,
    H4: true,
    H5: true,
    H6: true,
    HR: true,
    I: true,
    IMG: true,
    LABEL: true,
    LI: true,
    OL: true,
    P: true,
    PRE: true,
    PICTURE: true,
    SMALL: true,
    SOURCE: true,
    SPAN: true,
    STRONG: true,
    SUB: true,
    SUP: true,
    TABLE: true,
    TBODY: true,
    TR: true,
    TD: true,
    TH: true,
    THEAD: true,
    UL: true,
    U: true,
    VIDEO: true,
  };

  const contentTagWL = {
    FORM: true,
    'GOOGLE-SHEETS-HTML-ORIGIN': true,
  }; // tags that will be converted to DIVs

  const attributeWL = {
    align: true,
    alt: true,
    color: true,
    controls: true,
    height: true,
    href: true,
    id: true,
    src: true,
    srcset: true,
    style: true,
    target: true,
    title: true,
    type: true,
    width: true,
    class: true,
    loading: true,
    media: true,
    'data-align': true,
    'data-valign': true,
  };

  const cssWL = {
    'background-color': true,
    color: true,
    'font-size': true,
    'font-weight': true,
    'text-align': true,
    'text-decoration': true,
    display: true,
    width: true,
  };

  const schemaWL = ['http:', 'https:', 'data:', 'm-files:', 'file:', 'ftp:', 'mailto:', 'pw:']; // which "protocols" are allowed in "href", "src" etc

  const uriAttributes = {
    href: true,
    action: true,
    src: true,
  };

  function startsWithAny(str, substrings) {
    for (let i = 0; i < substrings.length; i += 1) {
      if (str.indexOf(substrings[i]) === 0) {
        return true;
      }
    }
    return false;
  }

  const parser = new DOMParser();

  this.SanitizeHtml = function sanitize(inputValue, extraSelector) {
    let input = inputValue.trim();
    if (input === '') return ''; // to save performance

    // firefox "bogus node" workaround for wysiwyg's
    if (input === '<br>') return '';

    if (input.indexOf('<body') === -1) input = `<body>${input}</body>`; // add "body" otherwise some tags are skipped, like <style>

    const doc = parser.parseFromString(input, 'text/html');

    // DOM clobbering check (damn you firefox)
    if (doc.body.tagName !== 'BODY') doc.body.remove();
    if (typeof doc.createElement !== 'function') doc.createElement.remove();

    function makeSanitizedCopy(node) {
      let newNode;
      if (node.nodeType === Node.TEXT_NODE) {
        newNode = node.cloneNode(true);
      } else if (node.nodeType === Node.ELEMENT_NODE && (tagWL[node.tagName]
                || contentTagWL[node.tagName]
                || (extraSelector && node.matches(extraSelector)))) { // is tag allowed?
        if (contentTagWL[node.tagName]) {
          newNode = doc.createElement('DIV'); // convert to DIV
        } else {
          newNode = doc.createElement(node.tagName);
        }

        for (let i = 0; i < node.attributes.length; i += 1) {
          const attr = node.attributes[i];
          if (attributeWL[attr.name.toLowerCase()]) {
            if (attr.name === 'style') {
              for (let s = 0; s < node.style.length; s += 1) {
                const styleName = node.style[s];
                if (cssWL[styleName]) {
                  newNode.style.setProperty(styleName, node.style.getPropertyValue(styleName));
                }
              }
            } else {
              if (uriAttributes[attr.name]) {
                // eslint-disable-next-line no-continue
                if (attr.value.indexOf(':') > -1 && !startsWithAny(attr.value, schemaWL)) continue;
              }
              newNode.setAttribute(attr.name, attr.value);
            }
          }
        }
        for (let i = 0; i < node.childNodes.length; i += 1) {
          const subCopy = makeSanitizedCopy(node.childNodes[i]);
          newNode.appendChild(subCopy);
        }

        // remove useless empty spans (lots of those when pasting from MS Outlook)
        if ((newNode.tagName === 'SPAN' || newNode.tagName === 'B' || newNode.tagName === 'I' || newNode.tagName === 'U')
                    && newNode.innerHTML.trim() === '') {
          return doc.createDocumentFragment();
        }
      } else {
        newNode = doc.createDocumentFragment();
      }
      return newNode;
    }

    const resultElement = makeSanitizedCopy(doc.body);

    return resultElement.innerHTML
      .replace(/<br[^>]*>(\S)/g, '<br>\n$1')
      .replace(/div><div/g, 'div>\n<div'); // replace is just for cleaner code
  };

  this.AllowedTags = tagWL;
  this.AllowedAttributes = attributeWL;
  this.AllowedCssStyles = cssWL;
  this.AllowedSchemas = schemaWL;
})();

async function replaceDefaultPlaceholders(block, components) {
  block.innerHTML = block.innerHTML.replaceAll('https://www.adobe.com/express/templates/default-create-link', components.link);
  if (!components.tasks) {
    const startFromScratch = await replaceKey('start-from-scratch', getConfig());
    block.innerHTML = block.innerHTML.replaceAll('default-create-link-text', startFromScratch || '');
  } else {
    block.innerHTML = block.innerHTML.replaceAll('default-create-link-text', getMetadata('create-text') || '');
  }
}

async function getReplacementsFromSearch() {
  // FIXME: tasks and tasksx split to be removed after mobile GA
  // eslint-disable-next-line max-len
  const params = new Proxy(new URLSearchParams(window.location.search), { get: (searchParams, prop) => searchParams.get(prop) });
  const {
    tasks,
    tasksx,
    phformat,
    topics,
    q,
  } = params;
  if (!tasks && !phformat) {
    return null;
  }
  const taskCategories = await replaceKey('task-categories', getConfig());
  const xTaskCategories = await replaceKey('x-task-categories', getConfig());
  const categories = JSON.parse(taskCategories);
  const xCategories = JSON.parse(xTaskCategories);
  if (!categories) {
    return null;
  }

  const exp = /['"<>?.;{}]/gm;
  const sanitizedTasks = tasks?.match(exp) ? '' : tasks;
  const sanitizedTasksx = tasksx?.match(exp) ? '' : tasksx;
  const sanitizedTopics = topics?.match(exp) ? '' : topics;
  const sanitizedQuery = q?.match(exp) ? '' : q;

  const tasksPair = Object.entries(categories).find((cat) => cat[1] === sanitizedTasks);
  const xTasksPair = Object.entries(xCategories).find((cat) => cat[1] === sanitizedTasksx);

  let translatedTasks = xTasksPair?.[1] ? xTasksPair[0].toLowerCase() : sanitizedTasksx;
  if (!translatedTasks) {
    translatedTasks = tasksPair?.[1] ? tasksPair[0].toLowerCase() : sanitizedTasks;
  }
  return {
    '{{queryTasks}}': sanitizedTasks || '',
    '{{QueryTasks}}': titleCase(sanitizedTasks || ''),
    '{{queryTasksX}}': sanitizedTasksx || '',
    '{{translatedTasks}}': translatedTasks || '',
    '{{TranslatedTasks}}': titleCase(translatedTasks || ''),
    '{{placeholderRatio}}': phformat || '',
    '{{QueryTopics}}': titleCase(sanitizedTopics || ''),
    '{{queryTopics}}': sanitizedTopics || '',
    '{{query}}': sanitizedQuery || '',
  };
}

const bladeRegex = /\{\{[a-zA-Z_-]+\}\}/g;

function replaceBladesInStr(str, replacements) {
  if (!replacements) return str;
  return str.replaceAll(bladeRegex, (match) => {
    if (match in replacements) {
      return replacements[match];
    }
    return match;
  });
}

async function updateMetadataForTemplates() {
  if (!['yes', 'true', 'on', 'Y'].includes(getMetadata('template-search-page'))) {
    return;
  }
  const head = document.querySelector('head');
  if (head) {
    const replacements = await getReplacementsFromSearch();
    if (!replacements) return;
    const title = head.getElementsByTagName('title')[0];
    title.innerText = replaceBladesInStr(title.innerText, replacements);
    [...head.getElementsByTagName('meta')].forEach((meta) => {
      meta.setAttribute('content', replaceBladesInStr(meta.getAttribute('content'), replacements));
    });
  }
}

const ignoredMeta = [
  'serp-content-type',
  'description',
  'primaryproductname',
  'theme',
  'show-free-plan',
  'sheet-powered',
  'viewport',
];

async function sanitizeMeta(meta) {
  if (meta.property || meta.name.includes(':') || ignoredMeta.includes(meta.name)) return;
  await yieldToMain();
  meta.content = HtmlSanitizer.SanitizeHtml(meta.content);
}

// metadata -> dom blades
async function autoUpdatePage(main) {
  const wl = ['{{heading_placeholder}}', '{{type}}', '{{quantity}}', '{{prompt-text}}'];
  // FIXME: deprecate wl
  if (!main) return;

  const regex = /\{\{([a-zA-Z0-9_-]+)}}/g;

  const metaTags = document.head.querySelectorAll('meta');

  await Promise.all(Array.from(metaTags).map((meta) => sanitizeMeta(meta)));

  main.innerHTML = main.innerHTML.replaceAll(regex, (match, p1) => {
    if (!wl.includes(match.toLowerCase())) {
      return getMetadata(p1) ?? '';
    }
    return match;
  });

  // handle link replacement on sheet-powered pages
  main.querySelectorAll('a[href*="#"]').forEach((a) => {
    try {
      let url = new URL(a.href);
      if (getMetadata(url.hash.replace('#', ''))) {
        a.href = getMetadata(url.hash.replace('#', ''));
        url = new URL(a.href);
      }
    } catch (error) {
      window.lana?.log(`Error while attempting to replace link ${a.href}: ${error?.message || error?.detail || error}`, { tags: 'utils, content-replace, autoUpdatePage', errorType: 'e', severity: 'error', sampleRate: '1' });
    }
  });
}

// cleanup remaining dom blades
async function updateNonBladeContent(main) {
  const heroAnimation = main.querySelector('.hero-animation.wide');
  const templateList = main.querySelector('.template-list.fullwidth.apipowered');
  const templateX = main.querySelector('.template-x');
  const browseByCat = main.querySelector('.browse-by-category');
  const seoNav = main.querySelector('.seo-nav');
  if (heroAnimation) {
    if (getMetadata('hero-title')) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template title', getMetadata('hero-title'));
    }

    if (getMetadata('hero-text')) {
      heroAnimation.innerHTML = heroAnimation.innerHTML.replace('Default template text', getMetadata('hero-text'));
    }
  }

  if (templateList) {
    await replaceDefaultPlaceholders(templateList, {
      link: getMetadata('create-link') || '/',
      tasks: getMetadata('tasks'),
    });
  }

  if (templateX) {
    await replaceDefaultPlaceholders(templateX, {
      link: getMetadata(`create-link-${document.body.dataset.device}`) || getMetadata('create-link-x') || getMetadata('create-link') || '/',
      tasks: getMetadata('tasks-x'),
    });
  }

  if (seoNav) {
    if (getMetadata('top-templates-title')) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates title', getMetadata('top-templates-title'));
    }

    if (getMetadata('top-templates-text')) {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates text', getMetadata('top-templates-text'));
    } else {
      seoNav.innerHTML = seoNav.innerHTML.replace('Default top templates text', '');
    }
  }

  if (browseByCat && !['yes', 'true', 'on', 'Y'].includes(getMetadata('show-browse-by-category'))) {
    browseByCat.remove();
  }
}

async function validatePage() {
  const { env } = getConfig();
  const title = document.querySelector('title');

  const path = window.location.pathname.replace(`${getConfig().locale.prefix}/express/`, '');
  const pageNotFound = (env && env.name === 'prod' && getMetadata('live') === 'N') || (title && title.innerText.match(/{{(.*?)}}/));

  if (pageNotFound && !!getConfig().locale.prefix) {
    window.location.replace(`/express/${path}`);
  } else if (pageNotFound || (env && env.name === 'prod' && window.location.pathname.endsWith('/express/templates/default'))) {
    const errorPage = await fetch('/express/404');
    const html = await errorPage.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const newHTMLContent = doc.documentElement.outerHTML;
    document.open();
    document.write(newHTMLContent);
    document.close();
  }
}

export default async function replaceContent(main) {
  await Promise.all([import(`${getLibs()}/utils/utils.js`), import(`${getLibs()}/features/placeholders.js`)]).then(([utils, placeholdersMod]) => {
    ({ getConfig, getMetadata } = utils);
    ({ replaceKey } = placeholdersMod);
  });
  await updateMetadataForTemplates();
  await autoUpdatePage(main);
  await updateNonBladeContent(main);
  validatePage();
}
