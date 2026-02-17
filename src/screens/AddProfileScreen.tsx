// Add Profile Screen

import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    ScrollView,
    ActivityIndicator,
    useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { supabase } from '../utils/supabase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { createProfile, updateProfile } from '../database/operations';
import { useToast } from '../context/ToastContext';
import { colors, spacing, borderRadius } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { WeekdaySelector } from '../components/WeekdaySelector';
import { scale, moderateScale, responsiveFontSize } from '../utils/responsive';

type RootStackParamList = {
    ProfileSelection: undefined;
    AddProfile: undefined;
};

type AddProfileScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'AddProfile'>;
};

// Predefined avatar options (using emoji as placeholders)
const AVATAR_OPTIONS = [
    '👤', '👨', '👩', '🧑', '👦', '👧',
    '🧔', '👱', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓',
    '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧑‍🔬',
];

export const AddProfileScreen: React.FC<AddProfileScreenProps> = ({ navigation }) => {
    const { showToast } = useToast();
    const { width } = useWindowDimensions();
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
    const [isCustomAvatar, setIsCustomAvatar] = useState(false);
    const [isGraduating, setIsGraduating] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Initial Internship Settings
    const [totalHours, setTotalHours] = useState('160');
    const [maxHoursPerDay, setMaxHoursPerDay] = useState('8');
    const [maxHoursPerWeek, setMaxHoursPerWeek] = useState('40');
    const [unlimitedWeekly, setUnlimitedWeekly] = useState(false);
    const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]); // Mon-Fri default

    const avatarSize = scale(width > 600 ? 55 : 48);

    const handlePickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setSelectedAvatar(result.assets[0].uri);
            setIsCustomAvatar(true);
        }
    };

    const handleSelectEmoji = (emoji: string) => {
        setSelectedAvatar(emoji);
        setIsCustomAvatar(false);
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Name Required', 'Please enter a profile name.');
            return;
        }

        const total = parseFloat(totalHours);
        const dailyMax = parseFloat(maxHoursPerDay);
        const weeklyMax = parseFloat(maxHoursPerWeek);

        if (isNaN(total) || total <= 0) {
            Alert.alert('Invalid Goal', 'Please enter a valid total internship hours goal.');
            return;
        }

        if (selectedDays.length === 0) {
            Alert.alert('Schedule Required', 'Please select at least one work day.');
            return;
        }

        try {
            setIsSaving(true);
            const profileId = await createProfile(
                name.trim(),
                selectedAvatar,
                isGraduating,
                {
                    totalHours: total,
                    maxHoursPerDay: dailyMax || 8,
                    maxHoursPerWeek: unlimitedWeekly ? undefined : (weeklyMax || 40),
                    weeklySchedule: JSON.stringify(selectedDays),
                    unlimitedWeekly: unlimitedWeekly,
                }
            );

            // Handle custom avatar upload if applicable
            if (isCustomAvatar) {
                try {
                    const fileExt = selectedAvatar.split('.').pop()?.toLowerCase() || 'jpg';
                    const fileName = `avatar_${Date.now()}.${fileExt}`;
                    const filePath = `${profileId}/${fileName}`;
                    const base64 = await FileSystem.readAsStringAsync(selectedAvatar, {
                        encoding: 'base64',
                    });

                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, decode(base64), {
                            contentType: `image/${fileExt}`,
                            upsert: true,
                        });

                    if (uploadError) {
                        console.error('Initial avatar upload failed:', uploadError.message);
                        showToast({ message: 'Profile created, but avatar sync failed.', type: 'warning' });
                    } else {
                        const { data: { publicUrl } } = supabase.storage
                            .from('avatars')
                            .getPublicUrl(filePath);

                        // Update profile with public URL (this also triggers cloud sync)
                        await updateProfile(profileId, name.trim(), publicUrl, isGraduating);
                    }
                } catch (uploadErr) {
                    console.error('Error during avatar upload:', uploadErr);
                    showToast({ message: 'Profile created, but avatar upload failed.', type: 'warning' });
                }
            }

            setIsSaving(false);
            navigation.goBack();
            showToast({ message: 'Profile created successfully!', type: 'success' });
        } catch (error) {
            setIsSaving(false);
            Alert.alert('Error', 'Failed to create profile. Please try again.');
            console.error('Error creating profile:', error);
        }
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.header}>
                    <Text style={globalStyles.heading2}>Create Profile</Text>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.section}>
                        <Text style={globalStyles.inputLabel}>Name</Text>
                        <TextInput
                            style={globalStyles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                            placeholderTextColor={colors.textTertiary}
                            maxLength={20}
                        />
                    </View>

                    <View style={styles.section}>
                        <View style={styles.avatarHeader}>
                            <Text style={globalStyles.inputLabel}>Choose Avatar</Text>
                            <TouchableOpacity onPress={handlePickImage} style={styles.galleryButton}>
                                <Text style={styles.galleryButtonText}>Pick from Gallery</Text>
                            </TouchableOpacity>
                        </View>

                        {isCustomAvatar && (
                            <View style={styles.selectedImageContainer}>
                                <Image source={{ uri: selectedAvatar }} style={[styles.selectedImage, { width: scale(80), height: scale(80), borderRadius: scale(40) }]} />
                                <Text style={globalStyles.caption}>Custom Photo Selected</Text>
                            </View>
                        )}

                        <View style={styles.avatarGrid}>
                            {AVATAR_OPTIONS.map((item) => (
                                <TouchableOpacity
                                    key={item}
                                    style={[
                                        styles.avatarOption,
                                        { width: avatarSize, height: avatarSize },
                                        !isCustomAvatar && selectedAvatar === item && styles.avatarOptionSelected,
                                    ]}
                                    onPress={() => handleSelectEmoji(item)}
                                >
                                    <Text style={[styles.avatarEmoji, { fontSize: responsiveFontSize(28) }]}>{item}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={globalStyles.heading3}>Internship Goals</Text>
                        <Text style={styles.sectionSubtext}>Set these accurately for precise completion estimates.</Text>

                        <View style={styles.inputGroup}>
                            <Text style={globalStyles.inputLabel}>Total Hours Required</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={totalHours}
                                onChangeText={setTotalHours}
                                keyboardType="numeric"
                                placeholder="e.g. 160"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={globalStyles.inputLabel}>Max Hours Per Day</Text>
                            <TextInput
                                style={globalStyles.input}
                                value={maxHoursPerDay}
                                onChangeText={setMaxHoursPerDay}
                                keyboardType="numeric"
                                placeholder="e.g. 8"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <View style={styles.row}>
                                <Text style={globalStyles.inputLabel}>Max Hours Per Week</Text>
                                <TouchableOpacity
                                    onPress={() => setUnlimitedWeekly(!unlimitedWeekly)}
                                    style={styles.inlineCheckbox}
                                >
                                    <View style={[styles.miniCheckbox, unlimitedWeekly && styles.miniCheckboxChecked]} />
                                    <Text style={styles.miniCheckboxLabel}>Unlimited</Text>
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                style={[globalStyles.input, unlimitedWeekly && styles.inputDisabled]}
                                value={maxHoursPerWeek}
                                onChangeText={setMaxHoursPerWeek}
                                keyboardType="numeric"
                                editable={!unlimitedWeekly}
                                placeholder="e.g. 40"
                                placeholderTextColor={colors.textTertiary}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={globalStyles.inputLabel}>Work Weekly Schedule</Text>
                        <Text style={styles.sectionSubtext}>Select the days you typically work.</Text>
                        <View style={styles.scheduleContainer}>
                            <WeekdaySelector
                                selectedDays={selectedDays}
                                onDaysChange={setSelectedDays}
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <TouchableOpacity
                            style={styles.checkboxContainer}
                            onPress={() => setIsGraduating(!isGraduating)}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.checkbox, isGraduating && styles.checkboxChecked]}>
                                {isGraduating && <Text style={styles.checkmark}>✓</Text>}
                            </View>
                            <Text style={styles.checkboxLabel}>I am graduating this year 🎓</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity
                            style={[globalStyles.button, globalStyles.buttonSecondary, styles.button]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={[globalStyles.buttonText, globalStyles.buttonSecondaryText]}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[globalStyles.button, styles.button]}
                            onPress={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color={colors.textInverse} size="small" />
                            ) : (
                                <Text style={globalStyles.buttonText}>Create Profile</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1, // Ensures the content can fill the screen and be scrollable
        padding: spacing.lg,
        paddingBottom: scale(100), // Increased extra padding for better accessibility
    },
    section: {
        marginTop: spacing.xl,
    },
    sectionSubtext: {
        fontSize: responsiveFontSize(12),
        color: colors.textTertiary,
        marginTop: -spacing.xs,
        marginBottom: spacing.md,
    },
    avatarGrid: {
        marginTop: spacing.md,
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    avatarOption: {
        margin: spacing.xs,
        backgroundColor: colors.surfaceDark,
        borderRadius: borderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    avatarOptionSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight + '20',
    },
    avatarEmoji: {
        fontSize: responsiveFontSize(28),
    },
    avatarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    galleryButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        backgroundColor: colors.primaryLight + '20',
        borderRadius: borderRadius.sm,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    galleryButtonText: {
        fontSize: responsiveFontSize(12),
        color: colors.primary,
        fontWeight: '600',
    },
    selectedImageContainer: {
        alignItems: 'center',
        marginVertical: spacing.md,
        padding: spacing.md,
        backgroundColor: colors.surfaceDark,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    selectedImage: {
        width: scale(80),
        height: scale(80),
        borderRadius: scale(40),
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xl,
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
    },
    button: {
        flex: 1,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: spacing.sm,
        gap: spacing.md,
    },
    checkbox: {
        width: scale(24),
        height: scale(24),
        borderRadius: 6,
        borderWidth: 2,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: colors.primary,
    },
    checkmark: {
        color: colors.textInverse,
        fontSize: responsiveFontSize(14),
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: responsiveFontSize(16),
        color: colors.textPrimary,
        fontWeight: '500',
    },
    inputGroup: {
        marginBottom: spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    inlineCheckbox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    miniCheckbox: {
        width: scale(16),
        height: scale(16),
        borderRadius: 4,
        borderWidth: 1.5,
        borderColor: colors.primary,
    },
    miniCheckboxChecked: {
        backgroundColor: colors.primary,
    },
    miniCheckboxLabel: {
        fontSize: responsiveFontSize(12),
        color: colors.textSecondary,
        fontWeight: '600',
    },
    inputDisabled: {
        backgroundColor: colors.surfaceDark,
        color: colors.textTertiary,
    },
    scheduleContainer: {
        marginTop: spacing.xs,
    },
});

