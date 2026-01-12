import type { Preview } from '@storybook/react-vite'
import '../src/renderer/src/index.css'

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'gray', value: '#f9fafb' },
        { name: 'dark', value: '#111827' },
      ],
    },
    layout: 'centered',
  },
  tags: ['autodocs'],
}

export default preview
