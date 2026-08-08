export function initPlayer(vid, wrapper, overlay) {
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
