// Global reusable styles

import { StyleSheet } from 'react-native';
import { colors, spacing, typography, borderRadius, shadows, touchTarget } from './theme';

export const globalStyles = StyleSheet.create({
    // Container styles
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    contentContainer: {
        padding: spacing.lg,
    },

    // Card styles
    card: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.md, // Slightly sharper
        padding: spacing.lg,
        borderWidth: 1,
        borderColor: colors.border,
        // Removed heavy shadows for a flatter look
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03, // Very subtle
        shadowRadius: 4,
        elevation: 1,
    },

    // Button styles
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full, // Fully rounded buttons
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: touchTarget.minHeight,
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonText: {
        color: colors.textInverse,
        fontSize: typography.base,
        fontWeight: typography.bold, // Bolder text
        letterSpacing: 0.5,
    },

    buttonSecondary: {
        backgroundColor: colors.surface,
        borderWidth: 1.5, // Slightly thicker border
        borderColor: colors.textPrimary, // Black border
        borderRadius: borderRadius.full,
    },

    buttonSecondaryText: {
        color: colors.textPrimary,
        fontWeight: typography.medium,
    },

    // Input styles
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.sm,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        fontSize: typography.base,
        color: colors.textPrimary,
        minHeight: touchTarget.minHeight,
    },

    inputLabel: {
        fontSize: typography.sm,
        fontWeight: typography.semibold, // Bolder labels
        color: colors.textPrimary, // Darker labels
        marginBottom: spacing.xs,
        textTransform: 'uppercase', // Uppercase labels for style
        letterSpacing: 0.5,
    },

    // Text styles
    heading1: {
        fontSize: typography.xxxl,
        fontWeight: typography.bold,
        color: colors.textPrimary,
    },

    heading2: {
        fontSize: typography.xxl,
        fontWeight: typography.bold,
        color: colors.textPrimary,
    },

    heading3: {
        fontSize: typography.xl,
        fontWeight: typography.semibold,
        color: colors.textPrimary,
    },

    bodyText: {
        fontSize: typography.base,
        color: colors.textPrimary,
    },

    bodyTextSecondary: {
        fontSize: typography.base,
        color: colors.textSecondary,
    },

    caption: {
        fontSize: typography.sm,
        color: colors.textSecondary,
    },

    // Layout helpers
    row: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    spaceBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    centered: {
        alignItems: 'center',
        justifyContent: 'center',
    },
});
