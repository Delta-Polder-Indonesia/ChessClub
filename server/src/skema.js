/**
 * Skema validasi masukan API (Zod).
 *
 * Pesan galat per-field sengaja berbahasa Indonesia agar klien bisa
 * menampilkannya langsung. Handler yang sudah punya validasi domain
 * (keanggotaan, turnamen) tetap memakai fungsi mereka — skema ini
 * menjadi kontrak bersama dan dipakai di endpoint baru / query.
 */
import { z } from "zod";

export const UsernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9_-]{3,25}$/, "Username tidak valid (3-25 karakter, huruf/angka/_/-).");

export const LoginSchema = z.object({
  username: z.string().min(1, "Username dan password wajib diisi."),
  password: z.string().min(1, "Username dan password wajib diisi."),
});

export const PendaftaranSchema = z.object({
  username: z.string().min(1, "Username Chess.com wajib diisi."),
  namaLengkap: z.string().trim().min(1, "Nama lengkap wajib diisi.").max(80, "Nama lengkap terlalu panjang."),
  panggilan: z.string().trim().min(1, "Nama panggilan wajib diisi.").max(30, "Nama panggilan terlalu panjang."),
  hp: z.string().min(1, "Nomor HP/WhatsApp tidak valid. Contoh: 0812-3456-7890."),
  dana: z.string().optional(),
  kota: z.string().trim().min(1, "Kota asal wajib diisi.").max(60, "Nama kota terlalu panjang."),
  tanggalLahir: z.string().min(1, "Tanggal lahir wajib diisi."),
  email: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), "Format email tidak valid."),
  klub: z.string().max(60, "Nama klub terlalu panjang.").optional(),
  setuju: z.union([z.literal(true), z.literal("true"), z.literal(1)]).refine(Boolean, {
    message: "Anda harus menyetujui kode etik komunitas.",
  }),
  tiketVerifikasi: z.string().optional(),
});

export const SkorPartaiSchema = z.enum(["1-0", "0-1", "0.5-0.5"], {
  errorMap: () => ({ message: "Skor harus salah satu dari: 1-0, 0-1, 0.5-0.5." }),
});

export const PesanSchema = z.object({
  nama: z.string().trim().min(1, "Nama, email, dan pesan wajib diisi.").max(80),
  email: z.string().trim().email("Format email tidak valid.").max(120),
  telepon: z.string().max(40).optional().or(z.literal("")),
  organisasi: z.string().max(120).optional().or(z.literal("")),
  subjek: z.string().max(150).optional().or(z.literal("")),
  pesan: z.string().trim().min(1, "Nama, email, dan pesan wajib diisi.").max(5000),
});

export const FilterAuditSchema = z.object({
  limit: z.coerce.number().int().min(1).max(1000).optional(),
  aksi: z.string().max(80).optional(),
  username: z.string().max(25).optional(),
  sejak: z.string().max(40).optional(),
  hingga: z.string().max(40).optional(),
});

/** Ubah hasil Zod.safeParse menjadi peta field → pesan. */
export function galatFieldZod(error) {
  const datar = error.flatten().fieldErrors;
  const galat = {};
  for (const [k, v] of Object.entries(datar)) {
    if (Array.isArray(v) && v[0]) galat[k] = v[0];
  }
  return galat;
}
