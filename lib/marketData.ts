/**
 * marketData.ts
 * Yahoo Finance v8 API — ücretsiz, key gerektirmez
 * BIST hisseleri için sembol: THYAO.IS, GARAN.IS vb.
 * ABD hisseleri için: AAPL, TSLA vb.
 * ETF: SPY, QQQ, CSPX.L vb.
 */

const YF_BASE = 'https://query1.finance.yahoo.com'

export interface SearchResult {
  symbol: string
  shortname: string
  longname: string
  exchange: string
  quoteType: string // EQUITY, ETF, MUTUALFUND, CRYPTOCURRENCY
  sector?: string
}

export interface QuoteData {
  symbol: string
  shortName: string
  regularMarketPrice: number
  regularMarketChange: number
  regularMarketChangePercent: number
  currency: string
  marketState: string
  regularMarketPreviousClose: number
}

/**
 * Sembol/şirket arama
 * query: "thyao", "apple", "bitcoin" vb.
 */
export async function searchSymbol(query: string): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `${YF_BASE}/v1/finance/search?q=${encodeURIComponent(query)}&lang=en-US&region=TR&quotesCount=10&newsCount=0`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json',
        },
      }
    )
    if (!res.ok) throw new Error('Search failed')
    const data = await res.json()
    const quotes: SearchResult[] = (data.quotes ?? [])
      .filter((q: any) => ['EQUITY', 'ETF', 'MUTUALFUND', 'CRYPTOCURRENCY'].includes(q.quoteType))
      .map((q: any) => ({
        symbol: q.symbol,
        shortname: q.shortname ?? q.symbol,
        longname: q.longname ?? q.shortname ?? q.symbol,
        exchange: q.exchange ?? '',
        quoteType: q.quoteType,
        sector: q.sector,
      }))
    return quotes
  } catch {
    return []
  }
}

/**
 * Tek veya çoklu sembol fiyat verisi al
 * v8/finance/chart endpoint — crumb/cookie gerektirmez, daha güvenilir
 * symbols: ['THYAO.IS', 'AAPL', 'GARAN.IS']
 */
export async function getQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  if (symbols.length === 0) return {}

  const fetchOne = async (symbol: string): Promise<[string, QuoteData] | null> => {
    try {
      const res = await fetch(
        `${YF_BASE}/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'application/json, text/plain, */*',
            'Accept-Language': 'en-US,en;q=0.9',
          },
        }
      )
      if (!res.ok) return null
      const data = await res.json()
      const meta = data?.chart?.result?.[0]?.meta
      if (!meta || !meta.regularMarketPrice) return null

      const prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice
      const change = meta.regularMarketPrice - prev
      const changePct = prev > 0 ? (change / prev) * 100 : 0

      return [symbol, {
        symbol,
        shortName: meta.shortName ?? meta.symbol ?? symbol,
        regularMarketPrice: meta.regularMarketPrice,
        regularMarketChange: change,
        regularMarketChangePercent: changePct,
        currency: meta.currency ?? 'USD',
        marketState: meta.marketState ?? 'CLOSED',
        regularMarketPreviousClose: prev,
      }]
    } catch {
      return null
    }
  }

  const settled = await Promise.allSettled(symbols.map(fetchOne))
  const result: Record<string, QuoteData> = {}
  for (const s of settled) {
    if (s.status === 'fulfilled' && s.value) {
      const [sym, quote] = s.value
      result[sym] = quote
    }
  }
  return result
}

export function quoteTypeLabel(type: string): string {
  switch (type) {
    case 'EQUITY': return 'Hisse'
    case 'ETF': return 'ETF'
    case 'MUTUALFUND': return 'Fon'
    case 'CRYPTOCURRENCY': return 'Kripto'
    default: return type
  }
}

export function formatPrice(price: number, currency: string): string {
  try {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    }).format(price)
  } catch {
    return `${price.toFixed(2)} ${currency}`
  }
}
