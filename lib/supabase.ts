import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export const FACTURES_FNE_BUCKET = "factures-fne"
export const JUSTIFICATIFS_BUCKET = "justificatifs-depenses"
export const JUSTIFICATIFS_PAIEMENTS_BUCKET = "justificatifs-paiements"
export const FICHES_COUT_BUCKET = "fiches-cout-produits"
export const COMMANDES_PHOTOS_BUCKET = "commandes-photos"
