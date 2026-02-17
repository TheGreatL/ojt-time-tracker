import { supabase } from './supabase';
import { getTotalHoursWorked, getSettingsByProfileId, getProfileById } from '../database/queries';

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
                avatar_url: settings.is_avatar_visible ? profile.avatar : null,
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
