import DA_SDK from 'https://da.live/nx/utils/sdk.js';

(async function init() {
  const { context, token, actions } = await DA_SDK;
  document.body.innerHTML = '<h1>Hello World</h1>';
}());
