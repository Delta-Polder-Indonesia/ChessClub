import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils.js";

/**
 * Accordion gaya neobrutalism (port dari neobrutalism.dev, disesuaikan
 * dengan palet biru #0B2F9F dan bayangan keras khas situs).
 *
 * Pemakaian dasar:
 *   <Accordion type="single" collapsible>
 *     <AccordionItem value="item-1">
 *       <AccordionTrigger>Judul</AccordionTrigger>
 *       <AccordionContent>Isi.</AccordionContent>
 *     </AccordionItem>
 *   </Accordion>
 *
 * Untuk pemakaian data-dorong (cukup oper array), pakai
 * `AccordionTools` dari `src/components/tools/`.
 */

export const Accordion = AccordionPrimitive.Root;

export const AccordionItem = forwardRef(function AccordionItem(
  { className, ...props },
  ref,
) {
  return (
    <AccordionPrimitive.Item
      ref={ref}
      data-slot="accordion-item"
      className={cn(
        "overflow-hidden rounded-lg border-2 border-black bg-white shadow-[4px_4px_0px_0px_#000]",
        className,
      )}
      {...props}
    />
  );
});

export const AccordionTrigger = forwardRef(function AccordionTrigger(
  { className, children, ...props },
  ref,
) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-center justify-between gap-3 rounded-[6px] bg-[#0B2F9F] p-4 text-left text-base font-bold text-white transition-all",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2F9F]",
          "disabled:pointer-events-none disabled:opacity-50",
          "data-[state=open]:rounded-b-none data-[state=open]:border-b-2 data-[state=open]:border-black",
          "[&[data-state=open]>svg]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none size-5 shrink-0 transition-transform duration-200"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
});

export const AccordionContent = forwardRef(function AccordionContent(
  { className, children, ...props },
  ref,
) {
  return (
    <AccordionPrimitive.Content
      ref={ref}
      data-slot="accordion-content"
      className="overflow-hidden rounded-b-[6px] bg-white text-sm text-slate-800 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
      {...props}
    >
      <div className={cn("p-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});
