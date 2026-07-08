/* =========================================================
   Jerrix Studio — Endless Summer Syndrome
   Interactions: nav, reveal, lightbox, ambient video
   ========================================================= */
(function () {
  'use strict';

  /* ---------- language preference (remember choice + redirect returning visitors) ----------
     Default is always the page as served (English at /, Chinese at /zh/). We only ever
     redirect a *returning* visitor who previously clicked the switcher to the other language.
     The switcher link already points at this page's counterpart, so we just follow its href. */
  var langSwitch = document.querySelector('[data-lang-switch]');
  if (langSwitch) {
    var curLang = document.documentElement.lang.indexOf('zh') === 0 ? 'zh' : 'en';
    var otherLang = curLang === 'zh' ? 'en' : 'zh';
    try {
      if (localStorage.getItem('lang') === otherLang) {
        window.location.replace(langSwitch.href);
      }
    } catch (e) {}
    langSwitch.addEventListener('click', function () {
      try { localStorage.setItem('lang', otherLang); } catch (e) {}
    });
  }

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

  /* ---------- nav dropdown group(s) ---------- */
  var navGroups = Array.prototype.slice.call(document.querySelectorAll('[data-nav-group]'));
  function closeGroups(except) {
    navGroups.forEach(function (g) {
      if (g === except) return;
      g.classList.remove('is-open');
      var b = g.querySelector('.nav__grouptoggle');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  }
  navGroups.forEach(function (group) {
    var btn = group.querySelector('.nav__grouptoggle');
    if (!btn) return;
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !group.classList.contains('is-open');
      closeGroups(group);
      group.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    group.querySelectorAll('.nav__submenu a').forEach(function (a) {
      a.addEventListener('click', function () {
        group.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
  });
  if (navGroups.length) {
    document.addEventListener('click', function (e) {
      if (!e.target.closest('[data-nav-group]')) closeGroups(null);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeGroups(null);
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

  /* ---------- ambient story video (lazy + reduced-motion aware) ---------- */
  var video = document.getElementById('storyVideo');
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

  /* ---------- scroll-spy: highlight the in-view section's nav link ----------
     Only same-page anchor links (#story, ...) participate. On other pages the
     nav points to index.html#..., which don't match [href^="#"], so this is a
     no-op there. The topmost section inside the centre band wins. */
  var spyLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__links a[href^="#"]'));
  if (spyLinks.length && 'IntersectionObserver' in window) {
    var spySections = [];
    spyLinks.forEach(function (a) {
      var sec = document.getElementById(a.getAttribute('href').slice(1));
      if (sec) spySections.push(sec);
    });
    var spyVisible = {};
    var spyLock = false, spyLockTimer;
    function markActive(id) {
      spyLinks.forEach(function (a) {
        a.classList.toggle('is-current', !!id && a.getAttribute('href').slice(1) === id);
      });
    }
    function setSpyActive() {
      if (spyLock) return; // during a click-jump, keep the destination highlighted
      var activeId = null;
      for (var i = 0; i < spySections.length; i++) {
        if (spyVisible[spySections[i].id]) { activeId = spySections[i].id; break; }
      }
      markActive(activeId);
    }
    var spyObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { spyVisible[e.target.id] = e.isIntersecting; });
      setSpyActive();
    }, { rootMargin: '-40% 0px -40% 0px', threshold: 0 });
    spySections.forEach(function (s) { spyObserver.observe(s); });

    // Clicking a nav anchor smooth-scrolls past intermediate sections; lock the
    // highlight to the destination so it doesn't strobe through them on the way.
    function spyUnlock() { if (spyLock) { spyLock = false; setSpyActive(); } }
    spyLinks.forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        var target = document.getElementById(id);
        if (!target) return;
        e.preventDefault();
        spyLock = true;
        markActive(id);
        var navH = (nav ? nav.offsetHeight : 68) + 12;
        var y = target.getBoundingClientRect().top + window.pageYOffset - navH;
        window.scrollTo({ top: y, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
        if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
        clearTimeout(spyLockTimer);
        spyLockTimer = setTimeout(spyUnlock, 1000); // fallback if scrollend is unsupported
      });
    });
    window.addEventListener('scrollend', spyUnlock);
  }

  /* ---------- ambient background music (Endless Summer Time) ----------
     Web Audio so we can honour the game's loop points: the intro plays once
     (0 → 230s), then the [115s, 230s] tail loops seamlessly. Auto-starts on the
     first user gesture unless the visitor previously turned it off. */
  (function initMusic() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;

    var SRC = '/assets/audio/endless_summer_time.mp3';
    var LOOP_START = 115.0, LOOP_END = 230.0, VOLUME = 0.28, FADE = 1.2;

    var btn = document.createElement('button');
    btn.className = 'music-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-pressed', 'false');
    btn.setAttribute('aria-label', 'Toggle background music');
    btn.title = 'Music';
    btn.innerHTML = '<span class="music-toggle__bars" aria-hidden="true"><i></i><i></i><i></i><i></i></span>';
    document.body.appendChild(btn);

    var ctx, gain, source, buffer, bytes, playing = false;

    function stored() { try { return localStorage.getItem('ess-music'); } catch (e) { return null; } }
    function store(v) { try { localStorage.setItem('ess-music', v); } catch (e) {} }

    function getBytes() {
      if (!bytes) bytes = fetch(SRC).then(function (r) { return r.arrayBuffer(); });
      return bytes;
    }
    function getBuffer() {
      if (buffer) return Promise.resolve(buffer);
      // slice() so the cached bytes survive decodeAudioData detaching the buffer
      return getBytes().then(function (b) { return ctx.decodeAudioData(b.slice(0)); })
        .then(function (d) { buffer = d; return d; });
    }
    function fadeTo(v) {
      var t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(gain.gain.value, t);
      gain.gain.linearRampToValueAtTime(v, t + FADE);
    }
    function setState(on) {
      playing = on;
      btn.classList.toggle('is-playing', on);
      btn.setAttribute('aria-pressed', String(on));
    }
    function play() {
      if (!ctx) { ctx = new AC(); gain = ctx.createGain(); gain.gain.value = 0; gain.connect(ctx.destination); }
      // Resume MUST complete before we start the source + schedule the fade,
      // otherwise the gain ramp is scheduled against a frozen clock and the
      // track plays silently (raising gain only takes effect once running).
      var begin = function () {
        getBuffer().then(function () {
          if (playing) return;
          source = ctx.createBufferSource();
          source.buffer = buffer;
          source.loop = true;
          source.loopStart = LOOP_START;
          source.loopEnd = LOOP_END;
          source.connect(gain);
          source.start(0);
          setState(true);
          fadeTo(VOLUME);
        })['catch'](function () {});
      };
      if (ctx.state === 'suspended' && ctx.resume) {
        ctx.resume().then(begin, begin);
      } else {
        begin();
      }
    }
    function pause() {
      if (!playing || !source) return;
      var s = source;
      fadeTo(0);
      setTimeout(function () { try { s.stop(); } catch (e) {} }, FADE * 1000 + 60);
      source = null;
      setState(false);
    }

    btn.addEventListener('click', function () {
      if (playing) { pause(); store('off'); }
      else { play(); store('on'); }
    });

    if (stored() !== 'off') {
      (window.requestIdleCallback || function (f) { setTimeout(f, 1500); })(function () { getBytes(); });
      var evs = ['pointerdown', 'keydown', 'touchstart'];
      var removeKick = function () { evs.forEach(function (ev) { window.removeEventListener(ev, kick, true); }); };
      var kick = function (e) {
        removeKick();
        // if the first gesture was the toggle itself, let its click handler decide
        if (e && e.target && e.target.closest && e.target.closest('.music-toggle')) return;
        play();
      };
      evs.forEach(function (ev) { window.addEventListener(ev, kick, true); });
    }
  })();
})();
