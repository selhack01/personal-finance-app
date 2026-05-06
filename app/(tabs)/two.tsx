import { Text } from '@/components/ui/text'
import Card from '@/library/components/card'
import PageContainer from '@/library/components/pageContainer'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import { Bitcoin, Bot, ChevronRight, Eye, EyeOff, Key, Shield, Sparkles, Trash2, Zap } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native'

export default function Settings() {
  const router = useRouter()
  const [binanceKey, setBinanceKey] = useState('')
  const [binanceSecret, setBinanceSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)
  const [savedKey, setSavedKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [groqKey, setGroqKey] = useState('')
  const [savedGroqKey, setSavedGroqKey] = useState('')

  useEffect(() => {
    SecureStore.getItemAsync('binance_api_key').then((k) => {
      if (k) setSavedKey(k.slice(0, 8) + '••••••••••••••••')
    })
    SecureStore.getItemAsync('groq_api_key').then((k) => {
      if (k) setSavedGroqKey(k.slice(0, 8) + '••••••')
    })
  }, [])

  const saveGroqKey = async () => {
    if (!groqKey.trim()) { Alert.alert('Uyarı', 'API anahtarı girin.'); return }
    await SecureStore.setItemAsync('groq_api_key', groqKey.trim())
    setSavedGroqKey(groqKey.slice(0, 8) + '••••••')
    setGroqKey('')
    Alert.alert('Başarılı', 'Groq API anahtarı kaydedildi.')
  }

  const removeGroqKey = () => {
    Alert.alert('Groq Anahtarını Sil', 'Fiş tarama özelliği devre dışı kalacak.', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        await SecureStore.deleteItemAsync('groq_api_key')
        setSavedGroqKey('')
      }},
    ])
  }

  const saveBinanceKeys = async () => {
    if (!binanceKey.trim() || !binanceSecret.trim()) {
      Alert.alert('Uyarı', 'API Key ve Secret gerekli.')
      return
    }
    setSaving(true)
    await SecureStore.setItemAsync('binance_api_key', binanceKey.trim())
    await SecureStore.setItemAsync('binance_api_secret', binanceSecret.trim())
    setSavedKey(binanceKey.slice(0, 8) + '••••••••••••••••')
    setBinanceKey('')
    setBinanceSecret('')
    setSaving(false)
    Alert.alert('Başarılı', 'Binance API anahtarları kaydedildi.')
  }

  const removeBinanceKeys = () => {
    Alert.alert('API Anahtarlarını Sil', 'Binance bağlantısı kaldırılacak.', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('binance_api_key')
          await SecureStore.deleteItemAsync('binance_api_secret')
          setSavedKey('')
          Alert.alert('Silindi', 'Binance API anahtarları kaldırıldı.')
        },
      },
    ])
  }

  return (
    <PageContainer safeArea={false}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* AI Danışman */}
        <TouchableOpacity onPress={() => router.push('/ai-advisor')} activeOpacity={0.8}>
          <Card style={styles.aiCard}>
            <View style={styles.aiRow}>
              <View style={styles.aiIcon}>
                <Sparkles color="#3a81f2" size={22} />
              </View>
              <View style={styles.flex}>
                <Text bold style={[styles.white, { fontSize: 16 }]}>AI Finansal Danışman</Text>
                <Text style={[styles.muted, { fontSize: 12 }]}>
                  Harcamalarını analiz et, öneri al
                </Text>
              </View>
              <ChevronRight color="#3a81f2" size={20} />
            </View>
          </Card>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>GÜVENLİK</Text>
        <Card>
          <View style={styles.settingRow}>
            <View style={styles.iconWrap}>
              <Shield color="#2ae600" size={18} />
            </View>
            <View style={styles.flex}>
              <Text bold style={styles.white}>Parmak İzi Girişi</Text>
              <Text style={styles.muted}>Aktif — cihaz biyometrisi</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#2ae60022' }]}>
              <Text style={{ color: '#2ae600', fontSize: 12 }}>Açık</Text>
            </View>
          </View>
        </Card>

        <Text style={styles.sectionTitle}>BİNANCE</Text>
        <Card>
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: '#f0b90b22' }]}>
              <Bitcoin color="#f0b90b" size={18} />
            </View>
            <View style={styles.flex}>
              <Text bold style={styles.white}>Binance Global</Text>
              <Text style={styles.muted}>
                {savedKey ? `Bağlı: ${savedKey}` : 'Bağlı değil'}
              </Text>
            </View>
            {savedKey && (
              <TouchableOpacity onPress={removeBinanceKeys} hitSlop={8}>
                <Trash2 color="#ef4444" size={18} />
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {!savedKey && (
          <Card>
            <Text bold style={[styles.white, { marginBottom: 4 }]}>Binance API Bağla</Text>
            <Text style={[styles.muted, { fontSize: 12, marginBottom: 12 }]}>
              Binance → Profil → API Yönetimi → API Oluştur
            </Text>
            <View style={styles.inputRow}>
              <Key color="#7a8799" size={16} />
              <TextInput
                style={styles.input}
                placeholder="API Key"
                placeholderTextColor="#424d5e"
                value={binanceKey}
                onChangeText={setBinanceKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.inputRow}>
              <Key color="#7a8799" size={16} />
              <TextInput
                style={styles.input}
                placeholder="API Secret"
                placeholderTextColor="#424d5e"
                value={binanceSecret}
                onChangeText={setBinanceSecret}
                secureTextEntry={!showSecret}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={() => setShowSecret(!showSecret)}>
                {showSecret ? <EyeOff color="#7a8799" size={16} /> : <Eye color="#7a8799" size={16} />}
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveBinanceKeys} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Groq API */}
        <Text style={styles.sectionTitle}>FİŞ TARAMA (GROQ)</Text>
        <Card>
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: '#8b5cf622' }]}>
              <Zap color="#8b5cf6" size={18} />
            </View>
            <View style={styles.flex}>
              <Text bold style={styles.white}>Groq Vision API</Text>
              <Text style={styles.muted}>
                {savedGroqKey ? `Bağlı: ${savedGroqKey}` : 'Bağlı değil — fiş tarama pasif'}
              </Text>
            </View>
            {savedGroqKey && (
              <TouchableOpacity onPress={removeGroqKey} hitSlop={8}>
                <Trash2 color="#ef4444" size={18} />
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {!savedGroqKey && (
          <Card>
            <Text bold style={[styles.white, { marginBottom: 4 }]}>Groq API Bağla</Text>
            <Text style={[styles.muted, { fontSize: 12, marginBottom: 12 }]}>
              console.groq.com → API Keys → Create API Key (ücretsiz)
            </Text>
            <View style={styles.inputRow}>
              <Key color="#7a8799" size={16} />
              <TextInput
                style={styles.input}
                placeholder="gsk_..."
                placeholderTextColor="#424d5e"
                value={groqKey}
                onChangeText={setGroqKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <TouchableOpacity style={styles.saveBtn} onPress={saveGroqKey}>
              <Text style={styles.saveBtnText}>Kaydet</Text>
            </TouchableOpacity>
          </Card>
        )}

        <Text style={styles.sectionTitle}>BANKA</Text>
        <Card>
          <View style={styles.settingRow}>
            <View style={[styles.iconWrap, { backgroundColor: '#2ae60022' }]}>
              <Key color="#2ae600" size={18} />
            </View>
            <View style={styles.flex}>
              <Text bold style={styles.white}>Garanti BBVA</Text>
              <Text style={styles.muted}>PDF Hesap Özeti Import</Text>
            </View>
            <ChevronRight color="#424d5e" size={18} />
          </View>
        </Card>

        <Text style={[styles.muted, { textAlign: 'center', fontSize: 12, marginTop: 16 }]}>
          Tüm API anahtarları cihazınızda şifreli saklanır.{'\n'}Hiçbir veri dışarıya gönderilmez.
        </Text>
      </ScrollView>
    </PageContainer>
  )
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 80, gap: 8 },
  aiCard: { borderWidth: 1, borderColor: '#3a81f233' },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  aiIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#3a81f222', alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { color: '#424d5e', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 12, marginBottom: 4, marginLeft: 4 },
  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#3a81f222', alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  white: { color: 'white' },
  muted: { color: '#7a8799' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#11141c', borderWidth: 1, borderColor: '#2d3748', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10 },
  input: { flex: 1, color: 'white', fontSize: 14 },
  saveBtn: { backgroundColor: '#3a81f2', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
})
