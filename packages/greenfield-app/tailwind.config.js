const colors = require("tailwindcss/colors");
const config = require("@popcorn/components/tailwind.config.js");

module.exports = {
  ...config,
  plugins: [require("@tailwindcss/forms"), require("tailwind-scrollbar-hide")],
};
