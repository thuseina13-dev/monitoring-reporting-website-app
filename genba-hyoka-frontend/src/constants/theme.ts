/**
 * Theme colors for the application.
 * Values can be overridden via environment variables if needed in the future.
 */

export const COLORS = {
  // Operational Status Base Colors
  primary: process.env.EXPO_PUBLIC_PRIMARY_COLOR || '#2ECC71',
  warning: '#F1C40F',
  danger: '#E74C3C',
  info: '#3498DB',
  success: '#2ECC71',
  normal: '#95A5A6',
  
  // Backgrounds
  pageBackground: process.env.EXPO_PUBLIC_PAGE_BG || '#FFFFFF',
  cardBackground: '#FFFFFF',
  inputBackground: '#FFFFFF',
  bgLight: '#F1F3F5',
  bgSoft: '#FFFFFF',
  
  // Text Colors
  textMain: '#2C3E50',
  textDark: '#3D4A3E',
  textMuted: '#4E6073',
  textSecondary: '#95A5A6',
  textLight: '#FFFFFF',
  textDanger: '#E74C3C',
  textGray: '#495057',
  
  // Borders
  borderColor: '#BBCBBB26',
  borderLight: '#E5E7EB',
  borderMedium: '#E9ECEF',
  borderSeparator: '#F2F2F2',
  dangerBorder: '#F5B7B1',

  // Feedback States (Light variations)
  primaryLight: '#DCFCE7',
  warningLight: '#FEF9C3',
  dangerLight: '#FDEAEA',
  dangerDark: '#943126',

  // Transparent Variations (Commonly used for hover/press states)
  transparent: {
    primary: '#2ECC711A',
    danger: '#E74C3C1A',
    gray: '#95A5A61A',
    lightGray: '#F8F9FA1A',
  },

  // Tactical Gradients (Arah 135deg / Top-Left to Bottom-Right)
  gradients: {
    primary: ['#2ECC71', '#27AE60'],
    warning: ['#F1C40F', '#F39C12'],
    danger: ['#E74C3C', '#C0392B'],
    info: ['#3498DB', '#2980B9'],
    normal: ['#BDC3C7', '#95A5A6'],
  }
};
