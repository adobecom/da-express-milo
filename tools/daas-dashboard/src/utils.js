/* eslint-disable operator-linebreak */
export const DA_API = 'https://admin.da.live';
export const ORG = 'adobecom';
export const REPO = 'da-express-milo';
export const ROOT = `/${ORG}/${REPO}/drafts/hackathon`;

export const [getToken, setToken] = (() => {
  const config = {};
  return [
    () => config.token,
    (t) => {
      config.token = t;
    },
  ];
})();

export function isDir(file) {
  return !file?.ext;
}

export function isDoc(file) {
  return file?.ext === 'html';
}

export async function throwFetchErr(res) {
  const errorText = await res.text();
  throw new Error(`${res.status} - ${res.statusText}: ${errorText}`);
}

export async function ls(dir) {
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const url = `${DA_API}/list${dir}`;
  console.log(DA_API, dir, url);
  const resp = await fetch(url, { method: 'GET', headers });
  if (!resp.ok) {
    throwFetchErr(resp);
  }
  return resp.json();
}

export async function cat(file) {
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const url = `${DA_API}/source${file}`;
  const resp = await fetch(url, { method: 'GET', headers });
  if (!resp.ok) {
    throwFetchErr(resp);
  }
  if (/\.html$/.exec(file)) {
    return resp.text();
  }
  return resp.json();
}

export function parseBodyText(bodyText) {
  const parser = new DOMParser();
  return parser.parseFromString(bodyText, 'text/html');
}

export function createTag(tag, attributes, html, options = {}) {
  const el = document.createElement(tag);
  if (html) {
    if (
      html instanceof HTMLElement
      || html instanceof SVGElement
      || html instanceof DocumentFragment
    ) {
      el.append(html);
    } else if (Array.isArray(html)) {
      el.append(...html);
    } else {
      el.insertAdjacentHTML('beforeend', html);
    }
  }
  if (attributes) {
    Object.entries(attributes).forEach(([key, val]) => {
      el.setAttribute(key, val);
    });
  }
  options.parent?.append(el);
  return el;
}

export function block2Table(block) {
  const [blockName, ...variants] = block.className.split(/\s+/);
  let maxColCnt = 1;
  const rows = [...block.querySelectorAll(':scope > div')].map((rowDiv) => {
    const row = createTag('tr');
    const cols = [...rowDiv.querySelectorAll(':scope > div')].map((col) => {
      const cell = createTag('td');
      cell.append(col);
      return cell;
    });
    maxColCnt = Math.max(maxColCnt, cols.length);
    row.append(...cols);
    return row;
  });
  const table = createTag('table', { class: 'block-table' });
  const blockTitle =
    `${blockName}${variants.length ? ` (${variants.join(', ')})` : ''}` || 'unknown';
  const tableBody = createTag('tbody', {}, createTag('th', { colspan: maxColCnt }, blockTitle));
  tableBody.append(...rows);
  const colGroup = createTag('colgroup');
  colGroup.append(...Array.from({ length: maxColCnt }).map(() => createTag('col')));
  table.append(colGroup, tableBody);
  return table;
}

export function body2Row({ text, path }) {
  const body = parseBodyText(text);
  const main = body.querySelector('main');
  const sections = main.querySelectorAll(':scope > div');
  const editorPath = `https://da.live/edit#${path}`;
  const row = createTag(
    'div',
    { class: 'row' },
    createTag(
      'div',
      { class: 'path' },
      createTag('a', { href: editorPath, class: 'editor-link', target: '_blank' }, path),
    ),
  );
  sections.forEach((section, i) => {
    row.append(createTag('div', { class: 'node-wrapper section-start' }, `S${i + 1}=>`));
    [...section.children].forEach((node) => {
      const nodeWrapper = createTag('div', { class: 'node-wrapper' });
      if (node.tagName === 'DIV') {
        nodeWrapper.append(block2Table(node));
      } else {
        nodeWrapper.append(node);
      }
      row.append(nodeWrapper);
    });
  });
  return row;
}

export async function getDocs(dir) {
  try {
    const srcs = [];
    const reqs = [];
    const dirStack = [dir];
    while (dirStack.length) {
      const currDir = dirStack.pop();
      const files = await ls(currDir);
      const docs = files.filter((file) => isDoc(file));
      const dirs = files.filter((file) => isDir(file));
      docs.forEach((doc) => {
        reqs.push(cat(doc.path));
        srcs.push(doc.path);
      });
      dirs.forEach(({ path }) => dirStack.push(path));
    }
    const docContent = await Promise.all(reqs);
    const data = srcs.map((path, index) => ({ path, text: docContent[index] }));
    data.sort((d1, d2) => d1.path.localeCompare(d2.path));
    return data;
  } catch (e) {
    console.log(e);
    return [];
  }
}
