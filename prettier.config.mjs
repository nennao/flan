/** @type {import("prettier").Config} */
const config = {
  printWidth: 120,
  plugins: ["prettier-plugin-tailwindcss"],
  // Tailwind v4 has no JS config; the plugin reads the theme from the CSS entry.
  tailwindStylesheet: "./src/app/globals.css",
};

export default config;
