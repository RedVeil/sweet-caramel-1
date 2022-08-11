import { Web3Provider } from "@ethersproject/providers";
import { getChainRelevantContracts } from "@popcorn/hardhat/lib/utils/getContractAddresses";
import { ChainId, PRC_PROVIDERS } from "@popcorn/utils";
import { useWeb3React } from "@web3-react/core";
import { BigNumber, constants, Contract, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import useGetPopTokenPriceInUSD, { getPopTokenPrice } from "hooks/useGetPopTokenPriceInUSD";
import useSWR, { SWRResponse } from "swr";

async function getStakingTVL(key, popLockerAddress: string, rpcProvider): Promise<BigNumber> {
  const popLocker = new ethers.Contract(popLockerAddress, ["function lockedSupply() external view returns (uint256)"], rpcProvider)
  const popPrice = (await getPopTokenPrice(PRC_PROVIDERS[ChainId.Ethereum], getChainRelevantContracts(ChainId.Ethereum).popUsdcLp)).mul(parseEther("0.000001")) // raise by 1e12
  const totalStake = await popLocker.lockedSupply();
  return totalStake.mul(popPrice).div(constants.WeiPerEther)
}

export default function useStakingTVL(chainId: ChainId): SWRResponse<BigNumber, Error> {
  return useSWR([`getStakingTVL-${chainId}`, getChainRelevantContracts(chainId).popStaking, PRC_PROVIDERS[chainId]], getStakingTVL, {
    refreshInterval: 3 * 1000,
    dedupingInterval: 3 * 1000,
  })
} 