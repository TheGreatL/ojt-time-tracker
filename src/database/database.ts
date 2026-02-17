// SQLite database initialization and management

import * as SQLite from 'expo-sqlite';
import {
    CREATE_PROFILES_TABLE,
    CREATE_SETTINGS_TABLE,
    CREATE_ATTENDANCE_LOGS_TABLE,
    CREATE_NOTES_TABLE,
} from './schema';

let db: SQLite.SQLiteDatabase | null = null;

/**
 * Initialize the SQLite database and create tables
 */
export const initDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (db) {
        return db;
    }

    try {
        db = await SQLite.openDatabaseAsync('interntrack.db');

        // Enable foreign keys
        await db.execAsync('PRAGMA foreign_keys = ON;');

        // Create tables
        await db.execAsync(CREATE_PROFILES_TABLE);
        await db.execAsync(CREATE_SETTINGS_TABLE);
        await db.execAsync(CREATE_ATTENDANCE_LOGS_TABLE);
        await db.execAsync(CREATE_NOTES_TABLE);

        // Migration: Check if notes table date column is NOT NULL
        const tableInfo = await db.getAllAsync<{ name: string, notnull: number }>('PRAGMA table_info(notes)');
        const dateColumn = tableInfo.find(col => col.name === 'date');
        if (dateColumn && dateColumn.notnull === 1) {
            console.log('Migrating notes table: removing NOT NULL from date column');
            await db.execAsync(`
                PRAGMA foreign_keys = OFF;
                BEGIN TRANSACTION;
                CREATE TABLE notes_new (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    profile_id INTEGER NOT NULL,
                    date TEXT,
                    content TEXT NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE,
                    UNIQUE(profile_id, date)
                );
                INSERT INTO notes_new (id, profile_id, date, content, created_at)
                SELECT id, profile_id, date, content, created_at FROM notes;
                DROP TABLE notes;
                ALTER TABLE notes_new RENAME TO notes;
                COMMIT;
                PRAGMA foreign_keys = ON;
            `);
        }

        // Migration: Check if notes table has title column
        const notesTableInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(notes)`);
        if (!notesTableInfo.some(col => col.name === 'title')) {
            console.log('Migrating notes table: adding title column');
            await db.execAsync('ALTER TABLE notes ADD COLUMN title TEXT;');
        }

        // Migration: Check if profiles table has is_graduating column
        const profilesTableInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(profiles)`);
        if (!profilesTableInfo.some(col => col.name === 'is_graduating')) {
            console.log('Migrating profiles table: adding is_graduating column');
            await db.execAsync('ALTER TABLE profiles ADD COLUMN is_graduating INTEGER NOT NULL DEFAULT 0;');
        }
        if (!profilesTableInfo.some(col => col.name === 'uuid')) {
            console.log('Migrating profiles table: adding uuid column');
            // Adding as nullable initially to avoid issues with existing data, 
            // though we'll populate it logic-wise.
            await db.execAsync('ALTER TABLE profiles ADD COLUMN uuid TEXT;');

            // Generate UUIDs for existing profiles that don't have one
            const existingProfiles = await db.getAllAsync<{ id: number }>('SELECT id FROM profiles WHERE uuid IS NULL');
            for (const profile of existingProfiles) {
                // We'll use a simple placeholder or try to use generateUUID if possible, 
                // but since this is a migration and we don't want to import too much here, 
                // a random string or placeholder is fine for existing data.
                const tempUuid = Math.random().toString(36).substring(2, 15);
                await db.runAsync('UPDATE profiles SET uuid = ? WHERE id = ?', [tempUuid, profile.id]);
            }
        }

        // Migration: Check if settings table has is_sharing_enabled column
        const settingsTableInfo = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(settings)`);
        if (!settingsTableInfo.some(col => col.name === 'is_sharing_enabled')) {
            console.log('Migrating settings table: adding is_sharing_enabled column');
            await db.execAsync('ALTER TABLE settings ADD COLUMN is_sharing_enabled INTEGER NOT NULL DEFAULT 0;');
        }
        if (!settingsTableInfo.some(col => col.name === 'is_avatar_visible')) {
            await db.execAsync('ALTER TABLE settings ADD COLUMN is_avatar_visible INTEGER NOT NULL DEFAULT 0;');
        }
        if (!settingsTableInfo.some(col => col.name === 'has_seen_tutorial')) {
            console.log('Migrating settings table: adding has_seen_tutorial column');
            await db.execAsync('ALTER TABLE settings ADD COLUMN has_seen_tutorial INTEGER NOT NULL DEFAULT 0;');
        }

        // Migration: Ensure settings table has UNIQUE(profile_id)
        const settingsInfo = await db.getAllAsync<{ name: string, pk: number }>('PRAGMA table_info(settings)');
        // PRAGMA index_list doesn't easily show unique constraints in the same way, 
        // but we can try to create a unique index if it doesn't exist.
        try {
            await db.execAsync('CREATE UNIQUE INDEX IF NOT EXISTS idx_settings_profile_id ON settings(profile_id);');
        } catch (e) {
            console.log('Unique index on settings could not be created, possibly due to duplicates or existing constraint.');
        }

        console.log('Database initialized successfully');
        return db;
    } catch (error) {
        console.error('Error initializing database:', error);
        throw error;
    }
};

/**
 * Get the database instance
 */
export const getDatabase = (): SQLite.SQLiteDatabase => {
    if (!db) {
        throw new Error('Database not initialized. Call initDatabase() first.');
    }
    return db;
};

/**
 * Close the database connection
 */
export const closeDatabase = async (): Promise<void> => {
    if (db) {
        await db.closeAsync();
        db = null;
        console.log('Database closed');
    }
};
