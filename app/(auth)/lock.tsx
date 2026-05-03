import { Text } from '@/components/ui/text'
import { useAuthStore } from '@/store/authStore'
import * as LocalAuthentication from 'expo-local-authentication'
import { useRouter } from 'expo-router'
import { AlertCircle, Fingerprint } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { BackHandler, StyleSheet, TouchableOpacity, View } from 'react-native'

export default function LockScreen() {
  const router = useRouter()
  const setAuthenticated = useAuthStore((s) => s.setAuthenticated)
  const [error, setError] = useState(false)

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      BackHandler.exitApp()
      return true
    })
    authenticate()
    return () => sub.remove()
  }, [])

  const authenticate = async () => {
    setError(false)
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Wealth Intelligence',
        cancelLabel: 'Çıkış',
        disableDeviceFallback: false,
        fallbackLabel: 'PIN Kullan',
      })
      if (result.success) {
        setAuthenticated(true)
        router.replace('/(tabs)')
      } else {
        setError(true)
      }
    } catch {
      setError(true)
    }
  }

  return (
    <View style={styles.container}>
      <Text size="5xl" bold style={styles.logo}>WI</Text>
      <Text size="2xl" bold style={styles.title}>Wealth Intelligence</Text>

      <TouchableOpacity style={styles.iconWrap} onPress={authenticate} activeOpacity={0.8}>
        {error
          ? <AlertCircle color="#ef4444" size={64} />
          : <Fingerprint color="#3a81f2" size={64} />
        }
      </TouchableOpacity>

      <Text style={[styles.hint, error && styles.errorHint]}>
        {error
          ? 'Doğrulama başarısız. Tekrar deneyin.'
          : 'Giriş için parmak izinizi kullanın'}
      </Text>

      {error && (
        <TouchableOpacity style={styles.retryBtn} onPress={authenticate}>
          <Text style={styles.retryText}>Tekrar Dene</Text>
        </TouchableOpacity>
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
    gap: 16,
  },
  logo: { color: '#3a81f2' },
  title: { color: 'white', marginBottom: 48 },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a222e',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2d3748',
  },
  hint: { color: '#7a8799', textAlign: 'center', paddingHorizontal: 32 },
  errorHint: { color: '#ef4444' },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: '#3a81f2',
    borderRadius: 12,
  },
  retryText: { color: 'white', fontWeight: '600', fontSize: 16 },
})
