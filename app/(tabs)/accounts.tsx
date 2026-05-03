import { Text } from '@/components/ui/text'
import Card from '@/library/components/card'
import PageContainer from '@/library/components/pageContainer'
import { useFinanceStore } from '@/store/financeStore'
import { Bitcoin, Building2, CreditCard, Plus, Trash2, Wallet } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Modal, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'

const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Banka', icon: Building2, color: '#3a81f2' },
  { value: 'crypto', label: 'Kripto', icon: Bitcoin, color: '#f0b90b' },
  { value: 'cash', label: 'Nakit', icon: Wallet, color: '#2ae600' },
  { value: 'other', label: 'Diğer', icon: CreditCard, color: '#8b5cf6' },
]

const COLORS = ['#3a81f2', '#2ae600', '#f0b90b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b']

function formatCurrency(amount: number, currency = 'TRY') {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency, maximumFractionDigits: 2 }).format(amount)
}

function AccountIcon({ type, color, size = 20 }: { type: string; color: string; size?: number }) {
  const found = ACCOUNT_TYPES.find((t) => t.value === type)
  const Icon = found?.icon ?? CreditCard
  return <Icon color={color} size={size} />
}

export default function Accounts() {
  const { accounts, addAccount, deleteAccount } = useFinanceStore()
  const [showModal, setShowModal] = useState(false)
  const [name, setName] = useState('')
  const [selectedType, setSelectedType] = useState('bank')
  const [balance, setBalance] = useState('')
  const [currency, setCurrency] = useState('TRY')
  const [selectedColor, setSelectedColor] = useState(COLORS[0])

  const totalBalance = accounts
    .filter((a) => a.currency === 'TRY')
    .reduce((s, a) => s + a.balance, 0)

  const handleAdd = () => {
    if (!name.trim()) { Alert.alert('Uyarı', 'Hesap adı girin.'); return }
    addAccount({
      name: name.trim(),
      type: selectedType,
      balance: parseFloat(balance) || 0,
      currency,
      color: selectedColor,
      icon: selectedType,
    })
    setShowModal(false)
    setName('')
    setBalance('')
    setSelectedType('bank')
    setSelectedColor(COLORS[0])
    setCurrency('TRY')
  }

  const confirmDelete = (id: number, name: string) => {
    Alert.alert('Hesabı Sil', `"${name}" hesabı silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: () => deleteAccount(id) },
    ])
  }

  const grouped = ACCOUNT_TYPES.map((t) => ({
    ...t,
    items: accounts.filter((a) => a.type === t.value),
  })).filter((g) => g.items.length > 0)

  return (
    <PageContainer safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Summary */}
        <Card>
          <Text style={styles.muted}>Toplam (TRY)</Text>
          <Text bold size="5xl" style={styles.white}>{formatCurrency(totalBalance)}</Text>
          <Text style={styles.muted}>{accounts.length} hesap</Text>
        </Card>

        {/* Grouped Accounts */}
        {accounts.length === 0 ? (
          <View style={styles.empty}>
            <CreditCard color="#424d5e" size={48} />
            <Text style={styles.emptyTitle}>Hesap yok</Text>
            <Text style={styles.emptyDesc}>İlk hesabınızı eklemek için{'\n'}+ butonuna basın.</Text>
          </View>
        ) : (
          grouped.map(({ value, label, icon: Icon, items }) => (
            <View key={value}>
              <View style={styles.groupHeader}>
                <Icon color="#7a8799" size={14} />
                <Text style={styles.groupLabel}>{label}</Text>
              </View>
              {items.map((a) => (
                <Card key={a.id}>
                  <View style={styles.accountRow}>
                    <View style={[styles.iconWrap, { backgroundColor: a.color + '22' }]}>
                      <AccountIcon type={a.type} color={a.color} />
                    </View>
                    <View style={styles.flex}>
                      <Text bold style={styles.white}>{a.name}</Text>
                      <Text style={styles.muted}>{a.type === 'crypto' ? 'Kripto' : a.currency}</Text>
                    </View>
                    <View style={styles.rightCol}>
                      <Text bold style={styles.white}>{formatCurrency(a.balance, a.currency)}</Text>
                      <TouchableOpacity onPress={() => confirmDelete(a.id, a.name)} hitSlop={8}>
                        <Trash2 color="#424d5e" size={16} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setShowModal(true)}>
        <Plus color="white" size={28} />
      </TouchableOpacity>

      {/* Add Account Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text bold size="lg" style={styles.white}>Hesap Ekle</Text>

            <Text style={styles.fieldLabel}>Hesap Türü</Text>
            <View style={styles.typeRow}>
              {ACCOUNT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.typeBtn, selectedType === t.value && { borderColor: t.color }]}
                  onPress={() => setSelectedType(t.value)}
                >
                  <t.icon color={selectedType === t.value ? t.color : '#7a8799'} size={18} />
                  <Text style={selectedType === t.value ? styles.white : styles.muted}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Hesap Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="örn. Garanti Vadesiz"
              placeholderTextColor="#424d5e"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={styles.fieldLabel}>Başlangıç Bakiyesi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor="#424d5e"
                  keyboardType="numeric"
                  value={balance}
                  onChangeText={setBalance}
                />
              </View>
              <View style={{ width: 90 }}>
                <Text style={styles.fieldLabel}>Para Birimi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="TRY"
                  placeholderTextColor="#424d5e"
                  value={currency}
                  onChangeText={setCurrency}
                  autoCapitalize="characters"
                  maxLength={4}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Renk</Text>
            <View style={styles.colorRow}>
              {COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorDot, { backgroundColor: c }, selectedColor === c && styles.colorDotSelected]}
                  onPress={() => setSelectedColor(c)}
                />
              ))}
            </View>

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
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, marginBottom: 6 },
  groupLabel: { color: '#7a8799', fontSize: 12, fontWeight: '600', textTransform: 'uppercase' },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  white: { color: 'white' },
  muted: { color: '#7a8799' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
  emptyDesc: { color: '#7a8799', textAlign: 'center', lineHeight: 22 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#3a81f2', alignItems: 'center', justifyContent: 'center', elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#1a222e', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, gap: 4 },
  fieldLabel: { color: '#7a8799', fontSize: 12, marginTop: 12, marginBottom: 6 },
  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: { flex: 1, flexDirection: 'column', alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, padding: 10 },
  input: { backgroundColor: '#11141c', borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, padding: 12, color: 'white', fontSize: 15 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  colorRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap', marginBottom: 4 },
  colorDot: { width: 28, height: 28, borderRadius: 14 },
  colorDotSelected: { borderWidth: 2, borderColor: 'white', transform: [{ scale: 1.2 }] },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#2d3748', alignItems: 'center' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#3a81f2', alignItems: 'center' },
})
