import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { WifiOff } from 'lucide-react-native';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';

export const OfflineStatusIndicator: React.FC = () => {
    const [isOffline, setIsOffline] = useState(false);
    const [opacity] = useState(new Animated.Value(0));

    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Ping a reliable endpoint to check if we can reach the internet/Supabase
                const response = await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
                setIsOffline(false);
            } catch (error) {
                setIsOffline(true);
            }
        };

        const interval = setInterval(checkConnection, 10000); // Check every 10 seconds
        checkConnection();

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        Animated.timing(opacity, {
            toValue: isOffline ? 1 : 0,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [isOffline]);

    if (!isOffline && (opacity as any)._value === 0) return null;

    return (
        <Animated.View style={[styles.container, { opacity }]}>
            <View style={styles.badge}>
                <WifiOff size={16} color={colors.warning} />
                <Text style={styles.text}>Offline Mode</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: spacing.xl,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 1000,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: borderRadius.full,
        gap: spacing.xs,
        borderWidth: 1,
        borderColor: colors.warning,
        // Elevation for Android
        elevation: 5,
        // Shadow for iOS
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    text: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
    },
});
