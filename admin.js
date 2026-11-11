(function () {
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => [...document.querySelectorAll(s)];
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const bn = (n) => Number(n).toLocaleString('bn-BD');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const DRAFT = 'rufaida_draft_v1', GH = 'rufaida_gh_v1';

  /* ---------- অবস্থা ---------- */
  const base = window.SHOP_DATA || { settings: {}, categories: [], products: [] };
  let state;
  try { const d = localStorage.getItem(DRAFT); state = d ? JSON.parse(d) : clone(base); } catch (e) { state = clone(base); }
  state.settings = state.settings || {};
  state.categories = state.categories || [];
  state.products = state.products || [];

  function save(msg) {
    try { localStorage.setItem(DRAFT, JSON.stringify(state)); $('#status').textContent = 'ড্রাফট সংরক্ষিত ✓'; }
    catch (e) { $('#status').textContent = '⚠ ড্রাফট সংরক্ষণ হয়নি (ছবি বেশি)'; toast('ব্রাউজারে জায়গা শেষ! এখনই "প্রকাশ করুন" ট্যাব থেকে প্রকাশ করুন।'); }
    if (msg) toast(msg);
  }
  let tt;
  function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => t.classList.remove('show'), 2800); }

  /* ---------- ট্যাব ---------- */
  function go(tab) {
    $$('.tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === tab));
    $$('.panel').forEach((p) => p.classList.toggle('on', p.id === 'tab-' + tab));
    window.scrollTo(0, 0);
  }
  $$('.tabs button').forEach((b) => (b.onclick = () => { if (b.dataset.tab === 'form' && !editId) resetForm(); go(b.dataset.tab); }));
  $$('[data-go]').forEach((b) => (b.onclick = () => { resetForm(); go(b.dataset.go); }));

  /* ---------- পণ্য তালিকা ---------- */
  const ph = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 80"><rect width="64" height="80" fill="#f3ecf7"/><text x="32" y="50" font-size="30" text-anchor="middle">🧸</text></svg>';
  const phUri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(ph);
  function renderList() {
    $('#count').textContent = '(' + bn(state.products.length) + 'টি)';
    if (!state.products.length) { $('#plist').innerHTML = '<div class="empty">এখনো কোনো পণ্য নেই। "নতুন পণ্য যোগ করুন" চাপুন।</div>'; return; }
    $('#plist').innerHTML = state.products.map((p) => `
      <div class="item" data-id="${esc(p.id)}">
        <img src="${esc((p.images && p.images[0]) || phUri)}" alt="">
        <div class="t"><b>${esc(p.name)}</b><small>৳${bn(p.price)} • ${esc(p.category || '')} • ${(p.ages || []).map(bn).join(',')} বছর${p.inStock === false ? ' • স্টক শেষ' : ''}</small></div>
        <div class="ops">
          <button data-a="edit">সম্পাদনা</button>
          <button data-a="stock">${p.inStock === false ? 'স্টকে আনুন' : 'স্টক শেষ'}</button>
          <button data-a="del">মুছুন</button>
        </div>
      </div>`).join('');
  }
  $('#plist').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-a]'); if (!b) return;
    const id = b.closest('.item').dataset.id;
    const p = state.products.find((x) => x.id === id); if (!p) return;
    if (b.dataset.a === 'edit') { loadForm(p); go('form'); }
    if (b.dataset.a === 'stock') { p.inStock = p.inStock === false; save(); renderList(); }
    if (b.dataset.a === 'del' && confirm('"' + p.name + '" মুছে ফেলবেন?')) {
      state.products = state.products.filter((x) => x.id !== id); save('পণ্য মোছা হয়েছে'); renderList();
    }
  });

  /* ---------- ফর্ম ---------- */
  let editId = null, formImgs = [];
  const agesBox = $('#f-ages');
  agesBox.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8].map((a) => `<label><input type="checkbox" value="${a}"> ${bn(a)} বছর</label>`).join('');
  $('#allAges').onclick = () => { const all = $$('#f-ages input').every((i) => i.checked); $$('#f-ages input').forEach((i) => (i.checked = !all)); };

  function renderCatSelect(sel) {
    $('#f-cat').innerHTML = state.categories.map((c) => `<option ${c === sel ? 'selected' : ''}>${esc(c)}</option>`).join('');
  }
  function resetForm() {
    editId = null; formImgs = [];
    $('#pform').reset();
    $('#f-stock').checked = true;
    $$('#f-ages input').forEach((i) => (i.checked = false));
    renderCatSelect(); renderImgs();
    $('#formTitle').textContent = 'নতুন পণ্য যোগ করুন';
  }
  function loadForm(p) {
    editId = p.id; formImgs = (p.images || []).slice();
    $('#f-name').value = p.name; $('#f-price').value = p.price; $('#f-old').value = p.oldPrice || '';
    $('#f-colors').value = p.colors || ''; $('#f-desc').value = p.description || '';
    $('#f-stock').checked = p.inStock !== false; $('#f-new').checked = !!p.isNew;
    $$('#f-ages input').forEach((i) => (i.checked = (p.ages || []).includes(+i.value)));
    renderCatSelect(p.category); renderImgs();
    $('#formTitle').textContent = 'পণ্য সম্পাদনা';
  }
  function renderImgs() {
    $('#imgs').innerHTML = formImgs.map((s, i) => `
      <div class="im"><img src="${esc(s)}" alt="">
        <button type="button" class="x" data-rm="${i}">✕</button>
        ${i === 0 ? '<div class="cover">কভার</div>' : `<button type="button" class="first" data-first="${i}">কভার করুন</button>`}
      </div>`).join('');
  }
  $('#imgs').addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]'), fi = e.target.closest('[data-first]');
    if (rm) formImgs.splice(+rm.dataset.rm, 1);
    if (fi) formImgs.unshift(formImgs.splice(+fi.dataset.first, 1)[0]);
    renderImgs();
  });

  function compress(file) {
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const M = 900, k = Math.min(1, M / Math.max(im.width, im.height));
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(im, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', 0.75));
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('ছবি পড়া যায়নি')); };
      im.src = url;
    });
  }
  async function addFiles(list) {
    for (const f of list) {
      if (!f.type.startsWith('image/')) continue;
      try { formImgs.push(await compress(f)); } catch (e) { toast('একটি ছবি পড়া যায়নি'); }
    }
    renderImgs();
  }
  $('#pick').onclick = () => $('#files').click();
  $('#files').onchange = (e) => { addFiles([...e.target.files]); e.target.value = ''; };
  const drop = $('#drop');
  ['dragover', 'dragenter'].forEach((n) => drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.add('over'); }));
  ['dragleave', 'drop'].forEach((n) => drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
  drop.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));
  $('#addUrl').onclick = () => {
    const u = $('#imgUrl').value.trim();
    if (!/^https?:\/\//i.test(u)) return toast('সঠিক লিংক দিন (https:// দিয়ে শুরু)');
    formImgs.push(u); $('#imgUrl').value = ''; renderImgs();
  };

  $('#cancel').onclick = () => { resetForm(); go('list'); };
  $('#pform').onsubmit = (e) => {
    e.preventDefault();
    const ages = $$('#f-ages input:checked').map((i) => +i.value);
    const p = {
      id: editId || 'p' + Date.now().toString(36),
      name: $('#f-name').value.trim(),
      price: +$('#f-price').value || 0,
      oldPrice: +$('#f-old').value || 0,
      category: $('#f-cat').value || '',
      ages: ages.length ? ages : [1, 2, 3, 4, 5, 6, 7, 8],
      colors: $('#f-colors').value.trim(),
      description: $('#f-desc').value.trim(),
      images: formImgs.slice(),
      inStock: $('#f-stock').checked,
      isNew: $('#f-new').checked,
    };
    if (!p.name) return toast('পণ্যের নাম দিন');
    if (editId) state.products = state.products.map((x) => (x.id === editId ? p : x));
    else state.products.push(p);
    save(editId ? 'পণ্য আপডেট হয়েছে ✓' : 'পণ্য যোগ হয়েছে ✓');
    resetForm(); renderList(); go('list');
  };

  /* ---------- ক্যাটেগরি ---------- */
  function renderCats() {
    $('#catList').innerHTML = state.categories.map((c, i) => `<span>${esc(c)}<button data-i="${i}" title="মুছুন">✕</button></span>`).join('') || '<p class="hint">কোনো ক্যাটেগরি নেই</p>';
  }
  $('#catList').onclick = (e) => {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    state.categories.splice(+b.dataset.i, 1); save(); renderCats(); renderCatSelect();
  };
  $('#addCat').onclick = () => {
    const v = $('#newCat').value.trim(); if (!v) return;
    if (!state.categories.includes(v)) state.categories.push(v);
    $('#newCat').value = ''; save(); renderCats(); renderCatSelect();
  };

  /* ---------- দোকানের তথ্য ---------- */
  $$('[data-s]').forEach((i) => {
    i.value = state.settings[i.dataset.s] || '';
    i.oninput = () => { state.settings[i.dataset.s] = i.value.trim(); save(); };
  });

  /* ---------- ফাইল তৈরি ---------- */
  function hash(s) {
    let a = 2166136261, b = 5381;
    for (let i = 0; i < s.length; i++) { a = Math.imul(a ^ s.charCodeAt(i), 16777619); b = (Math.imul(b, 33) + s.charCodeAt(i)) | 0; }
    return (a >>> 0).toString(36) + (b >>> 0).toString(36) + s.length.toString(36);
  }
  function build() {
    const out = clone(state), files = [], seen = {};
    out.products.forEach((p) => {
      p.images = (p.images || []).map((im) => {
        if (!im.startsWith('data:')) return im;
        const path = 'images/' + hash(im) + '.jpg';
        if (!seen[path]) { seen[path] = 1; files.push({ path, b64: im.split(',')[1], img: true }); }
        return path;
      });
    });
    const js = '// এই ফাইলটি অ্যাডমিন প্যানেল থেকে তৈরি। নিজে হাতে এডিট না করাই ভালো।\nwindow.SHOP_DATA = ' + JSON.stringify(out, null, 2) + ';\n';
    files.push({ path: 'data.js', text: js });
    return { files, out };
  }
  const b64ToBytes = (b) => { const s = atob(b), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); return u; };
  const utf8B64 = (t) => { const u = new TextEncoder().encode(t); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };

  /* ---------- zip (কোনো লাইব্রেরি ছাড়া) ---------- */
  const crcT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  const crc32 = (u) => { let c = 0xffffffff; for (let i = 0; i < u.length; i++) c = crcT[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  function makeZip(entries) {
    const enc = new TextEncoder(), parts = [], central = []; let off = 0;
    entries.forEach((e) => {
      const nm = enc.encode(e.name), crc = crc32(e.data), sz = e.data.length;
      const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true); lh.setUint16(8, 0, true);
      lh.setUint16(10, 0, true); lh.setUint16(12, 0x21, true); lh.setUint32(14, crc, true); lh.setUint32(18, sz, true); lh.setUint32(22, sz, true);
      lh.setUint16(26, nm.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), nm, e.data);
      const ch = new DataView(new ArrayBuffer(46));
      ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true); ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true);
      ch.setUint16(12, 0, true); ch.setUint16(14, 0x21, true); ch.setUint32(16, crc, true); ch.setUint32(20, sz, true); ch.setUint32(24, sz, true);
      ch.setUint16(28, nm.length, true); ch.setUint32(42, off, true);
      central.push(new Uint8Array(ch.buffer), nm);
      off += 30 + nm.length + sz;
    });
    const csz = central.reduce((a, b) => a + b.length, 0);
    const end = new DataView(new ArrayBuffer(22));
    end.setUint32(0, 0x06054b50, true); end.setUint16(8, entries.length, true); end.setUint16(10, entries.length, true);
    end.setUint32(12, csz, true); end.setUint32(16, off, true);
    return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
  }
  $('#dlZip').onclick = () => {
    const { files } = build();
    const entries = files.map((f) => ({ name: f.path, data: f.img ? b64ToBytes(f.b64) : new TextEncoder().encode(f.text) }));
    const a = document.createElement('a');
    a.href = URL.createObjectURL(makeZip(entries)); a.download = 'rufaida-update.zip';
    document.body.appendChild(a); a.click(); a.remove();
    toast('zip নামছে — খুলে data.js ও images GitHub-এ আপলোড করুন');
  };

  /* ---------- সরাসরি GitHub-এ প্রকাশ ---------- */
  try {
    const g = JSON.parse(localStorage.getItem(GH) || 'null');
    if (g) { $('#g-owner').value = g.owner || ''; $('#g-repo').value = g.repo || ''; $('#g-branch').value = g.branch || 'main'; $('#g-token').value = g.token || ''; $('#g-remember').checked = true; }
  } catch (e) {}
  const log = (m) => { const l = $('#log'); l.hidden = false; l.textContent += m + '\n'; l.scrollTop = l.scrollHeight; };

  $('#ghPublish').onclick = async () => {
    const owner = $('#g-owner').value.trim(), repo = $('#g-repo').value.trim(), branch = $('#g-branch').value.trim() || 'main', token = $('#g-token').value.trim();
    if (!owner || !repo || !token) return toast('ইউজারনেম, রিপোজিটরি ও টোকেন দিন');
    try {
      if ($('#g-remember').checked) localStorage.setItem(GH, JSON.stringify({ owner, repo, branch, token })); else localStorage.removeItem(GH);
    } catch (e) {}
    const btn = $('#ghPublish'); btn.disabled = true; $('#log').textContent = '';
    const api = (path) => `https://api.github.com/repos/${owner}/${repo}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;
    const H = { Authorization: 'Bearer ' + token, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
    try {
      const { files, out } = build();
      const imgFiles = files.filter((f) => f.img), dataFile = files.find((f) => f.path === 'data.js');
      log('শুরু হচ্ছে... মোট ছবি: ' + imgFiles.length);
      for (const f of imgFiles) {
        const ex = await fetch(api(f.path) + '?ref=' + encodeURIComponent(branch), { headers: H });
        if (ex.ok) { log('✓ আগে থেকেই আছে: ' + f.path); continue; }
        if (ex.status === 401 || ex.status === 403) throw new Error('টোকেন ঠিক নেই বা অনুমতি নেই (' + ex.status + ')');
        if (ex.status === 404) {
          const r = await fetch(api(f.path), { method: 'PUT', headers: H, body: JSON.stringify({ message: 'ছবি যোগ: ' + f.path, content: f.b64, branch }) });
          if (!r.ok) throw new Error('ছবি আপলোড ব্যর্থ: ' + f.path + ' (' + r.status + ')');
          log('⬆ আপলোড হয়েছে: ' + f.path);
        } else throw new Error('GitHub সাড়া দিচ্ছে না (' + ex.status + ') — ইউজারনেম/রিপোজিটরি/ব্রাঞ্চ যাচাই করুন');
      }
      let sha;
      const ex = await fetch(api('data.js') + '?ref=' + encodeURIComponent(branch), { headers: H });
      if (ex.ok) sha = (await ex.json()).sha;
      const body = { message: 'পণ্য তালিকা আপডেট', content: utf8B64(dataFile.text), branch };
      if (sha) body.sha = sha;
      const r = await fetch(api('data.js'), { method: 'PUT', headers: H, body: JSON.stringify(body) });
      if (!r.ok) throw new Error('data.js আপডেট ব্যর্থ (' + r.status + ')');
      log('✓ data.js আপডেট হয়েছে');
      state = out; save(); renderList();
      log('\n🎉 সফল! GitHub Pages-এ ১–২ মিনিটের মধ্যে ওয়েবসাইটে নতুন পণ্য দেখা যাবে।');
      toast('প্রকাশ সফল ✓');
    } catch (err) {
      log('❌ ' + err.message); toast('প্রকাশ হয়নি: ' + err.message);
    } finally { btn.disabled = false; }
  };

  $('#resetDraft').onclick = () => {
    if (!confirm('এই ব্রাউজারের সব অপ্রকাশিত পরিবর্তন মুছে যাবে। নিশ্চিত?')) return;
    try { localStorage.removeItem(DRAFT); } catch (e) {}
    location.reload();
  };

  /* ---------- শুরু ---------- */
  resetForm(); renderList(); renderCats();
})();
