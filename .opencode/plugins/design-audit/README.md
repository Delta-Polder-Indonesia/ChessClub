# Design Audit Plugin (OpenCode Local Plugin)

Plugin lokal untuk membantu modifikasi desain di ChessClub, khususnya area dashboard Pengurus.

## Fitur Tools

| Tool | Deskripsi |
|------|-----------|
| `audit-warna` | Daftar semua warna unik di `src/gaya/components/` — untuk memastikan tidak ada warna di luar palet slate/KCI. |
| `audit-title` | Cari `title=` bawaan browser di JSX Pengurus yang belum ada `aria-label` — kandidat untuk diganti `<TooltipLabel>`. |
| `audit-border` | Cek tabel dengan border tebal (>1px) — target perbaikan ke border 1px. |

## Command

```
/design-audit
```

Menjalankan semua audit sekaligus dan menampilkan ringkasan.

## Struktur

```
.opencode/
└── plugins/
    └── design-audit/
        ├── index.ts    — implementasi tools, commands, hooks
        └── README.md   — dokumentasi ini
```

## Cara Pakai

Tambahkan ke `opencode.jsonc` di root repo (sudah terkonfigurasi):

```jsonc
{
  "plugins": [
    "./.opencode/plugins/design-audit"
  ]
}
```

OpenCode akan memuat plugin secara otomatis dari `.opencode/plugins/`.

## Contoh Output `audit-warna`

```
Ditemukan 12 warna unik di 21 berkas CSS:

border-slate-200
border-slate-300
text-slate-500
text-slate-600
text-slate-700
text-slate-800
text-slate-900
bg-slate-50
bg-slate-100
bg-slate-200
primary
slate-900
```

Untuk modifikasi desain lebih lanjut, tambahkan tool baru di `index.ts` atau tambah plugin lain di `opencode.jsonc`.
