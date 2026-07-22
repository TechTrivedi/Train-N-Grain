/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sky: {
          brand: "#E4E4E7",
          dim: "rgba(228, 228, 231, 0.1)",
          glow: "rgba(228, 228, 231, 0.2)",
        },
        neon: {
          green: "#E4E4E7",
          dim: "rgba(228, 228, 231, 0.1)",
          glow: "rgba(228, 228, 231, 0.2)",
        },
        dark: {
          bg: "#050508",
          surface: "#0D0D12",
          card: "rgba(13, 13, 18, 0.7)",
          border: "rgba(255, 255, 255, 0.1)",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        display: ["Outfit", "Inter", "sans-serif"],
        consistency: ["'Bebas Neue'", "'Anton'", "'Oswald'", "Impact", "sans-serif"],
      },
      animation: {
        'blob': 'blob 10s ease-in-out infinite',
        'blob-slow': 'blob 16s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -40px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.95)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.4', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
