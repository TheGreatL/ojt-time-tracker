// Progress Bar Component

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius } from '../styles/theme';

interface ProgressBarProps {
    current: number;
    total: number;
    showPercentage?: boolean;
    showHours?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
    current,
    total,
    showPercentage = true,
    showHours = true,
}) => {
    const percentage = total > 0 ? Math.min((current / total) * 100, 100) : 0;

    return (
        <View style={styles.container}>
            {showHours && (
                <View style={styles.labelContainer}>
                    <Text style={styles.label}>
                        {current.toFixed(1)} / {total.toFixed(1)} hours
                    </Text>
                    {showPercentage && (
                        <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
                    )}
                </View>
            )}
            <View style={styles.barBackground}>
                <View
                    style={[
                        styles.barFill,
                        {
                            width: `${percentage}%`,
                            backgroundColor: percentage >= 100 ? colors.success : colors.primary,
                        },
                    ]}
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    labelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    label: {
        fontSize: typography.sm,
        color: colors.textSecondary,
        fontWeight: typography.medium,
    },
    percentage: {
        fontSize: typography.sm,
        color: colors.primary,
        fontWeight: typography.bold,
    },
    barBackground: {
        width: '100%',
        height: 12,
        backgroundColor: colors.surfaceDark,
        borderRadius: borderRadius.full,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        borderRadius: borderRadius.full,
    },
});
