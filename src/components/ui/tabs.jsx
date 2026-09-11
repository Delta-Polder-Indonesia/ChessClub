import { createContext, useContext, useId, useRef, useState } from "react";

const TabsContext = createContext(null);

function useTabs() {
  const context = useContext(TabsContext);
  if (!context) throw new Error("Tabs components must be used inside Tabs");
  return context;
}

export function Tabs({ value, defaultValue, onValueChange, className = "", children, ...props }) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const baseId = useId();
  const activeValue = value === undefined ? internalValue : value;
  const ubahNilai = (nextValue) => {
    if (value === undefined) setInternalValue(nextValue);
    onValueChange?.(nextValue);
  };

  return (
    <TabsContext.Provider value={{ activeValue, ubahNilai, baseId }}>
      <div className={className} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className = "", ...props }) {
  return (
    <div
      role="tablist"
      className={`flex h-10 items-center justify-center rounded-md bg-slate-100 p-1 text-slate-500 ${className}`}
      {...props}
    />
  );
}

export function TabsTrigger({ value, className = "", children, ...props }) {
  const { activeValue, ubahNilai, baseId } = useTabs();
  const aktif = activeValue === value;
  const triggerRef = useRef(null);
  const triggerId = `${baseId}-trigger-${value}`;
  const panelId = `${baseId}-content-${value}`;

  function pindahTab(e) {
    const triggers = Array.from(
      e.currentTarget.closest('[role="tablist"]')?.querySelectorAll('[role="tab"]') || [],
    );
    if (!triggers.length) return;
    const index = triggers.indexOf(e.currentTarget);
    const nextIndex = e.key === "ArrowRight" || e.key === "ArrowDown"
      ? (index + 1) % triggers.length
      : (index - 1 + triggers.length) % triggers.length;
    triggers[nextIndex]?.focus();
    triggers[nextIndex]?.click();
  }

  return (
    <button
      ref={triggerRef}
      id={triggerId}
      type="button"
      role="tab"
      aria-selected={aktif}
      aria-controls={panelId}
      tabIndex={aktif ? 0 : -1}
      onClick={() => ubahNilai(value)}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "ArrowDown" || e.key === "ArrowUp") {
          e.preventDefault();
          pindahTab(e);
        }
      }}
      className={`inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-white transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2F9F] disabled:pointer-events-none disabled:opacity-50 ${
        aktif ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-900"
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className = "", children, ...props }) {
  const { activeValue, baseId } = useTabs();
  if (activeValue !== value) return null;

  return (
    <div
      id={`${baseId}-content-${value}`}
      role="tabpanel"
      aria-labelledby={`${baseId}-trigger-${value}`}
      tabIndex={0}
      className={`mt-2 ring-offset-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0B2F9F] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
