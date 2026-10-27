const { redis, isAdmin, readBody, getMenu } = require('./_lib');

const clean = (s, n) => String(s || '').trim().slice(0, n);

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });

      const vals = (await redis('HVALS', 'orders')) || [];
      const orders = vals.map((v) => JSON.parse(v)).sort((a, b) => (b.ts || 0) - (a.ts || 0));
      return res.status(200).json({ orders });
    }

    if (req.method !== 'POST') return res.status(405).end();

    const b = readBody(req);

    if (b.action === 'order_public') {
      const o = b.order || {};
      const menu = await getMenu();
      const item = menu.find((x) => x.n === o.item || x.id === o.item);
      const qty = Math.max(1, Math.min(99, Math.floor(Number(o.qty || 1))));
      const mode = o.mode === 'Booking' ? 'Booking' : 'Sekarang';
      const due = /^\d{4}-\d{2}-\d{2}$/.test(o.due || '') ? o.due : '';

      if (!item || !clean(o.name, 60) || !clean(o.wa, 20) || !clean(o.addr, 200) || (mode === 'Booking' && !due)) {
        return res.status(400).json({ error: 'invalid' });
      }

      const id = 'W' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
      const order = {
        id,
        name: clean(o.name, 60),
        wa: clean(o.wa, 20),
        addr: clean(o.addr, 200),
        item: item.n,
        kind: item.t || 'savory',
        qty,
        price: Number(item.p || 0),
        cost: Number(item.c || 0),
        paid: 'Belum Lunas',
        ship: 'Diproses',
        date: new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10),
        mode,
        due: mode === 'Booking' ? due : '',
        note: clean(o.note, 120),
        ts: Date.now()
      };

      await redis('HSET', 'orders', id, JSON.stringify(order));
      return res.status(200).json({ ok: true });
    }

    if (b.action === 'toggle_status') {
      if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });
      const id = String(b.id || '');
      const kind = String(b.kind || '');
      const raw = await redis('HGET', 'orders', id);
      if (!raw) return res.status(404).json({ error: 'not found' });

      const order = JSON.parse(raw);
      if (kind === 'paid') {
        order.paid = order.paid === 'Lunas' ? 'Belum Lunas' : 'Lunas';
      }
      if (kind === 'ship') {
        const seq = ['Diproses', 'Dikirim', 'Selesai'];
        const i = seq.indexOf(order.ship || 'Diproses');
        order.ship = seq[(i + 1) % seq.length];
      }

      await redis('HSET', 'orders', id, JSON.stringify({ ...order, ts: order.ts || Date.now() }));
      return res.status(200).json({ ok: true });
    }

    if (!isAdmin(req)) return res.status(401).json({ error: 'unauthorized' });

    const o = b.order;
    if (!o || !o.id) return res.status(400).json({ error: 'invalid' });

    await redis('HSET', 'orders', String(o.id), JSON.stringify({ ...o, ts: o.ts || Date.now() }));
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server' });
  }
};
