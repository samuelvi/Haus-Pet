/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm earth tones palette
        primary: {
          50: '#faf7f4',
          100: '#f5ede7',
          200: '#E8CFC1', // Base - Rosa pálido/beige
          300: '#ddb8a3',
          400: '#d19d80',
          500: '#c4825d',
          600: '#b5673f',
          700: '#9a5434',
          800: '#7d452d',
          900: '#663827',
        },
        secondary: {
          50: '#fdf6f0',
          100: '#faeade',
          200: '#f5d5bc',
          300: '#efb890',
          400: '#e79262',
          500: '#D67747', // Base - Naranja terracota
          600: '#c45a2f',
          700: '#a44726',
          800: '#843a23',
          900: '#6c3121',
        },
        accent: {
          50: '#fefbf3',
          100: '#fdf5e1',
          200: '#fae9b8',
          300: '#f5d785',
          400: '#eec04a',
          500: '#A87008', // Base - Dorado/mostaza oscuro
          600: '#8f5e07',
          700: '#774f06',
          800: '#634209',
          900: '#54380b',
        },
        warm: {
          50: '#faf8f6',
          100: '#f3eeea',
          200: '#e4dcd3',
          300: '#cfc0b3',
          400: '#b5a08e',
          500: '#9d8570',
          600: '#6B553D', // Base - Marrón medio
          700: '#5a4733',
          800: '#4c3d2c',
          900: '#423527',
        },
        dark: {
          50: '#f7f6f5',
          100: '#eae7e4',
          200: '#d3cdc7',
          300: '#b5aba2',
          400: '#978a7e',
          500: '#7d6f63',
          600: '#665850',
          700: '#534843',
          800: '#463d39',
          900: '#3A2812', // Base - Marrón muy oscuro
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px 0 rgba(58, 40, 18, 0.08)',
        'medium': '0 4px 20px 0 rgba(58, 40, 18, 0.12)',
        'large': '0 8px 30px 0 rgba(58, 40, 18, 0.16)',
      },
    },
  },
  plugins: [],
}
