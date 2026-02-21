
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const OFFLINE_QUEUE_KEY = 'ojtally_offline_queue';

type ActionType = 'DELETE_PROFILE';

interface OfflineAction {
    id: string;
    type: ActionType;
    payload: any;
    timestamp: number;
    attempts: number;
}

/**
 * Queues an action to be performed when online.
 * @param type - The type of action (e.g., 'DELETE_PROFILE')
 * @param payload - The data required for the action (e.g., { profileKey: 'uuid' })
 */
export const queueOfflineAction = async (type: ActionType, payload: any) => {
    try {
        const queueItem: OfflineAction = {
            id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            payload,
            timestamp: Date.now(),
            attempts: 0,
        };

        const currentQueueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        const currentQueue: OfflineAction[] = currentQueueStr ? JSON.parse(currentQueueStr) : [];
        
        currentQueue.push(queueItem);
        
        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(currentQueue));
        console.log(`[OfflineQueue] Queued action: ${type}, Queue length: ${currentQueue.length}`);
    } catch (error) {
        console.error('[OfflineQueue] Failed to queue action:', error);
    }
};

let isProcessing = false;

/**
 * Processes the offline queue.
 */
export const processOfflineQueue = async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
        const currentQueueStr = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
        if (!currentQueueStr) return;

        let queue: OfflineAction[] = JSON.parse(currentQueueStr);
        console.log(`[OfflineQueue] Current queue content:`, JSON.stringify(queue));
        if (queue.length === 0) return;

        console.log(`[OfflineQueue] Processing ${queue.length} items...`);
        const remainingQueue: OfflineAction[] = [];

        for (const item of queue) {
            let success = false;
            try {
                if (item.type === 'DELETE_PROFILE') {
                    const { profileKey } = item.payload;
                    const { error } = await supabase
                        .from('user_progress')
                        .delete()
                        .eq('profile_key', profileKey);

                    if (!error) {
                        success = true;
                        console.log(`[OfflineQueue] Successfully processed ${item.type}`);
                    } else {
                        throw error;
                    }
                }
            } catch (error) {
                console.error(`[OfflineQueue] Failed to process ${item.type}:`, error);
            }

            if (!success) {
                item.attempts += 1;
                if (item.attempts < 5) { // Retry up to 5 times
                    remainingQueue.push(item);
                }
            }
        }

        await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(remainingQueue));

    } catch (error) {
        console.error('[OfflineQueue] Error processing queue:', error);
    } finally {
        isProcessing = false;
    }
};
