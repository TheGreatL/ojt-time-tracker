// OJTally Database Schema definitions

export interface Profile {
  id: number;
  name: string;
  avatar: string;
  is_graduating: boolean;
  uuid: string;
  created_at: string;
}

export interface Settings {
  id: number;
  profile_id: number;
  total_hours_required: number;
  max_hours_per_day: number | null; // null = unlimited
  max_hours_per_week: number | null; // null = unlimited
  weekly_schedule: string; // JSON array of day indices [0-6] where 0=Sunday
  unlimited_weekly: boolean;
  is_sharing_enabled: boolean;
  is_avatar_visible: boolean;
  has_seen_tutorial: boolean;
}

export interface AttendanceLog {
  id: number;
  profile_id: number;
  date: string; // ISO date string YYYY-MM-DD
  hours_worked: number;
  status: 'worked' | 'excluded'; // worked = logged hours, excluded = cannot attend
  created_at: string;
}

export interface Note {
  id: number;
  profile_id: number;
  date: string | null; // ISO date string YYYY-MM-DD or null for general notes
  title: string | null; // Optional title for the note
  content: string;
  created_at: string;
}

export const CREATE_PROFILES_TABLE = `
  CREATE TABLE IF NOT EXISTS profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    avatar TEXT NOT NULL,
    is_graduating INTEGER NOT NULL DEFAULT 0,
    uuid TEXT NOT NULL UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`;

export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    total_hours_required REAL NOT NULL DEFAULT 0,
    max_hours_per_day REAL,
    max_hours_per_week REAL,
    weekly_schedule TEXT NOT NULL DEFAULT '[]',
    unlimited_weekly INTEGER NOT NULL DEFAULT 0,
    is_sharing_enabled INTEGER NOT NULL DEFAULT 0,
    is_avatar_visible INTEGER NOT NULL DEFAULT 0,
    has_seen_tutorial INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE(profile_id)
  );
`;

export const CREATE_ATTENDANCE_LOGS_TABLE = `
  CREATE TABLE IF NOT EXISTS attendance_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    hours_worked REAL NOT NULL DEFAULT 0,
    status TEXT NOT NULL CHECK(status IN ('worked', 'excluded')),
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE(profile_id, date)
  );
`;

export const CREATE_NOTES_TABLE = `
  CREATE TABLE IF NOT EXISTS notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    profile_id INTEGER NOT NULL,
    date TEXT, -- Nullable for general notes
    title TEXT, -- Optional title
    content TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
    UNIQUE(profile_id, date)
  );
`;
