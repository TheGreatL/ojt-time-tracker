// Settings Screen - User configuration for hours and schedule

import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Switch,
    Alert,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from '../navigation/MainNavigator';
import { Target, Clock, Calendar, CalendarDays, Save, Share2 } from 'lucide-react-native';
import { WeekdaySelector } from '../components/WeekdaySelector';
import { useProfile } from '../context/ProfileContext';
import { updateSettings } from '../database/operations';
import { useToast } from '../context/ToastContext';
import { getSettingsByProfileId } from '../database/queries';
import { colors, spacing, typography, borderRadius } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { scale } from '../utils/responsive';

type SettingsScreenProps = {
    navigation: BottomTabNavigationProp<MainTabParamList, 'Settings'>;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
    const { activeProfile, refreshProfile } = useProfile();
    const { showToast } = useToast();
    const [totalHours, setTotalHours] = useState('160');
    const [maxHoursPerDay, setMaxHoursPerDay] = useState('8');
    const [maxHoursPerWeek, setMaxHoursPerWeek] = useState('40');
    const [unlimitedWeekly, setUnlimitedWeekly] = useState(false);
    const [isSharingEnabled, setIsSharingEnabled] = useState(false);
    const [isAvatarVisible, setIsAvatarVisible] = useState(false);
    const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri
    const [isEditing, setIsEditing] = useState(false);

    const loadSettings = async () => {
        if (!activeProfile) return;

        const settings = await getSettingsByProfileId(activeProfile.id);
        if (settings) {
            setTotalHours(settings.total_hours_required.toString());
            setMaxHoursPerDay(settings.max_hours_per_day?.toString() || '8');
            setMaxHoursPerWeek(settings.max_hours_per_week?.toString() || '40');
            setUnlimitedWeekly(settings.unlimited_weekly);
            setIsSharingEnabled(settings.is_sharing_enabled);
            setIsAvatarVisible(settings.is_avatar_visible);

            try {
                const schedule = JSON.parse(settings.weekly_schedule);
                setSelectedDays(schedule);
            } catch {
                setSelectedDays([1, 2, 3, 4, 5]);
            }
        }
    };

    const handleSave = async () => {
        if (!activeProfile) return;

        const total = parseFloat(totalHours);
        const dailyMax = parseFloat(maxHoursPerDay);
        const weeklyMax = parseFloat(maxHoursPerWeek);

        if (isNaN(total) || total <= 0) {
            Alert.alert('Invalid Input', 'Total hours must be a positive number.');
            return;
        }

        if (isNaN(dailyMax) || dailyMax <= 0) {
            Alert.alert('Invalid Input', 'Max hours per day must be a positive number.');
            return;
        }

        if (dailyMax > 24) {
            Alert.alert('Invalid Input', 'Max hours per day cannot exceed 24 hours.');
            return;
        }

        if (!unlimitedWeekly && (isNaN(weeklyMax) || weeklyMax <= 0)) {
            Alert.alert('Invalid Input', 'Max hours per week must be a positive number.');
            return;
        }

        if (selectedDays.length === 0) {
            Alert.alert('Invalid Schedule', 'Please select at least one work day.');
            return;
        }

        Alert.alert(
            'Confirm Settings',
            'These changes are crucial and will affect your progress tracking and completion predictions. Are you sure you want to save?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: async () => {
                        try {
                            const state = await NetInfo.fetch();
                            if (!state.isConnected) {
                                const proceed = await new Promise<boolean>((resolve) => {
                                    Alert.alert(
                                        'Currently Offline',
                                        'You are currently offline if you want to make this update reflect on online, please update when you online again',
                                        [
                                            { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
                                            { text: 'Proceed Locally', onPress: () => resolve(true) }
                                        ]
                                    );
                                });
                                if (!proceed) return;
                            }

                            await updateSettings(activeProfile.id, {
                                total_hours_required: total,
                                max_hours_per_day: dailyMax,
                                max_hours_per_week: unlimitedWeekly ? null : weeklyMax,
                                weekly_schedule: JSON.stringify(selectedDays),
                                unlimited_weekly: unlimitedWeekly,
                                is_sharing_enabled: isSharingEnabled,
                                is_avatar_visible: isAvatarVisible,
                            });

                            // Ensure global context is updated
                            await refreshProfile();

                            showToast({ message: 'Settings saved successfully!', type: 'success' });
                            setIsEditing(false);
                        } catch (error) {
                            Alert.alert('Error', 'Failed to save settings. Please try again.');
                            console.error('Error saving settings:', error);
                        }
                    },
                },
            ]
        );
    };

    const handleCancel = () => {
        loadSettings();
        setIsEditing(false);
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginRight: spacing.md }}>
                    {isEditing ? (
                        <>
                            <TouchableOpacity
                                onPress={handleCancel}
                                activeOpacity={0.7}
                            >
                                <Text style={{ color: colors.danger, fontWeight: typography.medium as any }}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleSave}
                                activeOpacity={0.7}
                            >
                                <Save size={24} color={colors.primary} />
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setIsEditing(true)}
                            activeOpacity={0.7}
                        >
                            <Text style={{ color: colors.primary, fontWeight: typography.medium as any }}>Edit</Text>
                        </TouchableOpacity>
                    )}
                </View>
            ),
        });
    }, [navigation, isEditing, handleSave, handleCancel]);

    useFocusEffect(
        useCallback(() => {
            loadSettings();
        }, [activeProfile])
    );

    useEffect(() => {
        loadSettings();
    }, [activeProfile]);

    return (
        <SafeAreaView style={globalStyles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                <View style={[globalStyles.card, styles.section]}>
                    <View style={styles.sectionHeader}>
                        <Target size={20} color={colors.primary} />
                        <Text style={globalStyles.heading3}>Goal</Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={globalStyles.inputLabel}>Total Hours Required</Text>
                        <TextInput
                            style={[globalStyles.input, !isEditing && { opacity: 0.7, backgroundColor: colors.backgroundDark }]}
                            value={totalHours}
                            onChangeText={setTotalHours}
                            keyboardType="numeric"
                            placeholder="160"
                            placeholderTextColor={colors.textTertiary}
                            editable={isEditing}
                        />
                    </View>
                </View>



                <View style={[globalStyles.card, styles.section]}>
                    <View style={styles.sectionHeader}>
                        <Clock size={20} color={colors.primary} />
                        <Text style={globalStyles.heading3}>Daily Constraints</Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={globalStyles.inputLabel}>Max Hours Per Day</Text>
                        <TextInput
                            style={[globalStyles.input, !isEditing && { opacity: 0.7, backgroundColor: colors.backgroundDark }]}
                            value={maxHoursPerDay}
                            onChangeText={setMaxHoursPerDay}
                            keyboardType="numeric"
                            placeholder="8"
                            placeholderTextColor={colors.textTertiary}
                            editable={isEditing}
                        />
                        <Text style={globalStyles.caption}>
                            Maximum hours you can work in a single day
                        </Text>
                    </View>
                </View>

                <View style={[globalStyles.card, styles.section]}>
                    <View style={styles.sectionHeader}>
                        <Calendar size={20} color={colors.primary} />
                        <Text style={globalStyles.heading3}>Weekly Constraints</Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <View style={styles.switchRow}>
                            <Text style={globalStyles.inputLabel}>Unlimited Weekly Hours</Text>
                            <Switch
                                value={unlimitedWeekly}
                                onValueChange={setUnlimitedWeekly}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={colors.surface}
                                disabled={!isEditing}
                            />
                        </View>
                        {!unlimitedWeekly && (
                            <>
                                <TextInput
                                    style={[globalStyles.input, !isEditing && { opacity: 0.7, backgroundColor: colors.backgroundDark }]}
                                    value={maxHoursPerWeek}
                                    onChangeText={setMaxHoursPerWeek}
                                    keyboardType="numeric"
                                    placeholder="40"
                                    placeholderTextColor={colors.textTertiary}
                                    editable={isEditing}
                                />
                                <Text style={globalStyles.caption}>
                                    Maximum hours you can work in a week
                                </Text>
                            </>
                        )}
                    </View>
                </View>

                <View style={[globalStyles.card, styles.section]}>
                    <View style={styles.sectionHeader}>
                        <CalendarDays size={20} color={colors.primary} />
                        <Text style={globalStyles.heading3}>Work Schedule</Text>
                    </View>
                    <Text style={[globalStyles.caption, styles.scheduleCaption]}>
                        Select your regular work days
                    </Text>
                    <WeekdaySelector selectedDays={selectedDays} onDaysChange={setSelectedDays} disabled={!isEditing} />
                </View>

                <View style={[globalStyles.card, styles.section]}>
                    <View style={styles.sectionHeader}>
                        <Share2 size={20} color={colors.primary} />
                        <Text style={globalStyles.heading3}>Social & Privacy</Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <View style={styles.switchRow}>
                            <View style={{ flex: 1, marginRight: spacing.md }}>
                                <Text style={globalStyles.inputLabel}>Broadcast Progress</Text>
                                <Text style={globalStyles.caption}>
                                    Allow others to see your progress on the leaderboard.
                                </Text>
                            </View>
                            <Switch
                                value={isSharingEnabled}
                                onValueChange={(val) => {
                                    setIsSharingEnabled(val);
                                    if (!val) setIsAvatarVisible(false);
                                }}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={colors.surface}
                                disabled={!isEditing}
                            />
                        </View>

                        <View style={[styles.switchRow, !isSharingEnabled && { opacity: 0.5 }]}>
                            <View style={{ flex: 1, marginRight: spacing.md }}>
                                <Text style={globalStyles.inputLabel}>Show My Avatar</Text>
                                <Text style={globalStyles.caption}>
                                    Display your avatar next to your name on the leaderboard.
                                </Text>
                            </View>
                            <Switch
                                value={isAvatarVisible}
                                onValueChange={setIsAvatarVisible}
                                disabled={!isSharingEnabled || !isEditing}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor={colors.surface}
                            />
                        </View>
                    </View>
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    scrollContent: {
        padding: spacing.lg,
        flexGrow: 1,
        paddingBottom: scale(100),
    },
    section: {
        marginBottom: spacing.lg,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    inputGroup: {
        marginTop: spacing.md,
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    scheduleCaption: {
        marginTop: spacing.xs,
        marginBottom: spacing.md,
    },
    saveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.lg,
    },

});
