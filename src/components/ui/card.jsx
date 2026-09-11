import { forwardRef } from "react";

export const Card = forwardRef(function Card({ className = "", ...props }, ref) {
  return (
    <div
      ref={ref}
      className={`rounded-xl border border-slate-200 bg-white text-slate-950 shadow-sm ${className}`}
      {...props}
    />
  );
});

export const CardHeader = forwardRef(function CardHeader({ className = "", ...props }, ref) {
  return <div ref={ref} className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />;
});

export const CardTitle = forwardRef(function CardTitle({ as: Component = "h3", className = "", ...props }, ref) {
  return <Component ref={ref} className={`text-lg font-semibold leading-none tracking-tight ${className}`} {...props} />;
});

export const CardDescription = forwardRef(function CardDescription({ className = "", ...props }, ref) {
  return <p ref={ref} className={`text-sm text-slate-500 ${className}`} {...props} />;
});

export const CardContent = forwardRef(function CardContent({ className = "", ...props }, ref) {
  return <div ref={ref} className={`p-6 pt-0 ${className}`} {...props} />;
});

export const CardFooter = forwardRef(function CardFooter({ className = "", ...props }, ref) {
  return <div ref={ref} className={`flex items-center p-6 pt-0 ${className}`} {...props} />;
});
