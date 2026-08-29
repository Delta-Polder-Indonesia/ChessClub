/** Uji kontrak Zod — tanpa HTTP. */
import {
  LoginSchema,
  PendaftaranSchema,
  SkorPartaiSchema,
  FilterAuditSchema,
  PesanSchema,
} from "../src/skema.js";

let lulus = 0;
let gagal = 0;

function cek(nama, syarat) {
  if (syarat) {
    lulus++;
    console.log(`  ✓ ${nama}`);
  } else {
    gagal++;
    console.log(`  ✗ ${nama}`);
  }
}

cek("login valid", LoginSchema.safeParse({ username: "admin", password: "x" }).success);
cek("login kosong ditolak", !LoginSchema.safeParse({ username: "", password: "" }).success);

cek(
  "pendaftaran minimal valid",
  PendaftaranSchema.safeParse({
    username: "magnuscarlsen",
    namaLengkap: "Magnus Carlsen",
    panggilan: "Magnus",
    hp: "081234567890",
    kota: "Oslo",
    tanggalLahir: "1990-11-30",
    setuju: true,
  }).success
);
cek("pendaftaran tanpa setuju ditolak", !PendaftaranSchema.safeParse({
  username: "a",
  namaLengkap: "A B",
  panggilan: "A",
  hp: "1",
  kota: "X",
  tanggalLahir: "2000-01-01",
  setuju: false,
}).success);

cek("skor 1-0", SkorPartaiSchema.safeParse("1-0").success);
cek("skor 2-0 ditolak", !SkorPartaiSchema.safeParse("2-0").success);

cek("pesan valid", PesanSchema.safeParse({
  nama: "Budi",
  email: "budi@contoh.id",
  pesan: "Halo",
}).success);
cek("pesan email rusak ditolak", !PesanSchema.safeParse({
  nama: "Budi",
  email: "bukan-email",
  pesan: "Halo",
}).success);

cek("filter audit limit", FilterAuditSchema.safeParse({ limit: "20" }).success);

console.log(`\n${lulus} lulus, ${gagal} gagal`);
if (gagal) process.exit(1);
