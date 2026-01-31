import { type Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

export default {
  darkMode: ["class"],
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", ...fontFamily.sans],
        serif: ["var(--font-lora)", ...fontFamily.serif],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        "near-black": "#060202",
        "off-white": "#EBDCDA",
        "primary-yellow": "#FFD700",
        "muted-yellow": "#D4AF37",
        "dark-primary": "#060202",
        "light-secondary": "#EBDCDA",
        "accent-vibrant": "#FFD700",
        "accent-muted": "#D4AF37",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      typography: ({ theme }: { theme: any }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-headings": "inherit",
            "--tw-prose-body": "inherit",
            "--tw-prose-bold": "inherit",
            "--tw-prose-quotes": "inherit",
            "--tw-prose-quote-borders": theme("colors.gray[300]"),
            "--tw-prose-counters": "inherit",
            "--tw-prose-bullets": "inherit",
            "--tw-prose-hr": theme("colors.gray[200]"),
            "--tw-prose-links": "inherit",
            // Dark mode
            "--tw-prose-invert-headings": "inherit",
            "--tw-prose-invert-body": "inherit",
            "--tw-prose-invert-bold": "inherit",
            "--tw-prose-invert-quotes": "inherit",
            "--tw-prose-invert-quote-borders": theme("colors.gray[700]"),
            "--tw-prose-invert-counters": "inherit",
            "--tw-prose-invert-bullets": "inherit",
            "--tw-prose-invert-hr": theme("colors.gray[800]"),
            "--tw-prose-invert-links": "inherit",
            // Headers
            h1: {
              color: "inherit",
            },
            h2: {
              color: "inherit",
            },
            h3: {
              color: "inherit",
            },
            h4: {
              color: "inherit",
            },
            // Make sure all text inherits the text-foreground color
            "h1, h2, h3, h4, h5, h6, p, li, strong, em": {
              color: "inherit",
            },
          },
        },
      }),
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.22, 1, 0.36, 1)",
        "ease-out-quart": "cubic-bezier(0.5, 0, 0, 1)",
      },
      keyframes: {
        "float-up": {
          "0%": {
            opacity: "0",
            transform: "translateY(0)",
          },
          "20%": {
            opacity: "1",
          },
          "80%": {
            opacity: "1",
          },
          "100%": {
            opacity: "0",
            transform: "translateY(-100px)",
          },
        },
      },
      animation: {
        "float-up": "float-up 1s ease-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
