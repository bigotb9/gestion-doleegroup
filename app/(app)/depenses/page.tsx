"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { PageHeader } from "@/components/layout/PageHeader"
import { RoleGate } from "@/components/shared/RoleGate"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatMontant, formatDate } from "@/lib/utils"
import { Plus, Loader2, TrendingDown, Pencil, Trash2, Upload, FileText, X, ExternalLink } from "lucide-react"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"

const CATEGORIES = [
  "Commandes",
  "Frais du personnel",
  "Frais généraux",
  "Charge des locaux",
  "Marketing et Communication",
  "Transport et déplacement",
  "Frais financiers, bancaires et fiscaux",
  "Divers",
]

type Depense = {
  id: string
  titre: string
  montant: string | number
  categorie: string | null
  date: string
  description: string | null
  justificatifUrl: string | null
  createdAt: string
}

type FormState = {
  titre: string
  montant: string
  categorie: string
  date: string
  description: string
  justificatifUrl: string
}

const EMPTY_FORM: FormState = {
  titre: "",
  montant: "",
  categorie: "",
  date: new Date().toISOString().slice(0, 10),
  description: "",
  justificatifUrl: "",
}

export default function DepensesPage() {
  const [depenses, setDepenses] = useState<Depense[]>([])
  const [total, setTotal] = useState(0)
  const [totalMontant, setTotalMontant] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filterCategorie, setFilterCategorie] = useState("")

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Upload justificatif
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [justificatifFileName, setJustificatifFileName] = useState<string | null>(null)

  const fetchDepenses = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCategorie) params.set("categorie", filterCategorie)
      const res = await fetch(`/api/depenses?${params}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setDepenses(data.depenses)
      setTotal(data.total)
      setTotalMontant(data.totalMontant)
    } catch {
      toast.error("Impossible de charger les dépenses")
    } finally {
      setLoading(false)
    }
  }, [filterCategorie])

  useEffect(() => { fetchDepenses() }, [fetchDepenses])

  function openNew() {
    setEditingId(null)
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) })
    setJustificatifFileName(null)
    setDialogOpen(true)
  }

  function openEdit(d: Depense) {
    setEditingId(d.id)
    setForm({
      titre: d.titre,
      montant: String(Number(d.montant)),
      categorie: d.categorie ?? "",
      date: new Date(d.date).toISOString().slice(0, 10),
      description: d.description ?? "",
      justificatifUrl: d.justificatifUrl ?? "",
    })
    setJustificatifFileName(d.justificatifUrl ? "Justificatif existant" : null)
    setDialogOpen(true)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/depenses/upload-justificatif", { method: "POST", body: fd })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur upload")
      }
      const { url } = await res.json()
      setForm((f) => ({ ...f, justificatifUrl: url }))
      setJustificatifFileName(file.name)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'upload")
    } finally {
      setUploadingFile(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  function removeJustificatif() {
    setForm((f) => ({ ...f, justificatifUrl: "" }))
    setJustificatifFileName(null)
  }

  async function handleSave() {
    if (!form.titre.trim()) { toast.error("Le titre est obligatoire"); return }
    if (!form.categorie) { toast.error("Le type de dépense est obligatoire"); return }
    if (!form.montant || isNaN(Number(form.montant))) { toast.error("Montant invalide"); return }
    if (!form.date) { toast.error("La date est obligatoire"); return }

    setSaving(true)
    try {
      const body = {
        titre: form.titre.trim(),
        montant: Number(form.montant),
        categorie: form.categorie || null,
        date: form.date,
        description: form.description.trim() || null,
        justificatifUrl: form.justificatifUrl.trim() || null,
      }

      const res = await fetch(
        editingId ? `/api/depenses/${editingId}` : "/api/depenses",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      )
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error ?? "Erreur")
      }
      toast.success(editingId ? "Dépense mise à jour" : "Dépense enregistrée")
      setDialogOpen(false)
      fetchDepenses()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/depenses/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      toast.success("Dépense supprimée")
      fetchDepenses()
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dépenses" description="Suivi des charges et dépenses de l'entreprise">
        <RoleGate roles={["MANAGER"]}>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger render={<Button size="sm" onClick={openNew} />}>
              <Plus className="h-4 w-4 mr-1.5" />
              Nouvelle dépense
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Modifier la dépense" : "Nouvelle dépense"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label>Titre <span className="text-red-500">*</span></Label>
                  <Input
                    value={form.titre}
                    onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
                    placeholder="Ex: Achat matériel bureau"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Type de dépense <span className="text-red-500">*</span></Label>
                  <Select
                    value={form.categorie}
                    onValueChange={(v) => setForm((f) => ({ ...f, categorie: v ?? "" }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un type" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Description</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Détails de la dépense..."
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label>Montant (CFA) <span className="text-red-500">*</span></Label>
                    <Input
                      type="number"
                      min="0"
                      value={form.montant}
                      onChange={(e) => setForm((f) => ({ ...f, montant: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Date <span className="text-red-500">*</span></Label>
                    <Input
                      type="date"
                      value={form.date}
                      onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Justificatif PDF <span className="text-slate-400 font-normal text-xs">(optionnel)</span></Label>
                  {justificatifFileName ? (
                    <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2">
                      <FileText className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-sm text-green-700 truncate flex-1">{justificatifFileName}</span>
                      {form.justificatifUrl && editingId && (
                        <a
                          href={form.justificatifUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-green-600 hover:text-green-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={removeJustificatif}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingFile}
                      className="flex items-center gap-2 w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500 hover:border-slate-300 hover:bg-slate-100 transition-all disabled:opacity-50"
                    >
                      {uploadingFile ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {uploadingFile ? "Upload en cours…" : "Cliquer pour uploader un PDF"}
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                  {editingId ? "Mettre à jour" : "Enregistrer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </RoleGate>
      </PageHeader>

      {/* Résumé financier — cartes premium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="group relative rounded-2xl p-5 overflow-hidden border border-red-100 bg-gradient-to-br from-white to-red-50/30 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(239,68,68,0.15)] transition-all duration-300">
          <div className="absolute -top-4 -right-4 w-32 h-32 rounded-full opacity-40" style={{ background: "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)" }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-600">
                <TrendingDown className="h-4 w-4" />
              </div>
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Total dépenses</p>
            </div>
            <p className="text-3xl font-bold text-red-600 tabular-nums">{formatMontant(totalMontant)}</p>
            <p className="text-xs text-slate-400 mt-1">{total} dépense{total > 1 ? "s" : ""} enregistrée{total > 1 ? "s" : ""}</p>
          </div>
        </div>
        <div className="rounded-2xl p-5 border border-slate-100 bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)] transition-all duration-300">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">Catégorie dominante</p>
          <p className="text-lg font-bold text-slate-800">
            {depenses.length > 0
              ? Object.entries(
                  depenses.reduce((acc, d) => {
                    const cat = d.categorie ?? "Autre"
                    acc[cat] = (acc[cat] ?? 0) + Number(d.montant)
                    return acc
                  }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—"
              : "—"}
          </p>
        </div>
        <div className="rounded-2xl p-5 border border-slate-100 bg-white hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.08)] transition-all duration-300">
          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-2">Filtre par type</p>
          <Select value={filterCategorie || "__all__"} onValueChange={(v) => setFilterCategorie(v === "__all__" ? "" : (v ?? ""))}>
            <SelectTrigger>
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Tous les types</SelectItem>
              {CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table des dépenses */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-red-500" />
            Liste des dépenses
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Chargement...
            </div>
          ) : depenses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-2">
              <TrendingDown className="h-6 w-6" />
              <p className="text-sm">Aucune dépense enregistrée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Titre</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Montant</th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">Justif.</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {depenses.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {formatDate(d.date)}
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-medium text-slate-900">{d.titre}</p>
                        {d.description && (
                          <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{d.description}</p>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        {d.categorie ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                            {d.categorie}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-semibold text-red-700">
                        {formatMontant(Number(d.montant))}
                      </td>
                      <td className="px-6 py-3 text-center">
                        {d.justificatifUrl ? (
                          <a
                            href={d.justificatifUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-slate-200">—</span>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <RoleGate roles={["MANAGER"]}>
                          <div className="flex items-center gap-1 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => openEdit(d)}
                              className="h-7 w-7 p-0"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <ConfirmDialog
                              title="Supprimer la dépense"
                              description={`Supprimer « ${d.titre} » (${formatMontant(Number(d.montant))}) ? Cette action est irréversible.`}
                              onConfirm={() => handleDelete(d.id)}
                              trigger={
                                <Button size="sm" variant="outline" className="h-7 w-7 p-0 text-red-500 hover:text-red-700">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              }
                            />
                          </div>
                        </RoleGate>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 bg-slate-50">
                    <td colSpan={3} className="px-6 py-3 text-sm font-semibold text-slate-700">Total</td>
                    <td className="px-6 py-3 text-right font-bold text-red-700">{formatMontant(totalMontant)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
