# Peta folder halaman

Setiap tab menu punya folder / file sendiri. Nama folder = kelompok menu. Nama file = nama tab.

```
src/halaman/
│
├── BACA-DULU.md                  ← file ini
│
├── TentangKami/                  ← tab "Tentang Kami" (sudah ada isinya)
│   └── TentangKami.jsx
│
├── ProgramKami/                  ← tab "Program Kami"
│   ├── ProgramKami.jsx           ← halaman induk
│   ├── KelasDanPelatihan.jsx     ← Kelas & Pelatihan
│   ├── CoachingClinic.jsx        ← Coaching Clinic
│   ├── SimultanDanBlindfold.jsx  ← Simultan & Blindfold
│   └── SekolahCatur.jsx          ← Sekolah Catur
│
├── Turnamen/                     ← tab "Turnamen"
│   ├── Turnamen.jsx
│   ├── TurnamenBulanan.jsx
│   ├── LigaMusiman.jsx
│   ├── TurnamenTerbuka.jsx
│   └── LigaAntarKomunitas.jsx
│
├── MediaDanInformasi/            ← tab "Media & Informasi"
│   ├── MediaDanInformasi.jsx
│   ├── BeritaKomunitas.jsx
│   ├── Pengumuman.jsx
│   ├── Galeri.jsx
│   └── BuletinBulanan.jsx
│
├── Keanggotaan/                  ← tab "Keanggotaan"
│   ├── Keanggotaan.jsx
│   ├── PendaftaranAnggota.jsx
│   ├── SyaratDanKetentuan.jsx
│   ├── KodeEtikKomunitas.jsx
│   └── PertanyaanUmum.jsx
│
└── HubungiKami/                  ← tautan "Hubungi Kami" di menu atas
    └── HubungiKami.jsx
```

Alamat browser (contoh):

| Tab menu              | File                              | Alamat                                      |
| --------------------- | --------------------------------- | ------------------------------------------- |
| Tentang Kami          | `TentangKami/TentangKami.jsx`     | `/` atau `/tentang-kami`                    |
| Kelas & Pelatihan     | `ProgramKami/KelasDanPelatihan.jsx` | `/program-kami/kelas-dan-pelatihan`       |
| Turnamen Bulanan      | `Turnamen/TurnamenBulanan.jsx`    | `/turnamen/turnamen-bulanan`                |
| Galeri                | `MediaDanInformasi/Galeri.jsx`    | `/media-dan-informasi/galeri`               |
| Pendaftaran Anggota   | `Keanggotaan/PendaftaranAnggota.jsx` | `/keanggotaan/pendaftaran-anggota`       |
| Hubungi Kami          | `HubungiKami/HubungiKami.jsx`     | `/hubungi-kami`                             |

Daftar lengkap path ada di `src/menu.js`.
