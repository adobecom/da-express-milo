function isPlainObject(val) {
  return val && typeof val === 'object' && !Array.isArray(val);
}

function collectGroupedAttributes(packageData, groupOrder, groupAttributes) {
  const groupValues = new Map();

  const ensureGroup = (group) => {
    if (!groupAttributes.has(group)) {
      groupAttributes.set(group, []);
      groupOrder.push(group);
    }
    if (!groupValues.has(group)) {
      groupValues.set(group, new Map());
    }
  };

  const addEntry = (group, attr, value) => {
    ensureGroup(group);
    const attrs = groupAttributes.get(group);
    if (!attrs.includes(attr)) {
      attrs.push(attr);
    }
    groupValues.get(group).set(attr, value);
  };

  const visit = (value, path) => {
    if (isPlainObject(value)) {
      Object.entries(value).forEach(([key, val]) => visit(val, [...path, key]));
      return;
    }

    const group = path.length > 1 ? path[0] : 'root';
    const attr = path.length > 1 ? path.slice(1).join('.') : path[0];
    const displayValue = Array.isArray(value) ? JSON.stringify(value) : value;
    addEntry(group, attr, displayValue);
  };

  visit(packageData, []);
  return groupValues;
}

function parseProjectNames(value) {
  if (!value) return [];
  return value
    .split(/[\n,]+/)
    .map((name) => name.trim())
    .filter((name) => name.length > 0);
}

async function renderTable(container, projectNames) {
  const groupOrder = [];
  const groupAttributes = new Map(); // group -> attr order array
  const packagesGroups = [];

  const table = document.createElement('table');
  table.classList.add('github-package-comparator-table');

  const tableHeader = document.createElement('thead');
  const tableHeaderRow = document.createElement('tr');
  const firstHeaderCell = document.createElement('th');
  firstHeaderCell.textContent = 'Attribute';
  tableHeaderRow.appendChild(firstHeaderCell);
  tableHeader.appendChild(tableHeaderRow);

  const tableBody = document.createElement('tbody');

  for (let i = 0; i < projectNames.length; i += 1) {
    try {
      const packageURL = `https://raw.githubusercontent.com/adobecom/${projectNames[i]}/refs/heads/stage/package.json`;
      const packageResponse = await fetch(packageURL);
      const packageData = await packageResponse.json();
      const grouped = collectGroupedAttributes(packageData, groupOrder, groupAttributes);
      packagesGroups.push(grouped);
    } catch (error) {
      /* eslint-disable-next-line no-console */
      console.error('Error fetching package data', error);
      packagesGroups.push(new Map());
    }

    const tableHeaderCell = document.createElement('th');

    const repoName = document.createElement('a');
    repoName.textContent = projectNames[i];
    const repoURL = `https://github.com/adobecom/${projectNames[i]}`;
    repoName.href = repoURL;
    repoName.target = '_blank';
    repoName.textContent = projectNames[i];
    tableHeaderCell.append(repoName);
    tableHeaderRow.appendChild(tableHeaderCell);
  }

  groupOrder.forEach((group) => {
    const sectionRow = document.createElement('tr');
    sectionRow.classList.add('github-package-comparator-section-row');
    const sectionCell = document.createElement('td');
    sectionCell.classList.add('github-package-comparator-section-cell');
    // sectionCell.colSpan = projectNames.length + 1;
    const ghostCell = document.createElement('td');
    ghostCell.classList.add('github-package-comparator-section-ghost-cell');
    ghostCell.colSpan = projectNames.length;
    sectionCell.textContent = group === 'root' ? 'General' : group;
    sectionRow.append(sectionCell, ghostCell);
    tableBody.appendChild(sectionRow);

    const attrs = groupAttributes.get(group) || [];
    attrs.forEach((attr) => {
      const tr = document.createElement('tr');
      const nameTd = document.createElement('td');
      nameTd.textContent = attr;
      tr.appendChild(nameTd);

      for (let i = 0; i < packagesGroups.length; i += 1) {
        const pkgGroup = packagesGroups[i].get(group);
        const value = pkgGroup ? pkgGroup.get(attr) : '';
        const valueTd = document.createElement('td');
        valueTd.textContent = value ?? '';
        tr.appendChild(valueTd);
      }

      tableBody.appendChild(tr);
    });
  });

  table.append(tableHeader, tableBody);
  container.appendChild(table);
}

export default async function decorate(block) {
  const defaultProjects = ['da-dc', 'da-bacom', 'da-express-milo'];

  block.innerHTML = '';
  const container = document.createElement('div');
  container.classList.add('github-package-comparator-container');

  const header = document.createElement('h2');
  header.classList.add('github-package-comparator-header');
  header.textContent = 'GitHub Package Comparator';
  container.appendChild(header);

  const content = document.createElement('div');
  content.classList.add('github-package-comparator-content');

  const controls = document.createElement('div');
  controls.classList.add('github-package-comparator-controls');
  const label = document.createElement('label');
  label.textContent = 'Repository names (comma or newline separated):';
  label.setAttribute('for', 'github-package-comparator-input');
  const input = document.createElement('textarea');
  input.id = 'github-package-comparator-input';
  input.rows = 3;
  input.value = defaultProjects.join('\n');
  const applyButton = document.createElement('button');
  applyButton.type = 'button';
  applyButton.textContent = 'Update';
  controls.append(label, input, applyButton);

  const tableWrapper = document.createElement('div');
  tableWrapper.classList.add('github-package-comparator-table-wrapper');
  content.appendChild(controls);
  content.appendChild(tableWrapper);
  container.appendChild(content);
  block.appendChild(container);

  const render = async (names) => {
    const projects = names.length ? names : defaultProjects;
    tableWrapper.innerHTML = '';
    await renderTable(tableWrapper, projects);
  };

  applyButton.addEventListener('click', () => {
    const names = parseProjectNames(input.value);
    render(names);
  });

  render(defaultProjects);
}
