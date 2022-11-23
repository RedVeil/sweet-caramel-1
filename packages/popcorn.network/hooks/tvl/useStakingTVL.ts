import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { BigNumber, constants, Contract, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import useSWR, { SWRResponse } from "swr";
import { ChainId, PRC_PROVIDERS } from "web3/connectors";

async function getPopPrice(vaultAddress: string, rpcProvider): Promise<BigNumber> {
  const arrakisVault = new ethers.Contract(vaultAddress, ["function getUnderlyingBalances() external view returns (uint256[2])"], rpcProvider)
  const [usdcAmount, popAmount] = await arrakisVault.getUnderlyingBalances();
  return (usdcAmount.mul(parseEther("1")).div(popAmount)).mul(parseEther("0.000001")) // raise by 1e12 to get to 1e18
};

export async function getStakingTVL(key, popLockerAddress: string, vaultAddress: string, rpcProvider): Promise<BigNumber> {
  const popLocker = new ethers.Contract(popLockerAddress, ["function lockedSupply() external view returns (uint256)"], rpcProvider)
  const popPrice = await getPopPrice(vaultAddress, rpcProvider);
  const totalStake = await popLocker.lockedSupply();
  return totalStake.mul(popPrice).div(constants.WeiPerEther)
}

export default function useStakingTVL(chainId: ChainId, vaultAddress: string, popLockerAddress: string): SWRResponse<BigNumber, Error> {
  return useSWR([`getStakingTVL-${chainId}`, popLockerAddress, vaultAddress, PRC_PROVIDERS[chainId]], getStakingTVL, {
    refreshInterval: 3 * 1000,
    dedupingInterval: 3 * 1000,
  })
} 