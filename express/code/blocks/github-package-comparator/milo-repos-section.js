const MILO_REPOS = [
  'milo-college',
  'events-milo',
  'dme-partners',
  'da-bacom',
  'da-cc-sandbox',
  'moderation',
  'da-express-milo',
  'da-dx-partners',
  'milo-starter',
  'aso',
  'education',
  'da-marketo',
  'da-gwp-playground',
  'express-milo',
  'upp',
  'stock',
  'blog',
  'ecc-milo',
  'event-libs',
  'bacom',
  'homepage',
  'homepage-graybox',
  'exchange-partners',
  'homepage-pink',
  'da-playground',
  'da-test-helpx-internal',
  'da-helpx-gem',
  'da-events',
  'da-homepage',
  'devliven',
  'bacom-graybox',
  'da-bacom-lingo',
  'da-help',
  'da-events-pink',
  'da-events-blue',
  'dxi-events',
  'bacom-pink',
  'govern-edge',
  'da-events-test',
  'franklin-wine',
  'community',
  'fedpub',
  'abpdocs',
  'college-pink',
  'milo-college-pink',
  'gwp-playground',
  'cxe-library',
  'students',
  'whats-next',
  'da-bacom-pink',
  'da-bacom-graybox',
  'firefly',
  'release',
  'security-blog',
  'gem',
  't1-events-sandbox',
  'bacom-sandbox',
  'gmii-email',
  'milo-studio',
  'coe',
  'da-milo-college',
  'solution-partners',
  'demo-project',
  'research',
  'clio',
  'adobe-tech-blog',
  'loc-demo',
];

export default function renderMiloReposSection(container) {
  const section = document.createElement('div');
  section.classList.add('milo-repos-section');

  const sectionHeader = document.createElement('h3');
  sectionHeader.classList.add('milo-repos-section-header');
  sectionHeader.textContent = 'Milo Repositories';
  section.appendChild(sectionHeader);

  const sectionDescription = document.createElement('p');
  sectionDescription.classList.add('milo-repos-section-description');
  sectionDescription.textContent = 'A collection of all milo-based repositories used across our consumer projects.';
  section.appendChild(sectionDescription);

  const reposList = document.createElement('ul');
  reposList.classList.add('milo-repos-list');

  MILO_REPOS.forEach((repoName) => {
    const listItem = document.createElement('li');
    const repoLink = document.createElement('a');
    repoLink.textContent = repoName;
    repoLink.href = `https://github.com/adobecom/${repoName}`;
    repoLink.target = '_blank';
    repoLink.rel = 'noopener noreferrer';
    listItem.appendChild(repoLink);
    reposList.appendChild(listItem);
  });

  section.appendChild(reposList);
  container.appendChild(section);
}
