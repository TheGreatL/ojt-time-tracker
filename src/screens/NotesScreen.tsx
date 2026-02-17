// Notes Screen - List of all recorded notes

import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    SafeAreaView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    TextInput,
    Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { FileText, Trash2, Calendar, Plus, Edit2, X, Check } from 'lucide-react-native';
import { useProfile } from '../context/ProfileContext';
import { deleteNote, createNote, updateNote } from '../database/operations';
import { getNotesByProfileId } from '../database/queries';
import { Note } from '../database/schema';
import { colors, spacing, borderRadius, shadows } from '../styles/theme';
import { globalStyles } from '../styles/globalStyles';
import { formatDate } from '../utils/predictionEngine';

export const NotesScreen: React.FC = () => {
    const { activeProfile } = useProfile();
    const [notes, setNotes] = useState<Note[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [noteContent, setNoteContent] = useState('');
    const [noteTitle, setNoteTitle] = useState('');

    const loadNotes = async () => {
        if (!activeProfile) return;
        const profileNotes = await getNotesByProfileId(activeProfile.id);
        setNotes(profileNotes);
    };

    useFocusEffect(
        useCallback(() => {
            loadNotes();
        }, [activeProfile])
    );

    const onRefresh = async () => {
        setRefreshing(true);
        await loadNotes();
        setRefreshing(false);
    };

    const handleAddNote = () => {
        setEditingNote(null);
        setNoteContent('');
        setNoteTitle('');
        setIsModalVisible(true);
    };

    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setNoteContent(note.content);
        setNoteTitle(note.title || '');
        setIsModalVisible(true);
    };

    const handleSaveNote = async () => {
        if (!activeProfile || !noteContent.trim()) return;

        if (editingNote) {
            await updateNote(editingNote.id, noteContent.trim(), noteTitle.trim() || null);
        } else {
            await createNote(activeProfile.id, noteContent.trim(), null, noteTitle.trim() || null);
        }

        setIsModalVisible(false);
        loadNotes();
    };

    const handleDeleteNote = (note: Note) => {
        Alert.alert(
            'Delete Note',
            'Are you sure you want to delete this note?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteNote(note.id);
                        loadNotes();
                    },
                },
            ]
        );
    };

    const formatDateTime = (dateTimeStr: string) => {
        try {
            const date = new Date(dateTimeStr.replace(' ', 'T')); // Handle SQLite format
            return date.toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateTimeStr;
        }
    };

    const renderItem = ({ item }: { item: Note }) => (
        <View style={[globalStyles.card, styles.noteCard]}>
            <View style={styles.noteHeader}>
                <View style={styles.dateContainer}>
                    {item.date ? (
                        <>
                            <Calendar size={14} color={colors.primary} />
                            <Text style={styles.noteDate}>
                                {formatDate(new Date(item.date))}
                            </Text>
                        </>
                    ) : (
                        <>
                            <FileText size={14} color={colors.textTertiary} />
                            <View>
                                <Text style={[styles.noteDate, { color: colors.textTertiary }]}>
                                    General Note
                                </Text>
                                <Text style={styles.createdAtDate}>
                                    Created: {formatDateTime(item.created_at)}
                                </Text>
                            </View>
                        </>
                    )}
                </View>
                <View style={styles.actionButtons}>
                    <TouchableOpacity onPress={() => handleEditNote(item)} style={styles.actionButton}>
                        <Edit2 size={18} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteNote(item)} style={styles.actionButton}>
                        <Trash2 size={18} color={colors.danger} />
                    </TouchableOpacity>
                </View>
            </View>
            {item.title ? (
                <Text style={styles.noteCardTitle}>{item.title}</Text>
            ) : null}
            <Text style={styles.noteContent}>{item.content}</Text>
        </View>
    );

    return (
        <SafeAreaView style={globalStyles.container}>
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={globalStyles.heading1}>My Notes</Text>
                    <TouchableOpacity onPress={handleAddNote} style={styles.addIcon}>
                        <Plus size={24} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={notes}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <FileText size={48} color={colors.textTertiary} />
                            <Text style={styles.emptyText}>No notes yet</Text>
                            <Text style={globalStyles.caption}>
                                Tap the + button to add a general note
                            </Text>
                        </View>
                    }
                />

                {/* FAB for adding notes */}
                <TouchableOpacity style={styles.fab} onPress={handleAddNote}>
                    <Plus size={32} color={colors.textInverse} />
                </TouchableOpacity>

                {/* Add/Edit Note Modal */}
                {isModalVisible && (
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <View style={styles.modalHeader}>
                                <Text style={styles.modalTitle}>
                                    {editingNote ? 'Edit Note' : 'Add Note'}
                                </Text>
                                <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                                    <X size={24} color={colors.textSecondary} />
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={globalStyles.input}
                                placeholder="Title (Optional)"
                                value={noteTitle}
                                onChangeText={setNoteTitle}
                                placeholderTextColor={colors.textTertiary}
                            />

                            <TextInput
                                style={styles.noteInput}
                                multiline
                                placeholder="Type your note here..."
                                value={noteContent}
                                onChangeText={setNoteContent}
                                placeholderTextColor={colors.textTertiary}
                            />

                            <TouchableOpacity
                                style={[globalStyles.button, styles.saveButton, !noteContent.trim() && styles.disabledButton]}
                                onPress={handleSaveNote}
                                disabled={!noteContent.trim()}
                            >
                                <Check size={20} color={colors.textInverse} style={{ marginRight: spacing.sm }} />
                                <Text style={globalStyles.buttonText}>Save Note</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    addIcon: {
        padding: spacing.xs,
    },
    listContent: {
        paddingBottom: spacing.xxl + 80, // Padding for FAB
    },
    noteCard: {
        marginBottom: spacing.md,
    },
    noteHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    actionButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    actionButton: {
        padding: 4,
    },
    noteDate: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
    },
    createdAtDate: {
        fontSize: 10,
        color: colors.textTertiary,
    },
    noteCardTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textPrimary,
        marginTop: spacing.xs,
        marginBottom: 2,
    },
    noteContent: {
        fontSize: 15,
        color: colors.textPrimary,
        lineHeight: 22,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xxl * 2,
        gap: spacing.sm,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    fab: {
        position: 'absolute',
        bottom: spacing.xxl,
        right: spacing.lg,
        backgroundColor: colors.primary,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.md,
        elevation: 5,
    },
    modalOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        padding: spacing.lg,
        zIndex: 1000,
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.lg,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textPrimary,
    },
    noteInput: {
        backgroundColor: colors.background,
        borderRadius: borderRadius.md,
        padding: spacing.md,
        minHeight: 150,
        fontSize: 16,
        color: colors.textPrimary,
        marginBottom: spacing.lg,
        textAlignVertical: 'top',
    },
    saveButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    },
});
