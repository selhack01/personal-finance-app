import PageHeader from '@/library/components/pageHeader'
import { Tabs } from 'expo-router'
import { ArrowLeftRight, CreditCard, LayoutDashboard, PieChart, Settings, TrendingUp } from 'lucide-react-native'

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarInactiveTintColor: '#424d5e',
        tabBarActiveTintColor: '#3a81f2',
        header: () => <PageHeader />,
        headerShown: true,
        tabBarStyle: {
          backgroundColor: '#11141c',
          borderTopWidth: 1,
          borderTopColor: '#1a222e',
          paddingBottom: 8,
          paddingTop: 8,
          height: 62,
        },
        tabBarLabelStyle: { fontSize: 10, marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'İşlemler',
          tabBarIcon: ({ color, size }) => <ArrowLeftRight color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Bütçe',
          tabBarIcon: ({ color, size }) => <PieChart color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="portfolio"
        options={{
          title: 'Portföy',
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Hesaplar',
          tabBarIcon: ({ color, size }) => <CreditCard color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  )
}
