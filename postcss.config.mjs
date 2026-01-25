/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // Ganti 'tailwindcss' menjadi ini
    autoprefixer: {}
  }
};

export default config;
