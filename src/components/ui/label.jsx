import { forwardRef } from "react";

export const Label = forwardRef(function Label({ className = "", ...props }, ref) {
  return (
    <label
      ref={ref}
      className={`text-sm font-medium leading-none text-slate-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
      {...props}
    />
  );
});
