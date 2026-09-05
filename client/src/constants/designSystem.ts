// Professional dark mode design system (8px grid)
export const DESIGN_SYSTEM = {
  // Color Palette - Strict 8-step scale
  colors: {
    background: '#000000',    // Main background
    elevated: '#0a0a0a',      // Cards, elevated surfaces
    tertiary: '#151515',      // Hover states, subtle backgrounds
    inputs: '#1a1a1a',        // Input field backgrounds
    border: '#252525',        // Borders, dividers
    textTertiary: '#737373',  // Disabled text
    textSecondary: '#a3a3a3', // Secondary labels
    textPrimary: '#ffffff',   // Main text
    
    // Semantic colors
    primary: '#0055FF',       // Primary actions
    primaryHover: '#0047CC',
    primaryActive: '#003d99',
    
    success: '#10b981',
    successLight: 'rgba(16, 185, 129, 0.1)',
    
    warning: '#f59e0b',
    warningLight: 'rgba(245, 158, 11, 0.1)',
    
    error: '#ef4444',
    errorLight: 'rgba(239, 68, 68, 0.1)',
    
    info: '#3b82f6',
    infoLight: 'rgba(59, 130, 246, 0.1)',
  },

  // Typography Scale (based on 14px)
  typography: {
    // Font sizes
    xs: '11px',      // Labels, badges
    sm: '12px',      // Body text
    base: '14px',    // Secondary headings
    lg: '16px',      // Headings
    xl: '20px',      // Page titles
    
    // Font weights
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    
    // Line heights
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Spacing Scale (8px base unit)
  spacing: {
    xs: '4px',       // Minimal gaps
    sm: '8px',       // Default gap
    md: '16px',      // Section padding
    lg: '24px',      // Major sections
    xl: '32px',      // Page margins
    xxl: '48px',     // Maximum spacing
  },

  // Border Radius Scale
  borderRadius: {
    sm: '4px',       // Small elements
    md: '6px',       // Buttons, inputs
    lg: '8px',       // Cards, modals
    xl: '12px',      // Large modals
  },

  // Shadows (proper dark mode)
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.24)',
    md: '0 2px 8px rgba(0, 0, 0, 0.32)',
    lg: '0 4px 16px rgba(0, 0, 0, 0.48)',
    xl: '0 8px 32px rgba(0, 0, 0, 0.56)',
  },

  // Z-index scale
  zIndex: {
    base: 0,
    dropdown: 100,
    tooltip: 200,
    sticky: 300,
    modal: 1000,
    modalNested: 1100,
    notification: 1200,
  },

  // Transitions
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Component sizes
  sizes: {
    buttonSmall: '32px',
    buttonBase: '36px',
    buttonLarge: '40px',
    inputHeight: '36px',
    rowHeight: '48px',
    headerHeight: '56px',
  },
} as const;

// CSS-in-JS helper functions
export const createFocusStyle = () => ({
  outline: 'none',
  borderColor: DESIGN_SYSTEM.colors.primary,
  boxShadow: `0 0 0 3px ${DESIGN_SYSTEM.colors.primaryLight || 'rgba(0, 85, 255, 0.1)'}`,
  transition: DESIGN_SYSTEM.transitions.fast,
});

export const createHoverStyle = () => ({
  backgroundColor: DESIGN_SYSTEM.colors.tertiary,
  transition: DESIGN_SYSTEM.transitions.fast,
});

export const createButtonStyle = (variant: 'primary' | 'secondary' | 'danger' | 'ghost' = 'primary') => {
  const baseStyle = {
    height: DESIGN_SYSTEM.sizes.buttonBase,
    padding: `0 ${DESIGN_SYSTEM.spacing.md}`,
    borderRadius: DESIGN_SYSTEM.borderRadius.md,
    fontSize: DESIGN_SYSTEM.typography.base,
    fontWeight: DESIGN_SYSTEM.typography.semibold,
    border: 'none',
    cursor: 'pointer',
    transition: DESIGN_SYSTEM.transitions.fast,
    outline: 'none',
  };

  const variants = {
    primary: {
      ...baseStyle,
      backgroundColor: DESIGN_SYSTEM.colors.primary,
      color: DESIGN_SYSTEM.colors.textPrimary,
      '&:hover': { backgroundColor: DESIGN_SYSTEM.colors.primaryHover },
      '&:active': { backgroundColor: DESIGN_SYSTEM.colors.primaryActive },
    },
    secondary: {
      ...baseStyle,
      backgroundColor: DESIGN_SYSTEM.colors.inputs,
      color: DESIGN_SYSTEM.colors.textSecondary,
      border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
      '&:hover': { borderColor: '#3a3a3a', color: DESIGN_SYSTEM.colors.textPrimary },
    },
    danger: {
      ...baseStyle,
      backgroundColor: DESIGN_SYSTEM.colors.error,
      color: DESIGN_SYSTEM.colors.textPrimary,
      '&:hover': { backgroundColor: '#d32f2f' },
    },
    ghost: {
      ...baseStyle,
      backgroundColor: 'transparent',
      color: DESIGN_SYSTEM.colors.textSecondary,
      border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
      '&:hover': { borderColor: '#3a3a3a', color: DESIGN_SYSTEM.colors.textPrimary },
    },
  };

  return variants[variant];
};

export const createInputStyle = () => ({
  height: DESIGN_SYSTEM.sizes.inputHeight,
  padding: `0 ${DESIGN_SYSTEM.spacing.sm}`,
  fontSize: DESIGN_SYSTEM.typography.base,
  backgroundColor: DESIGN_SYSTEM.colors.inputs,
  border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
  borderRadius: DESIGN_SYSTEM.borderRadius.md,
  color: DESIGN_SYSTEM.colors.textPrimary,
  outline: 'none',
  transition: DESIGN_SYSTEM.transitions.fast,
  fontFamily: 'inherit',
  boxSizing: 'border-box' as const,
  '&:focus': createFocusStyle(),
  '&:disabled': {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
});

export const createTableRowStyle = (isStriped: boolean = false, index: number = 0) => ({
  display: 'grid',
  padding: `${DESIGN_SYSTEM.spacing.sm} ${DESIGN_SYSTEM.spacing.md}`,
  backgroundColor: isStriped && index % 2 === 0 ? DESIGN_SYSTEM.colors.tertiary : DESIGN_SYSTEM.colors.background,
  border: `0.5px solid ${DESIGN_SYSTEM.colors.border}`,
  borderRadius: DESIGN_SYSTEM.borderRadius.md,
  transition: DESIGN_SYSTEM.transitions.fast,
  '&:hover': {
    borderColor: '#3a3a3a',
    backgroundColor: DESIGN_SYSTEM.colors.tertiary,
  },
});
