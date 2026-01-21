const BLOCKS_PATH_MAP = {
  default: '/express/code/',
};

async function fetchBlocksList(repoName, blocksPath = BLOCKS_PATH_MAP.default) {
  try {
    const apiUrl = `https://api.github.com/repos/adobecom/${repoName}/contents${blocksPath}blocks`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Repository or path not found: ${response.status}`);
    }

    const contents = await response.json();

    if (!Array.isArray(contents)) {
      throw new Error('Invalid response format');
    }

    // Filter for directories only
    const folders = contents
      .filter((item) => item.type === 'dir')
      .map((item) => item.name)
      .sort();

    return folders;
  } catch (error) {
    /* eslint-disable-next-line no-console */
    console.error('Error fetching blocks list:', error);
    throw error;
  }
}

function renderBlocksList(container, blocks) {
  container.innerHTML = '';

  if (!blocks || blocks.length === 0) {
    const emptyMessage = document.createElement('p');
    emptyMessage.classList.add('blocks-explorer-empty-message');
    emptyMessage.textContent = 'No blocks found.';
    container.appendChild(emptyMessage);
    return;
  }

  const blocksList = document.createElement('ul');
  blocksList.classList.add('blocks-explorer-list');

  blocks.forEach((blockName) => {
    const listItem = document.createElement('li');
    listItem.classList.add('blocks-explorer-list-item');
    listItem.textContent = blockName;
    blocksList.appendChild(listItem);
  });

  container.appendChild(blocksList);
}

export default function renderBlocksExplorerSection(container) {
  const section = document.createElement('div');
  section.classList.add('blocks-explorer-section');

  const sectionHeader = document.createElement('h3');
  sectionHeader.classList.add('blocks-explorer-section-header');
  sectionHeader.textContent = 'Blocks Explorer';
  section.appendChild(sectionHeader);

  const controls = document.createElement('div');
  controls.classList.add('blocks-explorer-controls');

  const label = document.createElement('label');
  label.setAttribute('for', 'blocks-explorer-input');
  label.textContent = 'Repository name:';
  controls.appendChild(label);

  const input = document.createElement('textarea');
  input.id = 'blocks-explorer-input';
  input.classList.add('blocks-explorer-input');
  input.rows = 2;
  input.placeholder = 'Enter repository name (e.g., da-express-milo)';
  controls.appendChild(input);

  const submitButton = document.createElement('button');
  submitButton.type = 'button';
  submitButton.classList.add('blocks-explorer-button');
  submitButton.textContent = 'Load Blocks';
  controls.appendChild(submitButton);

  section.appendChild(controls);

  const resultsContainer = document.createElement('div');
  resultsContainer.classList.add('blocks-explorer-results');
  section.appendChild(resultsContainer);

  const messageContainer = document.createElement('div');
  messageContainer.classList.add('blocks-explorer-message');
  section.appendChild(messageContainer);

  submitButton.addEventListener('click', async () => {
    const repoName = input.value.trim();

    if (!repoName) {
      messageContainer.innerHTML = '';
      const error = document.createElement('p');
      error.classList.add('blocks-explorer-error');
      error.textContent = 'Please enter a repository name.';
      messageContainer.appendChild(error);
      resultsContainer.innerHTML = '';
      return;
    }

    messageContainer.innerHTML = '';
    resultsContainer.innerHTML = '';

    const loadingMessage = document.createElement('p');
    loadingMessage.classList.add('blocks-explorer-loading');
    loadingMessage.textContent = 'Loading...';
    messageContainer.appendChild(loadingMessage);

    try {
      const blocks = await fetchBlocksList(repoName);
      messageContainer.innerHTML = '';

      const successMessage = document.createElement('p');
      successMessage.classList.add('blocks-explorer-success');
      successMessage.textContent = `Found ${blocks.length} block(s) in ${repoName}`;
      messageContainer.appendChild(successMessage);

      renderBlocksList(resultsContainer, blocks);
    } catch (error) {
      messageContainer.innerHTML = '';
      const errorMessage = document.createElement('p');
      errorMessage.classList.add('blocks-explorer-error');
      errorMessage.textContent = `Error: ${error.message}`;
      messageContainer.appendChild(errorMessage);
      resultsContainer.innerHTML = '';
    }
  });

  container.appendChild(section);
}
