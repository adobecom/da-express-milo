import { expect } from '@esm-bundle/chai';
import { setLibs } from '../../../express/code/scripts/utils.js';
import { decorateSocialIcons } from '../../../express/code/scripts/utils/icons.js';

setLibs('/libs');

describe('Icons Utils', () => {
  describe('decorateSocialIcons', () => {
    let container;

    beforeEach(() => {
      // Create a fresh container for each test
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      // Clean up after each test
      document.body.removeChild(container);
    });

    it('should decorate Instagram links', () => {
      container.innerHTML = '<a href="https://www.instagram.com/user">https://www.instagram.com/user</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.true;
      expect(link.querySelector('.icon-instagram')).to.not.be.null;
      expect(link.textContent).to.equal('');
    });

    it('should decorate Twitter links', () => {
      container.innerHTML = '<a href="https://www.twitter.com/user">https://www.twitter.com/user</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.true;
      expect(link.querySelector('.icon-twitter')).to.not.be.null;
    });

    it('should decorate LinkedIn links', () => {
      container.innerHTML = '<a href="https://www.linkedin.com/user">https://www.linkedin.com/user</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.true;
      expect(link.querySelector('.icon-linkedin')).to.not.be.null;
    });

    it('should decorate YouTube links', () => {
      container.innerHTML = '<a href="https://www.youtube.com/user">https://www.youtube.com/user</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.true;
      expect(link.querySelector('.icon-youtube')).to.not.be.null;
    });

    it('should decorate TikTok links', () => {
      container.innerHTML = '<a href="https://www.tiktok.com/user">https://www.tiktok.com/user</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.true;
      expect(link.querySelector('.icon-tiktok')).to.not.be.null;
    });

    it('should decorate Pinterest links with subdomain', () => {
      container.innerHTML = '<a href="https://www.pinterest.com/user">https://www.pinterest.com/user</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.true;
      expect(link.querySelector('.icon-pinterest')).to.not.be.null;
    });

    it('should decorate Facebook links with subdomain', () => {
      container.innerHTML = '<a href="https://www.facebook.com/user">https://www.facebook.com/user</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.true;
      expect(link.querySelector('.icon-facebook')).to.not.be.null;
    });

    it('should handle links with social-links sibling', () => {
      container.innerHTML = `
        <div class="social-links"></div>
        <div>
          <a href="https://example.com">https://example.com</a>
        </div>
      `;

      expect(() => decorateSocialIcons(container)).to.not.throw();
    });

    it('should not decorate links without href', () => {
      container.innerHTML = '<a>No href link</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.false;
      expect(link.textContent).to.equal('No href link');
    });

    it('should not decorate links with embed-video hash', () => {
      container.innerHTML = '<a href="https://example.com#embed-video">https://example.com#embed-video</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.false;
    });

    it('should not decorate links inside embed blocks', () => {
      container.innerHTML = `
        <div class="embed" data-block-name="embed">
          <a href="https://example.com">https://example.com</a>
        </div>
      `;

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.false;
    });

    it('should not decorate links where href does not match text content', () => {
      container.innerHTML = '<a href="https://www.instagram.com/user">Click here</a>';

      decorateSocialIcons(container);

      const link = container.querySelector('a');
      expect(link.classList.contains('social-link')).to.be.false;
      expect(link.textContent).to.equal('Click here');
    });

    it('should move link to social-links container when parent has social-links sibling', () => {
      container.innerHTML = `
        <div class="social-links"></div>
        <div>
          <a href="https://www.instagram.com/user">https://www.instagram.com/user</a>
        </div>
      `;

      decorateSocialIcons(container);

      const socialLinksContainer = container.querySelector('.social-links');
      const link = socialLinksContainer.querySelector('a');
      expect(link).to.not.be.null;
      expect(link.classList.contains('social-link')).to.be.true;
    });

    it('should add social-links class to parent when no social-links sibling exists', () => {
      container.innerHTML = '<div><a href="https://www.instagram.com/user">https://www.instagram.com/user</a></div>';

      decorateSocialIcons(container);

      const parentDiv = container.querySelector('div');
      expect(parentDiv.classList.contains('social-links')).to.be.true;
    });

    it('should handle multiple links in the same container', () => {
      container.innerHTML = `
        <a href="https://www.instagram.com/user1">https://www.instagram.com/user1</a>
        <a href="https://www.twitter.com/user2">https://www.twitter.com/user2</a>
        <a href="https://www.linkedin.com/user3">https://www.linkedin.com/user3</a>
      `;

      decorateSocialIcons(container);

      const links = container.querySelectorAll('a');
      expect(links).to.have.length(3);
      links.forEach((link) => {
        expect(link.classList.contains('social-link')).to.be.true;
      });
    });

    it('should handle empty container', () => {
      container.innerHTML = '';

      expect(() => decorateSocialIcons(container)).to.not.throw();
    });

    it('should handle container with no links', () => {
      container.innerHTML = '<div>No links here</div>';

      expect(() => decorateSocialIcons(container)).to.not.throw();
    });
  });
});
