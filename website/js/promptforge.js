/* PromptForge — app shell: localStorage library, Pro gate, PWA install, boot. */

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var PRO_KEY = 'promptforge_pro';
  var LIB_KEY = 'promptforge_library_v1';
  var FREE_LIMIT = 25;

  var cfg = window.OMNIKIT_CONFIG || { stripeLifetimeUrl: '', stripeMonthlyUrl: '' };

  // ---------- storage ----------
  function readLib() {
    try { return JSON.parse(localStorage.getItem(LIB_KEY)) || []; } catch (_e) { return []; }
  }
  function writeLib(list) {
    try { localStorage.setItem(LIB_KEY, JSON.stringify(list)); } catch (_e) { PF.toast('Storage full or blocked'); }
  }

  PF.allPrompts = function () {
    return readLib().sort(function (a, b) { return (b.updated || 0) - (a.updated || 0); });
  };
  PF.getPrompt = function (id) {
    var list = readLib();
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  };
  PF.deletePrompt = function (id) {
    writeLib(readLib().filter(function (p) { return p.id !== id; }));
    updateStat();
  };

  // Returns the saved record, or null if a free-tier cap blocked the save.
  PF.savePrompt = function (doc) {
    var list = readLib();
    var now = Date.now();
    var existing = null;
    for (var i = 0; i < list.length; i++) if (list[i].id === doc.id) { existing = list[i]; break; }
    if (!existing) {
      if (!PF.isPro() && list.length >= FREE_LIMIT) {
        PF.requirePro('The free library holds ' + FREE_LIMIT + ' prompts. Pro makes it unlimited.');
        return null;
      }
      var rec = {
        id: 'p_' + now.toString(36) + Math.random().toString(36).slice(2, 6),
        created: now
      };
      list.push(rec);
      existing = rec;
    }
    existing.title = doc.title;
    existing.system = doc.system;
    existing.body = doc.body;
    existing.vars = doc.vars || {};
    existing.versions = doc.versions || [];
    existing.updated = now;
    writeLib(list);
    updateStat();
    return existing;
  };

  // ---------- import / export ----------
  function download(name, text) {
    var blob = new Blob([text], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
  }

  PF.exportLibrary = function () {
    var lib = readLib();
    if (!lib.length) { PF.toast('Library is empty'); return; }
    download('promptforge-library.json', JSON.stringify({ app: 'promptforge', v: 1, prompts: lib }, null, 2));
    PF.toast('Exported ' + lib.length + ' prompts');
  };

  PF.importLibrary = function (file, done) {
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var incoming = Array.isArray(data) ? data : (data.prompts || []);
        if (!Array.isArray(incoming) || !incoming.length) { PF.toast('No prompts found in file'); return; }
        var list = readLib();
        var byId = {};
        list.forEach(function (p) { byId[p.id] = 1; });
        var added = 0;
        incoming.forEach(function (p) {
          if (!p || !p.body && !p.title) return;
          if (!p.id || byId[p.id]) p.id = 'p_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
          p.updated = p.updated || Date.now();
          p.created = p.created || p.updated;
          list.push(p); byId[p.id] = 1; added++;
        });
        if (!PF.isPro() && list.length > FREE_LIMIT) {
          list = list.slice(0, FREE_LIMIT);
          PF.toast('Imported up to the free cap of ' + FREE_LIMIT + '. Upgrade for unlimited.');
        } else {
          PF.toast('Imported ' + added + ' prompts');
        }
        writeLib(list);
        updateStat();
        if (done) done();
      } catch (_e) {
        PF.toast('Could not read that file');
      }
    };
    reader.readAsText(file);
  };

  // ---------- Pro ----------
  PF.isPro = function () {
    try { return localStorage.getItem(PRO_KEY) === '1'; } catch (_e) { return false; }
  };
  function setPro(on) {
    try { localStorage.setItem(PRO_KEY, on ? '1' : '0'); } catch (_e) { /* private mode */ }
    $('nav-pro-badge').hidden = !on;
    $('nav-upgrade-btn').hidden = on;
  }
  PF.requirePro = function (reason) {
    if (PF.isPro()) return true;
    $('upgrade-reason').textContent = reason || 'This is a Pro feature.';
    showModal();
    return false;
  };

  // ---------- utilities ----------
  var toastTimer;
  PF.toast = function (msg) {
    var t = $('toast');
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2200);
  };
  PF.copy = function (text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { PF.toast('Copied'); }, function () { PF.toast('Copy failed'); });
    } else { PF.toast('Clipboard unavailable'); }
  };

  function updateStat() {
    var el = $('stat-saved');
    if (el) el.textContent = readLib().length;
  }

  // ---------- upgrade modal ----------
  function showModal() { $('upgrade-modal').hidden = false; document.body.style.overflow = 'hidden'; }
  function hideModal() { $('upgrade-modal').hidden = true; document.body.style.overflow = ''; }

  function checkout(kind) {
    var url = kind === 'monthly' ? cfg.stripeMonthlyUrl : cfg.stripeLifetimeUrl;
    if (url) {
      window.open(url, '_blank', 'noopener');
      PF.toast('Finish checkout in the new tab, then activate your key here.');
    } else {
      PF.toast('Checkout is not configured yet — see website/README.md');
    }
  }

  // ---------- PWA ----------
  var deferredPrompt = null;
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    $('install-btn').hidden = false;
  });

  // ---------- boot ----------
  document.addEventListener('DOMContentLoaded', function () {
    $('year').textContent = new Date().getFullYear();
    $('stat-models').textContent = (window.PF_MODELS || []).length;
    setPro(PF.isPro());
    updateStat();

    PF.initWorkbench();
    updateStat();

    // modal wiring
    $('upgrade-modal').addEventListener('mousedown', function (e) {
      if (e.target === $('upgrade-modal')) hideModal();
    });
    $('upgrade-modal-close').addEventListener('click', hideModal);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hideModal(); });

    $('nav-upgrade-btn').addEventListener('click', function () { PF.requirePro('Unlock the full workbench.'); });
    $('activate-license-link').addEventListener('click', function () { PF.requirePro('Enter your license key below.'); });
    document.querySelectorAll('[data-upgrade]').forEach(function (b) {
      b.addEventListener('click', function () { PF.requirePro('Unlock the full workbench.'); });
    });
    $('buy-lifetime').addEventListener('click', function () { checkout('lifetime'); });
    $('buy-monthly').addEventListener('click', function () { checkout('monthly'); });

    // license activation (format gate; see README "Going live" for real validation)
    $('license-activate').addEventListener('click', function () {
      var key = ($('license-input').value || '').trim().toUpperCase();
      var msg = $('license-msg');
      if (/^FORGE(-[A-Z0-9]{4}){3}$/.test(key)) {
        setPro(true);
        msg.textContent = 'Pro activated on this device. Welcome aboard.';
        msg.className = 'license-msg ok';
        setTimeout(function () { hideModal(); PF.toast('Pro unlocked'); PF.refreshWorkbench(); }, 800);
      } else {
        msg.textContent = 'That does not look like a valid key (FORGE-XXXX-XXXX-XXXX).';
        msg.className = 'license-msg err';
      }
    });

    // install button
    $('install-btn').addEventListener('click', function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.finally(function () {
        deferredPrompt = null;
        $('install-btn').hidden = true;
      });
    });

    // service worker for offline
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(function () { /* offline is a bonus, not required */ });
    }
  });
})();
