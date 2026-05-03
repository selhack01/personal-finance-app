import { Progress, ProgressFilledTrack } from '@/components/ui/progress'
import { Text } from '@/components/ui/text'
import Card from '@/library/components/card'
import PageContainer from '@/library/components/pageContainer'
import { getCategorySpending } from '@/lib/database'
import { useFinanceStore } from '@/store/financeStore'
import { PieChart, Plus, Trash2 } from 'lucide-react-native'
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'
import { useState } from 'react'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 }).format(amount)
}

export default function Budget() {
  const { budgets, categories, addBudget, deleteBudget } = useFinanceStore()
  const [showModal, setShowModal] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null)
  const [amount, setAmount] = useState('')

  const now = new Date()
  const spending = getCategorySpending(now.getMonth() + 1, now.getFullYear())

  const getSpent = (categoryId: number) => {
    return spending.find((s) => s.category_id === categoryId)?.total ?? 0
  }

  const expenseCategories = categories.filter((c) => c.type === 'expense')
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0)
  const totalSpent = budgets.reduce((sum, b) => sum + getSpent(b.category_id), 0)
  const overallPercent = totalBudget > 0 ? Math.min(Math.round((totalSpent / totalBudget) * 100), 100) : 0

  const handleAdd = () => {
    if (!selectedCategoryId || !amount || isNaN(parseFloat(amount))) return
    addBudget({
      category_id: selectedCategoryId,
      amount: parseFloat(amount),
      period: 'monthly',
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    })
    setShowModal(false)
    setAmount('')
    setSelectedCategoryId(null)
  }

  const confirmDelete = (id: number) => {
    Alert.alert('Bütçeyi Sil', 'Bu bütçe kalemi silinecek.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteBudget(id) },
    ])
  }

  const monthLabel = now.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })

  return (
    <PageContainer safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Overview Card */}
        <Card>
          <Text style={styles.muted}>{monthLabel} Bütçesi</Text>
          <View style={styles.row}>
            <View>
              <Text bold size="2xl" style={styles.white}>{formatCurrency(totalSpent)}</Text>
              <Text style={styles.muted}>harcandı</Text>
            </View>
            <View style={styles.alignEnd}>
              <Text bold size="2xl" style={styles.white}>{formatCurrency(totalBudget)}</Text>
              <Text style={styles.muted}>toplam bütçe</Text>
            </View>
          </View>
          <View style={styles.progressRow}>
            <Text style={styles.muted}>{overallPercent}%</Text>
            <Text style={[styles.muted, overallPercent > 85 && styles.red]}>
              {formatCurrency(totalBudget - totalSpent)} kaldı
            </Text>
          </View>
          <Progress value={overallPercent} style={styles.progressBg}>
            <ProgressFilledTrack style={{ backgroundColor: overallPercent > 85 ? '#ef4444' : '#3a81f2' }} />
          </Progress>
        </Card>

        {/* Budget Items */}
        {budgets.length === 0 ? (
          <View style={styles.empty}>
            <PieChart color="#424d5e" size={48} />
            <Text style={styles.emptyTitle}>Bütçe tanımlanmamış</Text>
            <Text style={styles.emptyDesc}>Kategorilere aylık bütçe sınırı{'\n'}belirleyin.</Text>
          </View>
        ) : (
          budgets.map((b) => {
            const cat = categories.find((c) => c.id === b.category_id)
            const spent = getSpent(b.category_id)
            const percent = b.amount > 0 ? Math.min(Math.round((spent / b.amount) * 100), 100) : 0
            const over = spent > b.amount

            return (
              <Card key={b.id}>
                <View style={styles.spaceBetween}>
                  <View style={styles.catRow}>
                    <View style={[styles.dot, { backgroundColor: cat?.color ?? '#6b7280' }]} />
                    <Text bold style={styles.white}>{cat?.name ?? 'Kategori'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(b.id)} hitSlop={8}>
                    <Trash2 color="#424d5e" size={16} />
                  </TouchableOpacity>
                </View>
                <View style={styles.progressRow}>
                  <Text style={[styles.muted, over && styles.red]}>
                    {formatCurrency(spent)} / {formatCurrency(b.amount)}
                  </Text>
                  <Text style={[styles.muted, over && styles.red]}>{percent}%</Text>
                </View>
                <Progress value={percent} style={styles.progressBg}>
                  <ProgressFilledTrack style={{ backgroundColor: over ? '#ef4444' : cat?.color ?? '#3a81f2' }} />
                </Progress>
                {over && (
                  <Text style={[styles.red, styles.overText]}>
                    {formatCurrency(spent - b.amount)} aşıldı!
                  </Text>
                )}
              </Card>
            )
          })
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="white" size={28} />
      </TouchableOpacity>

      {/* Add Budget Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text bold size="lg" style={styles.white}>Bütçe Ekle</Text>
            <Text style={styles.muted}>{monthLabel}</Text>

            <Text style={[styles.white, { marginTop: 16, marginBottom: 8 }]}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {expenseCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.catChip, selectedCategoryId === c.id && { borderColor: c.color }]}
                  onPress={() => setSelectedCategoryId(c.id)}
                >
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={selectedCategoryId === c.id ? styles.white : styles.muted}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.white, { marginTop: 16, marginBottom: 8 }]}>Bütçe Tutarı (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#424d5e"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={styles.muted}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAdd}>
                <Text style={styles.white}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PageContainer>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 100, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginVertical: 12 },
  alignEnd: { alignItems: 'flex-end' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressBg: { backgroundColor: '#151d2b' },
  spaceBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  catRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  white: { color: 'white' },
  muted: { color: '#7a8799' },
  red: { color: '#ef4444' },
  overText: { fontSize: 12, marginTop: 4, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: '#7a8799', textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#3a81f2', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1a222e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 4 },
  catScroll: { marginBottom: 4 },
  catChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2d3748', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8 },
  input: { backgroundColor: '#11141c', borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, padding: 12, color: 'white', fontSize: 18, marginBottom: 8 },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#2d3748', alignItems: 'center' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#3a81f2', alignItems: 'center' },
})
