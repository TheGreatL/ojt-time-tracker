import { Profile, Settings, AttendanceLog, Note } from './schema';
import { getDatabase } from './database';
import { syncProfileToCloud, deleteProfileFromCloud } from '../utils/cloudSync';
import { getProfileById } from './queries';
import { generateUUID } from '../utils/uuid';

// ==================== PROFILE OPERATIONS ====================

export const createProfile = async (
    name: string,
    avatar: string,
    isGraduating: boolean = false,
    initialSettings?: {
        totalHours?: number;
        maxHoursPerDay?: number;
        maxHoursPerWeek?: number;
        weeklySchedule?: string;
        unlimitedWeekly?: boolean;
    }
): Promise<number> => {
    try {
        const db = getDatabase();
        const uuid = generateUUID();
        const result = await db.runAsync(
            'INSERT INTO profiles (name, avatar, is_graduating, uuid) VALUES (?, ?, ?, ?)',
            [name, avatar, isGraduating ? 1 : 0, uuid]
        );

        // Create default settings for this profile
        const profileId = result.lastInsertRowId;
        await createDefaultSettings(profileId, initialSettings);

        // Initial sync to cloud
        await syncProfileToCloud(profileId);

        return profileId;
    } catch (error) {
        console.error('Error creating profile:', error);
        throw error;
    }
};

export const deleteProfile = async (id: number): Promise<void> => {
    try {
        const db = getDatabase();

        // Get profile UUID before deletion for cloud sync
        const profile = await getProfileById(id);
        if (profile?.uuid) {
            await deleteProfileFromCloud(profile.uuid);
        }

        await db.runAsync('DELETE FROM profiles WHERE id = ?', [id]);
        // CASCADE will automatically delete related settings and attendance logs
    } catch (error) {
        console.error('Error deleting profile:', error);
        throw error;
    }
};

export const updateProfile = async (id: number, name: string, avatar: string, isGraduating?: boolean): Promise<void> => {
    try {
        const db = getDatabase();
        if (isGraduating !== undefined) {
            await db.runAsync('UPDATE profiles SET name = ?, avatar = ?, is_graduating = ? WHERE id = ?', [name, avatar, isGraduating ? 1 : 0, id]);
        } else {
            await db.runAsync('UPDATE profiles SET name = ?, avatar = ? WHERE id = ?', [name, avatar, id]);
        }

        // Sync change to cloud
        await syncProfileToCloud(id);
    } catch (error) {
        console.error('Error updating profile:', error);
        throw error;
    }
};

// ==================== SETTINGS OPERATIONS ====================

const createDefaultSettings = async (
    profileId: number,
    initial?: {
        totalHours?: number;
        maxHoursPerDay?: number;
        maxHoursPerWeek?: number;
        weeklySchedule?: string;
        unlimitedWeekly?: boolean;
    }
): Promise<void> => {
    const db = getDatabase();

    const totalHours = initial?.totalHours ?? 160;
    const dailyCap = initial?.maxHoursPerDay ?? 8;
    const weeklyCap = initial?.maxHoursPerWeek ?? (initial?.unlimitedWeekly ? null : 40);
    const schedule = initial?.weeklySchedule ?? JSON.stringify([1, 2, 3, 4, 5]); // Mon-Fri
    const unlimited = initial?.unlimitedWeekly ? 1 : 0;

    await db.runAsync(
        `INSERT INTO settings (profile_id, total_hours_required, max_hours_per_day, max_hours_per_week, weekly_schedule, unlimited_weekly, is_sharing_enabled, is_avatar_visible, has_seen_tutorial)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [profileId, totalHours, dailyCap, weeklyCap, schedule, unlimited, 0, 0, 0]
    );
};

export const updateSettings = async (
    profileId: number,
    settings: Partial<Omit<Settings, 'id' | 'profile_id'>>
): Promise<void> => {
    const db = getDatabase();
    const updates: string[] = [];
    const values: any[] = [];

    if (settings.total_hours_required !== undefined) {
        updates.push('total_hours_required = ?');
        values.push(settings.total_hours_required);
    }
    if (settings.max_hours_per_day !== undefined) {
        updates.push('max_hours_per_day = ?');
        values.push(settings.max_hours_per_day);
    }
    if (settings.max_hours_per_week !== undefined) {
        updates.push('max_hours_per_week = ?');
        values.push(settings.max_hours_per_week);
    }
    if (settings.weekly_schedule !== undefined) {
        updates.push('weekly_schedule = ?');
        values.push(settings.weekly_schedule);
    }
    if (settings.unlimited_weekly !== undefined) {
        updates.push('unlimited_weekly = ?');
        values.push(settings.unlimited_weekly ? 1 : 0);
    }
    if (settings.is_sharing_enabled !== undefined) {
        updates.push('is_sharing_enabled = ?');
        values.push(settings.is_sharing_enabled ? 1 : 0);
    }
    if (settings.is_avatar_visible !== undefined) {
        updates.push('is_avatar_visible = ?');
        values.push(settings.is_avatar_visible ? 1 : 0);
    }
    if (settings.has_seen_tutorial !== undefined) {
        updates.push('has_seen_tutorial = ?');
        values.push(settings.has_seen_tutorial ? 1 : 0);
    }

    if (updates.length > 0) {
        values.push(profileId);
        await db.runAsync(
            `UPDATE settings SET ${updates.join(', ')} WHERE profile_id = ?`,
            values
        );

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
    const db = getDatabase();
    await db.runAsync(
        `INSERT INTO attendance_logs (profile_id, date, hours_worked, status)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(profile_id, date) DO UPDATE SET
       hours_worked = excluded.hours_worked,
       status = excluded.status`,
        [profileId, date, hoursWorked, status]
    );

    // Sync change to cloud
    await syncProfileToCloud(profileId);
};

export const deleteAttendanceLog = async (profileId: number, date: string): Promise<void> => {
    const db = getDatabase();
    await db.runAsync(
        'DELETE FROM attendance_logs WHERE profile_id = ? AND date = ?',
        [profileId, date]
    );

    // Sync change to cloud
    await syncProfileToCloud(profileId);
};

// ==================== NOTE OPERATIONS ====================

export const createNote = async (profileId: number, content: string, date: string | null = null, title: string | null = null): Promise<number> => {
    const db = getDatabase();
    const result = await db.runAsync(
        'INSERT INTO notes (profile_id, date, content, title) VALUES (?, ?, ?, ?)',
        [profileId, date, content, title]
    );
    return result.lastInsertRowId;
};

export const updateNote = async (id: number, content: string, title: string | null = null): Promise<void> => {
    const db = getDatabase();
    await db.runAsync('UPDATE notes SET content = ?, title = ? WHERE id = ?', [content, title, id]);
};





export const upsertNote = async (profileId: number, date: string, content: string, title: string | null = null): Promise<void> => {
    const db = getDatabase();
    await db.runAsync(
        'INSERT INTO notes (profile_id, date, content, title) VALUES (?, ?, ?, ?) ON CONFLICT(profile_id, date) DO UPDATE SET content = excluded.content, title = excluded.title',
        [profileId, date, content, title]
    );
};

export const deleteNote = async (id: number): Promise<void> => {
    const db = getDatabase();
    await db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
};

export const deleteNoteByDate = async (profileId: number, date: string): Promise<void> => {
    const db = getDatabase();
    await db.runAsync('DELETE FROM notes WHERE profile_id = ? AND date = ?', [profileId, date]);
};
