/** @type {import('tailwindcss').Config} */
module.exports = {
  // Ensure Tailwind scans all your React files
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      colors: {
        // --- Custom Colors ---
        
        // Custom background color: bg-chonky-brown-50
        'chonky-brown-50': '#F5E6CC', // Placeholder for light brown
        
        // Custom text color: text-default-text
        'default-text': '#333333',   // Placeholder for dark gray text
        
        // Custom color for footer text: text-poop
        'text-poop': '#6B4226',      // Placeholder for dark brown/poop color
        
        // Custom color used for borders/accents: border-text-brown
        // Note: We define the color 'text-brown' and Tailwind generates 'border-text-brown' automatically
        'text-brown': '#A0522D',     // Placeholder for brown border color
        
        // Ensure Tailwind has a base color definition for the yellow button
        'yellow': '#FFD700',
        
        // --- Custom Utility Overrides (for specific colors mentioned) ---
        
        // Overrides for semi-transparent grays (Tailwind generates these by default, but defining them here ensures consistency if using full hex codes later)
        'gray-700/60': 'rgba(55, 65, 81, 0.6)',
        'gray-800/50': 'rgba(31, 41, 55, 0.5)',
      },
      // If you need custom opacity for colors not listed here, use the opacity utilities.
    },
  },
  plugins: [],
}
