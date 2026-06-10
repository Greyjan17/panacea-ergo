/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta ERGO v2.1 — escala marrón/naranja preservada
        ergo: {
          bg: '#F5EFE6',
          white: '#FFFFFF',
          card: '#FFFFFF',
          cb: '#E8D5C0',
          inp: '#FDF8F3',
          text: '#2C1810',
          mid: '#5C3D2E',
          muted: '#9A7B6A',
          header: '#8B4513',
          orange: '#D2691E',
          ob: '#C45C1A',
        },
        // Semáforo de riesgo (verde → rojo) — REBA / RULA / OWAS / NIOSH / MMC
        risk: {
          0: '#22C55E',
          1: '#84CC16',
          2: '#EAB308',
          3: '#F97316',
          4: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

