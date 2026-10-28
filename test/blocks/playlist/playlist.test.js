import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const [, { default: decorate }] = await Promise.all([import('../../../express/code/scripts/scripts.js'), import('../../../express/code/blocks/playlist/playlist.js')]);

const testBody = await readFile({ path: './mocks/body.html' });

describe('Playlist', () => {
  beforeEach(() => {
    document.body.innerHTML = testBody;
  });

  it('should have all things', async () => {
    const block = document.querySelector('.playlist');
    await decorate(block);

    const thumbnails = block.querySelector('.thumbnails-container');
    const sessions = thumbnails.querySelectorAll('.session');
    const videoOverlay = block.querySelector('a.video-player-inline-player-overlay');
    const videoPlayer = block.querySelector('video.video-player-inline-player');
    const playMenu = block.querySelector('.video-player-menu');
    const videoMenuButtons = block.querySelector('.video-player-buttons');
    const videoButtons = playMenu.querySelectorAll('.video-button');

    expect(block).to.exist;
    expect(thumbnails).to.exist;
    expect(videoOverlay).to.exist;
    expect(videoPlayer).to.exist;
    expect(videoMenuButtons).to.exist;
    expect(sessions.length).to.equal(5);
    expect(videoButtons.length).to.equal(5);
    expect(sessions[4].classList.contains('active')).to.be.true;
  });

  it('playlist controls work', async () => {
    const block = document.querySelector('.playlist');
    await decorate(block);

    const videoOverlay = block.querySelector('a.video-player-inline-player-overlay');
    const videoPlayer = block.querySelector('video.video-player-inline-player');
    const sessions = block.querySelectorAll('.session');
    const playMenu = block.querySelector('.video-player-menu');
    const videoMenuButtons = block.querySelector('.video-player-buttons');
    const prevButton = videoMenuButtons.querySelector('a.video-player-button-previous');
    const nextButton = videoMenuButtons.querySelector('a.video-player-button-next');
    const videoButtons = playMenu.querySelectorAll('.video-button');

    videoOverlay.dispatchEvent(new Event('click'));
    expect(videoOverlay.style.zIndex).to.equal('0');

    videoPlayer.click();
    expect(videoPlayer.paused).to.be.true;

    // the following code are testing all edge case navigations
    let currentVideo = videoPlayer.querySelector('source')?.src;
    videoButtons[1].click();
    expect(videoPlayer.querySelector('source')?.src === currentVideo).to.be.false;

    currentVideo = videoPlayer.querySelector('source')?.src;
    prevButton.click();
    expect(videoPlayer.querySelector('source')?.src === currentVideo).to.be.false;

    currentVideo = videoPlayer.querySelector('source')?.src;
    nextButton.click();
    expect(videoPlayer.querySelector('source')?.src === currentVideo).to.be.false;

    currentVideo = videoPlayer.querySelector('source')?.src;
    videoButtons[4].click();
    nextButton.click();
    expect(videoPlayer.querySelector('source')?.src === currentVideo).to.be.false;
    expect(block.querySelectorAll('.session')?.[0].classList.contains('active')).to.be.true;

    currentVideo = videoPlayer.querySelector('source')?.src;
    sessions[1].click();
    expect(videoPlayer.querySelector('source')?.src === currentVideo).to.be.false;
    expect(block.querySelectorAll('.session')?.[1].classList.contains('active')).to.be.true;

    currentVideo = videoPlayer.querySelector('source')?.src;
    nextButton.click();
    expect(videoPlayer.querySelector('source')?.src === currentVideo).to.be.false;
    expect(block.querySelectorAll('.session')?.[2].classList.contains('active')).to.be.true;

    currentVideo = videoPlayer.querySelector('source')?.src;
    prevButton.click();
    expect(videoPlayer.querySelector('source')?.src === currentVideo).to.be.false;
    expect(block.querySelectorAll('.session')?.[1].classList.contains('active')).to.be.true;

    currentVideo = videoPlayer.querySelector('source')?.src;
    sessions[0].click();
    prevButton.click();
    expect(videoPlayer.querySelector('source')?.src === currentVideo).to.be.false;
    expect(block.querySelectorAll('.session')?.[4].classList.contains('active')).to.be.true;
  });
});
