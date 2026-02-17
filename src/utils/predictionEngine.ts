// Prediction engine for calculating estimated internship completion date

import {
    getSettingsByProfileId,
    getAttendanceLogsByProfileId,
    getTotalHoursWorked,
} from '../database/queries';
import { Settings, AttendanceLog } from '../database/schema';

interface PredictionResult {
    estimatedCompletionDate: Date | null;
    hoursRemaining: number;
    totalHours: number;
    hoursCompleted: number;
}

/**
 * Calculate the estimated completion date for an internship
 * @param profileId - The active profile ID
 * @returns Prediction result with completion date and hours breakdown
 */
export const calculateCompletionDate = (
    settings: Settings | null,
    attendanceLogs: AttendanceLog[],
    hoursCompleted: number
): PredictionResult => {
    try {
        if (!settings) {
            return {
                estimatedCompletionDate: null,
                hoursRemaining: 0,
                totalHours: 0,
                hoursCompleted: 0,
            };
        }

        const totalRequired = Number(settings.total_hours_required);
        const completed = Number(hoursCompleted);
        const hoursRemaining = totalRequired - completed;


        // If already completed
        if (hoursRemaining <= 0) {
            // Find the actual date when it was completed
            const workedLogs = attendanceLogs
                .filter(log => log.status === 'worked')
                .sort((a, b) => a.date.localeCompare(b.date));

            let cumulativeHours = 0;
            let actualCompletionDate = new Date();

            for (const log of workedLogs) {
                cumulativeHours += Number(log.hours_worked);
                if (cumulativeHours >= totalRequired) {
                    actualCompletionDate = parseDate(log.date);
                    break;
                }
            }

            return {
                estimatedCompletionDate: actualCompletionDate,
                hoursRemaining: 0,
                totalHours: totalRequired,
                hoursCompleted: completed,
            };
        }

        // Parse weekly schedule
        const weeklySchedule: number[] = JSON.parse(settings.weekly_schedule || '[]');

        // If no work days selected, cannot predict
        if (weeklySchedule.length === 0) {
            return {
                estimatedCompletionDate: null,
                hoursRemaining,
                totalHours: totalRequired,
                hoursCompleted: completed,
            };
        }

        // Get all logged dates (worked or excluded) to avoid predicting on days with existing data
        const loggedDates = new Set(
            attendanceLogs.map((log) => log.date)
        );

        // Determine daily and weekly caps
        let dailyCap = Number(settings.max_hours_per_day);
        let weeklyCap = Number(settings.max_hours_per_week);

        // Default to 8 hours/day if unlimited
        if (!dailyCap || dailyCap <= 0 || isNaN(dailyCap)) {
            dailyCap = 8;
        }

        // If unlimited weekly, set to a very high number
        if (settings.unlimited_weekly || !weeklyCap || weeklyCap <= 0 || isNaN(weeklyCap)) {
            weeklyCap = 999999;
        }

        // Calculate hours already worked THIS week to correctly apply weekly cap starting from tomorrow
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayStr = formatDate(today);
        const currentWeekStart = getWeekStart(today);
        currentWeekStart.setHours(0, 0, 0, 0);
        const currentWeekStartStr = formatDate(currentWeekStart);

        let weeklyHoursAccumulated = 0;
        attendanceLogs.forEach(log => {
            // Only count logs from this week up to today
            if (log.status === 'worked' && log.date >= currentWeekStartStr && log.date <= todayStr) {
                weeklyHoursAccumulated += Number(log.hours_worked);
            }
        });

        // Start prediction from tomorrow
        let currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(0, 0, 0, 0);

        let runningWeekStart = getWeekStart(currentDate);
        runningWeekStart.setHours(0, 0, 0, 0);
        let remainingHours = hoursRemaining;

        // Iterate through dates until hours are fulfilled
        let iterations = 0;
        const maxIterations = 2000; // Increased safety limit for long-term internships

        while (remainingHours > 0 && iterations < maxIterations) {
            iterations++;

            // Check if we've moved to a new week
            const weekStart = getWeekStart(currentDate);
            if (weekStart.getTime() !== runningWeekStart.getTime()) {
                weeklyHoursAccumulated = 0;
                runningWeekStart = weekStart;
            }

            const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
            const dateString = formatDate(currentDate);

            // Check if this day is in the weekly schedule
            if (!weeklySchedule.includes(dayOfWeek)) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            // Check if this date already has a log (worked or excluded)
            if (loggedDates.has(dateString)) {
                currentDate.setDate(currentDate.getDate() + 1);
                continue;
            }

            // Calculate how many hours can be worked this day
            const remainingWeeklyHours = Math.max(0, weeklyCap - weeklyHoursAccumulated);
            const hoursThisDay = Math.min(dailyCap, remainingWeeklyHours, remainingHours);

            if (hoursThisDay > 0) {
                remainingHours -= hoursThisDay;
                weeklyHoursAccumulated += hoursThisDay;
            }

            // Move to next day
            currentDate.setDate(currentDate.getDate() + 1);
        }

        // The completion date is the last day we worked
        currentDate.setDate(currentDate.getDate() - 1);


        return {
            estimatedCompletionDate: currentDate,
            hoursRemaining,
            totalHours: totalRequired,
            hoursCompleted: completed,
        };
    } catch (error) {
        console.error('Error calculating completion date:', error);
        return {
            estimatedCompletionDate: null,
            hoursRemaining: 0,
            totalHours: 0,
            hoursCompleted: 0,
        };
    }
};

/**
 * Get the start of the week (Sunday) for a given date
 */
export const getWeekStart = (date: Date): Date => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day;
    const weekStart = new Date(d.setDate(diff));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
};

/**
 * Format date as YYYY-MM-DD
 */
export const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Parse date string YYYY-MM-DD to Date object
 */
export const parseDate = (dateString: string): Date => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};
