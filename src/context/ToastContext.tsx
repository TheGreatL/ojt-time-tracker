
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Dimensions,
    Platform,
    SafeAreaView
} from 'react-native';
import { colors, spacing, borderRadius, shadows, typography } from '../styles/theme';
import { CheckCircle, AlertCircle, Info } from 'lucide-react-native';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
    message: string;
    type?: ToastType;
    duration?: number;
}

interface ToastContextType {
    showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [visible, setVisible] = useState(false);
    const [message, setMessage] = useState('');
    const [type, setType] = useState<ToastType>('success');
    const [fadeAnim] = useState(new Animated.Value(0));
    const [slideAnim] = useState(new Animated.Value(-100));

    const showToast = useCallback(({ message, type = 'success', duration = 3000 }: ToastOptions) => {
        setMessage(message);
        setType(type);
        setVisible(true);

        // Animation Sequence
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: spacing.xl,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start();

        // Auto hide
        setTimeout(() => {
            hideToast();
        }, duration);
    }, [fadeAnim, slideAnim]);

    const hideToast = useCallback(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: -100,
                duration: 300,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setVisible(false);
        });
    }, [fadeAnim, slideAnim]);

    const getIcon = () => {
        switch (type) {
            case 'success': return <CheckCircle size={20} color={colors.success} />;
            case 'error': return <AlertCircle size={20} color={colors.danger} />;
            case 'info': return <Info size={20} color={colors.primary} />;
            case 'warning': return <AlertCircle size={20} color={colors.warning} />;
        }
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {visible && (
                <SafeAreaView style={styles.toastWrapper} pointerEvents="none">
                    <Animated.View
                        style={[
                            styles.toastContainer,
                            {
                                opacity: fadeAnim,
                                transform: [{ translateY: slideAnim }],
                                borderLeftColor: type === 'success' ? colors.success : type === 'error' ? colors.danger : type === 'warning' ? colors.warning : colors.primary
                            }
                        ]}
                    >
                        <View style={styles.iconContainer}>
                            {getIcon()}
                        </View>
                        <Text style={styles.toastText} numberOfLines={2}>
                            {message}
                        </Text>
                    </Animated.View>
                </SafeAreaView>
            )}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

const styles = StyleSheet.create({
    toastWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 9999,
    },
    toastContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.lg,
        ...shadows.lg,
        width: Dimensions.get('window').width - spacing.xl * 2,
        maxWidth: 400,
        borderLeftWidth: 4,
    },
    iconContainer: {
        marginRight: spacing.sm,
    },
    toastText: {
        flex: 1,
        fontSize: typography.sm,
        color: colors.textPrimary,
        fontWeight: typography.medium,
    },
});
