/* OmniKit — app shell: tool grid, modals, Pro gating, session stats. */

(function () {
  'use strict';

  var PRO_KEY = 'omnikit_pro';
  var ops = 0;
  var opsThrottle = 0;

  // ---------- Pro state ----------
  OK.isPro = function () {
    try { return localStorage.getItem(PRO_KEY) === '1'; } catch (_e) { return false; }
  };

  function setPro(on) {
    try { localStorage.setItem(PRO_KEY, on ? '1' : '0'); } catch (_e) { /* private mode */ }
    document.getElementById('nav-pro-badge').hidden = !on;
    document.getElementById('nav-upgrade-btn').hidden = on;
  }

  // Shows the upgrade modal. Returns true if already Pro (caller may proceed).
  OK.requirePro = function (reason) {
    if (OK.isPro()) return true;
    document.getElementById('upgrade-reason').textContent = reason || 'This is a Pro feature.';
    show('upgrade-modal');
    return false;
  };

  // ---------- session ops counter ----------
  OK.bumpOps = function (throttled) {
    if (throttled) {
      var now = Date.now();
      if (now - opsThrottle < 800) return;
      opsThrottle = now;
    }
    ops++;
    var el = document.getElementById('stat-ops');
    if (el) el.textContent = ops;
  };

  // ---------- toast ----------
  var toastTimer;
  OK.toast = function (msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  };

  // ---------- modal helpers ----------
  function show(id) { document.getElementById(id).hidden = false; document.body.style.overflow = 'hidden'; }
  function hide(id) { document.getElementById(id).hidden = true; document.body.style.overflow = ''; }

  ['tool-modal', 'upgrade-modal'].forEach(function (id) {
    var backdrop = document.getElementById(id);
    backdrop.addEventListener('mousedown', function (e) {
      if (e.target === backdrop) hide(id);
    });
  });
  document.getElementById('tool-modal-close').addEventListener('click', function () { hide('tool-modal'); });
  document.getElementById('upgrade-modal-close').addEventListener('click', function () { hide('upgrade-modal'); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { hide('tool-modal'); hide('upgrade-modal'); }
  });

  // ---------- tool grid ----------
  var grid = document.getElementById('tool-grid');
  OMNIKIT_TOOLS.forEach(function (tool) {
    var card = document.createElement('button');
    card.className = 'tool-card';
    card.innerHTML =
      (tool.proFeature ? '<span class="tool-pro-tag">⚡ PRO+</span>' : '') +
      '<div class="tool-icon">' + tool.icon + '</div>' +
      '<div class="tool-name">' + OK.esc(tool.name) + '</div>' +
      '<div class="tool-desc">' + OK.esc(tool.desc) + '</div>';
    card.addEventListener('click', function () { openTool(tool); });
    grid.appendChild(card);
  });

  function openTool(tool) {
    document.getElementById('tool-modal-title').textContent = tool.icon + '  ' + tool.name;
    var bodyEl = document.getElementById('tool-modal-body');
    bodyEl.innerHTML = '';
    tool.render(bodyEl);
    show('tool-modal');
  }

  // ---------- upgrade / checkout ----------
  function checkout(kind) {
    var url = kind === 'monthly' ? OMNIKIT_CONFIG.stripeMonthlyUrl : OMNIKIT_CONFIG.stripeLifetimeUrl;
    if (url) {
      window.open(url, '_blank', 'noopener');
      OK.toast('Complete checkout in the new tab, then activate your license key here.');
    } else {
      OK.toast('Checkout is not configured yet — see website/README.md');
    }
  }
  document.getElementById('buy-lifetime').addEventListener('click', function () { checkout('lifetime'); });
  document.getElementById('buy-monthly').addEventListener('click', function () { checkout('monthly'); });
  document.getElementById('nav-upgrade-btn').addEventListener('click', function () { OK.requirePro('Unlock every Pro feature on this page.'); });
  document.querySelectorAll('[data-upgrade]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      OK.requirePro('Unlock every Pro feature on this page.');
    });
  });
  document.getElementById('activate-license-link').addEventListener('click', function () {
    OK.requirePro('Enter the license key from your purchase email below.');
  });

  // ---------- license activation ----------
  // Format gate only. Real key validation needs a tiny serverless endpoint —
  // see website/README.md ("Going live") for the recommended setup.
  document.getElementById('license-activate').addEventListener('click', function () {
    var input = document.getElementById('license-input');
    var msg = document.getElementById('license-msg');
    var key = input.value.trim().toUpperCase();
    if (/^OMNI(-[A-Z0-9]{4}){3}$/.test(key)) {
      setPro(true);
      msg.textContent = '✓ Pro activated on this device. Welcome aboard!';
      msg.className = 'license-msg ok';
      setTimeout(function () { hide('upgrade-modal'); OK.toast('⚡ Pro unlocked'); }, 900);
    } else {
      msg.textContent = '✗ That does not look like a valid key (OMNI-XXXX-XXXX-XXXX).';
      msg.className = 'license-msg err';
    }
  });

  // ---------- boot ----------
  document.getElementById('year').textContent = new Date().getFullYear();
  document.getElementById('stat-tools').textContent = OMNIKIT_TOOLS.length;
  setPro(OK.isPro());
})();
