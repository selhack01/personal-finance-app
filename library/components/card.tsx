import { ReactNode } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

const Card = ({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) => {
    return <View
        style={[{
            justifyContent: 'space-between',
            backgroundColor: "#1a222e",
            borderColor: "#484d57",
            borderRadius: 16,
            borderWidth: 1,
            width: "100%",
            padding: 16,
        }, style]}
    >
        {children}
    </View>
}

export default Card;