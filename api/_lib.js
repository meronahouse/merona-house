const URL_ = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const TOKEN_ = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(...cmd) {
  if (!URL_ || !TOKEN_) {
    throw new Error('Redis not configured');
  }

  const res = await fetch(URL_, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${TOKEN_}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(cmd)
  });

  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.result;
}

const isAdmin = (req) => {
  const auth = (req.headers.authorization || '').trim();
  const expected = `Bearer ${process.env.ADMIN_TOKEN || ''}`;
  return !!process.env.ADMIN_TOKEN && auth === expected;
};

const readBody = (req) => {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body || '{}');
    } catch (e) {
      return {};
    }
  }
  return req.body || {};
};

const normalizeKind = (value) => {
  const k = String(value || 'savory').trim().toLowerCase();
  return ['cookies', 'cake', 'savory'].includes(k) ? k : 'savory';
};

const DEFAULT_MENU = [
  { id: 'm1', n: 'Choco Chip Cookies', t: 'cookies', p: 35000, c: 18000, d: '', ing: [], img: '', pdf: '', pn: '' },
  { id: 'm2', n: 'Butter Cookies', t: 'cookies', p: 30000, c: 15000, d: '', ing: [], img: '', pdf: '', pn: '' },
  { id: 'm3', n: 'Nastar', t: 'cookies', p: 55000, c: 30000, d: '', ing: [], img: '', pdf: '', pn: '' },
  { id: 'm4', n: 'Risoles Ragout', t: 'savory', p: 25000, c: 13000, d: '', ing: [], img: '', pdf: '', pn: '' },
  { id: 'm5', n: 'Pastel Isi Ayam', t: 'savory', p: 22000, c: 11000, d: '', ing: [], img: '', pdf: '', pn: '' },
  { id: 'm6', n: 'Sosis Solo', t: 'savory', p: 28000, c: 15000, d: '', ing: [], img: '', pdf: '', pn: '' }
];

async function getMenu() {
  try {
    const raw = await redis('GET', 'menu');
    if (!raw) return DEFAULT_MENU;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map((m) => ({ ...m, t: normalizeKind(m.t) })) : DEFAULT_MENU;
  } catch (e) {
    return DEFAULT_MENU;
  }
}

module.exports = { redis, isAdmin, readBody, getMenu, normalizeKind };
