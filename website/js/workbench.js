/* PromptForge — the workbench: editor, variables, token/cost meter, messages, history. */
/* Depends on window.PF_MODELS, PF_estimateTokens, PF_fmtUSD (pricing.js).       */
/* Talks to the app shell (promptforge.js) via window.PF for storage + Pro gate. */

window.PF = window.PF || {};

(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  };

  // Current in-editor document. id === null means unsaved scratch.
  var doc = { id: null, title: '', system: '', body: '', vars: {}, versions: [] };
  var varDebounce;

  // ---------- variable extraction ----------
  function extractVars(text) {
    var re = /\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, names = [], seen = {}, m;
    while ((m = re.exec(text))) {
      if (!seen[m[1]]) { seen[m[1]] = 1; names.push(m[1]); }
    }
    return names;
  }

  function renderVarInputs() {
    var names = extractVars(doc.system + '\n' + doc.body);
    var wrap = $('wb-vars'), grid = $('wb-vars-grid');
    if (!names.length) { wrap.hidden = true; grid.innerHTML = ''; return; }
    wrap.hidden = false;
    // Preserve existing values; drop vars no longer present.
    var next = {};
    names.forEach(function (n) { next[n] = doc.vars[n] || ''; });
    doc.vars = next;
    grid.innerHTML = '';
    names.forEach(function (n) {
      var field = document.createElement('label');
      field.className = 'wb-var';
      field.innerHTML = '<span>' + esc(n) + '</span>';
      var inp = document.createElement('input');
      inp.type = 'text';
      inp.value = doc.vars[n];
      inp.setAttribute('data-var', n);
      inp.addEventListener('input', function () {
        doc.vars[n] = inp.value;
        recompute();
      });
      field.appendChild(inp);
      grid.appendChild(field);
    });
  }

  // ---------- rendering ----------
  function fill(text) {
    return text.replace(/\{\{\s*([a-zA-Z0-9_.-]+)\s*\}\}/g, function (whole, name) {
      var v = doc.vars[name];
      return (v === undefined || v === '') ? whole : v;
    });
  }

  function renderedSystem() { return fill(doc.system); }
  function renderedBody() { return fill(doc.body); }

  // ---------- messages export ----------
  function buildMessages() {
    var fmt = $('wb-msg-format').value;
    var model = $('wb-msg-model').value;
    var sys = renderedSystem().trim();
    var body = renderedBody();
    if (fmt === 'openai') {
      var msgs = [];
      if (sys) msgs.push({ role: 'system', content: sys });
      msgs.push({ role: 'user', content: body });
      return JSON.stringify({ model: model, messages: msgs }, null, 2);
    }
    // anthropic
    var payload = { model: model, max_tokens: 1024 };
    if (sys) payload.system = sys;
    payload.messages = [{ role: 'user', content: body }];
    return JSON.stringify(payload, null, 2);
  }

  // ---------- token + cost meter ----------
  function recompute() {
    var sysTok = window.PF_estimateTokens(renderedSystem(), 1);
    var bodyTok = window.PF_estimateTokens(renderedBody(), 1);
    var total = sysTok + bodyTok;
    $('wb-tok-system').textContent = sysTok.toLocaleString();
    $('wb-tok-body').textContent = bodyTok.toLocaleString();
    $('wb-tok-total').textContent = total.toLocaleString();

    var expected = Math.max(0, parseInt($('wb-expected').value, 10) || 0);
    var list = $('wb-cost-list');
    list.innerHTML = '';
    window.PF_MODELS.forEach(function (mo) {
      var inTok = Math.round(total * mo.factor);
      var outTok = Math.round(expected * mo.factor);
      var cost = (inTok / 1e6) * mo.in + (outTok / 1e6) * mo.out;
      var over = total > mo.ctx;
      var row = document.createElement('div');
      row.className = 'wb-cost-row' + (over ? ' is-over' : '');
      row.innerHTML =
        '<span class="wb-cost-model">' + esc(mo.label) +
        '<small>' + esc(mo.vendor) + '</small></span>' +
        '<span class="wb-cost-val">' + window.PF_fmtUSD(cost) +
        (over ? '<small class="wb-over">over ' + (mo.ctx / 1000) + 'k ctx</small>' : '') +
        '</span>';
      list.appendChild(row);
    });

    // rendered preview
    var prev = $('wb-preview');
    var sys = renderedSystem().trim();
    prev.textContent = (sys ? '[system]\n' + sys + '\n\n' : '') + renderedBody();

    // messages pane (only if visible-ish; cheap enough to always build)
    $('wb-messages').textContent = buildMessages();
  }

  // ---------- editor <-> doc sync ----------
  function pullFromEditor() {
    doc.title = $('wb-title').value;
    doc.system = $('wb-system').value;
    doc.body = $('wb-body').value;
  }

  function pushToEditor() {
    $('wb-title').value = doc.title;
    $('wb-system').value = doc.system;
    $('wb-body').value = doc.body;
    renderVarInputs();
    recompute();
    renderHistory();
  }

  function onEdit() {
    pullFromEditor();
    clearTimeout(varDebounce);
    varDebounce = setTimeout(renderVarInputs, 250);
    recompute();
  }

  // ---------- library ----------
  function newDoc() {
    doc = { id: null, title: '', system: '', body: '', vars: {}, versions: [] };
    pushToEditor();
    highlightActive();
  }

  function loadDoc(id) {
    var d = PF.getPrompt(id);
    if (!d) return;
    doc = {
      id: d.id, title: d.title || '', system: d.system || '', body: d.body || '',
      vars: d.vars || {}, versions: (d.versions || []).slice()
    };
    pushToEditor();
    highlightActive();
  }

  function save() {
    pullFromEditor();
    if (!doc.title.trim() && !doc.body.trim()) { PF.toast('Nothing to save yet'); return; }
    if (!doc.title.trim()) doc.title = 'Untitled prompt';
    var saved = PF.savePrompt(doc);
    if (!saved) return; // gated (free cap reached) — savePrompt showed the modal
    doc.id = saved.id;
    renderList();
    highlightActive();
    PF.toast('Saved');
  }

  function snapshot() {
    pullFromEditor();
    if (!doc.body.trim()) { PF.toast('Nothing to snapshot'); return; }
    doc.versions = doc.versions || [];
    doc.versions.unshift({
      at: Date.now(),
      system: doc.system, body: doc.body, vars: JSON.parse(JSON.stringify(doc.vars))
    });
    if (!PF.isPro() && doc.versions.length > 5) doc.versions = doc.versions.slice(0, 5);
    if (doc.id) { PF.savePrompt(doc); renderList(); }
    renderHistory();
    PF.toast('Snapshot saved');
  }

  function renderList() {
    var list = $('wb-list');
    var q = ($('wb-search').value || '').toLowerCase();
    var items = PF.allPrompts().filter(function (p) {
      return !q || (p.title + ' ' + (p.body || '')).toLowerCase().indexOf(q) !== -1;
    });
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<div class="wb-empty">' + (q ? 'No matches.' : 'No saved prompts yet.') + '</div>';
      return;
    }
    items.forEach(function (p) {
      var el = document.createElement('button');
      el.className = 'wb-item' + (p.id === doc.id ? ' is-active' : '');
      el.setAttribute('data-id', p.id);
      var when = new Date(p.updated || p.created || Date.now());
      el.innerHTML =
        '<span class="wb-item-title">' + esc(p.title || 'Untitled') + '</span>' +
        '<span class="wb-item-meta">' + when.toLocaleDateString() +
        (p.versions && p.versions.length ? ' &middot; ' + p.versions.length + ' ver' : '') + '</span>';
      el.addEventListener('click', function () { loadDoc(p.id); });
      var del = document.createElement('span');
      del.className = 'wb-item-del';
      del.title = 'Delete';
      del.textContent = '×';
      del.addEventListener('click', function (e) {
        e.stopPropagation();
        PF.deletePrompt(p.id);
        if (doc.id === p.id) newDoc();
        renderList();
      });
      el.appendChild(del);
      list.appendChild(el);
    });
  }

  function highlightActive() {
    Array.prototype.forEach.call(document.querySelectorAll('.wb-item'), function (el) {
      el.classList.toggle('is-active', el.getAttribute('data-id') === doc.id);
    });
  }

  // ---------- history + diff ----------
  function diffLines(a, b) {
    var A = a.split('\n'), B = b.split('\n');
    var n = A.length, m = B.length, dp = [], i, j;
    for (i = 0; i <= n; i++) dp.push(new Uint16Array(m + 1));
    for (i = n - 1; i >= 0; i--)
      for (j = m - 1; j >= 0; j--)
        dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var res = []; i = 0; var k = 0;
    while (i < n && k < m) {
      if (A[i] === B[k]) { res.push([' ', A[i]]); i++; k++; }
      else if (dp[i + 1][k] >= dp[i][k + 1]) { res.push(['-', A[i]]); i++; }
      else { res.push(['+', B[k]]); k++; }
    }
    while (i < n) res.push(['-', A[i++]]);
    while (k < m) res.push(['+', B[k++]]);
    return res;
  }

  function renderHistory() {
    var wrap = $('wb-history');
    var vers = doc.versions || [];
    if (!vers.length) {
      wrap.innerHTML = '<div class="wb-empty">No snapshots yet. Hit <strong>Snapshot</strong> to capture the current prompt; compare any version against what’s in the editor.</div>';
      return;
    }
    wrap.innerHTML = '';
    vers.forEach(function (v, idx) {
      var row = document.createElement('div');
      row.className = 'wb-ver';
      row.innerHTML =
        '<div class="wb-ver-head"><span>Version ' + (vers.length - idx) + '</span>' +
        '<span class="wb-mut">' + new Date(v.at).toLocaleString() + '</span></div>' +
        '<div class="wb-ver-actions"></div>' +
        '<div class="diff-view wb-ver-diff" hidden></div>';
      var actions = row.querySelector('.wb-ver-actions');
      var diffBox = row.querySelector('.wb-ver-diff');

      var diffBtn = document.createElement('button');
      diffBtn.className = 'btn btn-ghost btn-sm';
      diffBtn.textContent = 'Diff vs editor';
      diffBtn.addEventListener('click', function () {
        pullFromEditor();
        if (diffBox.hidden) {
          var d = diffLines(v.body, doc.body);
          diffBox.innerHTML = '';
          var changed = 0;
          d.forEach(function (r) {
            var line = document.createElement('span');
            line.className = 'dl' + (r[0] === '+' ? ' add' : r[0] === '-' ? ' del' : '');
            line.textContent = (r[0] === ' ' ? '  ' : r[0] + ' ') + r[1];
            diffBox.appendChild(line);
            if (r[0] !== ' ') changed++;
          });
          if (!changed) diffBox.textContent = 'Identical to the current editor.';
          diffBox.hidden = false;
          diffBtn.textContent = 'Hide diff';
        } else {
          diffBox.hidden = true;
          diffBtn.textContent = 'Diff vs editor';
        }
      });

      var restoreBtn = document.createElement('button');
      restoreBtn.className = 'btn btn-ghost btn-sm';
      restoreBtn.textContent = 'Restore';
      restoreBtn.addEventListener('click', function () {
        doc.system = v.system; doc.body = v.body;
        doc.vars = JSON.parse(JSON.stringify(v.vars || {}));
        pushToEditor();
        PF.toast('Restored into editor (Save to keep)');
      });

      actions.appendChild(diffBtn);
      actions.appendChild(restoreBtn);
      wrap.appendChild(row);
    });
  }

  // ---------- tabs ----------
  function initTabs() {
    Array.prototype.forEach.call(document.querySelectorAll('.wb-tab'), function (tab) {
      tab.addEventListener('click', function () {
        Array.prototype.forEach.call(document.querySelectorAll('.wb-tab'), function (t) {
          t.classList.remove('is-active');
        });
        tab.classList.add('is-active');
        var name = tab.getAttribute('data-tab');
        ['preview', 'messages', 'history'].forEach(function (p) {
          $('wb-pane-' + p).hidden = (p !== name);
        });
        if (name === 'messages') recompute();
        if (name === 'history') renderHistory();
      });
    });
  }

  // ---------- public boot ----------
  PF.initWorkbench = function () {
    // model dropdown for messages
    var sel = $('wb-msg-model');
    window.PF_MODELS.forEach(function (mo) {
      var o = document.createElement('option');
      o.value = mo.id; o.textContent = mo.label;
      sel.appendChild(o);
    });

    $('wb-system').addEventListener('input', onEdit);
    $('wb-body').addEventListener('input', onEdit);
    $('wb-title').addEventListener('input', pullFromEditor);
    $('wb-expected').addEventListener('input', recompute);
    $('wb-msg-format').addEventListener('change', recompute);
    $('wb-msg-model').addEventListener('change', recompute);
    $('wb-search').addEventListener('input', renderList);

    $('wb-new').addEventListener('click', newDoc);
    $('wb-save').addEventListener('click', save);
    $('wb-snapshot').addEventListener('click', snapshot);
    $('wb-copy-preview').addEventListener('click', function () { PF.copy($('wb-preview').textContent); });
    $('wb-copy-messages').addEventListener('click', function () { PF.copy($('wb-messages').textContent); });

    $('wb-export-all').addEventListener('click', PF.exportLibrary);
    $('wb-import').addEventListener('click', function () { $('wb-import-file').click(); });
    $('wb-import-file').addEventListener('change', function (e) {
      PF.importLibrary(e.target.files[0], function () { renderList(); });
      e.target.value = '';
    });

    // Ctrl/Cmd+S saves
    document.addEventListener('keydown', function (e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        var inWb = document.activeElement && document.activeElement.closest &&
          document.activeElement.closest('#wb');
        if (inWb) { e.preventDefault(); save(); }
      }
    });

    initTabs();
    // Seed a starter prompt so the workbench is never empty on first visit.
    if (!PF.allPrompts().length) {
      doc = {
        id: null,
        title: 'Summarizer (starter)',
        system: 'You are a precise assistant that writes clear, faithful summaries.',
        body: 'Summarize the following text for {{audience}} in a {{tone}} tone.\n' +
              'Keep it under {{max_words}} words.\n\n{{input}}',
        vars: { audience: 'busy executives', tone: 'neutral', max_words: '120', input: '' },
        versions: []
      };
    }
    pushToEditor();
    renderList();
  };

  // let the shell refresh the list after Pro unlock, imports, etc.
  PF.refreshWorkbench = function () { renderList(); renderHistory(); recompute(); };
})();
