/**
 * Theme colors for the application.
 * Values can be overridden via environment variables if needed in the future.
 */

export const COLORS = {
  // Operational Status Base Colors
  primary: process.env.EXPO_PUBLIC_PRIMARY_COLOR || '#2ECC71',
  warning: '#E74C3C',
  info: '#3498DB',
  normal: '#95A5A6',
  
  // Backgrounds
  pageBackground: process.env.EXPO_PUBLIC_PAGE_BG || '#F8F9FA',
  cardBackground: '#FFFFFF',
  inputBackground: '#E7E8E9',
  
  // Text Colors
  textDark: '#3D4A3E',
  textMuted: '#4E6073',
  textLight: '#FFFFFF',
  
  // Borders
  borderColor: '#BBCBBB26',

  // Tactical Gradients (Arah 135deg / Top-Left to Bottom-Right)
  gradients: {
    primary: ['#2ECC71', '#27AE60'],
    warning: ['#E74C3C', '#C0392B'],
    info: ['#3498DB', '#2980B9'],
    normal: ['#BDC3C7', '#95A5A6'],
  }
};
