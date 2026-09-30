const PLATFORMS = [
  { id: 'redbus', name: 'redBus', color: '#d84e55' },
  { id: 'abhibus', name: 'AbhiBus', color: '#f36f21' },
  { id: 'makemytrip', name: 'MakeMyTrip', color: '#008cff' },
  { id: 'intrcity', name: 'IntrCity', color: '#6c3fc5' },
  { id: 'goibibo', name: 'Goibibo', color: '#ec5b24' },
  { id: 'cleartrip', name: 'Cleartrip', color: '#f77728' },
  { id: 'flixbus', name: 'FlixBus', color: '#5a9e00' },
  { id: 'easemytrip', name: 'EaseMyTrip', color: '#2196f3' },
  { id: 'paytm', name: 'Paytm', color: '#00a3d9' },
  { id: 'ixigo', name: 'ixigo', color: '#fc790d' },
];

const VISIBLE_OFFERS = 4;

const FILTERS = [
  { id: 'all', label: 'All buses', test: () => true },
  { id: 'ac', label: 'AC', test: (b) => b.ac },
  { id: 'nonac', label: 'Non-AC', test: (b) => !b.ac },
  { id: 'sleeper', label: 'Sleeper', test: (b) => b.sleeper },
  { id: 'seater', label: 'Seater', test: (b) => !b.sleeper },
];

const SORTS = {
  price: { label: 'Cheapest', fn: (a, b) => a.bestPrice - b.bestPrice },
  departure: { label: 'Earliest', fn: (a, b) => a.departureMin - b.departureMin },
  duration: { label: 'Fastest', fn: (a, b) => a.durationMin - b.durationMin },
  savings: { label: 'Biggest savings', fn: (a, b) => b.savings - a.savings },
  rating: { label: 'Top rated', fn: (a, b) => b.rating - a.rating },
};

const $ = (sel, root = document) => root.querySelector(sel);
const form = $('#search-form');
const results = $('#results');
const formError = $('#form-error');
const searchBtn = $('#search-btn');

// When the page is opened via Live Server or file://, the API still lives on the Node server.
const API_BASE = location.port === '3000' ? '' : 'http://localhost:3000';

const state = { data: null, filter: 'all', sort: 'price' };
let activeRequest = null;

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

const rupees = (n) => '₹' + Math.round(n).toLocaleString('en-IN');

function clock(min) {
  const m = ((min % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  return `${((h + 11) % 12) + 1}:${mm} ${suffix}`;
}

function duration(min) {
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  return [d && `${d}d`, h && `${h}h`, m && `${m}m`].filter(Boolean).join(' ') || '0m';
}

function prettyDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function todayIso() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

/* ---------- Form setup ---------- */

function renderPlatformPills() {
  $('#platform-pills').innerHTML = PLATFORMS.map((p) => `<span class="pill" style="--c:${p.color}">${esc(p.name)}</span>`).join('');
}

async function loadCities() {
  try {
    const res = await fetch(API_BASE + '/api/cities');
    const { cities } = await res.json();
    $('#city-list').innerHTML = cities.map((c) => `<option value="${esc(c)}"></option>`).join('');
  } catch {
    /* autocomplete is optional */
  }
}

function initForm() {
  const date = $('#date');
  date.min = todayIso();
  date.value = todayIso();

  $('#swap').addEventListener('click', () => {
    const from = $('#from');
    const to = $('#to');
    [from.value, to.value] = [to.value, from.value];
  });

  document.querySelectorAll('.stepper button').forEach((btn) =>
    btn.addEventListener('click', () => {
      const input = $('#seats');
      const next = Math.min(6, Math.max(1, Number(input.value || 1) + Number(btn.dataset.step)));
      input.value = next;
    })
  );

  document.querySelectorAll('[data-route]').forEach((btn) =>
    btn.addEventListener('click', () => {
      const [from, to] = btn.dataset.route.split('|');
      $('#from').value = from;
      $('#to').value = to;
      form.requestSubmit();
    })
  );

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = readForm();
    if (query) runSearch(query, true);
  });

  const params = new URLSearchParams(location.search);
  if (params.get('from') && params.get('to')) {
    $('#from').value = params.get('from');
    $('#to').value = params.get('to');
    if (params.get('date') && params.get('date') >= todayIso()) date.value = params.get('date');
    $('#time').value = params.get('time') || '';
    $('#seats').value = params.get('seats') || 1;
    runSearch(readForm(), false);
  }
}

function readForm() {
  form.querySelectorAll('.invalid').forEach((el) => el.classList.remove('invalid'));
  const q = {
    from: $('#from').value.trim(),
    to: $('#to').value.trim(),
    date: $('#date').value,
    time: $('#time').value,
    seats: Number($('#seats').value),
  };

  const fail = (id, msg) => {
    $('#' + id).classList.add('invalid');
    $('#' + id).focus();
    showError(msg);
    return null;
  };

  if (!q.from) return fail('from', 'Please enter a source city.');
  if (!q.to) return fail('to', 'Please enter a destination city.');
  if (q.from.toLowerCase() === q.to.toLowerCase()) return fail('to', 'Source and destination must be different.');
  if (!q.date || q.date < todayIso()) return fail('date', 'Please choose today or a future date.');
  if (!Number.isInteger(q.seats) || q.seats < 1 || q.seats > 6) return fail('seats', 'You can book 1 to 6 seats.');

  showError('');
  return q;
}

function showError(msg) {
  formError.textContent = msg;
  formError.hidden = !msg;
}

/* ---------- Search ---------- */

async function runSearch(query, pushHistory) {
  const params = new URLSearchParams({ from: query.from, to: query.to, date: query.date, seats: query.seats });
  if (query.time) params.set('time', query.time);
  if (pushHistory) history.pushState(null, '', '?' + params);

  activeRequest?.abort();
  const controller = new AbortController();
  activeRequest = controller;

  renderLoading(query);
  searchBtn.disabled = true;

  try {
    const res = await fetch(API_BASE + '/api/search?' + params, { signal: controller.signal }).catch((err) => {
      if (err.name === 'AbortError') throw err;
      throw new Error('Cannot reach the search server. Open a terminal in the project folder, run "npm start", then try again.');
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Search failed.');
    state.data = data;
    state.filter = 'all';
    state.sort = 'price';
    renderResults();
  } catch (err) {
    if (err.name === 'AbortError') return;
    results.innerHTML = `<div class="message"><h3>Couldn't complete the search</h3><p>${esc(err.message)}</p></div>`;
  } finally {
    if (activeRequest === controller) {
      searchBtn.disabled = false;
      activeRequest = null;
    }
  }
}

/* ---------- Rendering ---------- */

function cutoffActive(q) {
  return q.bookingCutoffMin != null && (!q.time || q.bookingCutoffMin > q.departAfterMin - 1);
}

function headerHtml(q, subtitle) {
  const time = q.time ? ` · after ${clock(Number(q.time.slice(0, 2)) * 60 + Number(q.time.slice(3)))}` : '';
  const cutoff =
    cutoffActive(q) && q.bookingCutoffMin < 1440
      ? `<p class="cutoff-note">Booking closes ${q.minBookingLeadMin} min before departure, so only buses leaving after ${clock(q.bookingCutoffMin)} today are shown.</p>`
      : '';
  return `
    <div class="results-head">
      <div>
        <h2>${esc(q.from)} → ${esc(q.to)}</h2>
        <p>${prettyDate(q.date)}${time} · ${q.seats} seat${q.seats > 1 ? 's' : ''}${subtitle ? ' · ' + subtitle : ''}</p>
        ${cutoff}
      </div>
    </div>`;
}

function renderLoading(query) {
  results.innerHTML = `
    ${headerHtml(query, `searching ${PLATFORMS.length} platforms…`)}
    <div class="providers">
      ${PLATFORMS.map(
        (p) => `
        <div class="provider-status" style="--c:${p.color}">
          <div class="name">${p.name} <span class="dot loading"></span></div>
          <div class="meta">Checking fares…</div>
        </div>`
      ).join('')}
    </div>
    <div class="bus-list">${'<div class="skeleton"></div>'.repeat(3)}</div>`;
}

function emptyMessageHtml(q) {
  if (cutoffActive(q)) {
    return `
      <h3>No more buses can be booked today</h3>
      <p>All buses on this route for today have departed or leave within ${q.minBookingLeadMin} minutes. Tickets must be booked at least ${q.minBookingLeadMin} minutes before departure. Try tomorrow's date.</p>`;
  }
  return `
    <h3>No buses match your search</h3>
    <p>Try an earlier departure time, fewer seats, or a different date.</p>`;
}

function renderResults() {
  const { query, providers, buses, tookMs } = state.data;

  const providersHtml = providers
    .map(
      (p) => `
      <div class="provider-status" style="--c:${p.color}">
        <div class="name">${esc(p.name)} <span class="dot ${p.status === 'ok' ? '' : 'error'}" title="${esc(p.error || 'OK')}"></span></div>
        <div class="meta">${
          p.status === 'ok'
            ? `${p.resultCount} buses · best on ${p.bestDeals} · ${(p.ms / 1000).toFixed(1)}s`
            : 'Unavailable right now'
        }</div>
      </div>`
    )
    .join('');

  if (!buses.length) {
    results.innerHTML = `
      ${headerHtml(query, `searched in ${(tookMs / 1000).toFixed(1)}s`)}
      <div class="providers">${providersHtml}</div>
      <div class="message">${emptyMessageHtml(query)}</div>`;
    return;
  }

  results.innerHTML = `
    ${headerHtml(query, `${buses.length} buses compared across ${providers.length} platforms in ${(tookMs / 1000).toFixed(1)}s`)}
    <div class="providers">${providersHtml}</div>
    ${summaryHtml(buses, providers, query.seats)}
    <div class="toolbar">
      <div class="chips" role="group" aria-label="Filter buses">
        ${FILTERS.map((f) => `<button type="button" class="chip" data-filter="${f.id}" aria-pressed="${state.filter === f.id}">${f.label}</button>`).join('')}
      </div>
      <div class="sorts" role="group" aria-label="Sort buses">
        <label>Sort:</label>
        ${Object.entries(SORTS).map(([id, s]) => `<button type="button" class="chip" data-sort="${id}" aria-pressed="${state.sort === id}">${s.label}</button>`).join('')}
      </div>
    </div>
    <div class="bus-list" id="bus-list"></div>`;

  results.querySelectorAll('[data-filter]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.filter = btn.dataset.filter;
      updateToolbar();
      renderBusList();
    })
  );
  results.querySelectorAll('[data-sort]').forEach((btn) =>
    btn.addEventListener('click', () => {
      state.sort = btn.dataset.sort;
      updateToolbar();
      renderBusList();
    })
  );

  renderBusList();
}

function updateToolbar() {
  results.querySelectorAll('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.filter === state.filter));
  results.querySelectorAll('[data-sort]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.sort === state.sort));
}

function summaryHtml(buses, providers, seats) {
  const cheapest = buses.reduce((a, b) => (b.bestPrice < a.bestPrice ? b : a));
  const cheapestOffer = cheapest.offers[0];
  const topPlatform = [...providers].sort((a, b) => b.bestDeals - a.bestDeals)[0];
  const biggest = buses.reduce((a, b) => (b.savings > a.savings ? b : a));

  return `
    <div class="summary">
      <div class="stat highlight">
        <div class="label">Cheapest ticket</div>
        <div class="value">${rupees(cheapest.bestPrice)} <small style="font-size:14px;font-weight:600">/ seat</small></div>
        <div class="hint">${esc(cheapest.operator)} on ${esc(cheapestOffer.providerName)} · ${rupees(cheapestOffer.totalPrice)} for ${seats}</div>
      </div>
      <div class="stat">
        <div class="label">Best platform today</div>
        <div class="value" style="color:${topPlatform.color}">${esc(topPlatform.name)}</div>
        <div class="hint">Cheapest for ${topPlatform.bestDeals} of ${buses.length} buses</div>
      </div>
      <div class="stat">
        <div class="label">Max you can save</div>
        <div class="value" style="color:var(--good)">${rupees(biggest.savings * seats)}</div>
        <div class="hint">On ${esc(biggest.operator)} by choosing ${esc(biggest.offers[0].providerName)}</div>
      </div>
    </div>`;
}

function renderBusList() {
  const list = $('#bus-list');
  const filter = FILTERS.find((f) => f.id === state.filter);
  const buses = state.data.buses.filter(filter.test).sort(SORTS[state.sort].fn);

  if (!buses.length) {
    list.innerHTML = `<div class="message"><h3>No ${esc(filter.label)} buses</h3><p>Try another filter.</p></div>`;
    return;
  }

  list.innerHTML = buses.map((bus) => busHtml(bus, state.data.query.seats)).join('');
}

function offerHtml(o, isBest, seats) {
  return `
    <div class="offer ${isBest ? 'best' : ''}" style="--c:${o.color}">
      <div class="pname">${esc(o.providerName)} ${isBest ? '<span class="best-badge">Best price</span>' : ''}</div>
      <div>
        ${o.discount ? `<span class="strike">${rupees(o.basePrice)}</span>` : ''}
        <span class="final">${rupees(o.finalPrice)}</span>
        ${seats > 1 ? `<div class="seats-left">${rupees(o.totalPrice)} for ${seats}</div>` : ''}
      </div>
      <div>${o.discount ? `${rupees(o.discount)} off · <span class="code">${esc(o.offerCode)}</span>` : '<span class="no-offer">No offer</span>'}</div>
      <div class="seats-left ${o.seatsAvailable <= 5 ? 'low' : ''}">${o.seatsAvailable} seats left</div>
      <a class="btn-book" href="${esc(o.bookingUrl)}" target="_blank" rel="noopener noreferrer">Book on ${esc(o.providerName)}</a>
    </div>`;
}

function busHtml(bus, seats) {
  const arrival = bus.departureMin + bus.durationMin;
  const daysLater = Math.floor(arrival / 1440);
  const best = bus.offers[0];
  const listed = new Set(bus.offers.map((o) => o.providerId));
  const missing = PLATFORMS.filter((p) => !listed.has(p.id));
  const hasBest = bus.offers.length > 1;

  const visible = bus.offers.slice(0, VISIBLE_OFFERS).map((o, i) => offerHtml(o, hasBest && i === 0, seats)).join('');
  const hidden = bus.offers.slice(VISIBLE_OFFERS);
  const moreHtml = hidden.length
    ? `<details class="more-offers">
        <summary>Show ${hidden.length} more platform${hidden.length > 1 ? 's' : ''}</summary>
        ${hidden.map((o) => offerHtml(o, false, seats)).join('')}
      </details>`
    : '';

  const missingHtml = missing.length
    ? `<div class="offer" style="--c:#9ca3af"><div class="no-offer" style="grid-column:1/-1">Not available on ${missing.map((p) => esc(p.name)).join(', ')}</div></div>`
    : '';

  return `
    <article class="bus">
      <div class="bus-main">
        <div>
          <div class="operator">${esc(bus.operator)}</div>
          <div class="bus-type">${esc(bus.busType)}</div>
          <div class="tags">
            <span class="rating ${bus.rating < 4 ? 'mid' : ''}">★ ${bus.rating.toFixed(1)}</span>
            ${bus.amenities.slice(0, 4).map((a) => `<span class="tag">${esc(a)}</span>`).join('')}
          </div>
        </div>
        <div class="timeline">
          <div><div class="t">${clock(bus.departureMin)}</div><div class="c">Departure</div></div>
          <div class="line">${duration(bus.durationMin)}</div>
          <div>
            <div class="t">${clock(arrival)} ${daysLater ? `<span class="next-day">+${daysLater}d</span>` : ''}</div>
            <div class="c">Arrival</div>
          </div>
        </div>
        <div class="best-box">
          <div class="from">Lowest on ${esc(best.providerName)} · ${bus.offers.length} platform${bus.offers.length > 1 ? 's' : ''}</div>
          <div class="price">${rupees(best.finalPrice)}</div>
          ${bus.savings > 0 ? `<span class="save">Save ${rupees(bus.savings * seats)} vs highest</span>` : ''}
        </div>
      </div>
      <div class="offers">${visible}${moreHtml}${missingHtml}</div>
    </article>`;
}

window.addEventListener('popstate', () => location.reload());

renderPlatformPills();
loadCities();
initForm();
