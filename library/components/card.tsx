import { ReactNode } from 'react';
import { View } from 'react-native';

const Card = ({ children }: { children: ReactNode }) => {
    return <View
        style={{
            justifyContent: 'space-between',
            backgroundColor: "#1a222e",
            borderColor: "#484d57",
            borderRadius: 16,
            marginBottom: 20,
            borderWidth: 1,
            width: "100%",
            padding: 16,
        }}
    >
        {children}
    </View>
}

export default Card;