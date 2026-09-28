/**
 * Kamus Indonesia (ID) · kelompok media — halaman Media & Informasi (berita, pengumuman, galeri).
 * Kunci dalam berkas: media, berita, pengumuman, galeri.
 */

export const media = {
    judul: "Media & Informasi",
    deskripsi:
      "Kanal resmi berita, pengumuman, dan galeri Komunitas Catur Indonesia.",
    artikel: "Satu Sumber Resmi",
    p1: "Semua informasi resmi komunitas hanya dikeluarkan melalui kanal ini dan surel info@komunitascatur.or.id. Waspadai undangan turnamen atau pungutan yang tidak tercantum di halaman Pengumuman.",
    p2: "Kanal yang tersedia adalah sebagai berikut:",
    l1: "laporan kegiatan, wawancara, dan liputan turnamen.",
    l2: "foto kegiatan sekretariat, kelas, dan pertandingan.",
    nextJudul: "Berita Komunitas",
    tidakDitemukan: "Konten tidak ditemukan.",
  }

export const berita = {
    judul: "Berita Komunitas",
    deskripsi: "Liputan kegiatan, hasil pertandingan, dan cerita anggota.",
    artikel: "Terbaru",
    memuat: "Memuat berita…",
    gagal: "Berita sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.",
    kosong: "Belum ada berita komunitas.",
    n1a: "12 Agustus 2026 — Turnamen Bulanan Agustus diikuti 64 pecatur.",
    n1b: "Rekor peserta baru untuk event internal. Grup A dimenangkan pecatur junior dari chapter Medan.",
    n2a: "28 Juli 2026 — Coaching clinic struktur pion bersama pelatih tamu.",
    n2b: "Sesi daring 110 menit membahas Isolated Queen Pawn dan cara merencanakan break di pusat.",
    n3a: "10 Desember 2025 — Hari lahir komunitas ke-10 dirayakan dengan simultan.",
    n3b: "Dua puluh papan simultan dibuka untuk pelajar. Acara ditutup pembaruan identitas visual.",
  }

export const pengumuman = {
    judul: "Pengumuman",
    deskripsi:
      "Pemberitahuan resmi: jadwal, pendaftaran, dan perubahan ketentuan.",
    artikel: "Berlaku saat ini",
    memuat: "Memuat pengumuman…",
    gagal: "Pengumuman sedang tidak dapat dimuat. Silakan coba beberapa saat lagi.",
    kosong: "Belum ada pengumuman.",
    p1a: "Pendaftaran Turnamen Bulanan September",
    p1b: " dibuka hingga 31 Agustus 2026 pukul 21.00 WIB.",
    p2a: "Libur sekretariat",
    p2b: " pada 17 Agustus 2026. Kelas luring dialihkan ke sesi daring.",
    p3a: "Pemanggilan tim Liga Antar Komunitas",
    p3b: " diumumkan melalui surel anggota pada 20 Agustus 2026.",
    nextJudul: "Galeri",
  }

export const galeri = {
    judul: "Galeri",
    deskripsi: "Foto kegiatan kelas, pertandingan, dan perayaan hari lahir komunitas.",
    standfirst:
      "Arsip foto Komunitas Catur Indonesia, dikelompokkan menurut tonggak sejarah, turnamen, dan kegiatan latihan. Sebagian besar direkam di sekretariat Medan serta kegiatan komunitas di berbagai kota.",
    pengantar: "First-pass results, before manual polish.",
    pilihBrief: "Choose a brief",
    tanpa: "Without Impeccable",
    dengan: "With Impeccable",
    running: "{n} runs",
    variasi: "{n} variations",
    catatan: "Same prompt and model. Image generation available to both.",
    tentang: "About the examples",
    metodeP1:
      "Build directly examples start with the prompt shown. There may be choices along the way, but no follow-up prompts to polish the design. You'd usually refine further from here.",
    metodeP2:
      "Older baselines had image generation disabled. The new Opus 5.5 and GPT-6 Sol comparisons make it available with and without Impeccable. Design first shows selected examples with human reviews and feedback along the way. Some runs were resumed after technical fixes.",
    lightbox: {
      buka: "Open screenshot",
      tutup: "Close enlarged screenshot",
      salin: "Copy link",
      salinTautan: "Copy link to this design",
      terSalin: "Link copied",
      salinGagal: "Could not copy the link.",
      gagal: "This screenshot could not load. Try another variation, or close and reopen it.",
      sebelumnya: "← Previous",
      berikutnya: "Next →",
      posisi: "{i} of {n}",
    },
    proyek: {
      "09-luxury-hotel": {
        judul: "Boutique hotel",
        brief:
          "Make me a website for Villa Castagneto, our 14-room family-run boutique hotel on a cliff above the Ligurian coast. Three generations same family. Audience is well-traveled couples 40s-60s booking 4-6 months out. Owner's voice, not corporate.",
      },
      "02-kids-reading": {
        judul: "Children’s reading",
        brief:
          "Make me a landing page for Otterly, our iPad reading app for kids ages 6-9 reading their first chapter books with adaptive vocabulary support. Audience is parents (and the kids peeking over their shoulder). Warm and encouraging, never condescending — feels more like a bookshop than an edutainment app.",
      },
      "03-italian-restaurant": {
        judul: "Italian restaurant",
        brief:
          "Make me a homepage for Trattoria da Nonna Lucia, our family Italian restaurant in Gloucester's Fort neighborhood on the Massachusetts coast. Same family since 1978. We're at 47 Commercial Street, open for dinner Tuesday through Sunday, and take reservations by phone. Locals and weekend tourists are looking up the menu and hours on their phones. Family, neighborhood, no pretense.",
      },
      "01-observability": {
        judul: "Observability",
        brief:
          "Make me a landing page for Tortuga, our distributed-tracing tool for SREs running microservices. It reconstructs the smallest causal trace that explains a latency regression, so engineers inspect an incident path instead of searching a telemetry lake. Audience is senior backend engineers between incidents, evaluating us against Datadog/Honeycomb. Brand is technical and blunt, no hype. The main action installs a Helm chart into the engineer's cluster and points it at their existing OpenTelemetry collector. Do not claim that Tortuga is open source, self-hosted, SaaS, or any particular price; those commercial details are not decided. We can show a real trace, query, config, and reproducible latency methodology, but we have no customer logos or testimonials.",
      },
      "07-vintage-moto-forum": {
        judul: "Vintage motorcycles",
        brief:
          "Make me a landing page for Carburetor.club, an online community for people restoring vintage Japanese motorcycles from the 60s and 70s. Audience is hobbyist mechanics, mostly men 45+. Enthusiast and mechanical, masculine without being aggressive — like a forum that's been around in spirit since 2003.",
      },
      "08-perp-dex": {
        judul: "Perpetual exchange",
        brief:
          "Make me a landing page for Slipstream, a decentralized perp futures exchange offering 100x leverage on major crypto pairs. Audience is experienced degens evaluating new venues for fees, leverage, and liquidation engine. Fast and dense — they already understand the space, no hand-holding.",
      },
      "21-infra-platform": {
        judul: "Infrastructure",
        brief:
          "Make me a landing page for Stratum, our B2B infrastructure platform — engineering teams deploy, observe, and scale apps globally with one primitive. Audience is platform engineers at Series-B-and-up startups arriving from Hacker News, skeptical of generic SaaS. Voice is precise, technical, product-forward — Stripe, Linear, Vercel, Posthog territory.",
      },
    },
  }

