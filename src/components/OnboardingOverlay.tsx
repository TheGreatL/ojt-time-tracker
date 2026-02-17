
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Dimensions,
    ScrollView,
} from 'react-native';
import { X, ChevronRight, ChevronLeft } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { scale, responsiveFontSize } from '../utils/responsive';

interface Step {
    title: string;
    description: string;
    targetId?: string; // Potential future use for highlighting specific elements
}

interface OnboardingOverlayProps {
    visible: boolean;
    onClose: () => void;
    steps: Step[];
}

export const OnboardingOverlay: React.FC<OnboardingOverlayProps> = ({ visible, onClose, steps }) => {
    const [currentStep, setCurrentStep] = useState(0);

    // Reset step when visibility changes
    useEffect(() => {
        if (visible) {
            setCurrentStep(0);
        }
    }, [visible]);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <X size={scale(20)} color={colors.textSecondary} />
                    </TouchableOpacity>

                    <View style={styles.content}>
                        <Text style={styles.stepIndicator}>
                            Tip {currentStep + 1} of {steps.length}
                        </Text>
                        <Text style={styles.title}>{steps[currentStep].title}</Text>
                        <ScrollView
                            style={styles.descriptionScroll}
                            contentContainerStyle={styles.descriptionContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <Text style={styles.description}>{steps[currentStep].description}</Text>
                        </ScrollView>
                    </View>

                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[styles.navButton, currentStep === 0 && styles.disabledButton]}
                            onPress={handlePrev}
                            disabled={currentStep === 0}
                        >
                            <ChevronLeft size={scale(24)} color={currentStep === 0 ? colors.textTertiary : colors.primary} />
                        </TouchableOpacity>

                        <View style={styles.dots}>
                            {steps.map((_, index) => (
                                <View
                                    key={index}
                                    style={[
                                        styles.dot,
                                        index === currentStep && styles.activeDot,
                                    ]}
                                />
                            ))}
                        </View>

                        <TouchableOpacity style={styles.navButton} onPress={handleNext}>
                            {currentStep === steps.length - 1 ? (
                                <Text style={styles.doneText}>Done</Text>
                            ) : (
                                <ChevronRight size={scale(24)} color={colors.primary} />
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.xl,
        padding: spacing.lg,
        width: '100%',
        maxWidth: 500,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    closeButton: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        padding: spacing.xs,
        zIndex: 1,
    },
    content: {
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    stepIndicator: {
        fontSize: responsiveFontSize(12),
        color: colors.textTertiary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: spacing.xs,
    },
    title: {
        fontSize: responsiveFontSize(20),
        fontWeight: typography.bold,
        color: colors.textPrimary,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    descriptionScroll: {
        maxHeight: scale(150),
        width: '100%',
    },
    descriptionContent: {
        alignItems: 'center',
    },
    description: {
        fontSize: responsiveFontSize(16),
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: scale(24),
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginTop: spacing.lg,
    },
    navButton: {
        padding: spacing.sm,
        minWidth: scale(44),
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
    doneText: {
        color: colors.primary,
        fontWeight: typography.bold,
        fontSize: responsiveFontSize(16),
    },
    dots: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    dot: {
        width: scale(8),
        height: scale(8),
        borderRadius: scale(4),
        backgroundColor: colors.border,
    },
    activeDot: {
        backgroundColor: colors.primary,
        width: scale(24),
    },
});

