import { loadSlideVideo, unloadSlideVideo } from './LazyVideo.js';
import { openLightbox, closeLightbox, bindLightboxClose } from './Lightbox.js';

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
let isDragging = false;

const INTERVAL = 3500;

function pad(n) {
  return String(n + 1).padStart(2, '0');
}

function goTo(idx) {
  const prev = current;
  current = ((idx % total) + total) % total;
  track.style.transform = 'translateX(-' + current * 100 + '%)';
  dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
  counter.textContent = pad(current) + ' / ' + pad(total - 1);
  if (prev !== current) unloadSlideVideo(slides[prev]);
  loadSlideVideo(slides[current]);
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

function stopCarousel() {
  clearInterval(autoTimer);
  autoTimer = null;
  clearInterval(progressTimer);
  progressTimer = null;
  unloadSlideVideo(slides[current]);
}

function resumeCarousel() {
  loadSlideVideo(slides[current]);
  restartAuto();
}

slides.forEach((_, i) => {
  const btn = document.createElement('button');
  btn.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
  btn.setAttribute('role', 'tab');
  btn.setAttribute('aria-label', 'Slide ' + (i + 1));
  btn.addEventListener('click', () => goTo(i));
  dotsWrap.appendChild(btn);
});

const dots = dotsWrap.querySelectorAll('.carousel__dot');

document.getElementById('carouselNext').addEventListener('click', function () {
  goTo(current + 1);
});
document.getElementById('carouselPrev').addEventListener('click', function () {
  goTo(current - 1);
});

let sx = 0;
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
      stopCarousel,
    );
  });
});

bindLightboxClose(function () {
  closeLightbox(resumeCarousel);
});

loadSlideVideo(slides[current]);
counter.textContent = pad(0) + ' / ' + pad(total - 1);
restartAuto();
