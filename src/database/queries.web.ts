import { Profile, Settings, AttendanceLog, Note } from './schema';
import { profiles, settings, logs, notes } from './operations.web';

export const getAllProfiles = async (): Promise<Profile[]> => {
    return [...profiles].sort((a, b) => a.created_at.localeCompare(b.created_at));
};

export const getProfileById = async (id: number): Promise<Profile | null> => {
    return profiles.find((p) => p.id === id) || null;
};

export const getSettingsByProfileId = async (profileId: number): Promise<Settings | null> => {
    return settings.find((s) => s.profile_id === profileId) || null;
};

export const getTotalHoursWorked = async (profileId: number): Promise<number> => {
    return logs
        .filter((l) => l.profile_id === profileId && l.status === 'worked')
        .reduce((sum, l) => sum + l.hours_worked, 0);
};

export const getAttendanceLogsByProfileId = async (profileId: number): Promise<AttendanceLog[]> => {
    return logs
        .filter((l) => l.profile_id === profileId)
        .sort((a, b) => a.date.localeCompare(b.date));
};

export const getAttendanceLogByDate = async (
    profileId: number,
    date: string
): Promise<AttendanceLog | null> => {
    return logs.find((l) => l.profile_id === profileId && l.date === date) || null;
};

export const getNotesByProfileId = async (profileId: number): Promise<Note[]> => {
    return notes
        .filter((n) => n.profile_id === profileId)
        .sort((a, b) => {
            if (a.date && b.date) return b.date.localeCompare(a.date);
            if (a.date) return -1;
            if (b.date) return 1;
            return b.created_at.localeCompare(a.created_at);
        });
};

export const getNoteByDate = async (profileId: number, date: string): Promise<Note | null> => {
    return notes.find((n) => n.profile_id === profileId && n.date === date) || null;
};
