import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const locales = { '': { ietf: 'en-US', tk: 'hah7vzn.css' } };

window.isTestEnv = true;

const imports = await Promise.all([import('../../express/code/scripts/utils.js'), import('../../express/code/scripts/scripts.js')]);
const { getLibs } = imports[0];

let createTag;
await import(`${getLibs()}/utils/utils.js`).then((mod) => {
  const conf = { locales };
  mod.setConfig(conf);
  createTag = mod.createTag;
});
const {
  appendEventIntent,
  default: trackBranchParameters,
  getTrackingAppendedURL,
} = await import('../../express/code/scripts/branchlinks.js');

document.body.innerHTML = await readFile({ path: './mocks/branchlinks.html' });

describe('branchlinks appendEventIntent', () => {
  const eventPaths = [
    '/express/templates/program/event',
    '/express/create/poster/event',
    '/express/create/flyer/event',
  ];

  eventPaths.forEach((pathname) => {
    it(`adds eventIntent=true on ${pathname}`, () => {
      const url = appendEventIntent('https://example.com/template', pathname);

      expect(new URL(url).searchParams.get('eventIntent')).to.equal('true');
    });
  });

  [
    '/express/templates/invitation',
    '/express/create/poster',
    '/express/create/flyer/event/other',
    '/express/templates/program/event-other',
    '/fr/express/templates/program/event',
  ].forEach((pathname) => {
    it(`leaves the destination unchanged on ${pathname}`, () => {
      const destination = 'https://example.com/template?source=listing#preview';

      expect(appendEventIntent(destination, pathname)).to.equal(destination);
    });
  });

  it('uses the current page pathname by default', () => {
    const originalUrl = window.location.href;
    try {
      window.history.replaceState(null, '', eventPaths[0]);
      const url = appendEventIntent('https://example.com/template');
      expect(new URL(url).searchParams.get('eventIntent')).to.equal('true');
    } finally {
      window.history.replaceState(null, '', originalUrl);
    }
  });

  it('adds eventIntent=true while preserving existing query parameters and fragments', () => {
    const url = appendEventIntent('https://example.com/template?source=listing#preview', eventPaths[0]);
    const parsedUrl = new URL(url);

    expect(parsedUrl.searchParams.get('source')).to.equal('listing');
    expect(parsedUrl.searchParams.get('eventIntent')).to.equal('true');
    expect(parsedUrl.hash).to.equal('#preview');
  });

  it('sets eventIntent to true when the URL already has the parameter', () => {
    const url = appendEventIntent('https://example.com/template?eventIntent=false', eventPaths[0]);

    expect(new URL(url).searchParams.getAll('eventIntent')).to.deep.equal(['true']);
  });
});

function setMeta(name, content) {
  document.head.append(createTag('meta', { name, content }));
}

describe('branchlinks getTrackingAppendedURL', () => {
  let urls;
  before(() => {
    window.isTestEnv = true;
    window.hlx = { experiment: null };
    setMeta('branch-asset-collection', 'test');
    setMeta('branch-newstuff', 'test');
  });
  beforeEach(() => {
    urls = [...document.querySelectorAll('a')].map((a) => a.href);
  });
  after(() => {
    document.querySelector('meta[name="branch-asset-collection"]').remove();
    document.querySelector('meta[name="branch-newstuff"]').remove();
  });
  it('returns a string', () => {
    urls.forEach(async (url) => {
      const trackingURL = await getTrackingAppendedURL(url, window);
      expect(trackingURL).to.be.string;
    });
  });
  it('adds to branch links locale', async () => {
    const appendedUrls = await Promise.all(urls.map((url) => getTrackingAppendedURL(url, window)));
    appendedUrls.forEach((url) => expect(url.includes('locale')).to.be.true);
  });
  it('appends branch tracking parameters to search branch links only', async () => {
    const appendedUrls = await Promise.all(urls.map((url) => getTrackingAppendedURL(url, window)));
    expect(appendedUrls[0].includes('assetCollection')).to.be.false;
    expect(appendedUrls[1].includes('newstuff')).to.be.true;
    expect(appendedUrls[2].includes('assetCollection')).to.be.false;
  });
  it('accepts searchOverride option to allow non search branch links to work like search branch links', async () => {
    const url = await getTrackingAppendedURL(urls[2], { isSearchOverride: true });
    expect(url.includes('assetCollection')).to.be.true;
  });
});

describe('branchlinks trackBranchParameteres', () => {
  let links;
  before(async () => {
    window.isTestEnv = true;
    window.placeholders = {
      'search-branch-links':
                'https://adobesparkpost.app.link/c4bWARQhWAb, https://adobesparkpost.app.link/lQEQ4Pi1YHb, https://adobesparkpost.app.link/9tmWXXDAhLb',
    };
    window.hlx = { experiment: null };
    links = [
      ...document.querySelectorAll('a'),
      createTag(
        'a',
        { href: 'https://adobesparkpost.app.link/GJrBPFUWBBb?acomx-dno=y' },
        'normal branch link with no tracking wanted',
      ),
    ];
    await trackBranchParameters(links);
  });
  it('adds rel=nofollow to branch links', () => {
    links.forEach((link) => {
      expect(link.rel === 'nofollow').to.be.true;
    });
  });
  it('skips adding params for links with disable flag', () => {
    links.forEach((link, index) => {
      if (index === links.length - 1) {
        expect(link.href.includes('locale')).to.be.false;
      } else {
        expect(link.href.includes('locale')).to.be.true;
      }
    });
  });
});
