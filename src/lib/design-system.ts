/**
 * FeedbackLoop Design System
 *
 * This file contains utility functions and constants for the FeedbackLoop design system.
 * It provides a centralized place for design tokens and helper functions.
 */

// Color palette
export const colors = {
  primary: {
    teal: {
      50: "#f0fdfa",
      100: "#ccfbf1",
      200: "#99f6e4",
      300: "#5eead4",
      400: "#2dd4bf",
      500: "#14b8a6", // Primary brand color
      600: "#0d9488",
      700: "#0f766e",
      800: "#115e59",
      900: "#134e4a",
      950: "#042f2e",
    },
    cyan: {
      50: "#ecfeff",
      100: "#cffafe",
      200: "#a5f3fc",
      300: "#67e8f9",
      400: "#22d3ee",
      500: "#06b6d4", // Secondary brand color
      600: "#0891b2",
      700: "#0e7490",
      800: "#155e75",
      900: "#164e63",
      950: "#083344",
    },
    emerald: {
      50: "#ecfdf5",
      100: "#d1fae5",
      200: "#a7f3d0",
      300: "#6ee7b7",
      400: "#34d399",
      500: "#10b981", // Tertiary brand color
      600: "#059669",
      700: "#047857",
      800: "#065f46",
      900: "#064e3b",
      950: "#022c22",
    },
  },
  neutral: {
    slate: {
      50: "#f8fafc",
      100: "#f1f5f9",
      200: "#e2e8f0",
      300: "#cbd5e1",
      400: "#94a3b8",
      500: "#64748b",
      600: "#475569",
      700: "#334155",
      800: "#1e293b",
      900: "#0f172a",
      950: "#020617",
    },
  },
  accent: {
    amber: {
      50: "#fffbeb",
      100: "#fef3c7",
      200: "#fde68a",
      300: "#fcd34d",
      400: "#fbbf24",
      500: "#f59e0b",
      600: "#d97706",
      700: "#b45309",
      800: "#92400e",
      900: "#78350f",
      950: "#451a03",
    },
    rose: {
      50: "#fff1f2",
      100: "#ffe4e6",
      200: "#fecdd3",
      300: "#fda4af",
      400: "#fb7185",
      500: "#f43f5e",
      600: "#e11d48",
      700: "#be123c",
      800: "#9f1239",
      900: "#881337",
      950: "#4c0519",
    },
  },
};

// Gradient presets
export const gradients = {
  primary: "from-teal-500 to-cyan-500",
  primaryHover: "from-teal-600 to-cyan-600",
  secondary: "from-teal-400 via-cyan-500 to-emerald-400",
  badge: "from-teal-100 to-cyan-100",
  badgeHover: "from-teal-200 to-cyan-200",
  textPrimary: "from-teal-500 via-cyan-500 to-emerald-500",
};

// Border radius presets
export const borderRadius = {
  none: "0",
  sm: "0.125rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "2rem",
  full: "9999px",
};

// Shadow presets
export const shadows = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  "2xl": "shadow-2xl",
  glow: "shadow-glow-teal",
};

// Animation presets
export const animations = {
  float: "animate-float",
  floatSlow: "animate-float-slow",
  pulse: "animate-pulse",
  shimmer: "animate-shimmer",
};

// Typography presets
export const typography = {
  heading: {
    h1: "text-4xl md:text-6xl font-bold tracking-tight",
    h2: "text-3xl md:text-5xl font-bold tracking-tight",
    h3: "text-2xl md:text-3xl font-semibold tracking-tight",
    h4: "text-xl md:text-2xl font-semibold tracking-tight",
    h5: "text-lg md:text-xl font-semibold tracking-tight",
    h6: "text-base md:text-lg font-semibold tracking-tight",
  },
  body: {
    large: "text-lg md:text-xl text-slate-600",
    base: "text-base text-slate-600",
    small: "text-sm text-slate-500",
    tiny: "text-xs text-slate-500",
  },
};

// Spacing presets
export const spacing = {
  section: {
    sm: "py-12 md:py-16",
    md: "py-16 md:py-24",
    lg: "py-20 md:py-32",
  },
};

// Component presets
export const components = {
  button: {
    primary:
      "bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 rounded-full",
    secondary:
      "bg-white/80 backdrop-blur-sm border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white rounded-full",
    ghost: "text-slate-700 hover:text-slate-900 hover:bg-slate-100",
    icon: "rounded-full border-slate-200 text-slate-600 hover:text-teal-600 hover:border-teal-200 hover:bg-teal-50 h-9 w-9",
  },
  badge: {
    primary:
      "bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-700 hover:from-teal-200 hover:to-cyan-200 border-none px-3 py-1 rounded-full shadow-sm",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 border-none",
    outline:
      "bg-white text-slate-700 border border-slate-200 hover:border-slate-300",
  },
  card: {
    default:
      "bg-white/90 backdrop-blur-sm border-slate-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300",
    gradient:
      "bg-gradient-to-b from-white to-gray-50 shadow-md hover:shadow-lg transition-shadow",
  },
  avatar: {
    glow: "relative before:absolute before:inset-0 before:rounded-full before:bg-gradient-to-r before:from-teal-400 before:to-cyan-400 before:blur-[6px] before:opacity-50",
  },
};

// Helper functions
export const applyGradientText = (text: string) => {
  return `bg-clip-text text-transparent bg-gradient-to-r ${gradients.textPrimary} ${text}`;
};

export const applyGradientBackground = (className: string) => {
  return `bg-gradient-to-r ${className}`;
};

// Export all design tokens
export const designSystem = {
  colors,
  gradients,
  borderRadius,
  shadows,
  animations,
  typography,
  spacing,
  components,
  applyGradientText,
  applyGradientBackground,
};

export default designSystem;
