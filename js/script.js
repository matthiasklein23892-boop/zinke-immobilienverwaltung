// Zinke Immobilienverwaltung — Shared Frontend Logic
document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Sticky header shadow ---------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 12);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ---------- Mobile nav toggle ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  /* ---------- Scroll reveal ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Hero floating particles ---------- */
  var particleWrap = document.querySelector('.hero-particles');
  if (particleWrap) {
    for (var i = 0; i < 18; i++) {
      var p = document.createElement('span');
      var left = Math.random() * 100;
      var delay = Math.random() * 14;
      var duration = 10 + Math.random() * 10;
      p.style.left = left + '%';
      p.style.bottom = (Math.random() * 20) + '%';
      p.style.animationDelay = delay + 's';
      p.style.animationDuration = duration + 's';
      p.style.opacity = (0.3 + Math.random() * 0.4).toFixed(2);
      particleWrap.appendChild(p);
    }
  }

  /* ---------- Service tabs (Leistungen) ---------- */
  var tabBtns = document.querySelectorAll('.tab-btn');
  if (tabBtns.length) {
    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        var panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
      });
    });
  }

  /* ---------- Contact form ---------- */
  var form = document.getElementById('contact-form');
  if (form) {
    var statusBox = document.getElementById('form-status');

    var validators = {
      name: function (v) { return v.trim().length >= 2; },
      phone: function (v) { return /^[0-9+\s()\/-]{5,}$/.test(v.trim()); },
      email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
      message: function (v) { return v.trim().length >= 10; }
    };

    var errorMessages = {
      name: 'Bitte geben Sie Ihren Namen ein (mind. 2 Zeichen).',
      phone: 'Bitte geben Sie eine gültige Telefonnummer ein.',
      email: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.',
      message: 'Ihre Nachricht sollte mindestens 10 Zeichen enthalten.'
    };

    function setFieldError(field, hasError) {
      var wrap = field.closest('.field');
      if (!wrap) return;
      wrap.classList.toggle('has-error', hasError);
    }

    function validateField(field) {
      var name = field.name;
      if (!validators[name]) return true;
      var valid = validators[name](field.value);
      setFieldError(field, !valid);
      var errEl = field.closest('.field').querySelector('.field-error');
      if (errEl) errEl.textContent = errorMessages[name];
      return valid;
    }

    ['name', 'phone', 'email', 'message'].forEach(function (n) {
      var f = form.querySelector('[name="' + n + '"]');
      if (f) f.addEventListener('blur', function () { validateField(f); });
    });

    // Nach erfolgreicher Weiterleitung von FormSubmit zeigen wir die Erfolgsmeldung an.
    if (/[?&]gesendet=1\b/.test(window.location.search)) {
      statusBox.className = 'form-status success';
      statusBox.textContent = 'Ich danke Ihnen! Wir werden uns so schnell wie möglich bei Ihnen melden.';
      var cleanUrl = window.location.pathname + window.location.hash;
      window.history.replaceState(null, '', cleanUrl);
    }

    form.addEventListener('submit', function (e) {
      var fields = ['name', 'phone', 'email', 'message'].map(function (n) {
        return form.querySelector('[name="' + n + '"]');
      });
      var allValid = fields.reduce(function (acc, f) { return validateField(f) && acc; }, true);

      var consent = form.querySelector('[name="consent"]');
      var consentWrap = consent ? consent.closest('.consent-row') : null;
      var consentValid = consent ? consent.checked : true;
      if (consentWrap) consentWrap.style.outline = consentValid ? 'none' : '1px solid #d8534f';

      if (!allValid || !consentValid) {
        e.preventDefault();
        statusBox.className = 'form-status error';
        statusBox.textContent = 'Bitte prüfen Sie Ihre Eingaben und die Datenschutz-Zustimmung.';
        return;
      }

      // Eingaben sind gültig: Formular wird ganz normal an FormSubmit übertragen
      // (kein fetch/AJAX mehr), das leitet nach Zustellung per _next zurück hierher.
      var submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet …'; }
      statusBox.className = 'form-status';
      statusBox.textContent = '';
    });
  }

  /* ---------- Google Maps: click-to-load ---------- */
  var mapLoadBtn = document.getElementById('map-load-btn');
  if (mapLoadBtn) {
    mapLoadBtn.addEventListener('click', function () {
      var mapWrap = document.getElementById('map-embed');
      if (!mapWrap) return;
      var iframe = document.createElement('iframe');
      iframe.src = 'https://www.google.com/maps?q=49.2403326,6.8629202&z=17&output=embed';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.title = 'Standort Zinke Immobilienverwaltung auf Google Maps';
      iframe.setAttribute('allowfullscreen', '');
      var pinLabel = document.createElement('div');
      pinLabel.className = 'map-pin-label';
      pinLabel.textContent = 'Zinke Immobilienverwaltung';
      mapWrap.innerHTML = '';
      mapWrap.classList.add('is-loaded');
      mapWrap.appendChild(iframe);
      mapWrap.appendChild(pinLabel);
    });
  }

  /* ---------- Cookie banner ---------- */
  var cookieBanner = document.getElementById('cookie-banner');
  if (cookieBanner) {
    var consentStored = localStorage.getItem('zinke-cookie-consent');
    if (!consentStored) {
      setTimeout(function () { cookieBanner.classList.add('show'); }, 900);
    }
    cookieBanner.querySelectorAll('button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        localStorage.setItem('zinke-cookie-consent', btn.dataset.action);
        cookieBanner.classList.remove('show');
      });
    });
  }

  /* ---------- Back to top ---------- */
  var backBtn = document.getElementById('back-to-top');
  if (backBtn) {
    window.addEventListener('scroll', function () {
      backBtn.classList.toggle('show', window.scrollY > 500);
    }, { passive: true });
    backBtn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Active nav link ---------- */
  var path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.main-nav a').forEach(function (link) {
    var href = link.getAttribute('href');
    if (href === path || (path === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
});
