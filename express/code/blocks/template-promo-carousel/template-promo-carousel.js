import { getLibs } from '../../scripts/utils.js';
import renderTemplate from '../template-x/template-rendering.js';
import buildGallery from '../../scripts/widgets/gallery/gallery.js';
import templatePromoCarouselBaseModel from './templatePromoCarouselBaseModel.js';

let createTag;
let getConfig;

async function createTemplates(itemTamplates) {
  const templates = await Promise.all(itemTamplates.map((item) => renderTemplate(item)));

  templates.forEach((tplt) => tplt.classList.add('template'));
  return templates;
}

async function createTemplatesContainer(templatesParm) {
  const templatesContainer = createTag('div', { class: 'templates-container' });
  const [templates] = await Promise.all([createTemplates(templatesParm)]);

  templatesContainer.append(...templates);
  const { control: initialControl } = await buildGallery(
    [...templates],
    templatesContainer,
    { center: true },
  );

  return {
    templatesContainer,
    control: initialControl,
  };
}

export default async function init(el, { premiumTagsElements, imageElements, templateLinks }) {
  el.parentElement.classList.add('multiple-up');
  const freePremiumTags = premiumTagsElements;

  templateLinks.forEach((aTag) => aTag?.parentElement.nextElementSibling.remove());

  el.classList.add('template-promo-carousel');
  ({ createTag, getConfig } = await import(`${getLibs()}/utils/utils.js`));

  const templatesArray = imageElements.map((img, index) => {
    const imagesToTemplateInfoMap = {
      licensingCategory: freePremiumTags[index]?.textContent?.trim()?.toLowerCase(),
      'dc:title': {
        'i-default': img?.alt || '',
      },
      title: {
        'i-default': img?.alt || '',
      },
      _links: {
        'http://ns.adobe.com/adobecloud/rel/rendition': {
          href: img.src,
          templated: true,
        },
        'http://ns.adobe.com/adobecloud/rel/component': {
          href: img.src,
          templated: true,
        },
      },
      pages: [
        {
          rendition: {
            image: {
              thumbnail: {
                componentId: '',
                hzRevision: '0',
                width: img?.width,
                height: img?.height,
                mediaType: 'image/webp',
              },
              preview: {
                componentId: '',
                hzRevision: '0',
                width: img?.width,
                height: img?.width,
                mediaType: 'image/webp',
              },
            },
          },
        },
      ],
      customLinks: {
        branchUrl: templateLinks[index]?.href,
      },
    };

    return { ...templatePromoCarouselBaseModel, ...imagesToTemplateInfoMap };
  });

  try {
    const [{ templatesContainer, control: galleryControl }] = await Promise.all(
      [createTemplatesContainer(templatesArray)],
    );

    imageElements.forEach((img, index) => {
      img?.parentElement?.parentElement?.remove();
      templateLinks[index]?.parentElement?.remove();
    });

    el.append(templatesContainer);
    el.append(galleryControl);
  } catch (err) {
    window.lana?.log(`Error in template-x-carousel-toolbar: ${err}`);
    if (getConfig().env.name === 'prod') {
      el.remove();
    } else {
      const errElement = createTag('div');
      errElement.textContent = 'Error loading templates, please refresh the page or try again later.';
      el.append(errElement);
    }
  }
}
