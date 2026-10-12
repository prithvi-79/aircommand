/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Notion Primary & Brand
        primary: {
          DEFAULT: "#5645d4",
          pressed: "#4534b3",
          deep: "#3a2a99",
          on: "#ffffff",
        },
        navy: {
          DEFAULT: "#0a1530",
          deep: "#070f24",
          mid: "#1a2a52",
        },
        "link-blue": {
          DEFAULT: "#0075de",
          pressed: "#005bab",
        },
        // Notion Brand Spectrum
        brand: {
          orange: "#dd5b00",
          "orange-deep": "#793400",
          pink: "#ff64c8",
          "pink-deep": "#a02e6d",
          purple: "#7b3ff2",
          "purple-300": "#d6b6f6",
          "purple-800": "#391c57",
          teal: "#2a9d99",
          green: "#1aae39",
          yellow: "#f5d75e",
          brown: "#523410",
        },
        // Notion Pastel Card Tints
        tint: {
          peach: "#ffe8d4",
          rose: "#fde0ec",
          mint: "#d9f3e1",
          lavender: "#e6e0f5",
          sky: "#dcecfa",
          yellow: "#fef7d6",
          "yellow-bold": "#f9e79f",
          cream: "#f8f5e8",
          gray: "#f0eeec",
        },
        // Notion Surfaces & Borders
        canvas: "#ffffff",
        surface: {
          DEFAULT: "#f6f5f4",
          soft: "#fafaf9",
        },
        hairline: {
          DEFAULT: "#e5e3df",
          soft: "#ede9e4",
          strong: "#c8c4be",
        },
        // Notion Typography Inks
        ink: {
          deep: "#000000",
          DEFAULT: "#1a1a1a",
          charcoal: "#37352f",
          slate: "#5d5b54",
          steel: "#787671",
          stone: "#a4a097",
          muted: "#bbb8b1",
        },
        // Dark Context
        "on-dark": {
          DEFAULT: "#ffffff",
          muted: "#a4a097",
        },
        // Semantic
        semantic: {
          success: "#1aae39",
          warning: "#dd5b00",
          error: "#e03131",
        },
      },
      fontFamily: {
        sans: [
          "Notion Sans",
          "Inter",
          "-apple-system",
          "system-ui",
          "Segoe UI",
          "Roboto",
          "Helvetica",
          "sans-serif",
        ],
        mono: [
          "JetBrains Mono",
          "SFMono-Regular",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
      borderRadius: {
        xs: "4px",
        sm: "6px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        xxl: "20px",
        xxxl: "24px",
      },
      boxShadow: {
        subtle: "rgba(15, 15, 15, 0.04) 0px 1px 2px 0px",
        card: "rgba(15, 15, 15, 0.08) 0px 4px 12px 0px",
        mockup: "rgba(15, 15, 15, 0.20) 0px 24px 48px -8px",
        modal: "rgba(15, 15, 15, 0.16) 0px 16px 48px -8px",
      },
      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        xxl: "32px",
        xxxl: "40px",
        "section-sm": "48px",
        section: "64px",
        "section-lg": "96px",
        hero: "120px",
      },
    },
  },
  plugins: [],
};
