import { cn } from "@/lib/utils"
import {
  PROSPECT_STATUS_LABELS,
  PROSPECT_STATUS_COLORS,
  DEVIS_STATUS_LABELS,
  DEVIS_STATUS_COLORS,
  COMMANDE_STATUS_LABELS,
  COMMANDE_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  LIVRAISON_STATUS_LABELS,
  LIVRAISON_STATUS_COLORS,
  RECOND_STATUS_LABELS,
} from "@/lib/constants"
import {
  ProspectStatus,
  DevisStatus,
  CommandeStatus,
  PaymentStatus,
  LivraisonStatus,
  ReconditionnementStatus,
} from "@prisma/client"

type AnyStatus =
  | ProspectStatus
  | DevisStatus
  | CommandeStatus
  | PaymentStatus
  | LivraisonStatus
  | ReconditionnementStatus

function getLabelAndColor(status: AnyStatus): { label: string; color: string } {
  if (status in PROSPECT_STATUS_LABELS)
    return { label: PROSPECT_STATUS_LABELS[status as ProspectStatus], color: PROSPECT_STATUS_COLORS[status as ProspectStatus] }
  if (status in DEVIS_STATUS_LABELS)
    return { label: DEVIS_STATUS_LABELS[status as DevisStatus], color: DEVIS_STATUS_COLORS[status as DevisStatus] }
  if (status in COMMANDE_STATUS_LABELS)
    return { label: COMMANDE_STATUS_LABELS[status as CommandeStatus], color: COMMANDE_STATUS_COLORS[status as CommandeStatus] }
  if (status in PAYMENT_STATUS_LABELS)
    return { label: PAYMENT_STATUS_LABELS[status as PaymentStatus], color: PAYMENT_STATUS_COLORS[status as PaymentStatus] }
  if (status in LIVRAISON_STATUS_LABELS)
    return { label: LIVRAISON_STATUS_LABELS[status as LivraisonStatus], color: LIVRAISON_STATUS_COLORS[status as LivraisonStatus] }
  if (status in RECOND_STATUS_LABELS)
    return { label: RECOND_STATUS_LABELS[status as ReconditionnementStatus], color: "bg-slate-100 text-slate-700" }
  return { label: status, color: "bg-slate-100 text-slate-700" }
}

interface StatusBadgeProps {
  status: AnyStatus | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { label, color } = getLabelAndColor(status as AnyStatus)

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        color,
        className
      )}
    >
      {label}
    </span>
  )
}
