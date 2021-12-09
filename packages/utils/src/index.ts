export { capitalize } from './capitalize';
export {
  bigNumberToNumber,
  formatAndRoundBigNumber,
  numberToBigNumber,
  scaleNumberToBigNumber,
} from './formatBigNumber';
export { default as getBalances } from './getBalances';
export type { ContractsWithBalance, TokenBalances } from './getBalances';
export {
  calculateAPY,
  getSingleStakingPoolInfo,
  getStakingPoolsInfo,
  getEarned,
} from './getStakingStats';
export type { StakingPoolInfo } from './getStakingStats';
export {
  getBytes32FromIpfsHash,
  getIpfsHashFromBytes32,
} from './ipfsHashManipulation';
export { switchNetwork, getChainLogo } from './networkSwitch';
export { default as useFetch } from './useFetch';
export { getERC20Contract } from './contractHelpers'
