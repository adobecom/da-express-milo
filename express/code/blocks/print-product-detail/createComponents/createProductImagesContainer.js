import { getLibs } from '../../../scripts/utils.js';
import {
  convertImageSize,
  createHeroImageSrcset,
} from '../utilities/utility-functions.js';
import createSimpleCarousel from '../../../scripts/widgets/simple-carousel.js';

let createTag;

export function createproductHeroImage(heroImage, heroImageType) {
  const productHeroImageContainer = createTag('div', {
    class: 'pdpx-product-hero-image-container',
    'data-skeleton': 'true',
  });
  const altTextHero = `Product hero image - ${heroImageType}`;
  const productHeroImage = createTag('img', {
    class: 'pdpx-product-hero-image',
    id: 'pdpx-product-hero-image',
    'data-image-type': heroImageType,
    fetchpriority: 'high',
    decoding: 'async',
    loading: 'eager',
    alt: altTextHero,
    sizes: '(max-width: 600px) 100vw, 50vw',
    width: '500',
    height: '500',
  });
  if (heroImage) {
    productHeroImage.srcset = createHeroImageSrcset(heroImage);
    productHeroImage.src = convertImageSize(heroImage, '500');
  }
  productHeroImageContainer.appendChild(productHeroImage);
  return { productHeroImage, productHeroImageContainer };
}

export async function createProductThumbnailCarousel(
  realViews,
  heroImageType,
  productHeroImage,
) {
  const carouselWrapper = createTag('div', {
    class: 'pdpx-image-thumbnail-carousel-wrapper',
    id: 'pdpx-image-thumbnail-carousel-wrapper',
  });
  Object.keys(realViews).forEach((viewKey) => {
    const imageThumbnailCarouselItem = createTag('button', {
      class: 'pdpx-image-thumbnail-carousel-item',
      'data-image-type': viewKey,
      'data-skeleton': 'true',
      title: viewKey,
    });
    if (heroImageType === viewKey) {
      imageThumbnailCarouselItem.classList.add('selected');
    }
    const imageURL = realViews[viewKey];
    const imageURLSmall = convertImageSize(imageURL, '100');
    const altTextThumbnail = `Product Image Thumbnail: ${viewKey}`;
    const imageThumbnailCarouselItemImage = createTag('img', {
      class: 'pdpx-image-thumbnail-carousel-item-image',
      'data-image-type': viewKey,
      alt: altTextThumbnail,
      src: imageURLSmall,
      loading: 'lazy',
      decoding: 'async',
      width: '76',
      height: '76',
    });
    imageThumbnailCarouselItem.addEventListener('click', (e) => {
      carouselWrapper
        .querySelectorAll('.pdpx-image-thumbnail-carousel-item')
        .forEach((item) => {
          item.classList.remove('selected');
        });
      e.currentTarget.classList.add('selected');
      const thumbnailImageURL = e.currentTarget.querySelector('img').src;
      productHeroImage.srcset = createHeroImageSrcset(thumbnailImageURL);
      productHeroImage.src = convertImageSize(thumbnailImageURL, '500');
      productHeroImage.dataset.imageType = e.currentTarget.dataset.imageType;
      productHeroImage.alt = `Product hero image - ${e.currentTarget.dataset.imageType}`;
    });
    imageThumbnailCarouselItem.appendChild(imageThumbnailCarouselItemImage);
    carouselWrapper.appendChild(imageThumbnailCarouselItem);
  });
  await createSimpleCarousel(
    '.pdpx-image-thumbnail-carousel-item',
    carouselWrapper,
    {
      ariaLabel: 'Product image thumbnails',
      centerActive: true,
      activeClass: 'selected',
    },
  );
  return carouselWrapper;
}

export default async function createProductImagesContainer(
  realViews,
  heroImage,
  heroImageType = 'Front',
) {
  ({ createTag } = await import(`${getLibs()}/utils/utils.js`));
  const productImagesContainer = createTag('div', {
    class: 'pdpx-product-images-container',
    id: 'pdpx-product-images-container',
  });
  const { productHeroImage, productHeroImageContainer } = createproductHeroImage(heroImage, heroImageType);
  const imageThumbnailCarouselContainer = await createProductThumbnailCarousel(
    realViews,
    heroImageType,
    productHeroImage,
  );
  productImagesContainer.append(
    productHeroImageContainer,
    imageThumbnailCarouselContainer,
  );
  return productImagesContainer;
}
