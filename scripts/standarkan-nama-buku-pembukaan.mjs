import { readFile, writeFile } from "node:fs/promises";
import { standarkanNamaPembukaan } from "../src/lib/namaPembukaan.js";

const jalur = new URL("../public/data/buku-pembukaan.json", import.meta.url);
const sumber = await readFile(jalur, "utf8");

let perubahan = 0;
const hasil = sumber.replace(
  /^(\s*"opening":\s*)("(?:[^"\\]|\\.)*")(,?\s*)$/gm,
  (_, awalan, nilaiJson, akhiran) => {
    const namaLama = JSON.parse(nilaiJson);
    const namaBaru = standarkanNamaPembukaan(namaLama);
    if (namaBaru !== namaLama) perubahan += 1;
    return `${awalan}${JSON.stringify(namaBaru)}${akhiran}`;
  }
);

if (hasil !== sumber) {
  await writeFile(jalur, hasil, "utf8");
}

console.log(
  perubahan
    ? `OK — ${perubahan} entri opening dibakukan di public/data/buku-pembukaan.json.`
    : "OK — tidak ada nama opening yang perlu dibakukan lagi."
);
