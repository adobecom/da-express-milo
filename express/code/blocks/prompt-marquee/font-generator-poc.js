const CIRCLED_MAP = {
  A: '\u24B6', B: '\u24B7', C: '\u24B8', D: '\u24B9', E: '\u24BA',
  F: '\u24BB', G: '\u24BC', H: '\u24BD', I: '\u24BE', J: '\u24BF',
  K: '\u24C0', L: '\u24C1', M: '\u24C2', N: '\u24C3', O: '\u24C4',
  P: '\u24C5', Q: '\u24C6', R: '\u24C7', S: '\u24C8', T: '\u24C9',
  U: '\u24CA', V: '\u24CB', W: '\u24CC', X: '\u24CD', Y: '\u24CE',
  Z: '\u24CF',
  a: '\u24D0', b: '\u24D1', c: '\u24D2', d: '\u24D3', e: '\u24D4',
  f: '\u24D5', g: '\u24D6', h: '\u24D7', i: '\u24D8', j: '\u24D9',
  k: '\u24DA', l: '\u24DB', m: '\u24DC', n: '\u24DD', o: '\u24DE',
  p: '\u24DF', q: '\u24E0', r: '\u24E1', s: '\u24E2', t: '\u24E3',
  u: '\u24E4', v: '\u24E5', w: '\u24E6', x: '\u24E7', y: '\u24E8',
  z: '\u24E9',
  0: '\u24EA', 1: '\u2460', 2: '\u2461', 3: '\u2462', 4: '\u2463',
  5: '\u2464', 6: '\u2465', 7: '\u2466', 8: '\u2467', 9: '\u2468',
};

function transformText(input) {
  let result = '';
  for (const char of input) {
    result += CIRCLED_MAP[char] ?? char;
  }
  return result;
}

// eslint-disable-next-line import/prefer-default-export
export function appendFontGeneratorPOC(block, existingInput) {
  const wrapper = document.createElement('div');
  wrapper.className = 'font-gen-poc';

  const heading = document.createElement('h3');
  heading.textContent = 'Font Generator POC';

  const label = document.createElement('p');
  label.className = 'font-gen-label';
  label.textContent = 'Circled Style:';

  const preview = document.createElement('div');
  preview.className = 'font-gen-preview';

  const copyBtn = document.createElement('button');
  copyBtn.className = 'font-gen-copy';
  copyBtn.textContent = 'Copy';

  const previewRow = document.createElement('div');
  previewRow.className = 'font-gen-preview-row';
  previewRow.append(preview, copyBtn);

  existingInput.addEventListener('input', () => {
    preview.textContent = transformText(existingInput.value);
  });

  copyBtn.addEventListener('click', async () => {
    const text = preview.textContent;
    if (!text) return;
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1500);
  });

  wrapper.append(heading, label, previewRow);
  block.append(wrapper);
}
