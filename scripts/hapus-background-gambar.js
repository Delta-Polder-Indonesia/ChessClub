import sharp from "sharp";
import fs from "fs";
import path from "path";

const folder = "./public/gambar_comentator";
const files = [
  "catur_berpikir.png",
  "catur_bingung.png", 
  "catur_marah.png",
  "catur_sedih.png",
  "catur_terkejut.png"
];

const THRESHOLD = 230;

for (const file of files) {
  const inputPath = path.join(folder, file);
  console.log(`\nMemproses: ${file}`);
  
  try {
    // Dapatkan metadata
    const meta = await sharp(inputPath).metadata();
    const width = meta.width;
    const height = meta.height;
    console.log(`  Ukuran: ${width}x${height}`);
    
    // Dapatkan data raw RGB
    const raw = await sharp(inputPath).raw().toBuffer();
    
    // Buat buffer RGBA baru
    const rgba = Buffer.alloc(width * height * 4);
    
    for (let i = 0; i < width * height; i++) {
      const srcIdx = i * 3;
      const dstIdx = i * 4;
      
      const r = raw[srcIdx];
      const g = raw[srcIdx + 1];
      const b = raw[srcIdx + 2];
      
      // Hitung kecerahan rata-rata
      const brightness = (r + g + b) / 3;
      
      rgba[dstIdx] = r;
      rgba[dstIdx + 1] = g;
      rgba[dstIdx + 2] = b;
      
      // Background terang → transparan
      if (brightness > THRESHOLD) {
        rgba[dstIdx + 3] = 0;
      } else {
        rgba[dstIdx + 3] = 255;
      }
    }
    
    // Simpan sebagai PNG dengan alpha
    const outputPath = path.join(folder, file.replace(".png", "-nobg.png"));
    await sharp(rgba, {
      raw: { width, height, channels: 4 }
    }).png().toFile(outputPath);
    
    console.log(`  ✅ Selesai → ${file.replace(".png", "-nobg.png")}`);
    
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
  }
}

console.log("\n✅ Selesai!");
