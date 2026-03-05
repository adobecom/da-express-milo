const SAMPLE_PALETTE = ['#FF5733', '#33FF57', '#3357FF', '#F1C40F', '#8E44AD'];

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

export default async function decorate(block) {
  console.log('[ColorBlindness] 🚀 Block loaded');

  try {
    block.innerHTML = '';
    block.className = 'color-blindness';

    const container = document.createElement('div');
    container.className = 'color-blindness-container';
    block.appendChild(container);

    const placeholder = document.createElement('div');
    placeholder.className = 'color-blindness-placeholder';
    placeholder.innerHTML = `
      <h2>Color Blindness Simulator Page</h2>
      <p>This block will be fully implemented in Epic 4.2</p>
      <p>Features:</p>
      <ul>
        <li>Simulation type selector (Protanopia, Deuteranopia, Tritanopia, etc.)</li>
        <li>Side-by-side comparison</li>
        <li>Image upload for simulation</li>
        <li>Color palette simulation</li>
      </ul>
    `;
    container.appendChild(placeholder);

    await import('../../libs/color-components/components/color-edit/index.js');

    let activeEditor = null;
    let activePopover = null;
    let activeTrigger = null;
    let dismissHandlers = [];

    function closeEditor() {
      dismissHandlers.forEach(([evt, fn, opts]) => {
        (opts?.target || document).removeEventListener(evt, fn, opts?.capture);
      });
      dismissHandlers = [];
      if (activePopover) { activePopover.remove(); activePopover = null; }
      if (activeEditor) { activeEditor.remove(); activeEditor = null; }
      activeTrigger = null;
    }

    function positionPopover(popover, btnRect) {
      const gap = 8;
      const popRect = popover.getBoundingClientRect();

      let top = btnRect.bottom + gap;
      if (top + popRect.height > window.innerHeight) {
        top = btnRect.top - popRect.height - gap;
      }
      top = Math.max(gap, top);

      let left = btnRect.left + (btnRect.width - popRect.width) / 2;
      left = Math.max(gap, Math.min(left, window.innerWidth - popRect.width - gap));

      popover.style.top = `${top}px`;
      popover.style.left = `${left}px`;
    }

    function addDismissListener(evt, fn, opts) {
      const target = opts?.target || document;
      target.addEventListener(evt, fn, opts?.capture);
      dismissHandlers.push([evt, fn, opts]);
    }

    function launchColorEdit(showPalette, triggerBtn) {
      const wasOpen = activeTrigger === triggerBtn;
      closeEditor();
      if (wasOpen) return;

      const colorEdit = document.createElement('color-edit');
      colorEdit.palette = showPalette ? [...SAMPLE_PALETTE] : [];
      colorEdit.showPalette = showPalette;
      colorEdit.colorMode = 'RGB';

      const mobile = isMobile();
      colorEdit.mobile = mobile;

      colorEdit.addEventListener('panel-close', closeEditor);
      colorEdit.addEventListener('color-change', (e) => {
        console.log('[ColorBlindness] Color changed:', e.detail);
      });

      if (mobile) {
        document.body.appendChild(colorEdit);
        requestAnimationFrame(() => colorEdit.show());
      } else {
        const popover = document.createElement('div');
        popover.className = 'color-blindness-popover';
        popover.appendChild(colorEdit);
        document.body.appendChild(popover);
        activePopover = popover;

        requestAnimationFrame(() => {
          positionPopover(popover, triggerBtn.getBoundingClientRect());

          addDismissListener('click', (e) => {
            if (!popover.contains(e.target) && !triggerBtn.contains(e.target)) {
              closeEditor();
            }
          });
          addDismissListener('keydown', (e) => {
            if (e.key === 'Escape') closeEditor();
          });
          addDismissListener('scroll', () => closeEditor(), { target: window, capture: true });
        });
      }

      activeEditor = colorEdit;
      activeTrigger = triggerBtn;
    }

    const btnContainer = document.createElement('div');
    btnContainer.className = 'color-blindness-actions';

    function createButton(label, showPalette) {
      const wrap = document.createElement('div');
      wrap.className = 'color-blindness-btn-wrap';

      const btn = document.createElement('button');
      btn.className = 'color-blindness-btn';
      btn.textContent = label;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        launchColorEdit(showPalette, btn);
      });

      wrap.appendChild(btn);
      return wrap;
    }

    btnContainer.appendChild(createButton('Edit Color', false));
    btnContainer.appendChild(createButton('Edit Color with Palette', true));
    container.appendChild(btnContainer);

    console.log('[ColorBlindness] ✅ Placeholder loaded');
  } catch (error) {
    console.error('[ColorBlindness] ❌ Error:', error);
    block.innerHTML = `<p style="color: red;">Failed to load Color Blindness Simulator: ${error.message}</p>`;
  }
}
