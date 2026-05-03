import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider'
import '@/global.css'
import { initDatabase } from '@/lib/database'
import { useAuthStore } from '@/store/authStore'
import { useFinanceStore } from '@/store/financeStore'
import * as SecureStore from 'expo-secure-store'
import { Stack, useRouter, useSegments } from 'expo-router'
import { useEffect, useRef } from 'react'

function AuthGuard() {
  const router = useRouter()
  const segments = useSegments()
  const { isAuthenticated, isSetup, setSetup } = useAuthStore()
  const loadAll = useFinanceStore((s) => s.loadAll)
  const initialized = useRef(false)

  useEffect(() => {
    const bootstrap = async () => {
      if (!initialized.current) {
        try {
          initDatabase()
          loadAll()
        } catch (e) {
          console.error('DB init error:', e)
        }
        initialized.current = true
      }

      const setup = await SecureStore.getItemAsync('app_setup')
      const inAuth = segments[0] === '(auth)'

      if (!setup) {
        setSetup(false)
        if (!inAuth) router.replace('/(auth)/setup')
      } else {
        setSetup(true)
        if (!isAuthenticated && !inAuth) {
          router.replace('/(auth)/lock')
        } else if (isAuthenticated && inAuth) {
          router.replace('/(tabs)')
        }
      }
    }

    bootstrap()
  }, [isAuthenticated, segments])

  return null
}

export default function RootLayout() {
  return (
    <GluestackUIProvider mode="dark">
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="add-transaction" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="scan-receipt" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
      <AuthGuard />
    </GluestackUIProvider>
  )
}
