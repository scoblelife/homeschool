import type { Config } from 'tailwindcss'
import { tailwindTokens } from '@homeschool/design-tokens/tailwind'

export default {
  content: ['./src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      ...tailwindTokens,
    },
  },
  plugins: [],
} satisfies Config
