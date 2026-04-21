/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';

const DA_ADMIN = 'https://admin.da.live';
const TARGET_DIR = '/adobecom/da-express-milo/express/uk';

async function ls(path, token) {
  const resp = await fetch(`${DA_ADMIN}/list${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
  return resp.json();
}

function isDir(file) {
  return !file.ext;
}

function render(items, path) {
  const rows = items.map((item) => {
    const type = isDir(item) ? 'dir' : item.ext;
    return `<li>[${type}] ${item.name}</li>`;
  }).join('');
  document.body.innerHTML = `<h2>${path}</h2><ul>${rows}</ul>`;
}

(async function init() {
  const { token } = await DA_SDK;
  document.body.innerHTML = '<p>Loading…</p>';
  try {
    const items = await ls(TARGET_DIR, token);
    render(items, TARGET_DIR);
  } catch (err) {
    document.body.innerHTML = `<p>Error: ${err.message}</p>`;
  }
}());
