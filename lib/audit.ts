import { prisma } from "./prisma"

type AuditAction =
  | "CREATE" | "UPDATE" | "DELETE"
  | "VALIDATE" | "CONFIRM" | "SIGN"
  | "ACCEPT" | "REFUSE" | "SEND"
  | "EXPORT"

type AuditEntity =
  | "DEVIS" | "COMMANDE" | "PAIEMENT"
  | "FACTURE" | "LIVRAISON" | "DEPENSE"
  | "USER"

interface AuditParams {
  userId?: string | null
  userEmail?: string | null
  action: AuditAction
  entity: AuditEntity
  entityId: string
  entityRef?: string | null
  details?: string | null
}

/**
 * Enregistre une entrée dans le journal d'audit.
 * Ne lève jamais d'exception — les erreurs sont silencieuses
 * pour ne pas bloquer le flux principal.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        userEmail: params.userEmail ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        entityRef: params.entityRef ?? null,
        details: params.details ?? null,
      },
    })
  } catch {
    // Silent — l'audit ne doit jamais bloquer l'opération principale
  }
}
