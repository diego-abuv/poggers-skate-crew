import { openLightbox, closeLightbox, bindLightboxClose } from './components/Lightbox.js';

const R2_BASE = 'https://pub-492dfc52bf1c49a8b28debf94323c213.r2.dev';
const WORKER_URL = 'https://poggers-media-api.abuvitordiego-contato.workers.dev/api/media';
const MEDIA_JSON = '/media.json';

const grid = document.getElementById('galleryGrid');
const filters = document.querySelectorAll('.gallery__filter');
let allMedia = [];
let currentFilter = 'all';

async function loadMedia() {
  let data = null;

  try {
    const res = await fetch(WORKER_URL, { cache: 'no-store' });
    if (res.ok) data = await res.json();
  } catch (_) {}

  if (!data) {
    try {
      const res = await fetch(MEDIA_JSON);
      if (res.ok) data = await res.json();
    } catch (_) {}
  }

  if (!data || !data.media) {
    grid.innerHTML = '<p class="gallery__empty">Nenhuma mídia encontrada.</p>';
    return;
  }

  allMedia = data.media.map((item) => ({
    ...item,
    src: item.src.startsWith('http') ? item.src : `${R2_BASE}${item.src}`,
    thumb: item.thumb ? (item.thumb.startsWith('http') ? item.thumb : `${R2_BASE}${item.thumb}`) : undefined,
  }));

  renderGrid(allMedia);
}

function renderGrid(items) {
  if (!items.length) {
    grid.innerHTML = '<p class="gallery__empty">Nenhuma mídia nesta categoria.</p>';
    return;
  }

  grid.innerHTML = '';

  items.forEach((item, idx) => {
    const card = document.createElement('figure');
    card.className = 'gallery__card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', item.caption || item.alt || 'Mídia');

    if (item.type === 'video') {
      const thumb = item.thumb || `${R2_BASE}/thumbs/${item.src.split('/').pop().replace(/\.[^.]+$/, '.webp')}`;
      card.innerHTML = `
        <div class="gallery__thumb-wrap">
          <img class="gallery__thumb" src="${thumb}" alt="${item.alt || ''}" loading="lazy" />
          <div class="gallery__play">
            <svg viewBox="0 0 24 24" width="28" height="28" fill="#E8E4DA">
              <polygon points="8,5 20,12 8,19"/>
            </svg>
          </div>
        </div>
        <figcaption class="gallery__caption">${item.caption || ''}</figcaption>
      `;

      const video = document.createElement('video');
      video.preload = 'none';
      video.playsInline = true;
      video.muted = true;
      video.dataset.src = item.src;
      card._videoSrc = item.src;
      card._isVideo = true;
    } else {
      card.innerHTML = `
        <div class="gallery__thumb-wrap">
          <img class="gallery__thumb" src="${item.src}" alt="${item.alt || ''}" loading="lazy" />
        </div>
        <figcaption class="gallery__caption">${item.caption || ''}</figcaption>
      `;
      card._isVideo = false;
    }

    card._item = item;

    card.addEventListener('click', () => openItem(card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openItem(card);
      }
    });

    grid.appendChild(card);
  });
}

function openItem(card) {
  const item = card._item;

  if (item.type === 'video') {
    const video = document.createElement('video');
    video.src = item.src;
    video.preload = 'auto';
    video.playsInline = true;
    video.controls = false;
    video.muted = true;
    video.className = 'lightbox__video';
    openLightbox(video, item.alt || '', item.caption || '');
  } else {
    const img = new Image();
    img.src = item.src;
    img.alt = item.alt || '';
    openLightbox(img, item.alt || '', item.caption || '');
  }
}

filters.forEach((btn) => {
  btn.addEventListener('click', () => {
    filters.forEach((f) => f.classList.remove('is-active'));
    btn.classList.add('is-active');
    currentFilter = btn.dataset.filter;

    const filtered = currentFilter === 'all' ? allMedia : allMedia.filter((m) => m.type === currentFilter);
    renderGrid(filtered);
  });
});

bindLightboxClose(() => closeLightbox());

loadMedia();
