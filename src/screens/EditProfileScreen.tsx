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
import NetInfo from '@react-native-community/netinfo';
import { Shield } from 'lucide-react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { decode } from 'base64-arraybuffer';
import { queueAvatarUpload } from '../utils/uploadQueue';
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
    const [avatarBase64, setAvatarBase64] = useState<string | null>(null);
    const [avatarMimeType, setAvatarMimeType] = useState<string>('image/jpeg');
    const [isGraduating, setIsGraduating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfileData();
    }, [profileId]);

    React.useLayoutEffect(() => {
        navigation.setOptions({ headerShown: false });
    }, [navigation]);

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
            base64: true,
        });

        if (!result.canceled) {
            const asset = result.assets[0];
            setSelectedAvatar(asset.uri);
            setAvatarBase64(asset.base64 || null);
            setAvatarMimeType(asset.mimeType || 'image/jpeg');
            setIsCustomAvatar(true);
        }
    };

    const handleSelectEmoji = (emoji: string) => {
        setSelectedAvatar(emoji);
        setIsCustomAvatar(false);
        setAvatarBase64(null);
        setAvatarMimeType('image/jpeg');
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Name Required', 'Please enter a profile name.');
            return;
        }

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

            setLoading(true);
            let avatarToSave = selectedAvatar;

            // Upload to Supabase Storage if it's a new custom local image (base64 available)
            if (isCustomAvatar && avatarBase64) {
                const mimeType = avatarMimeType || 'image/jpeg';
                const fileExt = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${profileId}/${fileName}`;

                try {
                    // base64 comes directly from the picker — no FileSystem read needed
                    const { error: uploadError } = await supabase.storage
                        .from('avatars')
                        .upload(filePath, decode(avatarBase64), {
                            contentType: mimeType,
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
                    console.warn('Image upload failed, queuing for later:', error);
                    
                    // Queue the upload
                    const mimeType = avatarMimeType || 'image/jpeg';
                    await queueAvatarUpload(profileId, selectedAvatar, mimeType);

                    showToast({
                        message: 'Offline: Avatar queued for upload.',
                        type: 'info'
                    });
                    
                    // Fallback to local URI for immediate display
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

                        <TouchableOpacity
                            style={styles.privacyLink}
                            onPress={() => Alert.alert('Privacy & Data', 'Your data is stored locally on this device.\n\nWhen "Broadcast My Hours" is enabled, only your progress percentage and display name are shared with the team peer-to-peer.')}
                        >
                            <Shield size={16} color={colors.textSecondary} />
                            <Text style={styles.privacyLinkText}>Privacy & Data</Text>
                        </TouchableOpacity>
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
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
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
    privacyLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.xl,
        marginBottom: spacing.xl,
        padding: spacing.sm,
    },
    privacyLinkText: {
        fontSize: 12,
        color: colors.textSecondary,
        textDecorationLine: 'underline',
    },
});
