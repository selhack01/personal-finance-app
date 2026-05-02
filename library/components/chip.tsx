import { Text } from '@/components/ui/text';
import {
    TrendingDown,
    TrendingUp
} from "lucide-react-native";
import React from 'react';
import { View } from 'react-native';

const Chip = ({
    status = true,
    text = "",
}
    :
    {
        status: Boolean,
        text: String
    }
) => {
    return <View
        style={{
            backgroundColor: status ? "#132610" : "#261010",
            borderColor: status ? "#123b0b" : "#3b0b0b",
            justifyContent: "center",
            paddingHorizontal: 12,
            flexDirection: "row",
            paddingVertical: 4,
            borderRadius: 16,
            borderWidth: 1,
            gap: 6
        }}
    >
        {
            status ?
                <TrendingUp
                    color={"#2ae600"}
                    size={16}
                />
                :
                <TrendingDown
                    color={"#e60000"}
                    size={16}
                />
        }
        <Text
            style={{
                color: status ? "#2ae600" : "#e60000"
            }}
        >
            {text}
        </Text>
    </View>
}

export default Chip