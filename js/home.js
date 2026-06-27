/* =========================================================
   Jerrix Studio — Endless Summer Syndrome
   Interactions: nav, reveal, lightbox, ambient video
   ========================================================= */
(function () {
  'use strict';

  var prefersReducedMotion =
    window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- sticky nav state ---------- */
  var nav = document.getElementById('nav');
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  function closeMenu() {
    if (!toggle || !links) return;
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    links.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /* ---------- reveal on scroll (bidirectional + persistent) ----------
     Pure IntersectionObserver — no scroll listeners — and it only ever
     animates opacity/transform, which composite on the GPU. So re-firing
     the fade every time an element crosses the viewport edge costs next to
     nothing. We keep observing (never unobserve) and toggle instead of
     one-shot, so content fades out when scrolled past and back in on return. */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        } else {
          // Offset the hidden element toward the edge it's leaving by, so the
          // fade travels with the scroll: exit via the top (scrolling down) →
          // drift up; exit via the bottom (scrolling up) → drift down. Rects
          // come off the entry, so reading them forces no layout — still free.
          var r = entry.boundingClientRect, rb = entry.rootBounds;
          var above = rb ? (r.top + r.bottom) / 2 < (rb.top + rb.bottom) / 2 : r.top < 0;
          entry.target.classList.toggle('is-above', above);
          entry.target.classList.remove('is-visible');
        }
      });
      // Central band: an element counts as "in" only while it sits in the
      // middle ~60% of the viewport, so it visibly fades both as it rises out
      // the top (scrolling down) and as it sinks out the bottom (scrolling up).
    }, { threshold: 0, rootMargin: '-20% 0px -20% 0px' });
    revealEls.forEach(function (el) { revObserver.observe(el); });
  }

  /* ---------- ambient logline video (lazy + reduced-motion aware) ---------- */
  var video = document.getElementById('loglineVideo');
  if (video && !prefersReducedMotion && 'IntersectionObserver' in window) {
    var loaded = false;
    var vidObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (!loaded) {
            var source = video.querySelector('source[data-src]');
            if (source) { source.src = source.getAttribute('data-src'); video.load(); }
            loaded = true;
          }
          var p = video.play();
          if (p && typeof p.catch === 'function') p.catch(function () {});
        } else if (loaded) {
          video.pause();
        }
      });
    }, { threshold: 0.2 });
    vidObserver.observe(video);
  }

  /* ---------- gallery lightbox ---------- */
  var shots = Array.prototype.slice.call(document.querySelectorAll('.shot'));
  var lightbox = document.getElementById('lightbox');
  if (shots.length && lightbox) {
    var lbImg = document.getElementById('lightboxImg');
    var lbCaption = document.getElementById('lightboxCaption');
    var btnClose = document.getElementById('lightboxClose');
    var btnPrev = document.getElementById('lightboxPrev');
    var btnNext = document.getElementById('lightboxNext');
    var current = 0;
    var lastFocused = null;

    var items = shots.map(function (s) {
      var img = s.querySelector('img');
      return {
        full: s.getAttribute('data-full'),
        caption: s.getAttribute('data-caption') || '',
        alt: img ? img.getAttribute('alt') : ''
      };
    });

    function show(i) {
      current = (i + items.length) % items.length;
      var it = items[current];
      lbImg.src = it.full;
      lbImg.alt = it.alt;
      lbCaption.textContent = it.caption;
    }
    function open(i) {
      lastFocused = document.activeElement;
      show(i);
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
      btnClose.focus();
    }
    function close() {
      lightbox.hidden = true;
      document.body.style.overflow = '';
      lbImg.src = '';
      if (lastFocused && lastFocused.focus) lastFocused.focus();
    }

    shots.forEach(function (s, i) {
      s.addEventListener('click', function () { open(i); });
    });
    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', function () { show(current - 1); });
    btnNext.addEventListener('click', function () { show(current + 1); });
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', function (e) {
      if (lightbox.hidden) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(current - 1);
      else if (e.key === 'ArrowRight') show(current + 1);
      else if (e.key === 'Tab') {
        // trap focus within the dialog controls
        var f = [btnClose, btnPrev, btnNext];
        var idx = f.indexOf(document.activeElement);
        var dir = e.shiftKey ? -1 : 1;
        e.preventDefault();
        (f[(idx + dir + f.length) % f.length] || btnClose).focus();
      }
    });
  }

  /* ---------- footer year safety (static 2026, but keep current if later) ---------- */
})();
