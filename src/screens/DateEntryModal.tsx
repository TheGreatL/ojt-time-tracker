// Date Entry Modal - For manual hour entry and exclusions

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { X, Info } from 'lucide-react-native';
import { useProfile } from '../context/ProfileContext';
import { useToast } from '../context/ToastContext';
import {
    upsertAttendanceLog,
    deleteAttendanceLog,
    upsertNote,
    deleteNote,
    deleteNoteByDate,
} from '../database/operations';
import {
    getAttendanceLogByDate,
    getNoteByDate,
    getSettingsByProfileId,
    getAttendanceLogsByDateRange,
    getAttendanceLogsByProfileId,
} from '../database/queries';
import { getWeekStart, parseDate, formatDate } from '../utils/predictionEngine';
import { colors, spacing, borderRadius } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { scale } from '../utils/responsive';

interface DateEntryModalProps {
    visible: boolean;
    date: string;
    onClose: () => void;
}

export const DateEntryModal: React.FC<DateEntryModalProps> = ({ visible, date, onClose }) => {
    const { activeProfile } = useProfile();
    const { showToast } = useToast();
    const [hours, setHours] = useState('');
    const [isExcluded, setIsExcluded] = useState(false);
    const [note, setNote] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [existingLog, setExistingLog] = useState<import('../database/schema').AttendanceLog | null>(null);
    const [existingNote, setExistingNote] = useState<import('../database/schema').Note | null>(null);
    const [settings, setSettings] = useState<import('../database/schema').Settings | null>(null);
    const [weekLogs, setWeekLogs] = useState<import('../database/schema').AttendanceLog[]>([]);
    const [allLogs, setAllLogs] = useState<import('../database/schema').AttendanceLog[]>([]); // Keep this for total hours calculation if needed
    const [weeklyTotalLogged, setWeeklyTotalLogged] = useState(0);

    useEffect(() => {
        if (visible && activeProfile) {
            loadExistingData();
        }
    }, [visible, date, activeProfile]);

    const loadExistingData = async () => {
        if (!activeProfile) return;

        // Calculate week range for this date
        const selectedDateObj = parseDate(date);
        const weekStart = getWeekStart(selectedDateObj);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // End of week (Saturday)

        const weekStartStr = formatDate(weekStart);
        const weekEndStr = formatDate(weekEnd);

        // Fetch data
        const [log, noteData, profileSettings, periodicLogs, totalLogs] = await Promise.all([
            getAttendanceLogByDate(activeProfile.id, date),
            getNoteByDate(activeProfile.id, date),
            getSettingsByProfileId(activeProfile.id),
            getAttendanceLogsByDateRange(activeProfile.id, weekStartStr, weekEndStr),
            getAttendanceLogsByProfileId(activeProfile.id) // Still needed for total completion check
        ]);

        setSettings(profileSettings);
        setWeekLogs(periodicLogs);
        setAllLogs(totalLogs);

        if (log) {
            setExistingLog(log);
            setHours(log.hours_worked.toString());
            setIsExcluded(log.status === 'excluded');
        } else {
            setExistingLog(null);
            // Default to max_hours_per_day if it exists, otherwise empty
            setHours(profileSettings?.max_hours_per_day?.toString() || '');
            setIsExcluded(false);
        }

        if (noteData) {
            setExistingNote(noteData);
            setNote(noteData.content);
            setNoteTitle(noteData.title || '');
        } else {
            setExistingNote(null);
            setNote('');
            setNoteTitle('');
        }

        // Week start and end strings are already calculated above, but we need to re-verify if logic matches
        // Actually we used the date argument to fetch the relevant week logs, so 'periodicLogs' contains exactly what we need

        const weeklyLogged = (periodicLogs || [])
            .filter(l => l.date !== date && l.status === 'worked')
            .reduce((sum, l) => sum + l.hours_worked, 0);

        setWeeklyTotalLogged(weeklyLogged);
    }


    const totalHoursCompleted = (allLogs || [])
        .filter(l => l.status === 'worked')
        .reduce((sum, l) => sum + l.hours_worked, 0);

    const isInternshipCompleted = (settings && settings.total_hours_required > 0 && totalHoursCompleted >= settings.total_hours_required) || false;

    const handleSave = async () => {
        if (!activeProfile) return;

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

            // Only save attendance log if NOT completed or if we are editing an existing record THAT IS BEFORE completion?
            // User said: "If already completed... only viewing of calendar data and notes creation he/she can only do"
            // This means we should NOT modify attendance_logs at all if completed.
            if (!isInternshipCompleted) {
                if (isExcluded) {
                    await upsertAttendanceLog(activeProfile.id, date, 0, 'excluded');
                } else {
                    // Robust parsing
                    // Replace commas with dots, remove non-numeric chars except dot
                    const sanitized = hours.replace(/,/g, '.').replace(/[^0-9.]/g, '');
                    const hoursValue = parseFloat(sanitized);

                    if (isNaN(hoursValue) || hoursValue < 0) {
                        Alert.alert('Invalid Input', 'Please enter valid hours worked.', [{ text: 'OK' }]);
                        return;
                    }

                    if (hoursValue > 24) {
                        Alert.alert('Invalid Input', 'Hours worked cannot exceed 24 hours per day.', [{ text: 'OK' }]);
                        return;
                    }

                    // Check daily constraint
                    if (settings && settings.max_hours_per_day !== null && settings.max_hours_per_day > 0 && hoursValue > settings.max_hours_per_day) {
                        Alert.alert(
                            'Daily Limit Exceeded',
                            `Your daily limit is ${settings.max_hours_per_day} hours. You entered ${hoursValue} hours.`,
                            [{ text: 'OK' }]
                        );
                        return;
                    }

                    // Check weekly constraint
                    if (settings && !settings.unlimited_weekly && settings.max_hours_per_week !== null && settings.max_hours_per_week > 0) {
                        if (weeklyTotalLogged + hoursValue > settings.max_hours_per_week) {
                            const available = Math.max(0, settings.max_hours_per_week - weeklyTotalLogged);
                            Alert.alert(
                                'Weekly Limit Exceeded',
                                `Your weekly limit is ${settings.max_hours_per_week} hours. You already have ${weeklyTotalLogged} hours this week (excluding today). You can only log up to ${available.toFixed(1)} more hours.`,
                                [{ text: 'OK' }]
                            );
                            return;
                        }
                    }

                    await upsertAttendanceLog(activeProfile.id, date, hoursValue, 'worked');
                }
            }

            if (note.trim()) {
                await upsertNote(activeProfile.id, date, note.trim(), noteTitle.trim() || null);
            } else if (existingNote) {
                await deleteNoteByDate(activeProfile.id, date);
            }

            showToast({ message: 'Changes saved successfully!', type: 'success' });
            onClose();
        } catch (error) {
            console.error('Error saving data:', error);
            Alert.alert('Error', 'Failed to save data.', [{ text: 'OK' }]);
        }
    };

    const handleDelete = async () => {
        if (!activeProfile || !existingLog) return;

        if (isInternshipCompleted) {
            Alert.alert('Restricted', 'You cannot delete duty hours after internship completion.', [{ text: 'OK' }]);
            return;
        }

        const state = await NetInfo.fetch();
        if (!state.isConnected) {
            const proceed = await new Promise<boolean>((resolve) => {
                Alert.alert(
                    'Currently Offline',
                    'You are currently offline if you want to make this update reflect on online, please update when you online, please update when you online again',
                    [
                        { text: 'Cancel', onPress: () => resolve(false), style: 'cancel' },
                        { text: 'Proceed Locally', onPress: () => resolve(true) }
                    ]
                );
            });
            if (!proceed) return;
        }

        Alert.alert('Delete Entry', 'Are you sure you want to delete this entry?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await Promise.all([
                        deleteAttendanceLog(activeProfile.id, date),
                        deleteNoteByDate(activeProfile.id, date)
                    ]);
                    showToast({ message: 'Entry deleted.', type: 'success' });
                    onClose();
                },
            },
        ]);
    };

    const formatDateDisplay = (dateString: string): string => {
        const [year, month, day] = dateString.split('-');
        const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        return d.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.keyboardView}
                >
                    <View style={styles.modalContainer}>
                        <View style={styles.header}>
                            <View>
                                <Text style={globalStyles.heading3}>{formatDateDisplay(date)}</Text>
                                {isInternshipCompleted && (
                                    <Text style={[globalStyles.caption, { color: colors.success, fontWeight: 'bold' }]}>
                                        Internship Completed (Viewing Mode)
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity onPress={onClose}>
                                <X size={24} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView
                            style={styles.scroll}
                            contentContainerStyle={styles.content}
                            showsVerticalScrollIndicator={false}
                        >
                            <TouchableOpacity
                                style={[
                                    styles.optionButton,
                                    !isExcluded && styles.optionButtonActive,
                                    isInternshipCompleted && { opacity: 0.6 }
                                ]}
                                onPress={() => !isInternshipCompleted && setIsExcluded(false)}
                                disabled={isInternshipCompleted}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        !isExcluded && styles.optionTextActive,
                                    ]}
                                >
                                    Mark as Worked
                                </Text>
                            </TouchableOpacity>

                            {!isExcluded && (
                                <View style={styles.inputGroup}>
                                    <View style={styles.labelRow}>
                                        <Text style={globalStyles.inputLabel}>Hours Worked</Text>
                                        {settings && !settings.unlimited_weekly && (
                                            <Text style={styles.weeklyBudget}>
                                                Week: {weeklyTotalLogged.toFixed(1)} / {settings.max_hours_per_week || 0}h
                                            </Text>
                                        )}
                                    </View>
                                    <TextInput
                                        style={[globalStyles.input, isInternshipCompleted && styles.disabledInput]}
                                        value={hours}
                                        onChangeText={setHours}
                                        keyboardType="numeric"
                                        placeholder="8"
                                        placeholderTextColor={colors.textTertiary}
                                        editable={!isInternshipCompleted}
                                    />
                                    <Text style={styles.helperText}>Enter total hours worked on this day (e.g. 8.0)</Text>
                                    {settings && !settings.unlimited_weekly && !isInternshipCompleted && (
                                        <Text style={[globalStyles.caption, styles.remainingInfo]}>
                                            {(() => {
                                                const val = parseFloat(hours) || 0;
                                                const remaining = (settings.max_hours_per_week || 0) - (weeklyTotalLogged + val);
                                                return remaining >= 0
                                                    ? `${remaining.toFixed(1)}h remaining for the week`
                                                    : `Exceeds weekly limit by ${Math.abs(remaining).toFixed(1)}h`;
                                            })()}
                                        </Text>
                                    )}
                                </View>
                            )}

                            <TouchableOpacity
                                style={[
                                    styles.optionButton,
                                    isExcluded && styles.optionButtonExcluded,
                                    isInternshipCompleted && { opacity: 0.6 }
                                ]}
                                onPress={() => !isInternshipCompleted && setIsExcluded(true)}
                                disabled={isInternshipCompleted}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        isExcluded && styles.optionTextExcluded,
                                    ]}
                                >
                                    Mark as Cannot Attend (Excluded)
                                </Text>
                                <TouchableOpacity
                                    style={styles.infoButton}
                                    onPress={() => Alert.alert('Excluded Status', 'Marking a day as excluded means it will not count towards your internship duration (e.g., holidays, sick leave).')}
                                >
                                    <Info size={16} color={isExcluded ? colors.danger : colors.textTertiary} />
                                </TouchableOpacity>
                            </TouchableOpacity>

                            <View style={styles.inputGroup}>
                                <Text style={globalStyles.inputLabel}>Note (Optional)</Text>
                                <TextInput
                                    style={[globalStyles.input, { marginBottom: spacing.sm }]}
                                    value={noteTitle}
                                    onChangeText={setNoteTitle}
                                    placeholder="Note title..."
                                    placeholderTextColor={colors.textTertiary}
                                />
                                <TextInput
                                    style={[globalStyles.input, styles.noteInput]}
                                    value={note}
                                    onChangeText={setNote}
                                    multiline
                                    numberOfLines={3}
                                    placeholder="Add a note about this day..."
                                    placeholderTextColor={colors.textTertiary}
                                />
                            </View>

                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={[globalStyles.button, styles.saveButton]}
                                    onPress={handleSave}
                                >
                                    <Text style={globalStyles.buttonText}>Save Changes</Text>
                                </TouchableOpacity>

                                {existingLog && !isInternshipCompleted && (
                                    <TouchableOpacity
                                        style={[globalStyles.button, styles.deleteButton]}
                                        onPress={handleDelete}
                                    >
                                        <Text style={globalStyles.buttonText}>Delete Entry</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: colors.background,
        borderTopLeftRadius: borderRadius.xl,
        borderTopRightRadius: borderRadius.xl,
        padding: spacing.lg,
        maxHeight: '94%', // Almost full screen if needed
        minHeight: scale(300), // Ensure a minimum height so it doesn't look like a thin slice
    },
    keyboardView: {
        flex: 1,
        width: '100%',
        justifyContent: 'flex-end',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    content: {
        gap: spacing.md,
        paddingBottom: spacing.xxl,
        flexGrow: 1,
    },
    scroll: {
        flexShrink: 1, // Allow it to shrink if needed, but not force collapse
    },
    optionButton: {
        padding: spacing.md,
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    optionButtonActive: {
        borderColor: colors.success,
        backgroundColor: colors.success + '10', // Light green background
    },
    optionButtonExcluded: {
        borderColor: colors.danger,
        backgroundColor: colors.danger + '10', // Light red background
    },
    optionText: {
        fontSize: 16,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    optionTextActive: {
        color: colors.success,
        fontWeight: '600',
    },
    optionTextExcluded: {
        color: colors.danger,
        fontWeight: '600',
        textDecorationLine: 'none', // Remove strikethrough
    },
    inputGroup: {
        marginVertical: spacing.sm,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xs,
    },
    weeklyBudget: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    remainingInfo: {
        marginTop: spacing.xs,
        fontSize: 11,
        fontStyle: 'italic',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.md,
    },
    saveButton: {
        flex: 1,
    },
    deleteButton: {
        flex: 1,
        backgroundColor: colors.danger,
    },
    disabledInput: {
        backgroundColor: colors.surfaceDark,
        color: colors.textTertiary,
        opacity: 0.7,
    },
    noteInput: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: spacing.sm,
    },
    helperText: {
        fontSize: 11,
        color: colors.textTertiary,
        marginTop: spacing.xs,
        marginLeft: spacing.xs,
    },
    infoButton: {
        padding: 4,
    },
});
