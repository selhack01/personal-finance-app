import PageHeader from "@/library/components/pageHeader";
import { Tabs } from "expo-router";
import { LayoutDashboard, Settings } from "lucide-react-native";

export default function TabLayout() {
  return <Tabs
    screenOptions={{
      tabBarInactiveTintColor: "#424d5e",
      tabBarActiveTintColor: "#3a81f2",
      header: () => <PageHeader />,
      headerShown: true,
      tabBarStyle: {
        backgroundColor: "#11141c",
        borderTopWidth: 1,
        paddingBottom: 8,
        paddingTop: 8,
        height: 60,
      },
    }}
  >
    <Tabs.Screen
      name="index"
      options={{
        title: "Dashboard",
        tabBarIcon: ({ color, size }) => (
          <LayoutDashboard color={color} size={size} />
        ),
      }}
    />
    <Tabs.Screen
      name="two"
      options={{
        title: "Ayarlar",
        tabBarIcon: ({ color, size }) => (
          <Settings color={color} size={size} />
        ),
      }}
    />
  </Tabs>
}