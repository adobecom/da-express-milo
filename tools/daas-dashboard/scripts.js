// eslint-disable-next-line import/no-unresolved
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
import { ROOT, getDocs, body2Row, setToken } from './utils.js';

const { token } = await DA_SDK;
setToken(token);

async function init() {
  const main = document.body.querySelector('main');
}

init().catch(console.error);
