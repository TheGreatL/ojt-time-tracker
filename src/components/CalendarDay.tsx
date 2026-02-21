import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { DateData } from 'react-native-calendars';
import { DayState } from 'react-native-calendars/src/types';
import { colors, spacing, borderRadius } from '../styles/theme';
import { scale, responsiveFontSize } from '../utils/responsive';

interface CalendarDayProps {
    date?: DateData;
    state?: DayState;
    marking?: any;
    onPress?: (date: DateData) => void;
}

export const CalendarDay: React.FC<CalendarDayProps> = ({ date, state, marking, onPress }) => {
    if (!date) return <View style={styles.emptyDay} />;

    const isSelected = marking?.selected;
    const isToday = state === 'today';
    const isDisabled = state === 'disabled';
    
    // Extract colors effectively
    const backgroundColor = isSelected ? (marking?.selectedColor || colors.primary) : 'transparent';
    const textColor = isSelected ? colors.textInverse : (isToday ? colors.primary : colors.textPrimary);
    
    // Dot logic (for events/notes)
    const hasDot = marking?.marked;
    const dotColor = marking?.dotColor || colors.primary;

    // Custom "Pill" or "Squircle" shape for modern look
    // We'll use a slightly rounded square (squircle-ish) for a modern feel
    
    return (
        <TouchableOpacity
            style={[
                styles.container,
                isSelected && { backgroundColor },
                isToday && !isSelected && styles.todayContainer
            ]}
            onPress={() => onPress && onPress(date)}
            disabled={isDisabled}
            activeOpacity={0.7}
        >
            <Text style={[
                styles.text,
                { color: isDisabled ? colors.textTertiary : textColor },
                isToday && styles.todayText
            ]}>
                {date.day}
            </Text>
            
            {hasDot && !isSelected && (
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 30, // Reduced from 34
        height: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        margin: 1,
    },
    todayContainer: {
        backgroundColor: colors.surfaceDark,
        borderRadius: 15,
    },
    emptyDay: {
        width: 30,
        height: 30,
    },
    text: {
        fontSize: responsiveFontSize(14),
        fontWeight: '500',
        color: colors.textPrimary,
    },
    todayText: {
        fontWeight: '700',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        marginTop: 2,
    }
});
