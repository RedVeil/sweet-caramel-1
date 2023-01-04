export const isGrantsSupportedOnCurrentNetwork = (chainId: number) => {
  const butterSupportedChains = [137, 5, 31337, 1337];
  return butterSupportedChains.includes(chainId);
};
