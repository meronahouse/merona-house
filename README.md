# Merona House

Merona House adalah aplikasi toko kecil untuk mencatat pesanan, menu, dan status pengiriman dengan backend serverless di Vercel.

## Struktur proyek

- `/public/index.html` — halaman pembeli
- `/public/admin/index.html` — halaman admin
- `/api/_lib.js` — helper Redis dan autentikasi
- `/api/menu.js` — API menu
- `/api/orders.js` — API pesanan

## Cara deploy di Vercel

1. Upload project ke GitHub.
2. Buka Vercel dan import repo ini.
3. Tambahkan Upstash Redis dari Vercel Marketplace atau Storage.
4. Vercel akan mengisi variabel:
   - `KV_REST_API_URL`
   - `KV_REST_API_TOKEN`
5. Tambahkan environment variable manual:
   - `ADMIN_TOKEN` = password admin yang kamu buat
6. Deploy ulang project.

## Cara pakai

- Buka `/` untuk halaman pembeli.
- Buka `/admin` untuk halaman admin.
- Masukkan password admin sesuai `ADMIN_TOKEN`.
- Admin bisa menambah menu, melihat order, dan mengubah status pembayaran/pengiriman.

## Catatan penting

- Harga dan HPP ditentukan server, bukan dari browser.
- Pembeli hanya mendapat harga jual, bukan HPP.
- `ADMIN_TOKEN` harus sama persis dengan password yang dimasukkan admin di halaman login.
- Menu yang disimpan ke Redis akan dipakai oleh halaman pembeli dan admin.

## Tips

- Simpan foto dengan ukuran kecil supaya payload tidak terlalu besar.
- Gunakan menu dengan nama yang jelas agar order mudah dicari.
- Untuk produksi besar, pasang rate limit / firewall di Vercel.
