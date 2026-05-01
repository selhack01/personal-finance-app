import { Box } from '@/components/ui/box'
import { Heading } from '@/components/ui/heading'
import { HStack } from '@/components/ui/hstack'
import { VStack } from '@/components/ui/vstack'
import { Bell } from 'lucide-react-native'
import { Image, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const PageHeader = () => {
    const insets = useSafeAreaInsets();

    return <View style={{
        borderBottomColor: "#e2e8f0",
        backgroundColor: "#090d17",
        paddingTop: insets.top + 8,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        paddingBottom: 8,
    }}>
        <HStack className="justify-between items-center">
            <HStack space="md" className="items-center">
                <Image
                    source={{ uri: 'https://avatar.iran.liara.run/public/30' }}
                    style={{
                        backgroundColor: "white",
                        borderRadius: 25,
                        height: 45,
                        width: 45
                    }}
                />
                <VStack>
                    <Heading size="xl" className='text-white'>Mehmet Ali</Heading>
                </VStack>
            </HStack>

            <Box className="p-2">
                <Bell color="#7a8799" size={24} />
            </Box>
        </HStack>
    </View>
}

export default PageHeader