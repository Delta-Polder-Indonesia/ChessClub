/**
 * Empat dialog konfirmasi Database: ekspor kosong, hapus partai, hapus
 * koleksi, dan kosongkan seluruh basis data.
 *
 * Semuanya dikendalikan state di `layarDatabase.jsx`; berkas ini hanya
 * memindahkan markup-nya. `container` tetap diteruskan agar dialog ikut tema
 * gelap Analisa (lihat `wadahDialog` di layar).
 */
import { useI18n } from "../../../../../lib/i18n.jsx";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../../components/ui/alert-dialog.jsx";

export default function DialogDatabase({
  wadahDialog,
  dialogEksporKosong,
  setDialogEksporKosong,
  dialogHapusPartai,
  setDialogHapusPartai,
  setTargetHapusPartai,
  tanganiHapusPartai,
  dialogHapusKoleksi,
  setDialogHapusKoleksi,
  koleksiHapus,
  totalPartai,
  konfirmasiHapusKoleksi,
  dialogKosongkanSemua,
  setDialogKosongkanSemua,
  konfirmasiKosongkanSemua,
}) {
  const { t } = useI18n();

  return (
    <>
      <AlertDialog open={dialogEksporKosong} onOpenChange={setDialogEksporKosong}>
  <AlertDialogContent container={wadahDialog} className="bg-[#1e1d1c] border-[#5d5d5d] text-[#dedede] shadow-2xl">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-white">
        Tidak ada partai untuk diekspor
      </AlertDialogTitle>
      <AlertDialogDescription className="text-[#939291]">
        Tarik data terlebih dahulu di layar Akun untuk mendapatkan partai
        yang ingin diekspor.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogAction className="bg-[#81b64c] hover:bg-[#8bc550] text-black font-bold">Mengerti</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* ── Konfirmasi hapus partai ── */}
<AlertDialog
  open={dialogHapusPartai}
  onOpenChange={(o) => {
    setDialogHapusPartai(o);
    if (!o) setTargetHapusPartai(null);
  }}
>
  <AlertDialogContent container={wadahDialog} className="bg-[#1e1d1c] border-[#5d5d5d] text-[#dedede] shadow-2xl">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-white">
        {t("analisa.basisData.hapusPartai")}
      </AlertDialogTitle>
      <AlertDialogDescription className="text-[#939291]">
        {t("analisa.basisData.konfirmasiHapusPartai")}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="bg-[#2a2a2a] border-[#5d5d5d] text-[#dedede] hover:bg-[#3a3a3a] hover:text-white">Batal</AlertDialogCancel>
      <AlertDialogAction onClick={tanganiHapusPartai} className="bg-[#81b64c] hover:bg-[#8bc550] text-black font-bold">
        Hapus
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* ── Konfirmasi hapus koleksi ── */}
<AlertDialog
  open={Boolean(dialogHapusKoleksi)}
  onOpenChange={(o) => {
    if (!o) setDialogHapusKoleksi(null);
  }}
>
  <AlertDialogContent container={wadahDialog} className="bg-[#1e1d1c] border-[#5d5d5d] text-[#dedede] shadow-2xl">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-white">
        {t("analisa.basisData.hapusKoleksi")}
      </AlertDialogTitle>
      <AlertDialogDescription className="text-[#939291]">
        {t("analisa.basisData.konfirmasiHapusKoleksi", {
          koleksi: koleksiHapus?.label || dialogHapusKoleksi,
          jumlah: koleksiHapus?.jumlahPartai || totalPartai,
        })}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="bg-[#2a2a2a] border-[#5d5d5d] text-[#dedede] hover:bg-[#3a3a3a] hover:text-white">Batal</AlertDialogCancel>
      <AlertDialogAction onClick={konfirmasiHapusKoleksi} className="bg-[#81b64c] hover:bg-[#8bc550] text-black font-bold">
        Hapus
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

{/* ── Konfirmasi kosongkan seluruh basis data ── */}
<AlertDialog open={dialogKosongkanSemua} onOpenChange={setDialogKosongkanSemua}>
  <AlertDialogContent container={wadahDialog} className="bg-[#1e1d1c] border-[#5d5d5d] text-[#dedede] shadow-2xl">
    <AlertDialogHeader>
      <AlertDialogTitle className="text-white">
        {t("analisa.basisData.hapusSemua")}
      </AlertDialogTitle>
      <AlertDialogDescription className="text-[#939291]">
        {t("analisa.basisData.konfirmasiHapusSemua")}
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="bg-[#2a2a2a] border-[#5d5d5d] text-[#dedede] hover:bg-[#3a3a3a] hover:text-white">Batal</AlertDialogCancel>
      <AlertDialogAction onClick={konfirmasiKosongkanSemua} className="bg-[#81b64c] hover:bg-[#8bc550] text-black font-bold">
        Hapus Semua
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </>
  );
}
