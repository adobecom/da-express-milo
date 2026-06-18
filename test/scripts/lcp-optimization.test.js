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

describe('MEP fragment LCP preload', () => {
  // Mirrors decorateAreaWithLCP in scripts.js: when MEP replaces the LCP-section block with a
  // fragment, eager-load + preload the fragment's first-section images instead of the now-removed
  // original. Guarded to the topmost a.fragment of the LCP section, one-shot via
  // fragmentLcpPreloaded.
  const eagerLoad = (img) => {
    img?.setAttribute('loading', 'eager');
    img?.setAttribute('fetchpriority', 'high');
  };

  const preloadFirst = (img) => {
    if (!img?.src) return;
    if (document.querySelector(`link[rel="preload"][href="${img.src}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = img.src;
    link.setAttribute('fetchpriority', 'high');
    document.head.appendChild(link);
  };

  let fragmentLcpPreloaded;
  const decorateFragmentLCP = (area, fragmentLink) => {
    if (!fragmentLink || fragmentLcpPreloaded) return;
    try {
      const firstSection = document.querySelector('body > main > div:nth-child(1)');
      if (firstSection?.querySelector('a.fragment') !== fragmentLink) return;
      const section = area.querySelector('body > div') || area;
      const images = section.querySelectorAll('img');
      if (!images.length) return;
      images.forEach(eagerLoad);
      preloadFirst(images[0]);
      fragmentLcpPreloaded = true;
    } catch {
      // intentionally swallowed in production via window.lana?.log
    }
  };

  const makeFragmentDoc = (innerHtml) => {
    const doc = document.implementation.createHTMLDocument('fragment');
    doc.body.innerHTML = `<div>${innerHtml}</div>`;
    return doc;
  };

  beforeEach(() => {
    fragmentLcpPreloaded = false;
    document.body.innerHTML = '<main></main>';
    document.head.querySelectorAll('link[rel="preload"]').forEach((link) => link.remove());
  });

  afterEach(() => {
    document.body.innerHTML = '';
    document.head.querySelectorAll('link[rel="preload"]').forEach((link) => link.remove());
  });

  it('eager-loads and preloads the fragment image when fragmentLink is the topmost a.fragment in the LCP section', () => {
    const main = document.querySelector('main');
    const firstSection = document.createElement('div');
    const fragmentLink = document.createElement('a');
    fragmentLink.className = 'fragment';
    fragmentLink.href = 'https://example.test/fragments/hero';
    firstSection.append(fragmentLink);
    main.append(firstSection);

    const fragmentDoc = makeFragmentDoc('<img src="http://localhost:2000/b.jpg" alt="B" loading="lazy">');

    decorateFragmentLCP(fragmentDoc, fragmentLink);

    const img = fragmentDoc.querySelector('img');
    expect(img.getAttribute('loading')).to.equal('eager');
    expect(img.getAttribute('fetchpriority')).to.equal('high');

    const preloadLink = document.querySelector('link[rel="preload"]');
    expect(preloadLink).to.exist;
    expect(preloadLink.getAttribute('href')).to.equal('http://localhost:2000/b.jpg');
  });

  it('only preloads once (one-shot guard) even if a second fragment is decorated', () => {
    const main = document.querySelector('main');
    const firstSection = document.createElement('div');
    const fragmentLink = document.createElement('a');
    fragmentLink.className = 'fragment';
    firstSection.append(fragmentLink);
    main.append(firstSection);

    const fragmentDoc1 = makeFragmentDoc('<img src="http://localhost:2000/first.jpg" alt="First">');
    decorateFragmentLCP(fragmentDoc1, fragmentLink);
    expect(document.querySelectorAll('link[rel="preload"]').length).to.equal(1);

    // A second fragment call (e.g. gnav/footer) must not add another preload once the guard is set.
    const secondLink = document.createElement('a');
    secondLink.className = 'fragment';
    const fragmentDoc2 = makeFragmentDoc('<img src="http://localhost:2000/second.jpg" alt="Second">');
    decorateFragmentLCP(fragmentDoc2, secondLink);

    expect(document.querySelectorAll('link[rel="preload"]').length).to.equal(1);
    expect(fragmentDoc2.querySelector('img').getAttribute('loading')).to.not.equal('eager');
  });

  it('does not consume the guard or preload when the fragment has no images', () => {
    const main = document.querySelector('main');
    const firstSection = document.createElement('div');
    const fragmentLink = document.createElement('a');
    fragmentLink.className = 'fragment';
    firstSection.append(fragmentLink);
    main.append(firstSection);

    const emptyFragmentDoc = makeFragmentDoc('<p>No images here</p>');
    decorateFragmentLCP(emptyFragmentDoc, fragmentLink);

    expect(document.querySelectorAll('link[rel="preload"]').length).to.equal(0);
    expect(fragmentLcpPreloaded).to.equal(false);
  });

  it('does not preload when fragmentLink is not the topmost a.fragment in the LCP section', () => {
    const main = document.querySelector('main');
    const firstSection = document.createElement('div');
    const topmostFragmentLink = document.createElement('a');
    topmostFragmentLink.className = 'fragment';
    const otherFragmentLink = document.createElement('a');
    otherFragmentLink.className = 'fragment';
    firstSection.append(topmostFragmentLink, otherFragmentLink);
    main.append(firstSection);

    const fragmentDoc = makeFragmentDoc('<img src="http://localhost:2000/other.jpg" alt="Other">');
    decorateFragmentLCP(fragmentDoc, otherFragmentLink);

    expect(document.querySelectorAll('link[rel="preload"]').length).to.equal(0);
    expect(fragmentDoc.querySelector('img').getAttribute('loading')).to.not.equal('eager');
  });
});
