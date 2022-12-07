const { url } = require('inspector');
const colors = require('tailwindcss/colors')

module.exports = {
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './containers/**/*.{js,ts,jsx,tsx}',
    "../components/components/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {

    screens: {
      'sm': '640px',
      // => @media (min-width: 640px) { ... }

      'md': '768px',
      // => @media (min-width: 768px) { ... }

      'lg': '1024px',
      // => @media (min-width: 1024px) { ... }

      'laptop': '1440px',
      // => @media (min-width: 1440px) { ... }

      'xl': '1920px',
      // => @media (min-width: 1920px) { ... }

      '2xl': '2560px',
      // => @media (min-width: 2560px) { ... }
    },
    extend: {
      spacing: {
        18: '4.5rem',
        72: '18rem',
        76: '19rem',
        84: '21rem',
        96: '24rem',
        100: '25.5rem',
        104: '27rem',
        112: '30rem',
        128: '40rem',
        129: '52rem',
      },
      lineHeight: {
        button: '32px',
        '10.5': '2.75rem',
        '11': '3rem',
        '12': '3.5rem',
        '13': '4rem',
        '14': '4.5rem',
        '15': '6rem',
      },
      width: {
        'fit-content': 'fit-content'
      },
      scale: {
        101: '1.01',
        102: '1.02',
      },
      rotate: {
        '-30': '-30deg',
      },
      colors: {

        // New Design Colors
        primary: '#645F4B',
        primaryLight: "#A5A08C",
        primaryDark: "#555555",
        secondary: "#B72E73",

        warmGray: '#EBE7D4',
        customPeach: "#FFF8EE",
        customYellow: '#FEE25D',
        customPale: '#DFDAC7',
        customRed: '#FA5A6E',
        customGreen: '#05BE64',
        customLightGreen: '#78E69B',
        customPurpleLight: "#C391FF",
        customPurple: '#9B55FF',
        customPurpleDark: '#5F329B',
        customDarkGray: '#1F2937',
        customLightGray: '#D7D7D7',

        // Old Design Colors
        inactiveYellow: '#FFF5CF',
        activeYellow: '#FFDC38',

        ctaYellow: '#EBE7D4',
        ctaYellowLight: '#FFD324',

        startPopupGradient: '#F9A058',
        endPopupGradient: '#FDEAA7',
      },
      backgroundImage: (theme) => ({
        'bg-gradient': "url('/images/bgGradient.svg')",
        'header-team': "url('/images/bgHeaderTeam.svg')",
        'hero-pattern': "url('/images/bgHero.svg')",
        'impact-pattern': "url('/images/bgImpact.svg')",
        'countdown-pattern': "url('/images/bgCountdown.svg')",
        'countdown-pattern-mobile': "url('/images/bgFooterMobile.svg')",
        'popcorn1-pattern': "url('/images/bgPopcorn1.svg')",
        'popcorn2-pattern': "url('/images/bgPopcorn2.svg')",
        'popcorn3-pattern': "url('/images/bgPopcorn3.svg')",
        'our-partners': "url('/images/ourpartnersbg.svg')",
        'as-seen-in': "url('/images/asseeninbg.svg')",
      }),
      fontFamily: {
        landing: ['KH Teka', 'sans-serif'],
      },
      borderRadius: {
        '4xl': '2rem',
      },
      fontSize: {
        zero: "0rem",
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
      letterSpacing: {
        1: '1px'
      },
      boxShadow: {
        'custom': '0px -20px 25px -5px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  variants: {
    extend: { opacity: ['disabled'] },
  },
  plugins: [],
};
