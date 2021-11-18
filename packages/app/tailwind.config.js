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

      md: '768px',
      // => @media (min-width: 768px) { ... }

      lg: '1024px',
      // => @media (min-width: 1024px) { ... }

      smlaptop: '1200px',
      // => @media (min-width: 1440px) { ... }

      laptop: '1440px',
      // => @media (min-width: 1440px) { ... }

      xl: '1920px',
      // => @media (min-width: 1920px) { ... }

      '2xl': '2560px',
      // => @media (min-width: 2560px) { ... }
    },
    extend: {
      dropShadow: {
        '3xl': '0 25px 25px rgba(0, 0, 0, 0.25)',
      },
      spacing: {
        18: '4.5rem',
        72: '18rem',
        84: '21rem',
        96: '24rem',
        100: '25.5rem',
        101: '600px',
        104: '27rem',
        112: '30rem',
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
      },
      backgroundImage: (theme) => ({
        'hero-pattern': "url('/images/popcorn_playing.gif')",
      }),
      fontFamily: {
        landing: ['Avenir Next LT Pro', 'sans-serif'],
      },
    },
  },
  variants: {
    extend: { opacity: ['disabled'] },
  },
  plugins: [require('@tailwindcss/forms')],
};
