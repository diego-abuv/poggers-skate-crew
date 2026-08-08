function tryPlay(v) {
  if (v.readyState >= 3) {
    v.play().catch(function () {});
  } else {
    v.addEventListener(
      'canplay',
      function onCanPlay() {
        v.removeEventListener('canplay', onCanPlay);
        v.play().catch(function () {});
      },
      { once: true },
    );
  }
}

export function loadSlideVideo(slide) {
  const v = slide.querySelector('video');
  if (!v) return;
  const dataSrc = v.dataset.src;
  if (!dataSrc) return;
  if (v.getAttribute('src') !== dataSrc) {
    v.src = dataSrc;
    v.load();
  }
  tryPlay(v);
}

export function unloadSlideVideo(slide) {
  const v = slide.querySelector('video');
  if (!v || !v.dataset.src) return;
  v.pause();
}

export function initSobreVideo() {
  const sobreVideo = document.querySelector('.sobre__img');
  if (!sobreVideo || !sobreVideo.dataset.src) return;

  const io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          sobreVideo.src = sobreVideo.dataset.src;
          sobreVideo.load();
          sobreVideo.addEventListener(
            'canplay',
            function onCanPlay() {
              sobreVideo.removeEventListener('canplay', onCanPlay);
              sobreVideo.play().catch(function () {});
            },
            { once: true },
          );
          io.disconnect();
        }
      });
    },
    { rootMargin: '200px' },
  );
  io.observe(sobreVideo);
}
