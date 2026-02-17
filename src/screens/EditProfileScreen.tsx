// Edit Profile Screen

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    SafeAreaView,
    Alert,
    KeyboardAvoidingView,
    Platform,
    Image,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../utils/supabase';
import { updateProfile } from '../database/operations';
import { getProfileById } from '../database/queries';
import { useToast } from '../context/ToastContext';
import { colors, spacing, borderRadius } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';

type RootStackParamList = {
    ProfileSelection: undefined;
    AddProfile: undefined;
    EditProfile: { profileId: number };
};

type EditProfileScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;
    route: RouteProp<RootStackParamList, 'EditProfile'>;
};

const AVATAR_OPTIONS = [
    '👤', '👨', '👩', '🧑', '👦', '👧',
    '🧔', '👱', '👨‍💼', '👩‍💼', '👨‍🎓', '👩‍🎓',
    '👨‍💻', '👩‍💻', '🧑‍💻', '👨‍🔬', '👩‍🔬', '🧑‍🔬',
];

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({ navigation, route }) => {
    const { showToast } = useToast();
    const { profileId } = route.params;
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_OPTIONS[0]);
    const [isCustomAvatar, setIsCustomAvatar] = useState(false);
    const [isGraduating, setIsGraduating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfileData();
    }, [profileId]);

    const loadProfileData = async () => {
        try {
            const profile = await getProfileById(profileId);
            if (profile) {
                setName(profile.name);
                setSelectedAvatar(profile.avatar);

                const isUri = profile.avatar.startsWith('http') ||
                    profile.avatar.startsWith('file') ||
                    profile.avatar.startsWith('content') ||
                    profile.avatar.startsWith('data:');
                setIsCustomAvatar(isUri);
                setIsGraduating(profile.is_graduating);
            } else {
                Alert.alert('Error', 'Profile not found.');
                navigation.goBack();
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Error', 'Failed to load profile data.');
        } finally {
            setLoading(false);
        }
    };

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

        setLoading(true);
        try {
            let avatarToSave = selectedAvatar;

            // Upload to Supabase Storage if it's a custom local image
            if (isCustomAvatar && (selectedAvatar.startsWith('file://') || selectedAvatar.startsWith('content://'))) {
                const fileExt = selectedAvatar.split('.').pop()?.toLowerCase() || 'jpg';
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${profileId}/${fileName}`;

                try {
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
                        throw uploadError;
                    }

                    const { data } = supabase.storage
                        .from('avatars')
                        .getPublicUrl(filePath);

                    avatarToSave = data.publicUrl;
                } catch (error) {
                    console.warn('Image upload failed, falling back to local URI:', error);
                    showToast({
                        message: 'Offline: Changes saved locally. Leaderboard sync pending.',
                        type: 'warning'
                    });
                    // Fallback to local URI
                    avatarToSave = selectedAvatar;
                }
            }

            await updateProfile(profileId, name.trim(), avatarToSave, isGraduating);
            navigation.goBack();
            showToast({ message: 'Profile updated successfully!', type: 'success' });
        } catch (error: any) {
            Alert.alert('Error', `Failed to update profile: ${error.message || 'Unknown error'}`);
            console.error('Error updating profile:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={globalStyles.container}>
                <View style={styles.centerContainer}>
                    <Text>Loading...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={globalStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <View style={styles.header}>
                    <Text style={globalStyles.heading2}>Edit Profile</Text>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.content}>

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
                                    <Image source={{ uri: selectedAvatar }} style={styles.selectedImage} />
                                    <Text style={globalStyles.caption}>Custom Photo Selected</Text>
                                </View>
                            )}

                            <View style={styles.avatarGrid}>
                                {AVATAR_OPTIONS.map((item) => (
                                    <TouchableOpacity
                                        key={item}
                                        style={[
                                            styles.avatarOption,
                                            !isCustomAvatar && selectedAvatar === item && styles.avatarOptionSelected,
                                        ]}
                                        onPress={() => handleSelectEmoji(item)}
                                    >
                                        <Text style={styles.avatarEmoji}>{item}</Text>
                                    </TouchableOpacity>
                                ))}
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
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={colors.textInverse} size="small" />
                                ) : (
                                    <Text style={globalStyles.buttonText}>Save Changes</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        backgroundColor: colors.background,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        padding: spacing.lg,
    },
    section: {
        marginTop: spacing.xl,
    },
    avatarGrid: {
        marginTop: spacing.md,
    },
    avatarOption: {
        width: 50,
        height: 50,
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
        fontSize: 28,
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
        fontSize: 12,
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
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.xl,
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
        width: 24,
        height: 24,
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
        fontSize: 14,
        fontWeight: 'bold',
    },
    checkboxLabel: {
        fontSize: 16,
        color: colors.textPrimary,
        fontWeight: '500',
    },
});
