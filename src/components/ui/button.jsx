import { forwardRef } from "react";
import { Loader2 } from "lucide-react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border border-black bg-transparent text-black",
        outline: "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
        /* secondary + prop loading: dipakai alur Pendaftaran Anggota.
           Tambahan aditif — pemakai tombol lain tidak terpengaruh. */
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export const Button = forwardRef(function Button(
  { className, variant, size, type = "button", loading = false, disabled, children, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : undefined}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});

export { buttonVariants };
