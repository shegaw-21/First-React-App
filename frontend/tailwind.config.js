/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}", // This line is essential for scanning your React components
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}