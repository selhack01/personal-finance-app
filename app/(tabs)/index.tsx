import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { View } from "react-native";

export default function Dashboard() {
  return <View>
    <VStack space="md">
      {/* Toplam Bakiye Kartı */}
      <Card size="md" variant="elevated" className="bg-blue-600 border-0 rounded-3xl p-6">
        <VStack space="xs">
          <Text className="text-blue-100 text-sm">Toplam Varlık</Text>
          <Heading size="2xl" className="text-white">₺142,500.00</Heading>
          <HStack className="mt-4 justify-between">
            <Text className="text-white opacity-80">**** 4582</Text>
            <Text className="text-white font-bold">VISA</Text>
          </HStack>
        </VStack>
      </Card>

      {/* Hızlı İstatistikler */}
      <HStack space="md" className="justify-between">
        <Card className="flex-1 bg-white p-4 rounded-2xl border-gray-100">
          <Text size="xs" className="text-gray-500 uppercase">Gelir</Text>
          <Text className="text-green-600 font-bold text-lg">+₺12,000</Text>
        </Card>
        <Card className="flex-1 bg-white p-4 rounded-2xl border-gray-100">
          <Text size="xs" className="text-gray-500 uppercase">Gider</Text>
          <Text className="text-red-500 font-bold text-lg">-₺4,500</Text>
        </Card>
      </HStack>

      <Heading size="md" className="mt-4">Son İşlemler</Heading>
      <Card className="bg-white rounded-2xl border-gray-100">
        <VStack space="lg">
          {["Market", "Netflix", "Maaş Ödemesi"].map((item, i) => (
            <HStack key={i} className="justify-between items-center">
              <VStack>
                <Text className="font-semibold">{item}</Text>
                <Text size="xs" className="text-gray-400">12 Mayıs 2026</Text>
              </VStack>
              <Text className={i === 2 ? "text-green-600" : "text-black"}>
                {i === 2 ? "+₺25,000" : "-₺150"}
              </Text>
            </HStack>
          ))}
        </VStack>
      </Card>
    </VStack>
  </View>
}