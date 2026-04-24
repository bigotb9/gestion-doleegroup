"use client"

import { useState, cloneElement, isValidElement } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ExternalLink, Download, Eye } from "lucide-react"

interface PdfPreviewModalProps {
  url: string
  title?: string
  filename?: string
  /** Élément cliquable qui ouvre la modal */
  trigger: React.ReactElement
}

export function PdfPreviewModal({ url, title = "Prévisualisation PDF", filename, trigger }: PdfPreviewModalProps) {
  const [open, setOpen] = useState(false)

  const triggerWithClick = isValidElement(trigger)
    ? cloneElement(trigger as React.ReactElement<{ onClick?: React.MouseEventHandler }>, {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
          setOpen(true)
        },
      })
    : trigger

  return (
    <>
      {triggerWithClick}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden" style={{ maxHeight: "90vh", height: "90vh" }}>
          <DialogHeader className="px-5 py-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-sm font-semibold truncate">{title}</DialogTitle>
              <div className="flex items-center gap-3 ml-4 shrink-0">
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Nouvel onglet
                </a>
                <a
                  href={url}
                  download={filename}
                  className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                >
                  <Download className="h-3.5 w-3.5" />
                  Télécharger
                </a>
              </div>
            </div>
          </DialogHeader>
          <iframe
            src={url}
            className="w-full border-0 flex-1"
            style={{ height: "calc(90vh - 56px)" }}
            title={title}
          />
        </DialogContent>
      </Dialog>
    </>
  )
}

/**
 * Bouton standard qui ouvre un PDF en prévisualisation.
 * Utilisation : <PdfPreviewButton url="/api/devis/xxx/pdf" label="Voir le PDF" />
 */
export function PdfPreviewButton({
  url,
  label = "Voir le PDF",
  title,
  filename,
  variant = "outline",
  size = "sm",
}: {
  url: string
  label?: string
  title?: string
  filename?: string
  variant?: "outline" | "default" | "ghost"
  size?: "sm" | "default"
}) {
  return (
    <PdfPreviewModal
      url={url}
      title={title ?? label}
      filename={filename}
      trigger={
        <Button variant={variant} size={size}>
          <Eye className="h-4 w-4 mr-1.5" />
          {label}
        </Button>
      }
    />
  )
}
