const colors = require("tailwindcss/colors");

module.exports = {
	content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}", "./containers/**/*.{js,ts,jsx,tsx}"],
	theme: {
		screens: {
			xs: "440px",
			// => @media (min-"440px) { ... }

			sm: "640px",
			// => @media (min-"640px) { ... }

			smmd: "700px",

			md: "1024px",
			// => @media (min-"1024px) { ... }

			smlaptop: "1200px",
			// => @media (min-"1440px) { ... }

			laptop: "1440px",
			// => @media (min-"1440px) { ... }

			lglaptop: "1680px",
			// => @media (min-"1440px) { ... }

			xl: "1920px",
			// => @media (min-"1920px) { ... }

			"2xl": "2560px",
			// => @media (min-"2560px) { ... }
		},
		extend: {
			boxShadow: {
				custom: "0 4px 14px rgba(101, 135, 169, 0.11)",
			},
			borderRadius: {
				"4xl": "2rem",
				"5xl": "2.5rem",
				"6xl": "3rem",
			},
			borderWidth: {
				3: "3px",
			},
			borderWidth: {
				3: "3px",
			},
			spacing: {
				18: "4.5rem",
				72: "18rem",
				84: "21rem",
				88: "22rem",
				92: "23rem",
				96: "24rem",
				100: "25rem",
				104: "27rem",
				108: "28rem",
				110: "29.5rem",
				112: "30rem",
				114: "30.5rem",
				116: "31rem",
				120: "32rem",
				124: "33rem",
				128: "34rem",
			},
			height: {
				"1/12": "8.333333%",
				"2/12": "16.666667%",
				"3/12": "25%",
				"4/12": "33.333333%",
				"5/12": "41.666667%",
				"6/12": "50%",
				"7/12": "58.333333%",
				"8/12": "66.666667",
				"9/12": "75%",
				"10/12": "83.333333%",
				"11/12": "91.666667%",
			},
			minHeight: { 128: "34rem", 256: "68rem" },
			lineHeight: {
				button: "32px",
				'10.5': '2.75rem',
				'11': '3rem',
				'12': '3.5rem',
				'13': '4rem',
				'14': '4.5rem',
				'15': '6rem',
			},
			scale: {
				101: "1.01",
				102: "1.02",
				103: "1.03",
			},
			colors: {
				primary: '#645F4B',
				primaryLight: "#A5A08C",
				primaryDark: "#555555",

				secondary: "#B72E73",
				secondaryLight: "#D5264E",
				secondaryDark: "#8739B0",

				ctaYellow: '#EBE7D4',
				ctaYellowLight: "#FFD324",

				light: "#C8C8C8",
				cardBg: "#F3F8FF",

				rewardsBg: "#FFFBEA",
				rewardsBg2: "#FFF6CF",

				green: colors.emerald,
				yellow: colors.amber,
				purple: colors.violet,

				peach: "#FFF8EE",
				cream: '#EBE7D4',
				customYellow: '#FEE25D',
				customPale: '#DFDAC7',
				customRed: '#FA5A6E',
				customGreen: '#05BE64',
				customLightGreen: '#78E69B',
				customPurple: '#9B55FF',
				customDarkGray: '#1F2937',
				customLightGray: '#969696',
				dropdownBorder: '#D7D7D7',
			},
			fontSize: {
				'xs': '.75rem',
				'sm': '.875rem',
				'tiny': '.875rem',
				'base': '1rem',
				'lg': '1.125rem',
				'xl': '1.25rem',
				'2xl': '1.5rem',
				'3xl': '2rem',
				'4xl': '2.5rem',
				'5xl': '3rem',
				'6xl': '3.5rem',
				'7xl': '4rem',
				'8xl': '4.5rem',
				'9xl': '6rem',
				'10xl': '8rem',
			},
			backgroundImage: (theme) => ({
				"hero-pattern": "url('/images/popcorn_playing.gif')",
			}),
			animation: { "spin-slow": "spin 3s linear infinite" },
			fontFamily: {
				khTeka: ["'KH Teka'", "sans-serif"],
			},
		},
	},
	plugins: [require("@tailwindcss/forms")],
};
