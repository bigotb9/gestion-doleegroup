import { Currency } from "@prisma/client"

// Fixed rates as fallback (updated manually or via env)
const FIXED_RATES: Record<string, number> = {
  EUR_CFA: parseFloat(process.env.RATE_EUR_CFA ?? "655.96"),
  USD_CFA: parseFloat(process.env.RATE_USD_CFA ?? "600"),
  CFA_CFA: 1,
  EUR_USD: parseFloat(process.env.RATE_EUR_USD ?? "1.09"),
  USD_EUR: parseFloat(process.env.RATE_USD_EUR ?? "0.92"),
}

let rateCache: { rates: typeof FIXED_RATES; fetchedAt: number } | null = null
const CACHE_TTL = 3600 * 1000 // 1 hour

async function fetchLiveRates(): Promise<typeof FIXED_RATES> {
  const apiKey = process.env.EXCHANGE_RATE_API_KEY
  if (!apiKey) return FIXED_RATES

  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${apiKey}/latest/EUR`)
    if (!res.ok) return FIXED_RATES
    const data = await res.json()
    return {
      EUR_CFA: data.conversion_rates?.XOF ?? FIXED_RATES.EUR_CFA,
      USD_CFA: (data.conversion_rates?.XOF ?? FIXED_RATES.USD_CFA) / (data.conversion_rates?.USD ?? 1.09),
      CFA_CFA: 1,
      EUR_USD: data.conversion_rates?.USD ?? FIXED_RATES.EUR_USD,
      USD_EUR: 1 / (data.conversion_rates?.USD ?? FIXED_RATES.EUR_USD),
    }
  } catch {
    return FIXED_RATES
  }
}

export async function getExchangeRates() {
  if (rateCache && Date.now() - rateCache.fetchedAt < CACHE_TTL) {
    return rateCache.rates
  }

  const rates = await fetchLiveRates()
  rateCache = { rates, fetchedAt: Date.now() }
  return rates
}

export async function convertToCFA(amount: number, fromCurrency: Currency): Promise<number> {
  if (fromCurrency === "CFA") return amount
  const rates = await getExchangeRates()
  const rate = rates[`${fromCurrency}_CFA`] ?? 1
  return Math.round(amount * rate)
}

export async function getRate(from: Currency, to: Currency): Promise<number> {
  if (from === to) return 1
  const rates = await getExchangeRates()
  return rates[`${from}_${to}`] ?? 1
}
