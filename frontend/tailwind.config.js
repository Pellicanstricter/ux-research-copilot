/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Owl mascot colors (warm palette - use for branding)
        'owl-burgundy': '#A85858',
        'owl-coral': '#D17666',
        'document-orange': '#F4A261',
        'beak-amber': '#E8944D',
        'outline-burgundy': '#893B3B',

        // UI primary colors (cool palette - main interface)
        'ribbon-blue': '#0079C8',
        'steel-gray': '#201E32',
        'soft-gray': '#F3F4F6',
        'light-gray': '#F8F9FA',

        // Functional/semantic colors
        'ocean-green': '#00C9A5',
        'eminence-purple': '#5F2A82',
        'outerlabs-red': '#F9524C',

        // Extended palette
        'powder-blue': '#B4E6DA',
        'cornflower': '#94C9EB',
        'viridian': '#447E60',
        'blue-stone': '#005363',
        'givry': '#F7EEC3',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'serif': ['Source Serif Pro', 'Georgia', 'serif'],
        'mono': ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
