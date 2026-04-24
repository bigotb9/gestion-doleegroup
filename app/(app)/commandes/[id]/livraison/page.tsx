"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { StatusBadge } from "@/components/shared/StatusBadge"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { formatDate, formatDateTime } from "@/lib/utils"
import {
  ArrowLeft, Loader2, Truck, PenLine, CheckCircle2, Eraser,
  Plus, Package, FileDown, ChevronDown, ChevronUp,
} from "lucide-react"
import Link from "next/link"

type LivraisonStatus = "PLANIFIEE" | "EN_COURS" | "LIVREE" | "ECHEC"

type LivraisonLigne = {
  id: string
  designation: string
  quantite: number // quantité de CETTE livraison
  receptionId: string
  reception: {
    quantiteCommandee: number
    quantiteLivree: number // cumulatif (inclut cette livraison si status=LIVREE)
  }
}

type Livraison = {
  id: string
  status: LivraisonStatus
  adresseLivraison: string
  contactLivraison: string | null
  datePrevue: string
  dateReelle: string | null
  nombreSignaturesClient: number
  signatureUrl: string | null
  signatureDate: string | null
  nomSignataire: string | null
  signatureUrl2: string | null
  nomSignataire2: string | null
  signatureChargeUrl: string | null
  signatureChargeDate: string | null
  nomSignataireCharge: string | null
  notes: string | null
  bonLivraisonUrl: string | null
  lignes: LivraisonLigne[]
  commande: { id: string; numero: string }
  client: { id: string; raisonSociale: string; adresse: string | null; contactNom: string; contactPhone: string }
  assignedTo: { id: string; name: string } | null
}

type Reception = {
  id: string
  designation: string
  quantiteCommandee: number
  quantiteRecue: number
  quantiteReconditionnee: number
  quantiteLivree: number
}

type UserOption = { id: string; name: string }

// Quantité disponible à livrer = ce qui est prêt (reconditionnée ou reçue),
// PLAFONNÉ à ce que le client a commandé — le surplus reste chez Dolee Group.
function disponible(r: Reception) {
  const pret = r.quantiteReconditionnee > 0 ? r.quantiteReconditionnee : r.quantiteRecue
  return Math.min(pret, r.quantiteCommandee)
}

// ── Canvas helpers ─────────────────────────────────────────────────────────────
function initCanvas(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!
  ctx.fillStyle = "#f8fafc"
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.font = "14px sans-serif"
  ctx.fillStyle = "#94a3b8"
  ctx.textAlign = "center"
  ctx.fillText("Signez ici", canvas.width / 2, canvas.height / 2)
}

function SignaturePad({
  label, canvasRef, onStartDraw, onDraw, onStopDraw, onClear, accent,
}: {
  label: string
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  onStartDraw: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onDraw: (e: React.PointerEvent<HTMLCanvasElement>) => void
  onStopDraw: () => void
  onClear: () => void
  accent?: boolean
}) {
  return (
    <div className={`space-y-2 rounded-lg border p-4 ${accent ? "border-blue-200 bg-blue-50/40" : "border-slate-200"}`}>
      <p className={`text-xs font-semibold uppercase tracking-wide ${accent ? "text-blue-700" : "text-slate-600"}`}>{label}</p>
      <div className="inline-block border-2 border-slate-200 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef} width={360} height={160}
          className="block touch-none cursor-crosshair"
          onPointerDown={onStartDraw} onPointerMove={onDraw}
          onPointerUp={onStopDraw} onPointerLeave={onStopDraw}
        />
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onClear}>
        <Eraser className="h-4 w-4 mr-1.5" />Effacer
      </Button>
    </div>
  )
}

// ── LivraisonCard ──────────────────────────────────────────────────────────────
function LivraisonCard({
  liv, onRefresh,
}: {
  liv: Livraison
  onRefresh: () => void
}) {
  const [expanded, setExpanded] = useState(liv.status !== "LIVREE")
  const [statusChanging, setStatusChanging] = useState(false)
  const [signatureSubmitting, setSignatureSubmitting] = useState(false)
  const [nomSignataire, setNomSignataire] = useState(liv.nomSignataire ?? "")
  const [nomSignataire2, setNomSignataire2] = useState(liv.nomSignataire2 ?? "")
  const [nomSignataireCharge, setNomSignataireCharge] = useState(liv.nomSignataireCharge ?? liv.assignedTo?.name ?? "")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasRef2 = useRef<HTMLCanvasElement>(null)
  const canvasChargeRef = useRef<HTMLCanvasElement>(null)
  const activeCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const isDrawingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const [canvasReady, setCanvasReady] = useState(false)

  useEffect(() => {
    if (canvasReady || liv.signatureUrl) return
    if (!expanded) return
    setTimeout(() => {
      if (canvasRef.current) { initCanvas(canvasRef.current); setCanvasReady(true) }
      if (canvasRef2.current) initCanvas(canvasRef2.current)
      if (canvasChargeRef.current) initCanvas(canvasChargeRef.current)
    }, 50)
  }, [expanded, canvasReady, liv.signatureUrl])

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    activeCanvasRef.current = e.currentTarget
    isDrawingRef.current = true
    const rect = e.currentTarget.getBoundingClientRect()
    lastPosRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function draw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current || !activeCanvasRef.current) return
    const ctx = activeCanvasRef.current.getContext("2d")!
    const rect = activeCanvasRef.current.getBoundingClientRect()
    const pos = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    ctx.beginPath(); ctx.moveTo(lastPosRef.current.x, lastPosRef.current.y)
    ctx.lineTo(pos.x, pos.y); ctx.strokeStyle = "#1e293b"
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.stroke()
    lastPosRef.current = pos
  }
  function stopDraw() { isDrawingRef.current = false }
  function clearRef(ref: React.RefObject<HTMLCanvasElement | null>) {
    if (ref.current) initCanvas(ref.current)
  }

  async function handleStatusChange(s: LivraisonStatus) {
    setStatusChanging(true)
    try {
      const res = await fetch(`/api/livraisons/${liv.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: s }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Statut mis à jour")
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally { setStatusChanging(false) }
  }

  async function handleValiderSignature() {
    if (!nomSignataire.trim()) { toast.error("Nom du signataire client requis"); return }
    if (liv.nombreSignaturesClient >= 2 && !nomSignataire2.trim()) { toast.error("Nom du 2ème signataire requis"); return }
    if (!nomSignataireCharge.trim()) { toast.error("Nom du chargé de livraison requis"); return }
    const c1 = canvasRef.current
    const cC = canvasChargeRef.current
    if (!c1 || !cC) return

    setSignatureSubmitting(true)
    try {
      const res = await fetch(`/api/livraisons/${liv.id}/signature`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureDataUrl: c1.toDataURL("image/png"),
          nomSignataire: nomSignataire.trim(),
          signatureDataUrl2: liv.nombreSignaturesClient >= 2 && canvasRef2.current ? canvasRef2.current.toDataURL("image/png") : undefined,
          nomSignataire2: nomSignataire2.trim() || undefined,
          signatureChargeDataUrl: cC.toDataURL("image/png"),
          nomSignataireCharge: nomSignataireCharge.trim(),
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Livraison confirmée !")
      onRefresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally { setSignatureSubmitting(false) }
  }

  return (
    <Card className={`overflow-hidden ${liv.status === "LIVREE" ? "border-green-200" : liv.status === "ECHEC" ? "border-red-200" : ""}`}>
      {/* Header */}
      <button className="w-full px-5 py-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors"
        onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <Truck className="h-4 w-4 text-slate-400" />
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">{formatDate(liv.datePrevue)}</p>
            <p className="text-xs text-slate-500">{liv.adresseLivraison.split("\n")[0]}</p>
          </div>
          <StatusBadge status={liv.status} />
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          <span className="text-xs text-slate-400">
            {liv.lignes.length} produit{liv.lignes.length > 1 ? "s" : ""}
          </span>
          {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100">
          {/* Lignes produits */}
          <div className="px-5 py-4 space-y-4">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Détail par produit</p>
              <div className="overflow-x-auto rounded-lg border border-slate-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Produit</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Commandé</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-400 uppercase tracking-wider">Livré avant</th>
                      <th className="text-center px-3 py-2 font-semibold text-blue-600 uppercase tracking-wider">Cette livraison</th>
                      <th className="text-center px-3 py-2 font-semibold text-slate-500 uppercase tracking-wider">Reste après</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {liv.lignes.map((l) => {
                      const cmd = l.reception.quantiteCommandee
                      const cumul = l.reception.quantiteLivree // inclut cette livraison si LIVREE
                      const avant = liv.status === "LIVREE" ? cumul - l.quantite : cumul
                      const resteApres = cmd - avant - l.quantite
                      return (
                        <tr key={l.id}>
                          <td className="px-3 py-2.5 font-medium text-slate-900">{l.designation}</td>
                          <td className="px-3 py-2.5 text-center text-slate-600">{cmd}</td>
                          <td className="px-3 py-2.5 text-center text-slate-400">{avant > 0 ? avant : <span className="text-slate-300">—</span>}</td>
                          <td className="px-3 py-2.5 text-center font-bold text-blue-700">{l.quantite}</td>
                          <td className="px-3 py-2.5 text-center">
                            {resteApres > 0
                              ? <span className="font-semibold text-amber-600">{resteApres}</span>
                              : <span className="text-green-600 font-medium">✓</span>
                            }
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Infos */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {liv.contactLivraison && (
                <div><p className="text-xs text-slate-400">Contact</p><p className="font-medium">{liv.contactLivraison}</p></div>
              )}
              {liv.assignedTo && (
                <div><p className="text-xs text-slate-400">Assigné à</p><p className="font-medium">{liv.assignedTo.name}</p></div>
              )}
              {liv.dateReelle && (
                <div><p className="text-xs text-slate-400">Livré le</p><p className="font-medium text-green-700">{formatDate(liv.dateReelle)}</p></div>
              )}
              {liv.notes && (
                <div className="col-span-2"><p className="text-xs text-slate-400">Notes</p><p className="text-slate-700">{liv.notes}</p></div>
              )}
            </div>

            {/* PDF */}
            <div className="flex items-center gap-3">
              <a href={`/api/livraisons/${liv.id}/pdf`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <FileDown className="h-4 w-4 mr-1.5" />Bon de livraison PDF
                </Button>
              </a>
            </div>

            {/* Actions statut */}
            <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}>
              {liv.status !== "LIVREE" && liv.status !== "ECHEC" && (
                <div className="flex gap-2 pt-1">
                  {liv.status === "PLANIFIEE" && (
                    <Button size="sm" onClick={() => handleStatusChange("EN_COURS")} disabled={statusChanging}>
                      {statusChanging && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                      Démarrer la livraison
                    </Button>
                  )}
                  <Button size="sm" variant="destructive" onClick={() => handleStatusChange("ECHEC")} disabled={statusChanging}>
                    Marquer comme échec
                  </Button>
                </div>
              )}
            </RoleGate>

            <Separator />

            {/* Signatures */}
            <div>
              <h3 className="text-sm font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <PenLine className="h-4 w-4" />Signatures
              </h3>

              {liv.signatureUrl ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" />
                    Signé le {formatDateTime(liv.signatureDate)}
                  </div>
                  <div className={`grid gap-4 ${liv.nombreSignaturesClient >= 2 ? "grid-cols-3" : "grid-cols-2"}`}>
                    <div className="space-y-1.5">
                      <p className="text-xs font-medium text-slate-500 uppercase">Client {liv.nombreSignaturesClient >= 2 ? "1" : ""}</p>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={liv.signatureUrl} alt="sig" className="border rounded-lg bg-white max-w-[220px]" />
                      <p className="text-xs font-medium">{liv.nomSignataire}</p>
                    </div>
                    {liv.nombreSignaturesClient >= 2 && liv.signatureUrl2 && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-slate-500 uppercase">Client 2</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={liv.signatureUrl2} alt="sig2" className="border rounded-lg bg-white max-w-[220px]" />
                        <p className="text-xs font-medium">{liv.nomSignataire2}</p>
                      </div>
                    )}
                    {liv.signatureChargeUrl && (
                      <div className="space-y-1.5">
                        <p className="text-xs font-medium text-blue-600 uppercase">Chargé livraison</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={liv.signatureChargeUrl} alt="sigC" className="border border-blue-100 rounded-lg bg-white max-w-[220px]" />
                        <p className="text-xs font-medium">{liv.nomSignataireCharge}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <RoleGate roles={["MANAGER", "CHARGE_OPERATIONS"]}
                  fallback={<p className="text-sm text-slate-400">En attente de signature.</p>}
                >
                  {liv.status !== "LIVREE" && liv.status !== "ECHEC" && (
                    <div className="space-y-4">
                      <div className={`grid gap-4 ${liv.nombreSignaturesClient >= 2 ? "grid-cols-2" : "grid-cols-1 max-w-sm"}`}>
                        <div className="space-y-2">
                          <Label className="text-xs">Nom signataire client {liv.nombreSignaturesClient >= 2 ? "1" : ""}</Label>
                          <Input value={nomSignataire} onChange={(e) => setNomSignataire(e.target.value)} placeholder="Prénom et nom" className="h-8" />
                          <SignaturePad label={`Signature client${liv.nombreSignaturesClient >= 2 ? " 1" : ""}`}
                            canvasRef={canvasRef} onStartDraw={startDraw} onDraw={draw} onStopDraw={stopDraw} onClear={() => clearRef(canvasRef)} />
                        </div>
                        {liv.nombreSignaturesClient >= 2 && (
                          <div className="space-y-2">
                            <Label className="text-xs">Nom signataire client 2</Label>
                            <Input value={nomSignataire2} onChange={(e) => setNomSignataire2(e.target.value)} placeholder="Prénom et nom" className="h-8" />
                            <SignaturePad label="Signature client 2"
                              canvasRef={canvasRef2} onStartDraw={startDraw} onDraw={draw} onStopDraw={stopDraw} onClear={() => clearRef(canvasRef2)} />
                          </div>
                        )}
                      </div>
                      <Separator />
                      <div className="space-y-2 max-w-sm">
                        <Label className="text-xs">Nom du chargé de livraison</Label>
                        <Input value={nomSignataireCharge} onChange={(e) => setNomSignataireCharge(e.target.value)} placeholder="Prénom et nom" className="h-8" />
                        <SignaturePad label="Signature chargé de livraison"
                          canvasRef={canvasChargeRef} onStartDraw={startDraw} onDraw={draw} onStopDraw={stopDraw} onClear={() => clearRef(canvasChargeRef)} accent />
                      </div>
                      <Button onClick={handleValiderSignature}
                        disabled={signatureSubmitting || !nomSignataire.trim() || !nomSignataireCharge.trim()}
                      >
                        {signatureSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                        <CheckCircle2 className="h-4 w-4 mr-1.5" />
                        Valider les signatures
                      </Button>
                    </div>
                  )}
                </RoleGate>
              )}
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

// ── Page principale ────────────────────────────────────────────────────────────
export default function LivraisonCommandePage() {
  const { id: commandeId } = useParams<{ id: string }>()

  const [livraisons, setLivraisons] = useState<Livraison[]>([])
  const [receptions, setReceptions] = useState<Reception[]>([])
  const [commandeNumero, setCommandeNumero] = useState("")
  const [loading, setLoading] = useState(true)
  const [chargesOps, setChargesOps] = useState<UserOption[]>([])

  const [showForm, setShowForm] = useState(false)
  const [formAdresse, setFormAdresse] = useState("")
  const [formContact, setFormContact] = useState("")
  const [formDatePrevue, setFormDatePrevue] = useState("")
  const [formAssignedTo, setFormAssignedTo] = useState("")
  const [formNotes, setFormNotes] = useState("")
  const [formNbSignatures, setFormNbSignatures] = useState<1 | 2>(1)
  // Quantités à livrer par réception
  const [formQtys, setFormQtys] = useState<Record<string, number>>({})
  const [formSubmitting, setFormSubmitting] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [livRes, recepRes, cmdRes] = await Promise.all([
        fetch(`/api/livraisons?commandeId=${commandeId}`),
        fetch(`/api/stock/receptions?commandeId=${commandeId}`),
        fetch(`/api/commandes/${commandeId}`),
      ])
      if (livRes.ok) {
        const json = await livRes.json()
        setLivraisons(json.livraisons ?? [])
      }
      if (recepRes.ok) {
        const data: Reception[] = await recepRes.json()
        setReceptions(data)
        // Pre-fill quantités avec le restant disponible
        const init: Record<string, number> = {}
        for (const r of data) {
          const dispo = disponible(r) - r.quantiteLivree
          init[r.id] = Math.max(0, dispo)
        }
        setFormQtys(init)
      }
      if (cmdRes.ok) {
        const cmd = await cmdRes.json()
        setCommandeNumero(cmd.numero ?? "")
        if (cmd.client?.adresse && !formAdresse) setFormAdresse(cmd.client.adresse ?? "")
        if (cmd.client && !formContact) {
          setFormContact(`${cmd.client.contactNom ?? ""} — ${cmd.client.contactPhone ?? ""}`)
        }
      }
    } catch {
      toast.error("Impossible de charger les données")
    } finally {
      setLoading(false)
    }
  }, [commandeId]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchChargesOps = useCallback(async () => {
    try {
      const res = await fetch("/api/utilisateurs?role=CHARGE_OPERATIONS")
      if (!res.ok) return
      const json = await res.json()
      setChargesOps(json.utilisateurs ?? json)
    } catch { /* silent */ }
  }, [])

  useEffect(() => { fetchData(); fetchChargesOps() }, [fetchData, fetchChargesOps])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!formAdresse || !formDatePrevue) { toast.error("Adresse et date requises"); return }

    const lignes = receptions
      .filter((r) => (formQtys[r.id] ?? 0) > 0)
      .map((r) => ({ receptionId: r.id, designation: r.designation, quantite: formQtys[r.id] }))

    if (lignes.length === 0) { toast.error("Sélectionnez au moins un produit à livrer"); return }

    setFormSubmitting(true)
    try {
      const res = await fetch("/api/livraisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commandeId,
          adresseLivraison: formAdresse,
          contactLivraison: formContact || undefined,
          datePrevue: formDatePrevue,
          assignedToId: formAssignedTo || undefined,
          notes: formNotes || undefined,
          nombreSignaturesClient: formNbSignatures,
          lignes,
        }),
      })
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error ?? "Erreur")
      toast.success("Livraison planifiée")
      setShowForm(false)
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur")
    } finally {
      setFormSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin mr-2" />Chargement...
      </div>
    )
  }

  // Calcul récapitulatif par réception
  const recap = receptions.map((r) => {
    const dispo = disponible(r)
    const reste = dispo - r.quantiteLivree
    const surplus = Math.max(0, r.quantiteRecue - r.quantiteCommandee)
    return { ...r, dispo, reste, surplus }
  })
  const toutLivre = recap.length > 0 && recap.every((r) => r.reste <= 0)

  return (
    <div className="space-y-6 max-w-3xl">
      <PageHeader title="Livraisons" description={commandeNumero ? `Commande ${commandeNumero}` : ""}>
        <Link href={`/commandes/${commandeId}`}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background text-[0.8rem] font-medium h-7 px-2.5 hover:bg-muted transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" />Retour à la commande
        </Link>
      </PageHeader>

      {/* Récapitulatif stock disponible */}
      {receptions.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Package className="h-4 w-4 text-indigo-500" />
              Stock disponible à livrer
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-5 py-2 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Produit</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Commandé</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Livré</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Reste à livrer</th>
                  <th className="px-4 py-2 text-center text-xs font-semibold text-blue-400 uppercase tracking-wider">Surplus stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {recap.map((r) => (
                  <tr key={r.id} className={r.reste <= 0 ? "opacity-50" : ""}>
                    <td className="px-5 py-2.5 font-medium text-slate-900">{r.designation}</td>
                    <td className="px-4 py-2.5 text-center text-slate-700">{r.quantiteCommandee}</td>
                    <td className="px-4 py-2.5 text-center text-green-700 font-semibold">{r.quantiteLivree}</td>
                    <td className="px-4 py-2.5 text-center">
                      {r.reste > 0
                        ? <span className="font-semibold text-amber-600">{r.reste}</span>
                        : <span className="text-green-600 font-medium">✓ Complet</span>
                      }
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {r.surplus > 0
                        ? <span className="text-blue-500 font-medium">+{r.surplus}</span>
                        : <span className="text-slate-300">—</span>
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {toutLivre && (
              <div className="flex items-center gap-2 px-5 py-3 bg-green-50 border-t border-green-100 text-green-700 text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Tous les produits ont été livrés — commande complète
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {receptions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center py-10 gap-2 text-slate-400 text-sm">
            <Package className="h-8 w-8" />
            <p>Aucune réception enregistrée pour cette commande.</p>
            <Link href="/stock" className="text-xs text-indigo-600 hover:underline">Enregistrer les réceptions →</Link>
          </CardContent>
        </Card>
      )}

      {/* Liste des livraisons existantes */}
      {livraisons.length > 0 && (
        <div className="space-y-3">
          {livraisons.map((liv) => (
            <LivraisonCard key={liv.id} liv={liv} onRefresh={fetchData} />
          ))}
        </div>
      )}

      {/* Bouton / formulaire nouvelle livraison */}
      {!toutLivre && receptions.length > 0 && (
        <RoleGate roles={["MANAGER", "SECRETAIRE"]}>
          {!showForm ? (
            <Button variant="outline" className="w-full border-dashed" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {livraisons.length === 0 ? "Planifier la livraison" : "Ajouter une livraison partielle"}
            </Button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-5">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    {livraisons.length === 0 ? "Planifier la livraison" : "Nouvelle livraison partielle"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* Sélection des quantités par produit */}
                  <div>
                    <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
                      Produits et quantités à livrer
                    </Label>
                    <div className="overflow-x-auto rounded-lg border border-slate-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Produit</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Commandé</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Déjà livré</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-amber-500 uppercase tracking-wider">Reste</th>
                            <th className="text-center px-3 py-2 text-xs font-semibold text-blue-600 uppercase tracking-wider">À livrer</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {recap.filter((r) => r.reste > 0).map((r) => (
                            <tr key={r.id}>
                              <td className="px-4 py-2.5 font-medium text-slate-900">{r.designation}</td>
                              <td className="px-3 py-2.5 text-center text-slate-600">{r.quantiteCommandee}</td>
                              <td className="px-3 py-2.5 text-center text-slate-400">{r.quantiteLivree > 0 ? r.quantiteLivree : <span className="text-slate-300">—</span>}</td>
                              <td className="px-3 py-2.5 text-center font-semibold text-amber-600">{r.reste}</td>
                              <td className="px-3 py-2.5 text-center">
                                <Input
                                  type="number" min={0} max={r.reste}
                                  value={formQtys[r.id] ?? r.reste}
                                  onChange={(e) => setFormQtys((prev) => ({
                                    ...prev,
                                    [r.id]: Math.min(r.reste, Math.max(0, parseInt(e.target.value) || 0)),
                                  }))}
                                  className="h-8 w-20 text-center text-sm mx-auto"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <Separator />

                  {/* Infos livraison */}
                  <div className="space-y-1.5">
                    <Label>Adresse de livraison <span className="text-red-500">*</span></Label>
                    <Textarea value={formAdresse} onChange={(e) => setFormAdresse(e.target.value)}
                      placeholder="Adresse complète..." rows={2} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label>Contact livraison</Label>
                      <Input value={formContact} onChange={(e) => setFormContact(e.target.value)}
                        placeholder="Nom et téléphone" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Date prévue <span className="text-red-500">*</span></Label>
                      <Input type="date" value={formDatePrevue} onChange={(e) => setFormDatePrevue(e.target.value)} required />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Assigné à</Label>
                      <Select value={formAssignedTo} onValueChange={(v) => setFormAssignedTo(v ?? "")}>
                        <SelectTrigger><SelectValue placeholder="Chargé des opérations..." /></SelectTrigger>
                        <SelectContent>
                          {chargesOps.map((u) => (
                            <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label>Signatures client</Label>
                      <Select value={String(formNbSignatures)} onValueChange={(v) => setFormNbSignatures(v === "2" ? 2 : 1)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 signature</SelectItem>
                          <SelectItem value="2">2 signatures</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Notes</Label>
                    <Textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} rows={2} />
                  </div>
                </CardContent>
              </Card>
              <div className="flex justify-end gap-3 pb-6">
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Annuler</Button>
                <Button type="submit" disabled={formSubmitting}>
                  {formSubmitting && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
                  <Truck className="h-4 w-4 mr-1.5" />
                  Planifier
                </Button>
              </div>
            </form>
          )}
        </RoleGate>
      )}

      {/* Aucune réception + aucune livraison */}
      {livraisons.length === 0 && receptions.length === 0 && (
        <RoleGate roles={[]} fallback={
          <Card>
            <CardContent className="flex flex-col items-center py-12 gap-3 text-slate-400">
              <Truck className="h-10 w-10" />
              <p className="text-sm">Aucune livraison planifiée.</p>
            </CardContent>
          </Card>
        }>
          <></>
        </RoleGate>
      )}
    </div>
  )
}
