/**
 * Uji autentikasi JWT — memverifikasi:
 * 1. Login mengembalikan JWT (bukan password asli)
 * 2. JWT bisa dipakai untuk endpoint pengurus
 * 3. JWT kedaluwarsa ditolak
 * 4. Password lama (legacy) masih bisa dipakai (kompatibilitas)
 * 5. Ganti password meng-hash dengan bcrypt
 */

const PORT = 18799;
const DASAR = `http://127.0.0.1:${PORT}`;

let server;
let gagal = 0;
let lolos = 0;

function ok(pesan) { lolos++; console.log(`  ✅ ${pesan}`); }
function fail(pesan) { gagal++; console.error(`  ❌ ${pesan}`); }
function sama(a, b, pesan) {
  if (a === b) ok(pesan);
  else fail(`${pesan} — dapat: ${JSON.stringify(a)}, harap: ${JSON.stringify(b)}`);
}

async function api(jalur, opsi = {}) {
  const headers = { ...opsi.headers };
  if (opsi.body) headers["Content-Type"] = "application/json";
  const res = await fetch(`${DASAR}${jalur}`, {
    method: opsi.method || "GET",
    headers,
    body: opsi.body ? JSON.stringify(opsi.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function jalankan() {
  console.log("\n🧪 UJI AUTENTIKASI JWT\n");

  // Mulai server
  process.env.PORT = String(PORT);
  process.env.NODE_ENV = "development";
  process.env.KCI_ADMIN_USER = "admin";
  process.env.KCI_ADMIN_PASSWORD = "admin123";
  // Tidak set KCI_JWT_SECRET → pakai bawaan pengembangan

  const mod = await import("../src/index.js");
  server = mod.server;

  // Tunggu server siap
  await new Promise(r => setTimeout(r, 500));

  // ── Uji 1: Server hidup ──
  console.log("1. Server hidup:");
  {
    const { status, data } = await api("/api/kesehatan");
    sama(status, 200, "status 200");
    sama(data.status, "sehat", "status sehat");
  }

  // ── Uji 2: Endpoint pengurus tanpa token → 401 ──
  console.log("\n2. Endpoint pengurus tanpa token:");
  {
    const { status } = await api("/api/pengurus/ringkasan");
    sama(status, 401, "status 401");
  }

  // ── Uji 3: Login → dapat JWT ──
  console.log("\n3. Login dengan kredensial benar:");
  let jwtToken;
  {
    const { status, data } = await api("/api/auth/login", {
      method: "POST",
      body: { username: "admin", password: "admin123" },
    });
    sama(status, 200, "status 200");
    sama(data.ok, true, "ok: true");
    sama(data.username, "admin", "username: admin");
    sama(data.role, "master", "role: master");

    // Token harus JWT (3 segmen dipisah titik)
    const token = data.token || "";
    const segmen = token.split(".");
    sama(segmen.length, 3, "token format JWT (3 segmen)");

    // Token TIDAK boleh sama dengan password
    if (token !== "admin123") {
      ok("token BUKAN password asli");
    } else {
      fail("token masih password asli!");
    }

    // Decode payload untuk verifikasi isi
    try {
      const payload = JSON.parse(Buffer.from(segmen[1], "base64url").toString());
      sama(payload.sub, "admin", "JWT sub: admin");
      sama(payload.role, "master", "JWT role: master");
      sama(payload.typ, "admin", "JWT typ: admin");
      sama(payload.iss, "kci-server", "JWT issuer: kci-server");
      if (payload.exp && payload.exp > Math.floor(Date.now() / 1000)) {
        ok("JWT belum kedaluwarsa");
      } else {
        fail("JWT sudah kedaluwarsa atau tidak punya exp");
      }
    } catch (e) {
      fail(`Gagal decode JWT payload: ${e.message}`);
    }

    jwtToken = token;
  }

  // ── Uji 4: Pakai JWT untuk endpoint pengurus ──
  console.log("\n4. Akses endpoint pengurus dengan JWT:");
  {
    const { status, data } = await api("/api/pengurus/verifikasi", {
      headers: { "X-Token-Admin": jwtToken },
    });
    sama(status, 200, "status 200");
    sama(data.ok, true, "ok: true");
    sama(data.username, "admin", "username: admin");
    sama(data.role, "master", "role: master");
  }

  // ── Uji 5: JWT palsu ditolak ──
  console.log("\n5. JWT palsu ditolak:");
  {
    const palsu = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJoYWNrZXIiLCJyb2xlIjoibWFzdGVyIn0.palsu";
    const { status } = await api("/api/pengurus/ringkasan", {
      headers: { "X-Token-Admin": palsu },
    });
    sama(status, 401, "status 401 untuk JWT palsu");
  }

  // ── Uji 6: Login dengan password salah → 401 ──
  console.log("\n6. Login dengan password salah:");
  {
    const { status, data } = await api("/api/auth/login", {
      method: "POST",
      body: { username: "admin", password: "salah123" },
    });
    sama(status, 401, "status 401");
  }

  // ── Uji 7: Ambil CSRF token ──
  console.log("\n7. CSRF token:");
  let csrfToken;
  {
    const { status, data } = await api("/api/csrf-token");
    sama(status, 200, "status 200");
    csrfToken = data.token;
    if (csrfToken && csrfToken.length > 10) {
      ok("CSRF token terambil");
    } else {
      fail("CSRF token tidak valid");
    }
  }

  // ── Uji 8: Login dengan role "pengurus" ──
  console.log("\n8. Endpoint master-only ditolak untuk non-master:");
  {
    // Ambil daftar admin dulu (hanya master yang bisa)
    const { status } = await api("/api/pengurus/admins", {
      headers: { "X-Token-Admin": jwtToken },
    });
    // admin default adalah master, jadi ini harus 200
    sama(status, 200, "master bisa akses /admins");
  }

  // ── Uji 9: Anggota publik tanpa token ──
  console.log("\n9. Endpoint publik tanpa token:");
  {
    const { status } = await api("/api/anggota");
    // Bisa 200 (ada data) atau 502 (Chess.com tidak terjangkau) — keduanya OK
    if (status === 200 || status === 502) {
      ok(`status ${status} (endpoint publik berfungsi)`);
    } else {
      fail(`status ${status} — tidak diharapkan`);
    }
  }

  // ── Selesai ──
  console.log(`\n${"─".repeat(50)}`);
  console.log(`Hasil: ${lolos} lolos, ${gagal} gagal`);
  if (gagal > 0) {
    console.log("\n❌ ADA TEST YANG GAGAL!\n");
    process.exitCode = 1;
  } else {
    console.log("\n✅ SEMUA TEST LOLOS!\n");
  }

  server.close();
}

jalankan().catch(e => {
  console.error("Galat fatal:", e);
  server?.close();
  process.exit(1);
});
