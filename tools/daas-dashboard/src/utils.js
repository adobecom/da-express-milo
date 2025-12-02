/* eslint-disable operator-linebreak */
export const DA_API = 'https://admin.da.live';
export const ORG = 'adobecom';
export const REPO = 'da-express-milo';
export const ROOT = `/${ORG}/${REPO}/drafts/hackathon`;
export const DATA_PATH = `${ROOT}/pages-data.json`;

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

export async function postDoc(dest, html) {
  // Safety check: only allow saving to ROOT (hackathon folder)
  if (!dest.startsWith(ROOT)) {
    throw new Error(`Safety check: Can only save documents under ${ROOT} paths`);
  }
  
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const blob = new Blob([html], { type: 'text/html' });
  const body = new FormData();
  body.append('data', blob);
  const fullpath = `${DA_API}/source${dest}.html`;
  const opts = {
    headers,
    method: 'POST',
    body,
  };
  const resp = await fetch(fullpath, opts);
  console.log(resp.status);
  return resp;
}

export function generateHtmlFromTemplate(templateHtml, fieldValues) {
  // Parse the template HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(templateHtml, 'text/html');
  
  // Find all elements with data-milo-template attributes
  const templatedElements = doc.querySelectorAll('[data-milo-template]');
  
  templatedElements.forEach((element) => {
    const templateKey = element.getAttribute('data-milo-template');
    
    // Extract the field key from the template key (remove the trailing -1, -2, etc.)
    const fieldKey = templateKey.replace(/-\d+$/, '');
    
    // Special case: combined primary-color and secondary-color
    if (fieldKey === 'primary-colorsecondary-color') {
      const primaryColor = fieldValues['primary-color'] || '';
      const secondaryColor = fieldValues['secondary-color'] || '';
      element.textContent = `${primaryColor},${secondaryColor}`;
      return;
    }
    
    // Check if we have a value for this field
    if (fieldValues[fieldKey] !== undefined) {
      const value = fieldValues[fieldKey];
      
      // Special handling for different elements
      if (element.tagName === 'H1' || element.tagName === 'H3' || element.tagName === 'P') {
        // For headings and paragraphs, replace text content
        element.textContent = value;
      } else if (element.tagName === 'A') {
        // For links, replace text content
        element.textContent = value;
        // Also update href if we have a link field
        if (fieldKey === 'marquee-cta-text' && fieldValues['marquee-cta-link']) {
          element.setAttribute('href', fieldValues['marquee-cta-link']);
        }
      } else if (element.tagName === 'DIV') {
        // For divs, replace inner HTML
        element.innerHTML = value;
      } else {
        // Default: replace text content
        element.textContent = value;
      }
    }
  });
  
  // Return the serialized HTML
  return doc.documentElement.outerHTML;
}

export async function loadPagesData() {
  try {
    const token = getToken();
    const headers = { Authorization: `Bearer ${token}` };
    const url = `${DA_API}/source${DATA_PATH}`;
    const resp = await fetch(url, { method: 'GET', headers });
    
    if (!resp.ok) {
      console.warn('Could not load pages data, using empty data');
      return { pages: [], fieldValues: {} };
    }
    
    return resp.json();
  } catch (e) {
    console.error('Error loading pages data:', e);
    return { pages: [], fieldValues: {} };
  }
}

export async function savePagesData(data) {
  const token = getToken();
  const headers = { Authorization: `Bearer ${token}` };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const body = new FormData();
  body.append('data', blob);
  const fullpath = `${DA_API}/source${DATA_PATH}`;
  const opts = {
    headers,
    method: 'POST',
    body,
  };
  
  console.log('📝 Saving pages data to:', fullpath);
  console.log('📊 Data being saved:', data);
  
  const resp = await fetch(fullpath, opts);
  
  if (resp.ok) {
    console.log('✅ Saved pages data successfully:', resp.status);
  } else {
    console.error('❌ Failed to save pages data:', resp.status, resp.statusText);
    const errorText = await resp.text();
    console.error('Error details:', errorText);
  }
  
  return resp;
}
