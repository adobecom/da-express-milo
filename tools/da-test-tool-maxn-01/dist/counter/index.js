/* eslint-disable import/no-unresolved */
import DA_SDK from 'https://da.live/nx/utils/sdk.js';
/* eslint-enable import/no-unresolved */
import { collectDocs } from '../shared/da-api.js';

const $status = document.getElementById('counter-status');
const $result = document.getElementById('counter-result');
const $form = document.getElementById('count-form');

async function init() {
  const { token } = await DA_SDK;

  $form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const path = document.getElementById('path-input').value.trim();
    if (!path) return;

    $form.querySelector('button').disabled = true;
    $result.textContent = '';
    $status.textContent = 'Traversing… 0 documents found';

    try {
      const docs = await collectDocs(path, token, (count) => {
        $status.textContent = `Traversing… ${count} document${count !== 1 ? 's' : ''} found`;
      });
      $status.textContent = '';
      $result.textContent = `${docs.length} document${docs.length !== 1 ? 's' : ''}`;
    } catch (err) {
      $status.textContent = `Error: ${err.message}`;
    } finally {
      $form.querySelector('button').disabled = false;
    }
  });
}

let started = false;
function activate() {
  if (started || location.hash !== '#counter') return;
  started = true;
  init();
}
activate();
window.addEventListener('hashchange', activate);
