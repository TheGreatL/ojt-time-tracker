// Database CRUD operations for Web (In-Memory)

import { Profile, Settings, AttendanceLog, Note } from './schema';
import { syncProfileToCloud } from '../utils/cloudSync';
import { generateUUID } from '../utils/uuid';

// In-memory storage
export let profiles: Profile[] = [];
export let settings: Settings[] = [];
export let logs: AttendanceLog[] = [];
export let notes: Note[] = [];

let nextProfileId = 1;
let nextSettingsId = 1;
let nextLogId = 1;
let nextNoteId = 1;

// ==================== PROFILE OPERATIONS ====================

export const createProfile = async (name: string, avatar: string, isGraduating: boolean = false): Promise<number> => {
    try {
        const newProfile: Profile = {
            id: nextProfileId++,
            name,
            avatar,
            is_graduating: isGraduating,
            uuid: generateUUID(),
            created_at: new Date().toISOString(),
        };
        profiles.push(newProfile);
        await createDefaultSettings(newProfile.id);

        // Sync change to cloud
        await syncProfileToCloud(newProfile.id);

        return newProfile.id;
    } catch (error) {
        console.error('Error creating profile (web):', error);
        throw error;
    }
};

export const deleteProfile = async (id: number): Promise<void> => {
    try {
        profiles = profiles.filter((p) => p.id !== id);
        settings = settings.filter((s) => s.profile_id !== id);
        logs = logs.filter((l) => l.profile_id !== id);
    } catch (error) {
        console.error('Error deleting profile (web):', error);
        throw error;
    }
};

export const updateProfile = async (id: number, name: string, avatar: string, isGraduating?: boolean): Promise<void> => {
    try {
        const index = profiles.findIndex((p) => p.id === id);
        if (index !== -1) {
            profiles[index] = {
                ...profiles[index],
                name,
                avatar,
                is_graduating: isGraduating !== undefined ? isGraduating : profiles[index].is_graduating
            };

            // Sync change to cloud
            await syncProfileToCloud(id);
        }
    } catch (error) {
        console.error('Error updating profile (web):', error);
        throw error;
    }
};

// ==================== SETTINGS OPERATIONS ====================

const createDefaultSettings = async (profileId: number): Promise<void> => {
    const newSettings: Settings = {
        id: nextSettingsId++,
        profile_id: profileId,
        total_hours_required: 160,
        max_hours_per_day: 8,
        max_hours_per_week: 40,
        weekly_schedule: JSON.stringify([1, 2, 3, 4, 5]),
        unlimited_weekly: false,
        is_sharing_enabled: false,
        is_avatar_visible: false,
        has_seen_tutorial: false,
    };
    settings.push(newSettings);
};

export const updateSettings = async (
    profileId: number,
    newSettings: Partial<Omit<Settings, 'id' | 'profile_id'>>
): Promise<void> => {
    const index = settings.findIndex((s) => s.profile_id === profileId);
    if (index !== -1) {
        settings[index] = {
            ...settings[index],
            ...newSettings,
        };

        // Sync change to cloud
        await syncProfileToCloud(profileId);
    }
};

// ==================== ATTENDANCE LOG OPERATIONS ====================

export const upsertAttendanceLog = async (
    profileId: number,
    date: string,
    hoursWorked: number,
    status: 'worked' | 'excluded'
): Promise<void> => {
    const index = logs.findIndex((l) => l.profile_id === profileId && l.date === date);
    if (index !== -1) {
        logs[index] = { ...logs[index], hours_worked: hoursWorked, status };
    } else {
        logs.push({
            id: nextLogId++,
            profile_id: profileId,
            date,
            hours_worked: hoursWorked,
            status,
            created_at: new Date().toISOString(),
        });
    }

    // Sync change to cloud
    await syncProfileToCloud(profileId);
};

export const deleteAttendanceLog = async (profileId: number, date: string): Promise<void> => {
    logs = logs.filter((l) => !(l.profile_id === profileId && l.date === date));

    // Sync change to cloud
    await syncProfileToCloud(profileId);
};

// ==================== NOTE OPERATIONS ====================

export const createNote = async (profileId: number, content: string, date: string | null = null, title: string | null = null): Promise<number> => {
    const newNote: Note = {
        id: nextNoteId++,
        profile_id: profileId,
        date,
        title,
        content,
        created_at: new Date().toISOString(),
    };
    notes.push(newNote);
    return newNote.id;
};

export const updateNote = async (id: number, content: string, title: string | null = null): Promise<void> => {
    const index = notes.findIndex((n) => n.id === id);
    if (index !== -1) {
        notes[index] = { ...notes[index], content, title };
    }
};



export const upsertNote = async (profileId: number, date: string | null, content: string, title: string | null = null): Promise<void> => {
    const index = notes.findIndex((n) => n.profile_id === profileId && n.date === date);
    if (index !== -1) {
        notes[index] = { ...notes[index], content, title };
    } else {
        notes.push({
            id: nextNoteId++,
            profile_id: profileId,
            date,
            content,
            title,
            created_at: new Date().toISOString(),
        });
    }
};

export const deleteNote = async (id: number): Promise<void> => {
    notes = notes.filter((n) => n.id !== id);
};

export const deleteNoteByDate = async (profileId: number, date: string): Promise<void> => {
    notes = notes.filter((n) => !(n.profile_id === profileId && n.date === date));
};
