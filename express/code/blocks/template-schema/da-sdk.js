const DA_API = 'https://admin.da.live';
const STORAGE_KEY = 'daas';

/**
 * Get auth token from storage
 * Checks sessionStorage first (SUSI flow), then localStorage (external auth)
 */
function getToken() {
  // Try sessionStorage first (SUSI flow)
  try {
    const sessionData = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '{}');
    if (sessionData.authToken) {
      return sessionData.authToken;
    }
  } catch (e) {
    console.warn('DaaS SDK: Error reading from sessionStorage:', e);
  }

  // Fall back to localStorage (external auth like existing IMS)
  try {
    const localData = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (localData.authToken) {
      return localData.authToken;
    }
  } catch (e) {
    console.warn('DaaS SDK: Error reading from localStorage:', e);
  }

  return null;
}

export async function postDoc(dest, html) {
  const token = getToken();
  if (!token) {
    console.error('DaaS: No auth token found for DA SDK');
    return { success: false, error: 'No auth token' };
  }

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

  try {
    const resp = await fetch(fullpath, opts);
    if (!resp.ok) {
      console.error(`DaaS: DA SDK postDoc failed with status ${resp.status}`);
      return { success: false, error: `HTTP ${resp.status}`, status: resp.status };
    }
    console.log('DaaS: Document posted successfully to', dest);
    return { success: true, status: resp.status };
  } catch (e) {
    console.error('DaaS: DA SDK postDoc error:', e);
    return { success: false, error: e.message };
  }
}

export async function getDoc(dest) {
  const token = getToken();
  if (!token) {
    console.warn('DaaS: No auth token found for DA SDK');
    return null;
  }

  const headers = { Authorization: `Bearer ${token}` };
  const fullpath = `${DA_API}/source${dest}.html`;
  const opts = { headers };

  try {
    const resp = await fetch(fullpath, opts);
    if (!resp.ok) {
      console.warn(`DaaS: DA SDK getDoc failed with status ${resp.status}`);
      return null;
    }
    return resp.text();
  } catch (e) {
    console.error('DaaS: DA SDK getDoc error:', e);
    return null;
  }
}
