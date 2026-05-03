import { Text } from '@/components/ui/text'
import { useFinanceStore } from '@/store/financeStore'
import { useRouter } from 'expo-router'
import { ArrowDownLeft, ArrowUpRight, Camera, ChevronDown, X } from 'lucide-react-native'
import { useState } from 'react'
import { Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'

type TxType = 'expense' | 'income'

export default function AddTransaction() {
  const router = useRouter()
  const { accounts, categories, addTransaction } = useFinanceStore()

  const [type, setType] = useState<TxType>('expense')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [merchant, setMerchant] = useState('')
  const [selectedAccount, setSelectedAccount] = useState<number | null>(accounts[0]?.id ?? null)
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [showAccountPicker, setShowAccountPicker] = useState(false)
  const [showCategoryPicker, setShowCategoryPicker] = useState(false)

  const filteredCategories = categories.filter((c) => c.type === type)
  const selectedAccountObj = accounts.find((a) => a.id === selectedAccount)
  const selectedCategoryObj = categories.find((c) => c.id === selectedCategory)

  const handleSave = () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) return
    addTransaction({
      account_id: selectedAccount,
      category_id: selectedCategory,
      amount: parsedAmount,
      type,
      description: description.trim() || null,
      merchant: merchant.trim() || null,
      receipt_image: null,
      date: Math.floor(Date.now() / 1000),
    })
    router.back()
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <X color="#7a8799" size={24} />
        </TouchableOpacity>
        <Text bold size="lg" style={styles.white}>İşlem Ekle</Text>
        <TouchableOpacity onPress={() => router.push('/scan-receipt')}>
          <Camera color="#3a81f2" size={24} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Type Toggle */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'expense' && styles.expenseActive]}
            onPress={() => { setType('expense'); setSelectedCategory(null) }}
          >
            <ArrowDownLeft color={type === 'expense' ? '#ef4444' : '#424d5e'} size={18} />
            <Text style={type === 'expense' ? styles.expenseText : styles.mutedText}>Gider</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, type === 'income' && styles.incomeActive]}
            onPress={() => { setType('income'); setSelectedCategory(null) }}
          >
            <ArrowUpRight color={type === 'income' ? '#2ae600' : '#424d5e'} size={18} />
            <Text style={type === 'income' ? styles.incomeText : styles.mutedText}>Gelir</Text>
          </TouchableOpacity>
        </View>

        {/* Amount */}
        <View style={styles.amountWrap}>
          <Text style={styles.currency}>₺</Text>
          <TextInput
            style={styles.amountInput}
            placeholder="0,00"
            placeholderTextColor="#2d3748"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
        </View>

        {/* Fields */}
        <View style={styles.field}>
          <Text style={styles.label}>Açıklama</Text>
          <TextInput
            style={styles.input}
            placeholder="İşlem açıklaması"
            placeholderTextColor="#424d5e"
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Mağaza / Kurum</Text>
          <TextInput
            style={styles.input}
            placeholder="örn. Migros, Starbucks"
            placeholderTextColor="#424d5e"
            value={merchant}
            onChangeText={setMerchant}
          />
        </View>

        {/* Category Picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Kategori</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowCategoryPicker(true)}>
            {selectedCategoryObj ? (
              <View style={styles.pickerRow}>
                <View style={[styles.dot, { backgroundColor: selectedCategoryObj.color }]} />
                <Text style={styles.white}>{selectedCategoryObj.name}</Text>
              </View>
            ) : (
              <Text style={styles.mutedText}>Kategori seçin</Text>
            )}
            <ChevronDown color="#7a8799" size={18} />
          </TouchableOpacity>
        </View>

        {/* Account Picker */}
        <View style={styles.field}>
          <Text style={styles.label}>Hesap</Text>
          <TouchableOpacity style={styles.picker} onPress={() => setShowAccountPicker(true)}>
            {selectedAccountObj ? (
              <View style={styles.pickerRow}>
                <View style={[styles.dot, { backgroundColor: selectedAccountObj.color }]} />
                <Text style={styles.white}>{selectedAccountObj.name}</Text>
              </View>
            ) : (
              <Text style={styles.mutedText}>Hesap seçin</Text>
            )}
            <ChevronDown color="#7a8799" size={18} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Save Button */}
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text bold style={styles.saveBtnText}>Kaydet</Text>
      </TouchableOpacity>

      {/* Category Modal */}
      <Modal visible={showCategoryPicker} transparent animationType="slide" onRequestClose={() => setShowCategoryPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text bold size="lg" style={[styles.white, { marginBottom: 12 }]}>Kategori</Text>
            <ScrollView>
              {filteredCategories.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.optionRow, selectedCategory === c.id && styles.optionSelected]}
                  onPress={() => { setSelectedCategory(c.id); setShowCategoryPicker(false) }}
                >
                  <View style={[styles.dot, { backgroundColor: c.color }]} />
                  <Text style={styles.white}>{c.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Account Modal */}
      <Modal visible={showAccountPicker} transparent animationType="slide" onRequestClose={() => setShowAccountPicker(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text bold size="lg" style={[styles.white, { marginBottom: 12 }]}>Hesap</Text>
            {accounts.length === 0 ? (
              <Text style={styles.mutedText}>Önce hesap ekleyin.</Text>
            ) : (
              accounts.map((a) => (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.optionRow, selectedAccount === a.id && styles.optionSelected]}
                  onPress={() => { setSelectedAccount(a.id); setShowAccountPicker(false) }}
                >
                  <View style={[styles.dot, { backgroundColor: a.color }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.white}>{a.name}</Text>
                    <Text style={styles.mutedText}>{new Intl.NumberFormat('tr-TR', { style: 'currency', currency: a.currency }).format(a.balance)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11141c' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#1a222e' },
  white: { color: 'white' },
  mutedText: { color: '#424d5e' },
  scroll: { padding: 20, gap: 8, paddingBottom: 120 },
  typeToggle: { flexDirection: 'row', backgroundColor: '#1a222e', borderRadius: 12, padding: 4, marginBottom: 8 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 10 },
  expenseActive: { backgroundColor: '#ef444422' },
  incomeActive: { backgroundColor: '#2ae60022' },
  expenseText: { color: '#ef4444', fontWeight: '700' },
  incomeText: { color: '#2ae600', fontWeight: '700' },
  amountWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 24, gap: 8 },
  currency: { color: '#7a8799', fontSize: 32 },
  amountInput: { color: 'white', fontSize: 48, fontWeight: '700', minWidth: 120, textAlign: 'center' },
  field: { gap: 6 },
  label: { color: '#7a8799', fontSize: 12, fontWeight: '600' },
  input: { backgroundColor: '#1a222e', borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, padding: 14, color: 'white', fontSize: 15 },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1a222e', borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, padding: 14 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  saveBtn: { position: 'absolute', bottom: 32, left: 20, right: 20, backgroundColor: '#3a81f2', borderRadius: 14, padding: 18, alignItems: 'center' },
  saveBtnText: { color: 'white', fontSize: 17 },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1a222e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '60%' },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 10, marginBottom: 4 },
  optionSelected: { backgroundColor: '#3a81f222' },
})
