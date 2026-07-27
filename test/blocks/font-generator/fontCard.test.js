import { expect } from '@esm-bundle/chai';
import sinon from 'sinon';

const [{ getLibs }] = await Promise.all([
  import('../../../express/code/scripts/utils.js'),
  import('../../../express/code/scripts/scripts.js'),
]);
await import(`${getLibs()}/utils/utils.js`).then((mod) => mod.setConfig({}));

const [
  { createFontCard, updateFontCard },
  { transformText },
  { DEFAULT_PLACEHOLDERS },
] = await Promise.all([
  import('../../../express/code/blocks/font-generator/fontCard.js'),
  import('../../../express/code/blocks/font-generator/unicodeEngine.js'),
  import('../../../express/code/blocks/font-generator/placeholders.js'),
]);

const FONT = {
  id: 'bold-1', styleName: 'Bold', category: 'bold', map: {},
};
const CTA = { text: 'Design With Style', href: 'https://www.adobe.com/express/templates/' };

describe('font-generator/fontCard', () => {
  describe('createFontCard', () => {
    it('returns a .font-card element carrying the font id', () => {
      const card = createFontCard(FONT, 'Hello', 24);
      expect(card.classList.contains('font-card')).to.be.true;
      expect(card.dataset.fontId).to.equal('bold-1');
    });

    it('renders the transformed preview text at the given size', () => {
      const preview = createFontCard(FONT, 'Hello', 24).querySelector('.font-card-preview');
      expect(preview).to.exist;
      expect(preview.textContent).to.equal(transformText('Hello', FONT));
      expect(preview.style.fontSize).to.equal('24px');
    });

    it('falls back to the sample text when previewText is empty', () => {
      const preview = createFontCard(FONT, '', 16).querySelector('.font-card-preview');
      expect(preview.textContent).to.equal(transformText(DEFAULT_PLACEHOLDERS.sampleText, FONT));
    });

    it('shows the font style name in the footer', () => {
      expect(createFontCard(FONT, 'Hello', 16).querySelector('.font-card-name').textContent).to.equal('Bold');
    });

    it('omits the CTA link when no cardCta is passed', () => {
      expect(createFontCard(FONT, 'Hello', 16).querySelector('.font-card-cta')).to.not.exist;
    });

    it('renders a CTA link opening in a new tab when cardCta is provided', () => {
      const cta = createFontCard(FONT, 'Hello', 16, CTA).querySelector('.font-card-cta');
      expect(cta).to.exist;
      expect(cta.href).to.equal(CTA.href);
      expect(cta.target).to.equal('_blank');
      expect(cta.rel).to.include('noopener');
      expect(cta.textContent).to.contain(CTA.text);
    });

    it('labels the copy button from the default placeholders', () => {
      const btn = createFontCard(FONT, 'Hello', 16).querySelector('.font-card-copy-btn');
      expect(btn.getAttribute('aria-label')).to.equal(DEFAULT_PLACEHOLDERS.copyLabel);
      expect(btn.dataset.tooltip).to.equal(DEFAULT_PLACEHOLDERS.copyLabel);
    });

    it('honours an authored copy label', () => {
      const strings = { ...DEFAULT_PLACEHOLDERS, copyLabel: 'Copiar' };
      const btn = createFontCard(FONT, 'Hello', 16, null, strings).querySelector('.font-card-copy-btn');
      expect(btn.getAttribute('aria-label')).to.equal('Copiar');
    });

    it('renders the desktop hover overlay with the copy label as its message', () => {
      const card = createFontCard(FONT, 'Hello', 16);
      const overlay = card.querySelector('.font-card-hover-overlay');
      expect(overlay).to.exist;
      expect(overlay.querySelector('.font-card-overlay-message').textContent)
        .to.equal(DEFAULT_PLACEHOLDERS.copyLabel);
    });

    it('names the card after the font style, overriding name-from-content', () => {
      expect(createFontCard(FONT, 'Hello', 16).getAttribute('aria-label')).to.equal('Bold');
    });

    it('keeps the card and its interactive children out of the normal tab order', () => {
      const card = createFontCard(FONT, 'Hello', 16, CTA);
      expect(card.tabIndex).to.equal(-1);
      expect(card.querySelector('.font-card-copy-btn').tabIndex).to.equal(-1);
      expect(card.querySelector('.font-card-cta').tabIndex).to.equal(-1);
    });
  });

  describe('updateFontCard', () => {
    it('updates preview text and size in place', () => {
      const card = createFontCard(FONT, 'Hello', 16);
      const preview = card.querySelector('.font-card-preview');
      updateFontCard(card, FONT, 'World', 40);
      expect(preview.textContent).to.equal(transformText('World', FONT));
      expect(preview.style.fontSize).to.equal('40px');
    });

    it('falls back to the sample text when cleared', () => {
      const card = createFontCard(FONT, 'Hello', 16);
      updateFontCard(card, FONT, '', 16);
      expect(card.querySelector('.font-card-preview').textContent)
        .to.equal(transformText(DEFAULT_PLACEHOLDERS.sampleText, FONT));
    });

    it('respects a custom sample-text argument', () => {
      const card = createFontCard(FONT, 'Hello', 16);
      updateFontCard(card, FONT, '', 16, 'Sample');
      expect(card.querySelector('.font-card-preview').textContent).to.equal(transformText('Sample', FONT));
    });
  });

  describe('copy interaction', () => {
    let writeTextStub;
    let originalClipboard;

    beforeEach(() => {
      originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
      writeTextStub = sinon.stub().resolves();
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: writeTextStub },
        configurable: true,
      });
    });

    afterEach(() => {
      if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
      else delete navigator.clipboard;
      // Note: the polite live region is a module-level singleton that fontCard.js
      // reuses, so it is intentionally left in the DOM between tests.
      sinon.restore();
    });

    const clickCopy = async (card) => {
      card.querySelector('.font-card-copy-btn').click();
      // Let the writeText promise and its .then/.catch microtasks flush.
      await writeTextStub.returnValues[writeTextStub.returnValues.length - 1].catch(() => {});
      await Promise.resolve();
    };

    it('writes the transformed preview text to the clipboard', async () => {
      const card = createFontCard(FONT, 'Hello', 16);
      await clickCopy(card);
      expect(writeTextStub.calledOnce).to.be.true;
      expect(writeTextStub.firstCall.args[0]).to.equal(transformText('Hello', FONT));
    });

    it('marks the card copied and swaps the button label on success', async () => {
      const card = createFontCard(FONT, 'Hello', 16);
      await clickCopy(card);
      expect(card.classList.contains('is-copied')).to.be.true;
      expect(card.querySelector('.font-card-success-overlay')).to.exist;
      expect(card.querySelector('.font-card-copy-btn').getAttribute('aria-label'))
        .to.equal(DEFAULT_PLACEHOLDERS.copiedLabel);
    });

    it('announces success through a polite live region', async () => {
      // announce() defers the text set to rAF; run it synchronously so the
      // announcement is observable without depending on frame timing.
      sinon.stub(window, 'requestAnimationFrame').callsFake((cb) => {
        cb();
        return 0;
      });
      const card = createFontCard(FONT, 'Hello', 16);
      document.body.append(card);
      await clickCopy(card);
      const live = document.querySelector('.font-card-live-region');
      expect(live).to.exist;
      expect(live.getAttribute('role')).to.equal('status');
      expect(live.getAttribute('aria-live')).to.equal('polite');
      expect(live.textContent).to.equal(DEFAULT_PLACEHOLDERS.copiedMessage);
      card.remove();
    });

    it('keeps a single overlay when copy is triggered repeatedly', async () => {
      const card = createFontCard(FONT, 'Hello', 16);
      await clickCopy(card);
      await clickCopy(card);
      expect(card.querySelectorAll('.font-card-success-overlay').length).to.equal(1);
    });

    it('logs and does not mark copied when the clipboard write rejects', async () => {
      writeTextStub.rejects(new Error('denied'));
      const logSpy = sinon.spy();
      const originalLana = window.lana;
      window.lana = { log: logSpy };
      const card = createFontCard(FONT, 'Hello', 16);
      await clickCopy(card);
      expect(card.classList.contains('is-copied')).to.be.false;
      expect(logSpy.calledOnce).to.be.true;
      window.lana = originalLana;
    });
  });

  describe('cell keyboard nav', () => {
    let card;

    afterEach(() => card?.remove());

    it('Enter on the wrapper moves focus to the copy button and enters the cell', () => {
      card = createFontCard(FONT, 'Hello', 16, CTA);
      document.body.append(card);
      const copyBtn = card.querySelector('.font-card-copy-btn');
      card.focus();
      card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      expect(document.activeElement).to.equal(copyBtn);
      expect(copyBtn.tabIndex).to.equal(0);
      expect(card.querySelector('.font-card-cta').tabIndex).to.equal(0);
      expect(card.tabIndex).to.equal(-1);
    });

    it('a direct click into the copy button enters the cell without Enter', () => {
      card = createFontCard(FONT, 'Hello', 16, CTA);
      document.body.append(card);
      const copyBtn = card.querySelector('.font-card-copy-btn');
      const cta = card.querySelector('.font-card-cta');
      copyBtn.focus();
      // document.activeElement updates synchronously regardless of whether
      // this document has real OS-level focus, but the corresponding
      // focusin event does not reliably fire without it — which a
      // concurrent (multi-iframe) test run can't guarantee any single
      // document has. Dispatch it explicitly so this test exercises the
      // listener's own logic rather than depending on that environment
      // detail (a real click in a real, focused, single-tab browser always
      // fires it naturally).
      copyBtn.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
      expect(card.tabIndex).to.equal(-1);
      expect(copyBtn.tabIndex).to.equal(0);
      expect(cta.tabIndex).to.equal(0);
    });

    it('Escape from inside the cell returns focus to the wrapper', () => {
      card = createFontCard(FONT, 'Hello', 16, CTA);
      document.body.append(card);
      const copyBtn = card.querySelector('.font-card-copy-btn');
      copyBtn.focus();
      copyBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(document.activeElement).to.equal(card);
      expect(card.tabIndex).to.equal(0);
      expect(copyBtn.tabIndex).to.equal(-1);
      expect(card.querySelector('.font-card-cta').tabIndex).to.equal(-1);
    });

    it('Tab past the last child (CTA) exits back to the wrapper', () => {
      card = createFontCard(FONT, 'Hello', 16, CTA);
      document.body.append(card);
      const cta = card.querySelector('.font-card-cta');
      cta.focus();
      cta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
      expect(document.activeElement).to.equal(card);
      expect(card.tabIndex).to.equal(0);
    });

    it('Shift+Tab before the first child (copy button) exits back to the wrapper', () => {
      card = createFontCard(FONT, 'Hello', 16, CTA);
      document.body.append(card);
      const copyBtn = card.querySelector('.font-card-copy-btn');
      copyBtn.focus();
      copyBtn.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Tab', shiftKey: true, bubbles: true, cancelable: true,
      }));
      expect(document.activeElement).to.equal(card);
      expect(card.tabIndex).to.equal(0);
    });

    it('Tab from the copy button exits directly when there is no CTA link', () => {
      card = createFontCard(FONT, 'Hello', 16);
      document.body.append(card);
      const copyBtn = card.querySelector('.font-card-copy-btn');
      copyBtn.focus();
      copyBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
      expect(document.activeElement).to.equal(card);
    });

    it('Tab from the copy button to the CTA does not exit (only past the last child)', () => {
      card = createFontCard(FONT, 'Hello', 16, CTA);
      document.body.append(card);
      const copyBtn = card.querySelector('.font-card-copy-btn');
      copyBtn.focus();
      copyBtn.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
      expect(document.activeElement).to.not.equal(card);
    });
  });
});
