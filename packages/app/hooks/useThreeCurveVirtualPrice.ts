import { useWeb3React } from "@web3-react/core";
import { BigNumber } from "ethers/lib/ethers";
import { isAddress } from "ethers/lib/utils";
import { useCallback, useMemo } from "react";
import { MockCurveThreepool__factory } from "../../hardhat/typechain/factories/MockCurveThreepool__factory";

export default function useThreeCurveVirtualPrice(threePoolAddress: string | undefined) {
  const { library, account, chainId } = useWeb3React();

  const threePool = useMemo(
    () =>
      threePoolAddress && isAddress(threePoolAddress) && !!library
        ? MockCurveThreepool__factory.connect(threePoolAddress, library)
        : undefined,
    [threePoolAddress, library, account, chainId],
  );

  return useCallback(async (): Promise<BigNumber | null> => {
    if (!isAddress(threePoolAddress)) {
      return null;
    }
    if ((await threePool.provider.getNetwork()).chainId !== chainId) {
      return null;
    }
    return await threePool.get_virtual_price();
  }, [library, account, chainId, threePoolAddress]);
}
