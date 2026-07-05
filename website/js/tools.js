/* OmniKit — tool implementations. Every tool runs 100% in the browser. */

window.OK = window.OK || {};

// ---------- shared helpers ----------
OK.esc = function (s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
};

OK.copy = function (text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { OK.toast('Copied to clipboard'); }, function () { OK.toast('Copy failed'); });
  } else {
    OK.toast('Clipboard unavailable');
  }
};

OK.fmtBytes = function (n) {
  if (n < 1024) return n + ' B';
  if (n < 1048576) return (n / 1024).toFixed(1) + ' KB';
  return (n / 1048576).toFixed(2) + ' MB';
};

OK.download = function (filename, text, mime) {
  var blob = text instanceof Blob ? text : new Blob([text], { type: mime || 'text/plain' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
};

// Inline SVG icon set (stroke style, currentColor).
OK.ICONS = {
  image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  braces: '<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',
  binary: '<rect x="14" y="14" width="4" height="6" rx="2"/><rect x="6" y="4" width="4" height="6" rx="2"/><path d="M6 20h4"/><path d="M14 10h4"/><path d="M6 14h2v6"/><path d="M14 4h2v6"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
  hash: '<path d="M4 9h16"/><path d="M4 15h16"/><path d="M10 3 8 21"/><path d="m16 3-2 18"/>',
  key: '<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5"/>',
  tag: '<path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5"/>',
  chart: '<path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
  type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
  diff: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
  file: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M16 13H8"/><path d="M16 17H8"/><path d="M10 9H8"/>',
  ruler: '<path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.4 2.4 0 0 1 0-3.4l2.6-2.6a2.4 2.4 0 0 1 3.4 0Z"/><path d="m14.5 12.5 2-2"/><path d="m11.5 9.5 2-2"/><path d="m8.5 6.5 2-2"/><path d="m17.5 15.5 2-2"/>',
  code: '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'
};

OK.icon = function (name) {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    (OK.ICONS[name] || OK.ICONS.braces) + '</svg>';
};

// Adds a floating "Copy" button to an output box.
OK.copyBtn = function (box, getText) {
  var b = document.createElement('button');
  b.className = 'copy-btn';
  b.textContent = 'Copy';
  b.addEventListener('click', function () { OK.copy(getText()); });
  box.appendChild(b);
};

// ---------- tool registry ----------
window.OMNIKIT_TOOLS = [

  // ============ 1. IMAGE COMPRESSOR ============
  {
    id: 'image',
    icon: 'image',
    name: 'Image Compressor',
    desc: 'Compress & convert PNG/JPEG/WebP with a quality slider. Files never leave your device.',
    proFeature: 'Batch compression',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <div class="drop-zone" id="img-drop">' + OK.icon('upload') + '<br>Drop images here or click to choose<br><small>Free: one at a time · Pro: batch</small></div>' +
        '  <input type="file" id="img-file" accept="image/*" multiple hidden>' +
        '  <div class="tool-row">' +
        '    <div><label>Format</label><select id="img-fmt"><option value="image/jpeg">JPEG</option><option value="image/webp">WebP</option><option value="image/png">PNG</option></select></div>' +
        '    <div style="flex:1;min-width:180px"><label>Quality: <span id="img-q-val">80</span>%</label><input type="range" id="img-q" min="10" max="100" value="80" style="width:100%"></div>' +
        '  </div>' +
        '  <div id="img-results" class="tool-ui"></div>' +
        '</div>';
      var drop = body.querySelector('#img-drop');
      var file = body.querySelector('#img-file');
      var q = body.querySelector('#img-q');
      var qVal = body.querySelector('#img-q-val');
      var results = body.querySelector('#img-results');
      q.addEventListener('input', function () { qVal.textContent = q.value; });
      drop.addEventListener('click', function () { file.click(); });
      drop.addEventListener('dragover', function (e) { e.preventDefault(); drop.classList.add('drag'); });
      drop.addEventListener('dragleave', function () { drop.classList.remove('drag'); });
      drop.addEventListener('drop', function (e) {
        e.preventDefault(); drop.classList.remove('drag');
        handleFiles(e.dataTransfer.files);
      });
      file.addEventListener('change', function () { handleFiles(file.files); });

      function handleFiles(list) {
        var files = Array.prototype.filter.call(list, function (f) { return f.type.indexOf('image/') === 0; });
        if (!files.length) return;
        var limit = OMNIKIT_CONFIG.limits.batchImages;
        if (files.length > limit && !OK.isPro()) {
          OK.requirePro('Batch compression (' + files.length + ' files at once) is a Pro feature.');
          files = files.slice(0, limit);
        }
        results.innerHTML = '';
        files.forEach(compress);
      }

      function compress(f) {
        var img = new Image();
        var srcUrl = URL.createObjectURL(f);
        img.onload = function () {
          var canvas = document.createElement('canvas');
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          canvas.getContext('2d').drawImage(img, 0, 0);
          var fmt = body.querySelector('#img-fmt').value;
          canvas.toBlob(function (blob) {
            URL.revokeObjectURL(srcUrl);
            if (!blob) return;
            OK.bumpOps();
            var saved = f.size > 0 ? Math.round((1 - blob.size / f.size) * 100) : 0;
            var card = document.createElement('div');
            card.className = 'result-card';
            var thumb = document.createElement('img');
            thumb.src = URL.createObjectURL(blob);
            var meta = document.createElement('div');
            meta.className = 'result-meta';
            meta.innerHTML = OK.esc(f.name) + '<br>' + OK.fmtBytes(f.size) + ' → ' + OK.fmtBytes(blob.size) +
              ' <strong>' + (saved >= 0 ? '−' + saved + '%' : '+' + (-saved) + '%') + '</strong>';
            var dl = document.createElement('button');
            dl.className = 'btn btn-primary btn-sm';
            dl.textContent = 'Download';
            var ext = fmt.split('/')[1];
            dl.addEventListener('click', function () {
              OK.download(f.name.replace(/\.[^.]+$/, '') + '.' + ext, blob);
            });
            card.appendChild(thumb); card.appendChild(meta); card.appendChild(dl);
            results.appendChild(card);
          }, fmt, parseInt(q.value, 10) / 100);
        };
        img.onerror = function () { URL.revokeObjectURL(srcUrl); OK.toast('Could not read ' + f.name); };
        img.src = srcUrl;
      }
    }
  },

  // ============ 2. JSON FORMATTER ============
  {
    id: 'json',
    icon: 'braces',
    name: 'JSON Formatter',
    desc: 'Validate, pretty-print and minify JSON instantly.',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <textarea id="json-in" placeholder=\'{"paste":"your JSON here"}\'></textarea>' +
        '  <div class="tool-row">' +
        '    <button class="btn btn-primary btn-sm" id="json-fmt">Format</button>' +
        '    <button class="btn btn-ghost btn-sm" id="json-min">Minify</button>' +
        '    <label style="margin:0">Indent <select id="json-indent"><option>2</option><option>4</option></select></label>' +
        '  </div>' +
        '  <div class="out-box" id="json-out">Result appears here</div>' +
        '</div>';
      var input = body.querySelector('#json-in');
      var out = body.querySelector('#json-out');
      function run(minify) {
        out.classList.remove('out-err', 'out-ok');
        try {
          var parsed = JSON.parse(input.value);
          var indent = parseInt(body.querySelector('#json-indent').value, 10);
          out.textContent = minify ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent);
          out.classList.add('out-ok');
          OK.copyBtn(out, function () { return out.textContent; });
          OK.bumpOps();
        } catch (e) {
          out.textContent = 'Error: ' + e.message;
          out.classList.add('out-err');
        }
      }
      body.querySelector('#json-fmt').addEventListener('click', function () { run(false); });
      body.querySelector('#json-min').addEventListener('click', function () { run(true); });
    }
  },

  // ============ 3. BASE64 ============
  {
    id: 'b64',
    icon: 'binary',
    name: 'Base64 Encode / Decode',
    desc: 'UTF-8 safe Base64 encoding and decoding for any text.',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <textarea id="b64-in" placeholder="Text or Base64…"></textarea>' +
        '  <div class="tool-row">' +
        '    <button class="btn btn-primary btn-sm" id="b64-enc">Encode →</button>' +
        '    <button class="btn btn-ghost btn-sm" id="b64-dec">← Decode</button>' +
        '  </div>' +
        '  <div class="out-box" id="b64-out">Result appears here</div>' +
        '</div>';
      var input = body.querySelector('#b64-in');
      var out = body.querySelector('#b64-out');
      function show(text, err) {
        out.classList.toggle('out-err', !!err);
        out.classList.toggle('out-ok', !err);
        out.textContent = text;
        if (!err) { OK.copyBtn(out, function () { return out.textContent; }); OK.bumpOps(); }
      }
      body.querySelector('#b64-enc').addEventListener('click', function () {
        try {
          var bytes = new TextEncoder().encode(input.value);
          var bin = '';
          bytes.forEach(function (b) { bin += String.fromCharCode(b); });
          show(btoa(bin));
        } catch (e) { show('Error: ' + e.message, true); }
      });
      body.querySelector('#b64-dec').addEventListener('click', function () {
        try {
          var bin = atob(input.value.trim());
          var bytes = new Uint8Array(bin.length);
          for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          show(new TextDecoder().decode(bytes));
        } catch (_e) { show('Error: invalid Base64 input', true); }
      });
    }
  },

  // ============ 4. URL ENCODER ============
  {
    id: 'url',
    icon: 'link',
    name: 'URL Encode / Decode',
    desc: 'Percent-encode and decode URLs and query strings.',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <textarea id="url-in" placeholder="https://example.com/?q=hello world"></textarea>' +
        '  <div class="tool-row">' +
        '    <button class="btn btn-primary btn-sm" id="url-enc">Encode →</button>' +
        '    <button class="btn btn-ghost btn-sm" id="url-dec">← Decode</button>' +
        '  </div>' +
        '  <div class="out-box" id="url-out">Result appears here</div>' +
        '</div>';
      var input = body.querySelector('#url-in');
      var out = body.querySelector('#url-out');
      function show(fn) {
        try {
          out.classList.remove('out-err');
          out.classList.add('out-ok');
          out.textContent = fn(input.value);
          OK.copyBtn(out, function () { return out.textContent; });
          OK.bumpOps();
        } catch (e) {
          out.classList.add('out-err');
          out.textContent = 'Error: ' + e.message;
        }
      }
      body.querySelector('#url-enc').addEventListener('click', function () { show(encodeURIComponent); });
      body.querySelector('#url-dec').addEventListener('click', function () { show(decodeURIComponent); });
    }
  },

  // ============ 5. HASH GENERATOR ============
  {
    id: 'hash',
    icon: 'hash',
    name: 'Hash Generator',
    desc: 'SHA-1, SHA-256, SHA-384 & SHA-512 digests via native WebCrypto.',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <textarea id="hash-in" placeholder="Text to hash…"></textarea>' +
        '  <button class="btn btn-primary btn-sm" id="hash-go" style="justify-self:start">Generate hashes</button>' +
        '  <div id="hash-outs" class="tool-ui"></div>' +
        '</div>';
      var outs = body.querySelector('#hash-outs');
      body.querySelector('#hash-go').addEventListener('click', function () {
        var data = new TextEncoder().encode(body.querySelector('#hash-in').value);
        outs.innerHTML = '';
        ['SHA-1', 'SHA-256', 'SHA-384', 'SHA-512'].forEach(function (algo) {
          crypto.subtle.digest(algo, data).then(function (buf) {
            var hex = Array.prototype.map.call(new Uint8Array(buf), function (b) {
              return b.toString(16).padStart(2, '0');
            }).join('');
            var box = document.createElement('div');
            box.className = 'out-box out-ok';
            var label = document.createElement('div');
            label.style.cssText = 'font-size:.72rem;color:var(--text-mute);margin-bottom:.2em';
            label.textContent = algo;
            var val = document.createElement('div');
            val.textContent = hex;
            box.appendChild(label); box.appendChild(val);
            OK.copyBtn(box, function () { return hex; });
            outs.appendChild(box);
          });
        });
        OK.bumpOps();
      });
    }
  },

  // ============ 6. PASSWORD GENERATOR ============
  {
    id: 'pass',
    icon: 'key',
    name: 'Password Generator',
    desc: 'Cryptographically secure passwords with a live entropy meter.',
    proFeature: 'Bulk generation',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <div class="tool-row">' +
        '    <label style="margin:0">Length <input type="number" id="pw-len" min="6" max="128" value="20" style="width:5em"></label>' +
        '    <label style="margin:0"><input type="checkbox" id="pw-up" checked> A-Z</label>' +
        '    <label style="margin:0"><input type="checkbox" id="pw-lo" checked> a-z</label>' +
        '    <label style="margin:0"><input type="checkbox" id="pw-di" checked> 0-9</label>' +
        '    <label style="margin:0"><input type="checkbox" id="pw-sy" checked> !@#$</label>' +
        '    <label style="margin:0">Count <input type="number" id="pw-count" min="1" max="1000" value="1" style="width:5em"></label>' +
        '  </div>' +
        '  <button class="btn btn-primary btn-sm" id="pw-go" style="justify-self:start">Generate</button>' +
        '  <div class="strength-bar"><div class="strength-fill" id="pw-strength"></div></div>' +
        '  <div class="chip" id="pw-entropy">Entropy: —</div>' +
        '  <div class="out-box" id="pw-out">Passwords appear here</div>' +
        '</div>';
      var out = body.querySelector('#pw-out');
      body.querySelector('#pw-go').addEventListener('click', function () {
        var sets = [];
        if (body.querySelector('#pw-up').checked) sets.push('ABCDEFGHJKLMNPQRSTUVWXYZ');
        if (body.querySelector('#pw-lo').checked) sets.push('abcdefghijkmnopqrstuvwxyz');
        if (body.querySelector('#pw-di').checked) sets.push('23456789');
        if (body.querySelector('#pw-sy').checked) sets.push('!@#$%^&*-_=+?');
        if (!sets.length) { OK.toast('Pick at least one character set'); return; }
        var pool = sets.join('');
        var len = Math.min(128, Math.max(6, parseInt(body.querySelector('#pw-len').value, 10) || 20));
        var count = Math.min(1000, Math.max(1, parseInt(body.querySelector('#pw-count').value, 10) || 1));
        var freeMax = OMNIKIT_CONFIG.limits.bulkPasswords;
        if (count > freeMax && !OK.isPro()) {
          OK.requirePro('Generating more than ' + freeMax + ' passwords at once is a Pro feature.');
          count = freeMax;
        }
        var list = [];
        for (var c = 0; c < count; c++) {
          var pw = '';
          var rand = new Uint32Array(len);
          crypto.getRandomValues(rand);
          for (var i = 0; i < len; i++) pw += pool[rand[i] % pool.length];
          list.push(pw);
        }
        var entropy = Math.round(len * Math.log2(pool.length));
        body.querySelector('#pw-entropy').innerHTML = 'Entropy: <strong>' + entropy + ' bits</strong>';
        var fill = body.querySelector('#pw-strength');
        var pct = Math.min(100, entropy / 1.28);
        fill.style.width = pct + '%';
        fill.style.background = entropy < 50 ? 'var(--red)' : entropy < 80 ? 'var(--yellow)' : 'var(--green)';
        out.classList.add('out-ok');
        out.textContent = list.join('\n');
        OK.copyBtn(out, function () { return list.join('\n'); });
        OK.bumpOps();
      });
    }
  },

  // ============ 7. UUID GENERATOR ============
  {
    id: 'uuid',
    icon: 'tag',
    name: 'UUID Generator',
    desc: 'RFC 4122 v4 UUIDs, single or in bulk.',
    proFeature: 'Bulk generation',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <div class="tool-row">' +
        '    <label style="margin:0">Count <input type="number" id="uuid-count" min="1" max="5000" value="1" style="width:6em"></label>' +
        '    <button class="btn btn-primary btn-sm" id="uuid-go">Generate</button>' +
        '  </div>' +
        '  <div class="out-box" id="uuid-out">UUIDs appear here</div>' +
        '</div>';
      var out = body.querySelector('#uuid-out');
      function v4() {
        if (crypto.randomUUID) return crypto.randomUUID();
        var b = crypto.getRandomValues(new Uint8Array(16));
        b[6] = (b[6] & 0x0f) | 0x40;
        b[8] = (b[8] & 0x3f) | 0x80;
        var h = Array.prototype.map.call(b, function (x) { return x.toString(16).padStart(2, '0'); }).join('');
        return h.slice(0, 8) + '-' + h.slice(8, 12) + '-' + h.slice(12, 16) + '-' + h.slice(16, 20) + '-' + h.slice(20);
      }
      body.querySelector('#uuid-go').addEventListener('click', function () {
        var count = Math.min(5000, Math.max(1, parseInt(body.querySelector('#uuid-count').value, 10) || 1));
        var freeMax = OMNIKIT_CONFIG.limits.bulkUuids;
        if (count > freeMax && !OK.isPro()) {
          OK.requirePro('Generating more than ' + freeMax + ' UUIDs at once is a Pro feature.');
          count = freeMax;
        }
        var list = [];
        for (var i = 0; i < count; i++) list.push(v4());
        out.classList.add('out-ok');
        out.textContent = list.join('\n');
        OK.copyBtn(out, function () { return list.join('\n'); });
        OK.bumpOps();
      });
    }
  },

  // ============ 8. WORD COUNTER ============
  {
    id: 'words',
    icon: 'chart',
    name: 'Word Counter',
    desc: 'Words, characters, sentences and reading time — live as you type.',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <textarea id="wc-in" placeholder="Paste or type text…"></textarea>' +
        '  <div class="tool-row" id="wc-stats">' +
        '    <span class="chip">Words: <strong id="wc-words">0</strong></span>' +
        '    <span class="chip">Characters: <strong id="wc-chars">0</strong></span>' +
        '    <span class="chip">No spaces: <strong id="wc-nospace">0</strong></span>' +
        '    <span class="chip">Sentences: <strong id="wc-sent">0</strong></span>' +
        '    <span class="chip">Paragraphs: <strong id="wc-para">0</strong></span>' +
        '    <span class="chip">Reading time: <strong id="wc-time">0 min</strong></span>' +
        '  </div>' +
        '</div>';
      var input = body.querySelector('#wc-in');
      input.addEventListener('input', function () {
        var t = input.value;
        var words = (t.match(/\S+/g) || []).length;
        body.querySelector('#wc-words').textContent = words;
        body.querySelector('#wc-chars').textContent = t.length;
        body.querySelector('#wc-nospace').textContent = t.replace(/\s/g, '').length;
        body.querySelector('#wc-sent').textContent = (t.match(/[.!?]+(\s|$)/g) || []).length;
        body.querySelector('#wc-para').textContent = t.trim() ? t.trim().split(/\n\s*\n/).length : 0;
        body.querySelector('#wc-time').textContent = Math.max(words ? 1 : 0, Math.round(words / 220)) + ' min';
        OK.bumpOps(true);
      });
    }
  },

  // ============ 9. CASE CONVERTER ============
  {
    id: 'case',
    icon: 'type',
    name: 'Case Converter',
    desc: 'UPPER, lower, Title, camelCase, snake_case, kebab-case & more.',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <textarea id="case-in" placeholder="Convert my text case"></textarea>' +
        '  <div class="tool-row" id="case-btns"></div>' +
        '  <div class="out-box" id="case-out">Result appears here</div>' +
        '</div>';
      var input = body.querySelector('#case-in');
      var out = body.querySelector('#case-out');
      function words(t) {
        return t.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
          .split(/[^A-Za-z0-9]+/).filter(Boolean).map(function (w) { return w.toLowerCase(); });
      }
      var modes = [
        ['UPPER', function (t) { return t.toUpperCase(); }],
        ['lower', function (t) { return t.toLowerCase(); }],
        ['Title Case', function (t) { return t.toLowerCase().replace(/\b\w/g, function (c) { return c.toUpperCase(); }); }],
        ['Sentence case', function (t) { return t.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, function (c) { return c.toUpperCase(); }); }],
        ['camelCase', function (t) { return words(t).map(function (w, i) { return i ? w[0].toUpperCase() + w.slice(1) : w; }).join(''); }],
        ['PascalCase', function (t) { return words(t).map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join(''); }],
        ['snake_case', function (t) { return words(t).join('_'); }],
        ['kebab-case', function (t) { return words(t).join('-'); }],
        ['CONSTANT_CASE', function (t) { return words(t).join('_').toUpperCase(); }]
      ];
      var row = body.querySelector('#case-btns');
      modes.forEach(function (m) {
        var b = document.createElement('button');
        b.className = 'btn btn-ghost btn-sm';
        b.textContent = m[0];
        b.addEventListener('click', function () {
          out.classList.add('out-ok');
          out.textContent = m[1](input.value);
          OK.copyBtn(out, function () { return out.textContent; });
          OK.bumpOps();
        });
        row.appendChild(b);
      });
    }
  },

  // ============ 10. COLOR STUDIO ============
  {
    id: 'color',
    icon: 'palette',
    name: 'Color Studio',
    desc: 'Convert HEX, RGB & HSL and generate a full shade palette.',
    proFeature: 'Palette export',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <div class="tool-row">' +
        '    <input type="text" id="col-in" placeholder="#7c5cff or rgb(124,92,255) or hsl(258,100%,68%)" style="flex:1;min-width:220px">' +
        '    <button class="btn btn-primary btn-sm" id="col-go">Convert</button>' +
        '  </div>' +
        '  <div class="tool-row" id="col-formats"></div>' +
        '  <div class="swatch-row" id="col-swatches" style="padding-bottom:1.4rem"></div>' +
        '  <button class="btn btn-ghost btn-sm" id="col-export" style="justify-self:start" hidden>Export palette (CSS) — Pro</button>' +
        '</div>';
      var formats = body.querySelector('#col-formats');
      var swatches = body.querySelector('#col-swatches');
      var exportBtn = body.querySelector('#col-export');
      var currentShades = [];

      function hexToRgb(hex) {
        hex = hex.replace('#', '');
        if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
        if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
        return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16)];
      }
      function rgbToHex(r, g, b) {
        return '#' + [r, g, b].map(function (x) { return Math.round(x).toString(16).padStart(2, '0'); }).join('');
      }
      function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
          var d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          else if (max === g) h = ((b - r) / d + 2) / 6;
          else h = ((r - g) / d + 4) / 6;
        }
        return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
      }
      function hslToRgb(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        if (s === 0) { var v = Math.round(l * 255); return [v, v, v]; }
        function hue(p, q, t) {
          if (t < 0) t += 1; if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        }
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        return [hue(p, q, h + 1 / 3), hue(p, q, h), hue(p, q, h - 1 / 3)].map(function (x) { return Math.round(x * 255); });
      }
      function parse(str) {
        str = str.trim();
        var m;
        if ((m = str.match(/^#?[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/))) return hexToRgb(str);
        if ((m = str.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i))) return [+m[1], +m[2], +m[3]];
        if ((m = str.match(/^hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/i))) return hslToRgb(+m[1], +m[2], +m[3]);
        return null;
      }
      function chip(label, value) {
        var c = document.createElement('button');
        c.className = 'chip';
        c.style.cursor = 'pointer';
        c.innerHTML = label + ': <strong>' + OK.esc(value) + '</strong>';
        c.title = 'Click to copy';
        c.addEventListener('click', function () { OK.copy(value); });
        formats.appendChild(c);
      }
      body.querySelector('#col-go').addEventListener('click', function () {
        var rgb = parse(body.querySelector('#col-in').value);
        formats.innerHTML = '';
        swatches.innerHTML = '';
        currentShades = [];
        if (!rgb) { OK.toast('Could not parse that color'); return; }
        var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
        chip('HEX', rgbToHex(rgb[0], rgb[1], rgb[2]));
        chip('RGB', 'rgb(' + rgb.join(', ') + ')');
        chip('HSL', 'hsl(' + hsl[0] + ', ' + hsl[1] + '%, ' + hsl[2] + '%)');
        [95, 85, 72, 60, 50, 40, 30, 20, 12].forEach(function (l, i) {
          var srgb = hslToRgb(hsl[0], hsl[1], l);
          var hex = rgbToHex(srgb[0], srgb[1], srgb[2]);
          currentShades.push({ n: (i + 1) * 100, hex: hex });
          var sw = document.createElement('button');
          sw.className = 'swatch';
          sw.style.background = hex;
          sw.title = hex + ' — click to copy';
          sw.innerHTML = '<span>' + hex + '</span>';
          sw.addEventListener('click', function () { OK.copy(hex); });
          swatches.appendChild(sw);
        });
        exportBtn.hidden = false;
        OK.bumpOps();
      });
      exportBtn.addEventListener('click', function () {
        if (!OK.requirePro('Exporting palettes as CSS variables is a Pro feature.')) return;
        var css = ':root {\n' + currentShades.map(function (s) {
          return '  --color-' + s.n + ': ' + s.hex + ';';
        }).join('\n') + '\n}\n';
        OK.download('palette.css', css, 'text/css');
      });
    }
  },

  // ============ 11. TEXT DIFF ============
  {
    id: 'diff',
    icon: 'diff',
    name: 'Text Diff',
    desc: 'Compare two texts line-by-line with highlighted changes.',
    proFeature: 'Export as .patch',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <div class="tool-row" style="align-items:stretch">' +
        '    <textarea id="diff-a" placeholder="Original text" style="flex:1;min-width:200px"></textarea>' +
        '    <textarea id="diff-b" placeholder="Changed text" style="flex:1;min-width:200px"></textarea>' +
        '  </div>' +
        '  <div class="tool-row">' +
        '    <button class="btn btn-primary btn-sm" id="diff-go">Compare</button>' +
        '    <button class="btn btn-ghost btn-sm" id="diff-export" hidden>Export .patch — Pro</button>' +
        '  </div>' +
        '  <div class="out-box diff-view" id="diff-out">Diff appears here</div>' +
        '</div>';
      var out = body.querySelector('#diff-out');
      var exportBtn = body.querySelector('#diff-export');
      var lastDiff = [];

      function diffLines(a, b) {
        var A = a.split('\n'), B = b.split('\n');
        var MAX = 3000;
        if (A.length > MAX || B.length > MAX) return null;
        // LCS table
        var n = A.length, m = B.length;
        var dp = [];
        for (var i = 0; i <= n; i++) dp.push(new Uint16Array(m + 1));
        for (i = n - 1; i >= 0; i--) {
          for (var j = m - 1; j >= 0; j--) {
            dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
          }
        }
        var res = [];
        i = 0; var k = 0;
        while (i < n && k < m) {
          if (A[i] === B[k]) { res.push([' ', A[i]]); i++; k++; }
          else if (dp[i + 1][k] >= dp[i][k + 1]) { res.push(['-', A[i]]); i++; }
          else { res.push(['+', B[k]]); k++; }
        }
        while (i < n) { res.push(['-', A[i++]]); }
        while (k < m) { res.push(['+', B[k++]]); }
        return res;
      }
      body.querySelector('#diff-go').addEventListener('click', function () {
        var d = diffLines(body.querySelector('#diff-a').value, body.querySelector('#diff-b').value);
        if (!d) { OK.toast('Too large — max 3000 lines per side'); return; }
        lastDiff = d;
        out.innerHTML = '';
        var changed = 0;
        d.forEach(function (row) {
          var line = document.createElement('span');
          line.className = 'dl' + (row[0] === '+' ? ' add' : row[0] === '-' ? ' del' : '');
          line.textContent = (row[0] === ' ' ? '  ' : row[0] + ' ') + row[1];
          out.appendChild(line);
          if (row[0] !== ' ') changed++;
        });
        if (!changed) { out.textContent = 'No differences — texts are identical'; }
        exportBtn.hidden = false;
        OK.bumpOps();
      });
      exportBtn.addEventListener('click', function () {
        if (!OK.requirePro('Exporting diffs as .patch files is a Pro feature.')) return;
        var text = lastDiff.map(function (r) { return (r[0] === ' ' ? ' ' : r[0]) + r[1]; }).join('\n');
        OK.download('changes.patch', text);
      });
    }
  },

  // ============ 12. LOREM IPSUM ============
  {
    id: 'lorem',
    icon: 'file',
    name: 'Lorem Ipsum',
    desc: 'Placeholder text by the paragraph, sentence or word.',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <div class="tool-row">' +
        '    <label style="margin:0">Generate <input type="number" id="li-n" min="1" max="50" value="3" style="width:5em"></label>' +
        '    <select id="li-unit"><option value="paragraphs">paragraphs</option><option value="sentences">sentences</option><option value="words">words</option></select>' +
        '    <button class="btn btn-primary btn-sm" id="li-go">Generate</button>' +
        '  </div>' +
        '  <div class="out-box" id="li-out">Lorem ipsum appears here</div>' +
        '</div>';
      var WORDS = ('lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum').split(' ');
      var out = body.querySelector('#li-out');
      function rnd(n) { return Math.floor(Math.random() * n); }
      function sentence() {
        var len = 6 + rnd(10);
        var s = [];
        for (var i = 0; i < len; i++) s.push(WORDS[rnd(WORDS.length)]);
        var t = s.join(' ');
        return t[0].toUpperCase() + t.slice(1) + '.';
      }
      function paragraph() {
        var len = 3 + rnd(4);
        var p = [];
        for (var i = 0; i < len; i++) p.push(sentence());
        return p.join(' ');
      }
      body.querySelector('#li-go').addEventListener('click', function () {
        var n = Math.min(50, Math.max(1, parseInt(body.querySelector('#li-n').value, 10) || 3));
        var unit = body.querySelector('#li-unit').value;
        var parts = [];
        for (var i = 0; i < n; i++) {
          parts.push(unit === 'paragraphs' ? paragraph() : unit === 'sentences' ? sentence() : WORDS[rnd(WORDS.length)]);
        }
        out.classList.add('out-ok');
        out.textContent = parts.join(unit === 'paragraphs' ? '\n\n' : ' ');
        OK.copyBtn(out, function () { return out.textContent; });
        OK.bumpOps();
      });
    }
  },

  // ============ 13. UNIT CONVERTER ============
  {
    id: 'unit',
    icon: 'ruler',
    name: 'Unit Converter',
    desc: 'Length, weight, temperature and data — converted live.',
    render: function (body) {
      var CATS = {
        Length: { m: 1, km: 1000, cm: 0.01, mm: 0.001, mi: 1609.344, yd: 0.9144, ft: 0.3048, in: 0.0254 },
        Weight: { kg: 1, g: 0.001, mg: 0.000001, t: 1000, lb: 0.45359237, oz: 0.028349523125 },
        Data: { MB: 1, KB: 0.001, GB: 1000, TB: 1000000, B: 0.000001, GiB: 1073.741824, MiB: 1.048576 },
        Temperature: null // special-cased
      };
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <div class="tool-row">' +
        '    <select id="un-cat"></select>' +
        '    <input type="number" id="un-val" value="1" step="any" style="width:9em">' +
        '    <select id="un-from"></select>' +
        '    <span>→</span>' +
        '    <select id="un-to"></select>' +
        '  </div>' +
        '  <div class="out-box out-ok" id="un-out">1 m = 3.28084 ft</div>' +
        '</div>';
      var catSel = body.querySelector('#un-cat');
      var fromSel = body.querySelector('#un-from');
      var toSel = body.querySelector('#un-to');
      var val = body.querySelector('#un-val');
      var out = body.querySelector('#un-out');
      Object.keys(CATS).forEach(function (c) {
        var o = document.createElement('option'); o.textContent = c; catSel.appendChild(o);
      });
      function fillUnits() {
        var cat = catSel.value;
        var units = cat === 'Temperature' ? ['°C', '°F', 'K'] : Object.keys(CATS[cat]);
        [fromSel, toSel].forEach(function (sel) {
          sel.innerHTML = '';
          units.forEach(function (u) { var o = document.createElement('option'); o.textContent = u; sel.appendChild(o); });
        });
        toSel.selectedIndex = Math.min(1, units.length - 1);
        run();
      }
      function toC(v, u) { return u === '°C' ? v : u === '°F' ? (v - 32) * 5 / 9 : v - 273.15; }
      function fromC(v, u) { return u === '°C' ? v : u === '°F' ? v * 9 / 5 + 32 : v + 273.15; }
      function run() {
        var v = parseFloat(val.value);
        if (isNaN(v)) { out.textContent = 'Enter a number'; return; }
        var cat = catSel.value, res;
        if (cat === 'Temperature') {
          res = fromC(toC(v, fromSel.value), toSel.value);
        } else {
          res = v * CATS[cat][fromSel.value] / CATS[cat][toSel.value];
        }
        var pretty = Math.abs(res) >= 1e9 || (Math.abs(res) < 1e-6 && res !== 0)
          ? res.toExponential(6) : parseFloat(res.toPrecision(9)).toString();
        out.textContent = v + ' ' + fromSel.value + ' = ' + pretty + ' ' + toSel.value;
        OK.bumpOps(true);
      }
      catSel.addEventListener('change', fillUnits);
      [val, fromSel, toSel].forEach(function (el) { el.addEventListener('input', run); });
      fillUnits();
    }
  },

  // ============ 14. MARKDOWN PREVIEW ============
  {
    id: 'md',
    icon: 'code',
    name: 'Markdown Preview',
    desc: 'Live-render Markdown to clean HTML as you type.',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <div class="tool-row" style="align-items:stretch">' +
        '    <textarea id="md-in" placeholder="# Hello&#10;&#10;Type **markdown** here…" style="flex:1;min-width:200px;min-height:220px"></textarea>' +
        '    <div class="out-box md-preview" id="md-out" style="flex:1;min-width:200px;white-space:normal;word-break:normal"></div>' +
        '  </div>' +
        '</div>';
      var input = body.querySelector('#md-in');
      var out = body.querySelector('#md-out');

      function inline(s) {
        // s is already HTML-escaped
        s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
        s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        s = s.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
        return s;
      }
      function renderMd(src) {
        var lines = OK.esc(src).split('\n');
        var html = [];
        var inCode = false, inList = false;
        lines.forEach(function (line) {
          if (/^```/.test(line)) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push(inCode ? '</code></pre>' : '<pre><code>');
            inCode = !inCode;
            return;
          }
          if (inCode) { html.push(line + '\n'); return; }
          var m;
          if ((m = line.match(/^(#{1,3})\s+(.*)/))) {
            if (inList) { html.push('</ul>'); inList = false; }
            var lvl = m[1].length;
            html.push('<h' + lvl + '>' + inline(m[2]) + '</h' + lvl + '>');
          } else if (/^\s*[-*]\s+/.test(line)) {
            if (!inList) { html.push('<ul>'); inList = true; }
            html.push('<li>' + inline(line.replace(/^\s*[-*]\s+/, '')) + '</li>');
          } else if (/^\s*(---+|\*\*\*+)\s*$/.test(line)) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push('<hr>');
          } else if (/^&gt;\s?/.test(line)) {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push('<blockquote><p>' + inline(line.replace(/^&gt;\s?/, '')) + '</p></blockquote>');
          } else if (line.trim() === '') {
            if (inList) { html.push('</ul>'); inList = false; }
          } else {
            if (inList) { html.push('</ul>'); inList = false; }
            html.push('<p>' + inline(line) + '</p>');
          }
        });
        if (inList) html.push('</ul>');
        if (inCode) html.push('</code></pre>');
        return html.join('');
      }
      input.addEventListener('input', function () {
        out.innerHTML = renderMd(input.value);
        OK.bumpOps(true);
      });
      input.value = '# OmniKit\n\nThis preview renders **as you type** — right here, *in your browser*.\n\n- No uploads\n- No accounts\n- `Instant`\n\n> The product is what this page can do.';
      input.dispatchEvent(new Event('input'));
    }
  },

  // ============ 15. TIMESTAMP CONVERTER ============
  {
    id: 'epoch',
    icon: 'clock',
    name: 'Timestamp Converter',
    desc: 'Unix epoch to human-readable dates and back, with a live clock.',
    render: function (body) {
      body.innerHTML =
        '<div class="tool-ui">' +
        '  <div class="chip">Current epoch: <strong id="ep-now">…</strong></div>' +
        '  <div class="tool-row">' +
        '    <input type="text" id="ep-in" placeholder="1720000000 or 2026-07-05T12:00" style="flex:1;min-width:200px">' +
        '    <button class="btn btn-primary btn-sm" id="ep-go">Convert</button>' +
        '  </div>' +
        '  <div class="out-box" id="ep-out">Result appears here</div>' +
        '</div>';
      var nowEl = body.querySelector('#ep-now');
      var timer = setInterval(function () {
        if (!document.body.contains(nowEl)) { clearInterval(timer); return; }
        nowEl.textContent = Math.floor(Date.now() / 1000);
      }, 1000);
      nowEl.textContent = Math.floor(Date.now() / 1000);
      var out = body.querySelector('#ep-out');
      body.querySelector('#ep-go').addEventListener('click', function () {
        var raw = body.querySelector('#ep-in').value.trim();
        var d;
        if (/^\d{10}$/.test(raw)) d = new Date(parseInt(raw, 10) * 1000);
        else if (/^\d{13}$/.test(raw)) d = new Date(parseInt(raw, 10));
        else d = new Date(raw);
        if (isNaN(d.getTime())) {
          out.classList.add('out-err');
          out.textContent = 'Error: could not parse that as an epoch or a date';
          return;
        }
        out.classList.remove('out-err');
        out.classList.add('out-ok');
        var secs = Math.floor(d.getTime() / 1000);
        var rel = Math.round((d.getTime() - Date.now()) / 1000);
        var relStr = Math.abs(rel) < 60 ? rel + 's' : Math.abs(rel) < 3600 ? Math.round(rel / 60) + 'm'
          : Math.abs(rel) < 86400 ? Math.round(rel / 3600) + 'h' : Math.round(rel / 86400) + 'd';
        out.textContent =
          'Epoch (s):  ' + secs + '\n' +
          'Epoch (ms): ' + d.getTime() + '\n' +
          'ISO 8601:   ' + d.toISOString() + '\n' +
          'Local:      ' + d.toLocaleString() + '\n' +
          'UTC:        ' + d.toUTCString() + '\n' +
          'Relative:   ' + (rel >= 0 ? 'in ' + relStr : relStr.replace('-', '') + ' ago');
        OK.copyBtn(out, function () { return out.textContent; });
        OK.bumpOps();
      });
    }
  }
];
