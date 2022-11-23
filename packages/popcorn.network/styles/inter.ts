const path = '/fonts/Inter/inter-v2-latin-';


const Inter = (weight: any) => {
  return {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontDisplay: 'swap',
    fontWeight: weight,
    src: `
      local(''),
      url(${path + weight}.woff2) format('woff2')
    `,
  };
};

export default [
  Inter(200),
  Inter(300),
  Inter(400),
  Inter(500),
  Inter(600),
];