// grid positions for 6 bento cards (col, row) — explicit to prevent DOM-order issues
const GRID_POSITIONS = [
  { col: '1 / span 2', row: '1' }, // Social media
  { col: '3', row: '1' }, // Games
  { col: '4', row: '1' }, // Design
  { col: '1', row: '2' }, // Messaging
  { col: '2', row: '2' }, // Ads
  { col: '3 / span 2', row: '2' }, // Documents
];

export default async function decorate(block) {
  const rows = [...block.children];
  const [headerRow, ...cardRows] = rows;

  // Row 0 is a single merged cell containing: H2, body para, CTA link
  const headerCell = headerRow.children[0];
  const heading = headerCell.querySelector('h2, h3, h4');
  const anchor = headerCell.querySelector('a');
  // Body para: any <p> that doesn't contain the CTA anchor
  const bodyPara = [...headerCell.querySelectorAll('p')].find((p) => !p.querySelector('a'));

  // Text container: heading+body group (left, flex-1) + CTA button (right, flex-end)
  const textContainer = document.createElement('div');
  textContainer.className = 'font-bento-text';

  const textGroup = document.createElement('div');
  textGroup.className = 'font-bento-text-group';
  if (heading) textGroup.append(heading);
  if (bodyPara) textGroup.append(bodyPara);
  textContainer.append(textGroup);

  if (anchor) {
    anchor.classList.add('button', 'accent');
    const wrapper = document.createElement('p');
    wrapper.className = 'button-container';
    wrapper.append(anchor);
    textContainer.append(wrapper);
  }

  // Bento grid
  const grid = document.createElement('div');
  grid.className = 'font-bento-grid';

  cardRows.slice(0, GRID_POSITIONS.length).forEach((row, i) => {
    const [titleCell, imageCell] = [...row.children];
    const pos = GRID_POSITIONS[i];

    const card = document.createElement('div');
    card.className = 'font-bento-card';
    if (i === 0 || i === 5) card.classList.add('wide');
    card.style.gridColumn = pos.col;
    card.style.gridRow = pos.row;

    const title = document.createElement('p');
    title.className = 'font-bento-card-title';
    title.textContent = titleCell ? titleCell.textContent.trim() : '';

    const imageWrapper = document.createElement('div');
    imageWrapper.className = 'font-bento-card-image';
    const picture = imageCell?.querySelector('picture');
    if (picture) imageWrapper.append(picture);

    card.append(title, imageWrapper);
    grid.append(card);
  });

  block.innerHTML = '';
  block.append(textContainer, grid);
}
