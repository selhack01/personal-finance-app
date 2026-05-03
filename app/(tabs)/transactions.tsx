import { Text } from '@/components/ui/text'
import PageContainer from '@/library/components/pageContainer'
import { useFinanceStore } from '@/store/financeStore'
import { useRouter } from 'expo-router'
import { ArrowDownLeft, ArrowUpRight, Plus, ReceiptText, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'

type Filter = 'all' | 'income' | 'expense'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 2 }).format(amount)
}

function formatDate(timestamp: number) {
  const d = new Date(timestamp * 1000)
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function Transactions() {
  const router = useRouter()
  const { transactions, categories, deleteTransaction } = useFinanceStore()
  const [filter, setFilter] = useState<Filter>('all')

  const filtered = transactions.filter((t) => filter === 'all' || t.type === filter)

  const getCategoryColor = (id: number | null) => {
    if (!id) return '#6b7280'
    return categories.find((c) => c.id === id)?.color ?? '#6b7280'
  }

  const getCategoryName = (id: number | null) => {
    if (!id) return 'Genel'
    return categories.find((c) => c.id === id)?.name ?? 'Genel'
  }

  const confirmDelete = (id: number) => {
    Alert.alert('İşlemi Sil', 'Bu işlem silinecek. Emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteTransaction(id) },
    ])
  }

  const groupByDate = () => {
    const groups: Record<string, typeof filtered> = {}
    for (const t of filtered) {
      const key = formatDate(t.date)
      if (!groups[key]) groups[key] = []
      groups[key].push(t)
    }
    return groups
  }

  const groups = groupByDate()

  return (
    <PageContainer safeArea={false}>
      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['all', 'income', 'expense'] as Filter[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Tümü' : f === 'income' ? 'Gelir' : 'Gider'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <ReceiptText color="#424d5e" size={48} />
            <Text style={styles.emptyTitle}>İşlem bulunamadı</Text>
            <Text style={styles.emptyDesc}>Sağ alttaki + butonuna basarak{'\n'}ilk işleminizi ekleyin.</Text>
          </View>
        ) : (
          Object.entries(groups).map(([date, items]) => (
            <View key={date}>
              <Text style={styles.dateHeader}>{date}</Text>
              {items.map((t) => (
                <View key={t.id} style={styles.txItem}>
                  <View style={[styles.iconWrap, { backgroundColor: getCategoryColor(t.category_id) + '22' }]}>
                    {t.type === 'income'
                      ? <ArrowUpRight color="#2ae600" size={20} />
                      : <ArrowDownLeft color="#ef4444" size={20} />
                    }
                  </View>
                  <View style={styles.txInfo}>
                    <Text bold style={styles.white}>{t.merchant ?? t.description ?? 'İşlem'}</Text>
                    <Text style={styles.muted}>{getCategoryName(t.category_id)}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text bold style={t.type === 'income' ? styles.green : styles.red}>
                      {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                    </Text>
                    <TouchableOpacity onPress={() => confirmDelete(t.id)} hitSlop={8}>
                      <Trash2 color="#424d5e" size={16} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-transaction')}>
        <Plus color="white" size={28} />
      </TouchableOpacity>
    </PageContainer>
  )
}

const styles = StyleSheet.create({
  filterBar: { flexDirection: 'row', backgroundColor: '#1a222e', margin: 16, borderRadius: 10, padding: 4 },
  filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  filterActive: { backgroundColor: '#3a81f2' },
  filterText: { color: '#7a8799', fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: 'white' },
  scroll: { paddingHorizontal: 16, paddingBottom: 100 },
  dateHeader: { color: '#424d5e', fontSize: 12, fontWeight: '600', marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  txItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a222e', borderRadius: 12, padding: 12, marginBottom: 8, gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  white: { color: 'white' },
  muted: { color: '#7a8799', fontSize: 12 },
  green: { color: '#2ae600', fontWeight: '700' },
  red: { color: '#ef4444', fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: '#7a8799', textAlign: 'center', lineHeight: 22 },
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
