import { Text } from '@/components/ui/text'
import { useFinanceStore } from '@/store/financeStore'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import { Camera, CheckCircle, ImageIcon, Loader, ReceiptText, X } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'

interface ParsedReceipt {
  merchant: string
  total: number
  date: string
  category: string
  items: { name: string; price: number }[]
}

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

export default function ScanReceipt() {
  const router = useRouter()
  const { categories, accounts, addTransaction } = useFinanceStore()

  const [imageUri, setImageUri] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [parsed, setParsed] = useState<ParsedReceipt | null>(null)
  const [editedTotal, setEditedTotal] = useState('')
  const [editedMerchant, setEditedMerchant] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(accounts[0]?.id ?? null)

  const pickImage = async (fromCamera: boolean) => {
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 })

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
      setParsed(null)
      analyzeReceipt(result.assets[0].uri)
    }
  }

  const analyzeReceipt = async (uri: string) => {
    setLoading(true)
    try {
      const groqKey = await SecureStore.getItemAsync('groq_api_key')
      if (!groqKey) {
        Alert.alert(
          'Groq API Anahtarı Gerekli',
          'Ayarlar → Groq API bölümünden api.groq.com adresinden ücretsiz aldığınız anahtarı girin.',
          [{ text: 'Tamam' }]
        )
        setLoading(false)
        return
      }

      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
      const mimeType = uri.endsWith('.png') ? 'image/png' : 'image/jpeg'

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:${mimeType};base64,${base64}` },
                },
                {
                  type: 'text',
                  text: `Bu bir fiş/fatura fotoğrafıdır. Aşağıdaki JSON formatında bilgileri çıkar. Sadece JSON döndür, başka açıklama yazma:
{
  "merchant": "mağaza/restoran adı",
  "total": sayısal toplam tutar (sadece rakam, TL işareti olmadan),
  "date": "GG/AA/YYYY formatında tarih",
  "category": "Market|Yemek|Ulaşım|Faturalar|Eğlence|Sağlık|Giyim|Diğer seçeneklerinden biri",
  "items": [{"name": "ürün adı", "price": fiyat}]
}
Toplam tutarı bulamazsan null yaz. Tarih yoksa bugünün tarihini yaz.`,
                },
              ],
            },
          ],
          max_tokens: 1024,
          temperature: 0.1,
        }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error?.message ?? 'Groq API hatası')

      const content = data.choices?.[0]?.message?.content ?? ''
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) throw new Error('Yanıt ayrıştırılamadı')

      const result: ParsedReceipt = JSON.parse(jsonMatch[0])
      setParsed(result)
      setEditedTotal(String(result.total ?? ''))
      setEditedMerchant(result.merchant ?? '')
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Fiş okunamadı. Tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = () => {
    const amount = parseFloat(editedTotal.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Uyarı', 'Geçerli bir tutar girin.')
      return
    }
    const categoryId = categories.find((c) => c.name === parsed?.category)?.id ?? null

    addTransaction({
      account_id: selectedAccountId,
      category_id: categoryId,
      amount,
      type: 'expense',
      description: parsed?.items?.map((i) => i.name).join(', ') || null,
      merchant: editedMerchant || null,
      receipt_image: imageUri,
      date: Math.floor(Date.now() / 1000),
    })
    router.back()
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <X color="#7a8799" size={24} />
        </TouchableOpacity>
        <Text bold size="lg" style={styles.white}>Fiş Tara</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!imageUri ? (
          <View style={styles.pickArea}>
            <ReceiptText color="#424d5e" size={64} />
            <Text bold style={styles.white}>Fiş Fotoğrafı Seç</Text>
            <Text style={styles.muted}>Groq Vision ile otomatik analiz edilir</Text>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.pickBtn} onPress={() => pickImage(true)}>
                <Camera color="white" size={20} />
                <Text style={styles.white}>Kamera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickBtn, styles.outlineBtn]} onPress={() => pickImage(false)}>
                <ImageIcon color="#3a81f2" size={20} />
                <Text style={{ color: '#3a81f2' }}>Galeri</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <>
            <Image source={{ uri: imageUri }} style={styles.preview} resizeMode="contain" />

            {loading && (
              <View style={styles.loadingCard}>
                <Loader color="#3a81f2" size={24} />
                <Text style={styles.muted}>Groq Vision analiz ediyor...</Text>
              </View>
            )}

            {!loading && !parsed && (
              <TouchableOpacity style={styles.retryBtn} onPress={() => analyzeReceipt(imageUri)}>
                <Text style={styles.white}>Tekrar Analiz Et</Text>
              </TouchableOpacity>
            )}

            {parsed && (
              <View style={styles.resultCard}>
                <View style={styles.resultHeader}>
                  <CheckCircle color="#2ae600" size={20} />
                  <Text bold style={styles.white}>Fiş Okundu</Text>
                </View>

                <Text style={styles.fieldLabel}>Mağaza</Text>
                <TextInput
                  style={styles.input}
                  value={editedMerchant}
                  onChangeText={setEditedMerchant}
                  placeholderTextColor="#424d5e"
                />

                <Text style={styles.fieldLabel}>Toplam Tutar (₺)</Text>
                <TextInput
                  style={styles.input}
                  value={editedTotal}
                  onChangeText={setEditedTotal}
                  keyboardType="numeric"
                  placeholderTextColor="#424d5e"
                />

                <Text style={styles.fieldLabel}>Kategori</Text>
                <View style={styles.categoryBadge}>
                  <View style={[styles.dot, { backgroundColor: categories.find((c) => c.name === parsed.category)?.color ?? '#6b7280' }]} />
                  <Text style={styles.white}>{parsed.category}</Text>
                </View>

                {parsed.items?.length > 0 && (
                  <>
                    <Text style={styles.fieldLabel}>Ürünler</Text>
                    {parsed.items.map((item, i) => (
                      <View key={i} style={styles.itemRow}>
                        <Text style={styles.white}>{item.name}</Text>
                        <Text style={styles.muted}>₺{item.price}</Text>
                      </View>
                    ))}
                  </>
                )}

                <Text style={styles.fieldLabel}>Hesap</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {accounts.map((a) => (
                    <TouchableOpacity
                      key={a.id}
                      style={[styles.accountChip, selectedAccountId === a.id && { borderColor: a.color }]}
                      onPress={() => setSelectedAccountId(a.id)}
                    >
                      <View style={[styles.dot, { backgroundColor: a.color }]} />
                      <Text style={selectedAccountId === a.id ? styles.white : styles.muted}>{a.name}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text bold style={styles.saveBtnText}>Harcamayı Kaydet</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.rescanBtn} onPress={() => { setImageUri(null); setParsed(null) }}>
                  <Text style={styles.muted}>Başka Fiş Tara</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11141c' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 56, borderBottomWidth: 1, borderBottomColor: '#1a222e' },
  scroll: { padding: 20, paddingBottom: 60 },
  white: { color: 'white' },
  muted: { color: '#7a8799' },
  pickArea: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, gap: 16 },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  pickBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#3a81f2', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  outlineBtn: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#3a81f2' },
  preview: { width: '100%', height: 260, borderRadius: 12, marginBottom: 16, backgroundColor: '#1a222e' },
  loadingCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1a222e', borderRadius: 12, padding: 16 },
  retryBtn: { backgroundColor: '#2d3748', borderRadius: 10, padding: 14, alignItems: 'center' },
  resultCard: { backgroundColor: '#1a222e', borderRadius: 16, padding: 16, gap: 4 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  fieldLabel: { color: '#7a8799', fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: { backgroundColor: '#11141c', borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, padding: 12, color: 'white', fontSize: 15 },
  categoryBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#11141c', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#2d3748' },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#2d3748' },
  accountChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#2d3748', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8, marginTop: 4 },
  saveBtn: { backgroundColor: '#3a81f2', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  saveBtnText: { color: 'white', fontSize: 16 },
  rescanBtn: { alignItems: 'center', padding: 12 },
})
