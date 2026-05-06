import { Text } from '@/components/ui/text'
import Card from '@/library/components/card'
import PageContainer from '@/library/components/pageContainer'
import { getQuotes, QuoteData, searchSymbol, SearchResult, quoteTypeLabel, formatPrice } from '@/lib/marketData'
import { useFinanceStore } from '@/store/financeStore'
import { useInvestmentStore, Investment } from '@/store/investmentStore'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import {
  AlertCircle,
  Bitcoin,
  Building2,
  ChevronDown,
  LineChart,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react-native'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

// ─── Yardımcı ───────────────────────────────────────────────
interface BinanceBalance {
  asset: string
  free: string
  locked: string
}

interface TickerPrice {
  symbol: string
  price: string
}

function formatCurrency(amount: number, currency = 'TRY') {
  try {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
  } catch {
    return `${amount.toFixed(2)} ${currency}`
  }
}

const TYPE_COLORS: Record<string, string> = {
  stock: '#3a81f2',
  etf: '#8b5cf6',
  fund: '#f59e0b',
  crypto: '#f0b90b',
  EQUITY: '#3a81f2',
  ETF: '#8b5cf6',
  MUTUALFUND: '#f59e0b',
  CRYPTOCURRENCY: '#f0b90b',
}

// ─── Ana Bileşen ──────────────────────────────────────────────
export default function Portfolio() {
  const router = useRouter()
  const { accounts } = useFinanceStore()
  const { investments, loadInvestments, addInvestment, deleteInvestment } = useInvestmentStore()

  const [activeTab, setActiveTab] = useState<'investments' | 'crypto'>('investments')

  // Kripto state
  const [binanceBalances, setBinanceBalances] = useState<BinanceBalance[]>([])
  const [cryptoPrices, setCryptoPrices] = useState<Record<string, number>>({})
  const [cryptoLoading, setCryptoLoading] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)

  // Yatırım state
  const [quotes, setQuotes] = useState<Record<string, QuoteData>>({})
  const [quotesLoading, setQuotesLoading] = useState(false)

  // Modal: hisse/fon ekle
  const [addModalVisible, setAddModalVisible] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searchLoading, setSearchLoading] = useState(false)
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)
  const [quantity, setQuantity] = useState('')
  const [avgCost, setAvgCost] = useState('')
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Init ───────────────────────────────────────────────────
  useEffect(() => {
    loadInvestments()
    SecureStore.getItemAsync('binance_api_key').then((k) => setHasApiKey(!!k))
  }, [])

  useEffect(() => {
    if (investments.length > 0) fetchInvestmentQuotes()
  }, [investments.length])

  // ─── Fiyat Çekme ────────────────────────────────────────────
  const fetchInvestmentQuotes = useCallback(async () => {
    if (investments.length === 0) return
    setQuotesLoading(true)
    const symbols = investments.map((i) => i.symbol)
    const data = await getQuotes(symbols)
    setQuotes(data)
    setQuotesLoading(false)
  }, [investments])

  const fetchBinance = useCallback(async () => {
    const apiKey = await SecureStore.getItemAsync('binance_api_key')
    const apiSecret = await SecureStore.getItemAsync('binance_api_secret')
    if (!apiKey || !apiSecret) {
      Alert.alert('API Anahtarı Gerekli', 'Ayarlar sayfasından Binance API anahtarınızı girin.')
      return
    }
    setCryptoLoading(true)
    try {
      const timestamp = Date.now()
      const queryString = `timestamp=${timestamp}`
      const encoder = new TextEncoder()
      const keyData = encoder.encode(apiSecret)
      const msgData = encoder.encode(queryString)
      const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
      const hexSig = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('')

      const accRes = await fetch(
        `https://api.binance.com/api/v3/account?${queryString}&signature=${hexSig}`,
        { headers: { 'X-MBX-APIKEY': apiKey } }
      )
      const accData = await accRes.json()
      if (!accRes.ok) throw new Error(accData.msg ?? 'Binance API hatası')

      const nonZero: BinanceBalance[] = (accData.balances as BinanceBalance[]).filter(
        (b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
      )
      setBinanceBalances(nonZero)

      const symbols = nonZero.filter((b) => b.asset !== 'USDT').map((b) => `${b.asset}USDT`)
      if (symbols.length > 0) {
        const tickerRes = await fetch('https://api.binance.com/api/v3/ticker/price')
        const tickers: TickerPrice[] = await tickerRes.json()
        const priceMap: Record<string, number> = { USDT: 1 }
        for (const t of tickers) {
          if (symbols.includes(t.symbol)) priceMap[t.symbol.replace('USDT', '')] = parseFloat(t.price)
        }
        setCryptoPrices(priceMap)
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Binance verileri alınamadı')
    } finally {
      setCryptoLoading(false)
    }
  }, [])

  // ─── Arama ──────────────────────────────────────────────────
  const handleSearch = (q: string) => {
    setSearchQuery(q)
    if (searchTimeout.current) clearTimeout(searchTimeout.current)
    if (q.length < 2) { setSearchResults([]); return }
    searchTimeout.current = setTimeout(async () => {
      setSearchLoading(true)
      const results = await searchSymbol(q)
      setSearchResults(results)
      setSearchLoading(false)
    }, 500)
  }

  // ─── Yatırım Ekle ────────────────────────────────────────────
  const handleAddInvestment = () => {
    if (!selectedResult) return
    const qty = parseFloat(quantity.replace(',', '.'))
    const cost = parseFloat(avgCost.replace(',', '.'))
    if (isNaN(qty) || qty <= 0) { Alert.alert('Hata', 'Geçerli bir adet girin.'); return }
    if (isNaN(cost) || cost <= 0) { Alert.alert('Hata', 'Geçerli bir maliyet fiyatı girin.'); return }

    // Zaten ekli mi?
    const exists = investments.find((i) => i.symbol === selectedResult.symbol)
    if (exists) {
      Alert.alert('Zaten Ekli', `${selectedResult.symbol} zaten portföyünüzde.`); return
    }

    const typeMap: Record<string, Investment['type']> = {
      EQUITY: 'stock', ETF: 'etf', MUTUALFUND: 'fund', CRYPTOCURRENCY: 'crypto',
    }
    addInvestment({
      symbol: selectedResult.symbol,
      name: selectedResult.longname || selectedResult.shortname,
      type: typeMap[selectedResult.quoteType] ?? 'stock',
      quantity: qty,
      avg_cost: cost,
      currency: selectedResult.exchange?.includes('IS') ? 'TRY' : 'USD',
      note: null,
    })
    setAddModalVisible(false)
    setSearchQuery('')
    setSearchResults([])
    setSelectedResult(null)
    setQuantity('')
    setAvgCost('')
  }

  const handleDelete = (inv: Investment) => {
    Alert.alert('Sil', `${inv.symbol} portföyden kaldırılsın mı?`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteInvestment(inv.id) },
    ])
  }

  // ─── Hesaplamalar ────────────────────────────────────────────
  const bankAccounts = accounts.filter((a) => a.type === 'bank')
  const cashAccounts = accounts.filter((a) => a.type === 'cash')
  const totalBank = bankAccounts.reduce((s, a) => s + a.balance, 0)
  const totalCash = cashAccounts.reduce((s, a) => s + a.balance, 0)
  const totalCryptoUsdt = binanceBalances.reduce((s, b) => {
    const total = parseFloat(b.free) + parseFloat(b.locked)
    const price = b.asset === 'USDT' ? 1 : (cryptoPrices[b.asset] ?? 0)
    return s + total * price
  }, 0)

  const totalInvestmentValue = investments.reduce((s, inv) => {
    const q = quotes[inv.symbol]
    if (!q) return s + inv.quantity * inv.avg_cost
    return s + inv.quantity * q.regularMarketPrice
  }, 0)

  const totalInvestmentCost = investments.reduce((s, inv) => s + inv.quantity * inv.avg_cost, 0)
  const totalPnl = totalInvestmentValue - totalInvestmentCost
  const totalPnlPct = totalInvestmentCost > 0 ? (totalPnl / totalInvestmentCost) * 100 : 0

  // ─── Render ───────────────────────────────────────────────────
  return (
    <PageContainer safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Özet Kart */}
        <Card>
          <View style={styles.row}>
            <TrendingUp color="#3a81f2" size={20} />
            <Text style={styles.muted} size="lg">Toplam Varlık</Text>
          </View>
          <Text bold size="4xl" style={styles.white}>
            {formatCurrency(totalBank + totalCash)}
          </Text>
          <View style={styles.summaryRow}>
            {totalInvestmentValue > 0 && (
              <View style={styles.summaryBadge}>
                <LineChart color="#8b5cf6" size={13} />
                <Text style={{ color: '#8b5cf6', fontSize: 12 }}>
                  {formatCurrency(totalInvestmentValue)} yatırım
                </Text>
              </View>
            )}
            {totalCryptoUsdt > 0 && (
              <View style={styles.summaryBadge}>
                <Bitcoin color="#f0b90b" size={13} />
                <Text style={{ color: '#f0b90b', fontSize: 12 }}>
                  ${totalCryptoUsdt.toFixed(2)} kripto
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* Tab Seçici */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'investments' && styles.tabBtnActive]}
            onPress={() => setActiveTab('investments')}
          >
            <LineChart color={activeTab === 'investments' ? '#3a81f2' : '#424d5e'} size={15} />
            <Text style={[styles.tabText, activeTab === 'investments' && styles.tabTextActive]}>
              Hisse / Fon
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'crypto' && styles.tabBtnActive]}
            onPress={() => setActiveTab('crypto')}
          >
            <Bitcoin color={activeTab === 'crypto' ? '#f0b90b' : '#424d5e'} size={15} />
            <Text style={[styles.tabText, activeTab === 'crypto' && { color: '#f0b90b' }]}>
              Binance Kripto
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── TAB: Hisse/Fon ── */}
        {activeTab === 'investments' && (
          <>
            {/* Hisse/Fon özet */}
            {investments.length > 0 && (
              <Card>
                <View style={styles.pnlRow}>
                  <View style={styles.flex}>
                    <Text style={styles.muted}>Toplam Değer</Text>
                    <Text bold style={styles.white}>{formatCurrency(totalInvestmentValue)}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.muted}>Maliyet</Text>
                    <Text bold style={styles.white}>{formatCurrency(totalInvestmentCost)}</Text>
                  </View>
                  <View style={styles.flex}>
                    <Text style={styles.muted}>K/Z</Text>
                    <Text bold style={{ color: totalPnl >= 0 ? '#2ae600' : '#ef4444' }}>
                      {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
                    </Text>
                    <Text style={{ color: totalPnl >= 0 ? '#2ae600' : '#ef4444', fontSize: 12 }}>
                      {totalPnl >= 0 ? '▲' : '▼'} {Math.abs(totalPnlPct).toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </Card>
            )}

            {/* Ekle + Yenile Butonları */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => setAddModalVisible(true)}>
                <Plus color="white" size={16} />
                <Text style={styles.actionBtnText}>Ekle</Text>
              </TouchableOpacity>
              {investments.length > 0 && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#1a222e', borderWidth: 1, borderColor: '#2d3748' }]}
                  onPress={fetchInvestmentQuotes}
                  disabled={quotesLoading}
                >
                  {quotesLoading
                    ? <ActivityIndicator color="#3a81f2" size={16} />
                    : <RefreshCw color="#3a81f2" size={16} />}
                  <Text style={{ color: '#3a81f2', fontWeight: '600' }}>Güncelle</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Yatırım Listesi */}
            {investments.length === 0 ? (
              <View style={styles.emptyWrap}>
                <LineChart color="#2d3748" size={48} />
                <Text style={styles.muted}>Henüz yatırım eklenmedi</Text>
                <Text style={[styles.muted, { fontSize: 12, textAlign: 'center' }]}>
                  THYAO, AAPL, SPY gibi hisse veya fon aratıp ekleyebilirsin
                </Text>
              </View>
            ) : (
              investments.map((inv) => {
                const q = quotes[inv.symbol]
                const currentPrice = q?.regularMarketPrice ?? inv.avg_cost
                const currentValue = inv.quantity * currentPrice
                const costValue = inv.quantity * inv.avg_cost
                const pnl = currentValue - costValue
                const pnlPct = costValue > 0 ? (pnl / costValue) * 100 : 0
                const isUp = pnl >= 0

                return (
                  <Card key={inv.id} style={styles.invCard}>
                    <View style={styles.invHeader}>
                      <View style={[styles.typeBadge, { backgroundColor: (TYPE_COLORS[inv.type] ?? '#3a81f2') + '22' }]}>
                        <Text style={{ color: TYPE_COLORS[inv.type] ?? '#3a81f2', fontSize: 11, fontWeight: '700' }}>
                          {inv.type.toUpperCase()}
                        </Text>
                      </View>
                      <Text bold style={[styles.white, { flex: 1, marginLeft: 8 }]}>{inv.symbol}</Text>
                      {isUp ? <TrendingUp color="#2ae600" size={16} /> : <TrendingDown color="#ef4444" size={16} />}
                      <TouchableOpacity onPress={() => handleDelete(inv)} hitSlop={8} style={{ marginLeft: 10 }}>
                        <Trash2 color="#424d5e" size={16} />
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.muted, { fontSize: 12, marginBottom: 8 }]} numberOfLines={1}>
                      {inv.name}
                    </Text>
                    <View style={styles.invDetails}>
                      <View style={styles.invCol}>
                        <Text style={styles.invLabel}>Adet</Text>
                        <Text bold style={styles.white}>{inv.quantity}</Text>
                      </View>
                      <View style={styles.invCol}>
                        <Text style={styles.invLabel}>Ort. Maliyet</Text>
                        <Text bold style={styles.white}>{formatPrice(inv.avg_cost, inv.currency)}</Text>
                      </View>
                      <View style={styles.invCol}>
                        <Text style={styles.invLabel}>Güncel Fiyat</Text>
                        {quotesLoading && !q
                          ? <ActivityIndicator color="#3a81f2" size={14} />
                          : <Text bold style={{ color: isUp ? '#2ae600' : '#ef4444' }}>
                              {q ? formatPrice(q.regularMarketPrice, q.currency) : '—'}
                            </Text>
                        }
                      </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.invFooter}>
                      <View>
                        <Text style={styles.invLabel}>Toplam Değer</Text>
                        <Text bold style={styles.white}>{formatPrice(currentValue, inv.currency)}</Text>
                      </View>
                      <View style={styles.pnlBadge}>
                        <Text style={{ color: isUp ? '#2ae600' : '#ef4444', fontWeight: '700' }}>
                          {isUp ? '+' : ''}{formatPrice(pnl, inv.currency)}
                        </Text>
                        <Text style={{ color: isUp ? '#2ae600' : '#ef4444', fontSize: 12 }}>
                          {isUp ? '▲' : '▼'} {Math.abs(pnlPct).toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                    {q && (
                      <Text style={[styles.muted, { fontSize: 11, marginTop: 4 }]}>
                        Günlük: {q.regularMarketChange >= 0 ? '+' : ''}{q.regularMarketChange.toFixed(2)} ({q.regularMarketChangePercent.toFixed(2)}%) • {q.marketState === 'REGULAR' ? '🟢 Açık' : '🔴 Kapalı'}
                      </Text>
                    )}
                  </Card>
                )
              })
            )}
          </>
        )}

        {/* ── TAB: Binance Kripto ── */}
        {activeTab === 'crypto' && (
          <>
            <View style={styles.sectionHeader}>
              <Bitcoin color="#7a8799" size={16} />
              <Text style={styles.sectionTitle}>Binance</Text>
              {hasApiKey && (
                <TouchableOpacity onPress={fetchBinance} disabled={cryptoLoading} style={styles.refreshBtn}>
                  {cryptoLoading ? <ActivityIndicator color="#f0b90b" size={16} /> : <RefreshCw color="#f0b90b" size={16} />}
                </TouchableOpacity>
              )}
            </View>

            {!hasApiKey ? (
              <Card>
                <View style={styles.binanceSetup}>
                  <Bitcoin color="#f0b90b" size={36} />
                  <Text bold style={styles.white}>Binance Bağlı Değil</Text>
                  <Text style={[styles.muted, { textAlign: 'center' }]}>
                    API anahtarınızı girerek kripto portföyünüzü takip edin.
                  </Text>
                  <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/(tabs)/two')}>
                    <Settings color="white" size={16} />
                    <Text style={styles.white}>Ayarlardan Bağla</Text>
                  </TouchableOpacity>
                </View>
              </Card>
            ) : binanceBalances.length === 0 ? (
              <TouchableOpacity style={styles.loadBtn} onPress={fetchBinance}>
                <RefreshCw color="#f0b90b" size={18} />
                <Text style={{ color: '#f0b90b', fontWeight: '600' }}>Binance Portföyü Yükle</Text>
              </TouchableOpacity>
            ) : (
              <>
                <Card>
                  <View style={styles.row}>
                    <Bitcoin color="#f0b90b" size={18} />
                    <Text style={styles.muted}>Toplam Kripto Değeri</Text>
                  </View>
                  <Text bold size="2xl" style={styles.white}>${totalCryptoUsdt.toFixed(2)}</Text>
                </Card>
                {binanceBalances.map((b) => {
                  const total = parseFloat(b.free) + parseFloat(b.locked)
                  const price = b.asset === 'USDT' ? 1 : (cryptoPrices[b.asset] ?? 0)
                  const usdtVal = total * price
                  return (
                    <Card key={b.asset}>
                      <View style={styles.accountRow}>
                        <View style={styles.coinDot}>
                          <Text bold style={styles.white}>{b.asset.slice(0, 2)}</Text>
                        </View>
                        <View style={styles.flex}>
                          <Text bold style={styles.white}>{b.asset}</Text>
                          <Text style={styles.muted}>{total.toFixed(6)}</Text>
                        </View>
                        <Text bold style={styles.white}>${usdtVal.toFixed(2)}</Text>
                      </View>
                    </Card>
                  )
                })}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* ── Modal: Hisse/Fon Ekle ── */}
      <Modal visible={addModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text bold style={[styles.white, { fontSize: 18 }]}>Yatırım Ekle</Text>
            <TouchableOpacity onPress={() => { setAddModalVisible(false); setSelectedResult(null); setSearchQuery(''); setSearchResults([]) }}>
              <X color="#7a8799" size={22} />
            </TouchableOpacity>
          </View>

          {!selectedResult ? (
            /* Arama Ekranı */
            <>
              <View style={styles.searchBar}>
                <Search color="#7a8799" size={18} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="THYAO, AAPL, SPY, Bitcoin..."
                  placeholderTextColor="#424d5e"
                  value={searchQuery}
                  onChangeText={handleSearch}
                  autoCapitalize="characters"
                  autoFocus
                />
                {searchLoading && <ActivityIndicator color="#3a81f2" size={16} />}
              </View>

              <Text style={[styles.muted, { fontSize: 12, marginHorizontal: 16, marginBottom: 8 }]}>
                💡 BIST hisseleri için ".IS" ekleyebilirsin (örn: THYAO.IS)
              </Text>

              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.symbol}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.resultItem} onPress={() => setSelectedResult(item)}>
                    <View style={[styles.typePill, { backgroundColor: (TYPE_COLORS[item.quoteType] ?? '#3a81f2') + '22' }]}>
                      <Text style={{ color: TYPE_COLORS[item.quoteType] ?? '#3a81f2', fontSize: 10, fontWeight: '700' }}>
                        {quoteTypeLabel(item.quoteType)}
                      </Text>
                    </View>
                    <View style={styles.flex}>
                      <Text bold style={styles.white}>{item.symbol}</Text>
                      <Text style={[styles.muted, { fontSize: 12 }]} numberOfLines={1}>
                        {item.longname || item.shortname} • {item.exchange}
                      </Text>
                    </View>
                    <ChevronDown color="#424d5e" size={16} style={{ transform: [{ rotate: '-90deg' }] }} />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  searchQuery.length > 1 && !searchLoading ? (
                    <View style={styles.emptyWrap}>
                      <AlertCircle color="#424d5e" size={32} />
                      <Text style={styles.muted}>Sonuç bulunamadı</Text>
                    </View>
                  ) : null
                }
              />
            </>
          ) : (
            /* Miktar Girişi */
            <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
              {/* Seçili Sembol */}
              <Card>
                <View style={styles.row}>
                  <View style={[styles.typePill, { backgroundColor: (TYPE_COLORS[selectedResult.quoteType] ?? '#3a81f2') + '22' }]}>
                    <Text style={{ color: TYPE_COLORS[selectedResult.quoteType] ?? '#3a81f2', fontSize: 11, fontWeight: '700' }}>
                      {quoteTypeLabel(selectedResult.quoteType)}
                    </Text>
                  </View>
                  <Text bold style={[styles.white, { flex: 1 }]}>{selectedResult.symbol}</Text>
                  <TouchableOpacity onPress={() => setSelectedResult(null)}>
                    <X color="#7a8799" size={18} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.muted, { fontSize: 13 }]}>{selectedResult.longname || selectedResult.shortname}</Text>
                <Text style={[styles.muted, { fontSize: 12 }]}>{selectedResult.exchange}</Text>
              </Card>

              <Text style={styles.inputLabel}>Adet / Lot</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputField}
                  placeholder="örn: 100"
                  placeholderTextColor="#424d5e"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="decimal-pad"
                />
              </View>

              <Text style={styles.inputLabel}>Ortalama Maliyet Fiyatı</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputField}
                  placeholder="örn: 245.50"
                  placeholderTextColor="#424d5e"
                  value={avgCost}
                  onChangeText={setAvgCost}
                  keyboardType="decimal-pad"
                />
              </View>

              {quantity && avgCost ? (
                <View style={styles.costPreview}>
                  <Text style={styles.muted}>Toplam Maliyet</Text>
                  <Text bold style={styles.white}>
                    {formatCurrency(
                      parseFloat(quantity.replace(',', '.') || '0') * parseFloat(avgCost.replace(',', '.') || '0'),
                      selectedResult.exchange?.includes('IS') ? 'TRY' : 'USD'
                    )}
                  </Text>
                </View>
              ) : null}

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddInvestment}>
                <Text style={styles.saveBtnText}>Portföye Ekle</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </PageContainer>
  )
}

// ─── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 100, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  white: { color: 'white' },
  muted: { color: '#7a8799' },
  flex: { flex: 1 },

  summaryRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginTop: 8 },
  summaryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a222e', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },

  tabBar: { flexDirection: 'row', backgroundColor: '#1a222e', borderRadius: 12, padding: 4, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 8 },
  tabBtnActive: { backgroundColor: '#3a81f222' },
  tabText: { color: '#424d5e', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#3a81f2' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  sectionTitle: { color: '#7a8799', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', flex: 1 },
  refreshBtn: { padding: 4 },

  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3a81f2', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 10 },
  actionBtnText: { color: 'white', fontWeight: '700', fontSize: 14 },

  emptyWrap: { alignItems: 'center', gap: 12, padding: 40 },
  loadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#1a222e', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#f0b90b33' },

  invCard: { gap: 0 },
  invHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  invDetails: { flexDirection: 'row', gap: 0 },
  invCol: { flex: 1 },
  invLabel: { color: '#424d5e', fontSize: 11, marginBottom: 2 },
  divider: { height: 1, backgroundColor: '#2d3748', marginVertical: 10 },
  invFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pnlBadge: { alignItems: 'flex-end' },
  pnlRow: { flexDirection: 'row' },

  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  coinDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2d3748', alignItems: 'center', justifyContent: 'center' },
  binanceSetup: { alignItems: 'center', gap: 12, padding: 8 },
  setupBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3a81f2', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 4 },

  // Modal
  modalContainer: { flex: 1, backgroundColor: '#11141c' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1a222e' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, backgroundColor: '#1a222e', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12 },
  searchInput: { flex: 1, color: 'white', fontSize: 15 },
  resultItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1a222e11' },
  typePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  inputLabel: { color: '#7a8799', fontSize: 13, fontWeight: '600', marginBottom: 2 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a222e', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, borderWidth: 1, borderColor: '#2d3748' },
  inputField: { flex: 1, color: 'white', fontSize: 16 },
  costPreview: { backgroundColor: '#1a222e', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  saveBtn: { backgroundColor: '#3a81f2', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
})
