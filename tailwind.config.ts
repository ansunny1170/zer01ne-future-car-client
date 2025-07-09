import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */

const customMaskImage = plugin(({ addUtilities }) => {
  addUtilities({
    '.mask-image-linear': {
      'mask-image': 'linear-gradient(white, white)',
      '-webkit-mask-image': 'linear-gradient(white, white)',
    },
    '.mask-composite-exclude': {
      'mask-composite': 'exclude',
      '-webkit-mask-composite': 'destination-out',
    },
  })
})

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      maskImage: {
        'linear': 'linear-gradient(white, white)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [
    require('@designbycode/tailwindcss-mask-image'),
    customMaskImage
  ],
}

export default config