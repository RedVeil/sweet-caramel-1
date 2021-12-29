module.exports = {
  purge: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './containers/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: false, // or 'media' or 'class'
  theme: {
    screens: {
      sm: '640px',
      // => @media (min-width: 640px) { ... }

      smmd: '700px',

      md: '768px',
      // => @media (min-width: 768px) { ... }

      lg: '1024px',
      // => @media (min-width: 1024px) { ... }

      smlaptop: '1200px',
      // => @media (min-width: 1440px) { ... }

      laptop: '1440px',
      // => @media (min-width: 1440px) { ... }

      lglaptop: '1680px',
      // => @media (min-width: 1440px) { ... }

      xl: '1920px',
      // => @media (min-width: 1920px) { ... }

      '2xl': '2560px',
      // => @media (min-width: 2560px) { ... }
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
      spacing: {
        18: '4.5rem',
        72: '18rem',
        84: '21rem',
        96: '24rem',
        100: '25.5rem',
        101: '600px',
        104: '27rem',
        105: '564px',
        112: '30rem',
        124: '33rem',
        128: '40rem',
        129: '52rem',
        130: '752px',
      },
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

        rewardsBg: '#FFF5CF',
        rewardsBg2: '#F9EEC8',
      },
      backgroundImage: (theme) => ({
        'hero-pattern': "url('/images/popcorn_playing.gif')",
      }),
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
