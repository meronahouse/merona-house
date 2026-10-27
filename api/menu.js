const { redis, isAdmin, readBody, getMenu, normalizeKind } = require('./_lib');

const ICON = { cookies: '🍪', cake: '🎂', savory: '🥐' };

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      const raw = await redis('GET', 'menu');
      const menu = raw ? JSON.parse(raw) : [];

      if (req.query.full === '1') {
        if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
        return res.status(200).json({ menu: Array.isArray(menu) ? menu : [] });
      }

      return res.status(200).json((Array.isArray(menu) ? menu : []).map(({ c, ...pub }) => pub));
    }

    if (req.method === 'PUT') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
      const { menu } = readBody(req);

      if (!Array.isArray(menu) || menu.length > 60) {
        return res.status(400).json({ error: 'invalid' });
      }

      const out = menu.map((m) => {
        const t = ['cookies', 'cake', 'savory'].includes(normalizeKind(m.t)) ? normalizeKind(m.t) : 'savory';
        return {
          id: String(m.id || '').slice(0, 40),
          n: String(m.n || '').slice(0, 50),
          t,
          p: Math.max(0, Number(m.p) || 0),
          c: Math.max(0, Number(m.c) || 0),
          d: String(m.d || '').slice(0, 160),
          ing: (Array.isArray(m.ing) ? m.ing : []).slice(0, 20).map((s) => String(s).slice(0, 40)),
          img: String(m.img || '').startsWith('data:image/') ? m.img : '',
          pdf: String(m.pdf || '').startsWith('data:application/pdf') ? m.pdf : '',
          pn: String(m.pn || '').slice(0, 40),
          e: ICON[t],
          bg: 'bg-butter'
        };
      });

      const s = JSON.stringify(out);
      if (s.length > 900000) {
        return res.status(413).json({ error: 'terlalu besar, kecilkan foto' });
      }

      await redis('SET', 'menu', s);
      return res.status(200).json({ ok: true });
    }

    return res.status(405).end();
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
