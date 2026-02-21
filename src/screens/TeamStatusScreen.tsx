import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../utils/supabase';
import { colors, spacing, typography, shadows } from '../styles/theme';
import { Trophy, Clock, Share2, Lock } from 'lucide-react-native';
import { useProfile } from '../context/ProfileContext';
import { updateProfile, updateSettings } from '../database/operations';
import { getSettingsByProfileId } from '../database/queries';
import { TouchableOpacity } from 'react-native';
import { OfflineStatusIndicator } from '../components/OfflineStatusIndicator';

interface UserProgress {
    profile_key: string;
    display_name: string;
    avatar_url: string | null;
    total_hours: number;
    completed_hours: number;
    last_updated: string;
}

export const LeaderboardScreen: React.FC = () => {
    const { activeProfile } = useProfile();
    const [isSharingEnabled, setIsSharingEnabled] = useState(false);
    const [leaderboardData, setLeaderboardData] = useState<UserProgress[]>([]);
    const [filter, setFilter] = useState<'all' | 'completed' | 'ongoing'>('all');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const checkSharingStatus = async () => {
        if (!activeProfile) return;
        const settings = await getSettingsByProfileId(activeProfile.id);
        if (settings) {
            setIsSharingEnabled(settings.is_sharing_enabled);
            if (settings.is_sharing_enabled) {
                fetchTeamProgress();
            } else {
                setLoading(false);
                setLeaderboardData([]);
            }
        }
    };

    const handleEnableSharing = async () => {
        if (!activeProfile) return;
        setLoading(true);
        try {
            await updateSettings(activeProfile.id, { is_sharing_enabled: true });
            setIsSharingEnabled(true);
            fetchTeamProgress();
        } catch (err) {
            console.error('Failed to enable sharing:', err);
            setLoading(false);
        }
    };

    const fetchTeamProgress = async () => {
        try {
            const { data, error } = await supabase
                .from('user_progress')
                .select('*')
                .order('completed_hours', { ascending: false });

            if (error) {
                console.error('Error fetching team progress:', error.message);
            } else {
                const sortedData = (data || []).sort((a, b) => {
                    const percentA = a.completed_hours / a.total_hours;
                    const percentB = b.completed_hours / b.total_hours;
                    return percentB - percentA;
                });
                setLeaderboardData(sortedData);
            }
        } catch (err) {
            console.error('Failed to fetch team progress:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            checkSharingStatus();
        }, [activeProfile])
    );

    useEffect(() => {
        if (isSharingEnabled) {
            console.log('Setting up realtime subscription for user_progress...');
            const subscription = supabase
                .channel('user_progress_changes')
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'user_progress'
                    },
                    (payload) => {
                        console.log('Realtime update received:', payload);

                        setLeaderboardData(currentProgress => {
                            let updatedList = [...currentProgress];

                            if (payload.eventType === 'INSERT') {
                                updatedList.push(payload.new as UserProgress);
                            } else if (payload.eventType === 'UPDATE') {
                                const index = updatedList.findIndex(p => p.profile_key === payload.new.profile_key);
                                if (index !== -1) {
                                    updatedList[index] = { ...updatedList[index], ...payload.new };
                                } else {
                                    // If for some reason it wasn't in our list (e.g. joined late), add it
                                    updatedList.push(payload.new as UserProgress);
                                }
                            } else if (payload.eventType === 'DELETE') {
                                updatedList = updatedList.filter(p => p.profile_key !== payload.old.profile_key);
                            }

                            // Re-sort the list by completion percentage descending
                            return updatedList.sort((a, b) => {
                                const percentA = a.completed_hours / a.total_hours;
                                const percentB = b.completed_hours / b.total_hours;
                                return percentB - percentA;
                            });
                        });
                    }
                )
                .subscribe();

            return () => {
                console.log('Cleaning up realtime subscription...');
                supabase.removeChannel(subscription);
            };
        }
    }, [activeProfile, isSharingEnabled]);

    const onRefresh = () => {
        if (isSharingEnabled) {
            setRefreshing(true);
            fetchTeamProgress();
        }
    };

    const renderAvatar = (avatarUrl: string | null) => {
        if (!avatarUrl) {
            return (
                <View style={[styles.avatar, styles.placeholderAvatar]}>
                    <Trophy size={16} color={colors.textTertiary} />
                </View>
            );
        }

        // Check if it's a valid URL or file path
        const isUrl = avatarUrl.startsWith('http') || avatarUrl.startsWith('data:') || avatarUrl.startsWith('file:');

        if (isUrl) {
            return <Image source={{ uri: avatarUrl }} style={styles.avatar} />;
        }

        // Otherwise treat as emoji
        return (
            <View style={[styles.avatar, styles.placeholderAvatar]}>
                <Text style={styles.avatarEmoji}>{avatarUrl}</Text>
            </View>
        );
    };

    const renderItem = ({ item }: { item: UserProgress }) => {
        const progress = Math.min(100, (item.completed_hours / item.total_hours) * 100);
        const remainingHours = Math.max(0, item.total_hours - item.completed_hours);

        return (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <View style={styles.userProfileInfo}>
                        <View style={styles.avatarContainer}>
                            {renderAvatar(item.avatar_url)}
                        </View>
                        <Text style={styles.userName}>{item.display_name}</Text>
                    </View>
                    <Text style={styles.lastUpdated}>
                        {new Date(item.last_updated).toLocaleDateString()}
                    </Text>
                </View>

                <View style={styles.progressRow}>
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBar, { width: `${progress}%` }]} />
                    </View>
                    <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
                </View>

                <View style={styles.statsRow}>
                    <View style={styles.stat}>
                        <Clock size={16} color={colors.primary} />
                        <Text style={styles.statText}>{item.completed_hours.toFixed(1)} / {item.total_hours} hrs</Text>
                    </View>
                    <Text style={styles.remainingText}>{remainingHours.toFixed(1)} hrs left</Text>
                </View>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.loadingText}>Checking Leaderboards...</Text>
            </View>
        );
    }

    if (!isSharingEnabled) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Trophy size={24} color={colors.primary} />
                    <Text style={styles.title}>OJT Leaderboards</Text>
                </View>
                <View style={styles.optInContainer}>
                    <View style={styles.iconCircle}>
                        <Lock size={40} color={colors.primary} />
                    </View>
                    <Text style={styles.optInTitle}>Leaderboard Restricted</Text>
                    <Text style={styles.optInDescription}>
                        To view the OJT hours of others, you must also share your own progress. This creates a fair environment for everyone.
                    </Text>
                    <TouchableOpacity style={styles.optInButton} onPress={handleEnableSharing}>
                        <Share2 size={20} color={colors.textInverse} style={{ marginRight: spacing.sm }} />
                        <Text style={styles.optInButtonText}>Broadcast My Hours</Text>
                    </TouchableOpacity>
                    <Text style={styles.optInFooter}>
                        You can disable this anytime in Settings.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Trophy size={24} color={colors.primary} />
                <Text style={styles.title}>OJT Leaderboards</Text>
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {(['all', 'completed', 'ongoing'] as const).map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[
                            styles.filterTab,
                            filter === f && styles.filterTabActive
                        ]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[
                            styles.filterText,
                            filter === f && styles.filterTextActive
                        ]}>
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <FlatList
                data={leaderboardData.filter(item => {
                    const isCompleted = item.completed_hours >= item.total_hours; // Or percentage >= 100
                    if (filter === 'completed') return isCompleted;
                    if (filter === 'ongoing') return !isCompleted;
                    return true;
                })}
                renderItem={renderItem}
                keyExtractor={(item) => item.profile_key}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No interns found.</Text>
                        <Text style={styles.emptySubtext}>
                            {filter === 'all' 
                                ? "Sync your profile to see it here!" 
                                : `No ${filter} internships found.`}
                        </Text>
                    </View>
                }
            />
            <OfflineStatusIndicator />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.lg,
        paddingTop: spacing.xl,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: typography.xl,
        fontWeight: typography.bold,
        color: colors.textPrimary,
        marginLeft: spacing.sm,
    },
    listContent: {
        padding: spacing.md,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
        ...shadows.sm,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    userName: {
        fontSize: typography.lg,
        fontWeight: typography.semibold,
        color: colors.textPrimary,
    },
    userProfileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        marginRight: spacing.sm,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarEmoji: {
        fontSize: 18,
    },
    placeholderAvatar: {
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    lastUpdated: {
        fontSize: typography.xs,
        color: colors.textSecondary,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    progressBarContainer: {
        flex: 1,
        height: 8,
        backgroundColor: colors.border,
        borderRadius: 4,
        marginRight: spacing.sm,
        overflow: 'hidden',
    },
    progressBar: {
        height: '100%',
        backgroundColor: colors.primary,
    },
    progressPercent: {
        fontSize: typography.sm,
        fontWeight: typography.bold,
        color: colors.primary,
        width: 40,
        textAlign: 'right',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statText: {
        fontSize: typography.sm,
        color: colors.textSecondary,
        marginLeft: spacing.xs,
    },
    remainingText: {
        fontSize: typography.sm,
        fontWeight: typography.medium,
        color: colors.textPrimary,
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    loadingText: {
        marginTop: spacing.sm,
        fontSize: typography.base,
        color: colors.textSecondary,
    },
    emptyContainer: {
        padding: spacing.xl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: typography.lg,
        color: colors.textSecondary,
        fontWeight: typography.semibold,
    },
    emptySubtext: {
        fontSize: typography.sm,
        color: colors.textSecondary,
        marginTop: spacing.xs,
    },
    optInContainer: {
        flex: 1,
        padding: spacing.xl,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.background,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: colors.primaryLight + '20',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    optInTitle: {
        fontSize: typography.xxl,
        fontWeight: typography.bold,
        color: colors.textPrimary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    optInDescription: {
        fontSize: typography.base,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xxl,
    },
    optInButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    optInButtonText: {
        color: colors.textInverse,
        fontSize: typography.base,
        fontWeight: typography.semibold,
    },
    optInFooter: {
        fontSize: typography.xs,
        color: colors.textTertiary,
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.md,
        gap: spacing.sm,
    },
    filterTab: {
        paddingVertical: spacing.xs,
        paddingHorizontal: spacing.md,
        borderRadius: 999, // Pill shape
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    filterTabActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterText: {
        fontSize: typography.sm,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    filterTextActive: {
        color: colors.textInverse,
        fontWeight: '600',
    },
});
