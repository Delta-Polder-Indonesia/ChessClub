import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../ui/accordion.jsx";
import { cn } from "@/lib/utils.js";

/**
 * Accordion siap pakai — cukup oper array `items`, markup dan gayanya
 * selalu sama di semua halaman.
 *
 * const tanyaJawab = [
 *   { judul: "Apa itu Blunder Skuad?", isi: <p>Komunitas catur…</p> },
 *   { judul: "Bagaimana cara bergabung?", isi: <p>Isi formulir…</p> },
 * ];
 *
 * <AccordionTools items={tanyaJawab} />
 *
 * Semua prop diteruskan ke <Accordion> Radix, jadi perilaku standar
 * (type="single"/"multiple", collapsible, defaultValue, …) tetap berlaku.
 * Tambahan prop khusus:
 *   - items         : array { judul, isi, value? }  (wajib)
 *   - terbukaAwal   : index item yang terbuka saat muat (untuk type="single")
 *   - itemClassName / triggerClassName / contentClassName : penyesuaian gaya
 */
export default function AccordionTools({
  items = [],
  type = "single",
  collapsible = true,
  terbukaAwal,
  className,
  itemClassName,
  triggerClassName,
  contentClassName,
  ...props
}) {
  const nilaiItem = (item, i) => item.value ?? `item-${i}`;
  const defaultValue =
    type === "single" && terbukaAwal != null && items[terbukaAwal]
      ? nilaiItem(items[terbukaAwal], terbukaAwal)
      : undefined;

  return (
    <Accordion
      type={type}
      collapsible={type === "single" ? collapsible : undefined}
      defaultValue={defaultValue}
      className={cn("flex w-full flex-col gap-4", className)}
      {...props}
    >
      {items.map((item, i) => (
        <AccordionItem
          key={nilaiItem(item, i)}
          value={nilaiItem(item, i)}
          className={itemClassName}
        >
          <AccordionTrigger className={triggerClassName}>
            {item.judul}
          </AccordionTrigger>
          <AccordionContent className={contentClassName}>
            {item.isi}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
