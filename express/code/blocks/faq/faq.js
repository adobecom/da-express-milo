import { getLibs } from '../../scripts/utils.js';
import { trackButtonClick } from '../../scripts/instrument.js';

let createTag; let getMetadata;

function decorateFAQBlocks(block) {
  const hideSchemaPageLevel = getMetadata('show-faq-schema') === 'no';
  const hideSchemaBlockLevel = block.classList.contains('hide-faq-schema');
  const faqs = [];
  const entities = [];
  const rows = Array.from(block.children);
  rows.forEach((row) => {
    const cells = Array.from(row.children);
    const question = cells[0];
    const answer = cells[1];
    faqs.push({
      question: question.textContent.trim(),
      answer: answer.innerHTML,
    });
  });

  block.innerHTML = '';
  faqs.forEach((faq) => {
    const { question, answer } = faq;

    const $accordion = createTag('div', { class: 'faq-accordion' });
    // for tracking the faq
    $accordion.addEventListener('click', () => {
      trackButtonClick($accordion);
    });
    block.append($accordion);

    const $questionDiv = createTag('h3', { class: 'faq-question' });
    $accordion.append($questionDiv);
    $questionDiv.innerHTML = question;

    const $answerDiv = createTag('div', { class: 'faq-answer' });
    $accordion.append($answerDiv);
    $answerDiv.innerHTML = answer;

    entities.push({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    });
  });

  if (!hideSchemaPageLevel && !hideSchemaBlockLevel) {
    const $schemaScript = document.createElement('script');
    $schemaScript.setAttribute('type', 'application/ld+json');
    $schemaScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: entities,
    });
    document.head.appendChild($schemaScript);
  }
}

export default async function decorate(block) {
  ({ createTag, getMetadata } = await import(`${getLibs()}/utils/utils.js`));
  decorateFAQBlocks(block);

  const phoneNumberTags = block.querySelectorAll(
    'a[title="{{business-sales-numbers}}"]',
  );
  if (phoneNumberTags.length > 0) {
    const { formatSalesPhoneNumber } = await import(
      '../../scripts/utils/location-utils.js'
    );
    try {
      await formatSalesPhoneNumber(phoneNumberTags);
    } catch (error) {
      window.lana?.log(`Error fetching sales phones numbers: ${error}`, { tags: 'faq', severity: 'error' });
    }
  }
}
