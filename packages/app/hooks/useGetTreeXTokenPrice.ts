import { parseEther } from "@ethersproject/units";
import { IBasicIssuanceModule, ThreeXBatchProcessing } from "@popcorn/hardhat/typechain";
import { ChainId } from "@popcorn/utils/connectors";
import { Address } from "@popcorn/utils/types";
import { BigNumber } from "ethers";
import useBasicIssuanceModule from "@popcorn/app/hooks/set/useBasicIssuanceModule";
import useSWR from "swr";
import useThreeXBatch from "@popcorn/app/hooks/set/useThreeXBatch";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";

async function getTokenPrice(
  basicIssuanceModule: IBasicIssuanceModule,
  threeXBatchProcessing: ThreeXBatchProcessing,
  threeXAdress: Address,
): Promise<BigNumber> {
  return threeXBatchProcessing.valueOfComponents(
    ...(await basicIssuanceModule.getRequiredComponentUnitsForIssue(threeXAdress, parseEther("1"))),
  );
}

export default function useGetThreeXTokenPrice(chainId: ChainId) {
  const { threeXBatch: threeXBatchAddress, setBasicIssuanceModule, threeX } = useDeployment(chainId);

  const threeXBatch = useThreeXBatch(threeXBatchAddress, chainId);
  const basicIssuanceModule = useBasicIssuanceModule(setBasicIssuanceModule, chainId);

  const shouldFetch = threeXBatch && basicIssuanceModule && threeX && chainId;
  return useSWR(shouldFetch ? ["getTokenPrice", threeXBatch, basicIssuanceModule, threeX] : null, async () =>
    getTokenPrice(basicIssuanceModule, threeXBatch, threeX),
  );
}
