// eslint.config.js

import babelParser from "@babel/eslint-parser";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import globals from "globals";

export default [
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        requireConfigFile: false,
        ecmaFeatures: {
          jsx: true,
        },
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
      },
      globals: {
        ...globals.browser,
        process: "readonly"
      },
    },

    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },

    rules: {
      // React Hooks rules
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // React rules
      "react/jsx-uses-react": "off",
      "react/react-in-jsx-scope": "off",

      // Accessibility (plugin:jsx-a11y)
      "jsx-a11y/anchor-is-valid": "warn",

      // BEST PRACTICES (optional but good)
      "no-unused-vars": "warn",
      "no-undef": "error",
    },
  },

  {
    ignores: ["dist", "node_modules"],
  },
];
