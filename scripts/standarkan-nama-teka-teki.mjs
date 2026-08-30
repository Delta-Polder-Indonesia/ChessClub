import { readFile, writeFile } from "node:fs/promises";
import { standarkanNamaPembukaan } from "../src/lib/namaPembukaan.js";

const jalur = new URL("../public/data/teka-teki.json", import.meta.url);
const sumber = JSON.parse(await readFile(jalur, "utf8"));
const daftar = Array.isArray(sumber?.problems) ? sumber.problems : [];

let perubahan = 0;
for (const item of daftar) {
  if (!item || typeof item !== "object" || !item.pembukaan) continue;
  const namaBaru = standarkanNamaPembukaan(item.pembukaan);
  if (namaBaru !== item.pembukaan) {
    item.pembukaan = namaBaru;
    perubahan += 1;
  }
}

await writeFile(jalur, `${JSON.stringify(sumber, null, 1)}\n`, "utf8");

console.log(
  perubahan
    ? `OK — ${perubahan} entri pembukaan dibakukan di public/data/teka-teki.json.`
    : "OK — tidak ada nama pembukaan teka-teki yang perlu dibakukan lagi."
);
