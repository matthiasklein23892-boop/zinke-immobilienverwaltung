/* Zinke Immobilienverwaltung – Verhalten v9 */
(function () {
  'use strict';
  var d = document, root = d.documentElement, body = d.body;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return [].slice.call((c || d).querySelectorAll(s)); }

  /* ---------- Intro (nur Startseite, nur beim Betreten von außen) ---------- */
  var intro = d.getElementById('intro');
  var introOn = !!intro && root.classList.contains('intro');
  var afterIntro = [];
  function whenReady(fn) { if (introOn) afterIntro.push(fn); else fn(); }
  if (introOn) {
    var done = false;
    var finish = function (fast) {
      if (done) return; done = true;
      if (fast) intro.classList.add('out');
      setTimeout(function () {
        root.classList.remove('intro'); intro.hidden = true; introOn = false;
        afterIntro.forEach(function (f) { f(); }); afterIntro = [];
      }, fast ? 460 : 0);
    };
    intro.addEventListener('animationend', function (e) { if (e.target === intro && e.animationName === 'in-end') finish(false); });
    $('.in-skip', intro).addEventListener('click', function () { finish(true); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape') finish(true); });
    if (!window.__introHalten) setTimeout(function () { finish(false); }, 7000);
  }

  /* ---------- Kopfzeile, Lesebändchen, Dashboard ---------- */
  var top = d.getElementById('top'), ribbon = $('.ribbon'), screen = $('.screen'), busy = false;
  function onScroll() {
    var y = scrollY, vh = innerHeight, max = root.scrollHeight - vh;
    if (top) top.classList.toggle('scrolled', y > 40);
    root.style.setProperty('--p', (max > 0 ? y / max : 0).toFixed(4));
    if (screen && !reduce) {
      var r = screen.getBoundingClientRect(), t = Math.max(0, Math.min(1, (vh - r.top) / (vh * .8)));
      screen.style.setProperty('--rx', (10 * (1 - t)).toFixed(2) + 'deg');
    }
    busy = false;
  }
  addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener('resize', onScroll); onScroll();
  if (ribbon) ribbon.addEventListener('click', function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });

  /* ---------- Menü für schmale Bildschirme ---------- */
  var mb = $('.menu-btn'), menu = d.getElementById('menu');
  if (mb && menu) {
    var setMenu = function (open) {
      mb.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) {
        menu.hidden = false; body.classList.add('menu-open');
        requestAnimationFrame(function () { menu.classList.add('open'); });
        $('.m-close', menu).focus();
      } else {
        menu.classList.remove('open'); body.classList.remove('menu-open');
        setTimeout(function () { menu.hidden = true; }, 450); mb.focus();
      }
    };
    mb.addEventListener('click', function () { setMenu(true); });
    $('.m-close', menu).addEventListener('click', function () { setMenu(false); });
    addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  }

  /* ---------- Einblenden beim Scrollen ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .16 }) : null;
  $$('.rv,.tl,.curtain').forEach(function (el) { if (io) io.observe(el); else el.classList.add('in'); });

  /* ---------- Wappen: Licht im Fenster ---------- */
  var crest = d.getElementById('crest');
  if (crest) whenReady(function () { setTimeout(function () { crest.classList.add('lit'); }, reduce ? 0 : 1300); });

  /* ---------- Cookie-Hinweis (Auswahl wie bisher im lokalen Speicher) ---------- */
  var cb = d.getElementById('cookie-banner');
  if (cb) {
    var stored = null; try { stored = localStorage.getItem('zinke-cookie-consent'); } catch (e) {}
    if (!stored) whenReady(function () { setTimeout(function () { cb.hidden = false; requestAnimationFrame(function () { cb.classList.add('show'); }); }, 900); });
    $$('button', cb).forEach(function (b) {
      b.addEventListener('click', function () {
        try { localStorage.setItem('zinke-cookie-consent', b.dataset.action); } catch (e) {}
        cb.classList.remove('show'); setTimeout(function () { cb.hidden = true; }, 600);
      });
    });
  }

  /* ---------- Kontaktformular: Prüfung wie bisher, Versand über FormSubmit ---------- */
  var form = d.getElementById('contact-form');
  if (form) {
    var status = d.getElementById('form-status');
    var V = {
      name: function (v) { return v.trim().length >= 2; },
      phone: function (v) { return /^[0-9+\s()\/-]{5,}$/.test(v.trim()); },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      message: function (v) { return v.trim().length >= 10; }
    };
    var M = {
      name: 'Bitte geben Sie Ihren Namen ein (mind. 2 Zeichen).',
      phone: 'Bitte geben Sie eine gültige Telefonnummer ein.',
      email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      message: 'Ihre Nachricht sollte mindestens 10 Zeichen enthalten.'
    };
    var check = function (f) {
      var ok = V[f.name] ? V[f.name](f.value) : true, w = f.closest('.field');
      w.classList.toggle('err', !ok); f.setAttribute('aria-invalid', ok ? 'false' : 'true');
      var e = $('.field-error', w); if (e && !ok) e.textContent = M[f.name];
      return ok;
    };
    ['name', 'phone', 'email', 'message'].forEach(function (n) { var f = form.elements[n]; f.addEventListener('blur', function () { check(f); }); });
    if (/[?&]gesendet=1\b/.test(location.search)) {
      status.className = 'form-status success';
      status.textContent = 'Ich danke Ihnen! Wir werden uns so schnell wie möglich bei Ihnen melden.';
      history.replaceState(null, '', location.pathname + location.hash);
    }
    /* Versand im Hintergrund (FormSubmit-AJAX). Ist FormSubmit gestört (z. B. Fehler 521) oder lehnt ab, bleibt der
       Besucher auf der Seite, seine Eingaben bleiben stehen und er bekommt E-Mail- und Telefon-Weg angeboten. */
    var sb = form.querySelector('button[type="submit"]'), sbText = sb.textContent;
    var link = function (href, text) { var a = d.createElement('a'); a.href = href; a.textContent = text; return a; };
    var fail = function () {
      var f = form.elements, tel = d.querySelector('a[href^="tel:"]'), mail = d.querySelector('a[href^="mailto:"]');
      var adr = mail ? mail.getAttribute('href').replace(/^mailto:/, '').split('?')[0] : 'info@zinke-immo.de';
      var body = 'Name: ' + f.name.value.trim() + '\nTelefon: ' + f.phone.value.trim() + '\nE-Mail: ' + f.email.value.trim() + '\n\n' + f.message.value.trim();
      sb.disabled = false; sb.textContent = sbText;
      status.className = 'form-status error'; status.textContent = '';
      status.appendChild(d.createTextNode('Ihre Nachricht konnte gerade nicht übermittelt werden, unser Versanddienst ist kurzzeitig gestört. Ihre Eingaben bleiben erhalten. '));
      status.appendChild(link('mailto:' + adr + '?subject=' + encodeURIComponent('Anfrage über zinke-immo.de') + '&body=' + encodeURIComponent(body), 'Nachricht per E-Mail senden'));
      if (tel) { status.appendChild(d.createTextNode(' oder rufen Sie uns an: ')); status.appendChild(link(tel.getAttribute('href'), tel.textContent)); }
      status.appendChild(d.createTextNode('.'));
    };
    form.addEventListener('submit', function (e) {
      var ok = ['name', 'phone', 'email', 'message'].map(function (n) { return check(form.elements[n]); }).every(Boolean);
      var c = form.elements.consent, cok = c.checked;
      c.closest('.consent').classList.toggle('err', !cok);
      if (!ok || !cok) {
        e.preventDefault(); status.className = 'form-status error';
        status.textContent = 'Bitte prüfen Sie Ihre Eingaben und die Datenschutz-Zustimmung.'; return;
      }
      sb.disabled = true; sb.textContent = 'Wird gesendet …';
      status.className = 'form-status'; status.textContent = '';
      if (!window.fetch || !window.FormData) return;            // sehr alte Browser: normaler Versand wie bisher
      e.preventDefault();
      var ctl = window.AbortController ? new AbortController() : null, t = setTimeout(function () { if (ctl) ctl.abort(); }, 20000);
      fetch(form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/'), { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' }, signal: ctl ? ctl.signal : undefined })
        .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
        .then(function (j) {
          if (!j || String(j.success) !== 'true') return Promise.reject('abgelehnt');
          clearTimeout(t); form.reset(); sb.disabled = false; sb.textContent = sbText;
          status.className = 'form-status success'; status.textContent = 'Ich danke Ihnen! Wir werden uns so schnell wie möglich bei Ihnen melden.';
        })
        .catch(function () { clearTimeout(t); fail(); });
    });
  }

  /* ---------- Google Maps erst nach Klick (wie bisher) ---------- */
  var mlb = d.getElementById('map-load-btn');
  if (mlb) mlb.addEventListener('click', function () {
    var w = d.getElementById('map-embed'); if (!w) return;
    var f = d.createElement('iframe');
    f.src = 'https://www.google.com/maps?q=49.2403326,6.8629202&z=17&output=embed';
    f.loading = 'lazy'; f.referrerPolicy = 'no-referrer-when-downgrade';
    f.title = 'Standort Zinke Immobilienverwaltung auf Google Maps'; f.setAttribute('allowfullscreen', '');
    var pl = d.createElement('div'); pl.className = 'map-pin-label'; pl.textContent = 'Zinke Immobilienverwaltung';
    w.innerHTML = ''; w.classList.add('is-loaded'); w.appendChild(f); w.appendChild(pl); mlb.hidden = true;
  });

  /* ---------- Karte mit Radar ---------- */
  var svg = d.getElementById('karte');
  if (svg) initKarte();

  function initKarte() {
    var data = JSON.parse(d.getElementById('karte-daten').textContent);
    var map = svg.parentNode, wrap = map.closest('.k-wrap'), NS = 'http://www.w3.org/2000/svg';
    var P = data.p, hub = data.hub, vb = data.vb1.slice(), level = 1, SW = 3;
    var gD = $('.k-dots', svg), gL = $('.k-lbl', svg), gV = $('.k-ver', svg), tip = $('.k-tip', map);
    var R = [7, 5.2, 3.7, 2.9, 1.7, 1.5, 1.25];
    var FS = { 0: 18, 1: 15, 2: 13.5, 3: 11, 4: 10.5, 5: 10, 6: 9.5, kr: 9, riv: 14, nb: 9.5, ring: 9.5, gr: 8.5 };
    var SER = '"Cormorant Garamond"', SAN = 'Geist';
    var FONT = { 0: ['600', SER], 1: ['600', SER], 2: ['600', SER], 3: ['400', SAN], 4: ['400', SAN], 5: ['400', SAN], 6: ['400', SAN],
      kr: ['500', SAN], riv: ['italic 500', SER], nb: ['500', SAN], ring: ['500', SAN], gr: ['400', SAN] };
    var LS = { kr: .22, riv: .08, nb: .32, ring: .06, gr: .04 };
    function el(n, a) { var e = d.createElementNS(NS, n); for (var k in a) e.setAttribute(k, a[k]); return e; }

    /* Punkte */
    var dots = [];
    P.forEach(function (p, i) {
      if (p[3] === 0) return;
      var c = el('circle', { cx: p[1], cy: p[2], 'class': 'kd c' + p[3], 'data-i': i });
      var b = (Math.atan2(p[1] - hub[0], -(p[2] - hub[1])) * 180 / Math.PI + 360) % 360;
      c.style.setProperty('--d', (b / 360 * SW).toFixed(3) + 's');
      dots[i] = c;
    });
    [6, 5, 4, 3, 2, 1].forEach(function (cl) { P.forEach(function (p, i) { if (p[3] === cl) gD.appendChild(dots[i]); }); });
    var hubG = el('g', { 'class': 'k-hub', 'data-i': 0 });
    hubG.appendChild(el('circle', { 'class': 'halo', r: 15 }));
    hubG.appendChild(el('path', { 'class': 'dmd', d: 'M0 -7L7 0 0 7-7 0Z' }));
    gD.appendChild(hubG);

    /* Beschriftungen */
    var L = [];
    P.forEach(function (p, i) { var t = el('text', { 'class': 'kl l' + p[3] }); t.textContent = p[0]; gL.appendChild(t); L.push({ el: t, kind: 'p', i: i, c: p[3] }); });
    data.fix.forEach(function (fx) {
      var t = el('text', { 'class': 'kl ' + fx.c });
      fx.t.forEach(function (line) { var ts = el('tspan', {}); ts.textContent = line; t.appendChild(ts); });
      gL.appendChild(t); L.push({ el: t, kind: 'f', fx: fx, c: fx.c });
    });
    data.grat.forEach(function (g) { var t = el('text', { 'class': 'kl gr' }); t.textContent = g.t; gL.appendChild(t); L.push({ el: t, kind: 'g', g: g, c: 'gr' }); });

    var cv = d.createElement('canvas').getContext('2d'), mc = {};
    function tw(text, c, fs) {
      var k = c + '|' + text, w1 = mc[k];
      if (w1 == null) { cv.font = FONT[c][0] + ' 100px ' + FONT[c][1]; w1 = cv.measureText(text).width / 100; mc[k] = w1; }
      return w1 * fs + (LS[c] || 0) * fs * Math.max(0, text.length - 1);
    }

    function setVB(v) {
      vb = v; svg.setAttribute('viewBox', v.map(function (n) { return n.toFixed(2); }).join(' '));
      var W = map.clientWidth || 1, kz = W / vb[2], u = 1 / kz;
      svg.style.setProperty('--u', (u * (W < 620 ? .8 : 1)).toFixed(4));
      hubG.setAttribute('transform', 'translate(' + hub[0] + ' ' + hub[1] + ') scale(' + u.toFixed(4) + ')');
      map.style.setProperty('--hx', ((hub[0] - vb[0]) / vb[2] * 100).toFixed(2) + '%');
      map.style.setProperty('--hy', ((hub[1] - vb[1]) / vb[3] * 100).toFixed(2) + '%');
      var sc = $('.k-scale', wrap);
      if (sc) {
        var best = 1; [1, 2, 5, 10, 20].forEach(function (k) { if (k * data.S * kz <= 130) best = k; });
        sc.style.setProperty('--sb', (best * data.S * kz).toFixed(1) + 'px'); $('.bar span', sc).textContent = best + ' km';
      }
    }

    function layout() {
      var W = map.clientWidth, H = map.clientHeight; if (!W) return;
      var kz = W / vb[2], small = W < 620, s = small ? .92 : 1, ds = small ? .8 : 1, placed = [], dotB = [];
      map.classList.toggle('k-small', small); map.classList.toggle('k-l2', level === 2);
      var mr = map.getBoundingClientRect();
      function sx(x) { return (x - vb[0]) * kz; }
      function sy(y) { return (y - vb[1]) * kz; }
      function ov(a, b) { return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]; }
      function hit(b) { for (var j = 0; j < placed.length; j++) if (ov(b, placed[j])) return true; return false; }
      function hitD(b, own, mc) { for (var j = 0; j < dotB.length; j++) if (dotB[j][4] !== own && dotB[j][5] <= (mc == null ? 9 : mc) && ov(b, dotB[j])) return true; return false; }
      function inside(b) { return b[0] >= 20 && b[1] >= 20 && b[2] <= W - 20 && b[3] <= H - 20; }
      $$('.k-box', wrap).forEach(function (bx) {
        if (getComputedStyle(bx).position !== 'absolute') return;
        var r = bx.getBoundingClientRect(); placed.push([r.left - mr.left - 8, r.top - mr.top - 8, r.right - mr.left + 8, r.bottom - mr.top + 8]);
      });
      P.forEach(function (p, i) {
        if (p[3] > 3 && level === 1) return;
        var x = sx(p[1]), y = sy(p[2]); if (x < -10 || y < -10 || x > W + 10 || y > H + 10) return;
        var r = R[p[3]] * ds + 1.5; dotB.push([x - r, y - r, x + r, y + r, i, p[3]]);
      });
      L.forEach(function (l) { l.el.classList.remove('on'); });
      var order = [];
      function addP(cl) { L.forEach(function (l) { if (l.kind === 'p' && l.c === cl) order.push(l); }); }
      function addF(c) { L.forEach(function (l) { if (l.kind === 'f' && l.c === c) order.push(l); }); }
      addP(0); addP(1); addF('ring'); addP(2); addF('riv'); addP(3); addF('kr'); addF('nb'); addP(4); addP(5); addP(6);
      L.forEach(function (l) { if (l.kind === 'g') order.push(l); });

      function put(l, x, y, anchor, fs, box, rot, lines) {
        var t = l.el, X = vb[0] + x / kz, Y = vb[1] + y / kz;
        t.setAttribute('x', X.toFixed(2)); t.setAttribute('y', Y.toFixed(2));
        t.setAttribute('text-anchor', anchor); t.setAttribute('font-size', (fs / kz).toFixed(3));
        if (rot) t.setAttribute('transform', 'rotate(' + rot + ' ' + X.toFixed(2) + ' ' + Y.toFixed(2) + ')'); else t.removeAttribute('transform');
        if (lines) {
          var ts = t.querySelectorAll('tspan'), lh = fs * 1.25 / kz, n = ts.length;
          for (var j = 0; j < n; j++) { ts[j].setAttribute('x', X.toFixed(2)); ts[j].setAttribute('dy', (j === 0 ? (-(n - 1) / 2 * lh + fs * .34 / kz) : lh).toFixed(3)); }
        }
        t.classList.add('on'); placed.push(box);
      }

      order.forEach(function (l) {
        if (l.kind === 'p') {
          var p = P[l.i];
          if (level === 1 && p[3] > 3) return;
          if (small && level === 1 && p[3] === 3) return;
          var x = sx(p[1]), y = sy(p[2]); if (x < 0 || y < 0 || x > W || y > H) return;
          var fs = FS[p[3]] * s, w = tw(p[0], p[3], fs), r = R[p[3]] + 4, asc = fs * .74, dsc = fs * .26;
          var C = [[x + r, y + fs * .34, 'start'], [x - r, y + fs * .34, 'end'], [x, y - r - 2, 'middle'], [x, y + r + fs * .8, 'middle'],
            [x + r - 2, y - r + 1, 'start'], [x + r - 2, y + r + fs * .72, 'start'], [x - r + 2, y - r + 1, 'end'], [x - r + 2, y + r + fs * .72, 'end']];
          for (var k = 0; k < C.length; k++) {
            var c = C[k], bx = c[2] === 'start' ? c[0] : (c[2] === 'end' ? c[0] - w : c[0] - w / 2);
            var b = [bx - 2, c[1] - asc - 1, bx + w + 2, c[1] + dsc + 1];
            if (inside(b) && !hit(b) && !hitD(b, l.i, p[3] <= 3 ? 3 : 9)) { put(l, c[0], c[1], c[2], fs, b); return; }
          }
          if (p[3] <= 1) {
            // zweiter Versuch: nur Standort/Schwerpunkt-Punkte meiden, nie andere Beschriftungen überdecken
            for (var k2 = 0; k2 < C.length; k2++) {
              var c2 = C[k2], bx2 = c2[2] === 'start' ? c2[0] : (c2[2] === 'end' ? c2[0] - w : c2[0] - w / 2);
              var b2 = [bx2 - 2, c2[1] - asc - 1, bx2 + w + 2, c2[1] + dsc + 1];
              if (inside(b2) && !hit(b2) && !hitD(b2, l.i, 1)) { put(l, c2[0], c2[1], c2[2], fs, b2); return; }
            }
            if (p[3] === 0) { var c0 = C[0], b0 = [c0[0], c0[1] - asc, c0[0] + w, c0[1] + dsc]; put(l, c0[0], c0[1], 'start', fs, b0); }
          }
          return;
        }
        if (l.kind === 'f') {
          var fx = l.fx; if (fx.lv.indexOf(level) < 0) return;
          var fs2 = FS[l.c] * s, lines = fx.t, lh = fs2 * 1.25, wm = 0;
          lines.forEach(function (t) { wm = Math.max(wm, tw(t, l.c, fs2)); });
          var hg = lh * lines.length;
          for (var q = 0; q < fx.cand.length; q++) {
            var cd = fx.cand[q], x2 = sx(cd[0]), y2 = sy(cd[1]), rot = cd[2] || 0, box;
            if (l.c === 'riv') { x2 += (cd[3] || 0) * 10; y2 += (cd[4] || 0) * 10; }
            if (Math.abs(rot) === 90) box = [x2 - hg / 2, y2 - wm / 2, x2 + hg / 2, y2 + wm / 2];
            else if (rot) {
              var a = rot * Math.PI / 180, hx = (Math.abs(wm * Math.cos(a)) + Math.abs(hg * Math.sin(a))) / 2, hy = (Math.abs(wm * Math.sin(a)) + Math.abs(hg * Math.cos(a))) / 2;
              box = [x2 - hx, y2 - hy, x2 + hx, y2 + hy];
            } else box = [x2 - wm / 2, y2 - hg / 2, x2 + wm / 2, y2 + hg / 2];
            if (!inside(box) || hit(box)) continue;
            if ((l.c === 'kr' || l.c === 'riv') && hitD(box, -1)) continue;
            put(l, x2, y2, 'middle', fs2, box, rot, lines); return;
          }
          return;
        }
        if (l.kind === 'g') {
          var g = l.g, fs3 = FS.gr * s, w3 = tw(g.t, 'gr', fs3), x3, y3;
          if (g.k === 'lat') { x3 = 26; y3 = sy(g.v) - 5; } else { x3 = sx(g.v) + 5; y3 = 34; }
          var b3 = [x3, y3 - fs3, x3 + w3, y3 + 2];
          if (inside(b3) && !hit(b3)) put(l, x3, y3, 'start', fs3, b3);
        }
      });
    }

    /* Zoom zwischen Saarland und Schwerpunkt */
    var btns = $$('.k-tools [data-z]', wrap);
    function zoomTo(lv) {
      if (lv === level) return; level = lv;
      btns.forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.z === lv ? 'true' : 'false'); });
      var from = vb.slice(), to = (lv === 2 ? data.vb2 : data.vb1).slice(), t0 = performance.now(), D = reduce ? 0 : 1100;
      map.classList.add('k-moving'); tip.classList.remove('on');
      (function step(now) {
        var t = D ? Math.min(1, (now - t0) / D) : 1, e = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        setVB(from.map(function (v, i) { return v + (to[i] - v) * e; }));
        if (t < 1) requestAnimationFrame(step); else { layout(); map.classList.remove('k-moving'); }
      })(t0);
    }
    btns.forEach(function (b) { b.addEventListener('click', function () { zoomTo(+b.dataset.z); }); });

    /* Radar-Durchlauf: einmal beim Erscheinen, danach ruhig */
    function scan() {
      if (reduce) { map.classList.remove('k-idle'); map.classList.add('k-done'); return; }
      map.classList.remove('k-scan'); void map.offsetWidth; map.classList.remove('k-idle'); map.classList.add('k-scan');
    }
    var sbtn = $('.k-tools [data-scan]', wrap); if (sbtn) sbtn.addEventListener('click', scan);
    if ('IntersectionObserver' in window) {
      var mo = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { scan(); mo.disconnect(); } }, { threshold: .35 });
      mo.observe(map);
    } else scan();

    /* Schwerpunkt-Liste: Verbindung zum Standort zeigen */
    $$('.k-focus li[data-i]', wrap).forEach(function (li) {
      var i = +li.dataset.i;
      function on() { gV.innerHTML = ''; if (!i) return; var p = P[i]; gV.appendChild(el('line', { x1: hub[0], y1: hub[1], x2: p[1], y2: p[2], pathLength: 1 })); if (dots[i]) dots[i].classList.add('hl'); }
      function off() { gV.innerHTML = ''; if (dots[i]) dots[i].classList.remove('hl'); }
      li.addEventListener('mouseenter', on); li.addEventListener('mouseleave', off);
      li.addEventListener('focus', on); li.addEventListener('blur', off);
    });

    /* Hinweis beim Überfahren */
    function showTip(i, cx, cy) {
      var p = P[i], k = p[4] >= 0 ? data.kreise[p[4]] : '';
      tip.innerHTML = '<b></b><span></span><em></em>';
      tip.children[0].textContent = p[0];
      tip.children[1].textContent = i === 0 ? p[6] : p[6] + (k ? ' · ' + k : '');
      tip.children[2].textContent = i === 0 ? k : '≈ ' + p[5] + ' km Luftlinie vom Standort';
      var m = map.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight, x = cx - m.left + 14, y = cy - m.top - h - 12;
      if (x + w > m.width - 16) x = cx - m.left - w - 14;
      if (y < 16) y = cy - m.top + 18;
      tip.style.left = x + 'px'; tip.style.top = y + 'px'; tip.classList.add('on');
    }
    svg.addEventListener('pointerover', function (e) {
      var t = e.target.closest ? e.target.closest('[data-i]') : null; if (!t) return;
      var r = t.getBoundingClientRect(); showTip(+t.getAttribute('data-i'), r.left + r.width / 2, r.top + r.height / 2);
    });
    svg.addEventListener('pointerout', function (e) { if (e.pointerType === 'mouse') tip.classList.remove('on'); });
    map.addEventListener('pointerdown', function (e) { if (!(e.target.closest && e.target.closest('[data-i]'))) tip.classList.remove('on'); });

    setVB(vb);
    var relayout = function () { setVB(vb); layout(); };
    (d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve()).then(relayout);
    var rt; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(relayout, 150); });
    window.__karte = { layout: relayout, zoom: zoomTo, scan: scan };
  }
})();
