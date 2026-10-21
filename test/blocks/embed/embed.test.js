import { expect } from '@esm-bundle/chai';
import { embedInstagram, getDefaultEmbed } from '../../../express/code/blocks/embed/embed.js';

function getFrame(markup) {
  return new DOMParser().parseFromString(markup, 'text/html').querySelector('iframe');
}

describe('Embed', () => {
  const url = new URL('https://social.example/p/mock-post');

  it('names the Instagram frame using the authored source hostname', () => {
    const frame = getFrame(embedInstagram(url));
    expect(frame.getAttribute('title')).to.equal(url.hostname);
  });

  it('preserves the Instagram embed URL and player attributes', () => {
    const frame = getFrame(embedInstagram(url));
    const src = new URL(frame.getAttribute('src'));
    expect(src.origin).to.equal(url.origin);
    expect(src.pathname).to.equal('/p/mock-post/embed/');
    expect(src.searchParams.get('cr')).to.equal('1');
    expect(src.searchParams.get('v')).to.equal('13');
    expect(src.searchParams.get('wp')).to.equal('1316');
    const location = window.location.href;
    expect(src.searchParams.get('rd')).to.equal(location.endsWith('.html') ? location : `${location}.html`);
    expect(frame.classList.contains('instagram-media')).to.be.true;
    expect(frame.getAttribute('allowfullscreen')).to.equal('true');
    expect(frame.getAttribute('height')).to.equal('530');
  });

  it('does not duplicate a trailing slash in the Instagram embed URL', () => {
    const frame = getFrame(embedInstagram(new URL(`${url.href}/`)));
    expect(new URL(frame.getAttribute('src')).pathname).to.equal('/p/mock-post/embed/');
  });

  it('preserves the accessible name on default embeds', () => {
    const frame = getFrame(getDefaultEmbed(url));
    expect(frame.getAttribute('title')).to.equal(`Content from ${url.hostname}`);
    expect(frame.getAttribute('src')).to.equal(url.href);
  });
});
