import { supabase } from './supabase';
import { getTotalHoursWorked, getSettingsByProfileId, getProfileById } from '../database/queries';
import { queueOfflineAction } from './offlineQueue';

/**
 * Syncs the current profile's progress to Supabase
 * @param profileId - The local profile ID to sync
 */
export const syncProfileToCloud = async (profileId: number) => {
    try {
        const profile = await getProfileById(profileId);
        const settings = await getSettingsByProfileId(profileId);
        const completedHours = await getTotalHoursWorked(profileId);

        if (!profile || !settings) return;

        // Use the profile's global UUID as the unique key.
        // This prevents collisions between different users/devices.
        const profile_key = profile.uuid;

        if (!settings.is_sharing_enabled) {
            // Attempt to remove if user opted out
            await supabase
                .from('user_progress')
                .delete()
                .eq('profile_key', profile_key);
            return;
        }

        const { error } = await supabase
            .from('user_progress')
            .upsert({
                profile_key: profile_key,
                display_name: profile.name,
                // Only sync avatar if it's NOT a local file URI (waiting for queue)
                avatar_url: (settings.is_avatar_visible && !profile.avatar.startsWith('file://')) ? profile.avatar : null,
                total_hours: settings.total_hours_required,
                completed_hours: completedHours,
                last_updated: new Date().toISOString()
            }, {
                onConflict: 'profile_key'
            });

        if (error) {
            console.error('Error syncing to Supabase:', error.message);
        }
    } catch (err) {
        console.error('Failed to sync profile status:', err);
    }
};

/**
 * Deletes the profile's progress from Supabase
 * @param profileKey - The UUID of the profile to delete
 */
export const deleteProfileFromCloud = async (profileKey: string) => {
    console.log('[CloudSync] Attempting to delete profile from cloud:', profileKey);
    try {
        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out')), 5000);
        });

        // Race the deletion against the timeout
        const { error } = await Promise.race([
            supabase.from('user_progress').delete().eq('profile_key', profileKey),
            timeoutPromise
        ]) as any;

        if (error) {
            console.error('[CloudSync] Error deleting from Supabase, queuing for offline:', error.message);
            // If it's a network error or similar, queue it
            await queueOfflineAction('DELETE_PROFILE', { profileKey });
        } else {
            console.log('[CloudSync] Successfully deleted profile from Supabase');
        }
    } catch (err) {
        console.error('[CloudSync] Failed to delete profile from cloud (exception/timeout), queuing for offline:', err);
        // Queue for retry
        await queueOfflineAction('DELETE_PROFILE', { profileKey });
    }
};
