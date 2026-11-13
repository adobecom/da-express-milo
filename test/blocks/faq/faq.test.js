/* eslint-env mocha */
/* eslint-disable no-unused-expressions */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

// eslint-disable-next-line max-len
const [, { default: decorate }] = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/faq/faq.js')]);
const [body, hideFaqSchema] = await Promise.all([
  readFile({ path: './mocks/body.html' }),
  readFile({ path: './mocks/hide-faq-schema.html' }),
]);

describe('FAQ', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
  });

  it('should render FAQ block', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.faq');
    await decorate(block);
    expect(block).to.exist;
  });

  it('should inject Schema', async () => {
    document.body.innerHTML = body;
    const block = document.querySelector('.faq');
    await decorate(block);
    const script = document.querySelector('script[type="application/ld+json"]');
    const json = JSON.parse(script.textContent);
    expect(script).to.exist;
    expect(json['@context']).to.equal('https://schema.org');
    expect(json['@type']).to.equal('FAQPage');
    expect(json.mainEntity).to.be.an('array');
    expect(json.mainEntity[0]['@type']).to.equal('Question');
    expect(json.mainEntity[0].name).to.equal('Question 1');
    expect(json.mainEntity[0].acceptedAnswer['@type']).to.equal('Answer');
    expect(json.mainEntity[0].acceptedAnswer.text).to.equal('This is the answer to question 1.');
  });

  it('should not inject Schema when hide-faq-schema class is present', async () => {
    document.body.innerHTML = hideFaqSchema;
    const block = document.querySelector('.faq');
    await decorate(block);
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(block.classList.contains('hide-faq-schema')).to.be.true;
    expect(script).to.be.null;
  });

  it('should not inject Schema when show-faq-schema page metadata is set to no', async () => {
    document.body.innerHTML = body;
    document.head.innerHTML = '<meta name="show-faq-schema" content="no">';
    const block = document.querySelector('.faq');
    await decorate(block);
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).to.be.null;
  });

  it('should not inject Schema when both hiding options used together', async () => {
    document.body.innerHTML = hideFaqSchema;
    document.head.innerHTML = '<meta name="show-faq-schema" content="no">';
    const block = document.querySelector('.faq');
    await decorate(block);
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script).to.be.null;
  });
});
