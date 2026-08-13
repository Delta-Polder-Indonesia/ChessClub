import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HalamanIsi, PageArtikel } from "../../components/PageBagian.jsx";
import {
  daftarDenganChessCom,
  normalisasiUsername,
} from "../../lib/chessAnggota.js";

export default function PendaftaranAnggota() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("idle");
  const [pesan, setPesan] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    const uname = normalisasiUsername(username);
    if (!uname) {
      setPesan("Masukkan username Chess.com.");
      setStatus("gagal");
      return;
    }
    setStatus("mengirim");
    setPesan("");
    try {
      await daftarDenganChessCom(uname);
      setStatus("sukses");
      navigate("/keanggotaan");
    } catch (err) {
      setStatus("gagal");
      setPesan(err.message);
    }
  };

  return (
    <HalamanIsi
      title="Pendaftaran Anggota"
      parent="Keanggotaan"
      parentPath="/keanggotaan"
      description="Daftar dengan username akun Chess.com. Setelah terverifikasi, nama Anda masuk otomatis ke daftar keanggotaan beserta Elo dan rekor W/D/L."
      next={{
        to: "/keanggotaan",
        judul: "Daftar Keanggotaan",
      }}
    >
      <PageArtikel title="Daftar dengan Chess.com">
        <p className="ql-align-justify">
          Isi username Chess.com Anda (boleh username saja, atau tautan profil
          seperti https://www.chess.com/member/namaanda). Sistem memeriksa akun
          ke Chess.com. Jika akun ada, Anda langsung tercatat di{" "}
          <Link to="/keanggotaan">daftar keanggotaan</Link>.
        </p>

        <form className="flex flex-col gap-6 max-w-xl" onSubmit={onSubmit}>
          <label className="flex flex-col gap-2 text-sm text-grey-800">
            Username Chess.com
            <input
              required
              name="username"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="contoh: hikaru"
              className="border-0 border-b border-solid border-grey-200 outline-none py-2 text-base bg-transparent"
            />
          </label>
          {status === "gagal" && pesan && <p>{pesan}</p>}
          <button
            type="submit"
            disabled={status === "mengirim"}
            className="self-start text-xs rounded-full px-4 py-2 border border-solid border-primary text-primary disabled:opacity-50"
          >
            {status === "mengirim"
              ? "Memeriksa akun Chess.com…"
              : "Daftar"}
          </button>
        </form>
      </PageArtikel>
    </HalamanIsi>
  );
}
