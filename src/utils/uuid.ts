import * as Crypto from 'expo-crypto';

/**
 * Generates a secure UUID v4 string
 */
export const generateUUID = (): string => {
    return Crypto.randomUUID();
};
