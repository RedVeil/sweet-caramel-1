import { BigNumber } from "ethers/lib/ethers";
import { isAddress } from "ethers/lib/utils";
import { useCallback, useMemo } from "react";
import { MockCurveThreepool__factory } from "../../hardhat/typechain/factories/MockCurveThreepool__factory";
import useWeb3 from "./useWeb3";

export default function useThreeCurveVirtualPrice(threePoolAddress: string | undefined) {
  const { signerOrProvider, account, chainId } = useWeb3();

  const threePool = useMemo(
    () =>
      threePoolAddress && isAddress(threePoolAddress) && !!signerOrProvider
        ? MockCurveThreepool__factory.connect(threePoolAddress, signerOrProvider)
        : undefined,
    [threePoolAddress, signerOrProvider, account, chainId],
  );

  return useCallback(async (): Promise<BigNumber | null> => {
    if (!isAddress(threePoolAddress)) {
      return null;
    }
    if ((await threePool.provider.getNetwork()).chainId !== chainId) {
      return null;
    }
    return await threePool.get_virtual_price();
  }, [chainId, threePoolAddress]);
}
