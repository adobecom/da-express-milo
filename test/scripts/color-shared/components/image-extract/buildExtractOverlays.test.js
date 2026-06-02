/* eslint-env mocha */
import { expect } from '@esm-bundle/chai';
import {
  buildDragOverlay,
  buildLoadingOverlay,
} from '../../../../../express/code/scripts/color-shared/components/image-extract/buildExtractOverlays.js';

describe('buildExtractOverlays', () => {
  describe('buildDragOverlay', () => {
    it('returns an element with class color-extract-drag-overlay', () => {
      expect(buildDragOverlay().classList.contains('color-extract-drag-overlay')).to.be.true;
    });

    it('has aria-hidden="true"', () => {
      expect(buildDragOverlay().getAttribute('aria-hidden')).to.equal('true');
    });

    it('contains a drag icon element', () => {
      expect(buildDragOverlay().querySelector('.color-extract-drag-icon')).to.exist;
    });

    it('icon contains an SVG', () => {
      expect(buildDragOverlay().querySelector('.color-extract-drag-icon svg')).to.exist;
    });

    it('contains a drag text element', () => {
      expect(buildDragOverlay().querySelector('.color-extract-drag-text')).to.exist;
    });

    it('uses the default dropOverlayText string', () => {
      const text = buildDragOverlay().querySelector('.color-extract-drag-text').textContent;
      expect(text).to.include('Drop');
    });

    it('uses a custom dropOverlayText string when provided', () => {
      const el = buildDragOverlay({ dropOverlayText: 'Release to upload' });
      expect(el.querySelector('.color-extract-drag-text').textContent).to.equal('Release to upload');
    });

    it('falls back gracefully when strings object is empty', () => {
      expect(() => buildDragOverlay({})).to.not.throw();
    });
  });

  describe('buildLoadingOverlay', () => {
    it('returns an element with class color-extract-loading-overlay', () => {
      expect(buildLoadingOverlay().classList.contains('color-extract-loading-overlay')).to.be.true;
    });

    it('has aria-live="polite"', () => {
      expect(buildLoadingOverlay().getAttribute('aria-live')).to.equal('polite');
    });

    it('contains a loading label element', () => {
      expect(buildLoadingOverlay().querySelector('.color-extract-loading-label')).to.exist;
    });

    it('label uses the default uploadingImage string', () => {
      const text = buildLoadingOverlay().querySelector('.color-extract-loading-label').textContent;
      expect(text).to.include('Uploading');
    });

    it('uses a custom uploadingImage string when provided', () => {
      const el = buildLoadingOverlay({ uploadingImage: 'Please wait...' });
      expect(el.querySelector('.color-extract-loading-label').textContent).to.equal('Please wait...');
    });

    it('contains a loading track', () => {
      expect(buildLoadingOverlay().querySelector('.color-extract-loading-track')).to.exist;
    });

    it('contains a loading bar inside the track', () => {
      const track = buildLoadingOverlay().querySelector('.color-extract-loading-track');
      expect(track.querySelector('.color-extract-loading-bar')).to.exist;
    });

    it('falls back gracefully when strings object is empty', () => {
      expect(() => buildLoadingOverlay({})).to.not.throw();
    });
  });
});
