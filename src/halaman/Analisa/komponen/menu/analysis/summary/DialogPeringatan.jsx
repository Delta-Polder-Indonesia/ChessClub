import { useState } from "react"

/**
 * Dialog konfirmasi yang bisa dipakai sebelum mengulang permainan/kuis.
 *
 * Komponen ini hanya menangani tampilan dan konfirmasi.
 * Reset skor/progress tetap menjadi tanggung jawab parent melalui onConfirm.
 */
export default function DialogPeringatan({
  trigger,
  title = "Main lagi?",
  description =
    "Nilai permainan sebelumnya akan di-reset. Jika kamu melanjutkan, kamu akan memulai permainan dari awal.",
  cancelLabel = "Batal",
  confirmLabel = "Lanjutkan",
  onConfirm,
  onCancel,
}) {
  const [open, setOpen] = useState(false)

  const handleCancel = () => {
    setOpen(false)
    onCancel?.()
  }

  const handleConfirm = () => {
    setOpen(false)
    onConfirm?.()
  }

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault()
            setOpen(true)
          }
        }}
      >
        {trigger}
      </span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) handleCancel()
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="dialog-peringatan-title"
            aria-describedby="dialog-peringatan-description"
            className="w-full max-w-md rounded-xl border bg-background p-6 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="space-y-2">
              <h2
                id="dialog-peringatan-title"
                className="text-lg font-semibold"
              >
                {title}
              </h2>
              <p
                id="dialog-peringatan-description"
                className="text-sm text-muted-foreground"
              >
                {description}
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-md border px-4 text-sm font-medium transition-colors hover:bg-muted"
                onClick={handleCancel}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                onClick={handleConfirm}
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
