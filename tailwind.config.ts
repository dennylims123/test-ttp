import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
    darkMode: "class",
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
        extend: {
                colors: {
                        background: 'hsl(var(--background))',
                        foreground: 'hsl(var(--foreground))',
                        card: {
                                DEFAULT: 'hsl(var(--card))',
                                foreground: 'hsl(var(--card-foreground))'
                        },
                        popover: {
                                DEFAULT: 'hsl(var(--popover))',
                                foreground: 'hsl(var(--popover-foreground))'
                        },
                        primary: {
                                DEFAULT: 'hsl(var(--primary))',
                                foreground: 'hsl(var(--primary-foreground))'
                        },
                        secondary: {
                                DEFAULT: 'hsl(var(--secondary))',
                                foreground: 'hsl(var(--secondary-foreground))'
                        },
                        muted: {
                                DEFAULT: 'hsl(var(--muted))',
                                foreground: 'hsl(var(--muted-foreground))'
                        },
                        accent: {
                                DEFAULT: 'hsl(var(--accent))',
                                foreground: 'hsl(var(--accent-foreground))'
                        },
                        destructive: {
                                DEFAULT: 'hsl(var(--destructive))',
                                foreground: 'hsl(var(--destructive-foreground))'
                        },
                        border: 'hsl(var(--border))',
                        input: 'hsl(var(--input))',
                        ring: 'hsl(var(--ring))',
                        chart: {
                                '1': 'hsl(var(--chart-1))',
                                '2': 'hsl(var(--chart-2))',
                                '3': 'hsl(var(--chart-3))',
                                '4': 'hsl(var(--chart-4))',
                                '5': 'hsl(var(--chart-5))'
                        },
                        // Permata Group brand colors
                        permata: {
                                'deep-teal': '#083838',
                                'teal': '#004c55',
                                'teal-light': '#084858',
                                'accent': '#40a338',
                                'forest': '#1b7054',
                                'forest-dark': '#0d3d2f',
                                'green-light': '#f0fdf4',
                                'teal-light-bg': '#edf7f8',
                                'green-soft': '#e8f8e8',
                                'green-mist': '#edf8f2',
                                'subtitle': '#4b6c66',
                                'body': '#374151',
                                'topbar-start': '#083838',
                                'topbar-end': '#084858',
                        }
                },
                borderRadius: {
                        lg: 'var(--radius)',
                        md: 'calc(var(--radius) - 2px)',
                        sm: 'calc(var(--radius) - 4px)'
                },
                fontFamily: {
                        sans: ['var(--font-aptos)', 'system-ui', 'Arial', 'sans-serif'],
                        display: ['var(--font-aptos-display)', 'var(--font-aptos)', 'system-ui', 'sans-serif'],
                },
                backgroundImage: {
                        'permata-topbar': 'linear-gradient(90deg, #083838 0%, #084858 100%)',
                        'permata-accent-line': 'linear-gradient(90deg, #0d3d2f, #1b7054, #40a338)',
                        'permata-gradient': 'linear-gradient(135deg, #0d3d2f 0%, #1b7054 50%, #40a338 100%)',
                }
        }
  },
  plugins: [tailwindcssAnimate],
};
export default config;
