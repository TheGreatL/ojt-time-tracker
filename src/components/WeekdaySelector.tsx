// Weekday Selector Component

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, touchTarget } from '../styles/theme';
import { scale, responsiveFontSize } from '../utils/responsive';

interface WeekdaySelectorProps {
    selectedDays: number[]; // Array of day indices (0=Sunday, 6=Saturday)
    onDaysChange: (days: number[]) => void;
    disabled?: boolean;
}

const WEEKDAYS = [
    { label: 'Sun', value: 0 },
    { label: 'Mon', value: 1 },
    { label: 'Tue', value: 2 },
    { label: 'Wed', value: 3 },
    { label: 'Thu', value: 4 },
    { label: 'Fri', value: 5 },
    { label: 'Sat', value: 6 },
];

export const WeekdaySelector: React.FC<WeekdaySelectorProps> = ({
    selectedDays,
    onDaysChange,
    disabled = false,
}) => {
    const toggleDay = (dayValue: number) => {
        if (disabled) return;
        if (selectedDays.includes(dayValue)) {
            onDaysChange(selectedDays.filter((d) => d !== dayValue));
        } else {
            onDaysChange([...selectedDays, dayValue].sort());
        }
    };

    return (
        <View style={styles.container}>
            {WEEKDAYS.map((day) => {
                const isSelected = selectedDays.includes(day.value);
                return (
                    <TouchableOpacity
                        key={day.value}
                        onPress={() => toggleDay(day.value)}
                        disabled={disabled}
                        style={[
                            styles.dayButton,
                            isSelected && styles.dayButtonSelected,
                            disabled && { opacity: 0.6 },
                        ]}
                        activeOpacity={0.7}
                    >
                        <Text
                            style={[
                                styles.dayText,
                                isSelected && styles.dayTextSelected,
                                disabled && isSelected && { color: colors.textInverse },
                            ]}
                        >
                            {day.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: spacing.xs,
    },
    dayButton: {
        flex: 1,
        minHeight: touchTarget.minHeight,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm,
    },
    dayButtonSelected: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    dayText: {
        fontSize: responsiveFontSize(12),
        fontWeight: typography.medium,
        color: colors.textSecondary,
    },
    dayTextSelected: {
        color: colors.textInverse,
        fontWeight: typography.semibold,
    },
});
