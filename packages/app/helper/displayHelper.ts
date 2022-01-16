const tokenNameMapping = {
  'Popcorn (PoS)': 'Popcorn',
  'Gelato Uniswap USDC/POP LP': 'G-UNI USDC/POP LP',
};

export const getSanitizedTokenDisplayName = (tokenName: string) => {
  if (Object.keys(tokenNameMapping).includes(tokenName)) {
    return tokenNameMapping[tokenName];
  }
  return tokenName;
};
