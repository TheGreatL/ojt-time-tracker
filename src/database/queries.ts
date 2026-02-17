import { Profile, Settings, AttendanceLog, Note } from './schema';
import { getDatabase } from './database';

export const getAllProfiles = async (): Promise<Profile[]> => {
    const db = getDatabase();
    const result = await db.getAllAsync<any>('SELECT * FROM profiles ORDER BY created_at ASC');
    return result.map(p => ({
        ...p,
        is_graduating: Boolean(p.is_graduating)
    }));
};

export const getProfileById = async (id: number): Promise<Profile | null> => {
    const db = getDatabase();
    const result = await db.getFirstAsync<Profile>('SELECT * FROM profiles WHERE id = ?', [id]);
    if (result) {
        return {
            ...result,
            is_graduating: Boolean(result.is_graduating)
        };
    }
    return result;
};

export const getSettingsByProfileId = async (profileId: number): Promise<Settings | null> => {
    const db = getDatabase();
    const result = await db.getFirstAsync<Settings>('SELECT * FROM settings WHERE profile_id = ?', [profileId]);
    if (!result) return null;
    return {
        ...result,
        unlimited_weekly: Boolean(result.unlimited_weekly),
        is_sharing_enabled: Boolean(result.is_sharing_enabled),
        is_avatar_visible: Boolean(result.is_avatar_visible),
        has_seen_tutorial: Boolean(result.has_seen_tutorial),
    };
};

export const getTotalHoursWorked = async (profileId: number): Promise<number> => {
    const db = getDatabase();
    const result = await db.getFirstAsync<{ total: number }>(
        'SELECT SUM(hours_worked) as total FROM attendance_logs WHERE profile_id = ? AND status = "worked"',
        [profileId]
    );
    return result?.total || 0;
};

export const getAttendanceLogsByProfileId = async (profileId: number): Promise<AttendanceLog[]> => {
    const db = getDatabase();
    const result = await db.getAllAsync<AttendanceLog>(
        'SELECT * FROM attendance_logs WHERE profile_id = ? ORDER BY date ASC',
        [profileId]
    );
    return result;
};

export const getAttendanceLogByDate = async (
    profileId: number,
    date: string
): Promise<AttendanceLog | null> => {
    const db = getDatabase();
    const result = await db.getFirstAsync<AttendanceLog>(
        'SELECT * FROM attendance_logs WHERE profile_id = ? AND date = ?',
        [profileId, date]
    );
    return result || null;
};

export const getAttendanceLogsByDateRange = async (
    profileId: number,
    startDate: string,
    endDate: string
): Promise<AttendanceLog[]> => {
    const db = getDatabase();
    return db.getAllAsync<AttendanceLog>(
        'SELECT * FROM attendance_logs WHERE profile_id = ? AND date >= ? AND date <= ? ORDER BY date ASC',
        [profileId, startDate, endDate]
    );
};

export const getNotesByProfileId = async (profileId: number): Promise<Note[]> => {
    const db = getDatabase();
    return db.getAllAsync<Note>(
        'SELECT * FROM notes WHERE profile_id = ? ORDER BY CASE WHEN date IS NULL THEN 1 ELSE 0 END, date DESC, created_at DESC',
        [profileId]
    );
};

export const getNoteByDate = async (profileId: number, date: string): Promise<Note | null> => {
    const db = getDatabase();
    return db.getFirstAsync<Note>('SELECT * FROM notes WHERE profile_id = ? AND date = ?', [profileId, date]);
};
