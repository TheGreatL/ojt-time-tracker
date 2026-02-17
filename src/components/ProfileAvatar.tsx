// Reusable Profile Avatar Component

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Pencil } from 'lucide-react-native';
import { colors, spacing, typography, borderRadius, shadows } from '../styles/theme';

interface ProfileAvatarProps {
    name: string;
    avatar: string;
    onPress?: () => void;
    onLongPress?: () => void;
    onEditPress?: () => void;
    size?: 'small' | 'medium' | 'large';
    hideName?: boolean;
}

const AVATAR_SIZES = {
    small: 60,
    medium: 80,
    large: 100,
};

export const ProfileAvatar: React.FC<ProfileAvatarProps> = ({
    name,
    avatar,
    onPress,
    onLongPress,
    onEditPress,
    size = 'medium',
    hideName = false,
}) => {
    const avatarSize = AVATAR_SIZES[size];
    const isUri = avatar.startsWith('http') || avatar.startsWith('file') || avatar.startsWith('content') || avatar.startsWith('data:');

    return (
        <View style={styles.container}>
            <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                activeOpacity={0.7}
            >
                <View style={[styles.avatarContainer, { width: avatarSize, height: avatarSize }]}>
                    {isUri ? (
                        <Image
                            source={{ uri: avatar }}
                            style={{ width: avatarSize, height: avatarSize }}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={[styles.avatarText, { fontSize: avatarSize * 0.6 }]}>
                            {avatar}
                        </Text>
                    )}
                </View>
                {onEditPress && (
                    <TouchableOpacity
                        style={[styles.editButton, { top: -2, right: -2 }]}
                        onPress={onEditPress}
                        activeOpacity={0.8}
                    >
                        <Pencil size={12} color={colors.textInverse} />
                    </TouchableOpacity>
                )}
            </TouchableOpacity>
            {!hideName && (
                <Text style={styles.name} numberOfLines={1}>
                    {name}
                </Text>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        margin: spacing.sm,
    },
    avatarContainer: {
        borderRadius: borderRadius.full,
        overflow: 'hidden',
        backgroundColor: colors.surfaceDark,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
    },
    editButton: {
        position: 'absolute',
        backgroundColor: colors.primary,
        borderRadius: borderRadius.full,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.surface,
        ...shadows.sm,
    },
    avatarText: {
        textAlign: 'center',
    },
    name: {
        marginTop: spacing.sm,
        fontSize: typography.sm,
        fontWeight: typography.medium,
        color: colors.textPrimary,
        maxWidth: 100,
        textAlign: 'center',
    },
});
