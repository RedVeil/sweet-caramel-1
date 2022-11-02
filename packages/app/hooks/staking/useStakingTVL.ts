import { ChainId } from "@popcorn/utils";
import { BigNumber, constants, ethers } from "ethers";
import { parseEther } from "ethers/lib/utils";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { getPopTokenPrice } from "@popcorn/app/hooks/useGetPopTokenPriceInUSD";
import useSWR, { SWRResponse } from "swr";
import { ContractAddresses } from "@popcorn/utils/src/types/index";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";

export async function getStakingTVL(
  key,
  popLockerAddress: string,
  rpcProvider,
  addresses: ContractAddresses,
): Promise<BigNumber> {
  const popLocker = new ethers.Contract(
    popLockerAddress,
    ["function lockedSupply() external view returns (uint256)"],
    rpcProvider,
  );
  const popPrice = (await getPopTokenPrice(rpcProvider, addresses.popUsdcArrakisVault)).mul(parseEther("0.000001")); // raise by 1e12
  const totalStake = await popLocker.lockedSupply();
  return totalStake.mul(popPrice).div(constants.WeiPerEther);
}

export default function useStakingTVL(chainId: ChainId): SWRResponse<BigNumber, Error> {
  const addresses = useDeployment(chainId);
  const rpcProvider = useRpcProvider(chainId);
  return useSWR([`getStakingTVL-${chainId}`, addresses.popStaking, rpcProvider, addresses], getStakingTVL, {
    refreshInterval: 3 * 1000,
    dedupingInterval: 3 * 1000,
  });
}
