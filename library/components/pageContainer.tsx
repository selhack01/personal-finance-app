import React, { ReactNode } from 'react';
import { SafeAreaView, StyleSheet, View, ViewStyle } from 'react-native';

interface PageContainerProps {
    children: ReactNode;
    style?: ViewStyle;
    safeArea?: boolean;
}

const PageContainer = ({ children, style, safeArea = true }: PageContainerProps) => {
    const Container = safeArea ? SafeAreaView : View;

    return <Container style={[styles.wrapper, style]}>
        {children}
    </Container>
};

const styles = StyleSheet.create({
    wrapper: {
        backgroundColor: '#11141c',
        flex: 1,
    },
});

export default PageContainer;