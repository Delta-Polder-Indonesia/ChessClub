# Peta folder halaman

Struktur halaman mengikuti kelompok menu utama. Keanggotaan **hanya** menjadi tab di dalam halaman Struktur Grup Catur, bukan halaman menu atau halaman publik terpisah. Pendaftaran anggota adalah halaman aksi tersendiri yang hanya dibuka melalui tombol **Daftar Anggota**.

```text
src/halaman/
│
├── BACA-DULU.md
│
├── TentangKami/                              ← menu utama: Tentang Kami
│   ├── TentangKami.jsx                        ← halaman utama Tentang Kami
│   └── StrukturGrupCatur/                     ← satu halaman bertab
│       ├── StrukturGrupCatur.jsx              ← induk tab
│       ├── Pengurus.jsx                       ← tab Pengurus
│       ├── StrukturOrganisasiCatur.jsx        ← tab Struktur Organisasi Catur
│       └── Keanggotaan/                       ← tab Keanggotaan, hanya dipanggil induk
│           ├── Keanggotaan.jsx
│           ├── TingkatanRating.jsx
│           └── DaftarAnggota.jsx
│
├── PendaftaranAnggota/                        ← halaman aksi tombol Daftar Anggota
│   └── PendaftaranAnggota.jsx
│
├── ProgramKami/                               ← menu utama: Program Kami
│   ├── ProgramKami.jsx
│   ├── KelasDanPelatihan.jsx
│   ├── CoachingClinic.jsx
│   ├── SimultanDanBlindfold.jsx
│   ├── SekolahCatur.jsx
│   └── CaraBermainCatur.jsx
│
├── Turnamen/                                  ← menu utama: Turnamen
│   ├── Turnamen.jsx
│   ├── TurnamenBulanan.jsx
│   ├── LigaMusiman.jsx
│   ├── TurnamenTerbuka.jsx
│   └── LigaAntarKomunitas.jsx
│
├── MediaDanInformasi/                         ← menu utama: Media & Informasi
│   ├── MediaDanInformasi.jsx
│   ├── BeritaKomunitas.jsx
│   ├── Pengumuman.jsx
│   ├── Galeri.jsx
│   └── BuletinBulanan.jsx
│
├── Keberlanjutan/                             ← menu utama: Keberlanjutan
│   ├── Keberlanjutan.jsx
│   ├── SyaratDanKetentuan.jsx
│   ├── KodeEtikKomunitas.jsx
│   └── PertanyaanUmum.jsx
│
├── Pengadaan/                                 ← menu atas: Pengadaan
│   └── Pengadaan.jsx
│
├── Karir/                                     ← menu atas: Karir
│   └── Karir.jsx
│
├── HubungiKami/                               ← menu atas: Hubungi Kami
│   └── HubungiKami.jsx
│
├── Pengurus/                                  ← area internal, bukan menu publik
│   ├── Dashboard.jsx
│   ├── PanelTurnamen.jsx
│   └── ui.jsx
│
└── TidakDitemukan.jsx                         ← halaman fallback 404
```

## Alamat halaman utama

| Fitur | Folder | Alamat kanonik |
| --- | --- | --- |
| Tentang Kami | `TentangKami/TentangKami.jsx` | `/tentang-kami` |
| Struktur Grup Catur | `TentangKami/StrukturGrupCatur/` | `/tentang-kami/struktur-grup-catur` |
| Tab Keanggotaan | `TentangKami/StrukturGrupCatur/Keanggotaan/` | `/tentang-kami/struktur-grup-catur#keanggotaan` |
| Pendaftaran Anggota | `PendaftaranAnggota/PendaftaranAnggota.jsx` | `/pendaftaran-anggota` |
| Keberlanjutan | `Keberlanjutan/Keberlanjutan.jsx` | `/keberlanjutan` |
| Syarat & Ketentuan | `Keberlanjutan/SyaratDanKetentuan.jsx` | `/keberlanjutan/syarat-dan-ketentuan` |
| Kode Etik | `Keberlanjutan/KodeEtikKomunitas.jsx` | `/keberlanjutan/kode-etik-komunitas` |
| Pertanyaan Umum | `Keberlanjutan/PertanyaanUmum.jsx` | `/keberlanjutan/pertanyaan-umum` |
| Pengadaan | `Pengadaan/Pengadaan.jsx` | `/pengadaan` |
| Karir | `Karir/Karir.jsx` | `/karir` |
| Hubungi Kami | `HubungiKami/HubungiKami.jsx` | `/hubungi-kami` |

Keanggotaan tidak memiliki halaman induk tersendiri. Route lama `/keanggotaan` dan `/tentang-kami/keanggotaan` diarahkan otomatis ke tab Keanggotaan di Struktur Grup Catur. Route lama pendaftaran diarahkan ke `/pendaftaran-anggota`.

Daftar menu dan pemetaan folder berada di `src/menu.js`. Routing berada di `src/App.jsx`.
