/**
 * Kamus Inggris (EN) · kelompok beranda — halaman Beranda (hero & menu lengket).
 * Kunci dalam berkas: hero, sticky, beranda.
 */

export const hero = {
    tentangKami: "About Us",
    deskripsi:
      "Explore the history, vision, and mission of our community that form the foundation of our activities, the logo philosophy, and the board structure supporting the development of chess in Indonesia.",
  }

/**
 * Loading/error/empty states for the Beranda area tabs (schedule,
 * announcement summary, leaderboard). Tab titles & articles stay local.
 */
export const beranda = {
    jadwalMemuat: "Loading schedule…",
    jadwalGagal:
      "The schedule cannot be loaded right now. Please try again shortly.",
    jadwalKosong: "No tournament schedule has been published yet.",
    rangkumanMemuat: "Loading announcements…",
    rangkumanGagal:
      "Announcements cannot be loaded right now. Please try again shortly.",
    rangkumanKosong: "No announcements yet.",
    peringkatMemuat: "Loading member data…",
    peringkatMenyegarkan: "Refreshing player data from Chess.com…",
    peringkatGagal:
      "Member data cannot be loaded right now. Please try again shortly.",
    peringkatKosong1: "No members could be read from the ",
    peringkatKosong2: ".",
    peringkatJumlah: "{jumlah} players",
    muatUlang: "Reload",
    peringkatKlubJudul: "Member Ratings",
    peringkatKlubDeskripsi: "Explore BLUNDER SKUAD club members by Chess.com rating. Choose a time control to compare players.",
    peringkatKlubEyebrow: "Club ratings · Chess.com",
    peringkatKlubPemainTeratas: "Top-rated member",
    peringkatKlubTeratasDalam: "Highest rating · {kontrol}",
    peringkatKlubRatingTeratas: "Rating",
    peringkatKlubRekorSepanjangMasa: "All-time record",
    peringkatKlubJumlahAnggota: "Club members",
    peringkatKlubPunyaRating: "Rated · {kontrol}",
    peringkatKlubSumber: "Members come from the Chess.com club roster. Ratings reflect the profile data available at the last refresh.",
    peringkatKlubPapanJudul: "Leaderboard",
    peringkatKlubCari: "Search players",
    peringkatKlubCariPlaceholder: "Name or username",
    peringkatKlubPilihKontrol: "Time control",
    peringkatKlubKontrolLainnya: "Other controls",
    peringkatKlubDiperbaruiJudul: "Updated",
    peringkatKlubTanpaRating: "Unrated",
    peringkatKlubPilihCakupan: "Member scope",
    peringkatKlubUtama: "Primary",
    peringkatKlubSemua: "All members",
    peringkatKlubHanyaRating: "Rated only",
    peringkatKlubTidakAdaHasil: "No members match this search.",
    peringkatKlubKolUrutanRating: "Rank and rating",
    peringkatKlubGrafikRapid: "Rapid rating chart for {nama}: {jumlah} games, {dari} to {sampai}, rating {awal} to {akhir}.",
    peringkatKlubGrafikRapidMemuat: "Loading Rapid rating history for {nama}",
    peringkatKlubGrafikRapidKosong: "Not enough Rapid history for a chart for {nama}",
    peringkatKlubGrafikRapidGagal: "Rapid rating history for {nama} could not be loaded; reopen the Rapid tab to try again",
    peringkatKlubKolPemain: "Player",
    peringkatKlubNegara: "Chess.com profile country",
    peringkatKlubBendera: "Flag of {negara}",
    peringkatKlubUmur: "Age",
    peringkatKlubKolRating: "Rating · {kontrol}",
    peringkatKlubKolRekor: "Win / draw / loss",
    peringkatKlubKolPuncak: "Peak",
    peringkatKlubDataTidakTersedia: "Data unavailable",
    peringkatKlubBelumAdaRating: "Unrated",
    peringkatKlubTanpaUsername: "No Chess.com username",
    peringkatKlubProfil: "Profile",
    peringkatKlubLihatProfil: "View Chess.com profile for {username}",
    peringkatKlubLihatChessCom: "View player profile on Chess.com",
    peringkatKlubDiperbarui: "Roster updated {tanggal}",
    peringkatKlubCatatanRating: "Players are ranked by the selected time-control rating. Primary uses the main rating available; W/D/L follows the selected control and combines all controls when Primary is selected. The Rapid chart uses up to 20 rated games from the three months ending with the last Rapid game; points follow game order and the scale adjusts to each player's rating. Chart and roster values may differ because they are updated separately. A dash means there is insufficient history or loading failed. History for other controls is not available.",
    peringkatKlubCatatanNegara: "Flags and country codes follow each Chess.com profile's selection; ages are not available.",
  }

export const sticky = {
    sekilasKomunitas: "Community Overview",
    tonggakSejarah: "Historical Milestones",
    visiMisiNilai: "Vision, Mission & Values",
    maknaLogo: "Logo Meaning",
    strukturPengurus: "Board Structure",
  }
