#!/usr/bin/env node
/** Pemeriksaan ringan endpoint produksi, cocok untuk cron dan GitHub Actions. */
const dasar = process.env.KCI_HEALTH_URL || process.env.KCI_API_URL;
if (!dasar) {
  console.error("[health] Set KCI_HEALTH_URL atau KCI_API_URL.");
  process.exit(1);
}

const url = process.env.KCI_HEALTH_URL
  ? dasar
  : `${dasar.replace(/\/$/, "")}/api/kesehatan`;
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 10_000);

try {
  const respons = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: controller.signal,
  });
  const data = await respons.json().catch(() => null);
  if (!respons.ok || data?.status !== "sehat") {
    throw new Error(`HTTP ${respons.status}; status=${data?.status || "tidak sah"}`);
  }
  if (data?.versiApi !== "v1") {
    throw new Error(`versi API bukan v1 (diterima: ${data?.versiApi || "kosong"})`);
  }
  if (
    process.env.KCI_HEALTH_REQUIRE_SUPABASE === "1" &&
    (!data?.supabase?.terpasang || !data?.supabase?.siap)
  ) {
    throw new Error(
      `Supabase belum siap (terpasang=${Boolean(data?.supabase?.terpasang)}, ` +
        `siap=${Boolean(data?.supabase?.siap)})`
    );
  }
  const requestId = respons.headers.get("x-request-id");
  console.log(
    `[health] sehat — ${url}; API ${data.versiApi}; ` +
      `Supabase ${data?.supabase?.siap ? "siap" : "belum siap"}` +
      (requestId ? ` (request ${requestId})` : "")
  );
} catch (error) {
  console.error(`[health] GAGAL — ${url}: ${error.name === "AbortError" ? "timeout" : error.message}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timer);
}
