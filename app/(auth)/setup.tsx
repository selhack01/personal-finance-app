import { Text } from '@/components/ui/text'
import { useAuthStore } from '@/store/authStore'
import * as LocalAuthentication from 'expo-local-authentication'
import * as SecureStore from 'expo-secure-store'
import { useRouter } from 'expo-router'
import { AlertTriangle, CheckCircle, Fingerprint } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Linking, StyleSheet, TouchableOpacity, View } from 'react-native'

type SetupState = 'checking' | 'no-hardware' | 'not-enrolled' | 'ready' | 'success'

export default function SetupScreen() {
  const router = useRouter()
  const setSetup = useAuthStore((s) => s.setSetup)
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const [state, setState] = useState<SetupState>('checking')

  useEffect(() => {
    checkBiometric()
  }, [])

  const checkBiometric = async () => {
    setState('checking')
    const hasHardware = await LocalAuthentication.hasHardwareAsync()
    if (!hasHardware) { setState('no-hardware'); return }
    const isEnrolled = await LocalAuthentication.isEnrolledAsync()
    if (!isEnrolled) { setState('not-enrolled'); return }
    setState('ready')
  }

  const handleSetup = async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Parmak izinizi doğrulayın',
      cancelLabel: 'İptal',
      disableDeviceFallback: false,
    })
    if (result.success) {
      await SecureStore.setItemAsync('app_setup', 'true')
      setSetup(true)
      setAuthenticated(true)
      setState('success')
      setTimeout(() => router.replace('/(tabs)'), 600)
    }
  }

  const openSettings = async () => {
    await Linking.openSettings()
    setTimeout(checkBiometric, 2000)
  }

  return (
    <View style={styles.container}>
      <Text size="5xl" bold style={styles.logo}>WI</Text>
      <Text size="2xl" bold style={styles.title}>Wealth Intelligence</Text>
      <Text style={styles.desc}>Uygulamaya güvenli giriş için{'\n'}parmak izi kurulumu yapın</Text>

      <View style={styles.iconWrap}>
        {state === 'success' ? (
          <CheckCircle color="#2ae600" size={64} />
        ) : state === 'not-enrolled' || state === 'no-hardware' ? (
          <AlertTriangle color="#f59e0b" size={64} />
        ) : (
          <Fingerprint color="#3a81f2" size={64} />
        )}
      </View>

      {state === 'no-hardware' && (
        <Text style={styles.warnText}>
          Cihazınız parmak izi okuyucusunu desteklemiyor.
        </Text>
      )}

      {state === 'not-enrolled' && (
        <>
          <Text style={styles.warnText}>
            Cihazınızda kayıtlı parmak izi yok.{'\n'}
            Android Ayarları → Güvenlik → Parmak İzi bölümünden ekleyin.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={openSettings}>
            <Text style={styles.btnText}>Ayarlara Git</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={checkBiometric}>
            <Text style={styles.outlineBtnText}>Tekrar Kontrol Et</Text>
          </TouchableOpacity>
        </>
      )}

      {state === 'ready' && (
        <>
          <Text style={styles.hintText}>
            Parmak iziniz sadece bu cihazda saklanır.{'\n'}Hiçbir veri buluta gönderilmez.
          </Text>
          <TouchableOpacity style={styles.btn} onPress={handleSetup}>
            <Text style={styles.btnText}>Parmak İzimi Kaydet</Text>
          </TouchableOpacity>
        </>
      )}

      {state === 'success' && (
        <Text style={styles.successText}>Kurulum tamamlandı! Yönlendiriliyor...</Text>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#11141c',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
  },
  logo: { color: '#3a81f2' },
  title: { color: 'white' },
  desc: { color: '#7a8799', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a222e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
    marginBottom: 16,
  },
  hintText: { color: '#7a8799', textAlign: 'center', lineHeight: 22 },
  warnText: { color: '#f59e0b', textAlign: 'center', lineHeight: 22 },
  successText: { color: '#2ae600', textAlign: 'center', fontWeight: '600' },
  btn: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 14,
    backgroundColor: '#3a81f2',
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: '700', fontSize: 16 },
  outlineBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2d3748',
    width: '100%',
    alignItems: 'center',
  },
  outlineBtnText: { color: '#7a8799', fontSize: 14 },
})
