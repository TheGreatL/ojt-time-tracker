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
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.md,
    },

    // Button styles
    button: {
        backgroundColor: colors.primary,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        minHeight: touchTarget.minHeight,
        alignItems: 'center',
        justifyContent: 'center',
    },

    buttonText: {
        color: colors.textInverse,
        fontSize: typography.base,
        fontWeight: typography.semibold,
    },

    buttonSecondary: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },

    buttonSecondaryText: {
        color: colors.textPrimary,
    },

    // Input styles
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        fontSize: typography.base,
        color: colors.textPrimary,
        minHeight: touchTarget.minHeight,
    },

    inputLabel: {
        fontSize: typography.sm,
        fontWeight: typography.medium,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
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
