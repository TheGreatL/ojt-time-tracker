// Profile Selection Screen - Netflix-style profile picker

import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Alert,
    SafeAreaView,
    useWindowDimensions,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { Plus, Sparkles, Shield } from 'lucide-react-native';
import { ProfileAvatar } from '../components/ProfileAvatar';
import { deleteProfile } from '../database/operations';
import { getAllProfiles } from '../database/queries';
import { Profile } from '../database/schema';
import { useProfile } from '../context/ProfileContext';
import { useToast } from '../context/ToastContext';
import { colors, spacing } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { scale, responsiveFontSize } from '../utils/responsive';

type RootStackParamList = {
    ProfileSelection: undefined;
    AddProfile: undefined;
    Main: undefined;
    EditProfile: { profileId: number };
};

type ProfileSelectionScreenProps = {
    navigation: NativeStackNavigationProp<RootStackParamList, 'ProfileSelection'>;
};

export const ProfileSelectionScreen: React.FC<ProfileSelectionScreenProps> = ({ navigation }) => {
    const { showToast } = useToast();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const { activeProfile, setActiveProfile } = useProfile();
    const { width } = useWindowDimensions();

    const numColumns = useMemo(() => {
        if (width >= 1024) return 4;
        if (width >= 768) return 3;
        return 2;
    }, [width]);

    useFocusEffect(
        React.useCallback(() => {
            loadProfiles();
        }, [])
    );

    const loadProfiles = async () => {
        const allProfiles = await getAllProfiles();
        setProfiles(allProfiles);
    };

    const handleProfileSelect = (profile: Profile) => {
        setActiveProfile(profile);
        navigation.navigate('Main');
    };

    const handleProfileLongPress = (profile: Profile) => {
        Alert.alert(
            'Profile Options',
            `What would you like to do with "${profile.name}"?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Edit Profile',
                    onPress: () => navigation.navigate('EditProfile', { profileId: profile.id }),
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        const state = await NetInfo.fetch();
                        if (!state.isConnected) {
                            Alert.alert(
                                'Currently Offline',
                                'You are currently offline if you want to make this update reflect on online update when you online again',
                                [
                                    { text: 'Cancel', style: 'cancel' },
                                    { 
                                        text: 'Delete Locally Anyway', 
                                        onPress: async () => {
                                            await deleteProfile(profile.id);
                                            if (activeProfile?.id === profile.id) {
                                                setActiveProfile(null);
                                            }
                                            loadProfiles();
                                            showToast({ message: 'Profile deleted locally.', type: 'info' });
                                        }
                                    }
                                ]
                            );
                            return;
                        }

                        await deleteProfile(profile.id);
                        if (activeProfile?.id === profile.id) {
                            setActiveProfile(null);
                        }
                        loadProfiles();
                        showToast({ message: 'Profile deleted.', type: 'success' });
                    },
                },
            ]
        );
    };

    const handleAddProfile = () => {
        if (profiles.length >= 5) {
            Alert.alert('Maximum Profiles', 'You can only have up to 5 profiles.');
            return;
        }
        navigation.navigate('AddProfile');
    };

    return (
        <SafeAreaView style={globalStyles.container}>
            <FlatList
                key={numColumns} // Force re-render when columns change
                data={profiles}
                keyExtractor={(item) => item.id.toString()}
                numColumns={numColumns}
                contentContainerStyle={styles.profileGrid}
                ListHeaderComponent={
                    <View style={styles.header}>
                        <Text style={globalStyles.heading1}>OJTally</Text>
                        <Text style={[globalStyles.bodyTextSecondary, styles.subtitle]}>
                            Who's tracking today?
                        </Text>
                    </View>
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Sparkles size={scale(48)} color={colors.primary} style={{ marginBottom: spacing.md }} />
                        <Text style={[globalStyles.heading3, { textAlign: 'center' }]}>Welcome to OJTally!</Text>
                        <Text style={[globalStyles.bodyTextSecondary, { textAlign: 'center', marginTop: spacing.sm }]}>
                            Create your first profile to start tracking your journey.
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <View style={styles.profileItemContainer}>
                        <ProfileAvatar
                            name={item.name}
                            avatar={item.avatar}
                            size={width > 400 ? 'large' : 'medium'}
                            onPress={() => handleProfileSelect(item)}
                            onLongPress={() => handleProfileLongPress(item)}
                            onEditPress={() => handleProfileLongPress(item)}
                        />
                    </View>
                )}
                ListFooterComponent={
                    <View style={styles.footer}>
                        <Text style={styles.manageHint}>
                            Tip: Tap the pencil or long-press an avatar to edit or delete.
                        </Text>
                        <TouchableOpacity
                            style={[globalStyles.button, styles.addButton]}
                            onPress={handleAddProfile}
                            disabled={profiles.length >= 5}
                        >
                            <Plus size={scale(24)} color={colors.textInverse} />
                            <Text style={globalStyles.buttonText}>Add Profile</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.privacyLink}
                            onPress={() => Alert.alert('Privacy & Data', 'Your data is stored locally on this device.\n\nWhen "Broadcast My Hours" is enabled, only your progress percentage and display name are shared with the team peer-to-peer.')}
                        >
                            <Shield size={scale(16)} color={colors.textSecondary} />
                            <Text style={styles.privacyLinkText}>Privacy & Data</Text>
                        </TouchableOpacity>
                    </View>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    // The main container padding is now distributed to header/footer/contentContainerStyle
    container: {
        flex: 1,
        // padding: spacing.lg, // Removed as content is now inside FlatList
    },
    header: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },
    subtitle: {
        marginTop: spacing.sm,
        marginBottom: spacing.xl,
    },
    profileGrid: {
        paddingBottom: spacing.lg,
        paddingHorizontal: spacing.lg,
    },
    profileItemContainer: {
        flex: 1,
        alignItems: 'center',
        marginVertical: spacing.md,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: spacing.xxl,
    },
    addButton: {
        flexDirection: 'row',
        gap: spacing.sm,
        alignSelf: 'center',
        width: '100%',
        maxWidth: 300,
        borderRadius: 999, // User requested roundness
    },
    footer: {
        marginTop: spacing.lg,
        paddingBottom: spacing.xxl, // Added extra padding for accessibility
        gap: spacing.md,
        paddingHorizontal: spacing.lg,
    },
    manageHint: {
        textAlign: 'center',
        fontSize: responsiveFontSize(12),
        color: colors.textTertiary,
        fontStyle: 'italic',
    },
    privacyLink: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.xs,
        marginTop: spacing.sm,
        padding: spacing.sm,
    },
    privacyLinkText: {
        fontSize: responsiveFontSize(12),
        color: colors.textSecondary,
        textDecorationLine: 'underline',
    },
});
