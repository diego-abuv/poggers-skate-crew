/**
 * carousel.js — Asfalto Livre · Poggers Skate Crew
 *
 * RESPONSABILIDADES
 * ─────────────────
 * 1. Carrossel automático com suporte a <img> e <video>
 * 2. Navegação por botões, dots e swipe (touch)
 * 3. Barra de progresso do autoplay
 * 4. Lightbox para imagens (dimensionamento portrait/landscape automático)
 * 5. Player de vídeo customizado no lightbox (seek, volume, fullscreen, buffering)
 *
 * DEPENDÊNCIAS DE MARKUP (index.html)
 * ─────────────────────────────────────
 * #carousel         → container do carrossel
 * #carouselTrack    → flex row com os slides
 * #carouselProgress → barra de progresso do autoplay
 * #carouselCounter  → contador "01 / 03"
 * #carouselPrev     → botão anterior
 * #carouselNext     → botão próximo
 * #carouselDots     → container dos dots (preenchido pelo JS)
 * .carousel__slide  → cada slide (filho do track)
 * #lightbox         → overlay do lightbox
 * #lightboxImg      → <img> do lightbox (para slides de imagem)
 * #lightboxCaption  → legenda do lightbox
 * #lightboxClose    → botão de fechar
 *
 * ESTRUTURA DO PLAYER DE VÍDEO (injetada pelo JS no lightbox)
 * ─────────────────────────────────────────────────────────────
 * .lightbox__player
 *   video.lightbox__video
 *   .lp__controls (z-index 3 — acima do overlay)
 *   .lp__overlay  (z-index 2 — pointer-events:all só quando --visible)
 *     .lp__big-play (pointer-events:none — clique capturado pelo overlay pai)
 *
 * LÓGICA DE CLIQUE DO PLAYER
 * ───────────────────────────
 * - Vídeo tocando : overlay oculto (pointer-events:none) → clique cai no vid → pause
 * - Vídeo pausado : overlay visível (pointer-events:all) → clique no overlay → play
 * - Botões da barra: z-index 3 + stopPropagation → nunca vazam para overlay/vid
 */

(function () {
  'use strict';

  /* ══════════════════════════════════════════════════════════════
     CARROSSEL
  ══════════════════════════════════════════════════════════════ */

  // ── Refs do DOM ──────────────────────────────────────────────
  const track       = document.getElementById('carouselTrack');
  const dotsWrap    = document.getElementById('carouselDots');
  const counter     = document.getElementById('carouselCounter');
  const progress    = document.getElementById('carouselProgress');
  const slides      = track.querySelectorAll('.carousel__slide');
  const total       = slides.length;

  // ── Estado ───────────────────────────────────────────────────
  let current       = 0;
  let autoTimer     = null;
  let progressTimer = null;
  let pct           = 0;

  const INTERVAL = 3500; // ms entre trocas automáticas de slide

  // ── Dots ─────────────────────────────────────────────────────
  slides.forEach((_, i) => {
    const btn = document.createElement('button');
    btn.className = 'carousel__dot' + (i === 0 ? ' is-active' : '');
    btn.setAttribute('role', 'tab');
    btn.setAttribute('aria-label', 'Slide ' + (i + 1));
    btn.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(btn);
  });

  const dots = dotsWrap.querySelectorAll('.carousel__dot');

  // ── Helpers ──────────────────────────────────────────────────

  /**
   * Formata um índice (base 0) como string com zero à esquerda.
   * Exemplo: pad(0) → "01", pad(9) → "10"
   */
  function pad(n) {
    return String(n + 1).padStart(2, '0');
  }

  // ── Navegação ────────────────────────────────────────────────

  /**
   * Navega para o slide de índice idx.
   * Aceita índices fora do range (wrap-around circular).
   */
  function goTo(idx) {
    current = ((idx % total) + total) % total;
    track.style.transform = 'translateX(-' + (current * 100) + '%)';
    dots.forEach((d, i) => d.classList.toggle('is-active', i === current));
    counter.textContent = pad(current) + ' / ' + pad(total - 1);
    restartAuto();
  }

  // ── Progresso do autoplay ────────────────────────────────────

  /**
   * Inicia a animação da barra de progresso do zero.
   * A largura é incrementada a cada 80ms até atingir 100%.
   */
  function startProgress() {
    pct = 0;
    progress.style.width = '0%';
    clearInterval(progressTimer);
    progressTimer = setInterval(function () {
      pct += 100 / (INTERVAL / 80);
      progress.style.width = Math.min(pct, 100) + '%';
    }, 80);
  }

  /**
   * Reinicia o timer do autoplay e a barra de progresso.
   * Chamado ao navegar manualmente ou interagir com o carrossel.
   */
  function restartAuto() {
    clearInterval(autoTimer);
    clearInterval(progressTimer);
    startProgress();
    autoTimer = setInterval(function () {
      goTo(current + 1);
    }, INTERVAL);
  }

  // ── Botões de navegação ──────────────────────────────────────
  document.getElementById('carouselNext').addEventListener('click', function () { goTo(current + 1); });
  document.getElementById('carouselPrev').addEventListener('click', function () { goTo(current - 1); });

  // ── Swipe / Touch ─────────────────────────────────────────────
  let sx         = 0;
  let isDragging = false;
  const el       = document.getElementById('carousel');

  el.addEventListener('touchstart', function (e) {
    sx         = e.touches[0].clientX;
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

  // ── Pausar autoplay no hover ──────────────────────────────────
  el.addEventListener('mouseenter', function () {
    clearInterval(autoTimer);
    clearInterval(progressTimer);
  });
  el.addEventListener('mouseleave', restartAuto);


  /* ══════════════════════════════════════════════════════════════
     LIGHTBOX
  ══════════════════════════════════════════════════════════════ */

  /**
   * Retorna as refs do lightbox a cada uso.
   * Lazy lookup evita erros de "null" se o script carregar antes do DOM.
   */
  function getLightboxEls() {
    return {
      lightbox:        document.getElementById('lightbox'),
      lightboxImg:     document.getElementById('lightboxImg'),
      lightboxCaption: document.getElementById('lightboxCaption'),
      lightboxClose:   document.getElementById('lightboxClose'),
    };
  }

  // ── Player de vídeo customizado ───────────────────────────────

  /**
   * Inicializa todos os controles do player após o vídeo ser inserido no DOM.
   *
   * @param {HTMLVideoElement} vid     - O elemento <video> criado dinamicamente
   * @param {HTMLElement}      wrapper - .lightbox__player que envolve tudo
   * @param {HTMLElement}      overlay - .lp__overlay com o botão play grande
   */
  function initPlayer(vid, wrapper, overlay) {
    const pw      = wrapper.querySelector('.lp__progress-wrap');
    const bar     = wrapper.querySelector('.lp__bar');
    const buf     = wrapper.querySelector('.lp__buf');
    const thumb   = wrapper.querySelector('.lp__thumb');
    const timeEl  = wrapper.querySelector('.lp__time');
    const playBtn = wrapper.querySelector('#lpPlay');
    const playIco = wrapper.querySelector('#lpPlayIcon');
    const muteBtn = wrapper.querySelector('#lpMute');
    const volLns  = wrapper.querySelector('#lpVolLines');
    const volSldr = wrapper.querySelector('#lpVol');
    const fsBtn   = wrapper.querySelector('#lpFs');

    // ── Helpers internos ─────────────────────────────────────────

    /** Formata segundos em "m:ss". Ex: 75 → "1:15" */
    function fmt(s) {
      s = Math.floor(s || 0);
      return Math.floor(s / 60) + ':' + (s % 60 < 10 ? '0' : '') + (s % 60);
    }

    /** Atualiza ícone SVG do botão play/pause na barra de controles. */
    function setIcon(playing) {
      playIco.innerHTML = playing
        ? '<path d="M6 4h4v16H6zm8 0h4v16h-4z"/>'
        : '<polygon points="6,3 20,12 6,21"/>';
    }

    /**
     * Alterna play/pause.
     * readyState >= 1: src foi aceito pelo browser (HAVE_METADATA).
     */
    function toggle() {
      if (vid.readyState < 1) return;
      vid.paused ? vid.play().catch(function () {}) : vid.pause();
    }

    /** Sincroniza barra de progresso e contador de tempo com currentTime. */
    function updateProgress() {
      if (!vid.duration) return;
      const f = vid.currentTime / vid.duration;
      bar.style.transform = 'scaleX(' + f + ')';
      thumb.style.left    = (f * 100) + '%';
      timeEl.textContent  = fmt(vid.currentTime) + ' / ' + fmt(vid.duration);
    }

    // ── Eventos de estado ─────────────────────────────────────────

    vid.addEventListener('play', function () {
      setIcon(true);
      /*
        Remove --visible: overlay fica com opacity:0 e pointer-events:none.
        Cliques passam direto para o vid abaixo → pause.
      */
      overlay.classList.remove('lp__overlay--visible');
    });

    vid.addEventListener('pause', function () {
      setIcon(false);
      /*
        Adiciona --visible: overlay fica com opacity:1 e pointer-events:all.
        Cliques no overlay (incluindo área do botão central) → play.
      */
      overlay.classList.add('lp__overlay--visible');
    });

    vid.addEventListener('ended',    function () { overlay.classList.add('lp__overlay--visible'); });
    vid.addEventListener('waiting',  function () { wrapper.classList.add('lp--buffering'); });
    vid.addEventListener('playing',  function () { wrapper.classList.remove('lp--buffering'); });
    vid.addEventListener('canplay',  function () { wrapper.classList.remove('lp--buffering'); });
    vid.addEventListener('timeupdate', updateProgress);

    vid.addEventListener('progress', function () {
      if (!vid.duration || !vid.buffered.length) return;
      buf.style.transform = 'scaleX(' +
        (vid.buffered.end(vid.buffered.length - 1) / vid.duration) + ')';
    });

    // ── Clique no vídeo → pause ───────────────────────────────────
    // Só alcançado quando overlay está oculto (pointer-events:none),
    // ou seja, vídeo está tocando.
    vid.addEventListener('click', function () {
      toggle();
    });

    // ── Clique no overlay → play ──────────────────────────────────
    // Só alcançado quando overlay está visível (pointer-events:all),
    // ou seja, vídeo está pausado. .lp__big-play tem pointer-events:none,
    // então o clique no botão central também sobe para o overlay.
    overlay.addEventListener('click', function () {
      toggle();
    });

    // ── Botão play da barra ───────────────────────────────────────
    // stopPropagation evita que o clique vaze para overlay ou vid.
    playBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggle();
    });

    // ── Volume ────────────────────────────────────────────────────
    muteBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      vid.muted            = !vid.muted;
      volLns.style.opacity = vid.muted ? '0' : '1';
      volSldr.value        = vid.muted ? 0 : vid.volume;
    });

    volSldr.addEventListener('input', function (e) {
      e.stopPropagation();
      vid.volume           = +this.value;
      vid.muted            = +this.value === 0;
      volLns.style.opacity = vid.muted ? '0' : '1';
    });

    // ── Seek ──────────────────────────────────────────────────────

    /** Atualiza currentTime pela posição horizontal do evento. */
    function seekTo(e) {
      if (!vid.duration) return;
      const r = pw.getBoundingClientRect();
      vid.currentTime = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * vid.duration;
      updateProgress();
    }

    let seeking = false;
    function onMouseMove(e) { if (seeking) seekTo(e); }
    function onMouseUp()    { seeking = false; }

    pw.addEventListener('mousedown', function (e) {
      e.stopPropagation(); // impede toggle ao clicar na barra de progresso
      seeking = true;
      seekTo(e);
    });

    // Document listeners capturam drag fora da barra; removidos via _cleanup
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup',   onMouseUp);

    pw.addEventListener('touchstart', function (e) { seekTo(e.touches[0]); }, { passive: true });
    pw.addEventListener('touchmove',  function (e) { seekTo(e.touches[0]); }, { passive: true });

    // ── Fullscreen ────────────────────────────────────────────────
    fsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      /*
        1. webkitEnterFullscreen → Safari/iOS (só no <video> nativo)
        2. wrapper.requestFullscreen → demais browsers (player inteiro)
        3. vid.requestFullscreen → fallback
      */
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

    /** Alterna ícone do botão fullscreen conforme estado. */
    function onFullscreenChange() {
      const icon = fsBtn.querySelector('svg');
      if (document.fullscreenElement) {
        icon.innerHTML = '<path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" stroke="#E8E4DA" stroke-width="2" fill="none"/>';
      } else {
        icon.innerHTML = '<path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" stroke="#E8E4DA" stroke-width="2" fill="none"/>';
      }
    }

    document.addEventListener('fullscreenchange', onFullscreenChange);

    /*
      _cleanup é chamado por closeLightbox() para remover todos os listeners
      adicionados ao document, prevenindo acúmulo a cada abertura do lightbox.
    */
    wrapper._cleanup = function () {
      document.removeEventListener('mousemove',        onMouseMove);
      document.removeEventListener('mouseup',          onMouseUp);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };

    // ── Autoplay ──────────────────────────────────────────────────
    // canplaythrough garante buffer suficiente antes de iniciar.
    vid.addEventListener('canplaythrough', function () {
      vid.play().catch(function () {
        // Autoplay bloqueado: overlay--visible já está ativo, usuário clica para iniciar
      });
    }, { once: true });
  }

  // ── Abrir lightbox ────────────────────────────────────────────

  /**
   * Abre o lightbox com a mídia do slide clicado.
   *
   * @param {HTMLImageElement|HTMLVideoElement} media       - Elemento de mídia do slide
   * @param {string}                            altText     - alt / aria-label
   * @param {string}                            captionText - Legenda do slide
   */
  function openLightbox(media, altText, captionText) {
    const { lightbox, lightboxImg, lightboxCaption } = getLightboxEls();
    if (!lightbox || !lightboxImg) return;

    const isVideo = media instanceof HTMLVideoElement;

    // Cleanup de player anterior (reabertura sem fechar)
    const existingPlayer = lightbox.querySelector('.lightbox__player');
    if (existingPlayer) {
      if (existingPlayer._cleanup) existingPlayer._cleanup();
      const oldVid = existingPlayer.querySelector('video');
      if (oldVid) { oldVid.pause(); oldVid.src = ''; }
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
      vid.className   = 'lightbox__video';
      vid.playsInline = true;
      vid.controls    = false;

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

      /*
        Ordem no DOM:
        1. vid      → base (z-index implícito 0)
        2. controls → z-index 3 (recebe seus próprios cliques via stopPropagation)
        3. overlay  → z-index 2 (abaixo dos controles, acima do vid)
           - pointer-events:none quando oculto → cliques caem no vid
           - pointer-events:all quando visível → cliques vão pro overlay → toggle
      */
      wrapper.appendChild(vid);
      wrapper.appendChild(controls);
      wrapper.appendChild(overlay);

      const box = lightbox.querySelector('.lightbox__box');
      box.insertBefore(wrapper, lightboxCaption);

      /*
        src definido DEPOIS da inserção no DOM.
        Browsers podem não disparar loadedmetadata em elementos detached.
      */
      vid.preload = 'auto';

      function onMeta() {
        const isPortrait       = vid.videoHeight > vid.videoWidth;
        wrapper.style.maxWidth = isPortrait ? 'min(90vw, 480px)' : 'min(90vw, 860px)';
        wrapper.style.width    = '100%';
        lightbox.classList.remove('is-loading');
        initPlayer(vid, wrapper, overlay);
      }

      // readyState >= 1: metadados já disponíveis (cache)
      if (vid.readyState >= 1) {
        onMeta();
      } else {
        vid.addEventListener('loadedmetadata', onMeta, { once: true });
      }

      vid.src = media.src;
      vid.load();

    } else {

      lightboxImg.alt = altText;

      // Probe off-screen para ler dimensões antes de exibir
      const probe = new Image();

      probe.onload = function () {
        const isPortrait            = probe.naturalHeight > probe.naturalWidth;
        lightboxImg.style.maxWidth  = isPortrait ? 'min(90vw, 480px)' : 'min(90vw, 860px)';
        lightboxImg.style.maxHeight = isPortrait ? 'min(85vh, 860px)' : 'min(75vh, 540px)';
        lightboxImg.style.width     = 'auto';
        lightboxImg.style.height    = 'auto';
        lightboxImg.src             = media.src;
        lightbox.classList.remove('is-loading');
      };

      probe.onerror = function () {
        lightbox.classList.add('is-hidden');
        document.body.style.overflow = '';
      };

      probe.src = media.src;
    }
  }

  // ── Fechar lightbox ───────────────────────────────────────────

  /**
   * Fecha o lightbox com cleanup completo.
   */
  function closeLightbox() {
    const { lightbox, lightboxImg } = getLightboxEls();
    if (!lightbox) return;

    const player = lightbox.querySelector('.lightbox__player');
    if (player) {
      if (player._cleanup) player._cleanup();
      const vid = player.querySelector('video');
      if (vid) { vid.pause(); vid.src = ''; }
      player.remove();
    }

    lightboxImg.src = '';
    lightbox.classList.add('is-hidden');
    document.body.style.overflow = '';
  }

  // ── Click nos slides → lightbox ──────────────────────────────
  slides.forEach(function (slide) {
    const img     = slide.querySelector('img');
    const video   = slide.querySelector('video');
    const caption = slide.querySelector('.carousel__caption');

    slide.style.cursor = 'zoom-in';

    slide.addEventListener('click', function () {
      if (isDragging) { isDragging = false; return; }
      const media = video || img;
      if (!media) return;
      openLightbox(
        media,
        media.alt || media.getAttribute('aria-label') || '',
        caption ? caption.textContent.trim() : ''
      );
    });
  });

  // ── Handlers de fechamento ────────────────────────────────────

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

  /* ══════════════════════════════════════════════════════════════
     INIT
  ══════════════════════════════════════════════════════════════ */

  counter.textContent = pad(0) + ' / ' + pad(total - 1);
  restartAuto();

})();