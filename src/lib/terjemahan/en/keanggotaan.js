/**
 * Kamus Inggris (EN) · kelompok keanggotaan — alur Keanggotaan / Pendaftaran Anggota (daftar, verifikasi akun).
 * Kunci dalam berkas: keanggotaan, verifikasi, pendaftaran.
 */

export const keanggotaan = {
    judul: "Membership",
    deskripsi:
      "Member list automatically synchronized from the BLUNDER SKUAD club on Chess.com.",
    artikel: "Member List",
    intro:
      "This list uses the public BLUNDER SKUAD roster on Chess.com. Members who have joined on Chess.com must still complete their personal-data registration on this website. This helps staff identify players, review ban history, and prevent banned players from returning with new accounts.",
    jumlah: "Total members: {jumlah}",
    dataBelumLengkap: "Website personal data is incomplete",
    dataBelumLengkapPenjelasan:
      "This account has joined BLUNDER SKUAD on Chess.com but has not completed its personal data on the community website. Personal data is kept private so staff can identify the player and match their identity if the account is banned.",
    tandaTanyaJudul: "{jumlah} members have not completed their website data",
    tandaTanyaPenjelasan:
      "A question mark beside a name means the player is already a BLUNDER SKUAD member on Chess.com but has not re-registered on the website. Re-registration securely records identity data, supports tournament checks, and helps prevent banned players from returning with a new account.",
    lengkapiData: "Complete personal data on the website",
    sumber: "Member source:",
    sumberCatatan: "The public Chess.com roster refreshes at most every 12 hours.",
    memuat: "Loading data from Chess.com…",
    menyegarkan: "Refreshing the member list from Chess.com…",
    kosongKlub: "No members could be read from the Chess.com club yet.",
    aktivitasKlub: "Club activity",
    aktivitas: {
      weekly: "Weekly active",
      monthly: "Monthly active",
      all_time: "Previously active",
    },
    kosong1: "No members registered yet. Please ",
    kosong2: "register with your Chess.com account",
    kosong3: ".",
    no: "No.",
    foto: "Photo",
    nama: "Name",
    akunHilang: "account not found",
    gagal: "failed to load",
    panggilan: "Nickname",
    kota: "City",
    klub: "Club",
    kategoriUmur: "Age Category",
    bergabung: "Joined",
    wa: "WhatsApp",
    profilJudul: "Member Profile",
    tutup: "Close",
    lihatProfil: "Click to view profile",
    terkenaBan:
      "This account is barred from community activities. Check the committee note or Chess.com status.",
    tingkatanJudul: "Rating Group Levels",
    tingkatanRentang: "Rating Range",
    tingkatanKategori: "Player Category",
    tingkatanPenjelasan: "Ability Description",
    tingkatanBuka: "Click to open the rating levels",
    tingkatanTutup: "Click to collapse the rating levels",
    tingkatan: {
      beginner: {
        label: "Beginner",
        deskripsi: "Just starting the chess journey and learning the basic movement of the pieces.",
      },
      novice: {
        label: "Novice",
        deskripsi: "Starting to learn basic tactics, protect pieces, and reduce blunders.",
      },
      intermediate: {
        label: "Intermediate",
        deskripsi: "Able to build plans, calculate two to three moves, and understand basic openings.",
      },
      advanced: {
        label: "Advanced",
        deskripsi: "Shows consistent positional understanding, mature calculation, and rarely makes fatal errors.",
      },
      expert: {
        label: "Expert",
        deskripsi: "High-level skill with deep calculation, strict time management, and mental resilience.",
      },
      master: {
        label: "Master Level",
        deskripsi: "A very strong player with comprehensive ability at national tournament level.",
      },
      elite: {
        label: "Elite / Grandmaster",
        deskripsi: "The highest class, where professional chess players compete at the world level.",
      },
    },
    nextJudul: "Member Registration",
  }

export const verifikasi = {
    judul: "Account Ownership Proof",
    penjelasan:
      "Prove that the Chess.com account you entered really belongs to you. This prevents other people from registering your account, and prevents anyone registering with someone else's account.",
    tombolLogin: "Sign in with Chess.com",
    catatanLogin:
      "You will be redirected to chess.com to sign in. We never see or store your password.",
    atau: "Or without signing in",
    tombolKode: "Verify via profile code",
    memproses: "Processing…",
    langkah1: "Open your Chess.com profile settings.",
    langkah2: "Set the Location field to this code:",
    langkah3:
      "Save your changes, then click the button below. Once verified, you may remove the code again.",
    bukaPengaturan: "Open Chess.com settings",
    sudahPasang: "I have added the code",
    memeriksa: "Checking profile…",
    belumTerbaca:
      "The code was not found yet. Make sure it is saved, then try again shortly.",
    belumTerbacaJudul: "Code not detected yet",
    belumTerbacaKet: "Make sure it is saved, then try again shortly.",
    gagalMemintaKode: "Failed to request code",
    gagalMemintaKodeKet: "A code could not be created right now. Try again shortly.",
    isiUsernameDulu: "Please enter your Chess.com username first.",
    berhasil: "Account ownership verified:",
    ganti: "Change account",
    judulKosong: "Username not filled in",
    mengerti: "Got it",
    akunTerverifikasi: "The following account is yours:",
    lanjut: "Continue",
    batal: "Cancel",

    langkahSalinJudul: "Copy your verification code",
    langkahSalinRincian: "The code below is unique to this registration.",
    langkahTempelJudul: "Paste it on your Chess.com profile",
    langkahTempelRincian:
      "Open Settings → Profile, fill the Location field with the code, then press Save.",
    langkahPeriksaJudul: "Check again here",
    langkahPeriksaRincian:
      "Press Check Code. We read your public profile to match the code.",
    kodeAnda: "Your verification code",
    salinKode: "Copy code",
    salinKodeVerifikasi: "Copy verification code",
    buatKodeBaru: "Generate new code",
    bukaPengaturanProfil: "Open Chess.com profile settings",
    menghubungi: "Contacting Chess.com and checking {username}'s profile…",
    profilTerverifikasi: "Chess.com profile verified. Continuing registration…",
    periksaKode: "Check Code",
    sedangMemeriksa: "Checking…",
    verifCepatGunakan: "Use quick verification",
    verifCepatToggle: "Can't edit your profile? Quick verification",
    tutup: "Close",
    buka: "Open",
    verifCepatKeterangan:
      "If your Chess.com profile cannot be edited yet, or the cache still holds old data, retype the code above to complete verification (manual confirmation mode).",
    kodeManual: "Manual verification code",
    phKodeCepat: "BSKUAD-XXXXXX",
    konfirmasiKode: "Confirm Code",
    catatanPrivasi:
      "We only read your public Chess.com profile. You may remove the code again once verification is complete.",
    belumTerbacaProfil:
      "The code was not detected on {username}'s profile. Make sure you pressed Save on Chess.com, then check again. Chess.com profiles can remain cached for several hours.",
    usernameKosong: "Chess.com username is still empty.",
    kodeTidakCocok:
      "The code you entered does not match. Copy the code above, then paste it back.",
    galatMemeriksa: "Failed to check the Chess.com profile.",
    galatUmum: "Verification failed. Try again.",

    profilUsernameKosong: "Username is still empty.",
    profilUsernameSah:
      "Username may only contain letters, numbers, hyphens, or underscores (3–30 characters).",
    profilTidakDitemukan: "Username \"{username}\" was not found on Chess.com.",
    profilDitolak: "Chess.com rejected the request (code {kode}). Try again shortly.",
    profilTimeout: "The connection to Chess.com timed out. Check your network, then try again.",
    profilJaringan: "Chess.com cannot be reached from this device.",
    profilGagalMuat: "The profile could not be loaded.",
    oauthGagal: "Chess.com verification failed: {sebab}",
  }

export const pendaftaran = {
    judul: "Member Registration",
    parent: "Membership",
    deskripsi:
      "Complete your administrative details and verify your Chess.com account after joining the BLUNDER SKUAD club.",
    artikel: "Complete Member Details",
    intro:
      "The site's member list is automatically taken from the BLUNDER SKUAD club roster on Chess.com. Complete this form after your account is in the club for verification and additional administration. The system ensures one person uses one account, and accounts closed by Chess.com for fair play violations cannot take part in community activities.",
    klubWajibJudul: "Join the club first",
    klubWajibIsi:
      "Your username must already be a BLUNDER SKUAD member on Chess.com. The Chess.com roster can take up to 12 hours to refresh.",
    gabungKlub: "Open the BLUNDER SKUAD club on Chess.com",
    label: "Chess.com Username",
    placeholder: "e.g.: hikaru",
    wajib: "Enter your Chess.com username.",
    memeriksa: "Checking Chess.com account…",
    daftar: "Register",
    nextJudul: "Membership List",
    linkDaftar: "membership list",

    privasiJudul: "Your personal data is safe",
    privasiIsi:
      "Your full name, phone/WhatsApp number, and DANA number are stored only in the committee's records and are never shown on the site. Only your nickname, city, and Chess.com statistics are public. We use this data to verify that each person holds only one membership.",

    grupAkun: "Chess.com Account",
    grupDiri: "Personal Details",
    grupKontak: "Contact & Payment",

    catatanUsername:
      "Use the username or chess.com/member/yourname profile link that has joined BLUNDER SKUAD.",

    labelNama: "Full Name",
    phNama: "e.g.: Budi Santoso",
    catatanNama: "As per official ID, for certificates and tournament prizes.",

    labelPanggilan: "Nickname",
    phPanggilan: "e.g.: Budi",
    catatanPanggilan: "Used by the committee for administration and tournaments.",

    labelLahir: "Date of Birth",
    catatanLahir: "Used to determine your tournament age category.",
    kategori: "Category",
    tahun: "years old",

    labelKota: "City of Origin",
    phKota: "e.g.: Medan",
    catatanKota: "For regional grouping in the inter-community league.",

    labelHp: "Phone / WhatsApp Number",
    phHp: "e.g.: 0812-3456-7890",
    catatanHp:
      "An active WhatsApp number, for tournament invitations and verification.",
    terbaca: "Read as",

    labelDana: "DANA Number",
    phDana: "leave blank if same as phone number",
    catatanDana: "For sending tournament prizes.",

    labelEmail: "Email",
    phEmail: "e.g.: budi@email.com",
    catatanEmail: "For official announcements from the staff.",

    labelKlub: "Club / Home Community",
    phKlub: "e.g.: Medan Chess Club",
    catatanKlub: "If you already belong to another club.",

    setuju:
      "I declare that the data above is correct, that this is my only account in the community, and I agree to the Community Code of Ethics — including the prohibition on using engine assistance.",

    penutup:
      "By completing this registration, you are recorded as a Blunder Skuad member and will be redirected back to the Membership page.",

    periksaIsian: "Please review the fields marked in red.",
    galatUsername: "Chess.com username is required.",
    galatNama: "Enter your full name (at least two words).",
    galatPanggilan: "Nickname is required.",
    galatHp: "Invalid phone/WhatsApp number. Example: 0812-3456-7890.",
    galatDana: "Invalid DANA number.",
    galatKota: "City of origin is required.",
    galatLahir: "Date of birth is required.",
    galatLahirAneh: "That date of birth is not plausible.",
    galatEmail: "Invalid email format.",
    galatSetuju: "You must agree to the community code of ethics.",

    brandLine2: "INDONESIA",
    subjudulAkun:
      "Use your Chess.com account. Your registration data will be stored securely by the Indonesia Chess Community.",
    labelUsernameAkun: "Full Name / Username",
    phUsername: "Chess.com Username",
    mencariProfil: "Searching Chess.com profile…",
    profilGagalLanjut:
      "Check the username spelling, or continue if the profile was just created.",
    pengikut: "followers",
    profil: "Profile",
    catatanRoster:
      "Your username must already be listed as a Blunder Skuad member on Chess.com. The Chess.com roster can take up to 12 hours to refresh.",
    bukaKlub: "Open the Blunder Skuad club on Chess.com",
    berikutnya: "Next",
    verifJudul: "Verify it's you",
    verifDeskripsi:
      "To help keep your account secure, we want to make sure it is really you who is trying to register.",
    ubah: "Change",
    verifTanpaSandi:
      "We never ask for your Chess.com password. Verification is done simply by pasting a one-time code onto your public profile.",
    verifLewatKode: "Verify via profile code",
    verifBerhasil: "Verification Successful!",
    akunSiap:
      "Account {username} is verified and ready to continue member registration.",
    gantiAkun: "Change Account",
    lanjutkanPendaftaran: "Continue Registration",
    judulDataDiri: "Personal Details",
    deskDataDiri:
      "Fill in one item per step. Data is kept private by the committee for administration and tournaments.",
    judulNama: "Your Full Name",
    judulPanggilan: "Your Nickname",
    judulKota: "Your City of Origin",
    judulEmail: "Email Address",
    judulKontak: "Contact & Payment",
    deskKontak:
      "Fill in one item per step. Phone/WhatsApp and DANA numbers are kept only in the committee's records and are never shown on the site.",
    langkahDari: "Step {n} of {total}",
    kembali: "Back",
    lanjutkan: "Continue",
    selesai: "Finish",
    lewati: "Skip",
    opsional: "(optional)",
    toastDiriSelesai: "Personal details complete. Moving on to Contact & Payment...",
    toastKontakSelesai: "Contact details complete. Review everything, then submit your registration.",
    finalIdle: "All data is complete. Click the button to submit your registration.",
    finalSukses:
      "Welcome, {username}. You are now recorded as a Blunder Skuad member.",
    finalGagal: "Something went wrong while submitting. Try again.",
    mendaftarkan: "Registering member...",
    pendaftaranBerhasil: "Registration Successful!",
    pendaftaranGagal: "Registration Failed",
    keluarGantiAkun: "Sign Out / Change Account",
    ulangiAwal: "Start Over",
    cobaLagi: "Try Again",
    kirimPendaftaran: "Submit Registration",
    hakCipta:
      "© {tahun} Indonesia Chess Community · Blunder Skuad. Registrations are processed by the club committee.",
    tautanKlub: "Chess.com Club",

    spinnerMemproses: "Processing...",
    spinnerBerhasil: "Success",
    spinnerGagal: "Failed",
    spinnerStatus: "Status",
  }
