(function () {
  const D = window.SHOP_DATA || { settings: {}, categories: [], products: [] };
  const S = D.settings || {};
  const cur = S.currency || '৳';
  const products = (D.products || []).slice().reverse(); // নতুন আগে
  const $ = (s) => document.querySelector(s);
  const bn = (n) => Number(n).toLocaleString('bn-BD');
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => cur + bn(n);

  /* ---------- দোকানের তথ্য ---------- */
  const name = S.shopName || 'রুফাইদা অনলাইন শপ';
  document.title = name + ' — ১ থেকে ৮ বছরের বাচ্চাদের পোশাক';
  document.querySelectorAll('[data-shop-name]').forEach((e) => (e.textContent = name));
  document.querySelectorAll('[data-tagline]').forEach((e) => (e.textContent = S.tagline || ''));
  document.querySelectorAll('[data-address]').forEach((e) => (e.textContent = S.address || ''));
  document.querySelectorAll('[data-delivery]').forEach((e) => { if (S.deliveryNote) e.textContent = S.deliveryNote; });
  $('#yr').textContent = bn(new Date().getFullYear()).replace(/,/g, '');

  const wa = (S.whatsapp || '').replace(/\D/g, '');
  const waBase = wa.length >= 10 ? 'https://wa.me/' + wa : 'https://wa.me/';
  $('#fab').href = waBase + '?text=' + encodeURIComponent('আসসালামু আলাইকুম, আমি ' + name + ' থেকে পোশাক সম্পর্কে জানতে চাই।');
  let contacts = '';
  if (S.phone) contacts += `<a href="tel:${esc(S.phone)}">📞 ${esc(S.phone)}</a>`;
  if (wa.length >= 10) contacts += `<a href="${waBase}" target="_blank" rel="noopener">💬 হোয়াটসঅ্যাপ</a>`;
  if (S.facebook) contacts += `<a href="${esc(S.facebook)}" target="_blank" rel="noopener">👍 ফেসবুক পেজ</a>`;
  $('#contacts').innerHTML = contacts || '<p>যোগাযোগের তথ্য শীঘ্রই যোগ হবে</p>';

  const items = ['নরম সুতির কাপড়', 'সারা বাংলাদেশে ডেলিভারি', '১ – ৮ বছরের পোশাক', 'হোয়াটসঅ্যাপে সহজ অর্ডার', 'ঈদ ও অনুষ্ঠানের কালেকশন'];
  const strip = items.map((t) => `<span>⭐ ${t}</span>`).join('');
  $('#marquee').innerHTML = strip + strip + strip + strip;

  /* ---------- সাহায্যকারী ---------- */
  const EMOJI = { 'ফ্রক': '👗', 'মেয়েদের পোশাক': '👚', 'ছেলেদের পোশাক': '👕', 'শীতের পোশাক': '🧥', 'ঈদ কালেকশন': '🎉', 'সেট / কম্বো': '🎁' };
  const COLORS = ['#FFD1DC', '#FFE9A8', '#BFEFE8', '#CFE6FF', '#E2D6FF'];
  function placeholder(p) {
    const em = EMOJI[p.category] || '🧸';
    const bg = COLORS[(p.name || '').length % COLORS.length];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><rect width="400" height="500" fill="${bg}"/><text x="200" y="290" font-size="150" text-anchor="middle">${em}</text></svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  const imgs = (p) => (p.images && p.images.length ? p.images : [placeholder(p)]);
  function ageText(ages) {
    const a = (ages || []).slice().sort((x, y) => x - y);
    if (!a.length) return 'সব বয়স';
    const consecutive = a.every((v, i) => i === 0 || v === a[i - 1] + 1);
    if (a.length === 1) return bn(a[0]) + ' বছর';
    if (consecutive) return bn(a[0]) + '–' + bn(a[a.length - 1]) + ' বছর';
    return a.map(bn).join(', ') + ' বছর';
  }
  const discount = (p) => (p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0);

  /* ---------- ফিল্টার ---------- */
  const st = { age: 0, cat: 'সব', q: '', sort: 'new' };

  function renderAges() {
    let h = `<button class="age all ${st.age === 0 ? 'on' : ''}" data-age="0">সব বয়স</button>`;
    for (let i = 1; i <= 8; i++) h += `<button class="age ${st.age === i ? 'on' : ''}" data-age="${i}">${bn(i)}<small>বছর</small></button>`;
    $('#ages').innerHTML = h;
  }
  function renderCats() {
    const cats = ['সব'].concat(D.categories || []);
    $('#cats').innerHTML = cats.map((c) => `<button class="chip ${st.cat === c ? 'on' : ''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
  }
  function list() {
    let r = products.filter((p) => {
      if (st.age && !(p.ages || []).includes(st.age)) return false;
      if (st.cat !== 'সব' && p.category !== st.cat) return false;
      if (st.q) {
        const hay = (p.name + ' ' + (p.description || '') + ' ' + (p.category || '')).toLowerCase();
        if (!hay.includes(st.q.toLowerCase())) return false;
      }
      return true;
    });
    if (st.sort === 'low') r.sort((a, b) => a.price - b.price);
    if (st.sort === 'high') r.sort((a, b) => b.price - a.price);
    return r;
  }
  function renderGrid() {
    const r = list();
    $('#empty').hidden = r.length > 0;
    $('#grid').innerHTML = r.map((p) => {
      const d = discount(p);
      return `<button class="card" data-id="${esc(p.id)}">
        <div class="ph"><img loading="lazy" src="${esc(imgs(p)[0])}" alt="${esc(p.name)}">
          ${p.isNew ? '<span class="tag new">নতুন</span>' : ''}
          ${d ? `<span class="tag off">${bn(d)}% ছাড়</span>` : ''}
          ${p.inStock === false ? '<span class="tag out">স্টক শেষ</span>' : ''}
        </div>
        <div class="info"><h3>${esc(p.name)}</h3>
          <div class="meta">${esc(p.category || '')} • ${ageText(p.ages)}</div>
          <div class="price">${money(p.price)}${d ? `<s>${money(p.oldPrice)}</s>` : ''}</div>
        </div></button>`;
    }).join('');
  }

  $('#ages').addEventListener('click', (e) => {
    const b = e.target.closest('[data-age]'); if (!b) return;
    st.age = +b.dataset.age; renderAges(); renderGrid();
  });
  $('#cats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]'); if (!b) return;
    st.cat = b.dataset.cat; renderCats(); renderGrid();
  });
  $('#q').addEventListener('input', (e) => { st.q = e.target.value.trim(); renderGrid(); });
  $('#sort').addEventListener('change', (e) => { st.sort = e.target.value; renderGrid(); });
  $('#grid').addEventListener('click', (e) => {
    const c = e.target.closest('[data-id]'); if (c) openModal(c.dataset.id);
  });

  /* ---------- বিস্তারিত পপআপ ---------- */
  const modal = $('#modal'), sheet = $('#sheet');
  function openModal(id) {
    const p = products.find((x) => x.id === id); if (!p) return;
    const images = imgs(p);
    const ages = (p.ages && p.ages.length ? p.ages : [1, 2, 3, 4, 5, 6, 7, 8]);
    let selAge = ages[0], qty = 1;
    const d = discount(p);
    sheet.innerHTML = `<button class="x" aria-label="বন্ধ করুন">✕</button>
      <div class="gal"><div class="main"><img id="mainImg" src="${esc(images[0])}" alt="${esc(p.name)}"></div>
        ${images.length > 1 ? `<div class="thumbs">${images.map((s, i) => `<img src="${esc(s)}" data-i="${i}" class="${i === 0 ? 'on' : ''}" alt="">`).join('')}</div>` : ''}</div>
      <div class="det">
        <h2>${esc(p.name)}</h2>
        <div class="price">${money(p.price)}${d ? `<s>${money(p.oldPrice)}</s>` : ''}</div>
        ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
        ${p.colors ? `<p><b>রং:</b> ${esc(p.colors)}</p>` : ''}
        <label>বয়স বেছে নিন</label>
        <div class="opts" id="ageOpts">${ages.map((a) => `<button class="opt ${a === selAge ? 'on' : ''}" data-a="${a}">${bn(a)} বছর</button>`).join('')}</div>
        <label>পরিমাণ</label>
        <div class="qty"><button id="qm">−</button><span id="qn">${bn(1)}</span><button id="qp">+</button></div>
        <div class="act">
          <a class="btn green ${p.inStock === false ? '' : ''}" id="order" target="_blank" rel="noopener" ${p.inStock === false ? 'disabled' : ''}>💬 হোয়াটসঅ্যাপে অর্ডার করুন</a>
          ${S.phone ? `<a class="btn alt" href="tel:${esc(S.phone)}">📞 কল করুন</a>` : ''}
        </div>
        ${p.inStock === false ? '<p class="note">😢 এই পোশাকটি এখন স্টকে নেই।</p>' : ''}
        <p class="note">${esc(S.deliveryNote || '')}</p>
      </div>`;
    const link = () => {
      const msg = `আসসালামু আলাইকুম, আমি ${name} থেকে অর্ডার করতে চাই:\n\nপণ্য: ${p.name}\nবয়স: ${bn(selAge)} বছর\nপরিমাণ: ${bn(qty)}টি\nদাম: ${money(p.price * qty)}`;
      $('#order').href = waBase + '?text=' + encodeURIComponent(msg);
    };
    link();
    sheet.querySelector('.x').onclick = closeModal;
    sheet.querySelectorAll('.thumbs img').forEach((t) => (t.onclick = () => {
      $('#mainImg').src = images[+t.dataset.i];
      sheet.querySelectorAll('.thumbs img').forEach((o) => o.classList.remove('on'));
      t.classList.add('on');
    }));
    $('#ageOpts').onclick = (e) => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      selAge = +b.dataset.a;
      sheet.querySelectorAll('.opt').forEach((o) => o.classList.toggle('on', o === b));
      link();
    };
    $('#qm').onclick = () => { qty = Math.max(1, qty - 1); $('#qn').textContent = bn(qty); link(); };
    $('#qp').onclick = () => { qty = Math.min(20, qty + 1); $('#qn').textContent = bn(qty); link(); };
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }
  function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  renderAges(); renderCats(); renderGrid();
})();
