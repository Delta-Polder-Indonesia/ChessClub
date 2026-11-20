import { useEffect, useId } from "react";

/**
 * Mengganti tooltip native dari atribut title dengan satu tampilan bersama.
 * Event delegation menjaga dukungan untuk elemen yang dirender secara dinamis.
 */
export default function GlobalTitleTooltip() {
  const idTooltip = `global-title-tooltip-${useId()}`;

  useEffect(() => {
    let elemenTooltip = null;
    let aktif = null;
    let pemicuPointer = null;
    let pemicuFokus = null;
    let pewaktuSembunyi = null;
    let idFrame = null;

    const SELEKTOR = "[title], [data-title-saved]";
    const ambilTeks = (elemen) =>
      elemen?.getAttribute?.("title") ?? elemen?.getAttribute?.("data-title-saved") ?? "";
    const cariPemicu = (elemen) => elemen?.closest?.(SELEKTOR) || null;

    function pastikanElemen() {
      if (elemenTooltip) return elemenTooltip;

      elemenTooltip = document.createElement("div");
      elemenTooltip.id = idTooltip;
      elemenTooltip.className = "aegov-tooltip";
      elemenTooltip.setAttribute("role", "tooltip");
      elemenTooltip.style.position = "fixed";
      elemenTooltip.style.left = "0";
      elemenTooltip.style.top = "0";
      elemenTooltip.style.pointerEvents = "none";
      elemenTooltip.style.opacity = "0";
      elemenTooltip.style.visibility = "hidden";
      elemenTooltip.style.zIndex = "9999";
      elemenTooltip.style.transition = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
        ? "none"
        : "opacity 120ms ease";
      document.body.appendChild(elemenTooltip);
      return elemenTooltip;
    }

    function batalkanFrame() {
      if (idFrame === null) return;
      cancelAnimationFrame(idFrame);
      idFrame = null;
    }

    function pulihkanTarget() {
      if (!aktif) return;

      const { pemicu, judulAsli } = aktif;
      aktif = null;

      if (pemicu.getAttribute("data-title-saved") === judulAsli) {
        pemicu.removeAttribute("data-title-saved");
      }
      // Jangan menimpa title baru yang mungkin sudah ditulis React saat tooltip aktif.
      if (!pemicu.hasAttribute("title")) {
        pemicu.setAttribute("title", judulAsli);
      }

      const daftarId = (pemicu.getAttribute("aria-describedby") || "")
        .split(/\s+/)
        .filter((id) => id && id !== idTooltip);
      if (daftarId.length) pemicu.setAttribute("aria-describedby", daftarId.join(" "));
      else pemicu.removeAttribute("aria-describedby");
    }

    function sembunyikan() {
      pulihkanTarget();
      batalkanFrame();

      if (pewaktuSembunyi !== null) clearTimeout(pewaktuSembunyi);
      pewaktuSembunyi = null;

      if (!elemenTooltip) return;
      elemenTooltip.style.opacity = "0";
      pewaktuSembunyi = setTimeout(() => {
        pewaktuSembunyi = null;
        if (!aktif && elemenTooltip) {
          elemenTooltip.style.visibility = "hidden";
          elemenTooltip.textContent = "";
        }
      }, 120);
    }

    function aturPosisi(pemicu) {
      const elemen = pastikanElemen();

      if (pewaktuSembunyi !== null) clearTimeout(pewaktuSembunyi);
      pewaktuSembunyi = null;
      batalkanFrame();

      idFrame = requestAnimationFrame(() => {
        idFrame = null;
        if (!aktif || aktif.pemicu !== pemicu || !pemicu.isConnected || !elemenTooltip) return;

        const batasElemen = pemicu.getBoundingClientRect();
        const lebar = elemenTooltip.offsetWidth;
        const tinggi = elemenTooltip.offsetHeight;
        const batasKanan = document.documentElement.clientWidth || window.innerWidth;
        const batasBawah = document.documentElement.clientHeight || window.innerHeight;
        const jarak = 8;

        let left = batasElemen.left + batasElemen.width / 2 - lebar / 2;
        left = Math.max(jarak, Math.min(left, batasKanan - lebar - jarak));

        let top = batasElemen.top - tinggi - jarak;
        if (top < jarak) top = batasElemen.bottom + jarak;
        if (top + tinggi > batasBawah - jarak) {
          top = Math.max(jarak, batasBawah - tinggi - jarak);
        }

        elemen.style.left = `${left}px`;
        elemen.style.top = `${top}px`;
        elemen.style.visibility = "visible";
        elemen.style.opacity = "1";
      });
    }

    function tampilkan(pemicu) {
      const teks = ambilTeks(pemicu);
      if (!teks.trim()) return;

      if (aktif?.pemicu === pemicu) {
        const judulBaru = pemicu.getAttribute("title");
        if (judulBaru !== null) {
          aktif.judulAsli = judulBaru;
          pemicu.setAttribute("data-title-saved", judulBaru);
          pemicu.removeAttribute("title");
        }
        elemenTooltip.textContent = teks;
        aturPosisi(pemicu);
        return;
      }

      pulihkanTarget();
      if (pewaktuSembunyi !== null) clearTimeout(pewaktuSembunyi);
      pewaktuSembunyi = null;
      batalkanFrame();

      const judulAsli = pemicu.getAttribute("title");
      if (judulAsli === null) return;

      pemicu.setAttribute("data-title-saved", judulAsli);
      pemicu.removeAttribute("title");

      const daftarId = new Set(
        (pemicu.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean),
      );
      daftarId.add(idTooltip);
      pemicu.setAttribute("aria-describedby", [...daftarId].join(" "));

      aktif = { pemicu, judulAsli: judulAsli };
      const elemen = pastikanElemen();
      elemen.textContent = teks;
      elemen.style.visibility = "hidden";
      elemen.style.opacity = "0";
      aturPosisi(pemicu);
    }

    function perbaruiTargetAktif() {
      if (pemicuPointer && !pemicuPointer.isConnected) pemicuPointer = null;
      if (pemicuFokus && !pemicuFokus.isConnected) pemicuFokus = null;

      const pemicu = pemicuFokus || pemicuPointer;
      if (pemicu) tampilkan(pemicu);
      else sembunyikan();
    }

    function saatPointerMasuk(e) {
      const pemicu = cariPemicu(e.target);
      if (!pemicu || pemicu === pemicuPointer) return;
      pemicuPointer = pemicu;
      perbaruiTargetAktif();
    }

    function saatPointerKeluar(e) {
      const dari = cariPemicu(e.target);
      const ke = cariPemicu(e.relatedTarget);
      if (dari === ke) return;
      if (dari && dari === pemicuPointer) {
        pemicuPointer = ke;
        perbaruiTargetAktif();
      }
    }

    function saatFokusMasuk(e) {
      pemicuFokus = cariPemicu(e.target);
      perbaruiTargetAktif();
    }

    function saatFokusKeluar(e) {
      const dari = cariPemicu(e.target);
      const ke = cariPemicu(e.relatedTarget);
      if (dari === ke) return;
      if (dari && dari === pemicuFokus) {
        pemicuFokus = ke;
        perbaruiTargetAktif();
      }
    }

    function saatGulirAtauUbahUkuran() {
      if (!aktif) return;
      if (!aktif.pemicu.isConnected) {
        if (pemicuPointer === aktif.pemicu) pemicuPointer = null;
        if (pemicuFokus === aktif.pemicu) pemicuFokus = null;
        perbaruiTargetAktif();
        return;
      }
      aturPosisi(aktif.pemicu);
    }

    document.addEventListener("pointerover", saatPointerMasuk, true);
    document.addEventListener("pointerout", saatPointerKeluar, true);
    document.addEventListener("focusin", saatFokusMasuk, true);
    document.addEventListener("focusout", saatFokusKeluar, true);
    window.addEventListener("scroll", saatGulirAtauUbahUkuran, true);
    window.addEventListener("resize", saatGulirAtauUbahUkuran);

    const pengamat = new MutationObserver(() => {
      let pemicuTerputus = false;
      if (pemicuPointer && !pemicuPointer.isConnected) {
        pemicuPointer = null;
        pemicuTerputus = true;
      }
      if (pemicuFokus && !pemicuFokus.isConnected) {
        pemicuFokus = null;
        pemicuTerputus = true;
      }
      if (pemicuTerputus) perbaruiTargetAktif();
    });
    pengamat.observe(document.body, { childList: true, subtree: true });

    return () => {
      document.removeEventListener("pointerover", saatPointerMasuk, true);
      document.removeEventListener("pointerout", saatPointerKeluar, true);
      document.removeEventListener("focusin", saatFokusMasuk, true);
      document.removeEventListener("focusout", saatFokusKeluar, true);
      window.removeEventListener("scroll", saatGulirAtauUbahUkuran, true);
      window.removeEventListener("resize", saatGulirAtauUbahUkuran);
      pengamat.disconnect();
      batalkanFrame();
      if (pewaktuSembunyi !== null) clearTimeout(pewaktuSembunyi);
      pewaktuSembunyi = null;
      pulihkanTarget();
      if (elemenTooltip?.parentNode) elemenTooltip.parentNode.removeChild(elemenTooltip);
      elemenTooltip = null;
    };
  }, [idTooltip]);

  return null;
}
