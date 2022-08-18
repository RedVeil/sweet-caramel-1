module.exports = {
  mocha: {
    grep: "@skip-on-coverage", // Find everything with this tag
    invert: true, // Run the grep's inverse set.
  },
  skipFiles: [
    "core/defi/pool/AffiliateToken.sol",
    "test_helpers/",
    "mocks/",
    "externals/",
    "test_helpers/",
    "core/interfaces/",
    "core/libraries/",
    "lbp/",
    "core/utils/RandomNumberConsumer.sol",
  ],
};
