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
