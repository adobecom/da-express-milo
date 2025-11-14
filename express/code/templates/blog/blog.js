/* eslint-disable import/named, import/extensions */
import { getLibs, toClassName } from '../../scripts/utils.js';
import { createOptimizedPicture } from '../../scripts/utils/media.js';

let createTag; let getConfig;
let getMetadata;

async function fetchAuthorImage($image, author) {
  const resp = await fetch(`/express/learn/blog/authors/${toClassName(author)}.plain.html`);
  const main = await resp.text();
  if (resp.status === 200) {
    const $div = createTag('div');
    $div.innerHTML = main;
    const $img = $div.querySelector('img');
    const newPicture = createOptimizedPicture($img.src, $img.alt, false, [{ width: '200' }]);
    $image.parentElement.replaceChild(newPicture, $image);
  }
}

function decorateBlogLinkedImages() {
  document.querySelectorAll('main div.section > div > p > a').forEach((a) => {
    if (a.textContent.trim().startsWith('https://')) {
      const prevSib = a.parentElement.previousElementSibling;
      if (prevSib) {
        const picture = prevSib.lastElementChild;
        if (picture && (picture.tagName === 'PICTURE')) {
          prevSib.appendChild(a);
          a.innerHTML = '';
          a.className = '';
          a.appendChild(picture);
        }
      }
    }
  });
}

function copyToClipboard(copyButton) {
  navigator.clipboard.writeText(window.location.href).then(() => {
    copyButton.classList.add('copy-success');
  }, () => {
    copyButton.classList.add('copy-failure');
  });
}

const loadImage = (img) => new Promise((resolve) => {
  const start = Date.now();
  const check = () => {
    if (img.complete && img.naturalHeight !== 0) {
      resolve();
      return;
    }
    if (Date.now() - start >= 5000) {
      resolve();
      return;
    }
    setTimeout(check, 50);
  };
  check();
});

export default async function decorateBlogPage() {
  ({ createTag, getConfig, getMetadata } = await import(`${getLibs()}/utils/utils.js`));
  const $main = document.querySelector('main');
  const $h1 = document.querySelector('main h1');
  const author = getMetadata('author');
  const date = getMetadata('publication-date');
  const category = getMetadata('category');
  if ($h1 && author && date) {
    const $heroPicture = $h1.parentElement.querySelector('picture');
    const heroSection = document.querySelector('#hero');
    const $div = createTag('div');
    heroSection.append($div);
    $div.append($h1);
    $main.prepend(heroSection);

    document.body.classList.add('blog-article');
    const $blogHeader = createTag('div', { class: 'blog-header' });
    $div.append($blogHeader);
    const $eyebrow = createTag('div', { class: 'eyebrow' });
    const { prefix } = getConfig().locale;
    $eyebrow.innerHTML = category ? `<a href="${prefix}/express/learn/blog/tags/${toClassName(category)}">${category}</a>` : '&nbsp;';
    $blogHeader.append($eyebrow);
    $blogHeader.append($h1);
    const publicationDate = new Date(date);
    const language = getConfig().locale.ietf;
    const dateString = publicationDate.toLocaleDateString(language, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC',
    });

    const subheading = getMetadata('subheading');
    if (subheading) {
      const $subheading = createTag('p', { class: 'subheading' });
      $subheading.innerHTML = subheading;
      $blogHeader.append($subheading);
    }
    if (author) {
      const $author = createTag('div', { class: 'author' });
      const url = encodeURIComponent(window.location.href);
      $author.innerHTML = `<div class="image"><img src="/express/learn/blog/assets/media_1f021705c13704e1e3041b414d0aa1ce883e067ec.png"></div>
      <div>
        <div class="name">${author}</div>
        <div class="date">${dateString}</div>
      </div>
      <div class="author-social">
        <span>
          <a target="_blank" href="http://twitter.com/share?&url=${url}">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-twitter">
            <use href="/express/code/icons/ccx-sheet_22.svg#twitter22"></use>
          </svg>
          </a>
        </span>
        <span>
          <a target="_blank" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-linkedin">
            <use href="/express/code/icons/ccx-sheet_22.svg#linkedin22"></use>
          </svg>
          </a>
        </span>
        <span>
        <a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=${url}">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-facebook">
            <use href="/express/code/icons/ccx-sheet_22.svg#facebook22"></use>
          </svg>
          </a>
        </span>
        <span>
        <a>
          <svg id="copy-to-clipboard" xmlns="http://www.w3.org/2000/svg" class="icon icon-link">
            <use href="/express/code/icons/ccx-sheet_22.svg#link22"></use>
          </svg>
          </a>
        </span>
      </div>`;
      fetchAuthorImage($author.querySelector('img'), author);
      $blogHeader.append($author);
      const copyButton = document.getElementById('copy-to-clipboard');
      copyButton.addEventListener('click', () => {
        copyToClipboard(copyButton);
      });
    }
    $div.append($blogHeader);
    if ($heroPicture) {
      $div.append($heroPicture);
    }
    decorateBlogLinkedImages();
    if ($heroPicture) {
      const img = $heroPicture.querySelector('img');
      await loadImage(img).then(() => {
        document.body.style.visibility = 'visible';
      });
    } else {
      document.body.style.visibility = 'visible';
    }
  } else {
    document.body.style.visibility = 'visible';
  }

  const pictures = document.querySelectorAll('main div.section > div > picture');
  pictures.forEach((picture) => {
    const section = picture.closest('.section');
    section.classList.add('fullwidth');
  });
}

await decorateBlogPage();
