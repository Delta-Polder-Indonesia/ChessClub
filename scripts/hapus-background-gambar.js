import sharp from "sharp";
import fs from "fs";
import path from "path";

/*
 * Hapus latar putih dari gambar komentator memakai flood-fill dari tepi.
 *
 * Hanya "putih" yang MENYAMBUNG ke batas gambar yang ikut dihilangkan, sehingga
 * bagian putih pada subjek (mis. tangan) yang dikelilingi outline tetap utuh —
 * beda dengan versi lama yang memakai ambang kecerahan global dan ikut
 * menghapus tangan (catur_* -nobg yang rusak).
 */

const folder = "./public/gambar_comentator";
const files = [
  "catur_berpikir.png",
  "catur_bingung.png",
  "catur_marah.png",
  "catur_sedih.png",
  "catur_terkejut.png",
];

const THRESHOLD = 230; // kecerahan di atas ini = latar
const FEATHER_MIN = 190; // di bawah ini tidak diberi transparansi lembut

function hapusLatar(raw, width, height) {
  const length = width * height;
  const alpha = new Uint8Array(length).fill(255);
  const latar = new Uint8Array(length); // daerah yang MENYAMBUNG ke tepi
  const berkunjung = new Uint8Array(length);
  const antrian = new Int32Array(length);
  let kepala = 0;
  let ekor = 0;

  // Tandai piksel terang (calon latar).
  for (let i = 0; i < length; i++) {
    const s = i * 3;
    const r = raw[s];
    const g = raw[s + 1];
    const b = raw[s + 2];
    if ((r + g + b) / 3 > THRESHOLD) latar[i] = 1;
  }

  const pada = (i, x, y) => x >= 0 && y >= 0 && x < width && y < height;
  const dorong = (i, x, y) => {
    if (!pada(i, x, y)) return;
    if (!latar[i] || berkunjung[i]) return;
    berkunjung[i] = 1;
    antrian[ekor++] = i;
  };

  // Benih: piksel latar di batas gambar.
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (x === 0 || y === 0 || x === width - 1 || y === height - 1) {
        dorong(y * width + x, x, y);
      }
    }
  }

  // BFS 4-tetangga: isi semua latar yang menyambung ke tepi.
  while (kepala < ekor) {
    const i = antrian[kepala++];
    const x = i % width;
    const y = (i / width) | 0;
    dorong(i - 1, x - 1, y);
    dorong(i + 1, x + 1, y);
    dorong(i - width, x, y - 1);
    dorong(i + width, x, y + 1);
  }

  // Region latar → transparan penuh.
  for (let i = 0; i < length; i++) {
    if (berkunjung[i]) alpha[i] = 0;
  }

  // Feather tipis: piksel non-latar yang bersebelahan dengan daerah yang
  // dibuang diberi alpha bertahap sesuai kecerahan, menyerap halo antialias.
  for (let i = 0; i < length; i++) {
    if (alpha[i] > 0 && !latar[i]) {
      const x = i % width;
      const y = (i / width) | 0;
      const sebelah =
        (x > 0 && berkunjung[i - 1]) ||
        (x < width - 1 && berkunjung[i + 1]) ||
        (y > 0 && berkunjung[i - width]) ||
        (y < height - 1 && berkunjung[i + width]);
      if (!sebelah) continue;
      const s = i * 3;
      const kecerahan = (raw[s] + raw[s + 1] + raw[s + 2]) / 3;
      if (kecerahan < FEATHER_MIN) continue;
      const t = (kecerahan - FEATHER_MIN) / (THRESHOLD - FEATHER_MIN);
      alpha[i] = Math.max(20, Math.min(255, Math.round(255 * t)));
    }
  }

  return alpha;
}

for (const file of files) {
  const inputPath = path.join(folder, file);
  console.log(`\nMemproses: ${file}`);

  try {
    const meta = await sharp(inputPath).metadata();
    const width = meta.width;
    const height = meta.height;
    console.log(`  Ukuran: ${width}x${height}`);

    // Pakai RGB murni (buang alpha bila ada) agar perhitungan konsisten.
    const raw = await sharp(inputPath).removeAlpha().raw().toBuffer();
    const alpha = hapusLatar(raw, width, height);

    const rgba = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const s = i * 3;
      const d = i * 4;
      rgba[d] = raw[s];
      rgba[d + 1] = raw[s + 1];
      rgba[d + 2] = raw[s + 2];
      rgba[d + 3] = alpha[i];
    }

    const outputPath = path.join(folder, file.replace(".png", "-nobg.png"));
    await sharp(rgba, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toFile(outputPath);

    console.log(`  Selesai -> ${file.replace(".png", "-nobg.png")}`);
  } catch (err) {
    console.log(`  Error: ${err.message}`);
  }
}

console.log("\nSelesai!");