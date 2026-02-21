import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';
import * as FileSystem from 'expo-file-system';
import { updateProfile } from '../database/operations';
import { getProfileById } from '../database/queries';
import { syncProfileToCloud } from './cloudSync';

const QUEUE_KEY = 'ojtally_avatar_upload_queue';

interface QueueItem {
    id: string; // Unique ID for the queue item
    profileId: number;
    localUri: string;
    mimeType: string;
    timestamp: number;
    attempts: number;
}

/**
 * Adds an avatar upload to the offline queue.
 */
export const queueAvatarUpload = async (
    profileId: number,
    localUri: string,
    mimeType: string
): Promise<void> => {
    try {
        const queueItem: QueueItem = {
            id: `job_${Date.now()}_${profileId}`,
            profileId,
            localUri,
            mimeType,
            timestamp: Date.now(),
            attempts: 0,
        };

        const currentQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
        const currentQueue: QueueItem[] = currentQueueStr ? JSON.parse(currentQueueStr) : [];
        
        // Remove any existing jobs for this profile to prevent duplicates/outdated uploads
        const filteredQueue = currentQueue.filter(item => item.profileId !== profileId);
        
        filteredQueue.push(queueItem);
        
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filteredQueue));
        console.log(`[UploadQueue] Queued avatar for profile ${profileId}`);
    } catch (error) {
        console.error('[UploadQueue] Failed to queue upload:', error);
    }
};

let isProcessing = false;

/**
 * Processes the upload queue. Should be called when online.
 */
export const processAvatarQueue = async (): Promise<void> => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const currentQueueStr = await AsyncStorage.getItem(QUEUE_KEY);
        if (!currentQueueStr) return;

        let queue: QueueItem[] = JSON.parse(currentQueueStr);
        if (queue.length === 0) return;

        console.log(`[UploadQueue] Processing ${queue.length} items...`);
        const remainingQueue: QueueItem[] = [];

        for (const item of queue) {
            try {
                // 1. Read file as Base64 (replaces deprecated getInfoAsync check)
                let base64: string;
                try {
                    base64 = await FileSystem.readAsStringAsync(item.localUri, {
                        encoding: 'base64',
                    });
                } catch (readError) {
                    console.warn(`[UploadQueue] Could not read file: ${item.localUri}, skipping.`, readError);
                    continue; // Skip invalid or missing items
                }

                // 2. Construct File Path
                const fileExt = item.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
                const fileName = `avatar_${Date.now()}.${fileExt}`;
                const filePath = `${item.profileId}/${fileName}`;

                // 3. Upload to Supabase
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, decode(base64), {
                        contentType: item.mimeType,
                        upsert: true,
                    });

                if (uploadError) throw uploadError;

                // 4. Get Public URL
                const { data } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(filePath);

                const publicUrl = data.publicUrl;

                // 5. Update SQLite with new remote URL
                const profile = await getProfileById(item.profileId);
                if (profile) {
                    await updateProfile(item.profileId, profile.name, publicUrl);
                    console.log(`[UploadQueue] Success for profile ${item.profileId}`);
                }

            } catch (error) {
                console.error(`[UploadQueue] Failed job for profile ${item.profileId}:`, error);
                
                // Retry logic: Keep in queue if < 3 attempts
                item.attempts += 1;
                if (item.attempts < 3) {
                    remainingQueue.push(item);
                }
            }
        }

        // Update queue in storage
        await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));

    } catch (error) {
        console.error('[UploadQueue] Error processing queue:', error);
    } finally {
        isProcessing = false;
    }
};

/**
 * Gets the number of pending uploads.
 */
export const getQueueStatus = async (): Promise<number> => {
    try {
        const str = await AsyncStorage.getItem(QUEUE_KEY);
        return str ? JSON.parse(str).length : 0;
    } catch {
        return 0;
    }
};
