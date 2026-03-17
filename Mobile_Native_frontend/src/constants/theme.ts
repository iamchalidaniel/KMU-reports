/**
 * KMU Reports Mobile – Design Token System
 * Mirrors the web frontend's Tailwind color palette exactly.
 *
 * Web brand colors (from tailwind.config.js):
 *   kmuGreen:  #008542 / dark #005c2a / light #33a86d
 *   kmuOrange: #ff8200 / dark #cc6900 / light #ffab40
 *
 * Dark/light semantics follow the web's gray-900 / white pattern.
 */

// ─── Brand ────────────────────────────────────────────────────────────────────
export const Brand = {
  green:      '#008542',
  greenDark:  '#005c2a',
  greenLight: '#33a86d',
  orange:     '#ff8200',
  orangeDark: '#cc6900',
  orangeLight:'#ffab40',
} as const;

// ─── Semantic palette – dark mode (default, mirrors web dark) ─────────────────
export const DarkColors = {
  // Backgrounds  (web: gray-900 = #111827, gray-800 = #1f2937, gray-700 = #374151)
  background:      '#0f172a',   // slightly deeper than web gray-900 for OLED
  surface:         '#1e293b',   // gray-800 equivalent
  surfaceElevated: '#263348',   // elevated card
  card:            '#1e293b',

  // Borders  (web: gray-700 = #374151, gray-600 = #4b5563)
  border:      '#374151',
  borderLight: '#4b5563',

  // Text  (web: gray-50 = #f9fafb, gray-400 = #9ca3af, gray-500 = #6b7280)
  text:        '#f9fafb',
  textSecondary:'#9ca3af',
  textMuted:   '#6b7280',

  // Brand accents
  primary:     Brand.green,
  primaryDark: Brand.greenDark,
  primaryLight:Brand.greenLight,
  accent:      Brand.orange,
  accentDark:  Brand.orangeDark,
  accentLight: Brand.orangeLight,

  // Status (match web Tailwind defaults)
  success: '#10b981',  // emerald-500
  warning: '#f59e0b',  // amber-500
  danger:  '#ef4444',  // red-500
  info:    '#3b82f6',  // blue-500

  // Role-specific accents
  student:  '#8b5cf6',  // violet-500
  admin:    Brand.green,
  security: '#ef4444',
  maintenance: Brand.orange,

  // Tab bar
  tabBar: '#1e293b',
  tabBarBorder: '#374151',
  tabActive: Brand.green,
  tabInactive: '#6b7280',
} as const;

// ─── Semantic palette – light mode (mirrors web light) ────────────────────────
export const LightColors = {
  // Backgrounds  (web: white / gray-50 = #f9fafb / gray-100 = #f3f4f6)
  background:      '#f9fafb',
  surface:         '#ffffff',
  surfaceElevated: '#f3f4f6',
  card:            '#ffffff',

  // Borders  (web: gray-200 = #e5e7eb, gray-300 = #d1d5db)
  border:      '#e5e7eb',
  borderLight: '#d1d5db',

  // Text  (web: gray-900 = #111827, gray-600 = #4b5563, gray-400 = #9ca3af)
  text:         '#111827',
  textSecondary:'#4b5563',
  textMuted:    '#9ca3af',

  // Brand accents (same — brand doesn't change with mode)
  primary:     Brand.green,
  primaryDark: Brand.greenDark,
  primaryLight:Brand.greenLight,
  accent:      Brand.orange,
  accentDark:  Brand.orangeDark,
  accentLight: Brand.orangeLight,

  // Status
  success: '#059669',  // emerald-600 (slightly darker for white bg readability)
  warning: '#d97706',  // amber-600
  danger:  '#dc2626',  // red-600
  info:    '#2563eb',  // blue-600

  // Role-specific accents
  student:  '#7c3aed',  // violet-600
  admin:    Brand.greenDark,
  security: '#dc2626',
  maintenance: Brand.orangeDark,

  // Tab bar
  tabBar: '#ffffff',
  tabBarBorder: '#e5e7eb',
  tabActive: Brand.green,
  tabInactive: '#9ca3af',
} as const;

// Export a structural type (not tied to literal strings) so both palettes satisfy it
export type AppColors = { [K in keyof typeof DarkColors]: string };

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

// ─── Radius ───────────────────────────────────────────────────────────────────
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

// ─── Font sizes ───────────────────────────────────────────────────────────────
export const FontSize = {
  xs:   11,
  sm:   13,
  md:   15,
  lg:   17,
  xl:   20,
  xxl:  24,
  xxxl: 32,
} as const;

// ─── Font weights ─────────────────────────────────────────────────────────────
export const FontWeight = {
  normal:   '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  extrabold:'800',
} as const;

// ─── Legacy alias (keeps old `Colors` imports working) ───────────────────────
export const Colors = DarkColors;
