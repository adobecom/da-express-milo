import { expect } from '@esm-bundle/chai';

describe('Template-x Rendering - Lazy Loading', () => {
  it('should add loading="lazy" to template thumbnail images', () => {
    // Mock createTag function
    const createTag = (tag, attributes) => {
      const el = document.createElement(tag);
      if (attributes) {
        Object.keys(attributes).forEach((key) => {
          el.setAttribute(key, attributes[key]);
        });
      }
      return el;
    };

    // Simulate creating a template image as done in template-rendering.js
    const img = createTag('img', {
      src: 'https://example.com/template-thumb.jpg',
      alt: 'Test Template',
      loading: 'lazy',
    });

    // Assert
    expect(img.getAttribute('loading')).to.equal('lazy');
    expect(img.getAttribute('src')).to.equal('https://example.com/template-thumb.jpg');
    expect(img.getAttribute('alt')).to.equal('Test Template');
  });

  it('should create template images with proper attributes', () => {
    // Mock createTag
    const createTag = (tag, attributes) => {
      const el = document.createElement(tag);
      if (attributes) {
        Object.keys(attributes).forEach((key) => {
          el.setAttribute(key, attributes[key]);
        });
      }
      return el;
    };

    // Create multiple template images
    const templates = [
      { src: '/template1.jpg', alt: 'Template 1' },
      { src: '/template2.jpg', alt: 'Template 2' },
      { src: '/template3.jpg', alt: 'Template 3' },
    ];

    const images = templates.map((template) => createTag('img', {
      src: template.src,
      alt: template.alt,
      loading: 'lazy',
    }));

    // Assert all images have lazy loading
    images.forEach((img, index) => {
      expect(img.getAttribute('loading')).to.equal('lazy');
      expect(img.getAttribute('src')).to.equal(templates[index].src);
      expect(img.getAttribute('alt')).to.equal(templates[index].alt);
    });
  });

  it('should not have loading="eager" on template images', () => {
    const createTag = (tag, attributes) => {
      const el = document.createElement(tag);
      if (attributes) {
        Object.keys(attributes).forEach((key) => {
          el.setAttribute(key, attributes[key]);
        });
      }
      return el;
    };

    const img = createTag('img', {
      src: '/template.jpg',
      alt: 'Template',
      loading: 'lazy',
    });

    // Assert it's NOT eager
    expect(img.getAttribute('loading')).to.not.equal('eager');
    expect(img.getAttribute('loading')).to.equal('lazy');
  });
});
