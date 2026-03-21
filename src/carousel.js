(function () {

    // ── DOM refs ──────────────────────────────────────────────────
    const track    = document.getElementById('carouselTrack');
    const dotsWrap = document.getElementById('carouselDots');
    const counter  = document.getElementById('carouselCounter');
    const progress = document.getElementById('carouselProgress');
    const slides   = track.querySelectorAll('.carousel__slide');
    const total    = slides.length;
  
    let current = 0, autoTimer, progressTimer, pct = 0;
    const INTERVAL = 3500;
  
    // ── Dots ──────────────────────────────────────────────────────
    slides.forEach((_, i) => {
      const btn = document.createElement('button');
      btn.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
      btn.setAttribute('role', 'tab');
      btn.setAttribute('aria-label', 'Slide ' + (i + 1));
      btn.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(btn);
    });
  
    const dots = dotsWrap.querySelectorAll('.carousel__dot');
  
    // ── Helpers ───────────────────────────────────────────────────
    function pad(n) {
      return String(n + 1).padStart(2, '0');
    }
  
    // ── Navigation ────────────────────────────────────────────────
    function goTo(idx) {
      current = ((idx % total) + total) % total;
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
      counter.textContent = pad(current) + ' / ' + pad(total - 1);
      restartAuto();
    }
  
    // ── Progress bar ──────────────────────────────────────────────
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
  
    // ── Button controls ───────────────────────────────────────────
    document.getElementById('carouselNext').addEventListener('click', function () { goTo(current + 1); });
    document.getElementById('carouselPrev').addEventListener('click', function () { goTo(current - 1); });
  
    // ── Touch / swipe ─────────────────────────────────────────────
    let sx = 0;
    let isDragging = false;
    const el = document.getElementById('carousel');
  
    el.addEventListener('touchstart', function (e) {
      sx = e.touches[0].clientX;
      isDragging = false;
    }, { passive: true });
  
    el.addEventListener('touchmove', function (e) {
      if (Math.abs(e.touches[0].clientX - sx) > 8) isDragging = true;
    }, { passive: true });
  
    el.addEventListener('touchend', function (e) {
      const diff = sx - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 40) {
        isDragging = true;
        goTo(current + (diff > 0 ? 1 : -1));
      }
    }, { passive: true });
  
    // ── Pause on hover ────────────────────────────────────────────
    el.addEventListener('mouseenter', function () {
      clearInterval(autoTimer);
      clearInterval(progressTimer);
    });
    el.addEventListener('mouseleave', restartAuto);
  
    // ── Lightbox ──────────────────────────────────────────────────
    function getLightboxEls() {
    return {
        lightbox:        document.getElementById('lightbox'),
        lightboxImg:     document.getElementById('lightboxImg'),
        lightboxCaption: document.getElementById('lightboxCaption'),
        lightboxClose:   document.getElementById('lightboxClose'),
    };
    }

    function openLightbox(imgSrc, altText, captionText) {
    const { lightbox, lightboxImg, lightboxCaption } = getLightboxEls();
    if (!lightbox || !lightboxImg) return;

    lightboxImg.src = '';
    lightboxImg.removeAttribute('style');
    lightboxImg.alt = altText;
    lightbox.classList.add('is-loading');
    lightbox.classList.remove('is-hidden');
    document.body.style.overflow = 'hidden';

    const probe = new Image();
    probe.onload = function () {
        const isPortrait = probe.naturalHeight > probe.naturalWidth;
        lightboxImg.style.maxWidth  = isPortrait ? 'min(90vw, 480px)' : 'min(90vw, 860px)';
        lightboxImg.style.maxHeight = isPortrait ? 'min(85vh, 860px)' : 'min(75vh, 540px)';
        lightboxImg.style.width     = 'auto';
        lightboxImg.style.height    = 'auto';
        lightboxImg.src = imgSrc;
        if (lightboxCaption) lightboxCaption.textContent = captionText || '';
        lightbox.classList.remove('is-loading');
    };
    probe.onerror = function () {
        lightbox.classList.add('is-hidden');
        document.body.style.overflow = '';
    };
    probe.src = imgSrc;
    }

    function closeLightbox() {
    const { lightbox, lightboxImg } = getLightboxEls();
    if (!lightbox) return;
    lightbox.classList.add('is-hidden');
    document.body.style.overflow = '';
    lightboxImg.src = '';
    }

    slides.forEach(function (slide) {
    const img     = slide.querySelector('img');
    const caption = slide.querySelector('.carousel__caption');

    slide.style.cursor = 'zoom-in';

    slide.addEventListener('click', function () {
        if (isDragging) { isDragging = false; return; }
        openLightbox(img.src, img.alt, caption ? caption.textContent.trim() : '');
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
  
    // Click on slide image to open lightbox
    slides.forEach(function (slide) {
      const img     = slide.querySelector('img');
      const caption = slide.querySelector('.carousel__caption');
  
      slide.style.cursor = 'zoom-in';
  
      slide.addEventListener('click', function (e) {
        // Don't open if the user was swiping
        if (isDragging) { isDragging = false; return; }
        openLightbox(img.src, img.alt, caption ? caption.textContent.trim() : '');
      });
    });
  
    // Close via button, backdrop click, or Escape key
    lightboxClose.addEventListener('click', closeLightbox);
  
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !lightbox.classList.contains('is-hidden')) closeLightbox();
    });
  
    // ── Init ──────────────────────────────────────────────────────
    restartAuto();
  
  })();