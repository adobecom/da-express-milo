import { createTag } from '../../../scripts/utils.js';

export function createLoadMoreComponent(options = {}) {
  const {
    onLoadMore,
    remaining = 0,
    label = 'Load more',
  } = options;


  const container = createTag('div', { class: 'load-more-container' });

  const button = createTag('button', {
    class: 'load-more-button',
    type: 'button',
    'aria-label': `Load ${remaining} more items`,
  });

  const buttonText = createTag('span', { class: 'button-text' });
  buttonText.textContent = remaining > 0 
    ? `${label} (${remaining})` 
    : label;

  const spinner = createTag('span', { class: 'button-spinner' });
  spinner.style.display = 'none';
  spinner.innerHTML = '↻'; // Or use CSS spinner

  button.appendChild(buttonText);
  button.appendChild(spinner);

  let isLoading = false;

  button.addEventListener('click', async () => {
    if (isLoading) return;

    isLoading = true;

    buttonText.style.opacity = '0.5';
    spinner.style.display = 'inline-block';
    button.disabled = true;

    try {
      await onLoadMore?.();
    } catch (error) {
      console.error('[LoadMoreComponent] ❌ Load more error:', error);
    } finally {
      isLoading = false;
      buttonText.style.opacity = '1';
      spinner.style.display = 'none';
      button.disabled = false;
    }
  });

  container.appendChild(button);

  if (remaining === 0) {
    container.style.display = 'none';
  }

  return {
    element: container,
    
    updateRemaining: (count) => {
      buttonText.textContent = count > 0 
        ? `${label} (${count})` 
        : label;
      button.setAttribute('aria-label', `Load ${count} more items`);
      
      if (count === 0) {
        container.style.display = 'none';
      } else {
        container.style.display = 'block';
      }
    },
    
    hide: () => {
      container.style.display = 'none';
    },
    
    show: () => {
      container.style.display = 'block';
    },
    
    setLoading: (loading) => {
      isLoading = loading;
      button.disabled = loading;
      spinner.style.display = loading ? 'inline-block' : 'none';
      buttonText.style.opacity = loading ? '0.5' : '1';
    },
    
    destroy: () => {
      container.remove();
    },
  };
}

