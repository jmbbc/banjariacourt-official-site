# Banjaria Court — Laman Rasmi (GitHub Pages)

Laman web rasmi Banjaria Court dibina sebagai laman statik (HTML/CSS/JS) dan diterbitkan melalui GitHub Pages dari folder `docs/`.

## Struktur
- `docs/` — Semua fail laman web
  - `index.html` — Laman utama
  - `announcements.html` — Notis terkini
  - `reports.html` — Laporan AGM/EGM
  - `activities.html` — Aktiviti komuniti
  - `facilities.html` — Senarai kemudahan
  - `vendors.html` — Senarai vendor
  - `quotes.html` — Senarai sebut harga (RFQ/RFP)
  - `forms.html` — Borang & muat turun
  - `contact.html` — Hubungi kami
  - `assets/` — CSS, JS, imej
  - `data/` — Fail JSON untuk kandungan

## Cara Kemaskini Kandungan
Edit fail di `docs/data/*.json` untuk menukar senarai notis, laporan, aktiviti, kemudahan, vendor, sebut harga dan borang.

Contoh (announcements):
```json
[
  {
    "title": "Penutupan Kolam Renang (Penyelenggaraan)",
    "date": "2025-12-10",
    "summary": "Kolam renang ditutup untuk kerja penyelenggaraan.",
    "link": "#"
  }
]
```

## Terbit di GitHub Pages
1. Buat repo GitHub: `banjariacourt-official-site`.
2. Push kod:
```powershell
cd "c:\Users\Azlan\Documents\banjariacourt-official-site"
git init
git remote add origin https://github.com/jmbbc/banjariacourt-official-site.git
git add .
git commit -m "Initial official site (Malay)"
git branch -M main
git push -u origin main
```
3. Di GitHub: Settings → Pages → Source: "Deploy from a branch"; Branch: `main`; Folder: `/docs`.

## Lesen & Hak Cipta
Hak cipta © Banjaria Court. Kandungan dokumen (PDF/imej) adalah milik Banjaria Court/JMB.

## Perubahan Terkini (Ringkas)
- 2025-12-27: Pembaikan mesra mudah alih — ditambah beberapa `@media` rules untuk padding dan tipografi, `nav` versi mudah alih ditambah overlay dan penguncian scroll badan, serta thumbnail imej kini menggunakan `loading="lazy"` untuk prestasi lebih baik.
- 2025-12-27: Tambah demo hero full-screen (Daylight-style) dan seksyen `Shortcuts` yang kini dirender secara dinamik dari `docs/data/shortcuts.json`. Juga tambah ikon SVG untuk setiap shortcut dan perbaiki gaya kad (hover, fokus, responsif).

(See `docs/assets/css/style.css`, `docs/assets/css/f-layout.css`, `docs/assets/js/main.js`, `docs/data/shortcuts.json`).
