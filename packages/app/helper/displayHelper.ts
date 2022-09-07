const tokenNameMapping = {
  "Popcorn (PoS)": "Popcorn",
  "Gelato Uniswap USDC/POP LP": "Arrakis USDC/POP LP",
  "Arrakis Vault V1 USDC/POP": "Arrakis USDC/POP LP",
};

/**
 * DEPRECATED in favor of `contractMetadataOverride.ts`
 * @param tokenName
 * @returns
 */
export const getSanitizedTokenDisplayName = (tokenName: string) => {
  if (Object.keys(tokenNameMapping).includes(tokenName)) {
    return tokenNameMapping[tokenName];
  }
  return tokenName;
};
