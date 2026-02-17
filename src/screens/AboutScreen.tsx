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
import { Info, CheckCircle2, Clock, Trophy, FileText, Zap } from 'lucide-react-native';
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
});
