/* GreenMetrics shared interactions. Loaded with <script src="assets/gm-fx.js" defer> on every page. */
(function () {
  if (window.__gmfx) return;
  window.__gmfx = 1;

  var d = document, root = d.documentElement;
  var rm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  function $(s, r) { return (r || d).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || d).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function init() {
    try { killTicker(); } catch (e) {}
    try { navIndicator(); } catch (e) {}
    try { $$('.hh-car').forEach(initCar); } catch (e) {}
    try { servicesFilter(); } catch (e) {}
    try { countUp(); } catch (e) {}
    if (!rm) {
      try { reveal(); } catch (e) {}
      try { headingUnderline(); } catch (e) {}
      try { spotlight(); } catch (e) {}
      try { scrollParallax(); } catch (e) {}
      try { pageTransitions(); } catch (e) {}
    }
    if (fine && !rm) {
      try { tilt(); } catch (e) {}
      try { magnetic(); } catch (e) {}
      try { leafTrail(); } catch (e) {}
    }
    try { ripple(); } catch (e) {}
  }

  /* the old marquee strip above the hero is retired site-wide */
  function killTicker() { $$('.tick').forEach(function (t) { t.remove(); }); }

  /* sliding underline in the tab bar, on every page */
  function navIndicator() {
    var nav = $('nav.tabs');
    if (!nav || $('.tab-indicator', nav)) return;
    var ind = d.createElement('div'); ind.className = 'tab-indicator'; nav.appendChild(ind);
    var links = $$('a', nav), act = $('a.active', nav) || links[0];
    function place(e) { if (e) { ind.style.left = e.offsetLeft + 'px'; ind.style.width = e.offsetWidth + 'px'; } }
    requestAnimationFrame(function () { place(act); });
    addEventListener('resize', function () { place(act); });
    links.forEach(function (l) { l.addEventListener('mouseenter', function () { place(l); }); });
    nav.addEventListener('mouseleave', function () { place(act); });
  }

  /* ---------------------------------------------------------------- hero carousel */
  function initCar(car) {
    var slides = $$('.hh-slide', car), n = slides.length; if (!n) return;
    var dotsBox = $('.hh-dots', car), tabs = $$('.hh-tabs button', car);
    var count = $('.hh-count', car), pp = $('.hh-pp', car);
    var i = 0, DUR = 5800, dots = [];
    car.style.setProperty('--dur', DUR + 'ms');

    slides.forEach(function (s, k) {
      var b = d.createElement('button'); b.type = 'button'; b.className = 'hh-dot';
      b.setAttribute('aria-label', 'Go to slide ' + (k + 1) + ': ' + ($('b', s) ? $('b', s).textContent : ''));
      b.innerHTML = '<i></i>';
      b.addEventListener('click', function () { go(k); });
      dotsBox.appendChild(b); dots.push(b);
    });

    function go(k) {
      i = (k + n) % n;
      slides.forEach(function (s, j) {
        var on = j === i;
        s.classList.toggle('is-active', on);
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        s.tabIndex = on ? 0 : -1;
      });
      var kind = slides[i].getAttribute('data-kind');
      tabs.forEach(function (t) { t.setAttribute('aria-pressed', t.getAttribute('data-kind') === kind ? 'true' : 'false'); });
      dots.forEach(function (b, j) { b.classList.remove('on'); if (j === i) { void b.offsetWidth; b.classList.add('on'); } });
      if (count) count.textContent = ('0' + (i + 1)).slice(-2) + ' / ' + ('0' + n).slice(-2);
    }

    /* auto-advance is driven by the progress bar animation finishing, so the bar and the slide never drift apart.
       Hover / focus / off-screen / the pause button all freeze the same animation. */
    dotsBox.addEventListener('animationend', function (e) { if (e.animationName === 'hhFill') go(i + 1); });

    function pause(on) { car.classList.toggle('is-paused', on); }
    car.addEventListener('mouseenter', function () { pause(true); });
    car.addEventListener('mouseleave', function () { pause(false); });
    car.addEventListener('focusin', function () { pause(true); });
    car.addEventListener('focusout', function () { pause(false); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (es) { car.classList.toggle('is-paused', !es[0].isIntersecting); }, { threshold: .25 }).observe(car);
    }
    d.addEventListener('visibilitychange', function () { pause(d.hidden); });

    if (pp) pp.addEventListener('click', function () {
      var held = car.classList.toggle('is-held');
      pp.textContent = held ? '▶' : '❚❚';
      pp.setAttribute('aria-label', held ? 'Play slideshow' : 'Pause slideshow');
      pp.setAttribute('aria-pressed', held ? 'true' : 'false');
    });
    $('.hh-prev', car).addEventListener('click', function () { go(i - 1); });
    $('.hh-next', car).addEventListener('click', function () { go(i + 1); });

    /* jump to the first slide of a type (Articles / Tools / Courses / Videos) */
    tabs.forEach(function (t) {
      t.addEventListener('click', function () {
        var kind = t.getAttribute('data-kind');
        for (var k = 0; k < n; k++) { if (slides[k].getAttribute('data-kind') === kind) { go(k); break; } }
      });
    });

    car.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { go(i - 1); e.preventDefault(); }
      if (e.key === 'ArrowRight') { go(i + 1); e.preventDefault(); }
    });

    /* swipe */
    var x0 = null, moved = false;
    car.addEventListener('pointerdown', function (e) { if (e.target.closest('.hh-bar')) return; x0 = e.clientX; moved = false; });
    car.addEventListener('pointermove', function (e) { if (x0 !== null && Math.abs(e.clientX - x0) > 12) moved = true; });
    car.addEventListener('pointerup', function (e) {
      if (x0 === null) return;
      var dx = e.clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) go(dx < 0 ? i + 1 : i - 1);
    });
    car.addEventListener('click', function (e) { if (moved) { e.preventDefault(); moved = false; } }, true);

    /* mouse parallax on the artwork */
    if (fine && !rm) {
      car.addEventListener('mousemove', function (e) {
        var r = car.getBoundingClientRect();
        car.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5).toFixed(3));
        car.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5).toFixed(3));
      });
      car.addEventListener('mouseleave', function () { car.style.setProperty('--mx', 0); car.style.setProperty('--my', 0); });
    }

    /* If an image fails (e.g. offline), fall back to the video artwork so a slide is never blank. */
    $$('.hh-img img', car).forEach(function (im) {
      im.addEventListener('error', function () { if (!im.dataset.fb) { im.dataset.fb = 1; im.src = im.getAttribute('data-fallback') || 'images/video-channel.svg'; } });
    });

    go(0);
  }

  /* services filter on the home page */
  function servicesFilter() {
    var wrap = $('#hsGrid'); if (!wrap) return;
    var btns = $$('.hs-chips button'), cards = $$('.hs-card', wrap);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter');
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        cards.forEach(function (c) {
          var show = f === 'all' || c.getAttribute('data-group') === f;
          if (show) { c.hidden = false; requestAnimationFrame(function () { c.classList.remove('is-out'); }); }
          else { c.classList.add('is-out'); setTimeout(function () { if (c.classList.contains('is-out')) c.hidden = true; }, rm ? 0 : 320); }
        });
        /* the feature card spans two columns only when it sits beside others */
      });
    });
  }

  /* ---------------------------------------------------------------- count-up numbers */
  function countUp() {
    var els = $$('[data-count], .rail .stat b');
    if (!els.length) return;
    function run(el) {
      var raw = el.getAttribute('data-count') || el.textContent.trim();
      var m = /^(~?)(\d+)(%?)$/.exec(raw); if (!m) return;
      var to = +m[2];
      if (rm) { el.textContent = m[1] + to + m[3]; return; }
      var t0 = null, dur = 1100;
      function step(t) {
        if (t0 === null) t0 = t;
        var p = clamp((t - t0) / dur, 0, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = m[1] + Math.round(to * e) + m[3];
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    if (!('IntersectionObserver' in window)) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } });
    }, { threshold: .4 });
    els.forEach(function (el) { if (!rm && !el.hasAttribute('data-count')) el.setAttribute('data-count', el.textContent.trim()); io.observe(el); });
  }

  /* ---------------------------------------------------------------- scroll reveal */
  function reveal() {
    if (!('IntersectionObserver' in window)) return;
    var sel = [
      '.sheet>section', '.sheet>.sec', '.sheet>.cta-block', '.sheet>.dl-bar', '.sheet>.linkedin-block', '.sheet>.content', '.sheet>.byline',
      '.hs-card', '.svc-card', '.svc-group', '.tl', '.path-card', '.contact-card', '.focus-item', '.ab-glance',
      '.a-block', '.grid3 .card', '.stack-row', '.callout', '.stat-cell', '.check-item', '.gap-item',
      '.grp', '.grp-note', '.art-feature', '.price-strip', '.vid'
    ].join(',');
    var els = $$(sel).filter(function (el) {
      return !el.classList.contains('rv') && !el.closest('.rv') && !el.closest('.hh') && !el.classList.contains('rv-in');
    });
    root.classList.add('gmfx');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target, sibs = el.parentNode ? [].indexOf.call(el.parentNode.children, el) : 0;
        el.style.animationDelay = (sibs % 4) * 80 + 'ms';
        el.classList.add('gmx-in');
        el.addEventListener('animationend', function () { el.classList.remove('gmx', 'gmx-in'); el.style.animationDelay = ''; }, { once: true });
        io.unobserve(el);
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el) { el.classList.add('gmx'); io.observe(el); });
    /* safety net: if something stays hidden, show it */
    setTimeout(function () { $$('.gmx:not(.gmx-in)').forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < innerHeight) { el.classList.add('gmx-in'); } }); }, 2500);
  }

  function headingUnderline() {
    if (!('IntersectionObserver' in window)) return;
    var hs = $$('.sec h2, .svc-bar h2, h2.grp, .box-title, .a-title').filter(function (h) { return !h.closest('.hh'); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('gm-ul-on'); io.unobserve(e.target); } });
    }, { threshold: .6 });
    hs.forEach(function (h) { h.classList.add('gm-ul'); io.observe(h); });
  }

  /* soft light that follows the pointer inside the fixed hero panel */
  function spotlight() {
    var p = $('.hh-fixed'); if (!p || !fine) return;
    p.addEventListener('mousemove', function (e) {
      var r = p.getBoundingClientRect();
      p.style.setProperty('--sx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
      p.style.setProperty('--sy', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
    });
  }

  /* drifting leaves in banners move a little as you scroll */
  function scrollParallax() {
    var leaves = $$('.fl'); if (!leaves.length) return;
    var tick = false;
    function upd() {
      var y = scrollY;
      leaves.forEach(function (l, k) { l.style.translate = '0 ' + (y * (.05 + (k % 3) * .03)).toFixed(1) + 'px'; });
      tick = false;
    }
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  }

  /* fade between pages instead of a hard cut */
  function pageTransitions() {
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a');
      if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var h = a.getAttribute('href');
      if (!h || h.charAt(0) === '#' || a.target || a.hasAttribute('download')) return;
      if (a.host !== location.host || a.protocol.indexOf('http') !== 0 && a.protocol !== 'file:') return;
      if (a.pathname === location.pathname && a.hash) return;
      e.preventDefault();
      root.classList.add('gm-leave');
      setTimeout(function () { location.href = a.href; }, 200);
    });
    addEventListener('pageshow', function (e) { if (e.persisted) root.classList.remove('gm-leave'); });
  }

  /* ---------------------------------------------------------------- tilt cards */
  function tilt() {
    var sel = '.hs-card,.svc-card,.list>a.row,.art-feature,.contact-card,.focus-item,.path-card,.ab-glance,.tl,.layer,.rcard,.compare-col,.grid3 .card,.rail .box,.qitem,.stat-cell,.hh-stats a';
    $$(sel).forEach(function (el) {
      if (el.closest('.hh-fixed') && !el.matches('.hh-stats a')) return;
      var rect = null, raf = 0, lx = 0, ly = 0, back = 0;
      el.classList.add('gm-tilt');
      el.addEventListener('pointerenter', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        clearTimeout(back); rect = el.getBoundingClientRect();
        el.style.transition = 'transform .12s ease-out, box-shadow .3s ease';
      });
      el.addEventListener('pointermove', function (e) {
        if (!rect || (e.pointerType && e.pointerType !== 'mouse')) return;
        lx = e.clientX; ly = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(function () {
          raf = 0;
          var px = clamp((lx - rect.left) / rect.width, 0, 1) - .5, py = clamp((ly - rect.top) / rect.height, 0, 1) - .5;
          var max = rect.width > 520 ? 2.2 : 5;
          el.style.transform = 'perspective(900px) rotateX(' + (-py * max * 2).toFixed(2) + 'deg) rotateY(' + (px * max * 2).toFixed(2) + 'deg) translateY(-4px)';
          el.style.boxShadow = (-px * 22).toFixed(0) + 'px ' + (16 + py * 14).toFixed(0) + 'px 30px -18px rgba(15,61,46,.5)';
        });
      });
      el.addEventListener('pointerleave', function () {
        rect = null; if (raf) { cancelAnimationFrame(raf); raf = 0; }
        el.style.transition = 'transform .55s cubic-bezier(.2,.8,.2,1), box-shadow .45s ease';
        el.style.transform = ''; el.style.boxShadow = '';
        back = setTimeout(function () { el.style.transition = ''; }, 600);
      });
    });
  }

  /* buttons lean toward the pointer */
  function magnetic() {
    $$('.gbtn,.hb,.btn,.dl-btn,.hh-btn,.hs-chips button,.hh-tabs button').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * .16, y = (e.clientY - r.top - r.height / 2) * .28;
        b.style.transform = 'translate(' + clamp(x, -8, 8).toFixed(1) + 'px,' + clamp(y, -6, 6).toFixed(1) + 'px)';
      });
      b.addEventListener('pointerleave', function () { b.style.transform = ''; });
    });
  }

  /* ripple on press */
  function ripple() {
    d.addEventListener('pointerdown', function (e) {
      var b = e.target.closest && e.target.closest('.gbtn,.hb,.btn,.dl-btn,.hh-btn');
      if (!b || rm) return;
      var r = b.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2;
      var sp = d.createElement('span'); sp.className = 'gm-ripple';
      sp.style.cssText = 'width:' + s + 'px;height:' + s + 'px;left:' + (e.clientX - r.left - s / 2) + 'px;top:' + (e.clientY - r.top - s / 2) + 'px';
      b.appendChild(sp); setTimeout(function () { sp.remove(); }, 700);
    });
  }

  /* a few clover leaves fall from the pointer */
  function leafTrail() {
    var lastX = 0, lastY = 0, live = 0;
    function spawn(x, y, burst) {
      if (live > 16) return;
      var l = d.createElement('i'); l.className = 'gm-leaf'; live++;
      var a = burst ? Math.random() * 6.283 : 0, v = burst ? 60 + Math.random() * 50 : 0;
      l.style.left = x + 'px'; l.style.top = y + 'px';
      l.style.setProperty('--dx', (burst ? Math.cos(a) * v : (Math.random() - .5) * 50) + 'px');
      l.style.setProperty('--dy', (burst ? Math.sin(a) * v : 34 + Math.random() * 40) + 'px');
      l.style.setProperty('--r0', (Math.random() * 120 - 60) + 'deg');
      l.style.setProperty('--r1', (Math.random() * 360 - 180) + 'deg');
      d.body.appendChild(l);
      l.addEventListener('animationend', function () { l.remove(); live--; });
    }
    addEventListener('mousemove', function (e) {
      var dx = e.clientX - lastX, dy = e.clientY - lastY;
      if (dx * dx + dy * dy < 2600) return;
      lastX = e.clientX; lastY = e.clientY;
      if (e.target.closest && e.target.closest('iframe,.vid,input,textarea,.hh-bar')) return;
      spawn(e.clientX, e.clientY, false);
    }, { passive: true });
    d.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.gbtn,.hb,.btn,.dl-btn,.hh-btn,.hs-chips button')) {
        for (var k = 0; k < 7; k++) spawn(e.clientX, e.clientY, true);
      }
    });
  }

  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})();
