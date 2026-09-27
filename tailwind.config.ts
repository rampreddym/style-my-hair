import type { Config } from "tailwindcss";

const withAlpha = (token: string) => `hsl(var(--${token}) / <alpha-value>)`;

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem", screens: { "2xl": "1400px" } },
    extend: {
      colors: {
        background: withAlpha("background"), foreground: withAlpha("foreground"),
        card: { DEFAULT: withAlpha("card"), foreground: withAlpha("card-foreground") },
        popover: { DEFAULT: withAlpha("popover"), foreground: withAlpha("popover-foreground") },
        primary: { DEFAULT: withAlpha("primary"), foreground: withAlpha("primary-foreground") },
        secondary: { DEFAULT: withAlpha("secondary"), foreground: withAlpha("secondary-foreground") },
        muted: { DEFAULT: withAlpha("muted"), foreground: withAlpha("muted-foreground") },
        accent: { DEFAULT: withAlpha("accent"), foreground: withAlpha("accent-foreground") },
        destructive: { DEFAULT: withAlpha("destructive"), foreground: withAlpha("destructive-foreground") },
        border: withAlpha("border"), input: withAlpha("input"), ring: withAlpha("ring"),
        brand: { DEFAULT: withAlpha("brand"), fill: withAlpha("brand-fill"), foreground: withAlpha("brand-foreground") },
        vapor: withAlpha("vapor"), warn: withAlpha("warn"), ok: withAlpha("ok"),
        surface2: withAlpha("surface-2"), hairline: { DEFAULT: withAlpha("hairline"), strong: withAlpha("hairline-strong") }, dim: withAlpha("dim"),
        success: { DEFAULT: withAlpha("ok"), foreground: withAlpha("background") },
        warning: { DEFAULT: withAlpha("warn"), foreground: withAlpha("background") },
        info: { DEFAULT: withAlpha("brand"), foreground: withAlpha("brand-foreground") },
        gold: { DEFAULT: withAlpha("warn"), foreground: withAlpha("background") },
        sidebar: { DEFAULT: withAlpha("sidebar-background"), foreground: withAlpha("sidebar-foreground"), primary: withAlpha("sidebar-primary"), "primary-foreground": withAlpha("sidebar-primary-foreground"), accent: withAlpha("sidebar-accent"), "accent-foreground": withAlpha("sidebar-accent-foreground"), border: withAlpha("sidebar-border"), ring: withAlpha("sidebar-ring") },
      },
      fontFamily: { display: ["DM Serif Display", "Georgia", "Times New Roman", "serif"], sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      borderRadius: { control: "var(--radius)", card: "var(--radius-card)", sheet: "var(--radius-sheet)", pill: "999px", lg: "var(--radius)", md: "var(--radius)", sm: "8px" },
      spacing: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "20px", 6: "24px", 8: "32px", 12: "48px" },
      boxShadow: { e1: "var(--e1)", e2: "var(--e2)", e3: "var(--e3)", soft: "var(--e1)", card: "var(--e1)", elevated: "var(--e3)", "glow-primary": "var(--e2)", "glow-accent": "var(--e2)" },
      transitionTimingFunction: { out: "var(--ease-out)" },
      transitionDuration: { press: "120ms", snappy: "220ms", smooth: "300ms" },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0", transform: "translateY(8px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { from: { opacity: "0", transform: "scale(.98)" }, to: { opacity: "1", transform: "scale(1)" } },
        "slide-up": { from: { opacity: "0", transform: "translateY(16px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { from: { opacity: "0", transform: "translateX(16px)" }, to: { opacity: "1", transform: "translateX(0)" } },
      },
      animation: { "accordion-down": "accordion-down 220ms var(--ease-out)", "accordion-up": "accordion-up 150ms var(--ease-out)", "fade-in": "fade-in 300ms var(--ease-out)", "scale-in": "scale-in 220ms var(--ease-out)", "slide-up": "slide-up 300ms var(--ease-out)", "slide-in-right": "slide-in-right 220ms var(--ease-out)" },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;