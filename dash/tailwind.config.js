// Colours resolve to the tokens in src/app/tokens.css; color-mix keeps opacity modifiers (bg-background/80) working
const token = (name) => `color-mix(in oklab, var(--${name}) calc(<alpha-value> * 100%), transparent)`;

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
	],
	darkMode: ['class'],
	// base.css owns .container
	corePlugins: { container: false },
	theme: {
		extend: {
			colors: {
				background: token('background'),
				foreground: token('foreground'),
				card: { DEFAULT: token('card'), foreground: token('card-foreground') },
				popover: { DEFAULT: token('popover'), foreground: token('popover-foreground') },
				primary: { DEFAULT: token('primary'), foreground: token('primary-foreground') },
				secondary: { DEFAULT: token('secondary'), foreground: token('secondary-foreground') },
				muted: { DEFAULT: token('muted'), foreground: token('muted-foreground') },
				accent: { DEFAULT: token('accent'), foreground: token('accent-foreground') },
				destructive: { DEFAULT: token('destructive'), foreground: token('destructive-foreground') },
				border: token('border'),
				input: token('input'),
				ring: token('ring'),
				paper: { DEFAULT: token('color-paper'), 2: token('color-paper-2'), 3: token('color-paper-3') },
				ink: { DEFAULT: token('color-ink'), 2: token('color-ink-2') },
				rule: { DEFAULT: token('color-rule'), 2: token('color-rule-2') },
				signal: {
					DEFAULT: token('color-accent'),
					deep: token('color-accent-deep'),
					soft: token('color-accent-soft'),
					ink: token('color-accent-ink'),
				},
				focus: token('color-focus'),
				error: token('color-error'),
				success: token('color-success'),
				chart: {
					'1': token('chart-1'),
					'2': token('chart-2'),
					'3': token('chart-3'),
					'4': token('chart-4'),
					'5': token('chart-5'),
				},
				sidebar: {
					DEFAULT: token('sidebar-background'),
					foreground: token('sidebar-foreground'),
					primary: token('sidebar-primary'),
					'primary-foreground': token('sidebar-primary-foreground'),
					accent: token('sidebar-accent'),
					'accent-foreground': token('sidebar-accent-foreground'),
					border: token('sidebar-border'),
					ring: token('sidebar-ring'),
				},
			},
			fontFamily: {
				sans: ['var(--font-body)'],
				display: ['var(--font-display)'],
			},
			borderRadius: {
				lg: 'var(--radius-card)',
				md: 'calc(var(--radius-card) - 4px)',
				sm: 'calc(var(--radius-card) - 8px)',
				pill: 'var(--radius-pill)',
			},
			boxShadow: {
				card: 'var(--shadow-card)',
			},
			transitionTimingFunction: {
				out: 'var(--ease-out)',
			},
			transitionDuration: {
				micro: 'var(--dur-micro)',
				short: 'var(--dur-short)',
			},
		},
	},
	plugins: [require('tailwindcss-animate')],
};
