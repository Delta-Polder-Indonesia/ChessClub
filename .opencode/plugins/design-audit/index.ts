/**
 * Design Audit Plugin — OpenCode Local Plugin
 *
 * Menambahkan tools dan commands untuk membantu modifikasi desain
 * di repository ChessClub, khususnya area src/halaman/Pengurus/
 * dan src/gaya/components/.
 *
 * Diexport sebagai objek dengan properti `tools`, `commands`, dan `hooks`
 * yang dikenali OpenCode saat memuat plugin lokal dari .opencode/plugins/.
 */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const REPO_ROOT = process.cwd();
const GAYA_COMPONENTS = join(REPO_ROOT, "src", "gaya", "components");
const PENGURUS = join(REPO_ROOT, "src", "halaman", "Pengurus");

/* ------------------------------------------------------------------ */
/* Helper: baca semua file CSS di src/gaya/components/                */
/* ------------------------------------------------------------------ */
function daftarFileCSS(): string[] {
  const hasil: string[] = [];
  function scan(dir: string) {
    for (const entri of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entri.name);
      if (entri.isDirectory()) scan(path);
      else if (entri.name.endsWith(".css")) hasil.push(path);
    }
  }
  scan(GAYA_COMPONENTS);
  return hasil;
}

/* ------------------------------------------------------------------ */
/* Helper: cari warna yang digunakan di file CSS                      */
/* ------------------------------------------------------------------ */
const RE_WARNA = /(slate|merah|hijau|biru|kuning|amber|emerald|primary|text-slate-\d+|bg-slate-\d+|border-slate-\d+)/g;

function ekstraksiWarna(css: string): string[] {
  const found: string[] = [];
  let m;
  while ((m = RE_WARNA.exec(css)) !== null) {
    found.push(m[0]);
  }
  return [...new Set(found)];
}

/* ------------------------------------------------------------------ */
/* Helper: cari native title= di JSX                                  */
/* ------------------------------------------------------------------ */
const RE_TITLE = /title\s*=/;

function cariNativeTitle(dir: string): string[] {
  const hasil: string[] = [];
  function scan(dir: string) {
    for (const entri of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entri.name);
      if (entri.isDirectory()) scan(path);
      else if (entri.name.endsWith(".jsx") || entri.name.endsWith(".js")) {
        const isi = readFileSync(path, "utf8");
        if (RE_TITLE.test(isi)) {
          // Cek apakah ada aria-label sebagai pelengkap
          const baris = isi.split("\n");
          baris.forEach((b, i) => {
            if (RE_TITLE.test(b) && !/aria-label/.test(b)) {
              hasil.push(`${path}:${i + 1}`);
            }
          });
        }
      }
    }
  }
  scan(dir);
  return hasil;
}

/* ------------------------------------------------------------------ */
/* Tools                                                              */
/* ------------------------------------------------------------------ */

export const tools = {
  /**
   * audit-warna: daftar semua warna yang digunakan di CSS komponen
   * agar mudah melihat apakah ada warna di luar palet slate/KCI.
   */
  "audit-warna": {
    description: "Daftar semua warna unik yang digunakan di src/gaya/components/",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async () => {
      const berkas = daftarFileCSS();
      const semuaWarna = new Set<string>();
      const detail: Record<string, string[]> = {};

      for (const b of berkas) {
        const css = readFileSync(b, "utf8");
        const warna = ekstraksiWarna(css);
        if (warna.length > 0) {
          detail[b] = warna;
          warna.forEach((w) => semuaWarna.add(w));
        }
      }

      return {
        content: [
          {
            type: "text",
            text: `Ditemukan ${semuaWarna.size} warna unik di ${berkas.length} berkas CSS:\n\n` +
              Array.from(semuaWarna).sort().join("\n") +
              "\n\nDetail per berkas:\n" +
              Object.entries(detail)
                .map(([b, w]) => `- ${b}: ${w.join(", ")}`)
                .join("\n"),
          },
        ],
      };
    },
  },

  /**
   * audit-title: cari native title= di JSX yang belum diganti TooltipLabel
   */
  "audit-title": {
    description: "Cari atribut title= bawaan browser di JSX Pengurus yang belum ada aria-label",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async () => {
      const hasil = cariNativeTitle(PENGURUS);
      return {
        content: [
          {
            type: "text",
            text: hasil.length === 0
              ? "Tidak ada native title= tanpa aria-label di src/halaman/Pengurus/. Semua aman."
              : `Ditemukan ${hasil.length} native title= tanpa aria-label:\n\n${hasil.join("\n")}`,
          },
        ],
      };
    },
  },

  /**
   * audit-border: cek tabel yang masih pakai border tebal (>1px)
   */
  "audit-border": {
    description: "Cek tabel di Pengurus yang masih menggunakan border tebal (>1px)",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
    execute: async () => {
      const hasil: string[] = [];
      function scan(dir: string) {
        for (const entri of readdirSync(dir, { withFileTypes: true })) {
          const path = join(dir, entri.name);
          if (entri.isDirectory()) scan(path);
          else if (entri.name.endsWith(".jsx") || entri.name.endsWith(".js")) {
            const isi = readFileSync(path, "utf8");
            // Cari className yang mengandung border-2, border-4, dst
            const RE_BORDER_TEBAL = /border-([2-9]|[1-9]\d+)/g;
            const baris = isi.split("\n");
            baris.forEach((b, i) => {
              if (RE_BORDER_TEBAL.test(b)) {
                const match = b.match(RE_BORDER_TEBAL);
                hasil.push(`${path}:${i + 1} — ${match?.join(", ")}`);
              }
            });
          }
        }
      }
      scan(PENGURUS);
      return {
        content: [
          {
            type: "text",
            text: hasil.length === 0
              ? "Tidak ada border tebal (>1px) di src/halaman/Pengurus/. Semua menggunakan border 1px."
              : `Ditemukan ${hasil.length} border tebal (>1px):\n\n${hasil.join("\n")}`,
          },
        ],
      };
    },
  },
};

/* ------------------------------------------------------------------ */
/* Commands                                                           */
/* ------------------------------------------------------------------ */

export const commands = {
  /**
   * /design-audit: jalankan semua audit sekaligus
   */
  "design-audit": {
    description: "Jalankan semua audit desain (warna, title, border) sekaligus",
    execute: async (args: string[]) => {
      const berkas = daftarFileCSS();
      const semuaWarna = new Set<string>();
      for (const b of berkas) {
        ekstraksiWarna(readFileSync(b, "utf8")).forEach((w) => semuaWarna.add(w));
      }

      const judul = "🎨 DESIGN AUDIT — ChessClub Pengurus";
      const garis = "=".repeat(judul.length);

      const output = [
        garis,
        judul,
        garis,
        "",
        `📁 Berkas CSS komponen: ${berkas.length}`,
        `🎨 Warna unik: ${semuaWarna.size}`,
        `   ${Array.from(semuaWarna).sort().join(", ")}`,
        "",
        `🏷️ Native title= tanpa aria-label: ${cariNativeTitle(PENGURUS).length}`,
        `📏 Border tebal (>1px): perlu dicek manual`,
        "",
        "Gunakan tool audit-warna, audit-title, atau audit-border untuk detail lengkap.",
        "",
        garis,
      ];

      return { content: [{ type: "text", text: output.join("\n") }] };
    },
  },
};

/* ------------------------------------------------------------------ */
/* Hooks (opsional)                                                   */
/* ------------------------------------------------------------------ */

export const hooks = {
  /**
   * Saat file diubah, otomatis cek apakah ada native title= baru
   */
  onFileChange: async ({ filePath }: { filePath: string }) => {
    if (
      filePath.startsWith(PENGURUS) &&
      (filePath.endsWith(".jsx") || filePath.endsWith(".js"))
    ) {
      const isi = readFileSync(filePath, "utf8");
      if (RE_TITLE.test(isi) && !/aria-label/.test(isi)) {
        console.warn(
          `[design-audit] Perhatian: ${filePath} mengandung native title= tanpa aria-label. Pertimbangkan pakai <TooltipLabel>.`
        );
      }
    }
  },
};
