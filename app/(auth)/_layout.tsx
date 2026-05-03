import { Stack } from 'expo-router'

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="setup" />
      <Stack.Screen name="lock" />
    </Stack>
  )
}
