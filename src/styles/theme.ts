import { scale, moderateScale, responsiveFontSize } from '../utils/responsive';

export const colors = {
    // Primary palette (Monochrome)
    primary: '#000000', // Black
    primaryLight: '#333333', // Dark Grey
    primaryDark: '#000000', // Black (keeps simple)

    // Secondary palette (Accents)
    secondary: '#666666', // Medium Grey
    secondaryLight: '#999999', // Light Grey
    secondaryDark: '#333333', // Dark Grey

    // Status colors (Restored)
    success: '#10B981', // Green
    warning: '#F59E0B', // Amber
    danger: '#EF4444', // Red
    gold: '#FBBF24', // Gold

    // Neutral palette
    background: '#FFFFFF',
    backgroundDark: '#F9FAFB',
    surface: '#FFFFFF',
    surfaceDark: '#F3F4F6',

    // Text colors
    textPrimary: '#000000',
    textSecondary: '#666666',
    textTertiary: '#999999',
    textInverse: '#FFFFFF',

    // Border colors
    border: '#E0E0E0',
    borderDark: '#000000',

    // Calendar colors (Restored)
    calendarWorked: '#10B981', // Green
    calendarScheduled: '#9CA3AF', // Grey
    calendarExcluded: '#EF4444', // Red
    calendarPredicted: '#FBBF24', // Gold
};

export const spacing = {
    xs: scale(4),
    sm: scale(8),
    md: scale(16),
    lg: scale(24),
    xl: scale(32),
    xxl: scale(48),
};

export const typography = {
    fontFamily: 'System',

    // Font sizes
    xs: responsiveFontSize(12),
    sm: responsiveFontSize(14),
    base: responsiveFontSize(16),
    lg: responsiveFontSize(18),
    xl: responsiveFontSize(20),
    xxl: responsiveFontSize(24),
    xxxl: responsiveFontSize(32),

    // Font weights
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999,
};

export const shadows = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 5,
    },
};

// Minimum touch target size (accessibility)
export const touchTarget = {
    minWidth: 44,
    minHeight: 44,
};
