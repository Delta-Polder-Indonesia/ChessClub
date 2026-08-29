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
  "/images/E-Books/cover-101-prinsip-dasar.webp": [
    1024,
    1536,
    [
      320,
      640
    ]
  ],
  "/images/E-Books/cover-caro-kann-defense.webp": [
    1024,
    1536,
    [
      320,
      640
    ]
  ],
  "/images/E-Books/cover-mastering-chess-middle-game.webp": [
    614,
    921,
    [
      320
    ]
  ],
  "/images/E-Books/cover-practical-chess-exercises.webp": [
    798,
    1198,
    [
      320,
      640
    ]
  ],
  "/images/E-Books/cover-ruy-lopez-anti-berlin.webp": [
    1024,
    1536,
    [
      320,
      640
    ]
  ],
  "/images/E-Books/cover-sicilian-defense.webp": [
    1024,
    1536,
    [
      320,
      640
    ]
  ],
  "/images/E-Books/cover-win-london-system.webp": [
    1024,
    1536,
    [
      320,
      640
    ]
  ],
  "/images/E-Books/cover_6a78f8cfbde21.webp": [
    636,
    985,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a7909a91d321.webp": [
    400,
    592,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a790acc54608.webp": [
    1063,
    1480,
    [
      320,
      640
    ]
  ],
  "/images/E-Books/cover_6a790b84c8bda.webp": [
    1044,
    1507,
    [
      320,
      640
    ]
  ],
  "/images/E-Books/cover_6a790c0eeb69b.webp": [
    571,
    858,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a790cdddb621.webp": [
    598,
    816,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a790d7c40863.webp": [
    360,
    466,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a790e7531e8e.webp": [
    874,
    1179,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a790fc6c60d4.webp": [
    487,
    713,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a79105f61ca2.webp": [
    467,
    712,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a7a782fd243f.webp": [
    1057,
    1488,
    [
      320,
      640
    ]
  ],
  "/images/E-Books/cover_6a7a78bc6909e.webp": [
    508,
    768,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a7a79edab10c.webp": [
    485,
    703,
    [
      320
    ]
  ],
  "/images/E-Books/cover_6a7a7a8e4c93f.webp": [
    485,
    626,
    [
      320
    ]
  ],
  "/images/chesscomlogo.webp": [
    1000,
    304,
    [
      520
    ]
  ],
  "/images/harapan-terima-kasih.webp": [
    836,
    1120,
    [
      640
    ]
  ],
  "/images/hero-about.webp": [
    1280,
    714,
    [
      828
    ]
  ],
  "/images/landing-hero.webp": [
    1280,
    714,
    [
      828
    ]
  ],
  "/images/landing-sorotan-media.webp": [
    960,
    640,
    [
      640
    ]
  ],
  "/images/landing-sorotan-program.webp": [
    960,
    640,
    [
      640
    ]
  ],
  "/images/landing-sorotan-turnamen.webp": [
    960,
    640,
    [
      640
    ]
  ],
  "/images/logo-mark-dark.webp": [
    336,
    336,
    [
      200
    ]
  ],
  "/images/logo-mark-light.webp": [
    336,
    336,
    [
      200
    ]
  ],
  "/images/sekilas.webp": [
    1024,
    571,
    [
      828
    ]
  ],
  "/images/tata-nilai.webp": [
    1280,
    714,
    [
      828
    ]
  ],
  "/images/tonggak-2015.webp": [
    1280,
    714,
    [
      828
    ]
  ],
  "/images/tonggak-2016.webp": [
    1280,
    714,
    [
      828
    ]
  ],
  "/images/tonggak-2018.webp": [
    1024,
    571,
    [
      828
    ]
  ],
  "/images/tonggak-2020.webp": [
    1280,
    714,
    [
      828
    ]
  ],
  "/images/tonggak-2022.webp": [
    1280,
    714,
    [
      828
    ]
  ],
  "/images/tonggak-2024.webp": [
    1280,
    714,
    [
      828
    ]
  ]
};

export const DILEWATI = {
  "/images/E-Books/cover_6a790e7531e8e.webp": [
    640
  ]
};
