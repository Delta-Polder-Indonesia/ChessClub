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
    isiUsernameDulu: "Please enter your Chess.com username first.",
    berhasil: "Account ownership verified:",
    ganti: "Change account",
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
  }
