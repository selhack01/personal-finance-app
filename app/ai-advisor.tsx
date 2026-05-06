import { Text } from '@/components/ui/text'
import { getCategorySpending, getMonthlyStats } from '@/lib/database'
import { useFinanceStore } from '@/store/financeStore'
import { useInvestmentStore } from '@/store/investmentStore'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import {
  Bot,
  ChevronLeft,
  Send,
  Sparkles,
  User,
  X,
} from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'

function buildFinancialContext(
  accounts: ReturnType<typeof useFinanceStore.getState>['accounts'],
  categories: ReturnType<typeof useFinanceStore.getState>['categories'],
  transactions: ReturnType<typeof useFinanceStore.getState>['transactions'],
  budgets: ReturnType<typeof useFinanceStore.getState>['budgets'],
  investments: ReturnType<typeof useInvestmentStore.getState>['investments']
): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()
  const stats = getMonthlyStats(month, year)
  const lastMonth = month === 1 ? 12 : month - 1
  const lastMonthYear = month === 1 ? year - 1 : year
  const statsLast = getMonthlyStats(lastMonth, lastMonthYear)
  const catSpending = getCategorySpending(month, year)

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)
  const bankBalance = accounts.filter(a => a.type === 'bank').reduce((s, a) => s + a.balance, 0)
  const cashBalance = accounts.filter(a => a.type === 'cash').reduce((s, a) => s + a.balance, 0)

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]))

  const catLines = catSpending.map(cs => {
    const budget = budgets.find(b => b.category_id === cs.category_id && b.month === month && b.year === year)
    const bLine = budget ? ` / Bütçe: ${budget.amount.toFixed(2)} TL (${((cs.total / budget.amount) * 100).toFixed(0)}%)` : ''
    return `  - ${catMap[cs.category_id] ?? 'Diğer'}: ${cs.total.toFixed(2)} TL${bLine}`
  }).join('\n')

  const recentTxLines = transactions
    .slice(0, 10)
    .map(t => {
      const d = new Date(t.date * 1000)
      const catName = t.category_id ? (catMap[t.category_id] ?? 'Bilinmiyor') : 'Kategori Yok'
      return `  - ${d.toLocaleDateString('tr-TR')} | ${t.type === 'income' ? 'GELİR' : 'GİDER'} | ${t.amount.toFixed(2)} TL | ${t.merchant ?? t.description ?? '—'} | ${catName}`
    }).join('\n')

  const invLines = investments.length > 0
    ? investments.map(inv => `  - ${inv.symbol} (${inv.name}): ${inv.quantity} adet, ort. maliyet ${inv.avg_cost} ${inv.currency}`).join('\n')
    : '  Henüz yatırım eklenmemiş.'

  const budgetLines = budgets.filter(b => b.month === month && b.year === year).map(b => {
    const cat = categories.find(c => c.id === b.category_id)
    const spent = catSpending.find(cs => cs.category_id === b.category_id)?.total ?? 0
    return `  - ${cat?.name ?? 'Bilinmiyor'}: ${spent.toFixed(2)} / ${b.amount.toFixed(2)} TL`
  }).join('\n')

  return `
=== KİŞİSEL FİNANS VERİLERİ (${now.toLocaleDateString('tr-TR')}) ===

HESAP BAKİYELERİ:
  Toplam: ${totalBalance.toFixed(2)} TL
  Banka: ${bankBalance.toFixed(2)} TL
  Nakit: ${cashBalance.toFixed(2)} TL

BU AY (${month}/${year}):
  Toplam Gelir: ${stats.income.toFixed(2)} TL
  Toplam Gider: ${stats.expense.toFixed(2)} TL
  Net: ${(stats.income - stats.expense).toFixed(2)} TL

GEÇEN AY (${lastMonth}/${lastMonthYear}):
  Toplam Gelir: ${statsLast.income.toFixed(2)} TL
  Toplam Gider: ${statsLast.expense.toFixed(2)} TL
  Net: ${(statsLast.income - statsLast.expense).toFixed(2)} TL

KATEGORİ BAZLI HARCAMALAR (Bu Ay):
${catLines || '  Veri yok'}

BÜTÇE DURUMU (Bu Ay):
${budgetLines || '  Bütçe belirlenmemiş'}

YATIRIM PORTFÖYÜ:
${invLines}

SON 10 İŞLEM:
${recentTxLines || '  İşlem yok'}
`.trim()
}

const QUICK_QUESTIONS = [
  'Bu ay bütçemi aştım mı?',
  'En çok neye para harcıyorum?',
  'Tasarruf önerisi ver',
  'Yatırımlarım nasıl görünüyor?',
  'Geçen aya göre nasılım?',
]

export default function AIAdvisor() {
  const router = useRouter()
  const { accounts, categories, transactions, budgets } = useFinanceStore()
  const { investments, loadInvestments } = useInvestmentStore()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasKey, setHasKey] = useState<boolean | null>(null)
  const flatRef = useRef<FlatList>(null)

  useEffect(() => {
    SecureStore.getItemAsync('groq_api_key').then((k) => setHasKey(!!k))
    loadInvestments()

    // Karşılama mesajı
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: '👋 Merhaba! Ben finansal danışmanınım. Gelir, gider, bütçe ve yatırım verilerinizi görebiliyorum. Ne sormak istersiniz?',
      timestamp: Date.now(),
    }])
  }, [])

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim()
    if (!userText || loading) return

    const apiKey = await SecureStore.getItemAsync('groq_api_key')
    if (!apiKey) {
      Alert.alert('API Anahtarı Gerekli', 'Ayarlar sayfasından Groq API anahtarınızı girin.')
      return
    }

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: userText, timestamp: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    // Scroll to bottom
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)

    try {
      const financialContext = buildFinancialContext(accounts, categories, transactions, budgets, investments)

      const systemPrompt = `Sen kişisel finans danışmanısın. Kullanıcının gerçek finansal verileri aşağıda verilmiştir. Bu verilere dayanarak somut, kısa ve faydalı öneriler sun. Türkçe konuş. Sayıları ve oranları kullan. Abartılı iyimser veya kötümser olma.

${financialContext}

Önemli: Kullanıcının verilerini doğrudan kullan. Genel tavsiyelerden kaçın, spesifik ol.`

      const groqMessages = [
        ...newMessages
          .filter(m => m.id !== 'welcome')
          .map(m => ({ role: m.role, content: m.content })),
      ]

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            ...groqMessages,
          ],
          temperature: 0.7,
          max_tokens: 1024,
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error?.message ?? `HTTP ${res.status}`)
      }

      const data = await res.json()
      const aiText = data.choices?.[0]?.message?.content ?? 'Yanıt alınamadı.'

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: aiText, timestamp: Date.now() }
      setMessages((prev) => [...prev, aiMsg])
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100)
    } catch (e: any) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ Hata: ${e.message ?? 'Bağlantı sorunu'}`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user'
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.avatar}>
            <Bot color="#3a81f2" size={16} />
          </View>
        )}
        <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
          <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
            {item.content}
          </Text>
        </View>
        {isUser && (
          <View style={[styles.avatar, styles.avatarUser]}>
            <User color="white" size={16} />
          </View>
        )}
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <ChevronLeft color="white" size={26} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={styles.headerIcon}>
            <Sparkles color="#3a81f2" size={18} />
          </View>
          <View>
            <Text bold style={styles.white}>AI Finansal Danışman</Text>
            <Text style={[styles.muted, { fontSize: 12 }]}>Groq · {MODEL.split('/')[1]}</Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={() => setMessages([{
            id: 'welcome',
            role: 'assistant',
            content: '👋 Sohbet sıfırlandı. Yeni bir soru sorabilirsiniz!',
            timestamp: Date.now(),
          }])}
          hitSlop={12}
        >
          <X color="#424d5e" size={22} />
        </TouchableOpacity>
      </View>

      {/* API Key Uyarısı */}
      {hasKey === false && (
        <View style={styles.keyWarning}>
          <Text style={styles.white}>⚠️ Groq API anahtarı girilmemiş.</Text>
          <TouchableOpacity onPress={() => router.replace('/(tabs)/two')}>
            <Text style={{ color: '#3a81f2', fontWeight: '600' }}>Ayarlara Git →</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Hızlı Sorular */}
      {messages.length <= 1 && (
        <View style={styles.quickWrap}>
          <Text style={[styles.muted, { fontSize: 12, marginBottom: 8, marginLeft: 4 }]}>Hızlı sorular:</Text>
          <View style={styles.quickRow}>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendMessage(q)}>
                <Text style={styles.quickText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Mesajlar */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.msgList}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Yazıyor... */}
      {loading && (
        <View style={styles.typingRow}>
          <View style={styles.avatar}>
            <Bot color="#3a81f2" size={16} />
          </View>
          <View style={styles.bubbleAI}>
            <ActivityIndicator color="#3a81f2" size={18} />
          </View>
        </View>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.inputField}
          placeholder="Finansal sorunuzu yazın..."
          placeholderTextColor="#424d5e"
          value={input}
          onChangeText={setInput}
          multiline
          maxLength={500}
          onSubmitEditing={() => sendMessage()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || loading}
        >
          <Send color="white" size={18} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#11141c' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 56, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: '#1a222e',
    backgroundColor: '#11141c',
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#3a81f222', alignItems: 'center', justifyContent: 'center' },
  white: { color: 'white' },
  muted: { color: '#7a8799' },

  keyWarning: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#2d1b1b', padding: 14, margin: 12, borderRadius: 10 },

  quickWrap: { padding: 16 },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  quickChip: { backgroundColor: '#1a222e', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#2d3748' },
  quickText: { color: '#7a8799', fontSize: 13 },

  msgList: { paddingHorizontal: 12, paddingVertical: 8, gap: 12 },

  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowUser: { justifyContent: 'flex-end' },
  avatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#1a222e', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#2d3748' },
  avatarUser: { backgroundColor: '#3a81f2', borderColor: '#3a81f2' },

  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleAI: { backgroundColor: '#1a222e', borderTopLeftRadius: 4 },
  bubbleUser: { backgroundColor: '#3a81f2', borderTopRightRadius: 4 },
  bubbleText: { color: 'white', fontSize: 14, lineHeight: 20 },
  bubbleTextUser: { color: 'white' },

  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    padding: 12, paddingBottom: 24,
    borderTopWidth: 1, borderTopColor: '#1a222e',
    backgroundColor: '#11141c',
  },
  inputField: {
    flex: 1, color: 'white', fontSize: 15, backgroundColor: '#1a222e',
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10,
    maxHeight: 120, borderWidth: 1, borderColor: '#2d3748',
  },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3a81f2', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: '#1a222e' },
})
