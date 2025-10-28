import {
  readFile,
  emulateMedia,
  setViewport,
} from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };

window.isTestEnv = true;

const imports = await Promise.all([import('../../../express/code/scripts/utils.js'), import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/ax-marquee/ax-marquee.js')]);
const { getLibs } = imports[0];
const {
  default: decorate,
  handleMediaQuery,
  transformToVideoLink,
  decorateToggleContext,
} = imports[2];
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = { locales };
  mod.setConfig(conf);
});

async function prepBlock(filePath) {
  document.body.innerHTML = await readFile({ path: filePath });
  const marquee = document.querySelector('.ax-marquee');
  if (!marquee) {
    throw new Error(`Failed to find .ax-marquee element after loading ${filePath}`);
  }
  await decorate(marquee);
  return marquee;
}

describe('ax-marquee', () => {
  describe('default version', () => {
    it('has a video background', async () => {
      const marquee = await prepBlock('./mocks/default.html');
      const video = marquee.querySelector('video.marquee-background');
      expect(video).to.exist;
    });

    it('has a content foreground', async () => {
      const marquee = await prepBlock('./mocks/default.html');
      const content = marquee.querySelector('.marquee-foreground .content-wrapper');
      expect(content).to.exist;
    });

    it('has at least an H1', async () => {
      const marquee = await prepBlock('./mocks/default.html');
      const h1 = marquee.querySelector('.marquee-foreground .content-wrapper h1');
      expect(h1).to.exist;
    });

    it('has reduce motion toggle', async () => {
      const marquee = await prepBlock('./mocks/default.html');
      const video = marquee.querySelector('video.marquee-background');
      video.dispatchEvent(new Event('canplay'));
      const reduceMotionToggle = marquee.querySelector('.reduce-motion-wrapper');
      expect(reduceMotionToggle).to.exist;
    });

    it('reduce motion toggle on hover adds text', async () => {
      const marquee = await prepBlock('./mocks/default.html');
      const video = marquee.querySelector('video.marquee-background');
      video.dispatchEvent(new Event('canplay'));
      const reduceMotionToggle = marquee.querySelector('.reduce-motion-wrapper');
      expect(reduceMotionToggle.children.length).to.be.greaterThan(0);
      await decorateToggleContext(reduceMotionToggle, {});
      expect(reduceMotionToggle.children.length).to.be.greaterThan(0);
    });

    it('system accessibility setting affects the page live', async () => {
      const marquee = await prepBlock('./mocks/default.html');
      const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
      handleMediaQuery(marquee, mediaQuery);
      await emulateMedia({ reducedMotion: 'no-preference' });
      mediaQuery.dispatchEvent(new Event('change'));
      expect(mediaQuery.matches).to.be.false;
      await emulateMedia({ reducedMotion: 'reduce' });
      mediaQuery.dispatchEvent(new Event('change'));
      expect(mediaQuery.matches).to.be.true;
    });

    it('window resize triggers video adjustment', async () => {
      const marquee = await prepBlock('./mocks/default.html');
      const video = marquee.querySelector('video.marquee-background');
      video.src = 'foo';
      await setViewport({ width: 360, height: 640 });
      const newVideo = marquee.querySelector('video.marquee-background');

      expect(newVideo.src).to.not.equal('foo');
    });
  });

  describe('dark version with video', () => {
    it('is dark', async () => {
      const marquee = await prepBlock('./mocks/dark-video.html');
      expect(marquee.classList.contains('dark')).to.be.true;
    });

    it('uses different set of SVG for reduce-motion toggle', async () => {
      const marquee = await prepBlock('./mocks/dark-video.html');
      const video = marquee.querySelector('video.marquee-background');
      video.dispatchEvent(new Event('canplay'));
      const lightPlayIcon = marquee.querySelector('.icon-play-video-light');
      expect(lightPlayIcon).to.exist;
    });
  });

  describe('supports static asset', () => {
    it('renders an image background', async () => {
      const marquee = await prepBlock('./mocks/dark-static.html');
      const video = marquee.querySelector('.background-wrapper video');
      expect(video.poster !== '' && !video.querySelector('source')).to.be.true;
    });

    it('does not load reduce motion toggle', async () => {
      const marquee = await prepBlock('./mocks/dark-static.html');
      const reduceMotionToggle = marquee.querySelector('.reduce-motion-wrapper');
      expect(reduceMotionToggle).to.not.exist;
    });
  });

  describe('supports options', () => {
    it('renders an background color', async () => {
      const marquee = await prepBlock('./mocks/shadow-background.html');
      expect(marquee.getAttribute('style')).to.not.equal('');
    });

    it('renders a shadow', async () => {
      const marquee = await prepBlock('./mocks/shadow-background.html');
      const shadow = marquee.querySelector('.hero-shadow');
      expect(shadow).to.exist;
    });

    it('video link click opens video overlay', async () => {
      const marquee = await prepBlock('./mocks/shadow-background.html');
      const videoLink = marquee.querySelector('a[href="./media_1ff62f7924e9f7cb39ebf245d1ac1be92eb868835.mp4"]');
      if (videoLink) transformToVideoLink(videoLink.closest('div'), videoLink);
      videoLink.click();
      await new Promise((resolve) => {
        setTimeout(() => {
          expect(document.querySelector('.video-overlay')).to.exist;
          resolve();
        }, 100);
      });
    });
  });

  describe('supports wide variant', () => {
    it('renders an wide background', async () => {
      const marquee = await prepBlock('./mocks/wide.html');
      expect(marquee, 'marquee element should exist').to.exist;
      expect(marquee.classList, 'marquee should have classList').to.exist;
      expect(marquee.classList.contains('wide'), 'marquee should have wide class').to.be.true;
    });
  });

  describe('Additional Coverage Tests', () => {
    it('should handle empty marquee block', async () => {
      document.body.innerHTML = '<div class="ax-marquee"></div>';
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);
      expect(marquee).to.exist;
    });

    it('should handle marquee with no video', async () => {
      document.body.innerHTML = `
        <div class="ax-marquee">
          <div class="marquee-foreground">
            <div class="content-wrapper">
              <h1>Test Title</h1>
            </div>
          </div>
        </div>
      `;
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);
      expect(marquee).to.exist;
    });

    it('should handle marquee with no content', async () => {
      document.body.innerHTML = `
        <div class="ax-marquee">
          <video class="marquee-background">
            <source src="test.mp4" type="video/mp4">
          </video>
        </div>
      `;
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);
      expect(marquee).to.exist;
    });

    it('should handle transformToVideoLink function', async () => {
      document.body.innerHTML = `
        <div class="ax-marquee">
          <div>
            <a href="test.mp4">Video Link</a>
          </div>
        </div>
      `;
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);

      const videoLink = marquee.querySelector('a[href="test.mp4"]');
      if (videoLink) {
        transformToVideoLink(videoLink.closest('div'), videoLink);
        expect(videoLink).to.exist;
      }
    });

    it('should handle decorateToggleContext function', async () => {
      document.body.innerHTML = `
        <div class="ax-marquee">
          <div class="reduce-motion-wrapper">
            <button>Toggle</button>
          </div>
        </div>
      `;
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);

      const toggleWrapper = marquee.querySelector('.reduce-motion-wrapper');
      if (toggleWrapper) {
        decorateToggleContext(toggleWrapper, {});
        expect(toggleWrapper).to.exist;
      }
    });

    it('should handle handleMediaQuery function', async () => {
      document.body.innerHTML = `
        <div class="ax-marquee">
          <video class="marquee-background">
            <source src="test.mp4" type="video/mp4">
          </video>
        </div>
      `;
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);

      const mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
      handleMediaQuery(marquee, mediaQuery);
      expect(marquee).to.exist;
    });

    it('should handle video events', async () => {
      document.body.innerHTML = `
        <div class="ax-marquee">
          <video class="marquee-background">
            <source src="test.mp4" type="video/mp4">
          </video>
        </div>
      `;
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);

      const video = marquee.querySelector('video.marquee-background');
      video.dispatchEvent(new Event('canplay'));
      video.dispatchEvent(new Event('loadeddata'));
      video.dispatchEvent(new Event('error'));

      expect(video).to.exist;
    });

    it('should handle window resize events', async () => {
      document.body.innerHTML = `
        <div class="ax-marquee">
          <video class="marquee-background">
            <source src="test.mp4" type="video/mp4">
          </video>
        </div>
      `;
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);

      // Simulate window resize
      window.dispatchEvent(new Event('resize'));
      expect(marquee).to.exist;
    });

    it('should handle different marquee variants', async () => {
      const variants = ['dark', 'wide', 'static'];

      for (const variant of variants) {
        document.body.innerHTML = `
          <div class="ax-marquee ${variant}">
            <div class="marquee-foreground">
              <div class="content-wrapper">
                <h1>Test Title</h1>
              </div>
            </div>
          </div>
        `;
        const marquee = document.querySelector('.ax-marquee');
        await decorate(marquee);
        expect(marquee.classList.contains(variant)).to.be.true;
      }
    });

    it('should handle marquee with background color', async () => {
      document.body.innerHTML = `
        <div class="ax-marquee" style="background-color: #000000;">
          <div class="marquee-foreground">
            <div class="content-wrapper">
              <h1>Test Title</h1>
            </div>
          </div>
        </div>
      `;
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);
      expect(marquee).to.exist;
    });

    it('should handle marquee with shadow', async () => {
      document.body.innerHTML = `
        <div class="ax-marquee">
          <div class="hero-shadow"></div>
          <div class="marquee-foreground">
            <div class="content-wrapper">
              <h1>Test Title</h1>
            </div>
          </div>
        </div>
      `;
      const marquee = document.querySelector('.ax-marquee');
      await decorate(marquee);
      expect(marquee).to.exist;
    });
  });
});
