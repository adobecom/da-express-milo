import { getLibs } from '../../scripts/utils.js';

let createTag;

export default async function init(block) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  // block.classList.add('ax-grid-container');
  block.innerHTML = '';
  const eightThree = createTag('div', { class: 'ax-grid-container' });
  eightThree.append(createTag('div', { class: 'ax-grid-col-3 bar' }, '8*3'));
  eightThree.append(createTag('div', { class: 'ax-grid-col-3 bar' }, '8*3'));
  eightThree.append(createTag('div', { class: 'ax-grid-col-3 bar' }, '8*3'));
  eightThree.append(createTag('div', { class: 'ax-grid-col-3 bar' }, '8*3'));
  eightThree.append(createTag('div', { class: 'ax-grid-col-3 bar' }, '8*3'));
  eightThree.append(createTag('div', { class: 'ax-grid-col-3 bar' }, '8*3'));
  eightThree.append(createTag('div', { class: 'ax-grid-col-3 bar' }, '8*3'));
  eightThree.append(createTag('div', { class: 'ax-grid-col-3 bar' }, '8*3'));

  const twelveTwo = createTag('div', { class: 'ax-grid-container' });
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));
  twelveTwo.append(createTag('div', { class: 'ax-grid-col-2 bar' }, '12*2'));

  const sixFour = createTag('div', { class: 'ax-grid-container' });
  sixFour.append(createTag('div', { class: 'ax-grid-col-4 bar' }, '6*4'));
  sixFour.append(createTag('div', { class: 'ax-grid-col-4 bar' }, '6*4'));
  sixFour.append(createTag('div', { class: 'ax-grid-col-4 bar' }, '6*4'));
  sixFour.append(createTag('div', { class: 'ax-grid-col-4 bar' }, '6*4'));
  sixFour.append(createTag('div', { class: 'ax-grid-col-4 bar' }, '6*4'));
  sixFour.append(createTag('div', { class: 'ax-grid-col-4 bar' }, '6*4'));

  block.append(
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-1 bar' }, '1 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-2 bar' }, '2 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-3 bar' }, '3 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-4 bar' }, '4 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-5 bar' }, '5 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-6 bar' }, '6 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-7 bar' }, '7 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-8 bar' }, '8 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-9 bar' }, '9 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-10 bar' }, '10 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-11 bar' }, '11 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-12 bar' }, '12 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-13 bar' }, '13 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-14 bar' }, '14 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-15 bar' }, '15 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-16 bar' }, '16 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-17 bar' }, '17 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-18 bar' }, '18 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-19 bar' }, '19 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-20 bar' }, '20 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-21 bar' }, '21 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-22 bar' }, '22 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-23 bar' }, '23 col')),
    createTag('div', { class: 'ax-grid-container' }, createTag('div', { class: 'ax-grid-col-24 bar' }, '24 col')),
    eightThree,
    twelveTwo,
    sixFour,
  );
}
