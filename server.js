const http = require('http');
const fs = require('fs');
const path = require('path');
const { CITIES } = require('./providers/cities');
const { searchAll } = require('./providers');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const MAX_DAYS_AHEAD = 120;
const MIN_BOOKING_LEAD_MIN = 30;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

function sendJson(res, status, body) {
  res.writeHead(status, {
    'Content-Type': MIME['.json'],
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(body));
}

function localDateString(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function parseSearch(params) {
  const from = (params.get('from') || '').trim();
  const to = (params.get('to') || '').trim();
  const date = (params.get('date') || '').trim();
  const time = (params.get('time') || '').trim();
  const seats = Number(params.get('seats') || 1);

  if (!from || !to) return { error: 'Please enter both source and destination.' };
  if (from.length > 60 || to.length > 60) return { error: 'City names are too long.' };
  if (from.toLowerCase() === to.toLowerCase()) return { error: 'Source and destination must be different.' };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: 'Please choose a valid travel date.' };
  const now = new Date();
  const today = localDateString(now);
  if (date < today) return { error: 'Travel date cannot be in the past.' };
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + MAX_DAYS_AHEAD);
  if (date > localDateString(maxDate)) return { error: `You can search up to ${MAX_DAYS_AHEAD} days ahead.` };

  let departAfterMin = null;
  if (time) {
    const m = /^(\d{2}):(\d{2})$/.exec(time);
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return { error: 'Please choose a valid time.' };
    departAfterMin = Number(m[1]) * 60 + Number(m[2]);
  }

  let bookingCutoffMin = null;
  if (date === today) {
    bookingCutoffMin = now.getHours() * 60 + now.getMinutes() + MIN_BOOKING_LEAD_MIN;
    departAfterMin = Math.max(departAfterMin ?? 0, bookingCutoffMin);
  }

  if (!Number.isInteger(seats) || seats < 1 || seats > 6) return { error: 'Seats must be between 1 and 6.' };

  return {
    query: {
      from,
      to,
      date,
      time: time || null,
      departAfterMin,
      bookingCutoffMin,
      minBookingLeadMin: MIN_BOOKING_LEAD_MIN,
      seats,
    },
  };
}

async function handleApi(req, res, url) {
  if (url.pathname === '/api/cities') {
    return sendJson(res, 200, { cities: CITIES.map((c) => c.name).sort() });
  }

  if (url.pathname === '/api/search') {
    const parsed = parseSearch(url.searchParams);
    if (parsed.error) return sendJson(res, 400, { error: parsed.error });
    const started = Date.now();
    const result = await searchAll(parsed.query);
    return sendJson(res, 200, { query: parsed.query, tookMs: Date.now() - started, ...result });
  }

  return sendJson(res, 404, { error: 'Not found' });
}

function serveStatic(req, res, url) {
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === '/') pathname = '/index.html';
  const filePath = path.normalize(path.join(PUBLIC_DIR, pathname));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  try {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      });
      return res.end();
    }
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405);
      return res.end('Method not allowed');
    }
    serveStatic(req, res, url);
  } catch (err) {
    console.error(err);
    sendJson(res, 500, { error: 'Something went wrong. Please try again.' });
  }
});

server.listen(PORT, () => {
  console.log(`Bus fare comparison running at http://localhost:${PORT}`);
});
