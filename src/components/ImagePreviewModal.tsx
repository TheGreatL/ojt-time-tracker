import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Image,
    TouchableOpacity,
    Dimensions,
    TouchableWithoutFeedback,
} from 'react-native';
import { X } from 'lucide-react-native';
import { colors, spacing, borderRadius, typography, shadows } from '../styles/theme';

interface ImagePreviewModalProps {
    visible: boolean;
    imageUrl: string | null;
    onClose: () => void;
    title?: string;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
    visible,
    imageUrl,
    onClose,
    title,
}) => {
    if (!imageUrl) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.container}>
                            <View style={styles.header}>
                                <Text style={styles.title} numberOfLines={1}>
                                    {title || 'Image Preview'}
                                </Text>
                                <TouchableOpacity
                                    onPress={onClose}
                                    style={styles.closeButton}
                                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                >
                                    <X size={24} color={colors.textPrimary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.imageContainer}>
                                <Image
                                    source={{ uri: imageUrl }}
                                    style={styles.image}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: SCREEN_WIDTH * 0.9,
        maxHeight: SCREEN_HEIGHT * 0.8,
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        overflow: 'hidden',
        ...shadows.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    title: {
        fontSize: typography.base,
        fontWeight: typography.semibold,
        color: colors.textPrimary,
        flex: 1,
        marginRight: spacing.md,
    },
    closeButton: {
        padding: 4,
    },
    imageContainer: {
        width: '100%',
        aspectRatio: 1, // Square initial look, but resizeMode contain ensures full image shows
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: '100%',
    },
});
