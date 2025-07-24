// eslint.config.js
import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReactConfig from "eslint-plugin-react/configs/recommended.js";
import { fixupConfigAsPlugin } from "@eslint/compat";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";

export default [{
        // Define files to lint
        files: ["src/**/*.{js,jsx,ts,tsx}"],
        // Language options: ES2020 for modern JS, JSX for React, modules for import/export
        languageOptions: {
            parserOptions: {
                ecmaVersion: 2020,
                sourceType: "module",
                ecmaFeatures: {
                    jsx: true,
                },
            },
            // Define global variables for browser environment
            globals: globals.browser,
        },
        // ESLint rules
        rules: {
            // General ESLint rules
            ...pluginJs.configs.recommended.rules,
            // React specific rules (from eslint-plugin-react)
            ...fixupConfigAsPlugin(pluginReactConfig).rules,
            // React Hooks specific rules (from eslint-plugin-react-hooks)
            ...pluginReactHooks.configs.recommended.rules,
            // JSX accessibility rules (from eslint-plugin-jsx-a11y)
            ...pluginJsxA11y.configs.recommended.rules,

            // Custom rules or overrides
            "react/react-in-jsx-scope": "off", // Not needed for React 17+ JSX transform
            "react/prop-types": "off", // Disable prop-types validation if you use TypeScript or prefer not to use them
            "no-unused-vars": "warn", // Warn for unused variables instead of error
            "no-console": ["warn", { allow: ["warn", "error"] }], // Allow console.warn and console.error
        },
        settings: {
            react: {
                version: "detect", // Automatically detect the React version
            },
        },
    },
    // Ignore files/directories
    {
        ignores: ["dist/", "node_modules/", "build/", ".vscode/"],
    },
];