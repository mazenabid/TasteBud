/**
 * TASTEBU DESIGN SYSTEM - COLOR PALETTE
 * 
 * Design Philosophy:
 * - Accessible for all ages (WCAG AAA compliant)
 * - Medical credibility meets modern consumer app
 * - Colors evoke trust, safety, and positivity
 * - TRUE light/dark mode contrast
 */

export const Colors = {
  // Light Mode

  light: {

    // Primary brand colors
    primary: '#0e0f0f',        
    primaryLight: '#EBF4FF',   
    primaryDark: '#2C5282',    
    
    // Semantic colors
    success: '#0A7D57',        
    warning: '#976106',        
    danger: '#C83939',         
    info: '#03788B',           // Modern Cyan/Teal (Great for informational icons)

    // Today badge
    todayBadgeBg: '#252627',
    todayBadgeText: '#f7f7f7',
    todayLabelText: '#202121',
    
    // Backgrounds
    background: '#f6f4f0',     
    card: '#FFFFFF',          
    elevated: '#FFFFFF',       
    
    // Text
    textPrimary: '#111827',    
    textSecondary: '#69707E',  
    textTertiary: '#6A6E76',   
    
    // Borders & Dividers
    border: '#E5E7EB',         
    divider: '#E5E7EB',        

    // Glass effects
    glassTint: 'rgba(255, 255, 255, 0.85)',
    glassBlur: 20,
  },
  
  // Dark Mode
  dark: {

    // Primary brand colors (adjusted for dark mode)
    primary: '#1f2122',        
    primaryLight: '#93C5FD',   
    primaryDark: '#3B82F6',    
    
    // Semantic colors (brightened for dark mode)
    success: '#34D399',        
    warning: '#FBBF24',        
    danger: '#F87171',         
    info: '#22D3EE',           

    // Today badge
    todayBadgeBg: '#f2f1ea',      
    todayBadgeText: '#1a1a1a',     
    todayLabelText: '#e9f3ff',     
    
    // Backgrounds 
    background: '#111010',     // Pure black (was #0A0A0A)
    card: '#1C1C1E',           
    elevated: '#2C2C2E',       
    
    // Text
    textPrimary: '#FFFFFF',    // Pure white
    textSecondary: '#9CA3AF',  
    textTertiary: '#7F8591',   
    
    // Borders & Dividers
    border: '#374151',         
    divider: '#1F2937',       
    
    // Glass effects
    glassTint: 'rgba(28, 28, 30, 0.85)',
    glassBlur: 20,
  },
};

// Shadow presets
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
      shadowOpacity: 0.5,        // Stronger shadows in dark mode
      shadowRadius: 8,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.6,        // Stronger shadows
      shadowRadius: 12,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.7,        // Stronger shadows
      shadowRadius: 24,
      elevation: 8,
    },
  },
};

// Spacing system (8pt grid)
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Typography
export const Typography = {
  // Titles
  title1: { fontSize: 34, fontWeight: '700' as const, lineHeight: 41 },
  title2: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  title3: { fontSize: 22, fontWeight: '600' as const, lineHeight: 28 },
  
  // Body
  body: { fontSize: 17, fontWeight: '400' as const, lineHeight: 22 },
  bodyBold: { fontSize: 17, fontWeight: '600' as const, lineHeight: 22 },
  
  // Secondary
  caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
  footnote: { fontSize: 11, fontWeight: '500' as const, lineHeight: 13 },
};
// Theme exports for ThemeContext
export const lightTheme = Colors.light;
export const darkTheme = Colors.dark;
export type Theme = typeof Colors.light;

