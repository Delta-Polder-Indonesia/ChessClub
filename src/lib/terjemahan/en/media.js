/**
 * Kamus Inggris (EN) · kelompok media — halaman Media & Informasi (berita, pengumuman, galeri).
 * Kunci dalam berkas: media, berita, pengumuman, galeri.
 */

export const media = {
    judul: "Media & Information",
    deskripsi:
      "The official channels for Indonesia Chess Community news, announcements, and gallery.",
    artikel: "One Official Source",
    p1: "All official community information is released only through this channel and the email info@komunitascatur.or.id. Beware of tournament invitations or collections not listed on the Announcements page.",
    p2: "The available channels are as follows:",
    l1: "activity reports, interviews, and tournament coverage.",
    l2: "photos of secretariat, class, and match activities.",
    nextJudul: "Community News",
    tidakDitemukan: "Content not found.",
  }

export const berita = {
    judul: "Community News",
    deskripsi: "Coverage of activities, match results, and member stories.",
    artikel: "Latest",
    memuat: "Loading news…",
    gagal: "News cannot be loaded right now. Please try again shortly.",
    kosong: "No community news yet.",
    n1a: "August 12, 2026 — August Monthly Tournament followed by 64 players.",
    n1b: "A new participation record for an internal event. Group A was won by a junior player from the Medan chapter.",
    n2a: "July 28, 2026 — Pawn structure coaching clinic with a guest coach.",
    n2b: "A 110-minute online session covering the Isolated Queen Pawn and how to plan a central break.",
    n3a: "December 10, 2025 — The community's 10th anniversary celebrated with a simul.",
    n3b: "Twenty simul boards were opened to students. The event closed with the visual identity renewal.",
  }

export const pengumuman = {
    judul: "Announcements",
    deskripsi:
      "Official notices: schedules, registration, and changes to terms.",
    artikel: "Currently in Effect",
    memuat: "Loading announcements…",
    gagal: "Announcements cannot be loaded right now. Please try again shortly.",
    kosong: "No announcements yet.",
    p1a: "Registration for the September Monthly Tournament",
    p1b: " is open until August 31, 2026 at 9:00 PM WIB.",
    p2a: "Secretariat holiday",
    p2b: " on August 17, 2026. Offline classes are moved to online sessions.",
    p3a: "Inter-Community League team call-ups",
    p3b: " will be announced via member email on August 20, 2026.",
    nextJudul: "Gallery",
  }

export const galeri = {
    judul: "Gallery",
    deskripsi: "Photos of classes, matches, and community anniversary celebrations.",
    standfirst:
      "The Indonesia Chess Community photo archive, grouped by milestones, tournaments, and training activities. Most were taken at the Medan secretariat and at community events across the country.",
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

