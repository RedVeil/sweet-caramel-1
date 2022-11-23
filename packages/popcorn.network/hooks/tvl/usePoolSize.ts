import { Web3Provider } from "@ethersproject/providers";
import { useWeb3React } from "@web3-react/core";
import { BigNumber, constants, Contract, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import useSWR, { SWRResponse } from "swr";
import { ChainId, PRC_PROVIDERS } from "web3/connectors";


export async function getPoolSize(key,vaultAddress: string, rpcProvider): Promise<BigNumber> {
  const arrakisVault = new ethers.Contract(vaultAddress, ["function getUnderlyingBalances() external view returns (uint256[2])"], rpcProvider)
  const [usdcAmount, popAmount] = await arrakisVault.getUnderlyingBalances();
  const popPrice = usdcAmount.mul(parseEther("1")).div(popAmount);
  return ((popPrice.mul(popAmount).div(constants.WeiPerEther)).add(usdcAmount)).mul(parseEther("0.000001")) // raise by 1e12 to get to 1e18
}

export default function usePoolSize(chainId: ChainId, vaultAddress: string): SWRResponse<BigNumber, Error> {
  return useSWR([`getPoolSize-${chainId}`, vaultAddress, PRC_PROVIDERS[chainId]], getPoolSize, {
    refreshInterval: 3 * 1000,
    dedupingInterval: 3 * 1000,
  })
} 