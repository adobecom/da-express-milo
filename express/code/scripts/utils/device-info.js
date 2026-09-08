const UNKNOWN = 'Unknown';

function parseWindowsVersion(version) {
  switch (version) {
    case '10.0':
      return '10/11';
    case '6.3':
      return '8.1';
    case '6.2':
      return '8';
    case '6.1':
      return '7';
    case '6.0':
      return 'Vista';
    case '5.1':
      return 'XP';
    default:
      return version;
  }
}

function extractDeviceName(userAgent) {
  const match = userAgent.match(/\(([^)]+)\)/);
  if (match?.[1]) return match[1];
  return userAgent || UNKNOWN;
}

function getOsNameAndVersionFromUA(userAgent) {
  let match = userAgent.match(/Android\s+([0-9.]+)/i);
  if (match?.[1]) {
    return { osName: 'Android', osVersion: match[1] };
  }

  match = userAgent.match(/(iPhone|iPad|iPod).*OS\s([0-9_]+)/i);
  if (match?.[2]) {
    return { osName: 'iOS', osVersion: match[2].replace(/_/g, '.') };
  }

  match = userAgent.match(/Mac OS X\s([0-9_]+)/i);
  if (match?.[1]) {
    return { osName: 'macOS', osVersion: match[1].replace(/_/g, '.') };
  }

  match = userAgent.match(/Windows NT\s([0-9.]+)/i);
  if (match?.[1]) {
    return { osName: 'Windows', osVersion: parseWindowsVersion(match[1]) };
  }

  if (/Linux/i.test(userAgent)) {
    return { osName: 'Linux', osVersion: UNKNOWN };
  }

  return { osName: UNKNOWN, osVersion: UNKNOWN };
}

export async function getAccessCountry() {
  try {
    const response = await fetch('https://geo2.adobe.com/json/');
    if (!response.ok) return UNKNOWN;
    const payload = await response.json();
    return payload?.country || UNKNOWN;
  } catch {
    return UNKNOWN;
  }
}

export async function getDeviceInfo() {
  const userAgent = navigator?.userAgent || '';

  const result = {
    osName: UNKNOWN,
    osVersion: UNKNOWN,
    deviceName: extractDeviceName(userAgent),
    browserName: UNKNOWN,
    browserVersion: UNKNOWN,
  };

  try {
    const { osName, osVersion } = getOsNameAndVersionFromUA(userAgent);
    result.osName = osName;
    result.osVersion = osVersion;
  } catch {
    // Covers unexpected navigator/runtime failures.
  }

  return result;
}

export function generateGuid() {
  if (crypto?.randomUUID) return crypto.randomUUID();

  const chars = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
  return chars.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : ((random % 4) + 8);
    return value.toString(16);
  });
}
