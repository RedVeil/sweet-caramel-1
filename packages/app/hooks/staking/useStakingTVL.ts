import useTokenPrices from "@popcorn/app/hooks/tokens/useTokenPrices";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";
import { useRpcProvider } from "@popcorn/app/hooks/useRpcProvider";
import { ChainId } from "@popcorn/utils";
import { BigNumber, constants, ethers } from "ethers";
import useSWR, { SWRResponse } from "swr";

export async function getStakingTVL(
  _key,
  popLockerAddress: string,
  rpcProvider,
  popPrice: BigNumber,
): Promise<BigNumber> {
  const popLocker = new ethers.Contract(
    popLockerAddress,
    ["function lockedSupply() external view returns (uint256)"],
    rpcProvider,
  );
  const totalStake = await popLocker.lockedSupply();
  return totalStake.mul(popPrice).div(constants.WeiPerEther);
}

export default function useStakingTVL(chainId: ChainId): SWRResponse<BigNumber, Error> {
  const addresses = useDeployment(chainId);
  const rpcProvider = useRpcProvider(chainId);

  const { pop } = useDeployment(ChainId.Ethereum);
  const { data: priceData } = useTokenPrices([pop], ChainId.Ethereum);

  return useSWR([`getStakingTVL-${chainId}`, addresses.popStaking, rpcProvider, priceData?.[pop]], getStakingTVL, {
    refreshInterval: 3 * 1000,
    dedupingInterval: 3 * 1000,
  });
}
