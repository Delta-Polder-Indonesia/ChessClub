/**
 * Daftar tema untuk selector Tema (grup ala NACCL, hanya tema yang benar-benar
 * ada di data soal) beserta kunci kamus label grup.
 */
export const DAFTAR_TEMA = [
  {
    grup: "tekaTeki.temaGrupSkakmat",
    isi: [
      ["backRankMate", "tekaTeki.tema.backRankMate"],
      ["smotheredMate", "tekaTeki.tema.smotheredMate"],
      ["promotion", "tekaTeki.tema.promotion"],
    ],
  },
  {
    grup: "tekaTeki.temaGrupTaktik",
    isi: [
      ["sacrifice", "tekaTeki.tema.sacrifice"],
      ["attraction", "tekaTeki.tema.attraction"],
      ["deflection", "tekaTeki.tema.deflection"],
      ["pin", "tekaTeki.tema.pin"],
      ["fork", "tekaTeki.tema.fork"],
      ["discoveredAttack", "tekaTeki.tema.discoveredAttack"],
      ["doubleCheck", "tekaTeki.tema.doubleCheck"],
      ["hangingPiece", "tekaTeki.tema.hangingPiece"],
      ["exposedKing", "tekaTeki.tema.exposedKing"],
    ],
  },
  {
    grup: "tekaTeki.temaGrupKarakteristik",
    isi: [
      ["endgame", "tekaTeki.tema.endgame"],
      ["middlegame", "tekaTeki.tema.middlegame"],
      ["opening", "tekaTeki.tema.opening"],
      ["master", "tekaTeki.tema.master"],
      ["kingsideAttack", "tekaTeki.tema.kingsideAttack"],
      ["queensideAttack", "tekaTeki.tema.queensideAttack"],
    ],
  },
];
