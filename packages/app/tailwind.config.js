module.exports = {
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './containers/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      xs: '440px',
      // => @media (min-"440px) { ... }

      sm: '640px',
      // => @media (min-"640px) { ... }

      smmd: '700px',

      md: '768px',
      // => @media (min-"768px) { ... }

      lg: '1024px',
      // => @media (min-"1024px) { ... }

      smlaptop: '1200px',
      // => @media (min-"1440px) { ... }

      laptop: '1440px',
      // => @media (min-"1440px) { ... }

      lglaptop: '1680px',
      // => @media (min-"1440px) { ... }

      xl: '1920px',
      // => @media (min-"1920px) { ... }

      '2xl': '2560px',
      // => @media (min-"2560px) { ... }
    },
    extend: {
      boxShadow: {
        custom: '0 4px 14px rgba(101, 135, 169, 0.11)',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
        '6xl': '3rem',
      },
      borderWidth: {
        3: '3px',
      },
      borderWidth: {
        3: '3px',
      },
      spacing: {
        18: '4.5rem',
        72: '18rem',
        84: '21rem',
        88: '22rem',
        92: '23rem',
        96: '24rem',
        100: '25rem',
        104: '27rem',
        108: '28rem',
        110: '29.5rem',
        112: '30rem',
        114: '30.5rem',
        116: '31rem',
        120: '32rem',
        124: '33rem',
        128: '34rem',
      },
      height: {
        '1/12': '8.333333%',
        '2/12': '16.666667%',
        '3/12': '25%',
        '4/12': '33.333333%',
        '5/12': '41.666667%',
        '6/12': '50%',
        '7/12': '58.333333%',
        '8/12': '66.666667',
        '9/12': '75%',
        '10/12': '83.333333%',
        '11/12': '91.666667%',
      },
      minHeight: { 128: '34rem', 256: '68rem' },
      lineHeight: {
        button: '32px',
      },
      scale: {
        101: '1.01',
        102: '1.02',
        103: '1.03',
      },
      colors: {
        primary: '#F28705',
        primaryLight: '#FDEAA7',
        primaryDark: '#BF4904',

        secondary: '#B72E73',
        secondaryLight: '#D5264E',
        secondaryDark: '#8739B0',

        ctaYellow: '#F6CB22',
        ctaYellowLight: '#FFD324',

        light: '#FFF5D1',
        cardBg: '#F3F8FF',

        rewardsBg: '#FFFBEA',
        rewardsBg2: '#FFF6CF',
      },
      backgroundImage: (theme) => ({
        'hero-pattern': "url('/images/popcorn_playing.gif')",
      }),
      animation: { 'spin-slow': 'spin 3s linear infinite' },
      fontFamily: {
        avenir: ["'Avenir LT Pro'", 'sans-serif'],
      },
    },
  },
  variants: {
    extend: {
      opacity: ['disabled'],
      backgroundColor: ['disabled'],
      cursor: ['disabled'],
    },
    backdropBlur: ['hover', 'focus'],
  },
  plugins: [require('@tailwindcss/forms')],
};
