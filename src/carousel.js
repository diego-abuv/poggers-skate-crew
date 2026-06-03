(function () {
  'use strict';

  const track = document.getElementById('carouselTrack');
  const dotsWrap = document.getElementById('carouselDots');
  const counter = document.getElementById('carouselCounter');
  const progress = document.getElementById('carouselProgress');
  const slides = track.querySelectorAll('.carousel__slide');
  const total = slides.length;

  let current = 0;
  let autoTimer = null;
  let progressTimer = null;
  let pct = 0;

  const INTERVAL = 3500;

  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', 'Slide ' + (i + 1));
    btn.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(btn);
  });

  const dots = dotsWrap.querySelectorAll('.carousel__dot');

  function pad(n) {
    return String(n + 1).padStart(2, '0');
  }

  function goTo(idx) {
    current = ((idx % total) + total) % total;
    track.style.transform = 'translateX(-' + current * 100 + '%)';
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    counter.textContent = pad(current) + ' / ' + pad(total - 1);
    restartAuto();
  }

  function startProgress() {
    pct = 0;
    progress.style.width = '0%';
    clearInterval(progressTimer);
    progressTimer = setInterval(function () {
      pct += 100 / (INTERVAL / 80);
      progress.style.width = Math.min(pct, 100) + '%';
    }, 80);
  }

  function restartAuto() {
    clearInterval(autoTimer);
    clearInterval(progressTimer);
    startProgress();
    autoTimer = setInterval(function () {
      goTo(current + 1);
    }, INTERVAL);
  }

  document.getElementById('carouselNext').addEventListener('click', function () {
    goTo(current + 1);
  });
  document.getElementById('carouselPrev').addEventListener('click', function () {
    goTo(current - 1);
  });

  let sx = 0;
  let isDragging = false;
  const el = document.getElementById('carousel');

  el.addEventListener(
    'touchstart',
    function (e) {
      sx = e.touches[0].clientX;
      isDragging = false;
    },
    { passive: true },
  );

  el.addEventListener(
    'touchmove',
    function (e) {
      if (Math.abs(e.touches[0].clientX - sx) > 8) isDragging = true;
    },
    { passive: true },
  );

  el.addEventListener(
    'touchend',
    function (e) {
      const diff = sx - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        isDragging = true;
        goTo(current + (diff > 0 ? 1 : -1));
      }
    },
    { passive: true },
  );

  el.addEventListener('mouseenter', function () {
    clearInterval(autoTimer);
    clearInterval(progressTimer);
  });
  el.addEventListener('mouseleave', function () {
    const lb = document.getElementById('lightbox');
    if (lb && lb.classList.contains('is-hidden')) {
      restartAuto();
    }
  });

  function saveVideoSources() {
    slides.forEach(function (s) {
      const v = s.querySelector('video');
      if (v && !v._srcSaved) {
        v._srcSaved = v.getAttribute('src');
      }
    });
  }

  function stopCarousel() {
    clearInterval(autoTimer);
    autoTimer = null;
    clearInterval(progressTimer);
    progressTimer = null;
    slides.forEach(function (s) {
      const v = s.querySelector('video');
      if (v && v._srcSaved) {
        v.pause();
        v.removeAttribute('src');
        v.load();
      }
    });
  }

  function resumeCarousel() {
    slides.forEach(function (s, i) {
      const v = s.querySelector('video');
      if (v && v._srcSaved) {
        v.src = v._srcSaved;
        v.load();
        if (i === current) {
          v.play().catch(function () {});
        }
      }
    });
    restartAuto();
  }

  function getLightboxEls() {
    return {
      lightbox: document.getElementById('lightbox'),
      lightboxImg: document.getElementById('lightboxImg'),
      lightboxCaption: document.getElementById('lightboxCaption'),
      lightboxClose: document.getElementById('lightboxClose'),
    };
  }

  function initPlayer(vid, wrapper, overlay) {
    const pw = wrapper.querySelector('.lp__progress-wrap');
    const bar = wrapper.querySelector('.lp__bar');
    const buf = wrapper.querySelector('.lp__buf');
    const thumb = wrapper.querySelector('.lp__thumb');
    const timeEl = wrapper.querySelector('.lp__time');
    const playBtn = wrapper.querySelector('#lpPlay');
    const playIco = wrapper.querySelector('#lpPlayIcon');
    const muteBtn = wrapper.querySelector('#lpMute');
    const volLns = wrapper.querySelector('#lpVolLines');
    const volSldr = wrapper.querySelector('#lpVol');
    const fsBtn = wrapper.querySelector('#lpFs');

    function fmt(s) {
      s = Math.floor(s || 0);
      return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
    }

    function setIcon(playing) {
      playIco.innerHTML = playing
        ? '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>'
        : '<polygon points="6,3 20,12 6,21"/>';
    }

    function toggle() {
      if (vid.readyState < 1) return;
      vid.paused ? vid.play().catch(function () {}) : vid.pause();
    }

    function updateProgress() {
      if (!vid.duration) return;
      const f = vid.currentTime / vid.duration;
      bar.style.transform = 'scaleX(' + f + ')';
      thumb.style.left = f * 100 + '%';
      timeEl.textContent = fmt(vid.currentTime) + ' / ' + fmt(vid.duration);
    }

    vid.addEventListener('play', function () {
      setIcon(true);

      overlay.classList.remove('lp__overlay--visible');
    });

    vid.addEventListener('pause', function () {
      setIcon(false);

      overlay.classList.add('lp__overlay--visible');
    });

    vid.addEventListener('ended', function () {
      overlay.classList.add('lp__overlay--visible');
    });
    vid.addEventListener('waiting', function () {
      wrapper.classList.add('lp--buffering');
    });
    vid.addEventListener('playing', function () {
      wrapper.classList.remove('lp--buffering');
    });
    vid.addEventListener('canplay', function () {
      wrapper.classList.remove('lp--buffering');
    });
    vid.addEventListener('timeupdate', updateProgress);

    vid.addEventListener('progress', function () {
      if (!vid.duration || !vid.buffered.length) return;
      buf.style.transform =
        'scaleX(' + vid.buffered.end(vid.buffered.length - 1) / vid.duration + ')';
    });

    vid.addEventListener('click', function () {
      toggle();
    });

    overlay.addEventListener('click', function () {
      toggle();
    });

    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });

    muteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      vid.muted = !vid.muted;
      volLns.style.opacity = vid.muted ? '0' : '1';
      volSldr.value = vid.muted ? 0 : vid.volume;
    });

    volSldr.addEventListener('input', function (e) {
      e.stopPropagation();
      vid.volume = +this.value;
      vid.muted = +this.value === 0;
      volLns.style.opacity = vid.muted ? '0' : '1';
    });

    function seekTo(e) {
      if (!vid.duration) return;
      const r = pw.getBoundingClientRect();
      vid.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * vid.duration;
      updateProgress();
    }

    let seeking = false;
    function onMouseMove(e) {
      if (seeking) seekTo(e);
    }
    function onMouseUp() {
      seeking = false;
    }

    pw.addEventListener('mousedown', function (e) {
      e.stopPropagation();
      seeking = true;
      seekTo(e);
    });

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    pw.addEventListener(
      'touchstart',
      function (e) {
        seekTo(e.touches[0]);
      },
      { passive: true },
    );
    pw.addEventListener(
      'touchmove',
      function (e) {
        seekTo(e.touches[0]);
      },
      { passive: true },
    );

    fsBtn.addEventListener('click', function (e) {
      e.stopPropagation();

      if (vid.webkitEnterFullscreen) {
        vid.webkitEnterFullscreen();
        return;
      }
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        const target = wrapper.requestFullscreen ? wrapper : vid;
        target.requestFullscreen().catch(function (err) {
          console.warn('Fullscreen bloqueado:', err);
        });
      }
    });

    function onFullscreenChange() {
      const icon = fsBtn.querySelector('svg');
      if (document.fullscreenElement) {
        icon.innerHTML =
          '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="#E8E4DA" stroke-width="2" fill="none"/>';
      } else {
        icon.innerHTML =
          '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="#E8E4DA" stroke-width="2" fill="none"/>';
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);

    wrapper._cleanup = function () {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };

    vid.addEventListener(
      'canplaythrough',
      function () {
        vid.play().catch(function () {});
      },
      { once: true },
    );
  }

  function openLightbox(media, altText, captionText) {
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

      vid.src = media._srcSaved || media.src;
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

  function closeLightbox() {
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

  slides.forEach(function (slide) {
    const img = slide.querySelector('img');
    const video = slide.querySelector('video');
    const caption = slide.querySelector('.carousel__caption');

    slide.style.cursor = 'zoom-in';

    slide.addEventListener('click', function () {
      if (isDragging) {
        isDragging = false;
        return;
      }
      const media = video || img;
      if (!media) return;
      openLightbox(
        media,
        media.alt || media.getAttribute('aria-label') || '',
        caption ? caption.textContent.trim() : '',
      );
    });
  });

  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);

  document.getElementById('lightbox').addEventListener('click', function (e) {
    if (e.target === this) closeLightbox();
  });

  document.addEventListener('keydown', function (e) {
    const { lightbox } = getLightboxEls();
    if (e.key === 'Escape' && lightbox && !lightbox.classList.contains('is-hidden')) {
      closeLightbox();
    }
  });

  saveVideoSources();
  counter.textContent = pad(0) + ' / ' + pad(total - 1);
  restartAuto();
})();
