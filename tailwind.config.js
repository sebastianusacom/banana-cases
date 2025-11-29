/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // We'll add our custom colors here later
        telegram: {
          bg: 'var(--tg-theme-bg-color, #1c1c1e)',
          text: 'var(--tg-theme-text-color, #ffffff)',
          hint: 'var(--tg-theme-hint-color, #98989e)',
          link: 'var(--tg-theme-link-color, #007aff)',
          button: 'var(--tg-theme-button-color, #007aff)',
          buttonText: 'var(--tg-theme-button-text-color, #ffffff)',
        }
      }
    },
  },
  plugins: [],
}

