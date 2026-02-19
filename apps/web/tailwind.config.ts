import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
		"../../packages/ui/src/**/*.{ts,tsx}",
		"*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
				display: ["Kraftig", "system-ui", "serif"],
				"display-book": ["Kraftig-Buch", "system-ui", "serif"],
			},
			letterSpacing: {
				tighter: "-0.02em",
				tight: "-0.01em",
			},
		},
	},
	plugins: [],
} satisfies Config;

export default config;
