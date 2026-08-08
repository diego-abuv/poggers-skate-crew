import { initPlayer } from './VideoPlayer.js';

function getLightboxEls() {
  return {
    lightbox: document.getElementById('lightbox'),
    lightboxImg: document.getElementById('lightboxImg'),
    lightboxCaption: document.getElementById('lightboxCaption'),
    lightboxClose: document.getElementById('lightboxClose'),
  };
}

export function openLightbox(media, altText, captionText, stopCarousel) {
  const { lightbox, lightboxImg, lightboxCaption } = getLightboxEls();
  if (!lightbox || !lightboxImg) return;
  if (!lightbox.classList.contains('is-hidden')) return;

  stopCarousel();

  const isVideo = media instanceof HTMLVideoElement;

  const existingPlayer = lightbox.querySelector('.lightbox__player');
  if (existingPlayer) {
    if (existingPlayer._cleanup) existingPlayer._cleanup();
    const oldVid = existingPlayer.querySelector('video');
    if (oldVid) {
      oldVid.pause();
      oldVid.removeAttribute('src');
      oldVid.load();
    }
    existingPlayer.remove();
  }

  lightboxImg.src = '';
  lightboxImg.removeAttribute('style');
  lightboxImg.style.display = isVideo ? 'none' : '';

  lightbox.classList.add('is-loading');
  lightbox.classList.remove('is-hidden');
  document.body.style.overflow = 'hidden';

  if (lightboxCaption) lightboxCaption.textContent = captionText || '';

  if (isVideo) {
    const wrapper = document.createElement('div');
    wrapper.className = 'lightbox__player';

    const vid = document.createElement('video');
    vid.className = 'lightbox__video';
    vid.playsInline = true;
    vid.controls = false;

    const overlay = document.createElement('div');
    overlay.className = 'lp__overlay lp__overlay--visible';
    overlay.innerHTML = `
      <div class="lp__big-play">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="#0a0a0a" style="margin-left:3px">
          <polygon points="6,3 20,12 6,21"/>
        </svg>
      </div>`;

    const controls = document.createElement('div');
    controls.className = 'lp__controls';
    controls.innerHTML = `
      <div class="lp__progress-wrap">
        <div class="lp__buf"></div>
        <div class="lp__bar"></div>
        <div class="lp__thumb"></div>
      </div>
      <div class="lp__row">
        <button class="lp__btn" id="lpPlay" aria-label="Play/Pause">
          <svg id="lpPlayIcon" viewBox="0 0 24 24" width="18" height="18" fill="#E8E4DA">
            <polygon points="6,3 20,12 6,21"/>
          </svg>
        </button>
        <button class="lp__btn" id="lpMute" aria-label="Mute/Unmute">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="#E8E4DA">
            <path d="M11 5L6 9H2v6h4l5 4V5z"/>
            <path id="lpVolLines" d="M15.5 8.5a5 5 0 0 1 0 7M19 6a9 9 0 0 1 0 12"/>
          </svg>
        </button>
        <input class="lp__vol" type="range" id="lpVol" min="0" max="1" step="0.05" value="1">
        <span class="lp__time" id="lpTime">0:00 / 0:00</span>
        <button class="lp__btn" id="lpFs" aria-label="Tela cheia" style="margin-left:auto">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#E8E4DA" stroke-width="2">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
          </svg>
        </button>
      </div>`;

    wrapper.appendChild(vid);
    wrapper.appendChild(controls);
    wrapper.appendChild(overlay);

    const box = lightbox.querySelector('.lightbox__box');
    box.insertBefore(wrapper, lightboxCaption);

    vid.preload = 'auto';

    function onMeta() {
      const isPortrait = vid.videoHeight > vid.videoWidth;
      wrapper.style.maxWidth = isPortrait ? 'min(90vw, 480px)' : 'min(90vw, 860px)';
      wrapper.style.width = '100%';
      lightbox.classList.remove('is-loading');
      initPlayer(vid, wrapper, overlay);
    }

    if (vid.readyState >= 1) {
      onMeta();
    } else {
      vid.addEventListener('loadedmetadata', onMeta, { once: true });
    }

    vid.src = media.dataset.src || media.src;
    vid.load();
  } else {
    lightboxImg.alt = altText;

    const probe = new Image();

    probe.onload = function () {
      const isPortrait = probe.naturalHeight > probe.naturalWidth;
      lightboxImg.style.maxWidth = isPortrait ? 'min(90vw, 480px)' : 'min(90vw, 860px)';
      lightboxImg.style.maxHeight = isPortrait ? 'min(85vh, 860px)' : 'min(75vh, 540px)';
      lightboxImg.style.width = 'auto';
      lightboxImg.style.height = 'auto';
      lightboxImg.src = media.src;
      lightbox.classList.remove('is-loading');
    };

    probe.onerror = function () {
      lightbox.classList.add('is-hidden');
      document.body.style.overflow = '';
    };

    probe.src = media.src;
  }
}

export function closeLightbox(resumeCarousel) {
  const { lightbox, lightboxImg } = getLightboxEls();
  if (!lightbox) return;

  const player = lightbox.querySelector('.lightbox__player');
  if (player) {
    if (player._cleanup) player._cleanup();
    const vid = player.querySelector('video');
    if (vid) {
      vid.pause();
      vid.removeAttribute('src');
      vid.load();
    }
    player.remove();
  }

  lightboxImg.src = '';
  lightbox.classList.add('is-hidden');
  document.body.style.overflow = '';

  resumeCarousel();
}

export function bindLightboxClose(closeFn) {
  document.getElementById('lightboxClose').addEventListener('click', closeFn);

  document.getElementById('lightbox').addEventListener('click', function (e) {
    if (e.target === this) closeFn();
  });

  document.addEventListener('keydown', function (e) {
    const { lightbox } = getLightboxEls();
    if (e.key === 'Escape' && lightbox && !lightbox.classList.contains('is-hidden')) {
      closeFn();
    }
  });
}
