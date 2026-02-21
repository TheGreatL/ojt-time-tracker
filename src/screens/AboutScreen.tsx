// About Screen - App information and purpose

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    SafeAreaView,
    ScrollView,
    Image,
} from 'react-native';
import { Info, CheckCircle2, Clock, Trophy, FileText, Zap, Shield, Mail } from 'lucide-react-native';
import { colors, spacing, borderRadius } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';

export const AboutScreen: React.FC = () => {
    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.stickyHeader}>
                <View style={[styles.header, { marginBottom: 0 }]}>
                    <View style={styles.iconContainerSmall}>
                        <Zap size={24} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={globalStyles.heading2}>OJTally</Text>
                        <Text style={[globalStyles.caption, styles.version]}>Version 1.0.0</Text>
                    </View>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={styles.section}>
                    <Text style={globalStyles.heading3}>Purpose</Text>
                    <Text style={globalStyles.bodyText}>
                        OJTally is designed specifically for OJT (On-the-Job Training) students
                        to help them manage their internship requirements with ease and accuracy.
                    </Text>
                </View>

                <View style={styles.section}>
                    <Text style={globalStyles.heading3}>Key Features</Text>

                    <View style={styles.featureRow}>
                        <Clock size={20} color={colors.primary} />
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Precise Time Tracking</Text>
                            <Text style={globalStyles.caption}>Log your daily hours and track your progress against requirements.</Text>
                        </View>
                    </View>

                    <View style={styles.featureRow}>
                        <Zap size={20} color={colors.primary} />
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Prediction Engine</Text>
                            <Text style={globalStyles.caption}>Get an estimated completion date based on your recent work pace.</Text>
                        </View>
                    </View>

                    <View style={styles.featureRow}>
                        <Trophy size={20} color={colors.primary} />
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Global Leaderboard</Text>
                            <Text style={globalStyles.caption}>Stay motivated by seeing the progress of your fellow interns.</Text>
                        </View>
                    </View>

                    <View style={styles.featureRow}>
                        <FileText size={20} color={colors.primary} />
                        <View style={styles.featureText}>
                            <Text style={styles.featureTitle}>Daily Logs</Text>
                            <Text style={globalStyles.caption}>Keep track of your tasks and milestones with built-in daily notes.</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={globalStyles.heading3}>Our Goal</Text>
                    <Text style={globalStyles.bodyText}>
                        We want to eliminate the stress of manual hour tracking so you can focus
                        on what matters most: learning and growing in your chosen field.
                    </Text>
                </View>

                <View style={[styles.section, styles.privacySection]}>
                    <View style={styles.sectionHeader}>
                        <Shield size={20} color={colors.primary} />
                        <Text style={globalStyles.heading3}>Privacy & Data</Text>
                    </View>
                    <View style={styles.privacyContent}>
                        <Text style={styles.privacyTitle}>Your Data, Your Control</Text>
                        <Text style={styles.privacyText}>
                            <Text style={styles.privacyBold}>Cloud Data (Supabase):</Text> Only your shared progress data (name, total hours, completion percentage, and avatar) is stored in the cloud for the leaderboard feature. This data is visible to the developer for system maintenance.
                        </Text>
                        <Text style={styles.privacyText}>
                            <Text style={styles.privacyBold}>Local Data (Your Device):</Text> All other data including your detailed attendance logs, notes, and personal settings are stored locally on your device. The developer has no access to this information.
                        </Text>
                        <Text style={styles.privacyFooter}>
                            💡 Your notes and detailed work logs remain completely private and never leave your device.
                        </Text>
                    </View>
                </View>
                
                <View style={[styles.section, styles.contactSection]}>
                    <View style={styles.sectionHeader}>
                        <Mail size={20} color={colors.primary} />
                        <Text style={globalStyles.heading3}>Contact Developer</Text>
                    </View>
                    <Text style={globalStyles.bodyText}>
                        If you encounter any errors or have questions, you can message the developer here:
                        (girls only)
                    </Text>
                    <View style={styles.contactCard}>
                         <View style={styles.profileImageContainer}>
                            {/* Placeholder for profile image if available */}
                            <Zap size={24} color={'#FFFFFF'} />
                        </View>
                        <View>
                            <Text style={styles.contactEmail}>carlonkenandrew.business@gmail.com</Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.section, styles.donationSection]}>
                    <Text style={globalStyles.heading3}>Support the Developer</Text>
                    <Text style={globalStyles.bodyText}>
                        If you like the app and want to donate to this poor developer, you can donate here:
                    </Text>
                    <View style={styles.qrContainer}>
                        <Image
                            source={require('../assets/gcash_qr.jpeg')}
                            style={styles.qrImage}
                            resizeMode="contain"
                        />
                    </View>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footerText}>Made with ❤️ for Interns</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    stickyHeader: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    iconContainerSmall: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
        elevation: 2,
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    scrollContent: {
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconContainer: {
        width: 100,
        height: 100,
        borderRadius: borderRadius.xl,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
        // Elevation for Android
        elevation: 4,
        // Shadow for iOS
        shadowColor: colors.textPrimary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    version: {
        marginTop: spacing.xs,
    },
    section: {
        marginBottom: spacing.xl,
    },
    featureRow: {
        flexDirection: 'row',
        marginTop: spacing.md,
        gap: spacing.md,
    },
    featureText: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary,
        marginBottom: 2,
    },
    footer: {
        alignItems: 'center',
        marginTop: spacing.xl,
        paddingBottom: spacing.xl,
    },
    footerText: {
        fontSize: 14,
        color: colors.textTertiary,
        fontStyle: 'italic',
    },
    donationSection: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.primaryLight + '40',
    },
    qrContainer: {
        alignItems: 'center',
        marginTop: spacing.md,
        backgroundColor: '#fff',
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    qrImage: {
        width: 250,
        height: 400,
    },
    privacySection: {
        backgroundColor: colors.surface,
        borderLeftWidth: 3,
        borderLeftColor: colors.primary,
        padding: spacing.md,
        borderRadius: borderRadius.md,
    },
    privacyContent: {
        marginTop: spacing.sm,
    },
    privacyTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginBottom: spacing.md,
    },
    privacyText: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    privacyBold: {
        fontWeight: 'bold',
        color: colors.textPrimary,
    },
    privacyFooter: {
        fontSize: 12,
        color: colors.textTertiary,
        fontStyle: 'italic',
        marginTop: spacing.sm,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    contactSection: {
        backgroundColor: colors.surface,
        padding: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        backgroundColor: colors.background,
        padding: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.md,
    },
     profileImageContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactEmail: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary,
    },
});
