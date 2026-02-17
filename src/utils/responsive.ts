import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Standard mobile screen sizes (iPhone 11/12/13/14/15/16 Pro)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

/**
 * Scale value based on screen width
 * Good for widths, margins, paddings
 */
export const scale = (size: number) => (SCREEN_WIDTH / GUIDELINE_BASE_WIDTH) * size;

/**
 * Scale value based on screen height
 * Good for heights
 */
export const verticalScale = (size: number) => (SCREEN_HEIGHT / GUIDELINE_BASE_HEIGHT) * size;

/**
 * Moderate scale value
 * Factor controls how much of the scaling is applied (0.5 is default)
 * Good for font sizes and border radii where you don't want extreme scaling
 */
export const moderateScale = (size: number, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * Hook or utility to check if the device is a tablet
 */
export const isTablet = () => {
    return SCREEN_WIDTH >= 768;
};

/**
 * Utility for responsive font sizes that respects device font scale settings
 */
export const responsiveFontSize = (size: number) => {
    const newSize = moderateScale(size);
    if (Platform.OS === 'ios') {
        return Math.round(PixelRatio.roundToNearestPixel(newSize));
    } else {
        return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
    }
};

export { SCREEN_WIDTH, SCREEN_HEIGHT };
