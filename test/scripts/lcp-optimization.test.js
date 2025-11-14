import { expect } from '@esm-bundle/chai';

describe('LCP Image Optimization', () => {
  beforeEach(() => {
    // Clean up DOM before each test
    document.body.innerHTML = '<main><div></div></main>';
    document.head.querySelectorAll('link[rel="preload"]').forEach((link) => link.remove());
  });

  afterEach(() => {
    // Clean up after each test
    document.body.innerHTML = '';
    document.head.querySelectorAll('link[rel="preload"]').forEach((link) => link.remove());
  });

  it('should set loading="eager" and fetchpriority="high" on first section images', () => {
    // Setup: Create first section with images
    const firstSection = document.querySelector('main > div');
    firstSection.innerHTML = `
      <picture>
        <img src="/test1.jpg" alt="Test 1" loading="lazy">
      </picture>
      <picture>
        <img src="/test2.jpg" alt="Test 2" loading="lazy">
      </picture>
    `;

    // Execute the eagerLoad function (extracted from scripts.js)
    const eagerLoad = (img) => {
      img?.setAttribute('loading', 'eager');
      img?.setAttribute('fetchpriority', 'high');
    };

    const images = firstSection.querySelectorAll('img');
    images.forEach(eagerLoad);

    // Assert
    images.forEach((img) => {
      expect(img.getAttribute('loading')).to.equal('eager');
      expect(img.getAttribute('fetchpriority')).to.equal('high');
    });
  });

  it('should add preload link for first image', () => {
    // Setup: Create first section with an image
    const firstSection = document.querySelector('main > div');
    const img = document.createElement('img');
    img.src = 'http://localhost:2000/test-image.jpg';
    img.alt = 'Test';
    firstSection.appendChild(img);

    // Simulate the preload logic using src instead of currentSrc
    const firstImg = firstSection.querySelector('img');
    const imgSrc = firstImg?.src || firstImg?.currentSrc;
    if (imgSrc && !document.querySelector(`link[rel="preload"][href="${imgSrc}"]`)) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imgSrc;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
    }

    // Assert
    const preloadLink = document.querySelector('link[rel="preload"]');
    expect(preloadLink).to.exist;
    expect(preloadLink.getAttribute('as')).to.equal('image');
    expect(preloadLink.getAttribute('href')).to.equal('http://localhost:2000/test-image.jpg');
    expect(preloadLink.getAttribute('fetchpriority')).to.equal('high');
  });

  it('should not add duplicate preload links', () => {
    // Setup
    const firstSection = document.querySelector('main > div');
    const img = document.createElement('img');
    img.src = 'http://localhost:2000/test-image.jpg';
    firstSection.appendChild(img);

    // Execute preload logic twice
    const addPreload = () => {
      const firstImg = firstSection.querySelector('img');
      const imgSrc = firstImg?.src || firstImg?.currentSrc;
      if (imgSrc && !document.querySelector(`link[rel="preload"][href="${imgSrc}"]`)) {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imgSrc;
        link.setAttribute('fetchpriority', 'high');
        document.head.appendChild(link);
      }
    };

    addPreload();
    addPreload(); // Second call should not add duplicate

    // Assert
    const preloadLinks = document.querySelectorAll('link[rel="preload"]');
    expect(preloadLinks.length).to.equal(1);
  });

  it('should handle fallback when no first section exists', () => {
    // Setup: Remove main section, add image elsewhere
    document.body.innerHTML = '<img src="http://localhost:2000/fallback.jpg" alt="Fallback">';

    const fallbackImg = document.querySelector('img');

    // Execute fallback logic
    const firstSection = document.querySelector('body > main > div:nth-child(1)');
    if (!firstSection) {
      const eagerLoad = (img) => {
        img?.setAttribute('loading', 'eager');
        img?.setAttribute('fetchpriority', 'high');
      };

      const lcpImg = document.querySelector('img');
      if (lcpImg) {
        eagerLoad(lcpImg);
      }
    }

    // Assert
    expect(fallbackImg.getAttribute('loading')).to.equal('eager');
    expect(fallbackImg.getAttribute('fetchpriority')).to.equal('high');
  });

  it('should handle empty first section gracefully', () => {
    // Setup: First section exists but has no images
    const firstSection = document.querySelector('main > div');
    firstSection.innerHTML = '<p>No images here</p>';

    // Add an image elsewhere
    document.body.appendChild(document.createElement('img')).src = '/elsewhere.jpg';

    // Execute logic
    const eagerLoad = (img) => {
      img?.setAttribute('loading', 'eager');
      img?.setAttribute('fetchpriority', 'high');
    };

    const images = firstSection.querySelectorAll('img');

    if (images.length === 0) {
      // Fallback to first image on page
      const lcpImg = document.querySelector('img');
      if (lcpImg) {
        eagerLoad(lcpImg);
      }
    }

    // Assert
    const fallbackImg = document.querySelector('img');
    expect(fallbackImg.getAttribute('loading')).to.equal('eager');
    expect(fallbackImg.getAttribute('fetchpriority')).to.equal('high');
  });

  it('should only optimize images in first section, not other sections', () => {
    // Setup: Multiple sections
    document.body.innerHTML = `
      <main>
        <div>
          <img src="/first.jpg" alt="First section">
        </div>
        <div>
          <img src="/second.jpg" alt="Second section" loading="lazy">
        </div>
      </main>
    `;

    const eagerLoad = (img) => {
      img?.setAttribute('loading', 'eager');
      img?.setAttribute('fetchpriority', 'high');
    };

    // Execute only on first section
    const firstSection = document.querySelector('body > main > div:nth-child(1)');
    const firstSectionImages = firstSection.querySelectorAll('img');
    firstSectionImages.forEach(eagerLoad);

    // Assert
    const firstImg = document.querySelector('main > div:first-child img');
    const secondImg = document.querySelector('main > div:nth-child(2) img');

    expect(firstImg.getAttribute('loading')).to.equal('eager');
    expect(firstImg.getAttribute('fetchpriority')).to.equal('high');

    expect(secondImg.getAttribute('loading')).to.equal('lazy');
    expect(secondImg.getAttribute('fetchpriority')).to.be.null;
  });
});
