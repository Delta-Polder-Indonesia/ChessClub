/**
 * Suara papan untuk halaman Analisa.
 *
 * Aslinya Brilliant-Chess memakai `howler` + berkas MP3 dari Lichess
 * (AGPL-3.0). Supaya tidak menambah dependensi maupun aset berlisensi copyleft
 * ke bundel situs, bunyinya dibangkitkan dengan Web Audio API: bentuk
 * gelombangnya singkat (klik kayu / sentakan) dan ukurannya nol byte.
 *
 * API-nya sengaja meniru subset Howl yang dipakai komponen papan:
 *   const suara = buatSuara("capture"); suara.play();
 *
 * Bila peramban tidak mendukung Web Audio, semua panggilan jadi noop —
 * analisis tetap berjalan, hanya tanpa bunyi.
 */

let ctx = null;

function konteksAudio() {
  if (typeof window === "undefined") return null;
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  ctx ||= new AudioCtx();
  // Peramban membekukan AudioContext sampai ada interaksi pengguna.
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

/** Nada pendek dengan sampul (envelope) eksponensial — inti semua bunyi di sini. */
function nada({ frekuensi, durasi, bentuk = "triangle", volume, sapuan = 1, tunda = 0 }) {
  const audio = konteksAudio();
  if (!audio) return;
  const mulai = audio.currentTime + tunda;
  const osc = audio.createOscillator();
  const amplop = audio.createGain();
  osc.type = bentuk;
  osc.frequency.setValueAtTime(frekuensi, mulai);
  if (sapuan !== 1) osc.frequency.exponentialRampToValueAtTime(frekuensi * sapuan, mulai + durasi);
  amplop.gain.setValueAtTime(0.0001, mulai);
  amplop.gain.linearRampToValueAtTime(volume, mulai + 0.006);
  amplop.gain.exponentialRampToValueAtTime(0.0001, mulai + durasi);
  osc.connect(amplop).connect(audio.destination);
  osc.start(mulai);
  osc.stop(mulai + durasi + 0.02);
}

/** Desakan berderak (noise) — dipakai untuk suara makan bidak. */
function derak({ durasi = 0.12, volume = 0.5, tunda = 0, lolos = 900 }) {
  const audio = konteksAudio();
  if (!audio) return;
  const mulai = audio.currentTime + tunda;
  const jumlahSampel = Math.max(1, Math.floor(audio.sampleRate * durasi));
  const bantalan = audio.createBuffer(1, jumlahSampel, audio.sampleRate);
  const kanal = bantalan.getChannelData(0);
  for (let i = 0; i < jumlahSampel; i++) {
    const peluruhan = 1 - i / jumlahSampel;
    kanal[i] = (Math.random() * 2 - 1) * peluruhan * peluruhan;
  }
  const sumber = audio.createBufferSource();
  sumber.buffer = bantalan;
  const tapis = audio.createBiquadFilter();
  tapis.type = "lowpass";
  tapis.frequency.value = lolos;
  const amplop = audio.createGain();
  amplop.gain.value = volume;
  sumber.connect(tapis).connect(amplop).connect(audio.destination);
  sumber.start(mulai);
}

/** Pola bunyi — kunci = nama berkas MP3 aslinya, agar mudah ditukar suatu hari. */
const POLA = {
  "move-self": () => nada({ frekuensi: 330, durasi: 0.07, volume: 0.5 }),
  "move-opponent": () => nada({ frekuensi: 250, durasi: 0.07, volume: 0.42 }),
  capture: () => {
    derak({ durasi: 0.14, volume: 0.6, lolos: 1200 });
    nada({ frekuensi: 150, durasi: 0.1, volume: 0.35, bentuk: "square", sapuan: 0.7 });
  },
  castle: () => {
    nada({ frekuensi: 320, durasi: 0.06, volume: 0.45 });
    nada({ frekuensi: 300, durasi: 0.06, volume: 0.45, tunda: 0.09 });
  },
  "move-check": () => nada({ frekuensi: 520, durasi: 0.16, volume: 0.5, sapuan: 1.55 }),
  "game-start": () => {
    nada({ frekuensi: 420, durasi: 0.1, volume: 0.35 });
    nada({ frekuensi: 630, durasi: 0.14, volume: 0.35, tunda: 0.11 });
  },
  "game-end": () => {
    nada({ frekuensi: 480, durasi: 0.12, volume: 0.3, sapuan: 0.7 });
    nada({ frekuensi: 300, durasi: 0.2, volume: 0.3, sapuan: 0.6, tunda: 0.14 });
  },
  illegal: () => nada({ frekuensi: 180, durasi: 0.09, volume: 0.3, bentuk: "square", sapuan: 0.8 }),
};

/**
 * Buat satu "sound". Argumen `volume` mengikuti opsi Howl sehingga pemanggil
 * lama tidak perlu diubah banyak.
 */
export class Suara {
  constructor(nama, { volume = 1 } = {}) {
    this.nama = nama;
    this.volume = volume;
  }

  play() {
    const pola = POLA[this.nama];
    if (!pola) return;
    try {
      pola();
    } catch {
      /* audio tidak tersedia — abaikan, analisis tidak boleh gagal karena bunyi */
    }
  }

  stop() {
    /* bunyi sengaja singkat: tidak ada yang perlu dihentikan */
  }
}

export function buatSuara(nama, opsi) {
  return new Suara(nama, opsi);
}
