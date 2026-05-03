import { Progress, ProgressFilledTrack } from '@/components/ui/progress'
import { Text } from '@/components/ui/text'
import Card from '@/library/components/card'
import Chip from '@/library/components/chip'
import PageContainer from '@/library/components/pageContainer'
import { useFinanceStore } from '@/store/financeStore'
import { getMonthlyStats } from '@/lib/database'
import { useRouter } from 'expo-router'
import { ArrowDownLeft, ArrowUpRight, ChartArea, Plus, Wallet } from 'lucide-react-native'
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

function formatCurrency(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

export default function Dashboard() {
  const router = useRouter()
  const { accounts, transactions, categories } = useFinanceStore()

  const now = new Date()
  const { income, expense } = getMonthlyStats(now.getMonth() + 1, now.getFullYear())

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0)
  const netMonthly = income - expense
  const budgetUsedPercent = income > 0 ? Math.min(Math.round((expense / income) * 100), 100) : 0

  const recentTransactions = transactions.slice(0, 5)

  const getCategoryName = (id: number | null) => {
    if (!id) return 'Genel'
    return categories.find((c) => c.id === id)?.name ?? 'Genel'
  }

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp * 1000)
    return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' })
  }

  return (
    <PageContainer safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Net Worth */}
        <View style={styles.heroSection}>
          <Text size="lg" style={styles.label}>Toplam Varlık</Text>
          <Text size="5xl" bold style={styles.bigAmount}>{formatCurrency(totalBalance)}</Text>
          <Chip
            text={netMonthly >= 0 ? `+${formatCurrency(netMonthly)} bu ay` : `${formatCurrency(netMonthly)} bu ay`}
            status={netMonthly >= 0}
          />
        </View>

        {/* Monthly Income/Expense */}
        <View style={styles.row}>
          <Card style={styles.halfCard}>
            <View style={styles.cardRow}>
              <ArrowUpRight color="#2ae600" size={20} />
              <Text style={styles.label}>Gelir</Text>
            </View>
            <Text bold style={styles.greenAmount}>{formatCurrency(income)}</Text>
          </Card>
          <Card style={styles.halfCard}>
            <View style={styles.cardRow}>
              <ArrowDownLeft color="#ef4444" size={20} />
              <Text style={styles.label}>Gider</Text>
            </View>
            <Text bold style={styles.redAmount}>{formatCurrency(expense)}</Text>
          </Card>
        </View>

        {/* Budget */}
        <Card>
          <View style={styles.spaceBetween}>
            <Text style={styles.label} size="lg">Aylık Bütçe</Text>
            <Wallet color="#7a8799" size={18} />
          </View>
          <Text bold size="2xl" style={styles.white}>{formatCurrency(income - expense)}</Text>
          <Text style={styles.label}>kalan</Text>
          <View style={styles.progressRow}>
            <Text style={styles.label}>{budgetUsedPercent}% kullanıldı</Text>
            <Text style={styles.label}>{formatCurrency(income - expense)} kaldı</Text>
          </View>
          <Progress value={budgetUsedPercent} style={styles.progressBg}>
            <ProgressFilledTrack style={{ backgroundColor: budgetUsedPercent > 85 ? '#ef4444' : '#006fed' }} />
          </Progress>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <View style={styles.spaceBetween}>
            <Text style={styles.label} size="lg">Son İşlemler</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
              <Text style={styles.seeAll}>Tümünü gör</Text>
            </TouchableOpacity>
          </View>

          {recentTransactions.length === 0 ? (
            <View style={styles.empty}>
              <ChartArea color="#424d5e" size={32} />
              <Text style={styles.emptyText}>Henüz işlem yok</Text>
            </View>
          ) : (
            recentTransactions.map((t) => (
              <View key={t.id} style={styles.txItem}>
                <View>
                  <Text bold style={styles.white}>{t.merchant ?? t.description ?? 'İşlem'}</Text>
                  <Text style={styles.label}>{getCategoryName(t.category_id)} • {formatDate(t.date)}</Text>
                </View>
                <Text bold style={t.type === 'income' ? styles.greenAmount : styles.redAmount}>
                  {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                </Text>
              </View>
            ))
          )}
        </Card>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-transaction')}>
        <Plus color="white" size={28} />
      </TouchableOpacity>
    </PageContainer>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 100, gap: 12 },
  heroSection: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  label: { color: '#7a8799' },
  bigAmount: { color: 'white', lineHeight: 52 },
  row: { flexDirection: 'row', gap: 12 },
  halfCard: { flex: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  greenAmount: { color: '#2ae600', fontSize: 16 },
  redAmount: { color: '#ef4444', fontSize: 16 },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  white: { color: 'white' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 8 },
  progressBg: { backgroundColor: '#151d2b' },
  seeAll: { color: '#3a81f2', fontSize: 13 },
  txItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1a222e' },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { color: '#424d5e' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#3a81f2',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
})
