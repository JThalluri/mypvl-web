module.exports = [
  {
    ignores: [
      "node_modules/**",
      "build/**",
      "dist/**",
      "android-app/**",
      "js/**",
      "css/**",
      "*.min.js"
    ]
  },
  {
    files: ["shared/scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        sessionStorage: "readonly",
        getComputedStyle: "readonly",
        Element: "readonly",
        IntersectionObserver: "readonly"
      }
    },
    rules: {
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: "error",
      curly: ["error", "all"],
      semi: ["error", "always"],
      quotes: ["error", "double", { "avoidEscape": true }],
      "no-unused-vars": ["warn", { "args": "none" }],
      "no-undef": "error"
    }
  }
];
