/**
 * Peta ukuran gambar publik — dihasilkan oleh `node scripts/optimumkan-gambar.mjs`.
 * JANGAN disunting tangan; jalankan ulang skripnya kalau ada gambar baru.
 *
 *   UKUR["/images/x.webp"] = [lebarAsli, tinggiAsli, [lebarVarian…]]
 *
 * Varian disimpan sebagai lebarnya saja: berkasnya selalu di samping aslinya
 * dengan nama "x-<lebar>.webp" (konvensi yang sama dipakai sumberHero()).
 * src/lib/asets.js → sumberGambar() membaca peta ini untuk membentuk srcSet,
 * jadi tidak ada kandidat gambar yang menunjuk berkas kosong.
 *
 *   DILEWATI["/images/y.webp"] = [640]
 *
 * Lebar yang sudah dicoba tetapi sengaja TIDAK dibuatkan variannya karena
 * berkas aslinya sudah lebih ramping daripada hasil kompresi ulang.
 */
export const UKUR = {
  "/images/BlunderSkuad.webp": [
    160,
    160,
    []
  ],
  "/images/E-Books/cover-101-prinsip-dasar.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-basic-rules-of-chess.webp": [
    1024,
    1536,
    [
      320,
      480,
      640,
      828
    ]
  ],
  "/images/E-Books/cover-caro-kann-defense.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-chess-5334-problems.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-chess-fundamentals.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-complete-guide-to-chess.webp": [
    1024,
    1536,
    [
      320,
      480,
      640,
      828
    ]
  ],
  "/images/E-Books/cover-fide-laws-of-chess.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-grandmaster-codex.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-how-to-play-chess.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-mastering-chess-middle-game.webp": [
    614,
    921,
    []
  ],
  "/images/E-Books/cover-practical-chess-exercises.webp": [
    798,
    1198,
    []
  ],
  "/images/E-Books/cover-problem-catur-288.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-rules-of-chess.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-ruy-lopez-anti-berlin.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-sicilian-defense.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover-win-london-system.webp": [
    1024,
    1536,
    []
  ],
  "/images/E-Books/cover_6a78f8cfbde21.webp": [
    636,
    985,
    []
  ],
  "/images/E-Books/cover_6a7908e29c7a3.webp": [
    180,
    280,
    []
  ],
  "/images/E-Books/cover_6a7909a91d321.webp": [
    400,
    592,
    []
  ],
  "/images/E-Books/cover_6a790acc54608.webp": [
    1063,
    1480,
    []
  ],
  "/images/E-Books/cover_6a790b84c8bda.webp": [
    1044,
    1507,
    []
  ],
  "/images/E-Books/cover_6a790c0eeb69b.webp": [
    571,
    858,
    []
  ],
  "/images/E-Books/cover_6a790cdddb621.webp": [
    598,
    816,
    []
  ],
  "/images/E-Books/cover_6a790d7c40863.webp": [
    360,
    466,
    []
  ],
  "/images/E-Books/cover_6a790e7531e8e.webp": [
    874,
    1179,
    []
  ],
  "/images/E-Books/cover_6a790f2db969a.webp": [
    325,
    525,
    []
  ],
  "/images/E-Books/cover_6a790fc6c60d4.webp": [
    487,
    713,
    []
  ],
  "/images/E-Books/cover_6a79105f61ca2.webp": [
    467,
    712,
    []
  ],
  "/images/E-Books/cover_6a7a782fd243f.webp": [
    1057,
    1488,
    []
  ],
  "/images/E-Books/cover_6a7a78bc6909e.webp": [
    508,
    768,
    []
  ],
  "/images/E-Books/cover_6a7a79edab10c.webp": [
    485,
    703,
    []
  ],
  "/images/E-Books/cover_6a7a7a8e4c93f.webp": [
    485,
    626,
    []
  ],
  "/images/Galeri/sampel-papan-1.webp": [
    800,
    533,
    []
  ],
  "/images/Galeri/sampel-papan-2.webp": [
    800,
    534,
    []
  ],
  "/images/Galeri/sampel-turnamen-1.webp": [
    612,
    408,
    []
  ],
  "/images/Galeri/sampel-turnamen-2.webp": [
    612,
    408,
    []
  ],
  "/images/Galeri/sampel-turnamen-besar.webp": [
    1000,
    667,
    []
  ],
  "/images/PapanAnalysa.webp": [
    1600,
    1200,
    []
  ],
  "/images/ProgramKami/analisa-hero.webp": [
    1672,
    941,
    [
      828
    ]
  ],
  "/images/ProgramKami/chess_1.webp": [
    1002,
    524,
    []
  ],
  "/images/ProgramKami/chess_2.webp": [
    700,
    550,
    []
  ],
  "/images/ProgramKami/chess_4_2.webp": [
    1233,
    800,
    []
  ],
  "/images/ProgramKami/chess_5.webp": [
    1322,
    781,
    []
  ],
  "/images/ProgramKami/kuis-catur-hero.webp": [
    1672,
    941,
    [
      828
    ]
  ],
  "/images/ProgramKami/pembukaan-hero.webp": [
    1672,
    941,
    [
      828
    ]
  ],
  "/images/ProgramKami/rush-teka-teki-hero.webp": [
    1672,
    941,
    [
      828
    ]
  ],
  "/images/ProgramKami/teka-teki-hero.webp": [
    1672,
    941,
    [
      828
    ]
  ],
  "/images/Turnamen/chairs.webp": [
    60,
    57,
    []
  ],
  "/images/Turnamen/daftar.webp": [
    60,
    60,
    []
  ],
  "/images/Turnamen/hasil.webp": [
    60,
    59,
    []
  ],
  "/images/Turnamen/live.webp": [
    60,
    60,
    []
  ],
  "/images/Turnamen/skor.webp": [
    60,
    60,
    []
  ],
  "/images/buku_tulis.webp": [
    600,
    448,
    []
  ],
  "/images/harapan-terima-kasih.webp": [
    836,
    1254,
    []
  ],
  "/images/hero-about.webp": [
    1280,
    714,
    []
  ],
  "/images/landing-hero.webp": [
    1280,
    714,
    []
  ],
  "/images/landing-sorotan-media.webp": [
    960,
    640,
    []
  ],
  "/images/landing-sorotan-program.webp": [
    960,
    640,
    []
  ],
  "/images/landing-sorotan-turnamen.webp": [
    960,
    640,
    []
  ],
  "/images/logo-mark-dark.webp": [
    336,
    336,
    [
      52,
      104
    ]
  ],
  "/images/logo-mark-light.webp": [
    336,
    336,
    [
      52,
      104
    ]
  ],
  "/images/sekilas.webp": [
    1024,
    571,
    []
  ],
  "/images/stockfish.webp": [
    256,
    256,
    []
  ],
  "/images/tata-nilai.webp": [
    2172,
    724,
    []
  ],
  "/images/tonggak-2015.webp": [
    1280,
    714,
    []
  ],
  "/images/tonggak-2016.webp": [
    1280,
    714,
    []
  ],
  "/images/tonggak-2018.webp": [
    1024,
    571,
    []
  ],
  "/images/tonggak-2020.webp": [
    1280,
    714,
    []
  ],
  "/images/tonggak-2022.webp": [
    1280,
    714,
    []
  ],
  "/images/tonggak-2024.webp": [
    1280,
    714,
    []
  ]
};

export const DILEWATI = {};
