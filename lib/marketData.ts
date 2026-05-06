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
 * symbols: ['THYAO.IS', 'AAPL', 'GARAN.IS']
 */
export async function getQuotes(symbols: string[]): Promise<Record<string, QuoteData>> {
  if (symbols.length === 0) return {}
  try {
    const joined = symbols.join(',')
    const res = await fetch(
      `${YF_BASE}/v8/finance/quote?symbols=${encodeURIComponent(joined)}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose,currency,shortName,marketState`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          Accept: 'application/json',
        },
      }
    )
    if (!res.ok) throw new Error('Quote failed')
    const data = await res.json()
    const result: Record<string, QuoteData> = {}
    for (const q of data.quoteResponse?.result ?? []) {
      result[q.symbol] = {
        symbol: q.symbol,
        shortName: q.shortName ?? q.symbol,
        regularMarketPrice: q.regularMarketPrice ?? 0,
        regularMarketChange: q.regularMarketChange ?? 0,
        regularMarketChangePercent: q.regularMarketChangePercent ?? 0,
        currency: q.currency ?? 'TRY',
        marketState: q.marketState ?? 'CLOSED',
        regularMarketPreviousClose: q.regularMarketPreviousClose ?? 0,
      }
    }
    return result
  } catch {
    return {}
  }
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
