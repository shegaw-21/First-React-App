/** @type {import('tailwindcss').Config} */
export default {
    // This 'content' array tells Tailwind CSS which files to scan for utility classes.
    // It's crucial for Tailwind to generate the necessary CSS.
    content: [
        "./index.html", // Scans your main HTML file
        "./src/**/*.{js,ts,jsx,tsx}", // Scans all JS, TS, JSX, TSX files in the src directory and its subdirectories
    ],
    theme: {
        extend: {},
    },
    plugins: [],
}