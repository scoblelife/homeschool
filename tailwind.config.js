import { tailwindTokens } from './src/renderer/src/design/tokens/tailwind-tokens'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  // Use class-based dark mode (prevents system preference from triggering dark styles)
  darkMode: 'class',
  theme: {
    extend: {
      colors: tailwindTokens.colors,
      spacing: tailwindTokens.spacing,
      fontSize: tailwindTokens.fontSize,
      fontWeight: tailwindTokens.fontWeight,
      lineHeight: tailwindTokens.lineHeight,
      borderRadius: tailwindTokens.borderRadius,
      borderWidth: tailwindTokens.borderWidth,
      boxShadow: tailwindTokens.boxShadow,
    }
  },
  plugins: [require('@tailwindcss/typography')]
}
