import { getLibs, getIconElementDeprecated, decorateButtonsDeprecated } from '../../scripts/utils.js';
import { transformLinkToAnimation, createOptimizedPicture } from '../../scripts/utils/media.js';
import { addFreePlanWidget } from '../../scripts/widgets/free-plan.js';

let createTag; let getConfig;
let getMetadata;

function buildContent(content) {
  const contentLink = content.querySelector('a');
  let formattedContent = content;

  if (contentLink && contentLink.href.endsWith('.mp4')) {
    const video = new URL(contentLink.textContent.trim());
    const looping = ['true', 'yes', 'on'].includes(video.searchParams.get('loop'));
    formattedContent = transformLinkToAnimation(contentLink, looping, false);
  } else {
    const contentImage = content.querySelector('picture');

    if (contentImage) {
      formattedContent = contentImage;
      const img = formattedContent.querySelector('img');
      if (img) {
        img.removeAttribute('width');
        img.removeAttribute('height');
      }
    }
  }

  return formattedContent;
}

function buildBackground(block, background) {
  background.classList.add('fullscreen-marquee-background');

  window.addEventListener('scroll', () => {
    const progress = (window.scrollY * 100) / block.offsetHeight;
    let opacityValue = ((progress - 10) / 1000) * 40;

    if (opacityValue > 0.6) {
      opacityValue = 0.6;
    }

    background.style = `opacity: ${opacityValue}`;
  });

  return background;
}

// Adds the first CTA to the middle of the marquee image
async function addMarqueeCenterCTA(block, appFrame) {
  const buttons = block.querySelectorAll('p a');
  if (buttons.length === 0) return;
  for (const cta of buttons) {
    cta.classList.add('xlarge');
  }
  const cta = buttons[0];

  const highlightCta = cta.cloneNode(true);
  highlightCta.setAttribute('href', '#');
  highlightCta.setAttribute('aria-hidden', 'true');
  highlightCta.setAttribute('role', 'presentation');
  highlightCta.setAttribute('tabindex', '-1');

  const appHighlight = createTag('a', {
    class: 'fullscreen-marquee-app-frame-highlight',
    href: cta.href,
  });

  await addFreePlanWidget(cta.parentElement);

  appHighlight.append(highlightCta);
  appFrame.append(appHighlight);
}

async function buildApp(block, content) {
  const appBackground = createTag('div', { class: 'fullscreen-marquee-app-background' });
  const appFrame = createTag('div', { class: 'fullscreen-marquee-app-frame' });
  const app = createTag('div', { class: 'fullscreen-marquee-app' });
  const contentContainer = createTag('div', { class: 'fullscreen-marquee-app-content-container' });

  let appImage;
  let editor;
  let variant;

  if (block.classList.contains('video')) {
    variant = 'video';

    if (content) {
      const thumbnailContainer = createTag('div', { class: 'fullscreen-marquee-app-thumbnail-container' });
      const thumbnail = content.cloneNode(true);

      thumbnailContainer.append(thumbnail);
      app.append(thumbnailContainer);

      content.addEventListener('loadedmetadata', () => {
        const framesContainer = createTag('div', { class: 'fullscreen-marquee-app-frames-container' });
        function createFrame(current, total) {
          const frame = createTag('video', { src: `${content.currentSrc}#t=${current}` });
          framesContainer.append(frame);

          frame.addEventListener('loadedmetadata', () => {
            frame.style.opacity = '1';

            if (current < total) {
              const newFrameCount = current + 1;
              createFrame(newFrameCount, total);
            }
          });
        }

        createFrame(1, 10);
        app.append(framesContainer);
      });

      thumbnail.addEventListener('loadedmetadata', () => {
        thumbnail.currentTime = Math.floor(thumbnail.duration) / 2 || 0;
        thumbnail.pause();
      });
    }
  } else {
    variant = 'image';
  }

  await import(`${getLibs()}/features/placeholders.js`).then(async (mod) => {
    const imgSrc = await mod.replaceKey(`fullscreen-marquee-desktop-${variant}-app`, getConfig());
    appImage = createOptimizedPicture(imgSrc);

    const editorSrc = await mod.replaceKey(`fullscreen-marquee-desktop-${variant}-editor`, getConfig());
    editor = createOptimizedPicture(editorSrc);

    appImage.classList.add('fullscreen-marquee-app-image');
    return mod.replaceKey();
  });

  editor.classList.add('fullscreen-marquee-app-editor');
  content.classList.add('fullscreen-marquee-app-content');

  window.addEventListener('mousemove', (e) => {
    const rotateX = ((e.clientX * 10) / (window.innerWidth / 2) - 10);
    const rotateY = -((e.clientY * 10) / (window.innerHeight / 2) - 10);

    app.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, 0px)`;
    appBackground.style.transform = `rotateX(${rotateY}deg) rotateY(${rotateX}deg) translate3d(${rotateX}px, 0px, -50px)`;
  }, { passive: true });

  contentContainer.append(content);
  app.append(appImage);
  app.append(contentContainer);
  appFrame.append(app);
  appFrame.append(appBackground);
  app.append(editor);
  addMarqueeCenterCTA(block, appFrame);
  return appFrame;
}

function decorateMultipleCTAs(block) {
  const links = Array.from(block.querySelectorAll('a')).slice(1);
  links
    .forEach((link) => {
      if ((link.classList.contains('button') || (link.classList.contains('con-button'))) && link.closest('em')) {
        link.classList.remove('button');
        link.classList.remove('con-button');
        link.classList.add('hyperlink');
      }
    });
}

export default async function decorate(block) {
  const rows = Array.from(block.children);
  const heading = rows[0] ? rows[0].querySelector('div') : null;
  const background = rows[2] ? rows[2].querySelector('picture') : null;
  let content = rows[1] ?? null;

  await Promise.all([import(`${getLibs()}/utils/utils.js`), decorateButtonsDeprecated(block)]).then(([utils]) => {
    ({ createTag, getConfig, getMetadata } = utils);
  });

  block.innerHTML = '';

  if (content) {
    content = buildContent(content);
  }

  if (['on', 'yes'].includes(getMetadata('marquee-inject-logo')?.toLowerCase())) {
    const logo = getIconElementDeprecated('adobe-express-logo');
    logo.classList.add('express-logo');
    block.prepend(logo);
  }

  if (background) {
    block.classList.add('has-background');
    block.append(buildBackground(block, background));
  }

  if (heading) {
    if (getConfig().locale?.ietf === 'ja-JP') heading.querySelector('h1').classList.add('budoux');

    heading.classList.add('fullscreen-marquee-heading');
    block.append(heading);
  }

  const smallHeaderApplied = block.parentElement.classList.contains('small-header');
  const desktop = document.body.dataset.device === 'desktop';
  if (!desktop && smallHeaderApplied) {
    block.parentElement.classList.remove('small-header');
  }

  if (content && document.body.dataset.device === 'desktop') {
    block.append(await buildApp(block, content));
  }
  decorateMultipleCTAs(block);
}
