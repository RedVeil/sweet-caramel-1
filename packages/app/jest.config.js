const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

const customJestConfig = {
  testEnvironment: 'jest-environment-jsdom',
  /* rootDir: "./", */
  collectCoverageFrom: [
    '**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testPathIgnorePatterns: ['/node_modules/', '/.next/', '/dist/'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  moduleDirectories: ['node_modules', 'components', 'context', 'helper', 'hooks', 'pages'],
  moduleNameMapper: {
    "^components\/(.*)$": "<rootDir>/components/$1",
    "^hooks\/(.*)$": "<rootDir>/hooks/$1",
    "^context\/(.*)$": "<rootDir>/context/$1",
    "^helper\/(.*)$": "<rootDir>/helper/$1",
    "^@popcorn/ui\/(.*)$": "<rootDir>/../ui/src",
    "^@popcorn/utils\/(.*)$": "<rootDir>/../utils",
    "^@popcorn/hardhat\/(.*)$": "<rootDir>/../hardhat",
    /*   "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "<rootDir>/__mocks__/fileMock.js",
      "\\.(css|less)$": "<rootDir>/__mocks__/styleMock.js" */
  },
  /*   transform: {
      '^.+\\.[tj]sx?$': 'babel-jest',
    }, */
  /*   transformIgnorePatterns: [
      "/node_modules/(?![@autofiy/autofiyable|@autofiy/property]).+\\.js$",
      "/node_modules/(?![@autofiy/autofiyable|@autofiy/property]).+\\.ts$",
      "/node_modules/(?![@autofiy/autofiyable|@autofiy/property]).+\\.tsx$",
    ], */
};

module.exports = createJestConfig(customJestConfig)
