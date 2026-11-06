/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: todos os arquivos com classes Nativewind
  content: ["./src/app/**/*.{js,jsx,ts,tsx}", "./src/components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
