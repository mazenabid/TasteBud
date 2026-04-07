/**
 * TASTEBUD DESIGN SYSTEM
 */

export const Colors = {
  // LIGHT MODE
  light: {
    primary: '#0e0f0f',

    success: '#0A7D57', 
    warning: '#976106', 
    danger:  '#C83939',  
    info:    '#03788B',

    todayBadgeBg:    '#252627',
    todayBadgeText:  '#f7f7f7',
    todayLabelText:  '#202121',

    background: '#f6f4f0',  
    card:       '#FFFFFF', 

    textPrimary:   '#111827', 
    textSecondary: '#69707E',  
    textTertiary:  '#6A6E76',  

    border: '#E5E7EB',
  },

  // DARK MODE
  dark: {
    primary: '#1f2122',

    success: '#34D399',
    warning: '#FBBF24',
    danger:  '#F87171',
    info:    '#22D3EE',

    todayBadgeBg:   '#f2f1ea',
    todayBadgeText: '#1a1a1a',
    todayLabelText: '#e9f3ff',

    background: '#111010',
    card:       '#1C1C1E',

    textPrimary:   '#FFFFFF',
    textSecondary: '#9CA3AF',
    textTertiary:  '#7F8591',

    border: '#374151',
  },
};

// SHADOWS
export const Shadows = {
  light: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.1,
      shadowRadius: 24,
      elevation: 8,
    },
  },
  dark: {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.7,
      shadowRadius: 24,
      elevation: 8,
    },
  },
};

// SPACING — 8-point grid
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};

// TYPOGRAPHY
export const Typography = {
  title1:   { fontSize: 34, fontWeight: '700' as const, lineHeight: 41 },
  title2:   { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title3:   { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  body:     { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  caption:  { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  footnote: { fontSize: 11, fontWeight: '500' as const, lineHeight: 13 },
};

// THEME EXPORTS — consumed by ThemeContext
export const lightTheme = Colors.light;
export const darkTheme = Colors.dark;
export type Theme = typeof Colors.light;