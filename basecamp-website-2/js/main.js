/* BASECAMP – Interaktionen & Effekte */
(function () {
  var doc = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;

  /* Preloader mit Logo – bei jedem Öffnen der Startseite, mindestens ca. 1,3 s sichtbar */
  var loader = document.querySelector('.loader');
  var t0 = Date.now(), done = false;
  function ready() {
    if (done) return; done = true;
    doc.classList.add('loaded');
    if (loader) { loader.classList.add('done'); setTimeout(function () { loader.remove(); }, 1300); }
  }
  if (!loader || reduce) { if (loader) loader.remove(); requestAnimationFrame(function () { requestAnimationFrame(ready); }); }
  else {
    var go = function () { setTimeout(ready, Math.max(0, 1300 - (Date.now() - t0))); };
    if (document.readyState === 'complete') go(); else window.addEventListener('load', go);
    setTimeout(ready, 3000);
  }

  /* Header: Hintergrund beim Scrollen, ausblenden beim Runterscrollen */
  var hdr = document.querySelector('.hdr');
  var lastY = 0;
  function onScroll() {
    var y = window.scrollY;
    if (hdr) {
      hdr.classList.toggle('scrolled', y > 40);
      hdr.classList.toggle('hide', y > 500 && y > lastY && !doc.classList.contains('menu-open'));
    }
    lastY = y;
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Mobiles Menü */
  var burger = document.querySelector('.burger');
  if (burger) {
    burger.addEventListener('click', function () {
      var open = doc.classList.toggle('menu-open');
      burger.setAttribute('aria-expanded', open);
      document.body.style.overflow = open ? 'hidden' : '';
    });
    document.querySelectorAll('.mnav a').forEach(function (a) {
      a.addEventListener('click', function () { doc.classList.remove('menu-open'); document.body.style.overflow = ''; burger.setAttribute('aria-expanded', false); });
    });
  }

  /* Große Wörter (Therapie / Training) an die verfügbare Breite anpassen */
  function fitWords() {
    document.querySelectorAll('.meet__word, .svl__word').forEach(function (w) {
      w.style.fontSize = '';
      var par = w.parentElement, cs = getComputedStyle(par);
      var avail = par.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      var txt = w.querySelector('.o').getBoundingClientRect().width;
      if (txt > avail && avail > 0) w.style.fontSize = (parseFloat(getComputedStyle(w).fontSize) * avail / txt * 0.97) + 'px';
    });
  }
  fitWords();
  window.addEventListener('resize', fitWords);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitWords);

  /* Leistungen: Paneele öffnen (Hover am Desktop, Tippen am Handy, Tastatur) */
  var svcItems = document.querySelectorAll('.svc__item');
  function openSvc(el) {
    svcItems.forEach(function (x) { var on = x === el; x.classList.toggle('is-open', on); x.setAttribute('aria-expanded', on); });
  }
  svcItems.forEach(function (el) {
    el.addEventListener('click', function (e) { if (!e.target.closest('a')) openSvc(el); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSvc(el); } });
    el.addEventListener('mouseenter', function () { if (fine && window.innerWidth > 860) openSvc(el); });
  });

  /* Scroll-Reveal */
  var targets = document.querySelectorAll('.rv, .mask, .route, .fill, .svk__card, .svk__plus, .pillars, .pillar, [data-count]');
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-count')) countUp(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  } else {
    targets.forEach(function (t) { t.classList.add('in'); if (t.hasAttribute('data-count')) t.firstChild.nodeValue = t.getAttribute('data-count'); });
  }

  /* Zähler */
  function countUp(el) {
    var end = parseInt(el.getAttribute('data-count'), 10), t0 = null, dur = 1600;
    var node = el.firstChild;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), v = Math.round(end * (1 - Math.pow(1 - p, 4)));
      node.nodeValue = v;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* Routen-Linie: Länge für die Zeichen-Animation */
  document.querySelectorAll('.route__line path:not(.dots)').forEach(function (p) {
    p.style.setProperty('--len', Math.ceil(p.getTotalLength()));
  });

  if (reduce) return;

  /* Parallax: Bergketten + Statement-Zeile */
  var ridges = document.querySelectorAll('[data-depth]');
  /* Therapie trifft Training: gepinnte Scroll-Szene (nur Desktop) */
  var meet = document.querySelector('.meet');
  var meetTrack = meet && meet.querySelector('.meet__track');
  var meetStage = meet && meet.querySelector('.meet__stage');
  var wide = window.matchMedia('(min-width: 861px)');
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function ease(t) { return 1 - Math.pow(1 - t, 3); }
  function setPin() { if (meet) meet.classList.toggle('is-pinned', wide.matches); fitWords(); }
  setPin();
  if (wide.addEventListener) wide.addEventListener('change', function () { setPin(); req(); });
  var mx = 0, my = 0, ticking = false;
  function paint() {
    var y = window.scrollY;
    ridges.forEach(function (r) {
      var d = parseFloat(r.getAttribute('data-depth'));
      r.style.transform = 'translate3d(' + (mx * d * -30) + 'px,' + (y * d * 0.35 + my * d * -12) + 'px,0)';
    });
    if (meet && meet.classList.contains('is-pinned')) kickMeet();
    ticking = false;
  }
  /* Szene: Fortschritt aus Scrollen + Autoplay, wenn man stehen bleibt; weich nachgezogen */
  var mCur = 0, mT0 = null, mLoop = false, HOLD = 0.8;
  function meetTarget() {
    var tr = meetTrack.getBoundingClientRect(), vh = window.innerHeight;
    var lead = vh * 0.3;
    var total = meetTrack.offsetHeight - meetStage.offsetHeight + lead;
    var sp = clamp((lead - tr.top) / (total || 1));
    var tp = 0;
    if (tr.top <= 1 && tr.bottom >= vh - 1) {           /* Szene steht */
      if (mT0 === null) mT0 = performance.now() - 0;
      tp = Math.min(HOLD, lead / total + (performance.now() - mT0) / 4200 * HOLD);
    } else if (tr.top > 1) { mT0 = null; }
    else { tp = HOLD; }
    return Math.max(sp, tp);
  }
  function applyMeet(p) {
    var st = meet.style;
    st.setProperty('--p', p.toFixed(4));
    st.setProperty('--a', ease(clamp(p / 0.27)).toFixed(4));
    st.setProperty('--f', clamp((p - 0.18) / 0.28).toFixed(4));
    st.setProperty('--b', ease(clamp((p - 0.34) / 0.22)).toFixed(4));
    st.setProperty('--c', ease(clamp((p - 0.57) / 0.1)).toFixed(4));
    for (var i = 1; i <= 3; i++) st.setProperty('--c' + i, ease(clamp((p - 0.59 - (i - 1) * 0.05) / 0.09)).toFixed(4));
  }
  function meetFrame() {
    var tgt = meetTarget();
    mCur += (tgt - mCur) * 0.07;
    if (Math.abs(tgt - mCur) < 0.0005) mCur = tgt;
    applyMeet(mCur);
    if (mCur !== tgt || (mT0 !== null && tgt < HOLD)) requestAnimationFrame(meetFrame);
    else mLoop = false;
  }
  function kickMeet() { if (!mLoop) { mLoop = true; requestAnimationFrame(meetFrame); } }

  function req() { if (!ticking) { ticking = true; requestAnimationFrame(paint); } }
  window.addEventListener('scroll', req, { passive: true });
  paint();

  /* Emblem folgt leicht der Maus */
  if (meetStage && fine) {
    meetStage.addEventListener('mousemove', function (e) {
      var r = meetStage.getBoundingClientRect();
      meet.style.setProperty('--tx', ((e.clientX - r.left) / r.width - 0.5) * 24 + 'px');
      meet.style.setProperty('--ty', ((e.clientY - r.top) / r.height - 0.5) * 18 + 'px');
    });
  }

  /* Hero: Licht folgt der Maus */
  var hero = document.querySelector('.hero');
  var glow = document.querySelector('.hero__glow');
  if (hero && fine) {
    hero.addEventListener('mousemove', function (e) {
      var r = hero.getBoundingClientRect();
      mx = (e.clientX - r.left) / r.width - 0.5;
      my = (e.clientY - r.top) / r.height - 0.5;
      if (glow) { glow.style.left = (e.clientX - r.left) + 'px'; glow.style.top = (e.clientY - r.top) + 'px'; }
      req();
    });
  }

  if (!fine) return;

  /* Karten: Spotlight + leichte 3D-Neigung */
  document.querySelectorAll('.card').forEach(function (c) {
    c.addEventListener('mousemove', function (e) {
      var r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      c.style.setProperty('--mx', x + 'px'); c.style.setProperty('--my', y + 'px');
      c.style.transform = 'perspective(900px) rotateX(' + ((y / r.height - 0.5) * -4) + 'deg) rotateY(' + ((x / r.width - 0.5) * 5) + 'deg)';
    });
    c.addEventListener('mouseleave', function () { c.style.transform = ''; });
  });

  /* Magnetische Buttons */
  document.querySelectorAll('.btn--mag').forEach(function (b) {
    b.addEventListener('mousemove', function (e) {
      var r = b.getBoundingClientRect();
      b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.3) + 'px)';
    });
    b.addEventListener('mouseleave', function () { b.style.transform = ''; });
  });
})();
