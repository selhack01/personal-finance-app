import { Text } from '@/components/ui/text'
import Card from '@/library/components/card'
import Chip from '@/library/components/chip'
import PageContainer from '@/library/components/pageContainer'
import { useFinanceStore } from '@/store/financeStore'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import { Bitcoin, Building2, RefreshCw, Settings, TrendingUp, Wallet } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

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
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

export default function Portfolio() {
  const router = useRouter()
  const { accounts } = useFinanceStore()
  const [binanceBalances, setBinanceBalances] = useState<BinanceBalance[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [hasApiKey, setHasApiKey] = useState(false)

  const bankAccounts = accounts.filter((a) => a.type === 'bank')
  const cryptoAccounts = accounts.filter((a) => a.type === 'crypto')
  const cashAccounts = accounts.filter((a) => a.type === 'cash')

  const totalBank = bankAccounts.reduce((s, a) => s + a.balance, 0)
  const totalCash = cashAccounts.reduce((s, a) => s + a.balance, 0)

  useEffect(() => {
    SecureStore.getItemAsync('binance_api_key').then((k) => setHasApiKey(!!k))
  }, [])

  const fetchBinance = useCallback(async () => {
    const apiKey = await SecureStore.getItemAsync('binance_api_key')
    const apiSecret = await SecureStore.getItemAsync('binance_api_secret')
    if (!apiKey || !apiSecret) {
      Alert.alert('API Anahtarı Gerekli', 'Ayarlar sayfasından Binance API anahtarınızı girin.')
      return
    }

    setLoading(true)
    try {
      const timestamp = Date.now()
      const queryString = `timestamp=${timestamp}`
      const encoder = new TextEncoder()
      const keyData = encoder.encode(apiSecret)
      const msgData = encoder.encode(queryString)
      const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
      const signature = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
      const hexSignature = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, '0')).join('')

      const accountRes = await fetch(
        `https://api.binance.com/api/v3/account?${queryString}&signature=${hexSignature}`,
        { headers: { 'X-MBX-APIKEY': apiKey } }
      )
      const accountData = await accountRes.json()
      if (!accountRes.ok) throw new Error(accountData.msg ?? 'Binance API hatası')

      const nonZero: BinanceBalance[] = (accountData.balances as BinanceBalance[]).filter(
        (b) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
      )
      setBinanceBalances(nonZero)

      const symbols = nonZero.filter((b) => b.asset !== 'USDT').map((b) => `${b.asset}USDT`)
      if (symbols.length > 0) {
        const tickerRes = await fetch('https://api.binance.com/api/v3/ticker/price')
        const tickers: TickerPrice[] = await tickerRes.json()
        const priceMap: Record<string, number> = { USDT: 1 }
        for (const t of tickers) {
          if (symbols.includes(t.symbol)) {
            priceMap[t.symbol.replace('USDT', '')] = parseFloat(t.price)
          }
        }
        setPrices(priceMap)
      }
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Binance verileri alınamadı')
    } finally {
      setLoading(false)
    }
  }, [])

  const getUsdtValue = (balance: BinanceBalance) => {
    const total = parseFloat(balance.free) + parseFloat(balance.locked)
    const price = balance.asset === 'USDT' ? 1 : (prices[balance.asset] ?? 0)
    return total * price
  }

  const totalCryptoUsdt = binanceBalances.reduce((s, b) => s + getUsdtValue(b), 0)

  return (
    <PageContainer safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Total */}
        <Card>
          <View style={styles.row}>
            <TrendingUp color="#3a81f2" size={20} />
            <Text style={styles.muted} size="lg">Toplam Portföy</Text>
          </View>
          <Text bold size="5xl" style={styles.white}>
            {formatCurrency(totalBank + totalCash)}
          </Text>
          {totalCryptoUsdt > 0 && (
            <Text style={styles.muted}>+ ${totalCryptoUsdt.toFixed(2)} kripto</Text>
          )}
        </Card>

        {/* Bank Accounts */}
        <View style={styles.sectionHeader}>
          <Building2 color="#7a8799" size={16} />
          <Text style={styles.sectionTitle}>Banka Hesapları</Text>
        </View>
        {bankAccounts.length === 0 ? (
          <TouchableOpacity style={styles.emptyCard} onPress={() => router.push('/(tabs)/accounts')}>
            <Text style={styles.muted}>Hesap Ekle →</Text>
          </TouchableOpacity>
        ) : (
          bankAccounts.map((a) => (
            <Card key={a.id}>
              <View style={styles.accountRow}>
                <View style={[styles.iconWrap, { backgroundColor: a.color + '22' }]}>
                  <Building2 color={a.color} size={20} />
                </View>
                <View style={styles.flex}>
                  <Text bold style={styles.white}>{a.name}</Text>
                  <Text style={styles.muted}>{a.currency}</Text>
                </View>
                <Text bold style={styles.white}>{formatCurrency(a.balance, a.currency)}</Text>
              </View>
            </Card>
          ))
        )}

        {/* Cash */}
        {cashAccounts.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Wallet color="#7a8799" size={16} />
              <Text style={styles.sectionTitle}>Nakit</Text>
            </View>
            {cashAccounts.map((a) => (
              <Card key={a.id}>
                <View style={styles.accountRow}>
                  <View style={[styles.iconWrap, { backgroundColor: a.color + '22' }]}>
                    <Wallet color={a.color} size={20} />
                  </View>
                  <View style={styles.flex}>
                    <Text bold style={styles.white}>{a.name}</Text>
                    <Text style={styles.muted}>{a.currency}</Text>
                  </View>
                  <Text bold style={styles.white}>{formatCurrency(a.balance, a.currency)}</Text>
                </View>
              </Card>
            ))}
          </>
        )}

        {/* Binance */}
        <View style={styles.sectionHeader}>
          <Bitcoin color="#7a8799" size={16} />
          <Text style={styles.sectionTitle}>Binance</Text>
          {hasApiKey && (
            <TouchableOpacity onPress={fetchBinance} disabled={loading} style={styles.refreshBtn}>
              {loading ? <ActivityIndicator color="#3a81f2" size={16} /> : <RefreshCw color="#3a81f2" size={16} />}
            </TouchableOpacity>
          )}
        </View>

        {!hasApiKey ? (
          <Card>
            <View style={styles.binanceSetup}>
              <Bitcoin color="#f0b90b" size={32} />
              <Text bold style={styles.white}>Binance Bağlı Değil</Text>
              <Text style={[styles.muted, styles.center]}>
                API anahtarınızı girerek kripto portföyünüzü takip edin.
              </Text>
              <TouchableOpacity style={styles.setupBtn} onPress={() => router.push('/(tabs)/two')}>
                <Settings color="white" size={16} />
                <Text style={styles.white}>Ayarlardan Bağla</Text>
              </TouchableOpacity>
            </View>
          </Card>
        ) : binanceBalances.length === 0 ? (
          <TouchableOpacity style={styles.emptyCard} onPress={fetchBinance}>
            <Text style={styles.muted}>Verileri Yükle →</Text>
          </TouchableOpacity>
        ) : (
          <>
            <Card>
              <View style={styles.row}>
                <Bitcoin color="#f0b90b" size={18} />
                <Text style={styles.muted}>Toplam Kripto Değeri</Text>
              </View>
              <Text bold size="2xl" style={styles.white}>${totalCryptoUsdt.toFixed(2)}</Text>
              <Chip text={`${binanceBalances.length} coin`} status={true} />
            </Card>
            {binanceBalances.map((b) => {
              const total = parseFloat(b.free) + parseFloat(b.locked)
              const usdtVal = getUsdtValue(b)
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
      </ScrollView>
    </PageContainer>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 100, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  white: { color: 'white' },
  muted: { color: '#7a8799' },
  center: { textAlign: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 4 },
  sectionTitle: { color: '#7a8799', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', flex: 1 },
  refreshBtn: { padding: 4 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  emptyCard: { backgroundColor: '#1a222e', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#2d3748', borderStyle: 'dashed' },
  binanceSetup: { alignItems: 'center', gap: 12, padding: 8 },
  setupBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3a81f2', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, marginTop: 4 },
  coinDot: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2d3748', alignItems: 'center', justifyContent: 'center' },
})
