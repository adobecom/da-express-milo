import { createSidePanel } from './side-panel/output/side-panel.js';

export default function decorate(block) {
  block.classList.add('loading');

  const grid = document.createElement('div');
  grid.className = 'font-generator-grid';

  const sideCol = document.createElement('div');
  sideCol.className = 'font-generator-col font-generator-col--side';
  sideCol.append(createSidePanel());

  const mainCol = document.createElement('div');
  mainCol.className = 'font-generator-col font-generator-col--main';

  const auxCol = document.createElement('div');
  auxCol.className = 'font-generator-col font-generator-col--aux';

  grid.append(sideCol, mainCol, auxCol);
  block.append(grid);
  block.classList.remove('loading');
}
