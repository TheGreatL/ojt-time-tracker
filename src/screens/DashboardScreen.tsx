// Dashboard Screen - Main hub showing progress and predictions

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    RefreshControl,
    Alert,
    useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { Calendar as CalendarIcon, Settings, User, HelpCircle, Info, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { ProgressBar } from '../components/ProgressBar';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { OnboardingOverlay } from '../components/OnboardingOverlay';
import { useProfile } from '../context/ProfileContext';
import { updateSettings } from '../database/operations';
import {
    getSettingsByProfileId,
    getTotalHoursWorked,
    getAttendanceLogsByProfileId,
    getNotesByProfileId
} from '../database/queries';
import { calculateCompletionDate, formatDate as formatPredictionDate } from '../utils/predictionEngine';
import { Calendar, DateData } from 'react-native-calendars';
import { DateEntryModal } from './DateEntryModal';
import { colors, spacing } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { OfflineStatusIndicator } from '../components/OfflineStatusIndicator';
import { syncProfileToCloud } from '../utils/cloudSync';
import { scale, responsiveFontSize, isTablet } from '../utils/responsive';

type RootStackParamList = {
    Dashboard: undefined;
    Settings: undefined;
    ProfileSelection: undefined;
};

type DashboardScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
    const { activeProfile, setActiveProfile } = useProfile();
    const { width } = useWindowDimensions();
    const [totalHours, setTotalHours] = useState(0);
    const [hoursCompleted, setHoursCompleted] = useState(0);
    const [estimatedDate, setEstimatedDate] = useState<Date | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    const isWide = width >= 768;

    // Calendar State
    const [markedDates, setMarkedDates] = useState<any>({});
    const [selectedDate, setSelectedDate] = useState<string | null>(null);

    const [modalVisible, setModalVisible] = useState(false);

    // Onboarding State
    const [showOnboarding, setShowOnboarding] = useState(false);

    const onboardingSteps = [
        {
            title: 'Welcome to OJTally! 👋',
            description: 'This is your dashboard where you can track your internship progress and hours.',
        },
        {
            title: 'Track Your Progress 📈',
            description: 'See exactly how many hours you have left to complete your internship requirements.',
        },
        {
            title: 'Log Your Hours 📅',
            description: 'Tap on any date in the calendar below to log your daily hours or mark days as excluded.',
        },
        {
            title: 'Leaderboard 🏆',
            description: 'Check the "Leaderboards" tab to see how your fellow interns are doing (if sharing is enabled).',
        },
    ];

    const loadData = async () => {
        if (!activeProfile) return;

        const settings = await getSettingsByProfileId(activeProfile.id);
        const completed = await getTotalHoursWorked(activeProfile.id);
        const logs = await getAttendanceLogsByProfileId(activeProfile.id);
        const prediction = calculateCompletionDate(settings, logs, completed);
        const notes = await getNotesByProfileId(activeProfile.id);

        if (settings && !settings.has_seen_tutorial) {
            setShowOnboarding(true);
        }

        setTotalHours(settings?.total_hours_required || 0);
        setHoursCompleted(completed);
        setEstimatedDate(prediction.estimatedCompletionDate);

        // Periodically verify cloud sync (handles recovery from offline sessions)
        syncProfileToCloud(activeProfile.id);

        // Calendar Logic
        const marked: any = {};

        // Mark logged and excluded dates
        logs.forEach((log) => {
            if (log.status === 'worked') {
                marked[log.date] = {
                    selected: true,
                    selectedColor: colors.calendarWorked,
                    customStyles: {
                        container: { backgroundColor: colors.calendarWorked },
                        text: { color: colors.textInverse },
                    },
                };
            } else if (log.status === 'excluded') {
                marked[log.date] = {
                    selected: true,
                    selectedColor: colors.calendarExcluded,
                    customStyles: {
                        container: { backgroundColor: colors.calendarExcluded },
                        text: { color: colors.textInverse },
                    },
                };
            }
        });

        // Mark dates with notes (calendar-linked notes only)
        notes.filter(note => !!note.date).forEach((note) => {
            const dateStr = note.date!;
            if (marked[dateStr]) {
                marked[dateStr] = {
                    ...marked[dateStr],
                    marked: true,
                    dotColor: colors.primary,
                };
            } else {
                marked[dateStr] = {
                    marked: true,
                    dotColor: colors.primary,
                };
            }
        });

        // Mark predicted completion date
        if (prediction.estimatedCompletionDate) {
            const completionDateStr = formatPredictionDate(prediction.estimatedCompletionDate);
            marked[completionDateStr] = {
                selected: true,
                selectedColor: colors.calendarPredicted,
                customStyles: {
                    container: { backgroundColor: colors.calendarPredicted },
                    text: { color: colors.textPrimary, fontWeight: 'bold' },
                },
            };
        }

        // Mark scheduled work days (grey) - future dates only
        if (settings) {
            try {
                const schedule: number[] = JSON.parse(settings.weekly_schedule);
                const today = new Date();
                const futureDate = new Date(today);
                futureDate.setDate(futureDate.getDate() + 90); // Next 90 days

                for (let d = new Date(today); d <= futureDate; d.setDate(d.getDate() + 1)) {
                    const dayOfWeek = d.getDay();
                    const dateStr = formatPredictionDate(d);

                    // Only mark if it's a scheduled day and not already marked
                    if (schedule.includes(dayOfWeek) && !marked[dateStr]) {
                        marked[dateStr] = {
                            marked: true,
                            dotColor: colors.calendarScheduled,
                        };
                    }
                }
            } catch (error) {
                console.error('Error parsing schedule:', error);
            }
        }

        setMarkedDates(marked);
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [activeProfile])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleSwitchProfile = () => {
        setActiveProfile(null);
        navigation.navigate('ProfileSelection');
    };

    const formatDate = (date: Date | null): string => {
        if (!date) return 'Not available';
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const hoursRemaining = totalHours - hoursCompleted;

    const handleDayPress = (day: DateData) => {
        setSelectedDate(day.dateString);
        setModalVisible(true);
    };

    const handleModalClose = () => {
        setModalVisible(false);
        setSelectedDate(null);
        loadData(); // Refresh all data including calendar after changes
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.header}>
                <View style={styles.profileInfo}>
                    <ProfileAvatar
                        name={activeProfile?.name || ''}
                        avatar={activeProfile?.avatar || ''}
                        size={width > 400 ? "medium" : "small"}
                        hideName={true}
                    />
                    <View style={{ flex: 1 }}>
                        <Text 
                            style={globalStyles.heading2}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                        >
                            {activeProfile?.name}
                        </Text>
                    </View>
                </View>
                <View style={styles.headerButtons}>
                    <TouchableOpacity onPress={() => navigation.navigate('About' as any)} style={styles.iconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Info size={scale(24)} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setShowOnboarding(true)} style={styles.iconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <HelpCircle size={scale(24)} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSwitchProfile} style={styles.iconButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <User size={scale(24)} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                <View style={isWide ? styles.wideLayout : styles.standardLayout}>
                    <View style={isWide ? styles.leftColumn : styles.fullWidth}>
                        <View style={[globalStyles.card, styles.progressCard]}>
                            <View style={styles.sectionHeader}>
                                <Text style={globalStyles.heading3}>Progress</Text>
                                {activeProfile?.is_graduating && (
                                    <Text style={styles.graduationBadge}>Road to graduation 🎓</Text>
                                )}
                            </View>
                            <View style={styles.progressSection}>
                                <ProgressBar current={hoursCompleted} total={totalHours} />
                                <Text style={[globalStyles.caption, styles.remainingText]}>
                                    {hoursRemaining > 0
                                        ? `${hoursRemaining.toFixed(1)} hours remaining`
                                        : 'Completed! 🎉'}
                                </Text>
                            </View>
                        </View>

                        <View style={[globalStyles.card, styles.predictionCard]}>
                            <View style={styles.sectionHeader}>
                                <Text style={[globalStyles.heading3, { flexShrink: 1 }]}>
                                    {hoursRemaining <= 0 ? 'Status' : 'Estimated Completion'}
                                </Text>
                                {activeProfile?.is_graduating && (
                                    <Text style={styles.graduationBadge}>Graduating 🎓</Text>
                                )}
                            </View>
                            <View style={styles.predictionContent}>
                                <View style={[
                                    styles.dateContainer,
                                    hoursRemaining <= 0 && { backgroundColor: colors.primaryLight + '20', borderColor: colors.primary, borderWidth: 1 }
                                ]}>
                                    {hoursRemaining <= 0 ? (
                                        <Text style={[styles.dateText, { color: colors.primary, fontSize: responsiveFontSize(18) }]}>
                                            {activeProfile?.is_graduating
                                                ? "Mission Accomplished! Next stop: Graduation! 🎓"
                                                : "Mission Accomplished! You've completed your OJT hours! 🎉"}
                                        </Text>
                                    ) : (
                                        <Text style={styles.dateText}>{formatDate(estimatedDate)}</Text>
                                    )}
                                </View>
                            </View>
                            {hoursRemaining > 0 && !estimatedDate && (
                                <Text style={[globalStyles.caption, styles.warningText]}>
                                    Configure your settings and schedule to see prediction
                                </Text>
                            )}
                        </View>
                    </View>

                    <View style={isWide ? styles.rightColumn : styles.fullWidth}>
                        <View style={styles.calendarSection}>
                            <Text style={globalStyles.heading3}>Calendar</Text>
                            <Calendar
                                enableSwipeMonths={true}
                                markedDates={markedDates}
                                onDayPress={handleDayPress}
                                theme={{
                                    todayTextColor: colors.primary,
                                    selectedDayBackgroundColor: colors.primary,
                                    arrowColor: colors.primary,
                                    textDayFontSize: responsiveFontSize(14),
                                    textMonthFontSize: responsiveFontSize(16),
                                    textDayHeaderFontSize: responsiveFontSize(12),
                                }}
                                style={styles.calendar}
                            />

                            <View style={[globalStyles.card, styles.legend]}>
                                <Text style={globalStyles.heading3}>Legend</Text>
                                <View style={styles.legendGrid}>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: colors.calendarWorked }]} />
                                        <Text style={globalStyles.caption}>Logged</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: colors.calendarScheduled }]} />
                                        <Text style={globalStyles.caption}>Scheduled</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: colors.calendarExcluded }]} />
                                        <Text style={globalStyles.caption}>Excluded</Text>
                                    </View>
                                    <View style={styles.legendItem}>
                                        <View style={[styles.legendDot, { backgroundColor: colors.calendarPredicted }]} />
                                        <Text style={globalStyles.caption}>Predicted End</Text>
                                    </View>
                                </View>
                            </View>
                        </View>
                    </View>
                </View>

                {selectedDate && (
                    <DateEntryModal
                        visible={modalVisible}
                        date={selectedDate}
                        onClose={handleModalClose}
                    />
                )}


                <OnboardingOverlay
                    visible={showOnboarding}
                    steps={onboardingSteps}
                    onClose={async () => {
                        setShowOnboarding(false);
                        if (activeProfile) {
                            await updateSettings(activeProfile.id, { has_seen_tutorial: true });
                        }
                    }}
                />
            </ScrollView>
            <OfflineStatusIndicator />
        </SafeAreaView>
    );

};

const styles = StyleSheet.create({
    scrollContent: {
        flexGrow: 1,
        padding: spacing.lg,
        paddingBottom: scale(100), // Increased extra padding for better accessibility
    },
    wideLayout: {
        flexDirection: 'row',
        gap: spacing.lg,
    },
    standardLayout: {
        flexDirection: 'column',
    },
    leftColumn: {
        flex: 1,
    },
    rightColumn: {
        flex: 1.5,
    },
    fullWidth: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        zIndex: 10,
    },
    profileInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        marginRight: spacing.md,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    iconButton: {
        padding: spacing.xs,
    },
    progressCard: {
        marginBottom: spacing.lg,
    },
    progressSection: {
        marginTop: spacing.md,
    },
    remainingText: {
        marginTop: spacing.sm,
        textAlign: 'center',
        color: colors.textSecondary,
    },
    predictionCard: {
        marginBottom: spacing.lg,
        backgroundColor: colors.gold + '15', // Soft Gold background
        borderWidth: 1,
        borderColor: colors.gold,
    },
    dateContainer: {
        marginTop: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.gold,
    },
    dateText: {
        fontSize: responsiveFontSize(16),
        fontWeight: 'bold',
        color: colors.textPrimary,
        textAlign: 'center',
    },
    warningText: {
        marginTop: spacing.sm,
        textAlign: 'center',
        color: colors.warning,
        fontStyle: 'italic',
    },
    calendarSection: {
        marginTop: spacing.md,
    },
    calendar: {
        marginBottom: spacing.lg,
        marginTop: spacing.md,
        borderRadius: 12,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    legend: {
        marginTop: spacing.md,
    },
    legendGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    legendDot: {
        width: scale(16),
        height: scale(16),
        borderRadius: scale(8), // Round dots
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    graduationBadge: {
        fontSize: responsiveFontSize(11),
        fontWeight: '700',
        color: colors.primary,
        backgroundColor: colors.primaryLight + '20',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 10,
        marginLeft: spacing.xs,
        textAlign: 'center',
        overflow: 'hidden',
    },
    predictionContent: {
        marginTop: spacing.xs,
    },
});

