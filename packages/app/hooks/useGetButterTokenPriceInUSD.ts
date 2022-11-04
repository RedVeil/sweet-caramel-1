import { parseEther } from "@ethersproject/units";
import { ButterBatchProcessing, IBasicIssuanceModule } from "@popcorn/hardhat/typechain";
import { ChainId } from "@popcorn/utils/connectors";
import { Address } from "@popcorn/utils/types";
import { BigNumber } from "ethers";
import useBasicIssuanceModule from "@popcorn/app/hooks/set/useBasicIssuanceModule";
import useButterBatch from "@popcorn/app/hooks/set/useButterBatch";
import useSWR from "swr";
import { useDeployment } from "@popcorn/app/hooks/useDeployment";

export async function getTokenPrice(
  basicIssuanceModule: IBasicIssuanceModule,
  butterBatch: ButterBatchProcessing,
  butterAddress: Address,
): Promise<BigNumber> {
  const requiredComponentsForIssue = await basicIssuanceModule.getRequiredComponentUnitsForIssue(
    butterAddress,
    parseEther("1"),
  );
  // Butter Token price
  return butterBatch.valueOfComponents(...requiredComponentsForIssue);
}

export default function useGetButterTokenPriceInUSD(chainId: ChainId) {
  const contractAddresses = useDeployment(chainId);
  const butterBatch = useButterBatch(contractAddresses.butterBatch, chainId);
  const basicIssuanceModule = useBasicIssuanceModule(contractAddresses.setBasicIssuanceModule, chainId);
  const butterAddress = contractAddresses.butter;
  const shouldFetch = butterBatch && basicIssuanceModule && butterAddress && chainId;
  return useSWR(
    shouldFetch ? ["getTokenPrice", butterBatch, basicIssuanceModule, contractAddresses.butter] : null,
    async () => getTokenPrice(basicIssuanceModule, butterBatch, butterAddress),
  );
}
