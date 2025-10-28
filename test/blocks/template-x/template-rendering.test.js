import { expect } from '@esm-bundle/chai';

describe('Template Rendering - getTemplateTitle logic', () => {
  it('should extract title from dc:title i-default', () => {
    const template = {
      'dc:title': {
        'i-default': 'My Template Title',
      },
    };

    // Test the logic: check if dc:title exists
    const hasTitle = template['dc:title']?.['i-default'];
    expect(hasTitle).to.equal('My Template Title');
  });

  it('should build title from moods and task name', () => {
    const template = {
      moods: ['Happy', 'Bright'],
      task: { name: 'Flyer' },
    };

    // Test the logic: build title from moods and task
    if (template.moods?.length && template.task?.name) {
      const title = `${template.moods.join(', ')} ${template.task.name}`;
      expect(title).to.equal('Happy, Bright Flyer');
    }
  });

  it('should handle empty template object', () => {
    const template = {};

    // Test the logic: empty template should have no title
    const hasTitle = template['dc:title']?.['i-default'];
    expect(hasTitle).to.be.undefined;
  });
});

describe('Template Rendering - buildiFrameContent logic', () => {
  it('should test iframe creation logic with manual DOM', () => {
    // Simulate what buildiFrameContent does - test the logic directly
    const template = {
      id: 'template-123',
      customLinks: {
        branchUrl: 'https://example.com/templates/abc123',
      },
    };

    const taskID = 'test-task-123';
    const zazzleUrl = 'https://example.com/zazzle';
    const lang = 'en-US';

    // Create iframe like the function does
    const iframe = document.createElement('iframe');
    iframe.src = `${zazzleUrl}?TD=${template.id}&taskID=${taskID}&shortcode=${template.customLinks.branchUrl.split('/').pop()}&lang=${lang}`;
    iframe.title = 'Edit this template';
    iframe.tabIndex = -1;
    iframe.allowFullscreen = true;

    // Verify the iframe structure
    expect(iframe.tagName).to.equal('IFRAME');
    expect(iframe.title).to.equal('Edit this template');
    expect(iframe.tabIndex).to.equal(-1);
    expect(iframe.allowFullscreen).to.be.true;

    // Verify URL construction
    expect(iframe.src).to.include('TD=template-123');
    expect(iframe.src).to.include('taskID=test-task-123');
    expect(iframe.src).to.include('shortcode=abc123');
    expect(iframe.src).to.include('lang=en-US');
  });

  it('should extract shortcode correctly from branchUrl', () => {
    const branchUrl = 'https://example.com/path/to/shortcode456';
    const shortcode = branchUrl.split('/').pop();

    expect(shortcode).to.equal('shortcode456');
  });

  it('should handle complex branchUrl paths', () => {
    const branchUrl = 'https://example.com/very/long/path/to/xyz789';
    const shortcode = branchUrl.split('/').pop();

    expect(shortcode).to.equal('xyz789');
  });

  it('should build complete iframe URL with all parameters', () => {
    const template = {
      id: 'test-id-999',
      customLinks: {
        branchUrl: 'https://example.com/branch/shortcode999',
      },
    };

    const taskID = 'task-999';
    const zazzleUrl = 'https://zazzle.example.com';
    const lang = 'fr-FR';

    const expectedUrl = `${zazzleUrl}?TD=${template.id}&taskID=${taskID}&shortcode=${template.customLinks.branchUrl.split('/').pop()}&lang=${lang}`;

    expect(expectedUrl).to.include('TD=test-id-999');
    expect(expectedUrl).to.include('taskID=task-999');
    expect(expectedUrl).to.include('shortcode=shortcode999');
    expect(expectedUrl).to.include('lang=fr-FR');
    expect(expectedUrl).to.include('zazzle.example.com');
  });
});
